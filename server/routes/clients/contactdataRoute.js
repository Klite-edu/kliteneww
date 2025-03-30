// routes/contacts.js
const express = require("express");
const router = express.Router();
const ContactData = require("../../models/clients/contactdata"); 
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// GET all contacts
router.get("/contactinfo", async (req, res) => {
    console.log("enterting to route");
    
  try {
    const contacts = await ContactData.find();
    console.log("employee data", contacts);
    
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single contact
router.get("/:id", async (req, res) => {
  try {
    console.log("\n📡 Incoming request to fetch employee details...");
    console.log("🔹 Requested Employee ID:", req.params.id);

    const { id } = req.params;

    if (!id) {
      console.warn("⚠️ No employee ID provided in request.");
      return res.status(400).json({ message: "Employee ID is required." });
    }

    console.log("📡 Fetching employee details for ID:", id);
    const employee = await ContactData.findById(id);

    if (!employee) {
      console.warn("❌ Employee not found in the database.");
      return res.status(404).json({ message: "Employee not found" });
    }

    console.log("✅ Employee found:", employee.fullName);
    res.json(employee);

  } catch (error) {
    console.error("❌ Error fetching employee:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



// CREATE a new contact
router.post("/create", async (req, res) => {
  try {
    console.log("📩 Received Employee Data:", JSON.stringify(req.body, null, 2));

    // Extract password separately
    const { password, ...employeeData } = req.body;
    console.log("🔹 Extracted Employee Data (without password):", JSON.stringify(employeeData, null, 2));

    // Hash the password before saving
    console.log("🔐 Generating Salt for Hashing...");
    const salt = await bcrypt.genSalt(10);
    console.log("🧂 Salt Generated:", salt);

    console.log("🔑 Hashing Password...");
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("🛡️ Hashed Password:", hashedPassword);

    // Create new Employee with hashed password
    const newEmployee = new ContactData({ ...employeeData, password: hashedPassword });
    console.log("📌 New Employee Object (Before Save):", JSON.stringify(newEmployee, null, 2));

    // Save Employee to MongoDB
    await newEmployee.save();
    console.log("✅ Employee Saved Successfully!");

    res.status(201).json({ message: "Employee created successfully" });
  } catch (error) {
    console.error("❌ Error creating employee:", error);
    res.status(500).json({ message: "Error creating employee", error });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const updatedEmployee = await ContactData.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Return updated document
    );
    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a contact
router.delete("/delete/:id", async (req, res) => {
  try {
    const employee = await ContactData.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await employee.deleteOne(); // Delete the employee
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
