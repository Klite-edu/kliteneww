import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../../../Sidebar/Sidebar";
import "./delegationlist.css";
import { FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import { IoTicketOutline } from "react-icons/io5";
import { BiRevision, BiTask } from "react-icons/bi";
import { GrCompliance } from "react-icons/gr";
import RaiseTicketModal from "./RaiseTicketModal";

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
    employeeName: ""
  });
  const [employees, setEmployees] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});
  const [customPermissions, setCustomPermissions] = useState({});
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const fetchTasks = useCallback(async (token) => {
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

      if (role === "user" && userId) {
        taskList = taskList.filter((task) => task.doer?._id === userId);
      }

      setTasks(taskList);
      setFilteredTasks(taskList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [role, userId]);

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

        setToken(userToken);
        setRole(userRole);
        setUserId(roleRes.data.userId);
        setCustomPermissions(userPermissions);

        await fetchEmployees(userToken);
        await fetchTasks(userToken);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        navigate("/login");
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
  }, [searchTerm, statusFilter, dateRange, tasks]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

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
      employeeName: task.doer.fullName
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

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <div className="delegation-wrapper">
        <h2 className="title">TASK DELEGATION DASHBOARD</h2>

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
                  const isEditing = editingTask && editingTask._id === task._id;
                  const isRevising = revisingTask && revisingTask._id === task._id;
                  const isCompleted = task.status === "Completed" || completedTasks[task._id];

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
                        </>
                      ) : (
                        <>
                          <td>{task.name}</td>
                          <td>{task.description}</td>
                          <td>{task.doer?.fullName || "N/A"}</td>
                          <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td>{task.time}</td>
                        </>
                      )}

                      <td>{task.status || "Pending"}</td>
                      <td>{task.completedAt ? new Date(task.completedAt).toLocaleString() : "N/A"}</td>

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
                          <td>{task.revisedDate ? new Date(task.revisedDate).toLocaleDateString() : "N/A"}</td>
                          <td>{task.revisedTime || "N/A"}</td>
                          <td>{task.revisedReason || "N/A"}</td>
                        </>
                      )}

                      <td>
                        {isEditing ? (
                          <>
                            <button className="btn green" onClick={handleUpdateTask}>Save</button>
                            <button className="btn red" onClick={() => setEditingTask(null)} style={{ marginLeft: "8px" }}>Cancel</button>
                          </>
                        ) : isRevising ? (
                          <>
                            <button className="btn green" onClick={handleReviseSubmit}>Save</button>
                            <button className="btn red" onClick={() => setRevisingTask(null)} style={{ marginLeft: "8px" }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            {role === "user" && (
                              <>
                                {isCompleted ? (
                                  <span className="completed-icon">
                                    <FaCheck style={{ color: "green", fontSize: "20px" }} />
                                  </span>
                                ) : (
                                  <div className="d-flex">
                                    <button className="btn green" onClick={() => handleCompleteTask(task._id)}>
                                      <GrCompliance className="fw-bold fs-3" />
                                    </button>
                                    <button className="btn blue" onClick={() => handleReviseClick(task)}>
                                      <BiRevision className="fw-bold fs-3" />
                                    </button>
                                    <button className="btn btn-warning" onClick={() => handleTicketClick(task)} aria-label="Create ticket" title="Create Ticket">
                                      <IoTicketOutline className="fw-bold fs-3" />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                            {role === "client" && task.status !== "Completed" && (
                              <div className="d-flex">
                                <button className="btn green me-2" onClick={() => handleEditClick(task)} aria-label="Edit task" title="Edit">
                                  <CiEdit className="fw-bold fs-3" />
                                </button>
                                <button className="btn red" onClick={() => handleDeleteTask(task._id)} aria-label="Delete task" title="Delete">
                                  <MdDelete className="fw-bold fs-3" />
                                </button>
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