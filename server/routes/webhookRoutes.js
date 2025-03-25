const express = require("express");
const router = express.Router();
const axios = require("axios");

// ✅ Models
const Client = require("../models/clients/MetaBusiness/MetaClient-model");
const User = require("../models/clients/chat/userchat-model");
const Ticket = require("../models/clients/chat/ticket-model");
const Chat = require("../models/clients/chat/chat-model");
const Employee = require("../models/Admin/client-modal");

// ✅ Constants
const CHATBOT_API_URL = "https://chatbot.autopilotmybusiness.com/chat";

// ✅ Webhook Verification
router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.warn("❌ Webhook verification failed");
    res.sendStatus(403);
  }
});

// ✅ Webhook POST Handler
router.post("/webhook", async (req, res) => {
  console.log("➡️ POST /webhook called");

  if (!req.body.entry) {
    console.warn("❌ Invalid payload: missing 'entry'");
    return res.sendStatus(400);
  }

  try {
    for (const entry of req.body.entry) {
      const waba_id = entry.id;
      console.log(`🔍 Processing WABA ID: ${waba_id}`);

      const client = await Client.findOne({ waba_id });
      if (!client) {
        console.warn(`❌ Client not found for waba_id: ${waba_id}`);
        continue;
      }

      for (const change of entry.changes) {
        const value = change.value;
        if (!value?.messages) {
          console.warn("❌ No messages found in the change");
          continue;
        }

        for (const message of value.messages) {
          const user_id = message.from;
          const messageText = message.text?.body || "[No Text]";
          const timestamp = new Date();

          console.log(`📩 Incoming message from user ${user_id}: ${messageText}`);

          // ✅ Find or create User session
          let userSession = await User.findOne({ user_id, waba_id });
          if (!userSession) {
            userSession = new User({ user_id, waba_id });
            await userSession.save();
            console.log(`✅ Created new user session for ${user_id}`);
          }

          // ✅ Check if human support is requested
          const humanTriggers = ["human", "agent", "support", "help"];
          const requestHuman = humanTriggers.some(trigger =>
            messageText.toLowerCase().includes(trigger)
          );

          if (requestHuman) {
            console.log(`🔔 Human agent requested by user ${user_id}`);
            userSession.status = "human";
            await userSession.save();

            let ticket = await Ticket.findOne({ user_id, status: "pending" });
            if (!ticket) {
              ticket = await Ticket.create({ user_id, waba_id, status: "pending" });
              console.log(`✅ New ticket created for user ${user_id}`);
            }

            const humanReply = "✅ You are now connected to a human agent. Please wait...";
            await sendWhatsAppMessage(client, user_id, humanReply);

            // ✅ Append message to chat collection (user message only)
            await Chat.findOneAndUpdate(
              { user_id },
              {
                $push: {
                  messages: {
                    sender: "user",
                    message: messageText,
                    timestamp
                  }
                },
                $setOnInsert: {
                  user_id,
                  model: "human"
                }
              },
              { upsert: true, new: true }
            );

            continue; // Skip chatbot processing
          }

          if (userSession.status === "human" && userSession.assignedAgent) {
            console.log(`📥 User ${user_id} is in human support mode`);

            await Chat.findOneAndUpdate(
              { user_id },
              {
                $push: {
                  messages: {
                    sender: "user",
                    message: messageText,
                    timestamp
                  }
                },
                $setOnInsert: {
                  user_id,
                  model: "human"
                }
              },
              { upsert: true, new: true }
            );

            continue; // Skip bot processing, wait for human agent to respond
          }

          // ✅ Send message to chatbot API
          console.log(`🤖 Sending message to chatbot API for user ${user_id}`);
          const chatbotResponse = await axios.post(CHATBOT_API_URL, {
            user_id,
            waba_id,
            message: messageText
          });

          const chatbotReply = chatbotResponse.data.response || "🤖 No response from chatbot.";
          console.log(`🤖 Chatbot replied: ${chatbotReply}`);

          // ✅ Save both user message and bot reply to chat history
          await Chat.findOneAndUpdate(
            { user_id },
            {
              $push: {
                messages: [
                  {
                    sender: "user",
                    message: messageText,
                    timestamp
                  },
                  {
                    sender: "bot",
                    message: chatbotReply,
                    timestamp: new Date()
                  }
                ]
              },
              $setOnInsert: {
                user_id,
                model: "bot"
              }
            },
            { upsert: true, new: true }
          );

          // ✅ Send chatbot reply to user on WhatsApp
          await sendWhatsAppMessage(client, user_id, chatbotReply);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook processing error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ WhatsApp Message Sender
async function sendWhatsAppMessage(client, to, message) {
  if (!client.access_token || !client.phone_number_id) {
    console.warn("❌ Missing client access_token or phone_number_id");
    return;
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${client.phone_number_id}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${client.access_token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`✅ WhatsApp message sent to user ${to}`);
  } catch (error) {
    console.error("❌ WhatsApp send error:", error?.response?.data || error.message);
  }
}

module.exports = router;
