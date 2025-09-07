import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import styled, { ThemeProvider, DefaultTheme } from 'styled-components';
import { AuthProvider } from './contexts/NewAuthContext';
import { PageStyleProvider } from './contexts/PageStyleContext';
import { GlobalStyle, theme } from './styles/global';
import './styles/spec-cards.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CredentialSetupModal from './components/CredentialSetupModal';
import Dashboard from './pages/Dashboard';
import Flows from './pages/Flows';
import OAuthFlowsNew from './pages/OAuthFlowsNew';
import FlowComparisonTool from './components/FlowComparisonTool';
import InteractiveFlowDiagram from './components/InteractiveFlowDiagram';
import Configuration from './pages/Configuration';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import Callback from './pages/Callback';
import { useAuth } from './contexts/NewAuthContext';

// Import all the new OAuth and OIDC flow components
import ImplicitGrantFlow from './pages/flows/ImplicitGrantFlow';
import ClientCredentialsFlow from './pages/flows/ClientCredentialsFlow';
import WorkerTokenFlow from './pages/flows/WorkerTokenFlow';

import DeviceCodeFlow from './pages/flows/DeviceCodeFlow';
import HybridFlow from './pages/flows/HybridFlow';
import AuthorizationCodeFlow from './pages/flows/AuthorizationCodeFlow';
import JWTBearerFlow from './pages/flows/JWTBearerFlow';
import UserInfoFlow from './pages/flows/UserInfoFlow';
import IDTokensFlow from './pages/flows/IDTokensFlow';
import PARFlow from './pages/flows/PARFlow';
import OIDC from './pages/OIDC';
import TokenManagement from './pages/TokenManagement';
import AIOpenIDConnectOverview from './pages/AIOpenIDConnectOverview';
import AdvancedConfiguration from './pages/AdvancedConfiguration';
import InteractiveTutorials from './pages/InteractiveTutorials';
import OAuth21 from './pages/OAuth21';
import OIDCSessionManagement from './pages/OIDCSessionManagement';
import OIDCSpecs from './pages/docs/OIDCSpecs';
import OIDCForAI from './pages/docs/OIDCForAI';
import AuthorizationRequestModal from './components/AuthorizationRequestModal';
import PageChangeSpinner from './components/PageChangeSpinner';
import DebugPanel from './components/DebugPanel';
import AuthErrorBoundary from './components/AuthErrorBoundary';

// Import callback components
import AuthzCallback from './components/callbacks/AuthzCallback';
import HybridCallback from './components/callbacks/HybridCallback';
import ImplicitCallback from './components/callbacks/ImplicitCallback';
import WorkerTokenCallback from './components/callbacks/WorkerTokenCallback';
import DeviceCodeStatus from './components/callbacks/DeviceCodeStatus';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray100};
`;

const MainContent = styled.main`
  flex: 1;
  padding: 1.5rem;
  margin-left: 250px;
  margin-top: 80px;
  overflow-y: auto;
  transition: margin 0.3s ease;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    margin-left: 0;
    padding: 1rem;
    margin-top: 80px;
  }
