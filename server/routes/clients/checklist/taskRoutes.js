const express = require("express");
const router = express.Router();
const Task = require("../../../models/clients/checklist/task");
const Employee = require("../../../models/clients/contactdata");
const { calculateNextDueDate } = require("../../../middlewares/TaskScheduler");
const verifyToken = require("../../../middlewares/auth")

// ✅ Add a New Task
router.post("/add", async (req, res) => {
  try {
    console.log("📩 Received Task Data:", req.body);

    const { taskName, doerName, department, frequency, plannedDate } = req.body;

    const employee = await Employee.findOne({ fullName: doerName });
    if (!employee) {
      return res.status(400).json({ message: "Employee not found" });
    }

    const employeeId = employee._id;

    let nextDueDate = calculateNextDueDate(plannedDate, frequency);

    console.log("📝 Calculated Next Due Date:", nextDueDate);

    const newTask = new Task({
      taskName,
      doer: employeeId,
      department,
      frequency,
      plannedDate,
      nextDueDate,
      statusHistory: [{ status: "Pending" }],
    });

    console.log("📤 Saving Task to Database...");
    await newTask.save();

    console.log("✅ Task Successfully Added:", newTask);
    res.json({ message: "✅ Task added successfully!", task: newTask });
  } catch (error) {
    console.error("❌ Error Adding Task:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Fetch Task List
router.get("/list", async (req, res) => {
  try {
    let { startDate, endDate, sort, generateFutureTasks, userId } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.nextDueDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // For regular users, only show their own tasks
    if (userId) {
      filter.doer = userId;
    }

    let tasks = await Task.find(filter)
      .sort({ nextDueDate: sort === "desc" ? -1 : 1 })
      .populate("doer", "fullName");

    if (generateFutureTasks === "true" && startDate && endDate) {
      let extendedTasks = [];

      tasks.forEach((task) => {
        let nextDueDate = new Date(task.nextDueDate);
        while (nextDueDate <= new Date(endDate)) {
          extendedTasks.push({
            ...task.toObject(),
            _id: task._id + "_" + nextDueDate.toISOString(),
            nextDueDate: new Date(nextDueDate),
          });
          nextDueDate = calculateNextDueDate(nextDueDate, task.frequency);
        }
      });

      tasks = [...tasks, ...extendedTasks];
    }

    res.json(tasks);
  } catch (error) {
    console.error("❌ Error Fetching Tasks:", error.message);
    res.status(500).json({ error: error.message });
  }
});
// ✅ Update Task
router.put("/update/:id", async (req, res) => {
  try {
    const { taskName, doerName, department, frequency, plannedDate } = req.body;

    let nextDueDate = calculateNextDueDate(plannedDate, frequency);

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { taskName, doerName, department, frequency, plannedDate, nextDueDate },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "✅ Task updated successfully!", task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: "Error updating task", details: error.message });
  }
});

// ✅ Delete Task
router.delete("/delete/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Task deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting task", details: error.message });
  }
});

// ✅ Mark Task as Completed
router.put("/markCompleted/:id", async (req, res) => {
  try {
    const { selectedDate } = req.body;
    console.log("📥 Received data for marking task as completed:", selectedDate);

    const task = await Task.findById(req.params.id);
    if (!task) {
      console.error("❌ Task not found:", req.params.id);
      return res.status(404).json({ error: "Task not found" });
    }

    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setUTCHours(0, 0, 0, 0);
    console.log("Normalized selectedDate:", selectedDateObj.toISOString());

    task.statusHistory.push({
      date: new Date(),
      status: "Completed",
      completedDate: selectedDateObj,
    });

    const newNextDueDate = calculateNextDueDate(task.nextDueDate, task.frequency);
    console.log("New calculated nextDueDate:", newNextDueDate);

    task.nextDueDate = newNextDueDate;

    await task.save();
    console.log("✅ Task marked as completed and nextDueDate updated for selected date:", selectedDate);
    res.json({ message: "✅ Task marked as completed for selected date!", task });
  } catch (error) {
    console.error("❌ Error in markCompleted route:", error);
    res.status(500).json({ error: "Error updating task", details: error.message });
  }
});

// ✅ Get Server Date
router.get("/serverdate", (req, res) => {
  const currentDate = new Date().toISOString();
  res.json({ currentDate });
});

module.exports = router;
