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
  FiAlertCircle,
} from "react-icons/fi";
import Sidebar from "../../../Sidebar/Sidebar";
import Navbar from "../../../Navbar/Navbar";
import "./tasklist.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import RaiseTicketModal from "../../../clients/taskDelegation/TaskDelegationList/RaiseTicketModal";

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [taskQuery, setTaskQuery] = useState("");
  const [statusQuery, setStatusQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [customPermissions, setCustomPermissions] = useState({});
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState("");
  const [employeeId, setEmployeeId] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTaskForTicket, setSelectedTaskForTicket] = useState(null);
  const [ticketData, setTicketData] = useState({
    title: "",
    category: "Task Delegation",
    type: "Help",
    priority: "Medium",
    description: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            { withCredentials: true }
          ),
        ]);

        const userToken = tokenRes.data.token;
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};

        if (!userToken || !userRole) {
          navigate("/login");
          return;
        }

        const decodedToken = jwtDecode(userToken);
        const currentUserId = decodedToken.userId;
        const currentEmployeeId = decodedToken.id;

        setToken(userToken);
        setRole(userRole);
        setUserId(currentUserId);
        setEmployeeId(currentEmployeeId);
        setCustomPermissions(userPermissions);

        await Promise.all([
          fetchServerDate(userToken),
          fetchEmployees(userToken),
          fetchTasks(userToken, userRole, currentUserId, currentEmployeeId),
        ]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        navigate("/login");
      }
    };

    fetchInitialData();
  }, [navigate]);

  useEffect(() => {
    let filtered = tasks;

    if (searchQuery || taskQuery || statusQuery) {
      filtered = tasks.filter((task) => {
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
    }

    setFilteredTasks(filtered);
  }, [searchQuery, taskQuery, statusQuery, tasks]);

  const fetchServerDate = async (token) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/serverdate`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setServerDate(new Date(res.data.currentDate));
    } catch (error) {
      console.error("Error Fetching Server Date:", error);
    }
  };

  const fetchEmployees = async (token) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setEmployees(res.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTasks = async (token, userRole, userId, employeeId) => {
    try {
      setLoading(true);
      const params = {
        sort: sorting,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        generateFutureTasks: true,
      };

      if (userRole === "user" && employeeId) {
        params.employeeId = employeeId;
      }

      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/list`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      let taskData = res.data;
      if (userRole === "user" && employeeId) {
        taskData = taskData.filter(
          (task) =>
            task.doer &&
            (task.doer._id === employeeId || task.doer.id === employeeId)
        );
      }

      setTasks(taskData);
      setFilteredTasks(taskData);
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
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      alert("Task updated successfully!");
      setEditingTask(null);
      setUpdatedTask({});
      fetchTasks(token, role, userId, employeeId);
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
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      alert("Task deleted successfully!");
      fetchTasks(token, role, userId, employeeId);
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
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      alert("Task marked as completed!");
      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error("Error marking task as completed:", error);
      alert("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  // Ticket related functions
  const handleRaiseTicketClick = (task) => {
    console.log(`check list task - `, task.doer.fullName);

    setSelectedTaskForTicket(task);
    setTicketData({
      title: task.taskName,
      category: "Task Delegation",
      type: "Help",
      priority: "Medium",
      employeeName: task.doer.fullName,
      description: `Regarding task: ${task.taskName}\nAssigned to: ${task.doer?.fullName || "Unassigned"}\nDue: ${formatDateTime(task.nextDueDateTime)}\n\nIssue description: `,
    });
    setShowTicketModal(true);
  };

  const handleTicketInputChange = (e) => {
    const { name, value } = e.target;
    setTicketData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const ticketToSubmit = {
        ...ticketData,
        relatedTask: selectedTaskForTicket._id,
        raisedBy: employeeId || userId,
      };

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ticketRaise/add`,
        ticketToSubmit,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      alert("Ticket raised successfully!");
      setShowTicketModal(false);
    } catch (error) {
      console.error("Error raising ticket:", error);
      alert("Failed to raise ticket.");
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
    if (!dateTimeString) return "-";
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return "-";
    const date = new Date(dateTimeString);
    return date.toLocaleDateString();
  };

  const getCompletedDateTime = (statusHistory) => {
    if (!statusHistory || statusHistory.length === 0) return null;

    // Find the most recent completed status
    const completedStatus = statusHistory
      .slice()
      .reverse()
      .find(status => status.status === "Completed");

    return completedStatus ? completedStatus.completedDateTime : null;
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="task-list-container">
        <div className="task-list-header">
          <h2 className="task-list-title">Checklist Management</h2>
          <div className="server-date">
            <FiCalendar className="date-icon" />
            <span>
              Today's Date:{" "}
              {serverDate ? serverDate.toLocaleDateString() : "Loading..."}
            </span>
          </div>
        </div>

        <>
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
        </>

        <div className="task-list-table-container">
          <table className="task-list-table">
            <thead>
              <tr>
                <th>Task Name</th>
                {role !== "user" && <th>Assigned To</th>}
                <th>Department</th>
                <th>Frequency</th>
                {role === "client" && (
                  <>
                    <th>Planned Date & Time</th>
                  </>
                )}
                <th>Upcoming Date & Time</th>
                <th>Status</th>
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
                  const completedDateTime = getCompletedDateTime(task.statusHistory);

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
                      {role !== "user" && (
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
                      )}
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
                      {role === "client" && (
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
                        <StatusBadge status={currentStatus} />
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
                              {role === "client" && (
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
                              {role === "user" && (
                                <>
                                  <button
                                    className="complete-btn"
                                    onClick={() => handleMarkCompleted(task._id)}
                                    disabled={loading}
                                  >
                                    <FiCheckCircle /> Complete
                                  </button>

                                  <button
                                    className="edit-btn"
                                    onClick={() => handleRaiseTicketClick(task)}
                                    disabled={loading}
                                    title="Raise Ticket"
                                  >
                                    <FiAlertCircle />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {completedDateTime ? (
                          formatDateTime(completedDateTime)
                        ) : (
                          <span className="not-completed">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="no-tasks-row">
                  <td colSpan={role === "user" ? "8" : "9"}>
                    <div className="no-tasks-message">
                      {role === "user"
                        ? "No tasks assigned to you."
                        : searchQuery.trim() || taskQuery.trim()
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

        {/* Raise Ticket Modal */}
        <RaiseTicketModal
          showModal={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          onSubmit={handleTicketSubmit}
          ticketData={ticketData}
          onInputChange={handleTicketInputChange}
        />
      </div>
    </>
  );
};

export default TaskList;