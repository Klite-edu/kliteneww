import React, { useRef, useState, useEffect } from "react";
import TopActionBar from "../TopActionBar/TopActionBar";
import ContactCard from "../contractCard/ContactCard";
import "./LeadManagment.css";
const LeadManagementView = ({ filters }) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [pipelineList, setPipelineList] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Fetch pipelines
  const fetchPipelines = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/stages/list`
      );
      if (!response.ok) throw new Error("Failed to fetch pipelines");
      const data = await response.json();
      console.log("data", data);
      setPipelineList(data);
      if (data.length > 0) {
        setSelectedPipeline(data[0].pipelineName); // Set the first pipeline as selected by default
        await updateColumnsFromPipeline(selectedPipeline); // Update columns based on the selected pipeline
      }
    } catch (error) {
      console.error("Error fetching pipelines:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  console.log("pipelinelist", pipelineList);
  console.log("selectedPipeline2", selectedPipeline);
  useEffect(() => {
    fetchPipelines();
  }, []);
  const updateColumnsFromPipeline = async (pipeline) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/form/leads-by-stages`
      );
      if (!response.ok) throw new Error("Failed to fetch leads");
      const leadsData = await response.json();
      const formattedColumns = pipeline.stages.map((stage) => {
        const matchingStage = leadsData.find(
          (lead) => lead.stage_id === stage._id
        );
        const stageLeads = matchingStage?.leads || [];
        const contacts = stageLeads.map((lead, i) => ({
          id: lead.submission_id || `${stage.stageName}-${i}`,
          name: lead.data?.Name || "No Name",
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
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const handleMoveToNextStage = async (contactId, currentStageId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/form/move-to-next-stage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ submissionId: contactId, currentStageId }),
        }
      );
      if (!response.ok) throw new Error("Failed to move to next stage");
      const result = await response.json();
      alert(result.message);
      await fetchPipelines();
    } catch (error) {
      console.error("Error moving to next stage:", error);
      alert("Error moving to next stage");
    }
  };
  if (error) return <div className="error-message">Error: {error}</div>;
  if (isLoading) return <div className="loading-spinner">Loading...</div>;
  return (
    <div className="lead-management-view">
      <TopActionBar
        onFilterChange={(selected) => setSelectedPipeline(selected)}
        pipelineList={pipelineList.map((p) => p.pipelineName)}
        selectedPipeline={selectedPipeline}
      />
      <div className="pipeline-container" ref={containerRef}>
        {columns.map((column) => (
          <div key={column.id} className="pipeline-column">
            <h3 className="stage-title">{column.title}</h3>
            <div className="contacts-container">
              {column.contacts.map((contact) => (
                <div key={contact.id} className="contact-card">
                  <h4>{contact.name}</h4>
                  <p>{contact.email}</p>
                  <p>{contact.phone}</p>
                  <button
                    onClick={() =>
                      handleMoveToNextStage(contact.id, contact.currentStage)
                    }
                  >
                    Move to Next Stage
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default LeadManagementView;