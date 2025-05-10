import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "./delegationmis.css";
import Sidebar from "../../../Sidebar/Sidebar";
import Navbar from "../../../Navbar/Navbar";

const DelegationMis = () => {
  const { companyName } = useParams();
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    workDone: 0,
    workNotDone: 0,
    completedOnTime: 0,
    completedLate: 0,
    revisedTasks: 0,
    workNotDoneScore: 0,
    lateSubmissionScore: 0,
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
  });
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [reportMetrics, setReportMetrics] = useState({
    avgLateTime: { hours: 0, minutes: 0, lateTaskCount: 0 },
  });
  const [manifestations, setManifestations] = useState({
    workNotDone: "",
    workDoneLate: "",
  });
  const [existingManifestation, setExistingManifestation] = useState(null);
  const [savedManifestations, setSavedManifestations] = useState([]);
  const [selectedManifestationRange, setSelectedManifestationRange] =
    useState(null);

  // Authentication state
  const [token, setToken] = useState("");
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        // Step 1: Fetch Token
        const tokenRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );

        const userToken = tokenRes.data.token;
        const decodedToken = jwtDecode(userToken);

        setToken(userToken);
        setUserId(decodedToken.userId);
        setEmployeeId(decodedToken.id);

        // Step 2: Fetch Role
        const roleRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
          { withCredentials: true }
        );
        const userRole = roleRes.data.role;
        setRole(userRole);

        // Step 3: Fetch Permissions (after token available)
        const permissionsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            withCredentials: true,
          }
        );
        const userPermissions = permissionsRes.data.permissions || {};
        setCustomPermissions(userPermissions);

        // Step 4: Fetch Employees
        fetchEmployees(userToken);
      } catch (error) {
        console.error("Error fetching authentication data:", error);
      }
    };

    fetchAuthData();
  }, [navigate]);

  useEffect(() => {
    if (token) {
      fetchSavedManifestations();
    }
  }, [token]);

  useEffect(() => {
    if (reportGenerated && token) {
      // Only fetch if we have a selected manifestation
      if (selectedManifestationRange) {
        fetchManifestations();
      } else {
        // Clear the form when no manifestation is selected
        setExistingManifestation(null);
        setManifestations({
          workNotDone: "",
          workDoneLate: "",
        });
      }
    }
  }, [reportGenerated, selectedEmployee, token, selectedManifestationRange]);

  const fetchSavedManifestations = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/delegationmis/manifestations/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      setSavedManifestations(response.data);
    } catch (error) {
      console.error("Error fetching saved manifestations:", error);
    }
  };

  const fetchManifestations = async () => {
    try {
      setLoading(true);

      // Only proceed if we have a selected manifestation
      if (selectedManifestationRange) {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/delegationmis/manifestations`,
          {
            params: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
              employeeId: selectedEmployee === "all" ? null : selectedEmployee,
            },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );

        if (response.data) {
          setExistingManifestation(response.data);
          setManifestations({
            workNotDone: response.data.workNotDoneManifestation || "",
            workDoneLate: response.data.workDoneLateManifestation || "",
          });
          return;
        }
      }

      // Default empty state
      setExistingManifestation(null);
      setManifestations({
        workNotDone: "",
        workDoneLate: "",
      });
    } catch (error) {
      console.error("Error fetching manifestations:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setError("Failed to load manifestations. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveManifestations = async () => {
    try {
      if (
        !manifestations.workNotDone.trim() &&
        !manifestations.workDoneLate.trim()
      ) {
        setError("Please enter at least one manifestation");
        return;
      }

      // Create dates at start and end of day for proper range comparison
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      // Check if manifestation already exists for this date range
      const existingForRange = savedManifestations.find((m) => {
        const existingStart = new Date(m.startDate);
        const existingEnd = new Date(m.endDate);
        return (
          startDate.getTime() === existingStart.getTime() &&
          endDate.getTime() === existingEnd.getTime() &&
          m.employeeId ===
            (selectedEmployee === "all" ? null : selectedEmployee)
        );
      });

      if (existingForRange) {
        setError(
          "Manifestation already exists for this date range. Please select it from the dropdown."
        );
        return;
      }

      const employee = employees.find((e) => e._id === selectedEmployee);
      const payload = {
        employeeId: selectedEmployee === "all" ? null : selectedEmployee,
        employeeName:
          selectedEmployee === "all"
            ? "All Employees"
            : employee?.fullName || "N/A",
        startDate,
        endDate,
        workNotDoneManifestation: manifestations.workNotDone,
        workDoneLateManifestation: manifestations.workDoneLate,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/delegationmis/manifestations`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data) {
        setExistingManifestation(response.data);
        setError(null);
        fetchSavedManifestations(); // Refresh the list of saved manifestations
        alert("Manifestations saved successfully!");
      }
    } catch (error) {
      console.error("Error saving manifestations:", error);
      if (error.response?.status === 401) {
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to save manifestations. Please try again."
        );
      }
    }
  };

  const loadManifestation = (manifestation) => {
    if (!manifestation) {
      setSelectedManifestationRange(null);
      setManifestations({
        workNotDone: "",
        workDoneLate: "",
      });
      setExistingManifestation(null);
      return;
    }

    setSelectedManifestationRange(manifestation._id);
    setManifestations({
      workNotDone: manifestation.workNotDoneManifestation || "",
      workDoneLate: manifestation.workDoneLateManifestation || "",
    });
    setExistingManifestation(manifestation);
  };

  const fetchEmployees = async (userToken) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            withCredentials: true,
          },
        }
      );
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/delegationmis/mis`,
        {
          params: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          },
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );
      setTasks(response.data.tasks || []);
      calculateMetrics(response.data.tasks || [], response.data.avgLateTime);
    } catch (error) {
      console.error("Error fetching delegation data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (
    tasksToCalculate,
    avgLateTime = { hours: 0, minutes: 0, lateTaskCount: 0 }
  ) => {
    try {
      const totalTasks = tasksToCalculate.length;
      const workDone = tasksToCalculate.filter(
        (t) => t.status === "Completed"
      ).length;
      const workNotDone = totalTasks - workDone;
      const revisedTasks = tasksToCalculate.filter(
        (t) => t.status === "Revised"
      ).length;

      const completedOnTime = tasksToCalculate.filter((t) => {
        if (t.status !== "Completed") return false;
        const dueDateTime = new Date(t.dueDate);
        if (t.time) {
          const [hours, minutes] = t.time.split(":");
          dueDateTime.setHours(hours, minutes);
        }
        const completedAt = new Date(t.completedAt);
        return completedAt <= dueDateTime;
      }).length;

      const completedLate = workDone - completedOnTime;

      setMetrics({
        totalTasks,
        workDone,
        workNotDone,
        completedOnTime,
        completedLate,
        revisedTasks,
        workNotDoneScore: totalTasks > 0 ? (workNotDone / totalTasks) * 100 : 0,
        lateSubmissionScore:
          workDone > 0 ? (completedLate / workDone) * 100 : 0,
      });

      setReportMetrics((prev) => ({
        ...prev,
        avgLateTime,
      }));
    } catch (error) {
      console.error("Error calculating metrics:", error);
      setMetrics({
        totalTasks: 0,
        workDone: 0,
        workNotDone: 0,
        completedOnTime: 0,
        completedLate: 0,
        revisedTasks: 0,
        workNotDoneScore: 0,
        lateSubmissionScore: 0,
      });
    }
  };

  const handleDateChange = (e, type) => {
    setDateRange((prev) => ({
      ...prev,
      [type]: new Date(e.target.value),
    }));
  };

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/delegationmis/mis`,
        {
          params: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
            employeeId: selectedEmployee === "all" ? null : selectedEmployee,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );

      const fetchedTasks = response.data.tasks || [];
      const avgLateTime = response.data.avgLateTime || {
        hours: 0,
        minutes: 0,
        lateTaskCount: 0,
      };
      const selectedEmpName =
        selectedEmployee === "all"
          ? null
          : employees.find((e) => e._id === selectedEmployee)?.fullName ||
            "N/A";

      let timeStats = {
        minTimeTask: null,
        maxTimeTask: null,
        avgTime: null,
      };

      const completedTasks = fetchedTasks.filter(
        (t) => t.status === "Completed" && t.timeTaken
      );

      if (completedTasks.length > 0) {
        const times = completedTasks.map(
          (t) => t.timeTaken.hours * 60 + t.timeTaken.minutes
        );

        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        timeStats = {
          minTimeTask: completedTasks.find(
            (t) => t.timeTaken.hours * 60 + t.timeTaken.minutes === minTime
          ),
          maxTimeTask: completedTasks.find(
            (t) => t.timeTaken.hours * 60 + t.timeTaken.minutes === maxTime
          ),
          avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        };
      }

      const preparedData = fetchedTasks.map((task) => {
        let isLate = false;
        if (task.status === "Completed") {
          const dueDateTime = new Date(task.dueDate);
          if (task.time) {
            const [hours, minutes] = task.time.split(":");
            dueDateTime.setHours(hours, minutes);
          }
          const completedAt = new Date(task.completedAt);
          isLate = completedAt > dueDateTime;
        }

        const assignedToName =
          selectedEmployee !== "all"
            ? selectedEmpName
            : task.doer
            ? employees.find((e) => e._id === task.doer)?.fullName || "N/A"
            : "Unassigned";

        let completionDetails = "";
        if (task.status === "Completed" && task.timeTaken) {
          const prefix = task.timeTaken.isLate ? "Late by" : "Completed";
          completionDetails = `${prefix} ${task.timeTaken.hours}h ${task.timeTaken.minutes}m`;
        } else if (task.status === "Revised") {
          completionDetails = `Revised to ${task.revisedDate}`;
        } else {
          completionDetails = "Not Completed";
        }

        return {
          name: task.name,
          description: task.description,
          assignedTo: assignedToName,
          dueDate: task.dueDate
            ? `${new Date(task.dueDate).toLocaleDateString()} ${
                task.time || ""
              }`.trim()
            : "N/A",
          time: task.time || "N/A",
          status: isLate ? "Completed (Late)" : task.status || "Pending",
          isLate,
          completedAt:
            task.status === "Completed"
              ? task.completedAt
                ? new Date(task.completedAt).toLocaleString()
                : "N/A"
              : "N/A",
          revisedDate:
            task.status === "Revised"
              ? task.revisedDate
                ? new Date(task.revisedDate).toLocaleDateString()
                : "N/A"
              : "N/A",
          revisedReason: task.revisedReason || "N/A",
          completionDetails,
          timeTaken: task.timeTaken,
        };
      });

      const totalTasks = fetchedTasks.length;
      const workDone = fetchedTasks.filter(
        (t) => t.status === "Completed"
      ).length;
      const workNotDone = totalTasks - workDone;
      const revisedTasks = fetchedTasks.filter(
        (t) => t.status === "Revised"
      ).length;

      const completedOnTime = fetchedTasks.filter((t) => {
        if (t.status !== "Completed") return false;
        const dueDateTime = new Date(t.dueDate);
        if (t.time) {
          const [hours, minutes] = t.time.split(":");
          dueDateTime.setHours(hours, minutes);
        }
        const completedAt = new Date(t.completedAt);
        return completedAt <= dueDateTime;
      }).length;

      const completedLate = workDone - completedOnTime;

      setReportMetrics({
        totalTasks,
        workDone,
        workNotDone,
        completedOnTime,
        completedLate,
        revisedTasks,
        workNotDoneScore: totalTasks > 0 ? (workNotDone / totalTasks) * 100 : 0,
        lateSubmissionScore:
          workDone > 0 ? (completedLate / workDone) * 100 : 0,
        avgLateTime,
        timeStats,
      });

      setReportData(preparedData);
      setReportGenerated(true);
    } catch (error) {
      console.error("Error generating report:", error);
      setError("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    {
      name: "Completed On Time",
      value: reportGenerated
        ? reportMetrics.completedOnTime
        : metrics.completedOnTime,
      color: "#4CAF50",
    },
    {
      name: "Completed Late",
      value: reportGenerated
        ? reportMetrics.completedLate
        : metrics.completedLate,
      color: "#F44336",
    },
    {
      name: "Revised",
      value: reportGenerated
        ? reportMetrics.revisedTasks
        : metrics.revisedTasks,
      color: "#FFFF00",
    },
    {
      name: "Not Done",
      value: reportGenerated ? reportMetrics.workNotDone : metrics.workNotDone,
      color: "#F44336",
    },
  ];

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="delegation-mis-container">
        <h2>Delegation MIS Dashboard - {companyName}</h2>

        <div className="filters-section">
          <div className="date-range-selector">
            <label>
              Start Date:
              <input
                type="date"
                value={dateRange.start.toISOString().split("T")[0]}
                onChange={(e) => handleDateChange(e, "start")}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                value={dateRange.end.toISOString().split("T")[0]}
                onChange={(e) => handleDateChange(e, "end")}
              />
            </label>
          </div>

          <div className="employee-filter">
            <label>
              Filter by Employee:
              <select value={selectedEmployee} onChange={handleEmployeeChange}>
                <option value="all">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="generate-report-btn"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>

        {reportGenerated ? (
          <>
            <div className="metrics-summary">
              <div className="metric-card">
                <h3>Fastest Completion</h3>
                <p>
                  {reportMetrics.timeStats?.minTimeTask
                    ? `${reportMetrics.timeStats.minTimeTask.name} (${reportMetrics.timeStats.minTimeTask.timeTaken.hours}h ${reportMetrics.timeStats.minTimeTask.timeTaken.minutes}m)`
                    : "N/A"}
                </p>
              </div>
              <div className="metric-card">
                <h3>Slowest Completion</h3>
                <p>
                  {reportMetrics.timeStats?.maxTimeTask
                    ? `${reportMetrics.timeStats.maxTimeTask.name} (${reportMetrics.timeStats.maxTimeTask.timeTaken.hours}h ${reportMetrics.timeStats.maxTimeTask.timeTaken.minutes}m)`
                    : "N/A"}
                </p>
              </div>
              <div className="metric-card">
                <h3>Avg Time Taken</h3>
                <p>
                  {reportMetrics.timeStats?.avgTime
                    ? `${Math.floor(
                        reportMetrics.timeStats.avgTime / 60
                      )}h ${Math.floor(reportMetrics.timeStats.avgTime % 60)}m`
                    : "N/A"}
                </p>
              </div>
              <div className="metric-card">
                <h3>Avg Late Time</h3>
                <p>
                  {reportMetrics.avgLateTime.lateTaskCount > 0
                    ? `${reportMetrics.avgLateTime.hours}h ${reportMetrics.avgLateTime.minutes}m (${reportMetrics.avgLateTime.lateTaskCount} tasks)`
                    : "No late tasks"}
                </p>
              </div>
              <div className="metric-card work-done">
                <h3>Total Work</h3>
                <p> {reportMetrics.totalTasks}</p>
              </div>
              <div className="metric-card work-done">
                <h3>Work Done</h3>
                <p>{reportMetrics.workDone}</p>
                <div className="metric-percentage">
                  {reportMetrics.totalTasks > 0
                    ? `${Math.round(
                        (reportMetrics.workDone / reportMetrics.totalTasks) *
                          100
                      )}%`
                    : "0%"}
                </div>
              </div>

              <div className="metric-card work-not-done">
                <h3>Work Not Done</h3>
                <p>{reportMetrics.workNotDone}</p>
                <div className="metric-percentage">
                  {reportMetrics.totalTasks > 0
                    ? `${Math.round(
                        (reportMetrics.workNotDone / reportMetrics.totalTasks) *
                          100
                      )}%`
                    : "0%"}
                </div>
              </div>

              <div className="metric-card work-done-late">
                <h3>Work Not Done On Time</h3>
                <p>{reportMetrics.completedLate}</p>
                <div className="metric-percentage">
                  {reportMetrics.workDone > 0
                    ? `${Math.round(
                        (reportMetrics.completedLate / reportMetrics.workDone) *
                          100
                      )}%`
                    : "0%"}
                </div>
              </div>
            </div>
            <div className="graph-manifest-delgate">
              {reportGenerated && (
                <div className="delegate-manifestation-section">
                  <h3>Manifestation for Next Week EM Meeting</h3>
                  <div className="manifestation-filter">
                    <label>
                      Load Saved Manifestation:
                      <select
                        value={selectedManifestationRange || ""}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          if (!selectedId) {
                            // Clear everything when "Create New Manifestation" is selected
                            setSelectedManifestationRange(null);
                            setExistingManifestation(null);
                            setManifestations({
                              workNotDone: "",
                              workDoneLate: "",
                            });
                          } else {
                            setSelectedManifestationRange(selectedId);
                            // The useEffect will handle fetching the data
                          }
                        }}
                      >
                        <option value="">-- Create New Manifestation --</option>
                        {savedManifestations.map((manifestation) => (
                          <option
                            key={manifestation._id}
                            value={manifestation._id}
                          >
                            {manifestation.employeeName || "All Employees"} -{" "}
                            {new Date(
                              manifestation.startDate
                            ).toLocaleDateString()}{" "}
                            to{" "}
                            {new Date(
                              manifestation.endDate
                            ).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Show the selected manifestation if one is chosen */}
                  {selectedManifestationRange && existingManifestation ? (
                    <>
                      <div className="existing-manifestation-info">
                        <p>
                          Date range:{" "}
                          {new Date(
                            existingManifestation.startDate
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(
                            existingManifestation.endDate
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          Created by:{" "}
                          {existingManifestation.employeeName || "Unknown"} on{" "}
                          {new Date(
                            existingManifestation.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div className="manifestation-input">
                        <label>
                          Work Not Done Manifestation:
                          <textarea
                            value={manifestations.workNotDone}
                            readOnly
                            placeholder="Manifestation content..."
                          />
                        </label>
                      </div>

                      <div className="manifestation-input">
                        <label>
                          Work Done But Late Manifestation:
                          <textarea
                            value={manifestations.workDoneLate}
                            readOnly
                            placeholder="Manifestation content..."
                          />
                        </label>
                      </div>

                      <div className="manifestation-actions">
                        <button
                          className="clear-manifestation-btn"
                          onClick={() => {
                            setManifestations({
                              workNotDone: "",
                              workDoneLate: "",
                            });
                            setExistingManifestation(null);
                            setSelectedManifestationRange(null);
                          }}
                          disabled={loading}
                        >
                          Clear
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Default: show create new manifestation form with blank fields */
                    <>
                      <div className="manifestation-input">
                        <label>
                          Work Not Done Manifestation:
                          <textarea
                            value={manifestations.workNotDone}
                            onChange={(e) =>
                              setManifestations({
                                ...manifestations,
                                workNotDone: e.target.value,
                              })
                            }
                            placeholder="Enter manifestation for work not done..."
                          />
                        </label>
                      </div>

                      <div className="manifestation-input">
                        <label>
                          Work Done But Late Manifestation:
                          <textarea
                            value={manifestations.workDoneLate}
                            onChange={(e) =>
                              setManifestations({
                                ...manifestations,
                                workDoneLate: e.target.value,
                              })
                            }
                            placeholder="Enter manifestation for work done but late..."
                          />
                        </label>
                      </div>

                      <div className="manifestation-actions">
                        <button
                          className="save-manifestation-btn"
                          onClick={saveManifestations}
                          disabled={loading}
                        >
                          {loading ? "Saving..." : "Save Manifestations"}
                        </button>
                      </div>
                    </>
                  )}

                  {error && <div className="manifestation-error">{error}</div>}
                </div>
              )}
              <div className="delegate-chart-container">
                <h3>Task Status Distribution</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="task-list">
              <h3>Task Details ({reportData.length})</h3>
              {reportData.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Assigned To</th>
                      <th>Due Date & Time</th>
                      <th>Status</th>
                      <th>Time Taken</th>
                      <th>Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((task, index) => (
                      <tr
                        key={index}
                        className={
                          task.status === "Completed (Late)"
                            ? "status-completed-late"
                            : `status-${task.status
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`
                        }
                      >
                        <td>{task.name}</td>
                        <td>{task.assignedTo}</td>
                        <td>{task.dueDate}</td>
                        <td>{task.status}</td>
                        <td>
                          {task.timeTaken
                            ? `${task.timeTaken.isLate ? "+" : "-"} ${
                                task.timeTaken.hours
                              }h ${task.timeTaken.minutes}m`
                            : "N/A"}
                        </td>
                        <td>
                          {task.status === "Completed" ||
                          task.status === "Completed (Late)"
                            ? task.completedAt
                            : task.status === "Revised"
                            ? `Revised to ${task.revisedDate}`
                            : "Not Completed"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No tasks found for the selected criteria.</p>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>
              Configure your filters and click "Generate Report" to view
              delegation data
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default DelegationMis;
