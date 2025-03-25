import { faCircleUser, faGear, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router";
import "./navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="admin-navbar">
      <div className="nav-left">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="admin-icon search"
        />
      </div>
      <div className="nav-right">
        <FontAwesomeIcon icon={faGear} className="admin-icon gear" />

        <Dropdown align="end">
          <Dropdown.Toggle
            id="dropdown-custom-components"
            className="custom-dropdown-toggle"
          >
            <FontAwesomeIcon
              icon={faCircleUser}
              className="admin-icon user"
            />
          </Dropdown.Toggle>

          <Dropdown.Menu className="custom-dropdown-menu">
            <Dropdown.Item href="/admin/account/settings/profile">
              Profile
            </Dropdown.Item>
            <Dropdown.Item href="/" onClick={handleLogout}>
              Log out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </nav>
  );
};

export default Navbar;
