import React, { useState } from "react";
import "./security.css";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

const recentLogins = [
    { username: "john_doe", timestamp: "2025-02-12 10:30 AM", ip: "192.168.1.1", device: "Windows", status: "Success" },
    { username: "jane_smith", timestamp: "2025-02-12 09:15 AM", ip: "192.168.1.2", device: "Mac", status: "Success" },
];

const failedLogins = [
    { username: "unknown_user", timestamp: "2025-02-12 11:00 AM", ip: "192.168.1.5", device: "Linux", status: "Failed" },
    { username: "john_doe", timestamp: "2025-02-12 08:45 AM", ip: "192.168.1.3", device: "Windows", status: "Failed" },
];

const auditLogs = [
    { action: "Password Change", performedBy: "john_doe", affectedUser: "john_doe", timestamp: "2025-02-11 05:30 PM" },
    { action: "User Deactivated", performedBy: "admin", affectedUser: "jane_smith", timestamp: "2025-02-10 02:00 PM" },
];

const systemAlerts = [
    { type: "Suspicious Login", severity: "Warning", triggeredBy: "unknown_user", timestamp: "2025-02-12 11:05 AM" },
    { type: "Data Access Violation", severity: "Critical", triggeredBy: "admin", timestamp: "2025-02-10 03:20 PM" },
];

const Security = () => {
    const role = localStorage.getItem("role");
    const [customPermissions, setCustomPermissions] = useState(() => {
        const storedPermissions = localStorage.getItem("permissions");
        return storedPermissions ? JSON.parse(storedPermissions) : {};
    });
    return (
        <>
            <Sidebar role={role} customPermissions={customPermissions} />
            <Navbar />
            <div className="security-container">
                <h2>🔒 Security & Audit Logs</h2>

                {/* Recent Logins */}
                <div className="security-section">
                    <h3>📥 Recent Logins</h3>
                    <table>
                        <thead>
                            <tr><th>User</th><th>Timestamp</th><th>IP</th><th>Device</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {recentLogins.map((login, index) => (
                                <tr key={index}>
                                    <td>{login.username}</td>
                                    <td>{login.timestamp}</td>
                                    <td>{login.ip}</td>
                                    <td>{login.device}</td>
                                    <td className={login.status === "Success" ? "success" : "failed"}>{login.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Failed Login Attempts */}
                <div className="security-section">
                    <h3>❌ Failed Login Attempts</h3>
                    <table>
                        <thead>
                            <tr><th>User</th><th>Timestamp</th><th>IP</th><th>Device</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {failedLogins.map((login, index) => (
                                <tr key={index}>
                                    <td>{login.username}</td>
                                    <td>{login.timestamp}</td>
                                    <td>{login.ip}</td>
                                    <td>{login.device}</td>
                                    <td className="failed">{login.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Audit Logs */}
                <div className="security-section">
                    <h3>📝 Audit Logs</h3>
                    <table>
                        <thead>
                            <tr><th>Action</th><th>Performed By</th><th>Affected User</th><th>Timestamp</th></tr>
                        </thead>
                        <tbody>
                            {auditLogs.map((log, index) => (
                                <tr key={index}>
                                    <td>{log.action}</td>
                                    <td>{log.performedBy}</td>
                                    <td>{log.affectedUser}</td>
                                    <td>{log.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* System Alerts */}
                <div className="security-section">
                    <h3>⚠️ System Alerts</h3>
                    <table>
                        <thead>
                            <tr><th>Type</th><th>Severity</th><th>Triggered By</th><th>Timestamp</th></tr>
                        </thead>
                        <tbody>
                            {systemAlerts.map((alert, index) => (
                                <tr key={index}>
                                    <td>{alert.type}</td>
                                    <td className={alert.severity.toLowerCase()}>{alert.severity}</td>
                                    <td>{alert.triggeredBy}</td>
                                    <td>{alert.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default Security;
