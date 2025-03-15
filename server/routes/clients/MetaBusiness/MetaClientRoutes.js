const express = require('express');
const axios = require('axios');
const router = express.Router();
const MetaClient = require('../../../models/clients/MetaBusiness/MetaClient-model');
const subscribeWABA = require('../../../utils/subscribeWABA');

// ✅ Get Meta App Credentials from Environment Variables
const META_CLIENT_ID = process.env.META_CLIENT_ID;
const META_CLIENT_SECRET = process.env.META_CLIENT_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI;

/**
 * 1️⃣ Exchange Token - Get Access Token from Meta
 */
router.post('/exchange-token', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
    }

    try {
        // ✅ Call Facebook API to exchange code for access_token
        const response = await axios.get(`https://graph.facebook.com/v22.0/oauth/access_token`, {
            params: {
                client_id: META_CLIENT_ID,
                client_secret: META_CLIENT_SECRET,
                redirect_uri: META_REDIRECT_URI,
                code: code
            }
        });

        const { access_token, expires_in } = response.data;
        const tokenExpiryDate = new Date();
        tokenExpiryDate.setSeconds(tokenExpiryDate.getSeconds() + expires_in);

        res.json({ access_token, token_expiry: tokenExpiryDate });

    } catch (err) {
        console.error('❌ Error exchanging token:', err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data || err.message });
    }
});

/**
 * 2️⃣ Save Client (After Embedded Signup)
 */
router.post('/save-waba', async (req, res) => {
    const { business_name, waba_id, phone_number_id, access_token, token_expiry } = req.body;

    if (!waba_id || !phone_number_id || !access_token) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // ✅ Check if the client already exists
        let client = await MetaClient.findOne({ waba_id });

        if (client) {
            // ✅ Update existing client data
            client.business_name = business_name;
            client.phone_number_id = phone_number_id;
            client.access_token = access_token;
            client.token_expiry = token_expiry;
        } else {
            // ✅ Create a new client entry
            client = new MetaClient({
                business_name,
                waba_id,
                phone_number_id,
                access_token,
                token_expiry,
                subscribed: false
            });
        }

        await client.save();

        // ✅ Subscribe WABA to Webhooks
        await subscribeWABA(waba_id, access_token);

        res.json({ success: true, client });

    } catch (err) {
        console.error('❌ Error saving WABA:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * 3️⃣ Get All Clients
 */
router.get('/clients', async (req, res) => {
    try {
        const clients = await MetaClient.find();
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
