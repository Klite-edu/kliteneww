import React, { useState } from "react";
import "./performance.css"; // External CSS for styling
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

const Performance = () => {
    // Dummy Data
    const serverUptime = "99.8%";
    const responseTime = "320ms";

    const errorReports = [
        { service: "Auth Service", errorCode: "500", occurrences: 5, timestamp: "2024-02-13 14:30" },
        { service: "Payment API", errorCode: "404", occurrences: 3, timestamp: "2024-02-13 12:15" },
        { service: "Database", errorCode: "503", occurrences: 8, timestamp: "2024-02-12 23:45" },
    ];

    const downtimeReports = [
        { service: "API Gateway", duration: "10m", reason: "Maintenance", timestamp: "2024-02-12 03:00" },
        { service: "Cache Server", duration: "5m", reason: "Overload", timestamp: "2024-02-11 22:30" },
    ];

    const loadBalancers = [
        { name: "LB-1", status: "Healthy", requests: 1200 },
        { name: "LB-2", status: "Overloaded", requests: 2500 },
        { name: "LB-3", status: "Healthy", requests: 900 },
    ];

    const role = localStorage.getItem("role");
    const [customPermissions, setCustomPermissions] = useState(() => {
        const storedPermissions = localStorage.getItem("permissions");
        return storedPermissions ? JSON.parse(storedPermissions) : {};
    });
    return (
        <>
            <Sidebar role={role} customPermissions={customPermissions} />
            <Navbar />
            <div className="performance-container">
                <h2>⚡ System Performance & Health</h2>

                {/* Server Uptime & Response Time */}
                <div className="status-container">
                    <div className="status-card">
                        <h3>🕒 Server Uptime</h3>
                        <p className="uptime">{serverUptime}</p>
                    </div>
                    <div className="status-card">
                        <h3>⚡ Response Time</h3>
                        <p className="response-time">{responseTime}</p>
                    </div>
                </div>

                {/* Error Reports */}
                <div className="report-section">
                    <h3>🚨 Error Reports</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Error Code</th>
                                <th>Occurrences</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {errorReports.map((error, index) => (
                                <tr key={index}>
                                    <td>{error.service}</td>
                                    <td>{error.errorCode}</td>
                                    <td>{error.occurrences}</td>
                                    <td>{error.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Downtime Reports */}
                <div className="report-section">
                    <h3>⏳ Downtime Reports</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Duration</th>
                                <th>Reason</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {downtimeReports.map((downtime, index) => (
                                <tr key={index}>
                                    <td>{downtime.service}</td>
                                    <td>{downtime.duration}</td>
                                    <td>{downtime.reason}</td>
                                    <td>{downtime.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Load Balancer Status */}
                <div className="report-section">
                    <h3>⚖️ Load Balancer Status</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Requests</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadBalancers.map((lb, index) => (
                                <tr key={index} className={lb.status === "Overloaded" ? "overloaded" : "healthy"}>
                                    <td>{lb.name}</td>
                                    <td>{lb.status}</td>
                                    <td>{lb.requests}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default Performance;
