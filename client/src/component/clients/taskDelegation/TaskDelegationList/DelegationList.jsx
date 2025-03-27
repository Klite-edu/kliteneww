import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../../../Navbar/Navbar";
import Sidebar from "../../../Sidebar/Sidebar";
import "./delegationlist.css";

const DelegationList = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [editingTask, setEditingTask] = useState(null);
  const [revisingTask, setRevisingTask] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState({
    title: "",
    description: "",
    category: "Delegation",
    type: "Help",
    priority: "Medium",
  });

  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("userName") || "User";
  const userId = localStorage.getItem("userId");

  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/delegation/list`,
      );

      let taskList = response.data;

      if (role === "user" && userId) {
        taskList = taskList.filter(task => task.doer?._id === userId);
      }

      setTasks(taskList);
      setFilteredTasks(taskList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSearch = () => {
    let filtered = [...tasks];

    if (searchTerm) {
      filtered = filtered.filter((task) =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.doer?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      filtered = filtered.filter((task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= fromDate && dueDate <= toDate;
      });
    }

    setFilteredTasks(filtered);
  };

  useEffect(() => {
    handleSearch();
  }, [searchTerm, dateRange, tasks]);

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/delegation/delete/${taskId}`);
      alert("Task deleted successfully!");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
  };

  const handleUpdateTask = async (updatedData) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/delegation/edit/${editingTask._id}`,
        updatedData
      );
      alert("Task updated successfully!");
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/delegation/complete/${taskId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Task marked as completed!");
      fetchTasks();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleReviseTask = async (taskId, revisedData) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/delegation/revise/${taskId}`,
        revisedData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Task revised successfully!");
      setRevisingTask(null);
      fetchTasks();
    } catch (error) {
      console.error("Error revising task:", error);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...ticketData,
      employeeName: userName,
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
    };

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/ticketRaise/add`, payload);
      alert("Ticket raised successfully!");
      setShowTicketModal(false);
      setTicketData({ 
        title: "", 
        description: "", 
        category: "Delegation", 
        type: "Help", 
        priority: "Medium" 
      });
    } catch (error) {
      console.error("Error submitting ticket:", error);
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="delegation-wrapper">
        <h2 className="title">Task Delegation List</h2>

        {role === "user" && (
          <div style={{ textAlign: "right", marginBottom: "15px" }}>
            <button 
              className="btn blue" 
              onClick={() => setShowTicketModal(true)}
            >
              Raise Ticket
            </button>
          </div>
        )}

        <div className="filters">
          <input
            type="text"
            placeholder="Search task or assignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />
        </div>

        {filteredTasks.length > 0 ? (
          <div className="task-table-container">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Description</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Completed At</th>
                  <th>Revised Date</th>
                  <th>Revised Time</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task._id}>
                    <td>{task.name}</td>
                    <td>{task.description}</td>
                    <td>{task.doer.fullName}</td>
                    <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td>{task.time}</td>
                    <td>{task.status || "Pending"}</td>
                    <td>{task.completedAt ? new Date(task.completedAt).toLocaleString() : "N/A"}</td>
                    <td>{task.revisedDate ? new Date(task.revisedDate).toLocaleDateString() : "N/A"}</td>
                    <td>{task.revisedTime || "N/A"}</td>
                    <td>{task.revisedReason || "N/A"}</td>
                    <td>
                      {role === "user" ? (
                        <>
                          <button className="btn green" onClick={() => handleCompleteTask(task._id)}>
                            Complete
                          </button>
                          {task.status !== "Completed" && (
                            <button className="btn blue" onClick={() => setRevisingTask(task)}>
                              Revise
                            </button>
                          )}
                        </>
                      ) : role === "client" ? (
                        <>
                          <button className="btn green" onClick={() => handleEditClick(task)}>
                            Edit
                          </button>
                          <button className="btn red" onClick={() => handleDeleteTask(task._id)}>
                            Delete
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-tasks">No tasks available.</p>
        )}

        {showTicketModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Raise Ticket</h3>
              <form onSubmit={handleTicketSubmit}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    placeholder="Ticket Title"
                    value={ticketData.title}
                    onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Describe your issue..."
                    value={ticketData.description}
                    onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={ticketData.priority}
                    onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="modal-buttons">
                  <button type="submit" className="btn green">Submit</button>
                  <button 
                    type="button" 
                    className="btn red" 
                    onClick={() => setShowTicketModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DelegationList;