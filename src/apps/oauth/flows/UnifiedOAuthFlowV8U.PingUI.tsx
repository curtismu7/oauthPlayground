/**
 * @file UnifiedOAuthFlowV8U.PingUI.tsx
 * @module apps/oauth/flows
 * @description Ping UI migration of Unified OAuth/OIDC Flow - Single UI for all flows using real PingOne APIs - OAUTH FLOW
 * @version 8.0.0-PingUI
 *
 * Ping UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { EducationModeToggle } from '@/components/education/EducationModeToggle';
import { MasterEducationSection } from '@/components/education/MasterEducationSection';
import { StandardizedCredentialExportImport } from '@/components/StandardizedCredentialExportImport';
import { WorkerTokenButton } from '@/components/WorkerTokenButton';
import {
	downloadPostmanCollectionWithEnvironment,
	generateComprehensiveUnifiedPostmanCollection,
} from '@/services/postmanCollectionGeneratorV8';
import { ShowTokenConfigCheckboxV8 } from '@/v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '@/v8/components/SilentApiConfigCheckboxV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import {
	PageHeaderGradients,
	PageHeaderTextColors,
	PageHeaderV8,
} from '@/v8/components/shared/PageHeaderV8';
import WorkerTokenStatusDisplayV8 from '@/v8/components/WorkerTokenStatusDisplayV8';
import { SharedCredentialsServiceV8 } from '@/v8/services/sharedCredentialsServiceV8';
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '@/v8/services/specVersionServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { AdvancedOAuthFeatures } from '@/apps/unified/components/AdvancedOAuthFeatures';
import CredentialsFormV8U from '@/v8u/components/CredentialsFormV8U';
import { FlowGuidanceSystem } from '@/apps/flows/components/FlowGuidanceSystem';
import { MobileResponsiveWrapper } from '@/apps/unified/components/MobileResponsiveWrapper';
import { SecurityScorecard } from '@/v8u/components/SecurityScorecard';
import { UnifiedFlowSteps } from '@/v8u/components/UnifiedFlowSteps';
import { UnifiedNavigationV8U } from '@/v8u/components/UnifiedNavigationV8U';
import { FlowSettingsServiceV8U } from '@/v8u/services/flowSettingsServiceV8U';
import { UnifiedFlowIntegrationServiceV8U } from '@/v8u/services/unifiedFlowIntegrationV8U';
import {
	type SharedOAuthCredentials,
	type UnifiedOAuthCredentials,
	UnifiedOAuthCredentialsServiceV8U,
} from '../services/unifiedOAuthCredentialsServiceV8U';

const _MODULE_TAG = '[🎯 UNIFIED-OAUTH-FLOW-V8U-PINGUI]';

// PING UI MIGRATION: MDI Icon Mapping for React Icons → MDI CSS
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		FiBook: 'mdi-book',
		FiChevronDown: 'mdi-chevron-down',
		FiPackage: 'mdi-package',
	};
	return iconMap[fiIcon] || 'mdi-help-circle';
};

// PING UI MIGRATION: MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		></i>
	);
};

/**
 * Safe analytics helper - prevents connection errors when analytics server is unavailable
 */
const safeLogAnalytics = async (
	location: string,
	message: string,
	data: Record<string, unknown> = {},
	sessionId: string = 'debug-session',
	runId: string = 'flow-debug',
	hypothesisId?: string
): Promise<void> => {
	try {
		const { log } = await import('@/v8/utils/analyticsHelperV8');
		await log(location, message, data, sessionId, runId, hypothesisId);
	} catch {
		// Silently fail - analytics not available
	}
};

/**
 * UnifiedOAuthFlowV8UPingUI - Main container component for unified OAuth/OIDC flows
 *
 * This component orchestrates all OAuth 2.0 and OpenID Connect flows in a single unified interface.
 * It manages:
 * - Flow type selection (Authorization Code, Implicit, Client Credentials, Device Code, Hybrid)
 * - Spec version selection (OAuth 2.0, OAuth 2.1 / OIDC 2.1, OIDC Core 1.0)
 * - Credential management and validation
 * - Real-time flow execution with PingOne APIs
 * - Educational content and guidance
 * - Security scoring and recommendations
 */
