import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailIntegrate = () => {
  const [authUrl, setAuthUrl] = useState('');
  const [emails, setEmails] = useState([]);
  const [labels, setLabels] = useState([]);
  const [settings, setSettings] = useState({});
  const [emailData, setEmailData] = useState({ to: '', subject: '', message: '' });
  const [insertEmailData, setInsertEmailData] = useState({ to: '', subject: '', message: '' });
  const [googleId, setGoogleId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [successMessage, setSuccessMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [vacation, setVacation] = useState({ enable: false, subject: '', message: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchAuthUrl();
    const localEmail = localStorage.getItem('email');
    if (localEmail) {
      setUserEmail(localEmail);
      fetchUserGoogleId(localEmail);
    }
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
      setSuccessMessage('✅ Successfully connected to Gmail!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchAuthUrl = async () => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/mail/gmail/google`);
    setAuthUrl(response.data.url);
  };

  const fetchUserGoogleId = async (email) => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/mail/gmail/user`, { params: { email } });
    if (response.data.googleId) setGoogleId(response.data.googleId);
  };

  const fetchEmails = async () => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/mail/gmail/emails`, { params: { googleId } });
    setEmails(response.data.messages);
  };

  const fetchLabels = async () => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/mail/gmail/labels`, { params: { googleId } });
    setLabels(response.data.labels);
  };

  const createLabel = async () => {
    await axios.post(`${process.env.REACT_APP_API_URL}/api/mail/gmail/labels/create`, { googleId, labelName: newLabel });
    fetchLabels();
  };

  const fetchSettings = async () => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/mail/gmail/settings`, { params: { googleId } });
    setSettings(response.data);
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    await axios.post(`${process.env.REACT_APP_API_URL}/api/mail/gmail/send`, { googleId, ...emailData });
  };

  const insertEmail = async (e) => {
    e.preventDefault();
    await axios.post(`${process.env.REACT_APP_API_URL}/api/mail/gmail/insert`, { googleId, ...insertEmailData });
  };

  const trashEmail = async (id) => {
    await axios.post(`${process.env.REACT_APP_API_URL}/api/mail/gmail/trash`, { googleId, messageId: id });
    fetchEmails();
  };

  const archiveEmail = async (id) => {
    await axios.post(`${process.env.REACT_APP_API_URL}/api/mail/gmail/archive`, { googleId, messageId: id });
    fetchEmails();
  };

  const starEmail = async (id, star) => {
    await axios.post(`${process.env.REACT_APP_API_URL}/api/mail/gmail/star`, { googleId, messageId: id, star });
    fetchEmails();
  };

  const updateSignature = async () => {
    await axios.post(`${process.env.REACT_APP_API_URL}/api/mail/gmail/settings/signature`, { googleId, signature });
  };

  const setVacationResponder = async () => {
    await axios.post(`${process.env.REACT_APP_API_URL}/api/mail/gmail/settings/vacation`, {
      googleId,
      enableAutoReply: vacation.enable,
      subject: vacation.subject,
      message: vacation.message,
      startDate: vacation.startDate,
      endDate: vacation.endDate
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-center text-2xl mb-4">Klite Mail Client</h1>
      {successMessage && <div className="p-2 bg-green-200 mb-4">{successMessage}</div>}
      <p>Logged in as: {userEmail}</p>
      <a href={authUrl} target="_blank" rel="noreferrer">
        <button className="bg-blue-500 text-white px-4 py-2 rounded">Login with Google</button>
      </a>
      <div className="flex flex-wrap justify-center gap-2 my-4">
        <button onClick={() => { setActiveTab('inbox'); fetchEmails(); }}>Inbox</button>
        <button onClick={() => { setActiveTab('labels'); fetchLabels(); }}>Labels</button>
        <button onClick={() => setActiveTab('send')}>Send Email</button>
        <button onClick={() => setActiveTab('insert')}>Insert Email</button>
        <button onClick={() => { setActiveTab('settings'); fetchSettings(); }}>Settings</button>
      </div>
      {activeTab === 'inbox' && (
        <div>
          <h2>Inbox</h2>
          {emails.map(email => (
            <div key={email.id} className="border p-2 mb-2">
              <p><strong>{email.subject}</strong> from {email.from}</p>
              <div className="flex gap-2">
                <button onClick={() => trashEmail(email.id)}>Trash</button>
                <button onClick={() => archiveEmail(email.id)}>Archive</button>
                <button onClick={() => starEmail(email.id, true)}>Star</button>
                <button onClick={() => starEmail(email.id, false)}>Unstar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'labels' && (
        <div>
          <h2>Labels</h2>
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="New Label" />
          <button onClick={createLabel}>Create</button>
          <ul>{labels.map(label => (<li key={label.id}>{label.name}</li>))}</ul>
        </div>
      )}
      {activeTab === 'send' && (
        <form onSubmit={sendEmail}>
          <input placeholder="To" value={emailData.to} onChange={e => setEmailData({ ...emailData, to: e.target.value })} />
          <input placeholder="Subject" value={emailData.subject} onChange={e => setEmailData({ ...emailData, subject: e.target.value })} />
          <textarea placeholder="Message" value={emailData.message} onChange={e => setEmailData({ ...emailData, message: e.target.value })} />
          <button type="submit">Send</button>
        </form>
      )}
      {activeTab === 'insert' && (
        <form onSubmit={insertEmail}>
          <input placeholder="To" value={insertEmailData.to} onChange={e => setInsertEmailData({ ...insertEmailData, to: e.target.value })} />
          <input placeholder="Subject" value={insertEmailData.subject} onChange={e => setInsertEmailData({ ...insertEmailData, subject: e.target.value })} />
          <textarea placeholder="Message" value={insertEmailData.message} onChange={e => setInsertEmailData({ ...insertEmailData, message: e.target.value })} />
          <button type="submit">Insert</button>
        </form>
      )}
      {activeTab === 'settings' && (
        <div>
          <h2>Settings</h2>
          <div>
            <h3>Signature</h3>
            <textarea value={signature} onChange={e => setSignature(e.target.value)} />
            <button onClick={updateSignature}>Update Signature</button>
          </div>
          <div>
            <h3>Vacation Responder</h3>
            <input type="checkbox" checked={vacation.enable} onChange={e => setVacation({ ...vacation, enable: e.target.checked })} /> Enable
            <input placeholder="Subject" value={vacation.subject} onChange={e => setVacation({ ...vacation, subject: e.target.value })} />
            <textarea placeholder="Message" value={vacation.message} onChange={e => setVacation({ ...vacation, message: e.target.value })} />
            <input type="date" value={vacation.startDate} onChange={e => setVacation({ ...vacation, startDate: e.target.value })} /> Start
            <input type="date" value={vacation.endDate} onChange={e => setVacation({ ...vacation, endDate: e.target.value })} /> End
            <button onClick={setVacationResponder}>Set Responder</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailIntegrate;
