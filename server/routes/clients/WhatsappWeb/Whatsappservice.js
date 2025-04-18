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
    this.clients = new Map(); // companyName => Client instance
    this.JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
    this.mongoURI = process.env.MONGO_URI;

    // Initialize session health checker
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessions();
    }, 3600000); // Check every hour

    // Cleanup on process exit
    process.on("SIGTERM", () => this.cleanup());
    process.on("SIGINT", () => this.cleanup());
  }

  async checkSessions() {
    console.log("🔍 Running session health check...");
    for (const [companyName, client] of this.clients) {
      try {
        if (!client.info?.wid) {
          console.log(
            `⚠️ Session check: ${companyName} not connected, reinitializing`
          );
          await this.initializeClient(companyName);
        }
      } catch (err) {
        console.error(`❌ Session check failed for ${companyName}:`, err);
      }
    }
  }

  async cleanup() {
    console.log("🧹 Cleaning up WhatsAppService...");
    clearInterval(this.sessionCheckInterval);

    // Disconnect all clients
    for (const [companyName] of this.clients) {
      await this.disconnect(companyName);
    }

    // Close all mongoose connections
    for (const [companyName, connection] of mongooseConnections) {
      try {
        await connection.disconnect();
        console.log(`✅ Closed MongoDB connection for ${companyName}`);
      } catch (err) {
        console.error(
          `❌ Error closing MongoDB connection for ${companyName}:`,
          err
        );
      }
    }

    mongooseConnections.clear();
  }

  async getMongoStore(companyName) {
    if (mongooseConnections.has(companyName)) {
      const existingConnection = mongooseConnections.get(companyName);
      if (existingConnection.readyState === 1) {
        // Connected
        return new MongoStore({ mongoose: existingConnection });
      }
      // If connection exists but isn't connected, clean it up
      await existingConnection.close().catch(() => {});
      mongooseConnections.delete(companyName);
    }

    const customMongoose = new Mongoose.Mongoose();
    try {
      await customMongoose.connect(this.mongoURI, {
        dbName: `whatsapp_${companyName}`,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        minPoolSize: 2,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
      });

      mongooseConnections.set(companyName, customMongoose);
      return new MongoStore({ mongoose: customMongoose });
    } catch (err) {
      console.error(`❌ MongoDB connection failed for ${companyName}:`, err);
      throw err;
    }
  }

  getCompanyNameFromRequest(req) {
    try {
      const token =
        req.cookies?.token || req.headers?.authorization?.split(" ")[1];
      if (!token) return null;

      const decoded = jwt.verify(token, this.JWT_SECRET);
      return decoded.companyName || null;
    } catch (err) {
      console.error("❌ Invalid token:", err.message);
      return null;
    }
  }

  async initializeClient(companyName) {
    // Check for existing valid client
    if (this.clients.has(companyName)) {
      const existingClient = this.clients.get(companyName);
      if (existingClient.info?.wid) {
        console.log(`✅ Reusing connected client for ${companyName}`);
        return existingClient;
      }
      // Clean up invalid client
      this.clients.delete(companyName);
    }

    const store = await this.getMongoStore(companyName);
    const isProduction = process.env.NODE_ENV === "production";

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

    // Event handlers
    client.on("qr", (qr) => {
      console.log(`📲 QR generated for ${companyName}`);
      this.emit("qr", { companyName, qr });
    });

    client.on("ready", () => {
      const phoneNumber = client.info?.wid?.user;
      console.log(`✅ Client ready for ${companyName}: ${phoneNumber}`);
      this.emit("ready", { companyName, phoneNumber });
    });

    client.on("authenticated", () => {
      console.log(`🔐 Authenticated for ${companyName}`);
      this.emit("authenticated", { companyName });
    });

    client.on("auth_failure", (msg) => {
      console.warn(`❌ Auth failed for ${companyName}:`, msg);
      this.emit("auth_failure", { companyName, message: msg });
    });

    client.on("disconnected", async (reason) => {
      console.warn(`🔌 Disconnected ${companyName}: ${reason}`);
      this.emit("disconnected", { companyName, reason });

      // Attempt automatic reconnection
      try {
        console.log(`♻️ Attempting to reconnect ${companyName}`);
        await this.initializeClient(companyName);
      } catch (err) {
        console.error(`❌ Reconnection failed for ${companyName}:`, err);
      }
    });

    client.on("loading_screen", (percent, message) => {
      console.log(`📶 [${companyName}] Loading: ${percent}% - ${message}`);
    });

    client.on("change_state", (state) => {
      console.log(`🔄 [${companyName}] State changed: ${state}`);
    });

    try {
      await client.initialize();
      this.clients.set(companyName, client);
      return client;
    } catch (err) {
      console.error(`❌ Failed to initialize client for ${companyName}:`, err);
      // Clean up if initialization fails
      try {
        await client.destroy();
      } catch (cleanupErr) {
        console.error(`❌ Cleanup failed for ${companyName}:`, cleanupErr);
      }
      throw err;
    }
  }

  async getStatus(companyName) {
    if (!this.clients.has(companyName)) {
      return {
        connected: false,
        phoneNumber: null,
        state: "DISCONNECTED",
        companyName,
      };
    }

    const client = this.clients.get(companyName);
    return {
      connected: !!client.info?.wid,
      phoneNumber: client.info?.wid?.user || null,
      state: client.state,
      companyName,
      lastSeen: client.info?.wid?.server?.lastSeen,
    };
  }

  async sendMessage(companyName, phone, message) {
    const client = await this.initializeClient(companyName);

    if (!client?.info?.wid) {
      throw new Error("Client not connected or authenticated yet");
    }

    // Validate phone number format
    if (!phone || !/^\d+$/.test(phone)) {
      throw new Error("Invalid phone number format - only digits allowed");
    }

    const chatId = `${phone}@c.us`;
    const result = await client.sendMessage(chatId, message);
    return result;
  }

  async disconnect(companyName) {
    if (!this.clients.has(companyName)) {
      console.warn(`⚠️ No client found in map for ${companyName}`);
      return false;
    }
    const client = this.clients.get(companyName);
    console.log(`📞 Disconnecting client with info:`, client?.info);
    let success = true;

    try {
      if (client?.logout) await client.logout();
    } catch (err) {
      console.warn(`⚠️ Logout error for ${companyName}:`, err.message);
      success = false;
    }

    try {
      if (client?.destroy) await client.destroy();
    } catch (err) {
      console.warn(`⚠️ Destroy error for ${companyName}:`, err.message);
      success = false;
    }
    console.log("✅ Logout and destroy executed for", companyName);
    this.clients.delete(companyName);
    console.log("🗑 Client deleted from map for", companyName);
    // Clean up session data
    try {
      const store = await this.getMongoStore(companyName);
      await store.remove({ session: companyName });
      console.log(`🧹 Session removed from DB for ${companyName}`);
    } catch (err) {
      console.error(
        `❌ Failed to remove session from DB for ${companyName}:`,
        err.message
      );
      success = false;
    }

    // Clean up mongoose connection if no other clients are using it
    if (mongooseConnections.has(companyName)) {
      try {
        await mongooseConnections.get(companyName).disconnect();
        mongooseConnections.delete(companyName);
      } catch (err) {
        console.error(
          `❌ Error closing MongoDB connection for ${companyName}:`,
          err
        );
        success = false;
      }
    }

    console.log(
      `✅ Disconnect ${
        success ? "successful" : "with errors"
      } for ${companyName}`
    );
    return success;
  }

  async getLatestQrCode(companyName) {
    if (!this.clients.has(companyName)) return null;
    const client = this.clients.get(companyName);
    return client.qrCode || null;
  }
}

// Singleton instance
const whatsappService = new WhatsAppService();

// Export both the instance and helper function
module.exports = whatsappService;
module.exports.getCompanyNameFromRequest =
  whatsappService.getCompanyNameFromRequest.bind(whatsappService);
