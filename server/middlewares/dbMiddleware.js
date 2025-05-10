const jwt = require("jsonwebtoken");
const {
  getDelegationModel,
} = require("../models/clients/TaskDelegation/taskdelegation");
const { getTriggerModel } = require("../models/clients/triggers/Trigger-model");
const {
  getPipelineModel,
} = require("../models/clients/pipeline/pipeline-model");
const { getTaskModel } = require("../models/clients/checklist/task");
const { getEmployeeModel } = require("../models/clients/contactdata");
const {
  getFormBuilderModel,
} = require("../models/clients/formBuilder/formBuilder-model");
const { getSubmissionModel } = require("../models/clients/form/form-model");
const { getImageModel } = require("../models/clients/LogoImage/Logo-model");
const {
  getChecklistManifestModel,
} = require("../models/clients/checklist/MISmanifest-model");
const {
  getDelegationManifestModel,
} = require("../models/clients/TaskDelegation/delagationmis-model");
const {
  getMetaClientModel,
} = require("../models/clients/MetaBusiness/MetaClient-model");
const { getChatModel } = require("../models/clients/chat/chat-model");
const { getUserChatModel } = require("../models/clients/chat/userchat-model");
const { getTicketModel } = require("../models/clients/chat/ticket-model");
const {
  getContactVariableModel,
} = require("../models/clients/Variables/variable-model");
const {
  getTicketRaiseModel,
} = require("../models/clients/TicketRaise/TicketRaise-model");
const {
  getMicrosoftSessionModel,
} = require("../models/clients/Microsoft/Session-model");
const {
  getMicrosoftUploadModel,
} = require("../models/clients/Microsoft/Upload-model");
const {
  getTenantWorkConfigModel,
} = require("../models/clients/workingConfig/working-model");
const { getClientModel } = require("../models/Admin/client-modal");

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
  MicrosoftSession: getMicrosoftSessionModel,
  MicrosoftUpload: getMicrosoftUploadModel,
  WorkingDays: getTenantWorkConfigModel,
  Client: getClientModel,
};

// Middleware to dynamically set client DB models
const dbMiddleware = async (req, res, next) => {
  console.log("\n=== Starting dbMiddleware execution ===");
  console.log(`Request URL: ${req.method} ${req.originalUrl}`);

  try {
    // Get token from headers
    console.log("Checking Authorization header...");
    const authHeader = req.header("Authorization");
    console.log("authHeader", authHeader);
    if (!authHeader) {
      console.error("🚫 Authorization header missing");
      return res
        .status(401)
        .json({ message: "Access Denied. No token provided." });
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.error(
        "🚫 Invalid Authorization header format. Expected 'Bearer <token>'"
      );
      return res.status(401).json({ message: "Invalid token format" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token extracted from header", token);

    if (!token) {
      console.error("🚫 Token is empty after extraction");
      return res.status(401).json({ message: "Access Denied" });
    }

    // Verify and decode token
    console.log("Verifying JWT token...");
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token successfully verified");
      console.log("Decoded token payload:", decoded);

      if (!decoded) {
        console.error("🚫 Token verification returned empty payload");
        return res.status(401).json({ message: "Invalid token" });
      }

      if (!decoded.companyName) {
        console.error("🚫 Company name missing in token payload");
        return res
          .status(401)
          .json({ message: "Company information missing in token" });
      }

      // Store company name in request object
      req.companyName = decoded.companyName;
      console.log(`Company name set in request: ${req.companyName}`);
    } catch (verifyError) {
      console.error("❌ Token verification failed:", verifyError.message);
      console.error("Error details:", {
        name: verifyError.name,
        expiredAt: verifyError.expiredAt,
        stack: verifyError.stack,
      });
      return res.status(401).json({
        message: "Token verification failed",
        error: verifyError.message,
      });
    }

    for (const [key, modelLoader] of Object.entries(modelLoaders)) {
      try {
        const startTime = Date.now();
        req[key] = await modelLoader(req.companyName);
        const loadTime = Date.now() - startTime;
      } catch (modelError) {
        console.error(`❌ Failed to load model ${key}:`, modelError.message);
        console.error("Error details:", {
          stack: modelError.stack,
          company: req.companyName,
        });
        return res.status(500).json({
          message: `Error loading model ${key}`,
          error: modelError.message,
        });
      }
    }
    console.log("Proceeding to next middleware...");
    next();
  } catch (error) {
    console.error("\n❌ Unhandled error in dbMiddleware:", error.message);
    console.error("Full error:", {
      name: error.name,
      stack: error.stack,
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
      },
    });
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  } finally {
    console.log("=== dbMiddleware execution completed ===");
  }
};

module.exports = dbMiddleware;
