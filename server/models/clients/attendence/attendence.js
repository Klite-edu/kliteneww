const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  checkIn: { type: String, default: "" },
  checkOut: { type: String, default: "" },
  date: { type: Date, required: true },
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
