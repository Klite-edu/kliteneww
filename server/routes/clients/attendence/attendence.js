

// const express = require('express');
// const router = express.Router();
// const Attendance = require('../models/attendence');

// router.post('/submit', async (req, res) => {
//     const { employeeId, name, checkType, email } = req.body;

//     const today = new Date; 
//     today.setHours(0, 0, 0, 0); // Normalize time to compare only date

//     let attendance = await Attendance.findOne({ employeeId, date: today });

//     if (!attendance) {
//         // If no attendance record exists, create a new one with Check-In time
//         attendance = new Attendance({
//             employeeId,
//             name,
//             checkIn: checkType === "Check-In" ? new Date().toLocaleTimeString() : "",
//             checkOut: checkType === "Check-Out" ? new Date().toLocaleTimeString() : "",
//             date: today,
//             email
//         });
//     } else {
//         // If attendance already exists, update the corresponding Check-In or Check-Out time
//         if (checkType === "Check-In") {
//             if (attendance.checkIn) {
//                 return res.status(400).send("You have already checked in today.");
//             }
//             attendance.checkIn = new Date().toLocaleTimeString();
//         } else if (checkType === "Check-Out") {
//             if (attendance.checkOut) {
//                 return res.status(400).send("You have already checked out today.");
//             }
//             attendance.checkOut = new Date().toLocaleTimeString();
//         }
//     }

//     await attendance.save();
//     res.send(`${checkType} successful`);
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const Attendance = require("../../../models/clients/attendence/attendence");
const Site = require("../../../models/clients/attendence/site");
const Employee = require("../../../models/clients/contactdata");
const bodyParser = require("body-parser");

router.use(bodyParser.json());

// Function to calculate distance using the Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// Fetch all sites for the frontend dropdown
router.get("/sites", async (req, res) => {
  try {
    console.log("📡 Fetching all registered sites...");
    const sites = await Site.find();
    console.log("✅ Sites fetched successfully:", sites);
    res.json(sites);
  } catch (error) {
    console.error("❌ Error fetching site data:", error);
    res.status(500).send("Error fetching site data.");
  }
});

// Attendance submission with geofencing validation
router.post("/submit", async (req, res) => {
  try {
    const { employeeID, name, checkType, latitude, longitude } = req.body;

    console.log("\n📌 Attendance Submission Request Received");
    console.log("🆔 Employee ID:", employeeID);
    console.log("🕒 Check Type:", checkType);
    console.log("📍 Employee Location:", `Latitude: ${latitude}, Longitude: ${longitude}`);
    console.log("name", name);

    if (!employeeID || !checkType || !latitude || !longitude) {
      console.error("❌ Missing required fields in request.");
      return res.status(400).json({ error: "Missing required fields." });
    }

    // ✅ Find Employee
    const employee = await Employee.findById(employeeID);
    if (!employee) {
      console.error("❌ Employee not found.");
      return res.status(400).json({ error: "Employee not found." });
    }
    console.log("✅ Employee Found:", employee.fullName);

    // ✅ Fetch All Registered Sites
    console.log("📡 Fetching all registered sites...");
    const sites = await Site.find();
    if (sites.length === 0) {
      console.error("❌ No sites found in the database.");
      return res.status(500).json({ error: "No sites found." });
    }
    console.log("✅ Sites Fetched:", sites.map((site) => site.name));

    // ✅ Check If Employee is Inside a Registered Site
    let insideSite = false;
    let matchedSite = "";

    console.log("🛡️ Checking if employee is inside any allowed site radius...");
    for (const site of sites) {
      const distance = calculateDistance(site.latitude, site.longitude, latitude, longitude);
      console.log(`➡️ Checking Site: ${site.name}, Distance: ${distance} meters`);

      if (distance <= site.radius) {
        insideSite = true;
        matchedSite = site.name;
        console.log(`✅ Employee is inside the allowed area of site: ${site.name}`);
        break;
      }
    }

    if (!insideSite) {
      console.error("❌ Employee is outside all allowed check-in locations.");
      return res.status(403).json({ error: "You are outside all allowed check-in locations. Attendance not marked." });
    }

    // ✅ Normalize Date for Attendance Record
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to ensure date-only comparison
    console.log("📅 Normalized Attendance Date:", today);

    // ✅ Find Existing Attendance Record
    let attendance = await Attendance.findOne({ employeeId: employeeID, date: today });

    if (!attendance) {
      console.log("📌 No existing attendance record found. Creating new record...");
      // ✅ Create New Attendance Record
      attendance = new Attendance({
        employeeId: employeeID,
        checkIn: checkType === "Check-In" ? getCurrentTime() : "",
        checkOut: checkType === "Check-Out" ? getCurrentTime() : "",
        date: today,
      });
    } else {
      console.log("📌 Existing attendance record found:", attendance);

      // ✅ Update Existing Attendance Record
      if (checkType === "Check-In") {
        if (attendance.checkIn) {
          console.error("⚠️ Employee has already checked in today.");
          return res.status(400).json({ error: "You have already checked in today." });
        }
        attendance.checkIn = getCurrentTime();
        console.log("✅ Check-In Updated:", attendance.checkIn);
      } else if (checkType === "Check-Out") {
        if (attendance.checkOut) {
          console.error("⚠️ Employee has already checked out today.");
          return res.status(400).json({ error: "You have already checked out today." });
        }
        attendance.checkOut = getCurrentTime();
        console.log("✅ Check-Out Updated:", attendance.checkOut);
      }
    }

    await attendance.save();
    console.log(`✅ ${checkType} successful for ${employee.fullName}`);
    res.json({ message: `✅ ${checkType} successful.` });

  } catch (error) {
    console.error("❌ Error processing attendance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Helper Function to Get Current Time in HH:MM AM/PM format
function getCurrentTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

module.exports = router;
