// const express = require("express");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const dotenv = require("dotenv");
// dotenv.config();
// const router = express.Router();
// const Admin = require("../../models/Admin/admin-model");
// const Client = require("../../models/Admin/client-modal");
// const { getAllClientDBNames, createClientDatabase } = require("../../database/db");
// const verifyToken = require("../../middlewares/auth");

// // Register Route
// router.post("/register", async (req, res) => {
//   const { email, password } = req.body;
//   console.log(`🔑 [REGISTER] Request received for email: ${email}`);

//   try {
//     const existingUser = await Admin.findOne({ email });
//     if (existingUser) {
//       console.log(`⚠️ [REGISTER] Email already in use: ${email}`);
//       return res.status(400).json({ message: "Email already in use" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newAdmin = new Admin({
//       email,
//       password: hashedPassword,
//     });

//     await newAdmin.save();
//     console.log(`✅ [REGISTER] User registered successfully: ${email}`);
//     res.status(201).json({ message: "User registered successfully!" });
//   } catch (error) {
//     console.error("❌ [REGISTER] Error during registration:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Login Route
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   console.log(`🔑 [LOGIN] Login attempt initiated for email: ${email}`);

//   try {
//     console.log("🔍 [LOGIN] Searching for admin with email:", email);
//     const admin = await Admin.findOne({ email });
//     if (admin) {
//       console.log(`🔍 [LOGIN] Admin found: ${admin.email}`);
//       const isPasswordMatch = await bcrypt.compare(password, admin.password);
//       console.log(`🔑 [LOGIN] Password match for admin: ${isPasswordMatch}`);

//       if (isPasswordMatch) {
//         const token = jwt.sign(
//           { id: admin._id, role: admin.role, companyName: "admin" },
//           process.env.JWT_SECRET,
//           { expiresIn: "1h" }
//         );
//         console.log(`✅ [LOGIN] Admin login successful for email: ${email}`);
//         console.log(`🔐 [LOGIN] Generated token: ${token}`);
//         return res.json({ token, userId: admin._id, role: admin.role, companyName: "admin" });
//       } else {
//         console.log(`❌ [LOGIN] Invalid password for admin: ${email}`);
//       }
//     } else {
//       console.log(`❌ [LOGIN] No admin found with email: ${email}`);
//     }

//     console.log("🔄 [LOGIN] Attempting client login...");
//     const clientDBNames = await getAllClientDBNames();
//     console.log(`🔍 [LOGIN] Total client databases found: ${clientDBNames.length}`);

//     for (const dbName of clientDBNames) {
//       try {
//         const companyName = dbName.replace("client_db_", "");
//         console.log(`🔄 [LOGIN] Processing client DB: ${dbName} | Company Name: ${companyName}`);

//         const clientDB = await createClientDatabase(companyName);
//         console.log(`✅ [LOGIN] Connected to client database: ${dbName}`);

//         const ClientModel = clientDB.model("Clients", Admin.schema);
//         console.log(`🔍 [LOGIN] Looking for client in database: ${dbName} with email: ${email}`);
//         const client = await ClientModel.findOne({ email });

//         if (client) {
//           console.log(`🔍 [LOGIN] Client found: ${client.email}`);
//           const isPasswordMatch = await bcrypt.compare(password, client.password);
//           console.log(`🔑 [LOGIN] Password match for client: ${isPasswordMatch}`);

//           if (isPasswordMatch) {
//             const token = jwt.sign(
//               { id: client._id, role: client.role, companyName: companyName },
//               process.env.JWT_SECRET,
//               { expiresIn: "12h" }
//             );
//             console.log(`✅ [LOGIN] Client login successful for email: ${email} from database: ${dbName}`);
//             console.log(`🔐 [LOGIN] Generated token: ${token}`);
//             return res.json({ token, userId: client._id, role: client.role, companyName: companyName });
//           } else {
//             console.log(`❌ [LOGIN] Invalid password for client: ${email} in database: ${dbName}`);
//           }
//         } else {
//           console.log(`❌ [LOGIN] No client found with email: ${email} in database: ${dbName}`);
//         }
//       } catch (err) {
//         console.error(`❌ [LOGIN] Error accessing client DB ${dbName}:`, err.message);
//       }
//     }

