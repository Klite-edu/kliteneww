import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Attendance = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [checkType, setCheckType] = useState("");
  const [location, setLocation] = useState(null);
  const [siteList, setSiteList] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [locationAllowed, setLocationAllowed] = useState(false);

  useEffect(() => {
    fetchEmployeeData();
    fetchSites();
    requestLocationAccess();
  }, []);

  // ✅ Fetch employee details from backend
  const fetchEmployeeData = async () => {
    try {
      const userId = localStorage.getItem("userId"); // Get userId as a string
      console.log("🔹 Stored User ID:", userId);
  
      if (!userId) {
        console.warn("⚠️ No logged-in employee found.");
        return;
      }
  
      console.log("📡 Fetching employee details for ID:", userId);
  
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/employee/${userId}`);
      setEmployee(response.data);
  
      console.log("✅ Employee details fetched:", response.data);
    } catch (error) {
      console.error("❌ Error fetching employee details:", error);
    }
  };
  

  // Fetch site locations from the backend
  const fetchSites = async () => {
    try {
      console.log("📡 Fetching all registered office locations...");
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/attendance/sites`
      );
      setSiteList(response.data);
      console.log("✅ Sites fetched successfully:", response.data);
    } catch (error) {
      console.error("❌ Error fetching sites:", error);
    }
  };

  // Request location access and fetch employee location
  const requestLocationAccess = () => {
    console.log("📡 Requesting geolocation access...");
    if (!navigator.geolocation) {
      alert("⚠️ Geolocation is not supported by your browser.");
      console.error("❌ Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setLocationAllowed(true);
        console.log(
          "✅ Location access granted:",
          `Latitude: ${latitude}, Longitude: ${longitude}`
        );
      },
      (error) => {
        alert("⚠️ Please enable location services to continue.");
        setLocationAllowed(false);
        console.error("❌ Geolocation permission denied:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Function to submit attendance with geofencing validation
  const handleSubmit = async () => {
    console.log("\n📌 Attendance Submission Initiated");
    if (!locationAllowed) {
      alert("⚠️ Location access is required to submit attendance.");
      console.error(
        "❌ Attendance submission blocked - Location access denied."
      );
      return;
    }

    if (!location) {
      alert("⚠️ Unable to fetch location. Please try again.");
      console.error("❌ Attendance submission blocked - No location data.");
      return;
    }

    console.log("🆔 Employee ID:", employee?._id);
    console.log("🕒 Check Type:", checkType);
    console.log(
      "📍 Current Location:",
      `Latitude: ${location.latitude}, Longitude: ${location.longitude}`
    );

    // Check if employee is inside any site radius
    let insideSite = false;

    console.log("🛡️ Validating location against registered office sites...");
    for (const site of siteList) {
      const distance = calculateDistance(
        site.latitude,
        site.longitude,
        location.latitude,
        location.longitude
      );
      console.log(
        `➡️ Checking Site: ${site.name}, Distance: ${distance} meters`
      );

      if (distance <= site.radius) {
        insideSite = true;
        console.log(
          `✅ Employee is inside the allowed area of site: ${site.name}`
        );
        break;
      }
    }

    if (!insideSite) {
      alert(
        "❌ You are outside the allowed check-in area. Attendance not marked."
      );
      console.error("❌ Attendance submission failed - Outside allowed site.");
      return;
    }

    // Submit attendance
    try {
      console.log("📡 Sending attendance data to backend...");
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/attendance/submit`,
        {
          employeeID: employee._id,
          name: employee.name,
          checkType,
          latitude: location.latitude,
          longitude: location.longitude,
        }
      );
      alert(response.data);
      console.log("✅ Attendance submission successful:", response.data);
      setIsCheckedIn(true);
    } catch (error) {
      console.error(
        "❌ Error submitting attendance:",
        error.response?.data || error
      );
      alert(error.response?.data || "⚠️ Error submitting attendance.");
    }
  };

  // Function to calculate distance using Haversine formula
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>📍 Attendance System</h1>
      <p>
        <strong>Employee Name:</strong> {employee?.name}
      </p>
      <p>
        <strong>Email:</strong> {employee?.email}
      </p>

      <br />

      {/* Show Warning if Location is Not Enabled */}
      {!locationAllowed && (
        <p style={{ color: "red" }}>
          ⚠️ Please enable location services to continue.
        </p>
      )}

      {/* Select Check Type */}
      <label>
        <input
          type="radio"
          name="checkType"
          value="Check-In"
          onChange={(e) => setCheckType(e.target.value)}
        />{" "}
        Check-In
      </label>
      <label>
        <input
          type="radio"
          name="checkType"
          value="Check-Out"
          onChange={(e) => setCheckType(e.target.value)}
        />{" "}
        Check-Out
      </label>

      <br />
      <br />

      <button onClick={handleSubmit} disabled={!checkType || !locationAllowed}>
        ✅ Submit Attendance
      </button>

      {isCheckedIn && (
        <button onClick={() => setIsCheckedIn(false)}>🔄 New Attendance</button>
      )}
    </div>
  );
};

export default Attendance;

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// const Attendance = () => {
//   const navigate = useNavigate();
//   const [employee, setEmployee] = useState(null);
//   const [checkType, setCheckType] = useState("");
//   const [isCheckedIn, setIsCheckedIn] = useState(false);

//   useEffect(() => {
//     const storedEmployee = JSON.parse(localStorage.getItem("employee"));
//     if (!storedEmployee) {
//       navigate("/employeeLogin"); // Redirect if no employee is logged in
//     } else {
//       setEmployee(storedEmployee);
//     }
//   }, [navigate]);

//   const handleSubmit = async () => {
//     try {
//       const response = await axios.post("http://localhost:5000/api/attendance/submit", {
//         employeeId: employee.id,
//         name: employee.name,
//         checkType,
//         email: employee.email,
//       });
//       alert(response.data);
//       setIsCheckedIn(true);
//     } catch (error) {
//       alert(error.response.data);
//     }
//   };

//   return (
//     <div style={{ textAlign: "center", padding: "20px" }}>
//       <h1>Attendance System</h1>
//       <p><strong>Employee Name:</strong> {employee?.name}</p>
//       <p><strong>Email:</strong> {employee?.email}</p>
//       <br /><br />
//       <label>
//         <input
//           type="radio"
//           name="checkType"
//           value="Check-In"
//           onChange={(e) => setCheckType(e.target.value)}
//         /> Check-In
//       </label>
//       <label>
//         <input
//           type="radio"
//           name="checkType"
//           value="Check-Out"
//           onChange={(e) => setCheckType(e.target.value)}
//         /> Check-Out
//       </label>
//       <br /><br />
//       <button onClick={handleSubmit} disabled={!checkType}>
//         Submit Attendance
//       </button>
//       {isCheckedIn && (
//         <button onClick={() => setIsCheckedIn(false)}>New Attendance</button>
//       )}
//     </div>
//   );
// };

// export default Attendance;
