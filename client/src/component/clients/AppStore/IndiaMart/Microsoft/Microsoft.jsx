import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./microsoft.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../../Sidebar/Sidebar";
import Navbar from "../../../../Navbar/Navbar";

function Microsoft() {
  const [file, setFile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasValidSession, setHasValidSession] = useState(false);
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const navigate = useNavigate();

  // Check session status
  const checkSession = async () => {
    try {
      setIsLoading(true);
      const [sessionRes, roleRes, permissionsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/auth/check-session`, {
          withCredentials: true,
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, {
          withCredentials: true,
        }),
        axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
          { withCredentials: true }
        ),
      ]);

      if (sessionRes.data.valid) {
        setRole(roleRes.data.role);
        setCustomPermissions(permissionsRes.data.permissions || {});
        setHasValidSession(true);
        return true;
      } else {
        setHasValidSession(false);
        return false;
      }
    } catch (error) {
      setHasValidSession(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch uploads
  const fetchUploads = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/auth/uploads`,
        { withCredentials: true }
      );
      setUploads(response.data);
      setError("");
    } catch (error) {
      setError("Failed to fetch uploads");
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const sessionValid = await checkSession();
      if (sessionValid) {
        await fetchUploads();
      }
    };
    initialize();
  }, []);

  const handleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/login`;
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/auth/logout`,
        {
          withCredentials: true,
          headers: { Accept: "application/json" },
        }
      );
      if (response.data.success) {
        setHasValidSession(false);
        setUploads([]);
        window.location.href = "/microsoft";
      }
    } catch (error) {
      if (
        error.message.includes("Network Error") ||
        error.message.includes("Failed to fetch")
      ) {
        setHasValidSession(false);
        setUploads([]);
        window.location.href = "/microsoft";
      } else {
        setError("Logout failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      await fetchUploads();
      setFile(null);
      document.getElementById("file-input").value = "";
    } catch (error) {
      const errorMessage =
        typeof error.response?.data?.error === "object"
          ? JSON.stringify(error.response.data.error)
          : error.response?.data?.error || "Upload failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="ms-container">
        <header className="ms-header">
          <div className="ms-header-content">
            <div className="ms-logo">
              <svg viewBox="0 0 23 23" width="32" height="32">
                <path fill="#f25022" d="M1 1h10v10H1z"></path>
                <path fill="#7fba00" d="M12 1h10v10H12z"></path>
                <path fill="#00a4ef" d="M1 12h10v10H1z"></path>
                <path fill="#ffb900" d="M12 12h10v10H12z"></path>
              </svg>
              <h1 className="ms-title">OneDrive</h1>
            </div>
            {hasValidSession ? (
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="ms-button ms-button-primary"
              >
                {isLoading ? "Signing out..." : "Sign out"}
              </button>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="ms-button ms-button-primary"
              >
                {isLoading ? "Connecting..." : "Sign in"}
              </button>
            )}
          </div>
        </header>

        <main className="ms-main">
          {hasValidSession ? (
            <>
              <section className="ms-upload-section">
                <div className="ms-section-header">
                  <h2 className="ms-section-title">Upload files</h2>
                </div>
                <form onSubmit={handleFileUpload} className="ms-upload-form">
                  <div className="ms-file-upload">
                    <input
                      id="file-input"
                      type="file"
                      className="ms-file-input"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <label htmlFor="file-input" className="ms-file-label">
                      <svg className="ms-upload-icon" viewBox="0 0 24 24">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"></path>
                      </svg>
                      <span>{file ? file.name : "Choose a file"}</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={!file || isLoading}
                    className="ms-button ms-button-primary"
                  >
                    {isLoading ? (
                      <span className="ms-spinner"></span>
                    ) : (
                      "Upload"
                    )}
                  </button>
                </form>
              </section>

              <section className="ms-files-section">
                <div className="ms-section-header">
                  <h2 className="ms-section-title">Your files</h2>
                </div>
                {uploads.length > 0 ? (
                  <div className="ms-files-grid">
                    {uploads.map((item) => (
                      <div key={item._id} className="ms-file-card">
                        <div className="ms-file-icon">
                          <svg viewBox="0 0 24 24">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"></path>
                          </svg>
                        </div>
                        <div className="ms-file-info">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ms-file-name"
                          >
                            {item.name || item.link.split("/").pop() || "File"}
                          </a>
                          <div className="ms-file-meta">
                            <span className="ms-file-date">
                              {new Date(item.uploadedAt).toLocaleDateString()}
                            </span>
                            <span className="ms-file-size">
                              {item.size ? formatFileSize(item.size) : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ms-empty-state">
                    <svg className="ms-empty-icon" viewBox="0 0 24 24">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"></path>
                    </svg>
                    <p>No files uploaded yet</p>
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="ms-welcome">
              <div className="ms-welcome-content">
                <svg className="ms-welcome-icon" viewBox="0 0 48 48">
                  <path d="M24 23.5C29.8 23.5 34.5 18.8 34.5 13S29.8 2.5 24 2.5 13.5 7.2 13.5 13 18.2 23.5 24 23.5zm12 4.5h-1.3c-1.9 0-3.6 1-4.6 2.5H17.9c-1 1.5-2.7 2.5-4.6 2.5H12C5.4 33 0 38.4 0 45v3h48v-3c0-6.6-5.4-12-12-12z"></path>
                </svg>
                <h2>Connect to OneDrive</h2>
                <p>Sign in to access and manage your OneDrive files</p>
                <button
                  onClick={handleLogin}
                  className="ms-button ms-button-primary ms-button-large"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="ms-error-message">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
              </svg>
              <span>
                {typeof error === "object" ? JSON.stringify(error) : error}
              </span>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default Microsoft;
