import React, { useState, useEffect } from "react";
import "./editcontact.css";
import Sidebar from "../../../../../Sidebar/Sidebar";
import Navbar from "../../../../../Navbar/Navbar";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EditContact = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    password: "",
    status: "Active",
    permissionAccessLevel: "Employee",
    teamAssociation: "",
    activityLog: "",
    pastDataHistory: "",
  });
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const formattedEmployee = { ...response.data };
        if (formattedEmployee.joiningDate) {
          formattedEmployee.joiningDate = new Date(
            formattedEmployee.joiningDate
          )
            .toISOString()
            .split("T")[0];
        }

        setEmployee(formattedEmployee);
      } catch (error) {
        console.error("Error fetching employee data:", error);
        setError(error.message);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchAuthData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If the password field is empty, set it to an empty string (optional)
    if (name === "password" && value.trim() === "") {
      setEmployee({ ...employee, [name]: "" });
    } else {
      setEmployee({ ...employee, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedEmployee = { ...employee };
    if (!updatedEmployee.password) {
      delete updatedEmployee.password;
    }
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/employee/update/${id}`,
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
        setError("Failed to update employee");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setError(error.response?.data?.message || "Error updating employee");
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
          <h3 className="Edit-create-head">Edit Employee</h3>
          <p className="create-subheading">
            Update the details below to modify employee information
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
                    <label>Department</label>
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
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={employee.password || ""} // Keep empty if not updating
                      onChange={handleChange}
                      placeholder="Enter new password"
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
                onClick={() => navigate("/employee")}
              >
                Discard
              </button>
              <button
                className="create-btn"
                type="submit"
                onClick={() => navigate("/employee")}
              >
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
