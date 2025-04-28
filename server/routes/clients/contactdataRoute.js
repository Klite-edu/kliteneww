// routes/contacts.js
const express = require("express");
const router = express.Router();
const dbMiddleware = require("../../middlewares/dbMiddleware");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { check, validationResult } = require("express-validator");
// GET all contacts
router.get("/contactinfo", dbMiddleware, async (req, res) => {
  try {
    const contacts = await req.Employee.find();
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single contact
router.get("/:id", dbMiddleware, async (req, res) => {
  try {


    const { id } = req.params;

    if (!id) {
      console.warn("⚠️ No employee ID provided in request.");
      return res.status(400).json({ message: "Employee ID is required." });
    }

    const employee = await req.Employee.findById(id);

    if (!employee) {
      console.warn("❌ Employee not found in the database.");
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    console.error("❌ Error fetching employee:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

// CREATE a new contact
router.post(
  "/create",
  dbMiddleware,
  [
    check("fullName").notEmpty().withMessage("Full name is required"),
    check("employeeID").notEmpty().withMessage("Employee ID is required"),
    check("designation").notEmpty().withMessage("Designation is required"),
    check("email").isEmail().withMessage("Valid email is required"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    check("number")
      .matches(/^91\d{10}$/)
      .withMessage("Valid Indian mobile number required (e.g., 91XXXXXXXXXX)"),
    check("joiningDate")
      .isISO8601()
      .withMessage("Valid joining date is required"),
    check("status")
      .isIn(["Active", "Inactive", "Suspended"])
      .withMessage("Invalid status"),
    check("role")
      .isIn(["user", "team_lead", "admin", "client"])
      .withMessage("Invalid role"),
  ],
  async (req, res) => {
    console.log("🔹 Starting employee creation process");
    console.log("🔹 Request body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    check("number")
      .custom((value) => {
        // Remove all non-digit characters
        const cleaned = value.replace(/\D/g, "");
        // Check if it's a valid Indian mobile number (91 followed by 10 digits)
        return /^91\d{10}$/.test(cleaned);
      })
      .withMessage(
        "Valid Indian mobile number required (12 digits starting with 91)"
      )
      .customSanitizer((value) => {
        // Clean the number before saving to database
        return value.replace(/\D/g, "");
      });
    try {
      console.log("🔹 Validation passed, processing employee data");
      const employeeData = req.body;
      console.log("🔹 Original joiningDate:", employeeData.joiningDate);

      employeeData.joiningDate = new Date(employeeData.joiningDate);
      console.log("🔹 Formatted joiningDate:", employeeData.joiningDate);

      console.log("🔹 Creating new employee instance");
      const newEmployee = new req.Employee(employeeData);
      console.log("🔹 Employee instance created:", newEmployee);

      console.log("🔹 Saving employee to database");
      await newEmployee.save();
      console.log("✅ Employee saved successfully");

      res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: newEmployee,
      });
    } catch (error) {
      console.error("⛔ Error creating employee:", error);
      if (error.code === 11000) {
        console.log("⛔ Duplicate key error:", error.keyPattern);
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to create employee",
        error: error.message,
      });
    }
  }
);

router.put("/update/:id", dbMiddleware, async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // If a new password is provided, hash it
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    } else {
      // Remove password field from updateData if it is empty or not provided
      delete updateData.password;
    }

    const updatedEmployee = await req.Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true } // Return updated document
    );

    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a contact
router.delete("/delete/:id", dbMiddleware, async (req, res) => {
  try {
    const employee = await req.Employee.findById(req.params.id);

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
