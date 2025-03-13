const mongoose = require('mongoose');

const WebhookLogSchema = new mongoose.Schema({
  data: {
    type: Object,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('WebhookLog', WebhookLogSchema);
