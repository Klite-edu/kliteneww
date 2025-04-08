const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const MetaClientSchema = new mongoose.Schema({
  business_name: { type: String, required: true },
  waba_id: { type: String, required: true },
  phone_number_id: { type: String, required: true },
  access_token: { type: String, required: true },
  token_expiry: { type: Date, required: true },
  apiKey: { type: String, required: true },
  model: { type: String, default: "default_model" },
  instructionFile: { type: String, default: "" },
  subscribed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

MetaClientSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

// Function to get the MetaClient model from the dynamic database
const getMetaClientModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("MetaClient", MetaClientSchema);
};

module.exports = { getMetaClientModel };
