const express = require("express");
const router = express.Router();
const dbDBMiddleware = require("../../../middlewares/dbMiddleware");

// Get all pipelines
router.get("/list", dbDBMiddleware, async (req, res) => {
  try {
    console.log("📥 Fetching all pipelines...");
    const pipelines = await req.pipeline.find().populate({
      path: "stages.who",
      select: "fullName email department position",
      model: "Employee",
    });

    console.log(`✅ Pipelines fetched: ${pipelines.length}`);
    res.json(pipelines);
  } catch (error) {
    console.error("❌ Error fetching pipelines:", error.message);
    res.status(500).json({ message: "Error fetching pipelines", error: error.message });
  }
});

// Get all contacts
router.get("/contactinfo", dbDBMiddleware, async (req, res) => {
  try {
    console.log("📥 Fetching all contacts...");
    const employees = await req.Employee.find();
    console.log(`✅ Contacts fetched: ${employees.length}`);
    res.json(employees);
  } catch (error) {
    console.error("❌ Error fetching contacts:", error.message);
    res.status(500).json({ message: "Error fetching employees", error: error.message });
  }
});

// Get pipelines specific to a user
router.get("/user/:userId", dbDBMiddleware, async (req, res) => {
  const { userId } = req.params;
  console.log(`🔵 Request received for pipelines with userId: ${userId}`);

  try {
    const pipelines = await req.pipeline.find({ "stages.who": userId });
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

    console.log("✅ Filtered Pipelines Response:", JSON.stringify(filteredPipelines, null, 2));
    res.json(filteredPipelines);
  } catch (error) {
    console.error("❌ Error fetching user-specific pipelines:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Add a new pipeline with multiple stages
router.post("/add", dbDBMiddleware, async (req, res) => {
  try {
    console.log("📥 Adding new pipeline:", req.body);
    const { pipelineName, stages } = req.body;

    if (!pipelineName || !stages.length) {
      console.warn("❌ Pipeline name or stages missing");
      return res
        .status(400)
        .json({ message: "Pipeline name and at least one stage are required" });
    }

    const newPipeline = new req.pipeline({ pipelineName, stages });
    await newPipeline.save();
    console.log("✅ Pipeline added successfully:", newPipeline);
    res.status(201).json({ message: "Pipeline added successfully", newPipeline });
  } catch (error) {
    console.error("❌ Error adding pipeline:", error.message);
    res.status(500).json({ message: "Error adding pipeline", error: error.message });
  }
});

// Delete a pipeline
router.delete("/:id", dbDBMiddleware,  async (req, res) => {
  try {
    console.log(`🗑️ Deleting pipeline with ID: ${req.params.id}`);
    const deletedPipeline = await req.pipeline.findByIdAndDelete(req.params.id);

    if (!deletedPipeline) {
      console.warn("❌ Pipeline not found:", req.params.id);
      return res.status(404).json({ message: "Pipeline not found" });
    }

    console.log("✅ Pipeline deleted successfully:", deletedPipeline);
    res.json({ message: "Pipeline deleted successfully", deletedPipeline });
  } catch (error) {
    console.error("❌ Error deleting pipeline:", error.message);
    res.status(500).json({ message: "Error deleting pipeline", error: error.message });
  }
});

// Update stage status
router.put("/:id", dbDBMiddleware, async (req, res) => {
  try {
    console.log(`🔄 Updating pipeline with ID: ${req.params.id}`);
    const updatedPipeline = await req.pipeline.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedPipeline) {
      console.warn("❌ Pipeline not found:", req.params.id);
      return res.status(404).json({ message: "Pipeline not found" });
    }

    console.log("✅ Pipeline updated successfully:", updatedPipeline);
    res.json({ message: "Pipeline updated successfully", updatedPipeline });
  } catch (error) {
    console.error("❌ Error updating pipeline:", error.message);
    res.status(500).json({ message: "Error updating pipeline", error: error.message });
  }
});

module.exports = router;
