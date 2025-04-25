const express = require("express");
const router = express.Router();
const dbMiddleware = require("../../../middlewares/dbMiddleware");

// ✅ Get Work Config for a Company
router.get("/get", dbMiddleware, async (req, res) => {
  console.log("GET /config/work - Request received");

  try {
    console.log("Attempting to find work configuration in database");
    const config = await req.WorkingDays.findOne();

    if (!config) {
      console.log("No work configuration found");
      return res.status(404).json({
        success: false,
        message: "Work configuration not found",
      });
    }

    console.log("Configuration found:", config);
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (err) {
    console.error("Error fetching work configuration:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ✅ Save or Update Work Config for a Company
router.post("/save", dbMiddleware, async (req, res) => {
  try {
    const { workingDays, shifts, holidays, timezone } = req.body;

    // Process holidays to ensure proper date formatting
    const processedHolidays = holidays
      .map((holiday) => ({
        date: new Date(holiday.date),
        description: holiday.description,
        repeatsAnnually: holiday.repeatsAnnually || false,
      }))
      .filter((h) => !isNaN(h.date.getTime())); // Filter out invalid dates

    let config = await req.WorkingDays.findOne();
    if (config) {
      config.workingDays = workingDays;
      config.shifts = shifts;
      config.holidays = processedHolidays;
      config.timezone = timezone;
    } else {
      config = new req.WorkingDays({
        workingDays,
        shifts,
        holidays: processedHolidays,
        timezone,
      });
    }

    await config.save();
    res
      .status(200)
      .json({ success: true, message: "Config saved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;
