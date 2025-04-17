import React, { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import QRCode from "react-qr-code";
import axios from "axios";
import "./seleniumweb.css";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

const SeleniumWeb = () => {
  const [qr, setQr] = useState("");
  const [connected, setConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const [statusMessage, setStatusMessage] = useState(
    "Checking WhatsApp status..."
  );
  const [socket, setSocket] = useState(null);

  const fetchInitialData = useCallback(async () => {
    try {
      console.log("🔄 Fetching role and permissions...");
      const [roleRes, permissionsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, {
          withCredentials: true,
        }),
        axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
          {
            withCredentials: true,
          }
        ),
      ]);

      console.log(
        "✅ Role and permissions fetched:",
        roleRes.data,
        permissionsRes.data
      );

      setRole(roleRes.data.role);
      setCustomPermissions(permissionsRes.data.permissions || {});
    } catch (error) {
      console.error("❌ Error fetching initial data:", error);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      console.log("🌐 Checking WhatsApp connection status...");
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/whatsapp/status`,
        { withCredentials: true }
      );

      console.log("✅ Status response:", response.data);

      if (response.data.connected) {
        setConnected(true);
        setPhoneNumber(response.data.phoneNumber || "");
        setQr("");
        setStatusMessage(
          `✅ Connected ${
            response.data.phoneNumber
              ? `(to: ${response.data.phoneNumber})`
              : ""
          }`
        );
      } else if (response.data.state === "DISCONNECTED") {
        setConnected(false);
        setPhoneNumber("");
        if (qr) {
          setStatusMessage("📲 Waiting for QR scan...");
        } else {
          setStatusMessage("❌ Disconnected");
        }
      } else {
        setStatusMessage("📡 Initializing client...");
      }
    } catch (err) {
      console.error("❌ Status check error:", err);
      setConnected(false);
      setPhoneNumber("");
      setQr("");
      setStatusMessage("❌ Error checking status (401?)");
    }
  }, [qr]);

  useEffect(() => {
    fetchInitialData();

    console.log("🧩 Connecting socket...");
    const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    newSocket.onAny((event, ...args) => {
      console.log("📡 Socket Event:", event, args);
    });

    setSocket(newSocket);
    checkStatus(); // initial

    newSocket.on("connect", () => {
      console.log("✅ Socket connected");
      checkStatus();
    });

    newSocket.on("whatsapp-qr", (qrData) => {
      console.log("📲 Received QR code from server");
      setQr(qrData);
      setConnected(false);
      setStatusMessage("📲 Waiting for QR scan...");
    });

    newSocket.on("whatsapp-ready", () => {
      console.log("✅ WhatsApp client is ready");
      checkStatus();
    });

    newSocket.on("whatsapp-authenticated", () => {
      console.log("🔐 WhatsApp authenticated");
      setStatusMessage("🔐 Authenticated");
    });

    newSocket.on("whatsapp-disconnected", (data) => {
      console.log("🔌 WhatsApp client disconnected", data);
      setStatusMessage("❌ WhatsApp disconnected");
      setConnected(false);
      setQr("waiting");
      setPhoneNumber("");
    });

    newSocket.on("disconnect", () => {
      console.warn("🚫 Socket disconnected");
      setStatusMessage("🔌 Connection lost - reconnecting...");
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
      setStatusMessage("❌ Connection error - reconnecting...");
    });

    return () => {
      console.log("🧹 Cleaning up socket...");
      newSocket.disconnect();
    };
  }, [fetchInitialData, checkStatus]);

  const handleDisconnect = async () => {
    setLoading(true);
    console.log("📴 Disconnecting WhatsApp...");
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/whatsapp/disconnect`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        console.log("✅ Disconnected successfully");
        // ✅ Reset state immediately
        setConnected(false);
        setPhoneNumber("");
        setQr("");
        setStatusMessage("❌ Disconnected");

        // ✅ Recheck to force UI refresh if needed
        await checkStatus();
      } else {
        console.warn("⚠️ Failed to disconnect:", response.data.message);
        setStatusMessage("❌ Disconnection failed");
      }
    } catch (err) {
      console.error("❌ Disconnect error:", err);
      setStatusMessage("❌ Error disconnecting");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setStatusMessage("⏳ Connecting...");
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/whatsapp/connect`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("❌ Connection trigger failed:", err.message);
      setStatusMessage("❌ Failed to trigger connection.");
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="whatsapp-connection-container">
        <h1>WhatsApp Web Connection</h1>
        <div className="status-indicator">
          <strong>Status:</strong>{" "}
          <span className={connected ? "connected" : "disconnected"}>
            {statusMessage}
          </span>
        </div>

        {!connected && !qr && (
          <div className="connect-section">
            <button
              className="connect-button"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Connecting...
                </>
              ) : (
                <>
                  <span className="whatsapp-icon"></span>
                  Connect Device
                </>
              )}
            </button>
            <p className="connect-instructions">
              Click above to generate a QR code for WhatsApp Web connection
            </p>
          </div>
        )}

        {!connected && qr && (
          <div className="qr-container">
            <h2>Scan QR Code to Connect WhatsApp</h2>
            <div className="qr-code-wrapper">
              <QRCode value={qr} size={256} level="H" />
            </div>
            <p className="scan-instructions">
              Open WhatsApp → 3 Dot Icon → Linked Devices → Scan QR code
            </p>
          </div>
        )}

        {connected && (
          <div className="connection-success">
            <div className="success-message">
              <span className="success-icon">✓</span>
              <div>
                <p className="success-title">
                  WhatsApp is successfully connected!
                </p>
                <p className="success-subtitle">
                  Task delegation will automatically send WhatsApp
                  notifications.
                </p>
              </div>
            </div>
            {phoneNumber && (
              <p className="connected-number">
                Connected to: <strong>{phoneNumber}</strong>
              </p>
            )}
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="disconnect-button"
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Disconnecting...
                </>
              ) : (
                "Disconnect WhatsApp"
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SeleniumWeb;
