import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DelegateTask = () => {
  const [doers, setDoers] = useState([]); // Employees list
  const [selectedDoer, setSelectedDoer] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [time, setTime] = useState('');
  const navigate = useNavigate();

  // Fetch employees (doers) from the database
  const fetchDoers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/employee/contactinfo`);
      console.log("res", response.data);
      setDoers(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchDoers();
  }, []);

  // Handle form submission
// DelegateTask.jsx
const handleSubmit = async (e) => {
    e.preventDefault();
    const taskData = {
      name: taskName,
      description: taskDescription,
      dueDate: dueDate,
      time: time,
      doer: selectedDoer,  // The selected employee's ID
    };
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/delegation/add`, taskData);
      if (response.status === 201) {
        alert("Task delegated successfully!");
        navigate("/delegation-tasklist");  // Navigate to the task list
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
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="task-name"><b>Task Name:</b></label><br />
        <input
          type="text"
          id="task-name"
          placeholder="Enter task name..."
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          required
        />
      </div>
      <br />

      <div>
        <label htmlFor="task-desc"><b>Task Description:</b></label><br />
        <textarea
          id="task-desc"
          placeholder="Enter the task description..."
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          required
        />
      </div>
      <br />

      <div>
        <label htmlFor="due-date"><b>Due Date:</b></label><br />
        <input
          type="date"
          id="due-date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>
      <br />

      <div>
        <label htmlFor="time"><b>Time:</b></label><br />
        <input
          type="time"
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
      </div>
      <br />

      <div>
        <label htmlFor="doer-select"><b>Select Employee:</b></label><br />
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
      </div>
      <br />

      <button type="submit">Submit Task</button>
    </form>
  );
};

export default DelegateTask;