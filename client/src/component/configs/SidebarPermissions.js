import axios from "axios";
import sidebarConfig from "./Sidebarconfig";

const defaultPermissions = {
  // admin: [...sidebarConfig.admin],
  client: [...sidebarConfig.client],
  user: [...sidebarConfig.user],
};

export const getSidebarOptions = async (role) => {
  try {
    // ✅ Pehle token lelo
    const tokenResponse = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
      { withCredentials: true }
    );
    const token = tokenResponse.data.token;

    if (!token) {
      console.error("Token not found. Returning default permissions.");
      return defaultPermissions[role];
    }

    // ✅ Authorization header bana ke API call
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    const customPermissions = response.data.permissions || {};
    return customPermissions[role] || defaultPermissions[role];
  } catch (error) {
    console.error("Error fetching sidebar options:", error);
    return defaultPermissions[role];
  }
};
