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

const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  user_message: { type: [String], required: true },
  bot_response: { type: [String], required: true },
  model: { type: String, required: true },
}, { collection: 'chatbot' });

module.exports = mongoose.model('Chat', chatbotSchema);