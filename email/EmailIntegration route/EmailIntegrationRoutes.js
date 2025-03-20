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
// STEP 1: Generate Google OAuth URL
//////////////////////////////////////////////////////
router.get('/gmail/google', (req, res) => {
  const SCOPES = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.insert',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.metadata',
    'https://www.googleapis.com/auth/gmail.settings.basic',
    'https://www.googleapis.com/auth/gmail.settings.sharing'
  ];

  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });

  res.send({ url });
});

//////////////////////////////////////////////////////
// STEP 2: OAuth Callback (Exchange Code + Save User)
//////////////////////////////////////////////////////
router.get('/gmail/google/callback', async (req, res) => {
  try {
    const code = req.query.code;

    const { tokens } = await oAuth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token received!');
    }

    const userInfoResponse = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });

    const userInfo = userInfoResponse.data;
    const userEmail = userInfo.email;
    const googleId = userInfo.sub;

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

    res.redirect(`${process.env.FRONTEND_URL}/email?status=success`);
  } catch (error) {
    console.error('OAuth Callback Error:', error.response?.data || error.message);
    res.status(500).send(`OAuth Callback Error: ${JSON.stringify(error.response?.data || error.message)}`);
  }
});

//////////////////////////////////////////////////////
// STEP 3: List Emails
//////////////////////////////////////////////////////
router.get('/gmail/emails', async (req, res) => {
  try {
    const googleId = req.query.googleId;
    if (!googleId) return res.status(400).send('Missing googleId');

    await setCredentialsForUser(googleId);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const messagesListResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });

    const messages = messagesListResponse.data.messages || [];

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

        return { id: msg.id, from, subject, date, snippet };
      })
    );

    res.send({ messages: detailedMessages });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).send(error.message);
  }
});

//////////////////////////////////////////////////////
// STEP 4: Send Email
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

//////////////////////////////////////////////////////
// STEP 5: Fetch Google ID by Email
//////////////////////////////////////////////////////
router.get('/gmail/user', async (req, res) => {
  const userEmail = req.query.email;

  if (!userEmail) return res.status(400).send({ message: 'Email is required' });

  try {
    const user = await Email.findOne({ email: userEmail });
    if (!user) return res.status(404).send({ message: 'User not found' });

    res.send({ googleId: user.googleId, email: user.email });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).send({ message: 'Server error' });
  }
});

module.exports = router;
