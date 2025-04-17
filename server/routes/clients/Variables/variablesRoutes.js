const express = require("express");
const router = express.Router();
const dbMiddleware = require("../../../middlewares/dbMiddleware");

router.post("/create", dbMiddleware, async (req, res) => {
  try {
    const { label, variableName, fieldType, defaultValue, folder } = req.body;
    const key = `{{contact.${variableName}}}`;

    console.log("🔹 CREATE REQUEST BODY:", req.body);
    console.log("🔹 Using DB model:", req.CustomVariables?.modelName);

    const exists = await req.CustomVariables.findOne({ variableName });
    if (exists) {
      console.log("⚠️ Variable already exists:", variableName);
      return res.status(400).json({ message: "Variable already exists" });
    }

    const newVar = await req.CustomVariables.create({
      label,
      variableName,
      fieldType,
      defaultValue,
      folder,
      key,
    });

    console.log("✅ New Variable Created:", newVar);
    res.json({ success: true, variable: newVar });
  } catch (err) {
    console.error("❌ Error in POST /create:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/list", dbMiddleware, async (req, res) => {
  try {
    console.log("📥 GET VARIABLES: Model used:", req.CustomVariables?.modelName);

    const all = await req.CustomVariables.find().sort({ createdAt: -1 });

    console.log("📤 Total Variables Fetched:", all.length);
    res.json(all);
  } catch (err) {
    console.error("❌ Error in GET /list:", err);
    res.status(500).json({ message: "Error fetching variables" });
  }
});

module.exports = router;
