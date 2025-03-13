const axios = require('axios');

async function sendWhatsAppMessage(client, to, message) {
  const url = `https://graph.facebook.com/v18.0/${client.phone_number_id}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: { body: message }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${client.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Sent Message:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error Sending:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = sendWhatsAppMessage;
