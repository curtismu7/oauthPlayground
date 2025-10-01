import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import styled, { type DefaultTheme, ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/NewAuthContext';
import { PageStyleProvider } from './contexts/PageStyleContext';
import { UISettingsProvider } from './contexts/UISettingsContext';
import { GlobalStyle, theme } from './styles/global';
import './styles/spec-cards.css';
import './styles/ui-settings.css';
import CredentialSetupModal from './components/CredentialSetupModal';
import FlowComparisonTool from './components/FlowComparisonTool';
import InteractiveFlowDiagram from './components/InteractiveFlowDiagram';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useAuth } from './contexts/NewAuthContext';
import { NotificationContainer, NotificationProvider } from './hooks/useNotifications';
import Callback from './pages/Callback';
import Configuration from './pages/Configuration';
import Dashboard from './pages/Dashboard';
import Documentation from './pages/Documentation';
import Flows from './pages/Flows';
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
import OAuthV3Callback from './components/callbacks/OAuthV3Callback';
import WorkerTokenCallback from './components/callbacks/WorkerTokenCallback';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorDisplay from './components/GlobalErrorDisplay';
import PageChangeSpinner from './components/PageChangeSpinner';
import ServerStatusProvider from './components/ServerStatusProvider';
import AdvancedConfiguration from './pages/AdvancedConfiguration';
import OIDCOverview from './pages/docs/OIDCOverview';
import AIGlossary from './pages/AIGlossary';
import ComprehensiveOAuthEducation from './pages/ComprehensiveOAuthEducation';
import AIAgentOverview from './pages/AIAgentOverview';
import AutoDiscover from './pages/AutoDiscover';
import OAuth2SecurityBestPractices from './pages/docs/OAuth2SecurityBestPractices';
import OIDCForAI from './pages/docs/OIDCForAI';
import OIDCSpecs from './pages/docs/OIDCSpecs';
import AuthorizationCodeFlow from './pages/flows/AuthorizationCodeFlow';
import ClientCredentialsFlow from './pages/flows/ClientCredentialsFlow';
import DeviceCodeFlow from './pages/flows/DeviceCodeFlow';
import DeviceCodeFlowOIDC from './pages/flows/DeviceCodeFlowOIDC';
import EnhancedAuthorizationCodeFlow from './pages/flows/EnhancedAuthorizationCodeFlow';
import EnhancedAuthorizationCodeFlowV2 from './pages/flows/EnhancedAuthorizationCodeFlowV2';
import HybridFlow from './pages/flows/HybridFlow';
import IDTokensFlow from './pages/flows/IDTokensFlow';
// Import all the new OAuth and OIDC flow components
import ImplicitGrantFlow from './pages/flows/ImplicitGrantFlow';
import JWTBearerFlow from './pages/flows/JWTBearerFlow';
import OAuth2ClientCredentialsFlowV3 from './pages/flows/OAuth2ClientCredentialsFlowV3';
// Import new V3 implicit flow components
import OAuth2ImplicitFlowV3 from './pages/flows/OAuth2ImplicitFlowV3';
import OAuth2ResourceOwnerPasswordFlow from './pages/flows/OAuth2ResourceOwnerPasswordFlow';
import OIDCClientCredentialsFlowV3 from './pages/flows/OIDCClientCredentialsFlowV3';
import OIDCHybridFlowV3 from './pages/flows/OIDCHybridFlowV3';
import OIDCImplicitFlowV3 from './pages/flows/OIDCImplicitFlowV3';
import OIDCResourceOwnerPasswordFlow from './pages/flows/OIDCResourceOwnerPasswordFlow';
import PARFlow from './pages/flows/PARFlow';
import ResourceOwnerPasswordFlow from './pages/flows/ResourceOwnerPasswordFlow';
import UnifiedAuthorizationCodeFlowV3 from './pages/flows/UnifiedAuthorizationCodeFlowV3';
import AuthzV4NewWindsurfFlow from './pages/flows/AuthzV4NewWindsurfFlow';
import OAuthAuthorizationCodeFlowV5 from './pages/flows/OAuthAuthorizationCodeFlowV5';
import OIDCAuthorizationCodeFlowV5 from './pages/flows/OIDCAuthorizationCodeFlowV5';
import WorkerTokenFlowV5 from './pages/flows/WorkerTokenFlowV5';
import UserInfoFlow from './pages/flows/UserInfoFlow';
import WorkerTokenFlow from './pages/flows/WorkerTokenFlow';
import PingOnePARFlow from './pages/flows/PingOnePARFlow';
import PingOnePARFlowV5 from './pages/flows/PingOnePARFlowV5';
import WorkerTokenFlowV3 from './pages/flows/WorkerTokenFlowV3';
import InteractiveTutorials from './pages/InteractiveTutorials';
import JWKSTroubleshooting from './pages/JWKSTroubleshooting';
import OAuth21 from './pages/OAuth21';
import OIDC from './pages/OIDC';
import OIDCSessionManagement from './pages/OIDCSessionManagement';
import SDKSampleApp from './pages/SDKSampleApp';
import TokenManagement from './pages/TokenManagement';
import URLDecoder from './pages/URLDecoder';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray100};
`;

const MainContent = styled.main`
  flex: 1;
  padding: 1.5rem;
  margin-left: 320px;
  margin-top: 80px;
  overflow-y: auto;
  transition: margin 0.3s ease;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    margin-left: 0;
    padding: 1rem;
    margin-top: 80px;
  }
