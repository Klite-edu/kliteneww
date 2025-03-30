const express = require("express");
const MetaClient = require("../../../models/clients/MetaBusiness/MetaClient-model"); // Import the Mongoose model

const router = express.Router();

// ✅ Route to update existing client with chatbot details
router.put("/update-client", async (req, res) => {
  console.log("🔍 Update request received at /update-client");

  const { userId, apiKey, model, instructionFile } = req.body;

  // Log request data
  console.log("Received data:", { userId, apiKey, model, instructionFile });

  try {
    // ✅ Find the existing client in the database using userId
    const client = await MetaClient.findOne({ _id: userId });

    if (!client) {
      console.log(`❌ No client found with userId: ${userId}`);
      return res.status(404).json({ message: "Client not found." });
    }

    // ✅ Update only chatbot-related fields
    client.apiKey = apiKey;
    client.model = model;
    client.instructionFile = instructionFile;

    // ✅ Save updated client details
    await client.save();

    console.log("✅ Client updated successfully:", client);
    res.status(200).json({ message: "Client updated successfully!", data: client });

  } catch (error) {
    console.error("❌ Error updating client:", error);
    res.status(500).json({ message: "Error updating client details." });
  }
});

router.post("/create-client", async (req, res) => {
  const { userId, apiKey, model, instructionFile } = req.body;

  try {
    // Check if client already exists
    const existingClient = await MetaClient.findOne({ _id: userId });
    if (existingClient) {
      return res.status(400).json({ message: "Client already exists. Use update instead." });
    }

    const newClient = new MetaClient({
      _id: userId, // Make sure to use same userId
      apiKey,
      model,
      instructionFile,
      subscribed: false, // Optional default values
    });

    await newClient.save();

    res.status(201).json({ message: "New client created successfully!", data: newClient });

  } catch (error) {
    console.error("❌ Error creating client:", error);
    res.status(500).json({ message: "Error creating new client." });
  }
});


module.exports = router;
