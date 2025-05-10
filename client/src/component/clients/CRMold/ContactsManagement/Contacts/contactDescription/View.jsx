import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faArrowLeft, faEnvelope, faPhone, faMapMarkerAlt, faBuilding, faCalendarAlt, faBriefcase, faUsers, faShieldAlt, faStickyNote, faHistory } from "@fortawesome/free-solid-svg-icons";
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

        // Fetch token, role and permissions in parallel
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

        // Fetch employee data after successful auth
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
      if (window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
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
        navigate("/contactmgmt/contacts");
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading employee details...</p>
      </div>
    );
  }

  if (error) return (
    <div className="error-container">
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
      <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} /> Go Back
      </button>
    </div>
  );
  
  if (!employee) return (
    <div className="no-data-container">
      <div className="alert alert-warning" role="alert">
        Employee data not found
      </div>
      <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} /> Go Back
      </button>
    </div>
  );

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar pageTitle={'Employee Details'} />
      
      <div className="employee-view-container">
        <div className="employee-view-header">
          <button className="btn btn-outline-secondary back-button" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          
          {role !== "user" && (
            <div className="header-actions">
              <Link to={`/contactmgmt/edit/${employee._id}`} className="btn btn-primary me-2">
                <FontAwesomeIcon icon={faPen} className="me-2" /> Edit
              </Link>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(employee._id)}
              >
                <FontAwesomeIcon icon={faTrash} className="me-2" /> Delete
              </button>
            </div>
          )}
        </div>

        <div className="employee-card shadow-sm">
          <div className="employee-basic-info">
            <div className="employee-avatar">
              <div className="avatar-placeholder bg-primary text-white">
                {employee.fullName.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="employee-summary">
              <h2 className="employee-name">{employee.fullName}</h2>
              <p className="designation text-muted">
                <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                {employee.designation}
              </p>
              <div className="employee-meta">
                <span className="employee-id badge bg-light text-dark">
                  ID: {employee.employeeID}
                </span>
                <span className="status-badge active">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="employee-details-grid">
            {/* Contact Information */}
            <div className="detail-section card">
              <div className="card-header">
                <h4>
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  Contact Information
                </h4>
              </div>
              <div className="card-body">
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                    Email:
                  </span>
                  <span className="detail-value">
                    <a href={`mailto:${employee.email}`}>{employee.email}</a>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faPhone} className="me-2" />
                    Phone:
                  </span>
                  <span className="detail-value">
                    <a href={`tel:${employee.number}`}>{employee.number}</a>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                    Address:
                  </span>
                  <span className="detail-value">
                    {employee.address || <span className="text-muted">Not provided</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="detail-section card">
              <div className="card-header">
                <h4>
                  <FontAwesomeIcon icon={faBuilding} className="me-2" />
                  Work Information
                </h4>
              </div>
              <div className="card-body">
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faBuilding} className="me-2" />
                    Department:
                  </span>
                  <span className="detail-value">
                    {employee.department || <span className="text-muted">Not specified</span>}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Joining Date:
                  </span>
                  <span className="detail-value">
                    {employee.joiningDate
                      ? new Date(employee.joiningDate).toLocaleDateString()
                      : <span className="text-muted">Unknown</span>}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                    Work Email:
                  </span>
                  <span className="detail-value">
                    {employee.specificEmail 
                      ? <a href={`mailto:${employee.specificEmail}`}>{employee.specificEmail}</a>
                      : <span className="text-muted">Not provided</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Work Details */}
            <div className="detail-section card">
              <div className="card-header">
                <h4>
                  <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                  Work Details
                </h4>
              </div>
              <div className="card-body">
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                    Work Assigned:
                  </span>
                  <span className="detail-value">
                    {employee.workAssigned || <span className="text-muted">Not assigned</span>}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                    Team Association:
                  </span>
                  <span className="detail-value">
                    {employee.teamAssociation || <span className="text-muted">No team</span>}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
                    Access Level:
                  </span>
                  <span className="detail-value">
                    {employee.permissionAccessLevel || <span className="text-muted">Standard</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="detail-section card">
              <div className="card-header">
                <h4>
                  <FontAwesomeIcon icon={faStickyNote} className="me-2" />
                  Additional Information
                </h4>
              </div>
              <div className="card-body">
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faStickyNote} className="me-2" />
                    Notes:
                  </span>
                  <span className="detail-value">
                    {employee.notes || <span className="text-muted">No notes</span>}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faPhone} className="me-2" />
                    Call Data:
                  </span>
                  <span className="detail-value">
                    {employee.callData || <span className="text-muted">No call data</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="activity-section card mt-4">
            <div className="card-header">
              <h4>
                <FontAwesomeIcon icon={faHistory} className="me-2" />
                Activity Log
              </h4>
            </div>
            <div className="card-body">
              <div className="activity-content">
                {employee.activityLog 
                  ? <div className="activity-log">{employee.activityLog}</div>
                  : <p className="text-muted">No activity logged</p>}
              </div>
            </div>
          </div>

          {/* Past Data History */}
          <div className="history-section card mt-4 mb-4">
            <div className="card-header">
              <h4>
                <FontAwesomeIcon icon={faHistory} className="me-2" />
                Past Data History
              </h4>
            </div>
            <div className="card-body">
              <div className="history-content">
                {employee.pastDataHistory 
                  ? <div className="history-data">{employee.pastDataHistory}</div>
                  : <p className="text-muted">No history available</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default View;