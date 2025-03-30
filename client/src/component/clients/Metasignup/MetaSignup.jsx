// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const MetaSignup = () => {
//   const [sessionInfo, setSessionInfo] = useState(null);
//   const [businessAssets, setBusinessAssets] = useState(null);
//   const [loadingAssets, setLoadingAssets] = useState(false);
//   const [openSection, setOpenSection] = useState(null);

//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const code = params.get("code");

//     if (code) {
//       axios
//         .post(`${process.env.REACT_APP_API_URL}/api/meta/exchangetoken`, { code })
//         .then(async (res) => {
//           setSessionInfo(res.data);
//           const token = res.data.access_token;
//           const token_expiry = res.data.token_expiry;

//           try {
//             // Get Business Managers to find business_id
//             const bmsRes = await axios.get(
//               `https://graph.facebook.com/v19.0/me/businesses?fields=id,name&access_token=${token}`
//             );
//             const business_id = bmsRes.data?.data?.[0]?.id;

//             if (!business_id) {
//               console.warn("⚠️ No Business Manager found for this account");
//               return;
//             }

//             // Get WABA info
//             const wabaRes = await axios.get(
//               `https://graph.facebook.com/v19.0/${business_id}/client_whatsapp_business_accounts?access_token=${token}`
//             );

//             const waba_id = wabaRes.data?.data?.[0]?.id;

//             if (!waba_id) {
//               console.warn("⚠️ No WhatsApp Business Account found");
//               return;
//             }

//             // Get Phone Number ID
//             const phoneRes = await axios.get(
//               `https://graph.facebook.com/v19.0/${waba_id}?fields=phone_numbers&access_token=${token}`
//             );

//             const phone_number_id = phoneRes.data?.phone_numbers?.[0]?.id;

//             if (!phone_number_id) {
//               console.warn("⚠️ No Phone Number ID found in WABA");
//               return;
//             }

//             // Save to backend
//             await axios.post(`${process.env.REACT_APP_API_URL}/api/meta/savewaba`, {
//               waba_id,
//               phone_number_id,
//               access_token: token,
//               token_expiry: token_expiry,
//             });

//             console.log("✅ Client saved successfully after token exchange.");
//           } catch (err) {
//             console.error("❌ Error saving client after token exchange:", err.message);
//           }

//           window.history.replaceState(null, "", window.location.pathname);
//         })
//         .catch((err) => {
//           console.error("❌ Token exchange failed:", err);
//         });
//     }

//     window.addEventListener("message", (event) => {
//       if (
//         event.origin !== "https://www.facebook.com" &&
//         event.origin !== "https://web.facebook.com"
//       ) {
//         return;
//       }

//       try {
//         const data =
//           typeof event.data === "string" ? JSON.parse(event.data) : event.data;

//         if (data.type === "WA_EMBEDDED_SIGNUP") {
//           if (data.event === "FINISH") {
//             const { phone_number_id, waba_id } = data.data;

//             axios.post(`${process.env.REACT_APP_API_URL}/api/meta/savewaba`, {
//               phone_number_id,
//               waba_id,
//               access_token: sessionInfo?.access_token || "",
//               token_expiry: sessionInfo?.token_expiry || "",
//             });
//           }
//         }
//       } catch (e) {
//         console.log("Non JSON Response:", event.data);
//       }
//     });
//   }, []);

//   useEffect(() => {
//     if (sessionInfo?.access_token) {
//       const fetchAssets = async () => {
//         setLoadingAssets(true);
//         try {
//           const token = sessionInfo.access_token;

//           const [pages, adAccounts, bms] = await Promise.all([
//             axios.get(`https://graph.facebook.com/v19.0/me/accounts?fields=name,category,access_token,link,instagram_business_account&access_token=${token}`),
//             axios.get(`https://graph.facebook.com/v19.0/me/adaccounts?fields=account_id,name,status,currency,amount_spent&access_token=${token}`),
//             axios.get(`https://graph.facebook.com/v19.0/me/businesses?fields=id,name,created_time,permitted_tasks&access_token=${token}`),
//           ]);

//           setBusinessAssets({
//             pages: pages.data?.data || [],
//             adAccounts: adAccounts.data?.data || [],
//             businessManagers: bms.data?.data || [],
//           });
//         } catch (err) {
//           console.error("❌ Failed to fetch business assets:", err.message);
//         }
//         setLoadingAssets(false);
//       };

//       fetchAssets();
//     }
//   }, [sessionInfo]);

