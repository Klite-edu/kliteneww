import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../../Sidebar/Sidebar";
import Navbar from "../../../Navbar/Navbar";
import "./triggerbuilder.css";
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp, FiSave } from "react-icons/fi";

const TriggerBuilder = () => {
  const [triggerData, setTriggerData] = useState({
    name: "",
    description: "",
    event_source: "",
    conditions: { form_id: "" },
    action: { move_to_stage: "" },
    is_active: true,
  });

  const [forms, setForms] = useState([]);
  const [stages, setStages] = useState([]);
  const [eventSources, setEventSources] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const role = localStorage.getItem("role");
  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel
        const [
          formsResponse,
          stagesResponse,
          eventSourcesResponse,
          triggersResponse,
        ] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/builder/formDetails`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/stages/list`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/triggers/event-sources`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/triggers/list`),
        ]);

        // Transform forms data to only include what we need
        const formattedForms = formsResponse.data.data.map(form => ({
          _id: form._id,
          form_name: form.formInfo?.title || 'Untitled Form'
        }));

        setForms(formattedForms);
        setStages(stagesResponse.data);
        setEventSources(eventSourcesResponse.data);
        setTriggers(triggersResponse.data);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateTrigger = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/triggers/create`,
        triggerData
      );
      alert(response.data.message);
      // Reset form after successful creation
      setTriggerData({
        name: "",
        description: "",
        event_source: "",
        conditions: { form_id: "" },
        action: { move_to_stage: "" },
        is_active: true,
      });
      // Refresh triggers list
      const triggersResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/triggers/list`);
      setTriggers(triggersResponse.data);
    } catch (error) {
      console.error("Error creating trigger:", error);
      alert("Failed to create trigger. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrigger = async (triggerId) => {
    if (!window.confirm("Are you sure you want to delete this trigger?")) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/triggers/delete/${triggerId}`
      );
      alert(response.data.message);
      // Refresh triggers list
      const triggersResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/triggers/list`);
      setTriggers(triggersResponse.data);
      // Clear selection if deleting the currently selected trigger
      if (selectedTrigger?._id === triggerId) {
        setSelectedTrigger(null);
        setTriggerData({
          name: "",
          description: "",
          event_source: "",
          conditions: { form_id: "" },
          action: { move_to_stage: "" },
          is_active: true,
        });
      }
    } catch (error) {
      console.error("Error deleting trigger:", error);
      alert("Failed to delete trigger. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUseTrigger = (trigger) => {
    setSelectedTrigger(trigger);
    setTriggerData({
      ...triggerData,
      name: trigger.name,
      description: trigger.description,
      event_source: trigger.event_source,
      conditions: trigger.conditions,
      action: trigger.action,
      is_active: trigger.is_active,
    });
  };

  const addCondition = () => {
    setTriggerData({
      ...triggerData,
      conditions: {
        ...triggerData.conditions,
        // Add new condition field here
      },
    });
  };

  const removeCondition = (conditionKey) => {
    const newConditions = { ...triggerData.conditions };
    delete newConditions[conditionKey];
    setTriggerData({
      ...triggerData,
      conditions: newConditions,
    });
  };

  return (
    <div className="trigger-builder-container">
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />

      <div className="trigger-builder-content">
        <h1 className="trigger-builder-title">Automation Trigger Builder</h1>
        <p className="trigger-builder-subtitle">
          Create automated workflows based on form submissions and other events
        </p>

        <div className="trigger-builder-grid">
          {/* Main Trigger Builder Form */}
          <div className="trigger-form-card">
            <div className="card-header">
              <h2>Create New Trigger</h2>
              <div className="toggle-switch">
                <label>
                  Active
                  <input
                    type="checkbox"
                    checked={triggerData.is_active}
                    onChange={(e) =>
                      setTriggerData({
                        ...triggerData,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <form className="trigger-form" onSubmit={handleCreateTrigger}>
              <div className="form-group">
                <label>Trigger Name*</label>
                <input
                  type="text"
                  value={triggerData.name}
                  onChange={(e) =>
                    setTriggerData({ ...triggerData, name: e.target.value })
                  }
                  placeholder="e.g., Move to Qualification Stage"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={triggerData.description}
                  onChange={(e) =>
                    setTriggerData({
                      ...triggerData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this trigger does..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>When this happens*</label>
                <select
                  value={triggerData.event_source}
                  onChange={(e) =>
                    setTriggerData({
                      ...triggerData,
                      event_source: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select an event...</option>
                  {eventSources.map((eventSource, index) => (
                    <option key={index} value={eventSource}>
                      {eventSource.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="conditions-section">
                <div className="section-header">
                  <h3>Conditions</h3>
                  <button
                    type="button"
                    className="add-button"
                    onClick={addCondition}
                  >
                    <FiPlus /> Add Condition
                  </button>
                </div>

                <div className="form-group">
                  <label>Form</label>
                  <select
                    value={triggerData.conditions.form_id}
                    onChange={(e) =>
                      setTriggerData({
                        ...triggerData,
                        conditions: {
                          ...triggerData.conditions,
                          form_id: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="">Select a form...</option>
                    {forms.map((form) => (
                      <option key={form._id} value={form._id}>
                        {form.form_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additional conditions can be added here */}
              </div>

              <div className="action-section">
                <h3>Then do this</h3>
                <div className="form-group">
                  <label>Move to Stage</label>
                  <select
                    value={triggerData.action.move_to_stage}
                    onChange={(e) =>
                      setTriggerData({
                        ...triggerData,
                        action: {
                          ...triggerData.action,
                          move_to_stage: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="">Select a stage...</option>
                    {stages.map((pipeline) => (
                      <div key={pipeline._id}>
                        <optgroup label={pipeline.pipelineName}>
                          {pipeline.stages.map((stage) => (
                            <option key={stage._id} value={stage._id}>
                              {stage.stageName}
                            </option>
                          ))}
                        </optgroup>
                      </div>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={isLoading}
                >
                  <FiSave /> {isLoading ? "Saving..." : "Save Trigger"}
                </button>
              </div>
            </form>
          </div>

          {/* Triggers Panel */}
          <div className="predefined-triggers-card">
            <div className="card-header">
              <h2>Existing Triggers</h2>
              <button
                className="toggle-button"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>

            {isExpanded && (
              <div className="predefined-triggers-list">
                {isLoading ? (
                  <div className="loading-spinner">Loading triggers...</div>
                ) : (
                  <>
                    {triggers.length === 0 ? (
                      <div className="empty-state">
                        No triggers available
                      </div>
                    ) : (
                      triggers.map((trigger) => (
                        <div
                          key={trigger._id}
                          className={`trigger-item ${
                            selectedTrigger?._id === trigger._id
                              ? "selected"
                              : ""
                          }`}
                        >
                          <div className="trigger-item-content" onClick={() => handleUseTrigger(trigger)}>
                            <h4>{trigger.name || "Unnamed Trigger"}</h4>
                            <p className="trigger-description">
                              {trigger.description || "No description provided"}
                            </p>
                            <div className="trigger-details">
                              <span className="event-source">
                                {trigger.event_source.replace(/_/g, " ")}
                              </span>
                              <span className="action">
                                Moves to:{" "}
                                {stages
                                  .find((p) =>
                                    p.stages.some(
                                      (s) =>
                                        s._id === trigger.action.move_to_stage
                                    )
                                  )
                                  ?.stages.find(
                                    (s) => s._id === trigger.action.move_to_stage
                                  )?.stageName || "Unknown stage"}
                              </span>
                            </div>
                          </div>
                          <button
                            className="delete-trigger-button"
                            onClick={() => handleDeleteTrigger(trigger._id)}
                            disabled={isDeleting}
                            title="Delete trigger"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriggerBuilder;