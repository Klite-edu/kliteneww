const mongoose = require("mongoose");
const  db2  = require("../../database/db");

const clientSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  selectedPlanID: { type: mongoose.Schema.Types.ObjectId, ref: "UserSubscription", default: null }, // Reference to Subscription model
  selectedPlan: {
    name: { type: String, default: "No Plan Selected" },
    price: { type: Number, default: 0 },
    duration: { type: String, default: "N/A" },
    status: { type: String, enum: ["expired", "active"], default: "active" },
  },
});

const Client = db2.model("Clientplan", clientSchema);
module.exports = Client;
