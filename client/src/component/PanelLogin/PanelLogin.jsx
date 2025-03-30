import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./panellogin.css";
import sidebarConfig from "../configs/Sidebarconfig";

const PanelLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/login`, { email, password });
      const { token, userId, role } = response.data;
  
      // ✅ Store user details in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
      localStorage.setItem("userId", userId); // Store User ID
      localStorage.setItem("role", role);
  
      console.log("🔹 Stored User ID:", userId);
      console.log("🔹 Stored Email:", email);
      console.log("🔹 User Role:", role);
  
      // Redirect user based on role
      const config = sidebarConfig[role]; // Fetch sidebar configuration
      const redirectPath = config && config[0]?.path;
      navigate(redirectPath || "/");
    } catch (error) {
      console.error("❌ Login Error:", error);
      setError("Invalid email or password");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/register`, { email, password });
      alert("Registration successful! Please log in.");
      setIsRegistering(false); // Switch to login after successful registration
    } catch (error) {
      console.error("❌ Registration Error:", error);
      setError("Error registering user");
    }
  };

  return (
    <div className="login-container">
      {isRegistering ? (
        <form className="login-form" onSubmit={handleRegisterSubmit}>
          <h2>Register</h2>
          {error && <p className="error-message">{error}</p>}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">Register</button>
          <p>
            Already have an account?{" "}
            <span
              style={{ cursor: "pointer", color: "#1e90ff" }}
              onClick={() => setIsRegistering(false)}
            >
              Login here
            </span>
          </p>
        </form>
      ) : (
        <form className="login-form" onSubmit={handleLoginSubmit}>
          <h2>Login</h2>
          {error && <p className="error-message">{error}</p>}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">Login</button>
          <p>
            Don't have an account?{" "}
            <span
              style={{ cursor: "pointer", color: "#1e90ff" }}
              onClick={() => setIsRegistering(true)}
            >
              Register here
            </span>
          </p>
        </form>
      )}
    </div>
  );
};

export default PanelLogin;


// import React, { useState } from "react";
// import axios from "axios";
// import "./panellogin.css";
// import { useNavigate } from "react-router-dom";
// import sidebarConfig from "../configs/Sidebarconfig";

// const PanelLogin = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [otp, setOtp] = useState(""); // State for OTP
//   const [error, setError] = useState("");
//   const [isOtpLogin, setIsOtpLogin] = useState(false); // Flag for OTP login
//   const navigate = useNavigate();

//   const handleLoginSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       // Post login request with email and password
//       const response = await axios.post("http://localhost:5000/api/admin/login", { email, password });
//       const { token, otpRequired } = response.data;  // Assuming backend sends otpRequired flag

//         localStorage.setItem("token", token);
//         localStorage.setItem("email", email);
//         navigate("/dashboard"); // Redirect to dashboard after successful login

//       const decodedToken = JSON.parse(atob(token.split(".")[1]));
//       localStorage.setItem("role", decodedToken.role);

//       const role = decodedToken.role;
//       console.log("role", role);

//       // Fetch sidebar configuration based on role
//       if (role) {
//         const config = sidebarConfig[role];  // Get sidebar config based on the role

//         if (config) {
//           // You can optionally use the sidebar config here
//           console.log("Sidebar Configuration:", config);
//         }

//         // Redirect to the first path of the sidebar for that role
//         const redirectPath = config && config[0].path;
//         navigate(redirectPath || "/");
//       }
//     } catch (error) {
//       setError("Invalid email or password");
//     }
//   };

//   const handleOtpSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const response = await axios.post("http://localhost:5000/api/admin/login", { email, password, otp });
//       if (response.data.token) {
//         localStorage.setItem("token", response.data.token);
//         navigate("/admin-dashboard");
//       }
//     } catch (error) {
//       setError("Invalid OTP");
//     }
//   };

//   const toggleOtpLogin = () => {
//     setIsOtpLogin(!isOtpLogin); // Toggle OTP login mode
//     setError(""); // Clear any existing errors
//     setOtp(""); // Reset OTP input
//   };

//   return (
//     <div className="login-container">
//       {!isOtpLogin ? (
//         <form className="login-form" onSubmit={handleLoginSubmit}>
//           <h2>Login</h2>
//           {error && <p className="error-message">{error}</p>}
//           <div className="input-group">
//             <label>Email</label>
//             <input
//               type="email"
//               placeholder="Enter your email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//           </div>
//           <div className="input-group">
//             <label>Password</label>
//             <input
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>
//           <button type="submit" className="login-btn">Login</button>
//           <p className="toggle-otp" onClick={toggleOtpLogin}>
//             Use OTP to login
//           </p>
//         </form>
//       ) : (
//         <form className="login-form" onSubmit={handleOtpSubmit}>
//           <h2>OTP Login</h2>
//           {error && <p className="error-message">{error}</p>}
//           <div className="input-group">
//             <label>OTP</label>
//             <input
//               type="text"
//               placeholder="Enter OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value)}
//               required
//             />
//           </div>
//           <button type="submit" className="login-btn">Submit OTP</button>
//           <p className="toggle-otp" onClick={toggleOtpLogin}>
//             Back to Manual Login
//           </p>
//         </form>
//       )}
//     </div>
//   );
// };

// export default PanelLogin;




// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import sidebarConfig from "../configs/Sidebarconfig";

// const PanelLogin = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [otp, setOtp] = useState("");
//   const [isOtpRequired, setIsOtpRequired] = useState(false); 
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleLoginSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post("http://localhost:5000/api/admin/login", { email, password });
//       const { token, otpRequired } = response.data;  

//       const decodedToken = JSON.parse(atob(token.split(".")[1]));
//       localStorage.setItem("role", decodedToken.role);

//       const role = decodedToken.role;
//       console.log("role", role);

//       // Fetch sidebar configuration based on role
//       if (role) {
//         const config = sidebarConfig[role];  // Get sidebar config based on the role

//         if (config) {
//           // You can optionally use the sidebar config here
//           console.log("Sidebar Configuration:", config);
//         }

//         // Redirect to the first path of the sidebar for that role
//         const redirectPath = config && config[0].path;
//         navigate(redirectPath || "/");
//       }
//     } catch (error) {
//       setError("Invalid email or password");
//     }

//   };

//   const handleOtpSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post("http://localhost:5000/api/admin/login", { email, otp });
//       if (response.data.token) {
//         localStorage.setItem("token", response.data.token);
//         navigate("/dashboard");
//       }
//     } catch (error) {
//       setError("Invalid OTP");
//     }
//   };

//   return (
//     <div className="login-container">
//       {!isOtpRequired ? (
//         <form className="login-form" onSubmit={handleLoginSubmit}>
//           <h2>Login</h2>
//           {error && <p className="error-message">{error}</p>}
//           <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
//           <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
//           <button type="submit">Login</button>
//         </form>
//       ) : (
//         <form className="login-form" onSubmit={handleOtpSubmit}>
//           <h2>Enter OTP</h2>
//           <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
//           <button type="submit">Submit OTP</button>
//         </form>
//       )}
//     </div>
//   );
// };

// export default PanelLogin;






