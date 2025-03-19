const express = require("express");
const router = express.Router();
const Chat = require("../../../models/clients/chat/chat-model");

router.get("/assigned-users", async (req, res) => {
  const users = await Chat.find({ status: "human" });
  res.json(users);
});

router.get("/chat/:userId", async (req, res) => {
  const user = await Chat.findById(req.params.userId);
  res.json(user);
});

router.post("/send-message", async (req, res) => {
  const { userId, message } = req.body;

  const user = await Chat.findById(userId);
  user.chatHistory.push({ sender: "agent", message });

  // Send message to user via WhatsApp API here
  // Use axios to post to Meta's endpoint with access_token

  await user.save();
  res.sendStatus(200);
});

module.exports = router;
