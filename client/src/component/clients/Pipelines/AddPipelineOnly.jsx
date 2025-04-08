import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AddPipelineOnly.css";

const AddPipelineOnly = ({
  pipelineData = null,
  onClose = () => {},
  refreshList,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [newPipeline, setNewPipeline] = useState({
    pipelineName: "",
    stages: [],
  });
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch token from cookies
        const tokenRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );

        const userToken = tokenRes.data.token;
        if (!userToken) {
          navigate("/login");
          return;
        }

        setToken(userToken);

        // Fetch employees and initialize pipeline data
        await Promise.all([
          fetchEmployees(userToken),
          initializePipelineData()
        ]);

      } catch (error) {
        console.error("Error fetching initial data:", error);
        navigate("/login");
      }
    };

    fetchInitialData();
  }, [navigate, pipelineData]);

  const fetchEmployees = async (token) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stages/contactinfo`,
        { 
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const initializePipelineData = () => {
    if (pipelineData) {
      setNewPipeline({
        pipelineName: pipelineData.pipelineName,
        stages: pipelineData.stages,
      });
      setShowModal(true);
    } else {
      setNewPipeline({
        pipelineName: "",
        stages: [createEmptyStage()],
      });
    }
  };

  const createEmptyStage = () => ({
    stageName: "",
    what: "",
    when: "",
    who: "",
    how: "",
    status: "Pending",
    dependencies: "",
    approvalsRequired: false,
    notes: "",
  });

  const handleStageChange = (index, field, value) => {
    const updatedStages = [...newPipeline.stages];
    updatedStages[index][field] = value;
    setNewPipeline({ ...newPipeline, stages: updatedStages });
  };

  const addNewStage = () => {
    setNewPipeline({
      ...newPipeline,
      stages: [...newPipeline.stages, createEmptyStage()],
    });
  };

  const removeStage = (index) => {
    if (newPipeline.stages.length > 1) {
      setNewPipeline({
        ...newPipeline,
        stages: newPipeline.stages.filter((_, i) => i !== index),
      });
    }
  };

  const savePipeline = async () => {
    if (!newPipeline.pipelineName.trim()) {
      alert("Please enter a pipeline name");
      return;
    }

    const invalidStages = newPipeline.stages.some(
      (stage) => !stage.stageName.trim()
    );
    if (invalidStages) {
      alert("Please fill in all stage names");
      return;
    }

    try {
      const url = pipelineData
        ? `${process.env.REACT_APP_API_URL}/api/stages/${pipelineData._id}`
        : `${process.env.REACT_APP_API_URL}/api/stages/add`;

      await axios({
        method: pipelineData ? "put" : "post",
        url,
        data: newPipeline,
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      alert(
        pipelineData
          ? "Pipeline updated successfully!"
          : "Pipeline added successfully!"
      );
      setShowModal(false);
      onClose();
      refreshList();
    } catch (error) {
      console.error("Error saving pipeline:", error);
      alert(`Operation failed: ${error.response?.data?.message || "Unknown error"}`);
    }
  };

  return (
    <>
      {!pipelineData && (
        <button
          onClick={() => setShowModal(true)}
          className="abhi-create-pipeline-btn"
        >
          <i className="bi bi-plus-lg abhi-me-2"></i>
          Create FMS/Pipeline
        </button>
      )}

      {showModal && (
        <div className="abhi-modal-overlay">
          <div className="abhi-modal-container">
            <div className="abhi-modal-header">
              <h3 className="abhi-modal-title text-light">
                <i className="bi bi-diagram-3-fill abhi-me-2"></i>
                {pipelineData ? "Edit FMS/Pipeline" : "Add New FMS/Pipeline"}
              </h3>
              <button
                className="bg-transparent fs-3"
                onClick={() => {
                  setShowModal(false);
                  onClose();
                }}
              >
                &times;
              </button>
            </div>

            <div className="abhi-modal-body">
              <div className="abhi-form-group abhi-mb-4">
                <label className="abhi-form-label">FMS/Pipeline Name</label>
                <input
                  type="text"
                  placeholder="Enter FMS/pipeline name"
                  className="abhi-form-control abhi-pipeline-input"
                  value={newPipeline.pipelineName}
                  onChange={(e) =>
                    setNewPipeline({
                      ...newPipeline,
                      pipelineName: e.target.value,
                    })
                  }
                />
              </div>

              {newPipeline.stages.map((stage, index) => (
                <div
                  key={index}
                  className="abhi-pipeline-stage-card abhi-mb-4 abhi-p-4 abhi-position-relative"
                >
                  {newPipeline.stages.length > 1 && (
                    <button
                      className="abhi-btn abhi-btn-sm rounded-0 p-0 bg-transparent abhi-pipeline-stage-remove"
                      onClick={() => removeStage(index)}
                      title="Remove stage"
                    >
                      <i
                        className="bi bi-trash fw-bold fs-5"
                        style={{ color: "var(--primary-color)" }}
                      ></i>
                    </button>
                  )}
                  <h5 className="abhi-pipeline-stage-title">
                    <i className="bi bi-layer-forward abhi-me-2"></i>
                    Stage {index + 1}
                  </h5>

                  <div className="abhi-row abhi-g-3">
                    <div className="abhi-col-md-6">
                      <div className="abhi-form-group">
                        <label className="abhi-form-label">Stage Name</label>
                        <input
                          type="text"
                          placeholder="Enter stage name"
                          className="abhi-form-control abhi-pipeline-input"
                          value={stage.stageName}
                          onChange={(e) =>
                            handleStageChange(
                              index,
                              "stageName",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="abhi-col-md-6">
                      <div className="abhi-form-group">
                        <label className="abhi-form-label">What</label>
                        <input
                          type="text"
                          placeholder="What needs to be done"
                          className="abhi-form-control abhi-pipeline-input"
                          value={stage.what}
                          onChange={(e) =>
                            handleStageChange(index, "what", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="abhi-col-md-6">
                      <div className="abhi-form-group">
                        <label className="abhi-form-label">When</label>
                        <input
                          type="text"
                          className="abhi-form-control abhi-pipeline-input"
                          value={stage.when?.split?.("T")[0] || ""}
                          onChange={(e) =>
                            handleStageChange(index, "when", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="abhi-col-md-6">
                      <div className="abhi-form-group">
                        <label className="abhi-form-label">Who</label>
                        <select
                          className="abhi-form-select abhi-pipeline-input"
                          value={stage.who}
                          onChange={(e) =>
                            handleStageChange(index, "who", e.target.value)
                          }
                        >
                          <option value="">Select Employee</option>
                          {employees.map((emp) => (
                            <option key={emp._id} value={emp._id}>
                              {emp.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="abhi-col-md-6">
                      <div className="abhi-form-group">
                        <label className="abhi-form-label">How</label>
                        <input
                          type="text"
                          placeholder="How it will be done"
                          className="abhi-form-control abhi-pipeline-input"
                          value={stage.how}
                          onChange={(e) =>
                            handleStageChange(index, "how", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="abhi-text-center abhi-mt-3">
                <button
                  className="abhi-btn abhi-btn-outline-primary abhi-pipeline-add-stage-btn"
                  onClick={addNewStage}
                >
                  <i className="bi bi-plus-circle abhi-me-2"></i>
                  Add Another Stage
                </button>
              </div>
            </div>

            <div className="abhi-modal-footer">
              <button
                className="abhi-btn abhi-btn-outline-secondary abhi-pipeline-cancel-btn"
                onClick={() => {
                  setShowModal(false);
                  onClose();
                }}
              >
                Cancel
              </button>
              <button
                className="abhi-btn abhi-btn-primary abhi-pipeline-save-btn"
                onClick={savePipeline}
              >
                {pipelineData ? "Save Changes" : "Create Pipeline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPipelineOnly;
