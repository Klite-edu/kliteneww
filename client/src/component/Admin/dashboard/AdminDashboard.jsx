// import React, { useEffect, useState } from "react";
// import "./admindashboard.css";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faBuilding, faUsers } from "@fortawesome/free-solid-svg-icons";
// import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
// import "react-circular-progressbar/dist/styles.css";
// import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid } from "recharts";
// import axios from "axios";


// const AdminDashboard = () => {

//   const [totalClients, setTotalClients] = useState(0);
//   const [totalUsers, setTotalUsers] = useState(0);
//   const [activeClients, setActiveClients] = useState(0);
//   const [activeUsers, setActiveUsers] = useState(0);
//   const [revenueData, setRevenueData] = useState([]);
//   const [subscriptionDataBar, setSubscriptionDataBar] = useState([]);
//   const [totalImpressions, setTotalImpressions] = useState(0);
//   const [transactions, setTransactions] = useState([]);
//   console.log("revenuedata", revenueData);
//   const [clientData, setClientData] = useState([]);
//   console.log("clientdata", clientData);

//   const loggedInEmail = localStorage.getItem("email");

//   useEffect(() => {
//     // Fetch total clients and active clients data from the backend
//     const fetchData = async () => {
//       try {
//         const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/total-clients`);
//         setTotalClients(response.data.totalClients);
//         setActiveClients(response.data.activeClients);
//       } catch (error) {
//         console.error("Error fetching total clients:", error);
//       }
//     };

//     const fetchImpressions = async () => {
//       try {
//         const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/totalimpressions`);
//         setTotalImpressions(response.data?.totalImpressions || 0); // Ensure a valid number
//       } catch (error) {
//         console.error("Error fetching impressions:", error);
//       }
//     };

//     // Fetch monthly revenue data from the backend
//     const fetchRevenueData = async () => {
//       try {
//         const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/monthlyrevenue`);
//         console.log("Raw revenue data:", response.data);

//         // Get the current year dynamically
//         const currentYear = new Date().getFullYear();

//         // Define all months for the current year
//         const allMonths = Array.from({ length: 12 }, (_, index) => {
//           const date = new Date(currentYear, index, 1); // Set month and year
//           return date.toLocaleString("default", { month: "short", year: "numeric" });
//         });

//         // Filter out only data for the current year
//         const rawRevenueData = response.data.revenueData || {};
//         const formattedData = allMonths
//           .filter((month) => month.includes(currentYear)) // Only keep current year data
//           .map((month) => ({
//             month,
//             revenue: rawRevenueData[month] || 0, // Use 0 if no revenue data
//           }));

//         console.log("Formatted revenue data for the current year:", formattedData);
//         setRevenueData(formattedData);
//       } catch (error) {
//         console.error("Error fetching revenue data:", error);
//       }
//     };

//     const fetchSubscriptionData = async () => {
//       try {
//         const response = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/mostPurchasedPlans`); // Replace with your API route
//         const data = await response.json();
//         setSubscriptionDataBar(data);
//       } catch (error) {
//         console.error("Error fetching subscription data:", error);
//       }
//     };
//     const fetchTransactions = async () => {
//       try {
//         const response = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/transactionData`); // Replace with your API route
//         const data = await response.json();
//         setTransactions(data);
//       } catch (error) {
//         console.error("Error fetching transactions:", error);
//       }
//     };

//     const fetchClients = async () => {
//       try {
//         const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/clientsubscriptions`);
//         console.log("✅ All Clients Response:", response.data);
//         setClientData(response.data);
//       } catch (error) {
//         console.error("❌ Error fetching clients:", error);
//       }
//     };
//     fetchTransactions();
//     fetchSubscriptionData();
//     fetchData();
//     fetchImpressions();
//     fetchClients();
//     fetchRevenueData();
//   }, []);

//   const data = [
//     { label: "Total Clients", value: totalClients, icon: faBuilding },
//     { label: "Active Clients", value: activeClients, icon: faBuilding },
//     { label: "Total Users", value: totalUsers, icon: faUsers },
//     { label: "Active Users", value: activeUsers, icon: faUsers },
//   ];

//   const subscriptionData = [
//     { month: "Jan", newSubs: 500, refund: 200 },
//     { month: "Feb", newSubs: 700, refund: 300 },
//     { month: "Mar", newSubs: 800, refund: 250 },
//     { month: "Apr", newSubs: 650, refund: 400 },
//     { month: "May", newSubs: 900, refund: 350 },
//   ];

