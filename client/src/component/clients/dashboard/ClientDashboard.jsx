import React, { useEffect, useState } from "react";
import "./clientdashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faBuilding, faUsers, faTasks, faUserCheck } from "@fortawesome/free-solid-svg-icons";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
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
  const [delegation, setDelegation] = useState([]);

  const loggedInEmail = localStorage.getItem("email");
  const loggedInUserId = localStorage.getItem("userId");
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("role");
  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("email") || "No email";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/clientdash/total-employee`
        );
        setTotalEmployee(response.data.totalEmployee);
        setActiveEmployee(response.data.activeEmployee);
      } catch (error) {
        console.error("Error fetching total clients:", error);
      }
    };

    const fetchTriggerCount = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/clientdash/trigger-count`
        );
        setTriggers(response.data.totalTriggers);
      } catch (error) {
        console.error("Error fetching trigger count:", error);
      }
    };

    const fetchPipelineStageCount = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/clientdash/pipeline-stage-count`
        );
        setTotalPipelines(response.data.totalPipelines);
        setTotalStages(response.data.totalStages);
      } catch (error) {
        console.error("Error fetching pipeline/stage count:", error);
      }
    };

    const fetchRevenueData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/clients/monthlyrevenue`
        );
        const currentYear = new Date().getFullYear();
        const allMonths = Array.from({ length: 12 }, (_, index) => {
          const date = new Date(currentYear, index, 1);
          return date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          });
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
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/clients/transactionData`
        );
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    const fetchClients = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/clients/clientsubscriptions`
        );
        setClientData(response.data);
      } catch (error) {
        console.error("❌ Error fetching clients:", error);
      }
    };

    const fetchChecklist = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/tasks/list`
        );
        const data = response.data.slice(0, 5);
        setChecklist(data);
      } catch (error) {
        console.error("❌ Error fetching checklist tasks:", error);
      }
    };

    const fetchDelegation = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/delegation/list`
        );
        const data = response.data.slice(0, 5);
        setDelegation(data);
      } catch (error) {
        console.error("❌ Error fetching checklist tasks:", error);
      }
    };

    fetchDelegation();
    fetchTriggerCount();
    fetchPipelineStageCount();
    fetchRevenueData();
    fetchTransactions();
    fetchClients();
    fetchChecklist();
    fetchData();
  }, []);

  const data = [
    { label: "Total Employee", value: totalEmployee, icon: faUsers, color: "#0D6E6E" },
    { label: "Active Employee", value: activeEmployee, icon: faUserCheck, color: "#4CAF50" },
    { label: "Triggers", value: triggers, icon: faBolt, color: "#FF9800" },
    {
      label: "FMS/Pipeline",
      value: `${totalPipelines} / ${totalStages}`,
      icon: faTasks,
      color: "#9C27B0"
    },
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
      priority: "Critical",
      status: "Open",
      assignedTo: "John Doe",
      reportedDate: "2025-02-13",
      expectedResolution: "2025-02-15",
    },
    {
      id: 102,
      client: "Beta Corp.",
      type: "Login Issue",
      priority: "High",
      status: "In Progress",
      assignedTo: "Jane Smith",
      reportedDate: "2025-02-12",
      expectedResolution: "2025-02-14",
    },
    {
      id: 103,
      client: "Gamma LLC",
      type: "Slow Performance",
      priority: "Medium",
      status: "Pending",
      assignedTo: "Michael Lee",
      reportedDate: "2025-02-10",
      expectedResolution: "2025-02-16",
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="user-info">
          <span className="username">{userName}</span>
          <span className="user-email">{userEmail}</span>
        </div>
      </div>

      <div className="dashboard-graphs">
        {data.map((item, index) => (
          <div className="block-data" key={index} style={{ borderLeft: `4px solid ${item.color}` }}>
            <FontAwesomeIcon 
              icon={item.icon} 
              className="icon-client" 
              style={{ color: item.color }}
            />
            <h3>{item.label}</h3>
            <div className="bar-progress">
              <h5 style={{ backgroundColor: item.color }}>
                {(item.value / (data[0].value || 1)).toFixed(1)}%
              </h5>
              <p>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="revenue-subCancel">
        <div className="revenue-chart">
          <h3>Monthly Revenue</h3>
          <div className="revenue-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" className="axis-label" />
                <YAxis className="axis-label" />
                <Tooltip className="tooltip-style" />
                <Bar dataKey="revenue" fill="#0D6E6E" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="subscription-chart">
          <h3>Losses vs Profits</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subscriptionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend />
              <Bar dataKey="losses" fill="#F44336" name="Losses" barSize={50} />
              <Bar dataKey="profit" fill="#4CAF50" name="Profit" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="subscription-chart">
          <h3>Leads</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={subscriptionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#0D6E6E" 
                strokeWidth={2} 
                dot={{ fill: '#0D6E6E', r: 4 }} 
                activeDot={{ r: 6 }} 
                name="Leads"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="client-sub-recent">
        <div className="transaction-table">
          <div className="recent-transHead">
            <h3>Task Delegated</h3>
            <button onClick={() => (window.location.href = "/delegation-tasklist")}>
              View All
            </button>
          </div>
          <hr />
          <div className="transaction-list">
            {delegation.length > 0 ? (
              delegation.map((task, idx) => (
                <div key={task._id} className="transaction-item">
                  <div className="recent-transaction">
                    <p className="task-index">{idx + 1}</p>
                    <div className="trans-name-date">
                      <h5>{task.name || "Unnamed Task"}</h5>
                      <p>
                        {new Date(task.dueDate).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="trans-plan-price">
                      <p>{task.doer?.fullName || "Unassigned"}</p>
                      <p className={`status-${task.status.toLowerCase()}`}>
                        {task.status}
                      </p>
                    </div>
                  </div>
                  {idx !== delegation.length - 1 && <hr />}
                </div>
              ))
            ) : (
              <div className="no-tasks">
                <p>No delegated tasks found</p>
              </div>
            )}
          </div>
        </div>

        <div className="transaction-table">
          <div className="recent-transHead">
            <h3>Checklist</h3>
            <button onClick={() => (window.location.href = "/check-tasklist")}>
              View All
            </button>
          </div>
          <hr />
          <div className="transaction-list">
            {checklist.map((task, idx) => (
              <div key={task._id} className="transaction-item">
                <div className="recent-transaction">
                  <p className="task-index">{idx + 1}</p>
                  <div className="trans-name-date">
                    <h5>{task.taskName || "Untitled Task"}</h5>
                    <p>
                      {task.plannedDateTime ? 
                        new Date(task.plannedDateTime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        "No date set"}
                    </p>
                  </div>
                  <div className="trans-plan-price">
                    <p>{task.frequency}</p>
                    <p>
                      {task.nextDueDateTime ? 
                        new Date(task.nextDueDateTime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        "No due date"}
                    </p>
                  </div>
                </div>
                {idx !== checklist.length - 1 && <hr />}
              </div>
            ))}
          </div>
        </div>
      </div>

        <div className="issue-container">
          <div className="issue-button-head">
            <h3>Employee Issue Tracker</h3>
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
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id}>
                    <td>{issue.id}</td>
                    <td>{issue.client}</td>
                    <td>{issue.type}</td>
                    <td className={`priority-${issue.priority.toLowerCase()}`}>
                      {issue.priority}
                    </td>
                    <td className={`status-${issue.status.toLowerCase().replace(' ', '-')}`}>
                      {issue.status}
                    </td>
                    <td>{issue.assignedTo}</td>
                    <td>{issue.reportedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default ClientDashboard;