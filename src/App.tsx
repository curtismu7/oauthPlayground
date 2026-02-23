import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import styled, { type DefaultTheme, ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/NewAuthContext';
import { PageStyleProvider } from './contexts/PageStyleContext';
import { type UISettings, UISettingsProvider, useUISettings } from './contexts/UISettingsContext';
import { theme as baseTheme, GlobalStyle } from './styles/global';
import { FlowStateProvider } from './v8/contexts/FlowStateContext';
import UnifiedFlowProvider from './v8u/services/enhancedStateManagement';
import './styles/spec-cards.css';
import './styles/ui-settings.css';
import './styles/button-text-white-enforcement.css'; // CRITICAL: Ensures all buttons have white text
import './components/PingUIWrapper.css'; // Ping UI CSS variables and styling
import { lazy, Suspense } from 'react';
import CodeExamplesDemo from './components/CodeExamplesDemo';
import CredentialSetupModal from './components/CredentialSetupModal';
import { FloatingLogToggle } from './components/FloatingLogToggle';
import { FloatingLogViewer } from './components/FloatingLogViewer';
import { WorkerTokenModal } from './components/WorkerTokenModal';
import { BackendDownModalV8 } from './v8/components/BackendDownModalV8';
import { ConfirmationModalV8 } from './v8/components/ConfirmationModalV8';
import { PromptModalV8 } from './v8/components/PromptModalV8';

const CompactAppPickerDemo = lazy(() => import('./pages/CompactAppPickerDemo'));

import Navbar from '@/apps/navigation/components/Navbar';
import Sidebar from '@/apps/navigation/components/UnifiedSidebar.V2';
import DeviceMockFlow from './components/DeviceMockFlow';
import FlowComparisonTool from './components/FlowComparisonTool';
import FlowHeaderDemo from './components/FlowHeaderDemo';
import InteractiveFlowDiagram from './components/InteractiveFlowDiagram';
import { RouteRestorer } from './components/RouteRestorer';
import { useAuth } from './contexts/NewAuthContext';
import { NotificationContainer, NotificationProvider } from './hooks/useNotifications';
import AIIdentityArchitectures from './pages/AIIdentityArchitectures';
import AnalyticsPingUI from './pages/Analytics.PingUI';
// import ApplicationGeneratorPingUI from './pages/ApplicationGenerator.PingUI'; // Temporarily disabled due to build issues
import Callback from './pages/Callback';
import ClientGenerator from './pages/ClientGenerator';
import ConfigurationPingUI from './pages/Configuration.PingUI';
import DocumentationPingUI from './pages/Documentation.PingUI';
import LoginPingUI from './pages/Login.PingUI';
import OAuthCodeGeneratorHub from './pages/OAuthCodeGeneratorHub';
import OAuthFlowsNew from './pages/OAuthFlows.PingUI';
import { ApiRequestModalProvider } from './services/apiRequestModalService';
import {
	AuthorizationUrlValidationModal,
	authorizationUrlValidationModalService,
} from './services/authorizationUrlValidationModalService';
import FieldEditingService from './services/fieldEditingService';
import ModalPresentationService from './services/modalPresentationService';
import { credentialManager } from './utils/credentialManager';
// Import unified token storage service to make it globally available
import './services/unifiedTokenStorageService';
// MFA redirect URI migration disabled - MFA hub is no longer used
// import { migrateAllMFARedirectUris } from './v8/utils/mfaRedirectUriMigrationV8';

// Run migration immediately on module load - DISABLED
// migrateAllMFARedirectUris();

// Extend Window interface for global test utilities
declare global {
	interface Window {
		TokenExchangeFlowTest?: unknown;
		runTokenExchangeTests?: () => unknown;
		TokenExchangeIntegrationTest?: unknown;
		runIntegrationTests?: () => Promise<unknown>;
	}
}

// Removed useScrollToBottom - using centralized scroll management per page

import AuthErrorBoundary from './components/AuthErrorBoundary';
import AuthorizationRequestModal from './components/AuthorizationRequestModal';
import ComponentLoader from './components/ComponentLoader';
// Import callback components
import AuthzCallback from './components/callbacks/AuthzCallback';
import DashboardCallback from './components/callbacks/DashboardCallback';
import DeviceCodeStatus from './components/callbacks/DeviceCodeStatus';
import HybridCallback from './components/callbacks/HybridCallback';
import ImplicitCallback from './components/callbacks/ImplicitCallback';
import WorkerTokenCallback from './components/callbacks/WorkerTokenCallback';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorDisplay from './components/GlobalErrorDisplay';
import LogoutCallback from './components/LogoutCallback';
import ServerStatusProvider from './components/ServerStatusProvider';
import { StartupWrapper } from './components/StartupWrapper';
import AboutPingUI from './pages/About.PingUI';
import AdvancedConfiguration from './pages/AdvancedConfiguration';
import AdvancedSecuritySettingsComparison from './pages/AdvancedSecuritySettingsComparison';
import AdvancedSecuritySettingsDemo from './pages/AdvancedSecuritySettingsDemo';
import AIAgentOverview from './pages/AIAgentOverview';
import AIGlossary from './pages/AIGlossary';
import AutoDiscoverPingUI from './pages/AutoDiscover.PingUI';
import CIBAvsDeviceAuthz from './pages/CIBAvsDeviceAuthz';
import CompetitiveAnalysis from './pages/CompetitiveAnalysis';
import ComprehensiveOAuthEducation from './pages/ComprehensiveOAuthEducation';
import Dashboard from './pages/Dashboard.PingUI'; // Using PingUI version
import DpopAuthorizationCodeFlowV8 from './pages/DpopAuthorizationCodeFlowV8';
import OAuth2SecurityBestPractices from './pages/docs/OAuth2SecurityBestPractices.tsx';
import OAuthForAI from './pages/docs/OAuthForAI.tsx';
import OIDCForAI from './pages/docs/OIDCForAI.tsx';
import OIDCOverview from './pages/docs/OIDCOverviewV7.tsx';
// Removed unused OIDC overview imports
// import OIDCOverviewSimple from './pages/docs/OIDCOverview_Simple';
// import OIDCOverviewMinimal from './pages/docs/OIDCOverview_Minimal';
// import OIDCOverviewEnhanced from './pages/docs/OIDCOverview_Enhanced';
// import OIDCOverviewEnhancedSimple from './pages/docs/OIDCOverview_Enhanced_Simple';
// import OIDCOverviewTest from './pages/docs/OIDCOverview_Test';
// import OIDCOverviewNew from './pages/docs/OIDCOverview_New';
import OIDCSpecs from './pages/docs/OIDCSpecs.tsx';
import PingViewOnAI from './pages/docs/PingViewOnAI.tsx';
import SpiffeSpirePingOne from './pages/docs/SpiffeSpirePingOne.tsx';
import EnvironmentIdInputDemo from './pages/EnvironmentIdInputDemo';
import AdvancedOAuthParametersDemoFlow from './pages/flows/AdvancedOAuthParametersDemoFlow';
import CIBAFlowV9 from './pages/flows/CIBAFlowV9';
import ClientCredentialsFlowV7 from './pages/flows/ClientCredentialsFlowV7';
import DeviceAuthorizationFlowV7 from './pages/flows/DeviceAuthorizationFlowV7';
import DPoPFlow from './pages/flows/DPoPFlow';
import IDTokensFlow from './pages/flows/IDTokensFlow';
import ImplicitFlowV7 from './pages/flows/ImplicitFlowV7';
import JWTBearerFlow from './pages/flows/JWTBearerFlow';
import JWTBearerTokenFlowV7 from './pages/flows/JWTBearerTokenFlowV7';
import KrogerGroceryStoreMFA from './pages/flows/KrogerGroceryStoreMFA';
import MFAFlow from './pages/flows/MFAFlow';
import OAuth2CompliantAuthorizationCodeFlow from './pages/flows/OAuth2CompliantAuthorizationCodeFlow';
import OAuth2ResourceOwnerPasswordFlow from './pages/flows/OAuth2ResourceOwnerPasswordFlow';
import OAuthAuthorizationCodeFlowV7 from './pages/flows/OAuthAuthorizationCodeFlowV7';
import OAuthAuthorizationCodeFlowV7_2 from './pages/flows/OAuthAuthorizationCodeFlowV7_2';
import OAuthImplicitFlowCompletion from './pages/flows/OAuthImplicitFlowCompletion';
import OAuthROPCFlowV7 from './pages/flows/OAuthROPCFlowV7';
import OIDCCompliantAuthorizationCodeFlow from './pages/flows/OIDCCompliantAuthorizationCodeFlow';
import OIDCHybridFlowV7 from './pages/flows/OIDCHybridFlowV7';
import PARFlow from './pages/flows/PARFlow';
import PARFlowV7 from './pages/flows/PARFlowV7';
import PingOneCompleteMFAFlowV7 from './pages/flows/PingOneCompleteMFAFlowV7';
import PingOneLogoutFlow from './pages/flows/PingOneLogoutFlow';
import PingOneMFAWorkflowLibraryV7 from './pages/flows/PingOneMFAWorkflowLibraryV7';
import PingOnePARFlowV7 from './pages/flows/PingOnePARFlowV7';
import RARFlowV7 from './pages/flows/RARFlowV7';
import RedirectlessFlowV9_Real from './pages/flows/RedirectlessFlowV9_Real';
import SAMLBearerAssertionFlowV7 from './pages/flows/SAMLBearerAssertionFlowV7';
import SAMLServiceProviderFlowV1 from './pages/flows/SAMLServiceProviderFlowV1';
import TokenIntrospectionFlowPingUI from './pages/flows/TokenIntrospectionFlow.PingUI';
import TokenRevocationFlow from './pages/flows/TokenRevocationFlow';
import UserInfoFlow from './pages/flows/UserInfoFlow';
import UserInfoPostFlow from './pages/flows/UserInfoPostFlow';
import V7RMCondensedMock from './pages/flows/V7RMCondensedMock';
import V7RMOAuthAuthorizationCodeFlow_Condensed from './pages/flows/V7RMOAuthAuthorizationCodeFlow_Condensed';
import V7RMOIDCResourceOwnerPasswordFlow from './pages/flows/V7RMOIDCResourceOwnerPasswordFlow';
import WorkerTokenFlowV7 from './pages/flows/WorkerTokenFlowV7';
// import InteractiveTutorials from './pages/InteractiveTutorials'; // Removed - unused tutorial feature
import JWKSTroubleshooting from './pages/JWKSTroubleshooting';
import ResponseModesLearnPage from './pages/learn/ResponseModesLearnPage';
import OAuth21 from './pages/OAuth21';
import OAuthOIDCTraining from './pages/OAuthOIDCTraining';
import OIDC from './pages/OIDC';
import OIDCSessionManagement from './pages/OIDCSessionManagement';
import OrganizationLicensing from './pages/OrganizationLicensing';
import { P1MFASamples } from './pages/P1MFASamples';
import PARvsRAR from './pages/PARvsRAR';
import PingAIResourcesPingUI from './pages/PingAIResources.PingUI';
import PingOneAuditActivities from './pages/PingOneAuditActivities';
import PingOneAuthentication from './pages/PingOneAuthentication';
import PingOneAuthenticationCallback from './pages/PingOneAuthenticationCallback';
import PingOneAuthenticationResult from './pages/PingOneAuthenticationResult';
import PingOneIdentityMetricsPingUI from './pages/PingOneIdentityMetrics.PingUI';
import PingOneMockFeatures from './pages/PingOneMockFeatures';
import PingOneSessionsAPI from './pages/PingOneSessionsAPI';
import PingOneUserProfilePingUI from './pages/PingOneUserProfile.PingUI';
import PingOneWebhookViewer from './pages/PingOneWebhookViewer';
import PostmanCollectionGeneratorPingUI from './pages/PostmanCollectionGenerator.PingUI';
import SDKSampleApp from './pages/SDKSampleApp';
import ServiceTestRunner from './pages/ServiceTestRunner';
import JWTExamples from './pages/sdk-examples/JWTExamples';
import OIDCExamples from './pages/sdk-examples/OIDCExamples';
import SDKDocumentation from './pages/sdk-examples/SDKDocumentation';
import SDKExamplesHomePingUI from './pages/sdk-examples/SDKExamplesHome.PingUI';
import HelioMartPasswordResetPingUI from './pages/security/HelioMartPasswordReset.PingUI';
import TestDemo from './pages/TestDemo';
import TokenManagement from './pages/TokenManagement';
import UltimateTokenDisplayDemoPingUI from './pages/UltimateTokenDisplayDemo.PingUI';
import URLDecoder from './pages/URLDecoder';
import WorkerTokenTesterPingUI from './pages/WorkerTokenTester.PingUI';
import { FIDO2SampleApp } from './samples/p1mfa/fido2/FIDO2SampleApp';
import { IntegratedMFASample } from './samples/p1mfa/IntegratedMFASample';
import { SMSSampleApp } from './samples/p1mfa/sms/SMSSampleApp';
import CIBAFlowV8 from './v8/flows/CIBAFlowV8';
import { EmailMFASignOnFlowV8 } from './v8/flows/EmailMFASignOnFlowV8';
import { ImplicitFlowV8 } from './v8/flows/ImplicitFlowV8';
import { MFAConfigurationPageV8 } from './v8/flows/MFAConfigurationPageV8';
import MFADeviceManagementFlowV8 from './v8/flows/MFADeviceManagementFlowV8';
import { MFADeviceOrderingFlowV8 } from './v8/flows/MFADeviceOrderingFlowV8';
import { MFAFlowV8 } from './v8/flows/MFAFlowV8';
import MFAReportingFlowV8 from './v8/flows/MFAReportingFlowV8';
import OAuthAuthorizationCodeFlowV8 from './v8/flows/OAuthAuthorizationCodeFlowV8';
import OIDCHybridFlowV8 from './v8/flows/OIDCHybridFlowV8';
import PingOneProtectFlowV8 from './v8/flows/PingOneProtectFlowV8';
import ResourcesAPIFlowV8 from './v8/flows/ResourcesAPIFlowV8';
import { FIDO2ConfigurationPageV8 } from './v8/flows/types/FIDO2ConfigurationPageV8';
import { MobileOTPConfigurationPageV8 } from './v8/flows/types/MobileOTPConfigurationPageV8';
import { UserSearchPage } from './pages/UserSearchPage';
import { LoginPatternsPage } from './pages/LoginPatternsPage';
import { TokenApiDocumentationPage } from './pages/TokenApiDocumentationPage';
import { SpiffeSpireTokenDisplayPage } from './pages/SpiffeSpireTokenDisplayPage';
import { TokenRefreshPage } from './pages/TokenRefreshPage';

// Lazy load unified MFA flow for code splitting
const UnifiedMFARegistrationFlowV8_Legacy = React.lazy(() =>
	import('./v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy').then((module) => ({
		default: module.UnifiedMFARegistrationFlowV8,
	}))
);
// const _EmailFlowV8 = React.lazy(() =>
//	import('./v8/flows/types/EmailFlowV8').then((module) => ({ default: module.EmailFlowV8 }))
// );
const FIDO2FlowV8 = React.lazy(() =>
	import('./v8/flows/types/FIDO2FlowV8').then((module) => ({ default: module.FIDO2FlowV8 }))
);
const MobileFlowV8 = React.lazy(() =>
	import('./v8/flows/types/MobileFlowV8').then((module) => ({ default: module.MobileFlowV8 }))
);

// const _SMSFlowV8 = React.lazy(() =>
//	import('./v8/flows/types/SMSFlowV8').then((module) => ({ default: module.SMSFlowV8 }))
// );
// const _WhatsAppFlowV8 = React.lazy(() =>
//	import('./v8/flows/types/WhatsAppFlowV8').then((module) => ({ default: module.WhatsAppFlowV8 }))
// );

import DeviceManagementV9PingUI from './pages/DeviceManagementV9.PingUI';
import EnvironmentManagementPageV8PingUI from './pages/EnvironmentManagementPageV8.PingUI';
import TokenExchangeFlowV9PingUI from './pages/flows/TokenExchangeFlowV9.PingUI';
// Import Protect Portal
import ProtectPortalWrapper from './pages/protect-portal/ProtectPortalWrapper';
import { CreateCompanyPage } from './pages/protect-portal/pages/CreateCompanyPage';
import DavinciTodoApp from './sdk-examples/davinci-todo-app/DavinciTodoApp';
import { DebugLogViewerPopoutV8 } from './v8/pages/DebugLogViewerPopoutV8';
import DeleteAllDevicesUtilityV8 from './v8/pages/DeleteAllDevicesUtilityV8';
import DeviceAuthenticationDetailsV8 from './v8/pages/DeviceAuthenticationDetailsV8';
import { FIDO2RegistrationDocsPageV8 } from './v8/pages/FIDO2RegistrationDocsPageV8';
import MFADeviceCreateDemoV8 from './v8/pages/MFADeviceCreateDemoV8';
import { MFAFeatureFlagsAdminV8 } from './v8/pages/MFAFeatureFlagsAdminV8';
import { MobileRegistrationDocsPageV8 } from './v8/pages/MobileRegistrationDocsPageV8';
import UnifiedCredentialsMockupV8 from './v8/pages/UnifiedCredentialsMockupV8';
import { isPopoutWindow } from './v8/utils/debugLogViewerPopoutHelperV8';
import V8MTokenExchange from './v8m/pages/V8MTokenExchange';
import V8MTokenExchangePingUI from './v8m/pages/V8MTokenExchange.PingUI';
import CallbackHandlerV8U from './v8u/components/CallbackHandlerV8U';
import UnifiedFlowErrorBoundary from './v8u/components/UnifiedFlowErrorBoundary';

// Lazy load heavy V8U components for better performance
const UnifiedFlowHelperPageV8U = lazy(() => import('./v8u/components/UnifiedFlowHelperPageV8U'));
const SpiffeSpireFlowV8U = lazy(() => import('./v8u/flows/SpiffeSpireFlowV8U'));
const UnifiedOAuthFlowV8U = lazy(() => import('./apps/oauth/flows/UnifiedOAuthFlowV8U'));
const SpiffeSpireTokenDisplayV8U = lazy(() => import('./v8u/pages/SpiffeSpireTokenDisplayV8U'));
const EnhancedStateManagementPage = lazy(() => import('./v8u/pages/EnhancedStateManagementPage'));
const TokenApiDocumentationPage = lazy(() => import('./v8u/pages/TokenApiDocumentationPage'));
const FlowComparisonPage = lazy(() => import('./v8u/pages/FlowComparisonPage'));

// Import test pages
const ImplicitFlowTest = lazy(() => import('./pages/test/ImplicitFlowTest'));
const AllFlowsApiTest = lazy(() => import('./pages/test/AllFlowsApiTest'));
const MFAFlowsApiTest = lazy(() => import('./pages/test/MFAFlowsApiTest'));
const PARTest = lazy(() => import('./pages/test/PARTest'));
const TestCallback = lazy(() => import('./pages/test/TestCallback'));
const TokenStatusPageV8U = lazy(() => import('./v8u/pages/TokenStatusPageV8U'));
const ApiStatusPageV9 = lazy(() => import('./pages/ApiStatusPageV9.PingUI'));

// Import V7 pages
const V7MOAuthAuthCode = lazy(() => import('./v7/pages/V7MOAuthAuthCode'));
const V7MDeviceAuthorization = lazy(() => import('./v7/pages/V7MDeviceAuthorization'));
const V7MClientCredentials = lazy(() => import('./v7/pages/V7MClientCredentials'));
const V7MImplicitFlow = lazy(() => import('./v7/pages/V7MImplicitFlow'));
const V7MROPC = lazy(() => import('./v7/pages/V7MROPC'));
const V7MSettings = lazy(() => import('./v7/pages/V7MSettings'));

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray100};
  text-align: left;
  direction: ltr;
