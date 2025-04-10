const router = require("express").Router();
const dbMiddleware = require("../../../middlewares/dbMiddleware");
const {
  calculateNextDueDateTime,
} = require("../../../middlewares/TaskScheduler");
const mongoose = require("mongoose");
// 🧠 Get all due dates between range based on frequency
const getDueDatesInRange = (plannedDate, frequency, startDate, endDate) => {
  let currentDue = calculateNextDueDateTime(new Date(plannedDate), frequency);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dueDates = [];
  let iteration = 0;
  while (currentDue && currentDue <= end) {
    iteration++;

    if (currentDue >= start) {
      dueDates.push(new Date(currentDue));
    }

    const prevDue = currentDue;
    currentDue = calculateNextDueDateTime(currentDue, frequency);

    if (iteration > 100) {
      break;
    }
  }
  return dueDates;
};

router.get("/mis-report", dbMiddleware, async (req, res) => {
  try {
    let { startDate, endDate, userId, departmentId } = req.query;

    // Validation
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    // Build filter
    const filter = {
      plannedDateTime: { $lte: new Date(endDate) },
    };

    if (userId) {
      filter.doer = userId;
    }
    if (departmentId) {
      filter.department = departmentId;
    }

    const queryStart = Date.now();
    const tasks = await req.Task.find(filter)
      .populate("doer", "fullName department employeeId")
      .lean();
    const queryTime = Date.now() - queryStart;

    if (tasks.length > 0) {
    }

    const userTaskMap = {};

    for (const [index, task] of tasks.entries()) {
      if (!task.doer || !task.doer._id) {
        console.error("[MIS Report] Task:", { _id: task._id, doer: task.doer });
        continue;
      }

      const userId = task.doer._id.toString();
      const userName = task.doer.fullName || "Unknown";

      // Initialize user entry if not exists
      if (!userTaskMap[userId]) {
        userTaskMap[userId] = {
          employeeId: task.doer.employeeId || "N/A",
          employeeName: userName,
          department: task.doer.department || "N/A",
          totalTasks: 0,
          workNotDone: 0,
          completedLate: 0,
          minutesLate: 0,
          workNotDoneScore: 0,
          lateSubmissionScore: 0,
          performanceGap: 0,
          tasks: [],
        };
      }

      const statusHistory = task.statusHistory || [];

      if (statusHistory.length > 0) {
      }
      const dueDates = getDueDatesInRange(
        task.plannedDateTime,
        task.frequency,
        startDate,
        endDate
      );

      for (const [dateIndex, dueDate] of dueDates.entries()) {
        userTaskMap[userId].totalTasks++;
        const matchingCompletion = statusHistory.find(
          (entry) =>
            entry.status === "Completed" &&
            new Date(entry.completedDateTime) &&
            new Date(entry.completedDateTime) <= dueDate &&
            new Date(entry.completedDateTime) <= new Date(endDate)
        );
        if (matchingCompletion) {
        }

        const isCompleted = !!matchingCompletion;
        const matchingCompletionLate = statusHistory.find(
          (entry) =>
            entry.status === "Completed" &&
            new Date(entry.completedDateTime) &&
            new Date(entry.completedDateTime) > dueDate &&
            new Date(entry.completedDateTime) <= new Date(endDate)
        );
        const isCompletedOnTime = isCompleted && !matchingCompletionLate;
        if (!isCompleted) {
          const isPending = !statusHistory.some(
            (entry) => entry.status === "Completed"
          );
          if (isPending) {
            userTaskMap[userId].workNotDone++;
          } else {
          }
        } else if (matchingCompletionLate) {
          userTaskMap[userId].completedLate++;
          const diff = new Date(matchingCompletion.completedDateTime) - dueDate;
          const lateMinutes = Math.round(diff / (1000 * 60));
          userTaskMap[userId].minutesLate += lateMinutes;
        } else {
          console.log(`[MIS Report] ✅ Task completed on time`);
        }
        const taskItem = {
          taskId: task._id,
          taskName: task.taskName,
          dueDate: dueDate,
          completedDate: matchingCompletion?.completedDateTime || null,
          matchingCompletionLate,
          isMissed: !isCompleted && new Date() > dueDate,
          isCompletedOnTime,
          isPending:
            !isCompleted &&
            !statusHistory.some((entry) => entry.status === "Completed"),
          daysLate: matchingCompletionLate
            ? Math.ceil(
                (new Date(matchingCompletionLate.completedDateTime) - dueDate) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
          allStatusHistory: statusHistory.map((entry) => ({
            date: entry.date,
            status: entry.status,
            completedDateTime: entry.completedDateTime || null,
          })),
        };
        userTaskMap[userId].tasks.push(taskItem);
      }
    }
    // Inside the misReport mapping section of your backend route
    const misReport = Object.values(userTaskMap).map((userData) => {
      // Calculate different task statuses
      const completedOnTime = userData.tasks.filter(
        (t) => t.isCompletedOnTime
      ).length;
      const completedLate = userData.tasks.filter(
        (t) => t.matchingCompletionLate
      ).length;
      const workNotDone = userData.tasks.filter(
        (t) => !t.isCompletedOnTime && !t.matchingCompletionLate
      ).length;
      userData.workNotDone = workNotDone;
      userData.completedLate = completedLate;
      userData.completedOnTime = completedOnTime;
      userData.workDone = completedOnTime + completedLate; // Total work done (both on time and late)

      // Calculate performance scores
      userData.workNotDoneScore =
        userData.totalTasks > 0
          ? -(workNotDone / userData.totalTasks) * 100
          : 0;

      userData.lateSubmissionScore =
        userData.workDone > 0 ? -(completedLate / userData.workDone) * 100 : 0;

      userData.performanceGap =
        userData.workNotDoneScore + userData.lateSubmissionScore;

      // Calculate average lateness only for late tasks
      const lateTasks = userData.tasks.filter((t) => t.matchingCompletionLate);
      userData.minutesLate = lateTasks.reduce((sum, t) => {
        return (
          sum +
          Math.round(
            (new Date(t.completedDate) - new Date(t.dueDate)) / (1000 * 60)
          )
        );
      }, 0);

      userData.averageLateMinutes =
        completedLate > 0
          ? Math.round(userData.minutesLate / completedLate)
          : 0;

      return userData;
    });

    misReport.sort((a, b) => b.performanceGap - a.performanceGap);
    const finalReport = {
      startDate,
      endDate,
      reportGeneratedAt: new Date(),
      totalEmployees: misReport.length,
      employees: misReport,
    };
    res.json(finalReport);
  } catch (error) {
    console.error("\n[MIS Report] ❌ Critical error occurred:");
    console.error("[MIS Report] Error message:", error.message);
    console.error("[MIS Report] Stack trace:", error.stack);
    console.error("[MIS Report] Request details:", {
      method: req.method,
      url: req.originalUrl,
      query: req.query,
      params: req.params,
    });

    res.status(500).json({
      error: "Failed to generate MIS report",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.post("/save-manifestation", dbMiddleware, async (req, res) => {
  try {
    const {
      employeeId,
      startDate,
      endDate,
      workNotDoneTarget,
      lateSubmissionTarget,
    } = req.body;

    // Validate employeeId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid employee ID",
        message: "Please provide a valid employee ID"
      });
    }

    // Rest of your validation
    if (!startDate || !endDate || workNotDoneTarget === undefined || lateSubmissionTarget === undefined) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields",
        message: "All fields are required"
      });
    }

    // Convert to ObjectId
    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);

    // Check for existing manifestation
    const existingManifestation = await req.ChecklistMIS.findOne({
      employeeId: employeeObjectId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    let manifestation;
    if (existingManifestation) {
      // Update existing manifestation
      existingManifestation.workNotDoneTarget = workNotDoneTarget;
      existingManifestation.lateSubmissionTarget = lateSubmissionTarget;
      existingManifestation.updatedAt = new Date();
      manifestation = await existingManifestation.save();
    } else {
      // Create new manifestation
      manifestation = await req.ChecklistMIS.create({
        employeeId: employeeObjectId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        workNotDoneTarget,
        lateSubmissionTarget,
      });
    }

    res.json({
      success: true,
      manifestation,
      message: "Manifestation saved successfully"
    });
  } catch (error) {
    console.error("Error saving manifestation:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to save manifestation",
      message: error.message
    });
  }
});
// Get manifestation for an employee within date range
router.get("/get-manifestation", dbMiddleware, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const manifestation = await req.ChecklistMIS.findOne({
      employeeId,
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    });

    res.json({
      success: true,
      manifestation: manifestation || null,
    });
  } catch (error) {
    console.error("Error fetching manifestation:", error);
    res.status(500).json({ error: "Failed to fetch manifestation" });
  }
});

module.exports = router;
