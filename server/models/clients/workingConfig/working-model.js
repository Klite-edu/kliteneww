// 📁 File: models/clients/config/tenantWorkConfig.js

const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

// 🔧 Shift Timing Schema
const ShiftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startTime: { type: String, required: true }, // Format: "HH:MM"
  endTime: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

// 📅 Holiday Schema
const HolidaySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  description: { type: String },
  repeatsAnnually: { type: Boolean, default: false },
});

// 🏢 Company Work Config Schema
const TenantWorkConfigSchema = new mongoose.Schema(
  {
    workingDays: {
      type: [String],
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
    shifts: [ShiftSchema],
    holidays: [HolidaySchema],
    timezone: {
      type: String,
      enum: ["Asia/Kolkata", "America/New_York", "Europe/London", "Asia/Tokyo"],
      default: "Asia/Kolkata",
    },
  },
  { timestamps: true }
);

// 🔁 Dynamic Model Getter
const getTenantWorkConfigModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("TenantWorkConfig", TenantWorkConfigSchema);
};

module.exports = { getTenantWorkConfigModel };
