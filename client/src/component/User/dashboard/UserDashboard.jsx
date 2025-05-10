import React, { useEffect, useState } from "react";
import "./userdashboard.css";
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
  CartesianGrid,
} from "recharts";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const UserDashboard = ({ onSave, permissions }) => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalProjects: 0,
    announcements: 0,
    leaveTaken: 0,
    assignedTasks: 0,
    revenueData: [],
    delegation: [],
    checklist: [],
  });
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("No email");
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("Fetching user data...");
        const [emailRes, tokenRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-email`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
            { withCredentials: true }
          ),
        ]);

        setToken(tokenRes.data.token);
        setUserEmail(emailRes.data.email);
        console.log("Token fetched:", tokenRes.data.token);
        console.log("Email fetched:", emailRes.data.email);

        const decodedToken = jwtDecode(tokenRes.data.token);
        setUserName(decodedToken.name || "User");
        console.log("Decoded token:", decodedToken);

        const headers = {
          headers: {
            Authorization: `Bearer ${tokenRes.data.token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        };

        console.log("Fetching dashboard data...");
        const [
          delegationRes,
          checklistRes,
        ] = await Promise.all([
          axios.get(
           `${process.env.REACT_APP_API_URL}/api/delegation/list`,
            headers
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/tasks/list`,
            headers
          ),
        ]);

        console.log("Delegation response:", delegationRes.data);
        console.log("Checklist response:", checklistRes.data);

        setDashboardData({
          delegation: delegationRes.data.slice(0, 5),
          checklist: checklistRes.data.slice(0, 5),
        });
        console.log("Dashboard data updated:", dashboardData);
      } catch (error) {
        console.error("Error fetching user dashboard data:", error);
      }
    };

    fetchUserData();
  }, [navigate]);

  const dataCards = [
    {
      label: "No. of ongoing projects",
      value: dashboardData.totalProjects,
      icon: faUsers,
      color: "#0D6E6E",
    },
    {
      label: "Latest company announcements",
      value: dashboardData.announcements,
      icon: faUserCheck,
      color: "#4CAF50",
    },
    {
      label: "Total Leave Taken",
      value: dashboardData.leaveTaken,
      icon: faBolt,
      color: "#FF9800",
    },
    {
      label: "No. of assigned tasks",
      value: dashboardData.assignedTasks,
      icon: faTasks,
      color: "#9C27B0",
    },
  ];

  const performanceData = [
    { month: "Jan", completed: 5, pending: 2 },
    { month: "Feb", completed: 7, pending: 1 },
    { month: "Mar", completed: 6, pending: 3 },
    { month: "Apr", completed: 8, pending: 1 },
    { month: "May", completed: 9, pending: 0 },
  ];

  return (
    <div className="user-dashboard">
      <div className="user-dashboard-graphs">
        {dataCards.map((item, index) => (
          <div
            className="user-block-data"
            key={index}
            style={{ borderLeft: `4px solid ${item.color}` }}
          >
            <FontAwesomeIcon
              icon={item.icon}
              className="user-icon-client"
              style={{ color: item.color }}
            />
            <h3>{item.label}</h3>
            <div className="user-bar-progress">
              <h5 style={{ backgroundColor: item.color }}>
                {((item.value / (dataCards[0].value || 1)) * 100).toFixed(1)}%
              </h5>
              <p>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="user-revenue-subCancel">
        <div className="user-revenue-chart">
          <h3>Task performance graph</h3>
          <div className="user-revenue-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <XAxis dataKey="month" className="user-axis-label" />
                <YAxis className="user-axis-label" />
                <Tooltip className="user-tooltip-style" />
                <Bar
                  dataKey="completed"
                  fill="#0D6E6E"
                  barSize={30}
                  name="Completed"
                />
                <Bar
                  dataKey="pending"
                  fill="#FF9800"
                  barSize={30}
                  name="Pending"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="user-subscription-chart">
          <h3>Issue summary</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="pending"
                fill="#F44336"
                name="Issues"
                barSize={30}
              />
              <Bar
                dataKey="completed"
                fill="#4CAF50"
                name="Resolved"
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="user-subscription-chart">
          <h3>No. of Task Assign</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#0D6E6E"
                strokeWidth={2}
                dot={{ fill: "#0D6E6E", r: 4 }}
                activeDot={{ r: 6 }}
                name="Tasks"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="client-sub-recent">
        <div className="client-transaction-table">
          <div className="client-recent-transHead">
            <h3>Task Delegated</h3>
            <button onClick={() => navigate("/delegation-tasklist")}>
              View All
            </button>
          </div>
          <hr className="client-hr"/>

          <div className="client-transaction-list">
            {dashboardData.delegation.length > 0 ? (
              dashboardData.delegation.map((task, idx) => (
                <div key={task._id} className="client-transaction-item">
                  <div className="client-recent-transaction">
                    <p className="client-task-index">{idx + 1}</p>
                    <div className="client-trans-name-date">
                      <h5>{task.name || "Unnamed Task"}</h5>
                      <p>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No date"}
                      </p>
                    </div>
                    <div className="client-trans-plan-price">
                      <p>{task.doer?.fullName || "Unassigned"}</p>
                      <p
                        className={`client-status-${task.status?.toLowerCase()}`}
                      >
                        {task.status}
                      </p>
                    </div>
                  </div>
                  {idx !== dashboardData.delegation.length - 1 && <hr className="client-hr"/>}
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
            <button onClick={() => navigate("/check-tasklist")}>
              View All
            </button>
          </div>
          <hr className="client-hr" />
          <div className="client-transaction-list">
            {dashboardData.checklist.map((task, idx) => (
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
                {idx !== dashboardData.checklist.length - 1 && <hr className="client-hr"/>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
