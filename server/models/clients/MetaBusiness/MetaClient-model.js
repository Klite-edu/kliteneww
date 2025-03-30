const mongoose = require("mongoose");

const MetaClientSchema = new mongoose.Schema({
  business_name: String,
  waba_id: String,
  phone_number_id: String,
  access_token: String,
  token_expiry: Date,
  apiKey: String,
  model: String,
  instructionFile: String,
  subscribed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MetaClient", MetaClientSchema);
