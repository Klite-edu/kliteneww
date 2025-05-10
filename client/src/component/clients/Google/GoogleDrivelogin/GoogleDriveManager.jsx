import React, { useState, useEffect } from "react";
import axios from "axios";
import "./googledrive.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../Sidebar/Sidebar";
import Navbar from "../../../Navbar/Navbar";

const GoogleDriveManager = () => {
  // State for file listing
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [googleToken, setGoogleToken] = useState(null);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const navigate = useNavigate();

  // Load user permissions and token (from DelegateTask)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch token, role, and permissions in parallel
        const tokenRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );

        const userToken = tokenRes.data.token;

        const [roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            {
              withCredentials: true,
              headers: { Authorization: `Bearer ${userToken}` },
            }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            {
              withCredentials: true,
              headers: { Authorization: `Bearer ${userToken}` },
            }
          ),
        ]);

        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};

        if (!userToken || !userRole) {
          return;
        }

        setToken(userToken);
        setRole(userRole);
        setCustomPermissions(userPermissions);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [navigate]);

  // Load Google API
  useEffect(() => {
    if (window.gapi) {
      setGapiLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load("client:auth2", () => {
        setGapiLoaded(true);
      });
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch Google token
  useEffect(() => {
    const fetchGoogleToken = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/admin/google-token`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`, // ✅ send JWT
            },
          }
        );

        if (response.data && response.data.accessToken) {
          setGoogleToken(response.data.accessToken);
        }
      } catch (err) {
        console.error(err);
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 404)
        ) {
          // 🟡 If token not found, gracefully show "not connected" state
          setGoogleToken(null); // token null rakh
          setError(null); // koi error message show na kar
        } else {
          setError(
            "Failed to load Google authentication. Please try logging in again."
          );
        }
        setLoading(false);
      }
    };

    fetchGoogleToken();
  }, []);

  // Fetch files when token and gapi are both ready
  useEffect(() => {
    if (!googleToken) return;

    const fetchFiles = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/user/files`,
          { withCredentials: true }
        );
        setFiles(response.data.files || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to load files.");
        setLoading(false);
      }
    };

    fetchFiles();
  }, [googleToken]);

  // Handle file selection for upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);

      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file || !googleToken) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(",")[1];

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/admin/upload`,
          {
            fileName: file.name,
            mimeType: file.type,
            fileData: base64Data,
          },
          {
            withCredentials: true,
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            },
          }
        );

        setFiles([response.data, ...files]);
        setIsUploading(false);
        setFile(null);
        setPreviewUrl(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError("Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  // Handle file deletion
  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/auth/file/${fileId}`, {
        withCredentials: true,
      });
      setFiles(files.filter((file) => file.fileId !== fileId));
    } catch (error) {
      setError("Failed to delete file");
    }
  };
  if (loading) {
    return (
      <div className="googledrive-loading-indicator">
        Loading Google Drive integration...
      </div>
    );
  }

  // If no googleToken found
  if (!googleToken) {
    return (
      <>
        <Sidebar role={role} customPermissions={customPermissions} />
        <Navbar />
        <div className="googledrive-error-container">
          <p>No Google Drive connected yet.</p>
          {(role === "client" ||
            customPermissions["GoogleDrive Connect"]?.includes("create")) && (
            <button
              onClick={() => {
                window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
              }}
              className="googledrive-connect-btn"
            >
              Connect Google Drive
            </button>
          )}
        </div>
      </>
    );
  }

  const handleDisconnect = async () => {
    try {
      await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/disconnect-google`,
        {
          withCredentials: true,
        }
      );
      setGoogleToken(null); // ✅ Google access frontend se bhi hata do
      alert("Google Drive disconnected successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to disconnect Google Drive. Please try again.");
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="googledrive-container">
        <div className="googledrive-upload-section">
          <h2 className="googledrive-upload-title">Upload File</h2>
          <div className="googledrive-upload-container">
            <div className="googledrive-file-input-container">
              {(role === "client" ||
                customPermissions["GoogleDrive Connect"]?.includes(
                  "create"
                )) && (
                <>
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="googledrive-file-input"
                  />
                  <label
                    htmlFor="file-upload"
                    className="googledrive-file-upload-label"
                  >
                    Choose File
                  </label>
                </>
              )}
              {file && (
                <span className="googledrive-file-name">{file.name}</span>
              )}
            </div>

            {file && (
              <div className="googledrive-upload-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" />
                ) : (
                  <div className="googledrive-file-icon">📄</div>
                )}
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="googledrive-upload-btn"
                >
                  {isUploading
                    ? `Uploading... ${uploadProgress}%`
                    : "Upload to Drive"}
                </button>
                {isUploading && (
                  <div className="googledrive-progress-container">
                    <div
                      className="googledrive-progress-bar"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {googleToken &&
          (role === "client" ||
            customPermissions["GoogleDrive Connect"]?.includes("delete")) && (
            <button
              onClick={handleDisconnect}
              className="googledrive-disconnect-btn"
            >
              Disconnect Google Drive
            </button>
          )}

        <div className="googledrive-file-list-section">
          <h2 className="googledrive-file-list-title">Your Files</h2>
          {error && <p className="googledrive-error-message">{error}</p>}

          {loading ? (
            <p>Loading your files...</p>
          ) : files.length === 0 ? (
            <p>No files uploaded yet.</p>
          ) : (
            <div className="googledrive-file-grid">
              {files.map((file) => (
                <div key={file.fileId} className="googledrive-file-card">
                  <div className="googledrive-file-thumbnail">
                    {file.mimeType?.startsWith("image/") ? (
                      <img
                        src={`https://drive.google.com/thumbnail?id=${file.fileId}`}
                        alt={file.fileName}
                      />
                    ) : (
                      <div className="googledrive-file-icon">📄</div>
                    )}
                  </div>
                  <div className="googledrive-file-info">
                    <h3>{file.fileName}</h3>
                    <p className="googledrive-file-type">{file.mimeType}</p>
                    <div className="googledrive-file-actions">
                      {role === "client" ||
                      customPermissions["GoogleDrive Connect"]?.includes(
                        "read"
                      ) ? (
                        <a
                          href={file.viewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="googledrive-view-btn"
                        >
                          View
                        </a>
                      ) : null}
                      {role === "client" ||
                      customPermissions["GoogleDrive Connect"]?.includes(
                        "delete"
                      ) ? (
                        <button
                          onClick={() => handleDelete(file.fileId)}
                          className="googledrive-delete-btn"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GoogleDriveManager;
