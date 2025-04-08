const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  console.log("🔍 [VERIFY TOKEN] Middleware triggered.");

  const authHeader = req.header("Authorization");
  console.log("🔑 [VERIFY TOKEN] Authorization Header:", authHeader);

  // Check if authorization header is present and in correct format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ [VERIFY TOKEN] No or invalid authorization header.");
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  // Extract the token from the header
  const token = authHeader.split(" ")[1];
  console.log("🔑 [VERIFY TOKEN] Extracted Token:", token);

  if (!token) {
    console.warn("⚠️ [VERIFY TOKEN] Token not found after 'Bearer '.");
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    console.log("🔐 [VERIFY TOKEN] Verifying token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Log the decoded token contents
    console.log("✅ [VERIFY TOKEN] Token verified successfully.");
    console.log("🔓 [VERIFY TOKEN] Decoded Token Data:", decoded);

    // Attach user data and company name to request object
    req.user = decoded;
    req.companyName = decoded.companyName;
    console.log("📝 [VERIFY TOKEN] Attached user and companyName to request.");

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error("❌ [VERIFY TOKEN] Token verification failed:", err.message);
    return res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = verifyToken;
