import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../../../Sidebar/Sidebar";
import Navbar from "../../../../Navbar/Navbar";
import "./checklistmis.css";

const CheckListMIS = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [token, setToken] = useState("");
  const [role, setRole] = useState(null);
  const [id, setId] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [manifestWorkNotDone, setManifestWorkNotDone] = useState("");
  const [manifestLateSubmission, setManifestLateSubmission] = useState("");
  const [manifestations, setManifestations] = useState([]);
  const [selectedManifestation, setSelectedManifestation] = useState(null);

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        // Step 1: Get Token
        const tokenRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );
        const userToken = tokenRes.data.token;
        setToken(userToken);

        // Step 2: Get Role
        const roleRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
            withCredentials: true,
          }
        );
        const userRole = roleRes.data.role;
        setRole(userRole);

        // Step 3: Get Permissions
        const permissionsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
            withCredentials: true,
          }
        );
        const userPermissions = permissionsRes.data.permissions || {};
        setCustomPermissions(userPermissions);

        // Step 4: Set ID
        setId(userToken.id);

        // Step 5: Fetch Employees
        fetchEmployees(userToken);
      } catch (error) {
        console.error("❌ Error fetching auth data:", error);
      }
    };

    fetchAuthData();
  }, []);

  const fetchEmployees = async (userToken) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
          withCredentials: true,
        }
      );
      setEmployees(response.data);
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
    }
  };

  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let queryParams = `?startDate=${startDate}&endDate=${endDate}&sort=asc`;
      if (selectedEmployee !== "all")
        queryParams += `&userId=${selectedEmployee}`;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/checkmis/list-mis${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      setTasks(response.data.flat());
      console.log("response", response.data);
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManifestation = async () => {
    if (selectedEmployee === "all") {
      alert("Please select an employee to save manifestation.");
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/checkmis/save-manifestation`,
        {
          employeeId: selectedEmployee,
          startDate,
          endDate,
          workNotDoneTarget: parseFloat(manifestWorkNotDone),
          lateSubmissionTarget: parseFloat(manifestLateSubmission),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      alert("Manifestation saved successfully!");
      fetchManifestations(selectedEmployee);
    } catch (error) {
      console.error("❌ Error saving manifestation:", error);
      alert("Failed to save manifestation");
    }
  };

  const fetchManifestations = async (employeeIdToFetch) => {
    if (employeeIdToFetch === "all") {
      setManifestations([]);
      setSelectedManifestation(null);
      return;
    }

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/checkmis/get-manifestation`,
        {
          params: {
            employeeId: employeeIdToFetch,
            startDate,
            endDate,
          },
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (res.data.manifestation) {
        setManifestations([res.data.manifestation]);
        setSelectedManifestation(res.data.manifestation);
      } else {
        setManifestations([]);
        setSelectedManifestation(null);
      }
    } catch (error) {
      console.error("❌ Error fetching manifestations:", error);
      setManifestations([]);
      setSelectedManifestation(null);
    }
  };

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString() : "-";
  const formatTime = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const formatPreciseTimeDiff = (due, complete) => {
    if (!due || !complete) return "-";
    const diff = new Date(complete) - new Date(due);
    if (diff <= 0) return "On time";
    const mins = Math.floor(diff / 60000) % 60;
    const hours = Math.floor(diff / 3600000) % 24;
    const days = Math.floor(diff / (3600000 * 24));
    return `${days ? days + "d " : ""}${hours ? hours + "h " : ""}${
      mins ? mins + "m" : ""
    }`.trim();
  };

  const getColorClass = (percentage) => {
    const abs = Math.abs(percentage);
    if (abs >= 30) return "progress-red";
    if (abs >= 10) return "progress-yellow";
    return "progress-green";
  };

  // 📈 Performance Calculation
  const totalTasks = tasks.length;
  const workDoneOnTime = tasks.filter(
    (t) => t.status === "Complete" && !t.isLate
  ).length;
  const workDoneLate = tasks.filter(
    (t) => t.status === "Complete" && t.isLate
  ).length;
  const workNotDone = tasks.filter((t) => t.status !== "Complete").length;
  const workDone = workDoneOnTime + workDoneLate;

  const workNotDoneScore =
    totalTasks > 0 ? -(workNotDone / totalTasks) * 100 : 0;
  const lateSubmissionScore =
    workDone > 0 ? -(workDoneLate / workDone) * 100 : 0;
  const performanceGap = workNotDoneScore + lateSubmissionScore;

  // Calculate performance against manifestation targets
  const calculatePerformanceAgainstTarget = (actual, target) => {
    if (!target || isNaN(target)) return null;
    const difference = actual - Math.abs(target);
    return {
      value: difference.toFixed(2),
      isPositive: difference <= 0,
      percentage: ((difference / Math.abs(target)) * 100).toFixed(2),
    };
  };

  const workNotDonePerformance = selectedManifestation
    ? calculatePerformanceAgainstTarget(
        Math.abs(workNotDoneScore),
        selectedManifestation.workNotDoneTarget
      )
    : null;

  const lateSubmissionPerformance = selectedManifestation
    ? calculatePerformanceAgainstTarget(
        Math.abs(lateSubmissionScore),
        selectedManifestation.lateSubmissionTarget
      )
    : null;

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar id={id} role={role} />
      <div className="clmis-container">
        <h1 className="clmis-title">Checklist MIS Report</h1>

        {/* Filters */}
        <div className="clmis-filter-card">
          <div className="clmis-filter-grid">
            <div>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label>Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  fetchManifestations(e.target.value);
                }}
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="clmis-btn clmis-btn-primary"
            onClick={fetchTasks}
            disabled={loading}
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
        </div>

        {/* Summary */}
        <div className="clmis-summary-section">
          <div className="clmis-summary-cards">
            <div className="clmis-summary-card clmis-summary-total">
              <span className="clmis-count">{totalTasks}</span>
              <span className="clmis-label">Total Tasks</span>
            </div>
            <div className="clmis-summary-card clmis-summary-done">
              <span className="clmis-count">{workDoneOnTime}</span>
              <span className="clmis-label">Work Done on Time</span>
            </div>
            <div className="clmis-summary-card clmis-summary-late">
              <span className="clmis-count">{workDoneLate}</span>
              <span className="clmis-label">Work Done Late</span>
            </div>
            <div className="clmis-summary-card clmis-summary-missed">
              <span className="clmis-count">{workNotDone}</span>
              <span className="clmis-label">Work Not Done</span>
            </div>
          </div>
          <div className="clmis-manifestation-form">
            <h3>Save Manifestation Target</h3>
            <div className="clmis-manifestation-grid">
              <div>
                <label>Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="all">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Work Not Done Target (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. -20"
                  value={manifestWorkNotDone}
                  onChange={(e) => setManifestWorkNotDone(e.target.value)}
                />
              </div>
              <div>
                <label>Work not Done On Time Target (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. -10"
                  value={manifestLateSubmission}
                  onChange={(e) => setManifestLateSubmission(e.target.value)}
                />
              </div>
              <div>
                <button
                  className="clmis-btn clmis-btn-success"
                  onClick={handleSaveManifestation}
                >
                  Save Manifestation
                </button>
              </div>
            </div>
          </div>

          {/* Manifestation Display */}
          {selectedManifestation && (
            <div className="clmis-manifestation-display">
              <div className="clmis-manifestation-header">
                <h3>Manifestation Targets</h3>
                <span className="clmis-date-range">
                  {formatDate(selectedManifestation.startDate)} -{" "}
                  {formatDate(selectedManifestation.endDate)}
                </span>
              </div>

              <div className="clmis-targets">
                <div className="clmis-target-card">
                  <div className="clmis-target-header">
                    <span className="clmis-target-label">
                      Work Not Done Target
                    </span>
                    <span className="clmis-target-value">
                      {selectedManifestation.workNotDoneTarget}%
                    </span>
                  </div>
                  <div className="clmis-target-performance">
                    <span
                      className={`clmis-performance-indicator ${
                        workNotDonePerformance.isPositive
                          ? "clmis-positive"
                          : "clmis-negative"
                      }`}
                    >
                      {workNotDonePerformance.isPositive ? "✓" : "✗"}{" "}
                      {workNotDonePerformance.value}%
                    </span>
                    <span className="clmis-performance-difference">
                      ({workNotDonePerformance.percentage}%{" "}
                      {workNotDonePerformance.isPositive ? "better" : "worse"}{" "}
                      than target)
                    </span>
                  </div>
                </div>

                <div className="clmis-target-card">
                  <div className="clmis-target-header">
                    <span className="clmis-target-label">
                      Late Submission Target
                    </span>
                    <span className="clmis-target-value">
                      {selectedManifestation.lateSubmissionTarget}%
                    </span>
                  </div>
                  <div className="clmis-target-performance">
                    <span
                      className={`clmis-performance-indicator ${
                        lateSubmissionPerformance.isPositive
                          ? "clmis-positive"
                          : "clmis-negative"
                      }`}
                    >
                      {lateSubmissionPerformance.isPositive ? "✓" : "✗"}{" "}
                      {lateSubmissionPerformance.value}%
                    </span>
                    <span className="clmis-performance-difference">
                      ({lateSubmissionPerformance.percentage}%{" "}
                      {lateSubmissionPerformance.isPositive
                        ? "better"
                        : "worse"}{" "}
                      than target)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Bars */}
          <div className="clmis-performance-bars">
            <div>
              <p>
                Work Not Done: {workNotDoneScore.toFixed(2)}%
                {selectedManifestation && (
                  <span className="clmis-performance-target">
                    (Target: {selectedManifestation.workNotDoneTarget}%)
                  </span>
                )}
              </p>
              <div className="clmis-progress-container">
                <div
                  className={`clmis-progress-fill ${getColorClass(
                    workNotDoneScore
                  )}`}
                  style={{ width: `${Math.abs(workNotDoneScore)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <p>
                Work Not Done On Time Score: {lateSubmissionScore.toFixed(2)}%
                {selectedManifestation && (
                  <span className="clmis-performance-target">
                    (Target: {selectedManifestation.lateSubmissionTarget}%)
                  </span>
                )}
              </p>
              <div className="clmis-progress-container">
                <div
                  className={`clmis-progress-fill ${getColorClass(
                    lateSubmissionScore
                  )}`}
                  style={{ width: `${Math.abs(lateSubmissionScore)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <p>Performance Gap: {performanceGap.toFixed(2)}%</p>
              <div className="clmis-progress-container">
                <div
                  className={`clmis-progress-fill ${getColorClass(
                    performanceGap
                  )}`}
                  style={{ width: `${Math.abs(performanceGap)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Table */}
        <div className="clmis-table-wrapper">
          <table className="clmis-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Doer</th>
                <th>Due Date</th>
                <th>Completed Date</th>
                <th>Status</th>
                <th>Late</th>
                <th>Time Difference</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={`${task.taskId}-${task.dueDate}`}>
                    <td>{task.taskName}</td>
                    <td>{task.doerName}</td>
                    <td>
                      {formatDate(task.dueDate)} {formatTime(task.dueDate)}
                    </td>
                    <td>
                      {task.completedDate
                        ? `${formatDate(task.completedDate)} ${formatTime(
                            task.completedDate
                          )}`
                        : "-"}
                    </td>
                    <td>
                      <span
                        className={`clmis-status clmis-status-${task.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`clmis-late-indicator clmis-late-${
                          task.isLate ? "yes" : "no"
                        }`}
                      >
                        {task.isLate ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      {formatPreciseTimeDiff(task.dueDate, task.completedDate)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="clmis-empty-state">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default CheckListMIS;
