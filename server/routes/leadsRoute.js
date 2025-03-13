const express = require("express");
const Lead = require("../models/leads-model");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

// ✅ Create a New Contact
router.post("/create", async (req, res) => {
    try {
        const { leadName, leadType, companyName } = req.body;

        // Validate required fields
        if (!leadName || !leadType || !companyName) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const newLead = new Lead({
            leadName,
            leadType,
            companyName,
        });

        await newLead.save();
        res.status(201).json({ message: "Lead created successfully", lead: newLead });
    } catch (error) {
        console.error("Error creating lead:", error);
        res.status(500).json({ error: "Server error while creating lead" });
    }
});


router.post("/submit-form", async (req, res) => {
    try {
      const { name, phoneNumber, email, description } = req.body;
  
      // Generate a unique form ID
      const formId = uuidv4();
  
      // Create a new lead with form data
      const newLead = new Lead({
        formId,
        name,
        phoneNumber,
        email,
        description,
      });
  
      // Save the lead to the database
      await newLead.save();
  
      // Send success response
      res.status(201).json({ message: "Form submitted successfully!", formId });
    } catch (error) {
      console.error("Error submitting form:", error);
      res.status(500).json({ message: "Error submitting form", error: error.message });
    }
  });

// ✅ Fetch All Contacts
router.get("/leads", async (req, res) => {
    try {
        const leads = await Lead.find();
        res.status(200).json(leads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching contacts" });
    }
});

// ✅ Fetch Single Contact by ID
router.get("/:id", async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ error: "Contact not found" });
        res.status(200).json(contact);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching contact" });
    }
});

// ✅ Update Contact
router.put("/:id", async (req, res) => {
    try {
        const updatedData = {
            ...req.body,
            image: req.file ? req.file.buffer.toString("base64") : req.body.image,
        };
        const contact = await Contact.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!contact) return res.status(404).json({ error: "Contact not found" });
        res.status(200).json({ message: "Contact updated successfully", contact });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error updating contact" });
    }
});

// ✅ Delete Contact
router.delete("/:id", async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) return res.status(404).json({ error: "Contact not found" });
        res.status(200).json({ message: "Contact deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error deleting contact" });
    }
});

module.exports = router;
