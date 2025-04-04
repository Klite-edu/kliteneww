// const mongoose = require('mongoose');

// const chatbotSchema = new mongoose.Schema({
//     user_id: String,
//     user_message: String,
//     bot_response: String
// }, { collection: 'chatbot' });  // 👈 This forces Mongoose to use 'chatbot' collection exactly

// // Define the Model
// module.exports = mongoose.model('Chat', chatbotSchema);  // 👈 Model name can be anything


// const mongoose = require('mongoose');

// const chatbotSchema = new mongoose.Schema({
//   user_id: { type: String, required: true },
//   sender: { type: String, enum: ['user', 'bot', 'agent'], required: true },
//   message: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now }
// }, { collection: 'chatbot' });

// module.exports = mongoose.model('Chat', chatbotSchema);

const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const chatbotSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  messages: [messageSchema], // All messages in one array
  model: { type: String, default: "bot" },
}, { collection: "chatbot" });

// Function to get the Chat model from the dynamic database
const getChatModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("Chat", chatbotSchema);
};

module.exports = { getChatModel };
