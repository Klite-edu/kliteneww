const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  waba_id: { type: String, required: true },
  status: { type: String, enum: ["bot", "human"], default: "bot" },
  assignedAgent: {
    type: String,
    ref: "Employee", // Reference the Employee model
    default: null,
  },
  lastMessage: { type: String },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get the UserChat model from the dynamic database
const getUserChatModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("UserChat", userSchema);
};

module.exports = { getUserChatModel };
