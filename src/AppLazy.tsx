import React, { Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import styled, { DefaultTheme, ThemeProvider } from 'styled-components';
import { LazyLoadingFallback } from './components/LazyLoadingFallback';
import { AuthProvider } from './contexts/NewAuthContext';
import { PageStyleProvider } from './contexts/PageStyleContext';
import { GlobalStyle, theme } from './styles/global';
import { logger } from './utils/logger';

// Lazy load all components
const Navbar = React.lazy(() => import('./components/Navbar'));
const Sidebar = React.lazy(() => import('./components/Sidebar'));
const CredentialSetupModal = React.lazy(() => import('./components/CredentialSetupModal'));
const AuthorizationRequestModal = React.lazy(
	() => import('./components/AuthorizationRequestModal')
);
const PageChangeSpinner = React.lazy(() => import('./components/PageChangeSpinner'));

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Flows = React.lazy(() => import('./pages/FlowsLazy'));
const Configuration = React.lazy(() => import('./pages/Configuration'));
const Documentation = React.lazy(() => import('./pages/Documentation'));
const Login = React.lazy(() => import('./pages/Login'));
const Callback = React.lazy(() => import('./pages/Callback'));
const AuthorizationCallback = React.lazy(() => import('./pages/AuthorizationCallback'));
const TokenManagement = React.lazy(() => import('./pages/TokenManagement'));
const OIDCOverview = React.lazy(() => import('./pages/docs/OIDCOverview'));
const AIGlossary = React.lazy(() => import('./pages/AIGlossary'));
const ComprehensiveOAuthEducation = React.lazy(() => import('./pages/ComprehensiveOAuthEducation'));
const AIAgentOverview = React.lazy(() => import('./pages/AIAgentOverview'));
const AdvancedConfiguration = React.lazy(() => import('./pages/AdvancedConfiguration'));
const InteractiveTutorials = React.lazy(() => import('./pages/InteractiveTutorials'));
const OAuth21 = React.lazy(() => import('./pages/OAuth21'));
const OIDCSessionManagement = React.lazy(() => import('./pages/OIDCSessionManagement'));
const OIDC = React.lazy(() => import('./pages/OIDC'));
const OAuthOIDCTraining = React.lazy(() => import('./pages/OAuthOIDCTraining'));

// Lazy load OAuth flow components
const AuthorizationCodeFlow = React.lazy(() => import('./pages/flows/AuthorizationCodeFlow'));
const ImplicitGrantFlow = React.lazy(() => import('./pages/flows/ImplicitGrantFlow'));
const ClientCredentialsFlow = React.lazy(() => import('./pages/flows/ClientCredentialsFlow'));
const WorkerTokenFlow = React.lazy(() => import('./pages/flows/WorkerTokenFlow'));
const DeviceCodeFlow = React.lazy(() => import('./pages/flows/DeviceCodeFlow'));
const HybridFlow = React.lazy(() => import('./pages/flows/HybridFlow'));
const UserInfoFlow = React.lazy(() => import('./pages/flows/UserInfoFlow'));
const IDTokensFlow = React.lazy(() => import('./pages/flows/IDTokensFlow'));

// V5 Flow Components
const OAuthAuthorizationCodeFlowV5 = React.lazy(() => import('./pages/flows/OAuthAuthorizationCodeFlowV5'));
const OIDCAuthorizationCodeFlowV5 = React.lazy(() => import('./pages/flows/OIDCAuthorizationCodeFlowV5'));
const OAuthImplicitFlowV5 = React.lazy(() => import('./pages/flows/OAuthImplicitFlowV5'));
const OIDCImplicitFlowV5 = React.lazy(() => import('./pages/flows/OIDCImplicitFlowV5'));
const ClientCredentialsFlowV5 = React.lazy(() => import('./pages/flows/ClientCredentialsFlowV5'));
const DeviceAuthorizationFlowV6 = React.lazy(() => import('./pages/flows/DeviceAuthorizationFlowV6'));

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

import type { ReactNode } from 'react';

// Scroll to top component
const ScrollToTop: React.FC = () => {
	const { pathname } = useLocation();

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
	}, [pathname]);

	return null;
};

