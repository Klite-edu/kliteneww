const mongoose = require("mongoose");
const db = require("../../database/db");

const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  employeeID: { type: String, required: true, unique: true, trim: true },
  designation: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }, // Password remains plain in the model
  number: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  joiningDate: { type: Date, required: true },
  specificEmail: { type: String, trim: true },
  workAssigned: { type: String, trim: true },
  notes: { type: String, trim: true },
  callData: { type: String, trim: true },
  status: { type: String, enum: ["Active", "Inactive", "Suspended"], default: "Active" },
  role: { type: String, default: "user" },
  teamAssociation: { type: String, trim: true },
  activityLog: { type: String, trim: true },
  pastDataHistory: { type: String, trim: true },
  receivedEmails: [{ subject: String, date: Date, sender: String, snippet: String }],
  sentEmails: [{ subject: String, date: Date, recipient: String, snippet: String }],
});

const Employee = db.model("Employee", employeeSchema);
module.exports = Employee;
