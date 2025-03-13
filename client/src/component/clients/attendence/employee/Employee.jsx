import React, { useState, useEffect } from "react";
import axios from "axios";

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState("");
  const [jobProfile, setJobProfile] = useState("Driver");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/\d{10}/.test(mobile)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/employees/${editingId}`, { name, jobProfile, mobile, email });
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/employees`, { name, jobProfile, mobile, email });
      }
      setName("");
      setJobProfile("Driver");
      setMobile("");
      setEmail("");
      setEditingId(null);
      fetchEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee._id);
    setName(employee.name);
    setJobProfile(employee.jobProfile);
    setMobile(employee.mobile);
    setEmail(employee.email);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/employees/${id}`);
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Employee Management</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <select value={jobProfile} onChange={(e) => setJobProfile(e.target.value)}>
          <option value="Driver">Driver</option>
          <option value="Manager">Manager</option>
          <option value="Technician">Technician</option>
          <option value="Helper">Helper</option>
          <option value="Other">Other</option>
        </select>
        <input type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">{editingId ? "Update" : "Add"} Employee</button>
      </form>
      <h2>Employee List</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Job Profile</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee._id}>
              <td>{employee._id}</td>
              <td>{employee.name}</td>
              <td>{employee.jobProfile}</td>
              <td>{employee.mobile}</td>
              <td>{employee.email}</td>
              <td>
                <button onClick={() => handleEdit(employee)}>Edit</button>
                <button onClick={() => handleDelete(employee._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Employee;
