const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const dbMiddleware = require("../../../middlewares/dbMiddleware");

// 🔹 Create new variable
router.post("/create", dbMiddleware, async (req, res) => {
  try {
    const { label, variableName, fieldType, defaultValue, folder } = req.body;
    const module = req.body.module || "contact";
    const key = `{{${module}.${variableName}}}`;

    console.log("🔹 CREATE REQUEST BODY:", req.body);
    console.log("🔹 Using DB model:", req.CustomVariables?.modelName);

    const exists = await req.CustomVariables.findOne({ variableName, module });
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
      module,
    });

    console.log("✅ New Variable Created:", newVar);
    res.json({ success: true, variable: newVar });
  } catch (err) {
    console.error("❌ Error in POST /create:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔹 Get all variables
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

// 🔹 Save values as per defined schema
router.post("/set-values", dbMiddleware, async (req, res) => {
  const { module, data } = req.body;

  try {
    // 1. Get defined variable keys for this module
    const definedVars = await req.CustomVariables.find({ module });
    const definedKeys = definedVars.map(v => v.variableName);

    // 2. Sanitize data — remove keys not defined
    const finalData = {};
    for (let key in data) {
      if (definedKeys.includes(key)) {
        finalData[key] = data[key];
      } else {
        console.warn(`⚠️ Skipped undefined key: ${key}`);
      }
    }

    // 3. Prepare collection and schema for saving
    const collectionName = `${module}_records`;
    const schema = new mongoose.Schema(
      {
        data: {
          type: Map,
          of: mongoose.Schema.Types.Mixed
        },
        createdAt: { type: Date, default: Date.now }
      },
      { collection: collectionName }
    );

    const db = req.CustomVariables.db; // same db instance from dbMiddleware
    const Model = db.model(collectionName, schema);

    const saved = await new Model({ data: finalData }).save();

    console.log(`✅ New ${module} data saved:`, saved._id);
    res.json({ success: true, saved });
  } catch (error) {
    console.error("❌ Error saving values:", error);
    res.status(500).json({ message: "Error saving values" });
  }
});

module.exports = router;
