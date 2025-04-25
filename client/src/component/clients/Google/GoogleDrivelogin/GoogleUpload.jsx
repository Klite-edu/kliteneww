import React, { useState } from 'react';
import axios from 'axios';

const GoogleUpload = ({ token }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(',')[1];
        
        const response = await axios.post( `${process.env.REACT_APP_API_URL}/upload`, {
          accessToken: token,
          fileName: file.name,
          mimeType: file.type,
          fileData: base64Data
        }, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });

        alert(`File uploaded successfully!\nView link: ${response.data.viewLink}`);
        setIsUploading(false);
        setFile(null);
        setPreviewUrl(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-section">
      <h2>Upload Image</h2>
      <div className="upload-container">
        <div className="file-input-container">
          <input 
            type="file" 
            id="file-upload" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <label htmlFor="file-upload" className="file-upload-label">
            Choose Image
          </label>
          {file && <span className="file-name">{file.name}</span>}
        </div>

        {previewUrl && (
          <div className="image-preview">
            <img src={previewUrl} alt="Preview" />
            <button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="upload-btn"
            >
              {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload to Drive'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleUpload;