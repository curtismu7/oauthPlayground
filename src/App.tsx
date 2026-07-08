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
import { BackendDownModal } from './mfa/components/BackendDownModal';
import { ConfirmationModal } from './mfa/components/ConfirmationModal';
import { PromptModal } from './mfa/components/PromptModal';
import { WorkerTokenCredentialModal } from '@/components/WorkerTokenCredentialModal';
import { FlowStateProvider } from './mfa/contexts/FlowStateContext';
import UnifiedFlowProvider from './lab/services/enhancedStateManagement';
import './styles/spec-cards.css';
import './styles/ui-settings.css';
import './styles/button-text-white-enforcement.css'; // CRITICAL: Ensures all buttons have white text
import { lazy, Suspense } from 'react';

// Deferred: AI Assistant brings in the entire mcpQueryService module tree — lazy-load so it
// only parses when the floating button first renders (not on app startup).
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const AIAssistantPopoutPage = lazy(() =>
	import('./pages/AIAssistantPopoutPage').then((m) => ({ default: m.AIAssistantPopoutPage }))
);

import LoadingFallback from './components/LoadingFallback';
import { StandardModalSpinner } from './components/ui/StandardSpinner';
import { ModernMessagingProvider } from './components/ModernMessagingComponents';

// Lazy-loaded route-only components (not needed until navigated to)
const CleanlinessDashboardWorking = lazy(() =>
	import('./components/CleanlinessDashboardWorking').then((m) => ({
		default: m.CleanlinessDashboardWorking,
	}))
);
const CodeExamplesDemo = lazy(() => import('./components/CodeExamplesDemo'));
// flows — clean-core rebuild (real PingOne), canonical routes under /flows/* (legacy /v2/flows/* redirects)
const FlowsClientCredentials = lazy(() => import('./flows/flows/clientCredentials.flow'));
const FlowsAuthorizationCode = lazy(() => import('./flows/flows/authorizationCode.flow'));
const FlowsUseCases = lazy(() => import('./flows/use-cases/UseCasesPage'));
const FlowsAuthorizationCodeEducational = lazy(() => import('./flows/flows/AuthorizationCodeEducational'));
const FlowsAuthCallback = lazy(() => import('./flows/flows/AuthCallback'));
const FlowsDeviceAuthorization = lazy(() => import('./flows/flows/deviceAuthorization.flow'));
const FlowsTokenExchange = lazy(() => import('./flows/flows/tokenExchange.flow'));
const FlowsTokenIntrospection = lazy(() => import('./flows/flows/tokenIntrospection.flow'));
const FlowsUserInfo = lazy(() => import('./flows/flows/userInfo.flow'));
const FlowsTokenRevocation = lazy(() => import('./flows/flows/tokenRevocation.flow'));
const FlowsPar = lazy(() => import('./flows/flows/par.flow'));
const FlowsRefreshToken = lazy(() => import('./flows/flows/refreshToken.flow'));
const FlowsOidcDiscovery = lazy(() => import('./flows/flows/oidcDiscovery.flow'));
const FlowsDpop = lazy(() => import('./flows/flows/dpop.flow'));
const FlowsRedirectless = lazy(() => import('./flows/flows/redirectless.flow'));
const FlowsImplicitHybrid = lazy(() => import('./flows/flows/implicitHybrid.flow'));
const FlowsImplicitHybridCallback = lazy(() => import('./flows/flows/ImplicitHybridCallback'));
const FlowsHybrid = lazy(() => import('./flows/flows/hybrid.flow'));
const FlowsRopc = lazy(() => import('./flows/flows/ropc.flow'));
const FlowsSAMLBearerAssertion = lazy(() => import('./flows/flows/samlBearerAssertion.flow'));
const CombinedTokenPage = lazy(() => import('./pages/CombinedTokenPage'));
const CredentialSetupModal = lazy(() => import('./components/CredentialSetupModal'));
const EnhancedFloatingLogViewer = lazy(() =>
	import('./components/EnhancedFloatingLogViewer').then((m) => ({
		default: m.EnhancedFloatingLogViewer,
	}))
);

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
// DPoPFlow retired — /flows/dpop now redirects to /v2/flows/dpop
const IDTokensFlow = lazy(() => import('./pages/flows/IDTokensFlow'));
const JWTBearerFlow = lazy(() => import('./pages/flows/JWTBearerFlow'));
const KrogerGroceryStoreMFA = lazy(() => import('./pages/flows/KrogerGroceryStoreMFA'));
// PARFlow removed — route redirects to /flows/pingone-par-v9
const PingOneLogoutFlow = lazy(() => import('./pages/flows/PingOneLogoutFlow'));

// Lazy load heavy tool pages
const ApplicationGenerator = lazy(() => import('./pages/ApplicationGenerator'));
const ClientGenerator = lazy(() => import('./pages/ClientGenerator'));
const CodeEditorDemo = lazy(() => import('./pages/CodeEditorDemo'));
const FlowComparisonTool = lazy(() => import('./components/FlowComparisonTool'));
const InteractiveFlowDiagram = lazy(() => import('./components/InteractiveFlowDiagram'));
const AutoDiscover = lazy(() => import('./pages/AutoDiscover'));

// Lazy load AI and advanced pages
const AIIdentityArchitectures = lazy(() => import('./pages/AIIdentityArchitecturesV9'));
const McpServerConfigFlowV9 = lazy(() => import('./flows/specialty/McpServerConfigFlowV9'));
const McpToolDiscovery = lazy(() => import('./pages/McpToolDiscovery'));
const OAuthCodeGeneratorHub = lazy(() => import('./pages/OAuthCodeGeneratorHub'));
const OAuthPlaygroundHub = lazy(() => import('./pages/OAuthPlaygroundHub'));
const OAuthFlowsNew = lazy(() => import('./pages/OAuthFlowsNew'));
const WIMSEFlow = lazy(() => import('./flows/specialty/WIMSEFlow'));
const AttestationClientAuthFlow = lazy(() => import('./flows/specialty/AttestationClientAuthFlow'));
const MtlsClientAuthFlow = lazy(() => import('./flows/specialty/MtlsClientAuthFlow'));
const GnapFlow = lazy(() => import('./flows/specialty/GnapFlow'));
const JarJarmFlow = lazy(() => import('./flows/specialty/JarJarmFlow'));
const StepUpAuthFlow = lazy(() => import('./flows/specialty/StepUpAuthFlow'));

