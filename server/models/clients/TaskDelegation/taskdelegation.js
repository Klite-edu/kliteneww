const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const delegationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  doer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee", // Reference to Employee model
  },
  status: {
    type: String,
    default: "Pending",
  },
  completedAt: {
    type: Date, // New field to store completion date and time
  },
  revisedDate: {
    type: Date, // New field to store revised date
  },
  revisedTime: {
    type: String, // New field to store revised time
  },
  revisedReason: {
    type: String, // New field to store revised reason
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

delegationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get the Delegation model from the dynamic database
const getDelegationModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("Delegation", delegationSchema);
};

module.exports = { getDelegationModel };
