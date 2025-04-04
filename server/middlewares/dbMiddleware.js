// const jwt = require("jsonwebtoken");
// const { getDelegationModel } = require("../models/clients/TaskDelegation/taskdelegation");
// const { getTriggerModel } = require("../models/clients/triggers/Trigger-model");
// const { getPipelineModel } = require("../models/clients/pipeline/pipeline-model");

// // Utility function to dynamically load models
// const modelLoaders = {
//   delegation: getDelegationModel,
//   trigger: getTriggerModel,
//   pipeline: getPipelineModel,
// };

// // Middleware to dynamically set client DB models
// const dbDBMiddleware = async (req, res, next) => {
//   try {
//     // Get token from headers
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     // Verify and decode token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (!decoded || !decoded.companyName) {
//       return res.status(401).json({ message: "Invalid token" });
//     }

//     // Store company name in request object
//     req.companyName = decoded.companyName;

//     // Dynamically load all required models and attach to the request object
//     for (const [key, modelLoader] of Object.entries(modelLoaders)) {
//       try {
//         req[key] = await modelLoader(decoded.companyName);
//       } catch (error) {
//         console.error(`❌ Error loading model ${key} for company ${decoded.companyName}:`, error.message);
//         return res.status(500).json({ message: `Error loading model ${key}`, error: error.message });
//       }
//     }

//     next();
//   } catch (error) {
//     res.status(401).json({ message: "Token verification failed", error: error.message });
//   }
// };

// module.exports = dbDBMiddleware;
const jwt = require("jsonwebtoken");
const { getDelegationModel } = require("../models/clients/TaskDelegation/taskdelegation");
const { getTriggerModel } = require("../models/clients/triggers/Trigger-model");
const { getPipelineModel } = require("../models/clients/pipeline/pipeline-model");
const { getTaskModel } = require("../models/clients/checklist/task");
const { getEmployeeModel } = require("../models/clients/contactdata");
const { getFormBuilderModel } = require("../models/clients/formBuilder/formBuilder-model");
const { getSubmissionModel } = require("../models/clients/form/form-model");
const { getClientModel } = require("../models/Admin/client-modal");
// const { getPermissionModel } = require("../models/clients/permissions/permission-model");

// Utility function to dynamically load models
const modelLoaders = {
  delegation: getDelegationModel,
  trigger: getTriggerModel,
  pipeline: getPipelineModel,
  Task: getTaskModel,
  Employee: getEmployeeModel,
  FormBuilder: getFormBuilderModel,
  Submission: getSubmissionModel,
  Client: getClientModel,
  // Permission: getPermissionModel,
};

// Middleware to dynamically set client DB models
const dbMiddleware = async (req, res, next) => {
  try {
    console.log("🔄 Starting middleware execution for dynamic DB loading.");

    // Get token from headers
    const authHeader = req.header("Authorization");
    console.log("🔍 Authorization header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("🚫 Access Denied: No token provided.");
      return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 Extracted token:", token);

    if (!token) {
      console.error("🚫 Access Denied: Token is empty or not found.");
      return res.status(401).json({ message: "Access Denied" });
    }

    // Verify and decode token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token successfully verified:", decoded);

      if (!decoded || !decoded.companyName) {
        console.error("🚫 Invalid token: Company name not found in token.");
        return res.status(401).json({ message: "Invalid token" });
      }

      // Store company name in request object
      req.companyName = decoded.companyName;
      console.log("🏢 Company name from token:", req.companyName);
    } catch (verifyError) {
      console.error("❌ Token verification failed:", verifyError.message);
      return res.status(401).json({ message: "Token verification failed", error: verifyError.message });
    }

    // Dynamically load all required models and attach to the request object
    for (const [key, modelLoader] of Object.entries(modelLoaders)) {
      try {
        console.log(`🔧 Loading model: ${key} for company: ${req.companyName}`);
        req[key] = await modelLoader(req.companyName);
        console.log(`✅ Successfully loaded model: ${key}`);
      } catch (modelError) {
        console.error(`❌ Error loading model ${key} for company ${req.companyName}:`, modelError.message);
        return res.status(500).json({ message: `Error loading model ${key}`, error: modelError.message });
      }
    }

    console.log("✅ Middleware execution completed successfully.");
    next();
  } catch (error) {
    console.error("❌ Middleware Error:", error.message);
    return res.status(401).json({ message: "Token verification failed", error: error.message });
  }
};

module.exports = dbMiddleware;
