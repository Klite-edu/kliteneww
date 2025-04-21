const { Client, RemoteAuth } = require("whatsapp-web.js");
const { MongoStore } = require("wwebjs-mongo");
const Mongoose = require("mongoose");
const EventEmitter = require("events");
const jwt = require("jsonwebtoken");
const puppeteer = require("puppeteer");

// Global map to maintain mongoose connections
const mongooseConnections = new Map();

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    console.log("[WhatsAppService] Initializing WhatsAppService...");
    this.clients = new Map(); // companyName => Client instance
    this.connectManuallyTriggered = new Map();
    this.JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
    this.mongoURI = process.env.MONGO_URI;

    console.log("[WhatsAppService] Setting up session health checker...");
    this.sessionCheckInterval = setInterval(() => {
      console.log("[WhatsAppService] Running scheduled session health check");
      this.checkSessions();
    }, 3600000); // Check every hour

    // Cleanup on process exit
    process.on("SIGTERM", () => {
      console.log("[WhatsAppService] SIGTERM received, initiating cleanup...");
      this.cleanup();
    });
    process.on("SIGINT", () => {
      console.log("[WhatsAppService] SIGINT received, initiating cleanup...");
      this.cleanup();
    });

    console.log("[WhatsAppService] Initialization complete");
  }

  async checkSessions() {
    console.log("[SessionCheck] 🔍 Running session health check...");
    console.log(`[SessionCheck] Current clients: ${this.clients.size}`);

    for (const [companyName, client] of this.clients) {
      console.log(`[SessionCheck] Checking ${companyName}...`);
      try {
        if (!client.info?.wid) {
          console.log(
            `[SessionCheck] ⚠️ Session check: ${companyName} not connected, reinitializing`
          );
          await this.initializeClient(companyName);
        } else {
          console.log(
            `[SessionCheck] ✅ ${companyName} is connected and healthy`
          );
        }
      } catch (err) {
        console.error(
          `[SessionCheck] ❌ Check failed for ${companyName}:`,
          err
        );
      }
    }
    console.log("[SessionCheck] Health check completed");
  }

  async cleanup() {
    console.log("[Cleanup] 🧹 Cleaning up WhatsAppService...");
    clearInterval(this.sessionCheckInterval);
    console.log("[Cleanup] Stopped session health checker");

    // Log current state before cleanup
    console.log(`[Cleanup] Current clients: ${this.clients.size}`);
    console.log(
      `[Cleanup] Current DB connections: ${mongooseConnections.size}`
    );

    // Disconnect all clients
    for (const [companyName] of this.clients) {
      console.log(`[Cleanup] Disconnecting client for ${companyName}...`);
      await this.disconnect(companyName);
    }

    // Close all mongoose connections
    for (const [companyName, connection] of mongooseConnections) {
      try {
        console.log(
          `[Cleanup] Closing MongoDB connection for ${companyName}...`
        );
        await connection.disconnect();
        console.log(
          `[Cleanup] ✅ Closed MongoDB connection for ${companyName}`
        );
      } catch (err) {
        console.error(
          `[Cleanup] ❌ Error closing MongoDB connection for ${companyName}:`,
          err
        );
      }
    }

    mongooseConnections.clear();
    console.log("[Cleanup] 🎉 Cleanup completed successfully");
  }

  async getMongoStore(companyName) {
    console.log(`[MongoStore] Requested store for ${companyName}`);

    if (mongooseConnections.has(companyName)) {
      console.log(`[MongoStore] Existing connection found for ${companyName}`);
      const existingConnection = mongooseConnections.get(companyName);

      if (existingConnection.readyState === 1) {
        console.log(
          `[MongoStore] ✅ Reusing active connection for ${companyName}`
        );
        return new MongoStore({ mongoose: existingConnection });
      }

      console.log(
        `[MongoStore] Existing connection not ready (state: ${existingConnection.readyState}), cleaning up...`
      );
      console.log(
        `[MongoStore] Existing connection not ready (state: ${existingConnection.readyState}), cleaning up...`
      );
      await existingConnection.disconnect().catch(() => {});
      mongooseConnections.delete(companyName);
    }
    console.log(`[MongoStore] Creating new connection for ${companyName}...`);
    const customMongoose = new Mongoose.Mongoose();
    try {
      console.log(`[MongoStore] Connecting to MongoDB for ${companyName}...`);
      await customMongoose.connect(this.mongoURI, {
        dbName: `whatsapp_${companyName}`,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        minPoolSize: 2,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
      });

      if (customMongoose.connection.readyState !== 1) {
        throw new Error("MongoDB not connected yet");
      }

      mongooseConnections.set(companyName, customMongoose);
      console.log(
        `[MongoStore] ✅ Successfully connected MongoDB for ${companyName}`
      );
      return new MongoStore({ mongoose: customMongoose });
    } catch (err) {
      console.error(
        `[MongoStore] ❌ Connection failed for ${companyName}:`,
        err
      );
      throw err;
    }
  }

  getCompanyNameFromRequest(req) {
    console.log("[Auth] Extracting company name from request");
    try {
      const token =
        req.cookies?.token || req.headers?.authorization?.split(" ")[1];

      if (!token) {
        console.log("[Auth] No token found in request");
        return null;
      }

      console.log("[Auth] Token found, verifying...");
      const decoded = jwt.verify(token, this.JWT_SECRET);
      const companyName = decoded.companyName || null;

      console.log(`[Auth] Token verified, companyName: ${companyName}`);
      return companyName;
    } catch (err) {
      console.error("[Auth] ❌ Token verification failed:", err.message);
      return null;
    }
  }

  async initializeClient(companyName) {
    console.log(`[ClientInit] Initializing client for ${companyName}...`);
    if (this.clients.has(companyName)) {
      const existingClient = this.clients.get(companyName);
      if (!existingClient.info?.wid) {
        console.log(
          `[ClientInit] ⚠️ Old client exists but not connected. Cleaning it...`
        );
        try {
          if (existingClient?.destroy) await existingClient.destroy();
        } catch (destroyErr) {
          console.warn(`[ClientInit] ⚠️ Destroy error:`, destroyErr.message);
        }
        this.clients.delete(companyName);
      } else {
        console.log(
          `[ClientInit] ✅ Already connected. Skipping initialization.`
        );
        return existingClient;
      }
    }

    console.log(`[ClientInit] Setting up store for ${companyName}...`);
    const store = await this.getMongoStore(companyName);
    const isProduction = process.env.NODE_ENV === "production";
    console.log(
      `[ClientInit] Environment: ${isProduction ? "Production" : "Development"}`
    );

    console.log(
      `[ClientInit] Creating new client instance for ${companyName}...`
    );
    const client = new Client({
      authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 300000, // 5 minutes
        clientId: companyName,
        dataPath: `./whatsapp_sessions/${companyName}`,
      }),
      puppeteer: {
        executablePath: isProduction
          ? process.env.CHROME_BIN || "/usr/bin/google-chrome-stable"
          : puppeteer.executablePath(),
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
          "--disable-extensions",
          "--disable-infobars",
          "--remote-debugging-port=9222",
          "--remote-debugging-address=0.0.0.0",
        ],
      },
      takeoverOnConflict: true,
      takeoverTimeoutMs: 5000,
    });

    // Enhanced event handlers with logging
    client.on("qr", (qr) => {
      console.log(`[ClientEvent] 📲 QR generated for ${companyName}`);
      console.log("[ClientEvent] QR VALUE:", qr);

      const isManuallyTriggered =
        this.connectManuallyTriggered.get(companyName);

      if (isManuallyTriggered) {
        setTimeout(() => {
          this.emit("qr", { companyName, qr });
          console.log(`[ClientEvent] ✅ Emitted QR event for ${companyName}`);

          // 🧹 Clear the manual flag to avoid repeated emission
          this.connectManuallyTriggered.set(companyName, false);
        }, 1000);
      } else {
        console.log(
          `[ClientEvent] ⚠️ QR NOT emitted — user did not click Connect yet for ${companyName}`
        );
      }
    });

    client.on("ready", () => {
      const phoneNumber = client.info?.wid?.user;
      console.log(
        `[ClientEvent] ✅ Client ready for ${companyName}: ${phoneNumber}`
      );
      this.emit("ready", { companyName, phoneNumber });
    });

    client.on("authenticated", () => {
      console.log(`[ClientEvent] 🔐 Authenticated for ${companyName}`);
      this.emit("authenticated", { companyName });
    });

    client.on("auth_failure", (msg) => {
      console.warn(`[ClientEvent] ❌ Auth failed for ${companyName}:`, msg);
      this.emit("auth_failure", { companyName, message: msg });
    });

    client.on("disconnected", async (reason) => {
      console.warn(`[ClientEvent] 🔌 Disconnected ${companyName}: ${reason}`);
      this.emit("disconnected", { companyName, reason });

      try {
        console.log(`[ClientEvent] ♻️ Attempting to reconnect ${companyName}`);
        await this.initializeClient(companyName);
      } catch (err) {
        console.error(
          `[ClientEvent] ❌ Reconnection failed for ${companyName}:`,
          err
        );
      }
    });

    client.on("loading_screen", (percent, message) => {
      console.log(
        `[ClientEvent] 📶 [${companyName}] Loading: ${percent}% - ${message}`
      );
    });

    client.on("change_state", (state) => {
      console.log(`[ClientEvent] 🔄 [${companyName}] State changed: ${state}`);
    });

    client.on("message", (msg) => {
      console.log(
        `[ClientEvent] 📩 New message for ${companyName} from ${msg.from}: ${msg.body}`
      );
    });

    try {
      console.log(`[ClientInit] Initializing client for ${companyName}...`);
      await client.initialize();
      this.clients.set(companyName, client);
      console.log(
        `[ClientInit] ✅ Successfully initialized client for ${companyName}`
      );
      return client;
    } catch (err) {
      console.error(
        `[ClientInit] ❌ Initialization failed for ${companyName}:`,
        err
      );

      try {
        console.log(
          `[ClientInit] Attempting to destroy failed client for ${companyName}`
        );
        if (client?.destroy) {
          try {
            await client.destroy();
          } catch (destroyErr) {
            console.error(
              `[ClientInit] ❌ Destroy failed:`,
              destroyErr.message
            );
          }
        }
      } catch (cleanupErr) {
        console.error(
          `[ClientInit] ❌ Cleanup failed for ${companyName}:`,
          cleanupErr
        );
      }

      throw err;
    }
  }

  async getStatus(companyName) {
    console.log(`[Status] Requested status for ${companyName}`);

    if (!this.clients.has(companyName)) {
      console.log(`[Status] No client found for ${companyName}`);
      return {
        connected: false,
        phoneNumber: null,
        state: "DISCONNECTED",
        companyName,
      };
    }

    const client = this.clients.get(companyName);
    const status = {
      connected: !!client.info?.wid,
      phoneNumber: client.info?.wid?.user || null,
      state: client.state,
      companyName,
      lastSeen: client.info?.wid?.server?.lastSeen,
    };

    console.log(`[Status] Returning status for ${companyName}:`, status);
    return status;
  }

  async sendMessage(companyName, phone, message) {
    console.log(
      `[SendMessage] Request to send message for ${companyName} to ${phone}`
    );

    const client = await this.initializeClient(companyName);
    console.log(`[SendMessage] Client initialized for ${companyName}`);

    if (!client?.info?.wid) {
      console.log(`[SendMessage] ❌ Client not connected for ${companyName}`);
      throw new Error("Client not connected or authenticated yet");
    }

    // Validate phone number format
    if (!phone || !/^\d+$/.test(phone)) {
      console.log(`[SendMessage] ❌ Invalid phone number format: ${phone}`);
      throw new Error("Invalid phone number format - only digits allowed");
    }

    const chatId = `${phone}@c.us`;
    console.log(`[SendMessage] Sending message to ${chatId}`);

    try {
      const result = await client.sendMessage(chatId, message);
      console.log(`[SendMessage] ✅ Message sent to ${chatId}`);
      return result;
    } catch (err) {
      console.error(
        `[SendMessage] ❌ Failed to send message to ${chatId}:`,
        err
      );
      throw err;
    }
  }

  async disconnect(companyName) {
    console.log(`[Disconnect] Requested disconnect for ${companyName}`);

    if (!this.clients.has(companyName)) {
      console.warn(`[Disconnect] ⚠️ No client found for ${companyName}`);
      // 🟢 Return true here so frontend sees success on reload
      return true;
    }

    const client = this.clients.get(companyName);
    console.log(`[Disconnect] Client found, info:`, client?.info);
    let success = true;

    try {
      console.log(`[Disconnect] Attempting logout for ${companyName}...`);
      if (client?.logout) await client.logout();
      console.log(`[Disconnect] ✅ Logout successful for ${companyName}`);
    } catch (err) {
      console.warn(
        `[Disconnect] ⚠️ Logout error for ${companyName}:`,
        err.message
      );
      success = false;
    }

    try {
      console.log(`[Disconnect] Attempting destroy for ${companyName}...`);
      if (client?.destroy) await client.destroy();
      console.log(`[Disconnect] ✅ Destroy successful for ${companyName}`);
    } catch (err) {
      console.warn(
        `[Disconnect] ⚠️ Destroy error for ${companyName}:`,
        err.message
      );
      success = false;
    }

    console.log(`[Disconnect] Removing client from map for ${companyName}`);
    this.clients.delete(companyName);

    // Clean up session data
    try {
      console.log(`[Disconnect] Cleaning session data for ${companyName}...`);
      const store = await this.getMongoStore(companyName);
      try {
        await store.remove({ session: companyName });
      } catch (err) {
        console.warn(`[Disconnect] ⚠️ Failed to remove session:`, err.message);
      }

      console.log(`[Disconnect] 🧹 Session removed from DB for ${companyName}`);
    } catch (err) {
      console.error(
        `[Disconnect] ❌ Failed to remove session for ${companyName}:`,
        err.message
      );
      success = false;
    }

    // Clean up mongoose connection
    if (mongooseConnections.has(companyName)) {
      try {
        console.log(
          `[Disconnect] Closing MongoDB connection for ${companyName}...`
        );
        await mongooseConnections.get(companyName).disconnect();
        mongooseConnections.delete(companyName);
        console.log(
          `[Disconnect] ✅ MongoDB connection closed for ${companyName}`
        );
      } catch (err) {
        console.error(
          `[Disconnect] ❌ Error closing MongoDB connection for ${companyName}:`,
          err
        );
        success = false;
      }
    }

    console.log(
      `[Disconnect] Disconnect ${
        success ? "successful" : "with errors"
      } for ${companyName}`
    );
    return success;
  }

  async getLatestQrCode(companyName) {
    console.log(`[QR] Requested latest QR code for ${companyName}`);

    if (!this.clients.has(companyName)) {
      console.log(`[QR] No client found for ${companyName}`);
      return null;
    }

    const client = this.clients.get(companyName);
    const qr = client.qrCode || null;
    console.log(
      `[QR] Returning ${qr ? "found" : "no"} QR code for ${companyName}`
    );
    return qr;
  }
}

// Singleton instance
console.log("[App] Creating WhatsAppService singleton instance...");
const whatsappService = new WhatsAppService();

// Export both the instance and helper function
module.exports = whatsappService;
module.exports.getCompanyNameFromRequest =
  whatsappService.getCompanyNameFromRequest.bind(whatsappService);

console.log("[App] WhatsAppService module exported");
