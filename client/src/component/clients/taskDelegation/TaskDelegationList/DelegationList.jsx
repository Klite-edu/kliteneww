import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../../../Navbar/Navbar";
import Sidebar from "../../../Sidebar/Sidebar";
import "./delegationlist.css";
import { FaCheck } from "react-icons/fa";

const DelegationList = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    dueDate: "",
    time: "",
    doer: "",
  });
  const [revisingTask, setRevisingTask] = useState(null);
  const [reviseFormData, setReviseFormData] = useState({
    revisedDate: "",
    revisedTime: "",
    revisedReason: ""
  });
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState({
    title: "",
    description: "",
    category: "Delegation",
    type: "Help",
    priority: "Medium",
  });
  const [employees, setEmployees] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});

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
        `${process.env.REACT_APP_API_URL}/api/delegation/list`
      );
      let taskList = response.data;
      if (role === "user" && userId) {
        taskList = taskList.filter((task) => task.doer?._id === userId);
      }
      setTasks(taskList);
      setFilteredTasks(taskList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`
      );
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const handleSearch = () => {
    let filtered = [...tasks];
    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.doer?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(
        (task) => task.status?.toLowerCase() === statusFilter.toLowerCase()
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
  }, [searchTerm, statusFilter, dateRange, tasks]);

  const handleEditClick = (task) => {
    setEditingTask(task);
    setEditFormData({
      name: task.name,
      description: task.description,
      dueDate: task.dueDate.split("T")[0],
      time: task.time,
      doer: task.doer?._id || "",
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/delegation/edit/${editingTask._id}`,
        editFormData
      );
      alert("Task updated successfully!");
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/delegation/delete/${taskId}`
      );
      alert("Task deleted successfully!");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setCompletedTasks(prev => ({ ...prev, [taskId]: true }));
      
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/delegation/complete/${taskId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      fetchTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      setCompletedTasks(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
      alert("Failed to complete task. Please try again.");
    }
  };

  const handleReviseClick = (task) => {
    setRevisingTask(task);
    setReviseFormData({
      revisedDate: task.revisedDate ? task.revisedDate.split("T")[0] : "",
      revisedTime: task.revisedTime || "",
      revisedReason: task.revisedReason || ""
    });
  };

  const handleReviseFormChange = (e) => {
    const { name, value } = e.target;
    setReviseFormData({ ...reviseFormData, [name]: value });
  };

  const handleReviseSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/delegation/revise/${revisingTask._id}`,
        reviseFormData,
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
      alert("Failed to revise task. Please try again.");
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
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ticketRaise/add`,
        payload
      );
      alert("Ticket raised successfully!");
      setShowTicketModal(false);
      setTicketData({
        title: "",
        description: "",
        category: "Delegation",
        type: "Help",
        priority: "Medium",
      });
    } catch (error) {
      console.error("Error submitting ticket:", error);
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar onRaiseTicket={() => setShowTicketModal(true)} />
      <div className="delegation-wrapper">
        <h2 className="title">TASK DELEGATION DASHBOARD</h2>

        {role === "user" && (
          <div style={{ textAlign: "right", marginBottom: "15px" }}>
            <button className="btn blue" onClick={() => setShowTicketModal(true)}>
              Raise Ticket
            </button>
          </div>
        )}

        <div className="filters">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Revised">Revised</option>
          </select>

          <div className="date-filters">
            <label>From:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
            <label>To:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
          </div>
        </div>

        {filteredTasks.length > 0 ? (
          <div className="task-table-container">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Task Description</th>
                  <th>Doer</th>
                  <th>Planned Date</th>
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
                {filteredTasks.map((task) => {
                  if (editingTask && editingTask._id === task._id) {
                    return (
                      <tr key={task._id}>
                        <td>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditFormChange}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="description"
                            value={editFormData.description}
                            onChange={handleEditFormChange}
                          />
                        </td>
                        <td>
                          <select
                            name="doer"
                            value={editFormData.doer}
                            onChange={handleEditFormChange}
                          >
                            <option value="">Select Doer</option>
                            {employees.map((emp) => (
                              <option key={emp._id} value={emp._id}>
                                {emp.fullName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="date"
                            name="dueDate"
                            value={editFormData.dueDate}
                            onChange={handleEditFormChange}
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            name="time"
                            value={editFormData.time}
                            onChange={handleEditFormChange}
                          />
                        </td>
                        <td>{task.status || "Pending"}</td>
                        <td>{task.completedAt ? new Date(task.completedAt).toLocaleString() : "N/A"}</td>
                        <td>{task.revisedDate ? new Date(task.revisedDate).toLocaleDateString() : "N/A"}</td>
                        <td>{task.revisedTime || "N/A"}</td>
                        <td>{task.revisedReason || "N/A"}</td>
                        <td>
                          <button className="btn green" onClick={handleUpdateTask}>Save</button>
                          <button className="btn red" onClick={() => setEditingTask(null)} style={{ marginLeft: "8px" }}>Cancel</button>
                        </td>
                      </tr>
                    );
                  } else if (revisingTask && revisingTask._id === task._id) {
                    return (
                      <tr key={task._id}>
                        <td>{task.name}</td>
                        <td>{task.description}</td>
                        <td>{task.doer?.fullName || "N/A"}</td>
                        <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                        <td>{task.time}</td>
                        <td>{task.status || "Pending"}</td>
                        <td>{task.completedAt ? new Date(task.completedAt).toLocaleString() : "N/A"}</td>
                        <td>
                          <input
                            type="date"
                            name="revisedDate"
                            value={reviseFormData.revisedDate}
                            onChange={handleReviseFormChange}
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            name="revisedTime"
                            value={reviseFormData.revisedTime}
                            onChange={handleReviseFormChange}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="revisedReason"
                            value={reviseFormData.revisedReason}
                            onChange={handleReviseFormChange}
                            placeholder="Enter revision reason"
                          />
                        </td>
                        <td>
                          <button className="btn green" onClick={handleReviseSubmit}>Save</button>
                          <button className="btn red" onClick={() => setRevisingTask(null)} style={{ marginLeft: "8px" }}>Cancel</button>
                        </td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={task._id}>
                        <td>{task.name}</td>
                        <td>{task.description}</td>
                        <td>{task.doer?.fullName || "N/A"}</td>
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
                              {task.status === "Completed" || completedTasks[task._id] ? (
                                <span className="completed-icon">
                                  <FaCheck style={{ color: 'green', fontSize: '20px' }} />
                                </span>
                              ) : (
                                <button 
                                  className="btn green" 
                                  onClick={() => handleCompleteTask(task._id)}
                                  disabled={completedTasks[task._id]}
                                >
                                  Complete
                                </button>
                              )}
                              {task.status !== "Completed" && !completedTasks[task._id] && (
                                <button className="btn blue" onClick={() => handleReviseClick(task)}>Revise</button>
                              )}
                            </>
                          ) : role === "client" ? (
                            <>
                              <button className="btn green" onClick={() => handleEditClick(task)}>Edit</button>
                              <button className="btn red" onClick={() => handleDeleteTask(task._id)}>Delete</button>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ marginTop: "20px" }}>No tasks found.</p>
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
                    onChange={(e) =>
                      setTicketData({ ...ticketData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Describe your issue..."
                    value={ticketData.description}
                    onChange={(e) =>
                      setTicketData({ ...ticketData, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={ticketData.priority}
                    onChange={(e) =>
                      setTicketData({ ...ticketData, priority: e.target.value })
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="modal-buttons">
                  <button type="submit" className="btn green">Submit</button>
                  <button type="button" className="btn red" onClick={() => setShowTicketModal(false)}>Cancel</button>
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