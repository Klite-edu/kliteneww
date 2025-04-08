const mongoose = require("mongoose");
const { connectMainDB } = require("../../database/db");
connectMainDB();

const impressionSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

const Impression = mongoose.model("Impression", impressionSchema);
module.exports = Impression;
