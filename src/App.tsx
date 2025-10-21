import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import styled, { type DefaultTheme, ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/NewAuthContext';
import { PageStyleProvider } from './contexts/PageStyleContext';
import { type UISettings, UISettingsProvider, useUISettings } from './contexts/UISettingsContext';
import { PageFooter } from './services/footerService';
import { theme as baseTheme, GlobalStyle } from './styles/global';
import './styles/spec-cards.css';
import './styles/ui-settings.css';
import './styles/sidebar-v6-forces.css';
import CodeExamplesDemo from './components/CodeExamplesDemo';
import CredentialSetupModal from './components/CredentialSetupModal';
import DeviceMockFlow from './components/DeviceMockFlow';
import DynamicHeaderExample from './components/DynamicHeaderExample';
import FlowComparisonTool from './components/FlowComparisonTool';
import FlowHeaderDemo from './components/FlowHeaderDemo';
import InteractiveFlowDiagram from './components/InteractiveFlowDiagram';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SidebarTest from './components/SidebarTest';
import { useAuth } from './contexts/NewAuthContext';
import { NotificationContainer, NotificationProvider } from './hooks/useNotifications';
import Callback from './pages/Callback';
import ClientGenerator from './pages/ClientGenerator';
import ApplicationGenerator from './pages/ApplicationGenerator';
import Configuration from './pages/Configuration';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import OAuthFlowsNew from './pages/OAuthFlowsNew';
import { credentialManager } from './utils/credentialManager';

// Removed useScrollToBottom - using centralized scroll management per page

import AuthErrorBoundary from './components/AuthErrorBoundary';
import AuthorizationRequestModal from './components/AuthorizationRequestModal';
// Import callback components
import AuthzCallback from './components/callbacks/AuthzCallback';
import DashboardCallback from './components/callbacks/DashboardCallback';
import DeviceCodeStatus from './components/callbacks/DeviceCodeStatus';
import HybridCallback from './components/callbacks/HybridCallback';
import ImplicitCallback from './components/callbacks/ImplicitCallback';
import ImplicitCallbackV3 from './components/callbacks/ImplicitCallbackV3';
import LogoutCallback from './components/LogoutCallback';
import OAuthV3Callback from './components/callbacks/OAuthV3Callback';
import WorkerTokenCallback from './components/callbacks/WorkerTokenCallback';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorDisplay from './components/GlobalErrorDisplay';
import PageChangeSpinner from './components/PageChangeSpinner';
import ServerStatusProvider from './components/ServerStatusProvider';
import About from './pages/About';
import AdvancedConfiguration from './pages/AdvancedConfiguration';
import AdvancedSecuritySettingsDemo from './pages/AdvancedSecuritySettingsDemo';
import AdvancedSecuritySettingsComparison from './pages/AdvancedSecuritySettingsComparison';
import AIAgentOverview from './pages/AIAgentOverview';
import AIGlossary from './pages/AIGlossary';
import AutoDiscover from './pages/AutoDiscover';
import CompetitiveAnalysis from './pages/CompetitiveAnalysis';
import ComprehensiveOAuthEducation from './pages/ComprehensiveOAuthEducation';
import Dashboard from './pages/Dashboard';
import OAuth2SecurityBestPractices from './pages/docs/OAuth2SecurityBestPractices';
import OIDCForAI from './pages/docs/OIDCForAI';
import OIDCOverview from './pages/docs/OIDCOverview';
import OIDCSpecs from './pages/docs/OIDCSpecs';
import PingViewOnAI from './pages/docs/PingViewOnAI';
import EnvironmentIdInputDemo from './pages/EnvironmentIdInputDemo';
import CIBAFlowV6 from './pages/flows/CIBAFlowV6';
// Backed up V2/V3/V4 flows - moved to _backup folder
import ClientCredentialsFlowV5 from './pages/flows/ClientCredentialsFlowV5';
import ClientCredentialsFlowV6 from './pages/flows/ClientCredentialsFlowV6';
import ClientCredentialsFlowV7 from './pages/flows/ClientCredentialsFlowV7';
import DeviceAuthorizationFlowV6 from './pages/flows/DeviceAuthorizationFlowV6';
import DeviceAuthorizationFlowV7 from './pages/flows/DeviceAuthorizationFlowV7';
import JWTBearerTokenFlowV6 from './pages/flows/JWTBearerTokenFlowV6';
import JWTBearerTokenFlowV7 from './pages/flows/JWTBearerTokenFlowV7';
import SAMLBearerAssertionFlowV6 from './pages/flows/SAMLBearerAssertionFlowV6';
import SAMLBearerAssertionFlowV7 from './pages/flows/SAMLBearerAssertionFlowV7';
import AdvancedParametersV6 from './pages/flows/AdvancedParametersV6';
import AdvancedOAuthParametersDemoFlow from './pages/flows/AdvancedOAuthParametersDemoFlow';
// Backed up legacy flows
import IDTokensFlow from './pages/flows/IDTokensFlow';
// Import all the new OAuth and OIDC flow components
import JWTBearerFlow from './pages/flows/JWTBearerFlow';
import JWTBearerTokenFlowV5 from './pages/flows/JWTBearerTokenFlowV5';
import MFAFlow from './pages/flows/MFAFlow';
// V3 flows backed up
import OAuth2ResourceOwnerPasswordFlow from './pages/flows/OAuth2ResourceOwnerPasswordFlow';
import OAuth2ResourceOwnerPasswordFlowV6 from './pages/flows/OAuth2ResourceOwnerPasswordFlowV6';
import OAuthROPCFlowV7 from './pages/flows/OAuthROPCFlowV7';
// V5 OAuth/OIDC Flows
import OAuthAuthorizationCodeFlowV6 from './pages/flows/OAuthAuthorizationCodeFlowV6';
import OAuthImplicitFlowCompletion from './pages/flows/OAuthImplicitFlowCompletion';
import OAuthImplicitFlowV6 from './pages/flows/OAuthImplicitFlowV6';
import OAuthResourceOwnerPasswordFlowV5 from './pages/flows/OAuthResourceOwnerPasswordFlowV5';
import OIDCAuthorizationCodeFlowV6 from './pages/flows/OIDCAuthorizationCodeFlowV6';
import OIDCDeviceAuthorizationFlowV6 from './pages/flows/OIDCDeviceAuthorizationFlowV6';
// OIDCHybridFlowV3 backed up
import OIDCHybridFlowV5 from './pages/flows/OIDCHybridFlowV5';
import OIDCHybridFlowV6 from './pages/flows/OIDCHybridFlowV6';
import OIDCHybridFlowV7 from './pages/flows/OIDCHybridFlowV7';
// OIDCImplicitFlowV3 backed up
import OIDCImplicitFlowV6 from './pages/flows/OIDCImplicitFlowV6';
import ImplicitFlowV7 from './pages/flows/ImplicitFlowV7';
import OAuthAuthorizationCodeFlowV7 from './pages/flows/OAuthAuthorizationCodeFlowV7';
import OAuthAuthorizationCodeFlowV7_Condensed_Mock from './pages/flows/OAuthAuthorizationCodeFlowV7_Condensed_Mock';
import V7CondensedMock from './pages/flows/V7CondensedMock';
import TestMock from './pages/flows/TestMock';
import TokenExchangeFlowV7 from './pages/flows/TokenExchangeFlowV7';
import OIDCResourceOwnerPasswordFlowV5 from './pages/flows/OIDCResourceOwnerPasswordFlowV5';
import PARFlow from './pages/flows/PARFlow';
import PingOneMFAFlowV5 from './pages/flows/PingOneMFAFlowV5';
import PingOneMFAFlowV6 from './pages/flows/PingOneMFAFlowV6';
import PingOneCompleteMFAFlowV7 from './pages/flows/PingOneCompleteMFAFlowV7';
import PingOneAuthentication from './pages/PingOneAuthentication';
import PingOneAuthenticationCallback from './pages/PingOneAuthenticationCallback';
import PingOneAuthenticationResult from './pages/PingOneAuthenticationResult';
// PingOnePARFlow (non-V5) backed up
import PingOnePARFlowV6 from './pages/flows/PingOnePARFlowV6_New';
import RARFlowV6 from './pages/flows/RARFlowV6_New';
import RedirectlessFlowV5 from './pages/flows/RedirectlessFlowV5';
import RedirectlessFlowV6Real from './pages/flows/RedirectlessFlowV6_Real';
import RedirectlessFlowV7Real from './pages/flows/RedirectlessFlowV7_Real';
// ResourceOwnerPasswordFlow backed up
import UserInfoFlow from './pages/flows/UserInfoFlow';
import OAuth2CompliantAuthorizationCodeFlow from './pages/flows/OAuth2CompliantAuthorizationCodeFlow';
import OIDCCompliantAuthorizationCodeFlow from './pages/flows/OIDCCompliantAuthorizationCodeFlow';
// WorkerToken flows
// WorkerTokenFlowV5 backed up - use V6
import WorkerTokenFlowV6 from './pages/flows/WorkerTokenFlowV6';
import WorkerTokenFlowV7 from './pages/flows/WorkerTokenFlowV7';
import InteractiveTutorials from './pages/InteractiveTutorials';
import JWKSTroubleshooting from './pages/JWKSTroubleshooting';
import ResponseModesLearnPage from './pages/learn/ResponseModesLearnPage';
import OAuth21 from './pages/OAuth21';
import OAuthOIDCTraining from './pages/OAuthOIDCTraining';
import OIDC from './pages/OIDC';
import OIDCSessionManagement from './pages/OIDCSessionManagement';
import SDKSampleApp from './pages/SDKSampleApp';
import TestDemo from './pages/TestDemo';
import TokenManagement from './pages/TokenManagement';
import URLDecoder from './pages/URLDecoder';
import PingOneMockFeatures from './pages/PingOneMockFeatures';

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

const MainContent = styled.main`
  flex: 1;
  padding: 1.5rem;
  margin-left: 320px;
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

const AppRoutes = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showCredentialModal, setShowCredentialModal] = useState(false);
	const [showPageSpinner, setShowPageSpinner] = useState(false);
	const { showAuthModal, authRequestData, proceedWithOAuth, closeAuthModal } = useAuth();
	const location = useLocation();

	// Scroll to top on route change - scroll main content only, not entire window
	useEffect(() => {
		console.log('🌍 [GlobalScroll] Route changed to:', location.pathname);
		
		// Skip auto-scroll for certain flows to prevent menu jumping
		const skipAutoScroll = [
			'/flows/pingone-mfa-v6',
			'/flows/ciba-v6',
			// Add other flows that should preserve scroll position
		];
		
		if (skipAutoScroll.some(path => location.pathname.includes(path))) {
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
			<AppContainer>
				<Navbar toggleSidebar={toggleSidebar} />
				<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
				<ContentColumn>
					<MainContent>
						<Routes>
							<Route path="/login" element={<Login />} />
							<Route path="/callback" element={<Callback />} />
							{/* Per-flow callback routes */}
							<Route path="/authz-callback" element={<AuthzCallback />} />
							<Route path="/oauth-v3-callback" element={<OAuthV3Callback />} />
							<Route path="/hybrid-callback" element={<HybridCallback />} />
							<Route path="/implicit-callback" element={<ImplicitCallback />} />
							<Route path="/oauth-implicit-callback" element={<ImplicitCallback />} />
							<Route path="/oidc-implicit-callback" element={<ImplicitCallback />} />
							<Route path="/implicit-callback-v3" element={<ImplicitCallbackV3 />} />
							<Route path="/worker-token-callback" element={<WorkerTokenCallback />} />
							<Route path="/device-code-status" element={<DeviceCodeStatus />} />
							<Route path="/logout-callback" element={<LogoutCallback />} />
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
						{/* V6 OAuth/OIDC Flow Routes */}
						<Route
							path="/flows/oauth-authorization-code-v6"
							element={<OAuthAuthorizationCodeFlowV6 />}
						/>
						<Route
							path="/flows/oauth-authorization-code-v7"
							element={<OAuthAuthorizationCodeFlowV7 />}
						/>
						<Route
							path="/flows/oauth-authorization-code-v7-mock"
							element={<TestMock />}
						/>
						<Route
							path="/flows/oauth-authorization-code-v7-condensed-mock"
							element={<OAuthAuthorizationCodeFlowV7_Condensed_Mock />}
						/>
						<Route
							path="/flows/v7-condensed-mock"
							element={<V7CondensedMock />}
						/>
						<Route
							path="/flows/test-mock"
							element={<TestMock />}
						/>
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
						<Route path="/flows/oauth-authorization-code-v5" element={<Navigate to="/flows/oauth-authorization-code-v6" replace />} />
						<Route
							path="/flows/oidc-authorization-code-v6"
							element={<OIDCAuthorizationCodeFlowV6 />}
						/>
						<Route path="/flows/oidc-authorization-code-v5" element={<Navigate to="/flows/oidc-authorization-code-v6" replace />} />
							<Route path="/flows/oauth-implicit-v6" element={<OAuthImplicitFlowV6 />} />
							<Route path="/flows/oauth-implicit-v5" element={<Navigate to="/flows/oauth-implicit-v6" replace />} />
							<Route
								path="/flows/oauth-implicit-completion"
								element={<OAuthImplicitFlowCompletion />}
							/>
							<Route path="/flows/oidc-implicit-v6" element={<OIDCImplicitFlowV6 />} />
							<Route path="/flows/oidc-implicit-v5" element={<Navigate to="/flows/oidc-implicit-v6" replace />} />
							<Route
								path="/flows/device-authorization-v6"
								element={<DeviceAuthorizationFlowV6 />}
							/>
							<Route
								path="/flows/oidc-device-authorization-v6"
								element={<OIDCDeviceAuthorizationFlowV6 />}
							/>
							<Route
								path="/flows/jwt-bearer-token-v6"
								element={<JWTBearerTokenFlowV6 />}
							/>
							<Route
								path="/flows/jwt-bearer-token-v7"
								element={<JWTBearerTokenFlowV7 />}
							/>
							<Route
								path="/flows/saml-bearer-assertion-v6"
								element={<SAMLBearerAssertionFlowV6 />}
							/>
							<Route
								path="/flows/saml-bearer-assertion-v7"
								element={<SAMLBearerAssertionFlowV7 />}
							/>
							<Route path="/flows/worker-token-v7" element={<WorkerTokenFlowV7 />} />
							<Route path="/flows/worker-token-v6" element={<WorkerTokenFlowV6 />} />
							<Route path="/flows/worker-token-v5" element={<Navigate to="/flows/worker-token-v7" replace />} />
							<Route
								path="/flows/client-credentials-v6"
								element={<ClientCredentialsFlowV6 />}
							/>
							<Route
								path="/flows/client-credentials-v7"
								element={<ClientCredentialsFlowV7 />}
							/>
							<Route path="/flows/client-credentials-v5" element={<Navigate to="/flows/client-credentials-v6" replace />} />
							<Route path="/flows/jwt-bearer-v5" element={<JWTBearerTokenFlowV5 />} />
							<Route path="/flows/oidc-hybrid-v6" element={<OIDCHybridFlowV6 />} />
							<Route path="/flows/oidc-hybrid-v7" element={<OIDCHybridFlowV7 />} />
							<Route path="/flows/hybrid-v5" element={<Navigate to="/flows/oidc-hybrid-v7" replace />} />
							<Route path="/flows/oidc-hybrid-v5" element={<Navigate to="/flows/oidc-hybrid-v7" replace />} />
							<Route path="/flows/ciba-v5" element={<Navigate to="/flows/ciba-v6" replace />} />
							<Route path="/flows/ciba-v6" element={<CIBAFlowV6 />} />
							{/* Advanced Parameters Route */}
							<Route
								path="/flows/advanced-parameters-v6/:flowType"
								element={<AdvancedParametersV6 />}
							/>
							{/* Advanced OAuth Parameters Demo (Mock Flow) */}
							<Route
								path="/flows/advanced-oauth-params-demo"
								element={<AdvancedOAuthParametersDemoFlow />}
							/>
							<Route path="/hybrid-callback" element={<HybridCallback />} />
							<Route path="/flows/redirectless-flow-mock" element={<RedirectlessFlowV5 />} />
							<Route path="/flows/redirectless-v6" element={<RedirectlessFlowV6Real />} />
							<Route path="/flows/redirectless-v6-real" element={<RedirectlessFlowV6Real />} />
							<Route path="/flows/redirectless-v7-real" element={<RedirectlessFlowV7Real />} />
							<Route path="/flows/redirectless-flow-v5" element={<RedirectlessFlowV6Real />} /> {/* Redirect V5 to V6 */}
							{/* V3/V4 routes backed up - use V5 versions instead */}
							<Route path="/flows/par" element={<PARFlow />} />
							<Route path="/flows-old/jwt-bearer" element={<JWTBearerFlow />} />
							{/* Unsupported by PingOne flows */}
							<Route
								path="/oauth/resource-owner-password"
								element={<OAuthResourceOwnerPasswordFlowV5 />}
							/>
							<Route
								path="/oidc/resource-owner-password"
								element={<OIDCResourceOwnerPasswordFlowV5 />}
							/>
							{/* PingOne PAR Flow - V6 (upgraded with services) */}
							<Route path="/flows/pingone-par-v6" element={<PingOnePARFlowV6 />} />
							<Route path="/flows/pingone-par-v5" element={<PingOnePARFlowV6 />} /> {/* Redirect V5 to V6 */}
							<Route path="/flows/pingone-mfa-v5" element={<Navigate to="/flows/pingone-mfa-v6" replace />} />
							<Route path="/flows/pingone-mfa-v6" element={<PingOneMFAFlowV6 />} />
							<Route path="/flows/pingone-complete-mfa-v7" element={<PingOneCompleteMFAFlowV7 />} />
							<Route path="/pingone-authentication" element={<PingOneAuthentication />} />
							<Route path="/pingone-authentication/result" element={<PingOneAuthenticationResult />} />
							<Route path="/p1-callback" element={<PingOneAuthenticationCallback />} />
							<Route path="/flows/rar-v6" element={<RARFlowV6 />} />
							<Route path="/flows/rar-v5" element={<RARFlowV6 />} /> {/* Redirect V5 to V6 */}
							{/* Legacy route removed - use V5 */}
							<Route
								path="/flows/oauth2-resource-owner-password"
								element={<OAuth2ResourceOwnerPasswordFlow />}
							/>
							<Route
								path="/flows/oauth2-resource-owner-password-v6"
								element={<OAuth2ResourceOwnerPasswordFlowV6 />}
							/>
							<Route
								path="/flows/oauth-ropc-v7"
								element={<OAuthROPCFlowV7 />}
							/>
							{/* Test MFA Flow */}
							<Route path="/mfa-test" element={<MFAFlow />} />
							{/* WorkerTokenFlowV3 backed up - use V5 */}
							{/* Legacy /oidc routes - Keep utility pages and unsupported flows */}
							<Route path="/oidc" element={<OIDC />}>
								<Route path="userinfo" element={<UserInfoFlow />} />
								<Route path="id-tokens" element={<IDTokensFlow />} />
								<Route
									path="resource-owner-password"
									element={<OIDCResourceOwnerPasswordFlowV5 />}
								/>
								<Route path="jwt-bearer" element={<JWTBearerFlow />} />
							</Route>
							{/* Backward-compatible redirect for older links */}
							<Route path="/oidc/tokens" element={<Navigate to="/oidc/id-tokens" replace />} />
							<Route path="/client-generator" element={<ClientGenerator />} />{' '}
							<Route path="/application-generator" element={<ApplicationGenerator />} />
							<Route path="/configuration" element={<Configuration />} />
							<Route path="/documentation" element={<Documentation />} />
							<Route path="/about" element={<About />} />
							<Route path="/flow-header-demo" element={<FlowHeaderDemo />} />
							<Route path="/test-demo" element={<TestDemo />} />
							<Route path="/environment-id-demo" element={<EnvironmentIdInputDemo />} />
							<Route path="/docs/oidc-specs" element={<OIDCSpecs />} />
							<Route path="/docs/oidc-for-ai" element={<OIDCForAI />} />
							<Route path="/docs/ping-view-on-ai" element={<PingViewOnAI />} />
							<Route
								path="/docs/oauth2-security-best-practices"
								element={<OAuth2SecurityBestPractices />}
							/>
							<Route path="/auto-discover" element={<AutoDiscover />} />
							<Route path="/token-management" element={<TokenManagement />} />
							<Route path="/oauth-2-1" element={<OAuth21 />} />
							<Route path="/oidc-session-management" element={<OIDCSessionManagement />} />
							<Route path="/jwks-troubleshooting" element={<JWKSTroubleshooting />} />
							<Route path="/url-decoder" element={<URLDecoder />} />
							<Route path="/code-examples" element={<CodeExamplesDemo />} />
							<Route path="/code-examples-demo" element={<CodeExamplesDemo />} />
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
							<Route path="/advanced-security-settings" element={<AdvancedSecuritySettingsDemo />} />
							<Route path="/advanced-security-settings-comparison" element={<AdvancedSecuritySettingsComparison />} />
							<Route path="/tutorials" element={<InteractiveTutorials />} />
							<Route path="/oauth-oidc-training" element={<OAuthOIDCTraining />} />
							<Route path="/learn/response-modes" element={<ResponseModesLearnPage />} />
							<Route path="/pingone-mock-features" element={<PingOneMockFeatures />} />
							<Route path="/flows/oauth-implicit-v6" element={<OAuthImplicitFlowV6 />} />
							<Route path="/flows/oauth-implicit-v5" element={<Navigate to="/flows/oauth-implicit-v6" replace />} />
							<Route path="/flows/oidc-implicit-v6" element={<OIDCImplicitFlowV6 />} />
							<Route path="/flows/oidc-implicit-v5" element={<Navigate to="/flows/oidc-implicit-v6" replace />} />
							<Route path="/flows/implicit-v7" element={<ImplicitFlowV7 />} />
							<Route path="/flows/token-exchange-v7" element={<TokenExchangeFlowV7 />} />
							<Route path="/flows/device-authorization-v7" element={<DeviceAuthorizationFlowV7 />} />
						<Route
							path="/flows/oidc-authorization-code-v5"
							element={<Navigate to="/flows/oidc-authorization-code-v6" replace />}
						/>
							<Route path="/flows/jwt-bearer-v5" element={<JWTBearerTokenFlowV5 />} />
							<Route
								path="/flows/oidc-device-authorization-v6"
								element={<OIDCDeviceAuthorizationFlowV6 />}
							/>
							<Route path="/flows/worker-token-v6" element={<WorkerTokenFlowV6 />} />
							<Route path="/flows/worker-token-v5" element={<Navigate to="/flows/worker-token-v6" replace />} />
							<Route path="/:customCallback(p1-callback)" element={<PingOneAuthenticationCallback />} />
			<Route path="*" element={<Navigate to="/dashboard" replace />} />
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

	return (
		<ThemeProvider theme={theme}>
			<ErrorBoundary>
				<ServerStatusProvider showHealthCheck={false}>
					<AuthErrorBoundary>
						<NotificationProvider>
							<AuthProvider>
								<PageStyleProvider>
									<GlobalStyle />
									<NotificationContainer />
									<AppRoutes />
								</PageStyleProvider>
							</AuthProvider>
						</NotificationProvider>
					</AuthErrorBoundary>
				</ServerStatusProvider>
			</ErrorBoundary>
		</ThemeProvider>
	);
}

export default App;
