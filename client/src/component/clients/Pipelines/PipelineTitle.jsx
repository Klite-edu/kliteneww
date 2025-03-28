import React from "react";

const PipelineTitle = () => {
    return (
        <div className="p-2">
            <div className="d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: "20px" }}>
                <div style={{ width: "40px", height: "10px", background: "#0d6efd", borderRadius: "10px" }}></div>
                <strong style={{ fontSize: "18px" }}>Pipelines</strong>
            </div>

            <div className="text-muted mt-1" style={{ fontSize: "15px", marginLeft: '50px'}}>
                You have total 54 Pipelines
            </div>
        </div>
    );
};

export default PipelineTitle;