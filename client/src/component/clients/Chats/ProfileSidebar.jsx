import React, { useState, useEffect } from 'react';

const ProfileSidebar = ({ show, user, onClose, onUpdateProfile }) => {
  const [status, setStatus] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusUpdated, setStatusUpdated] = useState(false);

  useEffect(() => {
    if (user) {
      setStatus(user.status || '');
      setAvatar(user.avatar);
      setStatusUpdated(false);
    }
  }, [user]);

  const handleStatusUpdate = () => {
    if (status.trim() !== user.status) {
      onUpdateProfile(user.id, { status: status.trim() });
      setStatusUpdated(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setStatusUpdated(false);
      }, 3000);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = () => {
      const imgData = reader.result;
      setAvatar(imgData);
      onUpdateProfile(user.id, { avatar: imgData });
      setIsUploading(false);
    };
    
    reader.onerror = () => {
      setIsUploading(false);
      alert('Error uploading image');
    };
    
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <div
      style={{
        ...styles.sidebar,
        transform: show ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Profile</h2>
        <button onClick={onClose} style={styles.closeButton}>
          ×
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.avatarContainer}>
          <div style={styles.avatarWrapper}>
            {isUploading ? (
              <div style={styles.uploadingOverlay}>Uploading...</div>
            ) : null}
            
            {avatar ? (
              <img src={avatar} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={styles.defaultAvatar}>👤</div>
            )}
          </div>
          
          <label style={styles.uploadButton}>
            Change Photo
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarUpload} 
              style={styles.fileInput}
              disabled={isUploading}
            />
          </label>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Status</label>
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="What's on your mind?"
            style={styles.statusInput}
            maxLength={100}
          />
          {statusUpdated && (
            <div style={styles.successMessage}>Status updated successfully!</div>
          )}
          <div style={styles.charCount}>{status.length}/100</div>
          <button 
            onClick={handleStatusUpdate} 
            style={{
              ...styles.saveButton,
              opacity: status.trim() !== user.status ? 1 : 0.6,
              cursor: status.trim() !== user.status ? 'pointer' : 'default'
            }}
            disabled={status.trim() === user.status}
          >
            Update Status
          </button>
        </div>

        <div style={styles.infoSection}>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Name</div>
            <div style={styles.infoValue}>{user.name}</div>
          </div>
          
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Last Seen</div>
            <div style={styles.infoValue}>{user.lastSeen}</div>
          </div>
          
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Online Status</div>
            <div style={styles.infoValue}>
              <span style={{
                ...styles.onlineIndicator,
                backgroundColor: user.online ? '#4CAF50' : '#FF5722'
              }}></span>
              {user.online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100%',
    width: '300px',
    backgroundColor: '#fff',
    borderLeft: '1px solid #ddd',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'transform 0.3s ease-in-out',
    overflow: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#075E54',
    color: '#fff'
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold'
  },
  closeButton: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    padding: 0
  },
  content: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: '25px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: '15px',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    borderRadius: '50%',
    zIndex: 1
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #075E54'
  },
  defaultAvatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#eee',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '50px',
    border: '3px solid #075E54'
  },
  uploadButton: {
    backgroundColor: '#075E54',
    color: '#fff',
    padding: '8px 15px',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'inline-block',
    textAlign: 'center'
  },
  fileInput: {
    display: 'none'
  },
  formGroup: {
    width: '100%',
    marginBottom: '20px',
    position: 'relative'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#555'
  },
  statusInput: {
    padding: '12px',
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    marginBottom: '5px',
    boxSizing: 'border-box'
  },
  charCount: {
    textAlign: 'right',
    fontSize: '12px',
    color: '#888',
    marginBottom: '10px'
  },
  successMessage: {
    color: '#4CAF50',
    fontSize: '12px',
    marginTop: '5px'
  },
  saveButton: {
    backgroundColor: '#075E54',
    color: '#fff',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  infoSection: {
    width: '100%',
    borderTop: '1px solid #eee',
    paddingTop: '20px',
    marginTop: '10px'
  },
  infoItem: {
    marginBottom: '15px'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '3px'
  },
  infoValue: {
    fontSize: '14px',
    color: '#333',
    display: 'flex',
    alignItems: 'center'
  },
  onlineIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: '8px'
  }
};

export default ProfileSidebar;