const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");
const { Schema } = mongoose;

// Global flag to ensure the predefined trigger is created only once per process
let predefinedTriggerCreated = false;

const triggerSchema = new Schema({
  name: { type: String, required: true, unique: true }, // Ensuring uniqueness
  description: { type: String, default: "" },
  event_source: { type: String, required: true },
  conditions: {
    form_id: { type: Schema.Types.ObjectId, ref: "Submission", required: true },
  },
  action: {
    move_to_stage: { type: Schema.Types.ObjectId, ref: "Pipeline", required: true },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

triggerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Predefined Trigger Data
const predefinedTriggerData = {
  name: "form_submission",
  description: "Predefined trigger for form submissions",
  event_source: "form_submission",
  conditions: {
    form_id: new mongoose.Types.ObjectId("64a7b3ef23e5d6a8dcd4a9a1"), // Update with valid ObjectId
  },
  action: {
    move_to_stage: new mongoose.Types.ObjectId("64a7b3ef23e5d6a8dcd4a9b2"), // Update with valid ObjectId
  },
};

// Create predefined trigger with atomic check
const createPredefinedTrigger = async (TriggerModel) => {
  try {
    // Check if predefined trigger already created globally
    if (predefinedTriggerCreated) {
      console.log("✅ Predefined trigger already initialized.");
      return;
    }

    // Use findOneAndUpdate with upsert for atomic operation
    const result = await TriggerModel.findOneAndUpdate(
      {
        name: predefinedTriggerData.name,
        event_source: predefinedTriggerData.event_source,
      },
      { $setOnInsert: predefinedTriggerData },
      { upsert: true, new: true } // Upsert and return the new document
    );

    if (result) {
      console.log("✅ Predefined trigger ensured in database.");
      predefinedTriggerCreated = true;
    }
  } catch (error) {
    if (error.code === 11000) {
      console.log("🔁 Predefined trigger already exists (duplicate key), skipping creation.");
      predefinedTriggerCreated = true;
    } else {
      console.error("❌ Error creating predefined trigger:", error.message);
    }
  }
};

// Function to get the Trigger model from the dynamic database
const getTriggerModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  const TriggerModel = clientDB.model("Trigger", triggerSchema);

  // Ensure predefined trigger creation only once
  if (!predefinedTriggerCreated) {
    await createPredefinedTrigger(TriggerModel);
  }

  return TriggerModel;
};

module.exports = { getTriggerModel };
