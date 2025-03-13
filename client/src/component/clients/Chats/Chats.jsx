// MetaWebhookLog.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Chats = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/meta/webhook-logs`);
    setLogs(res.data);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Webhook Logs</h2>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li key={log._id} className="border p-2 text-xs bg-gray-100">
            <pre>{JSON.stringify(log.data, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Chats;
