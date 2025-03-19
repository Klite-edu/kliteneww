// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import './chatwindow.css'; 

// const ChatWindow = ({ selectedUser, onProfileClick }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const chatRef = useRef(null);

//   useEffect(() => {
//     if (selectedUser) fetchMessages();
//   }, [selectedUser]);

//   const fetchMessages = async () => {
//     try {
//       const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/chats/chatbot`);
//       const data = res.data;
//       console.log('Fetched messages:', data);

//       setMessages(data.filter(m => m.user_id === selectedUser.id));
//     } catch (error) {
//       console.error('Error fetching messages:', error);
//     }
//   };

//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     const tempId = `temp-${Date.now()}`;

//     const newMessage = {
//       _id: tempId,
//       user_id: selectedUser.id,
//       user_message: input,
//       bot_response: 'Typing...',
//       timestamp: new Date().toISOString()
//     };

//     setMessages(prev => [...prev, newMessage]);
//     setInput('');

//     try {
//       const metaRes = await axios.post(`${process.env.REACT_APP_API_URL}/api/meta/send`, {
//         clientId: selectedUser.clientId,
//         to: selectedUser.id,
//         message: input
//       });

//       console.log('✅ Message sent to Meta API:', metaRes.data);

//       const saveRes = await axios.post(`${process.env.REACT_APP_API_URL}/api/chats/chatbot`, {
//         user_id: selectedUser.id,
//         user_message: input
//       });

//       console.log('✅ Message saved in chatbot collection:', saveRes.data);

//       const chatRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/chats/chatbot`);
//       const userChats = chatRes.data.filter(chat => chat.user_id === selectedUser.id);

//       console.log('✅ Fetched updated messages:', userChats);

//       setMessages(userChats);

//     } catch (error) {
//       console.error('❌ Error sending message:', error);

//       setMessages(prev =>
//         prev.map(msg =>
//           msg._id === tempId
//             ? { ...msg, bot_response: 'Failed to send message via Meta API.' }
//             : msg
//         )
//       );
//     }
//   };

//   useEffect(() => {
//     if (chatRef.current) {
//       chatRef.current.scrollTop = chatRef.current.scrollHeight;
//     }
//   }, [messages]);

//   const formatTime = (timestamp) => {
//     const date = timestamp ? new Date(timestamp) : new Date();
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   if (!selectedUser) {
//     return (
//       <div className="no-chat-selected">
//         <h2>Select a user to start chatting!</h2>
//       </div>
//     );
//   }

//   return (
//     <div className="chat-container">
//       {/* Header */}
//       <div className="chat-header">
//         <div className="chat-user-info" onClick={onProfileClick}>
//           <div className="avatar">
//             {selectedUser.avatar ? (
//               <img src={selectedUser.avatar} alt="avatar" className="avatar-img" />
//             ) : (
//               '👤'
//             )}
//           </div>
//           <div>
//             <div className="user-name">{selectedUser.name}</div>
//             <div className="user-status">
//               {selectedUser.online ? 'Online' : `Last seen: ${selectedUser.lastSeen}`}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Chat Body */}
//       <div className="chat-body" ref={chatRef}>
//         {messages.length === 0 ? (
//           <div className="empty-chat">
//             <p>No messages yet. Start the conversation!</p>
//           </div>
//         ) : (
//           messages.map((msg) => (
//             <div key={msg._id || msg.timestamp} className="message-container">
//               {/* User message */}
//               {msg.user_message && (
//                 <div className="sent-message-wrapper">
//                   <div className="sent-message">
//                     <div>{msg.user_message}</div>
//                     <div className="timestamp">{formatTime(msg.timestamp)}</div>
//                   </div>
//                 </div>
//               )}

//               {/* Bot response */}
//               {msg.bot_response && (
//                 <div className="received-message-wrapper">
//                   <div className="received-message">
//                     <div>{msg.bot_response}</div>
//                     <div className="timestamp">{formatTime(msg.timestamp)}</div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))
//         )}
//       </div>

//       {/* Chat Footer */}
//       <div className="chat-footer">
//         <input
//           type="text"
//           className="input-box"
//           placeholder="Type a message"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//         />
//         <button
//           onClick={sendMessage}
//           className="send-button"
//           disabled={!input.trim()}
//         >
//           ➤
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ChatWindow;


import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './chatwindow.css'; 

const socket = io(process.env.REACT_APP_SOCKET_URL);

const ChatWindow = ({ selectedUser, onProfileClick }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      socket.emit('joinRoom', selectedUser.user_id);
    }
  }, [selectedUser]);

  useEffect(() => {
    socket.on('newMessage', (message) => {
      if (message.user_id === selectedUser.user_id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off('newMessage');
    };
  }, [selectedUser]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/chats/chatbot`);
      const data = res.data;

      setMessages(data.filter(m => m.user_id === selectedUser.user_id));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const tempId = `temp-${Date.now()}`;

    const newMessage = {
      _id: tempId,
      user_id: selectedUser.user_id,
      sender: 'agent',
      message: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      const metaRes = await axios.post(`${process.env.REACT_APP_API_URL}/api/meta/send`, {
        clientId: selectedUser.clientId,
        to: selectedUser.user_id,
        message: input
      });

      const saveRes = await axios.post(`${process.env.REACT_APP_API_URL}/api/chats/chatbot`, {
        user_id: selectedUser.user_id,
        sender: 'agent',
        message: input
      });

      socket.emit('sendMessage', {
        user_id: selectedUser.user_id,
        sender: 'agent',
        message: input
      });

    } catch (error) {
      console.error('❌ Error sending message:', error);

      setMessages(prev =>
        prev.map(msg =>
          msg._id === tempId
            ? { ...msg, message: 'Failed to send message via Meta API.' }
            : msg
        )
      );
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = timestamp ? new Date(timestamp) : new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!selectedUser) {
    return (
      <div className="no-chat-selected">
        <h2>Select a user to start chatting!</h2>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-user-info" onClick={onProfileClick}>
          <div className="avatar">
            {selectedUser.avatar ? (
              <img src={selectedUser.avatar} alt="avatar" className="avatar-img" />
            ) : (
              '👤'
            )}
          </div>
          <div>
            <div className="user-name">{selectedUser.name}</div>
            <div className="user-status">
              {selectedUser.online ? 'Online' : `Last seen: ${selectedUser.lastSeen}`}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Body */}
      <div className="chat-body" ref={chatRef}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id || msg.timestamp} className="message-container">
              {msg.sender === 'user' && (
                <div className="sent-message-wrapper">
                  <div className="sent-message">
                    <div>{msg.message}</div>
                    <div className="timestamp">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              )}

              {(msg.sender === 'bot' || msg.sender === 'agent') && (
                <div className="received-message-wrapper">
                  <div className="received-message">
                    <div>{msg.message}</div>
                    <div className="timestamp">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Chat Footer */}
      <div className="chat-footer">
        <input
          type="text"
          className="input-box"
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="send-button"
          disabled={!input.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;