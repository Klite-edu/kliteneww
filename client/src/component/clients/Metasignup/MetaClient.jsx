import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MetaClient = () => {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/meta/clients`);
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Clients</h2>
      <table className="w-full table-auto border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border p-2">Business Name</th>
            <th className="border p-2">WABA ID</th>
            <th className="border p-2">Phone Number ID</th>
            <th className="border p-2">Subscribed</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client._id}>
              <td className="border p-2">{client.business_name}</td>
              <td className="border p-2">{client.waba_id}</td>
              <td className="border p-2">{client.phone_number_id}</td>
              <td className="border p-2">{client.subscribed ? '✅' : '❌'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <button className="bg-blue-600 text-white p-2 rounded" onClick={() => alert('Launch Embedded Signup')}>
          Add New Client
        </button>
      </div>
    </div>
  );
};

export default MetaClient;
