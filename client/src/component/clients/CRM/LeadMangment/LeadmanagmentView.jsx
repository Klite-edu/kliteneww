// import React, { useRef, useState, useEffect } from "react";
// import "./LeadManagment.css";

// const LeadManagementView = ({ filters }) => {
//   const styles1 = {
//     container: {
//       backgroundColor: '#f8f9fa',
//       padding: '12px 20px',
//       borderBottom: '1px solid #e0e0e0',
//       boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
//     },
//     actionGroup: {
//       display: 'flex',
//       alignItems: 'center',
//       maxWidth: '1200px',
//       margin: '0 auto',
//     },
//     pipelineSelector: {
//       display: 'flex',
//       alignItems: 'center',
//       gap: '12px',
//     },
//     label: {
//       display: 'flex',
//       alignItems: 'center',
//       gap: '8px',
//       fontSize: '14px',
//       fontWeight: '500',
//       color: '#495057',
//     },
//     icon: {
//       fontSize: '16px',
//       color: '#6c757d',
//     },
//     labelText: {
//       whiteSpace: 'nowrap',
//     },
//     select: {
//       padding: '8px 12px',
//       borderRadius: '6px',
//       border: '1px solid #ced4da',
//       backgroundColor: '#fff',
//       fontSize: '14px',
//       color: '#212529',
//       minWidth: '200px',
//       cursor: 'pointer',
//       transition: 'all 0.2s ease',
//     },
//   };

//   const TopActionBar = ({ onPipelineChange, pipelines, selectedPipeline }) => {
//     return (
//       <div className="top-action-bar" style={styles1.container}>
//         <div className="action-group" style={styles1.actionGroup}>
//           <div className="pipeline-selector" style={styles1.pipelineSelector}>
//             <label htmlFor="pipeline-select" style={styles1.label}>
//               <i className="bi bi-diagram-3" style={styles1.icon}></i>
//               <span style={styles1.labelText}>Pipeline</span>
//             </label>
//             <select
//               id="pipeline-select"
//               style={styles1.select}
//               onChange={(e) => onPipelineChange(e.target.value)}
//               value={selectedPipeline?._id || ""}
//             >
//               <option value="" disabled>Select a Pipeline</option>
//               {pipelines.map((pipeline) => (
//                 <option key={pipeline._id} value={pipeline._id}>
//                   {pipeline.pipelineName}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Nested ContactCard component with enhanced error handling
//   const ContactCard = ({ contact, onMoveToNextStage }) => {
//     const [isMoving, setIsMoving] = useState(false);
//     const [error, setError] = useState(null);
//     const [success, setSuccess] = useState(false);

//     const handleMoveClick = async () => {
//       setIsMoving(true);
//       setError(null);
//       setSuccess(false);
//       try {
//         console.log(
//           "Attempting to move contact:",
//           contact.id,
//           "from stage:",
//           contact.currentStage
//         );
//         // Ensure onMoveToNextStage is being called properly
//         await onMoveToNextStage(contact.id, contact.currentStage);
//         setSuccess(true);
//         setTimeout(() => setSuccess(false), 3000);
//       } catch (err) {
//         console.error("Move error:", err);
//         setError(err.message || "Failed to move to next stage");
//       } finally {
//         setIsMoving(false);
//       }
//     };

//     return (
//       <div className="contact-card">
//         <div className="contact-info">
//           <h4>{contact.name}</h4>
//           <p>
//             <i className="bi bi-envelope"></i> {contact.email}
//           </p>
//           <p>
//             <i className="bi bi-telephone"></i> {contact.Number}
//           </p>
//           {contact.amount && (
//             <p>
//               <i className="bi bi-currency-dollar"></i> {contact.amount}
//             </p>
//           )}
//           <p className="submission-date">
//             <i className="bi bi-clock"></i>{" "}
//             {new Date(contact.when).toLocaleDateString()}
//           </p>
//         </div>
//         <button
//           className={`move-button ${isMoving ? "moving" : ""}`}
//           onClick={handleMoveClick}
//           disabled={isMoving}
//         >
//           {isMoving ? (
//             <span>Moving...</span>
//           ) : (
//             <>
//               <i className="bi bi-arrow-right"></i> Move to Next Stage
//             </>
//           )}
//         </button>
//         {error && <div className="move-error">{error}</div>}
//         {success && <div className="move-success">Moved successfully!</div>}
//       </div>
//     );
//   };

