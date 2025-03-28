import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // To get ID from URL
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./view.css";
import { Link } from "react-router-dom";
import Sidebar from "../../../../../Sidebar/Sidebar";
import Navbar from "../../../../../Navbar/Navbar";
import axios from "axios";

const View = () => {
  const { id } = useParams(); // Get employee ID from URL
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
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/employee/${id}`
        );
        if (!response.ok) throw new Error("Employee not found");
        const data = await response.json();
        setEmployee(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleDelete = async (id) => {
    try {
      if (window.confirm("Do you want to delete this employee?")) {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/employee/delete/${id}`);
        setEmployee(null); // Set employee to null after deletion
        alert("Employee deleted successfully");
        navigate("/contactmgmt/contacts");
      }
    } catch (error) {
      console.error("Error deleting employee", error);
      alert("Failed to delete employee");
    }
  };

  if (error) return <p>{error}</p>;
  if (!employee) return <p>Loading...</p>;

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="employee-view">
        {/* Header Section */}
        <header className="employee-header">
          <h1>{employee.fullName}</h1>
          <div className="header-details">
            <div className="detail-item">
              <strong>ID:</strong> <span>{employee.employeeID}</span>
            </div>
            <div className="detail-item">
              <strong>Designation:</strong> <span>{employee.designation}</span>
            </div>
            <div className="detail-item">
              <strong>Joining Date:</strong> <span>{employee.joiningDate}</span>
            </div>
          </div>
        </header>

        {/* Contact Information Section */}
        <section className="employee-section">
          <h2>Contact Information</h2>
          <div className="section-grid">
            <div className="section-item">
              <strong>Email:</strong>
              <p>{employee.email}</p>
            </div>
            <div className="section-item">
              <strong>Phone Number:</strong>
              <p>{employee.number}</p>
            </div>
            <div className="section-item full-width">
              <strong>Address:</strong>
              <p>{employee.address}</p>
            </div>
          </div>
        </section>

        {/* Work Email Section */}
        <section className="employee-section">
          <h2>Work Email</h2>
          <p>{employee.specificEmail}</p>
        </section>

        {/* Work Details Section */}
        <section className="employee-section">
          <h2>Work Details</h2>
          <div className="section-grid">
            <div className="section-item">
              <strong>Work Assigned:</strong>
              <p>{employee.workAssigned}</p>
            </div>
            <div className="section-item">
              <strong>Permission & Access Level:</strong>
              <p>{employee.permissionAccessLevel}</p>
            </div>
            <div className="section-item">
              <strong>Team Association:</strong>
              <p>{employee.teamAssociation}</p>
            </div>
            <div className="section-item">
              <strong>Status:</strong>
              <p>{employee.status}</p>
            </div>
          </div>
        </section>

        {/* Activity & History Section */}
        <section className="employee-section">
          <h2>Activity & History</h2>
          <div className="section-grid">
            <div className="section-item full-width">
              <strong>Activity Log:</strong>
              <p>{employee.activityLog}</p>
            </div>
            <div className="section-item full-width">
              <strong>Past Data History:</strong>
              <p>{employee.pastDataHistory}</p>
            </div>
          </div>
        </section>

        {/* Additional Information Section */}
        <section className="employee-section">
          <h2>Additional Information</h2>
          <div className="section-grid">
            <div className="section-item">
              <strong>Notes:</strong>
              <p>{employee.notes}</p>
            </div>
            <div className="section-item">
              <strong>Call Data:</strong>
              <p>{employee.callData}</p>
            </div>
          </div>
        </section>

        {/* Actions Section */}
        <section className="employee-actions">
          <Link to={`/contactmgmt/edit/${employee._id}`}>
          <button className="edit-btn">
            <FontAwesomeIcon icon={faPen} /> Edit
          </button>
          </Link>
          <button className="delete-btn" onClick={() => handleDelete(employee._id)}>
            <FontAwesomeIcon icon={faTrash} /> Delete
          </button>
        </section>
      </div>
    </>
  );
};

export default View;
