// import React, { useEffect } from "react";
// import { useNavigate } from "react-router-dom"; // Import useNavigate
// import Sidebar from "../Sidebar/Sidebar";
// import Navbar from "../Navbar/Navbar";
// import "./dashboard.css";
// import AdminDashboard from "../Admin/dashboard/AdminDashboard";
// import ClientDashboard from "../clients/dashboard/ClientDashboard";
// import UserDashboard from "../User/dashboard/UserDashboard";

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const role = localStorage.getItem("role"); // Get the role from localStorage
//   const token = localStorage.getItem("token"); // Get the token from localStorage

//   useEffect(() => {
//     if (!token) {
//       navigate("/"); // Redirect to login page if no token (not logged in)
//     } else if (role === "admin") {
//       // Redirect if role is admin, this will load the admin dashboard
//       navigate("/dashboard");
//     } else if (role === "client") {
//       // Redirect if role is client, this will load client-specific dashboard
//       navigate("/dashboard");
//     } else if (role === "user") {
//       // Redirect if role is user, this will load the user dashboard
//       navigate("/dashboard");
//     } else {
//       navigate("/unauthorized"); // Redirect to an unauthorized page if no valid role is found
//     }
//   }, [role, token, navigate]); // The useEffect will run if either role or token changes

//   return (
//     <div>
//       <Sidebar />
//       <Navbar />
//       <div className="dashboard">
//         <h1>{role === "admin" ? "Admin Dashboard" : role === "client" ? "Client Dashboard" : "User Dashboard"}</h1>
//         {role === "admin" ? <AdminDashboard/> : role === "client" ? <ClientDashboard/> : <UserDashboard/> }
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Sidebar from "../Sidebar/Sidebar";
// import Navbar from "../Navbar/Navbar";
// import "./dashboard.css";
// import AdminDashboard from "../Admin/dashboard/AdminDashboard";
// import ClientDashboard from "../clients/dashboard/ClientDashboard";
// import UserDashboard from "../User/dashboard/UserDashboard";

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const role = localStorage.getItem("role");
//   const token = localStorage.getItem("token");
//   const [customPermissions, setCustomPermissions] = useState({});

//   const handlePermissionsSave = (permissions) => {
//     setCustomPermissions(permissions);
//   };

//   useEffect(() => {
//     if (!token) {
//       navigate("/");
//     } else if (role === "admin" || role === "client" || role === "user") {
//       navigate("/dashboard");
//     } else {
//       navigate("/unauthorized");
//     }
//   }, [role, token, navigate]);

//   return (
//     <div>
//       <Sidebar role="admin" customPermissions={customPermissions} />
//       <Navbar />
//       <div className="dashboard">
//         <h1>
//           {role === "admin"
//             ? "Admin Dashboard"
//             : role === "client"
//             ? "Client Dashboard"
//             : "User Dashboard"}
//         </h1>
//         {role === "admin" ? (
//           <AdminDashboard />
//         ) : role === "client" ? (
//           <ClientDashboard />
//         ) : (
//           <UserDashboard />
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import "./dashboard.css";
import AdminDashboard from "../Admin/dashboard/AdminDashboard";
import ClientDashboard from "../clients/dashboard/ClientDashboard";
import UserDashboard from "../User/dashboard/UserDashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const [customPermissions, setCustomPermissions] = useState(() => {
    // Load permissions from localStorage if available
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  const handlePermissionsSave = (permissions) => {
    // Save permissions to localStorage
    localStorage.setItem("permissions", JSON.stringify(permissions));
    setCustomPermissions(permissions); // Update the custom permissions state
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
    } else if (role === "admin" || role === "client" || role === "user") {
      navigate("/dashboard");
    } else {
      navigate("/unauthorized");
    }
  }, [role, token, navigate]);

  return (
    <div>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="dashboard">
        {role === "admin" ? (
          <AdminDashboard />
        ) : role === "client" ? (
          <ClientDashboard onSave={handlePermissionsSave} permissions={customPermissions} />
        ) : (
          <UserDashboard onSave={handlePermissionsSave} permissions={customPermissions} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;


