import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import AdminDashboard from "../Admin/dashboard/AdminDashboard";
import ClientDashboard from "../clients/dashboard/ClientDashboard";
import UserDashboard from "../User/dashboard/UserDashboard";
import axios from "axios";
import "./dashboard.css";
import { jwtDecode } from "jwt-decode";
const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [id, setId] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );
        const token = jwtDecode(response.data.token);
        if (!token.role) {
          navigate("/");
          return;
        }
        setRole(token.role);
        setId(token.id);
      } catch (error) {
        console.error("Error fetching role:", error);
        navigate("/");
      }
    };
    const fetchPermissions = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );
        const token = response.data.token;

        const headers = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        };

        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
          headers
        );

        setCustomPermissions(res.data.permissions || {});
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setCustomPermissions({});
      }
    };

    fetchRole();
    fetchPermissions();
  }, [navigate]);
  const handlePermissionsSave = async (permissions) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/permission/save-permissions`,
        { permissions },
        { withCredentials: true }
      );
      setCustomPermissions(permissions);
    } catch (error) {
      console.error("Error saving permissions:", error);
    }
  };
  if (!role) return <div>Loading...</div>;
  return (
    <div className="main_dashboard">
      <Sidebar role={role} customPermissions={customPermissions} />
      {role === "admin" && (
        <Navbar pageTitle="Super Admin Dashboard" role={role} />
      )}
      {role === "client" && <Navbar pageTitle="Admin Dashboard" role={role} />}
      {role === "user" && (
        <Navbar pageTitle="Employee Dashboard" role={role} id={id} />
      )}
      <div className="dashboardPanel">
        {role === "admin" && <AdminDashboard />}
        {role === "client" && (
          <ClientDashboard
            onSave={handlePermissionsSave}
            permissions={customPermissions}
          />
        )}
        {role === "user" && (
          <UserDashboard
            onSave={handlePermissionsSave}
            permissions={customPermissions}
          />
        )}
      </div>
    </div>
  );
};
export default Dashboard;
