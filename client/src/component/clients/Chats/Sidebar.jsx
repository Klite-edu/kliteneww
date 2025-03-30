import React, { useState, useEffect } from 'react';

const Sidebar = ({ users, selectedUser, onUserSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users || []);

  useEffect(() => {
    if (!users) {
      setFilteredUsers([]);
      return;
    }

    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(query) ||
        (user.status && user.status.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (!users || users.length === 0) {
    return (
      <div style={styles.sidebar}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h2 style={styles.headerTitle}>Contacts</h2>
          </div>
        </div>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>👥</div>
          <p>No contacts available</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h2 style={styles.headerTitle}>Contacts</h2>
          <div style={styles.userCount}>
            {filteredUsers.length} of {users.length} contacts
          </div>
        </div>
      </div>

      <div style={styles.searchContainer}>
        <div style={styles.searchInputWrapper}>
          <div style={styles.searchIcon}>🔍</div>
          <input
            type="text"
            placeholder="Search contacts..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              style={styles.clearButton}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={styles.userList}>
        {filteredUsers.length === 0 && searchQuery ? (
          <div style={styles.noResults}>
            <p>No contacts found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => onUserSelect(user)}
              style={{
                ...styles.userItem,
                backgroundColor: selectedUser?.id === user.id ? '#ece5dd' : 'transparent'
              }}
            >
              <div style={styles.avatar}>
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" style={styles.avatarImg} />
                ) : (
                  <div style={styles.defaultAvatar}>👤</div>
                )}
                {user.online && <div style={styles.onlineIndicator}></div>}
              </div>

              <div style={styles.userInfo}>
                <div style={styles.name}>{user.name}</div>
                <div style={styles.statusText}>
                  {user.status ? user.status : user.online ? 'Online' : `Last seen: ${user.lastSeen}`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: 300,
    backgroundColor: '#fff',
    borderRight: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  header: {
    padding: 16,
    backgroundColor: '#075E54',
    color: '#fff'
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold'
  },
  userCount: {
    fontSize: '12px',
    marginTop: '3px',
    opacity: 0.8
  },
  searchContainer: {
    padding: '10px',
    borderBottom: '1px solid #f0f0f0'
  },
  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    color: '#888',
    fontSize: '14px'
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px 8px 32px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  clearButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#eee'
  },
  userList: {
    overflowY: 'auto',
    flex: 1
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s'
  },
  avatar: {
    width: 45,
    height: 45,
    marginRight: 12,
    borderRadius: '50%',
    position: 'relative',
    overflow: 'hidden'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 20
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    border: '2px solid #fff'
  },
  userInfo: {
    flex: 1,
    overflow: 'hidden'
  },
  name: {
    fontWeight: 'bold',
    marginBottom: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  statusText: {
    fontSize: '12px',
    color: '#888',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 20px',
    color: '#888'
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '10px'
  },
  noResults: {
    padding: '20px',
    textAlign: 'center',
    color: '#888'
  }
};

export default Sidebar;
