const mongoose = require("mongoose");

const formSubmissionSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "formBuilder",
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clients",
    required: true,
  },
  submissions: [
    {
      fieldLabel: { type: String, required: true },
      fieldType: { type: String, required: true },
      value: { type: mongoose.Schema.Types.Mixed, required: true },
    },
  ],
  current_stage_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pipeline",
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

const Submission = mongoose.model("Submission", formSubmissionSchema);
module.exports = Submission;
