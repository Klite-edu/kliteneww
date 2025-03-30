
// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import "./chatwindow.css";

// const ChatWindow = ({
//   selectedUser,
//   agentId,
//   onProfileClick,
//   setSelectedUser,
// }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [incomingTickets, setIncomingTickets] = useState([]);
//   const [chatLocked, setChatLocked] = useState(true); // Default: locked

//   const chatRef = useRef(null);

//   // ✅ On Component Mount
//   useEffect(() => {
//     console.log("✅ ChatWindow Mounted");

//     // ✅ Restore locked state from localStorage
//     const lockedState = localStorage.getItem("chatLocked");
//     setChatLocked(lockedState === "false" ? false : true);

//     // ✅ Restore selected user if exists
//     const storedUser = localStorage.getItem("selectedUser");
//     if (storedUser) {
//       const parsedUser = JSON.parse(storedUser);
//       console.log("✅ Restored selected user:", parsedUser);
//       setSelectedUser(parsedUser);
//     }

//     fetchIncomingTickets();
//   }, []);

//   // ✅ On selectedUser change
//   useEffect(() => {
//     console.log("👤 selectedUser changed:", selectedUser);

//     if (!selectedUser) return;

//     // ✅ Fetch messages on user select or restore
//     fetchMessages();

//     // ✅ Save selected user to localStorage
//     localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
//   }, [selectedUser]);

//   // ✅ Fetch Pending Tickets
//   const fetchIncomingTickets = async () => {
//     console.log("📥 Fetching pending tickets...");
//     try {
//       const res = await axios.get(
//         `${process.env.REACT_APP_API_URL}/api/ticket/pending-tickets`
//       );
//       setIncomingTickets(res.data);
//       console.log("✅ Pending tickets fetched:", res.data);
//     } catch (error) {
//       console.error("❌ Error fetching pending tickets:", error);
//     }
//   };

//   // ✅ Accept Ticket
//   const acceptTicket = async (ticket) => {
//     console.log(`🟢 Accepting ticket: ${ticket._id}`);
//     try {
//       const res = await axios.post(
//         `${process.env.REACT_APP_API_URL}/api/ticket/accept`,
//         {
//           ticket_id: ticket._id,
//           agent_id: agentId,
//         }
//       );

//       if (res.data.ticket) {
//         const selected = {
//           user_id: res.data.ticket.user_id,
//           waba_id: res.data.ticket.waba_id,
//           name: res.data.ticket.user_id,
//         };

//         console.log("🆕 Selected User:", selected);
//         setSelectedUser(selected);

//         // ✅ Unlock chat and store lock state
//         setChatLocked(false);
//         localStorage.setItem("chatLocked", "false");

//         fetchMessages();
//         fetchIncomingTickets();
//       } else {
//         console.warn("⚠️ Ticket already accepted or failed");
//       }
//     } catch (error) {
//       console.error("❌ Error accepting ticket:", error);
//     }
//   };

//   // ✅ Fetch Chat Messages
//   const fetchMessages = async () => {
//     if (!selectedUser) return;

//     console.log(`📝 Fetching chat history for user: ${selectedUser.user_id}`);
//     try {
//       const res = await axios.get(
//         `${process.env.REACT_APP_API_URL}/api/ticket/chatbot`
//       );

//       const userChat = res.data.find(
//         (chat) => chat.user_id === selectedUser.user_id
//       );

//       if (!userChat) {
//         console.warn("⚠️ No chat found for user:", selectedUser.user_id);
//         setMessages([]);
//         return;
//       }

//       const sortedMessages = (userChat.messages || []).sort(
//         (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
//       );

//       console.log(`✅ Messages fetched: ${sortedMessages.length}`);
//       setMessages(sortedMessages);
//     } catch (error) {
//       console.error("❌ Error fetching messages:", error);
//     }
//   };

//   // ✅ Send Message
//   const sendMessage = async () => {
//     if (!input.trim() || chatLocked) {
//       console.warn("⚠️ Cannot send message (locked or empty).");
//       return;
//     }

//     const messageText = input.trim();
//     console.log(`➡️ Sending message: "${messageText}" to user ${selectedUser.user_id}`);

