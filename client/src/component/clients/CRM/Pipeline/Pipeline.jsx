import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../../Sidebar/Sidebar";
import Navbar from "../../../Navbar/Navbar";
import "./pipeline.css";
import { Modal, Button, Dropdown } from "react-bootstrap";
import { FaEllipsisV, FaTrash } from "react-icons/fa";
import StageLeads from "./StageLeads";

const Pipeline = () => {
  const [pipelines, setPipelines] = useState([]); // Initialize as empty array
  const [employees, setEmployees] = useState([]); // Initialize as empty array
  const role = localStorage.getItem("role");
  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPipeline, setNewPipeline] = useState({
    pipelineName: "",
    stages: [
      {
        stageName: "",
        what: "",
        when: "",
        who: "", // Store employee ID here
        how: "",
        why: "",
        priority: "Medium",
        status: "Pending",
        dependencies: "",
        approvalsRequired: false,
        notes: "",
      },
    ],
  });
  const [editingPipeline, setEditingPipeline] = useState(null);

  useEffect(() => {
    console.log("Component mounted or updated");
    fetchPipelines();
    fetchEmployees(); // Fetch employees when the component mounts
  }, []);

  const fetchPipelines = async () => {
    console.log("Fetching pipelines...");
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stages/list`
      );
      console.log("Pipelines fetched:", response.data);
      setPipelines(response.data || []); // Ensure it's an array
    } catch (error) {
      console.error("Error fetching pipelines:", error);
      setPipelines([]); // Fallback to empty array
    }
  };

  const fetchEmployees = async () => {
    console.log("Fetching employees...");
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stages/contactinfo`
      );
      console.log("Employees fetched:", response.data);
      setEmployees(response.data || []); // Ensure it's an array
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]); // Fallback to empty array
    }
  };

  const addPipeline = async () => {
    console.log("Adding pipeline:", newPipeline);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/stages/add`,
        newPipeline
      );
      console.log("Pipeline added successfully");
      fetchPipelines();
      setNewPipeline({
        pipelineName: "",
        stages: [
          {
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
          },
        ],
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding pipeline:", error);
    }
  };

  const handleStageChange = (index, field, value) => {
    console.log("Stage change:", { index, field, value });
    const updatedStages = [...newPipeline.stages];
    updatedStages[index][field] = value;
    setNewPipeline({ ...newPipeline, stages: updatedStages });
  };

  const addNewStage = () => {
    console.log("Adding new stage");
    setNewPipeline({
      ...newPipeline,
      stages: [
        ...newPipeline.stages,
        {
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
        },
      ],
    });
  };

  const handleEditPipeline = (pipeline) => {
    console.log("Editing pipeline:", pipeline);
    setEditingPipeline({ ...pipeline });
    setShowEditModal(true);
  };

  const updatePipeline = async () => {
    console.log("Updating pipeline:", editingPipeline);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/stages/${editingPipeline._id}`,
        editingPipeline
      );
      console.log("Pipeline updated successfully");
      fetchPipelines();
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating pipeline:", error);
    }
  };

  const handleDeletePipeline = async (id) => {
    console.log("Deleting pipeline with ID:", id);
    if (window.confirm("Are you sure you want to delete this pipeline?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/stages/${id}`);
        console.log("Pipeline deleted successfully");
        fetchPipelines();
      } catch (error) {
        console.error("Error deleting pipeline:", error);
      }
    }
  };

  const handleDeleteStage = (stageIndex) => {
    console.log("Deleting stage at index:", stageIndex);
    const updatedStages = editingPipeline.stages.filter(
      (_, index) => index !== stageIndex
    );
    setEditingPipeline({ ...editingPipeline, stages: updatedStages });
  };

  const handleAddStageInEdit = () => {
    console.log("Adding new stage in edit mode");
    setEditingPipeline({
      ...editingPipeline,
      stages: [
        ...editingPipeline.stages,
        {
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
        },
      ],
    });
  };

  console.log("Rendering Pipeline component", {
    pipelines,
    employees,
    newPipeline,
    editingPipeline,
    showModal,
    showEditModal,
  });

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="pipeline-container">
        <h2>Pipeline</h2>
        <Button
          variant="primary"
          className="pipeline-create-button"
          onClick={() => setShowModal(true)}
        >
          Create Pipeline
        </Button>

        {/* Create Pipeline Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Pipeline</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input
              type="text"
              placeholder="Pipeline Name"
              value={newPipeline.pipelineName}
              onChange={(e) =>
                setNewPipeline({ ...newPipeline, pipelineName: e.target.value })
              }
            />
            {newPipeline.stages.map((stage, index) => (
              <div key={index} className="stage-form">
                <h4>Stage {index + 1}</h4>
                <input
                  type="text"
                  placeholder="Stage Name"
                  value={stage.stageName}
                  onChange={(e) =>
                    handleStageChange(index, "stageName", e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="What?"
                  value={stage.what}
                  onChange={(e) =>
                    handleStageChange(index, "what", e.target.value)
                  }
                />
                <input
                  type="date"
                  value={stage.when}
                  onChange={(e) =>
                    handleStageChange(index, "when", e.target.value)
                  }
                />
                <select
                  value={stage.who}
                  onChange={(e) =>
                    handleStageChange(index, "who", e.target.value)
                  }
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="How?"
                  value={stage.how}
                  onChange={(e) =>
                    handleStageChange(index, "how", e.target.value)
                  }
                ></textarea>
                <textarea
                  placeholder="Why?"
                  value={stage.why}
                  onChange={(e) =>
                    handleStageChange(index, "why", e.target.value)
                  }
                ></textarea>
                <select
                  value={stage.priority}
                  onChange={(e) =>
                    handleStageChange(index, "priority", e.target.value)
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            ))}
            <Button variant="secondary" onClick={addNewStage}>
              Add Another Stage
            </Button>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={addPipeline}>
              Add Pipeline
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Pipeline Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Pipeline</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input
              type="text"
              placeholder="Pipeline Name"
              value={editingPipeline?.pipelineName || ""}
              onChange={(e) =>
                setEditingPipeline({
                  ...editingPipeline,
                  pipelineName: e.target.value,
                })
              }
            />
            {editingPipeline?.stages.map((stage, index) => (
              <div key={index} className="stage-form">
                <h4>Stage {index + 1}</h4>
                <button
                  className="delete-stage-button"
                  onClick={() => handleDeleteStage(index)}
                >
                  <FaTrash />
                </button>
                <input
                  type="text"
                  placeholder="Stage Name"
                  value={stage.stageName}
                  onChange={(e) => {
                    const updatedStages = [...editingPipeline.stages];
                    updatedStages[index].stageName = e.target.value;
                    setEditingPipeline({
                      ...editingPipeline,
                      stages: updatedStages,
                    });
                  }}
                />
                <input
                  type="text"
                  placeholder="What?"
                  value={stage.what}
                  onChange={(e) => {
                    const updatedStages = [...editingPipeline.stages];
                    updatedStages[index].what = e.target.value;
                    setEditingPipeline({
                      ...editingPipeline,
                      stages: updatedStages,
                    });
                  }}
                />
                <input
                  type="date"
                  value={stage.when}
                  onChange={(e) => {
                    const updatedStages = [...editingPipeline.stages];
                    updatedStages[index].when = e.target.value;
                    setEditingPipeline({
                      ...editingPipeline,
                      stages: updatedStages,
                    });
                  }}
                />
                <select
                  value={stage.who}
                  onChange={(e) => {
                    const updatedStages = [...editingPipeline.stages];
                    updatedStages[index].who = e.target.value;
                    setEditingPipeline({
                      ...editingPipeline,
                      stages: updatedStages,
                    });
                  }}
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="How?"
                  value={stage.how}
                  onChange={(e) => {
                    const updatedStages = [...editingPipeline.stages];
                    updatedStages[index].how = e.target.value;
                    setEditingPipeline({
                      ...editingPipeline,
                      stages: updatedStages,
                    });
                  }}
                ></textarea>
                <textarea
                  placeholder="Why?"
                  value={stage.why}
                  onChange={(e) => {
                    const updatedStages = [...editingPipeline.stages];
                    updatedStages[index].why = e.target.value;
                    setEditingPipeline({
                      ...editingPipeline,
                      stages: updatedStages,
                    });
                  }}
                ></textarea>
                <select
                  value={stage.priority}
                  onChange={(e) => {
                    const updatedStages = [...editingPipeline.stages];
                    updatedStages[index].priority = e.target.value;
                    setEditingPipeline({
                      ...editingPipeline,
                      stages: updatedStages,
                    });
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            ))}
            <Button variant="secondary" onClick={handleAddStageInEdit}>
              Add Another Stage
            </Button>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={updatePipeline}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Pipelines Table */}
        <table className="pipeline-table">
          <thead>
            <tr>
              <th>Pipeline Name</th>
              <th>Stages</th>
              <th>Option</th>
            </tr>
          </thead>
          <tbody>
            {pipelines && pipelines.length > 0 ? (
              pipelines.map((pipeline, index) => (
                <tr key={index}>
                  <td>{pipeline.pipelineName}</td>
                  <td>
                    <ul>
                      {pipeline.stages.map((stage, idx) => (
                        <li key={idx}>{stage.stageName}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="link" id="dropdown-basic">
                        <FaEllipsisV />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          onClick={() => handleEditPipeline(pipeline)}
                        >
                          Edit
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => handleDeletePipeline(pipeline._id)}
                        >
                          Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No pipelines found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <StageLeads />
    </>
  );
};

export default Pipeline;
