// import React, { useState, useEffect } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import applogo from "../../assets/app-logo.png";
// import {
//   faCaretDown,
//   faTachometerAlt,
//   faUsers,
//   faCog,
//   faChartBar,
//   faShoppingCart,
//   faUser,
//   faLifeRing,
//   faAngleUp,
//   faCircle,
// } from "@fortawesome/free-solid-svg-icons";
// import "./sidebar.css";

// const sidebarConfig = {
//   admin: [
//     { name: "Dashboard", path: "/dashboard", icon: faTachometerAlt },
//     {
//       name: "Manage User",
//       path: "/users",
//       icon: faUsers,
//       options: [
//         { name: "Clients", path: "/clients" },
//         { name: "Users", path: "/users" },
//       ],
//     },
//     { name: "Subscriptions", path: "/settings", icon: faCog },
//     { name: "Reports", path: "/reports", icon: faChartBar },
//     { name: "Calendar", path: "/calendar", icon: faChartBar },
//     { name: "Payment", path: "/payment", icon: faChartBar },
//     { name: "Analytics", path: "/analytics", icon: faChartBar },
//   ],
//   client: [
//     { name: "Dashboard", path: "/dashboard", icon: faTachometerAlt },
//     {
//       name: "Manage User",
//       icon: faUsers,
//       options: [
//         { name: "Users", path: "/users" },
//       ],
//     },
//     { name: "Calendar", path: "/dashboard", icon: faTachometerAlt },
//   ],
//   user: [
//     { name: "Dashboard", path: "/dashboard", icon: faTachometerAlt },
//     { name: "Support", path: "/support", icon: faLifeRing },
//   ],
// };

