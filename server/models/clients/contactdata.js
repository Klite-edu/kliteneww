const mongoose = require("mongoose");
const { createClientDatabase } = require("../../database/db");  // Corrected path

const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  employeeID: { type: String, required: true, unique: true, trim: true },
  designation: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  number: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  joiningDate: { type: Date, required: true },
  specificEmail: { type: String, trim: true },
  workAssigned: { type: String, trim: true },
  notes: { type: String, trim: true },
  callData: { type: String, trim: true },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Suspended"],
    default: "Active"
  },
  role: { type: String, default: "user" },
  teamAssociation: { type: String, trim: true },
  activityLog: { type: String, trim: true },
  pastDataHistory: { type: String, trim: true },
  receivedEmails: [{ subject: String, date: Date, sender: String, snippet: String }],
  sentEmails: [{ subject: String, date: Date, recipient: String, snippet: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

employeeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get the Employee model from the dynamic database
const getEmployeeModel = async (companyName) => {
  try {
    const clientDB = await createClientDatabase(companyName);
    return clientDB.model("Employee", employeeSchema);
  } catch (error) {
    console.error(`Error creating Employee model for company: ${companyName}`, error);
    throw new Error("Failed to connect to the client database");
  }
};

module.exports = { getEmployeeModel };
