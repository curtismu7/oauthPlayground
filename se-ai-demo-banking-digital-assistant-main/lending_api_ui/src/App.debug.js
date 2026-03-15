import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Import components one by one to identify issues
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

// Test basic imports first
console.log('✅ Login component imported:', typeof Login);
console.log('✅ Dashboard component imported:', typeof Dashboard);
console.log('✅ ErrorBoundary component imported:', typeof ErrorBoundary);

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 App useEffect - Starting authentication check...');
    
    // Check if user explicitly logged out
    const userLoggedOut = localStorage.getItem('userLoggedOut');
    if (userLoggedOut === 'true') {
      console.log('🚪 User explicitly logged out, skipping authentication check');
      localStorage.removeItem('userLoggedOut');
      setLoading(false);
      return;
    }
    
    // Add a small delay to ensure session destruction is complete
    setTimeout(() => {
      console.log('🔄 Checking for OAuth session...');
      checkOAuthSession();
    }, 200);
  }, []);

  const checkOAuthSession = async () => {
    console.log('🔍 checkOAuthSession - Checking for active OAuth sessions...');
    try {
      // Check lending OAuth session
      console.log('💰 Checking lending OAuth session...');
      const lendingResponse = await axios.get('/api/auth/oauth/status');
      console.log('💰 Lending OAuth response:', {
        authenticated: lendingResponse.data.authenticated,
        user: lendingResponse.data.user,
        hasAccessToken: !!lendingResponse.data.accessToken,
        expiresAt: lendingResponse.data.expiresAt
      });
      
      if (lendingResponse.data.authenticated) {
        console.log('✅ Lending OAuth session found, logging in user:', lendingResponse.data.user);
        setUser(lendingResponse.data.user);
        setLoading(false);
        return;
      }
      
      console.log('❌ No active OAuth sessions found');
      setLoading(false);
    } catch (error) {
      console.log('❌ Error checking OAuth sessions:', error.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 Starting logout process...');
    
    try {
      // Set a logout flag to prevent auto-login
      localStorage.setItem('userLoggedOut', 'true');
      
      // Clear any potential auth-related localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // Clear sessionStorage as well
      sessionStorage.clear();
      
      // Clear user state
      setUser(null);
      
      // Call server-side logout to destroy session
      console.log('🔄 Calling server-side logout...');
      
      try {
        await axios.get('/api/auth/oauth/logout');
        console.log('✅ Lending OAuth session destroyed');
      } catch (error) {
        console.log('ℹ️ Lending OAuth logout failed (may not be logged in):', error.message);
      }
      
      console.log('✅ Logout completed - OAuth sessions cleared, logout flag set');
      
    } catch (error) {
      console.error('❌ Error during logout:', error.message);
      // Continue with logout even if server call fails
    }
    
    // Clear all cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('🍪 All cookies cleared');
    
    // Force a complete page reload to ensure clean state
    setTimeout(() => {
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
        {!user ? (
          <ErrorBoundary>
            <Login />
          </ErrorBoundary>
        ) : (
          <main className="main-content">
            <Routes>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        )}
      </div>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App-level error:', error, errorInfo);
      }}
    >
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;