//   const systemUsageData = {
//     totalTenants: 50,
//     activeTenants: 40,
//     inactiveTenants: 10,
//     apiCallsToday: 12000,
//     storageUsed: "750GB / 1TB",
//     topUsedModule: "Billing",
//     apiTrends: [
//       { day: "Mon", calls: 4000 },
//       { day: "Tue", calls: 6000 },
//       { day: "Wed", calls: 7000 },
//       { day: "Thu", calls: 8000 },
//       { day: "Fri", calls: 5000 },
//       { day: "Sat", calls: 3000 },
//       { day: "Sun", calls: 4500 },
//     ],
//     storageConsumption: [
//       { tenant: "Tenant A", usage: 120 },
//       { tenant: "Tenant B", usage: 180 },
//       { tenant: "Tenant C", usage: 90 },
//       { tenant: "Tenant D", usage: 240 },
//       { tenant: "Tenant E", usage: 160 },
//     ],
//     mostUsedModules: [
//       { module: "Billing", percentage: 35 },
//       { module: "User Management", percentage: 25 },
//       { module: "Reports", percentage: 20 },
//       { module: "Notifications", percentage: 15 },
//       { module: "Support", percentage: 5 },
//     ],
//     tenantList: [
//       { id: 1, name: "Alpha Inc.", status: "Active", apiCalls: 3000, storage: "120GB", topModule: "Billing" },
//       { id: 2, name: "Beta Corp.", status: "Active", apiCalls: 2500, storage: "90GB", topModule: "Reports" },
//       { id: 3, name: "Gamma LLC", status: "Inactive", apiCalls: 1200, storage: "60GB", topModule: "User Management" },
//       { id: 4, name: "Delta Ltd.", status: "Active", apiCalls: 4000, storage: "180GB", topModule: "Notifications" },
//     ]
//   };


//   const [issues, setIssues] = useState([
//     {
//       id: 101,
//       client: "Alpha Inc.",
//       type: "API Failure",
//       priority: "🔴 Critical",
//       status: "Open",
//       assignedTo: "John Doe",
//       reportedDate: "2025-02-13",
//       expectedResolution: "2025-02-15",
//     },
//     {
//       id: 102,
//       client: "Beta Corp.",
//       type: "Login Issue",
//       priority: "🟠 High",
//       status: "In Progress",
//       assignedTo: "Jane Smith",
//       reportedDate: "2025-02-12",
//       expectedResolution: "2025-02-14",
//     },
//     {
//       id: 103,
//       client: "Gamma LLC",
//       type: "Slow Performance",
//       priority: "🟡 Medium",
//       status: "Pending",
//       assignedTo: "Michael Lee",
//       reportedDate: "2025-02-10",
//       expectedResolution: "2025-02-16",
//     },
//   ]);

