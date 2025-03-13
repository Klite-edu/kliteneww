import React, { useState, useEffect } from "react";
import "./opportunity.css";
import Sidebar from "../../../Sidebar/Sidebar";
import Navbar from "../../../Navbar/Navbar";
import axios from "axios";

const Opportunity = () => {
  const [pipelines, setPipelines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");

  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedUserId = localStorage.getItem("userId");

    console.log("🔵 Stored Role:", storedRole);
    console.log("🔵 Stored User ID:", storedUserId);

    setRole(storedRole);
    setUserId(storedUserId);

    fetchEmployees();
    fetchPipelines(storedRole, storedUserId);
  }, []);

  const fetchPipelines = async (storedRole, storedUserId) => {
    setLoading(true);
    console.log("🔵 Fetching pipelines...");

    try {
      let response;

      if (storedRole === "user") {
        console.log(`🟢 Employee role detected. Fetching pipelines for userId: ${storedUserId}`);
        response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stages/user/${storedUserId}`);
      } else {
        console.log("🟢 Admin/Supervisor role detected. Fetching all pipelines.");
        response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stages/list`);
      }

      console.log("✅ Pipelines fetched:", response.data);
      setPipelines(response.data);
    } catch (error) {
      console.error("❌ Error fetching pipelines:", error);
    } finally {
      setLoading(false);
      console.log("🔵 Pipeline fetch complete.");
    }
  };

  const fetchEmployees = async () => {
    console.log("🔵 Fetching employee list...");
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/employee/contactinfo`);
      console.log("✅ Employees fetched:", response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((emp) => emp._id === employeeId);
    console.log(`➡️ Resolving employee name for ID: ${employeeId} -> ${employee?.fullName || "Unknown Employee"}`);
    return employee ? employee.fullName : "Unknown Employee";
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />

      <div className="opportunity-container">
        <h2>Opportunities</h2>

        {/* Metrics */}
        <div className="metrics-container">
          <div className="metric-block">
            <h3>Total Pipelines</h3>
            <p>{pipelines.length}</p>
          </div>
          <div className="metric-block">
            <h3>Total Stages</h3>
            <p>
              {pipelines.reduce((total, pipeline) => total + pipeline.stages.length, 0)}
            </p>
          </div>
        </div>

        {/* Pipeline + Stage Blocks */}
        <div className="head-block">
          {loading ? (
            <p>Loading pipelines...</p>
          ) : pipelines.length === 0 ? (
            <p>No pipelines available.</p>
          ) : (
            pipelines.map((pipeline) => (
              <div key={pipeline._id} className="category-block">
                <h3>Pipeline: {pipeline.pipelineName}</h3>
                <div className="opportunity-blocks-horizontal">
                  {pipeline.stages.map((stage) => (
                    <div key={stage._id} className="opportunity-block">
                      <div className="block-content">
                        <p><strong>Stage:</strong> {stage.stageName}</p>
                        <p><strong>What:</strong> {stage.what}</p>
                        <p><strong>When:</strong> {new Date(stage.when).toLocaleString()}</p>
                        <p><strong>Who:</strong> {getEmployeeName(stage.who)}</p>
                        <p><strong>How:</strong> {stage.how}</p>
                        <p><strong>Why:</strong> {stage.why}</p>
                        <p><strong>Priority:</strong> {stage.priority}</p>
                        <p><strong>Status:</strong> {stage.status}</p>
                        {stage.dependencies && (
                          <p><strong>Dependencies:</strong> {stage.dependencies}</p>
                        )}
                        <p><strong>Approvals Required:</strong> {stage.approvalsRequired ? "Yes" : "No"}</p>
                        {stage.notes && (
                          <p><strong>Notes:</strong> {stage.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Opportunity;
