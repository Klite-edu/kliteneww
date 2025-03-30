// SidebarPermissions.js (Ensure this file handles permissions safely)

import sidebarConfig from "./Sidebarconfig";

const defaultPermissions = {
  admin: [...sidebarConfig.admin],
  client: [...sidebarConfig.client],
  user: [...sidebarConfig.user],
};

export const getSidebarOptions = (role, customPermissions = {}) => {
  console.log("custom", customPermissions);
  return customPermissions[role] || defaultPermissions[role] || [];
};
