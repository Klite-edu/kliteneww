import {
  faCircleUser,
  faGear,
  faMagnifyingGlass,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import "./navbar.css";
import axios from "axios";
const Navbar = ({ pageTitle }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [id, setId] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        const tokenRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );
        const userToken = tokenRes.data.token;

        const [roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            {
              headers: { Authorization: `Bearer ${userToken}` },
              withCredentials: true,
            }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            {
              headers: { Authorization: `Bearer ${userToken}` },
              withCredentials: true,
            }
          ),
        ]);

        setRole(roleRes.data.role);
        setCustomPermissions(permissionsRes.data.permissions || {});
        setId(userToken.id);
      } catch (err) {
        console.error("Navbar auth fetch failed:", err);
      }
    };

    fetchAuthData();
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="admin-navbar">
      <div className="nav-left">
        <h2>{pageTitle}</h2>
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="admin-icon search"
        />
        {(role === "client" ||
          customPermissions["Working Days"]?.includes("read")) && (
          <Link to="/workingday">
            <button>Working Days</button>
          </Link>
        )}
      </div>
      <div className="nav-right">
        {role == "client" && (
          <Link to="/employee">
            <FontAwesomeIcon icon={faGear} className="admin-icon gear" />
          </Link>
        )}

        <Dropdown align="end">
          <Dropdown.Toggle
            id="dropdown-custom-components"
            className="custom-dropdown-toggle"
          >
            <FontAwesomeIcon icon={faCircleUser} className="admin-icon user" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="custom-dropdown-menu">
            {role == "client" ? (
              <Dropdown.Item href="/profile">
                <FontAwesomeIcon icon={faCircleUser} /> Profile
              </Dropdown.Item>
            ) : (
              <Dropdown.Item href={`/view/${id}`}>
                <FontAwesomeIcon icon={faCircleUser} /> Profile
              </Dropdown.Item>
            )}
            <Dropdown.Item onClick={handleLogout}>
              <FontAwesomeIcon icon={faGear} /> Log out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </nav>
  );
};

export default Navbar;
