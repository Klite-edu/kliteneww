const express = require("express");
const router = express.Router();
const dbDBMiddleware = require("../../../middlewares/dbMiddleware");
const {
  calculateNextDueDateTime,
} = require("../../../middlewares/TaskScheduler");
const verifyToken = require("../../../middlewares/auth");
// Add a New Task
router.post("/add", dbDBMiddleware, async (req, res) => {
  try {
    console.log("📩 Received Task Data:", req.body);

    const { taskName, doerName, department, frequency, plannedDateTime } =
      req.body;

    const employee = await req.Employee.findOne({ fullName: doerName });
    if (!employee) {
      return res.status(400).json({ message: "Employee not found" });
    }

    const employeeId = employee._id;

    let nextDueDateTime = calculateNextDueDateTime(
      new Date(plannedDateTime),
      frequency
    );

    console.log("📝 Calculated Next Due DateTime:", nextDueDateTime);

    const newTask = new req.Task({
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
router.get("/list", dbDBMiddleware, async (req, res) => {
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

    let tasks = await req.Task.find(filter)
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
router.put("/update/:id", dbDBMiddleware, async (req, res) => {
  try {
    const { taskName, doerName, department, frequency, plannedDateTime } =
      req.body;

    let nextDueDateTime = calculateNextDueDateTime(
      new Date(plannedDateTime),
      frequency
    );

    const updatedTask = await req.Task.findByIdAndUpdate(
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
router.put("/markCompleted/:id", dbDBMiddleware, async (req, res) => {
  try {
    const { selectedDateTime } = req.body;
    console.log(
      "📥 Received data for marking task as completed:",
      selectedDateTime
    );
    const task = await req.Task.findById(req.params.id);

    if (!task.proofDoc || task.validationStatus !== "Validated") {
      return res.status(400).json({
        error:
          "Proof must be uploaded and validated by admin before completion",
      });
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
router.delete("/delete/:id", dbDBMiddleware, verifyToken, async (req, res) => {
  try {
    const deletedTask = await req.Task.findByIdAndDelete(req.params.id);

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
router.post("/uploadProof/:taskId", dbDBMiddleware, async (req, res) => {
  try {
    const { fileId, fileName, viewLink } = req.body;
    const task = await req.Task.findByIdAndUpdate(
      req.params.taskId,
      {
        proofDoc: {
          fileId,
          fileName,
          viewLink,
          uploadedAt: new Date(),
        },
      },
      { new: true }
    );

    res.json({ message: "Proof document uploaded", task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request Validation
router.post("/requestValidation/:taskId", dbDBMiddleware, async (req, res) => {
  try {
    const task = await req.Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.validationStatus !== "Not Requested") {
      return res.status(400).json({
        error: "Validation already requested or completed",
      });
    }

    task.validationStatus = "Requested";
    task.validationRequestedAt = new Date();
    await task.save();

    res.json({ message: "Validation requested", task });
  } catch (error) {
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
      if (req.user.role !== "client") {
        return res
          .status(403)
          .json({ error: "Only admins can validate tasks" });
      }

      const { action, modificationReason, newPlannedDateTime } = req.body;

      const task = await req.Task.findById(req.params.taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      if (action === "approve") {
        task.validationStatus = "Validated";
        task.validatedAt = new Date();

        task.statusHistory.push({
          date: new Date(),
          status: "Completed",
          completedDateTime: task.validatedAt,
        });

        await task.save();
        return res.json({ message: "Task validated and completed", task });
      } else if (action === "modification") {
        if (!modificationReason || !newPlannedDateTime) {
          return res
            .status(400)
            .json({ error: "Modification reason and new date required" });
        }

        task.validationStatus = "Not Requested";
        task.proofDoc.modificationReason = modificationReason;
        task.plannedDateTime = new Date(newPlannedDateTime);
        task.nextDueDateTime = new Date(newPlannedDateTime); // Important to update both!

        await task.save();
        return res.json({
          message: "Modification requested with new date",
          task,
        });
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get("/serverdate", dbDBMiddleware, (req, res) => {
  const currentDate = new Date().toISOString();
  res.json({ currentDate });
});

module.exports = router;
