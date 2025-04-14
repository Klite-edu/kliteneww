

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
//   const [customPermissions, setCustomPermissions] = useState(() => {
//     // Load permissions from localStorage if available
//     const storedPermissions = localStorage.getItem("permissions");
//     return storedPermissions ? JSON.parse(storedPermissions) : {};
//   });

//   const handlePermissionsSave = (permissions) => {
//     // Save permissions to localStorage
//     localStorage.setItem("permissions", JSON.stringify(permissions));
//     setCustomPermissions(permissions); // Update the custom permissions state
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
//       <Sidebar role={role} customPermissions={customPermissions} />
//       <Navbar />
//       <div className="dashboard">
//         {role === "admin" ? (
//           <AdminDashboard />
//         ) : role === "client" ? (
//           <ClientDashboard onSave={handlePermissionsSave} permissions={customPermissions} />
//         ) : (
//           <UserDashboard onSave={handlePermissionsSave} permissions={customPermissions} />
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
import AdminDashboard from "../Admin/dashboard/AdminDashboard";
import ClientDashboard from "../clients/dashboard/ClientDashboard";
import UserDashboard from "../User/dashboard/UserDashboard";
import axios from "axios";
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
          { withCredentials: true }
        );
        const userRole = response.data.role;
        if (!userRole) {
          navigate("/");
          return;
        }
        setRole(userRole);
      } catch (error) {
        console.error("Error fetching role:", error);
        navigate("/");
      }
    };

    const fetchPermissions = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
          { withCredentials: true }
        );
        setCustomPermissions(response.data.permissions || {});
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
    <div>
      <Sidebar role={role} />
      <Navbar />
      <div className="dashboard">
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
