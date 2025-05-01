import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import Sidebar from "../../../../../Sidebar/Sidebar";
import Navbar from "../../../../../Navbar/Navbar";
import "./view.css";

const View = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        setLoading(true);
        
        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-token`, { 
            withCredentials: true 
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, { 
            withCredentials: true 
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-permissions`, { 
            withCredentials: true 
          })
        ]);

        if (!tokenRes.data.token || !roleRes.data.role) {
          throw new Error("Authentication data missing");
        }

        setToken(tokenRes.data.token);
        setRole(roleRes.data.role);
        setCustomPermissions(permissionsRes.data.permissions || {});

        await fetchEmployee(tokenRes.data.token);
      } catch (error) {
        console.error("Authentication error:", error);
        setError(error.message);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    const fetchEmployee = async (authToken) => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/employee/${id}`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        setEmployee(response.data);
      } catch (err) {
        console.error("Failed to fetch employee:", err);
        setError(err.message);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchAuthData();
  }, [id, navigate]);

  const handleDelete = async (id) => {
    try {
      if (window.confirm("Are you sure you want to delete this employee?")) {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/employee/delete/${id}`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert("Employee deleted successfully");
        navigate("/employee");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert("Failed to delete employee");
      }
    }
  };

  const formatPhoneNumber = (number) => {
    if (!number) return "N/A";
    // Format as +91 XXXX XXX XXX
    return number.replace(/(\d{2})(\d{5})(\d{5})/, "+$1 $2 $3");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) return <div className="error-message">{error}</div>;
  if (!employee) return <div className="loading-message">Loading employee data...</div>;

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="employee-view-container">
        <div className="employee-view-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <h2>Employee Details</h2>
          <div className="header-actions">
            <Link to={`/employee/edit/${employee._id}`} className="edit-btn">
              <FontAwesomeIcon icon={faPen} /> Edit
            </Link>
            <button
              className="delete-btn"
              onClick={() => handleDelete(employee._id)}
            >
              <FontAwesomeIcon icon={faTrash} /> Delete
            </button>
          </div>
        </div>

        <div className="employee-card">
          <div className="employee-basic-info">
            <div className="employee-avatar">
              <div className="avatar-placeholder">
                {employee.fullName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="employee-summary">
              <h3>{employee.fullName}</h3>
              <p className="designation">{employee.designation}</p>
              <p className="employee-id">ID: {employee.employeeID}</p>
              <p className={`status-badge ${employee.status.toLowerCase()}`}>
                {employee.status}
              </p>
            </div>
          </div>

          <div className="employee-details-grid">
            <div className="detail-section">
              <h4>Personal Information</h4>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{employee.email || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">
                  {formatPhoneNumber(employee.number)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">
                  {employee.address || "N/A"}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Employment Details</h4>
              <div className="detail-row">
                <span className="detail-label">Joining Date:</span>
                <span className="detail-value">
                  {formatDate(employee.joiningDate)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">
                  {employee.role === "user" ? "Employee" : 
                   employee.role === "team_lead" ? "Team Lead" : 
                   employee.role === "admin" ? "Admin" : employee.role}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Team:</span>
                <span className="detail-value">
                  {employee.teamAssociation || "N/A"}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Shift Information</h4>
              {employee.shifts && employee.shifts.length > 0 ? (
                employee.shifts.map((shift, index) => (
                  <div key={index} className="shift-details">
                    <div className="detail-row">
                      <span className="detail-label">Shift Name:</span>
                      <span className="detail-value">
                        {shift.name || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Start Time:</span>
                      <span className="detail-value">
                        {shift.startTime || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">End Time:</span>
                      <span className="detail-value">
                        {shift.endTime || "N/A"}
                      </span>
                    </div>
                    {shift.isDefault && (
                      <div className="default-shift-badge">Default Shift</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-shifts">No shift information available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default View;