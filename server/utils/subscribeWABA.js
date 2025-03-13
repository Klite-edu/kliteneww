const axios = require('axios');

async function subscribeWABA(waba_id, access_token) {
  const url = `https://graph.facebook.com/v15.0/${waba_id}/subscribed_apps`;

  try {
    const response = await axios.post(url, {}, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    console.log(`✅ Subscribed to WABA (${waba_id}):`, response.data);
    return response.data;
  } catch (err) {
    console.error(`❌ Error subscribing to WABA (${waba_id}):`, err.response?.data || err.message);
    throw err;
  }
}

module.exports = subscribeWABA;
