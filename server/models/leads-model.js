const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema({
  formId: { type: String, required: true, unique: true }, // Unique form ID
  name: { type: String, required: true }, // From form
  phoneNumber: { type: String, required: true }, // From form
  email: { type: String, required: true }, // From form
  description: { type: String, required: true }, // From form
}, { timestamps: true });

const Lead = mongoose.model("Lead", LeadSchema);
module.exports = Lead;

