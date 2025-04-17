const express = require("express");
const router = express.Router();
const dbMiddleware = require("../../../middlewares/dbMiddleware");
const axios = require('axios');

// Apply the dbMiddleware to all routes in this router
router.use(dbMiddleware);

// =====================================================
// ✅ ACCEPT TICKET
// =====================================================
router.post("/accept", async (req, res) => {
  console.log("➡️ [POST] /ticket/accept called");

  const { ticket_id, agent_id } = req.body;

  if (!ticket_id || !agent_id) {
    console.error("❌ Missing required fields:", { ticket_id, agent_id });
    return res.status(400).json({
      error: "Missing required fields",
      received: req.body,
    });
  }

  console.log(`📦 Received Payload ➡️ ticket_id: ${ticket_id}, agent_id: ${agent_id}`);

  try {
    const ticket = await req.Ticket.findById(ticket_id);
    console.log("🔍 Fetched Ticket:", ticket);

    if (!ticket || ticket.status !== "pending") {
      console.warn("❌ Invalid ticket. Either not found or already accepted.");
      return res.status(400).json({ error: "Invalid ticket" });
    }

    const employee = await req.Employee.findById(agent_id);
    console.log("👨‍💼 Fetched Agent/Employee:", employee);

    if (!employee) {
      console.warn("❌ Agent not found");
      return res.status(400).json({ error: "Agent not found" });
    }

    ticket.status = "accepted";
    ticket.agent_id = agent_id;
    await ticket.save();
    console.log(`✅ Ticket ${ticket_id} status updated to accepted.`);

    const updatedUser = await req.UserChat.findOneAndUpdate(
      { user_id: ticket.user_id },
      { status: "human", assignedAgent: agent_id },
      { new: true }
    );
    console.log(`✅ Updated User:`, updatedUser);

    const chatHistory = await req.Chat.findOne({ user_id: ticket.user_id });
    console.log(`🗂️ Chat history fetched`);

    res.json({
      message: "Ticket accepted",
      ticket,
      chatHistory,
      agent: employee,
    });
  } catch (error) {
    console.error("❌ Internal server error in /accept:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
});

// =====================================================
// ✅ SEND MESSAGE (Agent or Customer)
// =====================================================
router.post("/send", async (req, res) => {
  console.log("➡️ [POST] /ticket/send called");

  const { agent_id, user_id, message, waba_id, sender_type } = req.body;
  
  // Input validation
  if (!agent_id || !user_id || !message || !waba_id || !sender_type) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["agent_id", "user_id", "message", "waba_id", "sender_type"]
    });
  }

  console.log(`📦 Received Payload ➡️ agent_id: ${agent_id}, user_id: ${user_id}, message: "${message}", waba_id: ${waba_id}, sender_type: ${sender_type}`);

  try {
    const client = await req.MetaClient.findOne({ waba_id });
    console.log("🏢 Fetched Client:", client);

    if (!client) {
      console.warn("❌ Client not found for waba_id:", waba_id);
      return res.status(400).json({ error: "Client not found" });
    }

    // WhatsApp message validation
    if (sender_type === "agent" && message.length > 4096) {
      return res.status(400).json({ 
        error: "Message too long",
        maxLength: 4096 
      });
    }

    // Send WhatsApp message (if agent)
    if (sender_type === "agent") {
      try {
        console.log(`📤 Sending message from agent ${agent_id} to user ${user_id}`);
        console.log("WhatsApp message payload:", {
          phone_number_id: client.phone_number_id,
          to: user_id,
          message_length: message.length
        });

        await sendWhatsAppMessage(client, user_id, message);
        console.log("✅ WhatsApp message sent successfully.");
      } catch (error) {
        console.error("❌ Failed to send WhatsApp message:", error);
        return res.status(500).json({ 
          error: "Failed to send WhatsApp message",
          details: error.message 
        });
      }
    }

    // Find or Create Chat Document
    let chat = await req.Chat.findOne({ user_id });
    if (!chat) {
      console.log("⚠️ No chat found. Creating a new one.");
      chat = new req.Chat({
        user_id,
        messages: [],
        model: sender_type === "agent" ? "human" : "bot",
      });
    }

    // Append message
    const newMessage = {
      sender: sender_type === "customer" ? "user" : "agent",
      message,
      timestamp: new Date(),
    };

    chat.messages.push(newMessage);
    await chat.save();
    console.log("✅ Chat updated successfully:", chat);

    res.json({ 
      message: "Message saved", 
      chat,
      whatsappSuccess: sender_type === "agent"
    });
  } catch (error) {
    console.error("❌ Failed to send message:", error);
    res.status(500).json({ 
      error: "Failed to send message",
      details: error.message 
    });
  }
});

