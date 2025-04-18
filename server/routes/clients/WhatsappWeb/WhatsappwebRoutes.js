// const express = require("express");
// const router = express.Router();
// const whatsappService = require("./Whatsappservice");

// router.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
//     body: req.body,
//     query: req.query,
//     params: req.params
//   });
//   next();
// });

// router.get("/status", (req, res) => {
//   try {
//     console.log('Checking WhatsApp connection status...');

//     const status = whatsappService.getStatus();
//     status.timestamp = new Date().toISOString();

//     console.log('WhatsApp Status:', status);

//     res.json(status);
//   } catch (error) {
//     console.error('Error checking WhatsApp status:', error);
//     res.status(500).json({
//       message: 'Error checking WhatsApp status',
//       error: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// });

// router.post("/send", async (req, res) => {
//   try {
//     console.log('Incoming WhatsApp send request:', req.body);

//     const { phone, message } = req.body;

//     if (!phone || !/^\d+$/.test(phone)) {
//       const errorMsg = 'Invalid phone number format - must contain only digits';
//       console.error(errorMsg, { received: phone });
//       return res.status(400).json({
//         message: errorMsg,
//         received: phone,
//         expectedFormat: 'Country code followed by number (e.g., 911234567890)'
//       });
//     }

//     const chatId = `${phone}@c.us`;
//     console.log(`Attempting to send message to ${chatId}`, { message });

//     const startTime = Date.now();
//     const result = await whatsappService.sendMessage(phone, message);
//     const duration = Date.now() - startTime;

//     console.log('Message sent successfully', {
//       chatId,
//       messageId: result.id.id,
//       timestamp: result.timestamp,
//       duration: `${duration}ms`
//     });

//     res.status(200).json({
//       message: 'WhatsApp message sent successfully',
//       messageId: result.id.id,
//       timestamp: result.timestamp
//     });
//   } catch (error) {
//     console.error('WhatsApp send error:', {
//       error: error.message,
//       stack: error.stack,
//       requestBody: req.body,
//       timestamp: new Date().toISOString()
//     });

//     res.status(500).json({
//       message: 'Error sending WhatsApp message',
//       error: error.message,
//       errorType: error.constructor.name,
//       possibleSolutions: [
//         'Ensure WhatsApp client is connected',
//         'Verify phone number format (country code + number)',
//         'Check message content for special characters'
//       ]
//     });
//   }
// });

// // Add this new route for disconnecting
// router.post("/disconnect", async (req, res) => {
//     try {
//       console.log('Disconnecting WhatsApp client...');
//       const result = await whatsappService.disconnect();

//       res.json({
//         success: result,
//         message: result ? 'WhatsApp disconnected successfully' : 'No active connection'
//       });
//     } catch (error) {
//       console.error('Disconnection error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Error disconnecting WhatsApp',
//         error: error.message
//       });
//     }
//   });

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const whatsappService = require("./Whatsappservice");
// const jwt = require("jsonwebtoken");

// // JWT secret should be in environment variables in production
// const JWT_SECRET = process.env.JWT_SECRET;

// // Logging middleware
// router.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
//     body: req.body,
//     query: req.query,
//     params: req.params,
//   });
//   next();
// });

// /**
//  * Extract companyName name from JWT token in cookies
//  */
// const getcompanyNameFromToken = (req) => {
//   try {
//     const token = req.cookies.token;
//     if (!token) {
//       console.warn("No token found in cookies");
//       return null;
//     }

//     const decoded = jwt.verify(token, JWT_SECRET);
//     const companyName = decoded.companyName;

//     if (!companyName) {
//       console.warn("No companyName found in token payload");
//       return null;
//     }

//     console.log(`companyName extracted from token: ${companyName}`);
//     return companyName;
//   } catch (error) {
//     console.error("Error extracting companyName from token:", error.message);
//     return null;
//   }
// };

// /**
//  * companyName verification middleware
//  */
// const verifycompanyName = (req, res, next) => {
//   const companyName = getcompanyNameFromToken(req);

//   if (!companyName) {
//     return res.status(401).json({
//       message: "Authentication required: Valid companyName token missing",
//       status: "error",
//     });
//   }

//   // Add companyName to request object for use in route handlers
//   req.companyName = companyName;
//   next();
// };

// // Apply companyName verification to all routes
// router.use(verifycompanyName);

// // Add this more robust status endpoint
// router.get("/status", async (req, res) => {
//   try {
//     const companyName = req.companyName;
//     if (!companyName) {
//       return res.status(400).json({
//         connected: false,
//         message: "companyName not identified",
//         state: "UNKNOWN",
//       });
//     }

//     const status = await whatsappService.getStatus(companyName);

//     // If no client exists at all
//     if (!status) {
//       return res.json({
//         connected: false,
//         phoneNumber: null,
//         state: "DISCONNECTED",
//         companyName,
//         message: "No active WhatsApp session",
//       });
//     }

