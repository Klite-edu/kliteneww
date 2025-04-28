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
const { getClientModel } = require("../../models/Admin/client-modal");
const { getEmployeeModel } = require("../../models/clients/contactdata");
const { getAllClientDBNames, createClientDatabase } = require("../../database/db");

// Cookie helper
const setAuthCookies = (res, user, companyName) => {
  const token = jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      email: user.email,
      companyName 
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  const cookieOptions = {
    httpOnly: true,
    maxAge: 12 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.cookie('token', token, cookieOptions);
  res.cookie('userId', user._id.toString(), cookieOptions);
  res.cookie('role', user.role, cookieOptions);
  res.cookie('email', user.email, cookieOptions);
  res.cookie('companyName', companyName, cookieOptions);
};

// Register Route
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

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[LOGIN] Attempt for email: ${email}`);

  try {
    // 1. Check Admin login
    const admin = await Admin.findOne({ email });
    if (admin && await bcrypt.compare(password, admin.password)) {
      setAuthCookies(res, admin, "admin");
      console.log(`[LOGIN] Admin logged in successfully: ${email}`);
      return res.json({ 
        message: "Login successful", 
        role: admin.role,
        userType: 'admin'
      });
    }

    // 2. Check Client/Employee login across all tenant databases
    const clientDBNames = await getAllClientDBNames();
    
    for (const dbName of clientDBNames) {
      const companyName = dbName.replace("client_db_", "");
      
      try {
        // Check Client login
        const ClientModel = await getClientModel(companyName);
        const client = await ClientModel.findOne({ email });
        
        if (client && await bcrypt.compare(password, client.password)) {
          setAuthCookies(res, client, companyName);
          console.log(`[LOGIN] Client logged in successfully: ${email}`);
          return res.json({ 
            message: "Login successful", 
            role: client.role,
            userType: 'client'
          });
        }

        // Check Employee login
        const EmployeeModel = await getEmployeeModel(companyName);
        const employee = await EmployeeModel.findOne({ email });
        
        if (employee && await bcrypt.compare(password, employee.password)) {
          setAuthCookies(res, employee, companyName);
          console.log(`[LOGIN] Employee logged in successfully: ${email}`);
          return res.json({ 
            message: "Login successful", 
            role: employee.role,
            userType: 'employee'
          });
        }
      } catch (err) {
        console.error(`[LOGIN] Error checking company ${companyName}:`, err.message);
        continue; // Move to next company if error occurs
      }
    }

    // If no match found
    res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("[LOGIN] Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;