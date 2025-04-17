import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";
import "./form.css";

const Form = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedForm, setSelectedForm] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const [formCategories, setFormCategories] = useState({
    "Next form": [],
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch token, role, permissions, and email in parallel
        const [tokenRes, roleRes, permissionsRes, emailRes] = await Promise.all([
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
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-email`,
            { withCredentials: true }
          ),
        ]);

        const userToken = tokenRes.data.token;
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};
        const email = emailRes.data.email;
        const userId = tokenRes.data.userId || email; // Fallback to email if userId not available

        if (!userToken || !userId) {
          alert("Authentication required. Please login.");
          navigate("/");
          return;
        }

        setToken(userToken);
        setRole(userRole);
        setCustomPermissions(userPermissions);
        setClientId(userId);
        setUserEmail(email);

        // Now fetch forms data
        const formsResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/builder/forms`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            withCredentials: true,
          }
        );

        const formsData = formsResponse.data.forms;
        setForms(formsData);

        const categorized = {
          "Next form": formsData.slice(0, 5),
        };

        setFormCategories(categorized);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setError("Failed to fetch data. Please try again.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleFormClick = (form) => {
    setSelectedForm(form);
    setViewMode("full");
  };

  const handleBackToGrid = () => {
    setViewMode("grid");
    setSelectedForm(null);
  };

  if (loading) {
    return <div className="form-dash-loading">Loading forms...</div>;
  }

  if (error) {
    return <div className="form-dash-error">{error}</div>;
  }

  if (viewMode === "full" && selectedForm) {
    return (
      <FormDashFullView
        form={selectedForm}
        onBack={handleBackToGrid}
        role={role}
        customPermissions={customPermissions}
        token={token}
        clientId={clientId}
        userEmail={userEmail}
      />
    );
  }

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="form-dash-container">
        <div className="form-dash-header">
          <h1 className="form-dash-title">Forma</h1>
          <button
            className="form-dash-new-btn"
            onClick={() => navigate("/FormBuilder")}
          >
            Create a new form
          </button>
        </div>

        {Object.entries(formCategories).map(([category, forms]) => (
          <div key={category} className="form-dash-category">
            <h2 className="form-dash-category-title">{category}</h2>
            <div className="form-dash-grid">
              {forms.map((form) => (
                <div
                  key={form._id}
                  className="form-dash-card"
                  onClick={() => handleFormClick(form)}
                >
                  <div className="form-dash-card-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path
                        fill="var(--primary-color)"
                        d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z"
                      />
                    </svg>
                  </div>
                  <h3 className="form-dash-card-title">
                    {form.formInfo?.title || "Untitled Form"}
                  </h3>
                  {form.formInfo?.description && (
                    <p className="form-dash-card-desc">
                      {form.formInfo.description}
                    </p>
                  )}
                  <div className="form-dash-card-meta">
                    <span>
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path
                          fill="#666"
                          d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"
                        />
                      </svg>
                      {form.fields?.length || 0} fields
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path
                          fill="#666"
                          d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"
                        />
                      </svg>
                      {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const FormDashFullView = ({ 
  form, 
  onBack, 
  role, 
  customPermissions, 
  token,
  clientId,
  userEmail
}) => {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const initialData = {};
    form.fields.forEach((field) => {
      initialData[field.label] = "";
    });
    setFormData(initialData);
  }, [form]);

  const handleInputChange = (fieldLabel, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldLabel]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const submissions = form.fields.map((field) => ({
        fieldLabel: field.label,
        value: formData[field.label] || "",
      }));

      const payload = {
        submissions,
        user_email: userEmail,
        data: submissions,
        clientId,
      };

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/form/submit/${form._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      alert("Form submitted successfully!");

      const resetData = {};
      form.fields.forEach((field) => {
        resetData[field.label] = "";
      });
      setFormData(resetData);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        error.response?.data?.message ||
          "Failed to submit form. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="form-dash-full-container">
        <button className="form-dash-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="var(--primary-color)"
              d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"
            />
          </svg>
          Back to all forms
        </button>

        <div className="form-dash-full-content">
          <div className="form-dash-full-header">
            <h1 className="form-dash-full-title">
              {form.formInfo?.title || "Form"}
            </h1>
            {form.formInfo?.description && (
              <p className="form-dash-full-desc">{form.formInfo.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="form-dash-full-form">
            {form.fields.map((field, index) => (
              <div key={index} className="form-dash-field">
                <label className="form-dash-field-label">
                  {field.label}
                  {field.required && (
                    <span className="required-asterisk">*</span>
                  )}
                </label>
                {field.type === "select" ? (
                  <select
                    className="form-dash-field-select"
                    value={formData[field.label] || ""}
                    onChange={(e) =>
                      handleInputChange(field.label, e.target.value)
                    }
                    required={field.required}
                  >
                    <option value="">Select an option</option>
                    {field.options.map((option, i) => (
                      <option key={i} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="form-dash-field-input"
                    type={field.type}
                    value={formData[field.label] || ""}
                    onChange={(e) =>
                      handleInputChange(field.label, e.target.value)
                    }
                    required={field.required}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}

            {form.policyInfo?.visibility && (
              <div className="form-dash-policy">
                <label className="form-dash-policy-container">
                  <input
                    type="checkbox"
                    className="form-dash-policy-checkbox"
                    required
                    checked={formData.policy || false}
                    onChange={(e) =>
                      handleInputChange("policy", e.target.checked)
                    }
                  />
                  <span className="form-dash-policy-checkmark"></span>
                  <span className="form-dash-policy-label">
                    {form.policyInfo.title}
                  </span>
                </label>
              </div>
            )}

            {submitError && (
              <div className="form-dash-submit-error">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="#d32f2f"
                    d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"
                  />
                </svg>
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="form-dash-submit-btn"
            >
              {submitting ? (
                <>
                  <svg
                    className="form-dash-spinner"
                    viewBox="0 0 50 50"
                    width="20"
                    height="20"
                  >
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="white"
                      strokeWidth="5"
                    ></circle>
                  </svg>
                  Submitting...
                </>
              ) : (
                form.buttons?.text || "Submit"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Form;