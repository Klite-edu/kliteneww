const express = require("express");
const router = express.Router();
const whatsappService = require("./Whatsappservice");
const { getCompanyNameFromRequest } = require("./Whatsappservice");

// 🔍 Enhanced Global Logging Middleware
router.use((req, res, next) => {
  const startTime = process.hrtime();
  const requestId = Math.random().toString(36).substring(2, 8);

  console.log("\n================================================");
  console.log(`🌐 [${requestId}] ${req.method} ${req.originalUrl}`);
  console.log(`⏱️  [${requestId}] Time: ${new Date().toISOString()}`);
  console.log(`👤 [${requestId}] IP: ${req.ip}`);

  // Log only essential headers to avoid clutter
  console.log(`📋 [${requestId}] Headers:`, {
    "user-agent": req.headers["user-agent"],
    "content-type": req.headers["content-type"],
    authorization: req.headers["authorization"] ? "*****" : "none",
  });

  // Log cookies if present
  if (Object.keys(req.cookies).length > 0) {
    console.log(`🍪 [${requestId}] Cookies:`, req.cookies);
  }

  // Log body if present (excluding large file uploads)
  if (
    req.body &&
    Object.keys(req.body).length > 0 &&
    !req.is("multipart/form-data")
  ) {
    console.log(`📦 [${requestId}] Body:`, req.body);
  }

  // Store request details for response logging
  req._requestStartTime = startTime;
  req._requestId = requestId;

  // Log response when it's sent
  res.on("finish", () => {
    const duration = process.hrtime(startTime);
    const durationMs = (duration[0] * 1000 + duration[1] / 1e6).toFixed(2);

    console.log(`\n🏁 [${requestId}] Response Sent:`);
    console.log(`⏳ [${requestId}] Duration: ${durationMs}ms`);
    console.log(`🛡️  [${requestId}] Status: ${res.statusCode}`);
    console.log(`📝 [${requestId}] Headers:`, res.getHeaders());
    console.log("================================================\n");
  });

  next();
});

