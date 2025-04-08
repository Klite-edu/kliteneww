const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  jobProfile: { type: String },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

EmployeeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get the Employee model from the dynamic database
const getEmployeeModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("Employee", EmployeeSchema);
};

module.exports = { getEmployeeModel };
