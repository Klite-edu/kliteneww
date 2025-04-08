// // SidebarPermissions.js (Ensure this file handles permissions safely)

// import sidebarConfig from "./Sidebarconfig";

// const defaultPermissions = {
//   admin: [...sidebarConfig.admin],
//   client: [...sidebarConfig.client],
//   user: [...sidebarConfig.user],
// };

// export const getSidebarOptions = (role, customPermissions = {}) => {
//   console.log("custom", customPermissions);
//   return customPermissions[role] || defaultPermissions[role] || [];
// };
import axios from "axios";
import sidebarConfig from "./Sidebarconfig";

const defaultPermissions = {
  admin: [...sidebarConfig.admin],
  client: [...sidebarConfig.client],
  user: [...sidebarConfig.user],
};

export const getSidebarOptions = async (role) => {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/permission/get-permissions",
      { withCredentials: true }
    );
    const customPermissions = response.data.permissions || {};
    return customPermissions[role] || defaultPermissions[role];
  } catch (error) {
    console.error("Error fetching sidebar options:", error);
    return defaultPermissions[role];
  }
};