//     res.json(status);
//   } catch (error) {
//     console.error("Status check error:", error);
//     res.status(500).json({
//       connected: false,
//       phoneNumber: null,
//       state: "ERROR",
//       error: error.message,
//       stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//     });
//   }
// });

// // Send WhatsApp message
// router.post("/send", async (req, res) => {
//   try {
//     console.log(
//       `Incoming WhatsApp send request for companyName ${req.companyName}:`,
//       req.body
//     );

//     const { phone, message } = req.body;

//     if (!phone || !/^\d+$/.test(phone)) {
//       const errorMsg = "Invalid phone number format - must contain only digits";
//       console.error(errorMsg, { received: phone, companyName: req.companyName });
//       return res.status(400).json({
//         message: errorMsg,
//         received: phone,
//         companyName: req.companyName,
//         expectedFormat: "Country code followed by number (e.g., 911234567890)",
//       });
//     }

//     const chatId = `${phone}@c.us`;
//     console.log(
//       `Attempting to send message to ${chatId} for companyName ${req.companyName}`,
//       { message }
//     );

//     const startTime = Date.now();
//     const result = await whatsappService.sendMessage(
//       req.companyName,
//       phone,
//       message
//     );
//     const duration = Date.now() - startTime;

//     console.log(`Message sent successfully for companyName ${req.companyName}`, {
//       chatId,
//       messageId: result.id.id,
//       timestamp: result.timestamp,
//       duration: `${duration}ms`,
//     });

//     res.status(200).json({
//       message: "WhatsApp message sent successfully",
//       messageId: result.id.id,
//       timestamp: result.timestamp,
//       companyName: req.companyName,
//     });
//   } catch (error) {
//     console.error(`WhatsApp send error for companyName ${req.companyName}:`, {
//       error: error.message,
//       stack: error.stack,
//       requestBody: req.body,
//       timestamp: new Date().toISOString(),
//     });

//     res.status(500).json({
//       message: "Error sending WhatsApp message",
//       error: error.message,
//       companyName: req.companyName,
//       errorType: error.constructor.name,
//       possibleSolutions: [
//         "Ensure WhatsApp client is connected",
//         "Verify phone number format (country code + number)",
//         "Check message content for special characters",
//       ],
//     });
//   }
// });

// // Disconnect WhatsApp client
// router.post("/disconnect", async (req, res) => {
//   try {
//     console.log(`Disconnecting WhatsApp client for companyName ${req.companyName}...`);
//     const result = await whatsappService.disconnect(req.companyName);

//     res.json({
//       success: result,
//       companyName: req.companyName,
//       message: result
//         ? "WhatsApp disconnected successfully"
//         : "No active connection",
//     });
//   } catch (error) {
//     console.error(`Disconnection error for companyName ${req.companyName}:`, error);
//     res.status(500).json({
//       success: false,
//       companyName: req.companyName,
//       message: "Error disconnecting WhatsApp",
//       error: error.message,
//     });
//   }
// });

// // Connect WhatsApp client (initialize)
// router.post("/connect", async (req, res) => {
//   try {
//     console.log(`Initializing WhatsApp client for companyName ${req.companyName}...`);

//     // This will start the client and potentially emit a QR code
//     const client = await whatsappService.initializeClient(req.companyName);

//     res.json({
//       message: "WhatsApp client initialization started",
//       companyName: req.companyName,
//       status: client.state || "INITIALIZING",
//     });
//   } catch (error) {
//     console.error(
//       `Error initializing WhatsApp client for companyName ${req.companyName}:`,
//       error
//     );
//     res.status(500).json({
//       message: "Error initializing WhatsApp client",
//       companyName: req.companyName,
//       error: error.message,
//     });
//   }
// });

// // Get QR code for authentication
// router.get("/qr", async (req, res) => {
//   try {
//     console.log(`Requesting QR code for companyName ${req.companyName}...`);

//     // Check if there's already a QR code available
//     const qrCode = whatsappService.getLatestQrCode(req.companyName);

//     if (qrCode) {
//       console.log(`Returning existing QR code for companyName ${req.companyName}`);
//       return res.json({
//         qrCode,
//         companyName: req.companyName,
//         timestamp: new Date().toISOString(),
//       });
//     }

//     // If no QR code is available, we might need to initialize or wait
//     console.log(
//       `No QR code available for companyName ${req.companyName}, checking status`
//     );
//     const status = whatsappService.getStatus(req.companyName);

//     if (status.state === "CONNECTED") {
//       return res.status(400).json({
//         message: "WhatsApp is already connected, no QR code needed",
//         companyName: req.companyName,
//         status: status.state,
//       });
//     }

