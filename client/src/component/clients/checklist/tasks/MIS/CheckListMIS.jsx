// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import "./checklistmis.css";
// import Sidebar from "../../../../Sidebar/Sidebar";
// import Navbar from "../../../../Navbar/Navbar";

// const CheckListMIS = () => {
//   const [startDate, setStartDate] = useState(
//     new Date(new Date().setDate(1)).toISOString().split("T")[0]
//   );
//   const [endDate, setEndDate] = useState(
//     new Date().toISOString().split("T")[0]
//   );
//   const [reportData, setReportData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [employees, setEmployees] = useState([]);
//   const [selectedEmployee, setSelectedEmployee] = useState("all");
//   const [selectedDepartment, setSelectedDepartment] = useState("all");
//   const [checklistData, setChecklistData] = useState([]);
//   const [existingManifestation, setExistingManifestation] = useState(null);

//   const [token, setToken] = useState("");
//   const [role, setRole] = useState(null);
//   const [userId, setUserId] = useState(null);
//   const [employeeId, setEmployeeId] = useState(null);
//   const [customPermissions, setCustomPermissions] = useState({});
//   const [manifestationData, setManifestationData] = useState({
//     workNotDoneTarget: 0,
//     lateSubmissionTarget: 0,
//   });

//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchAuthData = async () => {
//       try {
//         const [tokenRes, roleRes, permissionsRes] = await Promise.all([
//           axios.get(
//             `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
//             { withCredentials: true }
//           ),
//           axios.get(
//             `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
//             { withCredentials: true }
//           ),
//           axios.get(
//             `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
//             { withCredentials: true }
//           ),
//         ]);

//         const userToken = tokenRes.data.token;
//         const userRole = roleRes.data.role;
//         const userPermissions = permissionsRes.data.permissions || {};
//         const decodedToken = jwtDecode(userToken);

//         const currentUserId = decodedToken.userId;
//         const currentEmployeeId = decodedToken.id;

//         setToken(userToken);
//         setRole(userRole);
//         setUserId(currentUserId);
//         setEmployeeId(currentEmployeeId);
//         setCustomPermissions(userPermissions);

//         fetchEmployeesAndDepartments(userToken);
//       } catch (error) {
//         console.error("Error fetching authentication data:", error);
//       }
//     };

//     fetchAuthData();
//   }, [navigate]);

//   const fetchExistingManifestation = async (empId) => {
//     try {
//       const response = await axios.get(
//         `${process.env.REACT_APP_API_URL}/api/checkmis/get-manifestation`,
//         {
//           params: {
//             employeeId: empId,
//             startDate,
//             endDate,
//           },
//           headers: { Authorization: `Bearer ${token}` },
//           withCredentials: true,
//         }
//       );

//       if (response.data.success) {
//         if (response.data.manifestation) {
//           setExistingManifestation(response.data.manifestation);
//           setManifestationData({
//             workNotDoneTarget: response.data.manifestation.workNotDoneTarget,
//             lateSubmissionTarget:
//               response.data.manifestation.lateSubmissionTarget,
//           });
//         } else {
//           setExistingManifestation(null);
//           setManifestationData({
//             workNotDoneTarget: 0,
//             lateSubmissionTarget: 0,
//           });
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching manifestation:", error);
//     }
//   };

//   useEffect(() => {
//     if (reportData && reportData.employees.length > 0 && token) {
//       const empId =
//         selectedEmployee !== "all"
//           ? selectedEmployee
//           : reportData.employees[0]?.employeeId;
//       if (empId && empId !== "N/A") {
//         fetchExistingManifestation(empId);
//       }
//     }
//   }, [reportData, startDate, endDate, token, selectedEmployee]);

//   const fetchEmployeesAndDepartments = async (userToken) => {
//     try {
//       const employeesResponse = await axios.get(
//         `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`,
//         {
//           headers: { Authorization: `Bearer ${userToken}` },
//           withCredentials: true,
//         }
//       );
//       setEmployees(employeesResponse.data);
//     } catch (err) {
//       console.error("Error fetching filter data:", err);
//     }
//   };

//   const fetchChecklistData = async () => {
//     if (!token) return;

//     try {
//       let queryParams = `?startDate=${startDate}&endDate=${endDate}&generateFutureTasks=true`;
//       if (selectedEmployee !== "all")
//         queryParams += `&userId=${selectedEmployee}`;

