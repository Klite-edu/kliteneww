// import React, { useState, useEffect } from "react";
// import sidebarConfig from "../../configs/Sidebarconfig";
// import axios from "axios";

// const roles = ["client", "user"]; // Removed "admin" as it's unrestricted

// const Permissions = ({ onSave }) => {
//   const [permissions, setPermissions] = useState({});
//   const [userRole, setUserRole] = useState(null);

//   useEffect(() => {
//     // Fetch the logged-in user's role from local storage
//     const loggedInRole = localStorage.getItem("role");
//     setUserRole(loggedInRole);

//     // Fetch permissions from the server
//     const fetchPermissions = async () => {
//       try {
//         const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/permission/${loggedInRole}`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });
//         setPermissions(response.data.permissions || { ...sidebarConfig });
//       } catch (error) {
//         console.error("Error fetching permissions:", error.message);
//       }
//     };

//     fetchPermissions();
//   }, []);

//   // Toggle permission for a specific role and option
//   const handleToggle = (role, option) => {
//     if (role === "client" && userRole === "client" && option.name !== "user") {
//       return; // Prevent clients from changing their own permissions
//     }

//     setPermissions((prev) => {
//       const updatedRolePermissions = prev[role]?.some((item) => item.name === option.name)
//         ? prev[role].filter((item) => item.name !== option.name)
//         : [...(prev[role] || []), option];

//       return { ...prev, [role]: updatedRolePermissions };
//     });
//   };

//   // Save permissions to the server
//   const handleSave = async () => {
//     try {
//       await axios.post(
//          `${process.env.REACT_APP_API_URL}/api/permission`,
//         { role: userRole, permissions },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );
//       alert("Permissions saved successfully!");
//     } catch (error) {
//       console.error("Error saving permissions:", error.message);
//       alert("Failed to save permissions.");
//     }
//   };

//   return (
//     <div>
//       {roles.map((role) => (
//         <div key={role}>
//           <h3>{role.toUpperCase()}</h3>
//           {sidebarConfig[role].map((option) => {
//             // Hide "client" options if the logged-in role is "client"
//             if (userRole === "client" && role === "client") {
//               return null;
//             }

//             return (
//               <label key={option.name}>
//                 <input
//                   type="checkbox"
//                   checked={permissions[role]?.some((item) => item.name === option.name)}
//                   onChange={() => handleToggle(role, option)}
//                 />
//                 {option.name}
//               </label>
//             );
//           })}
//         </div>
//       ))}
//       <button onClick={handleSave}>Save Permissions</button>
//     </div>
//   );
// };

// export default Permissions;
