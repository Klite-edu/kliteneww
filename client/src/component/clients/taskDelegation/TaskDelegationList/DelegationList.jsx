import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../../../Sidebar/Sidebar";
import "./delegationlist.css";
import { FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import { IoTicketOutline } from "react-icons/io5";
import { PiNotePencilFill } from "react-icons/pi";
import { GrCompliance } from "react-icons/gr";
import RaiseTicketModal from "./RaiseTicketModal";
import Navbar from "../../../Navbar/Navbar";

const DelegationList = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [displayedTasks, setDisplayedTasks] = useState([]);
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
    revisedReason: "",
  });
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState({
    title: "",
    description: "",
    category: "Task Delegation",
    type: "Help",
    priority: "Medium",
    relatedTask: "",
    employeeName: "",
  });
  const [employees, setEmployees] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});
  const [customPermissions, setCustomPermissions] = useState({});
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchTasks = useCallback(
    async (token, role, userId, customPermissions) => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/delegation/list`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              withCredentials: true,
            },
          }
        );

        let taskList = response.data;

        if (role === "user") {
          if (
            customPermissions["Delegation List"]?.includes("Show Self Data")
          ) {
            taskList = taskList.filter(
              (task) =>
                task.doer &&
                (String(task.doer._id) === String(userId) ||
                  String(task.doer) === String(userId))
            );
          } else if (
            customPermissions["Delegation List"]?.includes("Show All Data")
          ) {
            // Show sab data (no filter)
          } else {
            // Default: Apne hi dikhao agar kuch permission nahi hai
            taskList = taskList.filter(
              (task) =>
                task.doer &&
                (String(task.doer._id) === String(userId) ||
                  String(task.doer) === String(userId))
            );
          }
        }

        setTasks(taskList);
        setFilteredTasks(taskList);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    },
    []
  );

  const fetchEmployees = useCallback(async (token) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const tokenRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );

        const userToken = tokenRes.data.token;
        if (!userToken) {
          navigate("/");
          return;
        }

        setToken(userToken);
        setUserId(tokenRes.data.userId);

        const [roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            {
              headers: { Authorization: `Bearer ${userToken}` },
              withCredentials: true,
            }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            {
              headers: { Authorization: `Bearer ${userToken}` },
              withCredentials: true,
            }
          ),
        ]);

        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};

        setRole(userRole);
        setCustomPermissions(userPermissions);

        // ✅ Fetch employees first
        await fetchEmployees(userToken);

        // ✅ Permission check here BEFORE fetching tasks
        if (
          userRole !== "client" &&
          !userPermissions["Delegation List"]?.includes("read")
        ) {
          alert("You do not have permission to see the delegation list.");
          return;
        }

        // ✅ Only if allowed, fetch tasks
        await fetchTasks(
          userToken,
          userRole,
          tokenRes.data.userId,
          userPermissions
        );
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [navigate, fetchTasks, fetchEmployees]);

  const handleSearch = useCallback(() => {
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, dateRange, tasks]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Pagination logic
  useEffect(() => {
    const calculateDisplayedTasks = () => {
      const indexOfLastTask = currentPage * tasksPerPage;
      const indexOfFirstTask = indexOfLastTask - tasksPerPage;
      const currentTasks = filteredTasks.slice(
        indexOfFirstTask,
        indexOfLastTask
      );
      setDisplayedTasks(currentTasks);
      setTotalPages(Math.ceil(filteredTasks.length / tasksPerPage));
    };

    calculateDisplayedTasks();
  }, [filteredTasks, currentPage, tasksPerPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleTasksPerPageChange = (e) => {
    setTasksPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleEditConfirmation = (task) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to edit this task?"
    );
    if (isConfirmed) {
      handleEditClick(task);
    }
  };

  const handleCompleteConfirmation = (taskId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to mark this task as completed?"
    );
    if (isConfirmed) {
      handleCompleteTask(taskId);
    }
  };

  const handleReviseConfirmation = (task) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to revise this task?"
    );
    if (isConfirmed) {
      handleReviseClick(task);
    }
  };

  const handleTicketConfirmation = (task) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to create a ticket for this task?"
    );
    if (isConfirmed) {
      handleTicketClick(task);
    }
  };

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
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );
      alert("Task updated successfully!");
      setEditingTask(null);
      fetchTasks(token);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteConfirmation = (taskId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (isConfirmed) {
      handleDeleteTask(taskId);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/delegation/delete/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );
      alert("Task deleted successfully!");
      fetchTasks(token);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setCompletedTasks((prev) => ({ ...prev, [taskId]: true }));

      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/delegation/complete/${taskId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      setCompletedTasks((prev) => {
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
      revisedReason: task.revisedReason || "",
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
            Authorization: `Bearer ${token}`,
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

  const handleTicketClick = (task) => {
    setTicketData({
      title: `${task.name}`,
      description: "",
      category: "Task Delegation",
      type: "Help",
      priority: "Medium",
      relatedTask: task._id,
      employeeName: task.doer.fullName,
    });
    setShowTicketModal(true);
  };

  const handleTicketInputChange = (e) => {
    const { name, value } = e.target;
    setTicketData({ ...ticketData, [name]: value });
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ticketRaise/add`,
        ticketData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Ticket created successfully!");
      setShowTicketModal(false);
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to create ticket. Please try again.");
    }
  };

  // Generate page numbers for pagination
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 5; // Maximum number of page buttons to show

    if (totalPages <= maxPageButtons) {
      // Show all pages if total pages are less than or equal to maxPageButtons
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show a range of pages around the current page
      const halfMaxButtons = Math.floor(maxPageButtons / 2);
      let startPage = Math.max(1, currentPage - halfMaxButtons);
      let endPage = Math.min(totalPages, currentPage + halfMaxButtons);

      if (currentPage <= halfMaxButtons) {
        endPage = maxPageButtons;
      } else if (currentPage + halfMaxButtons >= totalPages) {
        startPage = totalPages - maxPageButtons + 1;
      }

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push("...");
        }
      }

      // Add page numbers in range
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add last page and ellipsis if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push("...");
        }
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers.map((number, index) => {
      if (number === "...") {
        return (
          <span key={index} className="page-item disabled">
            {number}
          </span>
        );
      }
      return (
        <button
          key={index}
          className={`page-item ${currentPage === number ? "active" : ""}`}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </button>
      );
    });
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="delegation-wrapper">
        <h2 className="title">Task Delegation Dashboard</h2>

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
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
            />
            <label>To:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
            />
          </div>
        </div>

        <div className="dele-pagination-controls-top">
          <div className="dele-items-per-page">
            <label>Items per page:</label>
            <select value={tasksPerPage} onChange={handleTasksPerPageChange}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {displayedTasks.length > 0 ? (
          <div className="task-table-container">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Task Description</th>
                  <th>Doer</th>
                  <th>Planned Date and Time</th>
                  <th>Status</th>
                  <th>Completed At</th>
                  <th>Revised Date</th>
                  <th>Revised Time</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedTasks.map((task) => {
                  const isEditing = editingTask && editingTask._id === task._id;
                  const isRevising =
                    revisingTask && revisingTask._id === task._id;
                  const isCompleted =
                    task.status === "Completed" || completedTasks[task._id];

                  return (
                    <tr key={task._id}>
                      {isEditing ? (
                        <>
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
                              type="datetime-local"
                              name="datetime"
                              value={
                                editFormData.dueDate && editFormData.time
                                  ? `${editFormData.dueDate}T${editFormData.time}`
                                  : ""
                              }
                              onChange={(e) => {
                                const [date, time] = e.target.value.split("T");
                                setEditFormData({
                                  ...editFormData,
                                  dueDate: date,
                                  time,
                                });
                              }}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{task.name}</td>
                          <td>{task.description}</td>
                          <td>{task.doer?.fullName || "__"}</td>
                          <td>
                            {task.dueDate
                              ? `${new Date(
                                  task.dueDate
                                ).toLocaleDateString()} ${task.time || ""}`
                              : "__"}
                          </td>
                        </>
                      )}

                      <td>{task.status || "Pending"}</td>
                      <td>
                        {task.completedAt
                          ? new Date(task.completedAt).toLocaleString()
                          : "__"}
                      </td>

                      {isRevising ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <td>
                            {task.revisedDate
                              ? new Date(task.revisedDate).toLocaleDateString()
                              : "__"}
                          </td>
                          <td>{task.revisedTime || "__"}</td>
                          <td>{task.revisedReason || "__"}</td>
                        </>
                      )}

                      <td>
                        {isEditing ? (
                          <>
                            <button
                              className="btn green"
                              onClick={handleUpdateTask}
                            >
                              Save
                            </button>
                            <button
                              className="btn red"
                              onClick={() => setEditingTask(null)}
                              style={{ marginLeft: "8px" }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : isRevising ? (
                          <>
                            <button
                              className="btn green"
                              onClick={handleReviseSubmit}
                            >
                              Save
                            </button>
                            <button
                              className="btn red"
                              onClick={() => setRevisingTask(null)}
                              style={{ marginLeft: "8px" }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <>
                              {isCompleted ? (
                                <span className="completed-icon">
                                  <FaCheck
                                    style={{
                                      color: "green",
                                      fontSize: "20px",
                                    }}
                                  />
                                </span>
                              ) : (
                                <div className="d-flex">
                                  <button
                                    className="btn green"
                                    onClick={() =>
                                      handleCompleteConfirmation(task._id)
                                    }
                                  >
                                    <GrCompliance className="fw-bold fs-3" />
                                  </button>
                                  <button
                                    className="btn blue"
                                    onClick={() =>
                                      handleReviseConfirmation(task)
                                    }
                                  >
                                    <PiNotePencilFill className="fw-bold fs-3" />
                                  </button>
                                  <button
                                    className="btn btn-warning"
                                    onClick={() =>
                                      handleTicketConfirmation(task)
                                    }
                                    aria-label="Create ticket"
                                    title="Create Ticket"
                                  >
                                    <IoTicketOutline className="fw-bold fs-3" />
                                  </button>
                                </div>
                              )}
                            </>
                            {role === "client" && (
                              <div className="d-flex">
                                {customPermissions["Delegation List"]?.includes(
                                  "edit"
                                ) && (
                                  <button
                                    className="btn green me-2"
                                    onClick={() => handleEditConfirmation(task)}
                                    aria-label="Edit task"
                                    title="Edit"
                                    disabled={task.status === "Completed"}
                                  >
                                    <CiEdit className="fw-bold fs-3" />
                                  </button>
                                )}
                                {customPermissions["Delegation List"]?.includes(
                                  "edit"
                                ) && (
                                  <button
                                    className="btn red"
                                    onClick={() =>
                                      handleDeleteConfirmation(task._id)
                                    }
                                    aria-label="Delete task"
                                    title="Delete"
                                  >
                                    <MdDelete className="fw-bold fs-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ marginTop: "20px" }}>No tasks found.</p>
        )}

        {filteredTasks.length > 0 && (
          <div className="dele-pagination-controls">
            <div className="dele-pagination-info">
              Showing {(currentPage - 1) * tasksPerPage + 1} to{" "}
              {Math.min(currentPage * tasksPerPage, filteredTasks.length)} of{" "}
              {filteredTasks.length} tasks
            </div>
            <div className="dele-pagination-buttons">
              <button
                className="dele-page-item"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                &laquo;
              </button>
              <button
                className="dele-page-item"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lsaquo;
              </button>
              {renderPageNumbers()}
              <button
                className="dele-page-item"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &rsaquo;
              </button>
              <button
                className="dele-page-item"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                &raquo;
              </button>
            </div>
          </div>
        )}

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

export default DelegationList;
