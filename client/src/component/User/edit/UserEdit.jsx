import React, { useEffect, useState } from "react";
import "./useredit.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router";
import axios from "axios";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

// const apiUrl = "http://localhost:5000";

const UserEdit = () => {
  const { id } = useParams();
  const role = localStorage.getItem("role");
  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });
  const [user, setUser] = useState([]);
  useEffect(() => {
    const fetchuserDetails = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${id}`);
        setUser(res.data);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    fetchuserDetails();
  }, [id]);

  console.log("user", user);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/update/${id}`,
        user
      );
      if (response.status === 200) {
        alert("user updated successfully!");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      alert("Error updating user.");
    }
  };

  return (
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
              onChange={handleInputChange}
              placeholder="user Name"
              required
            />
            <label htmlFor="role">Role</label>
            <input
              type="text"
              name="role"
              value={user.role}
              onChange={handleInputChange}
              placeholder="Role"
              required
            />
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleInputChange}
              placeholder="Email"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              value={user.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
            />
            <label htmlFor="mobileNumber">Mobile Number</label>
            <input
              type="text"
              name="mobileNumber"
              value={user.mobileNumber}
              onChange={handleInputChange}
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
  );
};

export default UserEdit;
