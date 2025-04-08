import React, { useState, useEffect } from "react";
import "./createcontact.css";
import Sidebar from "../../../../../Sidebar/Sidebar";
import Navbar from "../../../../../Navbar/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateEmployee = () => {
  const [employee, setEmployee] = useState({
    fullName: "",
    employeeID: "",
    designation: "",
    email: "",
    password: "",
    number: "",
    address: "",
    joiningDate: "",
    specificEmail: "",
    workAssigned: "",
    notes: "",
    callData: "",
    status: "Active",
    role: "user",
    teamAssociation: "",
    activityLog: "",
    pastDataHistory: "",
    receivedEmails: [],
    sentEmails: [],
  });
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        setLoading(true);

        // Fetch token, role and permissions in parallel
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

        if (!tokenRes.data.token || !roleRes.data.role) {
          throw new Error("Authentication data missing");
        }

        setToken(tokenRes.data.token);
        setRole(roleRes.data.role);
        setCustomPermissions(permissionsRes.data.permissions || {});
      } catch (error) {
        console.error("Authentication error:", error);
        setError(error.message);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchAuthData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/employee/create`,
        employee,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        navigate("/contactmgmt/contacts");
      } else {
        setError(response.data.message || "Failed to create employee");
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setError(error.response?.data?.message || "Error creating employee");
      }
    }
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

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />

      <div className="edit-create-div">
        <div className="create-header-container">
          <h3 className="Edit-create-head">Create New Employee</h3>
          <p className="create-subheading">
            Fill in the details below to add a new team member
          </p>
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
                      placeholder="John Doe"
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
                      placeholder="EMP-001"
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
                      placeholder="Software Developer"
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
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Specific Email</label>
                    <input
                      type="email"
                      name="specificEmail"
                      value={employee.specificEmail}
                      onChange={handleChange}
                      placeholder="john.specific@example.com"
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
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={employee.address}
                      onChange={handleChange}
                      placeholder="123 Main St, City, Country"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Account Settings</h4>
                <div className="form-grid">
                  <div className="form-employee-input">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={employee.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                    />
                  </div>
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
                    <label>Role</label>
                    <select
                      name="role"
                      value={employee.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="user">Employee</option>
                    </select>
                  </div>
                  <div className="form-employee-input">
                    <label>Team Association</label>
                    <input
                      type="text"
                      name="teamAssociation"
                      value={employee.teamAssociation}
                      onChange={handleChange}
                      placeholder="Development Team"
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
                      placeholder="Project X Development"
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Call Data</label>
                    <textarea
                      name="callData"
                      value={employee.callData}
                      onChange={handleChange}
                      placeholder="Call logs and information"
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Activity Log</label>
                    <textarea
                      name="activityLog"
                      value={employee.activityLog}
                      onChange={handleChange}
                      placeholder="Recent activities"
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>Past Data History</label>
                    <textarea
                      name="pastDataHistory"
                      value={employee.pastDataHistory}
                      onChange={handleChange}
                      placeholder="Previous records"
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
                    placeholder="Any additional information about the employee..."
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
              <button
                className="create-btn"
                type="submit"
                onClick={() => navigate("/contactmgmt/contacts")}
              >
                Create Employee
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateEmployee;
