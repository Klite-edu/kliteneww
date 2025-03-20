// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const http = require("http");
// // const { Server } = require("socket.io");
// const db = require("./database/db");
// const { updateTaskFrequency } = require("./middlewares/TaskScheduler");

// // Import Routes
// const adminRoutes = require("./routes/Admin/adminRoutes");
// const clientRoutes = require("./routes/Admin/clientRoute");
// const userRoutes = require("./routes/userRoute");
// const paymentRoutes = require("./routes/googleRoute");
// const DashboardRoutes = require("./routes/DashboardRoute");
// // const trackApiCalls = require('./middlewares/apiLogger');
// const LeadRoutes = require("./routes/leadsRoute");
// const WebHookRoutes = require("./routes/webhookRoutes");
// const SubscriptionRoutes = require("../server/routes/Admin/subscriptionRoute");
// const UserSubscriptionRoutes = require("./routes/Admin/UserSubscriptionRoute");
// const clientplanRoutes = require("./routes/clients/clientplanRoute");
// const ImpressionRoute = require("./routes/Admin/ImpressionRoute");
// const contactdataRoutes = require("./routes/clients/contactdataRoute");
// const attendenceRoutes = require("./routes/clients/attendence/attendence");
// const siteRoutes = require("./routes/clients/attendence/siteRoute");
// const taskRoutes = require("./routes/clients/checklist/taskRoutes");
// const DelegationRoutes = require("./routes/clients/taskDelegation/DelegationRoute");
// const PipelineRoutes = require("./routes/clients/pipeline/pipelineRoutes");
// const TriggerRoutes = require("./routes/clients/Triggers/triggerRoutes");
// const formBuilderRoutes = require("./routes/clients/formBuilder/formBuilderRoutes");
// const formRoutes = require("./routes/clients/Form/formRoutes");
// const ChatbotRoute = require("./routes/clients/chatbot/ChatbotRoute");
// const MetaClientRoutes = require("./routes/clients/MetaBusiness/MetaClientRoutes");
// const MetaMessagesRoutes = require("./routes/clients/MetaBusiness/MetaMessagesRoutes");
// const MetaTemplateRoutes = require("./routes/clients/MetaBusiness/MetaTemplateRoutes");
// const EmailIntegrationRoutes = require("./routes/clients/EmailIntegration/EmailIntegrationRoutes");
// const chatRoute = require("./routes/clients/chatbot/chatRoute");
// const AgentRoute = require("./routes/clients/MetaBusiness/AgentRoute");

// const app = express();
// const server = http.createServer(app);

// // ✅ Middlewares
// app.use(express.json());

// // ✅ CORS middleware added here
// app.use(cors({
//     origin: "http://localhost:3000",   // Frontend URL
//     credentials: true                  // To allow cookies if needed
// }));

// // ✅ If you want to log API calls uncomment this
// // app.use(trackApiCalls);

// // ✅ Routes
// app.use("/api", ImpressionRoute);
// app.use("/api/admin", adminRoutes);
// app.use("/api/clients", clientRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/auth", paymentRoutes);
// app.use("/api", DashboardRoutes);
// app.use("/api/leads", LeadRoutes);
// app.use("/", WebHookRoutes);
// app.use("/api", SubscriptionRoutes);
// app.use("/api", UserSubscriptionRoutes);
// app.use("/api", clientplanRoutes);
// app.use("/api/employee", contactdataRoutes);
// app.use("/api/attendance", attendenceRoutes);
// app.use("/api", siteRoutes);
// app.use("/api/tasks", taskRoutes);
// app.use("/api/delegation", DelegationRoutes);
// app.use("/api/stages", PipelineRoutes);
// app.use("/api/triggers", TriggerRoutes);
// app.use("/api/builder", formBuilderRoutes);
// app.use("/api/form", formRoutes);
// app.use("/api/chat", ChatbotRoute);
// app.use("/api/meta", MetaTemplateRoutes);
// app.use("/api/meta", MetaMessagesRoutes);
// app.use("/api/meta", MetaClientRoutes);
// app.use("/api/mail", EmailIntegrationRoutes);
// app.use("/api/chats", chatRoute);
// app.use("/api/agents", AgentRoute);

// // ✅ Start any scheduled tasks
// updateTaskFrequency();

// // ✅ Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));




require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./database/db");
const { updateTaskFrequency } = require("./middlewares/TaskScheduler");

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
const MetaMessagesRoutes = require("./routes/clients/MetaBusiness/MetaMessagesRoutes");
const MetaTemplateRoutes = require("./routes/clients/MetaBusiness/MetaTemplateRoutes");
// const EmailIntegrationRoutes = require("./routes/clients/EmailIntegration/EmailIntegrationRoutes");
const chatRoute = require("./routes/clients/chatbot/chatRoute");
const ticketRoute = require("./routes/clients/chatbot/ticketRoute");

// ✅ Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// ✅ Enable CORS for both local and production origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://app.autopilotmybusiness.com"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// ✅ Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ✅ Socket.IO Events
io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  // Join a specific user room based on user_id
  socket.on("joinRoom", (userId) => {
    console.log(`✅ User ${userId} joined their room`);
    socket.join(userId);
  });

  // Agent sends message and broadcasts to all clients in the room
  socket.on("sendMessage", (data) => {
    console.log(`✅ Message sent from agent:`, data);

    // Emit new message to the user's room
    io.to(data.user_id).emit("newMessage", data);
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// ✅ Export io if you want to use in other files (webhooks, etc.)
module.exports.io = io;

// ✅ Middleware setup
app.use(express.json());

// ✅ Routes
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
app.use("/api/meta", MetaMessagesRoutes);
app.use("/api/meta", MetaClientRoutes);
// app.use("/api/mail", EmailIntegrationRoutes);
app.use("/api/chats", chatRoute);
app.use("/api/ticket", ticketRoute);

// ✅ Start any scheduled tasks (Optional)
updateTaskFrequency();

// ✅ Start server on PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
