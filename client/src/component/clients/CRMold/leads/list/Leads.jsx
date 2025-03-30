import * as XLSX from "xlsx";
import React, { useEffect, useState } from "react";
import "./leads.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ProgressBar from "react-bootstrap/ProgressBar";
import {
    faCloudArrowDown,
    faMagnifyingGlass,
    faPen,
    faPlus,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Link } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { Dropdown } from "react-bootstrap";
import Sidebar from "../../../../Sidebar/Sidebar";
import Navbar from "../../../../Navbar/Navbar";

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [apiUrl, setApiUrl] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [error, setError] = useState(null);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const role = localStorage.getItem("role");
    const [customPermissions, setCustomPermissions] = useState(() => {
        const storedPermissions = localStorage.getItem("permissions");
        return storedPermissions ? JSON.parse(storedPermissions) : {};
    });

    const fetchData = async () => {
        if (!apiUrl) return;

        try {
            const response = await axios.get(apiUrl);
            const result = response.data;

            if (Array.isArray(result)) {
                setLeads(result);
            } else if (typeof result === "object") {
                const firstKey = Object.keys(result)[0];
                setLeads(Array.isArray(result[firstKey]) ? result[firstKey] : [result]);
            } else {
                setError("Unsupported API response format.");
            }
        } catch (err) {
            setError("Failed to fetch data. Check API URL or CORS issues.");
        }
    };

    const handleExport = () => {
        const exportData = leads.map((product) => ({
            Sno: product["Sno."] || "",
            Name: product.Name || "N/A",
            Category: product.Category ? product.Category.join(", ") : "N/A",
            Price: product.by_size
                ? product.by_size.map((size) => `${size.size}: ${size.price}`).join(", ")
                : "N/A",
            Quantity: product.quantity || "N/A",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
        XLSX.writeFile(workbook, "leads_list.xlsx");
    };

    const handleDelete = async (id) => {
        try {
            if (window.confirm("Do you want to delete this product?")) {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/leads/${id}`);
                setLeads(leads.filter((product) => product._id !== id));
            }
        } catch (error) {
            console.error("Error deleting product", error);
        }
    };

    const filteredData = leads.filter((item) =>
        Object.values(item).some((value) =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const pageCount = Math.ceil(filteredData.length / itemsPerPage);
    const currentItems = filteredData.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

    const handlePageClick = ({ selected }) => {
        setCurrentPage(selected);
    };

    const handleItemsPerPageChange = (size) => {
        setItemsPerPage(size);
        setCurrentPage(0);
    };

    return (
        <>
            <Sidebar role={role} customPermissions={customPermissions} />
            <Navbar />
            <div className="Contact-list-table">
                <div className="list-head-btn">
                    <h4>Leads</h4>
                    <div className="list-btns">
                        <button className="export-btn-list" onClick={handleExport}>
                            <FontAwesomeIcon icon={faCloudArrowDown} /> Export
                        </button>
                        <Link to="/crm/contacts/create" style={{ textDecoration: "none" }}>
                            <button className="Add-btn-list">
                                <FontAwesomeIcon icon={faPlus} /> Add Leads
                            </button>
                        </Link>
                    </div>
                </div>

                {/* API Input Form */}
                <form onSubmit={(e) => { e.preventDefault(); fetchData(); }}>
                    <input
                        type="text"
                        placeholder="Enter API URL"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        required
                    />
                    <button type="submit">Fetch Data</button>
                </form>

                {/* Search Bar */}
                <div className="list-lead">
                    <div className="input-with-icon">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FontAwesomeIcon icon={faMagnifyingGlass} className="input-icon" />
                    </div>
                </div>

                {/* Error Message */}
                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* Leads Table */}
                {currentItems.length > 0 ? (
                    <table className="styled-table">
                        <thead>
                            <tr>
                                {Object.keys(currentItems[0]).map((key) => (
                                    <th key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((item, index) => (
                                <tr key={index}>
                                    {Object.values(item).map((val, idx) => (
                                        <td key={idx}>{JSON.stringify(val)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No data available.</p>
                )}

                {/* Pagination */}
                <div className="pagination">
                    <ReactPaginate
                        previousLabel={"Prev"}
                        nextLabel={"Next"}
                        pageCount={pageCount}
                        onPageChange={handlePageClick}
                        containerClassName={"pagination"}
                        activeClassName={"active"}
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
                                    <Dropdown.Item key={size} onClick={() => handleItemsPerPageChange(size)}>
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

export default Leads;
