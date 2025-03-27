import React, { useEffect, useState } from "react";
import "./clientdashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faBuilding, faUsers } from "@fortawesome/free-solid-svg-icons";
import "react-circular-progressbar/dist/styles.css";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import axios from "axios";

const ClientDashboard = () => {
  const [totalEmployee, setTotalEmployee] = useState(0);
  const [activeEmployee, setActiveEmployee] = useState(0);
  const [triggers, setTriggers] = useState(0);
  const [totalPipelines, setTotalPipelines] = useState(0);
  const [totalStages, setTotalStages] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [clientData, setClientData] = useState([]);
  const [checklist, setChecklist] = useState([]);

  const loggedInEmail = localStorage.getItem("email");
  const loggedInUserId = localStorage.getItem("userId"); // <-- assuming this is stored after login

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clientdash/total-employee`);
        setTotalEmployee(response.data.totalEmployee);
        setActiveEmployee(response.data.activeEmployee);
      } catch (error) {
        console.error("Error fetching total clients:", error);
      }
    };

    const fetchTriggerCount = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clientdash/trigger-count`);
        setTriggers(response.data.totalTriggers);
      } catch (error) {
        console.error("Error fetching trigger count:", error);
      }
    };

    const fetchPipelineStageCount = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clientdash/pipeline-stage-count`);
        setTotalPipelines(response.data.totalPipelines);
        setTotalStages(response.data.totalStages);
      } catch (error) {
        console.error("Error fetching pipeline/stage count:", error);
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
        console.error("❌ Error fetching clients:", error);
      }
    };

    const fetchChecklist = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/tasks/list`,
        );
        const data = response.data.slice(0, 5); // Limit to 5
        setChecklist(data);
      } catch (error) {
        console.error("❌ Error fetching checklist tasks:", error);
      }
    };

    fetchTriggerCount();
    fetchPipelineStageCount();
    fetchRevenueData();
    fetchTransactions();
    fetchClients();
    fetchChecklist();
    fetchData();
  }, []);

  const data = [
    { label: "Total Employee", value: totalEmployee, icon: faBuilding },
    { label: "Active Employee", value: activeEmployee, icon: faBuilding },
    { label: "Triggers", value: triggers, icon: faBolt },
    { label: "FMS/Pipeline", value: `${totalPipelines} / ${totalStages}`, icon: faBuilding },
  ];

  const subscriptionData = [
    { month: "Jan", losses: 500, profit: 200 },
    { month: "Feb", losses: 700, profit: 300 },
    { month: "Mar", losses: 800, profit: 250 },
    { month: "Apr", losses: 650, profit: 400 },
    { month: "May", losses: 900, profit: 350 },
  ];

  const issues = [
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
  ];

  return (
    <div className="dashboard">
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

        <div className="subscription-chart">
          <h3>CRM Leads</h3>
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

      <div className="client-sub-recent">
        <div className="transaction-table">
          <div className="recent-transHead">
            <h3>Task Delegated</h3>
            <button>View All</button>
          </div>
          <hr />
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

        <div className="transaction-table">
          <div className="recent-transHead">
            <h3>Checklist</h3>
            <button>View All</button>
          </div>
          <hr />
          <div>
            {checklist.map((task, idx) => (
              <div key={task._id} className="transaction-item">
                <div className="recent-transaction">
                  <p>{1}</p>
                  <div className="trans-name-date">
                    <h5>{task.taskName || "Untitled Task"}</h5>
                    <p>{new Date(task.nextDueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="trans-plan-price">
                    <p>{task.frequency}</p>
                    <p>{task.status}</p>
                  </div>
                </div>
                {idx !== checklist.length - 1 && <hr />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-container">
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
                  <tr key={issue.id}>
                    <td>{issue.id}</td>
                    <td>{issue.client}</td>
                    <td>{issue.type}</td>
                    <td>{issue.priority}</td>
                    <td>{issue.status}</td>
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