// Lazy Route Wrapper Component
const LazyRouteWrapper: React.FC<{
	children: ReactNode;
	fallbackMessage?: string;
	flowType?: string;
}> = ({ children, fallbackMessage = 'Loading component...', flowType }) => {
	return (
		<Suspense
			fallback={
				<LazyLoadingFallback
					flowType={flowType || 'Component'}
					message={fallbackMessage}
					showSteps={false}
				/>
			}
		>
			{children}
		</Suspense>
	);
};

const AppRoutes = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showCredentialModal, setShowCredentialModal] = useState(false);
	const [showPageSpinner, setShowPageSpinner] = useState(false);
	const { showAuthModal, authRequestData, proceedWithOAuth, closeAuthModal } = useAuth();

	// Preload common components for better performance
	useEffect(() => {
		const preloadCommonComponents = async () => {
			try {
				// Preload critical components
				await Promise.all([
					import('./components/Navbar'),
					import('./components/Sidebar'),
					import('./pages/Dashboard'),
					import('./pages/FlowsLazy'),
				]);
				logger.info('[AppLazy] Preloaded common components');
			} catch (error) {
				logger.warn('[AppLazy] Failed to preload some components:', error);
			}
		};

		preloadCommonComponents();
	}, []);

	// Close sidebar when route changes
	useEffect(() => {
		setSidebarOpen(false);
	}, []);

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
	}, []);

	// Check for existing PingOne configuration on app load
	useEffect(() => {
		const checkConfiguration = () => {
			logger.info('[AppLazy] Checking for existing configuration...');
			try {
				const savedConfig = localStorage.getItem('pingone_config');
				const savedCreds = localStorage.getItem('login_credentials');

				logger.info('[AppLazy] Configuration check:', {
					hasSavedConfig: !!savedConfig,
					hasSavedCreds: !!savedCreds,
					savedConfigKeys: savedConfig ? Object.keys(JSON.parse(savedConfig)) : [],
					savedCredsKeys: savedCreds ? Object.keys(JSON.parse(savedCreds)) : [],
				});

				// Check if user has chosen to skip startup credentials modal
				const skipStartupModal = localStorage.getItem('skip_startup_credentials_modal') === 'true';

				// Only show modal if BOTH configuration and credentials are missing AND user hasn't chosen to skip
				if (!savedConfig && !savedCreds && !skipStartupModal) {
					logger.warn('[AppLazy] No credentials found, showing setup modal');
					setShowCredentialModal(true);
				} else {
					if (skipStartupModal) {
						logger.info('[AppLazy] Startup credentials modal skipped (user preference)');
					} else {
						logger.info('[AppLazy] Credentials found, skipping setup modal');
					}
					setShowCredentialModal(false);
				}
			} catch (error) {
				logger.warn('[AppLazy] Error checking configuration:', error);
				// Check skip preference even on error
				const skipStartupModal = localStorage.getItem('skip_startup_credentials_modal') === 'true';
				if (!skipStartupModal) {
					// Show modal on error to be safe (unless user chose to skip)
					setShowCredentialModal(true);
				} else {
					logger.info('[AppLazy] Error occurred but startup modal skipped (user preference)');
					setShowCredentialModal(false);
				}
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
		logger.info('[AppLazy] Credential setup completed, modal hidden');
	};

	return (
		<>
			<ScrollToTop />
			<AppContainer>
				<LazyRouteWrapper fallbackMessage="Loading navigation...">
					<Navbar toggleSidebar={toggleSidebar} />
				</LazyRouteWrapper>

				<LazyRouteWrapper fallbackMessage="Loading sidebar...">
					<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
				</LazyRouteWrapper>

				<MainContent>
					<Routes>
						<Route
							path="/login"
							element={
								<LazyRouteWrapper fallbackMessage="Loading login page...">
									<Login />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/callback"
							element={
								<LazyRouteWrapper fallbackMessage="Loading callback...">
									<Callback />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/authz-callback"
							element={
								<LazyRouteWrapper fallbackMessage="Processing authorization...">
									<AuthorizationCallback />
								</LazyRouteWrapper>
							}
						/>

						<Route path="/" element={<Navigate to="/dashboard" replace />} />

						<Route
							path="/dashboard"
							element={
								<LazyRouteWrapper fallbackMessage="Loading dashboard...">
									<Dashboard />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/flows"
							element={
								<LazyRouteWrapper fallbackMessage="Loading OAuth flows...">
									<Flows />
								</LazyRouteWrapper>
							}
						>
							<Route
								path="authorization-code"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading Authorization Code flow..."
										flowType="Authorization Code"
									>
										<AuthorizationCodeFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="implicit"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading Implicit Grant flow..."
										flowType="Implicit Grant"
									>
										<ImplicitGrantFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="client-credentials"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading Client Credentials flow..."
										flowType="Client Credentials"
									>
										<ClientCredentialsFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="worker-token"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading Worker Token flow..."
										flowType="Worker Token"
									>
										<WorkerTokenFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="device-code"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading Device Code flow..."
										flowType="Device Code"
									>
										<DeviceCodeFlow />
									</LazyRouteWrapper>
								}
							/>
						</Route>

						<Route
							path="/oidc"
							element={
								<LazyRouteWrapper fallbackMessage="Loading OpenID Connect...">
									<OIDC />
								</LazyRouteWrapper>
							}
						>
							<Route
								path="userinfo"
								element={
									<LazyRouteWrapper fallbackMessage="Loading UserInfo flow..." flowType="UserInfo">
										<UserInfoFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="id-tokens"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading ID Tokens flow..."
										flowType="ID Tokens"
									>
										<IDTokensFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="authorization-code"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading OIDC Authorization Code flow..."
										flowType="OIDC Authorization Code"
									>
										<AuthorizationCodeFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="hybrid"
								element={
									<LazyRouteWrapper fallbackMessage="Loading Hybrid flow..." flowType="Hybrid">
										<HybridFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="implicit"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading OIDC Implicit flow..."
										flowType="OIDC Implicit"
									>
										<ImplicitGrantFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="client-credentials"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading OIDC Client Credentials flow..."
										flowType="OIDC Client Credentials"
									>
										<ClientCredentialsFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="worker-token"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading OIDC Worker Token flow..."
										flowType="OIDC Worker Token"
									>
										<WorkerTokenFlow />
									</LazyRouteWrapper>
								}
							/>

							<Route
								path="device-code"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading OIDC Device Code flow..."
										flowType="OIDC Device Code"
									>
										<DeviceCodeFlow />
									</LazyRouteWrapper>
								}
							/>

							{/* V5 Flow Routes */}
							<Route
								path="oauth-authorization-code-v5"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading OAuth Authorization Code V5..."
										flowType="OAuth Authorization Code V5"
									>
										<OAuthAuthorizationCodeFlowV5 />
									</LazyRouteWrapper>
								}
							/>
							<Route
								path="oidc-authorization-code-v5"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading OIDC Authorization Code V5..."
										flowType="OIDC Authorization Code V5"
									>
										<OIDCAuthorizationCodeFlowV5 />
									</LazyRouteWrapper>
								}
							/>
							<Route
								path="oauth-implicit-v5"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading OAuth Implicit V5..."
										flowType="OAuth Implicit V5"
									>
										<OAuthImplicitFlowV5 />
									</LazyRouteWrapper>
								}
							/>
							<Route
								path="oidc-implicit-v5"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading OIDC Implicit V5..."
										flowType="OIDC Implicit V5"
									>
										<OIDCImplicitFlowV5 />
									</LazyRouteWrapper>
								}
							/>
							<Route
								path="client-credentials-v5"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading Client Credentials V5..."
										flowType="Client Credentials V5"
									>
										<ClientCredentialsFlowV5 />
									</LazyRouteWrapper>
								}
							/>
							<Route
								path="device-authorization-v6"
								element={
									<LazyRouteWrapper
										fallbackMessage="Loading Device Authorization V6..."
										flowType="Device Authorization V6"
									>
										<DeviceAuthorizationFlowV6 />
									</LazyRouteWrapper>
								}
							/>
						</Route>

						{/* Backward-compatible redirect for older links */}
						<Route path="/oidc/tokens" element={<Navigate to="/oidc/id-tokens" replace />} />

						<Route
							path="/configuration"
							element={
								<LazyRouteWrapper fallbackMessage="Loading configuration...">
									<Configuration />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/documentation"
							element={
								<LazyRouteWrapper fallbackMessage="Loading documentation...">
									<Documentation />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/token-management"
							element={
								<LazyRouteWrapper fallbackMessage="Loading token management...">
									<TokenManagement />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/documentation/oidc-overview"
							element={
								<LazyRouteWrapper fallbackMessage="Loading OIDC overview...">
									<OIDCOverview />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/ai-glossary"
							element={
								<LazyRouteWrapper fallbackMessage="Loading AI Glossary...">
									<AIGlossary />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/ai-agent-overview"
							element={
								<LazyRouteWrapper fallbackMessage="Loading AI Agents OAuth...">
									<AIAgentOverview />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/comprehensive-oauth-education"
							element={
								<LazyRouteWrapper fallbackMessage="Loading Comprehensive OAuth Education...">
									<ComprehensiveOAuthEducation />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/advanced-config"
							element={
								<LazyRouteWrapper fallbackMessage="Loading advanced configuration...">
									<AdvancedConfiguration />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/tutorials"
							element={
								<LazyRouteWrapper fallbackMessage="Loading tutorials...">
									<InteractiveTutorials />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/oauth-oidc-training"
							element={
								<LazyRouteWrapper fallbackMessage="Loading OAuth/OIDC Training...">
									<OAuthOIDCTraining />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/oauth-2-1"
							element={
								<LazyRouteWrapper fallbackMessage="Loading OAuth 2.1...">
									<OAuth21 />
								</LazyRouteWrapper>
							}
						/>

						<Route
							path="/oidc-session-management"
							element={
								<LazyRouteWrapper fallbackMessage="Loading OIDC session management...">
									<OIDCSessionManagement />
								</LazyRouteWrapper>
							}
						/>

						<Route path="*" element={<div>Not Found</div>} />
					</Routes>
				</MainContent>
			</AppContainer>

			<LazyRouteWrapper fallbackMessage="Loading credential setup...">
				<CredentialSetupModal
					isOpen={showCredentialModal}
					onClose={handleCredentialSetupComplete}
					onSave={(creds) => {
						console.log(' [AppLazy] Credentials saved from startup modal:', creds);
						// The modal will auto-close after save
					}}
					flowType="startup"
				/>
			</LazyRouteWrapper>

			<LazyRouteWrapper fallbackMessage="Loading authorization modal...">
				<AuthorizationRequestModal
					isOpen={showAuthModal}
					onClose={closeAuthModal}
					onProceed={proceedWithOAuth}
					authorizationUrl={authRequestData?.authorizationUrl || ''}
					requestParams={authRequestData?.requestParams || {}}
				/>
			</LazyRouteWrapper>

			<LazyRouteWrapper fallbackMessage="Loading page spinner...">
				<PageChangeSpinner isVisible={showPageSpinner} message="Loading page..." />
			</LazyRouteWrapper>
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

function AppLazy() {
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
			<AuthProvider>
				<PageStyleProvider>
					<GlobalStyle />
					<AppRoutes />
				</PageStyleProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}

export default AppLazy;
