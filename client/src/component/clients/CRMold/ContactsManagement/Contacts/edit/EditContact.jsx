import React, { useState, useEffect } from "react";
import "./editcontact.css";
import Sidebar from "../../../../../Sidebar/Sidebar";
import Navbar from "../../../../../Navbar/Navbar";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EditContact = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [employee, setEmployee] = useState({
    fullName: "",
    employeeID: "",
    designation: "",
    email: "",
    number: "",
    address: "",
    joiningDate: "",
    specificEmail: "",
    workAssigned: "",
    notes: "",
    callData: "",
    status: "Active",
    permissionAccessLevel: "Employee",
    teamAssociation: "",
    activityLog: "",
    pastDataHistory: "",
  });

  const [customPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/employee/${id}`
        );
        setEmployee(response.data);
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    };

    if (id) fetchEmployee();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee({ ...employee, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/employee/update/${id}`,
        employee
      );
      navigate("/contactmgmt/contacts");
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />

      <div className="edit-create-div">
        <div className="create-header-container">
          <h3 className="Edit-create-head">Edit Employee</h3>
          <p className="create-subheading">Update the details below to modify employee information</p>
        </div>
        <div className="employee-create-edit-info">
          <form onSubmit={handleSubmit}>
            <div className="basic-create-info-edit">
              <div className="form-section">
                <h4 className="section-title">Basic Information</h4>
                <div className="form-grid">
                  <div className="form-employee-input">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={employee.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Employee ID</label>
                    <input
                      type="text"
                      name="employeeID"
                      value={employee.employeeID}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={employee.designation}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Joining Date</label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={employee.joiningDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Contact Details</h4>
                <div className="form-grid">
                  <div className="form-employee-input">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={employee.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Specific Email</label>
                    <input
                      type="email"
                      name="specificEmail"
                      value={employee.specificEmail}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="number"
                      value={employee.number}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={employee.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Account Settings</h4>
                <div className="form-grid">
                  <div className="form-employee-input">
                    <label>Status</label>
                    <select
                      name="status"
                      value={employee.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="form-employee-input">
                    <label>Permission Access Level</label>
                    <select
                      name="permissionAccessLevel"
                      value={employee.permissionAccessLevel}
                      onChange={handleChange}
                      required
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Employee">Employee</option>
                      <option value="Guest">Guest</option>
                    </select>
                  </div>
                  <div className="form-employee-input">
                    <label>Team Association</label>
                    <input
                      type="text"
                      name="teamAssociation"
                      value={employee.teamAssociation}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Work Details</h4>
                <div className="form-grid">
                  <div className="form-employee-input">
                    <label>Work Assigned</label>
                    <input
                      type="text"
                      name="workAssigned"
                      value={employee.workAssigned}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Call Data</label>
                    <textarea
                      name="callData"
                      value={employee.callData}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Activity Log</label>
                    <textarea
                      name="activityLog"
                      value={employee.activityLog}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Past Data History</label>
                    <textarea
                      name="pastDataHistory"
                      value={employee.pastDataHistory}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section notes-section">
                <h4 className="section-title">Additional Notes</h4>
                <div className="form-employee-input full-width">
                  <textarea
                    name="notes"
                    value={employee.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="bottom-create-button">
              <button 
                className="discard-btn" 
                type="button" 
                onClick={() => navigate("/contactmgmt/contacts")}
              >
                Discard
              </button>
              <button className="create-btn" type="submit">
                Update Employee
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditContact;