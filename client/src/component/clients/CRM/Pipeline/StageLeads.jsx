import React, { useState, useEffect } from "react";
import axios from "axios";

const StageLeads = ({ form_id }) => {
  const [leadsByStages, setLeadsByStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeadsByStages = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/form/leads-by-stages?form_id=${form_id}`
      );
      console.log("Leads fetched successfully:", response.data);
      setLeadsByStages(response.data);
    } catch (error) {
      console.error("Error fetching leads by stages:", error);
      setError("Failed to fetch leads. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsByStages();
  }, [form_id]);

  if (loading) return <p style={styles.loading}>Loading...</p>;
  if (error) return <p style={styles.error}>Error: {error}</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Leads Grouped by Pipeline Stages</h1>

      {leadsByStages.length === 0 ? (
        <p style={styles.noLeads}>No submissions found for this form.</p>
      ) : (
        <div style={styles.stagesContainer}>
          {leadsByStages.map((group, index) => (
            <div key={index} style={styles.stageCard}>
              <h2 style={styles.stageHeading}>
                Stage: {group.stage || "Unknown Stage"}
              </h2>

              {group.leads.length === 0 ? (
                <p style={styles.noLeads}>No leads found in this stage.</p>
              ) : (
                <ul style={styles.leadsList}>
                  {group.leads.map((lead, leadIndex) => (
                    <li key={leadIndex} style={styles.leadItem}>
                      <div style={styles.leadDetails}>
                        <p>
                          <strong>Submission ID:</strong> {lead.submission_id}
                        </p>
                        <p>
                          <strong>Submitted At:</strong>{" "}
                          {new Date(lead.submittedAt).toLocaleString()}
                        </p>
<p>
    {lead.data.email}
</p>
<p>{lead.data.name}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StageLeads;

// Styles for the component
const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  heading: {
    textAlign: "center",
    color: "#333",
    marginBottom: "20px",
  },
  loading: {
    textAlign: "center",
    color: "#007bff",
  },
  error: {
    textAlign: "center",
    color: "red",
  },
  noLeads: {
    textAlign: "center",
    color: "#666",
  },
  stagesContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  stageCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    padding: "15px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  stageHeading: {
    fontSize: "1.5rem",
    color: "#007bff",
    marginBottom: "10px",
  },
  leadsList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
  },
  leadItem: {
    backgroundColor: "#fff",
    borderRadius: "6px",
    padding: "10px",
    marginBottom: "10px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  leadDetails: {
    fontSize: "0.9rem",
    color: "#555",
  },
  fieldsContainer: {
    marginTop: "10px",
  },
  fieldsList: {
    listStyle: "none",
    padding: "0",
    margin: "10px 0 0 0",
  },
  fieldItem: {
    backgroundColor: "#f1f1f1",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "8px",
  },
};