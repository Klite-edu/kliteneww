import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import ProfileSidebar from "./ProfileSidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ChatRoomUI() {
  const [chatUsers, setChatUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [agentId, setAgentId] = useState(null);
  const [token, setToken] = useState("");
  const [role, setRole] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});
  const navigate = useNavigate();

  // Fetch initial data (token, role, permissions, agentId)
  const fetchInitialData = useCallback(async () => {
    try {
      const [tokenRes, roleRes, permissionsRes, userRes] = await Promise.all([
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
        // Add this new request to get userId from cookies
        axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-token`, {
          withCredentials: true,
        }),
      ]);

      const userToken = tokenRes.data.token;
      const userRole = roleRes.data.role;
      const userPermissions = permissionsRes.data.permissions || {};
      const userId = userRes.data.userId; // Get userId from cookies

      if (!userToken || !userRole || !userId) {
        navigate("/");
        return;
      }

      setToken(userToken);
      setRole(userRole);
      setCustomPermissions(userPermissions);
      setAgentId(userId); // Set agentId from cookies

      fetchActiveChatUsers(userToken);
    } catch (error) {
      console.error("❌ Error fetching initial data:", error);
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch all users with authentication
  const fetchActiveChatUsers = async (authToken) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ticket/chatbot/unique-users`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            withCredentials: true,
          },
        }
      );

      const data = res.data;
      console.log("customer data", res.data);

      const usersData = data.map((user) => ({
        id: user.user_id,
        user_id: user.user_id,
        waba_id: user.waba_id,
        name: user.user_id,
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
      if (error.response?.status === 401) {
        navigate("/");
      }
    }
  };

  // Update user profile (Sidebar & ChatWindow)
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
