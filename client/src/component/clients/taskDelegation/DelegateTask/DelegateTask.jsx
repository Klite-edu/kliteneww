import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "./delegatetask.css";
import Sidebar from '../../../Sidebar/Sidebar';
import Navbar from '../../../Navbar/Navbar';

const DelegateTask = () => {
  const [doers, setDoers] = useState([]);
  const [selectedDoer, setSelectedDoer] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [time, setTime] = useState('');
  const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const [customPermissions, setCustomPermissions] = useState(() => {
      const storedPermissions = localStorage.getItem("permissions");
      return storedPermissions ? JSON.parse(storedPermissions) : {};
    });

  const fetchDoers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/employee/contactinfo`);
      setDoers(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchDoers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const taskData = {
      name: taskName,
      description: taskDescription,
      dueDate,
      time,
      doer: selectedDoer,
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/delegation/add`, taskData);
      if (response.status === 201) {
        alert("Task delegated successfully!");
        navigate("/delegation-tasklist");
        setSelectedDoer('');
        setTaskName('');
        setTaskDescription('');
        setDueDate('');
        setTime('');
      }
    } catch (error) {
      console.error("Error delegating task:", error);
    }
  };

  return (
    <>
    <Sidebar role={role} customPermissions={customPermissions}/>
    <Navbar/>
    <div className="delegate-wrapper">
      <form className="delegate-form" onSubmit={handleSubmit}>
        <h2>Delegate a Task</h2>

        <label htmlFor="task-name">Task Name</label>
        <input
          type="text"
          id="task-name"
          placeholder="Enter task name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          required
          />

        <label htmlFor="task-desc">Task Description</label>
        <textarea
          id="task-desc"
          placeholder="Describe the task in detail"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          required
          />

        <label htmlFor="due-date">Planned Date</label>
        <input
          type="date"
          id="due-date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          />

        <label htmlFor="time">Time</label>
        <input
          type="time"
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          />

        <label htmlFor="doer-select">Select Employee</label>
        <select
          id="doer-select"
          value={selectedDoer}
          onChange={(e) => setSelectedDoer(e.target.value)}
          required
          >
          <option value="">-- Select Employee --</option>
          {doers.map((doer) => (
            <option key={doer._id} value={doer._id}>
              {doer.fullName}
            </option>
          ))}
        </select>

        <button type="submit">Submit Task</button>
      </form>
    </div>
          </>
  );
};

export default DelegateTask;
