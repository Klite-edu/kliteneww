import React, { useEffect, useState, useRef, useCallback } from "react";
import AddPipelineOnly from "./AddPipelineOnly";
import "./PipelineList.css";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

export default function PipelineList() {
  const [pipelines, setPipelines] = useState([]);
  const [editPipeline, setEditPipeline] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableHeight, setTableHeight] = useState("auto");
  const containerRef = useRef(null);
  const role = localStorage.getItem("role");
  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

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
      const response = await fetch(
        "https://api.autopilotmybusiness.com/api/stages/list"
      );
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
        <div class="custom-alert-icon">
          <i class="bi ${
            type === "error"
              ? "bi-exclamation-octagon-fill"
              : type === "success"
              ? "bi-check-circle-fill"
              : "bi-info-circle-fill"
          }"></i>
        </div>
        <div class="custom-alert-message">${message}</div>
        <button class="custom-alert-close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;

    const closeBtn = alertBox.querySelector(".custom-alert-close");
    closeBtn.addEventListener("click", () => {
      alertBox.classList.remove("show");
      setTimeout(() => {
        alertBox.remove();
      }, 300);
    });

    document.body.appendChild(alertBox);

    // Trigger reflow to enable animation
    void alertBox.offsetWidth;

    alertBox.classList.add("show");

    setTimeout(() => {
      alertBox.classList.remove("show");
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
        <div class="custom-confirm-icon">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <h5 class="custom-confirm-title">Are you sure?</h5>
        <p class="custom-confirm-message">${message}</p>
        <div class="custom-confirm-buttons">
          <button class="btn btn-light btn-sm custom-confirm-cancel">Cancel</button>
          <button class="btn btn-danger btn-sm custom-confirm-confirm">Delete</button>
        </div>
      </div>
    `;

    overlay.appendChild(confirmBox);
    document.body.appendChild(overlay);

    const cancelBtn = confirmBox.querySelector(".custom-confirm-cancel");
    const confirmBtn = confirmBox.querySelector(".custom-confirm-confirm");

    const close = () => {
      overlay.classList.remove("show");
      setTimeout(() => {
        overlay.remove();
      }, 300);
    };

    cancelBtn.addEventListener("click", close);
    confirmBtn.addEventListener("click", () => {
      onConfirm();
      close();
    });

    // Trigger reflow to enable animation
    void overlay.offsetWidth;

    overlay.classList.add("show");
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

    window.addEventListener("resize", calculateTableHeight);

    return () => {
      window.removeEventListener("resize", calculateTableHeight);
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
          await fetch(
            `https://api.autopilotmybusiness.com/api/stages/${pipelineId}`,
            {
              method: "DELETE",
            }
          );
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
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div
        className="container-fluid py-4 abhi-pipeline-container"
        ref={containerRef}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
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

        <div className="abhi-pipeline-card">
          <div className="card-body p-0">
            <div className="abhi-pipeline-table-wrapper">
              <table className="table abhi-pipeline-table">
                <thead className="abhi-pipeline-table-header">
                  <tr>
                    <th className="ps-4">Pipeline Name</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
              </table>

              <div
                className="abhi-pipeline-table-body-scroll"
                style={{ height: tableHeight }}
              >
                <table className="table table-hover abhi-pipeline-table">
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="2" className="text-center py-5">
                          <div
                            className="abhi-spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2 mb-0 text-muted">
                            Loading pipelines...
                          </p>
                        </td>
                      </tr>
                    ) : pipelines.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center justify-content-center py-4">
                            <i
                              className="bi bi-inbox text-primary"
                              style={{ fontSize: "3rem", opacity: "0.7" }}
                            ></i>
                            <p className="mt-3 mb-2 text-muted">
                              No pipelines found
                            </p>
                            <p className="mb-3 text-muted">
                              Get started by creating your first pipeline
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pipelines.map((pipeline) => (
                        <tr
                          key={pipeline._id}
                          className="abhi-pipeline-table-row"
                        >
                          <td className="ps-4">
                            <i className="bi bi-funnel-fill text-primary me-2"></i>
                            <span className="fw-medium">
                              {pipeline.pipelineName}
                            </span>
                          </td>

                          <td className="text-end pe-4">
                            <button
                              className="btn btn-outline-primary btn-sm me-2 abhi-pipeline-action-btn"
                              title="Edit"
                              onClick={() => handleEdit(pipeline)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>

                            <button
                              className="btn btn-danger btn-sm  abhi-pipeline-action-btn pe-2"
                              title="Delete"
                              onClick={() =>
                                handleDelete(
                                  pipeline._id,
                                  pipeline.pipelineName
                                )
                              }
                              style={{
                                border: "2px solid var(--primary-color)",
                              }}
                            >
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
    </>
  );
}
