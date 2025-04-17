import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";
import "./variables.css";

const Variables = () => {
  const [form, setForm] = useState({
    label: "",
    variableName: "",
    fieldType: "Text",
    defaultValue: "",
    folder: "",
  });

  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
            {
              withCredentials: true,
            }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            {
              withCredentials: true,
            }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            {
              withCredentials: true,
            }
          ),
        ]);

        const userToken = tokenRes.data.token;
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};

        if (!userToken || !userRole) {
          window.location.href = "/";
          return;
        }

        setToken(userToken);
        setRole(userRole);
        setCustomPermissions(userPermissions);
        await getVariables(userToken);
      } catch (err) {
        console.error("Auth error:", err);
        setError("Failed to authenticate. Redirecting...");
        setTimeout(() => (window.location.href = "/"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const getVariables = async (authToken) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/variables/list`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            withCredentials: true,
          },
        }
      );
      setVariables(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch variables", err);
      setError("Failed to fetch variables. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/variables/create`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );
      setSuccess("Variable created successfully!");
      setForm({
        label: "",
        variableName: "",
        fieldType: "Text",
        defaultValue: "",
        folder: "",
      });
      await getVariables(token);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Create variable error:", err);
      setError(err.response?.data?.message || "Failed to create variable");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading && variables.length === 0) {
    return <div className="vars-loading">Loading...</div>;
  }

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="vars-container">
        <div className="vars-content">
          <h2>Contact Variables</h2>

          {error && <div className="vars-alert vars-alert-error">{error}</div>}
          {success && (
            <div className="vars-alert vars-alert-success">{success}</div>
          )}

          <div className="vars-form">
            <h3>Create New Variable</h3>
            <form onSubmit={handleSubmit}>
              <div className="vars-form-group">
                <label className="vars-form-label">Label</label>
                <input
                  name="label"
                  className="vars-form-input"
                  placeholder="Display label"
                  value={form.label}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="vars-form-group">
                <label className="vars-form-label">Variable Name</label>
                <input
                  name="variableName"
                  className="vars-form-input"
                  placeholder="Variable name (no spaces)"
                  value={form.variableName}
                  onChange={handleInputChange}
                  required
                  pattern="^[a-zA-Z0-9_]+$"
                  title="No spaces or special characters allowed"
                />
              </div>

              <div className="vars-form-group">
                <label className="vars-form-label">Field Type</label>
                <select
                  name="fieldType"
                  className="vars-form-select"
                  value={form.fieldType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Dropdown">Dropdown</option>
                  <option value="Date">Date</option>
                  <option value="Checkbox">Checkbox</option>
                </select>
              </div>

              <div className="vars-form-group">
                <label className="vars-form-label">Default Value</label>
                <input
                  name="defaultValue"
                  className="vars-form-input"
                  placeholder="Default value"
                  value={form.defaultValue}
                  onChange={handleInputChange}
                />
              </div>

              <div className="vars-form-group">
                <label className="vars-form-label">Folder (optional)</label>
                <input
                  name="folder"
                  className="vars-form-input"
                  placeholder="Folder name"
                  value={form.folder}
                  onChange={handleInputChange}
                />
              </div>

              <button type="submit" className="vars-button" disabled={loading}>
                {loading ? "Creating..." : "Create Variable"}
              </button>
            </form>
          </div>

          <div className="vars-list">
            <h3>Existing Variables</h3>
            {loading && variables.length > 0 ? (
              <div className="vars-loading">Refreshing data...</div>
            ) : variables.length === 0 ? (
              <p>No variables found</p>
            ) : (
              <div className="vars-table-container">
                <table className="vars-table">
                  <thead>
                    <tr>
                      <th>Label</th>
                      <th>Variable Name</th>
                      <th>Type</th>
                      <th>Default Value</th>
                      <th>Folder</th>
                      <th>key</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variables.map((v) => (
                      <tr key={v._id}>
                        <td>{v.label}</td>
                        <td>{v.variableName}</td>
                        <td>{v.fieldType}</td>
                        <td>{v.defaultValue || "-"}</td>
                        <td>{v.folder || "-"}</td>
                        <td>{v.key}</td>
                        <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Variables;
