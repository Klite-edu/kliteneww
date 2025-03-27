import React, { useEffect, useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiEdit, FiTrash2, FiCheckCircle, FiCalendar, FiFilter, FiChevronDown, FiSearch, FiSave, FiX } from "react-icons/fi";
import Sidebar from "../../../Sidebar/Sidebar";
import Navbar from "../../../Navbar/Navbar";
import "./tasklist.css";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [updatedTask, setUpdatedTask] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverDate, setServerDate] = useState(null);
  const [sorting, setSorting] = useState("asc");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const role = localStorage.getItem("role");
  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedUserId = localStorage.getItem("userId");
  
    setUserRole(storedRole);
    fetchServerDate();
    fetchEmployees();
  
    if (storedUserId && storedRole) {
      fetchTasks(storedUserId, storedRole);
    }
  }, [sorting, startDate, endDate]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(task => 
        task.doer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTasks(filtered);
    }
  }, [searchQuery, tasks]);

  const fetchServerDate = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/tasks/serverdate`);
      setServerDate(new Date(res.data.currentDate));
    } catch (error) {
      console.error("Error Fetching Server Date:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/employee/contactinfo`);
      setEmployees(res.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTasks = async (userId, role) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token not found. User is not authenticated.");
      }
  
      const params = {
        sort: sorting,
        startDate: startDate ? startDate.toISOString() : "",
        endDate: endDate ? endDate.toISOString() : "",
        generateFutureTasks: true,
        userId: role === "user" ? userId : "",
      };
  
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/tasks/list`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        params,
      });
  
      setTasks(res.data);
      setFilteredTasks(res.data);
    } catch (error) {
      console.error("Error Fetching Tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEditClick = (task) => {
    setEditingTask(task._id);
    setUpdatedTask({ 
      ...task,
      doerName: task.doer?.fullName || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setUpdatedTask({});
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdatedTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date, field) => {
    setUpdatedTask(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleUpdateTask = async () => {
    try {
      setLoading(true);
      
      const employee = employees.find(emp => emp.fullName === updatedTask.doerName);
      if (!employee && updatedTask.doerName) {
        alert("Selected employee not found");
        return;
      }

      const taskData = {
        ...updatedTask,
        doer: employee?._id || null
      };

      await axios.put(`${process.env.REACT_APP_API_URL}/api/tasks/update/${editingTask}`, taskData);
      alert("Task updated successfully!");
      setEditingTask(null);
      setUpdatedTask({});
      
      const storedUserId = localStorage.getItem("userId");
      const storedRole = localStorage.getItem("role");
      fetchTasks(storedUserId, storedRole);
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/tasks/delete/${taskId}`);
      alert("Task deleted successfully!");
      
      const storedUserId = localStorage.getItem("userId");
      const storedRole = localStorage.getItem("role");
      fetchTasks(storedUserId, storedRole);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  };

  const handleMarkCompleted = async (taskId, taskDate) => {
    if (!serverDate) {
      alert("Server date is not available. Please try again.");
      return;
    }

    const selectedDate = new Date(taskDate);
    selectedDate.setUTCHours(0, 0, 0, 0);

    if (selectedDate.toDateString() !== serverDate.toDateString()) {
      alert("You can only complete the task on the assigned date.");
      return;
    }

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/tasks/markCompleted/${taskId}`, { selectedDate: selectedDate.toISOString() });
      alert("Task marked as completed!");
      
      const storedUserId = localStorage.getItem("userId");
      const storedRole = localStorage.getItem("role");
      fetchTasks(storedUserId, storedRole);
    } catch (error) {
      console.error("Error marking task as completed:", error);
      alert("Failed to update status.");
    }
  };

  const StatusBadge = ({ status }) => {
    let bgColor = "var(--gray)";
    let textColor = "var(--text-dark)";
    
    if (status === "Completed") {
      bgColor = "var(--primary-light)";
      textColor = "var(--primary-dark)";
    } else if (status === "Pending") {
      bgColor = "#FFF3CD";
      textColor = "#856404";
    } else if (status === "Overdue") {
      bgColor = "#F8D7DA";
      textColor = "#721C24";
    }

    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: bgColor, 
          color: textColor,
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "500"
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="task-list-container">
        <div className="task-list-header">
          <h2 className="task-list-title">Task Management</h2>
          <div className="server-date">
            <FiCalendar className="date-icon" />
            <span>Today's Date: {serverDate ? serverDate.toLocaleDateString() : "Loading..."}</span>
          </div>
        </div>

        <div className="task-list-controls">
          <div className="controls-left">
            <div className="search-control">
              <div className="search-input-container">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by employee name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
            </div>
            <div className="sort-control">
              <label>Sort By:</label>
              <div className="custom-select">
                <select 
                  onChange={(e) => setSorting(e.target.value)} 
                  value={sorting}
                >
                  <option value="asc">Oldest First</option>
                  <option value="desc">Newest First</option>
                </select>
                <FiChevronDown className="select-arrow" />
              </div>
            </div>
          </div>

          <div className="controls-right">
            <button 
              className="filter-toggle"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FiFilter /> Filters
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="date-range-filter">
            <div className="date-picker-group">
              <label>From:</label>
              <DatePicker 
                selected={startDate} 
                onChange={(date) => setStartDate(date)} 
                placeholderText="Start Date"
                className="date-picker"
              />
            </div>
            <div className="date-picker-group">
              <label>To:</label>
              <DatePicker 
                selected={endDate} 
                onChange={(date) => setEndDate(date)} 
                placeholderText="End Date"
                className="date-picker"
              />
            </div>
            <button 
              className="clear-filters"
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        <div className="task-list-table-container">
          <table className="task-list-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Assigned To</th>
                <th>Department</th>
                <th>Frequency</th>
                <th>Planned Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? filteredTasks.map(task => {
                const isToday = serverDate && new Date(task.nextDueDate).toDateString() === serverDate.toDateString();
                const isEditing = editingTask === task._id;
                return (
                  <tr key={task._id} className={isToday ? "today-task" : ""}>
                    <td>{isEditing ? <input type="text" name="taskName" value={updatedTask.taskName || ""} onChange={handleUpdateChange} className="edit-input" /> : task.taskName}</td>
                    <td>{task.doer?.fullName || "Unassigned"}</td>
                    <td>{isEditing ? <input type="text" name="department" value={updatedTask.department || ""} onChange={handleUpdateChange} className="edit-input" /> : task.department}</td>
                    <td>{isEditing ? (
                      <select name="frequency" value={updatedTask.frequency || ""} onChange={handleUpdateChange} className="edit-select">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    ) : task.frequency}</td>
                    <td>{isEditing ? (
                      <DatePicker selected={updatedTask.plannedDate ? new Date(updatedTask.plannedDate) : null} onChange={(date) => handleDateChange(date, "plannedDate")} className="edit-date-picker" />
                    ) : new Date(task.plannedDate).toLocaleDateString()}</td>
                    <td><div className="due-date-cell">{new Date(task.nextDueDate).toLocaleDateString()}{isToday && <span className="today-badge">Today</span>}</div></td>
                    <td><StatusBadge status={task.status} /></td>
                    <td>
                      <div className="action-buttons">
                        {isEditing ? (
                          <>
                            <button className="save-btn" onClick={handleUpdateTask}><FiSave /> Save</button>
                            <button className="cancel-btn" onClick={handleCancelEdit}><FiX /> Cancel</button>
                          </>
                        ) : (
                          <>
                            {userRole === "client" && (
                              <>
                                <button className="edit-btn" onClick={() => handleEditClick(task)}><FiEdit /></button>
                                <button className="delete-btn" onClick={() => handleDeleteTask(task._id)}><FiTrash2 /></button>
                              </>
                            )}
                            {userRole === "user" && (
                              <button className={`complete-btn ${!isToday ? 'disabled' : ''}`} onClick={() => isToday && handleMarkCompleted(task._id, task.nextDueDate)}>
                                <FiCheckCircle /> Complete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td>{task.completedDate ? new Date(task.completedDate).toLocaleString() : <span className="not-completed">-</span>}</td>
                  </tr>
                );
              }) : (
                <tr className="no-tasks-row">
                  <td colSpan="9">
                    <div className="no-tasks-message">
                      {searchQuery.trim() ? `No tasks found for employee "${searchQuery}". Try a different name.` : "No tasks found. Try adjusting your filters."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default TaskList;