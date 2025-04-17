const { Client } = require("whatsapp-web.js");
const EventEmitter = require("events");
const jwt = require("jsonwebtoken");
const {
  getSessionModel,
} = require("../../../models/clients/Whatsappweb/whatsappweb-model");

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // companyName => Client instance
    this.sessionCache = new Map(); // companyName => session data
    this.JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
  }

  getCompanyNameFromRequest(req) {
    try {
      const token = req.cookies?.token; // <- ✅ fetched via cookie-parser
      console.log("🍪 Token from cookie:", token);

      if (!token) return null;

      const decoded = jwt.verify(token, this.JWT_SECRET);
      console.log("🔓 Decoded JWT:", decoded);

      return decoded.companyName || null;
    } catch (err) {
      console.error("❌ Invalid token:", err.message);
      return null;
    }
  }

  async initializeClient(companyName) {
    if (this.clients.has(companyName)) {
      const existingClient = this.clients.get(companyName);
      if (existingClient.info?.wid) {
        console.log(`✅ Reusing connected client for ${companyName}`);
        return existingClient;
      }
    }
    const Session = await getSessionModel(companyName);
    const cachedSession = await Session.findOne({ id: "whatsapp_session" });

    // ✅ Create WhatsApp client with session
    const client = new Client({
      session: cachedSession?.session || undefined, // This must contain valid session object
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-zygote",
          "--disable-gpu",
          "--window-size=800,600",
        ],
      },
    });

    client.on("qr", (qr) => {
      console.log(`📲 QR for ${companyName}`);
      this.emit("qr", { companyName, qr });
    });

    client.on("ready", async () => {
      const phoneNumber = client.info?.wid?.user;
      console.log(`✅ Client ready for ${companyName}: ${phoneNumber}`);

      if (phoneNumber) {
        await Session.findOneAndUpdate(
          { id: "whatsapp_session" },
          { phoneNumber },
          { upsert: true }
        );
      }

      this.emit("ready", { companyName, phoneNumber });
    });

    client.on("authenticated", async (session) => {
      console.log(`🔐 Authenticated for ${companyName}`);
      this.sessionCache.set(companyName, session);

      const Session = await getSessionModel(companyName);
      await Session.findOneAndUpdate(
        { id: "whatsapp_session" },
        { session, updatedAt: new Date() },
        { upsert: true }
      );

      this.emit("authenticated", { companyName });
    });

    client.on("auth_failure", (msg) => {
      console.warn(`❌ Auth failed for ${companyName}:`, msg);
      this.emit("auth_failure", { companyName, message: msg });
    });

    client.on("disconnected", async (reason) => {
      console.warn(`🔌 Disconnected ${companyName}: ${reason}`);
      this.emit("disconnected", { companyName, reason });
    });

    try {
      await client.initialize();
      this.clients.set(companyName, client);
      return client;
    } catch (err) {
      console.error(`❌ Failed to init client for ${companyName}:`, err);
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
    };
  }

  async sendMessage(companyName, phone, message) {
    const client = await this.initializeClient(companyName);
    const chatId = `${phone}@c.us`;
    const result = await client.sendMessage(chatId, message);
    return result;
  }

  async disconnect(companyName) {
    if (this.clients.has(companyName)) {
      const client = this.clients.get(companyName);

      try {
        if (client?.logout) await client.logout();
      } catch (err) {
        console.warn(`⚠️ Logout error for ${companyName}:`, err.message);
      }

      try {
        if (client?.destroy) await client.destroy();
      } catch (err) {
        console.warn(`⚠️ Destroy error for ${companyName}:`, err.message);
      }

      this.clients.delete(companyName);
      this.sessionCache.delete(companyName);

      try {
        const Session = await getSessionModel(companyName);
        await Session.deleteOne({ id: "whatsapp_session" });
        console.log(`🧹 Session removed from DB for ${companyName}`);
      } catch (err) {
        console.error(
          `❌ Failed to remove session from DB for ${companyName}:`,
          err.message
        );
      }

      console.log(`✅ Disconnected client for ${companyName}`);
      return true;
    }
    return false;
  }
}

module.exports = new WhatsAppService();
module.exports.getCompanyNameFromRequest = (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.companyName || null;
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    return null;
  }
};
