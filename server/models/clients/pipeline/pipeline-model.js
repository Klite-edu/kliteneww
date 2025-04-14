const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

// Define the Pipeline Schema
const pipelineSchema = new mongoose.Schema(
  {
    pipelineName: {
      type: String,
      required: true,
      trim: true,
    },
    stages: [
      {
        stageName: {
          type: String,
          required: true,
          trim: true,
        },
        what: {
          type: String,
          required: true,
          trim: true,
        },
        when: {
          type: String,
          required: true,
          trim: true,
        },
        who: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        how: {
          message: {
            type: String,
            required: true,
            trim: true,
          },
          url: {
            type: String,
            trim: true,
          },
        },
        checklist: [
          {
            task: {
              type: String,
              trim: true,
            },
            ticket: [
              {
                id: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "Submission",
                },
                proof: {
                  type: String,
                },
                completedTime: {
                  type: Date,
                },
              },
            ],
          },
        ],
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
        dependencies: {
          type: String,
          trim: true,
        },
        approvalsRequired: {
          type: Boolean,
          default: false,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Function to get the Pipeline model dynamically
const getPipelineModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("Pipeline", pipelineSchema);
};

module.exports = { getPipelineModel };
