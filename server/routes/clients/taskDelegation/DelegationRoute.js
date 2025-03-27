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
  try {
    const { id } = req.params;
    const { name, description, dueDate, time, doer } = req.body;

    const updatedTask = await Delegation.findByIdAndUpdate(
      id,
      { name, description, dueDate, time, doer },
      { new: true }
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
