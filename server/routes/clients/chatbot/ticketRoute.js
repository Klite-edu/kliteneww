// const express = require("express");
// const router = express.Router();
// const Ticket = require("../../../models/clients/chat/ticket-model");
// const User = require("../../../models/clients/chat/userchat-model");
// const Chat = require("../../../models/clients/chat/chat-model");
// const Client = require("../../../models/clients/MetaBusiness/MetaClient-model");
// const Employee = require("../../../models/clients/contactdata"); // Assuming this is the correct path for your Employee model

// // Accept Ticket
// router.post("/accept", async (req, res) => {
//   console.log("POST /accept called");
//   const { ticket_id, agent_id } = req.body;
//   console.log("Request body:", req.body);

//   try {
//     const ticket = await Ticket.findById(ticket_id);
//     console.log("Fetched ticket:", ticket);

//     if (!ticket || ticket.status !== "pending") {
//       console.log("Ticket not available or already accepted");
//       return res.status(400).json({ error: "Ticket not available or already accepted" });
//     }

//     const employee = await Employee.findOne({ employeeID: agent_id });
//     console.log("Fetched employee:", employee);

//     if (!employee) {
//       console.log("Agent not found in the system");
//       return res.status(400).json({ error: "Agent not found in the system" });
//     }

//     ticket.status = "accepted";
//     ticket.agent_id = agent_id;
//     await ticket.save();
//     console.log("Ticket updated and saved:", ticket);

//     await User.findOneAndUpdate(
//       { user_id: ticket.user_id },
//       { status: "human", assignedAgent: agent_id }
//     );
//     console.log("User updated to human support");

//     const chatHistory = await Chat.find({ user_id: ticket.user_id });
//     console.log("Fetched chat history:", chatHistory);

//     io.to(agent_id).emit("chatAssigned", {
//       ticket,
//       chatHistory,
//       agent: employee,
//     });
//     console.log(`Emitted chatAssigned to agent ${agent_id}`);

//     res.json({ message: "Ticket accepted", ticket });
//   } catch (error) {
//     console.error("Error in /accept:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // Send Chat
// router.post("/send", async (req, res) => {
//   console.log("POST /chat/send called");
//   const { agent_id, user_id, message, waba_id } = req.body;
//   console.log("Request body:", req.body);

//   try {
//     const client = await Client.findOne({ waba_id });
//     console.log("Fetched client:", client);

//     if (!client) {
//       console.log("Client not found");
//       return res.status(400).json({ error: "Client not found" });
//     }

//     const employee = await Employee.findOne({ employeeID: agent_id });
//     console.log("Fetched employee:", employee);

//     if (!employee) {
//       console.log("Agent not found in the system");
//       return res.status(400).json({ error: "Agent not found in the system" });
//     }

//     await sendWhatsAppMessage(client, user_id, message);
//     console.log(`Message sent to user ${user_id} by agent ${agent_id}`);

//     const newChat = await Chat.create({
//       user_id,
//       user_message: [],
//       bot_response: [message],
//       model: "human",
//     });
//     console.log("New chat message saved:", newChat);

//     io.to(agent_id).emit("sendMessage", { user_id, message });
//     console.log(`Emitted sendMessage to agent ${agent_id}`);

//     res.json({ message: "Message sent" });
//   } catch (error) {
//     console.error("Error in /chat/send:", error);
//     res.status(500).json({ error: "Failed to send message" });
//   }
// });

// // End Chat Session
// router.post("/chat/end", async (req, res) => {
//   console.log("POST /chat/end called");
//   const { user_id } = req.body;
//   console.log("Request body:", req.body);

//   try {
//     const updatedUser = await User.findOneAndUpdate(
//       { user_id },
//       { status: "bot", assignedAgent: null }
//     );
//     console.log("User updated to bot mode:", updatedUser);

//     const updatedTicket = await Ticket.findOneAndUpdate(
//       { user_id, status: "accepted" },
//       { status: "closed" }
//     );
//     console.log("Ticket closed:", updatedTicket);

