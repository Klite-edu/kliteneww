const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const querystring = require("querystring");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_ID = process.env.TENANT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const NODE_ENV = process.env.NODE_ENV || "development";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

const dbMiddleware = require("../../../middlewares/dbMiddleware");

// Helper functions
const cleanUpFile = (filePath) => {
  if (fs.existsSync(filePath))
    fs.unlink(filePath, (err) => err && console.error("Cleanup Error:", err));
};

const isProduction = NODE_ENV === "production";

const setAuthCookie = (res, name, value, options = {}) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    ...(isProduction && COOKIE_DOMAIN && { domain: COOKIE_DOMAIN }),
    ...options,
  };
  res.cookie(name, value, cookieOptions);
};

// Auth Login Route
router.get("/auth/login", (req, res) => {
  const state = uuidv4();
  const nonce = uuidv4();

  const queryParams = querystring.stringify({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    response_mode: "query",
    scope: "offline_access Files.ReadWrite.All openid profile",
    state,
    nonce,
  });

  setAuthCookie(res, "auth_state", state, { maxAge: 600000 });
  setAuthCookie(res, "auth_nonce", nonce, { maxAge: 600000 });

  res.redirect(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${queryParams}`
  );
});

// Auth Callback
router.get("/auth/callback", dbMiddleware, async (req, res) => {
  try {
    const { code, state } = req.query;
    const { auth_state } = req.cookies;
    if (!code || state !== auth_state)
      return res.status(400).send("Invalid state");

    const tokenRes = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      querystring.stringify({
        client_id: CLIENT_ID,
        scope: "offline_access Files.ReadWrite.All",
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token, expires_in, id_token } = tokenRes.data;
    const sessionId = uuidv4();
    const userId = id_token
      ? JSON.parse(Buffer.from(id_token.split(".")[1], "base64").toString()).oid
      : "unknown";

    await req.MicrosoftSession.create({
      sessionId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
      userId,
    });

    setAuthCookie(res, "session_id", sessionId, { maxAge: expires_in * 1000 });

    res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error("Callback Error:", err.response?.data || err.message);
    res.status(500).send("Authentication failed");
  }
});

// Logout
router.get("/auth/logout", dbMiddleware, async (req, res) => {
  const { session_id } = req.cookies;
  if (session_id)
    await req.MicrosoftSession.deleteOne({ sessionId: session_id });

  // Clear cookies with same options they were set
  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    ...(isProduction && COOKIE_DOMAIN && { domain: COOKIE_DOMAIN }),
  };

  res.clearCookie("session_id", clearOptions);
  res.clearCookie("auth_state", clearOptions);
  res.clearCookie("auth_nonce", clearOptions);

  res.redirect(FRONTEND_URL);
});
// Apply dbMiddleware to all routes before anything else
router.use(dbMiddleware); // ⬅️ This line must come FIRST

// Session Middleware
router.use(async (req, res, next) => {
  if (req.path.startsWith("/auth")) return next();
  const { session_id } = req.cookies;
  if (!session_id) return res.status(401).json({ error: "Unauthorized" });

  const session = await req.MicrosoftSession.findOne({ sessionId: session_id });
  if (!session || new Date() > session.expiresAt) {
    return res.status(401).json({ error: "Session expired" });
  }

  req.session = session;
  next();
});

// Upload File
router.post(
  "/upload",
  dbMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const fileData = fs.readFileSync(req.file.path);
      const fileName = req.file.originalname || path.basename(req.file.path);

      const result = await axios.put(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`,
        fileData,
        {
          headers: {
            Authorization: `Bearer ${req.session.accessToken}`,
            "Content-Type": "application/octet-stream",
          },
        }
      );

      const saved = await req.MicrosoftUpload.create({
        filename: fileName,
        link: result.data.webUrl,
        userId: req.session.userId,
      });

      cleanUpFile(req.file.path);
      res.json(saved);
    } catch (err) {
      if (req.file) cleanUpFile(req.file.path);
      console.error("Upload Error:", err.response?.data || err.message);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// Get All Uploads
router.get("/uploads", dbMiddleware, async (req, res) => {
  try {
    const uploads = await req.MicrosoftUpload.find({
      userId: req.session.userId,
    }).sort({ uploadedAt: -1 });
    res.json(uploads);
  } catch (err) {
    console.error("Fetch Uploads Error:", err);
    res.status(500).json({ error: "Failed to fetch uploads" });
  }
});

module.exports = router;