//       const response = await axios.get(
//         `${process.env.REACT_APP_API_URL}/api/tasks/list${queryParams}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//           withCredentials: true,
//         }
//       );
//       setChecklistData(response.data);
//     } catch (err) {
//       console.error("Error fetching checklist data:", err);
//     }
//   };

//   const fetchMISReport = async () => {
//     if (!token) return;

//     setLoading(true);
//     setError(null);

//     try {
//       await fetchChecklistData();

//       let queryParams = `?startDate=${startDate}&endDate=${endDate}`;
//       if (selectedEmployee !== "all")
//         queryParams += `&userId=${selectedEmployee}`;
//       if (selectedDepartment !== "all")
//         queryParams += `&departmentId=${selectedDepartment}`;

//       const response = await axios.get(
//         `${process.env.REACT_APP_API_URL}/api/checkmis/mis-report${queryParams}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//           withCredentials: true,
//         }
//       );

//       const processedData = {
//         ...response.data,
//         employees: response.data.employees.map((employee) => ({
//           ...employee,
//           tasks: employee.tasks.map((task) => {
//             const isCompleted = !!task.completedDate;
//             const isLate =
//               isCompleted &&
//               new Date(task.completedDate) > new Date(task.dueDate);
//             const isMissed =
//               !isCompleted && new Date() > new Date(task.dueDate);

//             return {
//               ...task,
//               isCompleted,
//               isLate,
//               isMissed,
//             };
//           }),
//         })),
//       };

//       setReportData(processedData);
//     } catch (err) {
//       const errorMessage =
//         err.response?.data?.error || "Failed to fetch MIS report";
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     const options = { year: "numeric", month: "short", day: "numeric" };
//     return new Date(dateString).toLocaleDateString(undefined, options);
//   };

//   const formatDateTime = (dateString) => {
//     if (!dateString) return "-";
//     const options = {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     };
//     return new Date(dateString).toLocaleString(undefined, options);
//   };

//   const extractTime = (dateString) => {
//     if (!dateString) return "-";
//     const options = { hour: "2-digit", minute: "2-digit" };
//     return new Date(dateString).toLocaleTimeString(undefined, options);
//   };

//   const getPerformanceColorClass = (percentage) => {
//     const absPercentage = Math.abs(percentage);
//     if (absPercentage >= 30) return "progress-red";
//     if (absPercentage >= 10) return "progress-yellow";
//     return "progress-green";
//   };

//   const handleManifestationChange = (e) => {
//     const { name, value } = e.target;
//     setManifestationData((prev) => ({
//       ...prev,
//       [name]: parseFloat(value) || 0,
//     }));
//   };

//   const saveManifestation = async (employeeId) => {
//     try {
//       if (!employeeId || employeeId === "N/A" || employeeId === "all") {
//         alert("Please select a valid employee before saving");
//         return;
//       }

//       const targets = {
//         workNotDoneTarget: manifestationData.workNotDoneTarget,
//         lateSubmissionTarget: manifestationData.lateSubmissionTarget,
//       };

//       const response = await axios.post(
//         `${process.env.REACT_APP_API_URL}/api/checkmis/save-manifestation`,
//         {
//           employeeId,
//           startDate,
//           endDate,
//           ...targets,
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//           withCredentials: true,
//         }
//       );

//       if (response.data.success) {
//         alert("Manifestation saved successfully!");
//         fetchExistingManifestation(employeeId);
//       }
//     } catch (error) {
//       console.error("Error saving manifestation:", error);
//     }
//   };

//   const formatPreciseTimeDiff = (startDate, endDate) => {
//     if (!startDate || !endDate) return "-";

//     const diffMs = new Date(endDate) - new Date(startDate);
//     if (diffMs <= 0) return "On time";

//     const diffSeconds = Math.floor(diffMs / 1000);
//     const diffMinutes = Math.floor(diffSeconds / 60);
//     const diffHours = Math.floor(diffMinutes / 60);
//     const diffDays = Math.floor(diffHours / 24);

//     const seconds = diffSeconds % 60;
//     const minutes = diffMinutes % 60;
//     const hours = diffHours % 24;

//     let parts = [];
//     if (diffDays > 0) parts.push(`${diffDays} day${diffDays > 1 ? "s" : ""}`);
//     if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
//     if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
//     if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);