`;

const ContentColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  text-align: left;
  direction: ltr;
`;

const MainContent = styled.main<{ $sidebarWidth: number }>`
  flex: 1;
  padding: 1.5rem 2rem;
  padding-top: calc(80px + 1.5rem); /* Account for fixed navbar (80px) + normal top padding */
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.white};
  text-align: left;
  direction: ltr;
  
  /* Ping UI namespace - applies to all content within main content area */
  &.end-user-nano,
  .end-user-nano {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1a1a1a;
    line-height: 1.5;
    
    /* Ping UI CSS variables */
    --ping-primary-color: #0066cc;
    --ping-secondary-color: #f8f9fa;
    --ping-border-color: #dee2e6;
    --ping-text-color: #1a1a1a;
    --ping-background-color: #ffffff;
    --ping-hover-color: #f1f3f4;
    --ping-active-color: #e3e6ea;
    --ping-success-color: #28a745;
    --ping-warning-color: #ffc107;
    --ping-error-color: #dc3545;
    
    /* Ping UI spacing system */
    --ping-spacing-xs: 0.25rem;
    --ping-spacing-sm: 0.5rem;
    --ping-spacing-md: 1rem;
    --ping-spacing-lg: 1.5rem;
    --ping-spacing-xl: 2rem;
    --ping-spacing-xxl: 3rem;
    
    /* Ping UI border radius */
    --ping-border-radius-sm: 0.25rem;
    --ping-border-radius-md: 0.375rem;
    --ping-border-radius-lg: 0.5rem;
    
    /* Ping UI transitions */
    --ping-transition-fast: 0.15s ease-in-out;
    --ping-transition-normal: 0.2s ease-in-out;
    --ping-transition-slow: 0.3s ease-in-out;
  }
  
  /* Apply Ping UI namespace to all direct children */
  & > * {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: all 0.15s ease-in-out;
  }
  
  /* Ping UI button styles within main content */
  & button,
  & .btn,
  & input[type="button"],
  & input[type="submit"] {
    transition: all 0.15s ease-in-out;
    border-radius: 0.375rem;
    font-weight: 500;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: none;
    }
  }
  
  /* Ping UI form styles */
  & input,
  & select,
  & textarea {
    transition: all 0.15s ease-in-out;
    border-radius: 0.375rem;
    
    &:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
    }
  }
  
  /* Ping UI card styles */
  & .card,
  & .panel,
  & .container {
    transition: all 0.15s ease-in-out;
    
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
  
  @keyframes fadeInPage {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 1rem;
    margin-left: 0;
    margin-top: 100px;
  }
`;