//     const newMessage = {
//       _id: `agent-${Date.now()}`,
//       sender: "agent",
//       message: messageText,
//       timestamp: new Date(),
//     };

//     // ✅ Show message instantly in UI
//     setMessages((prev) => [...prev, newMessage]);
//     setInput("");

//     try {
//       await axios.post(`${process.env.REACT_APP_API_URL}/api/ticket/send`, {
//         agent_id: agentId,
//         user_id: selectedUser.user_id,
//         message: messageText,
//         waba_id: selectedUser.waba_id,
//         sender_type: "agent",
//       });

//       console.log("✅ Message sent via API.");
//       fetchMessages(); // optional refresh
//     } catch (error) {
//       console.error("❌ Error sending message:", error);
//     }
//   };

//   // ✅ End Session (Triggered Only by Button Click)
//   const endSession = async () => {
//     if (!selectedUser) return;

//     console.log(`🔚 Ending session for user: ${selectedUser.user_id}`);
//     try {
//       await axios.post(`${process.env.REACT_APP_API_URL}/api/ticket/end-session`, {
//         user_id: selectedUser.user_id, // Send only user_id
//         agent_id: agentId,
//       });

//       console.log("✅ Session ended");

//       // ✅ Lock chat and clear user session
//       setChatLocked(true);
//       localStorage.setItem("chatLocked", "true");

//       setSelectedUser(null);
//       localStorage.removeItem("selectedUser");
//       setMessages([]);
//     } catch (error) {
//       console.error("❌ Error ending session:", error);
//     }
//   };

//   // ✅ Auto-scroll on new message
//   useEffect(() => {
//     if (chatRef.current) {
//       chatRef.current.scrollTop = chatRef.current.scrollHeight;
//     }
//   }, [messages]);

//   const formatTime = (timestamp) => {
//     const date = timestamp ? new Date(timestamp) : new Date();
//     return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//   };

//   return (
//     <div className="chat-container">
//       {/* INCOMING TICKETS */}
//       <div className="incoming-tickets-section">
//         <h3>📥 Incoming Tickets</h3>
//         <button onClick={fetchIncomingTickets} className="refresh-tickets-button">
//           🔄 Refresh
//         </button>

//         {incomingTickets.length === 0 ? (
//           <p>No pending tickets</p>
//         ) : (
//           incomingTickets.map((ticket) => (
//             <div key={ticket._id} className="ticket-item">
//               <p>User: <strong>{ticket.user_id}</strong></p>
//               <button onClick={() => acceptTicket(ticket)}>✅ Accept</button>
//             </div>
//           ))
//         )}
//       </div>

//       {/* CHAT WINDOW */}
//       {selectedUser ? (
//         <>
//           <div className="chat-header">
//             <div className="chat-user-info" onClick={onProfileClick}>
//               <div className="avatar">
//                 {selectedUser.avatar ? (
//                   <img src={selectedUser.avatar} alt="avatar" className="avatar-img" />
//                 ) : (
//                   "👤"
//                 )}
//               </div>
//               <div>
//                 <div className="user-name">{selectedUser.name || selectedUser.user_id}</div>
//                 <div className="user-status">{chatLocked ? "Offline" : "Online"}</div>
//               </div>
//             </div>

//             <button onClick={endSession} disabled={chatLocked} className="end-session-button">
//               ⛔ End Session
//             </button>
//           </div>

//           {/* CHAT MESSAGES */}
//           <div className="chat-body" ref={chatRef}>
//             {messages.length === 0 ? (
//               <div className="empty-chat">
//                 <p>No messages yet. Start chatting!</p>
//               </div>
//             ) : (
//               messages.map((msg, idx) => (
//                 <div
//                   key={idx}
//                   className={`message-container ${
//                     msg.sender === "agent" ? "agent-message" : "customer-message"
//                   }`}
//                 >
//                   <div className="message-content">
//                     <div>{msg.message}</div>
//                     <div className="timestamp">{formatTime(msg.timestamp)}</div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           {/* MESSAGE INPUT */}
//           <div className="chat-footer">
//             <input
//               type="text"
//               className="input-box"
//               placeholder={
//                 chatLocked ? "🔒 Accept ticket to start chatting..." : "Type your message..."
//               }
//               value={input}
//               disabled={chatLocked}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyPress={(e) => e.key === "Enter" && sendMessage()}
//             />
//             <button
//               onClick={sendMessage}
//               className="send-button"
//               disabled={!input.trim() || chatLocked}
//             >
//               ➤
//             </button>
//           </div>
//         </>
//       ) : (
//         <div className="no-chat-selected">
//           <h2>📞 Select or accept a ticket to start chatting!</h2>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ChatWindow;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./chatwindow.css";

