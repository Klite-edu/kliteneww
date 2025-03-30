const mongoose = require("mongoose");
const db = require("../../database/db");

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin", enum: ["admin", "client", "user"] },
  otpEnabled: { type: Boolean, default: false } // Add this flag to indicate OTP status
});
const Admin = db.model("AdminLogin", adminSchema);

module.exports = Admin;


