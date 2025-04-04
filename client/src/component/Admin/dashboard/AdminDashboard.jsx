import React, { useEffect, useState } from "react";
import "./admindashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faUsers } from "@fortawesome/free-solid-svg-icons";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import axios from "axios";

const AdminDashboard = () => {
  const [totalClients, setTotalClients] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [subscriptionDataBar, setSubscriptionDataBar] = useState([]);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [clientData, setClientData] = useState([]);

  const loggedInEmail = localStorage.getItem("email");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/total-clients`);
        setTotalClients(response.data.totalClients);
        setActiveClients(response.data.activeClients);
      } catch (error) {
        console.error("Error fetching total clients:", error);
      }
    };

    const fetchImpressions = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/totalimpressions`);
        setTotalImpressions(response.data?.totalImpressions || 0);
      } catch (error) {
        console.error("Error fetching impressions:", error);
      }
    };

    const fetchRevenueData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/monthlyrevenue`);
        const currentYear = new Date().getFullYear();
        const allMonths = Array.from({ length: 12 }, (_, index) => {
          const date = new Date(currentYear, index, 1);
          return date.toLocaleString("default", { month: "short", year: "numeric" });
        });

        const rawRevenueData = response.data.revenueData || {};
        const formattedData = allMonths
          .filter((month) => month.includes(currentYear))
          .map((month) => ({
            month,
            revenue: rawRevenueData[month] || 0,
          }));

        setRevenueData(formattedData);
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      }
    };

    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/mostPurchasedPlans`);
        const data = await response.json();
        setSubscriptionDataBar(data);
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    };

    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/transactionData`);
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    const fetchClients = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/clientsubscriptions`);
        setClientData(response.data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    fetchTransactions();
    fetchSubscriptionData();
    fetchData();
    fetchImpressions();
    fetchClients();
    fetchRevenueData();
  }, []);

  const data = [
    { label: "Total Clients", value: totalClients, icon: faBuilding },
    { label: "Active Clients", value: activeClients, icon: faBuilding },
    { label: "Total Users", value: totalUsers, icon: faUsers },
    { label: "Active Users", value: activeUsers, icon: faUsers },
  ];

  const subscriptionData = [
    { month: "Jan", newSubs: 500, refund: 200 },
    { month: "Feb", newSubs: 700, refund: 300 },
    { month: "Mar", newSubs: 800, refund: 250 },
    { month: "Apr", newSubs: 650, refund: 400 },
    { month: "May", newSubs: 900, refund: 350 },
  ];

  const systemUsageData = {
    totalTenants: 50,
    activeTenants: 40,
    inactiveTenants: 10,
    apiCallsToday: 12000,
    storageUsed: "750GB / 1TB",
    topUsedModule: "Billing",
    apiTrends: [
      { day: "Mon", calls: 4000 },
      { day: "Tue", calls: 6000 },
      { day: "Wed", calls: 7000 },
      { day: "Thu", calls: 8000 },
      { day: "Fri", calls: 5000 },
      { day: "Sat", calls: 3000 },
      { day: "Sun", calls: 4500 },
    ],
    storageConsumption: [
      { tenant: "Tenant A", usage: 120 },
      { tenant: "Tenant B", usage: 180 },
      { tenant: "Tenant C", usage: 90 },
      { tenant: "Tenant D", usage: 240 },
      { tenant: "Tenant E", usage: 160 },
    ]
  };

  const [issues, setIssues] = useState([
    {
      id: 101,
      client: "Alpha Inc.",
      type: "API Failure",
      priority: "🔴 Critical",
      status: "Open",
      assignedTo: "John Doe",
      reportedDate: "2025-02-13",
      expectedResolution: "2025-02-15",
    },
    {
      id: 102,
      client: "Beta Corp.",
      type: "Login Issue",
      priority: "🟠 High",
      status: "In Progress",
      assignedTo: "Jane Smith",
      reportedDate: "2025-02-12",
      expectedResolution: "2025-02-14",
    },
    {
      id: 103,
      client: "Gamma LLC",
      type: "Slow Performance",
      priority: "🟡 Medium",
      status: "Pending",
      assignedTo: "Michael Lee",
      reportedDate: "2025-02-10",
      expectedResolution: "2025-02-16",
    },
  ]);

  return (
    <div className="Admin-dashboard">
      {/* Client and User Data Blocks */}
      <div className="Admin-dashboard-graphs">
        {data.map((item, index) => (
          <div className="Admin-block-data" key={index}>
            <FontAwesomeIcon icon={item.icon} className="Admin-icon-client" />
            <h3>{item.label}</h3>
            <div className="Admin-bar-progress">
              <h5>{((item.value / (data[0].value || 1))).toFixed(1)}%</h5>
              <p>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <div className="Admin-revenue-subCancel">
        <div className="Admin-revenue-chart">
          <h3>Monthly Revenue</h3>
          <div className="Admin-revenue-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" className="Admin-axis-label" />
                <YAxis className="Admin-axis-label" />
                <Tooltip className="Admin-tooltip-style" />
                <Bar dataKey="revenue" fill="#3e98c7" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="Admin-subscription-chart">
          <h3>New Subscriptions vs refund</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subscriptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="newSubs" fill="#4CAF50" name="New Subscriptions" barSize={50} />
              <Bar dataKey="refund " fill="#F44336" name="refund" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="Admin-sub-recent">
        <div className="Admin-top-subscription-chart">
          <h3>Most Purchased Subscription Plans</h3>
          <PieChart width={300} height={300}>
            <Pie
              data={subscriptionDataBar}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={3}
              dataKey="value"
            >
              {subscriptionDataBar.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
        <div className="Admin-transaction-table">
          <div className="Admin-recent-transHead">
            <h3>Recent Transactions</h3>
            <button>View All</button>
          </div>
          <hr style={{ marginBottom: "0" }} />
          <div>
            {transactions.map((transaction, idx) => (
              <div key={transaction.id} className="Admin-transaction-item">
                <div className="Admin-recent-transaction">
                  <p>{transaction.id}</p>
                  <div className="Admin-trans-name-date">
                    <h5>{transaction.name}</h5>
                    <p>{transaction.date}</p>
                  </div>
                  <div className="Admin-trans-plan-price">
                    <p>{transaction.plan}</p>
                    <p>{transaction.price}</p>
                  </div>
                </div>
                {idx !== transactions.length - 1 && <hr />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="Admin-subscription-container">
        <h3>Subscription Expirations & Renewals</h3>
        {clientData.map((sub) => (
          <div className={`Admin-subscription-entry Admin-${sub.status.toLowerCase()}`} key={sub.id}>
            <p>{sub.id}</p>
            <div className="Admin-client-info">
              <h5>{sub.fullName}</h5>
              <p>{sub.subscription.endDate}</p>
            </div>
            <div className="Admin-plan-details">
              <p>{sub.selectedPlan}</p>
              <p>{sub.planPrice}</p>
            </div>
            <span className={`Admin-status-badge Admin-${sub.status.toLowerCase()}`}>{sub.subscription.status}</span>
          </div>
        ))}
      </div>

      <div className="Admin-analytics-container">
        {/* KPI Cards */}
        <div className="Admin-kpi-cards">
          <div className="Admin-kpi-card">
            <h4>Impressions</h4>
            <p>{totalImpressions}</p>
          </div>
          <div className="Admin-kpi-card">
            <h4>Active Tenants</h4>
            <p>{systemUsageData.activeTenants} / {systemUsageData.totalTenants}</p>
          </div>
          <div className="Admin-kpi-card">
            <h4>API Calls Today</h4>
            <p>{systemUsageData.apiCallsToday}</p>
          </div>
          <div className="Admin-kpi-card">
            <h4>Storage Used</h4>
            <p>{systemUsageData.storageUsed}</p>
          </div>
        </div>

        <div className="Admin-api-store">
          <div className="Admin-api-container">
            <h3>API Calls Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={systemUsageData.apiTrends}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calls" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Storage Consumption Chart */}
          <div className="Admin-api-container">
            <h3>Storage Consumption</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={systemUsageData.storageConsumption}>
                <XAxis dataKey="tenant" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="Admin-issue-container">
          <div className="Admin-issue-button-head">
            <h2>Client Issue Tracker</h2>
            <button>View All</button>
          </div>
          <div className="Admin-issuetable-container">
            <table className="Admin-issue-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Issue Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Reported Date</th>
                  <th>Expected Resolution</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id} className={`Admin-priority-${issue.priority.toLowerCase()} Admin-status-${issue.status.toLowerCase().replace(" ", "-")}`}>
                    <td>{issue.id}</td>
                    <td>{issue.client}</td>
                    <td>{issue.type}</td>
                    <td className={`Admin-priority-${issue.priority.toLowerCase()}`}>{issue.priority}</td>
                    <td className={`Admin-status-${issue.status.toLowerCase().replace(" ", "-")}`}>
                      {issue.status}
                    </td>
                    <td>{issue.assignedTo}</td>
                    <td>{issue.reportedDate}</td>
                    <td>{issue.expectedResolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;