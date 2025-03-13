const mongoose = require("mongoose");

const formDataSchema = new mongoose.Schema({
  apiKey: String,
  phoneNumber: String,
  model: String,
  instructionFile: String, // Save instructions as text
});

// Create a model
const ChatbotForm = mongoose.model("chatbotForm", formDataSchema);

module.exports = ChatbotForm;