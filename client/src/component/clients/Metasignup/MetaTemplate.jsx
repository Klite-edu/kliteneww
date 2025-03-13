import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MetaTemplate = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/meta/clients`);
    setClients(res.data);
  };

  const fetchTemplates = async () => {
    if (!selectedClient) return;
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/meta/templates/${selectedClient}`);
    setTemplates(res.data.data);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Templates</h2>
      <select
        className="p-2 border mb-4"
        value={selectedClient}
        onChange={(e) => setSelectedClient(e.target.value)}
      >
        <option value="">Select Client</option>
        {clients.map((client) => (
          <option key={client._id} value={client._id}>{client.business_name}</option>
        ))}
      </select>
      <button className="bg-green-600 text-white p-2 ml-2" onClick={fetchTemplates}>
        Fetch Templates
      </button>

      <ul className="mt-4">
        {templates.map((tpl, index) => (
          <li key={index} className="border p-2 mb-2">
            <p><strong>Name:</strong> {tpl.name}</p>
            <p><strong>Status:</strong> {tpl.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MetaTemplate;
