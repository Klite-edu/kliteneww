const mongoose = require('mongoose');
const { createClientDatabase } = require('../../../database/db'); // adjust path if needed

const sessionSchema = new mongoose.Schema({
  id: { type: String, default: 'whatsapp_session' },
  session: { type: Object, required: true },
  phoneNumber: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

const getSessionModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model('WhatsAppwebSession', sessionSchema);
};

module.exports = { getSessionModel };
