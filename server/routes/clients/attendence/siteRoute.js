const express = require("express");
const Site = require("../../../models/clients/attendence/site"); // Import the Site model
const router = express.Router();

// ✅ Use Express's built-in JSON parser
router.use(express.json());

// ✅ Only Add New Site (No Update Logic)
router.post("/sites", async (req, res) => {
  try {
    console.log("📩 Received Site Data:", req.body);

    const { name, latitude, longitude, radius } = req.body;

    if (!name || !latitude || !longitude || !radius) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Create a new site entry (No checking for existing sites)
    const newSite = await Site.create({ name, latitude, longitude, radius });

    console.log("✅ New Site Created:", newSite);
    res.status(201).json({ message: "Site added successfully!", site: newSite });

  } catch (error) {
    console.error("❌ Error adding site:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