// ✅ Enhanced Authentication Middleware
const verifycompanyName = (req, res, next) => {
  console.log(`[${req._requestId}] 🔐 Starting authentication check`);

  try {
    const companyName = getCompanyNameFromRequest(req);

    if (!companyName) {
      console.warn(
        `[${req._requestId}] ❌ Authentication failed - no valid companyName`
      );
      return res.status(401).json({
        success: false,
        message: "Authentication required: Valid companyName token missing",
        timestamp: new Date().toISOString(),
      });
    }

    console.log(
      `[${req._requestId}] ✅ Authenticated as company: ${companyName}`
    );
    req.companyName = companyName;
    next();
  } catch (error) {
    console.error(`[${req._requestId}] 🚨 Authentication error:`, error);
    res.status(500).json({
      success: false,
      message: "Authentication processing failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

router.use(verifycompanyName);

// ✅ Enhanced STATUS Endpoint
router.get("/status", async (req, res) => {
  const { companyName, _requestId } = req;

  try {
    console.log(`[${_requestId}] 📡 Status check requested for ${companyName}`);
    const startTime = process.hrtime();

    const status = await whatsappService.getStatus(companyName);

    const duration = process.hrtime(startTime);
    console.log(
      `[${_requestId}] ✅ Status retrieved in ${(
        duration[0] * 1000 +
        duration[1] / 1e6
      ).toFixed(2)}ms`
    );

    res.json({
      ...status,
      requestId: _requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `[${_requestId}] ❌ Status check failed for ${companyName}:`,
      error
    );
    res.status(500).json({
      success: false,
      connected: false,
      phoneNumber: null,
      state: "ERROR",
      companyName,
      error: error.message,
      requestId: _requestId,
      timestamp: new Date().toISOString(),
    });
  }
});

// ✅ Enhanced SEND MESSAGE Endpoint
router.post("/send", async (req, res) => {
  const { companyName, _requestId, body } = req;

  try {
    const { phone, message } = body;
    console.log(`[${_requestId}] 📤 Send message request from ${companyName}`, {
      phone: phone
        ? `${phone.substring(0, 3)}...${phone.substring(-3)}`
        : "none",
      messageLength: message?.length || 0,
    });

    if (!phone || !/^\d+$/.test(phone)) {
      console.warn(`[${_requestId}] ⚠️ Invalid phone number format: ${phone}`);
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format - only digits allowed",
        received: phone,
        requestId: _requestId,
        timestamp: new Date().toISOString(),
      });
    }

    const startTime = process.hrtime();
    const result = await whatsappService.sendMessage(
      companyName,
      phone,
      message
    );
    const durationMs =
      process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1e6;

    console.log(`[${_requestId}] ✅ Message sent successfully`, {
      to: phone,
      msgId: result.id.id,
      duration: `${durationMs.toFixed(2)}ms`,
    });

    res.json({
      success: true,
      messageId: result.id.id,
      timestamp: result.timestamp,
      timeTaken: `${durationMs.toFixed(2)}ms`,
      requestId: _requestId,
    });
  } catch (error) {
    console.error(`[${_requestId}] ❌ Message send failed:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to send WhatsApp message",
      companyName,
      error: error.message,
      requestId: _requestId,
      timestamp: new Date().toISOString(),
    });
  }
});

// ✅ Enhanced DISCONNECT Endpoint
router.post("/disconnect", async (req, res) => {
  const { companyName, _requestId } = req;

  try {
    console.log(`[${_requestId}] 🔌 Disconnect requested for ${companyName}`);
    const startTime = process.hrtime();

    const result = await whatsappService.disconnect(companyName);
    const durationMs =
      process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1e6;

    console.log(
      `[${_requestId}] ${
        result ? "✅" : "⚠️"
      } Disconnect completed in ${durationMs.toFixed(2)}ms`
    );

    res.json({
      success: result,
      message: result
        ? "Client disconnected successfully"
        : "No active client connection found",
      duration: `${durationMs.toFixed(2)}ms`,
      requestId: _requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[${_requestId}] ❌ Disconnect failed:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to disconnect client",
      error: error.message,
      requestId: _requestId,
      timestamp: new Date().toISOString(),
    });
  }
});

router.post("/connect", async (req, res) => {
  const { companyName, _requestId } = req;

  try {
    console.log(
      `[${_requestId}] ⚙️ Connection initialization requested for ${companyName}`
    );
    const startTime = process.hrtime();
    whatsappService.connectManuallyTriggered.set(companyName, true);

    // 🔁 Check if client exists but not connected
    if (whatsappService.clients.has(companyName)) {
      const existing = whatsappService.clients.get(companyName);
      const isConnected = existing.info?.wid;
      if (!isConnected) {
        console.log(
          `[Connect] 🔁 Client exists but not connected — reinitializing...`
        );
        await whatsappService.disconnect(companyName); // Clean old
      } else {
        console.log(`[Connect] ✅ Already connected, skipping initialization`);
        return res.json({
          success: true,
          message: "Client already connected",
          state: existing.state || "CONNECTED",
        });
      }
    }

    const client = await whatsappService.initializeClient(companyName);
    const durationMs =
      process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1e6;

    console.log(
      `[${_requestId}] ✅ Client initialization completed in ${durationMs.toFixed(
        2
      )}ms`
    );

    res.json({
      success: true,
      message: "Client initialization started",
      state: client.state || "INITIALIZING",
      duration: `${durationMs.toFixed(2)}ms`,
      requestId: _requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[${_requestId}] ❌ Initialization failed:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize WhatsApp client",
      error: error.message,
      requestId: _requestId,
      timestamp: new Date().toISOString(),
    });
  }
});

// ✅ Enhanced QR CODE Endpoint
router.get("/qr", async (req, res) => {
  const { companyName, _requestId } = req;

  try {
    console.log(`[${_requestId}] 🔍 QR code requested for ${companyName}`);
    const startTime = process.hrtime();

    const qrCode = whatsappService.getLatestQrCode?.(companyName);
    const durationMs =
      process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1e6;

    if (qrCode) {
      console.log(
        `[${_requestId}] ✅ QR code retrieved from cache in ${durationMs.toFixed(
          2
        )}ms`
      );
      return res.json({
        success: true,
        qrCode,
        source: "cache",
        duration: `${durationMs.toFixed(2)}ms`,
        requestId: _requestId,
        timestamp: new Date().toISOString(),
      });
    }

    const status = await whatsappService.getStatus(companyName);
    console.log(`[${_requestId}] 🔄 Client status: ${status.state}`);

    if (status.connected) {
      console.log(`[${_requestId}] ℹ️ Client already connected, no QR needed`);
      return res.status(400).json({
        success: false,
        message: "Client already connected, no QR required",
        state: status.state,
        requestId: _requestId,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[${_requestId}] ⌛ QR not ready yet`);
    res.status(202).json({
      success: true,
      message: "QR not ready yet",
      hint: "Try again in a few seconds",
      state: status.state,
      requestId: _requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[${_requestId}] ❌ QR code retrieval failed:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to get QR code",
      error: error.message,
      requestId: _requestId,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
