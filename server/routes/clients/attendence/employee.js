const express = require("express");
const router = express.Router();
const Employee = require("../../../models/clients/contactdata");
const Attendance = require("../../../models/clients/attendence/attendence"); // Import Attendance Model

router.post("/employees", async (req, res) => {
  try {
    const newEmployee = new Employee(req.body);
    const savedEmployee = await newEmployee.save();

    // Create an Attendance record for the new employee
    const newAttendance = new Attendance({
      employeeID: savedEmployee.employeeID, // Use the newly created Employee ID
      name: savedEmployee.fullName,
      email: savedEmployee.email,
      date: new Date(), // Default today's date
      checkIn: "",
      checkOut: ""
    });

    await newAttendance.save(); // Save the Attendance record

    res.json({ message: "Employee added successfully", employee: savedEmployee });
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/employees", async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
});

router.put("/employees/:id", async (req, res) => {
  await Employee.findByIdAndUpdate(req.params.id, req.body);
  res.json("Employee updated successfully");
});

router.delete("/employees/:id", async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.json("Employee deleted successfully");
});

module.exports = router;