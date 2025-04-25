import * as XLSX from "xlsx";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./contact.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowDown,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faTrash,
  faEye,
  faEnvelope,
  faComments,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Link } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { Dropdown } from "react-bootstrap";
import Sidebar from "../../../../../Sidebar/Sidebar";
import Navbar from "../../../../../Navbar/Navbar";

const Contact = () => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch authentication data and contacts
  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        setLoading(true);
        
        // Fetch token, role and permissions in parallel
        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-token`, { 
            withCredentials: true 
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, { 
            withCredentials: true 
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-permissions`, { 
            withCredentials: true 
          })
        ]);

        if (!tokenRes.data.token || !roleRes.data.role) {
          throw new Error("Authentication data missing");
        }

        setToken(tokenRes.data.token);
        setRole(roleRes.data.role);
        setCustomPermissions(permissionsRes.data.permissions || {});

        // Fetch contacts after successful auth
        await fetchContacts(tokenRes.data.token);
      } catch (error) {
        console.error("Authentication error:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    const fetchContacts = async (authToken) => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        setContacts(response.data);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
        if (error.response?.status === 401) {
          navigate("/");
        }
      }
    };

    fetchAuthData();
  }, [navigate]);

  const handleExport = () => {
    const exportData = contacts.map((contact) => ({
      Sno: contact._id,
      Name: contact.name,
      Email: contact.email,
      Phone: contact.phone,
      Tags: Array.isArray(contact.tags)
        ? contact.tags.join(", ")
        : contact.tags,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, "contacts_list.xlsx");
  };

  const handleDelete = async (id) => {
    try {
      if (window.confirm("Do you want to delete this employee?")) {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/employee/delete/${id}`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setContacts((prevContacts) =>
          prevContacts.filter((contact) => contact._id !== id)
        );
        alert("Employee deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      if (error.response?.status === 401) {
        navigate("/");
      } else {
        alert("Failed to delete employee");
      }
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const nameMatch = contact.fullName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const contactDate = new Date(contact.createdAt);
    const startMatch = startDate ? contactDate >= new Date(startDate) : true;
    const endMatch = endDate ? contactDate <= new Date(endDate) : true;
    return nameMatch && startMatch && endMatch;
  });

  const sortedContacts = [...filteredContacts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const pageCount = Math.ceil(sortedContacts.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentItems = sortedContacts.slice(offset, offset + itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleItemsPerPageChange = (size) => {
    setItemsPerPage(size);
    setCurrentPage(0);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="client-list-table">
        <div className="list-head-btn">
          <h4>Employee</h4>
          <div className="list-btns">
            <button className="export-btn-list" onClick={handleExport}>
              <FontAwesomeIcon icon={faCloudArrowDown} /> Export
            </button>
            <Link to="/employee-create" style={{ textDecoration: "none" }}>
              <button className="Add-btn-list">
                <FontAwesomeIcon icon={faPlus} /> Add Employee
              </button>
            </Link>
          </div>
        </div>
        <form>
          <div className="list-search">
            <div className="input-with-icon">
              <input
                type="text"
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="input-icon"
              />
            </div>
            <Dropdown className="date-range-dropdown">
              <Dropdown.Toggle variant="secondary" id="date-range-dropdown">
                Filter by Date
              </Dropdown.Toggle>
              <Dropdown.Menu className="date-range-dropdown-menu">
                <div className="date-range-picker">
                  <label>From:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <label>To:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </form>

        {contacts.length === 0 ? (
          <p>No data available.</p>
        ) : (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Sno.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((contact, index) => (
                <tr key={contact._id}>
                  <td>{offset + index + 1}</td>
                  <td>{contact.fullName}</td>
                  <td>{contact.email}</td>
                  <td>{contact.number}</td>
                  <td>{contact.designation}</td>
                  <td>Active</td>
                  <td>
                    <div className="action-buttons">
                      <Link to="">
                        <FontAwesomeIcon icon={faEnvelope} />
                      </Link>
                      <Link to="/chatbox">
                        <FontAwesomeIcon icon={faComments} />
                      </Link>
                    </div>
                  </td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="link"
                        id={`dropdown-${contact._id}`}
                        className="action-dropdown-toggle no-caret"
                      >
                        <FontAwesomeIcon icon={faEllipsisV} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          as={Link}
                          to={`/view/${contact._id}`}
                        >
                          View
                        </Dropdown.Item>
                        <Dropdown.Item
                          as={Link}
                          to={`/edit/${contact._id}`}
                        >
                          Edit
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => handleDelete(contact._id)}
                        >
                          Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="pagination">
          <ReactPaginate
            previousLabel={"Prev"}
            nextLabel={"Next"}
            pageCount={pageCount}
            onPageChange={handlePageClick}
            containerClassName={"pagination"}
            previousLinkClassName={"pagination-link"}
            nextLinkClassName={"pagination-link"}
            activeClassName={"pagination-active"}
            disabledClassName={"pagination-disabled"}
          />
          <div className="pagination-settings">
            <Dropdown>
              <Dropdown.Toggle
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "black",
                  border: "none",
                }}
                id="dropdown-basic"
              >
                {itemsPerPage} items per page
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {[5, 10, 15, 20, 50].map((size) => (
                  <Dropdown.Item
                    key={size}
                    onClick={() => handleItemsPerPageChange(size)}
                  >
                    {size} items
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
