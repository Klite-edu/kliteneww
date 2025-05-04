import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./panellogin.css";
import sidebarConfig from "../configs/Sidebarconfig";
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";
import { BsMicrosoft } from "react-icons/bs";
import googlelogo from "../../assets/images.jpeg";

const PanelLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/login`,
        { email, password },
        { withCredentials: true }
      );
      const { role } = response.data;
      const config = sidebarConfig[role];
      const redirectPath = config && config[0]?.path;
      navigate(redirectPath || "/");
    } catch (error) {
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/register`,
        { email, password },
        { withCredentials: true }
      );
      alert("Registration successful! Please log in.");
      setIsRegistering(false);
    } catch (error) {
      setError("Error registering user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  const handleMicrosoftLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/login`;
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
  };

  return (
    <div className="panel-login-container">
      <div className="panel-login-card">
        <div className="panel-login-header">
          <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
          <p className="panel-login-subtitle">
            {isRegistering
              ? "Register for admin access"
              : "Sign in to access the dashboard"}
          </p>
        </div>

        {error && <div className="panel-error-message">{error}</div>}

        <form
          onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit}
        >
          <div className="panel-input-group">
            <FiMail 
              style={{ 
                position: "absolute", 
                left: "16px", 
                top: "50%", 
                transform: "translateY(-50%)",
                color: "var(--text-light)" 
              }} 
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ paddingLeft: "45px" }}
            />
          </div>
          <div className="panel-input-group">
            <FiLock 
              style={{ 
                position: "absolute", 
                left: "16px", 
                top: "50%", 
                transform: "translateY(-50%)",
                color: "var(--text-light)" 
              }} 
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingLeft: "45px" }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: "pointer" }}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>

          <button 
            type="submit" 
            className="panel-submit-btn"
            disabled={isLoading}
          >
            {isLoading 
              ? "Processing..." 
              : isRegistering 
                ? "Create Account" 
                : "Sign In"
            }
          </button>
        </form>

        <div className="or-divider">or continue with</div>

        <div className="google-login-wrapper">
          <button
            onClick={handleGoogleLogin}
            className="google-login-btn"
          >
            <FaGoogle size={18} />
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="google-login-wrapper">
          <button 
            onClick={handleMicrosoftLogin} 
            className="google-login-btn"
          >
            <BsMicrosoft size={18} />
            <span>Continue with Microsoft</span>
          </button>
        </div>

        <div className="panel-decoration">
          <div className="panel-decoration-circle"></div>
          <div className="panel-decoration-circle"></div>
          <div className="panel-decoration-circle"></div>
        </div>
      </div>
    </div>
  );
};

export default PanelLogin;