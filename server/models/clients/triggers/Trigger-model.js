const mongoose = require("mongoose");
const { Schema } = mongoose;

const triggerSchema = new Schema({
  event_source: { type: String, required: true }, // e.g., "form_submission"
  conditions: {
    form_id: { type: Schema.Types.ObjectId, ref: "Submission", required: true }, // Store as ObjectId
  },
  action: {
    move_to_stage: { type: Schema.Types.ObjectId, ref: "Pipeline", required: true }, // Store as ObjectId
  },
});

module.exports = mongoose.model("Trigger", triggerSchema);