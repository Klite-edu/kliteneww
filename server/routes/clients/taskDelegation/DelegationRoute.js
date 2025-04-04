const express = require("express");
const router = express.Router();
const dbDBMiddleware = require("../../../middlewares/dbMiddleware");
const verifyToken = require("../../../middlewares/auth");

// Add a New Task Delegation
router.post("/add", dbDBMiddleware, async (req, res) => {
  try {
    console.log("📩 Received Delegation Data:", req.body);
    const { name, description, dueDate, time, doer } = req.body;

    const newDelegation = new req.delegation({
      name,
      description,
      dueDate,
      time,
      doer,
    });

    console.log("📤 Saving Delegation to Database...");
    await newDelegation.save();

    console.log("✅ Delegation Successfully Added:", newDelegation);
    res.status(201).json({ message: "Delegation added successfully!", task: newDelegation });
  } catch (error) {
    console.error("❌ Error Adding Delegation:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get All Delegated Tasks
router.get("/list", dbDBMiddleware, async (req, res) => {
  try {
    console.log("📥 Fetching Delegated Tasks...");
    const tasks = await req.delegation.find({}).populate("doer", "fullName");

    console.log("✅ Fetched Delegated Tasks:", tasks.length);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("❌ Error Fetching Delegated Tasks:", error.message);
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
});

// Edit a Delegated Task
router.put("/edit/:id", dbDBMiddleware, async (req, res) => {
  try {
    console.log("📥 Edit Delegation Request:", req.params.id);
    const { name, description, dueDate, time, doer } = req.body;

    const updatedTask = await req.delegation.findByIdAndUpdate(
      req.params.id,
      { name, description, dueDate, time, doer },
      { new: true, runValidators: true }
    ).populate("doer", "fullName");

    if (!updatedTask) {
      console.log("❌ Task Not Found:", req.params.id);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log("✅ Task Updated Successfully:", updatedTask);
    res.status(200).json({ message: "Task updated successfully!", updatedTask });
  } catch (error) {
    console.error("❌ Error Updating Delegation:", error.message);
    res.status(500).json({ message: "Error updating task", error: error.message });
  }
});

// Delete a Delegated Task
router.delete("/delete/:id", dbDBMiddleware, verifyToken, async (req, res) => {
  try {
    console.log("🗑️ Delete Task Request:", req.params.id);
    const deletedTask = await req.delegation.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      console.log("❌ Task Not Found:", req.params.id);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log("✅ Task Deleted Successfully:", deletedTask);
    res.status(200).json({ message: "Task deleted successfully!", deletedTask });
  } catch (error) {
    console.error("❌ Error Deleting Task:", error.message);
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
});

// Mark Task as Completed
router.put("/complete/:id", dbDBMiddleware, async (req, res) => {
  try {
    console.log("✅ Marking Task as Complete:", req.params.id);
    const updatedTask = await req.delegation.findByIdAndUpdate(
      req.params.id,
      { status: "Completed", completedAt: new Date() },
      { new: true }
    );

    if (!updatedTask) {
      console.log("❌ Task Not Found:", req.params.id);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log("✅ Task Marked as Completed:", updatedTask);
    res.status(200).json({ message: "Task marked as completed!", updatedTask });
  } catch (error) {
    console.error("❌ Error Completing Task:", error.message);
    res.status(500).json({ message: "Error completing task", error: error.message });
  }
});

// Revise Task
router.put("/revise/:id", dbDBMiddleware, async (req, res) => {
  try {
    console.log("🔄 Revising Task:", req.params.id);
    const { revisedDate, revisedTime, revisedReason } = req.body;

    const updatedTask = await req.delegation.findByIdAndUpdate(
      req.params.id,
      { revisedDate, revisedTime, revisedReason, status: "Revised" },
      { new: true }
    );

    if (!updatedTask) {
      console.log("❌ Task Not Found:", req.params.id);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log("✅ Task Revised Successfully:", updatedTask);
    res.status(200).json({ message: "Task revised successfully!", updatedTask });
  } catch (error) {
    console.error("❌ Error Revising Task:", error.message);
    res.status(500).json({ message: "Error revising task", error: error.message });
  }
});

module.exports = router;
