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
    plannedTime: ""
  });
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/employee/contactinfo`);
        setEmployees(res.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => ({
      ...prevTask,
      [name]: value,
    }));
    if (name === "doerName") {
      const selectedEmployee = employees.find((emp) => emp.fullName === value);
      if (selectedEmployee) {
        setTask((prevTask) => ({
          ...prevTask,
          department: selectedEmployee.designation,
        }));
      } else {
        setTask((prevTask) => ({
          ...prevTask,
          department: "",
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Combine date and time into a single datetime string
      const plannedDateTime = `${task.plannedDate}T${task.plannedTime}:00.000Z`;
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/tasks/add`, {
        ...task,
        plannedDateTime
      });
      
      alert("Task added successfully!");
      navigate("/check-tasklist");
      setTask({
        taskName: "",
        doerName: "",
        department: "",
        frequency: "",
        plannedDate: "",
        plannedTime: ""
      });
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task.");
    }
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
                  <option value="First of every month">First of every month</option>
                  <option value="Second of every month">Second of every month</option>
                  <option value="Third of every month">Third of every month</option>
                  <option value="Fourth of every month">Fourth of every month</option>
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
              <button type="button" className="cancel-btn" onClick={handleCancel}>
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