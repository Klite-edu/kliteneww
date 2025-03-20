const express = require("express");
const router = express.Router();
const Ticket = require("../../../models/clients/chat/ticket-model");
const UserChat = require("../../../models/clients/chat/userchat-model");
const Chat = require("../../../models/clients/chat/chat-model");
const MetaClient = require("../../../models/clients/MetaBusiness/MetaClient-model");

router.post("/accept", async (req, res) => {
  const { ticket_id, agent_id } = req.body;
  const ticket = await Ticket.findById(ticket_id);

  if (!ticket || ticket.status !== "pending") {
    return res.status(400).json({ error: "Ticket not available or already accepted" });
  }

  ticket.status = "accepted";
  ticket.agent_id = agent_id;
  await ticket.save();

  await UserChat.findOneAndUpdate({ user_id: ticket.user_id }, { status: "human", assignedAgent: agent_id });
  const chatHistory = await Chat.find({ user_id: ticket.user_id });

  io.to(agent_id).emit("chatAssigned", { ticket, chatHistory });
  res.json({ message: "Ticket accepted", ticket });
});

router.post("/chat/send", async (req, res) => {
  const { agent_id, user_id, message, waba_id } = req.body;
  const client = await MetaClient.findOne({ waba_id });
  if (!client) return res.status(400).json({ error: "Client not found" });

  try {
    await sendWhatsAppMessage(client, user_id, message);
    await Chat.create({ user_id: user_id, user_message: [], bot_response: [message], model: "human" });

    io.to(agent_id).emit("sendMessage", { user_id, message });
    res.json({ message: "Message sent" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/chat/end", async (req, res) => {
  const { user_id } = req.body;
  await UserChat.findOneAndUpdate({ user_id }, { status: "bot", assignedAgent: null });
  await Ticket.findOneAndUpdate({ user_id, status: "accepted" }, { status: "closed" });

  res.json({ message: "Session ended. Bot reactivated." });
});

module.exports = router;
