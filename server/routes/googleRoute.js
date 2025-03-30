const express = require("express");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const router = express.Router();

let tempSecret; // Store the temporary secret in memory
let userSecret; // Store the user's secret after verification

// Setup Google Authenticator
router.get("/setup-google-auth", async (req, res) => {
  tempSecret = speakeasy.generateSecret();
  const qrCode = await QRCode.toDataURL(tempSecret.otpauth_url);
  res.json({ qrCode });
});

// Verify Google Authenticator during setup
router.post("/check-google-auth", (req, res) => {
  const { token } = req.body;

  const verified = speakeasy.totp.verify({
    secret: tempSecret.base32,
    encoding: "base32",
    token,
  });

  if (verified) {
    userSecret = tempSecret.base32;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Check if Google Authenticator is enabled
router.get("/check-google-auth", (req, res) => {
  const enabled = !!userSecret;
  res.json({ enabled });
});

// Google OTP login verification
router.post("/google-login", (req, res) => {
  const { code } = req.body;

  const verified = speakeasy.totp.verify({
    secret: userSecret,
    encoding: "base32",
    token: code,
  });

  if (verified) {
    res.json({ success: true, token: "your-jwt-token" });
  } else {
    res.json({ success: false });
  }
});

module.exports = router;
