const mongoose = require("mongoose");
const { createClientDatabase } = require("../database/db");

const LeadSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, unique: true }, // Unique form ID
    name: { type: String, required: true }, // From form
    phoneNumber: { type: String, required: true }, // From form
    email: { type: String, required: true }, // From form
    description: { type: String, required: true }, // From form
  },
  { timestamps: true }
);

// Function to get the Lead model from the dynamic database
const getLeadModel = async (companyName) => {
  try {
    const clientDB = await createClientDatabase(companyName);
    return clientDB.model("Lead", LeadSchema);
  } catch (error) {
    console.error(`Error creating Lead model for company: ${companyName}`, error);
    throw new Error("Failed to connect to the client database");
  }
};

module.exports = { getLeadModel };
