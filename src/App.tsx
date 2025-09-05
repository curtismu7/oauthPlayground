import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/AuthContext';
import { OAuthProvider } from './contexts/OAuthContext';
import { GlobalStyle, theme } from './styles/global';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CredentialSetupModal from './components/CredentialSetupModal';
import Dashboard from './pages/Dashboard';
import Flows from './pages/Flows';
// Import all the new OAuth and OIDC flow components
import ImplicitGrantFlow from './pages/flows/ImplicitGrantFlow';
import ClientCredentialsFlow from './pages/flows/ClientCredentialsFlow';
import PKCEFlow from './pages/flows/PKCEFlow';
import DeviceCodeFlow from './pages/flows/DeviceCodeFlow';
import AuthorizationCodeFlow from './pages/flows/AuthorizationCodeFlow';
import UserInfoFlow from './pages/flows/UserInfoFlow';
import IDTokensFlow from './pages/flows/IDTokensFlow';
import OIDC from './pages/OIDC';
import TokenManagement from './pages/TokenManagement';
import AIOpenIDConnectOverview from './pages/AIOpenIDConnectOverview';
import AdvancedConfiguration from './pages/AdvancedConfiguration';
import InteractiveTutorials from './pages/InteractiveTutorials';
import Configuration from './pages/Configuration';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import Callback from './pages/Callback';
import { useAuth } from './contexts/AuthContext';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray100};
`;

const MainContent = styled.main`
  flex: 1;
  padding: 1.5rem;
  margin-left: 250px;
  margin-top: 60px;
  overflow-y: auto;
  transition: margin 0.3s ease;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    margin-left: 0;
    padding: 1rem;
    margin-top: 60px;
  }
`;

import { ReactNode } from 'react';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate
      to="/login"
      state={{
        from: location,
        message: 'Please log in to access this page.',
        type: 'info'
      }}
      replace
    />;
  }

  return children;
};

const AppRoutes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Check for existing PingOne configuration on app load
  useEffect(() => {
    const checkConfiguration = () => {
      console.log('🔍 [App] Checking for existing configuration...');
      try {
        const savedConfig = localStorage.getItem('pingone_config');
        const savedCreds = localStorage.getItem('login_credentials');

        console.log('🔍 [App] Configuration check:', {
          hasSavedConfig: !!savedConfig,
          hasSavedCreds: !!savedCreds,
          savedConfigKeys: savedConfig ? Object.keys(JSON.parse(savedConfig)) : [],
          savedCredsKeys: savedCreds ? Object.keys(JSON.parse(savedCreds)) : []
        });

        // Only show modal if BOTH configuration and credentials are missing
        if (!savedConfig && !savedCreds) {
          console.log('⚠️ [App] No credentials found, showing setup modal');
          setShowCredentialModal(true);
        } else {
          console.log('✅ [App] Credentials found, skipping setup modal');
          setShowCredentialModal(false);
        }
      } catch (error) {
        console.warn('❌ [App] Error checking configuration:', error);
        // Show modal on error to be safe
        setShowCredentialModal(true);
      }
    };

    // Add a small delay to ensure localStorage is ready
    setTimeout(checkConfiguration, 100);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCredentialSetupComplete = () => {
    setShowCredentialModal(false);
    console.log('Credential setup completed, modal hidden');
  };

  return (
    <>
      <AppContainer>
        <Navbar toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <MainContent>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/callback" element={<Callback />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/flows" element={
              <ProtectedRoute>
                <Flows />
              </ProtectedRoute>
            }>
              <Route path="authorization-code" element={<AuthorizationCodeFlow />} />
              <Route path="implicit" element={<ImplicitGrantFlow />} />
              <Route path="client-credentials" element={<ClientCredentialsFlow />} />
              <Route path="pkce" element={<PKCEFlow />} />
              <Route path="device-code" element={<DeviceCodeFlow />} />
            </Route>

            <Route path="/oidc" element={
              <ProtectedRoute>
                <OIDC />
              </ProtectedRoute>
            }>
              <Route path="userinfo" element={<UserInfoFlow />} />
              <Route path="id-tokens" element={<IDTokensFlow />} />
            </Route>

            <Route path="/configuration" element={
              <ProtectedRoute>
                <Configuration />
              </ProtectedRoute>
            } />

            <Route path="/documentation" element={
              <ProtectedRoute>
                <Documentation />
              </ProtectedRoute>
            } />

            <Route path="/token-management" element={
              <ProtectedRoute>
                <TokenManagement />
              </ProtectedRoute>
            } />

            <Route path="/ai-overview" element={
              <ProtectedRoute>
                <AIOpenIDConnectOverview />
              </ProtectedRoute>
            } />

            <Route path="/advanced-config" element={
              <ProtectedRoute>
                <AdvancedConfiguration />
              </ProtectedRoute>
            } />

            <Route path="/tutorials" element={
              <ProtectedRoute>
                <InteractiveTutorials />
              </ProtectedRoute>
            } />

            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </MainContent>
      </AppContainer>

      <CredentialSetupModal
        isOpen={showCredentialModal}
        onComplete={handleCredentialSetupComplete}
      />
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <OAuthProvider>
          <GlobalStyle />
          <AppRoutes />
        </OAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
