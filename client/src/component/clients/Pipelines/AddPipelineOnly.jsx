import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import './AddPipelineOnly.css'

const AddPipelineOnly = ({ pipelineData = null, onClose = () => {}, refreshList }) => {
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [newPipeline, setNewPipeline] = useState({
    pipelineName: "",
    stages: [],
  });

  useEffect(() => {
    fetchEmployees();

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
  }, [pipelineData]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("https://api.autopilotmybusiness.com/api/stages/contactinfo");
      const data = await response.json();
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const createEmptyStage = () => ({
    stageName: "",
    what: "",
    when: "",
    who: "",
    how: "",
    why: "",
    priority: "Medium",
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
    if (!newPipeline.pipelineName.trim()) return alert("Please enter a pipeline name");

    const invalidStages = newPipeline.stages.some((stage) => !stage.stageName.trim());
    if (invalidStages) return alert("Please fill in all stage names");

    try {
      const url = pipelineData
        ? `https://api.autopilotmybusiness.com/api/stages/${pipelineData._id}`
        : "https://api.autopilotmybusiness.com/api/stages/add";
      const method = pipelineData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPipeline),
      });

      if (response.ok) {
        alert(pipelineData ? "Pipeline updated successfully!" : "Pipeline added successfully!");
        setShowModal(false);
        onClose();
        refreshList();
      } else {
        const errorText = await response.text();
        alert("Operation failed. Check console for details.");
      }
    } catch (error) {
      alert("Operation failed. Please try again.");
    }
  };

  return (
    <>
      {!pipelineData && (
        <Button 
          variant="primary" 
          onClick={() => setShowModal(true)}
          className="abhi-create-pipeline-btn"
        >
          <i className="bi bi-plus-lg me-2"></i>
          Create Pipeline
        </Button>
      )}

      <Modal 
        show={showModal} 
        onHide={() => { setShowModal(false); onClose(); }} 
        dialogClassName="abhi-modal-lg abhi-pipeline-modal"
      >
        <Modal.Header closeButton className="abhi-pipeline-modal-header">
          <Modal.Title>
            <i className="bi bi-diagram-3-fill me-2"></i>
            {pipelineData ? "Edit Pipeline" : "Add New Pipeline"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="abhi-pipeline-modal-body">
          <div className="form-group mb-4">
            <label className="form-label">Pipeline Name</label>
            <input
              type="text"
              placeholder="Enter pipeline name"
              className="form-control abhi-pipeline-input"
              value={newPipeline.pipelineName}
              onChange={(e) => setNewPipeline({ ...newPipeline, pipelineName: e.target.value })}
            />
          </div>

          {newPipeline.stages.map((stage, index) => (
            <div key={index} className="abhi-pipeline-stage-card mb-4 p-4 position-relative">
              {newPipeline.stages.length > 1 && (
                <button
                  className="btn btn-sm btn-danger abhi-pipeline-stage-remove"
                  onClick={() => removeStage(index)}
                  title="Remove stage"
                >
                  <i className="bi bi-trash"></i>
                </button>
              )}
              <h5 className="abhi-pipeline-stage-title">
                <i className="bi bi-layer-forward me-2"></i>
                Stage {index + 1}
              </h5>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Stage Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter stage name" 
                      className="form-control pipeline-input" 
                      value={stage.stageName} 
                      onChange={(e) => handleStageChange(index, "stageName", e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select 
                      className="form-select abhi-pipeline-input" 
                      value={stage.priority} 
                      onChange={(e) => handleStageChange(index, "priority", e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">What</label>
                    <input 
                      type="text" 
                      placeholder="What needs to be done" 
                      className="form-control abhi-pipeline-input" 
                      value={stage.what} 
                      onChange={(e) => handleStageChange(index, "what", e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">When</label>
                    <input 
                      type="date" 
                      className="form-control abhi-pipeline-input" 
                      value={stage.when?.split?.('T')[0] || ""} 
                      onChange={(e) => handleStageChange(index, "when", e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Who</label>
                    <select 
                      className="form-select abhi-pipeline-input" 
                      value={stage.who} 
                      onChange={(e) => handleStageChange(index, "who", e.target.value)}
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">How</label>
                    <input 
                      type="text" 
                      placeholder="How it will be done" 
                      className="form-control abhi-pipeline-input" 
                      value={stage.how} 
                      onChange={(e) => handleStageChange(index, "how", e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="col-12">
                  <div className="form-group">
                    <label className="form-label">Why</label>
                    <textarea 
                      placeholder="Why this stage is important" 
                      className="form-control abhi-pipeline-input" 
                      rows="2"
                      value={stage.why} 
                      onChange={(e) => handleStageChange(index, "why", e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center mt-3">
            <Button 
              variant="outline-primary" 
              onClick={addNewStage}
              className="abhi-pipeline-add-stage-btn"
            >
              <i className="bi bi-plus-circle me-2"></i>
              Add Another Stage
            </Button>
          </div>
        </Modal.Body>

        <Modal.Footer className="abhi-pipeline-modal-footer">
          <Button 
            variant="outline-secondary" 
            onClick={() => { setShowModal(false); onClose(); }}
            className="abhi-pipeline-cancel-btn"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={savePipeline}
            className="abhi-pipeline-save-btn"
          >
            {pipelineData ? "Save Changes" : "Create Pipeline"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddPipelineOnly;