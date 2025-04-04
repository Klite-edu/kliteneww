const mongoose = require("mongoose");
const { createClientDatabase } = require("../../database/db");

const clientSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  selectedPlanID: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "UserSubscription", 
    default: null 
  }, 
  selectedPlan: {
    name: { type: String, default: "No Plan Selected" },
    price: { type: Number, default: 0 },
    duration: { type: String, default: "N/A" },
    status: { 
      type: String, 
      enum: ["expired", "active"], 
      default: "active" 
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

clientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get the ClientPlan model from the dynamic database
const getClientPlanModel = async (companyName) => {
  try {
    const clientDB = await createClientDatabase(companyName);
    return clientDB.model("ClientPlan", clientSchema);
  } catch (error) {
    console.error(`Error creating ClientPlan model for company: ${companyName}`, error);
    throw new Error("Failed to connect to the client database");
  }
};

module.exports = { getClientPlanModel };
