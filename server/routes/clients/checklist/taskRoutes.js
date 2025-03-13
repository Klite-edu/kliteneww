const express = require("express");
const router = express.Router();
const Task = require("../../../models/clients/checklist/task");
const Employee = require("../../../models/clients/contactdata");
const { calculateNextDueDate } = require("../../../middlewares/TaskScheduler");
const verifyToken = require("../../../middlewares/auth")

// ✅ Add a New Task
// ✅ Add a New Task
// ✅ Add a New Task
router.post("/add", async (req, res) => {
  try {
    console.log("📩 Received Task Data:", req.body);

    const { taskName, doerName, department, frequency, plannedDate } = req.body;
    
    // Fetch the employeeId based on the doerName
    const employee = await Employee.findOne({ fullName: doerName });
    if (!employee) {
      return res.status(400).json({ message: "Employee not found" });
    }

    const employeeId = employee._id; // Get the employee ID

    let nextDueDate = calculateNextDueDate(plannedDate, frequency);

    console.log("📝 Calculated Next Due Date:", nextDueDate);

    const newTask = new Task({
      taskName,
      doer: employeeId,  // Save the employee ID in the task document
      department,
      frequency,
      plannedDate,
      nextDueDate,  
      statusHistory: [{ status: "Pending" }],  // Add initial status to statusHistory
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



router.get("/list", verifyToken, async (req, res) => {
  try {
    let { startDate, endDate, sort, generateFutureTasks } = req.query;
    let filter = {};

    const userId = req.user.id;  // Assuming 'id' is available in the JWT payload
    const userRole = req.user.role;  // Assuming 'role' is available in the JWT payload

    console.log(`User ID: ${userId}, Role: ${userRole}`); // Log user info

    if (userRole === "user") {
      // If the user is a "user", show only tasks assigned to them
      filter.doer = userId;
    }

    if (startDate && endDate) {
      filter.nextDueDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Fetch tasks from the database and populate the 'doer' field with employee details
    let tasks = await Task.find(filter)
      .sort({ nextDueDate: sort === "desc" ? -1 : 1 })
      .populate("doer", "fullName");  // Populate 'doer' with employee's fullName

    // For generating future tasks, if applicable
    if (generateFutureTasks === "true") {
      let extendedTasks = [];

      tasks.forEach((task) => {
        let nextDueDate = new Date(task.nextDueDate);
        while (nextDueDate <= new Date(endDate)) {
          extendedTasks.push({
            ...task.toObject(),
            _id: task._id + "_" + nextDueDate.toISOString(), // Unique ID for frontend
            nextDueDate: new Date(nextDueDate),
          });
          nextDueDate = calculateNextDueDate(nextDueDate, task.frequency);
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




// ✅ Update Task
router.put("/update/:id", async (req, res) => {
  try {
    const { taskName, doerName, department, frequency, plannedDate } = req.body;

    // Calculate new nextDueDate if frequency or plannedDate is changed
    let nextDueDate = calculateNextDueDate(plannedDate, frequency);

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { taskName, doerName, department, frequency, plannedDate, nextDueDate }, 
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "✅ Task updated successfully!", task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: "Error updating task", details: error.message });
  }
});


// ✅ Delete Task
router.delete("/delete/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Task deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting task", details: error.message });
  }
});

// ✅ Mark Task as Completed
// ✅ Mark Task as Completed
router.put("/markCompleted/:id", async (req, res) => {
  try {
    const { selectedDate } = req.body;
    console.log("📥 Received data for marking task as completed:", selectedDate);

    // Find the task by ID
    const task = await Task.findById(req.params.id);
    if (!task) {
      console.error("❌ Task not found:", req.params.id);
      return res.status(404).json({ error: "Task not found" });
    }

    let updated = false;

    // Normalize the selectedDate to UTC
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setUTCHours(0, 0, 0, 0); // Normalize to UTC
    console.log("Normalized selectedDate:", selectedDateObj.toISOString());

    // Add the completion data to the status history
    task.statusHistory.push({
      date: new Date(),  // Store the current date when the task is marked completed
      status: "Completed",
      completedDate: selectedDateObj, // Use the selected date as the completion date
    });

    // Calculate the nextDueDate based on frequency
    const newNextDueDate = calculateNextDueDate(task.nextDueDate, task.frequency);
    console.log("New calculated nextDueDate:", newNextDueDate);

    // Update the task's nextDueDate
    task.nextDueDate = newNextDueDate;

    // Save the updated task
    await task.save();
    console.log("✅ Task marked as completed and nextDueDate updated for selected date:", selectedDate);
    res.json({ message: "✅ Task marked as completed for selected date!", task });
  } catch (error) {
    console.error("❌ Error in markCompleted route:", error);
    res.status(500).json({ error: "Error updating task", details: error.message });
  }
});



router.get("/serverdate", (req, res) => {
  const currentDate = new Date().toISOString(); // Use ISO string to ensure UTC format
  res.json({ currentDate });
});


module.exports = router;
