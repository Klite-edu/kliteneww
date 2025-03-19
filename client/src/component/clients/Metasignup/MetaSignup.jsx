// React Frontend Component (MetaSignup.js)
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MetaSignup = () => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [sdkResponse, setSdkResponse] = useState(null);

  useEffect(() => {
    const loadFbSdk = () => {
      if (document.getElementById('facebook-jssdk')) return;
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.async = true;
      js.defer = true;
      document.body.appendChild(js);

      js.onload = () => {
        window.fbAsyncInit = function () {
          window.FB.init({
            appId: '626674156971996',
            autoLogAppEvents: true,
            xfbml: true,
            version: 'v22.0'
          });
        };
      };
    };

    loadFbSdk();

    const handleMessage = (event) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH') {
            const { phone_number_id, waba_id } = data.data;
            console.log('WABA ID:', waba_id, 'Phone ID:', phone_number_id);

            axios.post( `${process.env.REACT_APP_API_URL}/api/meta/save-waba`, { waba_id, phone_number_id })
              .then(res => console.log('WABA saved:', res.data))
              .catch(err => console.error('Save WABA error:', err));

          } else if (data.event === 'CANCEL') {
            const { current_step } = data.data;
            console.warn('User canceled at step:', current_step);
          } else if (data.event === 'ERROR') {
            const { error_message } = data.data;
            console.error('Error:', error_message);
          }
        }

        setSessionInfo(data);
      } catch (error) {
        console.log('Non JSON Response:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fbLoginCallback = (response) => {
    if (response.authResponse) {
      const code = response.authResponse.code;

      axios.post(`${process.env.REACT_APP_API_URL}/api/meta/exchange-token`, { code })
        .then(res => console.log('Access token exchanged:', res.data))
        .catch(err => console.error('Exchange token error:', err));
    }
    setSdkResponse(response);
  };

  const launchWhatsAppSignup = () => {
    if (!window.FB) return console.error('Facebook SDK not loaded.');

    window.FB.login(fbLoginCallback, {
      config_id: '669361018880973',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: '',
        sessionInfoVersion: '2',
      },
    });
  };

  return (
    <div>
      <div id="fb-root"></div>
      <button
        onClick={launchWhatsAppSignup}
        style={{ backgroundColor: '#1877f2', border: 0, borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', height: '40px', padding: '0 24px' }}
      >
        Login with Facebook
      </button>
      <p>Session Info:</p>
      <pre>{sessionInfo ? JSON.stringify(sessionInfo, null, 2) : 'No session info yet'}</pre>
      <p>SDK Response:</p>
      <pre>{sdkResponse ? JSON.stringify(sdkResponse, null, 2) : 'No SDK response yet'}</pre>
    </div>
  );
};

export default MetaSignup;


// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const MetaSignup = () => {
//   const [sessionInfo, setSessionInfo] = useState(null);
//   const [sdkResponse, setSdkResponse] = useState(null);

//   useEffect(() => {
//     const loadFbSdk = () => {
//       if (document.getElementById('facebook-jssdk')) return;

//       const js = document.createElement('script');
//       js.id = 'facebook-jssdk';
//       js.src = 'https://connect.facebook.net/en_US/sdk.js';
//       js.async = true;
//       js.defer = true;
//       document.body.appendChild(js);

//       js.onload = () => {
//         window.fbAsyncInit = function () {
//           window.FB.init({
//             appId: '626674156971996', // ✅ Your App ID
//             autoLogAppEvents: true,
//             xfbml: true,
//             version: 'v22.0' // ✅ Match your approved API version
//           });
//           console.log('✅ Facebook SDK Initialized');
//         };
//       };
//     };

//     loadFbSdk();

//     const handleMessage = (event) => {
//       if (
//         event.origin !== 'https://www.facebook.com' &&
//         event.origin !== 'https://web.facebook.com'
//       ) {
//         console.warn('❗ Ignored message from:', event.origin);
//         return;
//       }

//       try {
//         const data = JSON.parse(event.data);
//         console.log('📩 WA Embedded Signup Event:', data);

//         if (data.type === 'WA_EMBEDDED_SIGNUP') {
//           if (data.event === 'FINISH') {
//             const { phone_number_id, waba_id } = data.data;
//             console.log('✅ Signup Finished:', { waba_id, phone_number_id });

//             axios.post(`${process.env.REACT_APP_API_URL}/api/meta/save-waba`, {
//               waba_id,
//               phone_number_id
//             })
//             .then(res => console.log('✅ Saved WABA:', res.data))
//             .catch(err => console.error('❌ Save WABA error:', err));
//           } else if (data.event === 'CANCEL') {
//             console.warn('⚠️ User cancelled signup:', data.data.current_step);
//           } else if (data.event === 'ERROR') {
//             console.error('❌ Signup Error:', data.data.error_message);
//           }
//         }

//         setSessionInfo(data);
//       } catch (error) {
//         console.warn('❗ Non-JSON Event Data:', event.data);
//       }
//     };

//     window.addEventListener('message', handleMessage);

//     return () => window.removeEventListener('message', handleMessage);
//   }, []);

//   const launchWhatsAppSignup = () => {
//     if (!window.FB) {
//       console.error('❌ Facebook SDK not loaded yet!');
//       return;
//     }

//     window.FB.ui({
//       display: 'popup',
//       method: 'wa_embedded_signup',
//       app_id: '626674156971996', // ✅ Your App ID
//       redirect_uri: 'https://app.autopilotmybusiness.com/metasignup', // ✅ Exact URL as in Meta App OAuth settings
//       setup: {} // Optional prefill
//     }, function(response) {
//       console.log('📝 FB.ui Response:', response);
//       setSdkResponse(response);
//     });
//   };

//   return (
//     <div>
//       <div id="fb-root"></div>

//       <button
//         onClick={launchWhatsAppSignup}
//         style={{
//           backgroundColor: '#1877f2',
//           border: 0,
//           borderRadius: '4px',
//           color: '#fff',
//           cursor: 'pointer',
//           fontSize: '16px',
//           fontWeight: 'bold',
//           height: '40px',
//           padding: '0 24px'
//         }}
//       >
//         Start WhatsApp Signup
//       </button>

//       <p>Session Info:</p>
//       <pre>{sessionInfo ? JSON.stringify(sessionInfo, null, 2) : 'No session info yet'}</pre>

//       <p>SDK Response:</p>
//       <pre>{sdkResponse ? JSON.stringify(sdkResponse, null, 2) : 'No SDK response yet'}</pre>
//     </div>
//   );
// };

// export default MetaSignup;
