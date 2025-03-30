const mongoose = require("mongoose");
const { Schema } = mongoose;

const triggerSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: {
    type: String,
    default: ""
  },
  event_source: { type: String, required: true },
  conditions: {
    form_id: { type: Schema.Types.ObjectId, ref: "Submission", required: true },
  },
  action: {
    move_to_stage: { type: Schema.Types.ObjectId, ref: "Pipeline", required: true },
  },
});

module.exports = mongoose.model("Trigger", triggerSchema);