//   const launchWhatsAppSignup = () => {
//     const redirectUri = encodeURIComponent("https://app.autopilotmybusiness.com/metasignup");
//     const clientId = "626674156971996";
//     const loginUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=whatsapp_business_management,business_management,pages_show_list,ads_management,instagram_basic`;
//     window.location.href = loginUrl;
//   };

//   const toggleSection = (key) => {
//     setOpenSection(openSection === key ? null : key);
//   };

//   const displayItems = (label, key, renderFunc) => (
//     <div>
//       <h4 onClick={() => toggleSection(key)} style={styles.toggleHeader}>
//         {label} <span>{openSection === key ? ' 🔽' : ' ▶️'}</span>
//       </h4>
//       {openSection === key && (
//         <ul style={styles.list}>
//           {businessAssets[key].map(renderFunc)}
//         </ul>
//       )}
//     </div>
//   );

//   return (
//     <div style={styles.container}>
//       <h2 style={styles.heading}>🚀 Meta Signup & Asset Viewer</h2>
//       <button onClick={launchWhatsAppSignup} style={styles.button}>Login with Facebook</button>

//       <div style={styles.card}>
//         <h3 style={styles.subheading}>🧾 Session Info</h3>
//         <pre style={styles.pre}>{sessionInfo ? JSON.stringify(sessionInfo, null, 2) : "No session info yet."}</pre>
//       </div>

//       <div style={styles.card}>
//         <h3 style={styles.subheading}>🔗 Connected Business Assets</h3>
//         {loadingAssets ? <p>Loading assets...</p> : (
//           businessAssets ? (
//             <>
//               {displayItems('🏢 Business Managers', 'businessManagers', (item) => (
//                 <li key={item.id} style={styles.listItem}>
//                   <strong>{item.name}</strong><br />
//                   ID: {item.id}<br />
//                   Created: {item.created_time}<br />
//                   Tasks: {item.permitted_tasks?.join(', ')}
//                 </li>
//               ))}

//               {displayItems('📄 Pages', 'pages', (item) => (
//                 <li key={item.id} style={styles.listItem}>
//                   <strong>{item.name}</strong> ({item.category})<br />
//                   ID: {item.id}<br />
//                   {item.link && <a href={item.link} target="_blank" rel="noreferrer">Visit Page</a>}<br />
//                   {item.instagram_business_account && (
//                     <span>Connected IG ID: {item.instagram_business_account.id}</span>
//                   )}
//                 </li>
//               ))}

//               {displayItems('📈 Ad Accounts', 'adAccounts', (item) => (
//                 <li key={item.id} style={styles.listItem}>
//                   <strong>{item.name}</strong><br />
//                   ID: {item.account_id}<br />
//                   Status: {item.status}<br />
//                   Currency: {item.currency}<br />
//                   Spent: {item.amount_spent / 100} {item.currency}
//                 </li>
//               ))}
//             </>
//           ) : <p>No assets found.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// const styles = {
//   container: {
//     padding: 30,
//     fontFamily: "Arial, sans-serif",
//     backgroundColor: "#f4f8fb",
//     minHeight: "100vh",
//   },
//   heading: {
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   button: {
//     display: "block",
//     backgroundColor: "#1877f2",
//     color: "#fff",
//     border: "none",
//     padding: "10px 25px",
//     fontSize: 16,
//     fontWeight: "bold",
//     borderRadius: 6,
//     cursor: "pointer",
//     margin: "0 auto 30px",
//   },
//   card: {
//     backgroundColor: "#fff",
//     padding: 20,
//     marginBottom: 30,
//     borderRadius: 10,
//     boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
//   },
//   subheading: {
//     fontSize: 20,
//     marginBottom: 10,
//   },
//   pre: {
//     backgroundColor: "#f0f0f0",
//     padding: 12,
//     borderRadius: 6,
//     maxHeight: 300,
//     overflowY: "auto",
//     fontSize: 14,
//   },
//   toggleHeader: {
//     cursor: "pointer",
//     fontSize: 18,
//     marginTop: 10,
//     marginBottom: 5,
//     backgroundColor: "#e8f0fe",
//     padding: "8px 12px",
//     borderRadius: 5,
//   },
//   list: {
//     paddingLeft: 20,
//   },
//   listItem: {
//     marginBottom: 10,
//     backgroundColor: "#f9f9f9",
//     padding: 10,
//     borderRadius: 6,
//     border: "1px solid #ddd",
//   },
// };

// export default MetaSignup;



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
            }).then(() => {
              console.log("✅ Client info saved after embedded signup.");
            }).catch((err) => {
              console.error("❌ Failed to save WABA after embedded signup:", err.message);
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
