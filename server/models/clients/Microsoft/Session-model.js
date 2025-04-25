const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const SessionSchema = new mongoose.Schema({
  sessionId: String,
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
  userId: String,
  createdAt: { type: Date, default: Date.now },
});

// Add static method for session validation
SessionSchema.statics.validateSession = async function(sessionId) {
  return this.findOne({
    sessionId,
    expiresAt: { $gt: new Date() }
  }).select('userId expiresAt');
};

const getMicrosoftSessionModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("MicrosoftSession", SessionSchema);
};

module.exports = { getMicrosoftSessionModel };