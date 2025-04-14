import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./checklistmis.css";
import Sidebar from "../../../../Sidebar/Sidebar";
import Navbar from "../../../../Navbar/Navbar";

const CheckListMIS = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [checklistData, setChecklistData] = useState([]);
  const [existingManifestation, setExistingManifestation] = useState(null);

  const [token, setToken] = useState("");
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});
  const [manifestationData, setManifestationData] = useState({
    workNotDoneTarget: 0,
    lateSubmissionTarget: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            { withCredentials: true }
          ),
        ]);

        const userToken = tokenRes.data.token;
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};
        const decodedToken = jwtDecode(userToken);

        const currentUserId = decodedToken.userId;
        const currentEmployeeId = decodedToken.id;

        setToken(userToken);
        setRole(userRole);
        setUserId(currentUserId);
        setEmployeeId(currentEmployeeId);
        setCustomPermissions(userPermissions);

        fetchEmployeesAndDepartments(userToken);
      } catch (error) {
        console.error("Error fetching authentication data:", error);
      }
    };

    fetchAuthData();
  }, [navigate]);

  const fetchExistingManifestation = async (empId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/checkmis/get-manifestation`,
        {
          params: {
            employeeId: empId,
            startDate,
            endDate,
          },
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        if (response.data.manifestation) {
          setExistingManifestation(response.data.manifestation);
          setManifestationData({
            workNotDoneTarget: response.data.manifestation.workNotDoneTarget,
            lateSubmissionTarget:
              response.data.manifestation.lateSubmissionTarget,
          });
        } else {
          setExistingManifestation(null);
          setManifestationData({
            workNotDoneTarget: 0,
            lateSubmissionTarget: 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching manifestation:", error);
    }
  };

  useEffect(() => {
    if (reportData && reportData.employees.length > 0 && token) {
      const empId =
        selectedEmployee !== "all"
          ? selectedEmployee
          : reportData.employees[0]?.employeeId;
      if (empId && empId !== "N/A") {
        fetchExistingManifestation(empId);
      }
    }
  }, [reportData, startDate, endDate, token, selectedEmployee]);

  const fetchEmployeesAndDepartments = async (userToken) => {
    try {
      const employeesResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
          withCredentials: true,
        }
      );
      setEmployees(employeesResponse.data);
    } catch (err) {
      console.error("Error fetching filter data:", err);
    }
  };

  const fetchChecklistData = async () => {
    if (!token) return;

    try {
      let queryParams = `?startDate=${startDate}&endDate=${endDate}&generateFutureTasks=true`;
      if (selectedEmployee !== "all")
        queryParams += `&userId=${selectedEmployee}`;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/list${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setChecklistData(response.data);
    } catch (err) {
      console.error("Error fetching checklist data:", err);
    }
  };

  const fetchMISReport = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      await fetchChecklistData();

      let queryParams = `?startDate=${startDate}&endDate=${endDate}`;
      if (selectedEmployee !== "all")
        queryParams += `&userId=${selectedEmployee}`;
      if (selectedDepartment !== "all")
        queryParams += `&departmentId=${selectedDepartment}`;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/checkmis/mis-report${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      const processedData = {
        ...response.data,
        employees: response.data.employees.map((employee) => ({
          ...employee,
          tasks: employee.tasks.map((task) => {
            const relevantStatus = (task.allStatusHistory || [])
              .filter((status) => status.status !== "Pending")
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            const isCompleted = relevantStatus?.status === "Completed";
            const hasCompletionTime = !!relevantStatus?.completedDateTime;
            const isLate =
              isCompleted &&
              hasCompletionTime &&
              new Date(relevantStatus.completedDateTime) > new Date(task.dueDate);
            const isMissed = !isCompleted && new Date() > new Date(task.dueDate);

            return {
              ...task,
              isCompleted,
              isLate,
              isMissed,
              hasCompletionTime,
              relevantStatus,
            };
          }),
        })),
      };

      setReportData(processedData);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to fetch MIS report";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const extractTime = (dateString) => {
    if (!dateString) return "-";
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const getPerformanceColorClass = (percentage) => {
    const absPercentage = Math.abs(percentage);
    if (absPercentage >= 30) return "progress-red";
    if (absPercentage >= 10) return "progress-yellow";
    return "progress-green";
  };

  const handleManifestationChange = (e) => {
    const { name, value } = e.target;
    setManifestationData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const saveManifestation = async (employeeId) => {
    try {
      if (!employeeId || employeeId === "N/A" || employeeId === "all") {
        alert("Please select a valid employee before saving");
        return;
      }

      const targets = {
        workNotDoneTarget: manifestationData.workNotDoneTarget,
        lateSubmissionTarget: manifestationData.lateSubmissionTarget,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/checkmis/save-manifestation`,
        {
          employeeId,
          startDate,
          endDate,
          ...targets,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        alert("Manifestation saved successfully!");
        fetchExistingManifestation(employeeId);
      }
    } catch (error) {
      console.error("Error saving manifestation:", error);
    }
  };

  const formatPreciseTimeDiff = (startDate, endDate) => {
    if (!startDate || !endDate) return "-";

    const diffMs = new Date(endDate) - new Date(startDate);
    if (diffMs <= 0) return "On time";

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const seconds = diffSeconds % 60;
    const minutes = diffMinutes % 60;
    const hours = diffHours % 24;

    let parts = [];
    if (diffDays > 0) parts.push(`${diffDays} day${diffDays > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);

    return parts.join(" ");
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="mis-report-container">
        <h1 className="mis-report-title">Task Performance Gap Report</h1>

        <div className="filter-card">
          <div className="filter-grid">
            <div className="filter-item">
              <label className="filter-label">Start Date</label>
              <input
                type="date"
                className="date-input"
                value={startDate}
                onChange={handleStartDateChange}
              />
            </div>

            <div className="filter-item">
              <label className="filter-label">End Date</label>
              <input
                type="date"
                className="date-input"
                value={endDate}
                onChange={handleEndDateChange}
              />
            </div>

            <div className="filter-item">
              <label className="filter-label">Employee</label>
              <select
                className="select-input"
                value={selectedEmployee}
                onChange={handleEmployeeChange}
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

          <div className="filter-actions">
            <button
              className="btn btn-primary"
              onClick={fetchMISReport}
              disabled={loading}
            >
              {loading ? "Loading..." : "Generate Report"}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {reportData && reportData.employees.length > 0 && (
          <div className="report-content">
            <div className="detailed-report">
              {reportData.employees.map((employee) => {
                const completedTasks = employee.tasks.filter(
                  (t) => t.isCompleted
                );
                const lateTasks = completedTasks.filter((t) => t.isLate);
                const missedTasks = employee.tasks.filter((t) => t.isMissed);

                return (
                  <div key={employee.employeeId} className="employee-card">
                    <h3 className="employee-name">
                      {employee.employeeName} ({employee.employeeId}) -{" "}
                      {employee.department}
                    </h3>
                    <div className="manifestation-section">
                      <h4 className="section-title">
                        Performance Manifestation ({formatDate(startDate)} to{" "}
                        {formatDate(endDate)})
                      </h4>
                      {existingManifestation && (
                        <>
                          <div className="manifestation-info">
                            <p>
                              Existing targets set on:{" "}
                              {formatDateTime(existingManifestation.updatedAt)}
                            </p>
                          </div>
                          <div className="manifestation-info">
                            <p>
                              Existing targets set on:{" "}
                              {existingManifestation.workNotDoneTarget}%
                            </p>
                            <p>
                              Existing targets set on:{" "}
                              {existingManifestation.lateSubmissionTarget}%
                            </p>
                          </div>
                        </>
                      )}
                      <div className="manifestation-form">
                        <div className="manifestation-input">
                          <label>Work Not Done Target (%)</label>
                          <input
                            type="number"
                            name="workNotDoneTarget"
                            value={manifestationData.workNotDoneTarget}
                            onChange={handleManifestationChange}
                            min="-100"
                            max="0"
                            step="1"
                          />
                        </div>
                        <div className="manifestation-input">
                          <label>Late Submission Target (%)</label>
                          <input
                            type="number"
                            name="lateSubmissionTarget"
                            value={manifestationData.lateSubmissionTarget}
                            onChange={handleManifestationChange}
                            min="-100"
                            max="0"
                            step="1"
                          />
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            const empIdToSave =
                              selectedEmployee !== "all"
                                ? selectedEmployee
                                : employee.employeeId;
                            saveManifestation(empIdToSave);
                          }}
                          disabled={!employeeId}
                        >
                          {existingManifestation
                            ? "Update Manifestation"
                            : "Save Manifestation"}
                        </button>
                      </div>
                    </div>
                    <div className="metrics-grid">
                      <div className="metric-card total">
                        <div className="metric-label">Total Tasks</div>
                        <div className="metric-value">
                          {employee.totalTasks}
                        </div>
                      </div>
                      <div className="metric-card done">
                        <div className="metric-label">
                          Work Not Done On Time
                        </div>
                        <div className="metric-value">
                          {employee.completedLate}
                        </div>
                      </div>
                      <div className="metric-card late">
                        <div className="metric-label">Work Done on Time</div>
                        <div className="metric-value">
                          {employee.completedOnTime}
                        </div>
                      </div>
                      <div className="metric-card missed">
                        <div className="metric-label">Work Not Done</div>
                        <div className="metric-value">
                          {employee.workNotDone}
                        </div>
                      </div>
                    </div>

                    <h4 className="section-title">Performance Issues</h4>
                    <div className="performance-metrics">
                      <div className="metric">
                        <p>
                          Work Not Done:{" "}
                          {employee.workNotDoneScore.toFixed(2)}%
                        </p>
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${getPerformanceColorClass(
                              employee.workNotDoneScore
                            )}`}
                            style={{
                              width: `${Math.abs(employee.workNotDoneScore)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="metric">
                        <p>
                          Work Not Done On Time Score:{" "}
                          {employee.lateSubmissionScore.toFixed(2)}%
                        </p>
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${getPerformanceColorClass(
                              employee.lateSubmissionScore
                            )}`}
                            style={{
                              width: `${Math.abs(
                                employee.lateSubmissionScore
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="metric">
                        <p>
                          Performance Gap:{" "}
                          {employee.performanceGap.toFixed(2)}%
                        </p>
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${getPerformanceColorClass(
                              employee.performanceGap
                            )}`}
                            style={{
                              width: `${Math.abs(employee.performanceGap)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <h4 className="section-title">Task Details</h4>
                    <div className="table-responsive">
                      <table className="report-table precise-time-table">
                        <thead>
                          <tr>
                            <th>Task Name</th>
                            <th>Due Date</th>
                            <th>Completed Date</th>
                            <th>Time Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employee.tasks.map((task) => {
                            const dueDate = task.dueDate;
                            const completedDate =
                              task.relevantStatus?.completedDateTime;
                            const status =
                              task.relevantStatus?.status || "Pending";

                            return (
                              <tr
                                key={`${task.taskId}-${task.dueDate}`}
                                className={
                                  task.isMissed || task.isLate
                                    ? "row-highlight"
                                    : ""
                                }
                              >
                                <td>{task.taskName}</td>
                                <td>
                                  <div className="datetime-cell">
                                    <div>{formatDate(dueDate)}</div>
                                    <div className="time-text">
                                      {extractTime(dueDate)}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  {completedDate ? (
                                    <div className="datetime-cell">
                                      <div>{formatDate(completedDate)}</div>
                                      <div className="time-text">
                                        {extractTime(completedDate)}
                                      </div>
                                    </div>
                                  ) : status === "Completed" ? (
                                    "No time recorded"
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td>
                                  {completedDate ? (
                                    <span
                                      className={
                                        task.isLate ? "text-red" : "text-green"
                                      }
                                    >
                                      {formatPreciseTimeDiff(
                                        dueDate,
                                        completedDate
                                      )}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {reportData && reportData.employees.length === 0 && (
          <div className="empty-state">
            <p>No data found for the selected criteria</p>
            <button className="btn btn-secondary" onClick={fetchMISReport}>
              Change filters and try again
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CheckListMIS;