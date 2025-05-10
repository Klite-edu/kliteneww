const express = require("express");
const { google } = require("googleapis");
const { Readable } = require("stream");
const {
  getGoogleUserModel,
} = require("../../../models/clients/Google/GoogleDrive-model");
const { getClientModel } = require("../../../models/Admin/client-modal");
const { getEmployeeModel } = require("../../../models/clients/contactdata");
const jwt = require("jsonwebtoken");
const {
  getAllClientDBNames,
  createClientDatabase,
} = require("../../../database/db");
const router = express.Router();
const { refreshAccessToken } = require("../../../utils/googleHelper");
const googleSessionMiddleware = require("../../../middlewares/googleMiddleware");
const checkPermission = require("../../../middlewares/PermissionAuth");
console.log("🔵 [Google Drive] Initializing Google Drive integration module");

// Initialize OAuth2 client
console.log("🔵 [Google Auth] Creating OAuth2 client configuration");
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://api.autopilotmybusiness.com/auth/google/callback"
  // "http://localhost:5000/auth/google/callback"
);

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

console.log(`🔵 [Google Auth] Configured OAuth scopes: ${SCOPES.join(", ")}`);

// Helper function to get company name from JWT token
const getCompanyNameFromToken = (req) => {
  console.log("🔵 [Auth Helper] Attempting to extract company name from token");
  const token = req.cookies?.token;
  if (!token) {
    console.log("🟡 [Auth Helper] No token found in cookies");
    return null;
  }

  try {
    const decoded = jwt.decode(token);
    const companyName = decoded?.companyName || null;
    console.log(
      `🔵 [Auth Helper] Extracted company name: ${companyName || "None"}`
    );
    return companyName;
  } catch (err) {
    console.error("❌ [Auth Helper] Error decoding token:", err);
    return null;
  }
};

// Google Authentication Route
router.get("/auth/google", (req, res) => {
  console.log("🔵 [Google Auth] Initiating OAuth flow");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  console.log(`🔵 [Google Auth] Generated auth URL: ${authUrl}`);
  console.log("🔵 [Google Auth] Redirecting to Google consent screen");
  res.redirect(authUrl);
});