//     console.log(`❌ [LOGIN] Invalid email or password for email: ${email}`);
//     res.status(401).json({ message: "Invalid email or password" });
//   } catch (error) {
//     console.error("❌ [LOGIN] Error during login:", error.message);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();
const router = express.Router();
const Admin = require("../../models/Admin/admin-model");
const { getAllClientDBNames, createClientDatabase } = require("../../database/db");
const { getEmployeeModel} = require("../../models/clients/contactdata")
// ✅ Helper to set cookies
const setCookie = (res, name, value, options = {}) => {
  res.cookie(name, value, {
    httpOnly: true,
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
    secure: false, // set to true if using HTTPS in production
    sameSite: 'lax',
    ...options
  });
};

// 🔑 Register Route
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[REGISTER] Request received for email: ${email}`);

  try {
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ email, password: hashedPassword });

    await newAdmin.save();
    console.log(`[REGISTER] User registered successfully: ${email}`);
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("[REGISTER] Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔐 Login Route
// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[LOGIN] Attempt for email: ${email}`);

  try {
    // 🗝️ Admin login attempt
    const admin = await Admin.findOne({ email });
    if (admin && await bcrypt.compare(password, admin.password)) {
      const token = jwt.sign(
        { id: admin._id, role: admin.role, companyName: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // ✅ Set cookies for admin login
      setCookie(res, "token", token);
      setCookie(res, "userId", admin._id.toString());
      setCookie(res, "role", admin.role);
      setCookie(res, "email", admin.email);
      setCookie(res, "companyName", "admin");

      console.log(`[LOGIN] Admin logged in successfully: ${email}`);
      return res.json({ message: "Login successful", role: admin.role });
    }

    // 🔍 Client and User (Employee) login attempt
    const clientDBNames = await getAllClientDBNames();

    for (const dbName of clientDBNames) {
      const companyName = dbName.replace("client_db_", "");
      const clientDB = await createClientDatabase(companyName);

      // 🌟 Attempting Client Login
      const ClientModel = clientDB.model("Clients", Admin.schema);
      const client = await ClientModel.findOne({ email });
      if (client && await bcrypt.compare(password, client.password)) {
        const token = jwt.sign(
          { id: client._id, role: client.role, companyName },
          process.env.JWT_SECRET,
          { expiresIn: "12h" }
        );

        // ✅ Set cookies for client login
        setCookie(res, "token", token);
        setCookie(res, "userId", client._id.toString());
        setCookie(res, "role", client.role);
        setCookie(res, "email", client.email);
        setCookie(res, "companyName", companyName);

        console.log(`[LOGIN] Client logged in successfully: ${email}`);
        return res.json({ message: "Login successful", role: client.role });
      }

      // 🌟 Attempting User (Employee) Login
      const EmployeeModel = await getEmployeeModel(companyName);
      const employee = await EmployeeModel.findOne({ email });
      if (employee && await bcrypt.compare(password, employee.password)) {
        const token = jwt.sign(
          { id: employee._id, role: employee.role, companyName },
          process.env.JWT_SECRET,
          { expiresIn: "12h" }
        );

        // ✅ Set cookies for employee login
        setCookie(res, "token", token);
        setCookie(res, "userId", employee._id.toString());
        setCookie(res, "role", employee.role);
        setCookie(res, "email", employee.email);
        setCookie(res, "companyName", companyName);

        console.log(`[LOGIN] Employee (User) logged in successfully: ${email}`);
        return res.json({ message: "Login successful", role: employee.role });
      }
    }

    res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("[LOGIN] Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
