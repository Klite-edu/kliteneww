const mongoose = require("mongoose");
const  db  = require("../../database/db");

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }, // Keeping price as a string to handle "Free"
  duration: { type: String, required: true }, // Example: "7 Days", "Yearly"
  features: [
    {
      icon: { type: String, required: true }, // Example: "check-circle", "clock"
      text: { type: String, required: true }, // Example: "Limited features"
    },
  ],
});

const Subscription = db.model("Subscription", subscriptionPlanSchema);
module.exports = Subscription;
