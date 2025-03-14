const express = require("express");
const mongoose = require("mongoose");
const { Types } = mongoose; // Import Types for ObjectId (optional, if needed elsewhere)
const Trigger = require("../../../models/clients/triggers/Trigger-model");

const router = express.Router();

// Create a trigger
router.post("/create", async (req, res) => {
  const { event_source, conditions, action } = req.body;

  try {
    // Validate form_id and move_to_stage
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

    // No need to convert to ObjectId since they are already ObjectId
    const trigger = new Trigger({
      event_source,
      conditions: {
        form_id: conditions.form_id, // Use as-is
      },
      action: {
        move_to_stage: action.move_to_stage, // Use as-is
      },
    });

    await trigger.save();
    res.status(201).json({ message: "Trigger created successfully", trigger });
  } catch (error) {
    console.error("Error creating trigger:", error);
    res.status(500).json({ message: "Error creating trigger", error: error.message });
  }
});

router.get("/event-sources", async (req, res) => {
  try {
    // Fetch unique event_source values from the Trigger collection
    const eventSources = await Trigger.distinct("event_source");
    res.status(200).json(eventSources);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event sources", error: error.message });
  }
});

// Predefined trigger for "form_submission"
const predefinedTrigger = {
  event_source: "form_submission",
  conditions: {
    form_id: new Types.ObjectId("67d07641fe6a614e5ebf0524"), // Replace with a valid ObjectId
  },
  action: {
    move_to_stage: new Types.ObjectId("67cdd35233bb6ae0e9895c5d"), // Replace with a valid ObjectId
  },
};

// Save the predefined trigger in the database (only for "form_submission")
const savePredefinedTrigger = async () => {
  try {
    const existingTrigger = await Trigger.findOne({ event_source: "form_submission" });
    if (!existingTrigger) {
      const trigger = new Trigger(predefinedTrigger);
      await trigger.save();
      console.log("Predefined trigger saved successfully:", trigger);
    }
  } catch (error) {
    console.error("Error saving predefined trigger:", error);
  }
};

// Call this function when the server starts
savePredefinedTrigger();

// Fetch the predefined "form_submission" trigger
router.get("/predefined", async (req, res) => {
  try {
    // Fetch the predefined trigger for "form_submission"
    const predefinedTrigger = await Trigger.findOne({ event_source: "form_submission" });
    if (!predefinedTrigger) {
      return res.status(404).json({ message: "Predefined trigger not found" });
    }
    res.status(200).json([predefinedTrigger]); // Wrap the trigger in an array
  } catch (error) {
    res.status(500).json({ message: "Error fetching predefined trigger", error: error.message });
  }
});

module.exports = router;