//     return parts.join(" ");
//   };

//   const handleStartDateChange = (e) => {
//     setStartDate(e.target.value);
//   };

//   const handleEndDateChange = (e) => {
//     setEndDate(e.target.value);
//   };

//   const handleEmployeeChange = (e) => {
//     setSelectedEmployee(e.target.value);
//   };

//   const handleDepartmentChange = (e) => {
//     setSelectedDepartment(e.target.value);
//   };

//   return (
//     <>
//       <Sidebar role={role} customPermissions={customPermissions} />
//       <Navbar />
//       <div className="mis-report-container">
//         <h1 className="mis-report-title">Checklist MIS Dashboard</h1>

//         <div className="filter-card">
//           <div className="filter-grid">
//             <div className="filter-item">
//               <label className="filter-label">Start Date</label>
//               <input
//                 type="date"
//                 className="date-input"
//                 value={startDate}
//                 onChange={handleStartDateChange}
//               />
//             </div>

//             <div className="filter-item">
//               <label className="filter-label">End Date</label>
//               <input
//                 type="date"
//                 className="date-input"
//                 value={endDate}
//                 onChange={handleEndDateChange}
//               />
//             </div>

//             <div className="filter-item">
//               <label className="filter-label">Employee</label>
//               <select
//                 className="select-input"
//                 value={selectedEmployee}
//                 onChange={handleEmployeeChange}
//               >
//                 <option value="all">All Employees</option>
//                 {employees.map((emp) => (
//                   <option key={emp._id} value={emp._id}>
//                     {emp.fullName}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="filter-actions">
//             <button
//               className="btn btn-primary"
//               onClick={fetchMISReport}
//               disabled={loading}
//             >
//               {loading ? "Loading..." : "Generate Report"}
//             </button>
//           </div>
//         </div>

//         {error && <div className="error-message">{error}</div>}

//         {reportData && reportData.employees.length > 0 && (
//           <div className="report-content">
//             <div className="detailed-report">
//               {reportData.employees.map((employee) => {
//                 const completedTasks = employee.tasks.filter(
//                   (t) => t.isCompleted
//                 );
//                 const lateTasks = completedTasks.filter((t) => t.isLate);
//                 const missedTasks = employee.tasks.filter((t) => t.isMissed);

//                 return (
//                   <div key={employee.employeeId} className="employee-card">
//                     <h3 className="employee-name">
//                       {employee.employeeName} ({employee.employeeId}) -{" "}
//                       {employee.department}
//                     </h3>
//                     <div className="manifestation-section">
//                       <h4 className="section-title">
//                         Performance Manifestation ({formatDate(startDate)} to{" "}
//                         {formatDate(endDate)})
//                       </h4>
//                       {existingManifestation && (
//                         <>
//                           <div className="manifestation-info">
//                             <p>
//                               Existing targets set on:{" "}
//                               {formatDateTime(existingManifestation.updatedAt)}
//                             </p>
//                           </div>
//                           <div className="manifestation-info">
//                             <p>
//                               Existing targets set on:{" "}
//                               {existingManifestation.workNotDoneTarget}%
//                             </p>
//                             <p>
//                               Existing targets set on:{" "}
//                               {existingManifestation.lateSubmissionTarget}%
//                             </p>
//                           </div>
//                         </>
//                       )}
//                       <div className="manifestation-form">
//                         <div className="manifestation-input">
//                           <label>Work Not Done Target (%)</label>
//                           <input
//                             type="number"
//                             name="workNotDoneTarget"
//                             value={manifestationData.workNotDoneTarget}
//                             onChange={handleManifestationChange}
//                             min="-100"
//                             max="0"
//                             step="1"
//                           />
//                         </div>
//                         <div className="manifestation-input">
//                           <label>Late Submission Target (%)</label>
//                           <input
//                             type="number"
//                             name="lateSubmissionTarget"
//                             value={manifestationData.lateSubmissionTarget}
//                             onChange={handleManifestationChange}
//                             min="-100"
//                             max="0"
//                             step="1"
//                           />
//                         </div>
//                         <button
//                           className="btn btn-primary"
//                           onClick={() => {
//                             const empIdToSave =
//                               selectedEmployee !== "all"
//                                 ? selectedEmployee
//                                 : employee.employeeId;
//                             saveManifestation(empIdToSave);
//                           }}
//                           disabled={!employeeId}
//                         >
//                           {existingManifestation
//                             ? "Update Manifestation"
//                             : "Save Manifestation"}
//                         </button>
//                       </div>
//                     </div>
//                     <div className="metrics-grid">
//                       <div className="metric-card total">
//                         <div className="metric-label">Total Tasks</div>
//                         <div className="metric-value">
//                           {employee.totalTasks}
//                         </div>
//                       </div>
//                       <div className="metric-card done">
//                         <div className="metric-label">
//                           Work Not Done On Time
//                         </div>
//                         <div className="metric-value">
//                           {employee.completedLate}
//                         </div>
//                       </div>
//                       <div className="metric-card late">
//                         <div className="metric-label">Work Done on Time</div>
//                         <div className="metric-value">
//                           {employee.completedOnTime}
//                         </div>
//                       </div>
//                       <div className="metric-card missed">
//                         <div className="metric-label">Work Not Done</div>
//                         <div className="metric-value">
//                           {employee.workNotDone}
//                         </div>
//                       </div>
//                     </div>

