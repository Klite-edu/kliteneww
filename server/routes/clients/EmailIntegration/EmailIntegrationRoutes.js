const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Email = require('../../../models/clients/EmailIntegration/Email-model');
const axios = require('axios');
require('dotenv').config();

// Setup OAuth2 Client
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Helper: Set Credentials for User (from DB)
const setCredentialsForUser = async (googleId) => {
  const user = await Email.findOne({ googleId });

  if (!user) throw new Error('User not found');

  oAuth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
    expiry_date: user.tokenExpiryDate
  });

  // Optional: Refresh the access token if it's expired
  try {
    const { token } = await oAuth2Client.getAccessToken();
    if (token) {
      user.accessToken = token;
      await user.save();
    }
  } catch (err) {
    console.error('Error refreshing token:', err);
  }
};

//////////////////////////////////////////////////////
// STEP 1: Generate Google OAuth URL (Updated)
//////////////////////////////////////////////////////
router.get('/gmail/google', (req, res) => {
  const SCOPES = [
    'openid',                               // Required for OpenID Connect
    'profile',                              // Basic profile info
    'email',                                // Email address info
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
  ];

  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',                     // Force consent screen + refresh_token
    scope: SCOPES,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });

  console.log('Generated OAuth URL:', url);

  res.send({ url });
});

//////////////////////////////////////////////////////
// STEP 2: OAuth Callback (Exchange Code + Save User)
//////////////////////////////////////////////////////
router.get('/gmail/google/callback', async (req, res) => {
  try {
    const code = req.query.code;

    // 1. Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('Tokens received:', tokens);

    if (!tokens.access_token) {
      throw new Error('No access token received!');
    }

    // 2. Fetch user info from OpenID Connect userinfo endpoint
    const userInfoResponse = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });

    const userInfo = userInfoResponse.data;
    console.log('User Info:', userInfo);

    const userEmail = userInfo.email;
    const googleId = userInfo.sub; // 'sub' is unique user ID in OpenID

    // 3. Save/Update user info in MongoDB
    await Email.findOneAndUpdate(
      { googleId },
      {
        email: userEmail,
        googleId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || 'N/A',
        tokenExpiryDate: tokens.expiry_date
      },
      { upsert: true, new: true }
    );

    res.send(`✅ Authentication successful for ${userEmail}. You can close this window.`);
  } catch (error) {
    console.error('OAuth Callback Error:', error.response?.data || error.message);
    res.status(500).send(`❌ OAuth Callback Error: ${JSON.stringify(error.response?.data || error.message)}`);
  }
});

//////////////////////////////////////////////////////
// STEP 3: List Emails (Fetch from Gmail API)
//////////////////////////////////////////////////////
router.get('/gmail/emails', async (req, res) => {
  try {
    const googleId = req.query.googleId;
    if (!googleId) return res.status(400).send('Missing googleId');

    await setCredentialsForUser(googleId);

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Step 1: Get message list
    const messagesListResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });

    const messages = messagesListResponse.data.messages;

    if (!messages || messages.length === 0) {
      return res.send({ messages: [] });
    }

    // Step 2: Fetch full details for each message
    const detailedMessages = await Promise.all(
      messages.map(async (msg) => {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date']
        });

        const headers = message.data.payload.headers;
        const snippet = message.data.snippet;

        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        return {
          id: msg.id,
          from,
          subject,
          date,
          snippet
        };
      })
    );

    res.send({ messages: detailedMessages });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).send(error.message);
  }
});


//////////////////////////////////////////////////////
// STEP 4: Send Email (Send via Gmail API)
//////////////////////////////////////////////////////
router.post('/gmail/send', async (req, res) => {
  try {
    const { googleId, to, subject, message } = req.body;
    if (!googleId) return res.status(400).send('Missing googleId');

    await setCredentialsForUser(googleId);

    const rawMessage = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      `Subject: ${subject}`,
      '',
      message
    ].join('\n');

    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });

    res.send(response.data);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send(error.message);
  }
});

module.exports = router;
