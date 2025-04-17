const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const contactVariableSchema = new mongoose.Schema({
  label: { type: String, required: true },                // e.g., Lead Score
  variableName: { type: String, required: true },         // e.g., lead_score
  fieldType: { type: String, required: true },            // e.g., Text, Number
  defaultValue: { type: mongoose.Schema.Types.Mixed },    // String, number, etc.
  folder: { type: String },                               // Optional grouping
  key: { type: String, required: true },                  // e.g., {{contact.lead_score}}
  createdAt: { type: Date, default: Date.now },
});

const getContactVariableModel = async (companyName) => {
  const db = await createClientDatabase(companyName);
  return db.model("ContactVariable", contactVariableSchema);
};

module.exports = { getContactVariableModel };