const COLOR_SCHEMES: Record<UISettings['colorScheme'], Partial<DefaultTheme['colors']>> = {
	blue: {
		primary: '#2563eb',
		primaryLight: '#3b82f6',
		primaryDark: '#1d4ed8',
		secondary: '#10b981',
	},
	green: {
		primary: '#059669',
		primaryLight: '#34d399',
		primaryDark: '#047857',
		secondary: '#2563eb',
	},
	purple: {
		primary: '#7c3aed',
		primaryLight: '#a78bfa',
		primaryDark: '#5b21b6',
		secondary: '#f59e0b',
	},
	orange: {
		primary: '#ea580c',
		primaryLight: '#fb923c',
		primaryDark: '#c2410c',
		secondary: '#2563eb',
	},
	red: {
		primary: '#dc2626',
		primaryLight: '#f87171',
		primaryDark: '#b91c1c',
		secondary: '#2563eb',
	},
};

const DARK_MODE_OVERRIDES: Partial<DefaultTheme['colors']> = {
	light: '#0f172a',
	dark: '#f8fafc',
	gray100: '#111827',
	gray200: '#1f2937',
	gray300: '#374151',
	gray400: '#4b5563',
	gray500: '#6b7280',
	gray600: '#9ca3af',
	gray700: '#d1d5db',
	gray800: '#e5e7eb',
	gray900: '#f9fafb',
};

// Removed ScrollToTop component - it was scrolling the entire window
// including the sidebar, causing menu jumps. Now we only scroll the
// main content area in the useEffect below.

function NotFoundRedirect() {
	const navigate = useNavigate();
	const location = useLocation();
	const [isOpen, setIsOpen] = useState(true);

	const goToDashboard = useCallback(() => {
		setIsOpen(false);
		navigate('/dashboard', { replace: true });
	}, [navigate]);

	useEffect(() => {
		const timeout = window.setTimeout(goToDashboard, 7000);
		return () => window.clearTimeout(timeout);
	}, [goToDashboard]);

	return (
		<ModalPresentationService
			isOpen={isOpen}
			onClose={goToDashboard}
			title="App Not Found"
			description={`We couldn't find anything at "${location.pathname}". Redirecting you to the dashboard.`}
			actions={[
				{
					label: 'Go to Dashboard',
					onClick: goToDashboard,
					variant: 'primary',
				},
			]}
		/>
	);
}

