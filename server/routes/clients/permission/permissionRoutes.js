const express = require("express");
const router = express.Router();
const sidebarConfig = require("../../../../client/src/component/configs/Sidebarconfig"); // <-- correct path de dena
const dbMiddleware = require("../../../middlewares/dbMiddleware");
// ✅ Save Permissions to Cookie
router.post("/save-permissions", (req, res) => {
  console.log("[SAVE PERMISSIONS] Request received:", req.body);

  const permissions = req.body.permissions;
  res.cookie("permissions", JSON.stringify(permissions), {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: false, // set true in production
    sameSite: "lax",
  });

  console.log(
    "[SAVE PERMISSIONS] Permissions cookie set successfully:",
    permissions
  );
  res.status(200).json({ message: "Permissions saved successfully." });
});

// ✅ Get Permissions from Cookie

router.get("/get-permissions", dbMiddleware, async (req, res) => {
  try {
    console.log("[GET PERMISSIONS] Fetching user details");

    const userId = req.cookies.userId;
    const role = req.cookies.role || "user";
    console.log("[GET PERMISSIONS] userId:", userId, "role:", role);

    if (!userId) {
      return res.status(400).json({ error: "User ID not found in cookies" });
    }

    if (role === "client") {
      console.log(
        "[GET PERMISSIONS] Client role detected. Sending full client sidebar config."
      );
      return res.json({
        permissions: {}, // client ke liye custom permissions ki zarurat nahi
        sidebarOptions: sidebarConfig.client, // pura client sidebar config
      });
    }

    // ✅ Normal role (admin/user) ke liye flow
    const employee = await req.Employee.findById(userId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const dbPermissions = employee.permissions || {};
    console.log("[GET PERMISSIONS] DB permissions fetched:", dbPermissions);

    const fullSidebarOptions = sidebarConfig[role] || [];
    console.log(
      "[GET PERMISSIONS] Sidebar config options:",
      fullSidebarOptions
    );

    const filteredSidebar = fullSidebarOptions.filter((item) => {
      const parentPermission = dbPermissions[item.name]?.includes("read");

      if (item.options && item.options.length > 0) {
        const childPermissions = item.options.filter((subItem) =>
          dbPermissions[subItem.name]?.includes("read")
        );
        if (childPermissions.length > 0) {
          item.options = childPermissions;
          return true;
        }
      }

      return parentPermission;
    });

    console.log(
      "[GET PERMISSIONS] Final sidebar after filtering:",
      filteredSidebar
    );

    res.json({ permissions: dbPermissions, sidebarOptions: filteredSidebar });
  } catch (error) {
    console.error("[GET PERMISSIONS] Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Save Role to Cookie
router.post("/save-role", (req, res) => {
  console.log("[SAVE ROLE] Request received:", req.body);

  const role = req.body.role;
  res.cookie("role", role, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: false, // set true in production
    sameSite: "lax",
  });

  console.log("[SAVE ROLE] Role cookie set successfully:", role);
  res.status(200).json({ message: "Role saved successfully." });
});

// ✅ Get Role from Cookie
router.get("/get-role", (req, res) => {
  console.log("[GET ROLE] Fetching role from cookies");

  const role = req.cookies.role;

  console.log("[GET ROLE] Retrieved role:", role);
  res.json({ role });
});

router.get("/get-token", (req, res) => {
  const token = req.cookies.token;
  const userId = req.cookies.userId;
  res.json({ token, userId });
});

router.get("/get-email", (req, res) => {
  console.log("[GET EMAIL] Fetching email from cookies");

  const email = req.cookies.email;

  console.log("[GET EMAIL] Retrieved email:", email);
  res.json({ email });
});
module.exports = router;
