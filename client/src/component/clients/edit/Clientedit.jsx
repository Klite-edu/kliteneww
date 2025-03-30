import React, { useEffect, useState } from "react";
import "./clientedit.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router";
import axios from "axios";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

// const apiUrl = "http://localhost:5000";

const Clientedit = () => {
  const { id } = useParams();
  const [client, setClient] = useState([]);
    const role = localStorage.getItem("role");
    const [customPermissions, setCustomPermissions] = useState(() => {
      const storedPermissions = localStorage.getItem("permissions");
      return storedPermissions ? JSON.parse(storedPermissions) : {};
    });
  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/${id}`);
        setClient(res.data);
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };
    fetchClientDetails();
  }, [id]);

  console.log("client", client);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/clients/update/${id}`,
        client
      );
      if (response.status === 200) {
        alert("Client updated successfully!");
      }
    } catch (error) {
      console.error("Error updating client data:", error);
      alert("Error updating client.");
    }
  };

  return (
    <div className="edit-div">
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <h3 className="Edit-head">Create Client</h3>
      <div className="Client-edit-info">
        <h4>Basic Information</h4>
        <form onSubmit={handleSubmit}>
          <div className="basic-info-edit">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              name="name"
              value={client.name}
              onChange={handleInputChange}
              placeholder="Client Name"
              required
            />
            <label htmlFor="role">Role</label>
            <input
              type="text"
              name="role"
              value={client.role}
              onChange={handleInputChange}
              placeholder="Role"
              required
            />
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              value={client.email}
              onChange={handleInputChange}
              placeholder="Email"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              value={client.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
            />
            <label htmlFor="mobileNumber">Mobile Number</label>
            <input
              type="text"
              name="mobileNumber"
              value={client.mobileNumber}
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

export default Clientedit;
