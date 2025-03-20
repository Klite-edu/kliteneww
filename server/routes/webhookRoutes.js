// const express = require('express');
// const axios = require('axios');
// const router = express.Router();
// const Client = require('../models/clients/MetaBusiness/MetaClient-model');

// // ✅ External Chatbot API URL
// const CHATBOT_API_URL = 'https://chatbot.autopilotmybusiness.com/chat';

// // ✅ Webhook Verification Endpoint
// router.get('/webhook', (req, res) => {
//   const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

//   console.log("🔍 Incoming Webhook Verification Request:", req.query);

//   const mode = req.query['hub.mode'];
//   const token = req.query['hub.verify_token'];
//   const challenge = req.query['hub.challenge'];

//   if (mode === 'subscribe' && token === VERIFY_TOKEN) {
//     console.log("✅ Webhook Verified Successfully!");
//     res.status(200).send(challenge);
//   } else {
//     console.log("❌ Webhook Verification Failed! Token mismatch.");
//     res.sendStatus(403);
//   }
// });

// // ✅ Webhook Receiver with Chatbot Integration
// router.post('/webhook', async (req, res) => {
//   console.log("📩 Webhook Received:", JSON.stringify(req.body, null, 2));

//   if (req.body.entry) {
//     for (const entry of req.body.entry) {
//       const waba_id = entry.id; // ✅ WABA ID of the receiving business account

//       for (const change of entry.changes) {
//         console.log(`🔍 Checking Database for WABA ID: ${waba_id}`);
//         const client = await Client.findOne({ waba_id });

//         if (!client) {
//           console.log(`❌ No client found for WABA ID: ${waba_id}`);
//           continue;
//         }

//         console.log(`✅ Client Found: ${client.business_name} (WABA ID: ${client.waba_id})`);

//         if (change.value?.messages) {
//           for (const message of change.value.messages) {
//             const user_id = message.from; // ✅ Customer WhatsApp number (user_id)
//             const messageText = message.text?.body || '[No Text]'; // ✅ Message text

//             console.log(`📩 New Message from ${user_id}: ${messageText}`);

//             try {
//               console.log("🔄 Sending message to Chatbot API...");

//               // ✅ Send user_id, waba_id, and message to Chatbot API
//               const chatbotResponse = await axios.post(CHATBOT_API_URL, {
//                 user_id,           // Customer's WhatsApp number
//                 waba_id,           // Your business WABA ID
//                 message: messageText
//               });

//               console.log("✅ Chatbot API Response:", JSON.stringify(chatbotResponse.data, null, 2));

//               const chatbotReply = chatbotResponse.data.response || '🤖 Sorry, no response from chatbot.';
//               console.log(`🤖 Chatbot Reply: ${chatbotReply}`);

//               // ✅ Send Chatbot Reply back to Customer on WhatsApp
//               await sendWhatsAppMessage(client, user_id, chatbotReply);

//             } catch (error) {
//               console.error("❌ Error communicating with chatbot API:", error.message);
//               console.error("🛑 Chatbot API Error Details:", error.response?.data || error.message);
//             }
//           }
//         }
//       }
//     }
//   } else {
//     console.warn("⚠️ Webhook Received, but no valid 'entry' field found.");
//   }

//   res.sendStatus(200);
// });

// // ✅ Function to Send WhatsApp Message (Inside same file)
// async function sendWhatsAppMessage(client, to, message) {
//   try {
//     if (!client.access_token || !client.phone_number_id) {
//       throw new Error('❌ Client is missing access_token or phone_number_id');
//     }

//     console.log(`📤 Sending WhatsApp Message to ${to}: "${message}"`);

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

//     console.log("✅ WhatsApp Message Sent Successfully:", JSON.stringify(response.data, null, 2));
//     return response.data;

//   } catch (error) {
//     console.error("❌ Error sending WhatsApp message:", error.response?.data || error.message);
//     throw error;
//   }
// }

// module.exports = router;

const express = require("express");
const axios = require("axios");
const router = express.Router();
const Client = require("../models/clients/MetaBusiness/MetaClient-model");
const User = require("../models/clients/chat/userchat-model");
const Chat = require("../models/clients/chat/chat-model");
const Ticket = require("../models/clients/chat/ticket-model");
const { io } = require("../../server"); // Import the io object from server

const CHATBOT_API_URL = "https://chatbot.autopilotmybusiness.com/chat";

router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("GET /webhook - Verification request received");
  console.log("Mode:", mode);
  console.log("Token:", token);
  console.log("Challenge:", challenge);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.log("Webhook verification failed");
    res.sendStatus(403);
  }
});