const AppRoutes: React.FC = () => {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [sidebarWidth, setSidebarWidth] = useState(() => {
		try {
			const saved = localStorage.getItem('sidebar.width');
			const parsed = saved ? parseInt(saved, 10) : NaN;
			if (Number.isFinite(parsed) && parsed >= 300 && parsed <= 600) return parsed;
		} catch {}
		return 450; // Default width, matching Sidebar component
	});

	// Listen for sidebar width changes from localStorage
	useEffect(() => {
		const handleStorageChange = () => {
			try {
				const saved = localStorage.getItem('sidebar.width');
				const parsed = saved ? parseInt(saved, 10) : NaN;
				if (Number.isFinite(parsed) && parsed >= 300 && parsed <= 600) {
					setSidebarWidth(parsed);
				}
			} catch {}
		};

		// Check on mount
		handleStorageChange();

		// Listen for storage events (in case sidebar updates localStorage)
		window.addEventListener('storage', handleStorageChange);

		// Also poll occasionally for same-tab updates (since storage event only fires cross-tab)
		const interval = setInterval(handleStorageChange, 500);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			clearInterval(interval);
		};
	}, []);

	const [showCredentialModal, setShowCredentialModal] = useState(false);
	const { showAuthModal, authRequestData, proceedWithOAuth, closeAuthModal } = useAuth();
	const location = useLocation();

	// Scroll to top on route change - scroll both window and main content
	useEffect(() => {
		// Skip auto-scroll for certain flows to preserve scroll position
		const skipAutoScroll: string[] = [
			// Add flows that should preserve scroll position
		];

		if (skipAutoScroll.some((path) => location.pathname.includes(path))) {
			console.log('🌍 [GlobalScroll] Skipping auto-scroll for:', location.pathname);
			return;
		}

		// Scroll window to top
		window.scrollTo(0, 0);

		// Also scroll the main content area
		const mainContent = document.querySelector('main');
		if (mainContent) {
			mainContent.scrollTop = 0;
		}

		// Scroll any other scrollable containers
		const scrollableContainers = document.querySelectorAll('[data-scrollable]');
		scrollableContainers.forEach((container) => {
			if (container instanceof HTMLElement) {
				container.scrollTop = 0;
			}
		});

		// Also scroll the content column if it exists
		const contentColumn = document.querySelector('[data-content-column]');
		if (contentColumn) {
			contentColumn.scrollTop = 0;
		}
	}, [location.pathname]);

	// Initialize sidebar state (force open on mount, then respect localStorage)
	useEffect(() => {
		// Clear any stale localStorage state that might have sidebar closed
		const savedSidebarState = localStorage.getItem('sidebar.open');
		if (savedSidebarState === 'false') {
			// Reset to open if it was previously closed
			localStorage.setItem('sidebar.open', 'true');
			setSidebarOpen(true);
		}
	}, []);

	// Persist sidebar open state to localStorage
	useEffect(() => {
		localStorage.setItem('sidebar.open', sidebarOpen.toString());
	}, [sidebarOpen]);

	// Removed startup spinner - not needed

	// Initial credential check
	useEffect(() => {
		const checkConfiguration = () => {
			try {
				const flowConfig = JSON.parse(
					localStorage.getItem('enhanced-flow-authorization-code') || '{}'
				);
				const shouldShowCredentialsModal = flowConfig.showCredentialsModal === true;
				const skipStartupModal = localStorage.getItem('skip_startup_credentials_modal') === 'true';

				let allCredentials = credentialManager.loadConfigCredentials();
				if (!allCredentials.environmentId && !allCredentials.clientId) {
					allCredentials = credentialManager.loadAuthzFlowCredentials();
				}

				const hasPermanentCredentials = !!(allCredentials.environmentId && allCredentials.clientId);
				const hasSessionCredentials = !!allCredentials.clientSecret;

				if (
					!hasPermanentCredentials &&
					!hasSessionCredentials &&
					shouldShowCredentialsModal &&
					!skipStartupModal
				) {
					setShowCredentialModal(true);
				} else {
					setShowCredentialModal(false);
				}
			} catch (error) {
				console.warn(' [App] Error checking configuration:', error);
				setShowCredentialModal(true);
			}
		};

		const timer = setTimeout(checkConfiguration, 100);
		return () => clearTimeout(timer);
	}, []);

	const toggleSidebar = () => setSidebarOpen((prev) => !prev);

	const handleCredentialSetupComplete = () => {
		setShowCredentialModal(false);
		console.log('Credential setup completed, modal hidden');
	};

	return (
		<>
			<GlobalErrorDisplay />
			<RouteRestorer />
			{isPopoutWindow() ? (
				// Popout window - render without layout
				<Routes>
					<Route path="/v8/debug-logs-popout" element={<DebugLogViewerPopoutV8 />} />
					<Route path="*" element={<Navigate to="/v8/debug-logs-popout" replace />} />
				</Routes>
			) : (
				// Main app - render with full layout
				<AppContainer>
					<Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} sidebarWidth={sidebarWidth} />
					<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
					<ContentColumn>
						<MainContent $sidebarWidth={sidebarWidth} className="end-user-nano">
							<Routes>
								<Route path="/login" element={<LoginPingUI />} />
								<Route path="/callback" element={<Callback />} />
								{/* Per-flow callback routes */}
								{/* V8U Unified Callback Handler - handles all V8U flows */}
								<Route path="/unified-callback" element={<CallbackHandlerV8U />} />
								<Route path="/authz-callback" element={<CallbackHandlerV8U />} />
								{/* CRITICAL: MFA user login callback route - DO NOT REMOVE - Used by MFA flows for user authentication */}
								<Route path="/user-login-callback" element={<CallbackHandlerV8U />} />
								{/* CRITICAL: MFA-specific user login callback route - DO NOT REMOVE - Used by MFA flows for user authentication */}
								<Route path="/user-mfa-login-callback" element={<CallbackHandlerV8U />} />
								{/* CRITICAL: Unified MFA callback routes - DO NOT REMOVE - Used by unified MFA flows */}
								<Route path="/mfa-unified-callback" element={<CallbackHandlerV8U />} />
								<Route path="/mfa-hub-callback" element={<CallbackHandlerV8U />} />
								{/* LEGACY: V8 Unified MFA callback routes - redirects to new routes for backward compatibility */}
								<Route path="/v8/unified-mfa-callback" element={<CallbackHandlerV8U />} />
								<Route path="/hybrid-callback" element={<HybridCallback />} />
								<Route path="/implicit-callback" element={<ImplicitCallback />} />
								<Route path="/oauth-implicit-callback" element={<ImplicitCallback />} />
								<Route path="/oidc-implicit-callback" element={<ImplicitCallback />} />
								<Route path="/worker-token-callback" element={<WorkerTokenCallback />} />
								<Route path="/device-code-status" element={<DeviceCodeStatus />} />
								<Route path="/logout-callback" element={<LogoutCallback />} />
								<Route path="/authz-logout-callback" element={<LogoutCallback />} />
								<Route path="/implicit-logout-callback" element={<LogoutCallback />} />
								<Route path="/hybrid-logout-callback" element={<LogoutCallback />} />
								<Route path="/device-logout-callback" element={<LogoutCallback />} />
								<Route path="/worker-token-logout-callback" element={<LogoutCallback />} />
								<Route path="/p1auth-logout-callback" element={<LogoutCallback />} />
								<Route path="/dashboard-logout-callback" element={<LogoutCallback />} />
								<Route path="/dashboard-callback" element={<DashboardCallback />} />
								{/* Dynamic callback route - handles any redirect URI the user configures */}
								<Route path="/oauth-callback" element={<AuthzCallback />} />
								<Route path="/oidc-callback" element={<AuthzCallback />} />
								<Route path="/mfa-callback" element={<AuthzCallback />} />
								<Route path="/pingone-callback" element={<AuthzCallback />} />
								{/* Catch-all callback route for any custom redirect URI */}
								<Route path="/callback/*" element={<AuthzCallback />} />
								<Route path="/" element={<Navigate to="/dashboard" replace />} />
								<Route path="/dashboard" element={<Dashboard />} />
								<Route path="/flows" element={<OAuthFlowsNew />}>
									<Route path="compare" element={<FlowComparisonTool />} />
									<Route path="diagrams" element={<InteractiveFlowDiagram />} />
									<Route path="mfa" element={<MFAFlow />} />
								</Route>
								{/* Tools & Utilities Routes */}
								<Route path="/sdk-sample-app" element={<SDKSampleApp />} />
								<Route
									path="/ultimate-token-display-demo"
									element={<UltimateTokenDisplayDemoPingUI />}
								/>
								{/* SDK Examples Routes */}
								<Route path="/sdk-examples" element={<SDKExamplesHomePingUI />} />
								<Route path="/sdk-examples/jwt-authentication" element={<JWTExamples />} />
								<Route path="/sdk-examples/oidc-centralized-login" element={<OIDCExamples />} />
								<Route path="/sdk-examples/documentation" element={<SDKDocumentation />} />
								<Route path="/sdk-examples/davinci-todo-app" element={<DavinciTodoApp />} />
								{/* Environment Management */}
								<Route path="/environments" element={<EnvironmentManagementPageV8PingUI />} />
								{/* DaVinci Todo App */}
								<Route path="/davinci-todo" element={<DavinciTodoApp />} />
								{/* V7 OAuth/OIDC Flow Routes */}
								<Route
									path="/flows/oauth-authorization-code-v7"
									element={<OAuthAuthorizationCodeFlowV7 />}
								/>
								<Route
									path="/flows/oauth-authorization-code-v7-2"
									element={<OAuthAuthorizationCodeFlowV7_2 />}
								/>
								<Route
									path="/flows/oauth-authorization-code-v8"
									element={<OAuthAuthorizationCodeFlowV8 />}
								/>
								<Route
									path="/flows/dpop-authorization-code-v8"
									element={
										<React.Suspense fallback={<div>Loading...</div>}>
											<DpopAuthorizationCodeFlowV8 />
										</React.Suspense>
									}
								/>
								<Route path="/flows/mfa-v8" element={<MFAFlowV8 />} />
								<Route
									path="/v8/unified-mfa"
									element={
										<React.Suspense fallback={<div>Loading...</div>}>
											<UnifiedMFARegistrationFlowV8_Legacy registrationFlowType="admin" />
										</React.Suspense>
									}
								/>
								<Route
									path="/v8/unified-credentials-mockup"
									element={<div>Unified Credentials Mockup - Coming Soon</div>}
								/>
								{/* TOTP uses unified flow architecture like SMS/Email */}
								<Route
									path="/v8/mfa/register/totp/device"
									element={
										<React.Suspense fallback={<div>Loading...</div>}>
											{/* Temporarily commented out due to import issue */}
											{/* <UnifiedMFARegistrationFlowV8_Legacy deviceType="TOTP" /> */}
										</React.Suspense>
									}
								/>
								<Route path="/v8/mfa/register/fido2" element={<FIDO2ConfigurationPageV8 />} />
								<Route
									path="/v8/mfa/register/fido2/device"
									element={
										<React.Suspense fallback={<div>Loading...</div>}>
											<FIDO2FlowV8 />
										</React.Suspense>
									}
								/>
								<Route
									path="/v8/mfa/register/fido2/docs"
									element={<FIDO2RegistrationDocsPageV8 />}
								/>
								{/* Legacy MFA routes redirect to v8 paths */}
								<Route
									path="/mfa/fido"
									element={<Navigate to="/v8/mfa/register/fido2" replace />}
								/>
								<Route
									path="/mfa/fido/device"
									element={<Navigate to="/v8/mfa/register/fido2/device" replace />}
								/>
								{/* Platform and Security Key routes redirect to FIDO2 (they use the same flow) */}
								<Route
									path="/v8/mfa/register/platform"
									element={<Navigate to="/v8/mfa/register/fido2" replace />}
								/>
								<Route
									path="/v8/mfa/register/platform/device"
									element={<Navigate to="/v8/mfa/register/fido2/device" replace />}
								/>
								<Route
									path="/v8/mfa/register/security_key"
									element={<Navigate to="/v8/mfa/register/fido2" replace />}
								/>
								<Route
									path="/v8/mfa/register/security_key/device"
									element={<Navigate to="/v8/mfa/register/fido2/device" replace />}
								/>
								{/* SMS routes redirect to Mobile (SMS functionality consolidated into Mobile flow) */}
								<Route
									path="/v8/mfa/register/sms"
									element={<Navigate to="/v8/mfa/register/mobile" replace />}
								/>
								<Route
									path="/v8/mfa/register/sms/device"
									element={<Navigate to="/v8/mfa/register/mobile/device" replace />}
								/>
								{/* Voice routes redirect to Mobile (Voice uses the same phone-based flow as Mobile) */}
								<Route
									path="/v8/mfa/register/voice"
									element={<Navigate to="/v8/mfa/register/mobile" replace />}
								/>
								<Route
									path="/v8/mfa/register/voice/device"
									element={<Navigate to="/v8/mfa/register/mobile/device" replace />}
								/>
								{/* Mobile routes - separate app from SMS */}
								<Route path="/v8/mfa/register/mobile" element={<MobileOTPConfigurationPageV8 />} />
								<Route
									path="/v8/mfa/register/mobile/device"
									element={
										<React.Suspense fallback={<div>Loading...</div>}>
											<MobileFlowV8 />
										</React.Suspense>
									}
								/>
								<Route
									path="/v8/mfa/register/mobile/docs"
									element={<MobileRegistrationDocsPageV8 />}
								/>
								<Route
									path="/v8/mfa/configure/fido2"
									element={<Navigate to="/v8/mfa/register/fido2" replace />}
								/>
								<Route path="/v8/mfa-config" element={<MFAConfigurationPageV8 />} />
								<Route path="/v8/mfa-feature-flags" element={<MFAFeatureFlagsAdminV8 />} />
								<Route path="/v8/mfa-device-management" element={<MFADeviceManagementFlowV8 />} />
								<Route path="/v8/mfa-device-ordering" element={<MFADeviceOrderingFlowV8 />} />
								<Route path="/v8/mfa-reporting" element={<MFAReportingFlowV8 />} />
								<Route
									path="/v8/mfa/device-authentication-details"
									element={<DeviceAuthenticationDetailsV8 />}
								/>
								<Route path="/v8/mfa/create-device" element={<MFADeviceCreateDemoV8 />} />
								<Route path="/v8/email-mfa-signon" element={<EmailMFASignOnFlowV8 />} />
								<Route path="/v8/resources-api" element={<ResourcesAPIFlowV8 />} />
								{/* Legacy Protect routes redirect to v8 paths */}
								<Route
									path="/pingone-protect"
									element={<Navigate to="/v8/protect" replace />}
								/>
								<Route path="/v8/protect" element={<PingOneProtectFlowV8 />} />
								<Route
									path="/flows/oauth-authorization-code-v7-condensed-mock"
									element={<V7RMOAuthAuthorizationCodeFlow_Condensed />}
								/>
								<Route path="/flows/v7rm-condensed-mock" element={<V7RMCondensedMock />} />
								{/* V7RM Mock Flows (Flows not supported by PingOne) */}
								<Route
									path="/flows/v7rm-oidc-ropc"
									element={<V7RMOIDCResourceOwnerPasswordFlow />}
								/>
								{/* Token Management Flows */}
								<Route path="/flows/token-revocation" element={<TokenRevocationFlow />} />
								<Route
									path="/flows/token-introspection"
									element={<TokenIntrospectionFlowPingUI />}
								/>
								{/* V7 Mock Educational Flow Routes */}
								<Route
									path="/v7/oauth/authorization-code"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MOAuthAuthCode oidc={false} title="V7M OAuth Authorization Code" />
										</Suspense>
									}
								/>
								<Route
									path="/v7/oidc/authorization-code"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MOAuthAuthCode oidc={true} title="V7M OIDC Authorization Code" />
										</Suspense>
									}
								/>
								<Route
									path="/v7/oauth/device-authorization"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MDeviceAuthorization />
										</Suspense>
									}
								/>
								<Route
									path="/v7/oauth/client-credentials"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MClientCredentials />
										</Suspense>
									}
								/>
								<Route
									path="/v7/oauth/implicit"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MImplicitFlow oidc={false} title="V7M OAuth Implicit Flow" />
										</Suspense>
									}
								/>
								<Route
									path="/v7/oidc/implicit"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MImplicitFlow oidc={true} title="V7M OIDC Implicit Flow" />
										</Suspense>
									}
								/>
								<Route
									path="/v7/oauth/ropc"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MROPC oidc={false} title="V7M Resource Owner Password Credentials" />
										</Suspense>
									}
								/>
								<Route
									path="/v7/oidc/ropc"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MROPC oidc={true} title="V7M OIDC Resource Owner Password Credentials" />
										</Suspense>
									}
								/>
								<Route
									path="/v7/settings"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MSettings />
										</Suspense>
									}
								/>
								<Route path="/flows/userinfo" element={<UserInfoPostFlow />} />
								<Route path="/flows/pingone-logout" element={<PingOneLogoutFlow />} />
								{/* RFC 6749 Compliant OAuth 2.0 Authorization Code Flow */}
								<Route
									path="/flows/oauth2-compliant-authorization-code"
									element={<OAuth2CompliantAuthorizationCodeFlow />}
								/>
								{/* OIDC Core 1.0 Compliant Authorization Code Flow */}
								<Route
									path="/flows/oidc-compliant-authorization-code"
									element={<OIDCCompliantAuthorizationCodeFlow />}
								/>
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route
									path="/flows/oauth-authorization-code-v6"
									element={<Navigate to="/flows/oauth-authorization-code-v7" replace />}
								/>
								<Route
									path="/flows/oidc-authorization-code-v6"
									element={<Navigate to="/flows/oauth-authorization-code-v7" replace />}
								/>
								{/* V7 Implicit Flow */}
								<Route path="/flows/implicit-v7" element={<ImplicitFlowV7 />} />
								{/* V8 Implicit Flow */}
								<Route path="/flows/implicit-v8" element={<ImplicitFlowV8 />} />
								{/* V8 Unified UI Mockup */}
								<Route
									path="/v8/unified-credentials-mockup"
									element={<UnifiedCredentialsMockupV8 />}
								/>
								{/* V8U Unified Flow - Single UI for all flows with real PingOne APIs */}
								<Route
									path="/v8u/unified/oauth-authz/:step?"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading Unified OAuth Flow..."
													subtext="Preparing flow configuration"
												/>
											}
										>
											<UnifiedFlowErrorBoundary>
												<UnifiedOAuthFlowV8U />
											</UnifiedFlowErrorBoundary>
										</Suspense>
									}
								/>
								<Route
									path="/v8u/unified/:flowType?/:step?"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading Unified OAuth Flow..."
													subtext="Preparing flow configuration"
												/>
											}
										>
											<UnifiedFlowErrorBoundary>
												<UnifiedOAuthFlowV8U />
											</UnifiedFlowErrorBoundary>
										</Suspense>
									}
								/>
								<Route
									path="/v8u/unified/helper"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading Flow Helper..."
													subtext="Preparing guidance documentation"
												/>
											}
										>
											<UnifiedFlowErrorBoundary>
												<UnifiedFlowHelperPageV8U />
											</UnifiedFlowErrorBoundary>
										</Suspense>
									}
								/>
								{/* Enhanced State Management */}
								<Route
									path="/v8u/enhanced-state-management"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading Enhanced State Management..."
													subtext="Initializing state management system"
												/>
											}
										>
											<UnifiedFlowErrorBoundary>
												<EnhancedStateManagementPage />
											</UnifiedFlowErrorBoundary>
										</Suspense>
									}
								/>
								{/* Token Monitoring Dashboard */}
								<Route
									path="/v8u/token-monitoring"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading Token Monitoring..."
													subtext="Initializing token monitoring service"
												/>
											}
										>
											<UnifiedFlowErrorBoundary>
												<TokenStatusPageV8U />
											</UnifiedFlowErrorBoundary>
										</Suspense>
									}
								/>
								{/* Token API Documentation */}
								<Route
									path="/v8u/token-api-docs"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading API Documentation..."
													subtext="Preparing API call documentation"
												/>
											}
										>
											<UnifiedFlowErrorBoundary>
												<TokenApiDocumentationPage />
											</UnifiedFlowErrorBoundary>
										</Suspense>
									}
								/>
								{/* Flow Comparison Tool */}
								<Route
									path="/v8u/flow-comparison"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading Flow Comparison..."
													subtext="Preparing comparison analysis"
												/>
											}
										>
											<UnifiedFlowErrorBoundary>
												<FlowComparisonPage />
											</UnifiedFlowErrorBoundary>
										</Suspense>
									}
								/>
								{/* V8 Utilities */}
								<Route path="/v8/device-management" element={<DeviceManagementV9PingUI />} />
								<Route path="/v8/delete-all-devices" element={<DeleteAllDevicesUtilityV8 />} />
								<Route path="/v8/debug-logs" element={<DebugLogViewerPopoutV8 />} />
								<Route path="/v8/debug-logs-popout" element={<DebugLogViewerPopoutV8 />} />
								{/* V8U SPIFFE/SPIRE Mock Flow and Token Viewer - multi-step lab */}
								<Route
									path="/v8u/spiffe-spire"
									element={<Navigate to="/v8u/spiffe-spire/attest" replace />}
								/>
								<Route
									path="/v8u/spiffe-spire/attest"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading SPIFFE/SPIRE Flow..."
													subtext="Preparing attestation workflow"
												/>
											}
										>
											<SpiffeSpireFlowV8U />
										</Suspense>
									}
								/>
								<Route
									path="/v8u/spiffe-spire/svid"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading SPIFFE/SPIRE Flow..."
													subtext="Preparing SVID workflow"
												/>
											}
										>
											<SpiffeSpireFlowV8U />
										</Suspense>
									}
								/>
								<Route
									path="/v8u/spiffe-spire/validate"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading SPIFFE/SPIRE Flow..."
													subtext="Preparing validation workflow"
												/>
											}
										>
											<SpiffeSpireFlowV8U />
										</Suspense>
									}
								/>
								<Route
									path="/v8u/spiffe-spire/tokens"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading Token Display..."
													subtext="Preparing SPIFFE/SPIRE tokens"
												/>
											}
										>
											<SpiffeSpireTokenDisplayV8U />
										</Suspense>
									}
								/>
								<Route
									path="/flows/oidc-implicit-v6"
									element={<Navigate to="/flows/implicit-v7?variant=oidc" replace />}
								/>
								<Route
									path="/flows/oauth-implicit-completion"
									element={<OAuthImplicitFlowCompletion />}
								/>
								{/* V7 Device Authorization Flow */}
								<Route
									path="/flows/device-authorization-v7"
									element={<DeviceAuthorizationFlowV7 />}
								/>
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route
									path="/flows/device-authorization-v6"
									element={<Navigate to="/flows/device-authorization-v7" replace />}
								/>
								<Route
									path="/flows/oidc-device-authorization-v6"
									element={<Navigate to="/flows/device-authorization-v7" replace />}
								/>
								{/* V7 JWT Bearer Token Flow */}
								<Route path="/flows/jwt-bearer-token-v7" element={<JWTBearerTokenFlowV7 />} />
								{/* V9 Token Exchange Flow - Production */}
								<Route path="/flows/token-exchange-v9" element={<TokenExchangeFlowV9PingUI />} />
								{/* V8M Token Exchange Flow */}
								<Route path="/flows/token-exchange-v7" element={<V8MTokenExchangePingUI />} />
								{/* Legacy V7 Token Exchange Flow */}
								<Route path="/flows/token-exchange-legacy" element={<V8MTokenExchange />} />
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route
									path="/flows/jwt-bearer-token-v6"
									element={<Navigate to="/flows/jwt-bearer-token-v7" replace />}
								/>
								{/* V7 SAML Bearer Assertion Flow */}
								<Route
									path="/flows/saml-bearer-assertion-v7"
									element={<SAMLBearerAssertionFlowV7 />}
								/>
								<Route
									path="/flows/saml-sp-dynamic-acs-v1"
									element={<SAMLServiceProviderFlowV1 />}
								/>
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route
									path="/flows/saml-bearer-assertion-v6"
									element={<Navigate to="/flows/saml-bearer-assertion-v7" replace />}
								/>
								{/* V7 Worker Token Flow */}
								<Route path="/flows/worker-token-v7" element={<WorkerTokenFlowV7 />} />
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route
									path="/flows/worker-token-v6"
									element={<Navigate to="/flows/worker-token-v7" replace />}
								/>
								{/* V7 Client Credentials Flow */}
								<Route path="/flows/client-credentials-v7" element={<ClientCredentialsFlowV7 />} />
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route
									path="/flows/client-credentials-v6"
									element={<Navigate to="/flows/client-credentials-v7" replace />}
								/>
								{/* V7 OIDC Hybrid Flow */}
								<Route path="/flows/oidc-hybrid-v7" element={<OIDCHybridFlowV7 />} />
								{/* V8 OIDC Hybrid Flow */}
								<Route path="/flows/hybrid-v8" element={<OIDCHybridFlowV8 />} />
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route
									path="/flows/oidc-hybrid-v6"
									element={<Navigate to="/flows/oidc-hybrid-v7" replace />}
								/>
								{/* V8 CIBA Flow */}
								<Route path="/flows/ciba-v8" element={<CIBAFlowV8 />} />
								{/* V9 CIBA Flow */}
								<Route path="/flows/ciba-v9" element={<CIBAFlowV9 />} />
								{/* Legacy V6/V7 routes - redirect to V9 for backward compatibility */}
								<Route path="/flows/ciba-v6" element={<Navigate to="/flows/ciba-v9" replace />} />
								<Route path="/flows/ciba-v7" element={<Navigate to="/flows/ciba-v9" replace />} />
								{/* Legacy Advanced Parameters V6 route - redirect to dashboard */}
								<Route
									path="/flows/advanced-parameters-v6/:flowType"
									element={<Navigate to="/dashboard" replace />}
								/>
								{/* Advanced OAuth Parameters Demo (Mock Flow) */}
								<Route
									path="/flows/advanced-oauth-params-demo"
									element={<AdvancedOAuthParametersDemoFlow />}
								/>
								{/* V9 Redirectless Flow */}
								<Route path="/flows/redirectless-v9-real" element={<RedirectlessFlowV9_Real />} />
								{/* Legacy V6 routes - redirect to V9 equivalents for backward compatibility */}
								<Route
									path="/flows/redirectless-v6"
									element={<Navigate to="/flows/redirectless-v9-real" replace />}
								/>
								<Route
									path="/flows/redirectless-v6-real"
									element={<Navigate to="/flows/redirectless-v9-real" replace />}
								/>
								<Route path="/flows/par" element={<PARFlow />} />
								<Route path="/flows-old/jwt-bearer" element={<JWTBearerFlow />} />
								{/* Unsupported by PingOne flows */}
								<Route
									path="/oauth/resource-owner-password"
									element={<Navigate to="/flows/oauth-ropc-v7" replace />}
								/>
								<Route
									path="/oidc/resource-owner-password"
									element={<Navigate to="/flows/oauth-ropc-v7" replace />}
								/>
								{/* V7 PingOne PAR Flow */}
								<Route path="/flows/pingone-par-v7" element={<PingOnePARFlowV7 />} />
								<Route path="/flows/par-v7" element={<PARFlowV7 />} />
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route
									path="/flows/pingone-par-v6"
									element={<Navigate to="/flows/pingone-par-v7" replace />}
								/>
								{/* V7 PingOne MFA Flow */}
								<Route
									path="/flows/pingone-complete-mfa-v7"
									element={<PingOneCompleteMFAFlowV7 />}
								/>
								<Route
									path="/flows/pingone-mfa-workflow-library-v7"
									element={<PingOneMFAWorkflowLibraryV7 />}
								/>
								<Route path="/flows/kroger-grocery-store-mfa" element={<KrogerGroceryStoreMFA />} />
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route
									path="/flows/pingone-mfa-v6"
									element={<Navigate to="/flows/pingone-complete-mfa-v7" replace />}
								/>
								<Route path="/pingone-authentication" element={<PingOneAuthentication />} />
								<Route
									path="/pingone-authentication/result"
									element={<PingOneAuthenticationResult />}
								/>
								<Route path="/pingone-mock-features" element={<PingOneMockFeatures />} />
								<Route
									path="/pingone-identity-metrics"
									element={<PingOneIdentityMetricsPingUI />}
								/>
								<Route path="/pingone-audit-activities" element={<PingOneAuditActivities />} />
								<Route path="/pingone-webhook-viewer" element={<PingOneWebhookViewer />} />
								<Route path="/organization-licensing" element={<OrganizationLicensing />} />
								<Route path="/p1-callback" element={<PingOneAuthenticationCallback />} />
								<Route path="/p1auth-callback" element={<PingOneAuthenticationCallback />} />
								{/* V7 RAR Flow */}
								<Route path="/flows/rar-v7" element={<RARFlowV7 />} />
								{/* DPoP Flow (Educational/Mock) */}
								<Route path="/flows/dpop" element={<DPoPFlow />} />
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route path="/flows/rar-v6" element={<Navigate to="/flows/rar-v7" replace />} />
								<Route
									path="/flows/oauth2-resource-owner-password"
									element={<OAuth2ResourceOwnerPasswordFlow />}
								/>
								<Route path="/flows/oauth-ropc-v7" element={<OAuthROPCFlowV7 />} />
								{/* Test MFA Flow */}
								<Route path="/mfa-test" element={<MFAFlow />} />
								{/* Legacy /oidc routes - Keep utility pages and unsupported flows */}
								<Route path="/oidc" element={<OIDC />}>
									<Route path="userinfo" element={<UserInfoFlow />} />
									<Route path="id-tokens" element={<IDTokensFlow />} />
									<Route
										path="resource-owner-password"
										element={<Navigate to="/flows/oauth-ropc-v7" replace />}
									/>
									<Route path="jwt-bearer" element={<JWTBearerFlow />} />
								</Route>
								{/* Backward-compatible redirect for older links */}
								<Route path="/oidc/tokens" element={<Navigate to="/oidc/id-tokens" replace />} />
								<Route path="/client-generator" element={<ClientGenerator />} />{' '}
								{/* <Route path="/application-generator" element={<ApplicationGeneratorPingUI />} /> */} {/* Temporarily disabled due to build issues */}
								<Route path="/oauth-code-generator-hub" element={<OAuthCodeGeneratorHub />} />
								<Route path="/configuration" element={<ConfigurationPingUI />} />
								<Route path="/analytics" element={<AnalyticsPingUI />} />
								<Route path="/documentation" element={<DocumentationPingUI />} />
								<Route path="/ping-ai-resources" element={<PingAIResourcesPingUI />} />
								<Route path="/pingone-user-profile" element={<PingOneUserProfilePingUI />} />
								<Route path="/worker-token-tester" element={<WorkerTokenTesterPingUI />} />
								<Route path="/ai-identity-architectures" element={<AIIdentityArchitectures />} />
								<Route path="/about" element={<AboutPingUI />} />
								<Route path="/flow-header-demo" element={<FlowHeaderDemo />} />
								<Route path="/test-demo" element={<TestDemo />} />
								<Route path="/environment-id-demo" element={<EnvironmentIdInputDemo />} />
								<Route path="/docs/oidc-specs" element={<OIDCSpecs />} />
								<Route path="/docs/oauth-for-ai" element={<OAuthForAI />} />
								<Route path="/docs/oidc-for-ai" element={<OIDCForAI />} />
								<Route path="/docs/ping-view-on-ai" element={<PingViewOnAI />} />
								<Route
									path="/docs/oauth2-security-best-practices"
									element={<OAuth2SecurityBestPractices />}
								/>
								<Route path="/docs/spiffe-spire-pingone" element={<SpiffeSpirePingOne />} />
								<Route path="/auto-discover" element={<AutoDiscoverPingUI />} />
								<Route path="/token-management" element={<TokenManagement />} />
								<Route
									path="/postman-collection-generator"
									element={<PostmanCollectionGeneratorPingUI />}
								/>
								<Route path="/samples/p1mfa" element={<P1MFASamples />} />
								<Route path="/samples/p1mfa/integrated" element={<IntegratedMFASample />} />
								<Route path="/samples/p1mfa/fido2" element={<FIDO2SampleApp />} />
								<Route path="/samples/p1mfa/sms" element={<SMSSampleApp />} />
								<Route path="/oauth-2-1" element={<OAuth21 />} />
								<Route path="/oidc-session-management" element={<OIDCSessionManagement />} />
								<Route path="/pingone-sessions-api" element={<PingOneSessionsAPI />} />
								<Route path="/par-vs-rar" element={<PARvsRAR />} />
								<Route path="/ciba-vs-device-authz" element={<CIBAvsDeviceAuthz />} />
								<Route path="/jwks-troubleshooting" element={<JWKSTroubleshooting />} />
								<Route path="/url-decoder" element={<URLDecoder />} />
								<Route path="/code-examples" element={<CodeExamplesDemo />} />
								<Route path="/code-examples-demo" element={<CodeExamplesDemo />} />
								<Route
									path="/compact-app-picker-demo"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<CompactAppPickerDemo />
										</Suspense>
									}
								/>
								<Route path="/device-mock-flow" element={<DeviceMockFlow />} />
								<Route path="/documentation/oidc-overview" element={<OIDCOverview />} />
								<Route path="/ai-glossary" element={<AIGlossary />} />
								<Route path="/ai-agent-overview" element={<AIAgentOverview />} />
								<Route path="/competitive-analysis" element={<CompetitiveAnalysis />} />
								<Route
									path="/comprehensive-oauth-education"
									element={<ComprehensiveOAuthEducation />}
								/>
								{/* User Search Page */}
								<Route path="/user-search" element={<UserSearchPage />} />
								{/* Login Patterns Page */}
								<Route path="/login-patterns" element={<LoginPatternsPage />} />
								{/* Token API Documentation Page */}
								<Route path="/token-api-documentation" element={<TokenApiDocumentationPage />} />
								{/* SPIFFE-Spire Token Display Page */}
								<Route path="/spiffe-spire-token-display" element={<SpiffeSpireTokenDisplayPage />} />
								{/* Token Refresh Page */}
								<Route path="/token-refresh" element={<TokenRefreshPage />} />
								{/* Protect Portal Application */}
								<Route path="/protect-portal" element={<ProtectPortalWrapper />} />
								{/* Company Editor Utility */}
								<Route
									path="/admin/create-company"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<CreateCompanyPage />
										</Suspense>
									}
								/>
								<Route path="/advanced-config" element={<AdvancedConfiguration />} />
								<Route
									path="/advanced-security-settings"
									element={<AdvancedSecuritySettingsDemo />}
								/>
								<Route
									path="/advanced-security-settings-comparison"
									element={<AdvancedSecuritySettingsComparison />}
								/>
								<Route
									path="/helio-mart-password-reset"
									element={<HelioMartPasswordResetPingUI />}
								/>
								{/* <Route path="/tutorials" element={<InteractiveTutorials />} /> */}{' '}
								{/* Removed - unused tutorial feature */}
								<Route path="/oauth-oidc-training" element={<OAuthOIDCTraining />} />
								<Route path="/learn/response-modes" element={<ResponseModesLearnPage />} />
								<Route path="/service-test-runner" element={<ServiceTestRunner />} />
								{/* Test Pages */}
								<Route
									path="/test/implicit-flow-test"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<ImplicitFlowTest />
										</Suspense>
									}
								/>
								<Route
									path="/test/all-flows-api-test"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<AllFlowsApiTest />
										</Suspense>
									}
								/>
								<Route
									path="/test/all-flows-api"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<AllFlowsApiTest />
										</Suspense>
									}
								/>
								<Route
									path="/test/mfa-flows-api-test"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<MFAFlowsApiTest />
										</Suspense>
									}
								/>
								<Route
									path="/test/par-test"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<PARTest />
										</Suspense>
									}
								/>
								<Route
									path="/production/api-tests"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<TokenStatusPageV8U />
										</Suspense>
									}
								/>
								<Route
									path="/system-status"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<ApiStatusPageV9 />
										</Suspense>
									}
								/>
								<Route
									path="/test-callback"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<TestCallback />
										</Suspense>
									}
								/>
								<Route
									path="/:customCallback(p1-callback)"
									element={<PingOneAuthenticationCallback />}
								/>
								<Route path="*" element={<NotFoundRedirect />} />
							</Routes>
						</MainContent>
					</ContentColumn>
				</AppContainer>
			)}

			<CredentialSetupModal
				isOpen={showCredentialModal}
				onClose={handleCredentialSetupComplete}
				onSave={(creds) => {
					console.log(' [App] Credentials saved from startup modal:', creds);
					// The modal will auto-close after save
				}}
				flowType="startup"
			/>

			<AuthorizationRequestModal
				isOpen={showAuthModal}
				onClose={closeAuthModal}
				onProceed={proceedWithOAuth}
				authorizationUrl={authRequestData?.authorizationUrl || ''}
				requestParams={authRequestData?.requestParams || {}}
			/>

			{/* Global Confirmation and Prompt Modals - Replace system modals */}
			<ConfirmationModalV8 />
			<PromptModalV8 />
		</>
	);
};

