const express = require("express");
const router = express.Router();
const dbDBMiddleware = require("../../../middlewares/dbMiddleware");
const {
  calculateNextDueDateTime,
} = require("../../../middlewares/TaskScheduler");
const verifyToken = require("../../../middlewares/auth");

// ✅ Add Task Route
router.post("/add", dbDBMiddleware, async (req, res) => {
  try {
    const { taskName, doerId, department, frequency, plannedDateTime } =
      req.body; // yaha doerId hata diya, direct doer le rahe
    console.log(`add data - `, req.body);

    if (!doerId) {
      return res.status(400).json({ error: "Doer (Employee) is required" });
    }

    const config = await req.WorkingDays.findOne();
    console.log(`Working Days - `, config);
    if (!config) {
      return res.status(400).json({ error: "Work config not found" });
    }

    let nextDueDateTime = calculateNextDueDateTime(
      new Date(plannedDateTime),
      frequency,
      config
    );

    console.log(`nextDueDateTime - `, nextDueDateTime);

    const newTask = await req.Task.create({
      taskName,
      doer: doerId, // ✅ yaha doer directly (ObjectId)
      department,
      frequency,
      plannedDateTime: new Date(plannedDateTime),
      nextDueDateTime,
      statusHistory: [{ date: plannedDateTime }],
    });

    console.log(`xreate new task data - `, newTask);

    res.json({ message: "✅ Task added successfully!", task: newTask });
  } catch (error) {
    console.error("❌ Error Adding Task:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/list", dbDBMiddleware, async (req, res) => {
  try {
    console.log(`➡️ Incoming /list API called`);

    let { startDate, endDate, sort, generateFutureTasks, userId } = req.query;
    console.log(`🔵 Query Params =>`, {
      startDate,
      endDate,
      sort,
      generateFutureTasks,
      userId,
    });

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

    console.log(`🟠 Filter to MongoDB =>`, filter);

    let tasks = await req.Task.find(filter)
      .sort({ nextDueDateTime: sort === "desc" ? -1 : 1 })
      .populate("doer", "fullName");

    console.log(`🟢 Tasks fetched from DB =>`, tasks.length, "tasks");

    if (generateFutureTasks === "true" && startDate && endDate) {
      console.log(`⏩ Generating future tasks till ${endDate}`);
      let extendedTasks = [];

      tasks.forEach((task) => {
        let nextDueDateTime = new Date(task.nextDueDateTime);

        while (nextDueDateTime <= new Date(endDate)) {
          const extendedTask = {
            ...task.toObject(),
            _id: task._id + "_" + nextDueDateTime.toISOString(),
            originalId: task._id,
            nextDueDateTime: new Date(nextDueDateTime),
          };

          extendedTasks.push(extendedTask);

          nextDueDateTime = calculateNextDueDateTime(
            nextDueDateTime,
            task.frequency
          );
        }
      });

      console.log(
        `🟡 Extended Tasks created =>`,
        extendedTasks.length,
        "tasks"
      );

      tasks = [...tasks, ...extendedTasks];
      console.log(`🟢 Total Tasks after extension =>`, tasks.length);
    }

    const mappedTasks = tasks.map((task) => {
      const realTask =
        typeof task.toObject === "function" ? task.toObject() : task;
      const firstStatus = realTask.statusHistory?.[0] || {};

      const dueDate = firstStatus.date || null;
      const completedDate = firstStatus.validationRequestedAt || null;

      console.log("Task ID:", realTask._id);
      console.log("➡️ dueDate:", dueDate);
      console.log("➡️ completedDate:", completedDate);

      return {
        ...realTask,
        dueDate,
        completedDate,
      };
    });

    console.log(
      `✅ Mapped Tasks ready to send =>`,
      mappedTasks.length,
      "tasks"
    );

    res.json(mappedTasks);
  } catch (error) {
    console.error("❌ Error Fetching Tasks:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update Task
router.put("/update/:id", dbDBMiddleware, async (req, res) => {
  try {
    const { taskName, doer, department, frequency, plannedDateTime } = req.body;

    if (!doer) {
      return res.status(400).json({ error: "Doer (Employee) is required" });
    }

    let nextDueDateTime = calculateNextDueDateTime(
      new Date(plannedDateTime),
      frequency
    );

    const updatedTask = await req.Task.findByIdAndUpdate(
      req.params.id,
      {
        taskName,
        doer, // ✅ yaha bhi doer directly (ObjectId)
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
    console.error("❌ Error Updating Task:", error.message);
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
    const task = await req.Task.findById(req.params.taskId);
    const targetStatusHistory = task.statusHistory.find(
      (history) => history._id.toString() === req.body.taskStatusId
    );

    if (!targetStatusHistory) {
      return res.status(404).json({ error: "Status history not found" });
    }

    targetStatusHistory.url = req.body.viewLink;
    targetStatusHistory.validationStatus = "Not Requested";
    await task.save();

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

    const targetStatusHistory = task.statusHistory.find(
      (history) => history._id.toString() === req.body.taskStatusId
    );

    if (!targetStatusHistory) {
      return res.status(404).json({ error: "Status history not found" });
    }

    if (targetStatusHistory.validationStatus !== "Not Requested") {
      return res.status(400).json({
        error: "Validation already requested or completed",
      });
    }

    targetStatusHistory.validationStatus = "Requested";
    targetStatusHistory.validationRequestedAt = new Date();
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
    console.log(
      `\n\nreq body of validate proof -`,
      req.body,
      ` and Id - ${req.params.taskId}\n\n`
    );

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

      const targetStatusHistory = task.statusHistory.find(
        (history) => history._id.toString() === req.body.statusId
      );

      console.log(
        `\n\nAbhijeet task history - ${targetStatusHistory} and statusId - ${req.body.statusId} \n\n`
      );
      if (!targetStatusHistory) {
        return res.status(404).json({ error: "Status history not found" });
      }

      targetStatusHistory.validationStatus =
        action === "approve" ? "Validated" : "Rejected";

      targetStatusHistory.status = "Complete";
      targetStatusHistory.completedDateTime = new Date();

      const config = await req.WorkingDays.findOne();
      if (!config) {
        return res.status(400).json({ error: "Work config not found" });
      }

      task.plannedDateTime = task.nextDueDateTime;

      let nextDueDateTime = calculateNextDueDateTime(
        task.nextDueDateTime,
        task.frequency,
        config
      );

      task.nextDueDateTime = nextDueDateTime;

      await task.save();

      return res.json({ message: "Task validated and completed", task });
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
