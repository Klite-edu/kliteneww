// import React, { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";

// const Form = () => {
//   const { id } = useParams(); // Get formId from route
//   const [form, setForm] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // Fetch the specific form by ID
//   useEffect(() => {
//     fetchForm();
//   }, []);

//   const fetchForm = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/builder/form/${id}`);
//       setForm(response.data.form);
//     } catch (error) {
//       console.error("Error fetching form:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <p className="text-center">Loading form...</p>;

//   if (!form) return <p className="text-center">Form not found.</p>;

//   return (
//     <div className="container mt-4">
//       <h2 className="text-center mb-4">{form.formInfo.title}</h2>
//       <div className="card p-4">
//         <form>
//           {form.fields.map((field, index) => (
//             <div key={index} className="mb-3">
//               <label className="form-label">{field.label}</label>
//               {field.type === "select" ? (
//                 <select className="form-select">
//                   {field.options.map((option, i) => (
//                     <option key={i}>{option}</option>
//                   ))}
//                 </select>
//               ) : (
//                 <input type={field.type} className="form-control" required={field.required} />
//               )}
//             </div>
//           ))}

//           {/* Show policy if enabled */}
//           {form.policyInfo.visibility && (
//             <div className="mb-3">
//               <input type="checkbox" id="policy" required />
//               <label htmlFor="policy" className="ms-2">
//                 {form.policyInfo.title}
//               </label>
//             </div>
//           )}