declare module 'styled-components' {
	export interface DefaultTheme {
		colors: {
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
			white: string;
			black: string;
		};
		fonts: {
			body: string;
			heading: string;
			monospace: string;
		};
		shadows: {
			sm: string;
			md: string;
			lg: string;
		};
		breakpoints: {
			sm: string;
			md: string;
			lg: string;
			xl: string;
		};
	}
}

const buildTheme = (settings: UISettings): DefaultTheme => {
	const scheme = COLOR_SCHEMES[settings.colorScheme] ?? COLOR_SCHEMES.blue;
	const darkModeOverrides = settings.darkMode ? DARK_MODE_OVERRIDES : {};

	return {
		colors: {
			...baseTheme.colors,
			...scheme,
			...darkModeOverrides,
		},
		fonts: baseTheme.fonts,
		shadows: {
			...baseTheme.shadows,
		},
		breakpoints: {
			sm: baseTheme.breakpoints.sm,
			md: baseTheme.breakpoints.md,
			lg: baseTheme.breakpoints.lg,
			xl: baseTheme.breakpoints.xl,
		},
		spacing: {
			xs: '0.25rem',
			sm: '0.5rem',
			md: '1rem',
			lg: '1.5rem',
			xl: '2rem',
			xxl: '4rem',
		},
		borderRadius: {
			sm: '0.125rem',
			md: '0.25rem',
			lg: '0.5rem',
			full: '9999px',
		},
	};
};

