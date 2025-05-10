import React, { useEffect, useState, useCallback, useRef } from "react";
import io from "socket.io-client";
import QRCode from "react-qr-code";
import axios from "axios";
import "./seleniumweb.css";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

const SeleniumWeb = () => {
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) console.log("[Component] Initializing SeleniumWeb component");

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
  const [companyName, setCompanyName] = useState(null);
  const [id, setId] = useState("");
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          {
            withCredentials: true,
          }
        );

        console.log("📦 /api/get-token response:", res.data);

        if (res.data?.token) {
          const payload = JSON.parse(atob(res.data.token.split(".")[1]));
          console.log("✅ Token Payload:", payload);
          setCompanyName(payload.companyName);
          window.companyName = payload.companyName;
          return;
        }
        setId(res.data.id);
        console.warn(
          "⚠️ Token missing in /api/get-token response. Trying cookie fallback..."
        );
        const cookieToken = getCookie("token");
        if (cookieToken) {
          const payload = JSON.parse(atob(cookieToken.split(".")[1]));
          setCompanyName(payload.companyName);
          window.companyName = payload.companyName;
          console.log(
            "✅ Extracted companyName from cookie:",
            payload.companyName
          );
        } else {
          console.error(
            "❌ Could not extract companyName from token or cookie."
          );
        }
      } catch (err) {
        console.error("❌ Error fetching companyName:", err.message);
      }
    };

    fetchCompanyName();
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const tokenRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
        { withCredentials: true }
      );
      const userToken = tokenRes.data.token;

      const [roleRes, permissionsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${userToken}` },
        }),
        axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${userToken}` },
          }
        ),
      ]);

      setRole(roleRes.data.role);
      setCustomPermissions(permissionsRes.data.permissions || {});
    } catch (error) {
      console.error("❌ Error fetching initial data:", error);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/whatsapp/status`,
        { withCredentials: true }
      );
      if (!isMounted.current) return;

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
        setStatusMessage(qr ? "📲 Waiting for QR scan..." : "❌ Disconnected");
      } else {
        setStatusMessage("📡 Initializing client...");
      }
    } catch (err) {
      setConnected(false);
      setPhoneNumber("");
      setQr("");
      setStatusMessage("❌ Error checking status (401?)");
    }
  }, [qr]);

  useEffect(() => {
    if (!companyName) return;

    const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);
    console.log("🔌 Socket created. Joining room:", companyName);

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      newSocket.emit("join-room", companyName);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [companyName]);

  useEffect(() => {
    if (!socket || !companyName) return;

    const onQr = (qrData) => {
      console.log("📲 QR received", qrData);
      setQr(typeof qrData === "string" ? qrData : qrData.qr);
      setStatusMessage("📲 Waiting for QR scan...");
    };

    const onReady = () => {
      console.log("✅ WhatsApp client is ready");
      checkStatus();
    };

    const onAuthenticated = () => {
      console.log("🔐 WhatsApp authenticated");
      setStatusMessage("🔐 Authenticated");
    };

    const onWhatsappDisconnected = () => {
      setStatusMessage("❌ WhatsApp disconnected");
      setConnected(false);
      setQr("waiting");
      setPhoneNumber("");
    };

    socket.on("whatsapp-qr", onQr);
    socket.on("whatsapp-ready", onReady);
    socket.on("whatsapp-authenticated", onAuthenticated);
    socket.on("whatsapp-disconnected", onWhatsappDisconnected);

    checkStatus();

    return () => {
      socket.off("whatsapp-qr", onQr);
      socket.off("whatsapp-ready", onReady);
      socket.off("whatsapp-authenticated", onAuthenticated);
      socket.off("whatsapp-disconnected", onWhatsappDisconnected);
    };
  }, [socket, checkStatus]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/whatsapp/disconnect`,
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        setConnected(false);
        setPhoneNumber("");
        setQr("");
        setStatusMessage("❌ Disconnected");
        await checkStatus();
      } else {
        // even if already disconnected, treat as success
        setConnected(false);
        setPhoneNumber("");
        setQr("");
        setStatusMessage("ℹ️ Already disconnected");
      }
    } catch (err) {
      setStatusMessage("❌ Error disconnecting");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      setStatusMessage("⏳ Connecting...");

      const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
        path: "/socket.io",
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket.id);
        newSocket.emit("join-room", companyName);
      });

      setSocket(newSocket);

      // 🔁 Call the connect route — QR will always be triggered now
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/whatsapp/connect`,
        {},
        { withCredentials: true }
      );

      console.log("✅ Connect request successful:", res.data);
      setStatusMessage("📲 Waiting for QR scan...");
    } catch (err) {
      console.error("❌ Connect error:", err);
      setStatusMessage("❌ Failed to trigger connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar id={id} role={role} />
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
                  <span className="button-spinner"></span> Connecting...
                </>
              ) : (
                <>
                  <span className="whatsapp-icon"></span> Connect Device
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
                  Task delegation will send WhatsApp notifications.
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
                  <span className="button-spinner"></span> Disconnecting...
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
