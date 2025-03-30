const express = require("express");
const router = express.Router();
const Impression = require("../../models/Admin/Impression-model");

// Track an impression
router.post("/trackimpression", async (req, res) => {
  try {
    // Get IP address from headers or socket
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const impression = new Impression({ ip, userAgent });
    await impression.save();

    res.json({ message: "Impression saved" });
  } catch (error) {
    console.error("Error saving impression:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Get total impressions
router.get("/totalimpressions", async (req, res) => {
  console.log("Route /totalimpressions hit");
  try {
    const total = await Impression.countDocuments();
    console.log("Total Impressions:", total);
    res.json({ totalImpressions: total });
  } catch (error) {
    console.error("Error fetching impressions:", error.message, error.stack);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



module.exports = router;
