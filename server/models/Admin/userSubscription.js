const mongoose = require("mongoose");
const  db1  = require("../../database/db");

const userSubscriptionSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Clients", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["expired", "active"], default: "active" },
});

const UserSubscription = db1.model("UserSubscription", userSubscriptionSchema);
module.exports = UserSubscription;
