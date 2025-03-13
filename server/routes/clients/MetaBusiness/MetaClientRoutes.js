const express = require('express');
const router = express.Router();
const Client = require('../../../models/clients/MetaBusiness/MetaClient-model');
const subscribeWABA = require('../../../utils/subscribeWABA');

// Save WABA after embedded signup
router.post('/save-waba', async (req, res) => {
  const { business_name, waba_id, phone_number_id, access_token, token_expiry } = req.body;

  try {
    const newClient = new Client({ business_name, waba_id, phone_number_id, access_token, token_expiry });
    await newClient.save();

    // Subscribe to WABA Webhooks
    await subscribeWABA(waba_id, access_token);

    res.json({ success: true, client: newClient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get All Clients
router.get('/clients', async (req, res) => {
  const clients = await Client.find();
  res.json(clients);
});

module.exports = router;
