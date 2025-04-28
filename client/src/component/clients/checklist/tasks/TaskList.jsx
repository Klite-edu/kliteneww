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
  console.log("Ticket data state initialized:", ticketData);
  const navigate = useNavigate();
  useEffect(() => {
    console.log("Initial data fetch useEffect triggered");
    const fetchInitialData = async () => {
      console.log("Starting fetchInitialData function");
      try {
        console.log("Fetching token, role and permissions...");
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

        console.log("Token response:", tokenRes.data);
        console.log("Role response:", roleRes.data);
        console.log("Permissions response:", permissionsRes.data);

        const userToken = tokenRes.data.token;
        console.log("User token received:", userToken);

        const userRole = roleRes.data.role;
        console.log("User role received:", userRole);

        const userPermissions = permissionsRes.data.permissions || {};
        console.log("User permissions received:", userPermissions);

        if (!userToken || !userRole) {
          console.warn("No token or role found - redirecting to home");
          navigate("/");
          return;
        }

        console.log("Decoding JWT token");
        const decodedToken = jwtDecode(userToken);
        console.log("Decoded token contents:", decodedToken);

        const currentUserId = decodedToken.userId;
        console.log("Current user ID from token:", currentUserId);

        const currentEmployeeId = decodedToken.id;
        console.log("Current employee ID from token:", currentEmployeeId);

        const currentCompanyName = decodedToken.companyName;
        console.log("Current company name from token:", currentCompanyName);

        console.log("Setting user state values");
        setToken(userToken);
        setRole(userRole);
        setUserId(currentUserId);
        setCompanyName(currentCompanyName);
        setEmployeeId(currentEmployeeId);
        setCustomPermissions(userPermissions);

        console.log("Fetching additional data in parallel");
        await Promise.all([
          fetchServerDate(userToken),
          fetchEmployees(userToken),
          fetchTasks(userToken, userRole, currentUserId, currentEmployeeId),
        ]);

        console.log("Initial data fetch completed successfully");
      } catch (error) {
        console.error("Error in fetchInitialData:", {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
        });
        navigate("/login");
      }
    };

    fetchInitialData();
  }, [navigate]);

  useEffect(() => {
    console.log("Current filter parameters:", {
      searchQuery,
      taskQuery,
      statusQuery,
      taskCount: tasks.length,
    });

    let filtered = tasks;
    console.log("Original tasks before filtering:", tasks);

    if (searchQuery || taskQuery || statusQuery) {
      console.log("Applying filters to tasks");
      filtered = tasks.filter((task) => {
        const employeeMatch = task.doer?.fullName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
        console.log(
          `Employee match for ${task.doer?.fullName}:`,
          employeeMatch
        );

        const taskMatch = task.taskName
          ?.toLowerCase()
          .includes(taskQuery.toLowerCase());
        console.log(`Task match for ${task.taskName}:`, taskMatch);

        const statusMatch =
          !statusQuery ||
          task.statusHistory?.[task.statusHistory.length - 1]?.status
            ?.toLowerCase()
            .includes(statusQuery.toLowerCase());
        console.log(
          `Status match for ${
            task.statusHistory?.[task.statusHistory.length - 1]?.status
          }:`,
          statusMatch
        );

        return employeeMatch && taskMatch && statusMatch;
      });
    }

    console.log("Filtered tasks result:", {
      originalCount: tasks.length,
      filteredCount: filtered.length,
    });
    setFilteredTasks(filtered);
  }, [searchQuery, taskQuery, statusQuery, tasks]);

  const handleUploadClick = async (task) => {
    console.group("Upload Click Handler");
    console.log("Initiating upload for task:", task._id);

    if (!companyName) {
      console.error("CompanyName not available at upload click time.");
      alert("Company Name missing. Please refresh the page or re-login.");
      console.groupEnd();
      return;
    }

    const token = await getGoogleUserToken(companyName);
    console.log("Google token result:", token ? "exists" : "null");

    if (!token) {
      console.warn("No valid Google token found");
      alert("No valid Google token found for this company.");
      console.groupEnd();
      return;
    }

    setGoogleToken(token);
    setSelectedTaskForUpload(task);
    setShowUploadModal(true);
    console.groupEnd();
  };
  const handleAdminValidation = async (taskId, action) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/validate/${taskId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      alert("Validation successful");
      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error(error);
      alert("Validation failed");
    }
  };
  const handleOpenModificationModal = (taskId) => {
    setSelectedTaskForModification(taskId); // ✨ Save the Task ID which admin is modifying
    setShowModificationModal(true); // ✨ Open the modal
  };

  const handleValidateTask = async (taskId) => {
    console.group("Validate Task Handler");
    console.log("Validating task ID:", taskId);
    try {
      console.log("Sending validation request for task:", taskId);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/validate/${taskId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      console.log("Validation successful for task:", taskId);
      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error("Validation error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      alert("Validation failed.");
    } finally {
      console.groupEnd();
    }
  };

  const getGoogleUserToken = async (companyName) => {
    console.group("Get Google Token");
    console.log("Fetching Google token for:", companyName);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/user/google-token`,
        {
          params: { companyName },
          withCredentials: true,
        }
      );

      console.log("Google token response:", response.data);
      console.groupEnd();
      return response.data.accessToken;
    } catch (error) {
      console.error(
        "Google token error:",
        error.response?.data || error.message
      );
      console.groupEnd();
      return null;
    }
  };

  const handleRequestValidation = async (taskId) => {
    console.group("Request Validation");
    console.log("Requesting validation for task:", taskId);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/requestValidation/${taskId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      console.log("Validation request successful for task:", taskId);
      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error("Validation request error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
    } finally {
      console.groupEnd();
    }
  };

  const fetchServerDate = async (token) => {
    console.group("Fetch Server Date");
    console.log("Fetching server date with token:", token);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/serverdate`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      console.log("Server date response:", res.data.currentDate);
      setServerDate(new Date(res.data.currentDate));
      console.log("Server date set:", new Date(res.data.currentDate));
    } catch (error) {
      console.error("Server date fetch error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
    } finally {
      console.groupEnd();
    }
  };
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  const fetchEmployees = async (token) => {
    console.group("Fetch Employees");
    console.log("Fetching employees with token:", token);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      console.log("Employees response count:", res.data.length);
      setEmployees(res.data);
      console.log("Employees state updated with count:", res.data.length);
    } catch (error) {
      console.error("Employees fetch error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
    } finally {
      console.groupEnd();
    }
  };

  const fetchTasks = async (token, userRole, userId, employeeId) => {
    console.group("Fetch Tasks");
    console.log("Fetch parameters:", {
      token: token ? "exists" : "missing",
      userRole,
      userId,
      employeeId,
      sorting,
      startDate,
      endDate,
    });

    try {
      setLoading(true);
      console.log("Loading state set to true");

      const params = {
        sort: sorting,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        generateFutureTasks: true,
      };
      console.log("Request params:", params);

      if (userRole === "user" && employeeId) {
        params.employeeId = employeeId;
        console.log("Added employee filter for regular user:", employeeId);
      }

      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/list`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      console.log("Tasks response count:", res.data.length);
      let taskData = res.data;

      if (userRole === "user" && employeeId) {
        console.log("Filtering tasks for regular user");
        taskData = taskData.filter(
          (task) =>
            task.doer &&
            (task.doer._id === employeeId || task.doer.id === employeeId)
        );
        console.log("Filtered tasks count:", taskData.length);
      }

      setTasks(taskData);
      console.log("Tasks state updated with count:", taskData.length);

      setFilteredTasks(taskData);
      console.log("Filtered tasks state updated with count:", taskData.length);
    } catch (error) {
      console.error("Tasks fetch error:", {
        message: error.message,
        config: error.config,
        response: error.response?.data,
      });
    } finally {
      setLoading(false);
      console.log("Loading state set to false");
      console.groupEnd();
    }
  };

  const handleUploadSubmit = async () => {
    console.group("⬆️ Upload Submission");

    if (!uploadedFile || !selectedTaskForUpload) {
      console.warn("❌ No file selected or no task selected for upload");
      alert("Please select a file and a task first.");
      console.groupEnd();
      return;
    }

    if (!companyName) {
      console.error("❌ CompanyName not available at upload submit time.");
      alert("Company Name missing. Please refresh the page or re-login.");
      console.groupEnd();
      return;
    }

    try {
      console.log("🔵 Getting fresh Google token for company:", companyName);
      const googleToken = await getGoogleUserToken(companyName);

      if (!googleToken) {
        console.warn("❌ Google token not found");
        alert("No valid Google token found for this company.");
        console.groupEnd();
        return;
      }

      console.log("🛠 Converting uploaded file to base64...");
      const fileBase64 = await toBase64(uploadedFile);

      console.log("📤 Uploading file to Google Drive...");
      const uploadDrive = await axios.post(
        `${process.env.REACT_APP_API_URL}/upload`,
        {
          fileName: uploadedFile.name,
          mimeType: uploadedFile.type,
          fileData: fileBase64.split(",")[1], // base64 header remove
        },
        {
          withCredentials: true,
        }
      );

      console.log("✅ Google Drive upload response:", uploadDrive.data);
      const { fileId, viewLink } = uploadDrive.data;

      console.log(
        "📝 Saving uploaded proof to database for task:",
        selectedTaskForUpload._id
      );
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/uploadProof/${selectedTaskForUpload._id}`,
        { fileId, viewLink },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log("✅ Proof saved successfully to database");

      alert("✅ Proof uploaded successfully!");

      setShowUploadModal(false);
      setUploadedFile(null);
      setSelectedTaskForUpload(null);

      console.log("🔄 Refreshing tasks after upload...");
      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error("❌ Upload error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      alert("Upload failed. Please try again.");
    } finally {
      console.groupEnd();
    }
  };

  const handleSearchChange = (e) => {
    console.log("Search query changed:", e.target.value);
    setSearchQuery(e.target.value);
  };

  const handleTaskNameSearchChange = (e) => {
    console.log("Task name query changed:", e.target.value);
    setTaskQuery(e.target.value);
  };

  const handleEditClick = (task) => {
    console.group("Edit Task Click");
    console.log("Editing task:", task._id);
    setEditingTask(task._id);
    console.log("Editing task ID set:", task._id);

    setUpdatedTask({
      taskName: task.taskName,
      doerName: task.doer?.fullName || "",
      department: task.department,
      frequency: task.frequency,
      plannedDateTime: new Date(task.plannedDateTime),
      nextDueDateTime: new Date(task.nextDueDateTime),
    });
    console.log("Updated task state set:", {
      taskName: task.taskName,
      doerName: task.doer?.fullName || "",
      department: task.department,
      frequency: task.frequency,
      plannedDateTime: new Date(task.plannedDateTime),
      nextDueDateTime: new Date(task.nextDueDateTime),
    });
    console.groupEnd();
  };
  const handleSubmitModification = async () => {
    if (!modificationReason || !newPlannedDateTime) {
      alert("Please provide reason and new date");
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/validate/${selectedTaskForModification}`,
        {
          action: "modification",
          modificationReason,
          newPlannedDateTime: newPlannedDateTime.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      alert("Modification submitted successfully!");
      setShowModificationModal(false);
      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error(
        "Modification Error:",
        error.response?.data || error.message
      );
      alert("Failed to submit modification request");
    }
  };
  const handleCancelEdit = () => {
    console.log("Canceling edit, resetting states");
    setEditingTask(null);
    setUpdatedTask({});
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating field ${name} with value:`, value);
    setUpdatedTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateTimeChange = (date, field) => {
    console.log(`Updating ${field} with date:`, date);
    setUpdatedTask((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleUpdateTask = async () => {
    console.group("Update Task");
    console.log("Updating task with data:", updatedTask);
    try {
      setLoading(true);
      console.log("Loading state set to true");

      console.log("Finding employee:", updatedTask.doerName);
      const employee = employees.find(
        (emp) => emp.fullName === updatedTask.doerName
      );

      if (!employee && updatedTask.doerName) {
        console.warn("Employee not found:", updatedTask.doerName);
        alert("Selected employee not found");
        console.groupEnd();
        return;
      }

      const taskData = {
        taskName: updatedTask.taskName,
        doerName: updatedTask.doerName,
        department: updatedTask.department,
        frequency: updatedTask.frequency,
        plannedDateTime: updatedTask.plannedDateTime.toISOString(),
      };
      console.log("Prepared task data for update:", taskData);

      console.log("Sending update request for task:", editingTask);
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/tasks/update/${editingTask}`,
        taskData,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      console.log("Update successful for task:", editingTask);
      alert("Task updated successfully!");

      setEditingTask(null);
      console.log("Editing task cleared");

      setUpdatedTask({});
      console.log("Updated task state cleared");

      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error("Update error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      alert("Failed to update task.");
    } finally {
      setLoading(false);
      console.log("Loading state set to false");
      console.groupEnd();
    }
  };

  const handleDeleteTask = async (taskId) => {
    console.group("Delete Task");
    if (!window.confirm("Are you sure you want to delete this task?")) {
      console.log("Delete operation canceled by user");
      console.groupEnd();
      return;
    }

    console.log("Deleting task:", taskId);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/tasks/delete/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      console.log("Delete successful for task:", taskId);
      alert("Task deleted successfully!");
      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error("Delete error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      alert("Failed to delete task.");
    } finally {
      console.groupEnd();
    }
  };

  const handleMarkCompleted = async (taskId) => {
    console.group("Mark Task Completed");
    console.log("Marking task as completed:", taskId);
    try {
      setLoading(true);
      console.log("Loading state set to true");

      const currentDate = new Date().toISOString();
      console.log("Using current date for completion:", currentDate);

      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/tasks/markCompleted/${taskId}`,
        { selectedDateTime: currentDate },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      console.log("Task marked as completed:", taskId);
      alert("Task marked as completed!");
      fetchTasks(token, role, userId, employeeId);
    } catch (error) {
      console.error("Mark completed error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      alert("Failed to update status.");
    } finally {
      setLoading(false);
      console.log("Loading state set to false");
      console.groupEnd();
    }
  };

  // Ticket related functions
  const handleRaiseTicketClick = (task) => {
    console.group("Raise Ticket Click");
    console.log("Raising ticket for task:", task._id);

    setSelectedTaskForTicket(task);
    console.log("Selected task for ticket set:", task._id);

    const ticketDescription = `Regarding task: ${task.taskName}\nAssigned to: ${
      task.doer?.fullName || "Unassigned"
    }\nDue: ${formatDateTime(task.nextDueDateTime)}\n\nIssue description: `;

    console.log("Preparing ticket data");
    setTicketData({
      title: task.taskName,
      category: "Task Delegation",
      type: "Help",
      priority: "Medium",
      employeeName: task.doer.fullName,
      description: ticketDescription,
    });
    console.log("Ticket data set:", {
      title: task.taskName,
      category: "Task Delegation",
      type: "Help",
      priority: "Medium",
      employeeName: task.doer.fullName,
      description: ticketDescription,
    });

    setShowTicketModal(true);
    console.log("Ticket modal shown");
    console.groupEnd();
  };

  const handleTicketInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating ticket field ${name} with value:`, value);
    setTicketData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTicketSubmit = async (e) => {
    console.group("Ticket Submission");
    e.preventDefault();
    console.log("Submitting ticket with data:", ticketData);
    try {
      setLoading(true);
      console.log("Loading state set to true");

      const ticketToSubmit = {
        ...ticketData,
        relatedTask: selectedTaskForTicket._id,
        raisedBy: employeeId || userId,
      };
      console.log("Complete ticket data to submit:", ticketToSubmit);

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ticketRaise/add`,
        ticketToSubmit,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      console.log("Ticket submitted successfully");
      alert("Ticket raised successfully!");

      setShowTicketModal(false);
      console.log("Ticket modal closed");
    } catch (error) {
      console.error("Ticket submission error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      alert("Failed to raise ticket.");
    } finally {
      setLoading(false);
      console.log("Loading state set to false");
      console.groupEnd();
    }
  };

  const StatusBadge = ({ status }) => {
    console.log("Rendering status badge for:", status);
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

    console.log("Status badge styles:", { bgColor, textColor });
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
    console.log("Formatting date time:", dateTimeString);
    if (!dateTimeString) {
      console.log("No date time provided, returning '-'");
      return "-";
    }
    const date = new Date(dateTimeString);
    const formatted = date.toLocaleString();
    console.log("Formatted date time:", formatted);
    return formatted;
  };

  const formatDate = (dateTimeString) => {
    console.log("Formatting date:", dateTimeString);
    if (!dateTimeString) {
      console.log("No date provided, returning '-'");
      return "-";
    }
    const date = new Date(dateTimeString);
    const formatted = date.toLocaleDateString();
    console.log("Formatted date:", formatted);
    return formatted;
  };

  const getCompletedDateTime = (statusHistory) => {
    console.log("Getting completed date time from:", statusHistory);
    if (!statusHistory || statusHistory.length === 0) {
      console.log("No status history, returning null");
      return null;
    }

    const completedStatus = statusHistory
      .slice()
      .reverse()
      .find((status) => status.status === "Completed");

    const result = completedStatus ? completedStatus.completedDateTime : null;
    console.log("Completed date time result:", result);
    return result;
  };

  // Component render logging
  console.group("Component Render");
  console.log("Current component state snapshot:", {
    tasks: {
      count: tasks.length,
      sample: tasks.length > 0 ? tasks[0] : null,
    },
    filteredTasks: {
      count: filteredTasks.length,
      sample: filteredTasks.length > 0 ? filteredTasks[0] : null,
    },
    editingTask,
    updatedTask,
    loading,
    serverDate,
    sorting,
    dateRange: {
      startDate,
      endDate,
    },
    filters: {
      searchQuery,
      taskQuery,
      statusQuery,
      isFilterOpen,
    },
    user: {
      userId,
      employeeId,
      role,
      companyName,
      permissions: customPermissions,
    },
    modals: {
      showUploadModal,
      showTicketModal,
      selectedTaskForUpload,
      selectedTaskForTicket,
    },
    ticketData,
    googleToken: googleToken ? "exists" : "null",
    uploadedFile: uploadedFile ? uploadedFile.name : "null",
  });
  console.groupEnd();
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
                <th>Validation</th>
                <th>Actions</th>
                <th>Completed At</th>
                <th>Proof</th>
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
                      <td>{task.validationStatus}</td>
                      <td>
                        {task.proofDoc?.viewLink ? (
                          <a
                            href={task.proofDoc.viewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Proof
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      {role === "client" &&
                        task.validationStatus === "Requested" && (
                          <div className="admin-validation-actions">
                            <button
                              onClick={() =>
                                handleAdminValidation(task._id, "approve")
                              }
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleOpenModificationModal(task._id)
                              }
                            >
                              Ask Modification
                            </button>
                          </div>
                        )}
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
                            </>
                          )}
                          {role === "user" && (
                            <>
                              {!task.proofDoc ? (
                                <button
                                  className="upload-btn"
                                  onClick={() => handleUploadClick(task)}
                                >
                                  Upload Proof
                                </button>
                              ) : task.validationStatus === "Not Requested" ? (
                                <button
                                  className="validation-btn"
                                  onClick={() =>
                                    handleRequestValidation(task._id)
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
                                  onClick={() => handleMarkCompleted(task._id)}
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
                // In your modal close button
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
        {showModificationModal && (
          <div className="modification-modal">
            <div className="modal-content">
              <h3>Modification Request</h3>
              <textarea
                placeholder="Enter reason for modification..."
                value={modificationReason}
                onChange={(e) => setModificationReason(e.target.value)}
              />
              <DatePicker
                selected={newPlannedDateTime}
                onChange={(date) => setNewPlannedDateTime(date)}
                placeholderText="Select new planned date"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
              />
              <div className="modal-buttons">
                <button onClick={handleSubmitModification}>Submit</button>
                <button onClick={() => setShowModificationModal(false)}>
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