// const Sidebar = () => {
//   const [role, setRole] = useState("");
//   const [dropdownStates, setDropdownStates] = useState({});
//   const location = useLocation();

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       try {
//         const decodedToken = JSON.parse(atob(token.split(".")[1]));
//         setRole(decodedToken.role);
//       } catch (error) {
//         console.error("Invalid token");
//       }
//     }
//   }, []);

//   const toggleDropdown = (key) => {
//     setDropdownStates((prevState) => {
//       const updatedDropdownStates = { ...prevState, [key]: !prevState[key] };
//       return updatedDropdownStates;
//     });
//   };

//   const menuItems = sidebarConfig[role] || [];

//   return (
//     <div className="sidebar">
//       <img src={applogo} alt="App Logo" />
//       <ul>
//         {menuItems.map((item, index) => (
//           <li key={index}>
//             {item.options ? (
//               <>
//                 <div
//                   className="feat-btn-admin"
//                   onClick={() => toggleDropdown(item.name)}
//                 >
//                   <FontAwesomeIcon icon={item.icon} className="label-icon" />
//                   {item.name}
//                   <FontAwesomeIcon
//                     icon={faAngleUp}
//                     className={`rotate ${
//                       dropdownStates[item.name] ? "rotate-open" : ""
//                     }`}
//                   />
//                 </div>
//                 <ul
//                   className={`feat-show-admin ${
//                     dropdownStates[item.name] ? "show" : ""
//                   }`}
//                 >
//                   {item.options.map((option, idx) => (
//                     <li key={idx}>
//                       <Link to={option.path}>
//                         <FontAwesomeIcon icon={faCircle} className="bullet" />
//                         {option.name}
//                       </Link>
//                     </li>
//                   ))}
//                 </ul>
//               </>
//             ) : (
//               <Link
//                 to={item.path}
//                 className={location.pathname === item.path ? "active" : ""}
//               >
//                 <FontAwesomeIcon icon={item.icon} className="label-icon" />
//                 {item.name}
//               </Link>
//             )}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default Sidebar;

// import React, { useState, useEffect } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import applogo from "../../assets/logo.png";
// import "./sidebar.css";
// import { getSidebarOptions } from "../configs/SidebarPermissions";
// import { faAngleUp, faAngleDown, faCircle, faBars } from "@fortawesome/free-solid-svg-icons";

// const SidebarItem = ({ item, level = 0, dropdownStates, toggleDropdown, location, closeSidebar }) => {
//   const hasOptions = item.options && item.options.length > 0;

//   return (
//     <li>
//       {hasOptions ? (
//         <>
//           <div
//             className={`feat-btn-admin ${level > 0 ? "nested-item" : ""}`}
//             onClick={() => toggleDropdown(item.name)}
//           >
//             {item.icon && (
//               <FontAwesomeIcon icon={item.icon} className="label-icon" />
//             )}
//             <span className="item-name">{item.name}</span>
//             <FontAwesomeIcon
//               icon={dropdownStates[item.name] ? faAngleUp : faAngleDown}
//               className={`rotate ${dropdownStates[item.name] ? "rotate-open" : ""}`}
//             />
//           </div>
//           <ul
//             className={
//               level === 0
//                 ? `feat-show-admin ${dropdownStates[item.name] ? "show" : ""}`
//                 : `nested-menu ${dropdownStates[item.name] ? "show" : ""}`
//             }
//           >
//             {item.options.map((subItem, idx) => (
//               <SidebarItem
//                 key={idx}
//                 item={subItem}
//                 level={level + 1}
//                 dropdownStates={dropdownStates}
//                 toggleDropdown={toggleDropdown}
//                 location={location}
//                 closeSidebar={closeSidebar}
//               />
//             ))}
//           </ul>
//         </>
//       ) : (
//         <Link
//           to={item.path}
//           className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`}
//           onClick={closeSidebar}
//         >
//           {item.icon && (
//             <FontAwesomeIcon icon={item.icon} className="label-icon" />
//           )}
//           <span className="item-name">{item.name}</span>
//           {level > 0 && <FontAwesomeIcon icon={faCircle} className="bullet" />}
//         </Link>
//       )}
//     </li>
//   );
// };

// const Sidebar = ({ role, customPermissions }) => {
//   const [dropdownStates, setDropdownStates] = useState({});
//   const [isMobile, setIsMobile] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const location = useLocation();

//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 992);
//     };

//     handleResize();
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   useEffect(() => {
//     if (isMobile) {
//       setSidebarOpen(false);
//     }
//   }, [location, isMobile]);

//   if (!role || !customPermissions) {
//     console.error("Missing required props: role or customPermissions");
//     return null;
//   }

//   const sidebarOptions = getSidebarOptions(role, customPermissions);

//   const toggleDropdown = (key) => {
//     setDropdownStates((prevState) => ({
//       ...prevState,
//       [key]: !prevState[key],
//     }));
//   };

//   const toggleSidebar = () => {
//     setSidebarOpen(!sidebarOpen);
//   };

//   const closeSidebar = () => {
//     if (isMobile) {
//       setSidebarOpen(false);
//     }
//   };

//   return (
//     <>
//       {isMobile && (
//         <button className="mobile-menu-toggle" onClick={toggleSidebar}>
//           <FontAwesomeIcon icon={faBars} />
//         </button>
//       )}

//       <div className={`sidebar ${sidebarOpen ? 'open' : isMobile ? 'closed' : ''}`}>
//         <div className="sidebar-header">
//           <img src={applogo} alt="App Logo" className="app-logo" />
//         </div>
//         <ul className="sidebar-menu">
//           {sidebarOptions.map((item, index) => (
//             <SidebarItem
//               key={index}
//               item={item}
//               level={0}
//               dropdownStates={dropdownStates}
//               toggleDropdown={toggleDropdown}
//               location={location}
//               closeSidebar={closeSidebar}
//             />
//           ))}
//         </ul>
//       </div>
//     </>
//   );
// };

// export default Sidebar;

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

// ✅ Get Auth Headers
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
  dropdownStates,
  toggleDropdown,
  location,
  closeSidebar,
}) => {
  const hasOptions = item.options && item.options.length > 0;
  return (
    <li>
      {hasOptions ? (
        <>
          <div
            className={`feat-btn-admin ${level > 0 ? "nested-item" : ""}`}
            onClick={() => toggleDropdown(item.name)}
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
            {item.options.map((subItem, idx) => (
              <SidebarItem
                key={idx}
                item={subItem}
                level={level + 1}
                dropdownStates={dropdownStates}
                toggleDropdown={toggleDropdown}
                location={location}
                closeSidebar={closeSidebar}
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
          onClick={closeSidebar}
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
const Sidebar = ({ role }) => {
  const [dropdownStates, setDropdownStates] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarOptions, setSidebarOptions] = useState([]);
  const defaultLogoUrl = process.env.PUBLIC_URL + "/images/logo.png";
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const location = useLocation();

  const fetchLogo = async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(`${API_URL}/api/logo/list`, headers);
      if (response.data.length > 0) {
        setLogoUrl(response.data[0].imageUrl);
      } else {
        setLogoUrl(defaultLogoUrl); // Fallback to default logo
      }
    } catch (error) {
      console.error("❌ [Fetch Logo] Error:", error.message);
      setLogoUrl(defaultLogoUrl); // On error, use default
    }
  };

  useEffect(() => {
    fetchLogo();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
          const options = await getSidebarOptions(role);
          setSidebarOptions(options);
        }
        await fetchLogo();
      } catch (error) {
        console.error("❌ [Sidebar] Error:", error.message);
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
          {/* Display only the logo without upload/delete buttons */}
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
              closeSidebar={() => isMobile && setSidebarOpen(false)}
            />
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;