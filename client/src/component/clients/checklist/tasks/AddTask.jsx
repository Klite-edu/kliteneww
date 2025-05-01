import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../Sidebar/Sidebar";
import Navbar from "../../../Navbar/Navbar";
import { FiX, FiPlus } from "react-icons/fi";
import "./addTask.css";

const AddTask = () => {
  const [task, setTask] = useState({
    taskName: "",
    doerName: "",
    department: "",
    frequency: "",
    plannedDate: "",
    plannedTime: "",
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch token, role, and permissions in parallel
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

        setToken(userToken);
        setRole(userRole);
        setCustomPermissions(userPermissions);

        // Fetch employees
        const employeesRes = await axios.get(
          `http://localhost:5000/api/employee/contactinfo`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
            withCredentials: true,
          }
        );
        setEmployees(employeesRes.data);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        navigate("/login");
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => ({
      ...prevTask,
      [name]: value,
    }));

    if (name === "doerName") {
      const selectedEmployee = employees.find((emp) => emp.fullName === value);
      setTask((prevTask) => ({
        ...prevTask,
        department: selectedEmployee ? selectedEmployee.designation : "",
      }));
    }
  };

  // In the AddTask.jsx component's handleSubmit function:
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Format date and time properly to preserve timezone information
      const dateObj = new Date(`${task.plannedDate}T${task.plannedTime}`);
      const plannedDateTime = dateObj.toISOString();

      await axios.post(
        `http://localhost:5000/api/tasks/add`,
        {
          ...task,
          plannedDateTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      alert("Task added successfully!");
      navigate("/check-tasklist");
      resetForm();
    } catch (error) {
      console.error("Error adding task:", error);
      alert(error.response?.data?.message || "Failed to add task.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTask({
      taskName: "",
      doerName: "",
      department: "",
      frequency: "",
      plannedDate: "",
      plannedTime: "",
    });
  };

  const handleCancel = () => {
    navigate("/check-tasklist");
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="add-task-container">
        <div className="add-task-card">
          <div className="add-task-header">
            <h2 className="add-task-title">Add New Task</h2>
            <button className="add-task-close-btn" onClick={handleCancel}>
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="add-task-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Task Name</label>
                <input
                  type="text"
                  name="taskName"
                  value={task.taskName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Doer Name</label>
                <select
                  name="doerName"
                  value={task.doerName}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Select Doer</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee.fullName}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department (Designation)</label>
                <input
                  type="text"
                  name="department"
                  value={task.department}
                  className="form-input"
                  readOnly
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select
                  name="frequency"
                  value={task.frequency}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Select Frequency</option>
                  <option value="Daily">Daily</option>
                  <option value="Alternate Days">Alternate Days</option>
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
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Planned Date</label>
                <input
                  type="date"
                  name="plannedDate"
                  value={task.plannedDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Planned Time</label>
                <input
                  type="time"
                  name="plannedTime"
                  value={task.plannedTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                <FiPlus /> Add Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTask;
