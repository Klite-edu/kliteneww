import React, { useEffect, useState, useRef, useCallback } from "react";
import AddPipelineOnly from "./AddPipelineOnly";
import './PipelineList.css';

export default function PipelineList() {
  const [pipelines, setPipelines] = useState([]);
  const [editPipeline, setEditPipeline] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableHeight, setTableHeight] = useState("auto");
  const containerRef = useRef(null);

  const calculateTableHeight = useCallback(() => {
    if (containerRef.current) {
      const headerHeight = 120;
      const padding = 32;
      const windowHeight = window.innerHeight;
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const newHeight = windowHeight - containerTop - headerHeight - padding;
      setTableHeight(`${Math.max(newHeight, 300)}px`);
    }
  }, []);

  const fetchPipelines = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://api.autopilotmybusiness.com/api/stages/list");
      const result = await response.json();
      setPipelines(result || []);
    } catch (error) {
      console.error("Failed to fetch pipelines:", error);
      setPipelines([]);
      showAlert("Failed to fetch pipelines", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const showAlert = (message, type = "info") => {
    const alertBox = document.createElement("div");
    alertBox.className = `custom-alert custom-alert-${type}`;
    alertBox.innerHTML = `
      <div class="custom-alert-content">
        <i class="bi ${type === "error" ? "bi-exclamation-triangle-fill" : type === "success" ? "bi-check-circle-fill" : "bi-info-circle-fill"} me-2"></i>
        ${message}
      </div>
      <button class="custom-alert-close">
        <i class="bi bi-x"></i>
      </button>
    `;

    const closeBtn = alertBox.querySelector(".custom-alert-close");
    closeBtn.addEventListener("click", () => {
      alertBox.classList.add("hide");
      setTimeout(() => {
        alertBox.remove();
      }, 300);
    });

    document.body.appendChild(alertBox);
    setTimeout(() => {
      alertBox.classList.add("show");
    }, 10);

    setTimeout(() => {
      alertBox.classList.add("hide");
      setTimeout(() => {
        alertBox.remove();
      }, 300);
    }, 5000);
  };

  const showConfirmation = (message, onConfirm) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-confirm-overlay";

    const confirmBox = document.createElement("div");
    confirmBox.className = "custom-confirm-box";
    confirmBox.innerHTML = `
      <div class="custom-confirm-content">
        <i class="bi bi-exclamation-circle text-warning"></i>
        <p>${message}</p>
      </div>
      <div class="custom-confirm-buttons">
        <button class="btn btn-outline-secondary btn-sm custom-confirm-cancel">Cancel</button>
        <button class="btn btn-danger btn-sm custom-confirm-confirm">Delete</button>
      </div>
    `;

    overlay.appendChild(confirmBox);
    document.body.appendChild(overlay);

    const cancelBtn = confirmBox.querySelector(".custom-confirm-cancel");
    const confirmBtn = confirmBox.querySelector(".custom-confirm-confirm");

    const close = () => {
      overlay.classList.add("fade-out");
      setTimeout(() => {
        overlay.remove();
      }, 300);
    };

    cancelBtn.addEventListener("click", close);
    confirmBtn.addEventListener("click", () => {
      onConfirm();
      close();
    });

    setTimeout(() => {
      overlay.classList.add("show");
    }, 10);
  };

  useEffect(() => {
    fetchPipelines();
    calculateTableHeight();

    const resizeObserver = new ResizeObserver(() => {
      calculateTableHeight();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', calculateTableHeight);

    return () => {
      window.removeEventListener('resize', calculateTableHeight);
      resizeObserver.disconnect();
    };
  }, [fetchPipelines, calculateTableHeight]);

  const handleEdit = (pipeline) => {
    setEditPipeline(pipeline);
  };

  const handleDelete = async (pipelineId, pipelineName) => {
    showConfirmation(
      `Are you sure you want to delete pipeline "${pipelineName}"? This action cannot be undone.`,
      async () => {
        try {
          await fetch(`https://api.autopilotmybusiness.com/api/stages/${pipelineId}`, {
            method: "DELETE"
          });
          setPipelines((prev) => prev.filter((p) => p._id !== pipelineId));
          showAlert("Pipeline deleted successfully", "success");
        } catch (error) {
          console.error("Failed to delete pipeline:", error);
          showAlert("Failed to delete pipeline. Please try again.", "error");
        }
      }
    );
  };

  return (
    <div className="container-fluid py-4 abhi-pipeline-container" ref={containerRef}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1 abhi-pipeline-title">
            <i className="bi bi-diagram-3-fill me-2"></i>
            Pipeline Management
          </h4>
          <p className="abhi-pipeline-subtitle">
            Organize and manage your business workflows
          </p>
        </div>
        <AddPipelineOnly refreshList={fetchPipelines} />
      </div>

      <div className="pipeline-card">
        <div className="card-body p-0">
          <div className="pipeline-table-wrapper">
            <table className="table pipeline-table">
              <thead className="pipeline-table-header">
                <tr>
                  <th className="ps-4">Pipeline Name</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
            </table>

            <div className="pipeline-table-body-scroll" style={{ height: tableHeight }}>
              <table className="table table-hover pipeline-table">
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="2" className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 mb-0 text-muted">Loading pipelines...</p>
                      </td>
                    </tr>
                  ) : pipelines.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="text-center py-4">
                        <div className="d-flex flex-column align-items-center justify-content-center py-4">
                          <i className="bi bi-inbox text-primary" style={{ fontSize: "3rem", opacity: "0.7" }}></i>
                          <p className="mt-3 mb-2 text-muted">No pipelines found</p>
                          <p className="mb-3 text-muted">Get started by creating your first pipeline</p>
                          <button className="btn btn-primary px-3 py-2 create-pipeline-btn" onClick={() => setEditPipeline({})}>
                            <i className="bi bi-plus-lg me-2"></i>
                            Create Pipeline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pipelines.map((pipeline) => (
                      <tr key={pipeline._id} className="pipeline-table-row">
                        <td className="ps-4">
                          <i className="bi bi-funnel-fill text-primary me-2"></i>
                          <span className="fw-medium">{pipeline.pipelineName}</span>
                        </td>
                        <td className="text-end pe-4">
                          <button className="btn btn-outline-primary btn-sm me-2 pipeline-action-btn" title="Edit" onClick={() => handleEdit(pipeline)}>
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-outline-danger btn-sm pipeline-action-btn" title="Delete" onClick={() => handleDelete(pipeline._id, pipeline.pipelineName)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editPipeline && (
        <AddPipelineOnly
          pipelineData={editPipeline}
          onClose={() => setEditPipeline(null)}
          refreshList={fetchPipelines}
        />
      )}
    </div>
  );
}