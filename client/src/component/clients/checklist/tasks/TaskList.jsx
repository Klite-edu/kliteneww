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
  FiUpload,
  FiEye,
} from "react-icons/fi";
import {
  FaHourglassHalf,
  FaThumbsUp
} from "react-icons/fa";
import { IoThumbsDown } from "react-icons/io5";
import { HiHandRaised } from "react-icons/hi2";

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
  const [googleToken, setGoogleToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState("");
  const [companyName, setCompanyName] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTaskForUpload, setSelectedTaskForUpload] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [selectedTaskForModification, setSelectedTaskForModification] =
    useState(null);
  const [modificationReason, setModificationReason] = useState("");
  const [newPlannedDateTime, setNewPlannedDateTime] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTaskForTicket, setSelectedTaskForTicket] = useState(null);
  const [ticketData, setTicketData] = useState({
    title: "",
    category: "Task Delegation",
    type: "Help",
    priority: "Medium",
    description: "",
  });

  const [taskStatusId, setTaskStatusId] = useState();
  const [selectedTaskId, setSelectedTaskId] = useState();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `http://localhost:5000/api/permission/get-token`,
            { withCredentials: true }
          ),
          axios.get(
            `http://localhost:5000/api/permission/get-role`,
            { withCredentials: true }
          ),
          axios.get(
            `http://localhost:5000/api/permission/get-permissions`,
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
        const currentCompanyName = decodedToken.companyName;

        setToken(userToken);
        setRole(userRole);
        setUserId(currentUserId);
        setEmployeeId(currentEmployeeId);
        setCompanyName(currentCompanyName);
        setCustomPermissions(userPermissions);

        await Promise.all([
          fetchServerDate(userToken),
          fetchEmployees(userToken),
          fetchTasks(userToken, userRole, currentUserId, currentEmployeeId),
        ]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        navigate("/");
      }
    };

    fetchInitialData();
  }, [navigate]);


  // useEffect(() => {
  //   let filtered = tasks;

  //   if (searchQuery || taskQuery || statusQuery) {
  //     filtered = tasks.filter((task) => {
  //       const employeeMatch = task.doer?.fullName
  //         ?.toLowerCase()
  //         .includes(searchQuery.toLowerCase());
  //       const taskMatch = task.taskName
  //         ?.toLowerCase()
  //         .includes(taskQuery.toLowerCase());
  //       const statusMatch =
  //         !statusQuery ||
  //         task.statusHistory?.[task.statusHistory.length - 1]?.status
  //           ?.toLowerCase()
  //           .includes(statusQuery.toLowerCase());

  //       return employeeMatch && taskMatch && statusMatch;
  //     });
  //   }

  //   setFilteredTasks(filtered);
  // }, [searchQuery, taskQuery, statusQuery, tasks]);



  useEffect(() => {
    let filtered = tasks;
  
    filtered = filtered.filter((task) => {
      const latestStatus = task.statusHistory?.length
        ? task.statusHistory[task.statusHistory.length - 1]?.status.toLowerCase()
        : "pending";
  
      const employeeMatch = task.doer?.fullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
  
      const taskMatch = task.taskName
        ?.toLowerCase()
        .includes(taskQuery.toLowerCase());
  
      const statusMatch = statusQuery
        ? latestStatus.includes(statusQuery.toLowerCase())
        : true;
  
      const dateMatch =
        (!startDate || new Date(task.nextDueDateTime) >= startDate) &&
        (!endDate || new Date(task.nextDueDateTime) <= endDate);
  
      return employeeMatch && taskMatch && statusMatch && dateMatch;
    });
  
    setFilteredTasks(filtered);
  }, [searchQuery, taskQuery, statusQuery, startDate, endDate, tasks]);
  









  const fetchServerDate = async (token) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/tasks/serverdate`,
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
        `http://localhost:5000/api/employee/contactinfo`,
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
        `http://localhost:5000/api/tasks/list`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      console.log(`task - `, res.data);

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


  // File upload functions
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const getGoogleUserToken = async (companyName) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/user/google-token`,
        {
          params: { companyName },
          withCredentials: true,
        }
      );
      return response.data.accessToken;
    } catch (error) {
      console.error(
        "Google token error:",
        error.response?.data || error.message
      );
      return null;
    }
  };


  const handleUploadClick = async (task, statusHistoryID) => {
    if (!companyName) {
      alert("Company Name missing. Please refresh the page or re-login.");
      return;
    }

    const token = await getGoogleUserToken(companyName);
    if (!token) {
      alert("No valid Google token found for this company.");
      return;
    }

    console.log(
      `\n\ntask - ${task._id} and statusHistoryID - ${statusHistoryID}\n\n`
    );
    setTaskStatusId(statusHistoryID);
    setSelectedTaskId(task._id);

    setGoogleToken(token);
    setSelectedTaskForUpload(task);
    setShowUploadModal(true);
  };


  const handleUploadSubmit = async () => {
    if (!uploadedFile || !selectedTaskForUpload) {
      alert("Please select a file and a task first.");
      return;
    }

    if (!companyName) {
      alert("Company Name missing. Please refresh the page or re-login.");
      return;
    }

    try {
      setLoading(true);
      const fileBase64 = await toBase64(uploadedFile);

      const uploadDrive = await axios.post(
        `http://localhost:5000/auth/upload`,
        {
          fileName: uploadedFile.name,
          mimeType: uploadedFile.type,
          fileData: fileBase64.split(",")[1],
        },
        { withCredentials: true }
      );

      const { fileId, viewLink } = uploadDrive.data;

      // 🔵 Print the uploaded viewLink in console
      console.log("\n\nUploaded File View Link:", viewLink);
      console.log(
        `taskStatusId - ${taskStatusId} and selectedTaskId - ${selectedTaskId}\n\n`
      );

      await axios.post(
        `http://localhost:5000/api/tasks/uploadProof/${selectedTaskForUpload._id}`,
        { fileId, viewLink, taskStatusId, selectedTaskId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      alert("Proof uploaded successfully!");
      setShowUploadModal(false);
      setUploadedFile(null);
      setSelectedTaskForUpload(null);
      fetchTasks(token, role, userId, employeeId);

    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const handleRequestValidation = async (taskId, tasksId) => {
    setTaskStatusId(tasksId);
    try {
      await axios.post(
        `http://localhost:5000/api/tasks/requestValidation/${taskId}`,
        { taskStatusId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error("Validation request error:", error);
    }
  };

  const handleAdminValidation = async (taskId, action, statusId) => {
    console.log(`\n\n task status history - ${statusId}\n\n`);

    setTaskStatusId(statusId);
    console.log();

    try {
      await axios.post(
        `http://localhost:5000/api/tasks/validate/${taskId}`,
        { action, statusId },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      alert("Validation successful");
      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error(error);
      alert("Validation failed");
    }
  };


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
      const selectedEmployee = employees.find(
        (emp) => emp.fullName === updatedTask.doerName
      );
      if (!selectedEmployee) {
        alert("Selected employee not found");
        return;
      }

      const taskData = {
        taskName: updatedTask.taskName,
        doer: selectedEmployee._id, // 👈 👈 👈 Important change
        department: updatedTask.department,
        frequency: updatedTask.frequency,
        plannedDateTime: updatedTask.plannedDateTime.toISOString(),
      };

      await axios.put(
        `http://localhost:5000/api/tasks/update/${editingTask}`,
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
        `http://localhost:5000/api/tasks/delete/${taskId}`,
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
      const currentDate = new Date().toISOString();

      await axios.put(
        `http://localhost:5000/api/tasks/markCompleted/${taskId}`,
        { selectedDateTime: currentDate },
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

  const handleRaiseTicketClick = (task) => {
    setSelectedTaskForTicket(task);
    setTicketData({
      title: task.taskName,
      category: "Task Delegation",
      type: "Help",
      priority: "Medium",
      employeeName: task.doer.fullName,
      description: `Regarding task: ${task.taskName}\nAssigned to: ${task.doer?.fullName || "Unassigned"
        }\nDue: ${formatDateTime(task.nextDueDateTime)}\n\nIssue description: `,
    });
    setShowTicketModal(true);
  };

  const handleTicketInputChange = (e) => {
    const { name, value } = e.target;
    setTicketData((prev) => ({
      ...prev,
      [name]: value,
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
        `http://localhost:5000/api/ticketRaise/add`,
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

  const getCompletedDateTime = (statusHistory) => {
    if (!statusHistory || statusHistory.length === 0) return null;
    const completedStatus = statusHistory
      .slice()
      .reverse()
      .find((status) => status.status === "Completed");
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

        <div className="task-list-controls">
          <div className="controls-left">
            <div className="search-control">
              <div className="search-input-container">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by employee name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  onChange={(e) => setTaskQuery(e.target.value)}
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
                {role !== "user" && <th>Assigned To</th>}
                <th>Department</th>
                <th>Frequency</th>
                <th>Planned Date & Time</th>
                <th>Completed At</th>
                <th>Status</th>
                <th>Validation</th>
                <th>Proof</th>
                <th>Actions</th>
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
                  const completedDateTime = getCompletedDateTime(
                    task.statusHistory
                  );

                  return task.statusHistory.map((tasks) => {
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
                            formatDateTime(tasks.date)
                          )}
                        </td>


                        <td>
                          {tasks.completedDateTime
                            ? formatDateTime(tasks.completedDateTime)
                            : "-"}
                        </td>

                        <td>
                          <StatusBadge status={tasks.status} />
                        </td>



                        <td>{tasks.validationStatus !== "Not Requested" ? tasks.validationStatus : (role === "user" && tasks.validationStatus === "Not Requested") ? tasks.validationStatus : "-"}</td>


                        <td>
                          {tasks.validationStatus === "Requested" ? (
                            tasks.url ? (
                              <a
                                href={tasks.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="proof-link"
                              >
                                <FiEye /> View
                              </a>
                            ) : (
                              "-"
                            )
                          ) : role === "user" ? (
                            tasks.url ? (
                              <a
                                href={tasks.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="proof-link"
                              >
                                <FiEye /> View
                              </a>
                            ) : (
                              "-"
                            )
                          ) : (
                            ""
                          )}
                        </td>


                        {tasks.validationStatus !== "Validated" && tasks.validationStatus !== "Rejected" ? (
                          <td>
                            <div className="action-buttons">
                              {isEditing ? (
                                <>
                                  <button
                                    className="save-btn"
                                    onClick={handleUpdateTask}
                                    disabled={loading}
                                  ><FiSave /> Save
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
                                        <FiEdit title="Edit" />
                                      </button>
                                      <button
                                        className="delete-btn"
                                        onClick={() =>
                                          handleDeleteTask(
                                            task.originalId || task._id
                                          )
                                        }
                                        disabled={loading}
                                      >
                                        <FiTrash2 title="Delete"/>
                                      </button>
                                      {tasks.validationStatus ===
                                        "Requested" && (
                                          <div className="admin-validation-actions">
                                            <button className="edit-btn" onClick={() => handleAdminValidation(task.originalId || task._id,
                                              "approve", tasks._id)}>
                                              <FaThumbsUp title="Approve Validation"/>
                                            </button>
                                            <button className="delete-btn" onClick={() => handleAdminValidation(task.originalId || task._id,
                                              "reject", tasks._id)}>
                                              <IoThumbsDown title="Reject" />
                                            </button>
                                          </div>
                                        )}
                                    </>
                                  )}

                                  {role === "user" && (
                                    <>
                                      {!tasks?.url ? (
                                        <button
                                          className="upload-btn"
                                          onClick={() =>
                                            handleUploadClick(
                                              {
                                                ...task,
                                                _id:
                                                  task.originalId || task._id,
                                              },
                                              tasks._id
                                            )
                                          }
                                        >
                                          <FiUpload title="Upload Proof"/> 
                                        </button>
                                      ) : tasks.validationStatus ===
                                        "Not Requested" ? (
                                        <button
                                          className="validation-btn"
                                          onClick={() =>
                                            handleRequestValidation(
                                              task._id,
                                              tasks._id
                                            )
                                          }
                                          title="Request Validation"
                                        >
                                          Request Validation
                                        </button>
                                      ) : (
                                        <span className="pending-validation">
                                          <FaHourglassHalf title="Pending Validation"/>
                                        </span>
                                      )}
                                      <button
                                        className="edit-btn"
                                        onClick={() =>
                                          handleRaiseTicketClick(task)
                                        }
                                        disabled={loading}
                                      >
                                        <HiHandRaised title="Raise Ticket"/>
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        ) : (
                          <td></td>
                        )}

                      </tr>
                    );
                  });
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

                      <td>{task.validationStatus || "abc-"}</td>

                      <td>
                        {task.proofDoc?.viewLink ? (
                          <a
                            href={task.proofDoc.viewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="proof-link"
                          >
                            <FiEye /> View
                          </a>
                        ) : (
                          "-"
                        )}
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
                                  {task.validationStatus === "Requested" && (
                                    <div className="admin-validation-actions">
                                      <button
                                        onClick={() =>
                                          handleAdminValidation(
                                            task._id,
                                            "approve",
                                            tasks._id
                                          )
                                        }
                                      >
                                        Approve
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                              {role === "user" && (
                                <>
                                  {!task.proofDoc ? (
                                    <button
                                      className="upload-btn"
                                      onClick={() => handleUploadClick(task)}
                                    >
                                      <FiUpload  title="Upload Proof"/> 
                                    </button>
                                  ) : task.validationStatus ===
                                    "Not Requested" ? (
                                    <button
                                      className="validation-btn"
                                      onClick={() =>
                                        handleRequestValidation(
                                          task.originalId || task._id,
                                          tasks._id
                                        )
                                      }
                                    >
                                      Request Validation
                                    </button>
                                  ) : task.validationStatus === "Requested" ? (
                                    <span className="pending-validation">
                                      Pending Validation
                                    </span>
                                  ) : (
                                    <button
                                      className="complete-btn"
                                      onClick={() =>
                                        handleMarkCompleted(
                                          task.originalId || task._id
                                        )
                                      }
                                      disabled={
                                        task.validationStatus !== "Validated"
                                      }
                                    >
                                      <FiCheckCircle /> Complete
                                    </button>
                                  )}
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

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="upload-modal">
            <div className="modal-content">
              <h3>Upload Proof Document</h3>
              <input
                type="file"
                onChange={(e) => setUploadedFile(e.target.files[0])}
              />
              <div className="upload-buttons">
                <button onClick={handleUploadSubmit}>Upload</button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setGoogleToken(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}


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