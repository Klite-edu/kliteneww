// const express = require("express");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const speakeasy = require("speakeasy");
// const qrCode = require("qrcode");
// const Admin = require("../models/admin-model");
// const Client = require("../models/client-modal");
// const User = require("../models/User-model");
// const dotenv = require("dotenv");
// dotenv.config();
// const router = express.Router();
// const  verifyToken  = require("../middlewares/auth");

// // Register Route (same as before)
// router.post("/register", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     console.log("Registering new user:", { email });

//     const existingUser = await Admin.findOne({ email });
//     if (existingUser) {
//       console.log("Email already in use:", email);
//       return res.status(400).json({ message: "Email already in use" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newAdmin = new Admin({
//       email,
//       password: hashedPassword,
//     });

//     await newAdmin.save();
//     console.log("User registered successfully:", { email });
//     res.status(201).json({ message: "User registered successfully!" });
//   } catch (error) {
//     console.error("Error during registration:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// router.post("/otp-setup", verifyToken, async (req, res) => {
//   const { email } = req.body;

//   console.log("Received email:", email); // Log the incoming email

//   const admin = await Admin.findOne({ email });

//   if (!admin) {
//     console.log("Admin not found for email:", email); // Log if admin is not found
//     return res.status(404).json({ message: "Admin not found" });
//   }

//   console.log("Admin found:", admin); // Log the found admin details

//   // Check if the OTP secret already exists in the database
//   if (admin.otpSecret) {
//     console.log("OTP secret already exists:", admin.otpSecret); // Log if the secret is already present
//     return res.json({
//       message: "OTP secret already set up",
//       secret: admin.otpSecret, // Return the existing secret if already set up
//     });
//   }

//   // If OTP secret does not exist, generate a new one
//   const secret = speakeasy.generateSecret({ length: 20 });
//   console.log("Generated OTP secret:", secret); // Log the generated secret

//   admin.otpSecret = secret.base32; // Save the new OTP secret to the database

//   const qr = await qrCode.toDataURL(secret.otpauth_url); // Generate QR code for OTP secret
//   console.log("Generated QR code URL:", qr); // Log the generated QR code URL

//   await admin.save(); // Save the admin document with the new OTP secret
//   console.log("Admin saved with new OTP secret"); // Log after saving the admin

//   res.json({ qrCode: qr, secret: secret.base32 }); // Send the QR code and the secret back to the client
// });



// router.post("/enable-otp", verifyToken, async (req, res) => {
//   const { email, otp } = req.body;
//   const admin = await Admin.findOne({ email });

//   if (!admin) return res.status(404).json({ message: "Admin not found" });

//   // Generate OTP secret temporarily
//   const secret = speakeasy.generateSecret({ length: 20 });

//   // Verify the OTP using the secret generated above
//   const isOtpVerified = speakeasy.totp.verify({
//     secret: secret.base32,
//     encoding: "base32",
//     token: otp,
//   });

//   if (!isOtpVerified) return res.status(400).json({ message: "Invalid OTP" });

//   // If OTP is verified, enable OTP for the user
//   admin.otpEnabled = true;
//   await admin.save();

//   res.json({ message: "OTP enabled successfully" });
// });



// router.post("/login", async (req, res) => {
//   const { email, password, otp } = req.body;

//   try {
//     // Find the user (admin, client, or user)
//     const admin = await Admin.findOne({ email }) || (await Client.findOne({ email })) || (await User.findOne({ email }));
//     if (!admin) return res.status(401).json({ message: "Invalid email or password" });

//     // Log the password and hashed password
//     console.log("Password from request body:", password);
//     console.log("Hashed password from database:", admin.password);

//     // Compare the password with the hashed one
//     const isMatch = await bcrypt.compare(password, admin.password);

//     if (!isMatch) {
//       console.log("Password does not match");
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     console.log("Password match!");

