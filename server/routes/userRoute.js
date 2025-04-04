const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { getEmployeeModel } = require("../models/clients/contactdata");

// Register Route
router.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      companyName,
      companyWebsite,
      industryType,
      selectedPlan,
      password,
    } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the dynamic Employee model based on company name
    const EmployeeModel = await getEmployeeModel(companyName);

    const newUser = new EmployeeModel({
      fullName,
      email,
      phone,
      companyName,
      companyWebsite,
      industryType,
      selectedPlan,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User added successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Error adding user", details: error.message });
  }
});

// Get user data by email
router.get("/userData/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Get the dynamic Employee model
    const EmployeeModel = await getEmployeeModel("default_company");
    const user = await EmployeeModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get all users
router.get("/userData", async (req, res) => {
  try {
    const EmployeeModel = await getEmployeeModel("default_company");
    const users = await EmployeeModel.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users", details: error.message });
  }
});

// Get a single user by ID
router.get("/:id", async (req, res) => {
  try {
    const EmployeeModel = await getEmployeeModel("default_company");
    const user = await EmployeeModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user", details: error.message });
  }
});

// Update a user by ID
router.put("/update/:id", async (req, res) => {
  try {
    const EmployeeModel = await getEmployeeModel("default_company");
    const updatedUser = await EmployeeModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Error updating user", details: error.message });
  }
});

// Delete a user by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const EmployeeModel = await getEmployeeModel("default_company");
    const deletedUser = await EmployeeModel.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting user", details: error.message });
  }
});

module.exports = router;
