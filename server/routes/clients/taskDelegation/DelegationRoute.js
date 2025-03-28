const express = require("express");
const Delegation = require("../../../models/clients/TaskDelegation/taskdelegation");
const Employee = require("../../../models/clients/contactdata");
const verifyToken = require("../../../middlewares/auth")

const router = express.Router();

// Add a new task delegation
router.post("/add", async (req, res) => {
  try {
    const { name, description, dueDate, time, doer } = req.body;
    console.log("Incoming task delegation request:", req.body);

    const newDelegation = new Delegation({
      name,
      description,
      dueDate,
      time,
      doer,
    });

    await newDelegation.save();
    console.log("Task delegated successfully:", newDelegation);
    res.status(201).json({ message: "Task delegated successfully!" });
  } catch (error) {
    console.error("Error delegating task:", error);
    res.status(500).json({ message: "Error delegating task", error });
  }
});

// Get all delegated tasks
router.get("/list", async (req, res) => {
  try {
    const tasks = await Delegation.find({}).populate("doer", "fullName");
    console.log(`📦 Total tasks fetched (unfiltered): ${tasks.length}`);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
});



// Edit a delegated task
router.put("/edit/:id", async (req, res) => {
  console.log('--- EDIT TASK REQUEST STARTED ---');
  console.log(`[${new Date().toISOString()}] Received PUT request to edit task ${req.params.id}`);
  
  try {
    const { id } = req.params;
    const { name, description, dueDate, time, doer } = req.body;

    console.log('Request Parameters:');
    console.log(`Task ID: ${id}`);
    console.log('Request Body:', {
      name,
      description,
      dueDate,
      time,
      doer
    });

    // Validate required fields
    if (!name || !description || !dueDate || !time || !doer) {
      console.error('Validation Error: Missing required fields');
      return res.status(400).json({ 
        message: "All fields (name, description, dueDate, time, doer) are required" 
      });
    }

    console.log('Attempting to find and update task in database...');
    const updatedTask = await Delegation.findByIdAndUpdate(
      id,
      { 
        name, 
        description, 
        dueDate, 
        time, 
        doer 
      },
      { 
        new: true,
        runValidators: true // Ensure validators run on update
      }
    ).populate('doer', 'fullName'); // Populate doer info for logging

    if (!updatedTask) {
      console.error(`Task not found with ID: ${id}`);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log('Task successfully updated:', {
      id: updatedTask._id,
      name: updatedTask.name,
      description: updatedTask.description,
      dueDate: updatedTask.dueDate,
      time: updatedTask.time,
      doer: updatedTask.doer?.fullName || 'N/A',
      updatedAt: updatedTask.updatedAt
    });

    res.status(200).json({ 
      message: "Task updated successfully!", 
      updatedTask 
    });

  } catch (error) {
    console.error('Error updating task:', {
      error: error.message,
      stack: error.stack,
      fullError: error
    });

    // Handle specific error types
    if (error.name === 'CastError') {
      console.error('Invalid ID format');
      return res.status(400).json({ message: "Invalid task ID format" });
    }
    
    if (error.name === 'ValidationError') {
      console.error('Validation Error:', error.errors);
      return res.status(400).json({ 
        message: "Validation failed",
        errors: error.errors 
      });
    }

    res.status(500).json({ 
      message: "Error updating task",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    console.log(`[${new Date().toISOString()}] Edit task request completed`);
    console.log('--- EDIT TASK REQUEST ENDED ---\n');
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

// Mark task as complete
router.put("/complete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedTask = await Delegation.findByIdAndUpdate(
      id,
      {
        status: "Completed",
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task marked as completed!", updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Error completing task", error });
  }
});

// Revise task
router.put("/revise/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { revisedDate, revisedTime, revisedReason } = req.body;

    const updatedTask = await Delegation.findByIdAndUpdate(
      id,
      {
        revisedDate,
        revisedTime,
        revisedReason,
        status: "Revised",
      },
      { new: true }
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
