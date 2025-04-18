const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const contactVariableSchema = new mongoose.Schema({
  label: String,
  variableName: String,
  fieldType: String,
  defaultValue: mongoose.Schema.Types.Mixed,
  folder: String,
  key: String,
  module: { type: String, default: "contact" }, // Add this line
  createdAt: { type: Date, default: Date.now },
});


const getContactVariableModel = async (companyName) => {
  const db = await createClientDatabase(companyName);
  return db.model("ContactVariable", contactVariableSchema);
};

module.exports = { getContactVariableModel };
