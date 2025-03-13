import React, { useState } from "react";

const ChatbotForm = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    apiKey: "",
    phoneNumber: "",
    model: "",
    instructionFile: "", // Instructions as text
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send the form data to the backend
      const response = await fetch("http://localhost:5000/api/chat/submit-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send as JSON
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Success:", result);
        alert("Form submitted successfully!");
      } else {
        console.error("Error:", response.statusText);
        alert("Form submission failed.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while submitting the form.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Chatbot Input Form</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* API Key Input */}
        <div style={styles.formGroup}>
          <label htmlFor="apiKey" style={styles.label}>
            API Key:
          </label>
          <input
            type="text"
            id="apiKey"
            name="apiKey"
            value={formData.apiKey}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>

        {/* Phone Number Input */}
        <div style={styles.formGroup}>
          <label htmlFor="phoneNumber" style={styles.label}>
            Phone Number:
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>

        {/* Model Input */}
        <div style={styles.formGroup}>
          <label htmlFor="model" style={styles.label}>
            Model:
          </label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>

        {/* Instructions Textarea */}
        <div style={styles.formGroup}>
          <label htmlFor="instruction" style={styles.label}>
            Instructions:
          </label>
          <textarea
            id="instructionFile"
            name="instructionFile"
            value={formData.instructionFile}
            onChange={handleChange}
            style={styles.textarea}
            required
          />
        </div>

        {/* Submit Button */}
        <button type="submit" style={styles.button}>
          Submit
        </button>
      </form>
    </div>
  );
};

// Basic styling
const styles = {
  container: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    marginBottom: "5px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    minHeight: "100px",
    resize: "vertical",
  },
  button: {
    padding: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default ChatbotForm;