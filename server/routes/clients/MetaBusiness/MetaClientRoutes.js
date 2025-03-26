// const express = require('express');
// const axios = require('axios');
// const router = express.Router();
// const MetaClient = require('../../../models/clients/MetaBusiness/MetaClient-model');
// const subscribeWABA = require('../../../utils/subscribeWABA');

// // ✅ Get Meta App Credentials from Environment Variables
// const META_CLIENT_ID = process.env.META_CLIENT_ID;
// const META_CLIENT_SECRET = process.env.META_CLIENT_SECRET;
// const META_REDIRECT_URI = process.env.META_REDIRECT_URI;

// /**
//  * 1️⃣ Exchange Token - Get Access Token from Meta
//  */
// router.post('/exchange-token', async (req, res) => {
//     const { code } = req.body;

//     if (!code) {
//         return res.status(400).json({ error: 'Authorization code is required' });
//     }

//     try {
//         // ✅ Call Facebook API to exchange code for access_token
//         const response = await axios.get(`https://graph.facebook.com/v22.0/oauth/access_token`, {
//             params: {
//                 client_id: META_CLIENT_ID,
//                 client_secret: META_CLIENT_SECRET,
//                 redirect_uri: META_REDIRECT_URI,
//                 code: code
//             }
//         });

//         const { access_token, expires_in } = response.data;
//         const tokenExpiryDate = new Date();
//         tokenExpiryDate.setSeconds(tokenExpiryDate.getSeconds() + expires_in);

//         res.json({ access_token, token_expiry: tokenExpiryDate });

//     } catch (err) {
//         console.error('❌ Error exchanging token:', err.response?.data || err.message);
//         res.status(500).json({ error: err.response?.data || err.message });
//     }
// });

// /**
//  * 2️⃣ Save Client (After Embedded Signup)
//  */
// router.post('/save-waba', async (req, res) => {
//     const { business_name, waba_id, phone_number_id, access_token, token_expiry } = req.body;

//     if (!waba_id || !phone_number_id || !access_token) {
//         return res.status(400).json({ error: 'Missing required parameters' });
//     }

//     try {
//         // ✅ Check if the client already exists
//         let client = await MetaClient.findOne({ waba_id });

//         if (client) {
//             // ✅ Update existing client data
//             client.business_name = business_name;
//             client.phone_number_id = phone_number_id;
//             client.access_token = access_token;
//             client.token_expiry = token_expiry;
//         } else {
//             // ✅ Create a new client entry
//             client = new MetaClient({
//                 business_name,
//                 waba_id,
//                 phone_number_id,
//                 access_token,
//                 token_expiry,
//                 subscribed: false
//             });
//         }

//         await client.save();

//         // ✅ Subscribe WABA to Webhooks
//         await subscribeWABA(waba_id, access_token);

//         res.json({ success: true, client });

//     } catch (err) {
//         console.error('❌ Error saving WABA:', err);
//         res.status(500).json({ error: err.message });
//     }
// });

// /**
//  * 3️⃣ Get All Clients
//  */
// router.get('/clients', async (req, res) => {
//     try {
//         const clients = await MetaClient.find();
//         res.json(clients);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// module.exports = router;

const express = require("express");
const axios = require("axios");
const router = express.Router();

// Models & Utils
const MetaClient = require("../../../models/clients/MetaBusiness/MetaClient-model");
const subscribeWABA = require("../../../utils/subscribeWABA");

// ✅ Get Meta App Credentials from Environment Variables
const META_CLIENT_ID = process.env.META_CLIENT_ID;
const META_CLIENT_SECRET = process.env.META_CLIENT_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI;

/**
 * 1️⃣ Exchange Token - Get Access Token from Meta
 */
