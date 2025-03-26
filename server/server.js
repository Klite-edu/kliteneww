require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { updateTaskFrequency } = require("./middlewares/TaskScheduler");
const db = require("./database/db"); // ✅ Ensure the DB connection works!

// ✅ Import Routes
const adminRoutes = require("./routes/Admin/adminRoutes");
const clientRoutes = require("./routes/Admin/clientRoute");
const userRoutes = require("./routes/userRoute");
const paymentRoutes = require("./routes/googleRoute");
const DashboardRoutes = require("./routes/DashboardRoute");
const LeadRoutes = require("./routes/leadsRoute");
const WebHookRoutes = require("./routes/webhookRoutes"); // ✅ Webhooks (WhatsApp)
const SubscriptionRoutes = require("./routes/Admin/subscriptionRoute");
const UserSubscriptionRoutes = require("./routes/Admin/UserSubscriptionRoute");
const clientplanRoutes = require("./routes/clients/clientplanRoute");
const ImpressionRoute = require("./routes/Admin/ImpressionRoute");
const contactdataRoutes = require("./routes/clients/contactdataRoute");
const attendenceRoutes = require("./routes/clients/attendence/attendence");
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

// ✅ Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// ✅ Enable CORS for both local and production origins
const allowedOrigins = [
  "http://localhost:3000",                  // Development Frontend
  "https://app.autopilotmybusiness.com"     // Production Frontend
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

// ✅ Middleware Setup
app.use(express.json()); // Parse JSON bodies

// ✅ Routes Setup (Main APIs)
app.use("/api", ImpressionRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", paymentRoutes);
app.use("/api", DashboardRoutes);
app.use("/api/leads", LeadRoutes);
app.use("/", WebHookRoutes); // ✅ No socket.io, pure REST endpoint
app.use("/api", SubscriptionRoutes);
app.use("/api", UserSubscriptionRoutes);
app.use("/api", clientplanRoutes);
app.use("/api/employee", contactdataRoutes);
app.use("/api/attendance", attendenceRoutes);
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

// ✅ Start Scheduled Jobs (if any)
updateTaskFrequency(); // Example: Task scheduler running in background

// ✅ Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
