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
  const role = localStorage.getItem("role");
  const [customPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/employee/${id}`
        );
        setEmployee(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleDelete = async (id) => {
    try {
      if (window.confirm("Do you want to delete this employee?")) {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/employee/delete/${id}`
        );
        alert("Employee deleted successfully");
        navigate("/contactmgmt/contacts");
      }
    } catch (error) {
      console.error("Error deleting employee", error);
      alert("Failed to delete employee");
    }
  };

  if (error) return <div className="error-message">{error}</div>;
  if (!employee) return <div className="loading-message">Loading...</div>;

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
            <Link to={`/contactmgmt/edit/${employee._id}`} className="edit-btn">
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
              <p className="status-badge active">Active</p>
            </div>
          </div>

          <div className="employee-details-grid">
            <div className="detail-section">
              <h4>Contact Information</h4>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{employee.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{employee.number}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">
                  {employee.address || "N/A"}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Work Information</h4>
              <div className="detail-row">
                <span className="detail-label">Department:</span>
                <span className="detail-value">
                  {employee.department || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Joining Date:</span>
                <span className="detail-value">
                  {employee.joiningDate
                    ? new Date(employee.joiningDate).toLocaleString()
                    : "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Work Email:</span>
                <span className="detail-value">
                  {employee.specificEmail || "N/A"}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Work Details</h4>
              <div className="detail-row">
                <span className="detail-label">Work Assigned:</span>
                <span className="detail-value">
                  {employee.workAssigned || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Team Association:</span>
                <span className="detail-value">
                  {employee.teamAssociation || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Access Level:</span>
                <span className="detail-value">
                  {employee.permissionAccessLevel || "N/A"}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Additional Information</h4>
              <div className="detail-row">
                <span className="detail-label">Notes:</span>
                <span className="detail-value">{employee.notes || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Call Data:</span>
                <span className="detail-value">
                  {employee.callData || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="activity-section">
            <h4>Activity Log</h4>
            <div className="activity-content">
              {employee.activityLog || "No activity logged"}
            </div>
          </div>

          <div className="history-section">
            <h4>Past Data History</h4>
            <div className="history-content">
              {employee.pastDataHistory || "No history available"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default View;
