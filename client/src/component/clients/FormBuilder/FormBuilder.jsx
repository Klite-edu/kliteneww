import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";
import "./formbuilder.css";

const FormBuilder = () => {
  const [clientId, setClientId] = useState(null);
  const [fields, setFields] = useState([]);
  const [buttonConfig, setButtonConfig] = useState({
    text: "Submit",
    link: "",
    bgColor: "#0D6E6E",
    textColor: "#ffffff",
  });
  const [formTitle, setFormTitle] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch token, role, and permissions in parallel
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
  
        const userToken = tokenRes.data.token;
        let userId = tokenRes.data.userId;
  
        // If userId is not obtained from token response, try fetching via email endpoint
        if (!userId) {
          try {
            const userIdRes = await axios.get(
              `${process.env.REACT_APP_API_URL}/api/permission/get-email`,
              { withCredentials: true }
            );
            userId = userIdRes.data.email;
          } catch (error) {
            console.error("Error fetching user email:", error);
          }
        }
  
        // Check if both token and userId are present
        if (!userToken || !userId) {
          alert("Client ID is missing. Please login as a client.");
          navigate("/login");
          return;
        }
  
        setToken(userToken);
        setClientId(userId);
  
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};
  
        if (!userRole) {
          navigate("/login");
          return;
        }
  
        if (userRole !== "client") {
          alert("Unauthorized: Only clients can access this section.");
          navigate("/");
          return;
        }
  
        setRole(userRole);
        setCustomPermissions(userPermissions);
  
      } catch (error) {
        console.error("Error fetching initial data:", error);
        navigate("/login");
      }
    };
  
    fetchInitialData();
  }, [navigate]);
  

  const addField = () => {
    setFields([
      ...fields,
      {
        label: "New Field",
        type: "text",
        required: false,
        options: ["Option 1"],
      },
    ]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const addOption = (index) => {
    const newFields = [...fields];
    newFields[index].options.push(
      `Option ${newFields[index].options.length + 1}`
    );
    setFields(newFields);
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    const newFields = [...fields];
    newFields[fieldIndex].options[optionIndex] = value;
    setFields(newFields);
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const newFields = [...fields];
    newFields[fieldIndex].options.splice(optionIndex, 1);
    setFields(newFields);
  };

  const saveForm = async () => {
    if (!formTitle) {
      alert("Form title is required");
      return;
    }

    if (!clientId) {
      alert("Client ID is missing. Please login as a client.");
      return;
    }

    const formData = {
      clientId,
      fields,
      buttons: {
        BackgroundColor: buttonConfig.bgColor,
        color: buttonConfig.textColor,
        borderColor: "",
        borderRadius: "4px",
        borderWidth: "1px",
        padding: "10px",
        margin: "5px",
        redirectLink: buttonConfig.link,
        text: buttonConfig.text,
      },
      formInfo: {
        title: formTitle,
        color: "#2DAA9E",
        bgColor: "#000000",
      },
      policyInfo: {
        title: "Policy",
        policyRedirectLink: "#",
        visibility: false,
      },
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/builder/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      alert(`Form saved successfully! Form ID: ${response.data.data._id}`);
      setFormTitle("");
      setFields([]);
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Failed to save form. Please try again.");
    }
  };

  const renderFieldPreview = (field) => {
    switch (field.type) {
      case "text":
      case "email":
      case "password":
      case "number":
      case "date":
      case "datetime-local":
        return (
          <input
            type={field.type}
            className="form-control"
            required={field.required}
            placeholder={`Enter ${field.label || "New Field"}`}
            step={field.type === "datetime-local" ? "1" : undefined}
          />
        );
      case "checkbox":
        return (
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              required={field.required}
            />
            <label className="form-check-label">{field.label}</label>
          </div>
        );
      case "radio":
        return (
          <div>
            {field.options.map((option, i) => (
              <div className="form-check" key={i}>
                <input
                  type="radio"
                  name={`radio-${field.label}`}
                  className="form-check-input"
                  required={field.required}
                />
                <label className="form-check-label">{option}</label>
              </div>
            ))}
          </div>
        );
      case "select":
        return (
          <select className="form-select" required={field.required}>
            <option value="">Select an option</option>
            {field.options.map((option, i) => (
              <option key={i} value={option.toLowerCase().replace(/\s+/g, "-")}>
                {option}
              </option>
            ))}
          </select>
        );
      default:
        return <input type="text" className="form-control" />;
    }
  };
  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="main-formbuilder">
        <div className="container-fluid mt-4">
          <div
            className="d-flex mb-4"
            style={{ borderRadius: "var(--border-radius)" }}
          >
            <h2
              className="text-center"
              style={{ color: "var(--primary-color)" }}
            >
              Form Builder
            </h2>
            <button
              className="btn-sm me-0 ms-auto"
              style={{
                backgroundColor: "var(--primary-color)",
                color: "var(--white)",
                borderRadius: "var(--border-radius)",
                border: "none",
                padding: "8px 16px",
              }}
              onClick={saveForm}
            >
              <i className="bi bi-save"></i> Save form
            </button>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div
                className="card mb-4"
                style={{
                  boxShadow: "var(--box-shadow-primary)",
                  borderRadius: "var(--border-radius)",
                }}
              >
                <div
                  className="card-header"
                  style={{
                    backgroundColor: "var(--primary-color)",
                    color: "var(--white)",
                    borderRadius:
                      "var(--border-radius) var(--border-radius) 0 0",
                  }}
                >
                  <h4 className="m-0">Form Configuration</h4>
                </div>
                <div
                  className="card-body"
                  style={{ backgroundColor: "var(--gray)" }}
                >
                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{ color: "var(--primary-dark)" }}
                    >
                      Form Title*
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      style={{ borderRadius: "var(--border-radius)" }}
                    />
                  </div>
                </div>
              </div>

              <div
                className="card mb-4"
                style={{
                  boxShadow: "var(--box-shadow-primary)",
                  borderRadius: "var(--border-radius)",
                }}
              >
                <div
                  className="card-header"
                  style={{
                    backgroundColor: "var(--primary-color)",
                    color: "var(--white)",
                    borderRadius:
                      "var(--border-radius) var(--border-radius) 0 0",
                  }}
                >
                  <h4 className="m-0">Button Configuration</h4>
                </div>
                <div
                  className="card-body"
                  style={{ backgroundColor: "var(--gray)" }}
                >
                  <div className="row mb-3">
                    <div className="col-6">
                      <label
                        className="form-label"
                        style={{ color: "var(--primary-dark)" }}
                      >
                        Button Text
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={buttonConfig.text}
                        onChange={(e) =>
                          setButtonConfig({
                            ...buttonConfig,
                            text: e.target.value,
                          })
                        }
                        style={{ borderRadius: "var(--border-radius)" }}
                      />
                    </div>
                    <div className="col-6">
                      <label
                        className="form-label"
                        style={{ color: "var(--primary-dark)" }}
                      >
                        Redirect Link
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={buttonConfig.link}
                        onChange={(e) =>
                          setButtonConfig({
                            ...buttonConfig,
                            link: e.target.value,
                          })
                        }
                        style={{ borderRadius: "var(--border-radius)" }}
                      />
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-6">
                      <label
                        className="form-label"
                        style={{ color: "var(--primary-dark)" }}
                      >
                        Background Color
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={buttonConfig.bgColor}
                          onChange={(e) =>
                            setButtonConfig({
                              ...buttonConfig,
                              bgColor: e.target.value,
                            })
                          }
                          style={{
                            width: "50px",
                            height: "38px",
                            borderRadius: "var(--border-radius)",
                          }}
                        />
                        <span className="ms-2">{buttonConfig.bgColor}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <label
                        className="form-label"
                        style={{ color: "var(--primary-dark)" }}
                      >
                        Text Color
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={buttonConfig.textColor}
                          onChange={(e) =>
                            setButtonConfig({
                              ...buttonConfig,
                              textColor: e.target.value,
                            })
                          }
                          style={{
                            width: "50px",
                            height: "38px",
                            borderRadius: "var(--border-radius)",
                          }}
                        />
                        <span className="ms-2">{buttonConfig.textColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="card mb-4"
                style={{
                  boxShadow: "var(--box-shadow-primary)",
                  borderRadius: "var(--border-radius)",
                }}
              >
                <div
                  className="card-header d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: "var(--primary-color)",
                    color: "var(--white)",
                    borderRadius:
                      "var(--border-radius) var(--border-radius) 0 0",
                  }}
                >
                  <h4 className="m-0">Custom Fields</h4>
                  <button
                    className="btn btn-light"
                    onClick={addField}
                    style={{
                      backgroundColor: "var(--white)",
                      color: "var(--primary-color)",
                      borderRadius: "var(--border-radius)",
                    }}
                  >
                    <i className="bi bi-plus-circle"></i> Add Field
                  </button>
                </div>
                <div
                  className="card-body"
                  style={{ backgroundColor: "var(--gray)" }}
                >
                  {fields.map((field, index) => (
                    <div
                      key={index}
                      className="card mb-3"
                      style={{
                        borderRadius: "var(--border-radius)",
                        border: "1px solid var(--primary-light)",
                      }}
                    >
                      <div
                        className="card-header d-flex justify-content-between align-items-center"
                        style={{
                          backgroundColor: "var(--primary-light)",
                          borderRadius:
                            "var(--border-radius) var(--border-radius) 0 0",
                        }}
                      >
                        <h5
                          className="m-0"
                          style={{ color: "var(--primary-dark)" }}
                        >
                          {field.label || "New Field"}
                        </h5>
                        <button
                          className="btn btn-sm"
                          onClick={() => removeField(index)}
                          style={{
                            backgroundColor: "var(--white)",
                            color: "var(--primary-color)",
                            borderRadius: "var(--border-radius)",
                          }}
                        >
                          <i className="bi bi-trash"></i> Remove
                        </button>
                      </div>
                      <div
                        className="card-body"
                        style={{ backgroundColor: "var(--white)" }}
                      >
                        <div className="row align-items-center mb-3">
                          <div className="col-5">
                            <label
                              className="form-label mb-0"
                              style={{ color: "var(--primary-dark)" }}
                            >
                              Field Label
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={field.label}
                              onChange={(e) =>
                                updateField(index, "label", e.target.value)
                              }
                              style={{ borderRadius: "var(--border-radius)" }}
                            />
                          </div>
                          <div className="col-5">
                            <label
                              className="form-label mb-0"
                              style={{ color: "var(--primary-dark)" }}
                            >
                              Field Type
                            </label>
                            <select
                              className="form-select"
                              value={field.type}
                              onChange={(e) =>
                                updateField(index, "type", e.target.value)
                              }
                              style={{ borderRadius: "var(--border-radius)" }}
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="password">Password</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="datetime-local">
                                Date & Time
                              </option>
                              <option value="checkbox">Checkbox</option>
                              <option value="radio">Radio Button</option>
                              <option value="select">Dropdown</option>
                            </select>
                          </div>
                          <div className="col-2">
                            <div className="form-check mt-4">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`required-${index}`}
                                checked={field.required}
                                onChange={() =>
                                  updateField(
                                    index,
                                    "required",
                                    !field.required
                                  )
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`required-${index}`}
                                style={{ color: "var(--primary-dark)" }}
                              >
                                Required
                              </label>
                            </div>
                          </div>
                        </div>

                        {["radio", "select"].includes(field.type) && (
                          <div className="mb-2">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <label
                                className="form-label mb-0"
                                style={{ color: "var(--primary-dark)" }}
                              >
                                Options
                              </label>
                              <button
                                className="btn btn-sm"
                                onClick={() => addOption(index)}
                                style={{
                                  backgroundColor: "var(--primary-color)",
                                  color: "var(--white)",
                                  borderRadius: "var(--border-radius)",
                                }}
                              >
                                <i className="bi bi-plus-circle"></i> Add Option
                              </button>
                            </div>
                            <div>
                              {field.options.map((option, i) => (
                                <div key={i} className="input-group mb-2">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={option}
                                    onChange={(e) =>
                                      updateOption(index, i, e.target.value)
                                    }
                                    style={{
                                      borderRadius: "var(--border-radius)",
                                    }}
                                  />
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => removeOption(index, i)}
                                    disabled={field.options.length <= 1}
                                    style={{
                                      borderRadius:
                                        "0 var(--border-radius) var(--border-radius) 0",
                                      borderColor: "var(--primary-color)",
                                      color: "var(--primary-color)",
                                    }}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div
                className="card"
                style={{
                  boxShadow: "var(--box-shadow-primary)",
                  borderRadius: "var(--border-radius)",
                }}
              >
                <div
                  className="card-header"
                  style={{
                    backgroundColor: "var(--primary-color)",
                    color: "var(--white)",
                    borderRadius:
                      "var(--border-radius) var(--border-radius) 0 0",
                  }}
                >
                  <h4 className="m-0">Live Preview</h4>
                </div>
                <div
                  className="card-body"
                  style={{
                    backgroundColor: "var(--gray)",
                    minHeight: "500px",
                  }}
                >
                  {fields.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <h5 style={{ color: "var(--primary-dark)" }}>
                        Your form preview will appear here
                      </h5>
                      <p style={{ color: "var(--text-medium)" }}>
                        Add fields to see how your form will look
                      </p>
                    </div>
                  ) : (
                    <form>
                      <h4
                        style={{
                          color: "var(--primary-dark)",
                          marginBottom: "20px",
                        }}
                      >
                        {formTitle || "Untitled Form"}
                      </h4>
                      {fields.map((field, index) => (
                        <div key={index} className="mb-3">
                          <label
                            className="form-label"
                            style={{ color: "var(--primary-dark)" }}
                          >
                            {field.label || "New Field"}
                            {field.required && (
                              <span className="text-danger ms-1">*</span>
                            )}
                          </label>
                          {renderFieldPreview(field)}
                        </div>
                      ))}
                      <div className="d-grid mt-4 mb-4">
                        <button
                          type="submit"
                          className="btn btn-lg"
                          style={{
                            backgroundColor: buttonConfig.bgColor,
                            color: buttonConfig.textColor,
                            borderRadius: "var(--border-radius)",
                            border: "none",
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            if (buttonConfig.link) {
                              window.open(buttonConfig.link, "_blank");
                            }
                          }}
                        >
                          {buttonConfig.text || "Submit"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FormBuilder;