router.post("/exchangetoken", async (req, res) => {
  console.log("\n=== 🔵 STARTING TOKEN EXCHANGE PROCESS ===");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("➡️ Incoming Request Body:", JSON.stringify(req.body, null, 2));

  const { code } = req.body;

  if (!code) {
    console.error("❗ ERROR: Authorization code missing in request body");
    console.log("=== 🔴 TOKEN EXCHANGE FAILED ===");
    return res.status(400).json({
      success: false,
      message: "Authorization code is required",
    });
  }

  console.log("⚙️ Building token exchange request to Meta API...");
  console.log("🔗 Endpoint: https://graph.facebook.com/v22.0/oauth/access_token");
  console.log("🔁 Redirect URI:", META_REDIRECT_URI);

  try {
    const response = await axios.get(
      "https://graph.facebook.com/v22.0/oauth/access_token",
      {
        params: {
          client_id: META_CLIENT_ID,
          client_secret: META_CLIENT_SECRET,
          redirect_uri: META_REDIRECT_URI,
          code: code,
        },
      }
    );

    const { access_token } = response.data;

    console.log("\n✅ SUCCESS: Token exchange response received");
    console.log("🔑 Access Token:", access_token);
    console.log("=== 🟢 TOKEN EXCHANGE COMPLETED ===");

    return res.status(200).json({
      success: true,
      access_token,
    });
  } catch (err) {
    console.error("\n❌ ERROR: Token exchange failed");
    console.error("🔴 Error:", err?.response?.data || err.message);
    console.log("=== 🔴 TOKEN EXCHANGE FAILED ===");
    return res.status(500).json({
      success: false,
      error: err?.response?.data || err.message,
    });
  }
});

/**
 * 2️⃣ Save Client (After Embedded Signup)
 */
router.post("/savewaba", async (req, res) => {
  console.log("\n=== 🔵 STARTING WABA SAVE PROCESS ===");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("➡️ Incoming Request Body:", JSON.stringify(req.body, null, 2));

  const {
    business_name,
    waba_id,
    phone_number_id,
    access_token,
    apiKey,
    model,
    instructionFile,
  } = req.body;

  const requiredFields = { waba_id, phone_number_id, access_token };
  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.error("❗ ERROR: Missing required fields:", missingFields);
    console.log("=== 🔴 WABA SAVE FAILED ===");
    return res.status(400).json({
      success: false,
      message: `Missing required parameters: ${missingFields.join(", ")}`,
    });
  }

  try {
    let client = await MetaClient.findOne({ waba_id });

    if (client) {
      console.log("✅ Existing client found, updating...");
      client.business_name = business_name || client.business_name;
      client.phone_number_id = phone_number_id;
      client.access_token = access_token;
      client.apiKey = apiKey || client.apiKey;
      client.model = model || client.model;
      client.instructionFile = instructionFile || client.instructionFile;
    } else {
      console.log("🆕 No existing client, creating new...");
      client = new MetaClient({
        business_name,
        waba_id,
        phone_number_id,
        access_token,
        apiKey,
        model,
        instructionFile,
        subscribed: false,
      });
    }

    await client.save();
    console.log("💾 Client saved successfully:", client);

    if (!client.subscribed) {
      try {
        console.log("⏳ Subscribing to webhook...");
        await subscribeWABA(waba_id, access_token);
        client.subscribed = true;
        await client.save();
        console.log("✅ Subscribed and updated successfully");
      } catch (subErr) {
        console.error("❌ Webhook subscription failed:", subErr.message);
        return res.status(500).json({
          success: false,
          error: "Client saved but failed to subscribe to webhooks.",
          details: subErr.message,
        });
      }
    }

    console.log("=== 🟢 WABA SAVE PROCESS COMPLETED ===");
    return res.status(200).json({
      success: true,
      message: "Client saved and webhook subscription checked/initiated.",
      client,
    });
  } catch (err) {
    console.error("\n❌ ERROR: WABA save process failed");
    console.error("Error:", err.message);
    console.log("=== 🔴 WABA SAVE FAILED ===");
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;