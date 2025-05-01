
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import AddPipelineOnly from "./AddPipelineOnly";
import "./PipelineList.css";
// import "./Alert.css"; // Add this new CSS file for alerts
// import "./Confirmation.css"; // Add this new CSS file for confirmations
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";
import {
  BiLayer,
  BiArchive,
  BiFilterAlt,
  BiEdit,
  BiTrash,
} from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";

// Add Alert Component
const Alert = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`custom-alert custom-alert-${type} show`}>
      <div className="custom-alert-content">
        <div className="custom-alert-icon">
          <i className={`bi ${
            type === "error"
              ? "bi-exclamation-octagon-fill"
              : type === "success"
              ? "bi-check-circle-fill"
              : "bi-info-circle-fill"
          }`} />
        </div>
        <div className="custom-alert-message">{message}</div>
        <button className="custom-alert-close" onClick={onClose}>
          <i className="bi bi-x-lg" />
        </button>
      </div>
    </div>
  );
};

// Add Confirmation Component
const Confirmation = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="custom-confirm-overlay show">
      <div className="custom-confirm-box">
        <div className="custom-confirm-content">
          <h5 className="custom-confirm-title">Are you sure?</h5>
          <p className="custom-confirm-message">{message}</p>
          <div className="custom-confirm-buttons">
            <button className="btn btn-outline-secondary btn-sm custom-confirm-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-danger btn-sm custom-confirm-confirm" onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PipelineList() {
  const [pipelines, setPipelines] = useState([]);
  const [editPipeline, setEditPipeline] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableHeight, setTableHeight] = useState("auto");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [alert, setAlert] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const containerRef = useRef(null);
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const showAlert = useCallback((message, type = "info") => {
    setAlert({ message, type });
  }, []);

  const showConfirmation = useCallback((message, onConfirm) => {
    setConfirmation({
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmation(null);
      },
      onCancel: () => setConfirmation(null)
    });
  }, []);

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

  const fetchPipelines = useCallback(async (token) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stages/list`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      );
      setPipelines(response.data || []);
    } catch (error) {
      console.error("Failed to fetch pipelines:", error);
      setPipelines([]);
      showAlert("Failed to fetch pipelines", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [tokenRes, roleRes, permissionsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-token`, { withCredentials: true }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, { withCredentials: true }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-permissions`, { withCredentials: true })
      ]);

      const userToken = tokenRes.data.token;
      const userRole = roleRes.data.role;
      const userPermissions = permissionsRes.data.permissions || {};

      if (!userToken || !userRole) {
        navigate("/login");
        return;
      }

      setToken(userToken);
      setRole(userRole);
      setCustomPermissions(userPermissions);

      await fetchPipelines(userToken);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      navigate("/login");
    }
  }, [navigate, fetchPipelines]);

  useEffect(() => {
    fetchInitialData();
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
  }, [fetchInitialData, calculateTableHeight]);

  const handleEdit = (pipeline) => {
    setEditPipeline(pipeline);
  };

  const handleDelete = async (pipelineId, pipelineName) => {
    showConfirmation(
      `Are you sure you want to delete pipeline "${pipelineName}"? This action cannot be undone.`,
      async () => {
        try {
          await axios.delete(
            `${process.env.REACT_APP_API_URL}/api/stages/${pipelineId}`,
            {
              withCredentials: true,
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            }
          );
          setPipelines((prev) => prev.filter((p) => p._id !== pipelineId));
          showAlert("Pipeline deleted successfully", "success");
        } catch (error) {
          console.error("Error deleting pipeline:", error);
          showAlert(
            `Failed to delete pipeline: ${error.response?.data?.message || "Unknown error"}`,
            "error"
          );
        }
      }
    );
  };

  const handlePipelineUpdate = () => {
    setEditPipeline(null);
    fetchPipelines(token);
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      {confirmation && (
        <Confirmation
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={confirmation.onCancel}
        />
      )}
      <div className="pipline-dash-buttons">
        <Link to="/FormBuilder">
          <button>Form Builder</button>
        </Link>
        <Link to="/automation">
          <button>Automation</button>
        </Link>
        <Link to="/form">
          <button>Forms</button>
        </Link>
        <Link to="/opportunities">
          <button>Opportunitities</button>
        </Link>
      </div>
      <div className="py-4 PipelinesList-pipeline-container" ref={containerRef}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold mb-1 PipelinesList-pipeline-title">
              <BiLayer className="me-2" />
              FMS/Pipeline Management
            </h4>
            <p className="PipelinesList-pipeline-subtitle">
              Organize and manage your business workflows
            </p>
          </div>
          <AddPipelineOnly refreshList={() => fetchPipelines(token)} />
        </div>

        <div className="PipelinesList-pipeline-card">
          <div className="card-body p-0">
            <div className="PipelinesList-pipeline-table-wrapper">
              <table className="table PipelinesList-pipeline-table">
                <thead className="PipelinesList-pipeline-table-header">
                  <tr>
                    <th className="ps-4">Pipeline Name</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
              </table>

              <div
                className="PipelinesList-pipeline-table-body-scroll"
                style={{ height: tableHeight }}
              >
                <table className="table table-hover PipelinesList-pipeline-table">
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="2" className="text-center py-5">
                          <div
                            className="spinner-border PipelinesList-spinner-border"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2 mb-0 text-muted">
                            Loading FMS/pipelines...
                          </p>
                        </td>
                      </tr>
                    ) : pipelines.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center justify-content-center py-4">
                            <BiArchive
                              className="text-primary"
                              style={{ fontSize: "3rem", opacity: "0.7" }}
                            />
                            <p className="mt-3 mb-2 text-muted">
                              No FMS/pipelines found
                            </p>
                            <p className="mb-3 text-muted">
                              Get started by creating your first fms/pipeline
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pipelines.map((pipeline) => (
                        <tr
                          key={pipeline._id}
                          className="PipelinesList-pipeline-table-row"
                        >
                          <td className="ps-4">
                            <BiFilterAlt className="text-primary me-2" />
                            <span className="fw-medium">
                              {pipeline.pipelineName}
                            </span>
                          </td>

                          <td className="text-end pe-4">
                            <button
                              className="btn btn-outline-primary btn-sm me-2 PipelinesList-pipeline-action-btn"
                              title="Edit"
                              onClick={() => handleEdit(pipeline)}
                            >
                              <BiEdit />
                            </button>

                            <button
                              className="btn btn-danger btn-sm PipelinesList-pipeline-action-btn"
                              title="Delete"
                              onClick={() =>
                                handleDelete(
                                  pipeline._id,
                                  pipeline.pipelineName
                                )
                              }
                            >
                              <BiTrash />
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
            refreshList={() => fetchPipelines(token)}
          />
        )}
      </div>
    </>
  );
}