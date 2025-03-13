import React, { useEffect, useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker"; // Import Date Picker
import "react-datepicker/dist/react-datepicker.css";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [updatedTask, setUpdatedTask] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverDate, setServerDate] = useState(null);

  // ✅ Sorting & Date Range States
  const [sorting, setSorting] = useState("asc");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [userRole, setUserRole] = useState(""); // Role state

  // ✅ Fetch role and userId from localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedUserId = localStorage.getItem("userId");
  
    console.log("Fetched role from localStorage:", storedRole);
    console.log("Fetched userId from localStorage:", storedUserId);
  
    setUserRole(storedRole);
    fetchServerDate();
  
    if (storedUserId && storedRole) {
      console.log("Fetching tasks for userId:", storedUserId, "and role:", storedRole);
      fetchTasks(storedUserId, storedRole);  // Fetch tasks using userId and role
    }
  }, []);

  const fetchServerDate = async () => {
    try {
      console.log("Fetching server date...");
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/tasks/serverdate`);
      console.log("Received server date:", res.data.currentDate); // Log server date response
      setServerDate(new Date(res.data.currentDate));
    } catch (error) {
      console.error("❌ Error Fetching Server Date:", error);
    }
  };

  const fetchTasks = async (userId, role) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");  // Assuming token is saved in localStorage
      if (!token) {
        throw new Error("Token not found. User is not authenticated.");
      }
  
      const params = {
        sort: sorting,
        startDate: startDate ? startDate.toISOString() : "",
        endDate: endDate ? endDate.toISOString() : "",
        generateFutureTasks: true,
        userId: role === "user" ? userId : "", // Only filter by userId for 'user' role
      };
  
      console.log("Fetching tasks with params:", params); // Log params being sent to the backend
  
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/tasks/list`, {
        headers: {
          "Authorization": `Bearer ${token}`  // Include the token in the Authorization header
        },
        params,
      });
  
      console.log("Received tasks:", res.data); // Log received tasks data
      setTasks(res.data);
    } catch (error) {
      console.error("❌ Error Fetching Tasks:", error);
    }
  };
  

  const handleEditClick = (task) => {
    console.log("Editing task:", task); // Log task being edited
    setEditingTask(task._id);
    setUpdatedTask({ ...task });
  };

  const handleUpdateTask = async () => {
    try {
      console.log("Updating task with ID:", editingTask, "and data:", updatedTask); // Log task update request
      setLoading(true);
      await axios.put(`${process.env.REACT_APP_API_URL}/api/tasks/update/${editingTask}`, updatedTask);
      alert("✅ Task updated successfully!");
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error("❌ Error updating task:", error);
      alert("⚠️ Failed to update task.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    console.log("Deleting task with ID:", taskId); // Log task delete request
    if (!window.confirm("❓ Are you sure you want to delete this task?")) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/tasks/delete/${taskId}`);
      alert("✅ Task deleted successfully!");
      fetchTasks();
    } catch (error) {
      console.error("❌ Error deleting task:", error);
      alert("⚠️ Failed to delete task.");
    }
  };

  const handleMarkCompleted = async (taskId, taskDate) => {
    console.log("Attempting to mark task as completed for:", taskId, "on date:", taskDate); // Log data before sending
    if (!serverDate) {
      alert("⚠️ Server date is not available. Please try again.");
      return;
    }

    // Normalize to UTC for consistency with backend
    const selectedDate = new Date(taskDate);
    selectedDate.setUTCHours(0, 0, 0, 0); // Normalize to ignore time

    if (selectedDate.toDateString() !== serverDate.toDateString()) {
      alert("⚠️ You can only complete the task on the assigned date.");
      return;
    }

    try {
      console.log("Sending completion request for task ID:", taskId, "with selected date:", selectedDate.toISOString());
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/tasks/markCompleted/${taskId}`, { selectedDate: selectedDate.toISOString() });
      console.log("Server response:", res.data); // Log server response
      alert("✅ Task marked as completed!");
      fetchTasks();
    } catch (error) {
      console.error("❌ Error marking task as completed:", error);
      alert("⚠️ Failed to update status.");
    }
  };
  return (
    <div>
      <h2>Task List</h2>
      <p><strong>Role:</strong> {userRole}</p>
      <p><strong>Today's Date (Server Time):</strong> {serverDate ? serverDate.toLocaleDateString() : "Loading..."}</p>

      {/* ✅ Sorting Dropdown */}
      <label>Sort By Date: </label>
      <select onChange={(e) => setSorting(e.target.value)} value={sorting}>
        <option value="asc">Oldest First</option>
        <option value="desc">Newest First</option>
      </select>

      {/* ✅ Date Range Picker */}
      <div>
        <label>Filter by Next Due Date Range: </label>
        <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} placeholderText="Start Date" />
        <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} placeholderText="End Date" />
      </div>

      {/* ✅ Task Table */}
      <table border="1" style={{ width: "100%", textAlign: "center", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Task Name</th>
            <th>Doer</th>
            <th>Department</th>
            <th>Frequency</th>
            <th>Planned Date</th>
            <th>Next Due Date</th>
            <th>Status</th>
            <th>Actions</th>
            <th>Completed Date</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isToday =
              serverDate && new Date(task.nextDueDate).toDateString() === serverDate.toDateString();

            return (
              <tr key={task._id}>
                <td>{task.taskName}</td>
                <td>{task.doer.fullName}</td>
                <td>{task.department}</td>
                <td>{task.frequency}</td>
                <td>{new Date(task.plannedDate).toLocaleDateString()}</td>
                <td>{new Date(task.nextDueDate).toLocaleDateString()}</td>
                <td>{task.status}</td>
                <td>
                  {userRole === "client" && (
                    <>
                      <button onClick={() => handleEditClick(task)}>Edit</button>
                      <button onClick={() => handleDeleteTask(task._id)}>Delete</button>
                    </>
                  )}
                  {userRole === "user" && (
                    <button
                      onClick={() => handleMarkCompleted(task._id, task.nextDueDate)}
                      disabled={!isToday}
                    >
                      {isToday ? "Complete" : "Not Available Today"}
                    </button>
                  )}
                </td>
                <td>
                  {task.completedDate ? new Date(task.completedDate).toLocaleString() : "Not Completed"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TaskList;