//           <button
//             type="submit"
//             className="btn"
//             style={{
//               backgroundColor: form.buttons.BackgroundColor,
//               color: form.buttons.color,
//             }}
//           >
//             {form.buttons.text}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Form;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const Form = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({}); // Stores data for all forms
  const { id } = useParams(); // For direct form access if needed

  console.log("[AllFormsViewer] Component initialized");

  // Fetch all forms from the database
  useEffect(() => {
    const fetchAllForms = async () => {
      console.log("[fetchAllForms] Starting forms fetch");
      setLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/builder/forms`);
        console.log("[fetchAllForms] API response received:", response);

        const formsData = response.data.forms;
        console.log("[fetchAllForms] Forms data extracted:", formsData);

        // Initialize form data for each form
        const initialFormData = {};
        formsData.forEach(form => {
          form.fields.forEach(field => {
            initialFormData[`${form._id}_${field.label}`] = '';
          });
        });

        setForms(formsData);
        setFormData(initialFormData);
        console.log("[fetchAllForms] Initialized forms and formData state");

      } catch (error) {
        console.error("[fetchAllForms] Error fetching forms:", error);
        setError("Failed to fetch forms. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllForms();
  }, []);

  // If a specific form ID is provided in URL, fetch just that one
  useEffect(() => {
    if (id) {
      const fetchSingleForm = async () => {
        console.log("[fetchSingleForm] Fetching single form with id:", id);
        setLoading(true);
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/builder/form/${id}`);
          console.log("[fetchSingleForm] API response received:", response);

          const formData = response.data.form;
          console.log("[fetchSingleForm] Form data extracted:", formData);

          // Initialize form data for this specific form
          const initialFormData = {};
          formData.fields.forEach(field => {
            initialFormData[`${formData._id}_${field.label}`] = '';
          });

          setForms([formData]);
          setFormData(initialFormData);
          console.log("[fetchSingleForm] Initialized single form state");

        } catch (error) {
          console.error("[fetchSingleForm] Error fetching form:", error);
          setError("Failed to fetch form. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchSingleForm();
    }
  }, [id]);

  const handleInputChange = (formId, fieldLabel, value) => {
    const fieldKey = `${formId}_${fieldLabel}`;
    console.log("[handleInputChange] Field changed:", fieldKey, "New value:", value);
    const updatedFormData = { ...formData, [fieldKey]: value };
    console.log("[handleInputChange] Updated formData:", updatedFormData);
    setFormData(updatedFormData);
  };

  const handleSubmit = async (formId, e) => {
    e.preventDefault();
    console.log("[handleSubmit] Form submission initiated for formId:", formId);
    
    const form = forms.find(f => f._id === formId);
    if (!form) {
      console.error("[handleSubmit] Form not found with id:", formId);
      return;
    }

    console.log("[handleSubmit] Current formData for this form:", formData);

    try {
      const clientId = localStorage.getItem("userId");
      const user_email = localStorage.getItem("userEmail") || "";
      
      console.log("[handleSubmit] Retrieved from localStorage - clientId:", clientId, "user_email:", user_email);

      // Prepare submissions for this specific form
      const submissions = form.fields.map(field => ({
        fieldLabel: field.label,
        value: formData[`${formId}_${field.label}`] || ''
      }));

      console.log("[handleSubmit] Prepared submissions payload:", submissions);

      const payload = {
        submissions,
        user_email,
        data: submissions,
        clientId,
      };

      console.log("[handleSubmit] Sending payload to server:", payload);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/form/submit/${formId}`,
        payload
      );

      console.log("[handleSubmit] Submission successful! Response:", response.data);
      
      alert("Form submitted successfully!");
      
      // Reset form after successful submission
      const resetFormData = { ...formData };
      form.fields.forEach(field => {
        resetFormData[`${formId}_${field.label}`] = '';
      });
      setFormData(resetFormData);
      console.log("[handleSubmit] Form reset after submission");

    } catch (error) {
      console.error("[handleSubmit] Error submitting form:", error);
      console.error("[handleSubmit] Error details:", {
        message: error.message,
        response: error.response,
        config: error.config,
        stack: error.stack
      });
      
      alert(`Failed to submit form. ${error.response?.data?.message || 'Please try again.'}`);
    }
  };

  if (loading) {
    console.log("[Render] Loading state");
    return <p className="text-center">Loading forms...</p>;
  }

  if (error) {
    console.log("[Render] Error state:", error);
    return <p className="text-center text-danger">{error}</p>;
  }

  if (forms.length === 0) {
    console.log("[Render] No forms data state");
    return <p className="text-center">No forms found.</p>;
  }

  console.log("[Render] Rendering forms with data:", {
    formsCount: forms.length,
    forms: forms.map(form => ({
      id: form._id,
      title: form.formInfo?.title,
      fieldsCount: form.fields?.length
    })),
    currentFormData: formData
  });

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">
        {id ? forms[0]?.formInfo?.title || 'Form' : 'All Forms'}
      </h1>

      <div className="row">
        {forms.map(form => (
          <div key={form._id} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h3 className="card-title">{form.formInfo.title}</h3>
                <form onSubmit={(e) => handleSubmit(form._id, e)}>
                  {form.fields.map((field, index) => {
                    const fieldKey = `${form._id}_${field.label}`;
                    console.log(`[Render] Rendering field ${index} for form ${form._id}:`, field);
                    return (
                      <div key={index} className="mb-3">
                        <label className="form-label">{field.label}</label>
                        {field.type === "select" ? (
                          <select
                            className="form-select"
                            value={formData[fieldKey] || ""}
                            onChange={(e) => {
                              console.log(`[Select Change] Form: ${form._id}, Field: ${field.label}, Value: ${e.target.value}`);
                              handleInputChange(form._id, field.label, e.target.value);
                            }}
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
                            className="form-control"
                            value={formData[fieldKey] || ""}
                            onChange={(e) => {
                              console.log(`[Input Change] Form: ${form._id}, Field: ${field.label}, Value: ${e.target.value}`);
                              handleInputChange(form._id, field.label, e.target.value);
                            }}
                            required={field.required}
                          />
                        )}
                      </div>
                    );
                  })}

                  {form.policyInfo?.visibility && (
                    <div className="mb-3 form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`${form._id}_policy`}
                        required
                        checked={formData[`${form._id}_policy`] || false}
                        onChange={(e) => {
                          console.log(`[Policy Checkbox] Form: ${form._id}, Changed:`, e.target.checked);
                          handleInputChange(form._id, "policy", e.target.checked);
                        }}
                      />
                      <label className="form-check-label" htmlFor={`${form._id}_policy`}>
                        {form.policyInfo.title}
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn mt-2"
                    style={{
                      backgroundColor: form.buttons?.BackgroundColor || '#4361ee',
                      color: form.buttons?.color || 'white',
                    }}
                  >
                    {form.buttons?.text || 'Submit'}
                  </button>
                </form>
              </div>
              <div className="card-footer">
                <small className="text-muted">
                  Form ID: {form._id}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Form;

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Link } from "react-router-dom";

// const AllForms = () => {
//   const [forms, setForms] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     fetchForms();
//   }, []);

//   const fetchForms = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/builder/forms`);
//       setForms(response.data.forms || []);
//     } catch (err) {
//       setError("Failed to load forms.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <p>Loading forms...</p>;
//   if (error) return <p>{error}</p>;

//   return (
//     <div className="container mt-4">
//       <h2 className="mb-4">Available Forms</h2>
//       {forms.length === 0 ? (
//         <p>No forms found.</p>
//       ) : (
//         <div className="list-group">
//           {forms.map((form) => (
//             <Link
//               key={form._id}
//               to={`/form/${form._id}`}
//               className="list-group-item list-group-item-action"
//             >
//               {form.formInfo?.title || "Untitled Form"}
//             </Link>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default AllForms;
