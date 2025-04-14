import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './LeadManagment.css'
import ContactPopup from "./ConatactPopup";

const LeadManagementView = ({ filters }) => {
  const navigate = useNavigate();
  // Main component state
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedStageDetails, setSelectedStageDetails] = useState(null);
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [clientId, setClientId] = useState(null);

  // Styles for TopActionBar
  const styles1 = {
    container: {
      backgroundColor: '#f8f9fa',
      padding: '12px 20px',
      borderBottom: '1px solid #e0e0e0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    actionGroup: {
      display: 'flex',
      alignItems: 'center',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    pipelineSelector: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#495057',
    },
    icon: {
      fontSize: '16px',
      color: '#6c757d',
    },
    labelText: {
      whiteSpace: 'nowrap',
    },
    select: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #ced4da',
      backgroundColor: '#fff',
      fontSize: '14px',
      color: '#212529',
      minWidth: '200px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
  };

  // Fetch authentication data
  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-token`, { withCredentials: true }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, { withCredentials: true }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-permissions`, { withCredentials: true })
        ]);

        const userToken = tokenRes.data.token;
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};
        const userId = tokenRes.data.userId;

        if (!userToken || !userId) {
          navigate("/login");
          return;
        }

        setToken(userToken);
        setRole(userRole);
        setCustomPermissions(userPermissions);
        setClientId(userId);

        // Now fetch pipelines
        await fetchPipelines(userToken);
      } catch (error) {
        console.error("Error fetching auth data:", error);
        navigate("/login");
      }
    };

    fetchAuthData();
  }, [navigate]);

  // Top Action Bar Component
  const TopActionBar = ({ onPipelineChange, pipelines, selectedPipeline }) => {
    return (
      <div className="top-action-bar" style={styles1.container}>
        <div className="action-group ms-0 me-auto" style={styles1.actionGroup}>
          <div className="pipeline-selector" style={styles1.pipelineSelector}>
            <label htmlFor="pipeline-select" style={styles1.label}>
              <i className="bi bi-diagram-3" style={styles1.icon}></i>
              <span style={styles1.labelText}>Pipeline</span>
            </label>
            <select
              id="pipeline-select"
              style={styles1.select}
              onChange={(e) => onPipelineChange(e.target.value)}
              value={selectedPipeline?._id || ""}
            >
              <option value="" disabled>Select a Pipeline</option>
              {pipelines.map((pipeline) => (
                <option key={pipeline._id} value={pipeline._id}>
                  {pipeline.pipelineName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  // Mouse event handlers for horizontal scrolling
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Fetch all pipelines
  const fetchPipelines = async (userToken) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stages/list`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          withCredentials: true,
        }
      );
      setPipelines(response.data);
      if (response.data.length > 0) {
        setSelectedPipeline(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching pipelines:", error);
      setError(error.response?.data?.message || "Failed to fetch pipelines");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch leads for the selected pipeline
  const fetchLeadsForPipeline = async (pipelineId) => {
    if (!pipelineId || !token) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/form/leads-by-stages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      const leadsData = response.data;

      const pipeline = pipelines.find((p) => p._id === pipelineId);
      if (!pipeline) throw new Error("Pipeline not found");

      const formattedColumns = pipeline.stages.map((stage) => {
        const matchingStage = leadsData.find(
          (lead) => lead.stage_id === stage._id
        );
        const stageLeads = matchingStage?.leads || [];

        const contacts = stageLeads.map((lead, i) => ({
          id: lead.submission_id,
          name: lead.data?.Name || lead.data?.name || "No Name",
          phone: lead.data?.phone || "N/A",
          email: lead.data?.email || "N/A",
          amount: lead.data?.amount || "0",
          currentStage: stage._id,
          stageName: stage.stageName,
          when: lead.submittedAt || "N/A",
        }));

        return {
          id: stage._id,
          title: stage.stageName,
          leads: contacts.length,
          contacts,
          stageDetails: {
            what: stage.what,
            when: stage.when,
            how: stage.how,
            who: stage.who,
            checklist: stage.checklist
          }
        };
      });

      setColumns(formattedColumns);
    } catch (error) {
      console.error("Error fetching leads:", error);
      setError(error.response?.data?.message || "Failed to fetch leads");
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced handleMoveToNextStage function
  const handleMoveToNextStage = async (contactId, currentStageId) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/form/move-to-next-stage`,
        { submissionId: contactId, currentStageId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      alert(response.data.message);
      await fetchPipelines(token);
    } catch (error) {
      console.error("Error moving to next stage:", error);
      alert(error.response?.data?.message || "Error moving to next stage");
    }
  };

  // Handle contact click
  const handleContactClick = (contact, column) => {
    setSelectedContact(contact);
    setSelectedStageDetails(column.stageDetails);
  };

  // Handle pipeline selection change
  const handlePipelineChange = (pipelineId) => {
    const selected = pipelines.find((p) => p._id === pipelineId);
    setSelectedPipeline(selected);
    if (selected) {
      fetchLeadsForPipeline(selected._id);
    }
  };

  // Fetch leads when pipeline changes
  useEffect(() => {
    if (selectedPipeline && token) {
      fetchLeadsForPipeline(selectedPipeline._id);
    }
  }, [selectedPipeline, token]);

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="lead-management-view">
      <TopActionBar
        onPipelineChange={handlePipelineChange}
        pipelines={pipelines}
        selectedPipeline={selectedPipeline}
      />

      <div
        className="pipeline-container"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div className="abhi-contacts-container">
          {columns.map((column, index) => {
            const stageData = selectedPipeline?.stages?.find(stage => stage._id === column.id);

            return (
              <div key={column.id} className="card-container">
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h5 className="stage-title">{column.title}</h5>
                      <small>{column.contacts.length} contacts</small>
                    </div>
                    <button
                      className="btn-toggle"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#columnDetails${index}`}
                      aria-expanded="false"
                      aria-controls={`columnDetails${index}`}
                    >
                      Details
                      <i className="bi bi-chevron-down ms-2"></i>
                    </button>
                  </div>

                  <div className="collapse" id={`columnDetails${index}`}>
                    <div className="bg-light-details">
                      {stageData && (
                        <div className="stage-details">
                          <div>
                            <strong>What:</strong> {stageData.what || 'Not specified'}
                          </div>
                          <div>
                            <strong>When:</strong> {stageData.when || 'Not specified'}
                          </div>
                          <div className="d-flex justify-content-between">
                            <p>
                              <strong>How:</strong> {stageData.how?.message || 'Not specified'}
                            </p>
                            {stageData.how?.url && (
                              <a href={stageData.how.url} target="_blank" rel="noopener noreferrer">
                                <i className="bi bi-box-arrow-up-right"></i>
                              </a>
                            )}
                          </div>
                          <div>
                            <strong>Who:</strong> {stageData.who?.fullName || 'Not assigned'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="contacts-list">
                    {column.contacts.length > 0 ? (
                      column.contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="contact-card"
                          onClick={() => handleContactClick(contact, column)}
                        >
                          <div className="contact-info">
                            <h4>{contact.name}</h4>
                            <p>
                              <i className="bi bi-envelope"></i> {contact.email}
                            </p>
                            <p>
                              <i className="bi bi-telephone"></i> {contact.phone}
                            </p>
                            {contact.amount && (
                              <p>
                                <i className="bi bi-currency-dollar"></i> {contact.amount}
                              </p>
                            )}
                            <p className="submission-date">
                              <i className="bi bi-clock"></i>{" "}
                              {new Date(contact.when).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            className="btn-next-stage"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveToNextStage(contact.id, contact.currentStage);
                            }}
                          >
                            <i className="bi bi-arrow-right"></i> Next Stage
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        No contacts in this stage
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Popup with stage details and pipeline ID */}
      {selectedContact && selectedPipeline && (
        <ContactPopup
          contact={selectedContact}
          stageDetails={selectedStageDetails}
          pipelineId={selectedPipeline._id}
          leadId={selectedContact.id}  
          stageId={selectedContact.currentStage}
          onClose={() => {
            setSelectedContact(null);
            setSelectedStageDetails(null);
          }}
        />
      )}
      
    </div>
  );
};

export default LeadManagementView;