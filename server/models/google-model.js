const mongoose = require("mongoose");
const { createClientDatabase } = require("../../database/db");

const subscriptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", // Ensure it matches the user model name in dynamic databases
    required: true 
  },
  planName: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "completed", "failed"], 
    default: "pending" 
  },
  stripePaymentIntentId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Function to get the Subscription model from the dynamic database
const getSubscriptionModel = async (companyName) => {
  try {
    const clientDB = await createClientDatabase(companyName);
    return clientDB.model("Subscription", subscriptionSchema);
  } catch (error) {
    console.error(`Error creating Subscription model for company: ${companyName}`, error);
    throw new Error("Failed to connect to the client database");
  }
};

module.exports = { getSubscriptionModel };
