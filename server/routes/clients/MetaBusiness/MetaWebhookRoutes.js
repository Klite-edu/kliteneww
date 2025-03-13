const express = require('express');
const router = express.Router();
const Client = require('../../../models/clients/MetaBusiness/MetaClient-model');
const sendWhatsAppMessage = require('../../../utils/sendWhatsAppMessage');

router.get('/', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/', async (req, res) => {
  console.log("📩 Webhook Received:", JSON.stringify(req.body, null, 2));

  if (req.body.entry) {
    for (const entry of req.body.entry) {
      for (const change of entry.changes) {
        const waba_id = change.value?.metadata?.waba_id;
        const client = await Client.findOne({ waba_id });

        if (change.value?.messages) {
          for (const message of change.value.messages) {
            const senderPhone = message.from;
            const messageText = message.text?.body || '[No Text]';
            
            // For example, send back a reply:
            await sendWhatsAppMessage(client, senderPhone, `You said: ${messageText}`);
          }
        }
      }
    }
  }

  res.sendStatus(200);
});

module.exports = router;
