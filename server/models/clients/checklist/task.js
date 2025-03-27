const mongoose = require("mongoose");

// Define Task Schema
const TaskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
  },
  doer: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the Employee model
    ref: "Employee",  // Make sure "Employee" is the name of the Employee model
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    enum: [
      "Daily", "Alternate Days", "Weekly", "Monthly", "Fortnightly", "Quarterly", "Half-yearly", "Yearly"
    ],
    required: true,
  },
  plannedDate: {
    type: Date,
    required: true,
  },
  nextDueDate: {
    type: Date, // nextDueDate field
    required: true,
  },
  statusHistory: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        default: "Pending",
      },
      completedDate: Date, // Date when the task was completed
    },
  ],
});

// Export the Task model
module.exports = mongoose.model("checklist", TaskSchema);
 

