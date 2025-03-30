import * as XLSX from "xlsx";
import React, { useEffect, useState } from "react";
import "./billings.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCloudArrowDown,
    faFileInvoiceDollar,
    faMagnifyingGlass,
    faPen,
    faPlus,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Link } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { Dropdown } from "react-bootstrap";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";
// const apiUrl = "http://localhost:5000";

const billingData = [
    { id: 1, name: "John Doe", amount: "$100", date: "2024-02-01", status: "Paid" },
    { id: 2, name: "Jane Smith", amount: "$250", date: "2024-02-05", status: "Pending" },
    { id: 3, name: "Mike Johnson", amount: "$300", date: "2024-02-10", status: "Overdue" },
    { id: 4, name: "Alice Brown", amount: "$150", date: "2024-02-15", status: "Paid" },
    { id: 5, name: "Bob Williams", amount: "$180", date: "2024-02-20", status: "Pending" },
    { id: 6, name: "Emma Wilson", amount: "$90", date: "2024-02-25", status: "Paid" },
    { id: 7, name: "David Miller", amount: "$200", date: "2024-02-28", status: "Overdue" },
];

const Billings = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const role = localStorage.getItem("role");
    const [customPermissions, setCustomPermissions] = useState(() => {
        const storedPermissions = localStorage.getItem("permissions");
        return storedPermissions ? JSON.parse(storedPermissions) : {};
    });

    const handleExport = () => {
        const exportData = billingData.map((billing) => ({
            Sno: billing._id,
            Name: billing.name,
            Status: billing.status,
            Role: billing.date,
            CreatedAt: billing.amount,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
        XLSX.writeFile(workbook, "clients_list.xlsx");
    };

    // const handleDelete = async (id) => {
    //     try {
    //         if (window.confirm("Do you want to delete this client?")) {
    //             await axios.delete(`${apiUrl}/api/clients/delete/${id}`);
    //             setClients(clients.filter((client) => client._id !== id));
    //         }
    //     } catch (error) {
    //         console.error("Error deleting client", error);
    //     }
    // };

    const filteredClients = billingData.filter((billings) =>
        billings.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pageCount = Math.ceil(filteredClients.length / itemsPerPage);
    const offset = currentPage * itemsPerPage;

    const currentItems = filteredClients.slice(offset, offset + itemsPerPage);

    const handlePageClick = ({ selected }) => {
        setCurrentPage(selected);
    };

    const handleItemsPerPageChange = (size) => {
        setItemsPerPage(size); // Update items per page
        setCurrentPage(0); // Reset to the first page
    };

    return (
        <>
            <Sidebar role={role} customPermissions={customPermissions} />
            <Navbar />
            <div className="Client-list-table">
                <div className="list-head-btn">
                    <h4>Billings</h4>
                    <div className="list-btns">
                        <button className="export-btn-list" onClick={handleExport}>
                            <FontAwesomeIcon icon={faCloudArrowDown} />
                            Export
                        </button>
                        <Link to="/clients/create" style={{ textDecoration: "none" }}>
                            <button className="Add-btn-list">
                                <FontAwesomeIcon icon={faPlus} className="add-btn-icon" />
                                Add Billings
                            </button>
                        </Link>
                    </div>
                </div>
                <form action="">
                    <div className="list-search">
                        <div className="input-with-icon">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <FontAwesomeIcon
                                icon={faMagnifyingGlass}
                                className="input-icon"
                            />
                        </div>
                    </div>
                </form>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((bill) => (
                            <tr key={bill.id}>
                                <td>{bill.id}</td>
                                <td>{bill.name}</td>
                                <td>{bill.amount}</td>
                                <td>{bill.date}</td>
                                <td>{bill.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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

export default Billings;
