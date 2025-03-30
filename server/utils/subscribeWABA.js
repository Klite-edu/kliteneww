const axios = require('axios');

/**
 * Subscribe a WhatsApp Business Account (WABA) to Webhooks.
 * 
 * @param {string} waba_id - The WABA ID (Business ID).
 * @param {string} access_token - Valid access token with permissions.
 */
async function subscribeWABA(waba_id, access_token) {
  const apiVersion = 'v19.0';  // Recommended to use latest
  const url = `https://graph.facebook.com/${apiVersion}/${waba_id}/subscribed_apps`;

  try {
    console.log(`🔧 Subscribing WABA ID: ${waba_id}`);

    const response = await axios.post(
      url,
      {
        // Add subscribed_fields if needed (Optional but recommended)
        subscribed_fields: [
          'messages',
          'message_deliveries',
          'message_reads',
          'message_echoes'
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    console.log(`✅ Successfully subscribed WABA (${waba_id}) to webhooks:`, response.data);
    return response.data;

  } catch (err) {
    console.error(`❌ Failed to subscribe WABA (${waba_id}):`, err.response?.data || err.message);

    // If token is expired or invalid
    if (err.response?.status === 400 || err.response?.status === 401) {
      console.error('⚠️ Possible causes: invalid/expired token or insufficient permissions.');
    }

    throw err;
  }
}

module.exports = subscribeWABA;
