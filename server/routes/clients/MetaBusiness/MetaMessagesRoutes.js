const express = require('express');
const router = express.Router();
const Client = require('../../../models/clients/MetaBusiness/MetaClient-model');
const sendWhatsAppMessage = require('../../../utils/sendWhatsAppMessage');

// Send a message for a specific client
router.post('/send', async (req, res) => {
  const { clientId, to, message } = req.body;

  try {
    const client = await Client.findById(clientId);
    const result = await sendWhatsAppMessage(client, to, message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
