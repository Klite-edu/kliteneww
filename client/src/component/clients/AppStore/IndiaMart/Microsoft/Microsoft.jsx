import React, { useState, useEffect } from "react";
import axios from "axios";
import "./microsoft.css";
import Sidebar from "../../../../Sidebar/Sidebar";
import Navbar from "../../../../Navbar/Navbar";

function Microsoft() {
  const [file, setFile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});

  useEffect(() => {
    console.log("Component mounted - starting initial data fetch");
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching token, role, and permissions");

        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-token`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-permissions`, {
            withCredentials: true,
          }),
        ]);

        const userToken = tokenRes.data.token;
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};

        console.log("Received token:", userToken ? "Token received" : "No token");
        console.log("Received role:", userRole);
        console.log("Received permissions:", userPermissions);

        setToken(userToken);
        setRole(userRole);
        setCustomPermissions(userPermissions);

        // Fetch uploads using token
        console.log("Fetching upload history");
        const uploadsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/microsoft/uploads`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        const uploads = uploadsRes.data;
        console.log("Uploads received:", uploads.length);
        setUploads(uploads);
        setUser(uploads.length > 0 ? uploads[0].userId : null);
        console.log("User set:", uploads.length > 0 ? uploads[0].userId : "No user");
      } catch (err) {
        console.error("Error in fetchInitialData:", err);
        if (err.response?.status === 401) {
          console.log("401 Unauthorized - clearing user");
          setUser(null);
        } else {
          console.error("Failed to load upload history:", err.message);
          setError("Failed to load upload history");
        }
      } finally {
        setIsLoading(false);
        console.log("Initial data fetch completed");
      }
    };

    fetchInitialData();
  }, []);

  const handleLogin = () => {
    console.log("Login button clicked, redirecting to Microsoft auth");
    window.location.replace(`${process.env.REACT_APP_API_URL}/api/microsoft/auth/login`);
  };

  const handleLogout = async () => {
    console.log("Logout initiated");
    try {
      await axios.get(`${process.env.REACT_APP_API_URL}/api/microsoft/auth/logout`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      console.log("Logout successful");
      setUploads([]);
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed");
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    console.log("Upload initiated");
    
    if (!file) {
      console.log("No file selected");
      return setError("Please select a file");
    }

    console.log("Uploading file:", file.name, "Size:", file.size);
    
    try {
      setIsLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      console.log("Sending upload request");
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/microsoft/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log("Upload successful, response:", data);
      setUploads([data, ...uploads]);
      setFile(null);
      document.getElementById("file-input").value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      console.error("Response data:", err.response?.data);
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setIsLoading(false);
      console.log("Upload process completed");
    }
  };

  console.log("Rendering component with state:", { 
    isLoggedIn: !!user, 
    uploadsCount: uploads.length, 
    hasFile: !!file,
    isLoading,
    hasError: !!error
  });

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="microsoft-app">
        <header className="microsoft-header">
          <h1 className="microsoft-h1">OneDrive Uploader</h1>
          {user ? (
            <button className="microsoft-button" onClick={handleLogout} disabled={isLoading}>
              Logout
            </button>
          ) : (
            <button className="microsoft-button" onClick={handleLogin} disabled={isLoading}>
              Login with Microsoft
            </button>
          )}
        </header>

        <main>
          {user && (
            <section className="microsoft-upload-section">
              <h2 className="microsoft-h2">Upload a File</h2>
              <form className="microsoft-form" onSubmit={uploadFile}>
                <input
                  id="file-input"
                  className="microsoft-input"
                  type="file"
                  onChange={(e) => {
                    console.log("File selected:", e.target.files[0]?.name);
                    setFile(e.target.files[0]);
                  }}
                  disabled={isLoading}
                />
                <button className="microsoft-button" type="submit" disabled={!file || isLoading}>
                  {isLoading ? "Uploading..." : "Upload"}
                </button>
              </form>
              {error && <p className="microsoft-error">{error}</p>}
            </section>
          )}

          <section className="microsoft-uploads-section">
            <h2 className="microsoft-h2">Your Uploads</h2>
            {isLoading && !uploads.length ? (
              <p>Loading...</p>
            ) : uploads.length > 0 ? (
              <ul>
                {uploads.map((upload) => (
                  <li key={upload._id}>
                    <a href={upload.link} target="_blank" rel="noopener noreferrer">
                      {upload.filename}
                    </a>
                    <span>{new Date(upload.uploadedAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{user ? "No uploads yet." : "Login to upload files."}</p>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

export default Microsoft;