//     res.json({ message: "Session ended. Bot reactivated." });
//   } catch (error) {
//     console.error("Error in /chat/end:", error);
//     res.status(500).json({ error: "Failed to end session" });
//   }
// });

// // Create Chatbot User
// router.post("/chatbot", async (req, res) => {
//   console.log("POST /chatbot called");
//   console.log("Request body:", req.body);

//   try {
//     const chat = await User.create(req.body);
//     console.log("Chatbot user created:", chat);
//     res.status(201).json(chat);
//   } catch (error) {
//     console.error("Error in /chatbot:", error);
//     res.status(400).json({ error: error.message });
//   }
// });

// // Get All Chatbot Users
// router.get("/chatbot", async (req, res) => {
//   console.log("GET /chatbot called");

//   try {
//     const chats = await User.find();
//     console.log("Fetched chatbot users:", chats);
//     res.json(chats);
//   } catch (error) {
//     console.error("Error in GET /chatbot:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get Unique Users
// router.get("/chatbot/unique-users", async (req, res) => {
//   console.log("GET /chatbot/unique-users called");

//   try {
//     const uniqueUsers = await User.distinct("user_id");
//     console.log("Fetched unique user_ids:", uniqueUsers);
//     res.json(uniqueUsers);
//   } catch (error) {
//     console.error("Error in GET /chatbot/unique-users:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ Models
const Ticket = require("../../../models/clients/chat/ticket-model");
const User = require("../../../models/clients/chat/userchat-model");
const Chat = require("../../../models/clients/chat/chat-model");
const Client = require("../../../models/clients/MetaBusiness/MetaClient-model");
const Employee = require("../../../models/Admin/client-modal");

// ✅ Utility
const sendWhatsAppMessage = require("../../../utils/sendWhatsAppMessage");

