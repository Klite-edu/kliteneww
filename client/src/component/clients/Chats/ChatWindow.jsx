import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

// Initialize socket connection (autoConnect: false initially)
const socket = io(process.env.REACT_APP_SOCKET_URL, { autoConnect: false });

const ChatWindow = ({ selectedUser, agentId, onProfileClick, setSelectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showTicketPopup, setShowTicketPopup] = useState(false);
  const [incomingTicket, setIncomingTicket] = useState(null);
  const [chatLocked, setChatLocked] = useState(true);
  const chatRef = useRef(null);

  console.log("ChatWindow component rendered");
  console.log("Selected User:", selectedUser);
  console.log("Agent ID:", agentId);

  // Connect socket when agentId becomes available
  useEffect(() => {
    if (!agentId) {
      console.log("No agent ID provided. Skipping socket join.");
      return;
    }

    console.log("Connecting socket...");
    socket.connect();

    console.log("Joining agent room with ID:", agentId);
    socket.emit('joinAgentRoom', agentId);

    console.log("Joining agents common room");
    socket.emit('joinAgentRoom', 'agents');

    return () => {
      console.log("Disconnecting socket...");
      socket.disconnect();
    };
  }, [agentId]);

  // Setup socket listeners only once
  useEffect(() => {
    console.log("Setting up socket listeners...");

    socket.on('ticketRaised', (ticket) => {
      console.log('🚨 Ticket Raised:', ticket);

      // If agent has already selected this user, ignore
      if (selectedUser && selectedUser.user_id === ticket.user_id) {
        console.log("Ticket for selected user already open");
        return;
      }

      setIncomingTicket(ticket);
      setShowTicketPopup(true);
    });

    socket.on('closeTicketPopup', ({ ticketId }) => {
      console.log('❌ Close ticket popup for ticket:', ticketId);

      if (incomingTicket && incomingTicket.ticketId === ticketId) {
        console.log("Closing popup for ticket:", ticketId);
        setShowTicketPopup(false);
        setIncomingTicket(null);
      }
    });

    socket.on('chatAssigned', ({ ticket, chatHistory, agent }) => {
      console.log('✅ Chat Assigned:', ticket);
      console.log("Chat History:", chatHistory);
      console.log("Assigned Agent:", agent);

      setIncomingTicket(null);
      setShowTicketPopup(false);
      setChatLocked(false);

      const formattedMessages = chatHistory.map((msg, index) => ({
        _id: index,
        sender: msg.model === 'human' ? 'agent' : 'bot',
        message: msg.bot_response.length > 0 ? msg.bot_response[0] : msg.user_message[0],
        timestamp: new Date()
      }));

      setMessages(formattedMessages);
    });

    socket.on('receiveMessage', (data) => {
      console.log("Received message from user:", data);

      if (selectedUser && data.user_id === selectedUser.user_id) {
        setMessages(prev => [
          ...prev,
          {
            _id: Date.now(),
            sender: 'user',
            message: data.message,
            timestamp: new Date()
          }
        ]);
      }
    });

    return () => {
      console.log("Cleaning up socket listeners...");
      socket.off('ticketRaised');
      socket.off('closeTicketPopup');
      socket.off('chatAssigned');
      socket.off('receiveMessage');
    };
  }, [incomingTicket, selectedUser]);

  // Handle room joining when user selected
  useEffect(() => {
    if (selectedUser) {
      console.log("Selected user changed. Fetching messages and joining room...");
      fetchMessages();
      socket.emit('joinRoom', selectedUser.user_id);
    }
  }, [selectedUser]);

  const fetchMessages = async () => {
    if (!selectedUser) return;

    console.log("Fetching messages for user:", selectedUser.user_id);

    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/ticket/chatbot`);
      const data = res.data;
      console.log("Fetched chat data:", data);

      const userChat = data.find(chat => chat.user_id === selectedUser.user_id);

      if (userChat) {
        console.log("User chat found:", userChat);
        const combinedMessages = [];

        const userMessages = userChat.user_message || [];
        const botResponses = userChat.bot_response || [];

        userMessages.forEach((msg, index) => {
          combinedMessages.push({
            _id: `user-${index}`,
            sender: 'user',
            message: msg,
            timestamp: new Date()
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
        setChatLocked(false);
      } else {
        console.log("No chat found for user.");
        setMessages([]);
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLocked) {
      console.log("Message input is empty or chat is locked. Skipping send.");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      _id: tempId,
      sender: 'agent',
      message: input,
      timestamp: new Date().toISOString()
    };

    console.log("Adding temporary message to UI:", newMessage);
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      console.log("Sending message to server...");
      await axios.post(`${process.env.REACT_APP_API_URL}/api/tickets/send`, {
        agent_id: agentId,
        user_id: selectedUser.user_id,
        message: input,
        waba_id: selectedUser.waba_id
      });

      console.log("Emitting sendMessage event to socket...");
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
            ? { ...msg, message: 'Failed to send message.' }
            : msg
        )
      );
    }
  };

  const acceptTicket = async () => {
    if (!incomingTicket) {
      console.log("No incoming ticket to accept.");
      return;
    }

    try {
      console.log("Accepting ticket:", incomingTicket);
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/tickets/accept`, {
        ticket_id: incomingTicket.ticketId,
        agent_id: agentId
      });

      if (res.data.ticket) {
        console.log('✅ Ticket accepted!');
        setShowTicketPopup(false);
        setChatLocked(false);
        fetchMessages();
      } else {
        console.error('❌ Ticket acceptance failed!');
      }

    } catch (error) {
      console.error('❌ Error accepting ticket:', error);
    }
  };

  const endSession = async () => {
    if (!selectedUser) return;

    console.log("Ending session for user:", selectedUser.user_id);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/tickets/end-session`, {
        user_id: selectedUser.user_id,
        agent_id: agentId
      });

      console.log('✅ Session ended. Bot resumes.');

      setChatLocked(true);

      if (setSelectedUser) setSelectedUser(null);

      socket.emit('leaveRoom', selectedUser.user_id);

    } catch (error) {
      console.error('❌ Error ending session:', error);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      console.log("Scrolling chat to the bottom...");
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = timestamp ? new Date(timestamp) : new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!selectedUser) {
    console.log("No user selected. Rendering placeholder.");
    return (
      <div className="no-chat-selected">
        <h2>Select a user to start chatting!</h2>
      </div>
    );
  }

  console.log("Rendering ChatWindow with messages:", messages);

  return (
    <div className="chat-container">

      {/* Ticket Popup */}
      {showTicketPopup && incomingTicket && (
        <div className="ticket-popup">
          <div className="ticket-popup-content">
            <h3>New Ticket Raised!</h3>
            <p>Customer <strong>{incomingTicket.userName}</strong> needs support.</p>
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

        <button onClick={endSession} disabled={chatLocked} className="end-session-button">
          End Session
        </button>
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
