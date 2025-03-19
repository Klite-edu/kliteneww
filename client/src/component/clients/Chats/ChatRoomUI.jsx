import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ProfileSidebar from './ProfileSidebar';

function ChatRoomUI() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);


    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/chats/chatbot/unique-users`);
            const data = await res.json();
            const usersData = data.map((userId, index) => ({
                id: userId,
                name: `${userId}`,
                avatar: null,
                status: 'Hey there! I am using WhatsApp.',
                online: Math.random() > 0.5, // simulate online
                lastSeen: new Date().toLocaleString()
            }));
            setUsers(usersData);
            if (usersData.length > 0) setSelectedUser(usersData[0]);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const updateUserProfile = (id, updates) => {
        setUsers(users.map(user => user.id === id ? { ...user, ...updates } : user));
        setSelectedUser(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
    };

    return (
        <div style={styles.container}>
            <Sidebar
                users={users}
                selectedUser={selectedUser}
                onUserSelect={(user) => {
                    setSelectedUser(user);
                    setShowProfile(false);
                }}
            />
            <ChatWindow
                selectedUser={selectedUser}
                onProfileClick={() => setShowProfile(true)}
            />
            <ProfileSidebar
                show={showProfile}
                user={selectedUser}
                onClose={() => setShowProfile(false)}
                onUpdateProfile={updateUserProfile}
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
