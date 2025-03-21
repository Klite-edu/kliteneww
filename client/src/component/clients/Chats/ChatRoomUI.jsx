// ChatRoomUI Component
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import ProfileSidebar from "./ProfileSidebar";

function ChatRoomUI() {
  const [chatUsers, setChatUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [agentId, setAgentId] = useState(null);

  useEffect(() => {
    // Example of fetching agentId from localStorage or an API
    const storedAgentId = localStorage.getItem("userId");
    if (storedAgentId) {
      setAgentId(storedAgentId);
    } else {
      // fallback or fetch logic here
      console.error("Agent ID not found");
    }
    fetchActiveChatUsers();
  }, []);

  const fetchActiveChatUsers = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ticket/chatbot/unique-users`
      );

      const text = await res.text(); // <-- get raw response text
      console.log("Raw response:", text);

      const data = JSON.parse(text); // <-- convert to JSON manually

      const usersData = data.map((userId, index) => ({
        id: userId,
        user_id: userId,
        waba_id: "yourWabaId",
        name: `${userId}`,
        avatar: null,
        status: "Hey there! I am using WhatsApp.",
        online: Math.random() > 0.5,
        lastSeen: new Date().toLocaleString(),
      }));

      setChatUsers(usersData);
      if (usersData.length > 0) setActiveUser(usersData[0]);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const updateChatUserProfile = (id, updates) => {
    setChatUsers(
      chatUsers.map((user) => (user.id === id ? { ...user, ...updates } : user))
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
        setSelectedUser={setActiveUser} // 👈 Add this line
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
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
  },
};

export default ChatRoomUI;
