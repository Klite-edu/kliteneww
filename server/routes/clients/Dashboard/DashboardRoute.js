const express = require("express");
const router = express.Router();
const Employee = require("../../../models/clients/contactdata");
const Trigger = require("../../../models/clients/triggers/Trigger-model");
const Pipeline = require("../../../models/clients/pipeline/pipeline-model");

router.get("/total-employee", async (req, res) => {
  try {
    const totalEmployee = await Employee.countDocuments();
    const activeEmployee = await Employee.countDocuments({ status: "Active" });

    res.status(200).json({ totalEmployee, activeEmployee });
  } catch (error) {
    console.error("Error fetching total employees:", error);
    res.status(500).json({ message: "Failed to fetch total employees" });
  }
});

router.get("/trigger-count", async (req, res) => {
  try {
    const totalTriggers = await Trigger.countDocuments();
    res.status(200).json({ totalTriggers });
  } catch (error) {
    console.error("Error fetching trigger count:", error);
    res.status(500).json({ message: "Failed to fetch trigger count" });
  }
});

router.get("/pipeline-stage-count", async (req, res) => {
  try {
    const pipelines = await Pipeline.find({});
    const totalPipelines = pipelines.length;
    const totalStages = pipelines.reduce((sum, pipeline) => sum + (pipeline.stages?.length || 0), 0);

    res.status(200).json({ totalPipelines, totalStages });
  } catch (error) {
    console.error("Error fetching pipeline/stage count:", error);
    res.status(500).json({ message: "Failed to fetch pipeline/stage count" });
  }
});

module.exports = router;
