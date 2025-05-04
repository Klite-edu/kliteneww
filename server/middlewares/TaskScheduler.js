const cron = require("node-cron");
const moment = require('moment-timezone');
const { getTaskModel } = require("../models/clients/checklist/task");
const { getTenantWorkConfigModel } = require("../models/clients/workingConfig/working-model");
const { getAllClientDBNames } = require("../database/db");

// Function to calculate the next due datetime based on frequency
const calculateNextDueDateTime = (plannedDateTime, frequency, config) => {
  console.log('\n\ncalculateNextDueDateTime - ', plannedDateTime, frequency);

  let nextDueDateTime = new Date(plannedDateTime);
  console.log(`\n\nNext Due Date - `, nextDueDateTime);

  // Preserve original time
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

  // Restore original time
  nextDueDateTime.setUTCHours(hours);
  nextDueDateTime.setUTCMinutes(minutes);
  nextDueDateTime.setUTCSeconds(seconds);

  console.log(`holiday day configuration - `, config)

  const workingDays = config?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const holidays = (config?.holidays || []).map(h => new Date(h).toDateString());
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let attempts = 0;
  while (
    (!workingDays.includes(dayNames[nextDueDateTime.getUTCDay()]) ||
      holidays.includes(new Date(nextDueDateTime).toDateString()))
    && attempts < 10
  ) {
    nextDueDateTime.setUTCDate(nextDueDateTime.getUTCDate() + 1);
    attempts++;
  }

  console.log("✅ Final Next Working Day (Excludes Holidays):", nextDueDateTime.toISOString());

  return nextDueDateTime;
};


// Function to update task frequency across all clients
const updateTaskFrequency = async () => {
  try {
    const now = moment.tz("Asia/Kolkata").toDate(); // IST current time

    const clientDBNames = await getAllClientDBNames();

    for (const dbName of clientDBNames) {

      try {
        const companyName = dbName.replace("client_db_", "");

        const Task = await getTaskModel(companyName);
        const WorkingDays = await getTenantWorkConfigModel(companyName);

        // 🔄 Use IST-based start and end of day
        const startDate = moment.tz("Asia/Kolkata").startOf('day');
        const endDate = startDate.clone().add(1, 'day');

        const tasks = await Task.find({
          nextDueDateTime: {
            $gte: startDate.toDate(),
            $lt: endDate.toDate()
          }
        });

        if (!tasks.length) {
          continue;
        }

        for (let task of tasks) {
          const fullTask = await Task.findById(task._id);
          if (!fullTask) continue;

          const nextDate = calculateNextDueDateTime(fullTask.nextDueDateTime, fullTask.frequency, WorkingDays);
          fullTask.nextDueDateTime = moment(nextDate).toISOString();

          fullTask.statusHistory.push({
            date: startDate.toISOString(),
            status: "Pending"
          });

          await fullTask.save();
        }

      } catch (companyError) {
        console.error(`❌ Error processing tasks for ${dbName}:`, companyError.message);
      }
    }

  } catch (error) {
    console.error("Stack trace:", error.stack);
  }
};




// Function to start the daily scheduler (to be called in server.js)
const startTaskScheduler = () => {

  const cronExpression = "0 0 * * *";

  cron.schedule(cronExpression, () => {
    updateTaskFrequency();
  });

};

module.exports = {
  startTaskScheduler,
  calculateNextDueDateTime,
  updateTaskFrequency,
};