import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import ProfileSidebar from "./ProfileSidebar";
import axios from "axios";

function ChatRoomUI() {
  const [chatUsers, setChatUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [agentId, setAgentId] = useState(null);

  useEffect(() => {
    const storedAgentId = localStorage.getItem("userId");

    if (storedAgentId) {
      setAgentId(storedAgentId);
    } else {
      console.error("❌ Agent ID not found in localStorage.");
    }

    fetchActiveChatUsers();
  }, []);

  // ✅ Fetch all users (OPTIONAL if you want a sidebar list)
  const fetchActiveChatUsers = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ticket/chatbot/unique-users`
      );
  
      const data = res.data;
      console.log("customer data", res.data);
  
      const usersData = data.map((user) => ({
        id: user.user_id,          // ✅ Correct
        user_id: user.user_id,     // ✅ Correct
        waba_id: user.waba_id,     // ✅ Correct
        name: user.user_id,        // ✅ Correct display
        avatar: null,
        status: "Hey there! I am using WhatsApp.",
        online: Math.random() > 0.5,
        lastSeen: new Date().toLocaleString(),
      }));
  
      setChatUsers(usersData);
  
      if (usersData.length > 0) {
        setActiveUser(usersData[0]);
      }
    } catch (error) {
      console.error("❌ Error fetching active users:", error);
    }
  };
  

  // ✅ Update user profile (Sidebar & ChatWindow)
  const updateChatUserProfile = (id, updates) => {
    setChatUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
    setActiveUser((prev) =>
      prev && prev.id === id ? { ...prev, ...updates } : prev
    );
  };

  return (
    <div style={styles.container}>
      <Sidebar
        users={chatUsers}
        selectedUser={activeUser}
        onUserSelect={(user) => {
          setActiveUser(user);
          setIsProfileVisible(false);
        }}
      />

      <ChatWindow
        selectedUser={activeUser}
        agentId={agentId}
        onProfileClick={() => setIsProfileVisible(true)}
        setSelectedUser={setActiveUser}
      />

      <ProfileSidebar
        isVisible={isProfileVisible}
        user={activeUser}
        onClose={() => setIsProfileVisible(false)}
        onUpdateProfile={updateChatUserProfile}
      />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    fontFamily: "Arial, sans-serif",
  },
};

export default ChatRoomUI;
