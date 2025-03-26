const express = require("express");
const router = express.Router();
const Employee = require("../../../models/clients/contactdata");


router.get("/total-employee", async (req, res) => {
  try {
    // Count all clients (active and inactive)
    const totalEmployee = await Employee.countDocuments();

    // Count active clients specifically
    const activeEmployee = await Employee.countDocuments({ status: "Active" });

    res.status(200).json({ totalEmployee, activeEmployee });
  } catch (error) {
    console.error("Error fetching total clients:", error);
    res.status(500).json({ message: "Failed to fetch total clients" });
  }
});

module.exports = router;