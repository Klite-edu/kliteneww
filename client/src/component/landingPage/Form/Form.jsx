import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";
import "./form.css";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

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
  const [companyName, setCompanyName] = useState("");
  const navigate = useNavigate();
  const [formCategories, setFormCategories] = useState({
    "Recent Forms": [],
    "All Forms": [],
  });
  const params = useParams();
  const directFormId = params.formId;
  const isPrivateForm = window.location.pathname.includes("/private-view/");

  useEffect(() => {
    const fetchInitialData = async () => {
      console.log("Starting fetchInitialData");
      try {
        setLoading(true);

        // 🔥 Step 1: Get token first
        const tokenRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );
        const userToken = tokenRes.data.token;
        const decoded = jwtDecode(userToken);
        const userCompanyName = decoded.companyName;

        setToken(userToken);
        setCompanyName(userCompanyName);

        if (directFormId) {
          console.log("Direct form ID detected:", directFormId);
          try {
            if (isPrivateForm) {
              // 🔥 Private Form Fetch
              const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/builder/private-view/${directFormId}?company=${userCompanyName}`,
                {
                  headers: { Authorization: `Bearer ${userToken}` },
                  withCredentials: true,
                }
              );

              console.log("Private form fetch response:", res.data);

              setSelectedForm(res.data.form);
              setViewMode("full");
              return;
            } else {
              // 🔥 Public Form Fetch
              let encodedCompany = new URLSearchParams(
                window.location.search
              ).get("c");
              let companyQuery = encodedCompany
                ? decodeURIComponent(escape(atob(encodedCompany)))
                : null;
              if (!companyQuery) {
                throw new Error(
                  "Company name is required to fetch the public form."
                );
              }

              const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/builder/public/${directFormId}?company=${companyQuery}`
              );
              console.log("Public form fetch response:", res.data);

              setSelectedForm(res.data.form);
              setViewMode("full");
              return;
            }
          } catch (error) {
            console.error("Error fetching form:", error);
            setError("Form not found or inaccessible.");
            setLoading(false);
            return;
          }
        }

        // 🔥 Step 2: Now fetch user role, email, permissions
        const [roleRes, permissionsRes, emailRes] = await Promise.all([
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

        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};
        const email = emailRes.data.email;
        const userId = decoded.userId;

        setRole(userRole);
        setCustomPermissions(userPermissions);
        setClientId(userId);
        setUserEmail(email);

        const formsResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/builder/forms`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
            withCredentials: true,
          }
        );

        const formsData = formsResponse.data.forms;
        setForms(formsData);

        const categorized = {
          "Recent Forms": formsData.slice(0, 4),
          "All Forms": formsData,
        };

        setFormCategories(categorized);
      } catch (error) {
        console.error("Error in fetchInitialData:", error);
        setError("Failed to fetch data. Please try again.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate, directFormId]);

  const handleFormClick = (form) => {
    setSelectedForm(form);
    setViewMode("full");
  };
  const handleDeleteForm = async (formId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this form? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/builder/delete/${formId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      alert("Form deleted successfully!");

      // Remove the deleted form from state
      setForms((prevForms) => prevForms.filter((form) => form._id !== formId));

      // Update categorized form view also
      setFormCategories((prevCategories) => {
        const updatedCategories = {};
        for (const [category, formsList] of Object.entries(prevCategories)) {
          updatedCategories[category] = formsList.filter(
            (form) => form._id !== formId
          );
        }
        return updatedCategories;
      });
    } catch (error) {
      console.error("Error deleting form:", error.message);
      alert("Failed to delete form. Please try again.");
    }
  };

  const handleBackToGrid = () => {
    setViewMode("grid");
    setSelectedForm(null);
  };

  if (loading) {
    return (
      <div className="form-loading-container">
        <div className="form-loading-spinner"></div>
        <p>Loading forms...</p>
      </div>
    );
  }

  if (error) {
    return <div className="form-error-message">{error}</div>;
  }

  if (viewMode === "full" && selectedForm) {
    return (
      <FormFullView
        form={selectedForm}
        onBack={handleBackToGrid}
        role={role}
        customPermissions={customPermissions}
        token={token}
        clientId={clientId}
        userEmail={userEmail}
        companyName={companyName}
        isPrivateForm={isPrivateForm}
      />
    );
  }

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="form-dashboard-container">
        <div className="form-dashboard-header">
          <div className="form-header-content">
            <h1>Forms</h1>
            <p>Create and manage all your forms in one place</p>
          </div>
          <button
            className="form-create-button"
            onClick={() => navigate("/FormBuilder")}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"
              />
            </svg>
            Create New Form
          </button>
        </div>

        <div className="form-dashboard-content">
          {Object.entries(formCategories).map(([category, forms]) => (
            <div key={category} className="form-category-section">
              <div className="form-category-header">
                <h2>{category}</h2>
                {category === "Recent Forms" && forms.length > 4 && (
                  <button className="view-all-button">View All</button>
                )}
              </div>

              <div className="form-grid">
                {forms.map((form) => (
                  <div key={form._id} className="form-card">
                    {/* 🗑️ Trash Delete Button */}
                    <div className="form-card-actions">
                      <button
                        className="form-delete-button"
                        onClick={(e) => {
                          e.stopPropagation(); // ❗ Important: prevent card click
                          handleDeleteForm(form._id);
                        }}
                        title="Delete Form"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path
                            fill="red"
                            d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6Z"
                          />
                        </svg>
                      </button>
                      <button
                        className="form-copy-link-button"
                        onClick={(e) => {
                          e.stopPropagation();

                          if (!companyName) {
                            alert(
                              "Company name not found. Please login again."
                            );
                            return;
                          }

                          const encodedCompany = btoa(
                            unescape(encodeURIComponent(companyName))
                          );
                          const url = `${window.location.origin}/forms/view/${form._id}?c=${encodedCompany}`;
                          navigator.clipboard.writeText(url);
                          alert("✅ Public form link copied!");
                        }}
                        title="Copy Public Link"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="12"
                          height="12"
                          style={{ marginRight: "4px" }}
                        >
                          <path
                            fill="#1890ff"
                            d="M18,5V2H10V5H18M16,11H13V14H16V11M8,16H11V19H8V16M6,12A2,2 0 0,0 4,14V18A2,2 0 0,0 6,20H9V16H6V12M13,19V16H17V20H14A2,2 0 0,1 12,18V13A2,2 0 0,1 14,11H16V8H12V10H10V8H5V10H3V5A2,2 0 0,1 5,3H10V0H18V3H19A2,2 0 0,1 21,5V10H19V12H21V14H19V16H21V18A2,2 0 0,1 19,20H17V19H13Z"
                          />
                        </svg>
                        Public
                      </button>
                      <button
                        className="form-copy-link-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const encodedCompany = btoa(
                            unescape(encodeURIComponent(companyName))
                          );
                          const privateUrl = `${window.location.origin}/forms/private-view/${form._id}?c=${encodedCompany}`;

                          navigator.clipboard.writeText(privateUrl);
                          alert("✅ Private form link copied!");
                        }}
                        title="Copy Private Link"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="12"
                          height="12"
                          style={{ marginRight: "4px" }}
                        >
                          <path
                            fill="#1890ff"
                            d="M18,5V2H10V5H18M16,11H13V14H16V11M8,16H11V19H8V16M6,12A2,2 0 0,0 4,14V18A2,2 0 0,0 6,20H9V16H6V12M13,19V16H17V20H14A2,2 0 0,1 12,18V13A2,2 0 0,1 14,11H16V8H12V10H10V8H5V10H3V5A2,2 0 0,1 5,3H10V0H18V3H19A2,2 0 0,1 21,5V10H19V12H21V14H19V16H21V18A2,2 0 0,1 19,20H17V19H13Z"
                          />
                        </svg>
                        Private
                      </button>
                    </div>

                    {/* 📄 Clicking on this area will open Form */}
                    <div onClick={() => handleFormClick(form)}>
                      <div className="form-card-icon">
                        <svg viewBox="0 0 24 24" width="28" height="28">
                          <path
                            fill="#4e73df"
                            d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z"
                          />
                        </svg>
                      </div>
                      <div className="form-card-content">
                        <h3>{form.formInfo?.title || "Untitled Form"}</h3>
                        {form.formInfo?.description && (
                          <p className="form-description">
                            {form.formInfo.description.length > 60
                              ? `${form.formInfo.description.substring(
                                  0,
                                  60
                                )}...`
                              : form.formInfo.description}
                          </p>
                        )}
                        <div className="form-meta-data">
                          <span>
                            <svg viewBox="0 0 24 24" width="14" height="14">
                              <path
                                fill="#6c757d"
                                d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"
                              />
                            </svg>
                            {form.fields?.length || 0} fields
                          </span>
                          <span>
                            <svg viewBox="0 0 24 24" width="14" height="14">
                              <path
                                fill="#6c757d"
                                d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"
                              />
                            </svg>
                            {new Date(form.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const FormFullView = ({
  form,
  onBack,
  token,
  clientId,
  userEmail,
  companyName,
  isPrivateForm,
}) => {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
  useEffect(() => {
    if (isPrivateForm) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/api/permission/get-token`, {
          withCredentials: true,
        })
        .then((res) => {
          console.log("✅ Logged In. Token Found.");
        })
        .catch((err) => {
          console.warn("⚠️ No token. Redirecting to login...");
          window.location.href = "/"; // ya navigate("/login")
        });
    }
  }, [isPrivateForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const submissions = form.fields.map((field) => ({
        fieldLabel: field.label,
        value: formData[field.label] || "",
        fieldCategory: field.fieldCategory || "other",
      }));

      const payload = {
        submissions,
        user_email: userEmail,
        data: submissions,
        clientId,
      };
      if (isPrivateForm && !token) {
        alert("Session expired. Please login again.");
        window.location.href = "/";
        return;
      }
      const submitUrl = isPrivateForm
        ? `${process.env.REACT_APP_API_URL}/api/form/submit/${form._id}`
        : `${process.env.REACT_APP_API_URL}/api/form/public-submit/${form._id}?company=${companyName}`;

      await axios.post(submitUrl, payload, {
        headers: isPrivateForm ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });

      setSuccessMessage("Form submitted successfully!");

      setTimeout(() => {
        const resetData = {};
        form.fields.forEach((field) => {
          resetData[field.label] = "";
        });
        setFormData(resetData);
        setSuccessMessage("");
      }, 2000);
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
      <div className="form-fullview-container">
        <div className="form-content-container">
          <div className="form-header">
            <h1>{form.formInfo?.title || "Form"}</h1>
            {form.formInfo?.description && (
              <p className="form-description">{form.formInfo.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="form-fields-container">
            {form.fields.map((field, index) => (
              <div
                key={index}
                className={`form-field ${field.fieldCategory || ""}`}
              >
                <div className="field-header">
                  <label>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                  </label>
                  {field.fieldCategory && (
                    <span className={`field-category ${field.fieldCategory}`}>
                      {field.fieldCategory}
                    </span>
                  )}
                </div>

                {field.type === "select" ? (
                  <select
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
              <div className="form-policy">
                <label className="policy-checkbox">
                  <input
                    type="checkbox"
                    required
                    checked={formData.policy || false}
                    onChange={(e) =>
                      handleInputChange("policy", e.target.checked)
                    }
                  />
                  <span className="checkmark"></span>
                  <span className="policy-text">{form.policyInfo.title}</span>
                </label>
              </div>
            )}

            {submitError && (
              <div className="form-error">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="#dc3545"
                    d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"
                  />
                </svg>
                {submitError}
              </div>
            )}

            {successMessage && (
              <div className="form-success">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="#28a745"
                    d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M10,17L5,12L6.41,10.59L10,14.17L17.59,6.58L19,8L10,17Z"
                  />
                </svg>
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? (
                <>
                  <div className="button-spinner"></div>
                  Processing...
                </>
              ) : (
                form.buttons?.text || "Submit Form"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Form;
