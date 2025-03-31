// import React from "react";
// import './TopActionBar.css';
// const TopActionBar = ({ onFilterChange, pipelineList, selectedPipeline }) => {
//   console.log("pipeline", pipelineList);
//   console.log("selectedPipeline", selectedPipeline);
//   return (
//     <div className="top-action-bar">
//       {/* Left-aligned actions */}
//       <div className="action-group">
//         <div className="pipeline-selector">
//           <label htmlFor="pipeline-select" className="selector-label">
//             <i className="bi bi-diagram-3"></i> Pipeline
//           </label>
//           <select
//             id="pipeline-select"
//             className="form-select"
//             onChange={(e) => onFilterChange(e.target.value)}
//             value={selectedPipeline || (pipelineList[0] || "")}
//           >
//             {pipelineList.map((pipeline) => (
//               <option key={pipeline._id} value={pipeline}>
//                 {pipeline}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>
//       {/* Right-aligned actions */}
//       <div className="action-group">
//         <div className="search-box">
//           <i className="bi bi-search"></i>
//           <input
//             type="text"
//             placeholder="Search opportunities..."
//             className="search-input"
//           />
//         </div>
//         <button className="action-btn refresh-btn">
//           <i className="bi bi-arrow-clockwise"></i>
//         </button>
//         <div className="divider"></div>
//         <button className="action-btn primary-btn">
//           <i className="bi bi-plus-lg"></i> New
//         </button>
//         <button className="action-btn secondary-btn">
//           <i className="bi bi-upload"></i> Import
//         </button>
//       </div>
//     </div>
//   );
// };
// export default TopActionBar;

import React from "react";
import './TopActionBar.css';

const TopActionBar = ({ onFilterChange, pipelineList, selectedPipeline }) => {
  console.log("Pipeline list:", pipelineList);
  console.log("Selected pipeline:", selectedPipeline);

  return (
    <div className="top-action-bar">
      <div className="action-group">
        <div className="pipeline-selector">
          <label htmlFor="pipeline-select" className="selector-label">
            <i className="bi bi-diagram-3"></i> Pipeline
          </label>
          <select
            id="pipeline-select"
            className="form-select"
            onChange={(e) => onFilterChange(e.target.value)}
            value={selectedPipeline ? selectedPipeline.pipelineName : ""}
          >
            {pipelineList.map((pipeline) => (
              <option key={pipeline._id} value={pipeline.pipelineName}>
                {pipeline.pipelineName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TopActionBar;