//   return (
//     <div className="dashboard">
//       {/* Client and User Data Blocks */}
//       <div className="dashboard-graphs">
//         {data.map((item, index) => (
//           <div className="block-data" key={index}>
//             <FontAwesomeIcon icon={item.icon} className="icon-client" />
//             <h3>{item.label}</h3>
//             <div className="bar-progress">
//               <h5>{((item.value / (data[0].value || 1))).toFixed(1)}%</h5>
//               <p>{item.value}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Revenue Bar Chart */}
//       <div className="revenue-subCancel">
//         <div className="revenue-chart">
//           <h3>Monthly Revenue</h3>
//           <div className="revenue-container">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={revenueData}>
//                 <XAxis dataKey="month" className="axis-label" />
//                 <YAxis className="axis-label" />
//                 <Tooltip className="tooltip-style" />
//                 <Bar dataKey="revenue" fill="#3e98c7" barSize={50} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//         <div className="subscription-chart">
//           <h3>New Subscriptions vs refund</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={subscriptionData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="newSubs" fill="#4CAF50" name="New Subscriptions" barSize={50} />
//               <Bar dataKey="refund " fill="#F44336" name="refund" barSize={50} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//       <div className="admin-sub-recent">
//         <div className="top-subscription-chart">
//           <h3>Most Purchased Subscription Plans</h3>
//           <PieChart width={300} height={300}>
//             <Pie
//               data={subscriptionDataBar}
//               cx="50%"
//               cy="50%"
//               innerRadius={70} // Creates a circular progress effect
//               outerRadius={100}
//               fill="#8884d8"
//               paddingAngle={3}
//               dataKey="value"
//             >
//               {subscriptionDataBar.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={entry.color} />
//               ))}
//             </Pie>
//             <Tooltip />
//             <Legend />
//           </PieChart>
//         </div>
//         <div className="transaction-table">
//           <div className="recent-transHead">
//             <h3>Recent Transactions</h3>
//             <button>View All</button>
//           </div>
//           <hr style={{ marginBottom: "0" }} />
//           <div>
//             {transactions.map((transaction, idx) => (
//               <div key={transaction.id} className="transaction-item">
//                 <div className="recent-transaction">
//                   <p>{transaction.id}</p>
//                   <div className="trans-name-date">
//                     <h5>{transaction.name}</h5>
//                     <p>{transaction.date}</p>
//                   </div>
//                   <div className="trans-plan-price">
//                     <p>{transaction.plan}</p>
//                     <p>{transaction.price}</p>
//                   </div>
//                 </div>
//                 {idx !== transactions.length - 1 && <hr />}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//       <div className="subscription-container">
//         <h3>Subscription Expirations & Renewals</h3>
//         {clientData.map((sub) => (
//           <div className={`subscription-entry ${sub.status.toLowerCase()}`} key={sub.id}>
//             <p>{sub.id}</p>
//             <div className="client-info">
//               <h5>{sub.fullName}</h5>
//               <p>{sub.subscription.endDate}</p>
//             </div>
//             <div className="plan-details">
//               <p>{sub.selectedPlan}</p>
//               <p>{sub.planPrice}</p>
//             </div>
//             <span className={`status-badge ${sub.status.toLowerCase()}`}>{sub.subscription.status}</span>
//           </div>
//         ))}
//       </div>
//       <div className="analytics-container">
//         {/* KPI Cards */}
//         <div className="kpi-cards">
//           <div className="kpi-card">
//             <h4>Impressions</h4>
//             <p>{totalImpressions}</p>
//           </div>
//           <div className="kpi-card">
//             <h4>Active Tenants</h4>
//             <p>{systemUsageData.activeTenants} / {systemUsageData.totalTenants}</p>
//           </div>
//           <div className="kpi-card">
//             <h4>API Calls Today</h4>
//             <p>{systemUsageData.apiCallsToday}</p>
//           </div>
//           <div className="kpi-card">
//             <h4>Storage Used</h4>
//             <p>{systemUsageData.storageUsed}</p>
//           </div>
//         </div>

//         <div className="api-store">
//           <div className="api-container">
//             <h3>API Calls Trend</h3>
//             <ResponsiveContainer width="100%" height={250}>
//               <LineChart data={systemUsageData.apiTrends}>
//                 <XAxis dataKey="day" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="calls" stroke="#8884d8" />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Storage Consumption Chart */}
//           <div className="api-container">
//             <h3>Storage Consumption</h3>
//             <ResponsiveContainer width="100%" height={250}>
//               <BarChart data={systemUsageData.storageConsumption}>
//                 <XAxis dataKey="tenant" />
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey="usage" fill="#82ca9d" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* <div className="activeTable-modules">
//           <div className="chart-container">
//             <h3>Most Used Modules</h3>
//             <ResponsiveContainer width="100%" height={250}>
//               <PieChart>
//                 <Pie data={systemUsageData.mostUsedModules} dataKey="percentage" nameKey="module" cx="50%" cy="50%" outerRadius={80} label>
//                   {systemUsageData.mostUsedModules.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={["#4CAF50", "#2196F3", "#FFC107", "#E91E63", "#9C27B0"][index]} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>

       
//           <div className="tenant-table">
//             <table>
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Name</th>
//                   <th>Status</th>
//                   <th>API Calls</th>
//                   <th>Storage</th>
//                   <th>Top Module</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {systemUsageData.tenantList.map((tenant) => (
//                   <tr key={tenant.id}>
//                     <td>{tenant.id}</td>
//                     <td>{tenant.name}</td>
//                     <td className={tenant.status === "Active" ? "active-status" : "inactive-status"}>{tenant.status}</td>
//                     <td>{tenant.apiCalls}</td>
//                     <td>{tenant.storage}</td>
//                     <td>{tenant.topModule}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div> */}
//         <div className="issue-container">
//           <div className="issue-button-head">
//             <h2>Client Issue Tracker</h2>
//             <button>View All</button>
//           </div>
//           <div className="issuetable-container">
//             <table className="issue-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Client</th>
//                   <th>Issue Type</th>
//                   <th>Priority</th>
//                   <th>Status</th>
//                   <th>Assigned To</th>
//                   <th>Reported Date</th>
//                   <th>Expected Resolution</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {issues.map((issue) => (
//                   <tr key={issue.id} className={`priority-${issue.priority.toLowerCase()} status-${issue.status.toLowerCase().replace(" ", "-")}`}>
//                     <td>{issue.id}</td>
//                     <td>{issue.client}</td>
//                     <td>{issue.type}</td>
//                     <td className={`priority-${issue.priority.toLowerCase()}`}>{issue.priority}</td>
//                     <td className={`status-${issue.status.toLowerCase().replace(" ", "-")}`}>
//                       {issue.status}
//                     </td>
//                     <td>{issue.assignedTo}</td>
//                     <td>{issue.reportedDate}</td>
//                     <td>{issue.expectedResolution}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;



