const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  waba_id: { type: String, required: true },
  agent_id: { type: String, default: null },
  status: { type: String, enum: ['pending', 'accepted', 'closed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ticketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
