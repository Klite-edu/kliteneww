const mongoose = require("mongoose");
const { connectMainDB } = require("../../database/db");

// Ensure the main DB connection is established
connectMainDB();

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin", enum: ["admin", "client", "user"] },
  otpEnabled: { type: Boolean, default: false }, // OTP status flag
});

const Admin = mongoose.model("AdminLogin", adminSchema);

module.exports = Admin;
