const mongoose = require("mongoose");

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
        default: Date.now,
      },
      status: {
        type: String,
        default: "Pending",
      },
      completedDateTime: Date,
    },
  ],
});

module.exports = mongoose.model("checklist", TaskSchema);