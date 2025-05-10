const jwt = require("jsonwebtoken"); // Top pe add karo agar nahi hai

const checkPermission = (module, action) => async (req, res, next) => {
  try {
    console.log(
      `🔍 [checkPermission] Checking permission for module: ${module}, action: ${action}`
    );

    // ✅ Verify login - token se
    if (!req.user) {
      console.log(
        "ℹ️ [checkPermission] req.user missing, trying to decode from token..."
      );
      const authHeader = req.header("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("🚫 Authorization header missing or invalid");
        return res.status(401).json({ message: "Unauthorized - No token" });
      }
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }

    // ✅ If client, bypass all permission checks
    if (req.user?.role === "client") {
      console.log(
        "✅ [checkPermission] Client role — skipping permission checks"
      );
      return next();
    }

    console.log(`👤 [checkPermission] User ID from token: ${req.user.id}`);
    console.log(`👑 [checkPermission] User Role: ${req.user.role}`);

    // ✅ If role is client, allow everything
    if (req.user.role === "client") {
      console.log(
        "✅ [checkPermission] User is client - bypassing permission checks"
      );
      return next();
    }

    // ✅ Get Employee Model dynamically
    const Employee = req.Employee;
    if (!Employee) {
      console.log("❌ [checkPermission] Employee model not available in req");
      return res.status(500).json({ message: "Employee model not available" });
    }
    console.log("✅ [checkPermission] Employee model found");

    // ✅ Fetch logged in employee
    const employee = await Employee.findById(req.user.id);
    if (!employee) {
      console.log(
        `❌ [checkPermission] Employee not found with ID: ${req.user.id}`
      );
      return res.status(404).json({ message: "Employee not found" });
    }
    console.log(
      `✅ [checkPermission] Employee found: ${
        employee.fullName || employee._id
      }`
    );

    const permissions = employee.permissions || {};
    console.log(`🔑 [checkPermission] Employee permissions:`, permissions);

    // ✅ Check if module permission exists
    if (!permissions[module]) {
      console.log(`❌ [checkPermission] No access to module: ${module}`);
      return res
        .status(403)
        .json({ message: `Access Denied: No access to ${module}` });
    }
    console.log(`✅ [checkPermission] Module access found: ${module}`);

    // ✅ Check if action (read/write/edit/delete) exists
    if (!permissions[module].includes(action)) {
      console.log(
        `❌ [checkPermission] No '${action}' permission on module: ${module}`
      );
      return res
        .status(403)
        .json({
          message: `Access Denied: No ${action} permission on ${module}`,
        });
    }
    console.log(
      `✅ [checkPermission] '${action}' permission verified on module: ${module}`
    );

    // ✅ All good, proceed
    console.log(
      `🎯 [checkPermission] Permission check passed, proceeding to next()`
    );
    next();
  } catch (error) {
    console.error(
      "❌ [checkPermission] Error during permission checking:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Internal server error in permission check" });
  }
};

module.exports = checkPermission;
