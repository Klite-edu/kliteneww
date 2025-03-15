import React, { useState, useEffect } from "react";
import axios from "axios"; // ✅ Axios imported

const ChatbotForm = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    apiKey: "",
    model: "",
    instructionFile: "", // Instructions as text
  });

  // Get `userId` from LocalStorage
  const userId = localStorage.getItem("userId");

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

    if (!userId) {
      alert("User ID is missing. Please log in again.");
      return;
    }

    try {
      // 1️⃣ Try to update the existing client first
      const updateUrl = `${process.env.REACT_APP_API_URL}/api/chat/update-client`;
      const updatePayload = { userId, ...formData };

      console.log("🔄 Attempting to update existing client...");

      const updateResponse = await axios.put(updateUrl, updatePayload);

      if (updateResponse.status === 200) {
        console.log("✅ Client updated successfully:", updateResponse.data);
        alert("Chatbot details updated successfully!");
        return;
      }

    } catch (error) {
      if (error.response && error.response.status === 404) {
        // 2️⃣ If not found, create a new client
        console.log("⚠️ Client not found. Creating new client...");

        try {
          const createUrl = `${process.env.REACT_APP_API_URL}/api/chat/create-client`;
          const createPayload = { userId, ...formData };

          const createResponse = await axios.post(createUrl, createPayload);

          if (createResponse.status === 201) {
            console.log("✅ New client created:", createResponse.data);
            alert("New client created and chatbot details saved!");
          } else {
            console.error("❌ Failed to create new client:", createResponse);
            alert("Failed to create new client.");
          }

        } catch (createError) {
          console.error("❌ Error during client creation:", createError);
          alert("An error occurred while creating the client.");
        }

      } else {
        console.error("❌ Error during client update:", error);
        alert("An error occurred while updating the client.");
      }
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
          <label htmlFor="instructionFile" style={styles.label}>
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
