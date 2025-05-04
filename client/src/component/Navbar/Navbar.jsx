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

const Navbar = ({ pageTitle, role, id }) => {
  const navigate = useNavigate();

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
        {role == "client" && <Link to="/workingday">
          <button>Working Days</button>
        </Link>
        }
      </div>
      <div className="nav-right">
        {role == "client" && <Link to="/employee">
          <FontAwesomeIcon icon={faGear} className="admin-icon gear" />
        </Link>}

        <Dropdown align="end">
          <Dropdown.Toggle
            id="dropdown-custom-components"
            className="custom-dropdown-toggle"
          >
            <FontAwesomeIcon icon={faCircleUser} className="admin-icon user" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="custom-dropdown-menu">
            {role == "client" ?
              <Dropdown.Item href="/profile">
                <FontAwesomeIcon icon={faCircleUser} /> Profile
              </Dropdown.Item> :

              <Dropdown.Item href={`/view/${id}`}>
                <FontAwesomeIcon icon={faCircleUser} /> Profile
              </Dropdown.Item>
            }

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
