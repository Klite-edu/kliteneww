const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  jobProfile: { type: String },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("Employee", EmployeeSchema);
