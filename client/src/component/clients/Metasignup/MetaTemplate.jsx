import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MetaTemplate = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [templates, setTemplates] = useState([]);

  // New template data
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    language: '',
    category: '',
    components: [
      {
        type: 'BODY',
        text: ''
      }
    ]
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/meta/clients`);
      setClients(res.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchTemplates = async () => {
    if (!selectedClient) return;
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/meta/templates/${selectedClient}`);
      setTemplates(res.data.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleCreateTemplate = async () => {
    if (!selectedClient) {
      alert('Please select a client first.');
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/meta/templates/${selectedClient}`, newTemplate);
      alert('Template created successfully!');
      console.log('Template created:', res.data);
      fetchTemplates(); // Refresh the templates list
    } catch (err) {
      console.error('Error creating template:', err.response?.data || err.message);
      alert('Failed to create template');
    }
  };

  // Handle form changes
  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate({ ...newTemplate, [name]: value });
  };

  const handleBodyTextChange = (e) => {
    const text = e.target.value;
    const updatedComponents = [...newTemplate.components];
    const bodyIndex = updatedComponents.findIndex((comp) => comp.type === 'BODY');
    if (bodyIndex !== -1) {
      updatedComponents[bodyIndex].text = text;
    } else {
      updatedComponents.push({ type: 'BODY', text });
    }
    setNewTemplate({ ...newTemplate, components: updatedComponents });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Templates</h2>

      {/* Client Selector */}
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

      {/* Fetch Templates Button */}
      <button className="bg-green-600 text-white p-2 ml-2" onClick={fetchTemplates}>
        Fetch Templates
      </button>

      {/* List Templates */}
      <ul className="mt-4">
        {templates.map((tpl, index) => (
          <li key={index} className="border p-2 mb-2">
            <p><strong>Name:</strong> {tpl.name}</p>
            <p><strong>Status:</strong> {tpl.status}</p>
          </li>
        ))}
      </ul>

      {/* Create New Template Form */}
      <div className="mt-8 p-4 border rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Create New Template</h3>

        <div className="mb-4">
          <label className="block mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={newTemplate.name}
            onChange={handleTemplateChange}
            className="border p-2 w-full"
            placeholder="Template name"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Language</label>
          <input
            type="text"
            name="language"
            value={newTemplate.language}
            onChange={handleTemplateChange}
            className="border p-2 w-full"
            placeholder="en_US"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Category</label>
          <select
            name="category"
            value={newTemplate.category}
            onChange={handleTemplateChange}
            className="border p-2 w-full"
          >
            <option value="">Select Category</option>
            <option value="TRANSACTIONAL">Transactional</option>
            <option value="MARKETING">Marketing</option>
            <option value="OTP">OTP</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Body Text</label>
          <textarea
            value={newTemplate.components.find(comp => comp.type === 'BODY')?.text || ''}
            onChange={handleBodyTextChange}
            className="border p-2 w-full"
            placeholder="Enter message body"
          />
        </div>

        <button className="bg-blue-600 text-white p-2 rounded" onClick={handleCreateTemplate}>
          Create Template
        </button>
      </div>
    </div>
  );
};

export default MetaTemplate;
