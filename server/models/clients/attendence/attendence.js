const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  checkIn: { type: String, default: "" },
  checkOut: { type: String, default: "" },
  date: { type: Date, required: true },
  status: { type: String, enum: ["present", "absent", "leave"], default: "present" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

attendanceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export function to get the Attendance model from the dynamic database
const getAttendanceModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("Attendance", attendanceSchema);
};

module.exports = { getAttendanceModel };