// Google Callback Route
router.get("/auth/google/callback", async (req, res) => {
  console.log("🔵 [Google Auth] Handling OAuth callback");
  const { code } = req.query;

  if (!code) {
    console.error("❌ [Google Auth] No authorization code received");
    return res.status(400).send("Authorization code missing");
  }

  try {
    console.log("🔄 [Google Auth] Exchanging code for tokens");
    const { tokens } = await oauth2Client.getToken(code);
    console.log("🟢 [Google Auth] Successfully obtained tokens");
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    console.log("🔄 [Google Auth] Retrieving user info");
    const userInfo = await oauth2.userinfo.get();
    console.log(
      `🔄 [Google Auth] User info retrieved for: ${userInfo.data.email}`
    );
    const email = userInfo.data.email;
    const name = userInfo.data.name;

    console.log("🔄 [Google Auth] Getting all client databases");
    const allDBs = await getAllClientDBNames();
    console.log(`🔄 [Google Auth] Found ${allDBs.length} client databases`);

    let user, role, companyName;
    let dbSearchComplete = false;

    console.log(`🔍 [Google Auth] Searching for user ${email} in databases`);
    for (const dbName of allDBs) {
      const cname = dbName.replace("client_db_", "");
      console.log(`🔍 [Google Auth] Checking in company: ${cname}`);

      const ClientModel = await getClientModel(cname);
      const EmployeeModel = await getEmployeeModel(cname);

      console.log(`🔍 [Google Auth] Checking client records in ${cname}`);
      user = await ClientModel.findOne({ email });
      if (user) {
        console.log(`🔍 [Google Auth] Found as client in ${cname}`);
        role = "client";
        companyName = cname;
        dbSearchComplete = true;
        break;
      }

      console.log(`🔍 [Google Auth] Checking employee records in ${cname}`);
      user = await EmployeeModel.findOne({ email });
      if (user) {
        console.log(`🔍 [Google Auth] Found as employee in ${cname}`);
        role = "user";
        companyName = cname;
        dbSearchComplete = true;
        break;
      }
    }

    if (!dbSearchComplete) {
      console.error(`❌ [Google Auth] User ${email} not found in any database`);
      return res.status(401).send("❌ No user found");
    }

    console.log(
      `🔄 [Google Auth] Getting Google user model for ${companyName}`
    );
    const GoogleUser = await getGoogleUserModel(companyName);
    console.log(
      `🔄 [Google Auth] Updating/creating Google user record for ${email}`
    );
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
    console.log(`🟢 [Google Auth] Google user record updated for ${email}`);

    console.log(`🔄 [Google Auth] Generating JWT token for ${email}`);
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
    console.log(`🟢 [Google Auth] JWT token generated for ${email}`);

    console.log(`🔄 [Google Auth] Setting cookies for ${email}`);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000,
      secure: false,
      sameSite: "lax",
    });
    res.cookie("userId", user._id.toString(), {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000,
      secure: false,
      sameSite: "lax",
    });
    res.cookie("role", role, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000,
      secure: false,
      sameSite: "lax",
    });
    res.cookie("email", email, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000,
      secure: false,
      sameSite: "lax",
    });
    res.cookie("companyName", companyName, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000,
      secure: false,
      sameSite: "lax",
    });
    console.log(`🟢 [Google Auth] All cookies set for ${email}`);

    console.log(
      `✅ [Google Auth] Login success for ${email} in ${companyName}`
    );
    console.log(`🔄 [Google Auth] Redirecting to dashboard`);
    res.redirect("https://app.autopilotmybusiness.com/dashboard");
    // res.redirect("http://localhost:3000/dashboard");
  } catch (err) {
    console.error("❌ [Google Auth] Callback Error:", err);
    res.status(500).send("Google login failed");
  }
});
router.get(
  "/auth/disconnect-google",
  googleSessionMiddleware,
  async (req, res) => {
    const { companyName, googleUser } = req;

    try {
      const GoogleUser = await getGoogleUserModel(companyName);
      await GoogleUser.findOneAndUpdate(
        { email: googleUser.email },
        { accessToken: null, refreshToken: null } // ❌ Only tokens null karo
      );

      res.json({
        success: true,
        message: "Google Drive disconnected successfully",
      });
    } catch (error) {
      console.error("Disconnect Error:", error);
      res.status(500).json({ error: "Failed to disconnect Google Drive" });
    }
  }
);

