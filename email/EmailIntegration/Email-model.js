const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiryDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Email', emailSchema);