// =====================================================
// ✅ ACCEPT TICKET
// =====================================================
router.post("/accept", async (req, res) => {
  console.log("➡️ [POST] /ticket/accept called");

  const { ticket_id, agent_id } = req.body;
  console.log(`📦 Received Payload ➡️ ticket_id: ${ticket_id}, agent_id: ${agent_id}`);

  try {
    const ticket = await Ticket.findById(ticket_id);
    console.log("🔍 Fetched Ticket:", ticket);

    if (!ticket || ticket.status !== "pending") {
      console.warn("❌ Invalid ticket. Either not found or already accepted.");
      return res.status(400).json({ error: "Invalid ticket" });
    }

    const agentObjectId = new mongoose.Types.ObjectId(agent_id);
    console.log("🆔 Converted agent_id to ObjectId:", agentObjectId);

    const employee = await Employee.findById(agentObjectId);
    console.log("👨‍💼 Fetched Agent/Employee:", employee);

    if (!employee) {
      console.warn("❌ Agent not found");
      return res.status(400).json({ error: "Agent not found" });
    }

    ticket.status = "accepted";
    ticket.agent_id = agentObjectId;
    await ticket.save();
    console.log(`✅ Ticket ${ticket_id} status updated to accepted.`);

    const updatedUser = await User.findOneAndUpdate(
      { user_id: ticket.user_id },
      { status: "human", assignedAgent: agentObjectId },
      { new: true }
    );
    console.log(`✅ Updated User:`, updatedUser);

    const chatHistory = await Chat.findOne({ user_id: ticket.user_id });
    console.log(`🗂️ Chat history fetched`);

    res.json({
      message: "Ticket accepted",
      ticket,
      chatHistory,
      agent: employee
    });
  } catch (error) {
    console.error("❌ Internal server error in /accept:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =====================================================
// ✅ SEND MESSAGE (Agent or Customer)
// =====================================================
router.post("/send", async (req, res) => {
  console.log("➡️ [POST] /ticket/send called");

  const { agent_id, user_id, message, waba_id, sender_type } = req.body;
  console.log(`📦 Received Payload ➡️ agent_id: ${agent_id}, user_id: ${user_id}, message: "${message}", waba_id: ${waba_id}, sender_type: ${sender_type}`);

  try {
    const client = await Client.findOne({ waba_id });
    console.log("🏢 Fetched Client:", client);

    if (!client) {
      console.warn("❌ Client not found for waba_id:", waba_id);
      return res.status(400).json({ error: "Client not found" });
    }

    // ✅ Send message on WhatsApp (if agent)
    if (sender_type === "agent") {
      console.log(`📤 Sending message from agent ${agent_id} to user ${user_id}`);
      await sendWhatsAppMessage(client, user_id, message);
      console.log("✅ WhatsApp message sent successfully.");
    }

    // ✅ Find or Create Chat Document
    let chat = await Chat.findOne({ user_id });
    if (!chat) {
      console.log("⚠️ No chat found. Creating a new one.");
      chat = new Chat({
        user_id,
        messages: [],
        model: sender_type === "agent" ? "human" : "bot"
      });
    }

    // ✅ Append message in the messages array
    const newMessage = {
      sender: sender_type === "customer" ? "user" : "agent",
      message,
      timestamp: new Date()
    };

    chat.messages.push(newMessage);
    await chat.save();
    console.log("✅ Chat updated successfully:", chat);

    res.json({ message: "Message saved", chat });
  } catch (error) {
    console.error("❌ Failed to send message:", error);
    res.status(500).json({ error: "Failed to send message" });
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
    const updatedUser = await User.findOneAndUpdate(
      { user_id },
      { status: "bot", assignedAgent: null },
      { new: true }
    );
    console.log("✅ User status updated back to bot:", updatedUser);

    const updatedTicket = await Ticket.findOneAndUpdate(
      { user_id, status: "accepted" },
      { status: "closed" },
      { new: true }
    );
    console.log("✅ Ticket closed:", updatedTicket);

    res.json({ message: "Session ended", updatedTicket, updatedUser });
  } catch (error) {
    console.error("❌ Failed to end session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

// =====================================================
// ✅ GET ALL CHATBOT USERS
// =====================================================
router.get("/chatbot", async (req, res) => {
  console.log("➡️ [GET] /ticket/chatbot called");

  try {
    const chats = await Chat.find();
    console.log(`✅ Retrieved ${chats.length} chatbot sessions`);

    res.json(chats);
  } catch (error) {
    console.error("❌ Error fetching chatbot users:", error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// ✅ GET UNIQUE USERS
// =====================================================
router.get("/chatbot/unique-users", async (req, res) => {
  console.log("➡️ [GET] /ticket/chatbot/unique-users called");

  try {
    // Fetch user_id and waba_id, exclude _id if not needed
    const uniqueUsers = await User.find({}, { user_id: 1, waba_id: 1, _id: 0 });

    console.log(`✅ Retrieved ${uniqueUsers.length} unique users with waba_id`);

    res.json(uniqueUsers);
  } catch (error) {
    console.error("❌ Error fetching unique users with waba_id:", error);
    res.status(500).json({ error: error.message });
  }
});


// =====================================================
// ✅ GET PENDING TICKETS
// =====================================================
router.get("/pending-tickets", async (req, res) => {
  console.log("➡️ [GET] /ticket/pending-tickets called");

  try {
    const pendingTickets = await Ticket.find({ status: "pending" });
    console.log(`✅ Retrieved ${pendingTickets.length} pending tickets`);

    res.json(pendingTickets);
  } catch (error) {
    console.error("❌ Error fetching pending tickets:", error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// ✅ GET ACCEPTED TICKETS FOR SPECIFIC AGENT
// =====================================================
router.get("/accepted-tickets/:agent_id", async (req, res) => {
  const { agent_id } = req.params;
  console.log(`➡️ [GET] /ticket/accepted-tickets/${agent_id} called`);

  try {
    const acceptedTickets = await Ticket.find({ status: "accepted", agent_id });
    console.log(`✅ Retrieved ${acceptedTickets.length} accepted tickets for agent_id ${agent_id}`);

    res.json(acceptedTickets);
  } catch (error) {
    console.error("❌ Error fetching accepted tickets:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
