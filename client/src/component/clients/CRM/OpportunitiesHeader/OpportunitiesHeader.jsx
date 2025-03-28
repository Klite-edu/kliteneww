import React from "react";
import './OpportunitiesHeader.css'

const OpportunitiesHeader = () => {
  return (
    <div className="p-2">
      <div className="d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: "16px" }}>
        <div style={{ width: "10px", height: "10px", background: "#0d6efd", borderRadius: "2px" }}></div>
        <strong style={{ fontSize: "18px" }}>Opportunities</strong>
        <span>|</span>
        <div className="d-flex align-items-center gap-1">
          <div style={{ width: "15px", height: "15px", background: "red", borderRadius: "3px" }}></div>
          <span>Lead</span>
        </div>
        <span>|</span>
        <div className="d-flex align-items-center gap-1">
          <div style={{ width: "15px", height: "15px", background: "limegreen", borderRadius: "3px" }}></div>
          <span>Customer</span>
        </div>
        <i className="bi bi-eye-slash-fill ms-2"></i>
      </div>

      <div className="text-muted mt-1" style={{ fontSize: "15px" }}>
        You have total 54 Opportunities
      </div>
    </div>
  );
};

export default OpportunitiesHeader;