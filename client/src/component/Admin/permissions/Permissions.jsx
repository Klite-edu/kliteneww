import React, { useState } from "react";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";
import PermissionManager from "../../configs/PermissionManager";
import "./permissions.css";

const Permisssions = ({ onSave }) => {
  const role = localStorage.getItem("role");
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
  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="permission-manager">
        <h2>Manage Sidebar Permissions</h2>
        <PermissionManager onSave={handlePermissionsSave} userRole="admin" />
      </div>
    </>
  );
};

export default Permisssions;
