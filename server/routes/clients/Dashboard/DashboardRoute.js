const express = require("express");
const router = express.Router();
const dbDBMiddleware = require("../../../middlewares/dbMiddleware");
router.get("/total-employee", dbDBMiddleware, async (req, res) => {
  try {
    const totalEmployee = await req.Employee.countDocuments();
    const activeEmployee = await req.Employee.countDocuments({
      status: "Active",
    });

    res.status(200).json({ totalEmployee, activeEmployee });
  } catch (error) {
    console.error("Error fetching total employees:", error);
    res.status(500).json({ message: "Failed to fetch total employees" });
  }
});

router.get("/trigger-count", dbDBMiddleware, async (req, res) => {
  try {
    if (!req.trigger) {
      console.error("🚫 Trigger model not loaded in request object.");
      return res.status(500).json({ message: "Trigger model not found" });
    }
    console.log("🔍 Trigger model successfully loaded:", req.trigger);
    const totalTriggers = await req.trigger.countDocuments();
    console.log(`✅ Total triggers fetched: ${totalTriggers}`);
    res.status(200).json({ totalTriggers });
  } catch (error) {
    console.error("❌ Error fetching trigger count:", error);
    res.status(500).json({ message: "Failed to fetch trigger count" });
  }
});

router.get("/pipeline-stage-count", dbDBMiddleware, async (req, res) => {
  try {
    const pipelines = await req.pipeline.find({});
    const totalPipelines = pipelines.length;
    const totalStages = pipelines.reduce(
      (sum, pipeline) => sum + (pipeline.stages?.length || 0),
      0
    );

    res.status(200).json({ totalPipelines, totalStages });
  } catch (error) {
    console.error("Error fetching pipeline/stage count:", error);
    res.status(500).json({ message: "Failed to fetch pipeline/stage count" });
  }
});

module.exports = router;
