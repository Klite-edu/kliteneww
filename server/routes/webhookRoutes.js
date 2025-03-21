

// const express = require("express");
// const axios = require("axios");
// const Client = require("../models/clients/MetaBusiness/MetaClient-model");
// const User = require("../models/clients/chat/userchat-model");
// const Chat = require("../models/clients/chat/chat-model");
// const Ticket = require("../models/clients/chat/ticket-model");
// const Employee = require("../models/clients/contactdata");

// const CHATBOT_API_URL = 'https://chatbot.autopilotmybusiness.com/chat';

// module.exports = (io) => {
//   const router = express.Router();

//   // WHATSAPP WEBHOOKS
//   router.get("/webhook", (req, res) => {
//     const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
//     const mode = req.query["hub.mode"];
//     const token = req.query["hub.verify_token"];
//     const challenge = req.query["hub.challenge"];

//     console.log("GET /webhook - Verification request received");
//     console.log("Mode:", mode);
//     console.log("Token:", token);
//     console.log("Challenge:", challenge);

//     if (mode === "subscribe" && token === VERIFY_TOKEN) {
//       console.log("Webhook verified successfully");
//       res.status(200).send(challenge);
//     } else {
//       console.log("Webhook verification failed");
//       res.sendStatus(403);
//     }
//   });

//   router.post("/webhook", async (req, res) => {
//     console.log("POST /webhook - Incoming webhook request");
//     console.log("Request body:", JSON.stringify(req.body, null, 2));

//     if (req.body.entry) {
//       console.log("Processing entries...");
//       for (const entry of req.body.entry) {
//         console.log("Processing entry:", entry);
//         const waba_id = entry.id;
//         console.log("WABA ID:", waba_id);

//         const client = await Client.findOne({ waba_id });
//         console.log("Client found:", client);

//         if (!client) {
//           console.log("Client not found for WABA ID:", waba_id);
//           continue;
//         }

//         for (const change of entry.changes) {
//           console.log("Processing change:", change);
//           if (change.value?.messages) {
//             console.log("Processing messages...");
//             for (const message of change.value.messages) {
//               console.log("Processing message:", message);
//               const user_id = message.from;
//               const messageText = message.text?.body || "[No Text]";
//               console.log("User ID:", user_id);
//               console.log("Message Text:", messageText);

//               try {
//                 let userSession = await User.findOne({ user_id, waba_id });
//                 console.log("User session found:", userSession);

//                 if (!userSession) {
//                   console.log("Creating new user session...");
//                   userSession = new User({ user_id, waba_id });
//                   await userSession.save();
//                   console.log("New user session created:", userSession);
//                 }

//                 const humanTriggers = ["human", "agent", "support", "help"];
//                 const requestHuman = humanTriggers.some(trigger => messageText.toLowerCase().includes(trigger));
//                 console.log("Request human:", requestHuman);

//                 if (requestHuman) {
//                   console.log("User requested human agent");
//                   userSession.status = "human";
//                   await userSession.save();
//                   console.log("User session updated to human:", userSession);

//                   const existingTicket = await Ticket.findOne({ user_id, status: "pending" });
//                   console.log("Existing ticket found:", existingTicket);

//                   if (!existingTicket) {
//                     console.log("Creating new ticket...");
//                     await Ticket.create({ user_id, waba_id, status: "pending" });
//                     console.log("New ticket created");
//                   }

//                   // Emit event using the passed io instance
//                   console.log("Emitting ticketRaised event...");
//                   io.emit("ticketRaised", { user_id, waba_id, message: messageText });

//                   const humanReply = "✅ You are now connected to a human agent. Please wait...";
//                   console.log("Sending human reply:", humanReply);
//                   await sendWhatsAppMessage(client, user_id, humanReply);
//                   continue;
//                 }

//                 if (userSession.status === "human") {
//                   console.log("User is already connected to a human agent");
//                   io.to(userSession.assignedAgent).emit("receiveMessage", {
//                     user_id,
//                     message: messageText,
//                   });
//                   console.log("Message forwarded to assigned agent");

//                   await Chat.create({
//                     user_id,
//                     user_message: [messageText],
//                     bot_response: [],
//                     model: "human",
//                   });
//                   console.log("Chat log created for human interaction");
//                   continue;
//                 }

//                 console.log("Sending message to chatbot...");
//                 const chatbotResponse = await axios.post(CHATBOT_API_URL, {
//                   user_id,
//                   waba_id,
//                   message: messageText,
//                 });
//                 console.log("Chatbot response received:", chatbotResponse.data);

//                 const chatbotReply = chatbotResponse.data.response || "🤖 Sorry, no response from chatbot.";
//                 console.log("Chatbot reply:", chatbotReply);

//                 await Chat.create({
//                   user_id,
//                   user_message: [messageText],
//                   bot_response: [chatbotReply],
//                   model: "bot",
//                 });
//                 console.log("Chat log created for bot interaction");

//                 console.log("Sending chatbot reply to user...");
//                 await sendWhatsAppMessage(client, user_id, chatbotReply);
//               } catch (error) {
//                 console.error("Webhook error:", error.message);
//                 console.error("Error stack:", error.stack);
//               }
//             }
//           }
//         }
//       }
//     }

//     console.log("Webhook processing complete");
//     res.sendStatus(200);
//   });

//   async function sendWhatsAppMessage(client, to, message) {
//     if (!client.access_token || !client.phone_number_id) {
//       console.error("Missing client access token or phone number ID");
//       throw new Error("Missing client access token or phone number ID");
//     }

//     console.log("Sending WhatsApp message...");
//     console.log("To:", to);
//     console.log("Message:", message);

