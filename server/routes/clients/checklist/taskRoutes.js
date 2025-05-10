const express = require("express");
const router = express.Router();
const dbDBMiddleware = require("../../../middlewares/dbMiddleware");
const {
  calculateNextDueDateTime,
} = require("../../../middlewares/TaskScheduler");
const verifyToken = require("../../../middlewares/auth");
const checkPermission = require("../../../middlewares/PermissionAuth");

// ✅ Add Task Route
router.post(
  "/add",
  dbDBMiddleware,
  checkPermission("Add Checklist Task", "create"),
  async (req, res) => {
    try {
      console.log("POST /add - Request received to add new task");
      console.log("Request body:", req.body);
      console.log("User making request:", req.user ? req.user.id : "unknown");

      const { taskName, doerId, department, frequency, plannedDateTime } =
        req.body;

      if (!doerId) {
        console.log("Validation failed - Doer ID is required");
        return res.status(400).json({ error: "Doer (Employee) is required" });
      }

      console.log("Fetching work configuration from database");
      const config = await req.WorkingDays.findOne();
      if (!config) {
        console.log("Work configuration not found in database");
        return res.status(400).json({ error: "Work config not found" });
      }

      console.log("Calculating next due date time");
      let nextDueDateTime = calculateNextDueDateTime(
        new Date(plannedDateTime),
        frequency,
        config
      );
      console.log("Calculated next due date:", nextDueDateTime);

      console.log("Creating new task in database");
      const newTask = await req.Task.create({
        taskName,
        doer: doerId,
        department,
        frequency,
        plannedDateTime: new Date(plannedDateTime),
        nextDueDateTime,
        statusHistory: [{ date: plannedDateTime }],
      });

      console.log("Task created successfully:", newTask._id);
      res.json({ message: "✅ Task added successfully!", task: newTask });
    } catch (error) {
      console.error("Error adding task:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Request body that caused error:", req.body);
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  "/list",
  dbDBMiddleware,
  checkPermission("Task List", "read"),
  async (req, res) => {
    try {
      console.log("GET /list - Request received to list tasks");
      console.log("Query parameters:", req.query);
      console.log("User making request:", req.user ? req.user.id : "unknown");

      let { sort, employeeId, startDate, endDate, status } = req.query;
      let filter = {};

      if (employeeId) {
        filter.doer = employeeId;
        console.log("Applying employee filter with ID:", employeeId);
      }

      console.log("Fetching tasks from database with filter:", filter);
      let tasks = await req.Task.find(filter)
        .sort({ nextDueDateTime: sort === "desc" ? -1 : 1 })
        .populate("doer", "fullName");

      console.log(`Found ${tasks.length} tasks matching base filter`);

      if (status === "All") {
        console.log("Returning all tasks with full history");
        return res.json(tasks);
      }

      console.log("Filtering tasks based on status and date range");
      const filteredTasks = tasks
        .map((task) => {
          let statusHistory = task.statusHistory || [];

          if (status === "today") {
            console.log("Applying today filter");
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            statusHistory = statusHistory.filter((history) => {
              const historyDate = new Date(history.date);
              return historyDate >= today && historyDate < tomorrow;
            });
          } else if (status) {
            console.log(`Applying status filter: ${status}`);
            statusHistory = statusHistory.filter(
              (history) => history.status === status
            );
          }

          if (startDate || endDate) {
            console.log("Applying date range filter", { startDate, endDate });
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            statusHistory = statusHistory.filter((history) => {
              const historyDate = new Date(history.date);
              return (
                (!start || historyDate >= start) && (!end || historyDate <= end)
              );
            });
          }

          return {
            ...task.toObject(),
            statusHistory,
          };
        })
        .filter((task) => task.statusHistory.length > 0);

      console.log(`Returning ${filteredTasks.length} filtered tasks`);
      res.json(filteredTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Query parameters that caused error:", req.query);
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Task
router.put(
  "/update/:id",
  dbDBMiddleware,
  checkPermission("Task List", "edit"),
  async (req, res) => {
    try {
      console.log(
        `PUT /update/${req.params.id} - Request received to update task`
      );
      console.log("Request body:", req.body);
      console.log("User making request:", req.user ? req.user.id : "unknown");

      const { taskName, doer, department, frequency, plannedDateTime } =
        req.body;

      if (!doer) {
        console.log("Validation failed - Doer ID is required");
        return res.status(400).json({ error: "Doer (Employee) is required" });
      }

      console.log("Calculating next due date time");
      let nextDueDateTime = calculateNextDueDateTime(
        new Date(plannedDateTime),
        frequency
      );
      console.log("Calculated next due date:", nextDueDateTime);

      console.log(`Updating task with ID: ${req.params.id}`);
      const updatedTask = await req.Task.findByIdAndUpdate(
        req.params.id,
        {
          taskName,
          doer,
          department,
          frequency,
          plannedDateTime: new Date(plannedDateTime),
          nextDueDateTime,
        },
        { new: true }
      );

      if (!updatedTask) {
        console.log(`Task not found with ID: ${req.params.id}`);
        return res.status(404).json({ error: "Task not found" });
      }

      console.log("Task updated successfully:", updatedTask._id);
      res.json({ message: "✅ Task updated successfully!", task: updatedTask });
    } catch (error) {
      console.error("Error updating task:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Request body that caused error:", req.body);
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Task
router.delete(
  "/delete/:id",
  dbDBMiddleware,
  verifyToken,
  checkPermission("Task List", "delete"),
  async (req, res) => {
    try {
      console.log(
        `DELETE /delete/${req.params.id} - Request received to delete task`
      );
      console.log("User making request:", req.user ? req.user.id : "unknown");

      console.log(`Attempting to delete task with ID: ${req.params.id}`);
      const deletedTask = await req.Task.findByIdAndDelete(req.params.id);

      if (!deletedTask) {
        console.log(`Task not found with ID: ${req.params.id}`);
        return res.status(404).json({ error: "Task not found" });
      }

      console.log("Task deleted successfully:", deletedTask._id);
      res.json({ message: "✅ Task deleted successfully!" });
    } catch (error) {
      console.error("Error deleting task:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: error.message });
    }
  }
);

router.post("/uploadProof/:taskId", dbDBMiddleware, async (req, res) => {
  try {
    console.log(
      `POST /uploadProof/${req.params.taskId} - Request received to upload proof`
    );
    console.log("Request body:", req.body);
    console.log("User making request:", req.user ? req.user.id : "unknown");
    console.log(`Finding task with ID: ${req.params.taskId}`);
    const task = await req.Task.findById(req.params.taskId);
    const targetStatusHistory = task.statusHistory.find(
      (history) => history._id.toString() === req.body.taskStatusId
    );

    if (!targetStatusHistory) {
      console.log(`Status history not found with ID: ${req.body.taskStatusId}`);
      return res.status(404).json({ error: "Status history not found" });
    }

    console.log("Updating status history with proof URL");
    targetStatusHistory.url = req.body.viewLink;
    targetStatusHistory.validationStatus = "Not Requested";
    await task.save();

    console.log("Proof document uploaded successfully");
    res.json({ message: "Proof document uploaded", task });
  } catch (error) {
    console.error("Error uploading proof:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request body that caused error:", req.body);
    res.status(500).json({ error: error.message });
  }
});

// Request Validation
router.post("/requestValidation/:taskId", dbDBMiddleware, async (req, res) => {
  try {
    console.log(
      `POST /requestValidation/${req.params.taskId} - Request received to validate task`
    );
    console.log("Request body:", req.body);
    console.log("User making request:", req.user ? req.user.id : "unknown");

    console.log(`Finding task with ID: ${req.params.taskId}`);
    const task = await req.Task.findById(req.params.taskId);
    if (!task) {
      console.log(`Task not found with ID: ${req.params.taskId}`);
      return res.status(404).json({ error: "Task not found" });
    }

    const targetStatusHistory = task.statusHistory.find(
      (history) => history._id.toString() === req.body.taskStatusId
    );

    if (!targetStatusHistory) {
      console.log(`Status history not found with ID: ${req.body.taskStatusId}`);
      return res.status(404).json({ error: "Status history not found" });
    }

    if (targetStatusHistory.validationStatus !== "Not Requested") {
      console.log("Validation already requested or completed");
      return res.status(400).json({
        error: "Validation already requested or completed",
      });
    }

    console.log("Updating validation status to 'Requested'");
    targetStatusHistory.validationStatus = "Requested";
    targetStatusHistory.validationRequestedAt = new Date();
    await task.save();

    console.log("Validation requested successfully");
    res.json({ message: "Validation requested", task });
  } catch (error) {
    console.error("Error requesting validation:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request body that caused error:", req.body);
    res.status(500).json({ error: error.message });
  }
});

// Validate Task (Admin only)
router.post(
  "/validate/:taskId",
  dbDBMiddleware,
  verifyToken,
  async (req, res) => {
    try {
      console.log(
        `POST /validate/${req.params.taskId} - Request received to validate task`
      );
      console.log("Request body:", req.body);
      console.log("User making request:", req.user ? req.user.id : "unknown");

      if (req.user.role !== "client") {
        console.log("Unauthorized validation attempt by non-admin user");
        return res
          .status(403)
          .json({ error: "Only admins can validate tasks" });
      }

      const { action, modificationReason, newPlannedDateTime } = req.body;

      console.log(`Finding task with ID: ${req.params.taskId}`);
      const task = await req.Task.findById(req.params.taskId);

      if (!task) {
        console.log(`Task not found with ID: ${req.params.taskId}`);
        return res.status(404).json({ error: "Task not found" });
      }

      const targetStatusHistory = task.statusHistory.find(
        (history) => history._id.toString() === req.body.statusId
      );

      if (!targetStatusHistory) {
        console.log(`Status history not found with ID: ${req.body.statusId}`);
        return res.status(404).json({ error: "Status history not found" });
      }

      console.log(
        `Updating validation status to: ${
          action === "approve" ? "Validated" : "Rejected"
        }`
      );
      targetStatusHistory.validationStatus =
        action === "approve" ? "Validated" : "Rejected";
      targetStatusHistory.status = "Complete";
      targetStatusHistory.completedDateTime = new Date();

      console.log("Fetching work configuration");
      const config = await req.WorkingDays.findOne();
      if (!config) {
        console.log("Work configuration not found");
        return res.status(400).json({ error: "Work config not found" });
      }

      task.plannedDateTime = task.nextDueDateTime;

      console.log("Calculating next due date time");
      let nextDueDateTime = calculateNextDueDateTime(
        task.nextDueDateTime,
        task.frequency,
        config
      );

      task.nextDueDateTime = nextDueDateTime;
      console.log("New next due date:", nextDueDateTime);

      console.log("Saving updated task");
      await task.save();

      console.log("Task validated and completed successfully");
      return res.json({ message: "Task validated and completed", task });
    } catch (error) {
      console.error("Error validating task:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Request body that caused error:", req.body);
      res.status(500).json({ error: error.message });
    }
  }
);

router.get("/serverdate", dbDBMiddleware, (req, res) => {
  console.log("GET /serverdate - Request received for server date");
  const currentDate = new Date().toISOString();
  console.log("Returning server date:", currentDate);
  res.json({ currentDate });
});

module.exports = router;
