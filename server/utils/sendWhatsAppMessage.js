const axios = require('axios');

async function sendWhatsAppMessage(client, to, message) {
  if (!client.access_token || !client.phone_number_id) return;

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${client.phone_number_id}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${client.access_token}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("❌ WhatsApp send error:", error?.response?.data || error.message);
  }
}

module.exports = sendWhatsAppMessage;
