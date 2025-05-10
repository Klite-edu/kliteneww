const express = require("express");
const mongoose = require("mongoose");
const { Types } = mongoose;
const dbMiddleware = require("../../../middlewares/dbMiddleware");
const checkPermission = require("../../../middlewares/PermissionAuth");

const router = express.Router();

// Create a trigger
router.post("/create", dbMiddleware, checkPermission("Automation", "create"),  async (req, res) => {
  const { name, description, event_source, conditions, action } = req.body;

  try {
    if (
      !conditions.form_id ||
      !action.move_to_stage ||
      !mongoose.isValidObjectId(conditions.form_id) ||
      !mongoose.isValidObjectId(action.move_to_stage)
    ) {
      return res.status(400).json({
        message: "Invalid form_id or move_to_stage. Both must be valid ObjectId.",
      });
    }

    const trigger = new req.trigger({
      name,
      description: description || "",
      event_source,
      conditions,
      action,
    });

    await trigger.save();
    res.status(201).json({ message: "Trigger created successfully", trigger });
  } catch (error) {
    console.error("Error creating trigger:", error);
    res.status(500).json({ message: "Error creating trigger", error: error.message });
  }
});

// Get all triggers
router.get("/list", dbMiddleware, checkPermission("Automation", "read"), async (req, res) => {
  try {
    const triggers = await req.trigger.find();
    res.status(200).json(triggers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching triggers", error: error.message });
  }
});

// Get unique event sources from triggers
router.get("/event-sources", dbMiddleware, checkPermission("Automation", "read"),  async (req, res) => {
  try {
    const eventSources = await req.trigger.distinct("event_source");
    res.status(200).json(eventSources);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event sources", error: error.message });
  }
});

// Delete a trigger
router.delete("/delete/:id", dbMiddleware, checkPermission("Automation", "delete"),  async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid trigger ID" });
    }

    const deletedTrigger = await req.trigger.findByIdAndDelete(id);

    if (!deletedTrigger) {
      return res.status(404).json({ message: "Trigger not found" });
    }

    res.status(200).json({ message: "Trigger deleted successfully" });
  } catch (error) {
    console.error("Error deleting trigger:", error);
    res.status(500).json({ message: "Error deleting trigger", error: error.message });
  }
});

router.get("/predefined", dbMiddleware, async (req, res) => {
  try {
    const predefinedTrigger = await req.trigger.findOne({ event_source: "form_submission" });
    if (!predefinedTrigger) {
      return res.status(404).json({ message: "Predefined trigger not found" });
    }
    res.status(200).json([predefinedTrigger]); // Wrap the trigger in an array
  } catch (error) {
    res.status(500).json({ message: "Error fetching predefined trigger", error: error.message });
  }
});

module.exports = router;