//   // Main component logic
//   const containerRef = useRef(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [startX, setStartX] = useState(0);
//   const [scrollLeft, setScrollLeft] = useState(0);
//   const [pipelines, setPipelines] = useState([]);
//   const [selectedPipeline, setSelectedPipeline] = useState(null);
//   const [columns, setColumns] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const token = localStorage.getItem("token");
//   // Mouse event handlers for horizontal scrolling
//   const handleMouseDown = (e) => {
//     setIsDragging(true);
//     setStartX(e.pageX - containerRef.current.offsetLeft);
//     setScrollLeft(containerRef.current.scrollLeft);
//   };

//   const handleMouseLeave = () => {
//     setIsDragging(false);
//   };

//   const handleMouseUp = () => {
//     setIsDragging(false);
//   };

//   const handleMouseMove = (e) => {
//     if (!isDragging) return;
//     e.preventDefault();
//     const x = e.pageX - containerRef.current.offsetLeft;
//     const walk = (x - startX) * 2;
//     containerRef.current.scrollLeft = scrollLeft - walk;
//   };

//   // Fetch all pipelines
//   const fetchPipelines = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch(
//         `${process.env.REACT_APP_API_URL}/api/stages/list`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to fetch pipelines");
//       }
//       const data = await response.json();
//       console.log("Pipelines data:", data);
//       setPipelines(data);
//       if (data.length > 0) {
//         setSelectedPipeline(data[0]);
//       }
//     } catch (error) {
//       console.error("Error fetching pipelines:", error);
//       setError(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Fetch leads for the selected pipeline
//   const fetchLeadsForPipeline = async (pipelineId) => {
//     if (!pipelineId) {
//       console.log("No pipeline ID provided");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       console.log("Fetching leads for pipeline:", pipelineId);
//       const response = await fetch(
//         `${process.env.REACT_APP_API_URL}/api/form/leads-by-stages`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to fetch leads");
//       }
//       const leadsData = await response.json();
//       console.log("Leads data:", leadsData);

//       const pipeline = pipelines.find((p) => p._id === pipelineId);
//       if (!pipeline) throw new Error("Pipeline not found");

//       const formattedColumns = pipeline.stages.map((stage) => {
//         const matchingStage = leadsData.find(
//           (lead) => lead.stage_id === stage._id
//         );
//         const stageLeads = matchingStage?.leads || [];

//         console.log(`Stage ${stage.stageName} has ${stageLeads.length} leads`);

//         const contacts = stageLeads.map((lead, i) => ({
//           id: lead.submission_id || `${stage._id}-${i}`,
//           name: lead.data?.Name || lead.data?.name || "No Name",
//           phone: lead.data?.Number || "N/A",
//           email: lead.data?.email || "N/A",
//           amount: lead.data?.amount || "0",
//           currentStage: stage._id,
//           stageName: stage.stageName,
//           when: lead.submittedAt || "N/A",
//         }));

//         return {
//           id: stage._id,
//           title: stage.stageName,
//           leads: contacts.length,
//           contacts,
//         };
//       });

//       console.log("Formatted columns:", formattedColumns);
//       setColumns(formattedColumns);
//     } catch (error) {
//       console.error("Error fetching leads:", error);
//       setError(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Enhanced handleMoveToNextStage function
//   const handleMoveToNextStage = async (contactId, currentStageId) => {
//     try {
//       console.log("Moving contact to next stage:", contactId, currentStageId);
//       const response = await fetch(
//         `${process.env.REACT_APP_API_URL}/api/form/move-to-next-stage`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ submissionId: contactId, currentStageId }),
//         }
//       );
//       if (!response.ok) throw new Error("Failed to move to next stage");
//       const result = await response.json();
//       console.log("Move result:", result);
//       alert(result.message);
//       await fetchPipelines();
//     } catch (error) {
//       console.error("Error moving to next stage:", error);
//       alert("Error moving to next stage");
//     }
//   };

//   // Handle pipeline selection change
//   const handlePipelineChange = (pipelineId) => {
//     console.log("Pipeline changed to:", pipelineId);
//     const selected = pipelines.find((p) => p._id === pipelineId);
//     setSelectedPipeline(selected);
//     if (selected) {
//       fetchLeadsForPipeline(selected._id);
//     }
//   };

