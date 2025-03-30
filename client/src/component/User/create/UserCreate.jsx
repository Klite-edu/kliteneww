import React, { useState } from "react";
import "./usercreate.css";
import axios from "axios";
import { useNavigate } from "react-router";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { Dropdown } from "react-bootstrap";
// const apiUrl = "http://localhost:5000";

const UserCreate = () => {
  const [user, setUser] = useState({
    name: "",
    role: "",
    email: "",
    password: "",
    mobileNumber: "",
    status: "Active",
  });
  const role = localStorage.getItem("role");
  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevuser) => ({
      ...prevuser,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/add`, user);
      console.log("user added:", response.data);
      localStorage.setItem("userRole", user.role); // Store role in local storage
      navigate("/users"); // Redirect to users list page after creation
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };
  

  return (
    <>
      <div className="edit-div">
        <Sidebar role={role} customPermissions={customPermissions} />
        <Navbar />
        <h3 className="Edit-head">Create user</h3>
        <div className="user-edit-info">
          <h4>Basic Information</h4>
          <form onSubmit={handleSubmit}>
            <div className="basic-info-edit">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleChange}
                placeholder="user Name"
                required
              />
              <label htmlFor="role">Role</label>
              <input
                type="text"
                name="role"
                value={user.role}
                onChange={handleChange}
                placeholder="Role"
                required
              />
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                placeholder="Email"
                required
              />
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
                value={user.password}
                onChange={handleChange}
                placeholder="Password"
                required
              />
              <label htmlFor="mobileNumber">Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                value={user.mobileNumber}
                onChange={handleChange}
                placeholder="Mobile Number"
                required
              />
            </div>
            <div className="bottom-button">
              <button className="discard-btn">
                <FontAwesomeIcon icon={faTrash} style={{ color: "red" }} />
                Discard
              </button>
              <button className="create-btn" type="submit">
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserCreate;