import React, { useEffect, useState } from "react";
import axios from "axios";

const MetaSignup = () => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [businessAssets, setBusinessAssets] = useState(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      axios
        .post(`${process.env.REACT_APP_API_URL}/api/meta/exchangetoken`, { code })
        .then((res) => {
          setSessionInfo(res.data);
          window.history.replaceState(null, "", window.location.pathname);
        })
        .catch((err) => {
          console.error("❌ Token exchange failed:", err);
        });
    }

    window.addEventListener("message", (event) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH") {
            const { phone_number_id, waba_id } = data.data;

            axios.post(`${process.env.REACT_APP_API_URL}/api/meta/savewaba`, {
              phone_number_id,
              waba_id,
              access_token: sessionInfo?.access_token || "",
              token_expiry: sessionInfo?.token_expiry || "",
            });
          }
        }
      } catch (e) {
        console.log("Non JSON Response:", event.data);
      }
    });
  }, []);

  useEffect(() => {
    if (sessionInfo?.access_token) {
      const fetchAssets = async () => {
        setLoadingAssets(true);
        try {
          const token = sessionInfo.access_token;

          const [pages, adAccounts, bms] = await Promise.all([
            axios.get(`https://graph.facebook.com/v19.0/me/accounts?fields=name,category,access_token,link,instagram_business_account&access_token=${token}`),
            axios.get(`https://graph.facebook.com/v19.0/me/adaccounts?fields=account_id,name,status,currency,amount_spent&access_token=${token}`),
            axios.get(`https://graph.facebook.com/v19.0/me/businesses?fields=id,name,created_time,permitted_tasks&access_token=${token}`),
          ]);

          setBusinessAssets({
            pages: pages.data?.data || [],
            adAccounts: adAccounts.data?.data || [],
            businessManagers: bms.data?.data || [],
          });
        } catch (err) {
          console.error("❌ Failed to fetch business assets:", err.message);
        }
        setLoadingAssets(false);
      };

      fetchAssets();
    }
  }, [sessionInfo]);

  const launchWhatsAppSignup = () => {
    const redirectUri = encodeURIComponent("https://app.autopilotmybusiness.com/metasignup");
    const clientId = "626674156971996";
    const loginUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=whatsapp_business_management,business_management,pages_show_list,ads_management,instagram_basic`;
    window.location.href = loginUrl;
  };

  const toggleSection = (key) => {
    setOpenSection(openSection === key ? null : key);
  };

  const displayItems = (label, key, renderFunc) => (
    <div>
      <h4 onClick={() => toggleSection(key)} style={styles.toggleHeader}>
        {label} <span>{openSection === key ? ' 🔽' : ' ▶️'}</span>
      </h4>
      {openSection === key && (
        <ul style={styles.list}>
          {businessAssets[key].map(renderFunc)}
        </ul>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🚀 Meta Signup & Asset Viewer</h2>
      <button onClick={launchWhatsAppSignup} style={styles.button}>Login with Facebook</button>

      <div style={styles.card}>
        <h3 style={styles.subheading}>🧾 Session Info</h3>
        <pre style={styles.pre}>{sessionInfo ? JSON.stringify(sessionInfo, null, 2) : "No session info yet."}</pre>
      </div>

      <div style={styles.card}>
        <h3 style={styles.subheading}>🔗 Connected Business Assets</h3>
        {loadingAssets ? <p>Loading assets...</p> : (
          businessAssets ? (
            <>
              {displayItems('🏢 Business Managers', 'businessManagers', (item) => (
                <li key={item.id} style={styles.listItem}>
                  <strong>{item.name}</strong><br />
                  ID: {item.id}<br />
                  Created: {item.created_time}<br />
                  Tasks: {item.permitted_tasks?.join(', ')}
                </li>
              ))}

              {displayItems('📄 Pages', 'pages', (item) => (
                <li key={item.id} style={styles.listItem}>
                  <strong>{item.name}</strong> ({item.category})<br />
                  ID: {item.id}<br />
                  {item.link && <a href={item.link} target="_blank" rel="noreferrer">Visit Page</a>}<br />
                  {item.instagram_business_account && (
                    <span>Connected IG ID: {item.instagram_business_account.id}</span>
                  )}
                </li>
              ))}

              {displayItems('📈 Ad Accounts', 'adAccounts', (item) => (
                <li key={item.id} style={styles.listItem}>
                  <strong>{item.name}</strong><br />
                  ID: {item.account_id}<br />
                  Status: {item.status}<br />
                  Currency: {item.currency}<br />
                  Spent: {item.amount_spent / 100} {item.currency}
                </li>
              ))}
            </>
          ) : <p>No assets found.</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: 30,
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f8fb",
    minHeight: "100vh",
  },
  heading: {
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    display: "block",
    backgroundColor: "#1877f2",
    color: "#fff",
    border: "none",
    padding: "10px 25px",
    fontSize: 16,
    fontWeight: "bold",
    borderRadius: 6,
    cursor: "pointer",
    margin: "0 auto 30px",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 30,
    borderRadius: 10,
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
  },
  subheading: {
    fontSize: 20,
    marginBottom: 10,
  },
  pre: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 6,
    maxHeight: 300,
    overflowY: "auto",
    fontSize: 14,
  },
  toggleHeader: {
    cursor: "pointer",
    fontSize: 18,
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "#e8f0fe",
    padding: "8px 12px",
    borderRadius: 5,
  },
  list: {
    paddingLeft: 20,
  },
  listItem: {
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ddd",
  },
};

export default MetaSignup;



// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const MetaSignup = () => {
//   const [sessionInfo, setSessionInfo] = useState(null);
//   const [sdkResponse, setSdkResponse] = useState(null);
//   const [accessToken, setAccessToken] = useState("");
//   const [tokenExpiry, setTokenExpiry] = useState("");
//   const [pages, setPages] = useState([]);
//   const [adAccounts, setAdAccounts] = useState([]);
//   const [businesses, setBusinesses] = useState([]);

//   useEffect(() => {
//     const loadFbSdk = () => {
//       if (document.getElementById("facebook-jssdk")) {
//         console.log("⚠️ Facebook SDK already loaded.");
//         return;
//       }

//       console.log("📥 Loading Facebook SDK...");

//       const js = document.createElement("script");
//       js.id = "facebook-jssdk";
//       js.src = "https://connect.facebook.net/en_US/sdk.js";
//       js.async = true;
//       js.defer = true;
//       document.body.appendChild(js);

//       js.onload = () => {
//         console.log("✅ Facebook SDK Loaded. Initializing...");
//         window.FB.init({
//           appId: process.env.REACT_APP_META_APP_ID || "626674156971996",
//           autoLogAppEvents: true,
//           xfbml: true,
//           version: "v22.0",
//         });
//         console.log("✅ Facebook SDK Initialized!");
//       };
//     };

//     loadFbSdk();

//     const handleMessage = (event) => {
//       if (
//         event.origin !== "https://www.facebook.com" &&
//         event.origin !== "https://web.facebook.com"
//       ) {
//         console.warn("❌ Ignored message from unknown origin:", event.origin);
//         return;
//       }

//       try {
//         const data =
//           typeof event.data === "string" ? JSON.parse(event.data) : event.data;

//         console.log("📨 Incoming message from FB:", data);

//         if (data.type === "WA_EMBEDDED_SIGNUP") {
//           if (data.event === "FINISH") {
//             console.log("📬 Received WA_EMBEDDED_SIGNUP FINISH event:", data);

//             const { phone_number_id, waba_id, business_name } = data.data;

//             axios
//               .post(`${process.env.REACT_APP_API_URL}/api/meta/savewaba`, {
//                 business_name,
//                 waba_id,
//                 phone_number_id,
//                 access_token: accessToken,
//                 token_expiry: tokenExpiry,
//               })
//               .then((res) => {
//                 console.log("✅ WABA saved to backend:", res.data);
//                 alert("✅ WABA Saved Successfully!");
//               })
//               .catch((err) => {
//                 console.error("❌ Failed to save WABA:", err);
//                 alert("❌ Failed to save WABA!");
//               });
//           } else if (data.event === "CANCEL") {
//             console.warn("⚠️ User cancelled signup.");
//           } else if (data.event === "ERROR") {
//             console.error("❌ Error during signup:", data.data.error_message);
//           }
//         }

//         setSessionInfo(data);
//       } catch (error) {
//         console.log("⚠️ Could not parse FB message.");
//       }
//     };

//     window.addEventListener("message", handleMessage);
//     return () => window.removeEventListener("message", handleMessage);
//   }, [accessToken, tokenExpiry]);

//   const fbLoginCallback = (response) => {
//     console.log("📥 FB Login Callback Response:", response);

//     if (response.authResponse?.code) {
//       const code = response.authResponse.code;

//       console.log("🔄 Sending auth code to exchange-token:", code);

//       axios
//         .post(`${process.env.REACT_APP_API_URL}/api/meta/exchangetoken`, {
//           code,
//         })
//         .then((res) => {
//           console.log("✅ Token exchange response:", res.data);
//           const { access_token, token_expiry } = res.data;

//           setAccessToken(access_token);
//           setTokenExpiry(token_expiry);

//           console.log("🔑 Access Token:", access_token);
//           console.log("🕐 Token Expiry:", token_expiry);

//           alert("✅ Access token received.");
//           fetchBusinessAssets(access_token);
//         })
//         .catch((err) => {
//           console.error("❌ Token exchange failed! Error:", err);
//           alert("❌ Failed to exchange token!");
//         });
//     } else {
//       console.warn("⚠️ No auth code returned from login.");
//     }

//     setSdkResponse(response);
//   };

//   const launchWhatsAppSignup = () => {
//     if (!window.FB) {
//       console.error("❌ Facebook SDK not loaded.");
//       return;
//     }

//     console.log("🚀 Launching Facebook Login...");
//     console.log("📍 Fallback redirect URI:", "https://app.autopilotmybusiness.com/metasignup");

//     window.FB.login(fbLoginCallback, {
//       config_id: "669361018880973", // Your WhatsApp Config ID
//       response_type: "code",
//       override_default_response_type: true,
//       scope:
//         "business_management,whatsapp_business_management,whatsapp_business_messaging",
//       extras: {
//         setup: {},
//         featureType: "",
//         sessionInfoVersion: "2",
//       },
//       fallback_redirect_uri: "https://app.autopilotmybusiness.com/metasignup/",
//     });
//   };

//   const fetchBusinessAssets = (token) => {
//     if (!window.FB) {
//       console.error("❌ Facebook SDK not loaded.");
//       return;
//     }

//     console.log("📡 Fetching business assets with token:", token);

//     // Fetch Businesses
//     window.FB.api(
//       "/me/businesses",
//       "GET",
//       { access_token: token },
//       function (response) {
//         console.log("📊 Fetched Businesses:", response);
//         if (response && !response.error) {
//           setBusinesses(response.data || []);
//         }
//       }
//     );

//     // Fetch Pages
//     window.FB.api(
//       "/me/accounts",
//       "GET",
//       { access_token: token },
//       function (response) {
//         console.log("📘 Fetched Pages:", response);
//         if (response && !response.error) {
//           setPages(response.data || []);
//         }
//       }
//     );

//     // Fetch Ad Accounts
//     window.FB.api(
//       "/me/adaccounts",
//       "GET",
//       { access_token: token },
//       function (response) {
//         console.log("📈 Fetched Ad Accounts:", response);
//         if (response && !response.error) {
//           setAdAccounts(response.data || []);
//         }
//       }
//     );
//   };

//   return (
//     <div style={styles.container}>
//       <div id="fb-root"></div>

//       <h2>Meta Business Management Signup</h2>

//       <button style={styles.button} onClick={launchWhatsAppSignup}>
//         Login with Facebook & Launch Signup
//       </button>

//       <div style={styles.section}>
//         <h3>Session Info:</h3>
//         <pre style={styles.pre}>
//           {sessionInfo
//             ? JSON.stringify(sessionInfo, null, 2)
//             : "No session info yet"}
//         </pre>
//       </div>

//       <div style={styles.section}>
//         <h3>SDK Response:</h3>
//         <pre style={styles.pre}>
//           {sdkResponse
//             ? JSON.stringify(sdkResponse, null, 2)
//             : "No SDK response yet"}
//         </pre>
//       </div>

//       <div style={styles.section}>
//         <h3>Fetched Business Assets</h3>
//         <div style={styles.assetBox}>
//           <h4>Businesses</h4>
//           {businesses.length ? (
//             businesses.map((biz, i) => (
//               <div key={i} style={styles.item}>
//                 <strong>ID:</strong> {biz.id} <br />
//                 <strong>Name:</strong> {biz.name}
//               </div>
//             ))
//           ) : (
//             <p>No businesses found.</p>
//           )}
//         </div>

//         <div style={styles.assetBox}>
//           <h4>Pages</h4>
//           {pages.length ? (
//             pages.map((page, i) => (
//               <div key={i} style={styles.item}>
//                 <strong>ID:</strong> {page.id} <br />
//                 <strong>Name:</strong> {page.name}
//               </div>
//             ))
//           ) : (
//             <p>No pages found.</p>
//           )}
//         </div>

//         <div style={styles.assetBox}>
//           <h4>Ad Accounts</h4>
//           {adAccounts.length ? (
//             adAccounts.map((ad, i) => (
//               <div key={i} style={styles.item}>
//                 <strong>ID:</strong> {ad.id} <br />
//                 <strong>Name:</strong> {ad.name || "N/A"}
//               </div>
//             ))
//           ) : (
//             <p>No ad accounts found.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// const styles = {
//   container: {
//     padding: "20px",
//     fontFamily: "Arial, sans-serif",
//     maxWidth: "800px",
//     margin: "0 auto",
//   },
//   button: {
//     backgroundColor: "#1877f2",
//     border: 0,
//     borderRadius: "4px",
//     color: "#fff",
//     cursor: "pointer",
//     fontSize: "16px",
//     fontWeight: "bold",
//     height: "40px",
//     padding: "0 24px",
//     marginBottom: "20px",
//   },
//   section: {
//     marginTop: "20px",
//   },
//   pre: {
//     backgroundColor: "#f5f5f5",
//     padding: "10px",
//     borderRadius: "4px",
//     maxHeight: "300px",
//     overflowY: "auto",
//   },
//   assetBox: {
//     marginTop: "20px",
//     padding: "10px",
//     border: "1px solid #ccc",
//     borderRadius: "6px",
//     backgroundColor: "#fafafa",
//   },
//   item: {
//     marginBottom: "10px",
//     padding: "10px",
//     borderBottom: "1px solid #eee",
//   },
// };

// export default MetaSignup;