//     // Check if OTP secret is set. If not, generate and save it manually.
//     if (!admin.otpSecret) {
//       const secret = speakeasy.generateSecret({ length: 20 });
//       admin.otpSecret = secret.base32;
//       admin.otpEnabled = true; // Enable OTP for this user
//       await admin.save();
//       console.log("OTP secret generated and saved for", email); // Log OTP secret creation

//       // Return the QR code for the user to set up their OTP app
//       const qr = await qrCode.toDataURL(secret.otpauth_url);
//       return res.json({
//         message: "OTP secret has been generated and saved. Please set up your OTP app.",
//         otpRequired: true,
//         qrCode: qr,
//         secret: secret.base32,
//       });
//     }

//     // If OTP is enabled, verify the OTP
//     if (admin.otpEnabled) {
//       if (!otp) return res.json({ otpRequired: true });

//       const isOtpVerified = speakeasy.totp.verify({
//         secret: admin.otpSecret,
//         encoding: "base32",
//         token: otp,
//       });

//       if (!isOtpVerified) return res.status(400).json({ message: "Invalid OTP" });
//     }

//     // Generate JWT token after successful login
//     const token = jwt.sign(
//       { adminId: admin._id, role: admin.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.json({ token });

//   } catch (error) {
//     console.error(error); // Log the error for debugging
//     res.status(500).json({ message: "Server error" });
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
const { getEmployeeModel } = require("../../models/clients/contactdata");
const { getClientModel } = require("../../models/Admin/client-modal");

// Register Route
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔑 [REGISTER] Request received for email: ${email}`);

  try {
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      console.log(`⚠️ [REGISTER] Email already in use: ${email}`);
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      email,
      password: hashedPassword,
    });

    await newAdmin.save();
    console.log(`✅ [REGISTER] User registered successfully: ${email}`);
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("❌ [REGISTER] Error during registration:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔑 [LOGIN] Login attempt for email: ${email}`);

  try {
    // Step 1: Admin Login Attempt
    console.log("🔍 [LOGIN] Searching for admin with email:", email);
    const admin = await Admin.findOne({ email });
    if (admin && await bcrypt.compare(password, admin.password)) {
      const token = jwt.sign(
        { id: admin._id, role: "admin", companyName: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      console.log(`✅ [LOGIN] Admin login successful for email: ${email}`);
      return res.json({ token, userId: admin._id, role: "admin", companyName: "admin" });
    }

    // Step 2: Multi-Tenant Client and Employee Login
    console.log("🔄 [LOGIN] Attempting multi-tenant login...");
    const clientDBNames = await getAllClientDBNames();
    for (const dbName of clientDBNames) {
      try {
        const companyName = dbName.replace("client_db_", "");
        console.log(`🔄 [LOGIN] Processing client DB: ${dbName} | Company Name: ${companyName}`);

        // Step 2a: Check in Client Model
        const Client = await getClientModel(companyName);
        console.log(`🔍 [LOGIN] Looking for client in database: ${dbName} with email: ${email}`);
        const client = await Client.findOne({ email });
        if (client && await bcrypt.compare(password, client.password)) {
          const token = jwt.sign(
            { id: client._id, role: "client", companyName },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
          );
          console.log(`✅ [LOGIN] Client login successful for email: ${email}`);
          return res.json({ token, userId: client._id, role: "client", companyName });
        }

        // Step 2b: Check in Employee Model
        const Employee = await getEmployeeModel(companyName);
        console.log(`🔍 [LOGIN] Looking for employee in database: ${dbName} with email: ${email}`);
        const employee = await Employee.findOne({ email });
        if (employee && await bcrypt.compare(password, employee.password)) {
          const token = jwt.sign(
            { id: employee._id, role: "user", companyName },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
          );
          console.log(`✅ [LOGIN] Employee login successful for email: ${email}`);
          return res.json({ token, userId: employee._id, role: "user", companyName });
        }
      } catch (err) {
        console.error(`❌ [LOGIN] Error accessing client DB ${dbName}:`, err.message);
      }
    }

    res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;