`;

import type { ReactNode } from 'react';
// Scroll to top component
const ScrollToTop: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Scroll to top immediately
    window.scrollTo(0, 0);
    
    // Also scroll the main content area to top (in case of nested scrolling)
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
    
    // Additional scroll to top after a small delay to ensure it works
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      if (mainContent) {
        mainContent.scrollTo(0, 0);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  return null;
};


const AppRoutes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showPageSpinner, setShowPageSpinner] = useState(false);
  const location = useLocation();
  const { showAuthModal, authRequestData, proceedWithOAuth, closeAuthModal } = useAuth();

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Show page change spinner when route changes
  useEffect(() => {
    setShowPageSpinner(true);
    
    // Scroll to top immediately when route changes
    window.scrollTo(0, 0);
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
    
    // Hide spinner after minimum display time
    const timer = setTimeout(() => {
      setShowPageSpinner(false);
      // Ensure scroll to top after spinner is hidden
      window.scrollTo(0, 0);
      if (mainContent) {
        mainContent.scrollTo(0, 0);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
      <ScrollToTop />
      <AppContainer>
        <Navbar toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <MainContent>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/callback" element={<Callback />} />
            
            {/* Per-flow callback routes */}
            <Route path="/authz-callback" element={<AuthzCallback />} />
            <Route path="/hybrid-callback" element={<HybridCallback />} />
            <Route path="/implicit-callback" element={<ImplicitCallback />} />
            <Route path="/worker-token-callback" element={<WorkerTokenCallback />} />
            <Route path="/device-code-status" element={<DeviceCodeStatus />} />
            <Route path="/dashboard-callback" element={<Callback />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/flows" element={<OAuthFlowsNew />} />
            <Route path="/flows/compare" element={<FlowComparisonTool />} />
            <Route path="/flows/diagrams" element={<InteractiveFlowDiagram />} />
            
            <Route path="/flows-old" element={<Flows />}>
              <Route path="authorization-code" element={<AuthorizationCodeFlow />} />
              <Route path="implicit" element={<ImplicitGrantFlow />} />
              <Route path="client-credentials" element={<ClientCredentialsFlow />} />
              <Route path="worker-token" element={<WorkerTokenFlow />} />
              <Route path="jwt-bearer" element={<JWTBearerFlow />} />
              <Route path="userinfo" element={<UserInfoFlow />} />
              <Route path="id-tokens" element={<IDTokensFlow />} />
              <Route path="par" element={<PARFlow />} />

              <Route path="device-code" element={<DeviceCodeFlow />} />
            </Route>

            <Route path="/oidc" element={<OIDC />}>
              <Route path="userinfo" element={<UserInfoFlow />} />
              <Route path="id-tokens" element={<IDTokensFlow />} />
              <Route path="authorization-code" element={<AuthorizationCodeFlow />} />
              <Route path="hybrid" element={<HybridFlow />} />
              <Route path="implicit" element={<ImplicitGrantFlow />} />
              <Route path="client-credentials" element={<ClientCredentialsFlow />} />
              <Route path="worker-token" element={<WorkerTokenFlow />} />
              <Route path="jwt-bearer" element={<JWTBearerFlow />} />

              <Route path="device-code" element={<DeviceCodeFlow />} />
            </Route>
            {/* Backward-compatible redirect for older links */}
            <Route path="/oidc/tokens" element={<Navigate to="/oidc/id-tokens" replace />} />

            <Route path="/configuration" element={<Configuration />} />

            <Route path="/documentation" element={<Documentation />} />

            <Route path="/docs/oidc-specs" element={<OIDCSpecs />} />
            <Route path="/docs/oidc-for-ai" element={<OIDCForAI />} />

            <Route path="/token-management" element={<TokenManagement />} />

            <Route path="/ai-overview" element={<AIOpenIDConnectOverview />} />

            <Route path="/advanced-config" element={<AdvancedConfiguration />} />

            <Route path="/tutorials" element={<InteractiveTutorials />} />

            <Route path="/oauth-2-1" element={<OAuth21 />} />
            <Route path="/oidc-session-management" element={<OIDCSessionManagement />} />

            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </MainContent>
      </AppContainer>

      <CredentialSetupModal
        isOpen={showCredentialModal}
        onComplete={handleCredentialSetupComplete}
      />

      <AuthorizationRequestModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        onProceed={proceedWithOAuth}
        authorizationUrl={authRequestData?.authorizationUrl || ''}
        requestParams={authRequestData?.requestParams || {}}
      />
      
      <PageChangeSpinner 
        isVisible={showPageSpinner} 
        message="Loading page..." 
      />
      
      <DebugPanel />
    </>
  );
};

// Define the theme type
type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
  [key: string]: string; // Allow additional color properties
};

type ThemeFonts = {
  body: string;
  heading: string;
  monospace: string;
};

type ThemeShadows = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

type ThemeBreakpoints = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

type ThemeSpacing = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
};

type ThemeBorderRadius = {
  sm: string;
  md: string;
  lg: string;
  full: string;
};

// Extend the default theme type
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: ThemeColors;
    fonts: ThemeFonts;
    shadows: ThemeShadows;
    breakpoints: ThemeBreakpoints;
    spacing: ThemeSpacing;
    borderRadius: ThemeBorderRadius;
  }
}

// Helper function to safely access theme properties
const getThemeValue = <T,>(value: T | undefined, defaultValue: T): T => {
  return value !== undefined ? value : defaultValue;
};

function App() {
  // Safely access theme properties with fallbacks
  const themeColors = theme?.colors || {};
  const themeFonts = theme?.fonts || { body: '', heading: '', monospace: '' };
  const themeShadows = theme?.shadows || { sm: '', md: '', lg: '', xl: '' };
  const themeBreakpoints = theme?.breakpoints || { xs: '', sm: '', md: '', lg: '', xl: '' };

  const themeWithDefaults: DefaultTheme = {
    // Colors with fallbacks
    colors: {
      ...themeColors,
      primary: getThemeValue(themeColors.primary, '#4f46e5'),
      primaryLight: getThemeValue(themeColors.primaryLight, '#6366f1'),
      primaryDark: getThemeValue(themeColors.primaryDark, '#4338ca'),
      secondary: getThemeValue(themeColors.secondary, '#10b981'),
      success: getThemeValue(themeColors.success, '#10b981'),
      danger: getThemeValue(themeColors.danger, '#ef4444'),
      warning: getThemeValue(themeColors.warning, '#f59e0b'),
      info: getThemeValue(themeColors.info, '#3b82f6'),
      light: getThemeValue(themeColors.light, '#f9fafb'),
      dark: getThemeValue(themeColors.dark, '#111827'),
      gray100: getThemeValue(themeColors.gray100, '#f3f4f6'),
      gray200: getThemeValue(themeColors.gray200, '#e5e7eb'),
      gray300: getThemeValue(themeColors.gray300, '#d1d5db'),
      gray400: getThemeValue(themeColors.gray400, '#9ca3af'),
      gray500: getThemeValue(themeColors.gray500, '#6b7280'),
      gray600: getThemeValue(themeColors.gray600, '#4b5563'),
      gray700: getThemeValue(themeColors.gray700, '#374151'),
      gray800: getThemeValue(themeColors.gray800, '#1f2937'),
      gray900: getThemeValue(themeColors.gray900, '#111827'),
    },

    // Fonts with fallbacks
    fonts: {
      body: getThemeValue(themeFonts.body, 'system-ui, sans-serif'),
      heading: getThemeValue(themeFonts.heading, 'system-ui, sans-serif'),
      monospace: getThemeValue(themeFonts.monospace, '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace'),
    },

    // Shadows with fallbacks
    shadows: {
      sm: getThemeValue(themeShadows.sm, '0 1px 2px 0 rgba(0, 0, 0, 0.05)'),
      md: getThemeValue(themeShadows.md, '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'),
      lg: getThemeValue(themeShadows.lg, '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'),
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },

    // Breakpoints with fallbacks
    breakpoints: {
      xs: '0px',
      sm: getThemeValue(themeBreakpoints.sm, '640px'),
      md: getThemeValue(themeBreakpoints.md, '768px'),
      lg: getThemeValue(themeBreakpoints.lg, '1024px'),
      xl: getThemeValue(themeBreakpoints.xl, '1280px'),
    },

    // Spacing scale
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      xxl: '4rem',
    },

    // Border radius
    borderRadius: {
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.5rem',
      full: '9999px',
    },
  };

  return (
    <ThemeProvider theme={themeWithDefaults}>
      <AuthErrorBoundary>
        <AuthProvider>
          <PageStyleProvider>
            <GlobalStyle />
            <AppRoutes />
          </PageStyleProvider>
        </AuthProvider>
      </AuthErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
