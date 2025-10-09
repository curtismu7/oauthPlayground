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
import CodeExamplesDemo from './components/CodeExamplesDemo';
import CredentialSetupModal from './components/CredentialSetupModal';
import FlowComparisonTool from './components/FlowComparisonTool';
import FlowHeaderDemo from './components/FlowHeaderDemo';
import InteractiveFlowDiagram from './components/InteractiveFlowDiagram';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useAuth } from './contexts/NewAuthContext';
import { NotificationContainer, NotificationProvider } from './hooks/useNotifications';
import Callback from './pages/Callback';
import ClientGenerator from './pages/ClientGenerator';
import Configuration from './pages/Configuration';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import OAuthFlowsNew from './pages/OAuthFlowsNew';
import { credentialManager } from './utils/credentialManager';
import { scrollToTop } from './utils/scrollManager';

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
import OAuthV3Callback from './components/callbacks/OAuthV3Callback';
import WorkerTokenCallback from './components/callbacks/WorkerTokenCallback';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorDisplay from './components/GlobalErrorDisplay';
import PageChangeSpinner from './components/PageChangeSpinner';
import ServerStatusProvider from './components/ServerStatusProvider';
import About from './pages/About';
import AdvancedConfiguration from './pages/AdvancedConfiguration';
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
import CIBAFlowV5 from './pages/flows/CIBAFlowV5';
// Backed up V2/V3/V4 flows - moved to _backup folder
import ClientCredentialsFlowV5 from './pages/flows/ClientCredentialsFlowV5';
import DeviceAuthorizationFlowV5 from './pages/flows/DeviceAuthorizationFlowV5';
// Backed up legacy flows
import IDTokensFlow from './pages/flows/IDTokensFlow';
// Import all the new OAuth and OIDC flow components
import JWTBearerFlow from './pages/flows/JWTBearerFlow';
import JWTBearerTokenFlowV5 from './pages/flows/JWTBearerTokenFlowV5';
import MFAFlow from './pages/flows/MFAFlow';
// V3 flows backed up
import OAuth2ResourceOwnerPasswordFlow from './pages/flows/OAuth2ResourceOwnerPasswordFlow';
// V5 OAuth/OIDC Flows
import OAuthAuthorizationCodeFlowV5 from './pages/flows/OAuthAuthorizationCodeFlowV5';
import OAuthImplicitFlowCompletion from './pages/flows/OAuthImplicitFlowCompletion';
import OAuthImplicitFlowV5 from './pages/flows/OAuthImplicitFlowV5';
import OAuthResourceOwnerPasswordFlowV5 from './pages/flows/OAuthResourceOwnerPasswordFlowV5';
import OIDCAuthorizationCodeFlowV5 from './pages/flows/OIDCAuthorizationCodeFlowV5';
import OIDCDeviceAuthorizationFlowV5 from './pages/flows/OIDCDeviceAuthorizationFlowV5';
// OIDCHybridFlowV3 backed up
import OIDCHybridFlowV5 from './pages/flows/OIDCHybridFlowV5';
// OIDCImplicitFlowV3 backed up
import OIDCImplicitFlowV5 from './pages/flows/OIDCImplicitFlowV5';
import OIDCResourceOwnerPasswordFlowV5 from './pages/flows/OIDCResourceOwnerPasswordFlowV5';
import PARFlow from './pages/flows/PARFlow';
import PingOneMFAFlowV5 from './pages/flows/PingOneMFAFlowV5';
// PingOnePARFlow (non-V5) backed up
import PingOnePARFlowV6 from './pages/flows/PingOnePARFlowV6_New';
import RARFlowV6 from './pages/flows/RARFlowV6_New';
import RedirectlessFlowV5 from './pages/flows/RedirectlessFlowV5';
import RedirectlessFlowV6Real from './pages/flows/RedirectlessFlowV6_Real_New';
// ResourceOwnerPasswordFlow backed up
import UserInfoFlow from './pages/flows/UserInfoFlow';
// WorkerToken legacy flows backed up
import WorkerTokenFlowV5 from './pages/flows/WorkerTokenFlowV5';
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

const ScrollToTop = () => {
	useEffect(() => {
		// Small delay to ensure the page has rendered before scrolling
		const timer = setTimeout(() => {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
		}, 0);

		return () => clearTimeout(timer);
	}, []);

	return null;
};