//   // Initial data fetch
//   useEffect(() => {
//     console.log("Component mounted, fetching initial data");
//     fetchPipelines();
//   }, []);

//   // Fetch leads when pipeline changes
//   useEffect(() => {
//     if (selectedPipeline) {
//       console.log("Selected pipeline changed, fetching leads");
//       fetchLeadsForPipeline(selectedPipeline._id);
//     }
//   }, [selectedPipeline]);

//   if (error) {
//     console.error("Rendering error state:", error);
//     return <div className="error-message">Error: {error}</div>;
//   }

//   if (isLoading) {
//     console.log("Rendering loading state");
//     return <div className="loading-spinner">Loading...</div>;
//   }

//   console.log("Rendering lead management view with columns:", columns);

//   return (
//     <div className="lead-management-view">
//       <TopActionBar
//         onPipelineChange={handlePipelineChange}
//         pipelines={pipelines}
//         selectedPipeline={selectedPipeline}
//       />

//       <div
//         className="pipeline-container bg-light p-3 rounded-3"
//         ref={containerRef}
//         onMouseDown={handleMouseDown}
//         onMouseLeave={handleMouseLeave}
//         onMouseUp={handleMouseUp}
//         onMouseMove={handleMouseMove}
//       >
//         <div className="abhi-contacts-container row flex-nowrap overflow-x-auto g-3">
//           {columns.map((column) => (
//             <div key={column.id} className="col-md-3" style={{ minWidth: "300px" }}>
//               <div className="card h-100 shadow-sm">
//                 <div className="card-header text-white" style={{backgroundColor: '#0D6E6E'}}>
//                   <h5 className="stage-title mb-0 fw-semibold">{column.title}</h5>
//                   <small className="text-light">{column.contacts.length} contacts</small>
//                 </div>
//                 {/* 👇 Y-axis scrolling inside card */}
//                 <div className="card-body p-2 overflow-y-auto" style={{ maxHeight: "300px" }}>
//                   <div className="contacts-container d-flex flex-column gap-2">
//                     {column.contacts.map((contact) => (
//                       <div
//                         key={contact.id}
//                         className="contact-card card p-3 shadow-sm hover-shadow transition-all"
//                       >
//                         <h5 className="text-truncate mb-1">{contact.name}</h5>
//                         <p className="text-muted small mb-1 text-truncate">
//                           <i className="bi bi-envelope me-1"></i>
//                           {contact.email}
//                         </p>
//                         <p className="text-muted small mb-2 text-truncate">
//                           <i className="bi bi-telephone me-1"></i>
//                           {contact.Number}
//                         </p>
//                         <button
//                           className="btn btn-sm btn-outline-primary border border-2 border-success w-100"
//                           onClick={() => handleMoveToNextStage(contact.id, contact.currentStage)}
//                         >
//                           <i className="bi bi-arrow-right me-1"></i>
//                           Next Stage
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LeadManagementView;

