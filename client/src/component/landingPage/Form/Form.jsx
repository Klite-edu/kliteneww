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
import { useParams } from "react-router-dom";
import axios from "axios";

const Form = () => {
  const { id } = useParams(); // Get formId from route
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({}); // State to store form input values

  // Fetch the specific form by ID
  useEffect(() => {
    fetchForm();
  }, []);

  const fetchForm = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/builder/form/${id}`);
      const formData = response.data.form;

      // Get clientId from localStorage
      const clientId = localStorage.getItem("userId");

      // Validate clientId
      if (!formData.client.includes(clientId)) {
        setError("You do not have permission to access this form.");
        return;
      }

      // Set form data if validation passes
      setForm(formData);
    } catch (error) {
      console.error("Error fetching form:", error);
      setError("Failed to fetch form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (fieldLabel, value) => {
    setFormData({ ...formData, [fieldLabel]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const clientId = localStorage.getItem("userId"); // ✅ Fetch clientId
      const user_email = localStorage.getItem("userEmail") || ""; // Optional, if needed

      // Prepare submissions array
      const submissions = Object.keys(formData).map((fieldLabel) => ({
        fieldLabel,
        value: formData[fieldLabel],
      }));

      // Send submission to the backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/form/submit/${id}`,
        {
          submissions,
          user_email,  // Optional
          data: submissions, // Optional
          clientId,   // ✅ Pass clientId explicitly!
        }
      );

      alert("Form submitted successfully!");
      console.log("Submission response:", response.data);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit form. Please try again.");
    }
  };

  if (loading) return <p className="text-center">Loading form...</p>;

  if (error) return <p className="text-center text-danger">{error}</p>;

  if (!form) return <p className="text-center">Form not found.</p>;

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">{form.formInfo.title}</h2>
      <div className="card p-4">
        <form onSubmit={handleSubmit}>
          {form.fields.map((field, index) => (
            <div key={index} className="mb-3">
              <label className="form-label">{field.label}</label>
              {field.type === "select" ? (
                <select
                  className="form-select"
                  value={formData[field.label] || ""}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                >
                  {field.options.map((option, i) => (
                    <option key={i}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  className="form-control"
                  value={formData[field.label] || ""}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  required={field.required}
                />
              )}
            </div>
          ))}

          {/* Show policy if enabled */}
          {form.policyInfo.visibility && (
            <div className="mb-3">
              <input
                type="checkbox"
                id="policy"
                required
                checked={formData["policy"] || false}
                onChange={(e) => handleInputChange("policy", e.target.checked)}
              />
              <label htmlFor="policy" className="ms-2">
                {form.policyInfo.title}
              </label>
            </div>
          )}

          <button
            type="submit"
            className="btn"
            style={{
              backgroundColor: form.buttons.BackgroundColor,
              color: form.buttons.color,
            }}
          >
            {form.buttons.text}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Form;
