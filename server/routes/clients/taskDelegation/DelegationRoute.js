const express = require("express");
const Delegation = require("../../../models/clients/TaskDelegation/taskdelegation");
const Employee = require("../../../models/clients/contactdata");
const verifyToken = require("../../../middlewares/auth")

const router = express.Router();

// Add a new task delegation
router.post("/add", async (req, res) => {
    try {
      const { name, description, dueDate, time, doer } = req.body;
  
      // Log the incoming request data for debugging
      console.log("Incoming task delegation request:", req.body);
  
      const newDelegation = new Delegation({
        name,
        description,
        dueDate,
        time,
        doer,
      });
  
      await newDelegation.save();
      
      // Log success
      console.log("Task delegated successfully:", newDelegation);
  
      res.status(201).json({ message: "Task delegated successfully!" });
    } catch (error) {
      // Log error
      console.error("Error delegating task:", error);
      res.status(500).json({ message: "Error delegating task", error });
    }
  });
  
  // Get all delegated tasks
  router.get("/list", verifyToken, async (req, res) => {
    try {
      // Get user role and userId from the decoded JWT token
      const userId = req.user.id;
      const userRole = req.user.role;
  
      let filter = {};
  
      // If the user is a "user", show only tasks assigned to them
      if (userRole === "user") {
        filter.doer = userId;  // Filter tasks where 'doer' is the logged-in user
      }
  
      // Fetch tasks from the database, applying the filter
      const tasks = await Delegation.find(filter).populate("doer", "fullName");
  
      // Respond with the filtered list of tasks
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Error fetching tasks", error });
    }
  });

// Edit a delegated task
router.put("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, dueDate, time, doer } = req.body;

    const updatedTask = await Delegation.findByIdAndUpdate(
      id,
      { name, description, dueDate, time, doer },
      { new: true } // Return the updated document
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task updated successfully!", updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
});

// Delete a delegated task
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTask = await Delegation.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully!", deletedTask });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
});

// routes/delegation.js
router.put("/complete/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the task and update its status and completion time
      const updatedTask = await Delegation.findByIdAndUpdate(
        id,
        {
          status: "Completed",
          completedAt: new Date(), // Save the current date and time
        },
        { new: true } // Return the updated document
      );
  
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      res.status(200).json({ message: "Task marked as completed!", updatedTask });
    } catch (error) {
      res.status(500).json({ message: "Error completing task", error });
    }
  });

  // routes/delegation.js
router.put("/revise/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { revisedDate, revisedTime, revisedReason } = req.body;
  
      // Find the task and update its revised fields
      const updatedTask = await Delegation.findByIdAndUpdate(
        id,
        {
          revisedDate,
          revisedTime,
          revisedReason,
          status: "Revised", // Update the status to "Revised"
        },
        { new: true } // Return the updated document
      );
  
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      res.status(200).json({ message: "Task revised successfully!", updatedTask });
    } catch (error) {
      res.status(500).json({ message: "Error revising task", error });
    }
  });

module.exports = router;