router.post("/webhook", async (req, res) => {
  console.log("POST /webhook - Incoming webhook request");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  if (req.body.entry) {
    console.log("Processing entries in the webhook request");
    for (const entry of req.body.entry) {
      const waba_id = entry.id;
      console.log("Processing entry with waba_id:", waba_id);

      for (const change of entry.changes) {
        console.log("Processing change:", JSON.stringify(change, null, 2));

        const client = await Client.findOne({ waba_id });
        if (!client) {
          console.log("Client not found for waba_id:", waba_id);
          continue;
        }

        if (change.value?.messages) {
          console.log("Processing messages in the change");
          for (const message of change.value.messages) {
            const user_id = message.from;
            const messageText = message.text?.body || "[No Text]";
            console.log("Processing message from user_id:", user_id);
            console.log("Message text:", messageText);

            try {
              let userSession = await User.findOne({ user_id, waba_id });
              if (!userSession) {
                console.log("Creating new user session for user_id:", user_id);
                userSession = new User({ user_id, waba_id });
                await userSession.save();
              }

              const humanTriggers = ["human", "agent", "support", "help"];
              const requestHuman = humanTriggers.some((trigger) =>
                messageText.toLowerCase().includes(trigger)
              );

              if (requestHuman) {
                console.log("User requested human support");
                userSession.status = "human";
                await userSession.save();

                const existingTicket = await Ticket.findOne({ user_id, status: "pending" });
                if (!existingTicket) {
                  console.log("Creating new ticket for user_id:", user_id);
                  await Ticket.create({ user_id, waba_id, status: "pending" });
                }

                io.emit("newTicket", { user_id, waba_id, message: messageText });
                console.log("Emitted newTicket event to Socket.IO");

                const humanReply = "✅ You are now connected to a human agent. Please wait...";
                await sendWhatsAppMessage(client, user_id, humanReply);
                console.log("Sent human reply to user_id:", user_id);
                continue;
              }

              if (userSession.status === "human") {
                console.log("Forwarding message to human agent for user_id:", user_id);
                io.to(userSession.assignedAgent).emit("receiveMessage", {
                  user_id,
                  message: messageText,
                });
                console.log("Emitted receiveMessage event to assigned agent");

                await Chat.create({
                  user_id: user_id,
                  user_message: [messageText],
                  bot_response: [],
                  model: "human",
                });
                console.log("Saved human-handled message to Chat collection");
                continue;
              }

              console.log("Sending message to chatbot for user_id:", user_id);
              const chatbotResponse = await axios.post(CHATBOT_API_URL, {
                user_id,
                waba_id,
                message: messageText,
              });
              console.log("Received response from chatbot API:", chatbotResponse.data);

              const chatbotReply = chatbotResponse.data.response || "🤖 Sorry, no response from chatbot.";
              console.log("Chatbot reply:", chatbotReply);

              await Chat.create({
                user_id: user_id,
                user_message: [messageText],
                bot_response: [chatbotReply],
                model: "bot",
              });
              console.log("Saved bot-handled message to Chat collection");

              await sendWhatsAppMessage(client, user_id, chatbotReply);
              console.log("Sent chatbot reply to user_id:", user_id);
            } catch (error) {
              console.error("Webhook error:", error.message);
              console.error("Error stack:", error.stack);
            }
          }
        }
      }
    }
  } else {
    console.log("No entries found in the webhook request");
  }

  res.sendStatus(200);
});

async function sendWhatsAppMessage(client, to, message) {
  console.log("Sending WhatsApp message to:", to);
  console.log("Message:", message);

  if (!client.access_token || !client.phone_number_id) {
    console.error("Missing client access token or phone number ID");
    throw new Error("Missing client access token or phone number ID");
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${client.phone_number_id}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${client.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("WhatsApp message sent successfully:", response.data);
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error.message);
    console.error("Error details:", error.response?.data);
  }
}

module.exports = router;

// const express = require("express");
// const axios = require("axios");
// require("dotenv").config();  // Load environment variables

// const router = express.Router();

// // ✅ Environment Variables
// const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "klite";
// const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;  // From .env
// const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID || "514616105077754"; // Meta API
// const CHATBOT_API_URL = "https://chatbot.autopilotmybusiness.com/chat";  // 🔹 Your chatbot API URL

// // ✅ Webhook Verification (Required for Meta API)
// router.get("/webhook", (req, res) => {
//   console.log("🔍 Incoming Webhook Verification Request:", req.query);

//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode === "subscribe" && token === VERIFY_TOKEN) {
//     console.log("✅ Webhook Verified Successfully!");
//     res.status(200).send(challenge);
//   } else {
//     console.log("❌ Webhook Verification Failed! Token mismatch.");
//     res.status(403).send("Verification failed!");
//   }
// });

// // ✅ Webhook to Receive WhatsApp Messages and Forward to Chatbot API
// router.post("/webhook", async (req, res) => {
//   console.log("📩 Incoming Webhook Event:", JSON.stringify(req.body, null, 2));

//   if (req.body.object && req.body.entry) {
//     req.body.entry.forEach((entry) => {
//       entry.changes.forEach((change) => {
//         const value = change.value;
//         if (value.messages) {
//           value.messages.forEach(async (message) => {
//             const senderPhone = message.from;
//             const messageText = message.text?.body || "[No Text]";

//             console.log(`📩 New Message from ${senderPhone}: ${messageText}`);

//             try {
//               console.log("chatbotresponse entry point");
//               const chatbotResponse = await axios.post(CHATBOT_API_URL, { message: messageText });

//               console.log("chatbotresponse", chatbotResponse);

//               const chatbotReply = chatbotResponse.data.response;
//               console.log(`🤖 Chatbot Reply: ${chatbotReply}`);

//               // ✅ Send Chatbot Response to WhatsApp
//               await sendWhatsAppMessage(senderPhone, chatbotReply);

//             } catch (error) {
//               console.error("❌ Error communicating with chatbot API:", error.message);
//             }
//           });
//         }
//       });
//     });
