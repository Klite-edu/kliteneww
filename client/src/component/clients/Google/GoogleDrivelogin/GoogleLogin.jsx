import React from 'react';

const GoogleLogin = () => {
  const handleLogin = () => {
    window.location.href =  `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  return (
    <button onClick={handleLogin} className="login-btn">
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo" />
      Login with Google
    </button>
  );
};

export default GoogleLogin;