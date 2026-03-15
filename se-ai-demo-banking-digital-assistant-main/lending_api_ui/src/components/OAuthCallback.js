import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const OAuthCallback = ({ onAuthSuccess }) => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const oauthSuccess = searchParams.get('oauth');
      const error = searchParams.get('error');

      console.log('🔄 OAuth callback received:', { 
        oauthSuccess, 
        error 
      });

      // Handle OAuth errors
      if (error) {
        console.error('❌ OAuth error:', error);
        setError(`OAuth error: ${error}`);
        setStatus('error');
        return;
      }

      // Check if OAuth was successful
      if (oauthSuccess === 'success') {
        console.log('🔄 OAuth successful, checking session status...');
        
        // Get session status from backend
        const sessionStatus = await getSessionStatus();
        
        if (sessionStatus.authenticated && sessionStatus.user) {
          console.log('✅ User authenticated:', sessionStatus.user);
          
          // Store access token for API calls
          if (sessionStatus.accessToken) {
            localStorage.setItem('access_token', sessionStatus.accessToken);
          }
          
          // Call the auth success callback
          onAuthSuccess(sessionStatus.user, sessionStatus.accessToken);
          
          // Navigate to dashboard
          navigate('/dashboard');
        } else {
          throw new Error('Session not authenticated');
        }
      } else {
        throw new Error('OAuth callback did not indicate success');
      }

    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
      setStatus('error');
    }
  };

  const getSessionStatus = async () => {
    const response = await axios.get('/api/auth/oauth/status', {
      withCredentials: true // Include session cookies
    });

    return response.data;
  };

  const handleRetry = () => {
    navigate('/');
  };

  if (status === 'processing') {
    return (
      <div className="oauth-callback">
        <div className="oauth-callback-card">
          <div className="oauth-callback-header">
            <h2>Completing Authentication...</h2>
            <div className="loading-spinner"></div>
          </div>
          <p>Please wait while we complete your authentication.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="oauth-callback">
        <div className="oauth-callback-card">
          <div className="oauth-callback-header error">
            <h2>Authentication Failed</h2>
          </div>
          <div className="error-message">
            <p>{error}</p>
          </div>
          <button onClick={handleRetry} className="oauth-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;