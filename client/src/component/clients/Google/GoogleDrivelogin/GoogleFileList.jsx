import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GoogleFileList = ({ token, gapiLoaded }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gapiLoaded || !window.google || !token) return;

    const fetchFiles = async () => {
      try {
        const auth = new window.google.auth.OAuth2();
        auth.setCredentials({ access_token: token });
        
        const oauth2 = window.google.oauth2({ version: 'v2', auth });
        const userInfo = await oauth2.userinfo.get();
        const userEmail = userInfo.data.email;

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/files`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { email: userEmail }
        });

        setFiles(response.data.files || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError('Failed to load files');
        setLoading(false);
      }
    };

    fetchFiles();
  }, [token, gapiLoaded]);

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/file/${fileId}`, {
        data: { accessToken: token }
      });
      setFiles(files.filter(file => file.fileId !== fileId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  };

  if (loading) return <div className="loading">Loading files...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="file-list-section">
      <h2>Your Files</h2>
      {files.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        <div className="file-grid">
          {files.map((file) => (
            <div key={file.fileId} className="file-card">
              <div className="file-thumbnail">
                {file.mimeType.startsWith('image/') ? (
                  <img src={`https://drive.google.com/thumbnail?id=${file.fileId}`} alt={file.fileName} />
                ) : (
                  <div className="file-icon">📄</div>
                )}
              </div>
              <div className="file-info">
                <h3>{file.fileName}</h3>
                <div className="file-actions">
                  <a 
                    href={file.viewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-btn"
                  >
                    View
                  </a>
                  <button 
                    onClick={() => handleDelete(file.fileId)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoogleFileList;