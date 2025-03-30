const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  date: {
    type: String,
    required: true,
  },
  employeeName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Resolved"],
    default: "Pending",
  },
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("TicketRaise", ticketSchema);