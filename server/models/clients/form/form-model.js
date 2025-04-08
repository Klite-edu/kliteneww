const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

formSubmissionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get the Submission model from the dynamic database
const getSubmissionModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("Submission", formSubmissionSchema);
};

module.exports = { getSubmissionModel };
