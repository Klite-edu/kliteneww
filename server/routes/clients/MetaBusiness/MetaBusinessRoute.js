const express = require('express');
const router = express.Router();
const Waba = require('../../../models/clients/MetaBusiness/MetaBusiness-model');

// Save Meta Access Token
router.post('/exchange-token', async (req, res) => {
    const { code } = req.body;
    const clientId = process.env.META_CLIENT_ID;
    const clientSecret = process.env.META_CLIENT_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;
  
    try {
      const tokenResponse = await axios.get(`https://graph.facebook.com/v22.0/oauth/access_token`, {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code: code
        }
      });
      res.json(tokenResponse.data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.post('/save-waba', async (req, res) => {
    const { waba_id, phone_number_id } = req.body;
  
    try {
      const newWaba = new Waba({ waba_id, phone_number_id });
      await newWaba.save();
      res.json({ success: true, waba_id, phone_number_id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;
