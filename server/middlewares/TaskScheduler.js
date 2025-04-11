const cron = require("node-cron");
const { getTaskModel } = require("../models/clients/checklist/task");
const { getAllClientDBNames } = require("../database/db");

// Function to calculate the next due datetime based on frequency
// Updated calculateNextDueDateTime function
const calculateNextDueDateTime = (plannedDateTime, frequency) => {
  // Create a new date object to avoid modifying the original
  let nextDueDateTime = new Date(plannedDateTime);
  
  // Preserve time components
  const hours = nextDueDateTime.getUTCHours();
  const minutes = nextDueDateTime.getUTCMinutes();
  const seconds = nextDueDateTime.getUTCSeconds();
  
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
  
  // Restore the original time components after date calculations
  nextDueDateTime.setUTCHours(hours);
  nextDueDateTime.setUTCMinutes(minutes);
  nextDueDateTime.setUTCSeconds(seconds);
  
  return nextDueDateTime;
};

// Scheduled Task to Update Recurring Tasks for All Client Databases
const updateTaskFrequency = async () => {
  try {
    const now = new Date();
    const clientDBNames = await getAllClientDBNames();

    for (const dbName of clientDBNames) {
      try {
        const companyName = dbName.replace("client_db_", "");
        const Task = await getTaskModel(companyName);
        const tasks = await Task.find({ nextDueDateTime: { $lte: now } });

        if (tasks.length === 0) continue;

        for (let task of tasks) {
          let newDueDateTime = calculateNextDueDateTime(task.nextDueDateTime, task.frequency);

          if (!newDueDateTime) continue;

          try {
            await Task.findByIdAndUpdate(task._id, {
              nextDueDateTime: newDueDateTime,
              status: "Pending",
            });
          } catch (updateError) {
            console.error(`❌ Error updating task ${task.taskName} in ${companyName}:`, updateError.message);
          }
        }
      } catch (companyError) {
        console.error(`❌ Error processing tasks for company: ${dbName}`, companyError.message);
      }
    }
  } catch (error) {
    console.error("❌ Error updating tasks:", error.message);
  }
};

// Schedule to run the task update daily at midnight
cron.schedule("0 0 * * *", () => {
  updateTaskFrequency();
});

module.exports = { calculateNextDueDateTime, updateTaskFrequency };
