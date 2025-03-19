import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailIntegrate = () => {
  const [authUrl, setAuthUrl] = useState('');
  const [emails, setEmails] = useState([]);
  const [emailData, setEmailData] = useState({ googleId: '', to: '', subject: '', message: '' });
  const [googleId, setGoogleId] = useState('');

  useEffect(() => {
    fetchAuthUrl();
  }, []);

  const fetchAuthUrl = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/mail/gmail/google`);
      setAuthUrl(response.data.url);
    } catch (error) {
      console.error('Error fetching auth URL:', error);
    }
  };

  const fetchEmails = async () => {
    if (!googleId) {
      alert('Please enter your Google ID!');
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/mail/gmail/emails`, {
        params: { googleId }
      });
      console.log("email", response.data);
      
      setEmails(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    if (!googleId) {
      alert('Please enter your Google ID!');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/mail/gmail/send`, {
        googleId,
        to: emailData.to,
        subject: emailData.subject,
        message: emailData.message
      });
      alert('Email Sent!');
      setEmailData({ googleId, to: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Klite Mail Client</h1>

      <div style={styles.inputGroup}>
        <label>Google ID (from DB):</label>
        <input
          type="text"
          placeholder="Enter Google ID"
          value={googleId}
          onChange={(e) => setGoogleId(e.target.value)}
          style={styles.input}
        />
      </div>

      <a href={authUrl} target="_blank" rel="noreferrer">
        <button style={styles.button}>Login with Google</button>
      </a>

      <button onClick={fetchEmails} style={styles.button}>Fetch Emails</button>

      <h2>Send Email</h2>
      <form onSubmit={sendEmail} style={styles.form}>
        <input
          type="email"
          placeholder="Recipient Email"
          value={emailData.to}
          onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
          required
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Subject"
          value={emailData.subject}
          onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
          required
          style={styles.input}
        />
        <textarea
          placeholder="Message"
          value={emailData.message}
          onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
          required
          style={styles.textarea}
        />
        <button type="submit" style={styles.button}>Send Email</button>
      </form>

      <h2 style={{ marginTop: '40px' }}>Inbox</h2>
      <div style={styles.emailList}>
        {emails.length === 0 && <p>No emails fetched yet...</p>}
        {emails.map((email, index) => (
          <div key={index} style={styles.emailItem}>
            <div style={styles.emailHeader}>
              <strong>{email.from}</strong>
              <span>{email.date}</span>
            </div>
            <div style={styles.emailSubject}>
              <strong>{email.subject}</strong>
            </div>
            <div style={styles.emailSnippet}>
              {email.snippet}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto'
  },
  heading: {
    textAlign: 'center',
    color: '#202124'
  },
  inputGroup: {
    marginBottom: '10px'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  textarea: {
    width: '100%',
    height: '100px',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#1a73e8',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  form: {
    marginBottom: '30px'
  },
  emailList: {
    marginTop: '20px'
  },
  emailItem: {
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '10px',
    backgroundColor: '#f1f3f4'
  },
  emailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
    fontSize: '14px'
  },
  emailSubject: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '5px'
  },
  emailSnippet: {
    fontSize: '14px',
    color: '#5f6368'
  }
};

export default EmailIntegrate;