//     // If client is not yet initialized or in another state, inform the client
//     res.status(202).json({
//       message:
//         "WhatsApp client is being initialized, QR code not yet available",
//       companyName: req.companyName,
//       status: status.state || "INITIALIZING",
//       hint: "Try again in a few seconds or check /status endpoint",
//     });
//   } catch (error) {
//     console.error(`Error getting QR code for companyName ${req.companyName}:`, error);
//     res.status(500).json({
//       message: "Error retrieving QR code",
//       companyName: req.companyName,
//       error: error.message,
//     });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const whatsappService = require("./Whatsappservice");
const { getCompanyNameFromRequest } = require("./Whatsappservice");
// 🔍 Global Logging Middleware
router.use((req, res, next) => {
  console.log("====================================");
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  console.log("🕓 Time:", new Date().toISOString());
  console.log("📦 Headers:", req.headers);
  console.log("🍪 Cookies:", req.cookies);
  console.log("📨 Body:", req.body);
  console.log("====================================");
  next();
});

// ✅ Middleware to verify and attach companyName from token
const verifycompanyName = (req, res, next) => {
  const companyName = getCompanyNameFromRequest(req);
  if (!companyName) {
    console.warn("❌ Token missing or invalid. Company name not found.");
    return res.status(401).json({
      message: "Authentication required: Valid companyName token missing",
    });
  }
  req.companyName = companyName;
  next();
};

router.use(verifycompanyName);

// ✅ STATUS
router.get("/status", async (req, res) => {
  try {
    console.log(`📡 /status request by ${req.companyName}`);
    const status = await whatsappService.getStatus(req.companyName);
    res.json(status);
  } catch (error) {
    console.error("❌ Status error:", error);
    res.status(500).json({
      connected: false,
      phoneNumber: null,
      state: "ERROR",
      companyName: req.companyName,
      error: error.message,
    });
  }
});

// ✅ SEND MESSAGE
router.post("/send", async (req, res) => {
  try {
    const { phone, message } = req.body;
    console.log(`📤 Send message from ${req.companyName}`, { phone, message });

    if (!phone || !/^\d+$/.test(phone)) {
      console.warn("⚠️ Invalid phone number format");
      return res.status(400).json({
        message: "Invalid phone number format - only digits allowed",
        received: phone,
      });
    }

    const start = Date.now();
    const result = await whatsappService.sendMessage(
      req.companyName,
      phone,
      message
    );
    const time = Date.now() - start;

    console.log(`✅ Message sent:`, {
      to: phone,
      msgId: result.id.id,
      timestamp: result.timestamp,
      duration: `${time}ms`,
    });

    res.json({
      success: true,
      messageId: result.id.id,
      timestamp: result.timestamp,
      timeTaken: `${time}ms`,
    });
  } catch (error) {
    console.error("❌ Message send error:", error);
    res.status(500).json({
      message: "Failed to send WhatsApp message",
      companyName: req.companyName,
      error: error.message,
    });
  }
});

// ✅ DISCONNECT
router.post("/disconnect", async (req, res) => {
  try {
    console.log(`🔌 Disconnect request for ${req.companyName}`);
    const result = await whatsappService.disconnect(req.companyName);
    console.log(`✅ Disconnect result:`, result);
    res.json({
      success: result,
      message: result ? "Client disconnected" : "No client was connected",
    });
  } catch (error) {
    console.error("❌ Disconnect error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to disconnect client",
      error: error.message,
    });
  }
});

// ✅ INITIALIZE
router.post("/connect", async (req, res) => {
  try {
    console.log(`⚙️ Init requested for ${req.companyName}`);
    const client = whatsappService.initializeClient(req.companyName);
    console.log(`✅ Init triggered for ${req.companyName}`);
    res.json({
      message: "Client initialization started",
      state: client.state || "INITIALIZING",
    });
  } catch (error) {
    console.error("❌ Init error:", error);
    res.status(500).json({
      message: "Failed to initialize WhatsApp client",
      error: error.message,
    });
  }
});

// ✅ QR CODE
router.get("/qr", async (req, res) => {
  try {
    console.log(`🔍 QR request for ${req.companyName}`);
    const qrCode = whatsappService.getLatestQrCode?.(req.companyName);

    if (qrCode) {
      console.log("✅ QR found (cached)");
      return res.json({
        qrCode,
        timestamp: new Date().toISOString(),
      });
    }

    const status = await whatsappService.getStatus(req.companyName);
    console.log(`🔁 Client status for QR: ${status.state}`);

    if (status.connected) {
      return res.status(400).json({
        message: "Client already connected, no QR required",
      });
    }

    res.status(202).json({
      message: "QR not ready yet",
      hint: "Try again in a few seconds",
    });
  } catch (error) {
    console.error("❌ QR error:", error);
    res.status(500).json({
      message: "Failed to get QR code",
      error: error.message,
    });
  }
});

module.exports = router;