const ChatWindow = ({
  selectedUser,
  agentId,
  onProfileClick,
  setSelectedUser,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [incomingTickets, setIncomingTickets] = useState([]);
  const [chatLocked, setChatLocked] = useState(true);

  // Clients and Templates
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [templates, setTemplates] = useState([]);
  const [showTemplatePopup, setShowTemplatePopup] = useState(false);

  const chatRef = useRef(null);

  useEffect(() => {
    const lockedState = localStorage.getItem("chatLocked");
    setChatLocked(lockedState === "false" ? false : true);

    const storedUser = localStorage.getItem("selectedUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setSelectedUser(parsedUser);
    }

    fetchIncomingTickets();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    fetchMessages();
    localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
  }, [selectedUser]);

  // Fetch incoming tickets
  const fetchIncomingTickets = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ticket/pending-tickets`
      );
      setIncomingTickets(res.data);
    } catch (error) {
      console.error("❌ Error fetching pending tickets:", error);
    }
  };

  const acceptTicket = async (ticket) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ticket/accept`,
        {
          ticket_id: ticket._id,
          agent_id: agentId,
        }
      );

      if (res.data.ticket) {
        const selected = {
          user_id: res.data.ticket.user_id,
          waba_id: res.data.ticket.waba_id,
          name: res.data.ticket.user_id,
        };

        setSelectedUser(selected);
        setChatLocked(false);
        localStorage.setItem("chatLocked", "false");

        fetchMessages();
        fetchIncomingTickets();
      }
    } catch (error) {
      console.error("❌ Error accepting ticket:", error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ticket/chatbot`
      );

      const userChat = res.data.find(
        (chat) => chat.user_id === selectedUser.user_id
      );

      if (!userChat) {
        setMessages([]);
        return;
      }

      const sortedMessages = (userChat.messages || []).sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      setMessages(sortedMessages);
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    }
  };

  // Fetch clients for template popup
  const fetchClients = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/meta/clients`);
      setClients(res.data);
    } catch (err) {
      console.error('❌ Error fetching clients:', err);
    }
  };

  // Fetch templates of selected client
  const fetchApprovedTemplates = async (clientId) => {
    if (!clientId) return;

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/meta/templates/${clientId}`
      );

      const approvedTemplates = res.data.data.filter(
        (tpl) => tpl.status === "APPROVED"
      );

      setTemplates(approvedTemplates);
    } catch (error) {
      console.error("❌ Error fetching templates:", error);
    }
  };

  // Send message manually typed
  const sendMessage = async () => {
    if (!input.trim() || chatLocked) return;

    const messageText = input.trim();

    const newMessage = {
      _id: `agent-${Date.now()}`,
      sender: "agent",
      message: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/ticket/send`, {
        agent_id: agentId,
        user_id: selectedUser.user_id,
        message: messageText,
        waba_id: selectedUser.waba_id,
        sender_type: "agent",
      });

      fetchMessages();
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  };

  // Send approved template message
  const sendTemplateMessage = async (template) => {
    if (!template || chatLocked) return;

    const bodyComponent = template.components.find((comp) => comp.type === "BODY");
    if (!bodyComponent) {
      alert("Template has no body text.");
      return;
    }

    const templateMessage = bodyComponent.text;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/ticket/send`, {
        agent_id: agentId,
        user_id: selectedUser.user_id,
        message: templateMessage,
        waba_id: selectedUser.waba_id,
        sender_type: "agent",
      });

      setShowTemplatePopup(false);
      fetchMessages();
    } catch (error) {
      console.error("❌ Error sending template message:", error);
    }
  };

  // End chat session
  const endSession = async () => {
    if (!selectedUser) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/ticket/end-session`, {
        user_id: selectedUser.user_id,
        agent_id: agentId,
      });

      setChatLocked(true);
      localStorage.setItem("chatLocked", "true");

      setSelectedUser(null);
      localStorage.removeItem("selectedUser");
      setMessages([]);
    } catch (error) {
      console.error("❌ Error ending session:", error);
    }
  };

  // Auto fetch clients when template popup opens
  useEffect(() => {
    if (showTemplatePopup) {
      fetchClients();
    }
  }, [showTemplatePopup]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = timestamp ? new Date(timestamp) : new Date();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-container">
      {/* INCOMING TICKETS */}
      <div className="incoming-tickets-section">
        <h3>📥 Incoming Tickets</h3>
        <button onClick={fetchIncomingTickets} className="refresh-tickets-button">
          🔄 Refresh
        </button>

        {incomingTickets.length === 0 ? (
          <p>No pending tickets</p>
        ) : (
          incomingTickets.map((ticket) => (
            <div key={ticket._id} className="ticket-item">
              <p>User: <strong>{ticket.user_id}</strong></p>
              <button onClick={() => acceptTicket(ticket)}>✅ Accept</button>
            </div>
          ))
        )}
      </div>

      {/* CHAT WINDOW */}
      {selectedUser ? (
        <>
          <div className="chat-header">
            <div className="chat-user-info" onClick={onProfileClick}>
              <div className="avatar">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="avatar" className="avatar-img" />
                ) : (
                  "👤"
                )}
              </div>
              <div>
                <div className="user-name">{selectedUser.name || selectedUser.user_id}</div>
                <div className="user-status">{chatLocked ? "Offline" : "Online"}</div>
              </div>
            </div>

            <button onClick={endSession} disabled={chatLocked} className="end-session-button">
              ⛔ End Session
            </button>
          </div>

          <div className="chat-body" ref={chatRef}>
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p>No messages yet. Start chatting!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message-container ${msg.sender === "agent" ? "agent-message" : "customer-message"}`}
                >
                  <div className="message-content">
                    <div>{msg.message}</div>
                    <div className="timestamp">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Input + Template Button */}
          <div className="chat-footer">
            <input
              type="text"
              className="input-box"
              placeholder={chatLocked ? "🔒 Accept ticket to start chatting..." : "Type your message..."}
              value={input}
              disabled={chatLocked}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="send-button"
              disabled={!input.trim() || chatLocked}
            >
              ➤
            </button>

            <button
              onClick={() => setShowTemplatePopup(true)}
              className="template-button"
              disabled={chatLocked}
              style={{ marginLeft: "5px", padding: "8px" }}
            >
              ➕
            </button>
          </div>
        </>
      ) : (
        <div className="no-chat-selected">
          <h2>📞 Select or accept a ticket to start chatting!</h2>
        </div>
      )}

      {/* TEMPLATE POPUP */}
      {showTemplatePopup && (
        <div className="template-popup-overlay">
          <div className="template-popup">
            <h3>📄 Approved Templates</h3>
            <button
              onClick={() => setShowTemplatePopup(false)}
              style={{ float: "right" }}
            >
              ❌
            </button>

            {/* Client dropdown */}
            <select
              className="p-2 border mb-4"
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                fetchApprovedTemplates(e.target.value);
              }}
            >
              <option value="">Select Client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.business_name}
                </option>
              ))}
            </select>

            {/* Templates */}
            {templates.length === 0 ? (
              <p>No approved templates found</p>
            ) : (
              templates.map((tpl, idx) => (
                <div
                  key={idx}
                  className="template-item"
                  style={{
                    padding: "10px",
                    margin: "10px 0",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                  }}
                >
                  <p><strong>{tpl.name}</strong></p>
                  <p>{tpl.components.find(c => c.type === 'BODY')?.text}</p>
                  <button
                    className="send-template-btn"
                    onClick={() => sendTemplateMessage(tpl)}
                    style={{ marginTop: "5px" }}
                  >
                    Send ➤
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