// // import React, { useState, useEffect } from "react";
// // import axios from "axios";
// // import { useNavigate } from "react-router-dom";

// // const AdminDashboard = () => {
// //   const [qrCode, setQrCode] = useState("");
// //   const [otp, setOtp] = useState("");
// //   const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
// //   const [loading, setLoading] = useState(true); // Loading state for fetching initial data
// //   const navigate = useNavigate();
// //   const email = localStorage.getItem("email");

// //   useEffect(() => {
// //     const fetchOtpSetup = async () => {
// //       try {
// //         // Check if OTP is already enabled
// //         const response = await axios.get(
// //           "http://localhost:5000/api/admin/check-otp-status",
// //           {
// //             headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
// //           }
// //         );

// //         if (response.data.otpEnabled) {
// //           setGoogleAuthEnabled(true); // OTP is already enabled, no need for setup
// //           setLoading(false);
// //         } else {
// //           // Fetch OTP setup details
// //           const setupResponse = await axios.post(
// //             "http://localhost:5000/api/admin/otp-setup",
// //             { email },
// //             { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
// //           );
// //           console.log("setupresponse", setupResponse);

// //           setQrCode(setupResponse.data.qrCode);
// //           setGoogleAuthEnabled(false); // OTP is not enabled yet, show QR code setup
// //           setLoading(false);
// //         }
// //       } catch (error) {
// //         console.error("Error fetching OTP setup", error);
// //         setLoading(false);
// //       }
// //     };

// //     fetchOtpSetup();
// //   }, [email]);

// //   const handleOtpEnable = async (e) => {
// //     e.preventDefault();
// //     try {
// //       // Verify OTP and enable it
// //       await axios.post(
// //         "http://localhost:5000/api/admin/enable-otp",
// //         { email, otp },
// //         { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
// //       );
// //       alert("Google 2FA enabled successfully!");
// //       setGoogleAuthEnabled(true); // Mark OTP as enabled
// //     } catch (error) {
// //       console.error("Error verifying OTP", error);
// //       alert("Invalid OTP");
// //     }
// //   };

// //   if (loading) {
// //     return <div>Loading...</div>; // Loading state
// //   }

// //   return (
// //     <div className="admin-dashboard">
// //       <h2>Admin Dashboard</h2>

// //       {!googleAuthEnabled ? (
// //         <div className="otp-setup">
// //           <h3>Enable 2FA (Google Authenticator)</h3>
// //           <p>Scan this QR code in Google Authenticator:</p>
// //           <img src={qrCode} alt="QR Code" />

// //           <form onSubmit={handleOtpEnable}>
// //             <label>Enter OTP from Google Authenticator:</label>
// //             <input
// //               type="text"
// //               value={otp}
// //               onChange={(e) => setOtp(e.target.value)}
// //               required
// //             />
// //             <button type="submit">Enable 2FA</button>
// //           </form>
// //         </div>
// //       ) : (
// //         <p>2FA is enabled for your account.</p>
// //       )}
// //     </div>
// //   );
// // };

// // export default AdminDashboard;
