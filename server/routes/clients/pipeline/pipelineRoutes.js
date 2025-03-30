const express = require("express");
const router = express.Router();
const Pipeline = require("../../../models/clients/pipeline/pipeline-model");
const Employee = require("../../../models/clients/contactdata");
// Get all pipelines
router.get("/list", async (req, res) => {
  try {
    const pipelines = await Pipeline.find().populate({
      path: "stages.who",
      select: "fullName email department position", // Include the fields you want from Employee
      model: "Employee", // Specify the model to populate from
    });

    res.json(pipelines);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pipelines", error });
  }
});

router.get("/contactinfo", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees", error });
  }
});

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log(`🔵 Request received for pipelines with userId: ${userId}`);

  try {
    const pipelines = await Pipeline.find({
      "stages.who": userId,
    });

    console.log(`🟢 Found ${pipelines.length} pipelines with matching stages`);

    // Filter stages for the given userId
    const filteredPipelines = pipelines.map((pipeline) => {
      const userStages = pipeline.stages.filter(
        (stage) => stage.who.toString() === userId
      );

      console.log(
        `➡️ Pipeline: ${pipeline.pipelineName} | Stages for user: ${userStages.length}`
      );

      return {
        _id: pipeline._id,
        pipelineName: pipeline.pipelineName,
        stages: userStages,
      };
    });

    console.log(
      "✅ Filtered Pipelines Response:",
      JSON.stringify(filteredPipelines, null, 2)
    );

    res.json(filteredPipelines);
  } catch (error) {
    console.error("❌ Error fetching user-specific pipelines:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// Add a new pipeline with multiple stages
router.post("/add", async (req, res) => {
  try {
    const { pipelineName, stages } = req.body;

    if (!pipelineName || !stages.length) {
      return res
        .status(400)
        .json({ message: "Pipeline name and at least one stage are required" });
    }

    const newPipeline = new Pipeline({ pipelineName, stages });
    await newPipeline.save();
    res
      .status(201)
      .json({ message: "Pipeline added successfully", newPipeline });
  } catch (error) {
    res.status(500).json({ message: "Error adding pipeline", error });
  }
});

// Delete a pipeline
router.delete("/:id", async (req, res) => {
  try {
    await Pipeline.findByIdAndDelete(req.params.id);
    res.json({ message: "Pipeline deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting pipeline", error });
  }
});

// Update stage status
router.put("/:id", async (req, res) => {
  try {
    const updatedPipeline = await Pipeline.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ message: "Pipeline updated successfully", updatedPipeline });
  } catch (error) {
    res.status(500).json({ message: "Error updating pipeline", error });
  }
});

module.exports = router;
