const cron = require("node-cron");
const Task = require("../models/clients/checklist/task");

// Function to calculate the next due datetime based on frequency
const calculateNextDueDateTime = (plannedDateTime, frequency) => {
  let nextDueDateTime = new Date(plannedDateTime);

  switch (frequency) {
    case "Daily":
      nextDueDateTime.setUTCDate(nextDueDateTime.getUTCDate() + 1);
      break;
    case "Alternate Days":
      nextDueDateTime.setUTCDate(nextDueDateTime.getUTCDate() + 2);
      break;
    case "Weekly":
      nextDueDateTime.setUTCDate(nextDueDateTime.getUTCDate() + 7);
      break;
    case "Fortnightly":
      nextDueDateTime.setUTCDate(nextDueDateTime.getUTCDate() + 14);
      break;
    case "Monthly":
      nextDueDateTime.setUTCMonth(nextDueDateTime.getUTCMonth() + 1);
      break;
    case "Quarterly":
      nextDueDateTime.setUTCMonth(nextDueDateTime.getUTCMonth() + 3);
      break;
    case "Half-yearly":
      nextDueDateTime.setUTCMonth(nextDueDateTime.getUTCMonth() + 6);
      break;
    case "Yearly":
      nextDueDateTime.setUTCFullYear(nextDueDateTime.getUTCFullYear() + 1);
      break;
    case "First of every month":
      nextDueDateTime.setUTCMonth(nextDueDateTime.getUTCMonth() + 1);
      nextDueDateTime.setUTCDate(1);
      break;
    case "Second of every month":
      nextDueDateTime.setUTCMonth(nextDueDateTime.getUTCMonth() + 1);
      nextDueDateTime.setUTCDate(2);
      break;
    case "Third of every month":
      nextDueDateTime.setUTCMonth(nextDueDateTime.getUTCMonth() + 1);
      nextDueDateTime.setUTCDate(3);
      break;
    case "Fourth of every month":
      nextDueDateTime.setUTCMonth(nextDueDateTime.getUTCMonth() + 1);
      nextDueDateTime.setUTCDate(4);
      break;
    default:
      return null;
  }

  return nextDueDateTime;
};

// Scheduled Task to Update Recurring Tasks
const updateTaskFrequency = async () => {
  try {
    const now = new Date();
    console.log("🔄 Running Task Frequency Update at (UTC):", now.toUTCString());

    const tasks = await Task.find({ nextDueDateTime: { $lte: now } });

    console.log(`🔍 Found ${tasks.length} tasks that need updating.`);

    if (tasks.length === 0) {
      console.log("✅ No tasks to update.");
      return;
    }

    for (let task of tasks) {
      let newDueDateTime = calculateNextDueDateTime(task.nextDueDateTime, task.frequency);
      if (!newDueDateTime) {
        console.warn(`⚠️ Skipping Task: ${task.taskName} - Unable to calculate next due datetime.`);
        continue;
      }

      try {
        await Task.findByIdAndUpdate(task._id, { 
          nextDueDateTime: newDueDateTime, 
          status: "Pending" 
        });
        console.log(`✅ Successfully Updated Task: ${task.taskName} | New Due DateTime (UTC): ${newDueDateTime.toUTCString()}`);
      } catch (updateError) {
        console.error(`❌ Error updating task ${task.taskName}:`, updateError);
      }
    }
  } catch (error) {
    console.error("❌ Error updating tasks:", error);
  }
};

cron.schedule("0 0 * * *", () => {
  console.log("🕛 Running Scheduled Task Update...");
  updateTaskFrequency();
});

module.exports = { calculateNextDueDateTime, updateTaskFrequency };