import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AddPipelineOnly.css";

const AddPipelineOnly = ({
  pipelineData = null,
  onClose = () => {},
  refreshList,
  customPermissions = {},
  role = "",   // ✅ Yeh line add karo
}) => {
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [newPipeline, setNewPipeline] = useState({
    pipelineName: "",
    stages: [],
  });
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [urlValid, setUrlValid] = useState({});
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const tokenRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );

        const userToken = tokenRes.data.token;
        if (!userToken) {
          return;
        }

        setToken(userToken);
        await Promise.all([
          fetchEmployees(userToken),
          initializePipelineData(),
        ]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
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
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const initializePipelineData = () => {
    if (pipelineData) {
      const stagesWithTime = pipelineData.stages.map((stage) => {
        let whenHours = "";
        let whenMinutes = "";

        if (stage.when && typeof stage.when === "string") {
          const timeParts = stage.when.split(":");
          if (timeParts.length === 2) {
            whenHours = timeParts[0];
            whenMinutes = timeParts[1];
          }
        }

        return {
          stageName: stage.stageName,
          what: stage.what,
          whenHours,
          whenMinutes,
          who: stage.who,
          how: {
            message:
              stage.how?.message || (isValidUrl(stage.how) ? "" : stage.how),
            url: stage.how?.url || (isValidUrl(stage.how) ? stage.how : ""),
          },
          checklist: stage.checklist || [],
          priority: stage.priority || "Medium",
          status: stage.status || "Pending",
          dependencies: stage.dependencies || "",
          approvalsRequired: stage.approvalsRequired || false,
          notes: stage.notes || "",
        };
      });

      setNewPipeline({
        pipelineName: pipelineData.pipelineName,
        stages: stagesWithTime,
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
    whenHours: "",
    whenMinutes: "",
    who: "",
    how: {
      message: "",
      url: "",
    },
    checklist: [],
    priority: "Medium",
    status: "Pending",
    dependencies: "",
    approvalsRequired: false,
    notes: "",
  });

  const handleStageChange = (index, field, value) => {
    const updatedStages = [...newPipeline.stages];

    if (field === "checklist") {
      // Automatically uncheck approvalsRequired if no checklist items exist
      if (value.length === 0) {
        updatedStages[index].approvalsRequired = false;
      }
      updatedStages[index].checklist = value;
    } else if (field === "howMessage" || field === "howUrl") {
      updatedStages[index].how = {
        ...updatedStages[index].how,
        message:
          field === "howMessage" ? value : updatedStages[index].how.message,
        url: field === "howUrl" ? value : updatedStages[index].how.url,
      };

      if (field === "howUrl") {
        const isValid = value === "" || isValidUrl(value);
        setUrlValid((prev) => ({ ...prev, [index]: isValid }));
      }
    } else {
      updatedStages[index][field] = value;
    }

    // Open checklist modal when approvalsRequired is checked
    if (field === "approvalsRequired" && value === true) {
      setCurrentStageIndex(index);
      setShowChecklistModal(true);
    }

    setNewPipeline({ ...newPipeline, stages: updatedStages });
  };

  const testUrl = (url, index) => {
    if (!url) return;

    if (isValidUrl(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setUrlValid((prev) => ({ ...prev, [index]: false }));
    }
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

  const openChecklistModal = (index) => {
    setCurrentStageIndex(index);
    setShowChecklistModal(true);
  };

  const closeChecklistModal = () => {
    setShowChecklistModal(false);
    setNewChecklistItem("");
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;

    const updatedStages = [...newPipeline.stages];
    updatedStages[currentStageIndex].checklist.push({
      id: Date.now().toString(),
      task: newChecklistItem,
      completedTime: null,
    });

    setNewPipeline({ ...newPipeline, stages: updatedStages });
    setNewChecklistItem("");
  };

  const removeChecklistItem = (itemId) => {
    const updatedStages = [...newPipeline.stages];
    updatedStages[currentStageIndex].checklist = updatedStages[
      currentStageIndex
    ].checklist.filter((item) => item.id !== itemId);

    setNewPipeline({ ...newPipeline, stages: updatedStages });
  };

  const toggleChecklistItem = (itemId) => {
    const updatedStages = [...newPipeline.stages];
    const checklistItems = updatedStages[currentStageIndex].checklist;
    const itemIndex = checklistItems.findIndex((item) => item.id === itemId);

    if (itemIndex !== -1) {
      const isCompleted = !checklistItems[itemIndex].completedTime;
      checklistItems[itemIndex].completedTime = isCompleted
        ? new Date().toISOString()
        : null;
      setNewPipeline({ ...newPipeline, stages: updatedStages });
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

    // Validate URLs before saving
    const hasInvalidUrls = newPipeline.stages.some(
      (stage, index) => stage.how.url && urlValid[index] === false
    );

    if (hasInvalidUrls) {
      alert("Please correct invalid URLs before saving");
      return;
    }

    const dataToSave = {
      pipelineName: newPipeline.pipelineName,
      stages: newPipeline.stages.map((stage) => {
        const whenTime =
          stage.whenHours && stage.whenMinutes
            ? `${stage.whenHours}:${stage.whenMinutes}`
            : "";

        return {
          stageName: stage.stageName,
          what: stage.what,
          when: whenTime,
          who: stage.who,
          how: {
            message: stage.how.message,
            url: stage.how.url,
          },
          checklist: stage.checklist,
        };
      }),
    };

    console.log("Data being sent:", dataToSave);

    try {
      const url = pipelineData
        ? `${process.env.REACT_APP_API_URL}/api/stages/${pipelineData._id}`
        : `${process.env.REACT_APP_API_URL}/api/stages/add`;

      const response = await fetch(url, {
        method: pipelineData ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(dataToSave),
      });

      const result = await response.json();
      console.log("Response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Unknown error");
      }

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
      alert(`Operation failed: ${error.message}`);
    }
  };

  return (
    <>
      {!pipelineData &&
        (role === "client" || customPermissions["FMS"]?.includes("create")) && (
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
                        <div className="d-flex align-items-center">
                          <div className="me-3 d-flex align-items-center">
                            <label className="abhi-form-label small me-2">
                              Hours:
                            </label>
                            <input
                              type="number"
                              placeholder="HH"
                              min="0"
                              max="23"
                              className="abhi-form-control abhi-pipeline-input"
                              style={{ width: "80px" }}
                              value={stage.whenHours || ""}
                              onChange={(e) =>
                                handleStageChange(
                                  index,
                                  "whenHours",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="ms-2 d-flex align-items-center">
                            <label className="abhi-form-label small me-2">
                              Minutes:
                            </label>
                            <input
                              type="number"
                              placeholder="MM"
                              min="0"
                              max="59"
                              className="abhi-form-control abhi-pipeline-input"
                              style={{ width: "80px" }}
                              value={stage.whenMinutes || ""}
                              onChange={(e) =>
                                handleStageChange(
                                  index,
                                  "whenMinutes",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
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

                    <div className="abhi-col-12">
                      <div className="abhi-form-group">
                        <label className="abhi-form-label">How</label>
                        <div className="abhi-row abhi-g-2">
                          <div className="abhi-col-md-6">
                            <input
                              type="text"
                              placeholder="Description of how it will be done"
                              className="abhi-form-control abhi-pipeline-input"
                              value={stage.how.message}
                              onChange={(e) =>
                                handleStageChange(
                                  index,
                                  "howMessage",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="abhi-col-md-6">
                            <div className="input-group">
                              <input
                                type="url"
                                placeholder="Enter URL (https://example.com)"
                                className={`abhi-form-control abhi-pipeline-input ${
                                  urlValid[index] === false ? "is-invalid" : ""
                                }`}
                                value={stage.how.url}
                                onChange={(e) =>
                                  handleStageChange(
                                    index,
                                    "howUrl",
                                    e.target.value
                                  )
                                }
                              />
                              <button
                                className="abhi-btn abhi-btn-outline-secondary"
                                type="button"
                                onClick={() => testUrl(stage.how.url, index)}
                                disabled={!stage.how.url}
                                title="Test this URL"
                              >
                                <i className="bi bi-box-arrow-up-right"></i>
                              </button>
                            </div>

                            {urlValid[index] === false && (
                              <div className="abhi-invalid-feedback d-flex align-items-center mt-1">
                                <i className="bi bi-exclamation-circle-fill me-2"></i>
                                Please enter a valid URL (include http:// or
                                https://)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="abhi-form-check abhi-mb-3">
                      <input
                        className="abhi-form-check-input"
                        type="checkbox"
                        id={`approvalCheck-${index}`}
                        checked={stage.approvalsRequired || false}
                        onChange={(e) =>
                          handleStageChange(
                            index,
                            "approvalsRequired",
                            e.target.checked
                          )
                        }
                      />
                      <label
                        className="abhi-form-check-label"
                        htmlFor={`approvalCheck-${index}`}
                      >
                        Approvals Required?
                      </label>
                    </div>

                    {stage.approvalsRequired && (
                      <div className="abhi-col-12">
                        <div className="abhi-checklist-container">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="abhi-checklist-title mb-0">
                              Checklist Items ({stage.checklist.length})
                            </h6>
                            <button
                              className="abhi-btn abhi-btn-sm abhi-btn-outline-primary"
                              onClick={() => openChecklistModal(index)}
                            >
                              <i className="bi bi-plus-lg me-1"></i>{" "}
                              {stage.checklist.length > 0
                                ? "Add More"
                                : "Add Items"}
                            </button>
                          </div>
                          {stage.checklist.length > 0 ? (
                            <ul className="abhi-checklist-items list-group">
                              {stage.checklist.map((item) => (
                                <li
                                  key={item.id}
                                  className="list-group-item d-flex justify-content-between align-items-center py-2 px-3"
                                >
                                  <div className="form-check mb-0">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={!!item.completedTime}
                                      onChange={() =>
                                        toggleChecklistItem(item.id)
                                      }
                                      id={`checklist-item-${item.id}`}
                                    />
                                    <label
                                      className="form-check-label"
                                      htmlFor={`checklist-item-${item.id}`}
                                      style={{
                                        textDecoration: item.completedTime
                                          ? "line-through"
                                          : "none",
                                        opacity: item.completedTime ? 0.7 : 1,
                                      }}
                                    >
                                      {item.task}
                                    </label>
                                  </div>
                                  <button
                                    className="abhi-btn abhi-btn-sm abhi-btn-link text-danger p-0"
                                    onClick={() => removeChecklistItem(item.id)}
                                    title="Remove item"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="abhi-no-checklist-items text-muted small py-2">
                              No checklist items added yet
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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

      {/* Checklist Modal */}
      {showChecklistModal && (
        <div className="abhi-modal-overlay">
          <div
            className="abhi-modal-container"
            style={{ maxWidth: "500px", maxHeight: "80vh" }}
          >
            <div className="abhi-modal-header">
              <h3 className="abhi-modal-title text-light">
                <i className="bi bi-list-check abhi-me-2"></i>
                Add Checklist Items
              </h3>
              <button
                className="bg-transparent fs-3"
                onClick={closeChecklistModal}
              >
                &times;
              </button>
            </div>

            <div className="abhi-modal-body">
              <div className="abhi-form-group abhi-mb-3">
                <label className="abhi-form-label">New Checklist Item</label>
                <div className="d-flex">
                  <input
                    type="text"
                    className="abhi-form-control abhi-pipeline-input"
                    placeholder="Enter checklist task"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") addChecklistItem();
                    }}
                  />
                  <button
                    className="abhi-btn abhi-btn-primary abhi-ms-2"
                    onClick={addChecklistItem}
                    disabled={!newChecklistItem.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="abhi-checklist-preview">
                <h6 className="abhi-checklist-title">Current Items</h6>
                {newPipeline.stages[currentStageIndex].checklist.length > 0 ? (
                  <ul className="abhi-checklist-items list-group">
                    {newPipeline.stages[currentStageIndex].checklist.map(
                      (item) => (
                        <li
                          key={item.id}
                          className="list-group-item d-flex justify-content-between align-items-center py-2 px-3"
                        >
                          <span>{item.task}</span>
                          <button
                            className="abhi-btn abhi-btn-sm abhi-btn-link text-danger p-0"
                            onClick={() => removeChecklistItem(item.id)}
                            title="Remove item"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <div className="abhi-no-checklist-items text-muted small py-2">
                    No items added yet
                  </div>
                )}
              </div>
            </div>

            <div className="abhi-modal-footer">
              <button
                className="abhi-btn abhi-btn-primary"
                onClick={closeChecklistModal}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPipelineOnly;
