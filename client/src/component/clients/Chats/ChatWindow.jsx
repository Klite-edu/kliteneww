import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./chatwindow.css";
import { useNavigate } from "react-router-dom";

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
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [templates, setTemplates] = useState([]);
  const [showTemplatePopup, setShowTemplatePopup] = useState(false);
  const [token, setToken] = useState("");
  const [role, setRole] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const chatRef = useRef(null);
  const navigate = useNavigate();

  // Fetch initial data (token, role, permissions)
  const fetchInitialData = useCallback(async () => {
    try {
      const [tokenRes, roleRes, permissionsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-token`, {
          withCredentials: true,
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, {
          withCredentials: true,
        }),
        axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
          {
            withCredentials: true,
          }
        ),
      ]);

      const userToken = tokenRes.data.token;
      const userRole = roleRes.data.role;
      const userPermissions = permissionsRes.data.permissions || {};

      setToken(userToken);
      setRole(userRole);
      setCustomPermissions(userPermissions);

      // Initialize chat state
      const lockedState = localStorage.getItem("chatLocked");
      setChatLocked(lockedState === "false" ? false : true);

      const storedUser = localStorage.getItem("selectedUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setSelectedUser(parsedUser);
      }

      fetchIncomingTickets(userToken);
    } catch (error) {
      console.error("❌ Error fetching initial data:", error);
      if (error.response?.status === 401) {
        navigate("/");
      }
    }
  }, [navigate, setSelectedUser]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Auto-refresh messages every 5 seconds
  useEffect(() => {
    if (!selectedUser || !token) return;

    const interval = setInterval(() => {
      fetchMessages(token);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedUser, token]);

  useEffect(() => {
    if (!selectedUser || !token) return;
    fetchMessages(token);
    localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
  }, [selectedUser, token]);

  // Fetch incoming tickets with authentication
  const fetchIncomingTickets = async (token) => {
    try {
      setIsRefreshing(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ticket/pending-tickets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );
      setIncomingTickets(res.data);
    } catch (error) {
      console.error("❌ Error fetching pending tickets:", error);
      if (error.response?.status === 401) {
        navigate("/");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Accept ticket with authentication
  const acceptTicket = async (ticket) => {
    try {
      console.log("Attempting to accept ticket:", {
        ticket_id: ticket._id,
        agent_id: agentId,
      });

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ticket/accept`,
        {
          ticket_id: ticket._id,
          agent_id: agentId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
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

        fetchMessages(token);
        fetchIncomingTickets(token);
      }
    } catch (error) {
      console.error("❌ Detailed error accepting ticket:", {
        error: error.response?.data || error.message,
        status: error.response?.status,
        config: error.config,
      });
      if (error.response?.status === 401) {
        navigate("/");
      }
    }
  };

  // Fetch messages with authentication
  const fetchMessages = async (authToken) => {
    if (!selectedUser) return;

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ticket/chatbot`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            withCredentials: true,
          },
        }
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
      if (error.response?.status === 401) {
        navigate("/");
      }
    }
  };

  // Fetch clients for template popup with authentication
  const fetchClients = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/meta/clients`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );
      setClients(res.data);
    } catch (err) {
      console.error("❌ Error fetching clients:", err);
      if (err.response?.status === 401) {
        navigate("/");
      }
    }
  };

  // Fetch templates with authentication
  const fetchApprovedTemplates = async (clientId) => {
    if (!clientId) return;

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/meta/templates/${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );

      const approvedTemplates = res.data.data.filter(
        (tpl) => tpl.status === "APPROVED"
      );
      setTemplates(approvedTemplates);
    } catch (error) {
      console.error("❌ Error fetching templates:", error);
      if (error.response?.status === 401) {
        navigate("/");
      }
    }
  };

  // Send message with authentication
  const sendMessage = async () => {
    if (!input.trim() || chatLocked || !token) return;

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
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ticket/send`,
        {
          agent_id: agentId,
          user_id: selectedUser.user_id,
          message: messageText,
          waba_id: selectedUser.waba_id,
          sender_type: "agent",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );

      fetchMessages(token);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      // Revert the message if sending fails
      setMessages((prev) => prev.filter((msg) => msg._id !== newMessage._id));
      if (error.response?.status === 401) {
        navigate("/");
      }
    }
  };

  // Send template message with authentication
  const sendTemplateMessage = async (template) => {
    if (!template || chatLocked || !token) return;

    const bodyComponent = template.components.find(
      (comp) => comp.type === "BODY"
    );
    if (!bodyComponent) {
      alert("Template has no body text.");
      return;
    }

    const templateMessage = bodyComponent.text;
    const newMessage = {
      _id: `agent-${Date.now()}`,
      sender: "agent",
      message: templateMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ticket/send`,
        {
          agent_id: agentId,
          user_id: selectedUser.user_id,
          message: templateMessage,
          waba_id: selectedUser.waba_id,
          sender_type: "agent",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );

      setShowTemplatePopup(false);
      fetchMessages(token);
    } catch (error) {
      console.error("❌ Error sending template message:", error);
      // Revert the message if sending fails
      setMessages((prev) => prev.filter((msg) => msg._id !== newMessage._id));
      if (error.response?.status === 401) {
        navigate("/");
      }
    }
  };

  // End session with authentication
  const endSession = async () => {
    if (!selectedUser || !token) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ticket/end-session`,
        {
          user_id: selectedUser.user_id,
          agent_id: agentId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );

      setChatLocked(true);
      localStorage.setItem("chatLocked", "true");

      setSelectedUser(null);
      localStorage.removeItem("selectedUser");
      setMessages([]);
    } catch (error) {
      console.error("❌ Error ending session:", error);
      if (error.response?.status === 401) {
        navigate("/");
      }
    }
  };

  // Auto fetch clients when template popup opens
  useEffect(() => {
    if (showTemplatePopup && token) {
      fetchClients();
    }
  }, [showTemplatePopup, token]);

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

  const getMessageClass = (sender) => {
    switch (sender) {
      case "agent":
        return "agent-message";
      case "bot":
        return "bot-message";
      case "user":
      default:
        return "customer-message";
    }
  };

  return (
    <div className="chat-container">
      {/* INCOMING TICKETS */}
      <div className="incoming-tickets-section">
        <h3>📥 Incoming Tickets</h3>
        <button
          onClick={() => fetchIncomingTickets(token)}
          className="refresh-tickets-button"
          disabled={isRefreshing}
        >
          {isRefreshing ? "⏳ Refreshing..." : "🔄 Refresh"}
        </button>

        {incomingTickets.length === 0 ? (
          <p>No pending tickets</p>
        ) : (
          incomingTickets.map((ticket) => (
            <div key={ticket._id} className="ticket-item">
              <p>
                User: <strong>{ticket.user_id}</strong>
              </p>
              <p>First Message: {ticket.firstMessage || "N/A"}</p>
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
                  <img
                    src={selectedUser.avatar}
                    alt="avatar"
                    className="avatar-img"
                  />
                ) : (
                  "👤"
                )}
              </div>
              <div>
                <div className="user-name">
                  {selectedUser.name || selectedUser.user_id}
                </div>
                <div className="user-status">
                  {chatLocked ? "🔒 Session Locked" : "🟢 Active Session"}
                </div>
              </div>
            </div>

            <button
              onClick={endSession}
              disabled={chatLocked}
              className="end-session-button"
            >
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
                  className={`message-container ${getMessageClass(msg.sender)}`}
                >
                  <div className="message-content">
                    {msg.sender === "bot" && (
                      <div className="message-sender">Bot</div>
                    )}
                    {msg.sender === "agent" && (
                      <div className="message-sender">You</div>
                    )}
                    {msg.sender === "user" && (
                      <div className="message-sender">Customer</div>
                    )}
                    <div className="message-text">{msg.message}</div>
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
              placeholder={
                chatLocked
                  ? "🔒 Accept ticket to start chatting..."
                  : "Type your message..."
              }
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
              📋 Templates
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
                  <p>
                    <strong>{tpl.name}</strong>
                  </p>
                  <p>{tpl.components.find((c) => c.type === "BODY")?.text}</p>
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
