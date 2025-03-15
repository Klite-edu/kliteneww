require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
// const { Server } = require("socket.io");
const db = require("./database/db");
const {updateTaskFrequency} = require("./middlewares/TaskScheduler");

// Import Routes
const adminRoutes = require("./routes/Admin/adminRoutes");
const clientRoutes = require("./routes/Admin/clientRoute");
const userRoutes = require("./routes/userRoute");
const paymentRoutes = require("./routes/googleRoute");
const DashboardRoutes = require("./routes/DashboardRoute");
// const trackApiCalls = require('./middlewares/apiLogger');
const LeadRoutes = require("./routes/leadsRoute");
const WebHookRoutes = require("./routes/webhookRoutes");
const SubscriptionRoutes = require("../server/routes/Admin/subscriptionRoute");
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

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"], // Allow local frontend
    credentials: true,
  })
);
// app.use(trackApiCalls);
// Routes
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

updateTaskFrequency();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// const express = require("express");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const Admin = require("../models/admin-model");
// const dotenv = require("dotenv");
// dotenv.config();
// const router = express.Router();
// const Client = require("../models/client-modal");
// const User = require("../models/User-model");
// const { verifyToken } = require("../middlewares/auth");

// // Register Route
// router.post("/register", async (req, res) => {
//   const { email, password } = req.body;
//   console.log(`Register request received for email: ${email}`);

//   try {
//     const existingUser = await Admin.findOne({ email });
//     if (existingUser) {
//       console.log(`Email already in use: ${email}`);
//       return res.status(400).json({ message: "Email already in use" });
//     }

//     const salt = await bcrypt.genSalt(10); // Generate salt
//     const hashedPassword = await bcrypt.hash(password, salt); // Hash password with salt

//     const newAdmin = new Admin({
//       email,
//       password: hashedPassword,
//     });

//     await newAdmin.save();
//     console.log(`User registered successfully: ${email}`);

//     res.status(201).json({ message: "User registered successfully!" });
//   } catch (error) {
//     console.error("Error during registration:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Login Route
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   console.log(`Login attempt for email: ${email}`);

//   try {
//     const admin =
//       (await Admin.findOne({ email })) || (await Client.findOne({ email })) || (await User.findOne({ email }));
//     console.log("admin email", admin);

//     if (!admin) {
//       console.log(`Invalid email or password for email: ${email}`);
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     // Compare entered password with hashed password
//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//       console.log(`Invalid password attempt for email: ${email}`);
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const token = jwt.sign(
//       { adminId: admin._id, role: admin.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     console.log("token", token);

//     console.log(`Login successful for email: ${email}`);

//     res.json({ token });
//   } catch (error) {
//     console.error("Error during login:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Dashboard Route (Client access only)
// router.get("/dashboard", verifyToken, (req, res) => {
//   console.log(`Dashboard request by user ID: ${req.user.adminId}`);

//   if (req.user.role !== "client") {
//     console.log(
//       `Access denied for user ID: ${req.user.adminId}. Only clients can access this.`
//     );
//     return res.status(403).send("Access denied. Only clients can access this.");
//   }

//   // Fetch data for the client based on req.user.clientId or similar
//   Client.findById(req.user.clientId)
//     .then((client) => {
//       console.log(`Fetched client data for client ID: ${req.user.clientId}`);
//       res.json(client);
//     })
//     .catch((err) => {
//       console.error(
//         `Error fetching client data for client ID: ${req.user.clientId}`,
//         err
//       );
//       res.status(500).send("Error fetching client data");
//     });
// });

// module.exports = router;
