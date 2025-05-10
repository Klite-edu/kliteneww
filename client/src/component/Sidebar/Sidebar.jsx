import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleUp,
  faAngleDown,
  faCircle,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { getSidebarOptions } from "../configs/SidebarPermissions";
import "./sidebar.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getAuthHeaders = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/permission/get-token`, {
      withCredentials: true,
    });
    const token = response.data.token;
    if (!token) throw new Error("Token not found");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    };
  } catch (error) {
    console.error("❌ [Auth] Error getting auth headers:", error.message);
    return null;
  }
};

// ✅ Sidebar Item Component
const SidebarItem = ({
  item,
  level = 0,
  dropdownStates = {},
  toggleDropdown = () => {},
  location,
  closeSidebar = () => {},
  permissions = {},
  role,
}) => {
  const hasOptions = item.options && item.options.length > 0;
  const hasModuleAccess =
    role === "client" || // ⭐ Client ko sab dikhe
    (permissions &&
      permissions[item.name] &&
      (permissions[item.name].includes("read") ||
        permissions[item.name].includes("create")));

  if (!hasModuleAccess) {
    return null;
  }

  return (
    <li>
      {hasOptions ? (
        <>
          <div
            className={`feat-btn-admin ${level > 0 ? "nested-item" : ""}`}
            onClick={() => {
              console.log(`[SidebarItem] Toggling dropdown for ${item.name}`);
              toggleDropdown(item.name);
            }}
          >
            {item.icon && (
              <FontAwesomeIcon icon={item.icon} className="label-icon" />
            )}
            <span className="item-name">{item.name}</span>
            <FontAwesomeIcon
              icon={dropdownStates[item.name] ? faAngleUp : faAngleDown}
              className={`rotate ${
                dropdownStates[item.name] ? "rotate-open" : ""
              }`}
            />
          </div>
          <ul
            className={
              level === 0
                ? `feat-show-admin ${dropdownStates[item.name] ? "show" : ""}`
                : `nested-menu ${dropdownStates[item.name] ? "show" : ""}`
            }
          >
            {item.options
              .filter((subItem) => {
                if (role === "client") return true; // ⭐ Client ke liye sab subitems allow
                return (
                  permissions[subItem.name] &&
                  (permissions[subItem.name].includes("read") ||
                    permissions[subItem.name].includes("create"))
                );
              })
              .map((subItem, idx) => (
                <SidebarItem
                  key={idx}
                  item={subItem}
                  level={level + 1}
                  dropdownStates={dropdownStates}
                  toggleDropdown={toggleDropdown}
                  location={location}
                  closeSidebar={closeSidebar}
                  permissions={permissions}
                  role={role}
                />
              ))}
          </ul>
        </>
      ) : (
        <Link
          to={item.path}
          className={`sidebar-link ${
            location.pathname === item.path ? "active" : ""
          }`}
          onClick={() => {
            console.log(`[SidebarItem] Navigating to ${item.path}`);
            closeSidebar();
          }}
        >
          {item.icon && (
            <FontAwesomeIcon icon={item.icon} className="label-icon" />
          )}
          <span className="item-name">{item.name}</span>
          {level > 0 && <FontAwesomeIcon icon={faCircle} className="bullet" />}
        </Link>
      )}
    </li>
  );
};

// ✅ Main Sidebar Component
const Sidebar = ({ role, customPermissions }) => {
  console.log("[Sidebar] Initializing with role:", role);

  const [dropdownStates, setDropdownStates] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [permissions, setPermissions] = useState({});
  const [sidebarOptions, setSidebarOptions] = useState([]);
  const defaultLogoUrl = `${window.location.origin}/images/logo.png`;
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const location = useLocation();

  const fetchLogo = async () => {
    console.log("[Sidebar] Fetching logo...");
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        console.log("[Sidebar] No auth headers available, using default logo");
        return;
      }

      const response = await axios.get(`${API_URL}/api/logo/list`, headers);
      console.log("[Sidebar] Logo response:", response.data);

      if (response.data.length > 0) {
        setLogoUrl(response.data[0].imageUrl);
      } else {
        setLogoUrl(defaultLogoUrl);
      }
    } catch (error) {
      console.error("❌ [Sidebar] Error fetching logo:", error.message);
      setLogoUrl(defaultLogoUrl);
    }
  };

  useEffect(() => {
    fetchLogo();
  }, []);

  useEffect(() => {
    if (customPermissions && Object.keys(customPermissions).length > 0) {
      console.log("[Sidebar] Using customPermissions from props");
      setPermissions(customPermissions);

      // Yahan pe role ke hisab se sidebarOptions banana hai
      const buildSidebarOptions = async () => {
        if (role) {
          const options = await getSidebarOptions(role);
          console.log(
            `[Sidebar] Sidebar Options built for role: ${role}`,
            options
          );
          setSidebarOptions(options);
        }
      };
      buildSidebarOptions();
    }
  }, [customPermissions, role]);

  // useEffect(() => {
  //   fetchPermissions();
  // }, [customPermissions]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      console.log("[Sidebar] Cleanup: Removing resize listener");
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  useEffect(() => {
    const fetchSidebarOptions = async () => {
      try {
        if (role) {
          console.log(`[Sidebar] Fetching options for role: ${role}`);
          const options = await getSidebarOptions(role);
          console.log(`[Sidebar] Options received:`, options);
          setSidebarOptions(options);
        }
        await fetchLogo();
      } catch (error) {
        console.error(
          "❌ [Sidebar] Error fetching sidebar options:",
          error.message
        );
      }
    };
    fetchSidebarOptions();
  }, [role]);

  const toggleDropdown = (key) => {
    setDropdownStates((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  console.log("[Sidebar] Rendering component", {
    sidebarOptions,
    permissions,
    isMobile,
    sidebarOpen,
  });

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
      )}

      <div
        className={`sidebar ${sidebarOpen ? "open" : isMobile ? "closed" : ""}`}
      >
        <div className="sidebar-header">
          <div className="logo-display-container">
            <img src={logoUrl} alt="Company Logo" className="sidebar-logo" />
          </div>
        </div>

        <ul className="sidebar-menu">
          {sidebarOptions.map((item, index) => (
            <SidebarItem
              key={index}
              item={item}
              dropdownStates={dropdownStates}
              toggleDropdown={toggleDropdown}
              location={location}
              closeSidebar={() => {
                console.log("[Sidebar] Closing sidebar from menu item click");
                isMobile && setSidebarOpen(false);
              }}
              permissions={permissions}
              role={role}
            />
          ))}
        </ul>
      </div>
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay open" onClick={toggleSidebar} />
      )}
    </>
  );
};

export default Sidebar;
