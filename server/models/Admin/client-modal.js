const mongoose = require("mongoose");
const { connectMainDB } = require("../../database/db");
connectMainDB();

const clientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true }, // Corrected from 'fullname'
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."]
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Please provide a valid 10-digit phone number."]
    },
    companyName: { type: String, required: true },
    companyWebsite: { type: String },
    industryType: { type: String },
    selectedPlan: { type: String, required: true },
    selectedPlanId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Subscription", // Ensure this points to the Subscription model
      required: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    role: { type: String, default: "client" },
    companyConfig: {
      workingDays: [{ 
        day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        isWorking: { type: Boolean, default: true }
      }],
      holidays: [{
        date: Date,
        description: String,
        repeatsAnnually: Boolean
      }]
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const Client = mongoose.model("Clients", clientSchema);

module.exports = Client;
