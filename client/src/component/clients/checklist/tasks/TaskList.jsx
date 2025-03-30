import React, { useEffect, useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiCalendar,
  FiFilter,
  FiChevronDown,
  FiSearch,
  FiSave,
  FiX,
} from "react-icons/fi";
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
  const [taskQuery, setTaskQuery] = useState("");
  const [statusQuery, setStatusQuery] = useState("");
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
    const filtered = tasks.filter((task) => {
      const employeeMatch = task.doer?.fullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

      const taskMatch = task.taskName
        ?.toLowerCase()
        .includes(taskQuery.toLowerCase());

      const statusMatch =
        !statusQuery ||
        task.statusHistory?.[task.statusHistory.length - 1]?.status
          ?.toLowerCase()
          .includes(statusQuery.toLowerCase());

      return employeeMatch && taskMatch && statusMatch;
    });

    setFilteredTasks(filtered);
  }, [searchQuery, taskQuery, statusQuery, tasks]);

  const fetchServerDate = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/serverdate`
      );
      setServerDate(new Date(res.data.currentDate));
    } catch (error) {
      console.error("Error Fetching Server Date:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`
      );
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
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        generateFutureTasks: true,
        userId: role === "user" ? userId : null,
      };

      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/list`,
        {
          params: params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTasks(res.data);
      setFilteredTasks(res.data);
    } catch (error) {
      console.error("Error Fetching Tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleTaskNameSearchChange = (e) => setTaskQuery(e.target.value);
  const handleEditClick = (task) => {
    setEditingTask(task._id);
    setUpdatedTask({
      taskName: task.taskName,
      doerName: task.doer?.fullName || "",
      department: task.department,
      frequency: task.frequency,
      plannedDateTime: new Date(task.plannedDateTime),
      nextDueDateTime: new Date(task.nextDueDateTime),
    });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setUpdatedTask({});
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdatedTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateTimeChange = (date, field) => {
    setUpdatedTask((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleUpdateTask = async () => {
    try {
      setLoading(true);

      const employee = employees.find(
        (emp) => emp.fullName === updatedTask.doerName
      );
      if (!employee && updatedTask.doerName) {
        alert("Selected employee not found");
        return;
      }

      const taskData = {
        taskName: updatedTask.taskName,
        doerName: updatedTask.doerName,
        department: updatedTask.department,
        frequency: updatedTask.frequency,
        plannedDateTime: updatedTask.plannedDateTime.toISOString(),
      };

      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/tasks/update/${editingTask}`,
        taskData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
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
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/tasks/delete/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Task deleted successfully!");

      const storedUserId = localStorage.getItem("userId");
      const storedRole = localStorage.getItem("role");
      fetchTasks(storedUserId, storedRole);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  };

  const handleMarkCompleted = async (taskId) => {
    try {
      setLoading(true);
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/tasks/markCompleted/${taskId}`,
        { selectedDateTime: new Date().toISOString() },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Task marked as completed!");

      const storedUserId = localStorage.getItem("userId");
      const storedRole = localStorage.getItem("role");
      fetchTasks(storedUserId, storedRole);
    } catch (error) {
      console.error("Error marking task as completed:", error);
      alert("Failed to update status.");
    } finally {
      setLoading(false);
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
          fontWeight: "500",
        }}
      >
        {status}
      </span>
    );
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString();
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="task-list-container">
        <div className="task-list-header">
          <h2 className="task-list-title">CHECKLIST MANAGEMENT</h2>
          <div className="server-date">
            <FiCalendar className="date-icon" />
            <span>
              Today's Date:{" "}
              {serverDate ? serverDate.toLocaleDateString() : "Loading..."}
            </span>
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
            <div className="search-control">
              <div className="search-input-container">
                <FiSearch className="search-icon" />
                <select
                  value={statusQuery}
                  onChange={(e) => setStatusQuery(e.target.value)}
                  className="search-input"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="search-control">
              <div className="search-input-container">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by task name..."
                  value={taskQuery}
                  onChange={handleTaskNameSearchChange}
                  className="search-input"
                />
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
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
              />
            </div>
            <div className="date-picker-group">
              <label>To:</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                placeholderText="End Date"
                className="date-picker"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
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
                {userRole === "client" && (
                  <>
                    <th>Planned Date & Time</th>
                  </>
                )}
                <th>Upcoming Date & Time</th>
                <th>Actions</th>
                <th>Completed At</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const isToday =
                    serverDate &&
                    new Date(task.nextDueDateTime).toDateString() ===
                      serverDate.toDateString();
                  const isEditing = editingTask === task._id;
                  const currentStatus =
                    task.statusHistory?.length > 0
                      ? task.statusHistory[task.statusHistory.length - 1].status
                      : "Pending";

                  return (
                    <tr key={task._id} className={isToday ? "today-task" : ""}>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            name="taskName"
                            value={updatedTask.taskName || ""}
                            onChange={handleUpdateChange}
                            className="edit-input"
                          />
                        ) : (
                          task.taskName
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            name="doerName"
                            value={updatedTask.doerName || ""}
                            onChange={handleUpdateChange}
                            className="edit-select"
                          >
                            <option value="">Select Employee</option>
                            {employees.map((employee) => (
                              <option
                                key={employee._id}
                                value={employee.fullName}
                              >
                                {employee.fullName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          task.doer?.fullName || "Unassigned"
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            name="department"
                            value={updatedTask.department || ""}
                            onChange={handleUpdateChange}
                            className="edit-input"
                          />
                        ) : (
                          task.department
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            name="frequency"
                            value={updatedTask.frequency || ""}
                            onChange={handleUpdateChange}
                            className="edit-select"
                          >
                            <option value="Daily">Daily</option>
                            <option value="Alternate Days">
                              Alternate Days
                            </option>
                            <option value="Weekly">Weekly</option>
                            <option value="Fortnightly">Fortnightly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Half-yearly">Half-yearly</option>
                            <option value="Yearly">Yearly</option>
                            <option value="First of every month">
                              First of every month
                            </option>
                            <option value="Second of every month">
                              Second of every month
                            </option>
                            <option value="Third of every month">
                              Third of every month
                            </option>
                            <option value="Fourth of every month">
                              Fourth of every month
                            </option>
                          </select>
                        ) : (
                          task.frequency
                        )}
                      </td>
                      {userRole === "client" && (
                        <td>
                          {isEditing ? (
                            <DatePicker
                              selected={updatedTask.plannedDateTime || null}
                              onChange={(date) =>
                                handleDateTimeChange(date, "plannedDateTime")
                              }
                              className="edit-date-picker"
                              showTimeSelect
                              timeFormat="HH:mm"
                              timeIntervals={15}
                              dateFormat="MMMM d, yyyy h:mm aa"
                            />
                          ) : (
                            formatDateTime(task.plannedDateTime)
                          )}
                        </td>
                      )}
                      <td>
                        <div className="due-date-cell">
                          {formatDateTime(task.nextDueDateTime)}
                          {isToday && (
                            <span className="today-badge">Today</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {isEditing ? (
                            <>
                              <button
                                className="save-btn"
                                onClick={handleUpdateTask}
                                disabled={loading}
                              >
                                <FiSave /> Save
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={handleCancelEdit}
                                disabled={loading}
                              >
                                <FiX /> Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {userRole === "client" && (
                                <>
                                  <button
                                    className="edit-btn"
                                    onClick={() => handleEditClick(task)}
                                    disabled={loading}
                                  >
                                    <FiEdit />
                                  </button>
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteTask(task._id)}
                                    disabled={loading}
                                  >
                                    <FiTrash2 />
                                  </button>
                                </>
                              )}
                              {userRole === "user" && (
                                <button
                                  className="complete-btn"
                                  onClick={() => handleMarkCompleted(task._id)}
                                  disabled={loading}
                                >
                                  <FiCheckCircle /> Complete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {task.statusHistory?.find(
                          (s) => s.status === "Completed"
                        )?.completedDateTime ? (
                          formatDateTime(
                            task.statusHistory.find(
                              (s) => s.status === "Completed"
                            ).completedDateTime
                          )
                        ) : (
                          <span className="not-completed">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="no-tasks-row">
                  <td colSpan="9">
                    <div className="no-tasks-message">
                      {searchQuery.trim() || taskQuery.trim()
                        ? "No tasks found matching your search criteria."
                        : "No tasks found. Try adjusting your filters."}
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
