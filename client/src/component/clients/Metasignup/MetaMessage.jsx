import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MetaMessage = () => {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/meta/clients`);
    setClients(res.data);
  };

  const handleSend = async () => {
    if (!clientId || !recipient || !message) {
      alert('All fields are required');
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/meta/send`, {
        clientId,
        to: recipient,
        message,
      });
      console.log('Message Sent:', res.data);
      alert('Message Sent Successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Send Message</h2>
      <select
        className="p-2 border mb-4"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      >
        <option value="">Select Client</option>
        {clients.map((client) => (
          <option key={client._id} value={client._id}>{client.business_name}</option>
        ))}
      </select>

      <div className="mb-4">
        <input
          type="text"
          className="border p-2 w-full"
          placeholder="Recipient WhatsApp Number (with country code)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <textarea
          className="border p-2 w-full"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <button className="bg-blue-600 text-white p-2 rounded" onClick={handleSend}>
        Send Message
      </button>
    </div>
  );
};

export default MetaMessage;