//                     <h4 className="section-title">Performance Issues</h4>
//                     <div className="performance-metrics">
//                       <div className="metric">
//                         <p>
//                           Work Not Done: {employee.workNotDoneScore.toFixed(2)}%
//                         </p>
//                         <div className="progress-bar">
//                           <div
//                             className={`progress-fill ${getPerformanceColorClass(
//                               employee.workNotDoneScore
//                             )}`}
//                             style={{
//                               width: `${Math.abs(employee.workNotDoneScore)}%`,
//                             }}
//                           ></div>
//                         </div>
//                       </div>
//                       <div className="metric">
//                         <p>
//                           Work Not Done On Time Score:{" "}
//                           {employee.lateSubmissionScore.toFixed(2)}%
//                         </p>
//                         <div className="progress-bar">
//                           <div
//                             className={`progress-fill ${getPerformanceColorClass(
//                               employee.lateSubmissionScore
//                             )}`}
//                             style={{
//                               width: `${Math.abs(
//                                 employee.lateSubmissionScore
//                               )}%`,
//                             }}
//                           ></div>
//                         </div>
//                       </div>
//                       <div className="metric">
//                         <p>
//                           Performance Gap: {employee.performanceGap.toFixed(2)}%
//                         </p>
//                         <div className="progress-bar">
//                           <div
//                             className={`progress-fill ${getPerformanceColorClass(
//                               employee.performanceGap
//                             )}`}
//                             style={{
//                               width: `${Math.abs(employee.performanceGap)}%`,
//                             }}
//                           ></div>
//                         </div>
//                       </div>
//                     </div>

//                     <h4 className="section-title">Task Details</h4>
//                     <div className="table-responsive">
//                       <table className="report-table precise-time-table">
//                         <thead>
//                           <tr>
//                             <th>Task Name</th>
//                             <th>Due Date</th>
//                             <th>Completed Date</th>
//                             <th>Time Difference</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {employee.tasks.map((task) =>
//                             task.allStatusHistory.map((historyEntry, index) => {
//                               const dueDate = historyEntry.date;
//                               const completedDate =
//                                 historyEntry.completedDateTime;
//                               const status = historyEntry.status;

//                               return (
//                                 <tr key={`${task.taskId}-${index}`}>
//                                   <td>{task.taskName}</td>
//                                   <td>
//                                     <div className="datetime-cell">
//                                       <div>
//                                         {dueDate ? formatDate(dueDate) : "-"}
//                                       </div>
//                                       <div className="time-text">
//                                         {dueDate ? extractTime(dueDate) : "-"}
//                                       </div>
//                                     </div>
//                                   </td>
//                                   <td>
//                                     {completedDate ? (
//                                       <div className="datetime-cell">
//                                         <div>{formatDate(completedDate)}</div>
//                                         <div className="time-text">
//                                           {extractTime(completedDate)}
//                                         </div>
//                                       </div>
//                                     ) : (
//                                       "-"
//                                     )}
//                                   </td>
//                                   <td>
//                                     {completedDate && dueDate ? (
//                                       <span
//                                         className={
//                                           new Date(completedDate) >
//                                           new Date(dueDate)
//                                             ? "text-red"
//                                             : "text-green"
//                                         }
//                                       >
//                                         {formatPreciseTimeDiff(
//                                           dueDate,
//                                           completedDate
//                                         )}
//                                       </span>
//                                     ) : (
//                                       "-"
//                                     )}
//                                   </td>
//                                 </tr>
//                               );
//                             })
//                           )}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {reportData && reportData.employees.length === 0 && (
//           <div className="empty-state">
//             <p>No data found for the selected criteria</p>
//             <button className="btn btn-secondary" onClick={fetchMISReport}>
//               Change filters and try again
//             </button>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

