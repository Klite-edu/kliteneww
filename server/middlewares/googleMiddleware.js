const jwt = require("jsonwebtoken");
const {
  getGoogleUserModel,
} = require("../models/clients/Google/GoogleDrive-model");
const { getClientModel } = require("../models/Admin/client-modal");

// Helper: Get companyName from JWT token
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

const googleSessionMiddleware = async (req, res, next) => {
  console.log("🔵 [GoogleSession] Starting Google Session Middleware...");

  const companyName = getCompanyNameFromToken(req);
  console.log("🔵 [GoogleSession] CompanyName from token:", companyName);

  if (!companyName) {
    console.warn("❌ [GoogleSession] No company name found");
    return res.status(401).json({ error: "No company detected" });
  }

  let email = null;

  try {
    if (req.path === "/upload" || req.path === "/api/user/google-token") {
      console.log(
        "🟡 [GoogleSession] Special flow for /upload or /api/user/google-token route"
      );

      const Client = await getClientModel(companyName);
      const admin = await Client.findOne({ role: "client" });

      if (!admin) {
        console.warn("❌ [GoogleSession] No admin found in Client DB");
        return res
          .status(401)
          .json({ error: "Admin not found for this company" });
      }

      email = admin.email;
      console.log("🟢 [GoogleSession] Admin email fetched:", email);
    } else {
      console.log(
        "🟡 [GoogleSession] Normal route flow - decoding token for user email"
      );
      const token = req.cookies?.token;
      const decoded = jwt.decode(token);
      email = decoded?.email;

      if (!email) {
        console.warn("❌ [GoogleSession] No email found in token");
        return res.status(401).json({ error: "Invalid token structure" });
      }
      console.log("🟢 [GoogleSession] User email extracted:", email);
    }
  } catch (err) {
    console.error("❌ [GoogleSession] Error extracting email:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }

  try {
    console.log(
      `🔵 [GoogleSession] Getting GoogleUser model for company: ${companyName}`
    );
    const GoogleUser = await getGoogleUserModel(companyName);

    console.log(
      `🔵 [GoogleSession] Finding Google user record for email: ${email}`
    );
    const user = await GoogleUser.findOne({ email });

    if (!user || !user.accessToken) {
      console.warn(
        `❌ [GoogleSession] No Google user or token found for email: ${email}`
      );
      return res.status(401).json({ error: "No Google session found" });
    }

    console.log(
      `🟢 [GoogleSession] Google session validated for email: ${email}`
    );
    req.companyName = companyName;
    req.googleUser = user;

    next();
  } catch (err) {
    console.error("❌ [GoogleSession] Error in final fetching:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = googleSessionMiddleware;
