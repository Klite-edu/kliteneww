const express = require('express');
const router = express.Router();
// const WebhookLog = require('../../../models/clients/chatbot/chat-model');

// ✅ Get all webhook logs (limit to last 50 for performance)
router.get('/webhook-logs', async (req, res) => {
  try {
    const logs = await WebhookLog.find()
      .sort({ created_at: -1 })
      .limit(50);

    res.json(logs);
  } catch (err) {
    console.error('Error fetching webhook logs:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
