// models/DelegationManifestation.js
const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const delegationManifestationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  employeeName: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  workNotDoneManifestation: {
    type: String,
    default: "",
  },
  workDoneLateManifestation: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

delegationManifestationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get the DelegationManifestation model from the dynamic database
const getDelegationManifestModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("DelegationManifestation", delegationManifestationSchema);
};

module.exports = { getDelegationManifestModel };