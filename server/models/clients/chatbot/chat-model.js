const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const WebhookLogSchema = new mongoose.Schema({
  data: {
    type: Object,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Function to get the WebhookLog model from the dynamic database
const getWebhookLogModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("WebhookLog", WebhookLogSchema);
};

module.exports = { getWebhookLogModel };
