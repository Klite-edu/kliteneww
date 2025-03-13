const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema({
  waba_id: {
    type: String,
    required: true,
  },
  phone_number_id: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Business", BusinessSchema);
