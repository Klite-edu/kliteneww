const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const MetaTemplateSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  name: { type: String, required: true },
  language: { type: String, required: true },
  status: { type: String, required: true },
  category: { type: String, required: true },
  components: { type: Array, default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaTemplateSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

// Function to get the MetaTemplate model from the dynamic database
const getMetaTemplateModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("MetaTemplate", MetaTemplateSchema);
};

module.exports = { getMetaTemplateModel };
