const mongoose = require("mongoose");
const  db1  = require("../../database/db");

const impressionSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

const Impression = db1.model("Impression", impressionSchema);
module.exports = Impression;
