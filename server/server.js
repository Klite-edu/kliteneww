require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const mongoSanitize = require("mongo-sanitize");
const hpp = require("hpp");
const xss = require("xss-clean");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { updateTaskFrequency } = require("./middlewares/TaskScheduler");
const { connectMainDB } = require("./database/db");

// ✅ Import Multer Configuration
const upload = require("./config/multerConfig");

// ✅ Import Routes
const adminRoutes = require("./routes/Admin/adminRoutes");
const clientRoutes = require("./routes/Admin/clientRoute");
const userRoutes = require("./routes/userRoute");
const paymentRoutes = require("./routes/googleRoute");
const DashboardRoutes = require("./routes/DashboardRoute");
const LeadRoutes = require("./routes/leadsRoute");
const WebHookRoutes = require("./routes/webhookRoutes");
const SubscriptionRoutes = require("./routes/Admin/subscriptionRoute");
const UserSubscriptionRoutes = require("./routes/Admin/UserSubscriptionRoute");
const clientplanRoutes = require("./routes/clients/clientplanRoute");
const ImpressionRoute = require("./routes/Admin/ImpressionRoute");
const contactdataRoutes = require("./routes/clients/contactdataRoute");
const attendanceRoutes = require("./routes/clients/attendence/attendence");
const siteRoutes = require("./routes/clients/attendence/siteRoute");
const taskRoutes = require("./routes/clients/checklist/taskRoutes");
const DelegationRoutes = require("./routes/clients/taskDelegation/DelegationRoute");
const PipelineRoutes = require("./routes/clients/pipeline/pipelineRoutes");
const TriggerRoutes = require("./routes/clients/Triggers/triggerRoutes");
const formBuilderRoutes = require("./routes/clients/formBuilder/formBuilderRoutes");
const formRoutes = require("./routes/clients/Form/formRoutes");
const ChatbotRoute = require("./routes/clients/chatbot/ChatbotRoute");
const MetaClientRoutes = require("./routes/clients/MetaBusiness/MetaClientRoutes");
const MetaTemplateRoutes = require("./routes/clients/MetaBusiness/MetaTemplateRoutes");
const ticketRoute = require("./routes/clients/chatbot/ticketRoute");
const clientDashRoute = require("./routes/clients/Dashboard/DashboardRoute");
const TicketRaiseRoute = require("./routes/clients/TicketRaise/TicketRaiseRoute");
const permissionRoutes = require("./routes/clients/permission/permissionRoutes");
const logoRoute = require("./routes/clients/LogoImage/LogoRoute");  // ✅ Logo Upload Route

// ✅ Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// ✅ Connect to Main Database
connectMainDB();

// ✅ CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : ["http://localhost:3000"];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ✅ Security Enhancements
app.use(helmet());
app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.hidePoweredBy());
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(
  helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true })
);
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "trusted.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// ✅ Middleware for Parsing and Sanitization
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(xss());
app.use(hpp());
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

// ✅ Routes Setup
app.use("/api", ImpressionRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", paymentRoutes);
app.use("/api", DashboardRoutes);
app.use("/api/leads", LeadRoutes);
app.use("/", WebHookRoutes);
app.use("/api", SubscriptionRoutes);
app.use("/api", UserSubscriptionRoutes);
app.use("/api", clientplanRoutes);
app.use("/api/employee", contactdataRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api", siteRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/delegation", DelegationRoutes);
app.use("/api/stages", PipelineRoutes);
app.use("/api/triggers", TriggerRoutes);
app.use("/api/builder", formBuilderRoutes);
app.use("/api/form", formRoutes);
app.use("/api/chat", ChatbotRoute);
app.use("/api/meta", MetaTemplateRoutes);
app.use("/api/meta", MetaClientRoutes);
app.use("/api/clientDash", clientDashRoute);
app.use("/api/ticket", ticketRoute);
app.use("/api/ticketRaise", TicketRaiseRoute);
app.use("/api/permission", permissionRoutes);
app.use("/api/logo", logoRoute);  // ✅ Logo Route

// ✅ Start Scheduled Jobs
updateTaskFrequency();

// ✅ Base Route for Server Status
app.get("/", (req, res) => {
  res.send("Server is up and running with enhanced security!");
});

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ message: "Internal Server Error" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
