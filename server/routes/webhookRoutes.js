const express = require("express");
const axios = require("axios");
require("dotenv").config();  // Load environment variables

const router = express.Router();

// ✅ Environment Variables
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "klite";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;  // From .env
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID || "514616105077754"; // Meta API
const CHATBOT_API_URL = "https://chatbot.autopilotmybusiness.com/chat";  // 🔹 Your chatbot API URL

// ✅ Webhook Verification (Required for Meta API)
router.get("/webhook", (req, res) => {
  console.log("🔍 Incoming Webhook Verification Request:", req.query);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified Successfully!");
    res.status(200).send(challenge);
  } else {
    console.log("❌ Webhook Verification Failed! Token mismatch.");
    res.status(403).send("Verification failed!");
  }
});

// ✅ Webhook to Receive WhatsApp Messages and Forward to Chatbot API
router.post("/webhook", async (req, res) => {
  console.log("📩 Incoming Webhook Event:", JSON.stringify(req.body, null, 2));

  if (req.body.object && req.body.entry) {
    req.body.entry.forEach((entry) => {
      entry.changes.forEach((change) => {
        const value = change.value;
        if (value.messages) {
          value.messages.forEach(async (message) => {
            const senderPhone = message.from;
            const messageText = message.text?.body || "[No Text]";

            console.log(`📩 New Message from ${senderPhone}: ${messageText}`);

            try {
              console.log("chatbotresponse entry point");
              const chatbotResponse = await axios.post(CHATBOT_API_URL, { message: messageText });
              console.log("chatbotresponse", chatbotResponse);
              
              const chatbotReply = chatbotResponse.data.response;
              console.log(`🤖 Chatbot Reply: ${chatbotReply}`);

              // ✅ Send Chatbot Response to WhatsApp
              await sendWhatsAppMessage(senderPhone, chatbotReply);

            } catch (error) {
              console.error("❌ Error communicating with chatbot API:", error.message);
            }
          });
        }
      });
    });

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ✅ Function to Send WhatsApp Message
async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Message Sent Successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error sending message:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = router;
