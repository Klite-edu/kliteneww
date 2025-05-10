
// // import React, { useState, useEffect } from "react";
// // import sidebarConfig from "../configs/Sidebarconfig"; // Adjust path if needed

// // const roles = ["client", "user"]; // Removed "admin" as it's unrestricted

// // const PermissionManager = ({ onSave }) => {
// //   const [permissions, setPermissions] = useState(() => {
// //     const storedPermissions = localStorage.getItem("permissions");
// //     return storedPermissions ? JSON.parse(storedPermissions) : { ...sidebarConfig };
// //   });

// //   const [userRole, setUserRole] = useState(null);

// //   useEffect(() => {
// //     const loggedInRole = localStorage.getItem("role");
// //     setUserRole(loggedInRole);
// //   }, []);

// //   const handleToggle = (role, option) => {
// //     if (role === "client" && userRole === "client" && option.name !== "user") {
// //       // Disable toggling for "client" role for their own permissions
// //       return;
// //     }

// //     setPermissions((prev) => {
// //       const updatedRolePermissions = prev[role].some((item) => item.name === option.name)
// //         ? prev[role].filter((item) => item.name !== option.name)
// //         : [...prev[role], option];

// //       return { ...prev, [role]: updatedRolePermissions };
// //     });
// //   };

// //   const handleSave = () => {
// //     onSave(permissions);
// //     localStorage.setItem("permissions", JSON.stringify(permissions));
// //   };

// //   return (
// //     <div>
// //       {roles.map((role) => (
// //         <div key={role}>
// //           <h3>{role.toUpperCase()}</h3>
// //           {sidebarConfig[role].map((option) => {
// //             // Hide "client" options if the logged-in role is "client"
// //             if (userRole === "client" && role === "client") {
// //               return null; // Don't render these options for "client" role
// //             }

// //             return (
// //               <label key={option.name}>
// //                 <input
// //                   type="checkbox"
// //                   checked={permissions[role]?.some((item) => item.name === option.name)}
// //                   onChange={() => handleToggle(role, option)}
// //                 />
// //                 {option.name}
// //               </label>
// //             );
// //           })}
// //         </div>
// //       ))}
// //       <button onClick={handleSave}>Save Permissions</button>
// //     </div>
// //   );
// // };

// // export default PermissionManager;
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import sidebarConfig from "../configs/Sidebarconfig";

// const roles = ["client", "user"];

// const PermissionManager = ({ onSave }) => {
//   const [permissions, setPermissions] = useState({ ...sidebarConfig });
//   const [userRole, setUserRole] = useState(null);

//   useEffect(() => {
//     fetchPermissions();
//     fetchRole();
//   }, []);

//   const fetchPermissions = async () => {
//     const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-permissions`, { withCredentials: true });
//     setPermissions(response.data.permissions || { ...sidebarConfig });
//   };

//   const fetchRole = async () => {
//     const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, { withCredentials: true });
//     setUserRole(response.data.role);
//   };

//   const handleToggle = (role, option) => {
//     if (role === "client" && userRole === "client" && option.name !== "user") {
//       return;
//     }

//     setPermissions((prev) => {
//       const updatedRolePermissions = prev[role].some((item) => item.name === option.name)
//         ? prev[role].filter((item) => item.name !== option.name)
//         : [...prev[role], option];

//       return { ...prev, [role]: updatedRolePermissions };
//     });
//   };

//   const handleSave = async () => {
//     await axios.post(
//       `${process.env.REACT_APP_API_URL}/api/permission/save-permissions`,
//       { permissions },
//       { withCredentials: true }
//     );
//     onSave(permissions);
//   };

//   return (
//     <div>
//       {roles.map((role) => (
//         <div key={role}>
//           <h3>{role.toUpperCase()}</h3>
//           {sidebarConfig[role].map((option) => {
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

// export default PermissionManager;




