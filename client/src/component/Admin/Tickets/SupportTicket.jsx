import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import "./supportticket.css"; // External CSS
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

const issueData = [
    { id: 1, title: "Login issue", reportedBy: "John Doe", priority: "High", status: "Pending", date: "2024-02-01" },
    { id: 2, title: "Payment failure", reportedBy: "Jane Smith", priority: "Medium", status: "In Progress", date: "2024-02-05" },
    { id: 3, title: "UI Bug on dashboard", reportedBy: "Michael Lee", priority: "Low", status: "Resolved", date: "2024-02-07" },
    { id: 4, title: "Email not received", reportedBy: "Alice Brown", priority: "High", status: "Pending", date: "2024-02-08" },
];

// Calculate Issue Summary
const resolvedCount = issueData.filter(issue => issue.status === "Resolved").length;
const pendingCount = issueData.filter(issue => issue.status !== "Resolved").length;

// Data for Pie Chart
const pieData = [
    { name: "Resolved", value: resolvedCount, color: "#28a745" },
    { name: "Pending", value: pendingCount, color: "#dc3545" },
];

// Recent Complaints (last 3 issues)
const recentComplaints = issueData.slice(-3);

const SupportTickets = () => {
    const role = localStorage.getItem("role");
    const [customPermissions, setCustomPermissions] = useState(() => {
        const storedPermissions = localStorage.getItem("permissions");
        return storedPermissions ? JSON.parse(storedPermissions) : {};
    });
    return (
        <>
            <Sidebar role={role} customPermissions={customPermissions} />
            <Navbar />
            <div className="support-container">
                <h2>Support & Issue Tracking</h2>
                {/* Issue Overview - Resolved vs Pending */}
                <div className="overview-section">
                    <PieChart width={300} height={250} className="issue-overview-graph">
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>

                    {/* Resolved & Pending Issues */}
                    <div className="summary-section">
                        <div className="status-card resolved">
                            <h4>✅ Resolved Issues</h4>
                            <p>{resolvedCount}</p>
                        </div>
                        <div className="status-card pending">
                            <h4>⏳ Pending Issues</h4>
                            <p>{pendingCount}</p>
                        </div>
                    </div>
                </div>

                {/* Issue List Table */}
                <div className="issue-table">
                    <h3>📋 Issue List</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Issue Title</th>
                                <th>Reported By</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Date Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issueData.map((issue) => (
                                <tr key={issue.id}>
                                    <td>{issue.id}</td>
                                    <td>{issue.title}</td>
                                    <td>{issue.reportedBy}</td>
                                    <td>{issue.priority}</td>
                                    <td className={issue.status.toLowerCase()}>{issue.status}</td>
                                    <td>{issue.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Recent Complaints Table */}
                <div className="recent-complaints">
                    <h3>🛠 Recent Complaints</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Issue Title</th>
                                <th>Assigned To</th>
                                <th>Status</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentComplaints.map((issue) => (
                                <tr key={issue.id}>
                                    <td>{issue.id}</td>
                                    <td>{issue.title}</td>
                                    <td>{issue.reportedBy}</td>
                                    <td className={issue.status.toLowerCase()}>{issue.status}</td>
                                    <td>{issue.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default SupportTickets;
