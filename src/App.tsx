import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import styled, { type DefaultTheme, ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/NewAuthContext';
import { PageStyleProvider } from './contexts/PageStyleContext';
import { type UISettings, UISettingsProvider, useUISettings } from './contexts/UISettingsContext';
import { useComponentTracker } from './hooks/useComponentTracker';
import { theme as baseTheme, GlobalStyle } from './styles/global';
import { useComponentTracker as useCleanlinessTracker } from './utils/componentTracker';
import { ExternalScriptErrorBoundary, useExternalErrorHandling } from './utils/errorBoundaryUtils';
import { BackendDownModalV8 } from './v8/components/BackendDownModalV8';
import { ConfirmationModalV8 } from './v8/components/ConfirmationModalV8';
import { PromptModalV8 } from './v8/components/PromptModalV8';
import { FlowStateProvider } from './v8/contexts/FlowStateContext';
import UnifiedFlowProvider from './v8u/services/enhancedStateManagement';
import './styles/spec-cards.css';
import './styles/ui-settings.css';
import './styles/button-text-white-enforcement.css'; // CRITICAL: Ensures all buttons have white text
import { lazy, Suspense } from 'react';
import AIAssistant from './components/AIAssistant';
import { CleanlinessDashboardWorking } from './components/CleanlinessDashboardWorking';
import { CleanupHistoryDashboard } from './components/CleanupHistoryDashboard';
import CodeExamplesDemo from './components/CodeExamplesDemo';
import CredentialSetupModal from './components/CredentialSetupModal';
import { EnhancedFloatingLogViewer } from './components/EnhancedFloatingLogViewer';
import LoadingFallback from './components/LoadingFallback';
import { StandardModalSpinner } from './components/ui/StandardSpinner';
import { V9ModernMessagingProvider } from './components/v9/V9ModernMessagingComponents';
import AIAssistantPage from './pages/AIAssistantPage';
import { AIAssistantPopoutPage } from './pages/AIAssistantPopoutPage';
import CombinedTokenPage from './pages/CombinedTokenPage';
import { AI_ASSISTANT_NAVIGATE, isAIAssistantPopout } from './utils/aiAssistantPopoutHelper';

const CompactAppPickerDemo = lazy(() => import('./pages/CompactAppPickerDemo'));

// Lazy load heavy documentation pages
const AIAgentOverview = lazy(() => import('./pages/AIAgentOverview'));
const AIGlossary = lazy(() => import('./pages/AIGlossary'));
const ComprehensiveOAuthEducation = lazy(() => import('./pages/ComprehensiveOAuthEducation'));
const CompetitiveAnalysis = lazy(() => import('./pages/CompetitiveAnalysis'));
const AdvancedSecuritySettingsDemo = lazy(() => import('./pages/AdvancedSecuritySettingsDemo'));

// Lazy load heavy flow pages
const MFAFlow = lazy(() => import('./pages/flows/MFAFlow'));
// CIBAFlowV9 archived — /flows/ciba-v9 now redirects to /v8u/unified
const DPoPFlow = lazy(() => import('./pages/flows/DPoPFlow'));
const IDTokensFlow = lazy(() => import('./pages/flows/IDTokensFlow'));
const JWTBearerFlow = lazy(() => import('./pages/flows/JWTBearerFlow'));
const KrogerGroceryStoreMFA = lazy(() => import('./pages/flows/KrogerGroceryStoreMFA'));
// PARFlow removed — route redirects to /flows/pingone-par-v9
const PingOneLogoutFlow = lazy(() => import('./pages/flows/PingOneLogoutFlow'));

// Lazy load heavy tool pages
const ApplicationGenerator = lazy(() => import('./pages/ApplicationGenerator'));
const ClientGenerator = lazy(() => import('./pages/ClientGenerator'));
const FlowComparisonTool = lazy(() => import('./components/FlowComparisonTool'));
const InteractiveFlowDiagram = lazy(() => import('./components/InteractiveFlowDiagram'));
const AutoDiscover = lazy(() => import('./pages/AutoDiscover'));

// Lazy load AI and advanced pages
const AIIdentityArchitectures = lazy(() => import('./pages/AIIdentityArchitectures'));
const McpServerConfig = lazy(() => import('./pages/McpServerConfig'));
const OAuthCodeGeneratorHub = lazy(() => import('./pages/OAuthCodeGeneratorHub'));
const OAuthFlowsNew = lazy(() => import('./pages/OAuthFlowsNew'));
const WIMSEFlow = lazy(() => import('./pages/flows/v9/WIMSEFlow'));
const AttestationClientAuthFlow = lazy(() => import('./pages/flows/v9/AttestationClientAuthFlow'));
const MtlsClientAuthFlow = lazy(() => import('./pages/flows/v9/MtlsClientAuthFlow'));
const GnapFlow = lazy(() => import('./pages/flows/v9/GnapFlow'));
const JarJarmFlow = lazy(() => import('./pages/flows/v9/JarJarmFlow'));
const StepUpAuthFlow = lazy(() => import('./pages/flows/v9/StepUpAuthFlow'));
const TokenIntrospectionFlowV1 = lazy(() => import('./pages/flows/v9/TokenIntrospectionFlow'));

// Keep critical components eagerly loaded
import DeviceMockFlow from './components/DeviceMockFlow';
import FlowHeaderDemo from './components/FlowHeaderDemo';
import Navbar from './components/Navbar';
import { RouteRestorer } from './components/RouteRestorer';
import Sidebar from './components/Sidebar';
import {
	SIDEBAR_PING_MAX_WIDTH,
	SIDEBAR_PING_MIN_WIDTH,
	SIDEBAR_PING_WIDTH,
	USE_PING_MENU,
} from './config/sidebarMenuConfig';
import { useAuth } from './contexts/NewAuthContext';
import { NotificationContainer, NotificationProvider } from './hooks/useNotifications';
import { usePromptsShortcut } from './hooks/usePromptsShortcut';
import Callback from './pages/Callback';
import Configuration from './pages/Configuration';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
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
import About from './pages/About';
import AdvancedConfiguration from './pages/AdvancedConfiguration';
import CIBAvsDeviceAuthz from './pages/CIBAvsDeviceAuthz';
import CustomDomainTestPage from './pages/CustomDomainTestPage';
import Dashboard from './pages/Dashboard';
import AIAgentAuthDraft from './pages/docs/AIAgentAuthDraft';
import MCPDocumentation from './pages/docs/MCPDocumentation';
// Added new migration and prompts pages
import MigrateVscode from './pages/docs/migration/MigrateVscode';
import MigrationGuide from './pages/docs/migration/MigrationGuide';
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
import PromptAll from './pages/docs/prompts/PromptAll';
import SpiffeSpirePingOne from './pages/docs/SpiffeSpirePingOne.tsx';
import EnvironmentIdInputDemo from './pages/EnvironmentIdInputDemo';
import AdvancedOAuthParametersDemoFlow from './pages/flows/AdvancedOAuthParametersDemoFlow';
// ClientCredentialsFlowV7 archived — route redirects to v9
// DeviceAuthorizationFlowV7 archived — route redirects to v9
import OAuth2ResourceOwnerPasswordFlow from './pages/flows/OAuth2ResourceOwnerPasswordFlow';
// OAuthAuthorizationCodeFlowV7 archived — route redirects to v9
// OAuthAuthorizationCodeFlowV7_2 archived — route redirects to v9
import OAuthImplicitFlowCompletion from './pages/flows/OAuthImplicitFlowCompletion';
// OAuthROPCFlowV7 archived — route redirects to v9
// OIDCHybridFlowV7 archived — route redirects to v9
// PARFlowV7 archived — route redirects to pingone-par-v9
import RedirectlessFlowV9_Real from './pages/flows/RedirectlessFlowV9_Real';
import SAMLServiceProviderFlowV1 from './pages/flows/SAMLServiceProviderFlowV1';
import TokenIntrospectionFlow from './pages/flows/TokenIntrospectionFlow';
import TokenRevocationFlow from './pages/flows/TokenRevocationFlow';
import UserInfoFlow from './pages/flows/UserInfoFlow';
import UserInfoPostFlow from './pages/flows/UserInfoPostFlow';
// V7RMOIDCResourceOwnerPasswordFlow removed — route redirects to /flows/oauth-ropc-v9
// CIBAFlowV9, ClientCredentialsFlowV9, DeviceAuthorizationFlowV9, DPoPAuthorizationCodeFlowV9,
// ImplicitFlowV9, OAuthAuthorizationCodeFlowV9, OAuthAuthorizationCodeFlowV9_Condensed, OIDCHybridFlowV9
// — all redirect to /v8u/unified
import JWTBearerTokenFlowV9 from './pages/flows/v9/JWTBearerTokenFlowV9';
import MFAWorkflowLibraryFlowV9 from './pages/flows/v9/MFAWorkflowLibraryFlowV9';
import OAuthROPCFlowV9 from './pages/flows/v9/OAuthROPCFlowV9';
import PARFlowV9 from './pages/flows/v9/PARFlowV9';
import PingOnePARFlowV9 from './pages/flows/v9/PingOnePARFlowV9';
import RARFlowV9 from './pages/flows/v9/RARFlowV9';
import ResourcesAPIFlowV9 from './pages/flows/v9/ResourcesAPIFlowV9';
import SAMLBearerAssertionFlowV9 from './pages/flows/v9/SAMLBearerAssertionFlowV9';
import TokenExchangeFlowV9 from './pages/flows/v9/TokenExchangeFlowV9';
import WorkerTokenFlowV9 from './pages/flows/v9/WorkerTokenFlowV9';
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
import PingAIResources from './pages/PingAIResources';
import PingOneAuthentication from './pages/PingOneAuthentication';
import PingOneAuthenticationCallback from './pages/PingOneAuthenticationCallback';
import PingOneAuthenticationResult from './pages/PingOneAuthenticationResult';
import PingOneDashboard from './pages/PingOneDashboard';
import PingOneMockFeatures from './pages/PingOneMockFeatures';
import PingOneScopesReference from './pages/PingOneScopesReference';
import PingOneSessionsAPI from './pages/PingOneSessionsAPI';
import PingOneUserProfile from './pages/PingOneUserProfile';
import PingOneWebhookViewer from './pages/PingOneWebhookViewer';
import { PostmanCollectionGenerator } from './pages/PostmanCollectionGenerator';
import SDKSampleApp from './pages/SDKSampleApp';
import ServiceTestRunner from './pages/ServiceTestRunner';
import JWTExamples from './pages/sdk-examples/JWTExamples';
import OIDCExamples from './pages/sdk-examples/OIDCExamples';
import SDKDocumentation from './pages/sdk-examples/SDKDocumentation';
import SDKExamplesHome from './pages/sdk-examples/SDKExamplesHome';
import HelioMartPasswordReset from './pages/security/HelioMartPasswordReset';
import TestDemo from './pages/TestDemo';
import UltimateTokenDisplayDemo from './pages/UltimateTokenDisplayDemo';
import URLDecoder from './pages/URLDecoder';
import { FIDO2SampleApp } from './samples/p1mfa/fido2/FIDO2SampleApp';
import { IntegratedMFASample } from './samples/p1mfa/IntegratedMFASample';
import { SMSSampleApp } from './samples/p1mfa/sms/SMSSampleApp';
// CIBAFlowV8 — /flows/ciba-v8 redirects to /v8u/unified
import { EmailMFASignOnFlowV8 } from './v8/flows/EmailMFASignOnFlowV8';
// ImplicitFlowV8 archived — /flows/implicit-v8 now redirects to /flows/implicit-v9
import { MFAConfigurationPageV8 } from './v8/flows/MFAConfigurationPageV8';
import MFADeviceManagementFlowV8 from './v8/flows/MFADeviceManagementFlowV8';
import { MFADeviceOrderingFlowV8 } from './v8/flows/MFADeviceOrderingFlowV8';
import { MFAFlowV8 } from './v8/flows/MFAFlowV8';
import MFAReportingFlowV8 from './v8/flows/MFAReportingFlowV8';
// OIDCHybridFlowV8 archived — /flows/hybrid-v8 now redirects to /flows/oidc-hybrid-v9
import PingOneProtectFlowV8 from './v8/flows/PingOneProtectFlowV8';
import { FIDO2ConfigurationPageV8 } from './v8/flows/types/FIDO2ConfigurationPageV8';
import { MobileOTPConfigurationPageV8 } from './v8/flows/types/MobileOTPConfigurationPageV8';
import { TokenMonitoringPage } from './v8u/pages/TokenMonitoringPage';

// Lazy load unified MFA flow for code splitting
const UnifiedMFARegistrationFlowV8 = React.lazy(() =>
	import('./v8/flows/unified/UnifiedMFARegistrationFlowV8').then((module) => ({
		default: module.UnifiedMFARegistrationFlowV8,
	}))
);
const FIDO2FlowV8 = React.lazy(() =>
	import('./v8/flows/types/FIDO2FlowV8').then((module) => ({ default: module.FIDO2FlowV8 }))
);
const MobileFlowV8 = React.lazy(() =>
	import('./v8/flows/types/MobileFlowV8').then((module) => ({ default: module.MobileFlowV8 }))
);

import { FloatingStepperProvider } from './contexts/FloatingStepperContext';
import EnvironmentManagementPageV8 from './pages/EnvironmentManagementPageV8';
// Import Protect Portal
import ProtectPortalWrapper from './pages/protect-portal/ProtectPortalWrapper';
import { DebugLogViewerPopoutV9 } from './pages/v9/DebugLogViewerPopoutV9';
// CreateCompanyPage - ARCHIVED
import DavinciTodoApp from './sdk-examples/davinci-todo-app/DavinciTodoApp';
import { logger } from './utils/logger';
import { DebugLogViewerPopoutV8Test as DebugLogViewerPopoutV8 } from './v8/pages/DebugLogViewerPopoutV8Test';
import DebugLogViewerV8 from './v8/pages/DebugLogViewerV8';
import DeleteAllDevicesUtilityV8 from './v8/pages/DeleteAllDevicesUtilityV8';
import DeviceAuthenticationDetailsV8 from './v8/pages/DeviceAuthenticationDetailsV8';
import { FIDO2RegistrationDocsPageV8 } from './v8/pages/FIDO2RegistrationDocsPageV8';
import MFADeviceCreateDemoV8 from './v8/pages/MFADeviceCreateDemoV8';
import { MFAFeatureFlagsAdminV8 } from './v8/pages/MFAFeatureFlagsAdminV8';
import { MobileRegistrationDocsPageV8 } from './v8/pages/MobileRegistrationDocsPageV8';
import UnifiedCredentialsMockupV8 from './v8/pages/UnifiedCredentialsMockupV8';
// V8MTokenExchange archived — token-exchange-v7 route now redirects to v9
import CallbackHandlerV8U from './v8u/components/CallbackHandlerV8U';
import UnifiedFlowErrorBoundary from './v8u/components/UnifiedFlowErrorBoundary';

// Lazy load heavy V8U components for better performance
const UnifiedFlowHelperPageV8U = lazy(() => import('./v8u/components/UnifiedFlowHelperPageV8U'));
const SpiffeSpireFlowV8U = lazy(() => import('./v8u/flows/SpiffeSpireFlowV8U'));
const UnifiedOAuthFlowV8U = lazy(() => import('./v8u/flows/UnifiedOAuthFlowV8U'));
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
const ApiStatusPage = lazy(() => import('./pages/ApiStatusPage'));

// Import V7M mock flows (V9-compliant) from pages/flows/v9
const V7MOAuthAuthCodeV9 = lazy(() => import('./pages/flows/v9/V7MOAuthAuthCodeV9'));
const V7MDeviceAuthorizationV9 = lazy(() => import('./pages/flows/v9/V7MDeviceAuthorizationV9'));
const DeviceAuthorizationVerifyPage = lazy(
	() => import('./pages/flows/v9/DeviceAuthorizationVerifyPage')
);
const V7MClientCredentialsV9 = lazy(() => import('./pages/flows/v9/V7MClientCredentialsV9'));
const V7MImplicitFlowV9 = lazy(() => import('./pages/flows/v9/V7MImplicitFlowV9'));
const V7MROPCV9 = lazy(() => import('./pages/flows/v9/V7MROPCV9'));
const V7MSettingsV9 = lazy(() => import('./v7/pages/V7MSettingsV9'));
const V7MOIDCHybridFlowV9 = lazy(() => import('./pages/flows/v9/V7MOIDCHybridFlowV9'));
const V7MCIBAFlowV9 = lazy(() => import('./pages/flows/v9/V7MCIBAFlowV9'));
const MockMcpAgentFlowPage = lazy(() => import('./pages/flows/MockMcpAgentFlowPage'));

const AppContainer = styled.div`
	display: flex;
	height: 100vh;
	min-height: 100vh;
	overflow: hidden;
	background-color: ${({ theme }) => theme.colors.gray100};
	text-align: left;
	direction: ltr;
`;

const ContentColumn = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0; /* Allow flex child to shrink so MainContent can scroll */
	min-width: 0;
	text-align: left;
	direction: ltr;
	overflow: hidden;
`;

const MainContent = styled.main<{ $sidebarWidth: number }>`
	flex: 1;
	min-height: 0; /* Allow flex child to shrink so overflow-y: auto can scroll */
	padding: 1.5rem 2rem;
	padding-top: calc(80px + 1.5rem); /* Account for fixed navbar (80px) + normal top padding */
	max-width: 100%; /* Use full content column width; no extra margin so area next to sidebar scrolls */
	width: 100%;
	background-color: ${({ theme }) => theme.colors.white};
	text-align: left;
	direction: ltr;
	overflow-y: auto; /* Enable scrolling for main content only */
	overflow-x: hidden; /* Prevent horizontal scrolling */
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
	const { pathname } = useLocation();
	const isDebugPopout =
		pathname === '/v8/debug-logs-popout' || pathname === '/v9/debug-logs-popout';
	const isWebhookPopout = pathname === '/pingone-webhook-viewer-popout';
	const isAIAssistantPopoutRoute = isAIAssistantPopout();
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [sidebarWidth, setSidebarWidth] = useState(() => {
		try {
			const saved = localStorage.getItem('sidebar.width');
			const parsed = saved ? parseInt(saved, 10) : NaN;
			if (USE_PING_MENU) {
				if (
					Number.isFinite(parsed) &&
					parsed >= SIDEBAR_PING_MIN_WIDTH &&
					parsed <= SIDEBAR_PING_MAX_WIDTH
				)
					return parsed;
				return SIDEBAR_PING_WIDTH;
			}
			if (Number.isFinite(parsed) && parsed >= 300 && parsed <= 600) return parsed;
		} catch {}
		return 450;
	});

	// Listen for sidebar width changes from localStorage
	useEffect(() => {
		let lastKnownWidth = localStorage.getItem('sidebar.width');
		let pollInterval: NodeJS.Timeout | null = null;

		const handleStorageChange = () => {
			try {
				const saved = localStorage.getItem('sidebar.width');
				const parsed = saved ? parseInt(saved, 10) : NaN;
				if (USE_PING_MENU) {
					if (
						Number.isFinite(parsed) &&
						parsed >= SIDEBAR_PING_MIN_WIDTH &&
						parsed <= SIDEBAR_PING_MAX_WIDTH
					) {
						if (parsed !== sidebarWidth) {
							logger.info(
								'🌍 [SidebarWidth] Updating sidebar width:',
								`old: ${sidebarWidth}, new: ${parsed}`
							);
							setSidebarWidth(parsed);
						}
						return;
					}
				}
				if (Number.isFinite(parsed) && parsed >= 300 && parsed <= 600) {
					if (parsed !== sidebarWidth) {
						logger.info(
							'🌍 [SidebarWidth] Updating sidebar width:',
							`old: ${sidebarWidth}, new: ${parsed}`
						);
						setSidebarWidth(parsed);
					}
				}
			} catch {}
		};

		// Start polling only when sidebar width changes (more efficient)
		const startPolling = () => {
			if (pollInterval) clearInterval(pollInterval);
			pollInterval = setInterval(handleStorageChange, 100); // Faster polling during resize
		};

		// Stop polling when not resizing
		const stopPolling = () => {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = null;
			}
		};

		// Check for width changes and manage polling accordingly
		const checkForWidthChange = () => {
			const currentWidth = localStorage.getItem('sidebar.width');
			if (currentWidth !== lastKnownWidth) {
				lastKnownWidth = currentWidth;
				handleStorageChange();
				startPolling(); // Start fast polling during resize

				// Stop fast polling after 2 seconds of no changes
				setTimeout(stopPolling, 2000);
			}
		};

		// Check on mount
		handleStorageChange();

		// Listen for storage events (in case sidebar updates localStorage from other tabs)
		window.addEventListener('storage', handleStorageChange);

		// Poll for changes with adaptive frequency
		const adaptiveInterval = setInterval(checkForWidthChange, 200); // Check every 200ms

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			if (pollInterval) clearInterval(pollInterval);
			clearInterval(adaptiveInterval);
		};
	}, [sidebarWidth]); // Add sidebarWidth dependency to prevent stale closures

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
			logger.info('🌍 [GlobalScroll] Skipping auto-scroll for:', location.pathname);
			return;
		}

		// Scroll window to top
		window.scrollTo(0, 0);

		// Scroll the main content area
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
				logger.warn('App', ' [App] Error checking configuration:', { error });
				setShowCredentialModal(true);
			}
		};

		const timer = setTimeout(checkConfiguration, 100);
		return () => clearTimeout(timer);
	}, []);

	const toggleSidebar = () => setSidebarOpen((prev) => !prev);

	const handleCredentialSetupComplete = () => {
		setShowCredentialModal(false);
		logger.info('Credential setup completed, modal hidden');
	};

	return (
		<>
			<GlobalErrorDisplay />
			<RouteRestorer />
			{isDebugPopout ? (
				// Debug log viewer popout - render without layout
				<Routes>
					<Route path="/v8/debug-logs-popout" element={<DebugLogViewerPopoutV8 />} />
					<Route path="/v9/debug-logs-popout" element={<DebugLogViewerPopoutV9 />} />
					<Route path="*" element={<Navigate to="/v9/debug-logs-popout" replace />} />
				</Routes>
			) : isWebhookPopout ? (
				// Webhook popout window only - render without sidebar layout
				<Routes>
					<Route path="/pingone-webhook-viewer-popout" element={<PingOneWebhookViewer />} />
					<Route path="*" element={<Navigate to="/pingone-webhook-viewer-popout" replace />} />
				</Routes>
			) : isAIAssistantPopoutRoute ? (
				// AI Assistant popout - moveable outside host, communicates via postMessage
				<Routes>
					<Route path="/ai-assistant-popout" element={<AIAssistantPopoutPage />} />
					<Route path="*" element={<Navigate to="/ai-assistant-popout" replace />} />
				</Routes>
			) : (
				// Main app - render with full layout
				<AppContainer>
					<Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
					<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
					<ContentColumn data-content-column>
						<MainContent $sidebarWidth={sidebarWidth}>
							<Routes>
								<Route path="/login" element={<Login />} />
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
								<Route path="/cleanliness-dashboard" element={<CleanlinessDashboardWorking />} />
								<Route path="/cleanup-history" element={<CleanupHistoryDashboard />} />
								<Route path="/flows" element={<OAuthFlowsNew />}>
									<Route
										path="compare"
										element={
											<Suspense fallback={<LoadingFallback message="Loading Flow Comparison..." />}>
												<FlowComparisonTool />
											</Suspense>
										}
									/>
									<Route
										path="diagrams"
										element={
											<Suspense
												fallback={<LoadingFallback message="Loading Interactive Diagram..." />}
											>
												<InteractiveFlowDiagram />
											</Suspense>
										}
									/>
									<Route
										path="mfa"
										element={
											<Suspense fallback={<LoadingFallback message="Loading MFA Flow..." />}>
												<MFAFlow />
											</Suspense>
										}
									/>
								</Route>
								{/* Tools & Utilities Routes */}
								<Route path="/sdk-sample-app" element={<SDKSampleApp />} />
								<Route path="/ultimate-token-display-demo" element={<UltimateTokenDisplayDemo />} />
								{/* SDK Examples Routes */}
								<Route path="/sdk-examples" element={<SDKExamplesHome />} />
								<Route path="/sdk-examples/jwt-authentication" element={<JWTExamples />} />
								<Route path="/sdk-examples/oidc-centralized-login" element={<OIDCExamples />} />
								<Route path="/sdk-examples/documentation" element={<SDKDocumentation />} />
								<Route path="/sdk-examples/davinci-todo-app" element={<DavinciTodoApp />} />
								{/* Environment Management */}
								<Route path="/environments" element={<EnvironmentManagementPageV8 />} />
								{/* Custom Domain & API Test */}
								<Route path="/custom-domain-test" element={<CustomDomainTestPage />} />
								{/* DaVinci Todo App */}
								<Route path="/davinci-todo" element={<DavinciTodoApp />} />
								{/* V7 OAuth/OIDC Flow Routes — redirected to V9 */}
								<Route
									path="/flows/oauth-authorization-code-v7"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								<Route
									path="/flows/dpop-authorization-code-v8"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								<Route
									path="/flows/dpop-authorization-code-v9"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								<Route path="/flows/mfa-v8" element={<MFAFlowV8 />} />
								<Route
									path="/v8/unified-mfa"
									element={
										<React.Suspense fallback={<div>Loading...</div>}>
											<UnifiedMFARegistrationFlowV8 registrationFlowType="admin" />
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
											{/* <UnifiedMFARegistrationFlowV8 deviceType="TOTP" /> */}
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
								{/* Voice routes redirect to SMS (Voice uses the same phone-based flow as SMS) */}
								<Route
									path="/v8/mfa/register/voice"
									element={<Navigate to="/v8/mfa/register/sms" replace />}
								/>
								<Route
									path="/v8/mfa/register/voice/device"
									element={<Navigate to="/v8/mfa/register/sms/device" replace />}
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
								<Route path="/v9/resources-api" element={<ResourcesAPIFlowV9 />} />
								<Route path="/v8/protect" element={<PingOneProtectFlowV8 />} />
								<Route
									path="/flows/oauth-authorization-code-v7-condensed-mock"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								<Route
									path="/flows/mock-oidc-ropc"
									element={<Navigate to="/flows/oauth-ropc-v9" replace />}
								/>
								{/* Legacy paths: redirect to canonical flow paths */}
								<Route
									path="/v7/oauth/authorization-code"
									element={<Navigate to="/flows/oauth-authorization-code-v9" replace />}
								/>
								<Route
									path="/v7/oidc/authorization-code"
									element={<Navigate to="/flows/oidc-authorization-code-v9" replace />}
								/>
								{/* Legacy path: redirect to canonical flow path */}
								<Route
									path="/v7/oauth/device-authorization"
									element={<Navigate to="/flows/device-authorization-v9" replace />}
								/>
								<Route
									path="/v7/oauth/client-credentials"
									element={<Navigate to="/flows/client-credentials-v9" replace />}
								/>
								<Route
									path="/v7/oauth/implicit"
									element={<Navigate to="/flows/implicit-v9" replace />}
								/>
								<Route
									path="/v7/oidc/implicit"
									element={<Navigate to="/flows/oidc-implicit-v9" replace />}
								/>
								<Route
									path="/v7/oauth/ropc"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MROPCV9 oidc={false} title="Resource Owner Password Credentials" />
										</Suspense>
									}
								/>
								<Route
									path="/v7/oidc/ropc"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MROPCV9 oidc={true} title="OIDC Resource Owner Password Credentials" />
										</Suspense>
									}
								/>
								<Route
									path="/v7/settings"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MSettingsV9 />
										</Suspense>
									}
								/>
								<Route
									path="/v7/oidc/hybrid"
									element={<Navigate to="/flows/oidc-hybrid-v9" replace />}
								/>
								<Route path="/v7/oidc/ciba" element={<Navigate to="/flows/ciba-v9" replace />} />
								<Route path="/flows/userinfo" element={<UserInfoPostFlow />} />
								<Route path="/flows/token-revocation" element={<TokenRevocationFlow />} />
								<Route path="/flows/pingone-logout" element={<PingOneLogoutFlow />} />
								{/* Deprecated flows — redirect to V9 */}
								<Route
									path="/flows/oauth2-compliant-authorization-code"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								<Route
									path="/flows/oidc-compliant-authorization-code"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								{/* Legacy V6 routes - redirect to V9 equivalents directly */}
								<Route
									path="/flows/oauth-authorization-code-v6"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								<Route
									path="/flows/oidc-authorization-code-v6"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								{/* V7/V8 Implicit Flow — redirect to unified */}
								<Route path="/flows/implicit-v7" element={<Navigate to="/v8u/unified" replace />} />
								<Route path="/flows/implicit-v8" element={<Navigate to="/v8u/unified" replace />} />
								<Route
									path="/flows/implicit-v9"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MImplicitFlowV9 oidc={false} title="OAuth Implicit Flow" />
										</Suspense>
									}
								/>
								<Route
									path="/flows/oidc-implicit-v9"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MImplicitFlowV9 oidc={true} title="OIDC Implicit Flow" />
										</Suspense>
									}
								/>
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
								<Route path="/v8/delete-all-devices" element={<DeleteAllDevicesUtilityV8 />} />
								<Route path="/v8/debug-logs" element={<DebugLogViewerV8 />} />
								<Route path="/v8/debug-logs-popout" element={<DebugLogViewerPopoutV8 />} />
								{/* V9 Utilities */}
								<Route path="/v9/debug-logs-popout" element={<DebugLogViewerPopoutV9 />} />
								{/* SPIFFE/SPIRE Mock Flow V9 - canonical routes */}
								<Route
									path="/flows/spiffe-spire-v9"
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
									path="/flows/spiffe-spire-v9/tokens"
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
								{/* Legacy redirects: v8u SPIFFE/SPIRE → V9 canonical */}
								<Route
									path="/v8u/spiffe-spire"
									element={<Navigate to="/flows/spiffe-spire-v9" replace />}
								/>
								<Route
									path="/v8u/spiffe-spire/attest"
									element={<Navigate to="/flows/spiffe-spire-v9" replace />}
								/>
								<Route
									path="/v8u/spiffe-spire/svid"
									element={<Navigate to="/flows/spiffe-spire-v9" replace />}
								/>
								<Route
									path="/v8u/spiffe-spire/validate"
									element={<Navigate to="/flows/spiffe-spire-v9" replace />}
								/>
								<Route
									path="/v8u/spiffe-spire/tokens"
									element={<Navigate to="/flows/spiffe-spire-v9/tokens" replace />}
								/>
								{/* WIMSE Workload Identity Demo */}
								<Route
									path="/flows/wimse-v1"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading WIMSE Flow..."
													subtext="Preparing workload identity demo"
												/>
											}
										>
											<WIMSEFlow />
										</Suspense>
									}
								/>
								<Route
									path="/flows/oidc-implicit-v6"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								{/* Attestation-Based Client Auth Demo */}
								<Route
									path="/flows/attestation-client-auth-v1"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading Attestation Flow..."
													subtext="Preparing client attestation demo"
												/>
											}
										>
											<AttestationClientAuthFlow />
										</Suspense>
									}
								/>
								<Route
									path="/flows/oauth-implicit-completion"
									element={<OAuthImplicitFlowCompletion />}
								/>
								{/* mTLS Client Authentication Demo (RFC 8705) */}
								<Route
									path="/flows/mtls-client-auth-v1"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading mTLS Flow..."
													subtext="Preparing certificate-bound token demo"
												/>
											}
										>
											<MtlsClientAuthFlow />
										</Suspense>
									}
								/>
								<Route
									path="/flows/gnap-v1"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading GNAP Flow..."
													subtext="Preparing grant negotiation demo"
												/>
											}
										>
											<GnapFlow />
										</Suspense>
									}
								/>
								<Route
									path="/flows/jar-jarm-v1"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading JAR+JARM Flow..."
													subtext="Preparing signed request/response demo"
												/>
											}
										>
											<JarJarmFlow />
										</Suspense>
									}
								/>
								<Route
									path="/flows/step-up-auth-v1"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading Step-Up Auth..."
													subtext="Preparing step-up authentication demo"
												/>
											}
										>
											<StepUpAuthFlow />
										</Suspense>
									}
								/>
								<Route
									path="/flows/token-introspection-v1"
									element={
										<Suspense
											fallback={
												<ComponentLoader
													message="Loading Introspection Flow..."
													subtext="Preparing token introspection demo"
												/>
											}
										>
											<TokenIntrospectionFlowV1 />
										</Suspense>
									}
								/>
								{/* Device Authorization — v9 mock flow (canonical); v7 → unified */}
								<Route
									path="/flows/device-authorization-v7"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								<Route
									path="/flows/device-authorization-v9"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MDeviceAuthorizationV9 />
										</Suspense>
									}
								/>
								<Route
									path="/flows/device-authorization-v9/verify"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<DeviceAuthorizationVerifyPage />
										</Suspense>
									}
								/>
								<Route
									path="/flows/device-authorization-v6"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								<Route
									path="/flows/oidc-device-authorization-v6"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								{/* V7 JWT Bearer Token Flow */}
								<Route
									path="/flows/jwt-bearer-token-v7"
									element={<Navigate to="/flows/jwt-bearer-token-v9" replace />}
								/>
								{/* V9 JWT Bearer Token Flow */}
								<Route path="/flows/jwt-bearer-token-v9" element={<JWTBearerTokenFlowV9 />} />
								{/* V9 Token Exchange Flow */}
								<Route path="/flows/token-exchange-v9" element={<TokenExchangeFlowV9 />} />
								{/* V8M Token Exchange Flow */}
								<Route
									path="/flows/token-exchange-v7"
									element={<Navigate to="/flows/token-exchange-v9" replace />}
								/>
								{/* Legacy V6 routes - redirect to V7 (latest version) */}
								<Route
									path="/flows/jwt-bearer-token-v6"
									element={<Navigate to="/flows/jwt-bearer-token-v9" replace />}
								/>
								{/* V7 SAML Bearer Assertion Flow */}
								<Route
									path="/flows/saml-bearer-assertion-v7"
									element={<Navigate to="/flows/saml-bearer-assertion-v9" replace />}
								/>
								{/* V9 SAML Bearer Assertion Flow */}
								<Route
									path="/flows/saml-bearer-assertion-v9"
									element={<SAMLBearerAssertionFlowV9 />}
								/>
								<Route
									path="/flows/saml-sp-dynamic-acs-v1"
									element={<SAMLServiceProviderFlowV1 />}
								/>
								{/* Legacy V6 routes - redirect to V7 (latest version) */}
								<Route
									path="/flows/saml-bearer-assertion-v6"
									element={<Navigate to="/flows/saml-bearer-assertion-v9" replace />}
								/>
								{/* V7 Worker Token Flow — redirect to V9 */}
								<Route
									path="/flows/worker-token-v7"
									element={<Navigate to="/flows/worker-token-v9" replace />}
								/>
								{/* V9 Worker Token Flow */}
								<Route path="/flows/worker-token-v9" element={<WorkerTokenFlowV9 />} />
								{/* Legacy V6 routes - redirect to V9 */}
								<Route
									path="/flows/worker-token-v6"
									element={<Navigate to="/flows/worker-token-v9" replace />}
								/>
								{/* Client Credentials — redirect to unified */}
								<Route
									path="/flows/client-credentials-v7"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								<Route
									path="/flows/client-credentials-v9"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MClientCredentialsV9 />
										</Suspense>
									}
								/>
								<Route
									path="/flows/client-credentials-v6"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								{/* OIDC Hybrid — redirect to unified */}
								<Route
									path="/flows/oidc-hybrid-v7"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								<Route
									path="/flows/oidc-hybrid-v9"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MOIDCHybridFlowV9 />
										</Suspense>
									}
								/>
								{/* Authorization Code — redirect to unified */}
								<Route
									path="/flows/oauth-authorization-code-v9"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MOAuthAuthCodeV9 oidc={false} title="OAuth Authorization Code" />
										</Suspense>
									}
								/>
								<Route
									path="/flows/oauth-authorization-code-v9-condensed"
									element={<Navigate to="/flows/oauth-authorization-code-v9" replace />}
								/>
								<Route
									path="/flows/oidc-authorization-code-v9"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MOAuthAuthCodeV9 oidc={true} title="OIDC Authorization Code" />
										</Suspense>
									}
								/>
								<Route path="/flows/hybrid-v8" element={<Navigate to="/v8u/unified" replace />} />
								<Route
									path="/flows/oidc-hybrid-v6"
									element={<Navigate to="/v8u/unified" replace />}
								/>
								{/* CIBA — redirect to unified */}
								<Route path="/flows/ciba-v8" element={<Navigate to="/flows/ciba-v9" replace />} />
								<Route
									path="/flows/ciba-v9"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<V7MCIBAFlowV9 />
										</Suspense>
									}
								/>
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
								<Route
									path="/flows/redirectless-v7-real"
									element={<Navigate to="/flows/redirectless-v9-real" replace />}
								/>
								<Route
									path="/flows/par"
									element={<Navigate to="/flows/pingone-par-v9" replace />}
								/>
								<Route path="/flows-old/jwt-bearer" element={<JWTBearerFlow />} />
								{/* Unsupported by PingOne flows */}
								<Route
									path="/oauth/resource-owner-password"
									element={<Navigate to="/flows/oauth-ropc-v9" replace />}
								/>
								<Route
									path="/oidc/resource-owner-password"
									element={<Navigate to="/flows/oauth-ropc-v9" replace />}
								/>
								{/* V7 PingOne PAR Flow — redirect to V9 */}
								<Route
									path="/flows/pingone-par-v7"
									element={<Navigate to="/flows/pingone-par-v9" replace />}
								/>
								{/* V9 PingOne PAR Flow */}
								<Route path="/flows/pingone-par-v9" element={<PingOnePARFlowV9 />} />
								<Route
									path="/flows/par-v7"
									element={<Navigate to="/flows/pingone-par-v9" replace />}
								/>
								{/* Legacy V6 routes - redirect to V9 */}
								<Route
									path="/flows/pingone-par-v6"
									element={<Navigate to="/flows/pingone-par-v9" replace />}
								/>
								{/* V9 PingOne MFA Flow - replaces V7 */}
								<Route
									path="/flows/pingone-mfa-workflow-library-v9"
									element={<MFAWorkflowLibraryFlowV9 />}
								/>
								{/* V7 routes → redirect to V9 */}
								<Route
									path="/flows/pingone-complete-mfa-v7"
									element={<Navigate to="/flows/pingone-mfa-workflow-library-v9" replace />}
								/>
								<Route
									path="/flows/pingone-mfa-workflow-library-v7"
									element={<Navigate to="/flows/pingone-mfa-workflow-library-v9" replace />}
								/>
								<Route path="/flows/kroger-grocery-store-mfa" element={<KrogerGroceryStoreMFA />} />
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route
									path="/flows/pingone-mfa-v6"
									element={<Navigate to="/flows/pingone-mfa-workflow-library-v9" replace />}
								/>
								<Route path="/pingone-authentication" element={<PingOneAuthentication />} />
								<Route
									path="/pingone-authentication/result"
									element={<PingOneAuthenticationResult />}
								/>
								<Route path="/pingone-mock-features" element={<PingOneMockFeatures />} />
								<Route path="/pingone-dashboard" element={<PingOneDashboard />} />
								<Route
									path="/pingone-identity-metrics"
									element={<Navigate to="/pingone-dashboard?tab=metrics" replace />}
								/>
								<Route
									path="/pingone-audit-activities"
									element={<Navigate to="/pingone-dashboard?tab=audit" replace />}
								/>
								<Route path="/pingone-webhook-viewer" element={<PingOneWebhookViewer />} />
								<Route path="/organization-licensing" element={<OrganizationLicensing />} />
								<Route path="/p1-callback" element={<PingOneAuthenticationCallback />} />
								<Route path="/p1auth-callback" element={<PingOneAuthenticationCallback />} />
								{/* V7 RAR Flow */}
								<Route path="/flows/rar-v7" element={<Navigate to="/flows/rar-v9" replace />} />
								{/* V9 RAR Flow (mock/educational) */}
								<Route path="/flows/rar-v9" element={<RARFlowV9 />} />
								{/* V9 PAR Flow (mock/educational) */}
								<Route path="/flows/par-v9" element={<PARFlowV9 />} />
								{/* DPoP Flow (Educational/Mock) */}
								<Route path="/flows/dpop" element={<DPoPFlow />} />
								{/* Mock MCP Agent Flow (educational) */}
								<Route path="/flows/mock-mcp-agent-flow" element={<MockMcpAgentFlowPage />} />
								{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
								<Route path="/flows/rar-v6" element={<Navigate to="/flows/rar-v9" replace />} />
								<Route
									path="/flows/oauth2-resource-owner-password"
									element={<OAuth2ResourceOwnerPasswordFlow />}
								/>
								<Route
									path="/flows/oauth-ropc-v7"
									element={<Navigate to="/flows/oauth-ropc-v9" replace />}
								/>
								{/* V9 ROPC Flow */}
								<Route path="/flows/oauth-ropc-v9" element={<OAuthROPCFlowV9 />} />
								{/* Test MFA Flow */}
								<Route
									path="/mfa-test"
									element={
										<Suspense fallback={<LoadingFallback message="Loading MFA Test..." />}>
											<MFAFlow />
										</Suspense>
									}
								/>
								{/* Legacy /oidc routes - Keep utility pages and unsupported flows */}
								<Route path="/oidc" element={<OIDC />}>
									<Route path="userinfo" element={<UserInfoFlow />} />
									<Route path="id-tokens" element={<IDTokensFlow />} />
									<Route
										path="resource-owner-password"
										element={<Navigate to="/flows/oauth-ropc-v9" replace />}
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
								<Route
									path="/worker-token-tester"
									element={<Navigate to="/flows/worker-token-v9" replace />}
								/>
								<Route
									path="/credential-management"
									element={<Navigate to="/configuration" replace />}
								/>
								<Route path="/ai-identity-architectures" element={<AIIdentityArchitectures />} />
								<Route path="/about" element={<About />} />
								<Route path="/flow-header-demo" element={<FlowHeaderDemo />} />
								<Route path="/test-demo" element={<TestDemo />} />
								<Route path="/environment-id-demo" element={<EnvironmentIdInputDemo />} />
								<Route path="/docs/oidc-specs" element={<OIDCSpecs />} />
								<Route path="/docs/oauth-for-ai" element={<OAuthForAI />} />
								<Route path="/docs/oidc-for-ai" element={<OIDCForAI />} />
								<Route path="/docs/ping-view-on-ai" element={<PingViewOnAI />} />
								<Route path="/docs/ai-agent-auth-draft" element={<AIAgentAuthDraft />} />
								<Route
									path="/docs/oauth2-security-best-practices"
									element={<OAuth2SecurityBestPractices />}
								/>
								<Route path="/docs/spiffe-spire-pingone" element={<SpiffeSpirePingOne />} />
								{/* Added new migration and prompts routes */}
								<Route path="/docs/migration" element={<MigrationGuide />} />
								<Route path="/docs/migration/migrate-vscode" element={<MigrateVscode />} />
								<Route path="/docs/prompts/prompt-all" element={<PromptAll />} />
								<Route path="/auto-discover" element={<AutoDiscover />} />
								<Route path="/token-management" element={<TokenMonitoringPage />} />
								<Route path="/token/operations" element={<CombinedTokenPage />} />
								<Route path="/flows/token-introspection" element={<TokenIntrospectionFlow />} />
								<Route
									path="/postman-collection-generator"
									element={<PostmanCollectionGenerator />}
								/>
								<Route path="/samples/p1mfa" element={<P1MFASamples />} />
								<Route path="/samples/p1mfa/integrated" element={<IntegratedMFASample />} />
								<Route path="/samples/p1mfa/fido2" element={<FIDO2SampleApp />} />
								<Route path="/samples/p1mfa/sms" element={<SMSSampleApp />} />
								<Route path="/oauth-2-1" element={<OAuth21 />} />
								<Route path="/oidc-session-management" element={<OIDCSessionManagement />} />
								<Route path="/pingone-scopes-reference" element={<PingOneScopesReference />} />
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
								<Route path="/documentation/mcp" element={<MCPDocumentation />} />
								<Route path="/documentation/oidc-overview" element={<OIDCOverview />} />
								<Route
									path="/ai-glossary"
									element={
										<Suspense fallback={<LoadingFallback message="Loading AI Glossary..." />}>
											<AIGlossary />
										</Suspense>
									}
								/>
								<Route
									path="/ai-agent-overview"
									element={
										<Suspense fallback={<LoadingFallback message="Loading AI Agent Overview..." />}>
											<AIAgentOverview />
										</Suspense>
									}
								/>
								<Route path="/ai-assistant" element={<AIAssistantPage />} />
								<Route
									path="/mcp-server"
									element={
										<Suspense fallback={<LoadingFallback message="Loading MCP Server Config..." />}>
											<McpServerConfig />
										</Suspense>
									}
								/>
								<Route
									path="/competitive-analysis"
									element={
										<Suspense
											fallback={<LoadingFallback message="Loading Competitive Analysis..." />}
										>
											<CompetitiveAnalysis />
										</Suspense>
									}
								/>
								<Route
									path="/comprehensive-oauth-education"
									element={
										<Suspense fallback={<LoadingFallback message="Loading OAuth Education..." />}>
											<ComprehensiveOAuthEducation />
										</Suspense>
									}
								/>
								{/* Protect Portal Application */}
								<Route path="/protect-portal" element={<ProtectPortalWrapper />} />
								{/* Company Editor Utility - ARCHIVED */}
								<Route path="/advanced-configuration" element={<AdvancedConfiguration />} />
								<Route
									path="/advanced-security-settings"
									element={<AdvancedSecuritySettingsDemo />}
								/>
								<Route
									path="/advanced-security-settings-comparison"
									element={<Navigate to="/configuration" replace />}
								/>
								<Route path="/security/password-reset" element={<HelioMartPasswordReset />} />
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
									path="/api-status"
									element={
										<Suspense fallback={<div>Loading...</div>}>
											<ApiStatusPage />
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
					logger.info(' [App] Credentials saved from startup modal:', creds);
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
	useComponentTracker('App');
	useCleanlinessTracker('App', 0); // Feeds /cleanliness-dashboard runtime metrics
	return (
		<UISettingsProvider>
			<AppContent />
		</UISettingsProvider>
	);
}

function AppContent() {
	useComponentTracker('AppContent');
	const { settings } = useUISettings();
	const theme = useMemo(() => buildTheme(settings), [settings]);
	const location = useLocation();
	const navigate = useNavigate();
	const isStandaloneLogViewerRoute = location.pathname === '/standalone/log-viewer';
	const isAIAssistantPageRoute = location.pathname === '/ai-assistant';

	// Listen for AI Assistant popout → host navigation (when user clicks links in popout)
	useEffect(() => {
		if (isAIAssistantPopout()) return;
		const handler = (e: MessageEvent) => {
			if (e.origin !== window.location.origin) return;
			if (e.data?.type === AI_ASSISTANT_NAVIGATE && typeof e.data?.path === 'string') {
				navigate(e.data.path);
				window.focus();
			}
		};
		window.addEventListener('message', handler);
		return () => window.removeEventListener('message', handler);
	}, [navigate]);

	// Initialize external error handling
	useExternalErrorHandling();

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

	// Floating debug log viewer state
	const [isFloatingDebugLogViewerOpen, setIsFloatingDebugLogViewerOpen] = useState(false);

	// Enable prompts keyboard shortcut
	usePromptsShortcut();

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
	// Wait screen: show for minimum time when "Get worker token" is clicked so user sees feedback
	const [workerTokenModalOpening, setWorkerTokenModalOpening] = useState(false);
	const WORKER_TOKEN_WAIT_MS = 500;

	// Handle global worker token modal events — show wait screen for at least WORKER_TOKEN_WAIT_MS then open modal
	useEffect(() => {
		logger.info('[App] Setting up worker token modal event listener...', 'Logger info');
		let openTimeoutId: ReturnType<typeof setTimeout> | null = null;

		const handleWorkerTokenModalEvent = (event: CustomEvent) => {
			logger.info('[App] Opening worker token modal from:', event.detail?.source || 'unknown');
			setWorkerTokenModalOpening(true);
			openTimeoutId = setTimeout(() => {
				openTimeoutId = null;
				setWorkerTokenModalOpening(false);
				setShowWorkerTokenModal(true);
			}, WORKER_TOKEN_WAIT_MS);
		};

		window.addEventListener(
			'open-worker-token-modal',
			handleWorkerTokenModalEvent as EventListener
		);

		return () => {
			if (openTimeoutId) clearTimeout(openTimeoutId);
			window.removeEventListener(
				'open-worker-token-modal',
				handleWorkerTokenModalEvent as EventListener
			);
		};
	}, []);

	// Open log viewer when AI Assistant (or any component) requests it — for viewing MCP calls
	useEffect(() => {
		const handleOpenLogViewer = () => setIsFloatingDebugLogViewerOpen(true);
		window.addEventListener('open-log-viewer', handleOpenLogViewer);
		return () => window.removeEventListener('open-log-viewer', handleOpenLogViewer);
	}, []);

	if (isStandaloneLogViewerRoute) {
		return (
			<ThemeProvider theme={theme}>
				<GlobalStyle />
			</ThemeProvider>
		);
	}

	return (
		<ThemeProvider theme={theme}>
			<ExternalScriptErrorBoundary>
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
													<FloatingStepperProvider>
														<V9ModernMessagingProvider>
															<AppRoutes />
														</V9ModernMessagingProvider>
													</FloatingStepperProvider>
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

				{/* Wait screen when "Get worker token" is clicked — guaranteed minimum display time */}
				<StandardModalSpinner
					show={workerTokenModalOpening}
					message="Opening worker token..."
					theme="green"
				/>

				{/* Global Worker Token Modal — uses Worker Token modal service (WorkerTokenModalV9) */}
				{showWorkerTokenModal && (
					<WorkerTokenModalV9
						isOpen={showWorkerTokenModal}
						onClose={() => setShowWorkerTokenModal(false)}
					/>
				)}

				{/* Global Backend Connectivity Modal */}
				<BackendDownModalV8 />

				{/* Debug Log Viewer Button — visible on all pages (including AI Assistant) to view MCP calls */}
				{!isStandaloneLogViewerRoute && (
					<button
						type="button"
						onClick={() => setIsFloatingDebugLogViewerOpen(true)}
						style={{
							position: 'fixed',
							bottom: '20px',
							right: '20px',
							width: '50px',
							height: '50px',
							background: 'var(--ping-bg-primary, #2563eb)',
							color: 'var(--ping-text-inverse, #ffffff)',
							border: '1px solid var(--ping-border-primary, #d1d5db)',
							borderRadius: '50%',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
							zIndex: 9998,
							transition: 'all 0.15s ease-in-out',
							fontSize: '18px',
						}}
						title="Open Debug Log Viewer"
					>
						📋
					</button>
				)}

				{/* Floating Debug Log Viewer */}
				<EnhancedFloatingLogViewer
					isOpen={isFloatingDebugLogViewerOpen}
					onClose={() => setIsFloatingDebugLogViewerOpen(false)}
				/>

				{/* MasterFlow Agent - floating chat on all pages; not on /ai-assistant (page has its own) */}
				{!isAIAssistantPageRoute && <AIAssistant />}
			</ExternalScriptErrorBoundary>
		</ThemeProvider>
	);
}

export default App;
