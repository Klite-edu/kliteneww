const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const dbMiddleware = require("../middlewares/dbMiddleware"); // Adjust path as needed

// Register Route
router.post("/register", dbMiddleware, async (req, res) => {
  try {
    console.log("📥 Processing user registration...");
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

    const newUser = new req.Employee({
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
    console.log("✅ User registered successfully:", newUser._id);
    res.status(201).json({ message: "User added successfully", user: newUser });
  } catch (error) {
    console.error("❌ Error registering user:", error.message);
    res.status(500).json({ error: "Error adding user", details: error.message });
  }
});

// Get user data by email
router.get("/userData/:email", dbMiddleware, async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`📥 Fetching user data for email: ${email}`);

    const user = await req.Employee.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.warn(`❌ User not found with email: ${email}`);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User data fetched successfully");
    res.json(user);
  } catch (error) {
    console.error("❌ Server error fetching user by email:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get all users
router.get("/userData", dbMiddleware, async (req, res) => {
  try {
    console.log("📥 Fetching all users...");
    const users = await req.Employee.find();
    console.log(`✅ Users fetched: ${users.length}`);
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    res.status(500).json({ error: "Error fetching users", details: error.message });
  }
});

// Get a single user by ID
router.get("/:id", dbMiddleware, async (req, res) => {
  try {
    console.log(`📥 Fetching user with ID: ${req.params.id}`);
    const user = await req.Employee.findById(req.params.id);
    if (!user) {
      console.warn(`❌ User not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: "User not found" });
    }
    console.log("✅ User fetched successfully");
    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching user by ID:", error.message);
    res.status(500).json({ error: "Error fetching user", details: error.message });
  }
});

// Update a user by ID
router.put("/update/:id", dbMiddleware, async (req, res) => {
  try {
    console.log(`🔄 Updating user with ID: ${req.params.id}`);
    const updatedUser = await req.Employee.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    if (!updatedUser) {
      console.warn(`❌ User not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("✅ User updated successfully");
    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("❌ Error updating user:", error.message);
    res.status(500).json({ error: "Error updating user", details: error.message });
  }
});

// Delete a user by ID
router.delete("/delete/:id", dbMiddleware, async (req, res) => {
  try {
    console.log(`🗑️ Deleting user with ID: ${req.params.id}`);
    const deletedUser = await req.Employee.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      console.warn(`❌ User not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("✅ User deleted successfully");
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
    res.status(500).json({ error: "Error deleting user", details: error.message });
  }
});

module.exports = router;