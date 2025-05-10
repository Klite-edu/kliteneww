const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const querystring = require("querystring");
const jwt = require("jsonwebtoken");
const router = express.Router();
const upload = multer({ dest: "uploads/" });

console.log("🔹 Initializing Microsoft OneDrive router");
const { getAllClientDBNames } = require("../../../database/db");
const { getClientModel } = require("../../../models/Admin/client-modal");
const { getEmployeeModel } = require("../../../models/clients/contactdata");
// Import models directly
console.log("🔹 Loading MicrosoftSession and MicrosoftUpload models");
const {
  getMicrosoftSessionModel,
} = require("../../../models/clients/Microsoft/Session-model");
const {
  getMicrosoftUploadModel,
} = require("../../../models/clients/Microsoft/Upload-model");
const checkPermission = require("../../../middlewares/PermissionAuth");

// Environment variables
console.log("🔹 Loading environment variables");
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_ID = process.env.TENANT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;
const NODE_ENV = process.env.NODE_ENV || "development";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

console.log("🔹 Environment variables loaded:", {
  CLIENT_ID: CLIENT_ID ? "*****" : "missing",
  TENANT_ID: TENANT_ID ? "*****" : "missing",
  REDIRECT_URI: REDIRECT_URI || "missing",
  FRONTEND_URL,
  NODE_ENV,
  COOKIE_DOMAIN: COOKIE_DOMAIN || "not set",
});

// Helper functions
const cleanUpFile = (filePath) => {
  console.log(`🔹 Attempting to clean up file: ${filePath}`);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`🔴 Cleanup Error for ${filePath}:`, err);
      } else {
        console.log(`🟢 Successfully cleaned up file: ${filePath}`);
      }
    });
  } else {
    console.log(`🔹 File does not exist, skipping cleanup: ${filePath}`);
  }
};

const isProduction = NODE_ENV === "production";

const setAuthCookie = (res, name, value, options = {}) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    ...(isProduction && COOKIE_DOMAIN && { domain: COOKIE_DOMAIN }),
    ...options,
  };
  res.cookie(name, value, cookieOptions);
};

// Get company name from token cookie
const getCompanyNameFromCookie = (req) => {
  const token = req.cookies?.token;
  if (!token) {
    console.log("No token cookie found");
    return null;
  }

  try {
    // If token is JWT, decode to get companyName
    const decoded = jwt.decode(token);
    return decoded?.companyName || null;
  } catch (e) {
    console.log("Token is not JWT, using raw value");
    return token; // Fallback to raw token value
  }
};

