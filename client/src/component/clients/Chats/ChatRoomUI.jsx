import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ProfileSidebar from './ProfileSidebar';

function ChatRoomUI() {
    const [chatUsers, setChatUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [isProfileVisible, setIsProfileVisible] = useState(false);

    useEffect(() => {
        fetchActiveChatUsers();
    }, []);

    const fetchActiveChatUsers = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/ticket/chats/chatbot/unique-users`);
            const data = await res.json();
            const usersData = data.map((userId, index) => ({
                id: userId,
                name: `${userId}`,
                avatar: null,
                status: 'Hey there! I am using WhatsApp.',
                online: Math.random() > 0.5, // simulate online
                lastSeen: new Date().toLocaleString()
            }));
            setChatUsers(usersData);
            if (usersData.length > 0) setActiveUser(usersData[0]);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const updateChatUserProfile = (id, updates) => {
        setChatUsers(chatUsers.map(user => user.id === id ? { ...user, ...updates } : user));
        setActiveUser(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
    };

    return (
        <div style={styles.container}>
            <Sidebar
                chatUsers={chatUsers}
                activeUser={activeUser}
                onChatUserSelect={(user) => {
                    setActiveUser(user);
                    setIsProfileVisible(false);
                }}
            />
            <ChatWindow
                activeUser={activeUser}
                onProfileIconClick={() => setIsProfileVisible(true)}
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
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif'
    }
};

export default ChatRoomUI;