const AppRoutes = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showCredentialModal, setShowCredentialModal] = useState(false);
	const [showPageSpinner, setShowPageSpinner] = useState(false);
	const { showAuthModal, authRequestData, proceedWithOAuth, closeAuthModal } = useAuth();
	const location = useLocation();

	// Global scroll to top on route change - FOOLPROOF
	useEffect(() => {
		console.log('🌍 [GlobalScroll] Route changed to:', location.pathname);
		
		// Immediate scroll - multiple methods for maximum compatibility
		window.scrollTo(0, 0);
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
		
		// Additional scroll attempts with delays to catch late-loading content
		setTimeout(() => {
			window.scrollTo(0, 0);
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}, 0);
		
		setTimeout(() => {
			window.scrollTo(0, 0);
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}, 50);
		
		setTimeout(() => {
			window.scrollTo(0, 0);
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}, 100);
		
		setTimeout(() => {
			window.scrollTo(0, 0);
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}, 200);
		
		// Also use the scroll manager for additional reliability
		scrollToTop({ force: true, smooth: false });
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
			<ScrollToTop />
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
							<Route path="/dashboard-callback" element={<DashboardCallback />} />
							<Route path="/" element={<Navigate to="/dashboard" replace />} />
							<Route path="/dashboard" element={<Dashboard />} />
							<Route path="/flows" element={<OAuthFlowsNew />}>
								<Route path="compare" element={<FlowComparisonTool />} />
								<Route path="diagrams" element={<InteractiveFlowDiagram />} />
								<Route path="mfa" element={<MFAFlow />} />
							</Route>
						{/* Tools & Utilities Routes */}
						<Route path="/sdk-sample-app" element={<SDKSampleApp />} />
						{/* V5 OAuth/OIDC Flow Routes */}
						<Route
							path="/flows/oauth-authorization-code-v5"
							element={<OAuthAuthorizationCodeFlowV5 />}
						/>
						<Route
							path="/flows/oidc-authorization-code-v5"
							element={<OIDCAuthorizationCodeFlowV5 />}
						/>
							<Route path="/flows/oauth-implicit-v5" element={<OAuthImplicitFlowV5 />} />
							<Route
								path="/flows/oauth-implicit-completion"
								element={<OAuthImplicitFlowCompletion />}
							/>
							<Route path="/flows/oidc-implicit-v5" element={<OIDCImplicitFlowV5 />} />
							<Route
								path="/flows/device-authorization-v5"
								element={<DeviceAuthorizationFlowV5 />}
							/>
							<Route
								path="/flows/oidc-device-authorization-v5"
								element={<OIDCDeviceAuthorizationFlowV5 />}
							/>
							<Route path="/flows/worker-token-v5" element={<WorkerTokenFlowV5 />} />
							<Route path="/flows/client-credentials-v5" element={<ClientCredentialsFlowV5 />} />
							<Route path="/flows/jwt-bearer-v5" element={<JWTBearerTokenFlowV5 />} />
							<Route path="/flows/hybrid-v5" element={<OIDCHybridFlowV5 />} />
							<Route path="/flows/ciba-v5" element={<CIBAFlowV5 />} />
							<Route path="/hybrid-callback" element={<HybridCallback />} />
							<Route path="/flows/redirectless-flow-mock" element={<RedirectlessFlowV5 />} />
							<Route path="/flows/redirectless-v6-real" element={<RedirectlessFlowV6Real />} />
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
							<Route path="/flows/pingone-mfa-v5" element={<PingOneMFAFlowV5 />} />
							<Route path="/flows/rar-v6" element={<RARFlowV6 />} />
							<Route path="/flows/rar-v5" element={<RARFlowV6 />} /> {/* Redirect V5 to V6 */}
							{/* Legacy route removed - use V5 */}
							<Route
								path="/flows/oauth2-resource-owner-password"
								element={<OAuth2ResourceOwnerPasswordFlow />}
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
							<Route path="/code-examples-demo" element={<CodeExamplesDemo />} />
							<Route path="/documentation/oidc-overview" element={<OIDCOverview />} />
							<Route path="/ai-glossary" element={<AIGlossary />} />
							<Route path="/ai-agent-overview" element={<AIAgentOverview />} />
							<Route path="/competitive-analysis" element={<CompetitiveAnalysis />} />
							<Route
								path="/comprehensive-oauth-education"
								element={<ComprehensiveOAuthEducation />}
							/>
							<Route path="/advanced-config" element={<AdvancedConfiguration />} />
							<Route path="/tutorials" element={<InteractiveTutorials />} />
							<Route path="/oauth-oidc-training" element={<OAuthOIDCTraining />} />
							<Route path="/learn/response-modes" element={<ResponseModesLearnPage />} />
							<Route path="/flows/oauth-implicit-v5" element={<OAuthImplicitFlowV5 />} />
							<Route path="/flows/oidc-implicit-v5" element={<OIDCImplicitFlowV5 />} />
						<Route
							path="/flows/oidc-authorization-code-v5"
							element={<OIDCAuthorizationCodeFlowV5 />}
						/>
						<Route path="/flows/client-credentials-v5" element={<ClientCredentialsFlowV5 />} />
							<Route path="/flows/jwt-bearer-v5" element={<JWTBearerTokenFlowV5 />} />
							<Route
								path="/flows/oidc-device-authorization-v5"
								element={<OIDCDeviceAuthorizationFlowV5 />}
							/>
							<Route path="/flows/oidc-hybrid-v5" element={<OIDCHybridFlowV5 />} />
							<Route path="/flows/worker-token-v5" element={<WorkerTokenFlowV5 />} />
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