const authMiddleware = async (req, res, next) => {
  const { _requestId } = req;
  console.log(`[${_requestId}] 🚀 Starting authMiddleware check`);

  try {
    const companyName = getCompanyNameFromCookie(req);
    if (!companyName) {
      console.log(`[${_requestId}] ❌ No companyName found`);
      return res.status(401).json({ error: "Authentication required" });
    }

    const { session_id } = req.cookies;
    if (!session_id) {
      console.log(`[${_requestId}] ❌ No session ID found`);
      return res.status(401).json({ error: "Session expired" });
    }

    const MicrosoftSession = await getMicrosoftSessionModel(companyName);
    const session = await MicrosoftSession.findOne({
      sessionId: session_id,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      console.log(`[${_requestId}] ❌ Session not found or expired`);
      return res.status(401).json({ error: "Session expired" });
    }

    req.session = session;
    req.companyName = companyName;
    console.log(`[${_requestId}] ✅ AuthMiddleware passed`);
    next();
  } catch (err) {
    console.error(`[${_requestId}] ❌ AuthMiddleware Error:`, err);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

// Auth Login Route
router.get("/auth/login", (req, res) => {
  const { _requestId } = req;
  console.log(`🔹 [${_requestId}] Starting auth login process`);

  const state = uuidv4();
  const nonce = uuidv4();
  console.log(`🔹 [${_requestId}] Generated state: ${state}, nonce: ${nonce}`);

  const queryParams = querystring.stringify({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    response_mode: "query",
    scope: "openid profile email offline_access Files.ReadWrite.All",
    state,
    nonce,
  });

  console.log(`🔹 [${_requestId}] Setting auth cookies`);
  setAuthCookie(res, "auth_state", state, {
    maxAge: 600000,
    path: "/api/auth", // Explicit path
  });
  setAuthCookie(res, "auth_nonce", nonce, { maxAge: 600000 });

  const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${queryParams}`;
  console.log(
    `🔹 [${_requestId}] Redirecting to Microsoft auth URL: ${authUrl}`
  );

  res.redirect(authUrl);
});

// Auth Callback
router.get("/auth/callback", async (req, res) => {
  const { _requestId } = req;
  console.log(`🔹 [${_requestId}] Handling auth callback`);

  try {
    const { code, state } = req.query;
    const { auth_state } = req.cookies;

    if (!auth_state || state !== auth_state) {
      console.error(`State mismatch: Cookie ${auth_state} vs Param ${state}`);
      return res.status(400).send("Invalid state parameter");
    }

    console.log(`🔹 [${_requestId}] Callback params:`, {
      code: code ? "*****" : "missing",
      state,
    });

    if (!code || state !== auth_state) {
      console.log(`[${_requestId}] ❌ Invalid state in auth callback`);
      console.log(
        `[${_requestId}] Expected state: ${auth_state}, Received: ${state}`
      );
      return res.status(400).send("Invalid state");
    }

    console.log(`[${_requestId}] 🔄 Requesting tokens from Microsoft`);
    const tokenRes = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      querystring.stringify({
        client_id: CLIENT_ID,
        scope: "openid profile email offline_access Files.ReadWrite.All",
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log(`[${_requestId}] 🟢 Tokens received from Microsoft`);

    const { access_token, refresh_token, expires_in, id_token } = tokenRes.data;
    const sessionId = uuidv4();

    // 🔥 Extract user details from id_token
    const payload = JSON.parse(
      Buffer.from(id_token.split(".")[1], "base64").toString()
    );
    const email = payload.preferred_username || payload.email;
    const userId = payload.oid || "unknown";

    if (!email) {
      console.error(`[${_requestId}] ❌ Email not found in id_token`);
      return res.status(400).send("Unable to get email from Microsoft");
    }

    console.log(`[${_requestId}] 🔄 Email extracted from Microsoft: ${email}`);

    // 🔥 Find user in all tenant databases
    let user, role, companyName;
    const allDBs = await getAllClientDBNames();
    for (const dbName of allDBs) {
      const cname = dbName.replace("client_db_", "");
      const ClientModel = await getClientModel(cname);
      const EmployeeModel = await getEmployeeModel(cname);

      user = await ClientModel.findOne({ email });
      if (user) {
        role = "client";
        companyName = cname;
        break;
      }

      user = await EmployeeModel.findOne({ email });
      if (user) {
        role = "user";
        companyName = cname;
        break;
      }
    }

    if (!companyName) {
      console.error(
        `[${_requestId}] ❌ User ${email} not found in any database`
      );
      return res.status(401).send("No user found");
    }

    console.log(`[${_requestId}] 🟢 User matched in company: ${companyName}`);

    // 🔥 Save Microsoft Session
    const MicrosoftSession = await getMicrosoftSessionModel(companyName);
    await MicrosoftSession.findOneAndUpdate(
      { userId },
      {
        sessionId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
        userId,
      },
      { upsert: true, new: true }
    );

    console.log(`[${_requestId}] ✅ Microsoft session saved for user ${email}`);

    // 🔥 Set login cookies
    const jwtToken = jwt.sign(
      {
        id: user._id.toString(),
        role,
        email,
        companyName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    setAuthCookie(res, "token", jwtToken, {
      maxAge: 12 * 60 * 60 * 1000,
      path: "/",
    });
    setAuthCookie(res, "role", role, {
      maxAge: 12 * 60 * 60 * 1000,
      path: "/",
    });
    setAuthCookie(res, "email", email, {
      maxAge: 12 * 60 * 60 * 1000,
      path: "/",
    });
    setAuthCookie(res, "companyName", companyName, {
      maxAge: 12 * 60 * 60 * 1000,
      path: "/",
    });
    setAuthCookie(res, "session_id", sessionId, {
      maxAge: expires_in * 1000,
      path: "/api",
    });

    console.log(`[${_requestId}] ✅ Login cookies set for ${email}`);

    console.log(`[${_requestId}] 🔄 Redirecting to frontend: ${FRONTEND_URL}`);
    res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error(
      `[${_requestId}] ❌ Callback Error:`,
      err.response?.data || err.message
    );
    if (err.response) {
      console.error(`[${_requestId}] ❌ Response details:`, {
        status: err.response.status,
        headers: err.response.headers,
        data: err.response.data,
      });
    }
    res.status(500).send("Authentication failed");
  }
});

// Logout
router.get(
  "/auth/logout",
  checkPermission("OneDrive Connect", "delete"),
  async (req, res) => {
    const { _requestId } = req;
    const { session_id } = req.cookies;
    console.log(`[${_requestId}] Processing logout`);

    try {
      if (session_id) {
        const companyName = getCompanyNameFromCookie(req);
        if (companyName) {
          const MicrosoftSession = await getMicrosoftSessionModel(companyName);
          await MicrosoftSession.deleteOne({ sessionId: session_id });
        }
      }

      // Clear cookies with proper options
      const clearOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain:
          process.env.NODE_ENV === "production"
            ? ".yourdomain.com"
            : "localhost",
        path: "/",
      };

      res.clearCookie("session_id", clearOptions);
      res.clearCookie("auth_state", clearOptions);
      res.clearCookie("auth_nonce", clearOptions);

      // Return JSON response instead of redirect
      res.status(200).json({
        success: true,
        redirectUrl: `${FRONTEND_URL}/microsoft`, // Let frontend handle redirect
      });
    } catch (err) {
      console.error(`[${_requestId}] Logout Error:`, err);
      res.status(500).json({ success: false, error: "Logout failed" });
    }
  }
);
router.post(
  "/auth/upload",
  authMiddleware,
  checkPermission("OneDrive Connect", "create"),
  upload.single("file"),
  async (req, res) => {
    const { _requestId, companyName, session } = req;
    console.log(
      `[${_requestId}] 🔄 Starting file upload process for ${companyName}`
    );

    try {
      if (!req.file) {
        console.log(`[${_requestId}] ❌ No file provided in upload`);
        return res.status(400).json({ error: "No file provided" });
      }

      console.log(
        `[${_requestId}] 📤 Processing file upload for ${companyName}`
      );
      console.log(`[${_requestId}] File details:`, {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path,
      });

      const fileData = fs.readFileSync(req.file.path);
      const fileName = req.file.originalname || path.basename(req.file.path);
      console.log(
        `[${_requestId}] 🔄 Read file data, size: ${fileData.length} bytes`
      );

      console.log(`[${_requestId}] 🔄 Uploading to OneDrive: ${fileName}`);
      const result = await axios.put(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`,
        fileData,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/octet-stream",
          },
        }
      );

      console.log(`[${_requestId}] 🟢 OneDrive upload successful`);
      console.log(`[${_requestId}] OneDrive response:`, {
        status: result.status,
        data: result.data,
      });

      const MicrosoftUpload = await getMicrosoftUploadModel(companyName);
      console.log(`[${_requestId}] 🔄 Saving upload record to database`);
      const saved = await MicrosoftUpload.create({
        filename: fileName,
        link: result.data.webUrl,
        userId: session.userId,
      });

      console.log(`[${_requestId}] 🟢 Upload record saved:`, saved);
      cleanUpFile(req.file.path);
      console.log(`[${_requestId}] ✅ File uploaded successfully: ${fileName}`);
      res.json(saved);
    } catch (err) {
      console.error(
        `[${_requestId}] ❌ Upload Error:`,
        err.response?.data || err.message
      );
      if (err.response) {
        console.error(`[${_requestId}] ❌ Response details:`, {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data,
        });
      }
      if (req.file) {
        console.log(`[${_requestId}] 🔄 Cleaning up failed upload file`);
        cleanUpFile(req.file.path);
      }
      res.status(500).json({ error: "Upload failed" });
    }
  }
);
// 🔥 New route for disconnecting Microsoft only
router.get("/auth/disconnect-microsoft", authMiddleware, async (req, res) => {
  const { _requestId } = req;
  const { session_id } = req.cookies;

  console.log(`[${_requestId}] 🔄 Disconnecting only Microsoft session`);

  try {
    if (session_id) {
      const companyName = getCompanyNameFromCookie(req);
      const MicrosoftSession = await getMicrosoftSessionModel(companyName);
      await MicrosoftSession.deleteOne({ sessionId: session_id });
      console.log(`[${_requestId}] ✅ Microsoft session deleted`);
    }

    res.status(200).json({ success: true, message: "Microsoft disconnected" });
  } catch (err) {
    console.error(`[${_requestId}] ❌ Error disconnecting Microsoft:`, err);
    res.status(500).json({ success: false, error: "Disconnect failed" });
  }
});

