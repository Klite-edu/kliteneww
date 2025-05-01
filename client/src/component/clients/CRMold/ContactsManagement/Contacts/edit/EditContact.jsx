import React, { useState, useEffect } from "react";
import "./editcontact.css";
import Sidebar from "../../../../../Sidebar/Sidebar";
import Navbar from "../../../../../Navbar/Navbar";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

const EditContact = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState({
    fullName: "",
    employeeID: "",
    designation: "",
    email: "",
    password: "",
    number: "",
    address: "",
    joiningDate: "",
    status: "Active",
    role: "user",
    teamAssociation: "",
    shifts: [{
      name: "",
      startTime: "",
      endTime: "",
      isDefault: true
    }]
  });
  
  const [employeeShifts, setEmployeeShifts] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

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
        await fetchWorkingConfig(tokenRes.data.token);
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
        
        const formattedEmployee = { 
          ...response.data,
          joiningDate: response.data.joiningDate ? 
            new Date(response.data.joiningDate).toISOString().split('T')[0] : ""
        };
        
        setEmployee(formattedEmployee);
      } catch (err) {
        console.error("Failed to fetch employee:", err);
        setError(err.message);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    const fetchWorkingConfig = async (authToken) => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workingdays/get`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (res.data.success && Array.isArray(res.data.data.shifts)) {
          setEmployeeShifts(res.data.data.shifts);
        }
      } catch (err) {
        console.error("Error fetching working config:", err);
      }
    };

    fetchAuthData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "number") {
      const cleanedValue = value.replace(/[^\d+]/g, "");
      setEmployee(prev => ({ ...prev, [name]: cleanedValue }));
    } else {
      setEmployee(prev => ({ ...prev, [name]: value }));
    }

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleShiftChange = (field, value) => {
    setEmployee(prev => ({
      ...prev,
      shifts: prev.shifts.map((shift, index) => 
        index === 0 ? { ...shift, [field]: value } : shift
      )
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Required fields validation
    const requiredFields = [
      "fullName", "employeeID", "designation", "email", 
      "number", "joiningDate", "status", "role"
    ];
    
    requiredFields.forEach(field => {
      if (!employee[field]) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        isValid = false;
      }
    });

    // Email validation
    if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Phone number validation
    if (employee.number) {
      const cleanedNumber = employee.number.replace(/\D/g, "");
      if (cleanedNumber.length !== 12 || !cleanedNumber.startsWith("91")) {
        errors.number = "Number must start with 91 followed by 10 digits (total 12 digits)";
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const errorMessages = Object.entries(fieldErrors)
        .filter(([_, value]) => value)
        .map(([field, error]) => `${field}: ${error}`)
        .join("\n");

      if (errorMessages) {
        alert(`Please fix these errors:\n\n${errorMessages}`);
      }
      return;
    }

    try {
      const updatedEmployee = { ...employee };
      if (!updatedEmployee.password) {
        delete updatedEmployee.password;
      }

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/employee/update/${id}`,
        updatedEmployee,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        navigate("/employee");
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

  const renderInput = (fieldName, label, type = "text", extraProps = {}) => (
    <div className="form-employee-input">
      <label>
        {label}
        {["fullName", "employeeID", "designation", "email", "number", "joiningDate"].includes(fieldName) && (
          <span className="required-star">*</span>
        )}
      </label>
      {type === "password" ? (
        <div className="password-input-container">
          <input
            type={showPassword ? "text" : "password"}
            name={fieldName}
            value={employee[fieldName] || ""}
            onChange={handleChange}
            placeholder={extraProps.placeholder || ""}
            className={fieldErrors[fieldName] ? "error-input" : ""}
            {...extraProps}
          />
          <button 
            type="button" 
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
      ) : (
        <input
          type={type}
          name={fieldName}
          value={employee[fieldName] || ""}
          onChange={handleChange}
          placeholder={extraProps.placeholder || ""}
          className={fieldErrors[fieldName] ? "error-input" : ""}
          {...extraProps}
        />
      )}
      {fieldErrors[fieldName] && (
        <div className="error-message">{fieldErrors[fieldName]}</div>
      )}
    </div>
  );

  const renderSelect = (fieldName, label, options, extraProps = {}) => (
    <div className="form-employee-input">
      <label>
        {label}
        {["status", "role"].includes(fieldName) && (
          <span className="required-star">*</span>
        )}
      </label>
      <select
        name={fieldName}
        value={employee[fieldName] || ""}
        onChange={handleChange}
        className={fieldErrors[fieldName] ? "error-input" : ""}
        {...extraProps}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {fieldErrors[fieldName] && (
        <div className="error-message">{fieldErrors[fieldName]}</div>
      )}
    </div>
  );

  const renderTextarea = (fieldName, label, extraProps = {}) => (
    <div className="form-employee-input">
      <label>{label}</label>
      <textarea
        name={fieldName}
        value={employee[fieldName] || ""}
        onChange={handleChange}
        className={fieldErrors[fieldName] ? "error-input" : ""}
        {...extraProps}
      />
    </div>
  );

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
            Update the employee details below
          </p>
          <p className="required-note">
            Fields marked with <span className="required-star">*</span> are required
          </p>
        </div>
        
        <div className="employee-create-edit-info">
          <form onSubmit={handleSubmit}>
            <div className="basic-create-info-edit">
              <div className="form-section">
                <h4 className="section-title">Basic Information</h4>
                <div className="form-grid">
                  {renderInput("fullName", "Full Name", "text", { required: true })}
                  {renderInput("employeeID", "Employee ID", "text", { required: true })}
                  {renderInput("designation", "Designation", "text", { required: true })}
                  {renderInput("joiningDate", "Joining Date", "date", { required: true })}
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Contact Details</h4>
                <div className="form-grid">
                  {renderInput("email", "Email", "email", { 
                    required: true,
                    placeholder: "employee@example.com" 
                  })}
                  {renderInput("number", "Phone Number", "tel", {
                    required: true,
                    pattern: "^91\\d{10}$",
                    maxLength: 12,
                    onChange: (e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length > 12) value = value.substring(0, 12);
                      setEmployee(prev => ({ ...prev, number: value }));
                    }
                  })}
                  {renderTextarea("address", "Address")}
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Account Settings</h4>
                <div className="form-grid">
                  {renderInput("password", "Password", "password", {
                    placeholder: "Leave blank to keep current password"
                  })}
                  {renderSelect("status", "Status", [
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                    { value: "Suspended", label: "Suspended" }
                  ], { required: true })}
                  {renderSelect("role", "Role", [
                    { value: "user", label: "Employee" },
                    { value: "team_lead", label: "Team Lead" },
                    { value: "admin", label: "Admin" }
                  ], { required: true })}
                  {renderInput("teamAssociation", "Team Association")}
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Work Schedule</h4>
                <div className="form-grid">
                  <div className="form-employee-input">
                    <label>Default Shift <span className="required-star">*</span></label>
                    <select
                      value={employee.shifts[0]?.name || ""}
                      onChange={(e) => {
                        const selected = employeeShifts.find(s => s.name === e.target.value);
                        if (selected) {
                          handleShiftChange("name", selected.name);
                          handleShiftChange("startTime", selected.startTime);
                          handleShiftChange("endTime", selected.endTime);
                        }
                      }}
                      required
                    >
                      <option value="">Select a shift</option>
                      {employeeShifts.map(shift => (
                        <option key={shift.name} value={shift.name}>
                          {`${shift.name} (${shift.startTime} - ${shift.endTime})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-employee-input">
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={employee.shifts[0]?.startTime || ""}
                      onChange={(e) => handleShiftChange("startTime", e.target.value)}
                    />
                  </div>
                  <div className="form-employee-input">
                    <label>End Time</label>
                    <input
                      type="time"
                      value={employee.shifts[0]?.endTime || ""}
                      onChange={(e) => handleShiftChange("endTime", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bottom-create-button">
              <button
                type="button"
                className="discard-btn"
                onClick={() => navigate("/employee")}
              >
                Discard
              </button>
              <button type="submit" className="create-btn">
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