const express = require("express");
const router = express.Router();
const Ticket = require("../../../models/clients/chat/ticket-model");
const UserChat = require("../../../models/clients/chat/userchat-model");
const Chat = require("../../../models/clients/chat/chat-model");
const MetaClient = require("../../../models/clients/MetaBusiness/MetaClient-model");
const Employee = require("../../../models/clients/contactdata"); // Assuming this is the correct path for your Employee model

router.post("/accept", async (req, res) => {
  const { ticket_id, agent_id } = req.body;

  // Find the ticket by ID
  const ticket = await Ticket.findById(ticket_id);

  if (!ticket || ticket.status !== "pending") {
    return res
      .status(400)
      .json({ error: "Ticket not available or already accepted" });
  }

  // Fetch employee details from Employee model using the agent_id
  const employee = await Employee.findOne({ employeeID: agent_id });
  if (!employee) {
    return res.status(400).json({ error: "Agent not found in the system" });
  }

  // Update ticket with agent_id and status
  ticket.status = "accepted";
  ticket.agent_id = agent_id; // This now references the Employee model
  await ticket.save();

  // Update user chat with the assigned agent information
  await UserChat.findOneAndUpdate(
    { user_id: ticket.user_id },
    { status: "human", assignedAgent: agent_id } // This now references the Employee model
  );

  // Fetch the chat history of the user
  const chatHistory = await Chat.find({ user_id: ticket.user_id });

  // Emit event to the agent with chat history and ticket details
  io.to(agent_id).emit("chatAssigned", {
    ticket,
    chatHistory,
    agent: employee,
  });

  res.json({ message: "Ticket accepted", ticket });
});
router.post("/chat/send", async (req, res) => {
  const { agent_id, user_id, message, waba_id } = req.body;

  // Fetch MetaClient using waba_id
  const client = await MetaClient.findOne({ waba_id });
  if (!client) return res.status(400).json({ error: "Client not found" });

  // Fetch employee details from Employee model using the agent_id
  const employee = await Employee.findOne({ employeeID: agent_id });
  if (!employee) {
    return res.status(400).json({ error: "Agent not found in the system" });
  }

  try {
    // Send message to WhatsApp using external function (not shown in the code)
    await sendWhatsAppMessage(client, user_id, message);

    // Save chat record
    await Chat.create({
      user_id: user_id,
      user_message: [],
      bot_response: [message],
      model: "human",
    });

    // Emit message to agent in real-time
    io.to(agent_id).emit("sendMessage", { user_id, message });

    res.json({ message: "Message sent" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/chat/end", async (req, res) => {
  const { user_id } = req.body;

  // Update UserChat status to bot and clear assigned agent
  await UserChat.findOneAndUpdate(
    { user_id },
    { status: "bot", assignedAgent: null } // Clear the reference to the Employee model
  );

  // Close the ticket by changing status to closed
  await Ticket.findOneAndUpdate(
    { user_id, status: "accepted" },
    { status: "closed" }
  );

  res.json({ message: "Session ended. Bot reactivated." });
});

router.post("/chatbot", async (req, res) => {
  try {
    const chat = await UserChat.create(req.body);
    res.status(201).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/chatbot", async (req, res) => {
  try {
    const chats = await UserChat.find();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/chatbot/unique-users", async (req, res) => {
  try {
    const uniqueUsers = await UserChat.distinct("user_id");
    res.json(uniqueUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
