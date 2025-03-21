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
const Ticket = require("../../../models/clients/chat/ticket-model");
const User = require("../../../models/clients/chat/userchat-model");
const Chat = require("../../../models/clients/chat/chat-model");
const Client = require("../../../models/clients/MetaBusiness/MetaClient-model");
const Employee = require("../../../models/clients/contactdata");

// ✅ Assuming you're using sendWhatsAppMessage utility globally
const sendWhatsAppMessage = require("../../../utils/sendWhatsAppMessage");

module.exports = (io) => {
  /**
   * ✅ Accept Ticket
   */
  router.post("/accept", async (req, res) => {
    console.log("➡️ POST /ticket/accept called");
    const { ticket_id, agent_id } = req.body;

    try {
      const ticket = await Ticket.findById(ticket_id);
      if (!ticket || ticket.status !== "pending") {
        console.log("❌ Ticket not available or already accepted");
        return res.status(400).json({ error: "Ticket not available or already accepted" });
      }

      const employee = await Employee.findOne({ employeeID: agent_id });
      if (!employee) {
        console.log("❌ Agent not found in system");
        return res.status(400).json({ error: "Agent not found in the system" });
      }

      // ✅ Update ticket and user
      ticket.status = "accepted";
      ticket.agent_id = agent_id;
      await ticket.save();

      await User.findOneAndUpdate(
        { user_id: ticket.user_id },
        { status: "human", assignedAgent: agent_id }
      );

      const chatHistory = await Chat.find({ user_id: ticket.user_id });
      console.log(`✅ Ticket accepted & chat history fetched. Emitting chatAssigned to ${agent_id}`);

      io.to(agent_id).emit("chatAssigned", {
        ticket,
        chatHistory,
        agent: employee,
      });

      res.json({ message: "Ticket accepted", ticket });
    } catch (error) {
      console.error("❌ Error in /ticket/accept:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * ✅ Send Chat Message from Agent
   */
  router.post("/send", async (req, res) => {
    console.log("➡️ POST /ticket/send called");
    const { agent_id, user_id, message, waba_id } = req.body;

    try {
      const client = await Client.findOne({ waba_id });
      if (!client) {
        console.log("❌ Client not found for waba_id:", waba_id);
        return res.status(400).json({ error: "Client not found" });
      }

      const employee = await Employee.findOne({ employeeID: agent_id });
      if (!employee) {
        console.log("❌ Agent not found in system");
        return res.status(400).json({ error: "Agent not found" });
      }

      // ✅ Send the message via WhatsApp API
      await sendWhatsAppMessage(client, user_id, message);

      // ✅ Save the message in DB (agent's response)
      const newChat = await Chat.create({
        user_id,
        user_message: [],
        bot_response: [message],
        model: "human",
      });

      console.log("✅ Message saved & emitting to agent & user rooms");

      // ✅ Emit message back to agent and user rooms
      io.to(agent_id).emit("sendMessage", { user_id, message });
      io.to(user_id).emit("newMessage", {
        user_id,
        sender: 'agent',
        message
      });

      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("❌ Error in /ticket/send:", error.message);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  /**
   * ✅ End Chat Session
   */
  router.post("/end-session", async (req, res) => {
    console.log("➡️ POST /ticket/end-session called");
    const { user_id, agent_id } = req.body;

    try {
      await User.findOneAndUpdate(
        { user_id },
        { status: "bot", assignedAgent: null }
      );

      const updatedTicket = await Ticket.findOneAndUpdate(
        { user_id, status: "accepted" },
        { status: "closed" }
      );

      console.log("✅ Session ended, bot resumed & ticket closed");

      io.to(agent_id).emit("closeTicketPopup", { ticketId: user_id });

      res.json({ message: "Session ended successfully" });
    } catch (error) {
      console.error("❌ Error in /ticket/end-session:", error.message);
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  /**
   * ✅ Create Chatbot User
   */
  router.post("/chatbot", async (req, res) => {
    console.log("➡️ POST /ticket/chatbot called");
    try {
      const chat = await User.create(req.body);
      console.log("✅ Chatbot user created:", chat);
      res.status(201).json(chat);
    } catch (error) {
      console.error("❌ Error in POST /ticket/chatbot:", error.message);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * ✅ Get All Chatbot Users
   */
  router.get("/chatbot", async (req, res) => {
    console.log("➡️ GET /ticket/chatbot called");
    try {
      const chats = await User.find();
      console.log("✅ Chatbot users fetched");
      res.json(chats);
    } catch (error) {
      console.error("❌ Error in GET /ticket/chatbot:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * ✅ Get Unique Users
   */
  router.get("/chatbot/unique-users", async (req, res) => {
    console.log("➡️ GET /ticket/chatbot/unique-users called");
    try {
      const uniqueUsers = await User.distinct("user_id");
      console.log("✅ Unique users fetched:", uniqueUsers.length);
      res.json(uniqueUsers);
    } catch (error) {
      console.error("❌ Error in GET /ticket/chatbot/unique-users:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
