// const express = require('express');
// const axios = require('axios');
// const router = express.Router();
// const Client = require('../../../models/clients/MetaBusiness/MetaClient-model');

// // ✅ External Chatbot API URL (Replace with your chatbot endpoint)
// const CHATBOT_API_URL = 'https://chatbot.autopilotmybusiness.com/chat';

// // ✅ Webhook Verification Endpoint (Same as before)
// router.get('/', (req, res) => {
//   const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

//   const mode = req.query['hub.mode'];
//   const token = req.query['hub.verify_token'];
//   const challenge = req.query['hub.challenge'];

//   if (mode === 'subscribe' && token === VERIFY_TOKEN) {
//     res.status(200).send(challenge);
//   } else {
//     res.sendStatus(403);
//   }
// });

// // ✅ Webhook Receiver with Chatbot Integration
// router.post('/', async (req, res) => {
//   console.log("📩 Webhook Received:", JSON.stringify(req.body, null, 2));

//   if (req.body.entry) {
//     for (const entry of req.body.entry) {
//       for (const change of entry.changes) {
//         const waba_id = change.value?.metadata?.waba_id;

//         // 1️⃣ Find the client by waba_id
//         const client = await Client.findOne({ waba_id });
//         if (!client) {
//           console.log(`❌ No client found for WABA ID: ${waba_id}`);
//           continue; // Skip this message if no client is found
//         }

//         if (change.value?.messages) {
//           for (const message of change.value.messages) {
//             const senderPhone = message.from;
//             const messageText = message.text?.body || '[No Text]';

//             console.log(`📩 New message from ${senderPhone}: ${messageText}`);

//             try {
//               // 2️⃣ Send message to Chatbot API
//               const chatbotResponse = await axios.post(CHATBOT_API_URL, {
//                 message: messageText
//               });

//               const chatbotReply = chatbotResponse.data.response || '🤖 Sorry, no response from chatbot.';
//               console.log(`🤖 Chatbot Reply: ${chatbotReply}`);

//               // 3️⃣ Send chatbot reply back to WhatsApp
//               await sendWhatsAppMessage(client, senderPhone, chatbotReply);

//             } catch (error) {
//               console.error('❌ Error in chatbot flow:', error.message);
//             }
//           }
//         }
//       }
//     }
//   }

//   res.sendStatus(200);
// });

// // ✅ Function to Send WhatsApp Message (Inside same file)
// async function sendWhatsAppMessage(client, to, message) {
//   try {
//     if (!client.access_token || !client.phone_number_id) {
//       throw new Error('Client is missing access_token or phone_number_id');
//     }

//     const response = await axios.post(
//       `https://graph.facebook.com/v18.0/${client.phone_number_id}/messages`,
//       {
//         messaging_product: 'whatsapp',
//         to: to,
//         type: 'text',
//         text: { body: message },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${client.access_token}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     console.log('✅ Message sent successfully:', response.data);
//     return response.data;

//   } catch (error) {
//     console.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
//   }
// }

// module.exports = router;
