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
const Admin = require("../../models/Admin/admin-model");
const dotenv = require("dotenv");
dotenv.config();
const router = express.Router();
const Client = require("../../models/Admin/client-modal");
const verifyToken = require("../../middlewares/auth");
const Employee = require("../../models/clients/contactdata");

// Register Route
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log(`Register request received for email: ${email}`);

  try {
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      console.log(`Email already in use: ${email}`);
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10); // Generate salt
    const hashedPassword = await bcrypt.hash(password, salt); // Hash password with salt

    const newAdmin = new Admin({
      email,
      password: hashedPassword,
    });

    await newAdmin.save();
    console.log(`User registered successfully: ${email}`);

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt for email: ${email}`);

  try {
    // ✅ Find user in Admin, Client, or Employee collections
    const admin =
      (await Admin.findOne({ email })) || 
      (await Client.findOne({ email })) || 
      (await Employee.findOne({ email }));

    console.log("🔍 Found user:", admin);

    if (!admin) {
      console.log(`❌ Invalid email or password for email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("🔑 Password Match:", isMatch);
    
    if (!isMatch) {
      console.log(`❌ Invalid password attempt for email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      { id: admin._id, role: admin.role }, // Send `id` in token
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("✅ Generated Token:", token);

    console.log(`✅ Login successful for email: ${email}`);

    // ✅ Send both `token` and `userId` in response
    res.json({ token, userId: admin._id, role: admin.role });

  } catch (error) {
    console.error("❌ Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Dashboard Route (Client access only)
router.get("/dashboard", verifyToken, (req, res) => {
  console.log(`Dashboard request by user ID: ${req.user.adminId}`);

  if (req.user.role !== "client") {
    console.log(
      `Access denied for user ID: ${req.user.adminId}. Only clients can access this.`
    );
    return res.status(403).send("Access denied. Only clients can access this.");
  }

  // Fetch data for the client based on req.user.clientId or similar
  Client.findById(req.user.clientId)
    .then((client) => {
      console.log(`Fetched client data for client ID: ${req.user.clientId}`);
      res.json(client);
    })
    .catch((err) => {
      console.error(
        `Error fetching client data for client ID: ${req.user.clientId}`,
        err
      );
      res.status(500).send("Error fetching client data");
    });
});

module.exports = router;