//     try {
//       const response = await axios.post(
//         `https://graph.facebook.com/v18.0/${client.phone_number_id}/messages`,
//         {
//           messaging_product: "whatsapp",
//           to,
//           type: "text",
//           text: { body: message },
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${client.access_token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       console.log("WhatsApp message sent successfully");
//       console.log("Response:", response.data);
//     } catch (error) {
//       console.error("Failed to send WhatsApp message:", error.message);
//       console.error("Error response:", error.response?.data);
//     }
//   }

//   return router;
// };


const express = require("express");
const router = express.Router();
const axios = require("axios");

const Client = require("../models/clients/MetaBusiness/MetaClient-model");
const User = require("../models/clients/chat/userchat-model");
const Ticket = require("../models/clients/chat/ticket-model");
const Chat = require("../models/clients/chat/chat-model");

// If you have a separate sendWhatsAppMessage utility, import that
// const sendWhatsAppMessage = require("../utils/sendWhatsAppMessage");

const CHATBOT_API_URL = 'https://chatbot.autopilotmybusiness.com/chat';

module.exports = (io) => {

  // ✅ WhatsApp verification endpoint
  router.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified");
      res.status(200).send(challenge);
    } else {
      console.log("❌ Webhook verification failed");
      res.sendStatus(403);
    }
  });

  // ✅ Webhook handler
  router.post("/webhook", async (req, res) => {
    console.log("➡️ Incoming webhook payload:", JSON.stringify(req.body));

    if (!req.body.entry) {
      console.log("❌ No entry found in webhook payload");
      return res.sendStatus(400);
    }

    for (const entry of req.body.entry) {
      const waba_id = entry.id;
      const client = await Client.findOne({ waba_id });

      if (!client) {
        console.log(`❌ Client not found for waba_id: ${waba_id}`);
        continue;
      }

      for (const change of entry.changes) {
        const value = change.value;

        // ✅ Handle messages
        if (value?.messages) {
          for (const message of value.messages) {
            const user_id = message.from;
            const messageText = message.text?.body || "[No Text]";
            console.log(`➡️ Message received from user ${user_id}:`, messageText);

            try {
              let userSession = await User.findOne({ user_id, waba_id });

              if (!userSession) {
                userSession = new User({ user_id, waba_id });
                await userSession.save();
                console.log(`✅ New user session created for user_id: ${user_id}`);
              }

              const humanTriggers = ["human", "agent", "support", "help"];
              const requestHuman = humanTriggers.some(trigger => messageText.toLowerCase().includes(trigger));

              // ✅ Human request flow
              if (requestHuman) {
                userSession.status = "human";
                await userSession.save();
                console.log(`✅ Human support requested by user_id: ${user_id}`);

                const existingTicket = await Ticket.findOne({ user_id, status: "pending" });

                if (!existingTicket) {
                  const newTicket = await Ticket.create({ user_id, waba_id, status: "pending" });
                  console.log(`✅ New ticket created: ${newTicket._id}`);

                  io.to("agents").emit("ticketRaised", {
                    ticketId: newTicket._id,
                    userName: userSession.userName || user_id,
                    user_id,
                    waba_id,
                    message: messageText
                  });

                  console.log(`✅ ticketRaised event emitted for NEW ticket: ${newTicket._id}`);
                } else {
                  console.log(`⚠️ Ticket already exists for user_id: ${user_id}, ticketId: ${existingTicket._id}`);

                  io.to("agents").emit("ticketRaised", {
                    ticketId: existingTicket._id,
                    userName: userSession.userName || user_id,
                    user_id,
                    waba_id,
                    message: messageText
                  });

                  console.log(`✅ ticketRaised event emitted for EXISTING ticket: ${existingTicket._id}`);
                }

                // ✅ Notify the user on WhatsApp
                const humanReply = "✅ You are now connected to a human agent. Please wait...";
                await sendWhatsAppMessage(client, user_id, humanReply);

                continue; // Stop processing this message further
              }

              // ✅ If user is already assigned to a human agent
              if (userSession.status === "human" && userSession.assignedAgent) {
                io.to(userSession.assignedAgent).emit("receiveMessage", {
                  user_id,
                  message: messageText
                });

                await Chat.create({
                  user_id,
                  user_message: [messageText],
                  bot_response: [],
                  model: "human"
                });

                console.log(`✅ Message sent to assigned agent: ${userSession.assignedAgent}`);
                continue; // Stop processing this message further
              }

              // ✅ Chatbot fallback if not in human mode
              const chatbotResponse = await axios.post(CHATBOT_API_URL, {
                user_id,
                waba_id,
                message: messageText
              });

              const chatbotReply = chatbotResponse.data.response || "🤖 Sorry, no response from chatbot.";

              await Chat.create({
                user_id,
                user_message: [messageText],
                bot_response: [chatbotReply],
                model: "bot"
              });

              await sendWhatsAppMessage(client, user_id, chatbotReply);

              console.log("✅ Bot response sent:", chatbotReply);

            } catch (error) {
              console.error(`❌ Webhook processing error for user ${user_id}:`, error.message);
            }
          }
        }
      }
    }

    res.sendStatus(200);
  });

  // ✅ Send WhatsApp message helper (if not using external utility)
  async function sendWhatsAppMessage(client, to, message) {
    if (!client.access_token || !client.phone_number_id) {
      console.error("❌ Missing client access token or phone number ID");
      return;
    }

    try {
      const response = await axios.post(
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

      console.log(`✅ WhatsApp message sent successfully to ${to}:`, response.data);
    } catch (error) {
      console.error(`❌ Failed to send WhatsApp message to ${to}:`, error.response?.data);
    }
  }

  return router;
};
