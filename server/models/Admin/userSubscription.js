const mongoose = require("mongoose");
const { connectMainDB } = require("../../database/db");
connectMainDB();


const userSubscriptionSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Clients", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["expired", "active"], default: "active" },
});

const UserSubscription = mongoose.model("UserSubscription", userSubscriptionSchema);
module.exports = UserSubscription;