// Upload Route
router.post("/auth/upload", googleSessionMiddleware, async (req, res) => {
  console.log("⬆️ [Google Upload] Starting file upload process");
  const { fileName, mimeType, fileData } = req.body;
  const { companyName, googleUser } = req;
  console.log(
    `🔄 [Google Upload] Received request from user: ${
      googleUser?.email || "unknown"
    }`
  );

  if (!fileName || !mimeType || !fileData) {
    console.error("❌ [Google Upload] Missing required fields", {
      fileName: !!fileName,
      mimeType: !!mimeType,
      fileData: !!fileData,
    });
    return res.status(400).json({ error: "Missing required fields" });
  }

  console.log(`🔵 [Google Upload] Processing file:
    Name: ${fileName}
    Type: ${mimeType}
    Size: ${Math.round(Buffer.byteLength(fileData, "base64") / 1024)} KB
    Company: ${companyName}`);

  try {
    console.log("🔄 [Google Upload] Initializing Google Drive client");
    const auth = new google.auth.OAuth2();
    console.log(
      `🔄 [Google Upload] Setting credentials with token: ${
        googleUser.accessToken ? "present" : "missing"
      }`
    );
    auth.setCredentials({ access_token: googleUser.accessToken });

    console.log("🔄 [Google Upload] Creating Drive client instance");
    let drive = google.drive({ version: "v3", auth });

    try {
      console.log("🔄 [Google Upload] Getting company name from token");
      const companyName = getCompanyNameFromToken(req);
      console.log(`🔄 [Google Upload] Getting client model for ${companyName}`);
      const Client = await getClientModel(companyName);
      console.log(`🔄 [Google Upload] Finding admin user in ${companyName}`);
      const admin = await Client.findOne({ role: "client" });
      console.log(`🔄 [Google Upload] Found admin: ${admin?.email || "none"}`);

      // Use admin's email to get their Google token
      console.log(
        `🔄 [Google Upload] Getting Google user model for ${companyName}`
      );
      const GoogleUser = await getGoogleUserModel(companyName);
      console.log(
        `🔄 [Google Upload] Finding Google user record for admin ${admin?.email}`
      );
      const googleUser = await GoogleUser.findOne({ email: admin.email });
      console.log(
        `🔄 [Google Upload] Admin Google connection: ${
          googleUser ? "found" : "not found"
        }`
      );

      if (!googleUser) {
        console.error(
          `❌ [Google Upload] Admin Google account not connected for ${admin.email}`
        );
        return res
          .status(403)
          .json({ error: "Admin Google account not connected" });
      }

      console.log(
        "🔄 [Google Upload] Testing Drive API connection with light call"
      );
      // try first call (dummy/light)
      await drive.about.get({ fields: "user" });
      console.log("🟢 [Google Upload] Drive API connection successful");
    } catch (err) {
      console.log(
        `🔄 [Google Upload] Error with Drive API: ${err.code} - ${err.message}`
      );
      if (err.code === 401) {
        console.log("🔁 [Google Upload] Access token expired, refreshing...");
        console.log(
          `🔄 [Google Upload] Using refresh token: ${
            googleUser.refreshToken ? "present" : "missing"
          }`
        );
        const newTokens = await refreshAccessToken(googleUser.refreshToken);
        console.log(
          `🔄 [Google Upload] Refresh response: ${
            newTokens?.access_token ? "token received" : "failed"
          }`
        );

        if (!newTokens?.access_token) {
          console.error("❌ [Google Upload] Token refresh failed");
          return res
            .status(401)
            .json({ error: "Unable to refresh access token" });
        }

        // ✅ Save new accessToken in DB
        console.log(
          `🔄 [Google Upload] Saving new access token for ${googleUser.email}`
        );
        const GoogleUser = await getGoogleUserModel(companyName);
        await GoogleUser.findOneAndUpdate(
          { email: googleUser.email },
          { accessToken: newTokens.access_token }
        );
        console.log("🟢 [Google Upload] New access token saved to database");

        // ✅ Re-initialize auth and drive
        console.log("🔄 [Google Upload] Re-initializing auth with new token");
        auth.setCredentials({ access_token: newTokens.access_token });
        drive = google.drive({ version: "v3", auth });

        console.log(
          "✅ [Google Upload] Token refreshed and Drive client re-initialized"
        );
      } else {
        console.error(`❌ [Google Upload] Unhandled error: ${err.message}`);
        throw err;
      }
    }

    console.log("🔄 [Google Upload] Preparing file buffer and stream");
    const buffer = Buffer.from(fileData, "base64");
    console.log(
      `🔄 [Google Upload] Buffer created, size: ${buffer.length} bytes`
    );
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    console.log("🔄 [Google Upload] Readable stream created");

    console.log(
      `🔄 [Google Upload] Uploading file "${fileName}" to Google Drive`
    );
    const response = await drive.files.create({
      requestBody: { name: fileName },
      media: { mimeType, body: stream },
      fields: "id, webViewLink",
    });
    console.log(`🟢 [Google Upload] File upload API call successful`);

    console.log(`🟢 [Google Upload] File uploaded successfully:
      ID: ${response.data.id}
      Link: ${response.data.webViewLink}`);

    console.log(
      `🔄 [Google Upload] Setting public permissions for file ${response.data.id}`
    );
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });
    console.log(`🟢 [Google Upload] File permissions set to public`);

    console.log(
      `🔄 [Google Upload] Updating user record with file metadata for ${googleUser.email}`
    );
    const GoogleUser = await getGoogleUserModel(companyName);
    await GoogleUser.findOneAndUpdate(
      { email: googleUser.email },
      {
        $push: {
          files: {
            fileId: response.data.id,
            fileName,
            mimeType,
            viewLink: response.data.webViewLink,
            uploadedAt: new Date(),
          },
        },
      }
    );
    console.log(`🟢 [Google Upload] User record updated with new file`);

    console.log("✅ [Google Upload] File upload completed successfully");
    res.json({
      success: true,
      fileId: response.data.id,
      viewLink: response.data.webViewLink,
    });
  } catch (err) {
    console.error(`❌ [Google Upload] Error: ${err.message}`, err);
    res.status(500).json({
      error: "Upload failed",
      details: err.message,
    });
  }
});
router.post(
  "/auth/admin/upload",
  googleSessionMiddleware,
  checkPermission("GoogleDrive Connect", "create"),
  async (req, res) => {
    console.log("⬆️ [Google Upload] Starting file upload process");
    const { fileName, mimeType, fileData } = req.body;
    const { companyName, googleUser } = req;
    console.log(
      `🔄 [Google Upload] Received request from user: ${
        googleUser?.email || "unknown"
      }`
    );

    if (!fileName || !mimeType || !fileData) {
      console.error("❌ [Google Upload] Missing required fields", {
        fileName: !!fileName,
        mimeType: !!mimeType,
        fileData: !!fileData,
      });
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`🔵 [Google Upload] Processing file:
    Name: ${fileName}
    Type: ${mimeType}
    Size: ${Math.round(Buffer.byteLength(fileData, "base64") / 1024)} KB
    Company: ${companyName}`);

    try {
      console.log("🔄 [Google Upload] Initializing Google Drive client");
      const auth = new google.auth.OAuth2();
      console.log(
        `🔄 [Google Upload] Setting credentials with token: ${
          googleUser.accessToken ? "present" : "missing"
        }`
      );
      auth.setCredentials({ access_token: googleUser.accessToken });

      console.log("🔄 [Google Upload] Creating Drive client instance");
      let drive = google.drive({ version: "v3", auth });

      try {
        console.log("🔄 [Google Upload] Getting company name from token");
        const companyName = getCompanyNameFromToken(req);
        console.log(
          `🔄 [Google Upload] Getting client model for ${companyName}`
        );
        const Client = await getClientModel(companyName);
        console.log(`🔄 [Google Upload] Finding admin user in ${companyName}`);
        const admin = await Client.findOne({ role: "client" });
        console.log(
          `🔄 [Google Upload] Found admin: ${admin?.email || "none"}`
        );

        // Use admin's email to get their Google token
        console.log(
          `🔄 [Google Upload] Getting Google user model for ${companyName}`
        );
        const GoogleUser = await getGoogleUserModel(companyName);
        console.log(
          `🔄 [Google Upload] Finding Google user record for admin ${admin?.email}`
        );
        const googleUser = await GoogleUser.findOne({ email: admin.email });
        console.log(
          `🔄 [Google Upload] Admin Google connection: ${
            googleUser ? "found" : "not found"
          }`
        );

        if (!googleUser) {
          console.error(
            `❌ [Google Upload] Admin Google account not connected for ${admin.email}`
          );
          return res
            .status(403)
            .json({ error: "Admin Google account not connected" });
        }

        console.log(
          "🔄 [Google Upload] Testing Drive API connection with light call"
        );
        // try first call (dummy/light)
        await drive.about.get({ fields: "user" });
        console.log("🟢 [Google Upload] Drive API connection successful");
      } catch (err) {
        console.log(
          `🔄 [Google Upload] Error with Drive API: ${err.code} - ${err.message}`
        );
        if (err.code === 401) {
          console.log("🔁 [Google Upload] Access token expired, refreshing...");
          console.log(
            `🔄 [Google Upload] Using refresh token: ${
              googleUser.refreshToken ? "present" : "missing"
            }`
          );
          const newTokens = await refreshAccessToken(googleUser.refreshToken);
          console.log(
            `🔄 [Google Upload] Refresh response: ${
              newTokens?.access_token ? "token received" : "failed"
            }`
          );

          if (!newTokens?.access_token) {
            console.error("❌ [Google Upload] Token refresh failed");
            return res
              .status(401)
              .json({ error: "Unable to refresh access token" });
          }

          // ✅ Save new accessToken in DB
          console.log(
            `🔄 [Google Upload] Saving new access token for ${googleUser.email}`
          );
          const GoogleUser = await getGoogleUserModel(companyName);
          await GoogleUser.findOneAndUpdate(
            { email: googleUser.email },
            { accessToken: newTokens.access_token }
          );
          console.log("🟢 [Google Upload] New access token saved to database");

          // ✅ Re-initialize auth and drive
          console.log("🔄 [Google Upload] Re-initializing auth with new token");
          auth.setCredentials({ access_token: newTokens.access_token });
          drive = google.drive({ version: "v3", auth });

          console.log(
            "✅ [Google Upload] Token refreshed and Drive client re-initialized"
          );
        } else {
          console.error(`❌ [Google Upload] Unhandled error: ${err.message}`);
          throw err;
        }
      }

      console.log("🔄 [Google Upload] Preparing file buffer and stream");
      const buffer = Buffer.from(fileData, "base64");
      console.log(
        `🔄 [Google Upload] Buffer created, size: ${buffer.length} bytes`
      );
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      console.log("🔄 [Google Upload] Readable stream created");

      console.log(
        `🔄 [Google Upload] Uploading file "${fileName}" to Google Drive`
      );
      const response = await drive.files.create({
        requestBody: { name: fileName },
        media: { mimeType, body: stream },
        fields: "id, webViewLink",
      });
      console.log(`🟢 [Google Upload] File upload API call successful`);

      console.log(`🟢 [Google Upload] File uploaded successfully:
      ID: ${response.data.id}
      Link: ${response.data.webViewLink}`);

      console.log(
        `🔄 [Google Upload] Setting public permissions for file ${response.data.id}`
      );
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: { role: "reader", type: "anyone" },
      });
      console.log(`🟢 [Google Upload] File permissions set to public`);

      console.log(
        `🔄 [Google Upload] Updating user record with file metadata for ${googleUser.email}`
      );
      const GoogleUser = await getGoogleUserModel(companyName);
      await GoogleUser.findOneAndUpdate(
        { email: googleUser.email },
        {
          $push: {
            files: {
              fileId: response.data.id,
              fileName,
              mimeType,
              viewLink: response.data.webViewLink,
              uploadedAt: new Date(),
            },
          },
        }
      );
      console.log(`🟢 [Google Upload] User record updated with new file`);

      console.log("✅ [Google Upload] File upload completed successfully");
      res.json({
        success: true,
        fileId: response.data.id,
        viewLink: response.data.webViewLink,
      });
    } catch (err) {
      console.error(`❌ [Google Upload] Error: ${err.message}`, err);
      res.status(500).json({
        error: "Upload failed",
        details: err.message,
      });
    }
  }
);

