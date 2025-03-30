const express = require("express");
const router = express.Router();
const Task = require("../../../models/clients/checklist/task");
const Employee = require("../../../models/clients/contactdata");
const {
  calculateNextDueDateTime,
} = require("../../../middlewares/TaskScheduler");
const verifyToken = require("../../../middlewares/auth");

// Add a New Task
router.post("/add", async (req, res) => {
  try {
    console.log("📩 Received Task Data:", req.body);

    const { taskName, doerName, department, frequency, plannedDateTime } =
      req.body;

    const employee = await Employee.findOne({ fullName: doerName });
    if (!employee) {
      return res.status(400).json({ message: "Employee not found" });
    }

    const employeeId = employee._id;

    let nextDueDateTime = calculateNextDueDateTime(
      new Date(plannedDateTime),
      frequency
    );

    console.log("📝 Calculated Next Due DateTime:", nextDueDateTime);

    const newTask = new Task({
      taskName,
      doer: employeeId,
      department,
      frequency,
      plannedDateTime: new Date(plannedDateTime),
      nextDueDateTime,
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

// Fetch Task List
router.get("/list", async (req, res) => {
  try {
    let { startDate, endDate, sort, generateFutureTasks, userId } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.nextDueDateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (userId) {
      filter.doer = userId;
    }

    let tasks = await Task.find(filter)
      .sort({ nextDueDateTime: sort === "desc" ? -1 : 1 })
      .populate("doer", "fullName");

    if (generateFutureTasks === "true" && startDate && endDate) {
      let extendedTasks = [];

      tasks.forEach((task) => {
        let nextDueDateTime = new Date(task.nextDueDateTime);
        while (nextDueDateTime <= new Date(endDate)) {
          extendedTasks.push({
            ...task.toObject(),
            _id: task._id + "_" + nextDueDateTime.toISOString(),
            nextDueDateTime: new Date(nextDueDateTime),
          });
          nextDueDateTime = calculateNextDueDateTime(
            nextDueDateTime,
            task.frequency
          );
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

// Update Task
router.put("/update/:id", async (req, res) => {
  try {
    const { taskName, doerName, department, frequency, plannedDateTime } =
      req.body;

    let nextDueDateTime = calculateNextDueDateTime(
      new Date(plannedDateTime),
      frequency
    );

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        taskName,
        doerName,
        department,
        frequency,
        plannedDateTime: new Date(plannedDateTime),
        nextDueDateTime,
      },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "✅ Task updated successfully!", task: updatedTask });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating task", details: error.message });
  }
});

// Mark Task as Completed
router.put("/markCompleted/:id", async (req, res) => {
  try {
    const { selectedDateTime } = req.body;
    console.log(
      "📥 Received data for marking task as completed:",
      selectedDateTime
    );

    const task = await Task.findById(req.params.id);
    if (!task) {
      console.error("❌ Task not found:", req.params.id);
      return res.status(404).json({ error: "Task not found" });
    }

    const selectedDateTimeObj = new Date(selectedDateTime);
    console.log(
      "Normalized selectedDateTime:",
      selectedDateTimeObj.toISOString()
    );

    task.statusHistory.push({
      date: new Date(),
      status: "Completed",
      completedDateTime: selectedDateTimeObj,
    });

    const newNextDueDateTime = calculateNextDueDateTime(
      task.nextDueDateTime,
      task.frequency
    );
    console.log("New calculated nextDueDateTime:", newNextDueDateTime);

    task.nextDueDateTime = newNextDueDateTime;

    await task.save();
    console.log(
      "✅ Task marked as completed and nextDueDateTime updated for selected datetime:",
      selectedDateTime
    );
    res.json({
      message: "✅ Task marked as completed for selected datetime!",
      task,
    });
  } catch (error) {
    console.error("❌ Error in markCompleted route:", error);
    res
      .status(500)
      .json({ error: "Error updating task", details: error.message });
  }
});

// Delete Task
router.delete("/delete/:id", verifyToken,  async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "✅ Task deleted successfully!" });
  } catch (error) {
    console.error("❌ Error deleting task:", error.message);
    res
      .status(500)
      .json({ error: "Error deleting task", details: error.message });
  }
});

router.get("/serverdate", (req, res) => {
  const currentDate = new Date().toISOString();
  res.json({ currentDate });
});

module.exports = router;
