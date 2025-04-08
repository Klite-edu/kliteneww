const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

// Define the Pipeline Schema with multiple stages
const pipelineSchema = new mongoose.Schema(
  {
    pipelineName: { type: String, required: true }, // Pipeline Name
    stages: [
      {
        stageName: { type: String, required: true },
        what: { type: String, required: true },
        when: { type: String, required: true },
        who: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true }, // Store employee ID
        how: { type: String, required: true },
        priority: {
          type: String,
          enum: ["Low", "Medium", "High", "Urgent"],
          default: "Medium",
        },
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Completed", "Blocked"],
          default: "Pending",
        },
        dependencies: { type: String },
        approvalsRequired: { type: Boolean, default: false },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Function to get the Pipeline model from the dynamic database
const getPipelineModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("Pipeline", pipelineSchema);
};

module.exports = { getPipelineModel };
