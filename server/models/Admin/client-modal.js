// const mongoose = require("mongoose");
// const { connectMainDB } = require("../../database/db");
// connectMainDB();

// const clientSchema = new mongoose.Schema(
//   {
//     fullName: { type: String, required: true }, // Corrected from 'fullname'
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."]
//     },
//     phone: {
//       type: String,
//       required: true,
//       unique: true,
//       match: [/^\d{10}$/, "Please provide a valid 10-digit phone number."]
//     },
//     companyName: { type: String, required: true },
//     companyWebsite: { type: String },
//     industryType: { type: String },
//     selectedPlan: { type: String, required: true },
//     selectedPlanId: {
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: "Subscription", // Ensure this points to the Subscription model
//       required: true
//     },
//     password: {
//       type: String,
//       required: true,
//       minlength: 6
//     },
//     status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
//     role: { type: String, default: "client" },
//     createdAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );
// const Client = mongoose.model("Clients", clientSchema);

// module.exports = Client;
const mongoose = require("mongoose");
const { createClientDatabase } = require("../../database/db");

// Define Client Schema
const clientSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\d{10}$/, "Please provide a valid 10-digit phone number."],
  },
  companyName: { type: String, required: true, trim: true },
  companyWebsite: { type: String, trim: true },
  industryType: { type: String, trim: true },
  selectedPlan: { type: String, required: true, trim: true },
  selectedPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  role: { type: String, default: "client" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save middleware to update the `updatedAt` field
clientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get or create the Client model dynamically
const getClientModel = async (companyName) => {
  try {
    const clientDB = await createClientDatabase(companyName);
    if (!clientDB.models.Client) {
      return clientDB.model("Client", clientSchema);
    }
    return clientDB.models.Client;
  } catch (error) {
    console.error(`Error creating Client model for company: ${companyName}`, error);
    throw new Error("Failed to connect to the client database");
  }
};

module.exports = { getClientModel };