// Delete File Route
router.delete(
  "/auth/file/:fileId",
  googleSessionMiddleware,
  checkPermission("GoogleDrive Connect", "delete"),
  async (req, res) => {
    const { fileId } = req.params;
    const { companyName, googleUser } = req;

    console.log(
      `🗑️ [Google Delete] Starting deletion for file ${fileId} in ${companyName}`
    );
    console.log(`🔄 [Google Delete] User: ${googleUser?.email || "unknown"}`);

    try {
      console.log("🔄 [Google Delete] Initializing Google Drive client");
      const auth = new google.auth.OAuth2();
      console.log(
        `🔄 [Google Delete] Setting credentials with token: ${
          googleUser.accessToken ? "present" : "missing"
        }`
      );
      auth.setCredentials({ access_token: googleUser.accessToken });

      console.log("🔄 [Google Delete] Creating Drive client instance");
      let drive = google.drive({ version: "v3", auth });

      try {
        console.log(
          "🔄 [Google Delete] Testing Drive API connection with light call"
        );
        // try first call (dummy/light)
        await drive.about.get({ fields: "user" });
        console.log("🟢 [Google Delete] Drive API connection successful");
      } catch (err) {
        console.log(
          `🔄 [Google Delete] Error with Drive API: ${err.code} - ${err.message}`
        );
        if (err.code === 401) {
          console.log("🔁 [Google Delete] Access token expired, refreshing...");
          console.log(
            `🔄 [Google Delete] Using refresh token: ${
              googleUser.refreshToken ? "present" : "missing"
            }`
          );
          const newTokens = await refreshAccessToken(googleUser.refreshToken);
          console.log(
            `🔄 [Google Delete] Refresh response: ${
              newTokens?.access_token ? "token received" : "failed"
            }`
          );

          if (!newTokens?.access_token) {
            console.error("❌ [Google Delete] Token refresh failed");
            return res
              .status(401)
              .json({ error: "Unable to refresh access token" });
          }

          // ✅ Save new accessToken in DB
          console.log(
            `🔄 [Google Delete] Saving new access token for ${googleUser.email}`
          );
          const GoogleUser = await getGoogleUserModel(companyName);
          await GoogleUser.findOneAndUpdate(
            { email: googleUser.email },
            { accessToken: newTokens.access_token }
          );
          console.log("🟢 [Google Delete] New access token saved to database");

          // ✅ Re-initialize auth and drive
          console.log("🔄 [Google Delete] Re-initializing auth with new token");
          auth.setCredentials({ access_token: newTokens.access_token });
          drive = google.drive({ version: "v3", auth });

          console.log(
            "✅ [Google Delete] Token refreshed and Drive client re-initialized"
          );
        } else {
          console.error(`❌ [Google Delete] Unhandled error: ${err.message}`);
          throw err;
        }
      }

      console.log(`🔍 [Google Delete] Verifying ownership of file ${fileId}`);
      const GoogleUser = await getGoogleUserModel(companyName);
      console.log(
        `🔄 [Google Delete] Finding user record for ${googleUser.email}`
      );
      const user = await GoogleUser.findOne({ email: googleUser.email });

      if (!user) {
        console.error("❌ [Google Delete] User not found in database");
        return res.status(403).json({ error: "User not found" });
      }

      console.log(`🔄 [Google Delete] Checking file ownership for ${fileId}`);
      const fileMeta = user.files.find((f) => f.fileId === fileId);
      console.log(
        `🔄 [Google Delete] File ownership check: ${
          fileMeta ? "found" : "not found"
        }`
      );
      if (!fileMeta) {
        console.error("❌ [Google Delete] File not owned by user");
        return res.status(403).json({ error: "Access denied: not your file" });
      }

      console.log(`🔄 [Google Delete] Deleting file ${fileId} from Drive API`);
      await drive.files.delete({ fileId });
      console.log(`🟢 [Google Delete] File deleted from Google Drive`);

      console.log(
        `🔄 [Google Delete] Removing file ${fileId} from user record`
      );
      await GoogleUser.findOneAndUpdate(
        { email: googleUser.email },
        { $pull: { files: { fileId } } }
      );
      console.log(`🟢 [Google Delete] File removed from user record`);

      console.log(`✅ [Google Delete] File ${fileId} deleted successfully`);
      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error(`❌ [Google Delete] Error: ${error.message}`, error);
      res.status(500).json({
        error: "Delete failed",
        details: error.message,
      });
    }
  }
);

