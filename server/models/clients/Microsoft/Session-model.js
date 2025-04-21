const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db"); // adjust path if needed

const SessionSchema = new mongoose.Schema({
  sessionId: String,
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
  userId: String,
  createdAt: { type: Date, default: Date.now },
});

// ✅ Function to get dynamic Session model
const getMicrosoftSessionModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("MicrosoftSession", SessionSchema);
};

module.exports = { getMicrosoftSessionModel };
