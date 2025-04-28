const { google } = require("googleapis");

const refreshAccessToken = async (refreshToken) => {
  console.log("Starting token refresh process");
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  console.log("OAuth2 client created");

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  console.log("Refresh token set in credentials");

  try {
    console.log("Attempting to get access token");
    const tokenResponse = await oauth2Client.getAccessToken(); // ✅ correct modern method
    console.log("Token response received:", tokenResponse);
    
    const accessToken = tokenResponse?.token;
    console.log("Access token extracted:", accessToken ? "Token received" : "No token found");

    if (!accessToken) {
      console.log("Access token missing, throwing error");
      throw new Error("No access token returned by Google");
    }

    console.log("Successfully refreshed access token");
    return {
      access_token: accessToken,
    };
  } catch (error) {
    console.error(
      "❌ [Token Refresh Error]",
      error.response?.data || error.message
    );
    console.log("Token refresh failed, returning null");
    return null;
  }
};

module.exports = { refreshAccessToken };