import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ContactPopup from './ConatactPopup';

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
          id: lead.submission_id || `${stage._id}-${i}`,
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
                          <div>
                            <strong>How:</strong> {stageData.how || 'Not specified'}
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
                          onClick={(e) => {
                            if (!e.target.closest('.btn-next-stage')) {
                              setSelectedContact(contact);
                            }
                          }}
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
                            onClick={() => handleMoveToNextStage(contact.id, contact.currentStage)}
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

      {/* Contact Popup */}
      {selectedContact && (
        <ContactPopup
          contact={selectedContact} 
          onClose={() => setSelectedContact(null)} 
        />
      )}

      <style jsx>{`
        :root {
          --abhi-primary: #0d6e6e;
          --abhi-primary-light: #e0f2f2;
          --abhi-primary-lighter: #f0f9f9;
          --abhi-primary-dark: #0a5656;
          --abhi-secondary: #6c757d;
          --abhi-success: #28a745;
          --abhi-danger: #dc3545;
          --abhi-warning: #ffc107;
          --abhi-info: #17a2b8;
          --abhi-light: #f8f9fa;
          --abhi-dark: #343a40;
          --abhi-gray-100: #f5f5f5;
          --abhi-gray-200: #e0e0e0;
          --abhi-gray-300: #cccccc;
          --abhi-border-radius: 10px;
          --abhi-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          --abhi-transition: all 0.25s ease;
        }

        /* Base Styles */
        .lead-management-view {
          display: flex;
          flex-direction: column;
          height: calc(100% - 800px);
          background-color: var(--abhi-gray-100);
        }

        .pipeline-container {
          flex: 1;
          overflow-x: auto;
          padding: 1rem;
          background-color: var(--abhi-primary-light);
        }

        .abhi-contacts-container {
          display: flex;
          gap: 1.25rem;
          padding-bottom: 0.5rem;
        }

        /* Card Styles */
        .card-container {
          flex: 0 0 auto;
          width: 320px;
        }

        .card {
          border-radius: var(--abhi-border-radius);
          box-shadow: var(--abhi-box-shadow);
          overflow: hidden;
          background-color: white;
          transition: var(--abhi-transition);
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        /* Card Header */
        .card-header {
          padding: 1rem 1.25rem;
          background-color: var(--abhi-primary);
          color: white;
          border-bottom: none;
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background-color: var(--abhi-primary-dark);
        }

        .stage-title {
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .card-header small {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
        }

        .btn-toggle {
          color: white;
          background-color: rgba(255, 255, 255, 0.2);
          border: none;
          width: 90px;
          height: 28px;
          border-radius: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: var(--abhi-transition);
        }

        .btn-toggle:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        .btn-toggle[aria-expanded="true"] i {
          transform: rotate(180deg);
        }

        /* Card Body */
        .bg-light-details {
          background-color: var(--abhi-primary-lighter);
          border-bottom: 1px solid var(--abhi-gray-200);
          padding: 1rem;
        }

        .stage-details div {
          margin-bottom: 0.5rem;
        }

        .contacts-list {
          padding: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
        }

        /* Contact Card */
        .contact-card {
          padding: 0.875rem;
          background-color: white;
          border-radius: calc(var(--abhi-border-radius) - 2px);
          border: 1px solid var(--abhi-gray-200);
          transition: var(--abhi-transition);
          margin-bottom: 0.75rem;
          cursor: pointer;
        }

        .contact-card:last-child {
          margin-bottom: 0;
        }

        .contact-card:hover {
          border-color: var(--abhi-primary);
          box-shadow: 0 2px 8px rgba(13, 110, 110, 0.1);
        }

        .contact-info h4 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          color: var(--abhi-dark);
        }

        .contact-info p {
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
          color: var(--abhi-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .contact-info i {
          font-size: 0.9rem;
        }

        /* Next Stage Button */
        .btn-next-stage {
          background-color: var(--abhi-primary-light);
          color: var(--abhi-primary-dark);
          border: none;
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          width: 100%;
          justify-content: center;
          transition: var(--abhi-transition);
          cursor: pointer;
        }

        .btn-next-stage:hover {
          background-color: var(--abhi-primary);
          color: white;
        }

        .btn-next-stage i {
          font-size: 0.9rem;
        }

        /* Empty State */
        .empty-state {
          color: var(--abhi-secondary);
          background-color: var(--abhi-gray-100);
          border-radius: var(--abhi-border-radius);
          padding: 1rem;
          text-align: center;
          font-size: 0.9rem;
        }

        /* Error and Loading States */
        .error-message {
          color: var(--abhi-danger);
          padding: 2rem;
          text-align: center;
          font-size: 1.1rem;
        }

        .loading-spinner {
          padding: 2rem;
          text-align: center;
          color: var(--abhi-primary);
        }

        /* Contact Popup Styles */
        .contact-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .contact-popup {
          background-color: white;
          padding: 1.5rem;
          border-radius: var(--abhi-border-radius);
          width: 80%;
          min-width: 600px;
          min-height: 80%;
          max-height: 800;
          position: relative;
          box-shadow: var(--abhi-box-shadow);
        }

        .popup-close-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--abhi-secondary);
        }

        .popup-details {
          margin-top: 1rem;
        }

        .popup-details p {
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Scrollbar Styling */
        .contacts-list::-webkit-scrollbar {
          width: 6px;
        }

        .contacts-list::-webkit-scrollbar-track {
          background: var(--abhi-gray-100);
        }

        .contacts-list::-webkit-scrollbar-thumb {
          background-color: var(--abhi-gray-300);
          border-radius: 3px;
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .card-container {
            width: 280px;
          }
          
          .pipeline-container {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LeadManagementView;