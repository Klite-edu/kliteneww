const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const MessageLogSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  phone_number: { type: String, required: true },
  message: { type: String, required: true },
  direction: { type: String, enum: ["inbound", "outbound"], required: true },
  status: { type: String, required: true },
  sent_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

MessageLogSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

// Function to get the MetaMessage model from the dynamic database
const getMessageLogModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("MetaMessage", MessageLogSchema);
};

module.exports = { getMessageLogModel };
