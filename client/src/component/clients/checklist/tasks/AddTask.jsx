import React, { useState, useEffect } from "react";
import axios from "axios";
import "./addTask.css"; // Ensure this file is linked to apply styles
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../Sidebar/Sidebar";
const AddTask = () => {
  const [task, setTask] = useState({
    taskName: "",
    doerName: "",
    department: "",
    frequency: "",
    plannedDate: "",
  });
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();  
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
      await axios.post(`${process.env.REACT_APP_API_URL}/api/tasks/add`, task);
      alert("Task added successfully!");
      navigate("/check-tasklist")
      setTask({
        taskName: "",
        doerName: "",
        department: "",
        frequency: "",
        plannedDate: "",
      });
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task.");
    }
  };
  return (
    <>
    <div className="taskform-overlay">
      <div className="taskform-container">
        <button className="taskform-close-btn">&times;</button>
        <h2 className="taskform-title">Add Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="taskform-field">
            <label>Task Name</label>
            <input type="text" name="taskName" value={task.taskName} onChange={handleChange} required />
          </div>
          <div className="taskform-field">
            <label>Doer Name</label>
            <select name="doerName" value={task.doerName} onChange={handleChange} required>
              <option value="">Select Doer</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee.fullName}>{employee.fullName}</option>
              ))}
            </select>
          </div>
          <div className="taskform-field">
            <label>Department (Designation)</label>
            <input type="text" name="department" value={task.department} readOnly />
          </div>
          <div className="taskform-field">
            <label>Frequency</label>
            <select name="frequency" value={task.frequency} onChange={handleChange} required>
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
          <div className="taskform-field">
            <label>Planned Date</label>
            <input type="date" name="plannedDate" value={task.plannedDate} onChange={handleChange} required />
          </div>
          <div className="taskform-actions">
            <button type="button" className="cancel-btn">Cancel</button>
            <button type="submit" className="save-btn">Add Task</button>
          </div>
        </form>
      </div>
    </div>
              </>
  );
};
export default AddTask;