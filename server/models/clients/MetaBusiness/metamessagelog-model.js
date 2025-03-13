const mongoose = require("mongoose");
const MessageLogSchema = new mongoose.Schema({
  client_id: mongoose.Schema.Types.ObjectId,
  phone_number: String,
  message: String,
  direction: String, // inbound or outbound
  status: String,
  sent_at: { type: Date, default: Date.now },
});
module.exports = mongoose.model("MetaMessage", MessageLogSchema);
