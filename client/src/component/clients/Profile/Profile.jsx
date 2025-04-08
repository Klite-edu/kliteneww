import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faTrash, faImage } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import "./profile.css";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Profile = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const defaultLogoUrl = process.env.PUBLIC_URL + "/images/logo.png";
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const [customPermissions, setCustomPermissions] = useState({});
  const [role, setRole] = useState(null);
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            { withCredentials: true }
          ),
        ]);

        const userToken = tokenRes.data.token;
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};

        if (!userToken || !userRole) {
          navigate("/login");
          return;
        }

        const decodedToken = jwtDecode(userToken);
        const currentUserId = decodedToken.userId;
        const currentEmployeeId = decodedToken.id;

        setToken(userToken);
        setRole(userRole);
        setUserId(currentUserId);
        setEmployeeId(currentEmployeeId);
        setCustomPermissions(userPermissions);

        fetchLogo(userToken);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        navigate("/login");
      }
    };

    fetchInitialData();
  }, [navigate]);

  // Get authentication headers for API requests
  const getAuthHeaders = () => {
    if (!token) return null;
    
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    };
  };

  // Fetch logo when component mounts or token changes
  const fetchLogo = async (currentToken) => {
    try {
      const headers = {
        headers: {
          Authorization: `Bearer ${currentToken || token}`,
        },
        withCredentials: true,
      };
      
      if (!currentToken && !token) return;

      const response = await axios.get(`${API_URL}/api/logo/list`, headers);
      if (response.data.length > 0) {
        setLogoUrl(response.data[0].imageUrl);
      } else {
        setLogoUrl(defaultLogoUrl); // Fallback to default logo
      }
    } catch (error) {
      console.error("❌ [Fetch Logo] Error:", error.message);
      setLogoUrl(defaultLogoUrl); // On error, use default
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image must be less than 2MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setIsUploading(false);
        setUploadError("Authentication error");
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/logo/upload`,
        formData,
        headers
      );
      setLogoUrl(response.data.imageUrl);
      setIsUploading(false);
    } catch (error) {
      console.error("❌ [Upload Logo] Error:", error.message);
      setUploadError("Failed to upload logo");
      setIsUploading(false);
    }
  };

  const deleteLogo = async () => {
    // Don't delete if we're already using the default logo
    if (logoUrl === defaultLogoUrl) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setUploadError("Authentication error");
        return;
      }

      const logoKey = logoUrl.split("/").pop();
      await axios.delete(`${API_URL}/api/logo/delete/${logoKey}`, headers);
      setLogoUrl(defaultLogoUrl);
    } catch (error) {
      console.error("❌ [Delete Logo] Error:", error.message);
      setUploadError("Failed to delete logo");
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="profile-container">
        <div className="profile-section">
          <h2>Company Logo</h2>
          <p>Upload your company logo to display in the sidebar</p>

          <div className="logo-management">
            <div className="logo-preview">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="logo-image" />
              ) : (
                <div className="logo-placeholder">
                  <FontAwesomeIcon icon={faImage} />
                </div>
              )}
            </div>

            <div className="logo-actions">
              <button
                className="logo-action-btn upload-btn"
                onClick={triggerFileInput}
                disabled={isUploading}
              >
                <FontAwesomeIcon icon={faUpload} />
                <span>{isUploading ? "Uploading..." : "Upload Logo"}</span>
              </button>

              <button
                className="logo-action-btn delete-btn"
                onClick={deleteLogo}
                disabled={isUploading || logoUrl === defaultLogoUrl}
              >
                <FontAwesomeIcon icon={faTrash} />
                <span>Remove Logo</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="file-input"
            />

            {uploadError && <div className="upload-error">{uploadError}</div>}
          </div>

          <div className="logo-requirements">
            <h3>Logo Requirements</h3>
            <ul>
              <li>File formats: PNG, JPG, JPEG, SVG</li>
              <li>Maximum file size: 2MB</li>
              <li>Recommended dimensions: 200px x 80px</li>
              <li>
                For best results, use an image with transparent background
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;