export const UnifiedOAuthFlowV8UPingUI: React.FC = () => {
	// Router hooks
	const location = useLocation();
	const navigate = useNavigate();
	const params = useParams();

	// Core state management
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	// Flow configuration state
	const [flowType, setFlowType] = useState<FlowType>('oauth-authz');
	const [specVersion, setSpecVersion] = useState<SpecVersion>('oauth2.0');
	const [showEducation, setShowEducation] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);

	// Credentials state
	const [credentials, setCredentials] = useState<UnifiedOAuthCredentials | null>(null);
	const [sharedCredentials, setSharedCredentials] = useState<SharedOAuthCredentials | null>(null);
	const [showTokenConfig] = useState(false);
	const [silentApiConfig] = useState(false);

	// Flow execution state
	const [flowResults, setFlowResults] = useState<Record<string, unknown> | null>(null);
	const [isFlowRunning, setIsFlowRunning] = useState(false);
	const [flowStep, setFlowStep] = useState(0);

	// UI state
	const [showSecurityScorecard, setShowSecurityScorecard] = useState(false);
	const [showFlowGuidance, setShowFlowGuidance] = useState(true);
	const [mobileResponsive, setMobileResponsive] = useState(false);

	// Refs for cleanup
	const abortControllerRef = useRef<AbortController | null>(null);
	const initializationRef = useRef(false);

	// PING UI MIGRATION: Initialize component with proper error handling
	useEffect(() => {
		if (initializationRef.current) return;
		initializationRef.current = true;

		const initializeComponent = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Load flow settings from URL params or defaults
				const flowTypeFromParams = params.flowType as FlowType;
				const specVersionFromParams = params.specVersion as SpecVersion;

				if (flowTypeFromParams && SpecVersionServiceV8.isValidFlowType(flowTypeFromParams)) {
					setFlowType(flowTypeFromParams);
				}

				if (
					specVersionFromParams &&
					SpecVersionServiceV8.isValidSpecVersion(specVersionFromParams)
				) {
					setSpecVersion(specVersionFromParams);
				}

				// Load saved credentials
				await loadSavedCredentials();

				// Load shared credentials if available
				await loadSharedCredentials();

				// Initialize flow settings
				await initializeFlowSettings();

				setIsInitialized(true);
			} catch (err) {
				console.error(`${_MODULE_TAG} Initialization failed:`, err);
				setError(err instanceof Error ? err.message : 'Failed to initialize flow');
			} finally {
				setIsLoading(false);
			}
		};

		initializeComponent();

		// Cleanup function
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [
		params.flowType,
		params.specVersion,
		initializeFlowSettings,
		loadSavedCredentials,
		loadSharedCredentials,
	]);

	// Load saved credentials
	const loadSavedCredentials = async () => {
		try {
			const savedCreds = await UnifiedOAuthCredentialsServiceV8U.loadCredentials();
			if (savedCreds) {
				setCredentials(savedCreds);
			}
		} catch (err) {
			console.warn(`${_MODULE_TAG} Failed to load saved credentials:`, err);
		}
	};

	// Load shared credentials
	const loadSharedCredentials = async () => {
		try {
			const sharedCreds = await SharedCredentialsServiceV8.loadSharedCredentials();
			if (sharedCreds) {
				setSharedCredentials(sharedCreds);
			}
		} catch (err) {
			console.warn(`${_MODULE_TAG} Failed to load shared credentials:`, err);
		}
	};

	// Initialize flow settings
	const initializeFlowSettings = async () => {
		try {
			const settings = await FlowSettingsServiceV8U.loadSettings();
			setShowEducation(settings.showEducation ?? false);
			setShowAdvanced(settings.showAdvanced ?? false);
			setShowSecurityScorecard(settings.showSecurityScorecard ?? false);
			setShowFlowGuidance(settings.showFlowGuidance ?? true);
		} catch (err) {
			console.warn(`${_MODULE_TAG} Failed to load flow settings:`, err);
		}
	};

	// Handle flow type change
	const handleFlowTypeChange = useCallback(
		async (newFlowType: FlowType) => {
			try {
				setFlowType(newFlowType);
				setFlowStep(0);
				setFlowResults(null);

				// Update URL
				const newParams = new URLSearchParams(location.search);
				newParams.set('flowType', newFlowType);
				navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });

				// Log analytics
				await safeLogAnalytics('flow-type-change', `Flow type changed to ${newFlowType}`, {
					flowType: newFlowType,
					specVersion,
				});

				// Save settings
				await FlowSettingsServiceV8U.saveSettings({ flowType: newFlowType });
			} catch (err) {
				console.error(`${_MODULE_TAG} Failed to change flow type:`, err);
				setError('Failed to change flow type');
			}
		},
		[specVersion, location.search, navigate, location.pathname]
	);

	// Handle spec version change
	const handleSpecVersionChange = useCallback(
		async (newSpecVersion: SpecVersion) => {
			try {
				setSpecVersion(newSpecVersion);
				setFlowStep(0);
				setFlowResults(null);

				// Update URL
				const newParams = new URLSearchParams(location.search);
				newParams.set('specVersion', newSpecVersion);
				navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });

				// Log analytics
				await safeLogAnalytics('spec-version-change', `Spec version changed to ${newSpecVersion}`, {
					flowType,
					specVersion: newSpecVersion,
				});

				// Save settings
				await FlowSettingsServiceV8U.saveSettings({ specVersion: newSpecVersion });
			} catch (err) {
				console.error(`${_MODULE_TAG} Failed to change spec version:`, err);
				setError('Failed to change spec version');
			}
		},
		[flowType, location.search, navigate, location.pathname]
	);

	// Handle credentials change
	const handleCredentialsChange = useCallback(
		async (newCredentials: UnifiedOAuthCredentials) => {
			try {
				setCredentials(newCredentials);

				// Save credentials
				await UnifiedOAuthCredentialsServiceV8U.saveCredentials(newCredentials);

				// Log analytics (without sensitive data)
				await safeLogAnalytics('credentials-updated', 'Credentials updated', {
					hasClientId: !!newCredentials.clientId,
					hasClientSecret: !!newCredentials.clientSecret,
					hasEnvironmentId: !!newCredentials.environmentId,
					flowType,
					specVersion,
				});
			} catch (err) {
				console.error(`${_MODULE_TAG} Failed to save credentials:`, err);
				setError('Failed to save credentials');
			}
		},
		[flowType, specVersion]
	);

	// Handle flow execution
	const handleFlowExecution = useCallback(async () => {
		if (!credentials) {
			setError('Please configure credentials before running the flow');
			return;
		}

		try {
			setIsFlowRunning(true);
			setFlowStep(1);
			setError(null);
			setFlowResults(null);

			// Create abort controller for this flow execution
			const controller = new AbortController();
			abortControllerRef.current = controller;

			// Execute flow based on type
			const results = await UnifiedFlowIntegrationV8U.executeFlow({
				flowType,
				specVersion,
				credentials,
				sharedCredentials,
				options: {
					silentApiConfig,
					showTokenConfig,
					abortSignal: controller.signal,
				},
			});

			setFlowResults(results);
			setFlowStep(2);

			// Log success
			await safeLogAnalytics('flow-execution-success', 'Flow executed successfully', {
				flowType,
				specVersion,
				hasResults: !!results,
			});

			toastV8.success('Flow executed successfully!');
		} catch (err) {
			console.error(`${_MODULE_TAG} Flow execution failed:`, err);

			const errorMessage = err instanceof Error ? err.message : 'Flow execution failed';
			setError(errorMessage);

			toastV8.error(errorMessage);

			// Log error
			await safeLogAnalytics('flow-execution-error', 'Flow execution failed', {
				flowType,
				specVersion,
				error: errorMessage,
			});
		} finally {
			setIsFlowRunning(false);
			abortControllerRef.current = null;
		}
	}, [flowType, specVersion, credentials, sharedCredentials, silentApiConfig, showTokenConfig]);

	// Handle flow reset
	const handleFlowReset = useCallback(async () => {
		try {
			// Cancel any ongoing flow execution
			const currentController = abortControllerRef.current;
			if (currentController) {
				currentController.abort();
				abortControllerRef.current = null;
			}

			setFlowResults(null);
			setFlowStep(0);
			setIsFlowRunning(false);
			setError(null);

			// Log reset
			await safeLogAnalytics('flow-reset', 'Flow reset', {
				flowType,
				specVersion,
			});
		} catch (err) {
			console.error(`${_MODULE_TAG} Failed to reset flow:`, err);
		}
	}, [flowType, specVersion]);

	// Handle settings changes
	const handleSettingsChange = useCallback(
		async (newSettings: Partial<FlowSettingsServiceV8U.Settings>) => {
			try {
				// Update local state
				if (newSettings.showEducation !== undefined) setShowEducation(newSettings.showEducation);
				if (newSettings.showAdvanced !== undefined) setShowAdvanced(newSettings.showAdvanced);
				if (newSettings.showSecurityScorecard !== undefined)
					setShowSecurityScorecard(newSettings.showSecurityScorecard);
				if (newSettings.showFlowGuidance !== undefined)
					setShowFlowGuidance(newSettings.showFlowGuidance);

				// Save settings
				await FlowSettingsServiceV8U.saveSettings(newSettings);

				// Log analytics
				await safeLogAnalytics('settings-changed', 'Settings updated', newSettings);
			} catch (err) {
				console.error(`${_MODULE_TAG} Failed to save settings:`, err);
			}
		},
		[]
	);

	// Generate Postman collection
	const handleGeneratePostmanCollection = useCallback(async () => {
		if (!credentials) {
			setError('Please configure credentials before generating Postman collection');
			return;
		}

		try {
			setIsLoading(true);

			const collection = await generateComprehensiveUnifiedPostmanCollection({
				flowType,
				specVersion,
				credentials,
				sharedCredentials,
			});

			await downloadPostmanCollectionWithEnvironment(collection, 'unified-oauth-flow');

			toastV8.success('Postman collection generated successfully!');

			// Log analytics
			await safeLogAnalytics('postman-collection-generated', 'Postman collection generated', {
				flowType,
				specVersion,
			});
		} catch (err) {
			console.error(`${_MODULE_TAG} Failed to generate Postman collection:`, err);
			setError('Failed to generate Postman collection');
			toastV8.error('Failed to generate Postman collection');
		} finally {
			setIsLoading(false);
		}
	}, [flowType, specVersion, credentials, sharedCredentials]);

	// PING UI MIGRATION: Main render with .end-user-nano wrapper
	if (!isInitialized) {
		return (
			<div className="end-user-nano">
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						minHeight: '100vh',
						background: 'var(--ping-secondary-color, #f8f9fa)',
					}}
				>
					<div style={{ textAlign: 'center' }}>
						<div
							style={{
								fontSize: '18px',
								color: 'var(--ping-text-color, #1a1a1a)',
								marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
							}}
						>
							Initializing Unified OAuth Flow...
						</div>
						<div
							style={{
								fontSize: '14px',
								color: 'var(--ping-text-color, #1a1a1a)',
								opacity: 0.7,
							}}
						>
							Loading configuration and credentials...
						</div>
					</div>
				</div>
			</div>
		);
	}

	// PING UI MIGRATION: Main component render with Ping UI styling
	return (
		<div className="end-user-nano">
			<MobileResponsiveWrapper onResponsiveChange={setMobileResponsive}>
				{/* Header */}
				<PageHeaderV8
					title="Unified OAuth/OIDC Flow"
					subtitle={`Execute ${specVersion.toUpperCase()} ${flowType.replace('-', ' ').toUpperCase()} flows with real PingOne APIs`}
					gradient={PageHeaderGradients.OAUTH}
					textColor={PageHeaderTextColors.DARK}
					actions={
						<div style={{ display: 'flex', gap: 'var(--ping-spacing-sm, 0.5rem)' }}>
							{/* PING UI MIGRATION: Replaced FiBook with MDI icon */}
							<MDIIcon
								icon="FiBook"
								size={20}
								ariaLabel="Documentation"
								style={{
									cursor: 'pointer',
									color: 'var(--ping-text-color, #1a1a1a)',
									transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
								}}
								onClick={() => window.open('/docs/oauth', '_blank')}
							/>

							{/* PING UI MIGRATION: Replaced FiPackage with MDI icon */}
							<MDIIcon
								icon="FiPackage"
								size={20}
								ariaLabel="Download Postman Collection"
								style={{
									cursor: 'pointer',
									color: 'var(--ping-text-color, #1a1a1a)',
									transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
								}}
								onClick={handleGeneratePostmanCollection}
								disabled={isLoading}
							/>
						</div>
					}
				/>

				{/* Navigation */}
				<UnifiedNavigationV8U
					flowType={flowType}
					specVersion={specVersion}
					onFlowTypeChange={handleFlowTypeChange}
					onSpecVersionChange={handleSpecVersionChange}
					mobileResponsive={mobileResponsive}
				/>

				{/* Main Content */}
				<div
					style={{
						padding: 'var(--ping-spacing-lg, 1.5rem)',
						maxWidth: '1200px',
						margin: '0 auto',
					}}
				>
					{/* Error Display */}
					{error && (
						<div
							style={{
								background: 'rgba(220, 53, 69, 0.1)',
								border: `1px solid var(--ping-error-color, #dc3545)`,
								borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
								padding: 'var(--ping-spacing-md, 1rem)',
								marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
								color: 'var(--ping-error-color, #dc3545)',
							}}
						>
							<strong>Error:</strong> {error}
						</div>
					)}

					{/* Configuration Section */}
					<div style={{ marginBottom: 'var(--ping-spacing-lg, 1.5rem)' }}>
						<CredentialsFormV8U
							credentials={credentials}
							onCredentialsChange={handleCredentialsChange}
							flowType={flowType}
							specVersion={specVersion}
							disabled={isFlowRunning}
						/>
					</div>

					{/* Flow Controls */}
					<div style={{ marginBottom: 'var(--ping-spacing-lg, 1.5rem)' }}>
						<UnifiedFlowSteps
							currentStep={flowStep}
							isRunning={isFlowRunning}
							results={flowResults}
							onExecute={handleFlowExecution}
							onReset={handleFlowReset}
							disabled={!credentials || isFlowRunning}
						/>
					</div>

					{/* Results Section */}
					{flowResults && (
						<div style={{ marginBottom: 'var(--ping-spacing-lg, 1.5rem)' }}>
							<SuperSimpleApiDisplayV8 data={flowResults} title="Flow Results" expandable={true} />
						</div>
					)}

					{/* Educational Content */}
					{showEducation && (
						<div style={{ marginBottom: 'var(--ping-spacing-lg, 1.5rem)' }}>
							<MasterEducationSection
								flowType={flowType}
								specVersion={specVersion}
								results={flowResults}
							/>
						</div>
					)}

					{/* Advanced Features */}
					{showAdvanced && (
						<div style={{ marginBottom: 'var(--ping-spacing-lg, 1.5rem)' }}>
							<AdvancedOAuthFeatures
								flowType={flowType}
								specVersion={specVersion}
								credentials={credentials}
								results={flowResults}
							/>
						</div>
					)}

					{/* Security Scorecard */}
					{showSecurityScorecard && (
						<div style={{ marginBottom: 'var(--ping-spacing-lg, 1.5rem)' }}>
							<SecurityScorecard
								credentials={credentials}
								flowType={flowType}
								specVersion={specVersion}
								results={flowResults}
							/>
						</div>
					)}

					{/* Flow Guidance */}
					{showFlowGuidance && (
						<div style={{ marginBottom: 'var(--ping-spacing-lg, 1.5rem)' }}>
							<FlowGuidanceSystem
								flowType={flowType}
								specVersion={specVersion}
								step={flowStep}
								results={flowResults}
							/>
						</div>
					)}

					{/* Settings Panel */}
					<div
						style={{
							border: `1px solid var(--ping-border-color, #dee2e6)`,
							borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
							padding: 'var(--ping-spacing-md, 1rem)',
							background: 'var(--ping-secondary-color, #f8f9fa)',
							marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
						}}
					>
						<h3
							style={{
								marginBottom: 'var(--ping-spacing-md, 1rem)',
								color: 'var(--ping-text-color, #1a1a1a)',
								fontSize: '18px',
								fontWeight: '600',
							}}
						>
							Flow Settings
						</h3>

						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: 'var(--ping-spacing-sm, 0.5rem)',
							}}
						>
							<EducationModeToggle
								enabled={showEducation}
								onToggle={(enabled) => handleSettingsChange({ showEducation: enabled })}
							/>

							<ShowTokenConfigCheckboxV8
								checked={showTokenConfig}
								onChange={(checked) => handleSettingsChange({ showTokenConfig: checked })}
							/>

							<SilentApiConfigCheckboxV8
								checked={silentApiConfig}
								onChange={(checked) => handleSettingsChange({ silentApiConfig: checked })}
							/>
						</div>
					</div>

					{/* Worker Token Status */}
					<WorkerTokenStatusDisplayV8 />

					{/* Export/Import Controls */}
					<StandardizedCredentialExportImport
						credentials={credentials}
						sharedCredentials={sharedCredentials}
						onCredentialsChange={handleCredentialsChange}
						onSharedCredentialsChange={setSharedCredentials}
					/>

					{/* Worker Token Button */}
					<WorkerTokenButton />
				</div>
			</MobileResponsiveWrapper>
		</div>
	);
};

export default UnifiedOAuthFlowV8UPingUI;
