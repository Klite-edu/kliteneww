const mongoose = require("mongoose");
const { createClientDatabase } = require("../../database/db");
const bcrypt = require("bcryptjs");
const { utcToZonedTime, zonedTimeToUtc } = require("date-fns-tz");
const { setHours, setMinutes, isWithinInterval } = require("date-fns");

const employeeSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    employeeID: { type: String, required: true, unique: true, trim: true },
    designation: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    number: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    joiningDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
      required: true
    },
    role: {
      type: String,
      default: "user",
      required: true
    },
    shifts: [{
      name: String,
      startTime: String, // Format: "HH:MM" (24-hour)
      endTime: String,
      isDefault: Boolean
    }],
    teamAssociation: { type: String, trim: true },
  },
  { timestamps: true }
);

// Password hashing middleware
employeeSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Availability check method
employeeSchema.methods.isAvailableAt = function(dateTime) {
  const zonedDate = utcToZonedTime(dateTime, this.timezone);
  const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][zonedDate.getDay()];

  const workDay = this.workingDays.find(d => d.day === dayOfWeek);
  if (!workDay?.isWorking) return false;

  if (this.shifts.length > 0) {
    const activeShift = this.shifts.find(s => s.isDefault);
    if (activeShift) {
      const [startH, startM] = activeShift.startTime.split(":").map(Number);
      const [endH, endM] = activeShift.endTime.split(":").map(Number);
      
      const shiftStart = setMinutes(setHours(zonedDate, startH), startM);
      const shiftEnd = setMinutes(setHours(zonedDate, endH), endM);
      
      return isWithinInterval(zonedDate, { start: shiftStart, end: shiftEnd });
    }
  }
  
  return true;
};

const getEmployeeModel = async (companyName) => {
  try {
    const clientDB = await createClientDatabase(companyName);
    return clientDB.model("Employee", employeeSchema);
  } catch (error) {
    console.error(`Error creating Employee model for ${companyName}:`, error);
    throw error;
  }
};

module.exports = { getEmployeeModel, employeeSchema };