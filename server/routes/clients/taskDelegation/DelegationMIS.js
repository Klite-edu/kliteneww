const express = require("express");
const router = express.Router();
const dbDBMiddleware = require("../../../middlewares/dbMiddleware");

// In your backend route (/api/delegationmis/mis)
router.get("/mis", dbDBMiddleware, async (req, res) => {
  try {
    const { start, end, employeeId } = req.query;

    const query = {
      createdAt: {
        $gte: new Date(start),
        $lte: new Date(end),
      },
      ...(employeeId && { doer: employeeId }),
    };

    const tasks = await req.delegation
      .find(query)
      .populate({
        path: "doer",
        select: "fullName",
        model: "Employee",
      })
      .sort({ dueDate: -1 });

    // Calculate time taken for completed tasks and track late tasks
    let totalLateHours = 0;
    let totalLateMinutes = 0;
    let lateTaskCount = 0;

    const enhancedTasks = tasks.map((task) => {
      if (task.status === "Completed" && task.completedAt) {
        const dueDateTime = new Date(task.dueDate);
        if (task.time) {
          const [hours, minutes] = task.time.split(":");
          dueDateTime.setHours(hours, minutes);
        }
        const completedAt = new Date(task.completedAt);
        const timeTakenMs = completedAt - dueDateTime;

        // Convert milliseconds to hours and minutes
        const hoursTaken = Math.floor(Math.abs(timeTakenMs) / (1000 * 60 * 60));
        const minutesTaken = Math.floor(
          (Math.abs(timeTakenMs) % (1000 * 60 * 60)) / (1000 * 60)
        );

        const isLate = timeTakenMs > 0;

        if (isLate) {
          totalLateHours += hoursTaken;
          totalLateMinutes += minutesTaken;
          lateTaskCount++;
        }

        return {
          ...task.toObject(),
          timeTaken: {
            hours: Math.floor(hoursTaken),
            minutes: Math.floor(minutesTaken),
            isLate,
          },
        };
      }
      return task;
    });

    // Calculate average late time
    let avgLateHours = 0;
    let avgLateMinutes = 0;
    if (lateTaskCount > 0) {
      avgLateHours = Math.round(totalLateHours / lateTaskCount);
      avgLateMinutes = Math.round(totalLateMinutes / lateTaskCount);

      // Handle overflow from minutes to hours
      if (avgLateMinutes >= 60) {
        avgLateHours += Math.floor(avgLateMinutes / 60);
        avgLateMinutes = avgLateMinutes % 60;
      }
    }

    res.json({
      tasks: enhancedTasks,
      avgLateTime: {
        hours: avgLateHours,
        minutes: avgLateMinutes,
        lateTaskCount,
      },
    });
  } catch (error) {
    console.error("Error fetching delegation MIS data:", error);
    res.status(500).json({ message: "Error fetching delegation data" });
  }
});

// 📈 Task Completion Statistics
router.get("/stats", dbDBMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query;

    const query = {
      createdAt: {
        $gte: new Date(start),
        $lte: new Date(end),
      },
    };

    const totalTasks = await req.delegation.countDocuments(query);
    const workDone = await req.delegation.countDocuments({
      ...query,
      status: "Completed",
    });
    const revisedTasks = await req.delegation.countDocuments({
      ...query,
      status: "Revised",
    });
    const workNotDone = totalTasks - workDone;

    const completedTasks = await req.delegation.find({
      ...query,
      status: "Completed",
    });

    let completedLate = 0;
    completedTasks.forEach((task) => {
      const dueDateTime = new Date(task.dueDate);
      if (task.time) {
        const [hours, minutes] = task.time.split(":");
        dueDateTime.setHours(hours, minutes);
      }
      const completedAt = new Date(task.completedAt);
      if (completedAt > dueDateTime) {
        completedLate++;
      }
    });

    const completedOnTime = workDone - completedLate;

    res.json({
      totalTasks,
      workDone,
      workNotDone,
      completedOnTime,
      completedLate,
      revisedTasks,
      workNotDoneScore: totalTasks > 0 ? (workNotDone / totalTasks) * 100 : 0,
      lateSubmissionScore: workDone > 0 ? (completedLate / workDone) * 100 : 0,
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching delegation statistics" });
  }
});

// routes/delegationmis.js

router.get("/manifestations", dbDBMiddleware, async (req, res) => {
  try {
    const { start, end, employeeId } = req.query;

    // Convert dates to start and end of day for proper range comparison
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const query = {
      startDate: { $lte: endDate }, // Manifestation starts before or on our end date
      endDate: { $gte: startDate }, // Manifestation ends after or on our start date
      ...(employeeId && { employeeId }),
    };

    const manifestation = await req.delegationManifest.findOne(query);
    res.json(manifestation || null);
  } catch (error) {
    console.error("Error fetching manifestation:", error);
    res.status(500).json({ message: "Error fetching manifestation" });
  }
});

router.post("/manifestations", dbDBMiddleware, async (req, res) => {
  try {
    // Cookie auth automatically verifies the user
    const {
      employeeId,
      employeeName,
      startDate,
      endDate,
      workNotDoneManifestation,
      workDoneLateManifestation,
    } = req.body;

    const query = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      ...(employeeId && { employeeId }),
    };

    const update = {
      employeeId,
      employeeName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      workNotDoneManifestation,
      workDoneLateManifestation,
      updatedAt: new Date(),
    };

    const options = { upsert: true, new: true };
    const manifestation = await req.delegationManifest.findOneAndUpdate(
      query,
      update,
      options
    );
    res.json(manifestation);
  } catch (error) {
    console.error("Error saving manifestation:", error);
    res.status(500).json({ message: "Error saving manifestation" });
  }
});

router.get("/manifestations/all", dbDBMiddleware, async (req, res) => {
  try {
    // Get all manifestations for the current company
    const manifestations = await req.delegationManifest
      .find()
      .sort({ startDate: -1 }) // Sort by most recent first
      .lean();

    // Filter manifestations based on user permissions
    const filteredManifestations = manifestations.map((manifestation) => ({
      _id: manifestation._id,
      employeeId: manifestation.employeeId,
      employeeName: manifestation.employeeName || "All Employees",
      startDate: manifestation.startDate,
      endDate: manifestation.endDate,
      createdAt: manifestation.createdAt,
      updatedAt: manifestation.updatedAt,
    }));

    res.json(filteredManifestations);
  } catch (error) {
    console.error("Error fetching all manifestations:", error);
    res.status(500).json({ message: "Error fetching manifestations" });
  }
});
module.exports = router;
