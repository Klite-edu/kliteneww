import React, { useState, useEffect } from "react";
import "./createcontact.css";
import Sidebar from "../../../../../Sidebar/Sidebar";
import Navbar from "../../../../../Navbar/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateEmployee = () => {
  console.log("🔄 Component rendering");

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
    shifts: [
      {
        name: "Default Shift",
        startTime: "09:00",
        endTime: "18:00",
        isDefault: true,
      },
    ],
  });

  console.log("📌 Initial employee state:", employee);
  const [employeeShifts, setEmployeeShifts] = useState([]);

  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [requiredFields] = useState([
    "fullName",
    "employeeID",
    "designation",
    "email",
    "password",
    "number",
    "joiningDate",
    "status",
    "role",
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔍 useEffect triggered (authentication data fetch)");

    const fetchAuthData = async () => {
      try {
        console.log("⏳ Starting authentication data fetch");
        setLoading(true);

        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            { withCredentials: true }
          ),
        ]);

        console.log("🔑 Token response:", tokenRes.data);
        console.log("👤 Role response:", roleRes.data);
        console.log("🔓 Permissions response:", permissionsRes.data);

        if (!tokenRes.data.token || !roleRes.data.role) {
          throw new Error("Authentication data missing");
        }

        setToken(tokenRes.data.token);
        setRole(roleRes.data.role);
        setCustomPermissions(permissionsRes.data.permissions || {});

        console.log("✅ Authentication data set in state");
      } catch (error) {
        console.error("❌ Authentication error:", error);
        setError(error.message);
        navigate("/");
      } finally {
        setLoading(false);
        console.log("🏁 Authentication fetch completed");
      }
    };

    fetchAuthData();
  }, [navigate]);

  useEffect(() => {
    if (!token) return;

    const fetchWorkingConfig = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workingdays/get`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("🟢 Shift Config Response:", res.data);

        if (res.data.success && Array.isArray(res.data.data.shifts)) {
          setEmployeeShifts(res.data.data.shifts);
          console.log("✅ Shifts loaded:", res.data.data.shifts);
        } else {
          console.warn("⚠️ No shifts received or invalid format");
        }
      } catch (err) {
        console.error("❌ Error fetching working config:", err);
      }
    };

    fetchWorkingConfig();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for phone number
    if (name === "number") {
      // Allow only digits and + at start
      const cleanedValue = value.replace(/[^\d+]/g, "");
      setEmployee((prev) => ({ ...prev, [name]: cleanedValue }));
    } else {
      setEmployee((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleShiftChange = (field, value) => {
    console.log(`✏️ Shift field changed - ${field}:`, value);
    setEmployee((prev) => ({
      ...prev,
      shifts: prev.shifts.map((shift, index) =>
        // We're only handling the first shift for now
        index === 0 ? { ...shift, [field]: value } : shift
      ),
    }));
  };

  const validateForm = () => {
    console.log("🔍 Validating form...");
    const errors = {};
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!employee[field]) {
        errors[field] = `${
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1")
        } is required`;
        isValid = false;
        console.log(`❌ Missing required field: ${field}`);
      }
    });

    // Email validation
    if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
      console.log("❌ Invalid email format");
    }

    // Mobile number validation
    if (employee.number) {
      // Remove all non-digit characters
      const cleanedNumber = employee.number.replace(/\D/g, "");
      console.log("📱 Cleaned number:", cleanedNumber);

      // Check if number is required but empty
      if (requiredFields.includes("number") && !cleanedNumber) {
        errors.number = "Mobile number is required";
        isValid = false;
        console.log("❌ Mobile number is required but empty");
      }
      // Check if number is provided but invalid
      else if (
        cleanedNumber &&
        (cleanedNumber.length !== 12 || !cleanedNumber.startsWith("91"))
      ) {
        errors.number =
          "Number must start with 91 followed by 10 digits (total 12 digits)";
        isValid = false;
        console.log("❌ Invalid mobile number format");

        // Only show alert when submitting, not during typing
        if (document.activeElement?.name !== "number") {
          console.log("⚠️ Showing alert for invalid number");
          alert(
            "Please enter a valid 12-digit mobile number starting with 91 (e.g., 91XXXXXXXXXX)"
          );
        }
      }
    }

    // Shift validation
    const defaultShift = employee.shifts.find((s) => s.isDefault);
    if (defaultShift) {
      if (!defaultShift.startTime) {
        errors.startTime = "Start time is required";
        isValid = false;
      }
      if (!defaultShift.endTime) {
        errors.endTime = "End time is required";
        isValid = false;
      }
    }

    console.log("📝 Validation errors:", errors);
    setFieldErrors(errors);
    console.log("✅ Form validation result:", isValid);
    return isValid;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    console.log(`👋 Field blurred - ${name}:`, value);

    if (name === "number") {
      // Remove all non-digit characters
      const cleaned = value.replace(/\D/g, "");
      console.log("🔢 Cleaned number on blur:", cleaned);

      // Format only if valid
      if (cleaned.startsWith("91") && cleaned.length === 12) {
        const formatted = `+${cleaned.substring(0, 2)} ${cleaned.substring(
          2,
          7
        )} ${cleaned.substring(7)}`;
        console.log("✨ Formatted number:", formatted);

        setEmployee((prev) => ({
          ...prev,
          [name]: formatted,
        }));
      }

      // Trigger validation on blur
      console.log("🔍 Validating on blur...");
      validateForm();
    }
  };
  console.log("Available Shifts:", employeeShifts);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("✅ Submit clicked");
    console.log("📋 Form data before validation:", employee);

    if (!validateForm()) {
      // Create error message from all field errors
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
      console.log("🚀 Creating employee with data:", employee);

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

      console.log("📩 Server response:", response.data);

      if (response.status === 200 || response.status === 201) {
        console.log("🎉 Employee created successfully");
        navigate("/employee");
      } else {
        console.error("❌ Server returned error:", response.data.message);
        setError(response.data.message || "Failed to create employee");
      }
    } catch (error) {
      console.error("❌ Error creating employee:", error);
      if (error.response?.status === 401) {
        console.log("🔒 Unauthorized - redirecting to login");
        navigate("/");
      } else {
        const errorMsg =
          error.response?.data?.message || "Error creating employee";
        console.error("❌ Error message:", errorMsg);
        setError(errorMsg);

        // Handle server-side validation errors
        if (error.response?.data?.errors) {
          console.log(
            "📝 Server-side validation errors:",
            error.response.data.errors
          );
          setFieldErrors(error.response.data.errors);
        }
      }
    }
  };

  const renderLabel = (fieldName, label) => {
    return (
      <label>
        {label}
        {requiredFields.includes(fieldName) && (
          <span className="required-star">*</span>
        )}
      </label>
    );
  };

  const renderInput = (
    fieldName,
    type = "text",
    placeholder = "",
    extraProps = {}
  ) => {
    return (
      <>
        {renderLabel(
          fieldName,
          fieldName.charAt(0).toUpperCase() +
            fieldName.slice(1).replace(/([A-Z])/g, " $1")
        )}
        <input
          type={type}
          name={fieldName}
          value={employee[fieldName]}
          onChange={handleChange}
          placeholder={placeholder}
          className={fieldErrors[fieldName] ? "error-input" : ""}
          {...extraProps}
        />
        {fieldErrors[fieldName] && (
          <div className="error-message">{fieldErrors[fieldName]}</div>
        )}
      </>
    );
  };

  const renderSelect = (fieldName, options, extraProps = {}) => {
    return (
      <>
        {renderLabel(
          fieldName,
          fieldName.charAt(0).toUpperCase() +
            fieldName.slice(1).replace(/([A-Z])/g, " $1")
        )}
        <select
          name={fieldName}
          value={employee[fieldName]}
          onChange={handleChange}
          className={fieldErrors[fieldName] ? "error-input" : ""}
          {...extraProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldErrors[fieldName] && (
          <div className="error-message">{fieldErrors[fieldName]}</div>
        )}
      </>
    );
  };

  const renderTextarea = (fieldName, placeholder = "", extraProps = {}) => {
    return (
      <>
        {renderLabel(
          fieldName,
          fieldName.charAt(0).toUpperCase() +
            fieldName.slice(1).replace(/([A-Z])/g, " $1")
        )}
        <textarea
          name={fieldName}
          value={employee[fieldName]}
          onChange={handleChange}
          placeholder={placeholder}
          className={fieldErrors[fieldName] ? "error-input" : ""}
          {...extraProps}
        />
        {fieldErrors[fieldName] && (
          <div className="error-message">{fieldErrors[fieldName]}</div>
        )}
      </>
    );
  };

  const renderTimeInput = (
    fieldName,
    value,
    onChange,
    label,
    required = false
  ) => {
    return (
      <>
        <label>
          {label}
          {required && <span className="required-star">*</span>}
        </label>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(fieldName, e.target.value)}
          className={fieldErrors[fieldName] ? "error-input" : ""}
          required={required}
        />
        {fieldErrors[fieldName] && (
          <div className="error-message">{fieldErrors[fieldName]}</div>
        )}
      </>
    );
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
          <p className="required-note">
            Fields marked with <span className="required-star">*</span> are
            required
          </p>
        </div>
        <div className="employee-create-edit-info">
          <form onSubmit={handleSubmit}>
            <div className="basic-create-info-edit">
              <div className="form-section">
                <h4 className="section-title">Basic Information</h4>
                <div className="form-grid">
                  <div className="form-employee-input">
                    {renderInput("fullName", "text", "John Doe", {
                      required: true,
                    })}
                  </div>
                  <div className="form-employee-input">
                    {renderInput("employeeID", "text", "EMP-001", {
                      required: true,
                    })}
                  </div>
                  <div className="form-employee-input">
                    {renderInput("designation", "text", "Software Developer", {
                      required: true,
                    })}
                  </div>
                  <div className="form-employee-input">
                    {renderInput("joiningDate", "date", "", { required: true })}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Contact Details</h4>
                <div className="form-grid">
                  <div className="form-employee-input">
                    {renderInput("email", "email", "john@example.com", {
                      required: true,
                    })}
                  </div>
                  <div className="form-employee-input">
                    {renderInput("number", "tel", "918787878752", {
                      required: true,
                      pattern: "^91\\d{10}$",
                      title:
                        "Must be 12 digits starting with 91 (e.g., 918787878752)",
                      maxLength: 12,
                      onChange: (e) => {
                        // Only allow numbers and enforce 91 prefix
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length > 12) {
                          value = value.substring(0, 12);
                        }
                        setEmployee((prev) => ({ ...prev, number: value }));
                      },
                    })}
                  </div>
                  <div className="form-employee-input">
                    {renderTextarea("address", "123 Main St, City, Country")}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Account Settings</h4>
                <div className="form-grid">
                  <div className="form-employee-input">
                    {renderInput("password", "password", "••••••••", {
                      required: true,
                    })}
                  </div>
                  <div className="form-employee-input">
                    {renderSelect(
                      "status",
                      [
                        { value: "Active", label: "Active" },
                        { value: "Inactive", label: "Inactive" },
                        { value: "Suspended", label: "Suspended" },
                      ],
                      { required: true }
                    )}
                  </div>
                  <div className="form-employee-input">
                    {renderSelect(
                      "role",
                      [
                        { value: "user", label: "Employee" },
                        { value: "team_lead", label: "Team Lead" },
                        { value: "admin", label: "Admin" },
                      ],
                      { required: true }
                    )}
                  </div>
                  <div className="form-employee-input">
                    {renderInput("teamAssociation", "text", "Development Team")}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">Work Schedule</h4>
                <div className="form-grid">
                  <div className="form-employee-input">
                    <label>
                      Select Default Shift{" "}
                      <span className="required-star">*</span>
                    </label>
                    <select
                      value={employee.shifts[0]?.name || ""}
                      onChange={(e) => {
                        const selected = employeeShifts.find(
                          (s) => s.name === e.target.value
                        );
                        if (selected) {
                          setEmployee((prev) => ({
                            ...prev,
                            shifts: [
                              {
                                name: selected.name,
                                startTime: selected.startTime,
                                endTime: selected.endTime,
                                isDefault: true,
                              },
                            ],
                          }));
                        }
                      }}
                      required
                    >
                      <option value="">Select a shift</option>
                      {employeeShifts.map((shift) => (
                        <option key={shift.name} value={shift.name}>
                          {`${shift.name} (${shift.startTime} - ${shift.endTime})`}
                        </option>
                      ))}
                    </select>
                  </div>
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
              <button className="create-btn" type="submit">
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
