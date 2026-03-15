import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  const handleOAuthLogin = () => {
    // Redirect to OAuth login endpoint on the backend server
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';
    const clientUrl = process.env.REACT_APP_CLIENT_URL || 'http://localhost:3003';
    window.location.href = `${apiUrl}/api/auth/oauth/login?redirect_uri=${encodeURIComponent(clientUrl + '/dashboard')}`;
  };

  // Handle OAuth error parameters from URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      let errorMessage = '';
      switch (errorParam) {
        case 'oauth_error':
          errorMessage = 'OAuth authentication failed. Please try again.';
          break;
        case 'invalid_state':
          errorMessage = 'Invalid authentication state. Please try again.';
          break;
        case 'no_code':
          errorMessage = 'No authorization code received. Please try again.';
          break;
        case 'callback_failed':
          errorMessage = 'Authentication callback failed. Please try again.';
          break;
        case 'oauth_init_failed':
          errorMessage = 'Failed to initialize OAuth. Please try again.';
          break;
        default:
          errorMessage = 'Authentication error occurred. Please try again.';
      }
      setError(errorMessage);
    }
  }, [searchParams]);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-branding">
            <div className="login-logo">
              <div className="logo-icon">
                <div className="logo-square"></div>
                <div className="logo-square"></div>
                <div className="logo-square"></div>
                <div className="logo-square"></div>
              </div>
              <div className="company-name">LendingPro</div>
            </div>
          </div>
          <h1>Welcome to Lending Platform</h1>
          <p>Secure credit assessment and lending services</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="oauth-login">
          <div className="oauth-info">
            <h3>Secure P1AIC Authentication</h3>
            <p>
              Access the lending platform using your secure OAuth credentials. 
              This ensures your data is protected with enterprise-grade security.
            </p>
          </div>

          <button 
            className="oauth-btn"
            onClick={handleOAuthLogin}
            disabled={loading}
          >
            {loading ? 'Redirecting...' : 'Sign In with P1AIC'}
          </button>
        </div>

        <div className="login-footer">
          <p>
            <strong>P1AIC OAuth Authentication</strong><br />
            Secure enterprise-grade authentication powered by PingOne Advanced Identity Cloud
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;