// Layout shell — must be eager
import Navbar from './components/Navbar';

const DeviceMockFlow = lazy(() => import('./components/DeviceMockFlow'));
const FlowHeaderDemo = lazy(() => import('./components/FlowHeaderDemo'));

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

const Callback = lazy(() => import('./pages/Callback'));
const Configuration = lazy(() => import('./pages/Configuration'));
const DesignSystemPage = lazy(() => import('./pages/design/DesignSystemPage'));
const Documentation = lazy(() => import('./pages/Documentation'));
const Login = lazy(() => import('./pages/Login'));

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
// import { migrateAllMFARedirectUris } from './mfa/utils/mfaRedirectUriMigration';

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
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorDisplay from './components/GlobalErrorDisplay';
import ServerStatusProvider from './components/ServerStatusProvider';
import { StartupWrapper } from './components/StartupWrapper';

// Callback routes — lazy since they only activate after an OAuth redirect
const AuthzCallback = lazy(() => import('./components/callbacks/AuthzCallback'));
const DashboardCallback = lazy(() => import('./components/callbacks/DashboardCallback'));
const DeviceCodeStatus = lazy(() => import('./components/callbacks/DeviceCodeStatus'));
const HybridCallback = lazy(() => import('./components/callbacks/HybridCallback'));
const ImplicitCallback = lazy(() => import('./components/callbacks/ImplicitCallback'));
const WorkerTokenCallback = lazy(() => import('./components/callbacks/WorkerTokenCallback'));
const LogoutCallback = lazy(() => import('./components/LogoutCallback'));
// Route-only pages — lazy since they load only on navigation
const About = lazy(() => import('./pages/About'));
const AdvancedConfiguration = lazy(() => import('./pages/AdvancedConfiguration'));
const CIBAvsDeviceAuthz = lazy(() => import('./pages/CIBAvsDeviceAuthz'));
const CustomDomainTestPage = lazy(() => import('./pages/CustomDomainTestPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

const AIAgentAuthDraft = lazy(() => import('./pages/docs/AIAgentAuthDraft'));
const MCPDocumentation = lazy(() => import('./pages/docs/MCPDocumentation'));
// Added new migration and prompts pages
const MigrateVscode = lazy(() => import('./pages/docs/migration/MigrateVscode'));
const MigrationGuide = lazy(() => import('./pages/docs/migration/MigrationGuide'));
const OAuth2SecurityBestPractices = lazy(() => import('./pages/docs/OAuth2SecurityBestPractices'));
const OAuthForAI = lazy(() => import('./pages/docs/OAuthForAIV9'));
const OIDCForAI = lazy(() => import('./pages/docs/OIDCForAIV9'));
const OIDCOverview = lazy(() => import('./pages/docs/OIDCOverviewV7'));
// Removed unused OIDC overview imports
const OIDCSpecs = lazy(() => import('./pages/docs/OIDCSpecs'));
const PingViewOnAI = lazy(() => import('./pages/docs/PingViewOnAIV9'));
const PromptAll = lazy(() => import('./pages/docs/prompts/PromptAll'));
const SpiffeSpirePingOne = lazy(() => import('./pages/docs/SpiffeSpirePingOne'));
const EnvironmentIdInputDemo = lazy(() => import('./pages/EnvironmentIdInputDemo'));
const AdvancedOAuthParametersDemoFlow = lazy(
	() => import('./pages/flows/AdvancedOAuthParametersDemoFlow')
);
// ClientCredentialsFlowV7 archived — route redirects to v9
// DeviceAuthorizationFlowV7 archived — route redirects to v9
// OAuth2ResourceOwnerPasswordFlow retired — /flows/oauth2-resource-owner-password redirects to /v2/flows/ropc

// OAuthAuthorizationCodeFlowV7 archived — route redirects to v9
// OAuthAuthorizationCodeFlowV7_2 archived — route redirects to v9
// OAuthImplicitFlowCompletion retired — /flows/oauth-implicit-completion now redirects to /v2/flows/implicit-hybrid

// OAuthROPCFlowV7 archived — route redirects to v9
// OIDCHybridFlowV7 archived — route redirects to v9
// PARFlowV7 archived — route redirects to pingone-par-v9
// RedirectlessFlowV9_Real retired — /flows/redirectless-v9-real now redirects to /v2/flows/redirectless
const SAMLServiceProviderFlowV9 = lazy(() => import('./flows/specialty/SAMLServiceProviderFlowV9'));
// TokenRevocationFlow kept — imported by CombinedTokenPage and infinite-loop-prevention test
const TokenRevocationFlow = lazy(() => import('./pages/flows/TokenRevocationFlow'));
// UserInfoFlow retired — /oidc/userinfo now redirects to /v2/flows/userinfo
// UserInfoPostFlow retired — /flows/userinfo now redirects to /v2/flows/userinfo
// V7RMOIDCResourceOwnerPasswordFlow removed — route redirects to /flows/oauth-ropc-v9
// CIBAFlowV9, ClientCredentialsFlowV9, DeviceAuthorizationFlowV9, DPoPAuthorizationCodeFlowV9,
// ImplicitFlowV9, OAuthAuthorizationCodeFlowV9, OAuthAuthorizationCodeFlowV9_Condensed, OIDCHybridFlowV9
// — all redirect to /v8u/unified
const JWTBearerTokenFlowV9 = lazy(() => import('./flows/specialty/JWTBearerTokenFlowV9'));
const MFAWorkflowLibraryFlowV9 = lazy(() => import('./flows/specialty/MFAWorkflowLibraryFlowV9'));
// OAuthROPCFlowV9 retired — /flows/oauth-ropc-v9 now redirects to /v2/flows/ropc
// PARFlowV9 retired — /flows/par-v9 now redirects to /v2/flows/par
const PingOnePARFlowV9 = lazy(() => import('./flows/specialty/PingOnePARFlowV9'));
const RARFlowV9 = lazy(() => import('./flows/specialty/RARFlowV9'));
const ResourcesAPIFlowV9 = lazy(() => import('./flows/specialty/ResourcesAPIFlowV9'));
const SAMLBearerAssertionFlowV9 = lazy(() => import('./flows/specialty/SAMLBearerAssertionFlowV9'));
// TokenExchangeFlowV9 retired — /flows/token-exchange-v9 now redirects to /v2/flows/token-exchange
// import InteractiveTutorials from './pages/InteractiveTutorials'; // Removed - unused tutorial feature
const JWKSTroubleshooting = lazy(() => import('./pages/JWKSTroubleshooting'));
const ResponseModesLearnPage = lazy(() => import('./pages/learn/ResponseModesLearnPage'));
const OAuth21InformationalFlowV9 = lazy(
	() => import('./flows/specialty/OAuth21InformationalFlowV9')
);
const OAuthOIDCTraining = lazy(() => import('./pages/OAuthOIDCTraining'));
const OIDC = lazy(() => import('./pages/OIDC'));
const OIDCSessionManagement = lazy(() => import('./pages/OIDCSessionManagement'));
const OrganizationLicensing = lazy(() => import('./pages/OrganizationLicensing'));
const P1MFASamples = lazy(() =>
	import('./pages/P1MFASamples').then((m) => ({ default: m.P1MFASamples }))
);
const PARvsRAR = lazy(() => import('./pages/PARvsRAR'));
const PingAIResources = lazy(() => import('./pages/PingAIResourcesV9'));
const PingOneAuthentication = lazy(() => import('./pages/PingOneAuthentication'));
const PingOneAuthenticationCallback = lazy(() => import('./pages/PingOneAuthenticationCallback'));
const PingOneAuthenticationResult = lazy(() => import('./pages/PingOneAuthenticationResult'));
const PingOneDashboard = lazy(() => import('./pages/PingOneDashboard'));
const PingOneMockFeatures = lazy(() => import('./pages/PingOneMockFeatures'));
const PingOneScopesReference = lazy(() => import('./pages/PingOneScopesReference'));
const PingOneSessionsAPIFlowV9 = lazy(() => import('./flows/specialty/PingOneSessionsAPIFlowV9'));
const PingOneUserProfile = lazy(() => import('./pages/PingOneUserProfile'));
const PingOneWebhookViewer = lazy(() => import('./pages/PingOneWebhookViewer'));
const PostmanCollectionGenerator = lazy(() =>
	import('./pages/PostmanCollectionGenerator').then((m) => ({
		default: m.PostmanCollectionGenerator,
	}))
);
const SDKSampleApp = lazy(() => import('./pages/SDKSampleApp'));
const ServiceTestRunner = lazy(() => import('./pages/ServiceTestRunner'));
const JWTExamples = lazy(() => import('./pages/sdk-examples/JWTExamples'));
const OIDCExamples = lazy(() => import('./pages/sdk-examples/OIDCExamples'));
const SDKDocumentation = lazy(() => import('./pages/sdk-examples/SDKDocumentation'));
const SDKExamplesHome = lazy(() => import('./pages/sdk-examples/SDKExamplesHome'));
const HelioMartPasswordReset = lazy(() => import('./pages/security/HelioMartPasswordReset'));
const TestDemo = lazy(() => import('./pages/TestDemo'));
const UltimateTokenDisplayDemo = lazy(() => import('./pages/UltimateTokenDisplayDemo'));
const URLDecoder = lazy(() => import('./pages/URLDecoder'));
const FIDO2SampleApp = lazy(() =>
	import('./samples/p1mfa/fido2/FIDO2SampleApp').then((m) => ({ default: m.FIDO2SampleApp }))
);
const IntegratedMFASample = lazy(() =>
	import('./samples/p1mfa/IntegratedMFASample').then((m) => ({ default: m.IntegratedMFASample }))
);
const SMSSampleApp = lazy(() =>
	import('./samples/p1mfa/sms/SMSSampleApp').then((m) => ({ default: m.SMSSampleApp }))
);
// CIBAFlow — /flows/ciba-v8 redirects to /v8u/unified
const EmailMFASignOnFlow = lazy(() =>
	import('./mfa/flows/EmailMFASignOnFlow').then((m) => ({ default: m.EmailMFASignOnFlow }))
);
// ImplicitFlow archived — /flows/implicit-v8 now redirects to /flows/implicit-v9
const MFAConfigurationPage = lazy(() =>
	import('./mfa/flows/MFAConfigurationPage').then((m) => ({ default: m.MFAConfigurationPage }))
);
const MFADeviceManagementFlow = lazy(() => import('./mfa/flows/MFADeviceManagementFlow'));
const MFADeviceOrderingFlow = lazy(() =>
	import('./mfa/flows/MFADeviceOrderingFlow').then((m) => ({ default: m.MFADeviceOrderingFlow }))
);
const MFARouterFlow = lazy(() =>
	import('./mfa/flows/MFARouterFlow').then((m) => ({ default: m.MFARouterFlow }))
);
const MFAReportingFlow = lazy(() => import('./mfa/flows/MFAReportingFlow'));
// OIDCHybridFlow archived — /flows/hybrid-v8 now redirects to /flows/oidc-hybrid-v9
const PingOneProtectFlow = lazy(() => import('./mfa/flows/PingOneProtectFlow'));
const FIDO2ConfigurationPage = lazy(() =>
	import('./mfa/flows/types/FIDO2ConfigurationPage').then((m) => ({
		default: m.FIDO2ConfigurationPage,
	}))
);
const MobileOTPConfigurationPage = lazy(() =>
	import('./mfa/flows/types/MobileOTPConfigurationPage').then((m) => ({
		default: m.MobileOTPConfigurationPage,
	}))
);
const TokenMonitoringPage = lazy(() =>
	import('./lab/pages/TokenMonitoringPage').then((m) => ({ default: m.TokenMonitoringPage }))
);

// Lazy load unified MFA flow for code splitting
const UnifiedMFARegistrationFlow = React.lazy(() =>
	import('./mfa/flows/unified/UnifiedMFARegistrationFlow').then((module) => ({
		default: module.UnifiedMFARegistrationFlow,
	}))
);

// OAuth Authz V2 — new redesigned UI
const OAuthAuthzV2 = lazy(() => import('./lab/components/OAuthAuthzV2/OAuthAuthzV2'));
const AuthCodeFlowV2 = lazy(() => import('./lab/components/AuthCodeFlowV2/AuthCodeFlowV2'));
const FIDO2Flow = React.lazy(() =>
	import('./mfa/flows/types/FIDO2Flow').then((module) => ({ default: module.FIDO2Flow }))
);
const MobileFlow = React.lazy(() =>
	import('./mfa/flows/types/MobileFlow').then((module) => ({ default: module.MobileFlow }))
);

import { FloatingStepperProvider } from './contexts/FloatingStepperContext';

const EnvironmentManagementPageV8 = lazy(() => import('./pages/EnvironmentManagementPageV8'));
// Import Protect Portal
const ProtectPortalWrapper = lazy(() => import('./pages/protect-portal/ProtectPortalWrapper'));

// CreateCompanyPage - ARCHIVED
const DavinciTodoApp = lazy(() => import('./sdk-examples/davinci-todo-app/DavinciTodoApp'));
// Debug popouts — only loaded in the dedicated popout window route
const DebugLogViewerPopoutV9 = lazy(() =>
	import('./pages/v9/DebugLogViewerPopoutV9').then((m) => ({ default: m.DebugLogViewerPopoutV9 }))
);
const DebugLogViewerPopout = lazy(() =>
	import('./mfa/pages/DebugLogViewerPopoutTest').then((m) => ({
		default: m.DebugLogViewerPopoutTest,
	}))
);

import { logger } from './utils/logger';

const DebugLogViewer = lazy(() => import('./mfa/pages/DebugLogViewer'));
const DeleteAllDevicesUtility = lazy(() => import('./mfa/pages/DeleteAllDevicesUtility'));
const DeviceAuthenticationDetails = lazy(
	() => import('./mfa/pages/DeviceAuthenticationDetails')
);
const FIDO2RegistrationDocsPage = lazy(() =>
	import('./mfa/pages/FIDO2RegistrationDocsPage').then((m) => ({
		default: m.FIDO2RegistrationDocsPage,
	}))
);
const MFADeviceCreateDemo = lazy(() => import('./mfa/pages/MFADeviceCreateDemo'));
const MobileRegistrationDocsPage = lazy(() =>
	import('./mfa/pages/MobileRegistrationDocsPage').then((m) => ({
		default: m.MobileRegistrationDocsPage,
	}))
);
const UnifiedCredentialsMockup = lazy(() => import('./mfa/pages/UnifiedCredentialsMockup'));

// V8MTokenExchange archived — token-exchange-v7 route now redirects to v9
import CallbackHandlerV8U from './lab/components/CallbackHandlerV8U';
import UnifiedFlowErrorBoundary from './lab/components/UnifiedFlowErrorBoundary';

// Lazy load heavy V8U components for better performance
const UnifiedFlowHelperPageV8U = lazy(() => import('./lab/components/UnifiedFlowHelperPageV8U'));
const SpiffeSpireFlowV8U = lazy(() => import('./lab/flows/SpiffeSpireFlowV8U'));
const UnifiedOAuthFlowV8U = lazy(() => import('./lab/flows/UnifiedOAuthFlowV8U'));
const SpiffeSpireTokenDisplayV8U = lazy(() => import('./lab/pages/SpiffeSpireTokenDisplayV8U'));
const EnhancedStateManagementPage = lazy(() => import('./lab/pages/EnhancedStateManagementPage'));
const TokenApiDocumentationPage = lazy(() => import('./lab/pages/TokenApiDocumentationPage'));
const FlowComparisonPage = lazy(() => import('./lab/pages/FlowComparisonPage'));

// Import test pages
const ImplicitFlowTest = lazy(() => import('./pages/test/ImplicitFlowTest'));
const AllFlowsApiTest = lazy(() => import('./pages/test/AllFlowsApiTest'));
const MFAFlowsApiTest = lazy(() => import('./pages/test/MFAFlowsApiTest'));
const PARTest = lazy(() => import('./pages/test/PARTest'));
const TestCallback = lazy(() => import('./pages/test/TestCallback'));
const TokenStatusPageV8U = lazy(() => import('./lab/pages/TokenStatusPageV8U'));
const ApiStatusPage = lazy(() => import('./pages/ApiStatusPage'));

// V7M mock flows retired — all routes below redirect to /v2/flows/*
// V7MOAuthAuthCodeV9 retired — /flows/oauth-authorization-code-v9 and /flows/oidc-authorization-code-v9
// V7MDeviceAuthorizationV9 retired — /flows/device-authorization-v9
// DeviceAuthorizationVerifyPage retired — /flows/device-authorization-v9/verify
// V7MImplicitFlowV9 retired — /flows/implicit-v9 and /flows/oidc-implicit-v9
// V7MROPCV9 retired — /v7/oauth/ropc and /v7/oidc/ropc
// V7MOIDCHybridFlowV9 retired — /flows/oidc-hybrid-v9
const MockServerSettingsPage = lazy(() => import('./pages/MockServerSettingsPage'));
const V7MCIBAFlowV9 = lazy(() => import('./flows/specialty/V7MCIBAFlowV9'));
const MockMcpAgentFlowPage = lazy(() => import('./pages/flows/MockMcpAgentFlowPage'));

const AppContainer = styled.div`
	display: flex;
	height: 100vh;
	min-height: 100vh;
	overflow: hidden;
	background-color: ${({ theme }) => theme.colors.appBg};
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
	padding-top: calc(64px + 1.5rem); /* Account for fixed navbar (64px) + normal top padding */
	max-width: 100%; /* Use full content column width; no extra margin so area next to sidebar scrolls */
	width: 100%;
	background-color: ${({ theme }) => theme.colors.appBg};
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
	// Ref so the effect closure always reads the current width without needing to re-register
	const sidebarWidthRef = React.useRef(sidebarWidth);
	sidebarWidthRef.current = sidebarWidth;

	// Listen for sidebar width changes — event-driven (no polling intervals)
	useEffect(() => {
		const handleWidthChange = () => {
			try {
				const saved = localStorage.getItem('sidebar.width');
				const parsed = saved ? parseInt(saved, 10) : NaN;
				if (USE_PING_MENU) {
					if (
						Number.isFinite(parsed) &&
						parsed >= SIDEBAR_PING_MIN_WIDTH &&
						parsed <= SIDEBAR_PING_MAX_WIDTH
					) {
						if (parsed !== sidebarWidthRef.current) setSidebarWidth(parsed);
					}
					return;
				}
				if (Number.isFinite(parsed) && parsed >= 300 && parsed <= 600) {
					if (parsed !== sidebarWidthRef.current) setSidebarWidth(parsed);
				}
			} catch {}
		};

		// Read initial value on mount
		handleWidthChange();

		// Cross-tab storage changes
		window.addEventListener('storage', handleWidthChange);
		// Same-tab changes dispatched by Sidebar component
		window.addEventListener('sidebar-width-changed', handleWidthChange);

		return () => {
			window.removeEventListener('storage', handleWidthChange);
			window.removeEventListener('sidebar-width-changed', handleWidthChange);
		};
	}, []); // empty deps — sidebarWidthRef.current is always up to date

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
			logger.info(' [GlobalScroll] Skipping auto-scroll for:', location.pathname);
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
				<Suspense fallback={<LoadingFallback message="Loading..." />}>
					<Routes>
						<Route path="/v8/debug-logs-popout" element={<DebugLogViewerPopout />} />
						<Route path="/v9/debug-logs-popout" element={<DebugLogViewerPopoutV9 />} />
						<Route path="*" element={<Navigate to="/v9/debug-logs-popout" replace />} />
					</Routes>
				</Suspense>
			) : isWebhookPopout ? (
				// Webhook popout window only - render without sidebar layout
				<Routes>
					<Route path="/pingone-webhook-viewer-popout" element={<PingOneWebhookViewer />} />
					<Route path="*" element={<Navigate to="/pingone-webhook-viewer-popout" replace />} />
				</Routes>
			) : isAIAssistantPopoutRoute ? (
				// AI Assistant popout - moveable outside host, communicates via postMessage
				<Suspense fallback={<LoadingFallback message="Loading AI Assistant..." />}>
					<Routes>
						<Route path="/ai-assistant-popout" element={<AIAssistantPopoutPage />} />
						<Route path="*" element={<Navigate to="/ai-assistant-popout" replace />} />
					</Routes>
				</Suspense>
			) : (
				// Main app - render with full layout
				<AppContainer>
					<Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
					<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
					<ContentColumn data-content-column>
						<MainContent $sidebarWidth={sidebarWidth}>
							{/* Global Suspense catches all lazy-loaded route components */}
							<Suspense fallback={<LoadingFallback message="Loading..." />}>
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
									<Route path="/flows" element={<OAuthFlowsNew />}>
										<Route
											path="compare"
											element={
												<Suspense
													fallback={<LoadingFallback message="Loading Flow Comparison..." />}
												>
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
									<Route
										path="/ultimate-token-display-demo"
										element={<UltimateTokenDisplayDemo />}
									/>
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
									<Route path="/flows/mfa-v8" element={<MFARouterFlow />} />
									<Route
										path="/mfa"
										element={
											<React.Suspense fallback={<div>Loading...</div>}>
												<UnifiedMFARegistrationFlow registrationFlowType="admin" />
											</React.Suspense>
										}
									/>
									<Route path="/v8/unified-mfa" element={<Navigate to="/mfa" replace />} />
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
												{/* <UnifiedMFARegistrationFlow deviceType="TOTP" /> */}
											</React.Suspense>
										}
									/>
									<Route path="/v8/mfa/register/fido2" element={<FIDO2ConfigurationPage />} />
									<Route
										path="/v8/mfa/register/fido2/device"
										element={
											<React.Suspense fallback={<div>Loading...</div>}>
												<FIDO2Flow />
											</React.Suspense>
										}
									/>
									<Route
										path="/v8/mfa/register/fido2/docs"
										element={<FIDO2RegistrationDocsPage />}
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
									<Route
										path="/v8/mfa/register/mobile"
										element={<MobileOTPConfigurationPage />}
									/>
									<Route
										path="/v8/mfa/register/mobile/device"
										element={
											<React.Suspense fallback={<div>Loading...</div>}>
												<MobileFlow />
											</React.Suspense>
										}
									/>
									<Route
										path="/v8/mfa/register/mobile/docs"
										element={<MobileRegistrationDocsPage />}
									/>
									<Route
										path="/v8/mfa/configure/fido2"
										element={<Navigate to="/v8/mfa/register/fido2" replace />}
									/>
									<Route path="/v8/mfa-config" element={<MFAConfigurationPage />} />
									<Route path="/v8/mfa-device-management" element={<MFADeviceManagementFlow />} />
									<Route path="/v8/mfa-device-ordering" element={<MFADeviceOrderingFlow />} />
									<Route path="/v8/mfa-reporting" element={<MFAReportingFlow />} />
									<Route
										path="/v8/mfa/device-authentication-details"
										element={<DeviceAuthenticationDetails />}
									/>
									<Route path="/v8/mfa/create-device" element={<MFADeviceCreateDemo />} />
									<Route path="/v8/email-mfa-signon" element={<EmailMFASignOnFlow />} />
									<Route path="/v9/resources-api" element={<ResourcesAPIFlowV9 />} />
									<Route path="/v8/protect" element={<PingOneProtectFlow />} />
									<Route
										path="/flows/oauth-authorization-code-v7-condensed-mock"
										element={<Navigate to="/v8u/unified" replace />}
									/>
									<Route
										path="/flows/mock-oidc-ropc"
										element={<Navigate to="/flows/ropc" replace />}
									/>
									{/* Legacy paths: redirect to flows2 */}
									<Route
										path="/v7/oauth/authorization-code"
										element={<Navigate to="/flows/authorization-code" replace />}
									/>
									<Route
										path="/v7/oidc/authorization-code"
										element={<Navigate to="/flows/authorization-code" replace />}
									/>
									{/* Legacy path: redirect to flows2 */}
									<Route
										path="/v7/oauth/device-authorization"
										element={<Navigate to="/flows/device-authorization" replace />}
									/>
									<Route
										path="/v7/oauth/client-credentials"
										element={<Navigate to="/flows/client-credentials-v9" replace />}
									/>
									<Route
										path="/v7/oauth/implicit"
										element={<Navigate to="/flows/implicit-hybrid" replace />}
									/>
									<Route
										path="/v7/oidc/implicit"
										element={<Navigate to="/flows/implicit-hybrid" replace />}
									/>
									<Route
										path="/v7/oauth/ropc"
										element={<Navigate to="/flows/ropc" replace />}
									/>
									<Route
										path="/v7/oidc/ropc"
										element={<Navigate to="/flows/ropc" replace />}
									/>
									<Route
										path="/v7/settings"
										element={
											<Suspense fallback={<div>Loading...</div>}>
												<MockServerSettingsPage />
											</Suspense>
										}
									/>
									<Route
										path="/v7/oidc/hybrid"
										element={<Navigate to="/flows/implicit-hybrid" replace />}
									/>
									<Route path="/v7/oidc/ciba" element={<Navigate to="/flows/ciba-v9" replace />} />
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
									<Route
										path="/flows/implicit-v7"
										element={<Navigate to="/v8u/unified" replace />}
									/>
									<Route
										path="/flows/implicit-v8"
										element={<Navigate to="/v8u/unified" replace />}
									/>
									<Route
										path="/flows/implicit-v9"
										element={<Navigate to="/flows/implicit-hybrid" replace />}
									/>
									<Route
										path="/flows/oidc-implicit-v9"
										element={<Navigate to="/flows/implicit-hybrid" replace />}
									/>
									{/* V8 Unified UI Mockup */}
									<Route
										path="/v8/unified-credentials-mockup"
										element={<UnifiedCredentialsMockup />}
									/>
									{/* V8U Unified Flow - Single UI for all flows with real PingOne APIs */}
									<Route
										path="/lab/oauth-authz/:step?"
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
													<OAuthAuthzV2 />
												</UnifiedFlowErrorBoundary>
											</Suspense>
										}
									/>
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
													<OAuthAuthzV2 />
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
										path="/lab/token-monitoring"
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
									<Route path="/v8u/token-monitoring" element={<Navigate to="/lab/token-monitoring" replace />} />
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
										path="/lab/flow-comparison"
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
									<Route path="/v8u/flow-comparison" element={<Navigate to="/lab/flow-comparison" replace />} />
									{/* V8 Utilities */}
									<Route path="/v8/delete-all-devices" element={<DeleteAllDevicesUtility />} />
									<Route path="/v8/debug-logs" element={<DebugLogViewer />} />
									<Route path="/v8/debug-logs-popout" element={<DebugLogViewerPopout />} />
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
										element={<Navigate to="/flows/implicit-hybrid" replace />}
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
									{/* Legacy introspection pages consolidated into the flows2 /v2 flow */}
									<Route
										path="/flows/token-introspection-v1"
										element={<Navigate to="/flows/token-introspection" replace />}
									/>
									{/* Device Authorization — v9 mock flow (canonical); v7 → unified */}
									<Route
										path="/flows/device-authorization-v7"
										element={<Navigate to="/v8u/unified" replace />}
									/>
									<Route
										path="/flows/device-authorization-v9"
										element={<Navigate to="/flows/device-authorization" replace />}
									/>
									<Route
										path="/flows/device-authorization-v9/verify"
										element={<Navigate to="/flows/device-authorization" replace />}
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
									{/* Token Exchange — retired, redirect to flows2 */}
									<Route path="/flows/token-exchange-v9" element={<Navigate to="/flows/token-exchange" replace />} />
									{/* Token Exchange v7 legacy redirect */}
									<Route
										path="/flows/token-exchange-v7"
										element={<Navigate to="/flows/token-exchange" replace />}
									/>
									{/* Legacy V6 routes - redirect to V7 (latest version) */}
									<Route
										path="/flows/jwt-bearer-token-v6"
										element={<Navigate to="/flows/jwt-bearer-token-v9" replace />}
									/>
									{/* V7 SAML Bearer Assertion Flow */}
									<Route
										path="/flows/saml-bearer-assertion-v7"
										element={<Navigate to="/flows/saml-bearer" replace />}
									/>
									{/* V9 SAML Bearer Assertion Flow */}
									<Route
										path="/flows/saml-bearer-assertion-v9"
										element={<Navigate to="/flows/saml-bearer" replace />}
									/>
									<Route
										path="/flows/v9/saml-sp-dynamic-acs"
										element={<SAMLServiceProviderFlowV9 />}
									/>
									{/* Legacy V6 route - redirect to V9 (v7 redirect already defined above) */}
									<Route
										path="/flows/saml-bearer-assertion-v6"
										element={<Navigate to="/flows/saml-bearer" replace />}
									/>
									{/* V7 Worker Token Flow — redirect to V9 */}
									<Route
										path="/flows/worker-token-v7"
										element={<Navigate to="/flows/worker-token-v9" replace />}
									/>
									{/* V9 Worker Token Flow */}
									<Route path="/flows/worker-token" element={<Navigate to="/flows/client-credentials" replace />} />
									<Route path="/flows/worker-token-v9" element={<Navigate to="/flows/worker-token" replace />} />
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
									{/* Legacy mock client-credentials flows consolidated into flows2 */}
									<Route
										path="/flows/client-credentials-v9"
										element={<Navigate to="/flows/client-credentials" replace />}
									/>
									<Route
										path="/flows/client-credentials-standardized"
										element={<Navigate to="/flows/client-credentials" replace />}
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
										element={<Navigate to="/flows/implicit-hybrid" replace />}
									/>
									{/* Authorization Code — redirect to flows2 */}
									<Route
										path="/flows/oauth-authorization-code-v9"
										element={<Navigate to="/flows/authorization-code" replace />}
									/>
									<Route
										path="/flows/oauth-authorization-code-v9-condensed"
										element={<Navigate to="/flows/authorization-code" replace />}
									/>
									<Route
										path="/flows/oidc-authorization-code-v9"
										element={<Navigate to="/flows/authorization-code" replace />}
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
									{/* Redirectless — retired, redirect to flows2 */}
									<Route path="/flows/redirectless-v9-real" element={<Navigate to="/flows/redirectless" replace />} />
									{/* Legacy V6 routes - redirect to flows2 */}
									<Route
										path="/flows/redirectless-v6"
										element={<Navigate to="/flows/redirectless" replace />}
									/>
									<Route
										path="/flows/redirectless-v6-real"
										element={<Navigate to="/flows/redirectless" replace />}
									/>
									<Route
										path="/flows/redirectless-v7-real"
										element={<Navigate to="/flows/redirectless" replace />}
									/>
									<Route
										path="/flows/par"
										element={<Navigate to="/flows/pingone-par-v9" replace />}
									/>
									<Route path="/flows-old/jwt-bearer" element={<JWTBearerFlow />} />
									{/* Unsupported by PingOne flows */}
									<Route
										path="/oauth/resource-owner-password"
										element={<Navigate to="/flows/ropc" replace />}
									/>
									<Route
										path="/oidc/resource-owner-password"
										element={<Navigate to="/flows/ropc" replace />}
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
									<Route
										path="/flows/kroger-grocery-store-mfa"
										element={<KrogerGroceryStoreMFA />}
									/>
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
									{/* PAR — retired, redirect to flows2 */}
									<Route path="/flows/par-v9" element={<Navigate to="/flows/par" replace />} />
									{/* DPoP Flow — retired, redirect to flows2 */}
									<Route path="/flows/dpop" element={<Navigate to="/flows/dpop" replace />} />
									{/* Mock MCP Agent Flow (educational) */}
									<Route path="/flows/mock-mcp-agent-flow" element={<MockMcpAgentFlowPage />} />
									{/* Legacy V6 routes - redirect to V7 equivalents for backward compatibility */}
									<Route path="/flows/rar-v6" element={<Navigate to="/flows/rar-v9" replace />} />
									<Route
										path="/flows/oauth2-resource-owner-password"
										element={<Navigate to="/flows/ropc" replace />}
									/>
									<Route
										path="/flows/oauth-ropc-v7"
										element={<Navigate to="/flows/ropc" replace />}
									/>
									{/* ROPC — retired, redirect to flows2 */}
									<Route path="/flows/oauth-ropc-v9" element={<Navigate to="/flows/ropc" replace />} />
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
										<Route path="userinfo" element={<Navigate to="/flows/userinfo" replace />} />
										<Route path="id-tokens" element={<IDTokensFlow />} />
										<Route
											path="resource-owner-password"
											element={<Navigate to="/flows/ropc" replace />}
										/>
										<Route path="jwt-bearer" element={<JWTBearerFlow />} />
									</Route>
									{/* Backward-compatible redirect for older links */}
									<Route path="/oidc/tokens" element={<Navigate to="/oidc/id-tokens" replace />} />
									<Route path="/client-generator" element={<ClientGenerator />} />{' '}
									<Route path="/application-generator" element={<ApplicationGenerator />} />
									<Route path="/code-editor-demo" element={<CodeEditorDemo />} />
									<Route path="/oauth-code-generator-hub" element={<OAuthCodeGeneratorHub />} />
									<Route path="/oauth-playground-hub" element={<OAuthPlaygroundHub />} />
									<Route path="/configuration" element={<Configuration />} />
									<Route path="/design" element={<DesignSystemPage />} />
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
									{/* flows2 — canonical /flows/* ; legacy /v2/flows/* redirects */}
									<Route path="/flows/client-credentials" element={<FlowsClientCredentials />} />
									<Route path="/v2/flows/client-credentials" element={<Navigate to="/flows/client-credentials" replace />} />
									<Route path="/use-cases" element={<FlowsUseCases />} />
									<Route path="/v2/use-cases" element={<Navigate to="/use-cases" replace />} />
									<Route path="/flows/authorization-code" element={<FlowsAuthorizationCode />} />
									<Route path="/v2/flows/authorization-code" element={<Navigate to="/flows/authorization-code" replace />} />
									<Route path="/flows/authorization-code-educational" element={<FlowsAuthorizationCodeEducational />} />
									<Route path="/v2/flows/authorization-code-educational" element={<Navigate to="/flows/authorization-code-educational" replace />} />
									<Route path="/flows/authz-callback" element={<FlowsAuthCallback />} />
									<Route path="/v2/flows/authz-callback" element={<Navigate to="/flows/authz-callback" replace />} />
									<Route path="/flows/device-authorization" element={<FlowsDeviceAuthorization />} />
									<Route path="/v2/flows/device-authorization" element={<Navigate to="/flows/device-authorization" replace />} />
									<Route path="/flows/token-exchange" element={<FlowsTokenExchange />} />
									<Route path="/v2/flows/token-exchange" element={<Navigate to="/flows/token-exchange" replace />} />
									<Route path="/flows/token-introspection" element={<FlowsTokenIntrospection />} />
									<Route path="/v2/flows/token-introspection" element={<Navigate to="/flows/token-introspection" replace />} />
									<Route path="/flows/userinfo" element={<FlowsUserInfo />} />
									<Route path="/v2/flows/userinfo" element={<Navigate to="/flows/userinfo" replace />} />
									<Route path="/flows/token-revocation" element={<FlowsTokenRevocation />} />
									<Route path="/v2/flows/token-revocation" element={<Navigate to="/flows/token-revocation" replace />} />
									<Route path="/flows/par" element={<FlowsPar />} />
									<Route path="/v2/flows/par" element={<Navigate to="/flows/par" replace />} />
									<Route path="/flows/refresh-token" element={<FlowsRefreshToken />} />
									<Route path="/v2/flows/refresh-token" element={<Navigate to="/flows/refresh-token" replace />} />
									<Route path="/flows/oidc-discovery" element={<FlowsOidcDiscovery />} />
									<Route path="/v2/flows/oidc-discovery" element={<Navigate to="/flows/oidc-discovery" replace />} />
									<Route path="/flows/dpop" element={<FlowsDpop />} />
									<Route path="/v2/flows/dpop" element={<Navigate to="/flows/dpop" replace />} />
									<Route path="/flows/redirectless" element={<FlowsRedirectless />} />
									<Route path="/v2/flows/redirectless" element={<Navigate to="/flows/redirectless" replace />} />
									<Route path="/flows/implicit-hybrid" element={<FlowsImplicitHybrid />} />
									<Route path="/v2/flows/implicit-hybrid" element={<Navigate to="/flows/implicit-hybrid" replace />} />
									<Route path="/flows/implicit-hybrid-callback" element={<FlowsImplicitHybridCallback />} />
									<Route path="/v2/flows/implicit-hybrid-callback" element={<Navigate to="/flows/implicit-hybrid-callback" replace />} />
									<Route path="/flows/hybrid" element={<FlowsHybrid />} />
									<Route path="/v2/flows/hybrid" element={<Navigate to="/flows/hybrid" replace />} />
									<Route path="/flows/ropc" element={<FlowsRopc />} />
									<Route path="/v2/flows/ropc" element={<Navigate to="/flows/ropc" replace />} />
									<Route path="/flows/saml-bearer" element={<FlowsSAMLBearerAssertion />} />
									<Route path="/v2/flows/saml-bearer" element={<Navigate to="/flows/saml-bearer" replace />} />
									<Route
										path="/postman-collection-generator"
										element={<PostmanCollectionGenerator />}
									/>
									<Route path="/samples/p1mfa" element={<P1MFASamples />} />
									<Route path="/samples/p1mfa/integrated" element={<IntegratedMFASample />} />
									<Route path="/samples/p1mfa/fido2" element={<FIDO2SampleApp />} />
									<Route path="/samples/p1mfa/sms" element={<SMSSampleApp />} />
									<Route path="/oauth-2-1" element={<OAuth21InformationalFlowV9 />} />
									<Route path="/oidc-session-management" element={<OIDCSessionManagement />} />
									<Route path="/pingone-scopes-reference" element={<PingOneScopesReference />} />
									<Route path="/pingone-sessions-api" element={<PingOneSessionsAPIFlowV9 />} />
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
											<Suspense
												fallback={<LoadingFallback message="Loading AI Agent Overview..." />}
											>
												<AIAgentOverview />
											</Suspense>
										}
									/>
									<Route path="/ai-assistant" element={<AIAssistantPage />} />
									<Route
										path="/mcp-server"
										element={
											<Suspense
												fallback={<LoadingFallback message="Loading MCP Server Config..." />}
											>
												<McpServerConfigFlowV9 />
											</Suspense>
										}
									/>
									<Route
										path="/mcp-tool-discovery"
										element={
											<Suspense
												fallback={<LoadingFallback message="Loading MCP Tool Discovery..." />}
											>
												<McpToolDiscovery />
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
							</Suspense>
						</MainContent>
					</ContentColumn>
				</AppContainer>
			)}

			{/* Only mount when needed — lazy chunk loads on first open */}
			{showCredentialModal && (
				<Suspense fallback={null}>
					<CredentialSetupModal
						isOpen={showCredentialModal}
						onClose={handleCredentialSetupComplete}
						onSave={(creds) => {
							logger.info(' [App] Credentials saved from startup modal:', creds);
							// The modal will auto-close after save
						}}
						flowType="startup"
					/>
				</Suspense>
			)}

			<AuthorizationRequestModal
				isOpen={showAuthModal}
				onClose={closeAuthModal}
				onProceed={proceedWithOAuth}
				authorizationUrl={authRequestData?.authorizationUrl || ''}
				requestParams={authRequestData?.requestParams || {}}
			/>

			{/* Global Confirmation and Prompt Modals - Replace system modals */}
			<ConfirmationModal />
			<PromptModal />
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
			appBg: string;
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
			import('./lab/tests/tokenExchangeFlowTest').then(({ default: TokenExchangeFlowTest }) => {
				window.TokenExchangeFlowTest = TokenExchangeFlowTest;
				window.runTokenExchangeTests = () => {
					const test = new TokenExchangeFlowTest();
					test.runAllTests();
					return test.getResults();
				};
			});

			// Import and initialize integration tests
			import('./lab/tests/tokenExchangeIntegrationTest').then(
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

	// Auto-open modal when worker token is needed (error handler will dispatch this)
	useEffect(() => {
		const handleWorkerTokenNeeded = () => {
			window.dispatchEvent(new CustomEvent('open-worker-token-modal', { detail: { source: 'error-handler' } }));
		};

		window.addEventListener('worker-token-needed', handleWorkerTokenNeeded as EventListener);
		return () => window.removeEventListener('worker-token-needed', handleWorkerTokenNeeded as EventListener);
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
														<ModernMessagingProvider>
															<AppRoutes />
														</ModernMessagingProvider>
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

				{/* Global Worker Token Modal — uses new credential form */}
				{showWorkerTokenModal && (
					<WorkerTokenCredentialModal
						isOpen={showWorkerTokenModal}
						onClose={() => setShowWorkerTokenModal(false)}
						onTokenAcquired={() => setShowWorkerTokenModal(false)}
					/>
				)}

				{/* Global Backend Connectivity Modal */}
				<BackendDownModal />

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
						
					</button>
				)}

				{/* Floating Debug Log Viewer — lazy, only mounts when first opened */}
				{isFloatingDebugLogViewerOpen && (
					<Suspense fallback={null}>
						<EnhancedFloatingLogViewer
							isOpen={isFloatingDebugLogViewerOpen}
							onClose={() => setIsFloatingDebugLogViewerOpen(false)}
						/>
					</Suspense>
				)}

				{/* MasterFlow Agent - floating chat on all pages; not on /ai-assistant (page has its own) */}
				{/* Lazy: defers mcpQueryService and all AI code until after first paint */}
				<Suspense fallback={null}>{!isAIAssistantPageRoute && <AIAssistant />}</Suspense>
			</ExternalScriptErrorBoundary>
		</ThemeProvider>
	);
}

export default App;
