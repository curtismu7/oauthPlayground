import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import { NotificationProvider } from './components/NotificationSystem';
import { OfflineBanner } from './components/OfflineHandler';
import { useGlobalErrorHandler } from './hooks/useErrorHandling';
import './App.css';

// Import all required components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserLookup from './components/UserLookup';
import CreditAssessment from './components/CreditAssessment';
import UserProfile from './components/UserProfile';
import AdminPanel from './components/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';
import OAuthCallback from './components/OAuthCallback';

// All components imported successfully

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  
  // Initialize global error handling
  useGlobalErrorHandler();

  useEffect(() => {
    console.log('🔍 App useEffect - Starting authentication check...');
    
    // Check if user explicitly logged out (check both storage types)
    const logoutTimestamp = localStorage.getItem('userLoggedOut') || sessionStorage.getItem('userLoggedOut');
    const userLoggedOut = logoutTimestamp && (Date.now() - parseInt(logoutTimestamp)) < 10000; // 10 seconds
    if (userLoggedOut) {
      console.log('🚪 User explicitly logged out, clearing all tokens and skipping auth check');
      
      // Clear ALL possible tokens to ensure clean state
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userLoggedOut'); // Remove the flag
      sessionStorage.removeItem('userLoggedOut'); // Remove from session storage too
      
      // Clear sessionStorage as well
      sessionStorage.clear();
      
      setLoading(false);
      return;
    }
    
    // Add a small delay to ensure session destruction is complete
    setTimeout(() => {
      // Final check for logout flag before proceeding
      const finalLogoutTimestamp = localStorage.getItem('userLoggedOut') || sessionStorage.getItem('userLoggedOut');
      const finalLogoutCheck = finalLogoutTimestamp && (Date.now() - parseInt(finalLogoutTimestamp)) < 10000; // 10 seconds
      if (finalLogoutCheck) {
        console.log('🚪 Final logout check - user logged out, staying on login page');
        setLoading(false);
        return;
      }
      
      console.log('🔄 Checking for OAuth session...');
      checkOAuthSession();
    }, 300);
  }, []);

  const checkOAuthSession = async () => {
    console.log('🔍 checkOAuthSession - Checking for active OAuth sessions...');
    
    // Double-check logout flag before making any requests
    const logoutTimestamp = localStorage.getItem('userLoggedOut') || sessionStorage.getItem('userLoggedOut');
    const userLoggedOut = logoutTimestamp && (Date.now() - parseInt(logoutTimestamp)) < 10000; // 10 seconds
    if (userLoggedOut) {
      console.log('🚪 Logout flag detected in checkOAuthSession, aborting session check');
      setLoading(false);
      return;
    }
    
    try {
      // Check OAuth session
      console.log('🔍 Checking OAuth session...');
      const response = await axios.get('/api/auth/oauth/status', {
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002',
        withCredentials: true,
        timeout: 5000
      });
      console.log('🔍 OAuth response:', {
        authenticated: response.data.authenticated,
        user: response.data.user,
        hasAccessToken: !!response.data.accessToken,
        expiresAt: response.data.expiresAt
      });
      
      if (response.data.authenticated) {
        console.log('✅ OAuth session found, logging in user:', response.data.user);
        
        // Store the OAuth token for API calls
        if (response.data.accessToken) {
          localStorage.setItem('access_token', response.data.accessToken);
          if (response.data.expiresAt) {
            localStorage.setItem('token_expires_at', response.data.expiresAt.toString());
          }
          console.log('🔑 Stored OAuth access token');
        }
        
        setUser(response.data.user);
        setLoading(false);
        return;
      }
      
      console.log('❌ No active OAuth sessions found');
      setLoading(false);
    } catch (error) {
      console.error('❌ Error checking OAuth session:', error);
      setLoading(false);
    }
  };



  const handleAuthSuccess = (userInfo, token) => {
    console.log('🎉 Authentication successful:', userInfo);
    setUser(userInfo);
    setAccessToken(token);
  };

  const logout = async () => {
    console.log('🚪 Starting logout process...');
    
    try {
      // Set logout flags with timestamp to prevent auto-login (use both localStorage and sessionStorage)
      const logoutTimestamp = Date.now().toString();
      localStorage.setItem('userLoggedOut', logoutTimestamp);
      sessionStorage.setItem('userLoggedOut', logoutTimestamp);
      
      console.log('🔄 Calling server logout endpoint...');
      
      // Call server logout endpoint to invalidate OAuth session
      try {
        await axios.post('/api/auth/oauth/logout', {}, {
          baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002',
          withCredentials: true,
          timeout: 5000
        });
        console.log('✅ Server-side logout successful');
      } catch (logoutError) {
        console.warn('⚠️ Server logout failed (continuing anyway):', logoutError.message);
        // Continue with client-side cleanup even if server logout fails
      }
      
      // Clear ALL tokens from localStorage
      console.log('🧹 Clearing client-side tokens...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // Clear sessionStorage as well
      sessionStorage.clear();
      
      // Also try to clear any cookies by making a GET request to logout
      try {
        await axios.get('/api/auth/oauth/logout', {
          baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002',
          withCredentials: true,
          timeout: 3000
        });
        console.log('✅ GET logout also called for cookie cleanup');
      } catch (getLogoutError) {
        console.warn('⚠️ GET logout failed (continuing anyway):', getLogoutError.message);
      }
      
      // Clear axios default headers
      delete axios.defaults.headers.common['Authorization'];
      
      // Clear user state immediately
      setUser(null);
      setAccessToken(null);
      
      console.log('✅ Client-side cleanup completed');
      
    } catch (error) {
      console.error('❌ Error during logout:', error.message);
      // Continue with logout even if there are errors
      setUser(null);
      setAccessToken(null);
    }
    
    console.log('🔄 Redirecting to login...');
    
    // Force a complete page reload to ensure clean state
    // Use a longer delay to ensure all cleanup is complete
    setTimeout(() => {
      console.log('🔄 Executing redirect to login page');
      window.location.replace('/');
    }, 500);
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <OfflineBanner />
        <Routes>
          <Route path="/oauth/callback" element={
            <ErrorBoundary>
              <OAuthCallback onAuthSuccess={handleAuthSuccess} />
            </ErrorBoundary>
          } />
          {!user ? (
            <Route path="*" element={
              <ErrorBoundary>
                <Login />
              </ErrorBoundary>
            } />
          ) : (
            <>
              <Route path="/" element={
                <ErrorBoundary>
                  <Dashboard user={user} onLogout={logout} />
                </ErrorBoundary>
              } />
              <Route path="/dashboard" element={
                <ErrorBoundary>
                  <Dashboard user={user} onLogout={logout} />
                </ErrorBoundary>
              } />
              <Route path="/users" element={
                <ErrorBoundary>
                  <UserLookup user={user} onLogout={logout} />
                </ErrorBoundary>
              } />
              <Route path="/users/:userId" element={
                <ErrorBoundary>
                  <UserProfile user={user} onLogout={logout} />
                </ErrorBoundary>
              } />
              <Route path="/credit/:userId" element={
                <ErrorBoundary>
                  <CreditAssessment user={user} onLogout={logout} />
                </ErrorBoundary>
              } />
              <Route path="/admin" element={
                user?.role === 'admin' ? (
                  <ErrorBoundary>
                    <AdminPanel user={user} onLogout={logout} />
                  </ErrorBoundary>
                ) : (
                  <Navigate to="/" replace />
                )
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>

      </div>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App-level error:', error, errorInfo);
        // In production, send to error tracking service
      }}
    >
      <NotificationProvider maxNotifications={5}>
        <AppContent />
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;