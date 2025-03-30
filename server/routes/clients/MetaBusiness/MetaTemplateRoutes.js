const express = require('express');
const router = express.Router();
const axios = require('axios');
const Client = require('../../../models/clients/MetaBusiness/MetaClient-model');

// Get Templates for Client
router.get('/templates/:clientId', async (req, res) => {
  const client = await Client.findById(req.params.clientId);
  const url = `https://graph.facebook.com/v15.0/${client.waba_id}/message_templates`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${client.access_token}` }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Template
router.post('/templates/:clientId', async (req, res) => {
  const client = await Client.findById(req.params.clientId);
  const { name, language, components, category } = req.body;
  const url = `https://graph.facebook.com/v15.0/${client.waba_id}/message_templates`;

  try {
    const response = await axios.post(url, {
      name, language, components, category
    }, {
      headers: { Authorization: `Bearer ${client.access_token}` }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
