import React, { useEffect, useState } from "react";
import "./clientdashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faUsers } from "@fortawesome/free-solid-svg-icons";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import axios from "axios";

const ClientDashboard = () => {

  const [totalEmployee, setTotalEmployee] = useState(0);
  const [activeEmployee, setActiveEmployee] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [subscriptionDataBar, setSubscriptionDataBar] = useState([]);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [transactions, setTransactions] = useState([]);
  console.log("revenuedata", revenueData);
  const [clientData, setClientData] = useState([]);
  console.log("clientdata", clientData);

  const loggedInEmail = localStorage.getItem("email");

  useEffect(() => { 
    // Fetch total clients and active clients data from the backend
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clientdash/total-employee`);
        setTotalEmployee(response.data.totalEmployee);
        setActiveEmployee(response.data.activeEmployee);
      } catch (error) {
        console.error("Error fetching total clients:", error);
      }
    };

    const fetchImpressions = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/totalimpressions`);
        setTotalImpressions(response.data?.totalImpressions || 0); // Ensure a valid number
      } catch (error) {
        console.error("Error fetching impressions:", error);
      }
    };

    // Fetch monthly revenue data from the backend
    const fetchRevenueData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/monthlyrevenue`);
        console.log("Raw revenue data:", response.data);

        // Get the current year dynamically
        const currentYear = new Date().getFullYear();

        // Define all months for the current year
        const allMonths = Array.from({ length: 12 }, (_, index) => {
          const date = new Date(currentYear, index, 1); // Set month and year
          return date.toLocaleString("default", { month: "short", year: "numeric" });
        });

        // Filter out only data for the current year
        const rawRevenueData = response.data.revenueData || {};
        const formattedData = allMonths
          .filter((month) => month.includes(currentYear)) // Only keep current year data
          .map((month) => ({
            month,
            revenue: rawRevenueData[month] || 0, // Use 0 if no revenue data
          }));

        console.log("Formatted revenue data for the current year:", formattedData);
        setRevenueData(formattedData);
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      }
    };

    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/mostPurchasedPlans`); // Replace with your API route
        const data = await response.json();
        setSubscriptionDataBar(data);
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    };
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/transactionData`); // Replace with your API route
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    const fetchClients = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/clientsubscriptions`);
        console.log("✅ All Clients Response:", response.data);
        setClientData(response.data);
      } catch (error) {
        console.error("❌ Error fetching clients:", error);
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
    { label: "Total Employee", value: totalEmployee, icon: faBuilding },
    { label: "Active Employee", value: activeEmployee, icon: faBuilding },
    { label: "Triggers", value: activeEmployee, icon: faBuilding },
    { label: "FMS/Pipeline", value: activeEmployee, icon: faBuilding },
  ];

  const subscriptionData = [
    { month: "Jan", losses: 500, profit: 200 },
    { month: "Feb", losses: 700, profit: 300 },
    { month: "Mar", losses: 800, profit: 250 },
    { month: "Apr", losses: 650, profit: 400 },
    { month: "May", losses: 900, profit: 350 },
  ];

  const systemUsageData = {
    totalTenants: 50,
    activeTenants: 40,
    topUsedModule: "Billing",
    mostUsedModules: [
      { module: "Billing", percentage: 35 },
      { module: "User Management", percentage: 25 },
      { module: "Reports", percentage: 20 },
      { module: "Notifications", percentage: 15 },
      { module: "Support", percentage: 5 },
    ],
    tenantList: [
      { id: 1, name: "Alpha Inc.", status: "Active", apiCalls: 3000, storage: "120GB", topModule: "Billing" },
      { id: 2, name: "Beta Corp.", status: "Active", apiCalls: 2500, storage: "90GB", topModule: "Reports" },
      { id: 3, name: "Gamma LLC", status: "Inactive", apiCalls: 1200, storage: "60GB", topModule: "User Management" },
      { id: 4, name: "Delta Ltd.", status: "Active", apiCalls: 4000, storage: "180GB", topModule: "Notifications" },
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
    <div className="dashboard">
      {/* Client and User Data Blocks */}
      <div className="dashboard-graphs">
        {data.map((item, index) => (
          <div className="block-data" key={index}>
            <FontAwesomeIcon icon={item.icon} className="icon-client" />
            <h3>{item.label}</h3>
            <div className="bar-progress">
              <h5>{((item.value / (data[0].value || 1))).toFixed(1)}%</h5>
              <p>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <div className="revenue-subCancel">
        <div className="revenue-chart">
          <h3>Monthly Losses</h3>
          <div className="revenue-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" className="axis-label" />
                <YAxis className="axis-label" />
                <Tooltip className="tooltip-style" />
                <Bar dataKey="revenue" fill="#3e98c7" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="subscription-chart">
          <h3>Losses vs Profits</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subscriptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="losses" fill="#F44336" name="Losses" barSize={50} />
              <Bar dataKey="profit" fill="#4CAF50" name="Profit" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="admin-sub-recent">
        <div className="top-subscription-chart">
          <h3>Most Used</h3>
          <PieChart width={300} height={300}>
            <Pie
              data={subscriptionDataBar}
              cx="50%"
              cy="50%"
              innerRadius={70} // Creates a circular progress effect
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
        <div className="transaction-table">
          <div className="recent-transHead">
            <h3>Task Delegated</h3>
            <button>View All</button>
          </div>
          <hr style={{ marginBottom: "0" }} />
          <div>
            {transactions.map((transaction, idx) => (
              <div key={transaction.id} className="transaction-item">
                <div className="recent-transaction">
                  <p>{transaction.id}</p>
                  <div className="trans-name-date">
                    <h5>{transaction.name}</h5>
                    <p>{transaction.date}</p>
                  </div>
                  <div className="trans-plan-price">
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
      <div className="analytics-container">
        {/* KPI Cards */}
        <div className="issue-container">
          <div className="issue-button-head">
            <h2>Employee Issue Tracker</h2>
            <button>View All</button>
          </div>
          <div className="issuetable-container">
            <table className="issue-table">
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
                  <tr key={issue.id} className={`priority-${issue.priority.toLowerCase()} status-${issue.status.toLowerCase().replace(" ", "-")}`}>
                    <td>{issue.id}</td>
                    <td>{issue.client}</td>
                    <td>{issue.type}</td>
                    <td className={`priority-${issue.priority.toLowerCase()}`}>{issue.priority}</td>
                    <td className={`status-${issue.status.toLowerCase().replace(" ", "-")}`}>
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

export default ClientDashboard;


