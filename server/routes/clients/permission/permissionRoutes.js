const express = require('express');
const router = express.Router();

// ✅ Save Permissions to Cookie
router.post('/save-permissions', (req, res) => {
  console.log("[SAVE PERMISSIONS] Request received:", req.body);

  const permissions = req.body.permissions;
  res.cookie('permissions', JSON.stringify(permissions), {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: false, // set true in production
    sameSite: 'lax'
  });

  console.log("[SAVE PERMISSIONS] Permissions cookie set successfully:", permissions);
  res.status(200).json({ message: "Permissions saved successfully." });
});

// ✅ Get Permissions from Cookie
router.get('/get-permissions', (req, res) => {
  console.log("[GET PERMISSIONS] Fetching permissions from cookies");

  const permissionsCookie = req.cookies.permissions;
  console.log("[GET PERMISSIONS] Raw cookie value:", permissionsCookie);

  const permissions = permissionsCookie ? JSON.parse(permissionsCookie) : {};

  console.log("[GET PERMISSIONS] Parsed permissions:", permissions);
  res.json({ permissions });
});

// ✅ Save Role to Cookie
router.post('/save-role', (req, res) => {
  console.log("[SAVE ROLE] Request received:", req.body);

  const role = req.body.role;
  res.cookie('role', role, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: false, // set true in production
    sameSite: 'lax'
  });

  console.log("[SAVE ROLE] Role cookie set successfully:", role);
  res.status(200).json({ message: "Role saved successfully." });
});

// ✅ Get Role from Cookie
router.get('/get-role', (req, res) => {
  console.log("[GET ROLE] Fetching role from cookies");

  const role = req.cookies.role;

  console.log("[GET ROLE] Retrieved role:", role);
  res.json({ role });
});

router.get('/get-token', (req, res) => {
    const token = req.cookies.token;
    const userId = req.cookies.userId;
    res.json({ token, userId });
});

router.get('/get-email', (req, res) => {
    console.log("[GET EMAIL] Fetching email from cookies");
  
    const email = req.cookies.email;
  
    console.log("[GET EMAIL] Retrieved email:", email);
    res.json({ email });
  });
module.exports = router;