// export default CheckListMIS;
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
  const [customPermissions, setCustomPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [manifestWorkNotDone, setManifestWorkNotDone] = useState("");
  const [manifestLateSubmission, setManifestLateSubmission] = useState("");
  const [manifestations, setManifestations] = useState([]);
  const [selectedManifestation, setSelectedManifestation] = useState(null);

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

        setToken(userToken);
        setRole(userRole);
        setCustomPermissions(userPermissions);

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
      setTasks(response.data);
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
      percentage: ((difference / Math.abs(target)) * 100).toFixed(2)
    };
  };

  const workNotDonePerformance = selectedManifestation 
    ? calculatePerformanceAgainstTarget(Math.abs(workNotDoneScore), selectedManifestation.workNotDoneTarget)
    : null;

  const lateSubmissionPerformance = selectedManifestation 
    ? calculatePerformanceAgainstTarget(Math.abs(lateSubmissionScore), selectedManifestation.lateSubmissionTarget)
    : null;

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
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

        {/* Manifestation Form */}
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
              <label>Late Submission Target (%)</label>
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

          {/* Manifestation Display */}
          {selectedManifestation && (
            <div className="clmis-manifestation-display">
              <div className="clmis-manifestation-header">
                <h3>Manifestation Targets</h3>
                <span className="clmis-date-range">
                  {formatDate(selectedManifestation.startDate)} - {formatDate(selectedManifestation.endDate)}
                </span>
              </div>
              
              <div className="clmis-targets">
                <div className="clmis-target-card">
                  <div className="clmis-target-header">
                    <span className="clmis-target-label">Work Not Done Target</span>
                    <span className="clmis-target-value">{selectedManifestation.workNotDoneTarget}%</span>
                  </div>
                  <div className="clmis-target-performance">
                    <span className={`clmis-performance-indicator ${workNotDonePerformance.isPositive ? 'clmis-positive' : 'clmis-negative'}`}>
                      {workNotDonePerformance.isPositive ? '✓' : '✗'} {workNotDonePerformance.value}%
                    </span>
                    <span className="clmis-performance-difference">
                      ({workNotDonePerformance.percentage}% {workNotDonePerformance.isPositive ? 'better' : 'worse'} than target)
                    </span>
                  </div>
                </div>
                
                <div className="clmis-target-card">
                  <div className="clmis-target-header">
                    <span className="clmis-target-label">Late Submission Target</span>
                    <span className="clmis-target-value">{selectedManifestation.lateSubmissionTarget}%</span>
                  </div>
                  <div className="clmis-target-performance">
                    <span className={`clmis-performance-indicator ${lateSubmissionPerformance.isPositive ? 'clmis-positive' : 'clmis-negative'}`}>
                      {lateSubmissionPerformance.isPositive ? '✓' : '✗'} {lateSubmissionPerformance.value}%
                    </span>
                    <span className="clmis-performance-difference">
                      ({lateSubmissionPerformance.percentage}% {lateSubmissionPerformance.isPositive ? 'better' : 'worse'} than target)
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
                  className={`clmis-progress-fill ${getColorClass(workNotDoneScore)}`}
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
                  className={`clmis-progress-fill ${getColorClass(lateSubmissionScore)}`}
                  style={{ width: `${Math.abs(lateSubmissionScore)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <p>Performance Gap: {performanceGap.toFixed(2)}%</p>
              <div className="clmis-progress-container">
                <div
                  className={`clmis-progress-fill ${getColorClass(performanceGap)}`}
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
                  <tr key={task.taskId}>
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
                      <span className={`clmis-status clmis-status-${task.status.toLowerCase().replace(' ', '-')}`}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <span className={`clmis-late-indicator clmis-late-${task.isLate ? 'yes' : 'no'}`}>
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