// Get Google Token Route
router.get(
  "/api/user/google-token",
  googleSessionMiddleware,
  async (req, res) => {
    try {
      const { companyName } = req.query;

      if (!companyName) {
        return res.status(400).json({ error: "companyName is required" });
      }

      console.log(
        `🔵 [Google Token] Fetching admin email for company: ${companyName}`
      );

      // Step 1: Get Client Model for the company
      const Client = await getClientModel(companyName);

      // Step 2: Find Admin (role: 'client')
      const admin = await Client.findOne({ role: "client" });

      if (!admin) {
        return res
          .status(404)
          .json({ error: "Admin not found for this company" });
      }

      console.log(`🟢 [Google Token] Found admin email: ${admin.email}`);

      // Step 3: Get GoogleUser model
      const GoogleUser = await getGoogleUserModel(companyName);

      // Step 4: Find Google User record by Admin email
      const googleUser = await GoogleUser.findOne({ email: admin.email });

      if (!googleUser) {
        return res
          .status(404)
          .json({ error: "Google access token not found for admin" });
      }

      console.log(`🟢 [Google Token] Returning access token for admin`);

      // Step 5: Return Access Token
      res.json({
        success: true,
        accessToken: googleUser.accessToken,
      });
    } catch (error) {
      console.error("❌ [Google Token] Error fetching token:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
router.get(
  "/api/admin/google-token",
  googleSessionMiddleware,
  checkPermission("GoogleDrive Connect", "read"),
  async (req, res) => {
    const { companyName, googleUser } = req;
    console.log(`🔵 [Google Token] Request for access token in ${companyName}`);
    console.log(`🔄 [Google Token] User: ${googleUser?.email || "unknown"}`);

    try {
      console.log(
        `🔄 [Google Token] Checking if access token exists: ${
          googleUser.accessToken ? "yes" : "no"
        }`
      );
      if (!googleUser.accessToken) {
        console.error("❌ [Google Token] No access token found");
        return res.status(404).json({ error: "Google access token not found" });
      }

      console.log("🟢 [Google Token] Returning access token");
      res.json({
        success: true,
        accessToken: googleUser.accessToken,
      });
    } catch (error) {
      console.error(`❌ [Google Token] Error: ${error.message}`, error);
      res.status(500).json({
        error: "Server error",
        details: error.message,
      });
    }
  }
);

// Get User Files Route
router.get("/api/user/files", googleSessionMiddleware, async (req, res) => {
  const { companyName, googleUser } = req;
  console.log(`🔵 [Google Files] Request for files in ${companyName}`);
  console.log(`🔄 [Google Files] User: ${googleUser?.email || "unknown"}`);

  try {
    console.log(
      `🔄 [Google Files] Getting Google user model for ${companyName}`
    );
    const GoogleUser = await getGoogleUserModel(companyName);
    console.log(
      `🔄 [Google Files] Finding user record for ${googleUser.email}`
    );
    const user = await GoogleUser.findOne({ email: googleUser.email });
    console.log(`🔄 [Google Files] User record found: ${user ? "yes" : "no"}`);

    if (!user) {
      console.error("❌ [Google Files] User not found");
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`🟢 [Google Files] Returning ${user.files?.length || 0} files`);
    res.json({
      success: true,
      files: user.files || [],
    });
  } catch (error) {
    console.error(`❌ [Google Files] Error: ${error.message}`, error);
    res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
});

console.log("✅ [Google Drive] All routes configured successfully");
module.exports = router;
