import React, { useEffect, useState } from "react";
import "./clientdashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faBuilding,
  faUsers,
  faTasks,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
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
  const [checklist, setChecklist] = useState([]);
  const [delegation, setDelegation] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [emailRes, tokenRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-email`, { withCredentials: true }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-token`, { withCredentials: true }),
        ]);

        setUserEmail(emailRes.data.email);
        setToken(tokenRes.data.token);

        if (!tokenRes.data.token) {
          console.error("Token not found. Authorization failed.");
          return;
        }

        const headers = {
          headers: {
            Authorization: `Bearer ${tokenRes.data.token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        };

        const [
          employeeRes,
          triggerRes,
          pipelineStageRes,
          revenueRes,
          checklistRes,
          delegationRes,
        ] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/clientdash/total-employee`, headers),
          axios.get(`${process.env.REACT_APP_API_URL}/api/clientdash/trigger-count`, headers),
          axios.get(`${process.env.REACT_APP_API_URL}/api/clientdash/pipeline-stage-count`, headers),
          axios.get(`${process.env.REACT_APP_API_URL}/api/clients/monthlyrevenue`, headers),
          axios.get(`${process.env.REACT_APP_API_URL}/api/tasks/list`, headers),
          axios.get(`${process.env.REACT_APP_API_URL}/api/delegation/list`, headers),
        ]);

        setTotalEmployee(employeeRes.data.totalEmployee);
        setActiveEmployee(employeeRes.data.activeEmployee);
        setTriggers(triggerRes.data.totalTriggers);
        setTotalPipelines(pipelineStageRes.data.totalPipelines);
        setTotalStages(pipelineStageRes.data.totalStages);
        setRevenueData(revenueRes.data.revenueData);
        setChecklist(checklistRes.data.slice(0, 5));
        setDelegation(delegationRes.data.slice(0, 5));

        console.log("✅ Dashboard data fetched successfully.");
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
      }
    };

    fetchUserData();
  }, []);

  const data = [
    { label: "Total Employee", value: totalEmployee, icon: faUsers, color: "#0D6E6E" },
    { label: "Active Employee", value: activeEmployee, icon: faUserCheck, color: "#4CAF50" },
    { label: "Triggers", value: triggers, icon: faBolt, color: "#FF9800" },
    { label: "FMS/Pipeline", value: `${totalPipelines} / ${totalStages}`, icon: faTasks, color: "#9C27B0" },
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
    <div className="client-dashboard">
      <div className="client-dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="client-user-info">
          <span className="client-user-email">{userEmail}</span>
        </div>
      </div>

      <div className="client-dashboard-graphs">
        {data.map((item, index) => (
          <div
            className="client-block-data"
            key={index}
            style={{ borderLeft: `4px solid ${item.color}` }}
          >
            <FontAwesomeIcon
              icon={item.icon}
              className="client-icon"
              style={{ color: item.color }}
            />
            <h3>{item.label}</h3>
            <div className="client-bar-progress">
              <h5 style={{ backgroundColor: item.color }}>
                {(item.value / (data[0].value || 1)).toFixed(1)}%
              </h5>
              <p>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="client-revenue-subCancel">
        <div className="client-revenue-chart">
          <h3>Monthly Revenue</h3>
          <div className="client-revenue-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subscriptionData}>
                <XAxis dataKey="month" className="client-axis-label" />
                <YAxis className="client-axis-label" />
                <Tooltip className="client-tooltip-style" />
                <Bar dataKey="revenue" fill="#0D6E6E" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="client-subscription-chart">
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

        <div className="client-subscription-chart">
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
                dot={{ fill: "#0D6E6E", r: 4 }}
                activeDot={{ r: 6 }}
                name="Leads"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="client-sub-recent">
        <div className="client-transaction-table">
          <div className="client-recent-transHead">
            <h3>Task Delegated</h3>
            <button
              onClick={() => (window.location.href = "/delegation-tasklist")}
            >
              View All
            </button>
          </div>
          <hr className="client-hr" />
          <div className="client-transaction-list">
            {delegation.length > 0 ? (
              delegation.map((task, idx) => (
                <div key={task._id} className="client-transaction-item">
                  <div className="client-recent-transaction">
                    <p className="client-task-index">{idx + 1}</p>
                    <div className="client-trans-name-date">
                      <h5>{task.name || "Unnamed Task"}</h5>
                      <p>
                        {new Date(task.dueDate).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="client-trans-plan-price">
                      <p>{task.doer?.fullName || "Unassigned"}</p>
                      <p className={`client-status-${task.status.toLowerCase()}`}>
                        {task.status}
                      </p>
                    </div>
                  </div>
                  {idx !== delegation.length - 1 && <hr className="client-hr" />}
                </div>
              ))
            ) : (
              <div className="client-no-tasks">
                <p>No delegated tasks found</p>
              </div>
            )}
          </div>
        </div>

        <div className="client-transaction-table">
          <div className="client-recent-transHead">
            <h3>Checklist</h3>
            <button onClick={() => (window.location.href = "/check-tasklist")}>
              View All
            </button>
          </div>
          <hr className="client-hr" />
          <div className="client-transaction-list">
            {checklist.map((task, idx) => (
              <div key={task._id} className="client-transaction-item">
                <div className="client-recent-transaction">
                  <p className="client-task-index">{idx + 1}</p>
                  <div className="client-trans-name-date">
                    <h5>{task.taskName || "Untitled Task"}</h5>
                    <p>
                      {task.plannedDateTime
                        ? new Date(task.plannedDateTime).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "No date set"}
                    </p>
                  </div>
                  <div className="client-trans-plan-price">
                    <p>{task.frequency}</p>
                    <p>
                      {task.nextDueDateTime
                        ? new Date(task.nextDueDateTime).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "No due date"}
                    </p>
                  </div>
                </div>
                {idx !== checklist.length - 1 && <hr className="client-hr" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="client-issue-container">
        <div className="client-issue-button-head">
          <h3>Employee Issue Tracker</h3>
          <button>View All</button>
        </div>
        <div className="client-issuetable-container">
          <table className="client-issue-table">
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
                  <td className={`client-priority-${issue.priority.toLowerCase()}`}>
                    {issue.priority}
                  </td>
                  <td
                    className={`client-status-${issue.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
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
// import React, { useEffect, useState } from "react";
// import "./clientdashboard.css";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faBolt, faUsers, faTasks, faUserCheck } from "@fortawesome/free-solid-svg-icons";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
// import axios from "axios";

// const ClientDashboard = () => {
//   const [totalEmployee, setTotalEmployee] = useState(0);
//   const [activeEmployee, setActiveEmployee] = useState(0);
//   const [triggers, setTriggers] = useState(0);
//   const [totalPipelines, setTotalPipelines] = useState(0);
//   const [totalStages, setTotalStages] = useState(0);
//   const [revenueData, setRevenueData] = useState([]);
//   const [transactions, setTransactions] = useState([]);
//   const [checklist, setChecklist] = useState([]);
//   const [delegation, setDelegation] = useState([]);
//   const [userEmail, setUserEmail] = useState("");

//   useEffect(() => {
//     const fetchUserEmail = async () => {
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_URL}/api/permission/get-email`,
//           { withCredentials: true }
//         );
//         setUserEmail(response.data.email);
//       } catch (error) {
//         console.error("Error fetching user email:", error);
//       }
//     };

//     const fetchDashboardData = async () => {
//       try {
//         const headers = { withCredentials: true };

//         const [
//           employeeRes,
//           triggerRes,
//           pipelineStageRes,
//           revenueRes,
//           transactionRes,
//           checklistRes,
//           delegationRes,
//         ] = await Promise.all([
//           axios.get(`${process.env.REACT_APP_API_URL}/api/clientdash/total-employee`, headers),
//           axios.get(`${process.env.REACT_APP_API_URL}/api/clientdash/trigger-count`, headers),
//           axios.get(`${process.env.REACT_APP_API_URL}/api/clientdash/pipeline-stage-count`, headers),
//           axios.get(`${process.env.REACT_APP_API_URL}/api/clients/monthlyrevenue`, headers),
//           axios.get(`${process.env.REACT_APP_API_URL}/api/clients/transactionData`, headers),
//           axios.get(`${process.env.REACT_APP_API_URL}/api/tasks/list`, headers),
//           axios.get(`${process.env.REACT_APP_API_URL}/api/delegation/list`, headers),
//         ]);

//         setTotalEmployee(employeeRes.data.totalEmployee);
//         setActiveEmployee(employeeRes.data.activeEmployee);
//         setTriggers(triggerRes.data.totalTriggers);
//         setTotalPipelines(pipelineStageRes.data.totalPipelines);
//         setTotalStages(pipelineStageRes.data.totalStages);
//         setRevenueData(revenueRes.data.revenueData || []);
//         setTransactions(transactionRes.data || []);
//         setChecklist(checklistRes.data.slice(0, 5));
//         setDelegation(delegationRes.data.slice(0, 5));
//       } catch (error) {
//         console.error("Error fetching dashboard data:", error);
//       }
//     };

//     fetchUserEmail();
//     fetchDashboardData();
//   }, []);

//   const dashboardSummary = [
//     { label: "Total Employee", value: totalEmployee, icon: faUsers, color: "#0D6E6E" },
//     { label: "Active Employee", value: activeEmployee, icon: faUserCheck, color: "#4CAF50" },
//     { label: "Triggers", value: triggers, icon: faBolt, color: "#FF9800" },
//     { label: "FMS/Pipeline", value: `${totalPipelines} / ${totalStages}`, icon: faTasks, color: "#9C27B0" },
//   ];

//   return (
//     <div className="client-dashboard">
//       <h2>Welcome, {userEmail}</h2>

//       <div className="dashboard-summary">
//         {dashboardSummary.map((item, index) => (
//           <div key={index} className="dashboard-card" style={{ backgroundColor: item.color }}>
//             <FontAwesomeIcon icon={item.icon} />
//             <div className="card-info">
//               <span>{item.label}</span>
//               <span>{item.value}</span>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="chart-container">
//         <ResponsiveContainer width="100%" height={300}>
//           <BarChart data={revenueData}>
//             <XAxis dataKey="month" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Bar dataKey="revenue" fill="#8884d8" />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       <div className="transactions-container">
//         <h3>Recent Transactions</h3>
//         <table className="transactions-table">
//           <thead>
//             <tr>
//               <th>Name</th>
//               <th>Date</th>
//               <th>Plan</th>
//               <th>Price</th>
//             </tr>
//           </thead>
//           <tbody>
//             {transactions.map((txn) => (
//               <tr key={txn.id}>
//                 <td>{txn.name}</td>
//                 <td>{txn.date}</td>
//                 <td>{txn.plan}</td>
//                 <td>{txn.price}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="tasks-container">
//         <h3>Checklist Tasks</h3>
//         <ul>
//           {checklist.map((task) => (
//             <li key={task._id}>{task.taskName}</li>
//           ))}
//         </ul>
//       </div>

//       <div className="delegation-container">
//         <h3>Delegation Tasks</h3>
//         <ul>
//           {delegation.map((task) => (
//             <li key={task._id}>{task.taskName}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default ClientDashboard;
