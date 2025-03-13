import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../../../Navbar/Navbar";

const DelegationList = () => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null); // State to manage editing task
  const [revisingTask, setRevisingTask] = useState(null); // State to manage revising task

  // Get role and userId from localStorage
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  // Fetch tasks from the database
  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/delegation/list`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Send the token in the header
          },
          params: {
            userId: role === "user" ? userId : "", // If the user is a regular user, filter tasks by their userId
          },
        }
      );
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []); // Fetch tasks when the component mounts

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/delegation/delete/${taskId}`
      );
      alert("Task deleted successfully!");
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Handle task editing
  const handleEditClick = (task) => {
    setEditingTask(task); // Set the task to be edited
  };

  const handleUpdateTask = async (updatedData) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/delegation/edit/${editingTask._id}`,
        updatedData
      );
      alert("Task updated successfully!");
      setEditingTask(null); // Close the modal
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Handle task completion
  const handleCompleteTask = async (taskId) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/delegation/complete/${taskId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Include the token for authorization
          },
        }
      );
      alert("Task marked as completed!");
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  // Handle task revision
  const handleReviseTask = async (taskId, revisedData) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/delegation/revise/${taskId}`,
        revisedData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Include the token for authorization
          },
        }
      );
      alert("Task revised successfully!");
      setRevisingTask(null); // Close the modal
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error("Error revising task:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div>
        {tasks.length > 0 ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "200px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f4f4f9",
                  borderBottom: "2px solid #ccc",
                }}
              >
                <th style={{ padding: "10px", textAlign: "left" }}>
                  Task Name
                </th>
                <th style={{ padding: "10px", textAlign: "left" }}>
                  Task Description
                </th>
                <th style={{ padding: "10px", textAlign: "left" }}>
                  Assigned To
                </th>
                <th style={{ padding: "10px", textAlign: "left" }}>Due Date</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Time</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "10px", textAlign: "left" }}>
                  Completed At
                </th>
                <th style={{ padding: "10px", textAlign: "left" }}>
                  Revised Date
                </th>
                <th style={{ padding: "10px", textAlign: "left" }}>
                  Revised Time
                </th>
                <th style={{ padding: "10px", textAlign: "left" }}>
                  Revised Reason
                </th>
                <th style={{ padding: "10px", textAlign: "left" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px" }}>{task.name}</td>
                  <td style={{ padding: "10px" }}>{task.description}</td>
                  <td style={{ padding: "10px" }}>{task.doer.fullName}</td>
                  <td style={{ padding: "10px" }}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px" }}>{task.time}</td>
                  <td style={{ padding: "10px" }}>
                    {task.status || "Pending"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {task.completedAt
                      ? new Date(task.completedAt).toLocaleString()
                      : "N/A"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {task.revisedDate
                      ? new Date(task.revisedDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {task.revisedTime || "N/A"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {task.revisedReason || "N/A"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {role === "user" ? (
                      <>
                        <button
                          onClick={() => handleCompleteTask(task._id)}
                          style={{
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            marginRight: "5px",
                          }}
                        >
                          Complete
                        </button>
                        {/* Conditionally render the "Revised" button */}
                        {task.status !== "Completed" && (
                          <button
                            onClick={() => setRevisingTask(task)}
                            style={{
                              backgroundColor: "#2196F3",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Revised
                          </button>
                        )}
                      </>
                    ) : role === "client" ? (
                      <>
                        <button
                          onClick={() => handleEditClick(task)}
                          style={{
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            marginRight: "5px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          style={{
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No tasks available.</p>
        )}

        {/* Modal for editing the task */}
        {editingTask && (
          <div style={styles.modal}>
            <h2>Edit Task</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateTask({
                  name: e.target.taskName.value,
                  description: e.target.taskDescription.value,
                  dueDate: e.target.dueDate.value,
                  time: e.target.time.value,
                  doer: e.target.doer.value,
                });
              }}
            >
              <input
                type="text"
                name="taskName"
                defaultValue={editingTask.name}
                required
              />
              <textarea
                name="taskDescription"
                defaultValue={editingTask.description}
                required
              />
              <input
                type="date"
                name="dueDate"
                defaultValue={editingTask.dueDate}
                required
              />
              <input
                type="time"
                name="time"
                defaultValue={editingTask.time}
                required
              />
              <select name="doer" defaultValue={editingTask.doer._id} required>
                {tasks
                  .filter((task) => task.doer)
                  .map((task) => (
                    <option key={task._id} value={task.doer._id}>
                      {task.doer.fullName}
                    </option>
                  ))}
              </select>
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditingTask(null)}>
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Modal for revising the task */}
        {revisingTask && (
          <div style={styles.modal}>
            <h2>Revise Task</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleReviseTask(revisingTask._id, {
                  revisedDate: e.target.revisedDate.value,
                  revisedTime: e.target.revisedTime.value,
                  revisedReason: e.target.revisedReason.value,
                });
              }}
            >
              <label htmlFor="revisedDate">Revised Date:</label>
              <input type="date" id="revisedDate" name="revisedDate" required />
              <br />
              <label htmlFor="revisedTime">Revised Time:</label>
              <input type="time" id="revisedTime" name="revisedTime" required />
              <br />
              <label htmlFor="revisedReason">Reason for Revision:</label>
              <textarea id="revisedReason" name="revisedReason" required />
              <br />
              <button type="submit">Submit</button>
              <button type="button" onClick={() => setRevisingTask(null)}>
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
  },
};

export default DelegationList;