import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import styled, { type DefaultTheme, ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/NewAuthContext';
import { PageStyleProvider } from './contexts/PageStyleContext';
import { type UISettings, UISettingsProvider, useUISettings } from './contexts/UISettingsContext';
import { PageFooter } from './services/footerService';
import { theme as baseTheme, GlobalStyle } from './styles/global';
import './styles/spec-cards.css';
import './styles/ui-settings.css';
import './styles/button-text-white-enforcement.css'; // CRITICAL: Ensures all buttons have white text
import { lazy, Suspense } from 'react';
import CodeExamplesDemo from './components/CodeExamplesDemo';
import CredentialSetupModal from './components/CredentialSetupModal';
import { ApiDisplayServiceDemo } from './v8/components/__tests__/ApiDisplayServiceDemo';
import { ConfirmationModalV8 } from './v8/components/ConfirmationModalV8';
import { PromptModalV8 } from './v8/components/PromptModalV8';

const CompactAppPickerDemo = lazy(() => import('./pages/CompactAppPickerDemo'));

import DeviceMockFlow from './components/DeviceMockFlow';
import DynamicHeaderExample from './components/DynamicHeaderExample';
import FlowComparisonTool from './components/FlowComparisonTool';
import FlowHeaderDemo from './components/FlowHeaderDemo';
import InteractiveFlowDiagram from './components/InteractiveFlowDiagram';
import Navbar from './components/Navbar';
import { RouteRestorer } from './components/RouteRestorer';
import Sidebar from './components/Sidebar';
import SidebarTest from './components/SidebarTest';
import { useAuth } from './contexts/NewAuthContext';
import { NotificationContainer, NotificationProvider } from './hooks/useNotifications';
import AIIdentityArchitectures from './pages/AIIdentityArchitectures';
import ApplicationGenerator from './pages/ApplicationGenerator';
import Callback from './pages/Callback';
import ClientGenerator from './pages/ClientGenerator';
import Configuration from './pages/Configuration';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import OAuthCodeGeneratorHub from './pages/OAuthCodeGeneratorHub';
import OAuthFlowsNew from './pages/OAuthFlowsNew';
import { ApiRequestModalProvider } from './services/apiRequestModalService';
import {
	AuthorizationUrlValidationModal,
	authorizationUrlValidationModalService,
} from './services/authorizationUrlValidationModalService';
import FieldEditingService from './services/fieldEditingService';
import ModalPresentationService from './services/modalPresentationService';
import { credentialManager } from './utils/credentialManager';
// Import IndexedDB backup service to make it globally available
import './v8u/services/indexedDBBackupServiceV8U';

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
import PageChangeSpinner from './components/PageChangeSpinner';
import ServerStatusProvider from './components/ServerStatusProvider';
import { StartupWrapper } from './components/StartupWrapper';
import About from './pages/About';
import AdvancedConfiguration from './pages/AdvancedConfiguration';
import AdvancedSecuritySettingsComparison from './pages/AdvancedSecuritySettingsComparison';
import AdvancedSecuritySettingsDemo from './pages/AdvancedSecuritySettingsDemo';
import AIAgentOverview from './pages/AIAgentOverview';
import AIGlossary from './pages/AIGlossary';
import AutoDiscover from './pages/AutoDiscover';
import CIBAvsDeviceAuthz from './pages/CIBAvsDeviceAuthz';
import CompetitiveAnalysis from './pages/CompetitiveAnalysis';
import ComprehensiveOAuthEducation from './pages/ComprehensiveOAuthEducation';
import Dashboard from './pages/Dashboard';
import OAuth2SecurityBestPractices from './pages/docs/OAuth2SecurityBestPractices';
import OAuthForAI from './pages/docs/OAuthForAI';
import OIDCForAI from './pages/docs/OIDCForAI';
import OIDCOverview from './pages/docs/OIDCOverviewV7';
// Removed unused OIDC overview imports
// import OIDCOverviewSimple from './pages/docs/OIDCOverview_Simple';
// import OIDCOverviewMinimal from './pages/docs/OIDCOverview_Minimal';
// import OIDCOverviewEnhanced from './pages/docs/OIDCOverview_Enhanced';
// import OIDCOverviewEnhancedSimple from './pages/docs/OIDCOverview_Enhanced_Simple';
// import OIDCOverviewTest from './pages/docs/OIDCOverview_Test';
// import OIDCOverviewNew from './pages/docs/OIDCOverview_New';
import OIDCSpecs from './pages/docs/OIDCSpecs';
import PingViewOnAI from './pages/docs/PingViewOnAI';
import SpiffeSpirePingOne from './pages/docs/SpiffeSpirePingOne';
import EnvironmentIdInputDemo from './pages/EnvironmentIdInputDemo';
import AdvancedOAuthParametersDemoFlow from './pages/flows/AdvancedOAuthParametersDemoFlow';
import CIBAFlowV7 from './pages/flows/CIBAFlowV7';
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
import PingOneMFAWorkflowLibraryV7 from './pages/flows/PingOneMFAWorkflowLibraryV7';
import PingOnePARFlowV7 from './pages/flows/PingOnePARFlowV7';
import RARFlowV7 from './pages/flows/RARFlowV7';
import RedirectlessFlowV7Real from './pages/flows/RedirectlessFlowV7_Real';
import SAMLBearerAssertionFlowV7 from './pages/flows/SAMLBearerAssertionFlowV7';
import SAMLServiceProviderFlowV1 from './pages/flows/SAMLServiceProviderFlowV1';
import TestMock from './pages/flows/TestMock';
import TokenIntrospectionFlow from './pages/flows/TokenIntrospectionFlow';
import TokenRevocationFlow from './pages/flows/TokenRevocationFlow';
import UserInfoFlow from './pages/flows/UserInfoFlow';
import UserInfoPostFlow from './pages/flows/UserInfoPostFlow';
import V7RMCondensedMock from './pages/flows/V7RMCondensedMock';
import V7RMOAuthAuthorizationCodeFlow_Condensed from './pages/flows/V7RMOAuthAuthorizationCodeFlow_Condensed';
import V7RMOIDCResourceOwnerPasswordFlow from './pages/flows/V7RMOIDCResourceOwnerPasswordFlow';
import WorkerTokenFlowV7 from './pages/flows/WorkerTokenFlowV7';
import InteractiveTutorials from './pages/InteractiveTutorials';
import JWKSTroubleshooting from './pages/JWKSTroubleshooting';
import ResponseModesLearnPage from './pages/learn/ResponseModesLearnPage';
import OAuth21 from './pages/OAuth21';
import OAuthOIDCTraining from './pages/OAuthOIDCTraining';
import OIDC from './pages/OIDC';
import OIDCSessionManagement from './pages/OIDCSessionManagement';
import OrganizationLicensing from './pages/OrganizationLicensing';
import PARvsRAR from './pages/PARvsRAR';
import PingAIResources from './pages/PingAIResources';
import PingOneAuditActivities from './pages/PingOneAuditActivities';
import PingOneAuthentication from './pages/PingOneAuthentication';
import PingOneAuthenticationCallback from './pages/PingOneAuthenticationCallback';
import PingOneAuthenticationResult from './pages/PingOneAuthenticationResult';
import PingOneIdentityMetrics from './pages/PingOneIdentityMetrics';
import PingOneMockFeatures from './pages/PingOneMockFeatures';
import PingOneUserProfile from './pages/PingOneUserProfile';
import PingOneWebhookViewer from './pages/PingOneWebhookViewer';
import SDKSampleApp from './pages/SDKSampleApp';
import ServiceTestRunner from './pages/ServiceTestRunner';
import HelioMartPasswordReset from './pages/security/HelioMartPasswordReset';
import TestDemo from './pages/TestDemo';
import TokenManagement from './pages/TokenManagement';
import UltimateTokenDisplayDemo from './pages/UltimateTokenDisplayDemo';
import URLDecoder from './pages/URLDecoder';
import WorkerTokenTester from './pages/WorkerTokenTester';
import { ImplicitFlowV8 } from './v8/flows/ImplicitFlowV8';
import MFADeviceManagementFlowV8 from './v8/flows/MFADeviceManagementFlowV8';
import { MFAFlowV8 } from './v8/flows/MFAFlowV8';
import MFAHubV8 from './v8/flows/MFAHubV8';
import MFAReportingFlowV8 from './v8/flows/MFAReportingFlowV8';
import OAuthAuthorizationCodeFlowV8 from './v8/flows/OAuthAuthorizationCodeFlowV8';
import ResourcesAPIFlowV8 from './v8/flows/ResourcesAPIFlowV8';
import UnifiedCredentialsMockupV8 from './v8/pages/UnifiedCredentialsMockupV8';
import V8MTokenExchange from './v8m/pages/V8MTokenExchange';
import CallbackHandlerV8U from './v8u/components/CallbackHandlerV8U';
import SpiffeSpireFlowV8U from './v8u/flows/SpiffeSpireFlowV8U';
import SpiffeSpireTokenDisplayV8U from './v8u/pages/SpiffeSpireTokenDisplayV8U';
import UnifiedOAuthFlowV8U from './v8u/flows/UnifiedOAuthFlowV8U';

// Import test pages
const PingOneApiTest = lazy(() => import('./pages/test/PingOneApiTest'));
const ImplicitFlowTest = lazy(() => import('./pages/test/ImplicitFlowTest'));
const AllFlowsApiTest = lazy(() => import('./pages/test/AllFlowsApiTest'));
const PARTest = lazy(() => import('./pages/test/PARTest'));
const TestCallback = lazy(() => import('./pages/test/TestCallback'));

// Import V7M pages
const V7MOAuthAuthCode = lazy(() => import('./v7m/pages/V7MOAuthAuthCode'));
const V7MDeviceAuthorization = lazy(() => import('./v7m/pages/V7MDeviceAuthorization'));
const V7MClientCredentials = lazy(() => import('./v7m/pages/V7MClientCredentials'));
const V7MImplicitFlow = lazy(() => import('./v7m/pages/V7MImplicitFlow'));
const V7MROPC = lazy(() => import('./v7m/pages/V7MROPC'));
const V7MSettings = lazy(() => import('./v7m/pages/V7MSettings'));

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray100};
`;

const ContentColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main<{ $sidebarWidth: number }>`
  flex: 1;
  padding: 1.5rem;
  margin-left: ${({ $sidebarWidth }) => $sidebarWidth}px;
  margin-top: 100px;
  padding-bottom: 2rem;
  overflow: visible;
  transition: margin 0.3s ease;
  animation: fadeInPage 0.3s ease-in-out;

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
	const [sidebarOpen, setSidebarOpen] = useState(false);
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
	const [showPageSpinner, setShowPageSpinner] = useState(false);
	const { showAuthModal, authRequestData, proceedWithOAuth, closeAuthModal } = useAuth();
	const location = useLocation();

	// Scroll to top on route change - scroll main content only, not entire window
	useEffect(() => {
		console.log('🌍 [GlobalScroll] Route changed to:', location.pathname);

		// Skip auto-scroll for certain flows to prevent menu jumping
		const skipAutoScroll: string[] = [
			// Add flows that should preserve scroll position
		];

		if (skipAutoScroll.some((path) => location.pathname.includes(path))) {
			console.log('🌍 [GlobalScroll] Skipping auto-scroll for:', location.pathname);
			return;
		}

		// Scroll the main content area only, not the entire window
		// This prevents the sidebar/menu from jumping
		const mainContent = document.querySelector('main');
		if (mainContent) {
			mainContent.scrollTop = 0;
		}

		// Also scroll the content column if it exists
		const contentColumn = document.querySelector('[data-content-column]');
		if (contentColumn) {
			contentColumn.scrollTop = 0;
		}
	}, [location.pathname]);

	// Close sidebar on mount
	useEffect(() => {
		setSidebarOpen(false);
	}, []);

	// Startup spinner
	useEffect(() => {
		setShowPageSpinner(true);
		const timer = setTimeout(() => setShowPageSpinner(false), 800);
		return () => clearTimeout(timer);
	}, []);

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
			<AppContainer>
				<Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
				<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
				<ContentColumn>
					<MainContent $sidebarWidth={sidebarWidth}>
						<Routes>
							<Route path="/login" element={<Login />} />
							<Route path="/callback" element={<Callback />} />
							{/* Per-flow callback routes */}
							{/* V8U Unified Callback Handler - handles all V8U flows */}
							<Route path="/unified-callback" element={<CallbackHandlerV8U />} />
							<Route path="/authz-callback" element={<CallbackHandlerV8U />} />
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
							<Route path="/sidebar-test" element={<SidebarTest />} />
							<Route path="/dynamic-header-demo" element={<DynamicHeaderExample />} />
							<Route path="/flows" element={<OAuthFlowsNew />}>
								<Route path="compare" element={<FlowComparisonTool />} />
								<Route path="diagrams" element={<InteractiveFlowDiagram />} />
								<Route path="mfa" element={<MFAFlow />} />
							</Route>
							{/* Tools & Utilities Routes */}
							<Route path="/sdk-sample-app" element={<SDKSampleApp />} />
							<Route path="/ultimate-token-display-demo" element={<UltimateTokenDisplayDemo />} />
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
							<Route path="/flows/mfa-v8" element={<MFAFlowV8 />} />
							<Route path="/v8/mfa" element={<MFAFlowV8 />} />
							<Route path="/v8/mfa-hub" element={<MFAHubV8 />} />
							<Route path="/v8/mfa-device-management" element={<MFADeviceManagementFlowV8 />} />
							<Route path="/v8/mfa-reporting" element={<MFAReportingFlowV8 />} />
							<Route path="/v8/resources-api" element={<ResourcesAPIFlowV8 />} />
							<Route path="/flows/oauth-authorization-code-v7-mock" element={<TestMock />} />
							<Route
								path="/flows/oauth-authorization-code-v7-condensed-mock"
								element={<V7RMOAuthAuthorizationCodeFlow_Condensed />}
							/>
							<Route path="/flows/v7rm-condensed-mock" element={<V7RMCondensedMock />} />
							<Route path="/flows/test-mock" element={<TestMock />} />
							{/* V7RM Mock Flows (Flows not supported by PingOne) */}
							<Route path="/flows/v7rm-oidc-ropc" element={<V7RMOIDCResourceOwnerPasswordFlow />} />
							{/* Token Management Flows */}
							<Route path="/flows/token-revocation" element={<TokenRevocationFlow />} />
							<Route path="/flows/token-introspection" element={<TokenIntrospectionFlow />} />
							{/* V7M Mock Educational Flow Routes */}
							<Route
								path="/v7m/oauth/authorization-code"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<V7MOAuthAuthCode oidc={false} title="V7M OAuth Authorization Code" />
									</Suspense>
								}
							/>
							<Route
								path="/v7m/oidc/authorization-code"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<V7MOAuthAuthCode oidc={true} title="V7M OIDC Authorization Code" />
									</Suspense>
								}
							/>
							<Route
								path="/v7m/oauth/device-authorization"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<V7MDeviceAuthorization />
									</Suspense>
								}
							/>
							<Route
								path="/v7m/oauth/client-credentials"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<V7MClientCredentials />
									</Suspense>
								}
							/>
							<Route
								path="/v7m/oauth/implicit"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<V7MImplicitFlow oidc={false} title="V7M OAuth Implicit Flow" />
									</Suspense>
								}
							/>
							<Route
								path="/v7m/oidc/implicit"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<V7MImplicitFlow oidc={true} title="V7M OIDC Implicit Flow" />
									</Suspense>
								}
							/>
							<Route
								path="/v7m/oauth/ropc"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<V7MROPC oidc={false} title="V7M Resource Owner Password Credentials" />
									</Suspense>
								}
							/>
							<Route
								path="/v7m/oidc/ropc"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<V7MROPC oidc={true} title="V7M OIDC Resource Owner Password Credentials" />
									</Suspense>
								}
							/>
							<Route
								path="/v7m/settings"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<V7MSettings />
									</Suspense>
								}
							/>
							<Route path="/flows/userinfo" element={<UserInfoPostFlow />} />
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
							<Route path="/v8u/unified/:flowType?/:step?" element={<UnifiedOAuthFlowV8U />} />
							{/* V8U SPIFFE/SPIRE Mock Flow and Token Viewer - multi-step lab */}
							<Route
								path="/v8u/spiffe-spire"
								element={<Navigate to="/v8u/spiffe-spire/attest" replace />}
							/>
							<Route path="/v8u/spiffe-spire/attest" element={<SpiffeSpireFlowV8U />} />
							<Route path="/v8u/spiffe-spire/svid" element={<SpiffeSpireFlowV8U />} />
							<Route path="/v8u/spiffe-spire/validate" element={<SpiffeSpireFlowV8U />} />
							<Route path="/v8u/spiffe-spire/tokens" element={<SpiffeSpireTokenDisplayV8U />} />
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
							{/* V8M Token Exchange Flow */}
							<Route path="/flows/token-exchange-v7" element={<V8MTokenExchange />} />
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
							<Route path="/flows/saml-sp-dynamic-acs-v1" element={<SAMLServiceProviderFlowV1 />} />
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
							{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
							<Route
								path="/flows/oidc-hybrid-v6"
								element={<Navigate to="/flows/oidc-hybrid-v7" replace />}
							/>
							{/* V7 CIBA Flow */}
							<Route path="/flows/ciba-v7" element={<CIBAFlowV7 />} />
							{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
							<Route path="/flows/ciba-v6" element={<Navigate to="/flows/ciba-v7" replace />} />
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
							{/* V7 Redirectless Flow */}
							<Route path="/flows/redirectless-v7-real" element={<RedirectlessFlowV7Real />} />
							{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
							<Route
								path="/flows/redirectless-v6"
								element={<Navigate to="/flows/redirectless-v7-real" replace />}
							/>
							<Route
								path="/flows/redirectless-v6-real"
								element={<Navigate to="/flows/redirectless-v7-real" replace />}
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
							<Route path="/flows/pingone-complete-mfa-v7" element={<PingOneCompleteMFAFlowV7 />} />
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
							<Route path="/pingone-identity-metrics" element={<PingOneIdentityMetrics />} />
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
							<Route path="/application-generator" element={<ApplicationGenerator />} />
							<Route path="/oauth-code-generator-hub" element={<OAuthCodeGeneratorHub />} />
							<Route path="/configuration" element={<Configuration />} />
							<Route path="/documentation" element={<Documentation />} />
							<Route path="/ping-ai-resources" element={<PingAIResources />} />
							<Route path="/pingone-user-profile" element={<PingOneUserProfile />} />
							<Route path="/worker-token-tester" element={<WorkerTokenTester />} />
							<Route path="/ai-identity-architectures" element={<AIIdentityArchitectures />} />
							<Route path="/about" element={<About />} />
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
							<Route path="/auto-discover" element={<AutoDiscover />} />
							<Route path="/token-management" element={<TokenManagement />} />
							<Route path="/oauth-2-1" element={<OAuth21 />} />
							<Route path="/oidc-session-management" element={<OIDCSessionManagement />} />
							<Route path="/par-vs-rar" element={<PARvsRAR />} />
							<Route path="/ciba-vs-device-authz" element={<CIBAvsDeviceAuthz />} />
							<Route path="/jwks-troubleshooting" element={<JWKSTroubleshooting />} />
							<Route path="/url-decoder" element={<URLDecoder />} />
							<Route path="/code-examples" element={<CodeExamplesDemo />} />
							<Route path="/code-examples-demo" element={<CodeExamplesDemo />} />
							<Route path="/api-display-demo" element={<ApiDisplayServiceDemo />} />
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
							<Route path="/advanced-config" element={<AdvancedConfiguration />} />
							<Route
								path="/advanced-security-settings"
								element={<AdvancedSecuritySettingsDemo />}
							/>
							<Route
								path="/advanced-security-settings-comparison"
								element={<AdvancedSecuritySettingsComparison />}
							/>
							<Route path="/security/password-reset" element={<HelioMartPasswordReset />} />
							<Route path="/tutorials" element={<InteractiveTutorials />} />
							<Route path="/oauth-oidc-training" element={<OAuthOIDCTraining />} />
							<Route path="/learn/response-modes" element={<ResponseModesLearnPage />} />
							<Route path="/service-test-runner" element={<ServiceTestRunner />} />
							{/* Test Pages */}
							<Route
								path="/test/pingone-api-test"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<PingOneApiTest />
									</Suspense>
								}
							/>
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
								path="/test/par-test"
								element={
									<Suspense fallback={<div>Loading...</div>}>
										<PARTest />
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
					<PageFooter />
				</ContentColumn>
			</AppContainer>

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

			<PageChangeSpinner isVisible={showPageSpinner} message="Loading page..." />
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
			xl: string;
		};
		breakpoints: {
			xs: string;
			sm: string;
			md: string;
			lg: string;
			xl: string;
		};
		spacing: {
			xs: string;
			sm: string;
			md: string;
			lg: string;
			xl: string;
			xxl: string;
		};
		borderRadius: {
			sm: string;
			md: string;
			lg: string;
			full: string;
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
			xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
		},
		breakpoints: {
			xs: '0px',
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

	// Initialize credential debugger for development
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			// Import and initialize the debugger
			import('./utils/credentialDebugger').then(({ default: CredentialDebugger }) => {
				// Make it available globally
				(window as Window & { CredentialDebugger?: typeof CredentialDebugger }).CredentialDebugger =
					CredentialDebugger;
				console.log('🔧 CredentialDebugger initialized and available globally');
				console.log('🔧 Available commands:');
				console.log('  - CredentialDebugger.auditAllFlows()');
				console.log('  - CredentialDebugger.auditFlowCredentials("flow-key")');
				console.log('  - CredentialDebugger.dumpAllStorage()');
				console.log('  - CredentialDebugger.clearAllCredentials()');
				console.log('  - CredentialDebugger.testCredentialIsolation("flow1", "flow2")');
			});

			// Import and initialize field editing diagnostic
			import('./utils/fieldEditingDiagnostic').then(({ default: FieldEditingDiagnostic }) => {
				// Make it available globally
				(
					window as Window & { FieldEditingDiagnostic?: typeof FieldEditingDiagnostic }
				).FieldEditingDiagnostic = FieldEditingDiagnostic;
				console.log('🔧 FieldEditingDiagnostic initialized and available globally');
				console.log('🔧 Available commands:');
				console.log('  - diagnoseFields() - Analyze all fields for editing issues');
				console.log('  - fixFields() - Apply common fixes to all fields');
				console.log('  - monitorFields() - Start real-time monitoring');
				console.log('  - stopMonitorFields() - Stop monitoring');
			});

			// Import and initialize token exchange tests
			import('./v8u/tests/tokenExchangeFlowTest').then(({ default: TokenExchangeFlowTest }) => {
				window.TokenExchangeFlowTest = TokenExchangeFlowTest;
				window.runTokenExchangeTests = () => {
					const test = new TokenExchangeFlowTest();
					test.runAllTests();
					return test.getResults();
				};
				console.log('🧪 Token Exchange Flow Test loaded');
				console.log('🧪 Run: runTokenExchangeTests()');
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
					console.log('🧪 Token Exchange Integration Test loaded');
					console.log('🧪 Commands:');
					console.log('   - runIntegrationTests() - Run all tests');
					console.log('   - checkTokenExchangeState() - Quick diagnostic');
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
		console.log('🛡️ Field Editing Protection initialized');

		// Listen for URL validation modal updates
		const handleModalUpdate = (event: CustomEvent) => {
			setUrlValidationModalState(event.detail);
		};

		window.addEventListener('urlValidationModalUpdate', handleModalUpdate as EventListener);

		return () => {
			window.removeEventListener('urlValidationModalUpdate', handleModalUpdate as EventListener);
		};
	}, []);

	return (
		<ThemeProvider theme={theme}>
			<ErrorBoundary>
				<ServerStatusProvider showHealthCheck={false}>
					<AuthErrorBoundary>
						<NotificationProvider>
							<AuthProvider>
								<StartupWrapper>
									<PageStyleProvider>
										<GlobalStyle />
										<NotificationContainer />
										<ApiRequestModalProvider />
										<AppRoutes />
									</PageStyleProvider>
								</StartupWrapper>
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
		</ThemeProvider>
	);
}

export default App;
