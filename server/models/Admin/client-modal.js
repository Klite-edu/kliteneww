const mongoose = require("mongoose");
const { createClientDatabase } = require("../../database/db");

const clientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Please provide a valid 10-digit phone number."],
    },
    companyName: { type: String, required: true },
    companyWebsite: { type: String },
    industryType: { type: String },
    selectedPlan: { type: String, required: true },
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
    companyConfig: {
      workingDays: [
        {
          day: {
            type: String,
            enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          },
          isWorking: { type: Boolean, default: true },
        },
      ],
      holidays: [
        {
          date: Date,
          description: String,
          repeatsAnnually: Boolean,
        },
      ],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 🔄 Function to get the Client model from the dynamic database
const getClientModel = async (companyName) => {
  const db = await createClientDatabase(companyName);
  return db.model("Clients", clientSchema);
};

module.exports = { getClientModel };