function App() {
	return (
		<UISettingsProvider>
			<AppContent />
		</UISettingsProvider>
	);
}

function AppContent() {
	const { settings } = useUISettings();
	const theme = useMemo(() => buildTheme(settings), [settings]);
	const location = useLocation();
	const isStandaloneLogViewerRoute = location.pathname === '/standalone/log-viewer';
	const [urlValidationModalState, setUrlValidationModalState] = useState<{
		isOpen: boolean;
		validationResult:
			| import('./services/authorizationUrlValidationService').UrlValidationResult
			| null;
		url: string;
		onProceed?: () => void;
		onFix?: () => void;
	}>({
		isOpen: false,
		validationResult: null,
		url: '',
	});

	// Floating log viewer state
	const [isFloatingLogViewerOpen, setIsFloatingLogViewerOpen] = useState(false);

	// Initialize credential debugger for development
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			// Import and initialize the debugger
			import('./utils/credentialDebugger').then(({ default: CredentialDebugger }) => {
				// Make it available globally
				(window as Window & { CredentialDebugger?: typeof CredentialDebugger }).CredentialDebugger =
					CredentialDebugger;
			});

			// Import and initialize field editing diagnostic
			import('./utils/fieldEditingDiagnostic').then(({ default: FieldEditingDiagnostic }) => {
				// Make it available globally
				(
					window as Window & { FieldEditingDiagnostic?: typeof FieldEditingDiagnostic }
				).FieldEditingDiagnostic = FieldEditingDiagnostic;
			});

			// Import and initialize token exchange tests
			import('./v8u/tests/tokenExchangeFlowTest').then(({ default: TokenExchangeFlowTest }) => {
				window.TokenExchangeFlowTest = TokenExchangeFlowTest;
				window.runTokenExchangeTests = () => {
					const test = new TokenExchangeFlowTest();
					test.runAllTests();
					return test.getResults();
				};
			});

			// Import and initialize integration tests
			import('./v8u/tests/tokenExchangeIntegrationTest').then(
				({ default: TokenExchangeIntegrationTest }) => {
					window.TokenExchangeIntegrationTest = TokenExchangeIntegrationTest;
					window.runIntegrationTests = async () => {
						const test = new TokenExchangeIntegrationTest();
						await test.runAllTests();
						return test.getResults();
					};
				}
			);
		}

		// Initialize field editing protection for all environments
		const fieldEditingService = FieldEditingService.getInstance();
		fieldEditingService.initialize({
			preventDisabledState: true,
			preventReadonlyState: true,
			ensurePointerEvents: true,
			monitorChanges: true,
			autoFix: true,
		});

		// Listen for URL validation modal updates
		const handleModalUpdate = (event: CustomEvent) => {
			setUrlValidationModalState(event.detail);
		};

		window.addEventListener('urlValidationModalUpdate', handleModalUpdate as EventListener);

		return () => {
			window.removeEventListener('urlValidationModalUpdate', handleModalUpdate as EventListener);
		};
	}, []);

	// Global Worker Token Modal State
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Handle global worker token modal events
	useEffect(() => {
		console.log('[App] Setting up worker token modal event listener...');

		const handleWorkerTokenModalEvent = (event: CustomEvent) => {
			console.log('[App] Opening worker token modal from:', event.detail?.source || 'unknown');
			console.log('[App] Setting showWorkerTokenModal to true');
			setShowWorkerTokenModal(true);
		};

		console.log('[App] Adding event listener for open-worker-token-modal');
		window.addEventListener(
			'open-worker-token-modal',
			handleWorkerTokenModalEvent as EventListener
		);

		return () => {
			console.log('[App] Cleaning up worker token modal event listener');
			window.removeEventListener(
				'open-worker-token-modal',
				handleWorkerTokenModalEvent as EventListener
			);
		};
	}, []);

	if (isStandaloneLogViewerRoute) {
		const standaloneWidth = Math.max(900, window.innerWidth - 40);
		const standaloneHeight = Math.max(500, window.innerHeight - 40);

		return (
			<ThemeProvider theme={theme}>
				<GlobalStyle />
				<FloatingLogViewer
					isOpen
					standaloneMode
					onClose={() => window.close()}
					initialWidth={standaloneWidth}
					initialHeight={standaloneHeight}
					initialX={20}
					initialY={20}
				/>
			</ThemeProvider>
		);
	}

	return (
		<ThemeProvider theme={theme}>
			<ErrorBoundary>
				<ServerStatusProvider showHealthCheck={false}>
					<AuthErrorBoundary>
						<NotificationProvider>
							<AuthProvider>
								<FlowStateProvider>
									<UnifiedFlowProvider>
										<StartupWrapper>
											<PageStyleProvider>
												<GlobalStyle />
												<NotificationContainer />
												<ApiRequestModalProvider />
												<AppRoutes />
											</PageStyleProvider>
										</StartupWrapper>
									</UnifiedFlowProvider>
								</FlowStateProvider>
							</AuthProvider>
						</NotificationProvider>
					</AuthErrorBoundary>
				</ServerStatusProvider>
			</ErrorBoundary>

			{/* Global URL Validation Modal */}
			{urlValidationModalState.validationResult && (
				<AuthorizationUrlValidationModal
					isOpen={urlValidationModalState.isOpen}
					onClose={() => authorizationUrlValidationModalService.hideModal()}
					validationResult={urlValidationModalState.validationResult}
					url={urlValidationModalState.url}
					{...(urlValidationModalState.onProceed && {
						onProceed: urlValidationModalState.onProceed,
					})}
					{...(urlValidationModalState.onFix && { onFix: urlValidationModalState.onFix })}
				/>
			)}

			{/* Global Worker Token Modal */}
			{showWorkerTokenModal && (
				<>
					{console.log('[App] Rendering WorkerTokenModal with isOpen:', showWorkerTokenModal)}
					<WorkerTokenModal
						isOpen={showWorkerTokenModal}
						onClose={() => {
							console.log('[App] WorkerTokenModal onClose called');
							setShowWorkerTokenModal(false);
						}}
						onContinue={() => {
							console.log('[App] Worker token modal closed');
							setShowWorkerTokenModal(false);
						}}
						flowType="global"
						environmentId=""
					/>
				</>
			)}

			{/* Global Backend Connectivity Modal */}
			<BackendDownModalV8 />

			{!isStandaloneLogViewerRoute && (
				<>
					{/* Floating Log Viewer */}
					<FloatingLogViewer
						isOpen={isFloatingLogViewerOpen}
						onClose={() => setIsFloatingLogViewerOpen(false)}
					/>

					{/* Floating Log Toggle */}
					<FloatingLogToggle
						isOpen={isFloatingLogViewerOpen}
						onClick={() => setIsFloatingLogViewerOpen(!isFloatingLogViewerOpen)}
					/>
				</>
			)}
		</ThemeProvider>
	);
}

export default App;
