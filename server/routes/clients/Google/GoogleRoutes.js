const express = require("express");
const { google } = require("googleapis");
const { Readable } = require("stream");
const {
  getGoogleUserModel,
} = require("../../../models/clients/Google/GoogleDrive-model");
const jwt = require("jsonwebtoken");
const { getAllClientDBNames, createClientDatabase } = require("../../../database/db");
const AdminSchema = require("../../../models/Admin/admin-model").schema;
const EmployeeSchema = require("../../../models/clients/contactdata").employeeSchema;
const router = express.Router();

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000/auth/google/callback"
);

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

// Google Authentication Route
router.get("/auth/google", (req, res) => {
  console.log("🔵 [Google Auth] Initiating OAuth flow");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  console.log("🔵 [Google Auth] Redirecting to Google consent screen");
  res.redirect(authUrl);
});
const getCompanyNameFromToken = (req) => {
  const token = req.cookies?.token;
  if (!token) return null;

  try {
    const decoded = jwt.decode(token);
    return decoded?.companyName || null;
  } catch {
    return null;
  }
};
// Google Callback Route
router.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  try {
    // 🔐 Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 👤 Get Google user info
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    const name = userInfo.data.name;

    // 🔍 Find user in any client DB
    const allDBs = await getAllClientDBNames();
    let user, role, companyName;

    for (const dbName of allDBs) {
      const cname = dbName.replace("client_db_", "");
      const db = await createClientDatabase(cname);

      const AdminModel = db.model("Clients", AdminSchema);
      user = await AdminModel.findOne({ email });
      if (user) {
        role = "client";
        companyName = cname;
        break;
      }

      const EmployeeModel = db.model("Employees", EmployeeSchema);
      user = await EmployeeModel.findOne({ email });
      if (user) {
        role = "user";
        companyName = cname;
        break;
      }
    }

    if (!user) {
      console.error("❌ No user found with this Google email");
      return res.status(401).send("No user found");
    }

    // 💾 Save Google access in company-specific DB
    const GoogleUser = await getGoogleUserModel(companyName);
    await GoogleUser.findOneAndUpdate(
      { email },
      {
        googleId: userInfo.data.id,
        email,
        name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
      { upsert: true, new: true }
    );

    // 🪙 Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role,
        email,
        companyName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    // 🍪 Set only one cookie (token)
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000,
      secure: false, // set to true in production
      sameSite: "lax",
    });

    console.log(
      `✅ Google login successful for ${email} as ${role} in ${companyName}`
    );
    res.redirect("http://localhost:3000/dashboard");
  } catch (err) {
    console.error("❌ Google Login Callback Error:", err.message || err);
    res.status(500).send("Google login failed");
  }
});
router.use(async (req, res, next) => {
  const companyName = getCompanyNameFromToken(req);
  if (!companyName)
    return res.status(401).json({ error: "No company detected" });

  const GoogleUser = await getGoogleUserModel(companyName);
  const email = jwt.decode(req.cookies.token)?.email;
  const user = await GoogleUser.findOne({ email });

  if (!user || !user.accessToken) {
    return res.status(401).json({ error: "No Google session found" });
  }

  req.googleUser = user;
  req.companyName = companyName;
  next();
});

// Upload Route (Doer → Admin's Drive)
router.post("/upload", async (req, res) => {
  console.log("⬆️ [Google Upload] Starting file upload process");
  const { accessToken, fileName, mimeType, fileData } = req.body;
  const companyName = getCompanyNameFromToken(req);

  if (!companyName) {
    console.error("❌ [Google Upload] companyName cookie missing");
    return res.status(400).send("companyName cookie missing");
  }

  try {
    console.log("🔄 [Google Upload] Initializing Google Drive client");
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: req.googleUser.accessToken });
    const drive = google.drive({ version: "v3", auth });
    console.log(
      `📄 [Google Upload] Processing file: ${fileName} (${mimeType})`
    );
    const buffer = Buffer.from(fileData, "base64");

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    console.log("🔄 [Google Upload] Uploading file to Google Drive");
    const response = await drive.files.create({
      requestBody: { name: fileName },
      media: { mimeType, body: stream },
      fields: "id, webViewLink",
    });
    console.log(`✅ [Google Upload] File uploaded. ID: ${response.data.id}`);

    console.log("🔄 [Google Upload] Setting file permissions to public");
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    const oauth2 = google.oauth2({ version: "v2", auth });
    console.log("🔄 [Google Upload] Fetching user info for record keeping");
    const userInfo = await oauth2.userinfo.get();

    const GoogleUser = await getGoogleUserModel(companyName);
    console.log(`🔄 [Google Upload] Updating user record in ${companyName}`);
    await GoogleUser.findOneAndUpdate(
      { email: userInfo.data.email },
      {
        $push: {
          files: {
            fileId: response.data.id,
            fileName,
            mimeType,
            viewLink: response.data.webViewLink,
          },
        },
      },
      { new: true }
    );

    console.log("✅ [Google Upload] File metadata saved to database");
    res.json({ fileId: response.data.id, viewLink: response.data.webViewLink });
  } catch (err) {
    console.error("❌ [Google Upload] Error:", err);
    res.status(500).send("Upload failed");
  }
});

// Delete File Route
router.delete("/file/:fileId", async (req, res) => {
  console.log("🗑️ [Google Delete] Starting file deletion process");
  const { fileId } = req.params;
  const { accessToken } = req.body;
  const companyName = getCompanyNameFromToken(req);

  if (!companyName) {
    console.error("❌ [Google Delete] companyName cookie missing");
    return res.status(400).send("companyName cookie missing");
  }

  try {
    console.log("🔄 [Google Delete] Initializing Google Drive client");
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: req.googleUser.accessToken });

    const oauth2 = google.oauth2({ version: "v2", auth });
    console.log("🔄 [Google Delete] Fetching user info for verification");
    const userInfo = await oauth2.userinfo.get();
    const userEmail = userInfo.data.email;

    const GoogleUser = await getGoogleUserModel(companyName);
    console.log(`🔄 [Google Delete] Verifying user in ${companyName}`);
    const user = await GoogleUser.findOne({ email: userEmail });
    if (!user) {
      console.error("❌ [Google Delete] User not found in database");
      return res.status(403).send("User not found");
    }

    const fileMeta = user.files.find((f) => f.fileId === fileId);
    if (!fileMeta) {
      console.error("❌ [Google Delete] File not owned by user");
      return res.status(403).send("Access denied: not your file");
    }

    const drive = google.drive({ version: "v3", auth });
    console.log(`🔄 [Google Delete] Deleting file ${fileId} from Drive`);
    await drive.files.delete({ fileId });

    console.log(`🔄 [Google Delete] Removing file ${fileId} from user record`);
    await GoogleUser.findOneAndUpdate(
      { email: userEmail },
      { $pull: { files: { fileId } } }
    );

    console.log("✅ [Google Delete] File deleted successfully");
    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("❌ [Google Delete] Error:", error.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
