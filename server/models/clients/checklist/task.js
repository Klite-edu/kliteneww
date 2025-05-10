const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");
// Define Task Schema
const TaskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
  },
  doer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    enum: [
      "Daily", "Alternate Days", "Weekly", "Monthly", "Fortnightly",
      "Quarterly", "Half-yearly", "Yearly",
      "First of every month", "Second of every month",
      "Third of every month", "Fourth of every month"
    ],
    required: true,
  },
  plannedDateTime: {
    type: Date,
    required: true,
  },
  nextDueDateTime: {
    type: Date,
    required: true,
  },
  statusHistory: [
    {
      date: {
        type: Date,
        required: true
      },
      status: {
        type: String,
        enum: ["Pending", "Complete"],
        default: "Pending",
      },
      completedDateTime: {
        type: Date
      },
      url: {
        type: String
      },
      validationStatus: {
        type: String
      },
      validationRequestedAt: {
        type: Date
      }
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
TaskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
// Function to get the Task model from the dynamic database
const getTaskModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("Checklist", TaskSchema);
};
module.exports = { getTaskModel };