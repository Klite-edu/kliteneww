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
const { getImageModel } = require("../models/clients/LogoImage/Logo-model");
const { getChecklistManifestModel } = require("../models/clients/checklist/MISmanifest-model");
const { getDelegationManifestModel } = require("../models/clients/TaskDelegation/delagationmis-model");
const { getMetaClientModel } = require("../models/clients/MetaBusiness/MetaClient-model");
const { getChatModel } = require("../models/clients/chat/chat-model");
const { getUserChatModel } = require("../models/clients/chat/userchat-model");
const { getTicketModel } = require("../models/clients/chat/ticket-model");
const { getContactVariableModel } = require("../models/clients/Variables/variable-model");
const { getTicketRaiseModel } = require("../models/clients/TicketRaise/TicketRaise-model");

// Utility function to dynamically load models
const modelLoaders = {
  delegation: getDelegationModel,
  trigger: getTriggerModel,
  pipeline: getPipelineModel,
  Task: getTaskModel,
  Employee: getEmployeeModel,
  FormBuilder: getFormBuilderModel,
  Submission: getSubmissionModel,
  image: getImageModel,
  ChecklistMIS: getChecklistManifestModel,
  delegationManifest: getDelegationManifestModel,
  MetaClient: getMetaClientModel,
  Chat: getChatModel,
  UserChat: getUserChatModel,
  Ticket: getTicketModel,
  CustomVariables: getContactVariableModel,
  raiseTicket: getTicketRaiseModel,
};

// Middleware to dynamically set client DB models
const dbMiddleware = async (req, res, next) => {
  try {
    // Get token from headers
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("🚫 Access Denied: No token provided.");
      return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      console.error("🚫 Access Denied: Token is empty or not found.");
      return res.status(401).json({ message: "Access Denied" });
    }

    // Verify and decode token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded || !decoded.companyName) {
        console.error("🚫 Invalid token: Company name not found in token.");
        return res.status(401).json({ message: "Invalid token" });
      }

      // Store company name in request object
      req.companyName = decoded.companyName;
    } catch (verifyError) {
      console.error("❌ Token verification failed:", verifyError.message);
      return res.status(401).json({ message: "Token verification failed", error: verifyError.message });
    }

    // Dynamically load all required models and attach to the request object
    for (const [key, modelLoader] of Object.entries(modelLoaders)) {
      try {
        req[key] = await modelLoader(req.companyName);
      } catch (modelError) {
        console.error(`❌ Error loading model ${key} for company ${req.companyName}:`, modelError.message);
        return res.status(500).json({ message: `Error loading model ${key}`, error: modelError.message });
      }
    }
    next();
  } catch (error) {
    console.error("❌ Middleware Error:", error.message);
    return res.status(401).json({ message: "Token verification failed", error: error.message });
  }
};

module.exports = dbMiddleware;