`;

const AppRoutes = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showCredentialModal, setShowCredentialModal] = useState(false);
	const [showPageSpinner, setShowPageSpinner] = useState(false);
	const _location = useLocation();
	const { showAuthModal, authRequestData, proceedWithOAuth, closeAuthModal } = useAuth();

	// Removed global scroll to bottom - individual pages now handle their own scroll behavior

	// Close sidebar when route changes
	useEffect(() => {
		setSidebarOpen(false);
	}, []);

	// Show page change spinner when route changes
	useEffect(() => {
		setShowPageSpinner(true);

		// Hide spinner after minimum display time
		const timer = setTimeout(() => {
			setShowPageSpinner(false);
		}, 800);

		return () => clearTimeout(timer);
	}, []);

	// Check for existing PingOne configuration on app load
	useEffect(() => {
		console.log(' [App] useEffect triggered - checking configuration...');
		const checkConfiguration = () => {
			console.log(' [App] Checking for existing configuration...');
			try {
				// Check if credentials modal should be shown based on flow config
				const flowConfig = JSON.parse(
					localStorage.getItem('enhanced-flow-authorization-code') || '{}'
				);
				const shouldShowCredentialsModal = flowConfig.showCredentialsModal === true; // Only show if explicitly enabled

				console.log(' [App] Flow config showCredentialsModal:', shouldShowCredentialsModal);
				console.log(' [App] Flow config raw value:', flowConfig.showCredentialsModal);
				console.log(' [App] Full flow config:', flowConfig);

				// Debug: Check all localStorage keys
				console.log(' [App] All localStorage keys:', Object.keys(localStorage));
				console.log(
					' [App] pingone_permanent_credentials:',
					localStorage.getItem('pingone_permanent_credentials')
				);
				console.log(
					' [App] pingone_session_credentials:',
					localStorage.getItem('pingone_session_credentials')
				);
				console.log(' [App] pingone_config:', localStorage.getItem('pingone_config'));

				// Check if we have any credentials using the credential manager
				// Try to load from config credentials first, then fall back to authz flow credentials
				let allCredentials = credentialManager.loadConfigCredentials();
				if (!allCredentials.environmentId && !allCredentials.clientId) {
					allCredentials = credentialManager.loadAuthzFlowCredentials();
				}
				console.log(' [App] All credentials from manager:', allCredentials);

				const hasPermanentCredentials = !!(allCredentials.environmentId && allCredentials.clientId);
				const hasSessionCredentials = !!allCredentials.clientSecret;

				console.log(' [App] Configuration check:', {
					hasPermanentCredentials,
					hasSessionCredentials,
					overallStatus: credentialManager.getCredentialsStatus(),
					allCredentials,
					shouldShowCredentialsModal,
				});

				// Check if user has chosen to skip startup credentials modal
				const skipStartupModal = localStorage.getItem('skip_startup_credentials_modal') === 'true';

				// Only show modal if no credentials are found AND credentials modal is enabled AND user hasn't chosen to skip
				if (
					!hasPermanentCredentials &&
					!hasSessionCredentials &&
					shouldShowCredentialsModal &&
					!skipStartupModal
				) {
					console.log(
						' [App] No credentials found and credentials modal enabled, showing setup modal'
					);
					console.log(' [App] Modal will show because:', {
						hasPermanentCredentials,
						hasSessionCredentials,
						shouldShowCredentialsModal,
						flowConfigValue: flowConfig.showCredentialsModal,
					});
					setShowCredentialModal(true);
				} else {
					if (skipStartupModal) {
						console.log(' [App] Startup credentials modal skipped (user preference)');
					} else {
						console.log(
							' [App] Credentials found or credentials modal disabled, skipping setup modal'
						);
					}
					console.log(' [App] Modal will NOT show because:', {
						hasPermanentCredentials,
						hasSessionCredentials,
						shouldShowCredentialsModal,
						flowConfigValue: flowConfig.showCredentialsModal,
					});
					setShowCredentialModal(false);
				}
			} catch (error) {
				console.warn(' [App] Error checking configuration:', error);
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
			<GlobalErrorDisplay />
			<AppContainer>
				<Navbar toggleSidebar={toggleSidebar} />
				<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
				<MainContent>
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route path="/callback" element={<Callback />} />

						{/* Per-flow callback routes */}
						<Route path="/authz-callback" element={<AuthzCallback />} />
						<Route path="/oauth-v3-callback" element={<OAuthV3Callback />} />
						<Route path="/hybrid-callback" element={<HybridCallback />} />
						<Route path="/implicit-callback" element={<ImplicitCallback />} />
						<Route path="/implicit-callback-v3" element={<ImplicitCallbackV3 />} />
						<Route path="/worker-token-callback" element={<WorkerTokenCallback />} />
						<Route path="/device-code-status" element={<DeviceCodeStatus />} />
						<Route path="/dashboard-callback" element={<DashboardCallback />} />

						<Route path="/" element={<Navigate to="/dashboard" replace />} />

						<Route path="/dashboard" element={<Dashboard />} />

						<Route path="/flows" element={<OAuthFlowsNew />} />
						<Route path="/flows/compare" element={<FlowComparisonTool />} />
						<Route path="/flows/diagrams" element={<InteractiveFlowDiagram />} />
						<Route path="/flows/authorization-code" element={<AuthorizationCodeFlow />} />
						<Route
							path="/flows/enhanced-authorization-code"
							element={<EnhancedAuthorizationCodeFlow />}
						/>
						<Route
							path="/flows/enhanced-authorization-code-v2"
							element={<EnhancedAuthorizationCodeFlowV2 />}
						/>
						<Route path="/flows/oauth-authorization-code-v5" element={<OAuthAuthorizationCodeFlowV5 />} />
						<Route path="/flows/oidc-authorization-code-v5" element={<OIDCAuthorizationCodeFlowV5 />} />
						<Route path="/flows/worker-token-v5" element={<WorkerTokenFlowV5 />} />
						<Route path="/flows/authz-v4-new-windsurf" element={<AuthzV4NewWindsurfFlow />} />
						<Route path="/flows/oauth2-implicit-v3" element={<OAuth2ImplicitFlowV3 />} />
						<Route path="/flows/oidc-implicit-v3" element={<OIDCImplicitFlowV3 />} />
						<Route path="/flows/oidc-hybrid-v3" element={<OIDCHybridFlowV3 />} />
						<Route
							path="/flows/oauth2-client-credentials-v3"
							element={<OAuth2ClientCredentialsFlowV3 />}
						/>
						<Route
							path="/flows/oidc-client-credentials-v3"
							element={<OIDCClientCredentialsFlowV3 />}
						/>
						<Route path="/flows/device-code-oidc" element={<DeviceCodeFlowOIDC />} />
						<Route path="/flows/resource-owner-password" element={<ResourceOwnerPasswordFlow />} />
						<Route path="/flows/par" element={<PARFlow />} />

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
							<Route path="device-code-oidc" element={<DeviceCodeFlowOIDC />} />
					</Route>

					{/* Unsupported by PingOne flows - TokenExchangeMockFlow removed as file doesn't exist */}
					
		{/* PingOne PAR Flow */}
			<Route path="/flows/pingone-par" element={<PingOnePARFlow />} />
			<Route path="/flows/pingone-par-v5" element={<PingOnePARFlowV5 />} />

						<Route path="/oauth/client-credentials" element={<ClientCredentialsFlow />} />
						<Route
							path="/oauth/resource-owner-password"
							element={<OAuth2ResourceOwnerPasswordFlow />}
						/>
						<Route path="/flows/worker-token-v3" element={<WorkerTokenFlowV3 />} />

						<Route path="/oidc" element={<OIDC />}>
							<Route path="userinfo" element={<UserInfoFlow />} />
							<Route path="id-tokens" element={<IDTokensFlow />} />
							<Route path="authorization-code" element={<AuthorizationCodeFlow />} />
							<Route path="hybrid" element={<HybridFlow />} />
							<Route path="implicit" element={<ImplicitGrantFlow />} />
							<Route path="client-credentials" element={<ClientCredentialsFlow />} />
							<Route path="resource-owner-password" element={<OIDCResourceOwnerPasswordFlow />} />
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
						<Route
							path="/docs/oauth2-security-best-practices"
							element={<OAuth2SecurityBestPractices />}
						/>

						<Route path="/auto-discover" element={<AutoDiscover />} />
						<Route path="/token-management" element={<TokenManagement />} />
						<Route path="/jwks-troubleshooting" element={<JWKSTroubleshooting />} />
						<Route path="/url-decoder" element={<URLDecoder />} />

						<Route path="/documentation/oidc-overview" element={<OIDCOverview />} />
<Route path="/ai-glossary" element={<AIGlossary />} />
					<Route path="/ai-agent-overview" element={<AIAgentOverview />} />
<Route path="/comprehensive-oauth-education" element={<ComprehensiveOAuthEducation />} />

						<Route path="/advanced-config" element={<AdvancedConfiguration />} />

						<Route path="/tutorials" element={<InteractiveTutorials />} />

						<Route path="/oauth-2-1" element={<OAuth21 />} />
						<Route path="/oidc-session-management" element={<OIDCSessionManagement />} />
						<Route path="/sdk-sample-app" element={<SDKSampleApp />} />

						<Route path="*" element={<div>Not Found</div>} />
					</Routes>
				</MainContent>
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
	const themeBreakpoints = theme?.breakpoints || {
		xs: '',
		sm: '',
		md: '',
		lg: '',
		xl: '',
	};

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
			monospace: getThemeValue(
				themeFonts.monospace,
				'"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace'
			),
		},

		// Shadows with fallbacks
		shadows: {
			sm: getThemeValue(themeShadows.sm, '0 1px 2px 0 rgba(0, 0, 0, 0.05)'),
			md: getThemeValue(
				themeShadows.md,
				'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
			),
			lg: getThemeValue(
				themeShadows.lg,
				'0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
			),
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
			<ErrorBoundary>
				<ServerStatusProvider>
					<AuthErrorBoundary>
						<NotificationProvider>
							<AuthProvider>
								<UISettingsProvider>
									<PageStyleProvider>
										<GlobalStyle />
										<NotificationContainer />
										<AppRoutes />
									</PageStyleProvider>
								</UISettingsProvider>
							</AuthProvider>
						</NotificationProvider>
					</AuthErrorBoundary>
				</ServerStatusProvider>
			</ErrorBoundary>
		</ThemeProvider>
	);
}

export default App;
