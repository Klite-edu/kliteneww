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
  const [showTicketPopup, setShowTicketPopup] = useState(false);
  const [incomingTicket, setIncomingTicket] = useState(null);
  const [chatLocked, setChatLocked] = useState(true); // Chat locked until agent accepts
  const chatRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      socket.emit('joinRoom', selectedUser.user_id);
    }
  }, [selectedUser]);

  useEffect(() => {
    socket.on('newMessage', (message) => {
      if (selectedUser && message.user_id === selectedUser.user_id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Listen for ticket notifications
    socket.on('ticketRaised', (ticket) => {
      console.log('🚨 Ticket Raised:', ticket);
      setIncomingTicket(ticket);
      setShowTicketPopup(true);
    });

    return () => {
      socket.off('newMessage');
      socket.off('ticketRaised');
    };
  }, [selectedUser]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/ticket/chats/chatbot`);
      const data = res.data;

      const userChat = data.find(chat => chat.user_id === selectedUser.user_id);

      if (userChat) {
        const combinedMessages = [];

        const userMessages = userChat.user_message || [];
        const botResponses = userChat.bot_response || [];

        userMessages.forEach((msg, index) => {
          combinedMessages.push({
            _id: `user-${index}`,
            sender: 'user',
            message: msg,
            timestamp: new Date() // Replace with actual timestamp if available
          });

          if (botResponses[index]) {
            combinedMessages.push({
              _id: `bot-${index}`,
              sender: userChat.model === 'human' ? 'agent' : 'bot',
              message: botResponses[index],
              timestamp: new Date()
            });
          }
        });

        setMessages(combinedMessages);
        setChatLocked(false); // Unlock chat if fetching existing human chat
      } else {
        setMessages([]);
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLocked) return;

    const tempId = `temp-${Date.now()}`;

    const newMessage = {
      _id: tempId,
      sender: 'agent',
      message: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/meta/send`, {
        clientId: selectedUser.clientId,
        to: selectedUser.user_id,
        message: input
      });

      await axios.post(`${process.env.REACT_APP_API_URL}/api/ticket/chats/chatbot`, {
        user_id: selectedUser.user_id,
        user_message: [input],
        bot_response: [],
        model: 'human'
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

  const acceptTicket = async () => {
    if (!incomingTicket) return;

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/tickets/accept`, {
        ticketId: incomingTicket.ticketId, // Assuming ticketId is coming from backend
        agentId: 'yourAgentId', // Replace with actual agentId or get from session
      });

      if (res.data.success) {
        console.log('✅ Ticket accepted!');
        setShowTicketPopup(false);
        setChatLocked(false); // Unlock chat
        fetchMessages(); // Fetch previous messages (bot + user)
      } else {
        console.error('❌ Ticket acceptance failed!');
      }

    } catch (error) {
      console.error('❌ Error accepting ticket:', error);
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
      {/* Ticket popup */}
      {showTicketPopup && incomingTicket && (
        <div className="ticket-popup">
          <div className="ticket-popup-content">
            <h3>New Ticket Raised!</h3>
            <p>Customer <strong>{incomingTicket.userName}</strong> needs human support.</p>
            <button onClick={acceptTicket}>Accept Ticket</button>
            <button onClick={() => setShowTicketPopup(false)}>Ignore</button>
          </div>
        </div>
      )}

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
          placeholder={chatLocked ? "Accept ticket to start chatting..." : "Type a message"}
          value={input}
          disabled={chatLocked}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="send-button"
          disabled={!input.trim() || chatLocked}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
