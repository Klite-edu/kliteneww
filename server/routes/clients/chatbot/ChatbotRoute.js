const express = require("express");
const FormData = require("../../../models/clients/chatbot/chatbot-model"); // Import the Mongoose model

const router = express.Router();

// Route to handle form submission
router.post("/submit-form", async (req, res) => {
  console.log("Request received at /submit-form");

  // Log request body
  console.log("Request Body:", req.body);

  const { apiKey, phoneNumber, model, instructionFile } = req.body;

  // Log extracted form data
  console.log("Extracted Form Data:", {
    apiKey,
    phoneNumber,
    model,
    instructionFile,
  });

  // Save data to database (example using Mongoose)
  const formData = new FormData({
    apiKey,
    phoneNumber,
    model,
    instructionFile, // Save instructions as text
  });

  try {
    // Log before saving to database
    console.log("Saving data to database...");

    await formData.save();

    // Log after saving to database
    console.log("Data saved to database successfully:", formData);

    res.status(200).json({ message: "Form submitted successfully!", data: formData });
  } catch (error) {
    // Log database error
    console.error("Error saving to database:", error);

    res.status(500).json({ message: "Error saving form data." });
  }
});

module.exports = router;