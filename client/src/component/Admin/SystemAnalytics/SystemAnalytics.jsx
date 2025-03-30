import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import "./systemanalytics.css"; // External CSS
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

const apiTrends = [
    { period: "Daily", calls: 1500 },
    { period: "Weekly", calls: 10200 },
    { period: "Monthly", calls: 45300 },
];

const peakHours = [
    { hour: "00:00", calls: 10 },
    { hour: "06:00", calls: 50 },
    { hour: "12:00", calls: 300 },
    { hour: "18:00", calls: 600 },
    { hour: "23:00", calls: 200 },
];

const topConsumers = [
    { company: "Company A", requests: 12000 },
    { company: "Company B", requests: 8500 },
    { company: "Company C", requests: 7800 },
];

const errorRates = [
    { endpoint: "/api/login", errorRate: 2.3, responseTime: 200 },
    { endpoint: "/api/orders", errorRate: 4.1, responseTime: 350 },
    { endpoint: "/api/products", errorRate: 1.5, responseTime: 180 },
];

const storageUsage = [
    { period: "Jan", storage: 500 },
    { period: "Feb", storage: 700 },
    { period: "Mar", storage: 900 },
];

const companyStorage = [
    { company: "Company A", storage: 120 },
    { company: "Company B", storage: 85 },
    { company: "Company C", storage: 78 },
];

const featureUsage = [
    { feature: "Dashboard", clicks: 1200 },
    { feature: "Reports", clicks: 950 },
    { feature: "Settings", clicks: 450 },
    { feature: "User Management", clicks: 700 },
];

const SystemAnalytics = () => {
    const role = localStorage.getItem("role");
    const [customPermissions, setCustomPermissions] = useState(() => {
        const storedPermissions = localStorage.getItem("permissions");
        return storedPermissions ? JSON.parse(storedPermissions) : {};
    });

    return (
        <>
            <Sidebar role={role} customPermissions={customPermissions} />
            <Navbar />
            <div className="api-usage-container">
                <h2>System Usage Analytics</h2>
                {/* Peak Usage Hours */}
                <div className="usage-container">
                    <h3>📉 Peak Usage Hours</h3>
                    <LineChart width={900} height={250} data={peakHours}>
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <CartesianGrid stroke="#eee" />
                        <Line type="monotone" dataKey="calls" stroke="#007bff" />
                    </LineChart>
                </div>

                {/* Top API Consumers */}
                <div className="api-card">
                    <h3>🏢 Top API Consumers</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Requests</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topConsumers.map((company) => (
                                <tr key={company.company}>
                                    <td>{company.company}</td>
                                    <td>{company.requests.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Error Rates & Response Times */}
                <div className="errors-container">
                    <h3>⚠️ Error Rates & Response Times</h3>
                    <BarChart width={900} height={250} data={errorRates}>
                        <XAxis dataKey="endpoint" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="errorRate" fill="#ff4444" name="Error Rate (%)" />
                        <Bar dataKey="responseTime" fill="#ffbb33" name="Response Time (ms)" />
                    </BarChart>
                </div>

                {/* Database Storage Consumption */}
                <div className="storage-container">
                    <h3>Total Storage Used (Trend Over Time)</h3>
                    <LineChart width={900} height={250} data={storageUsage}>
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <CartesianGrid stroke="#eee" />
                        <Line type="monotone" dataKey="storage" stroke="#28a745" />
                    </LineChart>

                    <h3>🏢 Company-wise Storage Usage</h3>
                    <BarChart width={900} height={250} data={companyStorage}>
                        <XAxis dataKey="company" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="storage" fill="#007bff" name="Storage Used (GB)" />
                    </BarChart>

                    {/* Feature & Module Usage */}
                    <h3>📊 Most Used Features</h3>
                    <BarChart width={900} height={250} data={featureUsage}>
                        <XAxis dataKey="feature" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="clicks" fill="#17a2b8" name="Feature Clicks" />
                    </BarChart>
                </div>
            </div>
        </>
    );
};

export default SystemAnalytics;
