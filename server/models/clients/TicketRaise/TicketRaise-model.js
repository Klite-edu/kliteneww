const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

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
  timestamps: true,
});

// Function to get the TicketRaise model from the dynamic database
const getTicketRaiseModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("TicketRaise", ticketSchema);
};

module.exports = { getTicketRaiseModel };
