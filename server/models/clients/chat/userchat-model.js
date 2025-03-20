const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  waba_id: { type: String, required: true },
  status: { type: String, enum: ['bot', 'human'], default: 'bot' },
  assignedAgent: { 
    type: String, 
    ref: 'Employee', // Reference the Employee model
    default: null 
  },
  lastMessage: { type: String },
  lastSeen: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserChat', userSchema);