// Add this with your other routes (before the auth middleware)
router.get("/auth/check-session", authMiddleware, async (req, res) => {
  const { _requestId } = req;
  console.log(`[${_requestId}] 🔄 Checking session status`);

  try {
    // Get company name from token cookie
    const companyName = getCompanyNameFromCookie(req);
    if (!companyName) {
      console.log(`[${_requestId}] ❌ No company name found`);
      return res.json({ valid: false, reason: "company_missing" });
    }

    const { session_id } = req.cookies;
    if (!session_id) {
      console.log(`[${_requestId}] ❌ No session ID found`);
      return res.json({ valid: false, reason: "session_missing" });
    }

    console.log(`[${_requestId}] 🔍 Validating session for ${companyName}`);
    const MicrosoftSession = await getMicrosoftSessionModel(companyName);
    const session = await MicrosoftSession.findOne({
      sessionId: session_id,
      expiresAt: { $gt: new Date() },
    }).select("userId expiresAt");

    if (!session) {
      console.log(`[${_requestId}] ⚠️ Session not found or expired`);
      return res.json({ valid: false, reason: "invalid_session" });
    }

    console.log(`[${_requestId}] ✅ Valid session found`);
    res.json({
      valid: true,
      user: {
        id: session.userId,
        company: companyName,
      },
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    console.error(`[${_requestId}] ❌ Session check error:`, err);
    res.status(500).json({
      valid: false,
      reason: "server_error",
      message: "Session validation failed",
    });
  }
});
// Get All Uploads
// Get All Uploads
router.get("/auth/uploads", authMiddleware, async (req, res) => {
  const { _requestId } = req;

  try {
    console.log(`[${_requestId}] 🔄 Starting to fetch uploads`);

    // Get company name from token cookie
    const companyName = getCompanyNameFromCookie(req);
    console.log(`[${_requestId}] 🔍 Company name from cookie: ${companyName}`);

    if (!companyName) {
      console.log(`[${_requestId}] ❌ No company name found in cookie`);
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get session ID from cookies
    const { session_id } = req.cookies;
    console.log(`[${_requestId}] 🔍 Session ID from cookie: ${session_id}`);

    if (!session_id) {
      console.log(`[${_requestId}] ❌ No session ID found in cookie`);
      return res.status(401).json({ error: "Session expired" });
    }

    // Get MicrosoftSession model and find session
    const MicrosoftSession = await getMicrosoftSessionModel(companyName);
    const session = await MicrosoftSession.findOne({
      sessionId: session_id,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      console.log(`[${_requestId}] ❌ No valid session found`);
      return res.status(401).json({ error: "Session expired" });
    }

    console.log(
      `[${_requestId}] 🔍 Fetching uploads for user ${session.userId}`
    );
    const MicrosoftUpload = await getMicrosoftUploadModel(companyName);
    const uploads = await MicrosoftUpload.find({
      userId: session.userId,
    }).sort({ uploadedAt: -1 });

    console.log(`[${_requestId}] ✅ Found ${uploads.length} uploads`);
    console.log(`[${_requestId}] Sample uploads:`, uploads.slice(0, 3));

    res.json(uploads);
  } catch (err) {
    console.error(`[${_requestId}] ❌ Fetch Uploads Error:`, err);
    if (err.response) {
      console.error(`[${_requestId}] ❌ Response details:`, {
        status: err.response.status,
        headers: err.response.headers,
        data: err.response.data,
      });
    }
    res.status(500).json({ error: "Failed to fetch uploads" });
  }
});

console.log("🟢 Microsoft OneDrive router setup complete");
module.exports = router;
