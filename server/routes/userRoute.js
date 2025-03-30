const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const  verifyToken  = require("../middlewares/auth");
const User = require("../models/clients/contactdata")

router.post("/register", async (req, res) => {
  try {
    const { fullName,
      email,
      phone,
      companyName,
      companyWebsite,
      industryType,
      selectedPlan,
      password, } =
      req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    const newUser = new User({
      fullName,
      email,
      phone,
      companyName,
      companyWebsite,
      industryType,
      selectedPlan,
      password: hashedPassword, // Save hashed password
    });

    await newUser.save();
    res
      .status(201)
      .json({ message: "User added successfully", user: newUser });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error adding user", details: error.message });
  }
});

router.get("/userData/:email", async (req, res) => {
  try {
    const { email } = req.params; // Get email from request params
    console.log("email", email);

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("useremail", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all clients
router.get("/userData", async (req, res) => {
  try {
    const user = await User.find();
    console.log("users", user);

    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching users", details: error.message });
  }
});

// Get a single client by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching user", details: error.message });
  }
});

// Update a client by ID
router.put("/update/:id", async (req, res) => {
  try {
    const updateduser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updateduser) {
      return res.status(404).json({ message: "user not found" });
    }
    res
      .status(200)
      .json({ message: "User updated successfully", user: updateduser });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating user", details: error.message });
  }
});

// Delete a client by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting user", details: error.message });
  }
});

module.exports = router;