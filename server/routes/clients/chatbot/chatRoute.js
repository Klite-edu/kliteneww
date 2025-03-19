// const express = require('express');
// const router = express.Router();
// const Chatbot = require("../../../models/clients/chat/chat-model")

// // ✅ CREATE new chatbot entry (log everything)
// router.post('/chatbot', async (req, res) => {
//   console.log('🔵 POST /chatbot - Incoming Request Body:', req.body);

//   try {
//     const item = await Chatbot.create(req.body);

//     console.log('✅ Chat entry successfully created:', item);

//     res.status(201).json(item);
//   } catch (err) {
//     console.error('❌ Error creating chat entry:', err.message);

//     res.status(400).json({ error: err.message });
//   }
// });

// // 📥 READ all chatbot entries (log request and response count)
// router.get('/chatbot', async (req, res) => {
//   console.log('🔵 GET /chatbot - Fetching all chat entries');

//   try {
//     const items = await Chatbot.find();

//     console.log(`✅ Fetched ${items.length} chat entries`);

//     res.json(items);
//   } catch (err) {
//     console.error('❌ Error fetching chat entries:', err.message);

//     res.status(500).json({ error: err.message });
//   }
// });

// // 📥 READ unique user_ids (log request and result)
// router.get('/chatbot/unique-users', async (req, res) => {
//   console.log('🔵 GET /chatbot/unique-users - Fetching unique user IDs');

//   try {
//     const uniqueUserIds = await Chatbot.distinct('user_id');

//     console.log(`✅ Fetched ${uniqueUserIds.length} unique user IDs:`, uniqueUserIds);

//     res.json(uniqueUserIds);
//   } catch (err) {
//     console.error('❌ Error fetching unique user IDs:', err.message);

//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const UserChat = require("../../../models/clients/chat/userchat-model");

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
