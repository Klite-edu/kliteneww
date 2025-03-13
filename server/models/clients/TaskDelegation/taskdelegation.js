// models/Delegation.js
const mongoose = require("mongoose");

// models/Delegation.js
const delegationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  doer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee", // Reference to Employee model
  },
  status: {
    type: String,
    default: "Pending",
  },
  completedAt: {
    type: Date, // New field to store completion date and time
  },
  revisedDate: {
    type: Date, // New field to store revised date
  },
  revisedTime: {
    type: String, // New field to store revised time
  },
  revisedReason: {
    type: String, // New field to store revised reason
  },
});

module.exports = mongoose.model("Delegation", delegationSchema);