// =====================================================
// ✅ END SESSION
// =====================================================
router.post("/end-session", async (req, res) => {
  console.log("➡️ [POST] /ticket/end-session called");

  const { user_id, agent_id } = req.body;
  console.log(`📦 Received Payload ➡️ user_id: ${user_id}, agent_id: ${agent_id}`);

  try {
    const updatedUser = await req.UserChat.findOneAndUpdate(
      { user_id },
      { status: "bot", assignedAgent: null },
      { new: true }
    );
    console.log("✅ User status updated back to bot:", updatedUser);

    const updatedTicket = await req.Ticket.findOneAndUpdate(
      { user_id, status: "accepted" },
      { status: "closed" },
      { new: true }
    );
    console.log("✅ Ticket closed:", updatedTicket);

    res.json({ 
      message: "Session ended", 
      updatedTicket, 
      updatedUser 
    });
  } catch (error) {
    console.error("❌ Failed to end session:", error);
    res.status(500).json({ 
      error: "Failed to end session",
      details: error.message 
    });
  }
});

// =====================================================
// ✅ GET ALL CHATBOT USERS
// =====================================================
router.get("/chatbot", async (req, res) => {
  console.log("➡️ [GET] /ticket/chatbot called");

  try {
    const chats = await req.Chat.find();
    console.log(`✅ Retrieved ${chats.length} chatbot sessions`);

    res.json(chats);
  } catch (error) {
    console.error("❌ Error fetching chatbot users:", error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// =====================================================
// ✅ GET UNIQUE USERS
// =====================================================
router.get("/chatbot/unique-users", async (req, res) => {
  console.log("➡️ [GET] /ticket/chatbot/unique-users called");

  try {
    if (!req.UserChat) {
      console.error("❌ UserChat model is not attached to request");
      return res.status(500).json({
        error: "Internal server error - UserChat model not available",
      });
    }

    const uniqueUsers = await req.UserChat.find(
      {},
      { user_id: 1, waba_id: 1, _id: 0 }
    ).lean();

    console.log(`✅ Retrieved ${uniqueUsers.length} unique users with waba_id`);
    res.json(uniqueUsers);
  } catch (error) {
    console.error("❌ Error fetching unique users with waba_id:", error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// =====================================================
// ✅ GET PENDING TICKETS
// =====================================================
router.get("/pending-tickets", async (req, res) => {
  console.log("➡️ [GET] /ticket/pending-tickets called");

  try {
    const pendingTickets = await req.Ticket.find({ status: "pending" });
    console.log(`✅ Retrieved ${pendingTickets.length} pending tickets`);
    res.json(pendingTickets);
  } catch (error) {
    console.error("❌ Error fetching pending tickets:", error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// =====================================================
// ✅ GET ACCEPTED TICKETS FOR SPECIFIC AGENT
// =====================================================
router.get("/accepted-tickets/:agent_id", async (req, res) => {
  const { agent_id } = req.params;
  console.log(`➡️ [GET] /ticket/accepted-tickets/${agent_id} called`);

  try {
    const acceptedTickets = await req.Ticket.find({
      status: "accepted",
      agent_id,
    });
    console.log(`✅ Retrieved ${acceptedTickets.length} accepted tickets`);
    res.json(acceptedTickets);
  } catch (error) {
    console.error("❌ Error fetching accepted tickets:", error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// WhatsApp Message Sender Function
async function sendWhatsAppMessage(client, to, message) {
  if (!client.access_token || !client.phone_number_id) {
    throw new Error("Missing WhatsApp client credentials");
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
        },
        timeout: 10000 // 10 seconds timeout
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ WhatsApp API Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

module.exports = router;