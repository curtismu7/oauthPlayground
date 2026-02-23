/**
 * @file Configuration.PingUI.tsx
 * @module pages
 * @description Configuration page with PingOne UI styling
 * @version 1.0.0
 * @since 2026-02-22
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import packageJson from '../../package.json';
import ConfigurationURIChecker from '../components/ConfigurationURIChecker';
import { DomainConfiguration } from '../components/DomainConfiguration';
import PingOneApplicationConfig, {
	type PingOneApplicationState,
} from '../components/PingOneApplicationConfig';
import { WorkerTokenButton } from '../components/WorkerTokenButton';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import StandardHeader from '../components/StandardHeader';
import BootstrapButton from '../components/bootstrap/BootstrapButton';
import BootstrapFormField from '../components/bootstrap/BootstrapFormField';
import { callbackUriService } from '../services/callbackUriService';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { credentialStorageManager } from '../services/credentialStorageManager';
import { v4ToastManager } from '../utils/v4ToastMessages';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '../v8/services/workerTokenStatusServiceV8';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/bootstrap/pingone-bootstrap.css';

// MDI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 20, ariaLabel, className = '', style }) => {
	const iconMap: Record<string, string> = {
		FiAlertCircle: 'mdi-alert-circle',
		FiCheckCircle: 'mdi-check-circle',
		FiCopy: 'mdi-content-copy',
		FiDownload: 'mdi-download',
		FiExternalLink: 'mdi-open-in-new',
		FiEye: 'mdi-eye',
		FiEyeOff: 'mdi-eye-off',
		FiGithub: 'mdi-github',
		FiInfo: 'mdi-information',
		FiKey: 'mdi-key',
		FiPackage: 'mdi-package',
		FiPlay: 'mdi-play',
		FiSave: 'mdi-content-save',
		FiSettings: 'mdi-cog',
		FiTerminal: 'mdi-console',
		FiRefreshCw: 'mdi-refresh',
		FiChevronDown: 'mdi-chevron-down',
		FiChevronUp: 'mdi-chevron-up',
	};

	const iconClass = iconMap[icon] || icon;
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			title={ariaLabel}
			aria-hidden={!ariaLabel}
		/>
	);
};

// Main Component
const ConfigurationPingUI: React.FC = () => {
	
	// State for PingOne application configuration
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState & {
		clientId?: string;
		clientSecret?: string;
		environmentId?: string;
		redirectUri?: string;
		scopes?: string;
		isValid?: boolean;
		errors?: Record<string, string>;
	}>({
		clientAuthMethod: 'client_secret_basic',
		allowRedirectUriPatterns: false,
		pkceEnforcement: 'REQUIRED',
		responseTypeCode: true,
		responseTypeToken: false,
		responseTypeIdToken: true,
		grantTypeAuthorizationCode: true,
		initiateLoginUri: '',
		targetLinkUri: '',
		signoffUrls: [],
		requestParameterSignatureRequirement: 'DEFAULT',
		enableJWKS: false,
		jwksMethod: 'JWKS_URL',
		jwksUrl: '',
		jwks: '',
		requirePushedAuthorizationRequest: false,
		pushedAuthorizationRequestTimeout: 60,
		enableDPoP: false,
		dpopAlgorithm: 'ES256',
		additionalRefreshTokenReplayProtection: false,
		includeX5tParameter: false,
		oidcSessionManagement: false,
		requestScopesForMultipleResources: false,
		terminateUserSessionByIdToken: false,
		corsOrigins: [],
		corsAllowAnyOrigin: false,
		clientId: '',
		clientSecret: '',
		environmentId: '',
		redirectUri: callbackUriService.getCallbackUri('authzCallback'),
		scopes: 'openid profile email',
		isValid: false,
		errors: {},
	});

	// State for worker token
	const [workerTokenStatus, setWorkerTokenStatus] = useState<TokenStatusInfo | null>(null);

	// State for Worker Token basic info
	const [workerTokenInfo, setWorkerTokenInfo] = useState({
		clientId: '',
		clientSecret: '',
		tokenAuthMethod: 'client_secret_basic' as 'client_secret_basic' | 'client_secret_post' | 'none',
	});

	// State for Authorization Flow basic info
	const [authzFlowInfo, setAuthzFlowInfo] = useState({
		clientId: '',
		clientSecret: '',
		redirectUri: '',
		scopes: 'openid profile email',
	});

	const [isLoading, setIsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<'pingone' | 'worker' | 'advanced'>('pingone');

	// State for collapsible sections
	const [collapsedSections, setCollapsedSections] = useState({
		pingOneApp: false,
		workerTokenBasic: false,
		workerTokenStatus: false,
		authzFlowBasic: false,
		advanced: false,
		appInfo: false,
		devTools: false,
	});

	const toggleSection = useCallback((section: keyof typeof collapsedSections) => {
		setCollapsedSections(prev => ({
			...prev,
			[section]: !prev[section]
		}));
	}, []);

	const isValidUrl = useCallback((url: string): boolean => {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}, []);

	const loadSavedConfiguration = useCallback(async () => {
		try {
			const savedConfig = await credentialStorageManager.loadFlowCredentials('default');
			if (savedConfig.success && savedConfig.data) {
				setPingOneConfig((prev) => ({
					...prev,
					clientId: savedConfig.data?.clientId || '',
					clientSecret: savedConfig.data?.clientSecret || '',
					environmentId: savedConfig.data?.environmentId || '',
					redirectUri: savedConfig.data?.redirectUri || callbackUriService.getCallbackUri('authzCallback'),
					scopes: typeof savedConfig.data?.scopes === 'string' ? savedConfig.data.scopes : Array.isArray(savedConfig.data?.scopes) ? savedConfig.data.scopes.join(' ') : (savedConfig.data?.scopes || 'openid profile email'),
				}));
			}
		} catch (error) {
			console.error('Failed to load saved configuration:', error);
			v4ToastManager.showError('Failed to load saved configuration');
		}
	}, []);

	const checkWorkerTokenStatus = useCallback(async () => {
		try {
			const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setWorkerTokenStatus(status);
		} catch (error) {
			console.error('Failed to check worker token status:', error);
		}
	}, []);

	// Load saved configuration on mount
	useEffect(() => {
		loadSavedConfiguration();
		// Use sync version to avoid async issues in useEffect
		try {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
			setWorkerTokenStatus(status);
		} catch (error) {
			console.error('Failed to check worker token status:', error);
		}
	}, [loadSavedConfiguration]);


	const validateConfiguration = useCallback(() => {
		const errors: Record<string, string> = {};

		if (!pingOneConfig.clientId?.trim()) {
			errors.clientId = 'Client ID is required';
		}

		if (!pingOneConfig.environmentId?.trim()) {
			errors.environmentId = 'Environment ID is required';
		}

		if (!pingOneConfig.redirectUri?.trim()) {
			errors.redirectUri = 'Redirect URI is required';
		} else if (!isValidUrl(pingOneConfig.redirectUri)) {
			errors.redirectUri = 'Invalid URL format';
		}

		if (!pingOneConfig.scopes?.trim()) {
			errors.scopes = 'At least one scope is required';
		}

		setPingOneConfig((prev) => ({
			...prev,
			errors,
			isValid: Object.keys(errors).length === 0,
		}));

		return Object.keys(errors).length === 0;
	}, [pingOneConfig, isValidUrl]);

	const saveConfiguration = useCallback(async () => {
		if (!validateConfiguration()) {
			v4ToastManager.showError('Please fix validation errors before saving');
			return;
		}

		setIsLoading(true);

		try {
			// Save to credential storage
			await credentialStorageManager.saveFlowCredentials('default', {
				clientId: pingOneConfig.clientId || '',
				clientSecret: pingOneConfig.clientSecret || '',
				environmentId: pingOneConfig.environmentId || '',
				redirectUri: pingOneConfig.redirectUri || '',
				scopes: pingOneConfig.scopes || '',
			});

			v4ToastManager.showSuccess('Configuration saved successfully');
		} catch (error) {
			console.error('Failed to save configuration:', error);
			v4ToastManager.showError('Failed to save configuration');
		} finally {
			setIsLoading(false);
		}
	}, [pingOneConfig, validateConfiguration]);

	const saveWorkerTokenInfo = useCallback(async () => {
		if (!workerTokenInfo.clientId.trim()) {
			v4ToastManager.showError('Client ID is required for Worker Token');
			return;
		}

		setIsLoading(true);

		try {
			// Save worker token info to credential storage
			await credentialStorageManager.saveFlowCredentials('worker-token', {
				clientId: workerTokenInfo.clientId,
				clientSecret: workerTokenInfo.clientSecret,
				tokenAuthMethod: workerTokenInfo.tokenAuthMethod,
			});

			v4ToastManager.showSuccess('Worker Token info saved successfully');
		} catch (error) {
			console.error('Failed to save Worker Token info:', error);
			v4ToastManager.showError('Failed to save Worker Token info');
		} finally {
			setIsLoading(false);
		}
	}, [workerTokenInfo]);

	const saveAuthzFlowInfo = useCallback(async () => {
		if (!authzFlowInfo.clientId.trim()) {
			v4ToastManager.showError('Client ID is required for Authorization Flow');
			return;
		}

		if (!authzFlowInfo.redirectUri.trim()) {
			v4ToastManager.showError('Redirect URI is required for Authorization Flow');
			return;
		} else if (!isValidUrl(authzFlowInfo.redirectUri)) {
			v4ToastManager.showError('Invalid Redirect URI format');
			return;
		}

		setIsLoading(true);

		try {
			// Save authorization flow info to credential storage
			await credentialStorageManager.saveFlowCredentials('authz-flow', {
				clientId: authzFlowInfo.clientId,
				clientSecret: authzFlowInfo.clientSecret,
				redirectUri: authzFlowInfo.redirectUri,
				scopes: authzFlowInfo.scopes,
			});

			v4ToastManager.showSuccess('Authorization Flow info saved successfully');
		} catch (error) {
			console.error('Failed to save Authorization Flow info:', error);
			v4ToastManager.showError('Failed to save Authorization Flow info');
		} finally {
			setIsLoading(false);
		}
	}, [authzFlowInfo, isValidUrl]);

	const copyToClipboard = useCallback(async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess(`${label} copied to clipboard`);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			v4ToastManager.showError('Failed to copy to clipboard');
		}
	}, []);



	const configurationSummary = useMemo(() => {
		return {
			hasClientId: !!pingOneConfig.clientId,
			hasClientSecret: !!pingOneConfig.clientSecret,
			hasEnvironmentId: !!pingOneConfig.environmentId,
			hasValidRedirectUri: isValidUrl(pingOneConfig.redirectUri || ''),
			hasScopes: !!pingOneConfig.scopes,
			isComplete: pingOneConfig.isValid,
		};
	}, [pingOneConfig, isValidUrl]);

	return (
		<div className="end-user-nano">
			<style>
				{`
					.configuration-pingui {
						max-width: 1200px;
						margin: 0 auto;
						padding: var(--ping-spacing-lg, 1.5rem);
						font-family: var(--ping-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
					}

					.configuration-pingui .tabs {
						display: flex;
						gap: var(--ping-spacing-xs, 0.25rem);
						border-bottom: 1px solid var(--ping-border-light, #e5e7eb);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.configuration-pingui .tab {
						background: none;
						border: none;
						padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						color: var(--ping-text-secondary, #666);
						cursor: pointer;
						border-bottom: 2px solid transparent;
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.configuration-pingui .tab:hover {
						color: var(--ping-text-primary, #1a1a1a);
					}

					.configuration-pingui .tab.active {
						color: var(--ping-color-primary, #3b82f6);
						border-bottom-color: var(--ping-color-primary, #3b82f6);
					}

					.configuration-pingui .config-section {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.configuration-pingui .section-header {
						display: flex;
						align-items: center;
						justify-content: space-between;
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.configuration-pingui .section-title {
						font-size: var(--ping-font-size-xl, 1.25rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-text-primary, #1a1a1a);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
					}

					.configuration-pingui .form-group {
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.configuration-pingui label {
						display: block;
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-xs, 0.25rem);
					}

					.configuration-pingui input {
						width: 100%;
						padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
						border: 1px solid var(--ping-border-primary, #d1d5db);
						border-radius: var(--ping-radius-md, 0.5rem);
						font-size: var(--ping-font-size-base, 1rem);
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.configuration-pingui input:focus {
						outline: none;
						border-color: var(--ping-color-primary, #3b82f6);
						box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
					}

					.configuration-pingui input.error {
						border-color: var(--ping-color-error, #ef4444);
					}

					.configuration-pingui .input-group {
						position: relative;
					}

					.configuration-pingui .input-group button {
						position: absolute;
						right: var(--ping-spacing-xs, 0.25rem);
						top: 50%;
						transform: translateY(-50%);
						background: none;
						border: none;
						padding: var(--ping-spacing-sm, 0.5rem);
						cursor: pointer;
						color: var(--ping-text-secondary, #666);
						transition: color var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.configuration-pingui .input-group button:hover {
						color: var(--ping-text-primary, #1a1a1a);
					}

					.configuration-pingui .error-message {
						color: var(--ping-color-error, #ef4444);
						font-size: var(--ping-font-size-xs, 0.75rem);
						margin-top: var(--ping-spacing-xs, 0.25rem);
					}

					.configuration-pingui .btn-primary {
						background: var(--ping-color-primary, #3b82f6);
						color: var(--ping-color-white, #ffffff);
						border: none;
						border-radius: var(--ping-radius-md, 0.5rem);
						padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-lg, 1.5rem);
						font-size: var(--ping-font-size-base, 1rem);
						font-weight: var(--ping-font-weight-medium, 500);
						cursor: pointer;
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
					}

					.configuration-pingui .btn-primary:hover:not(:disabled) {
						background: var(--ping-color-primary-dark, #2563eb);
						transform: translateY(-1px);
					}

					.configuration-pingui .btn-primary:disabled {
						opacity: 0.6;
						cursor: not-allowed;
					}

					.configuration-pingui .btn-secondary {
						background: var(--ping-surface-secondary, #f8fafc);
						color: var(--ping-text-primary, #1a1a1a);
						border: 1px solid var(--ping-border-primary, #d1d5db);
						border-radius: var(--ping-radius-md, 0.5rem);
						padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						cursor: pointer;
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-xs, 0.25rem);
					}

					.configuration-pingui .btn-secondary:hover {
						background: var(--ping-surface-tertiary, #f1f5f9);
					}

					.configuration-pingui .status-indicator {
						display: inline-flex;
						align-items: center;
						gap: var(--ping-spacing-xs, 0.25rem);
						padding: var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.75rem);
						border-radius: var(--ping-radius-full, 9999px);
						font-size: var(--ping-font-size-xs, 0.75rem);
						font-weight: var(--ping-font-weight-medium, 500);
					}

					.configuration-pingui .status-indicator.success {
						background: var(--ping-color-success-light, #d1fae5);
						color: var(--ping-color-success, #10b981);
					}

					.configuration-pingui .status-indicator.error {
						background: var(--ping-color-error-light, #fef2f2);
						color: var(--ping-color-error, #ef4444);
					}

					.configuration-pingui .summary-grid {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
						gap: var(--ping-spacing-md, 1rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.configuration-pingui .summary-item {
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
						padding: var(--ping-spacing-sm, 0.75rem);
						background: var(--ping-surface-secondary, #f8fafc);
						border-radius: var(--ping-radius-md, 0.5rem);
					}

					.configuration-pingui .summary-item .icon {
						color: var(--ping-text-secondary, #666);
					}

					.configuration-pingui .summary-item.complete .icon {
						color: var(--ping-color-success, #10b981);
					}

					@media (max-width: 768px) {
						.configuration-pingui {
							padding: var(--ping-spacing-md, 1rem);
						}

						.configuration-pingui .config-section {
							padding: var(--ping-spacing-lg, 1.5rem);
						}

						.configuration-pingui .tabs {
							overflow-x: auto;
						}

						.configuration-pingui .summary-grid {
							grid-template-columns: 1fr;
						}
					}
				`}
			</style>

			<div className="configuration-pingui">
				<CollapsibleHeader title="Configuration">Configuration</CollapsibleHeader>

				{workerTokenStatus && workerTokenStatus.isValid && workerTokenStatus.token && (
					<WorkerTokenDetectedBanner token={workerTokenStatus.token} />
				)}

				<div className="tabs">
					<button
						type="button"
						className={`tab ${activeTab === 'pingone' ? 'active' : ''}`}
						onClick={() => setActiveTab('pingone')}
					>
						<MDIIcon icon="FiKey" size={16} />
						PingOne Application
					</button>
					<button
						type="button"
						className={`tab ${activeTab === 'worker' ? 'active' : ''}`}
						onClick={() => setActiveTab('worker')}
					>
						<MDIIcon icon="FiPackage" size={16} />
						Worker Token
					</button>
					<button
						type="button"
						className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
						onClick={() => setActiveTab('advanced')}
					>
						<MDIIcon icon="FiSettings" size={16} />
						Advanced
					</button>
				</div>

				{activeTab === 'pingone' && (
					<div className="config-section">
						<StandardHeader
							title="PingOne Application Configuration"
							description="Configure OAuth flow parameters and settings"
							icon="key"
							isCollapsible={true}
							isCollapsed={collapsedSections.pingOneApp}
							onToggle={() => toggleSection('pingOneApp')}
							badge={configurationSummary.isComplete ? {
								text: 'Complete',
								variant: 'success'
							} : {
								text: 'Incomplete',
								variant: 'warning'
							}}
						/>

						{!collapsedSections.pingOneApp && (
							<>
								<div className="summary-grid">
									<div className={`summary-item ${configurationSummary.hasClientId ? 'complete' : ''}`}>
										<MDIIcon icon="FiCheckCircle" size={16} className="icon" />
										<span>Client ID</span>
									</div>
									<div
										className={`summary-item ${configurationSummary.hasEnvironmentId ? 'complete' : ''}`}
									>
										<MDIIcon icon="FiCheckCircle" size={16} className="icon" />
										<span>Environment ID</span>
									</div>
									<div
										className={`summary-item ${configurationSummary.hasValidRedirectUri ? 'complete' : ''}`}
									>
										<MDIIcon icon="FiCheckCircle" size={16} className="icon" />
										<span>Redirect URI</span>
									</div>
									<div className={`summary-item ${configurationSummary.hasScopes ? 'complete' : ''}`}>
										<MDIIcon icon="FiCheckCircle" size={16} className="icon" />
										<span>Scopes</span>
									</div>
								</div>

								<PingOneApplicationConfig
									value={pingOneConfig}
									onChange={setPingOneConfig}
								/>

								<div className="form-group">
									<ConfigurationURIChecker />
								</div>

								<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
									<BootstrapButton
										variant="primary"
										whiteBorder={true}
										onClick={saveConfiguration}
										loading={isLoading}
										disabled={!pingOneConfig.isValid}
									>
										<MDIIcon icon="FiSave" size={14} />
										{isLoading ? 'Saving...' : 'Save Configuration'}
									</BootstrapButton>

									<BootstrapButton
										variant="secondary"
										onClick={() => copyToClipboard(pingOneConfig.redirectUri || '', 'Redirect URI')}
									>
										<MDIIcon icon="FiCopy" size={14} />
										Copy Redirect URI
									</BootstrapButton>
								</div>
							</>
						)}
					</div>
				)}

				{activeTab === 'worker' && (
					<div className="config-section">
						<StandardHeader
							title="Worker Token Configuration"
							description="Manage and monitor worker token status"
							icon="package-variant"
							isCollapsible={true}
							isCollapsed={collapsedSections.workerTokenBasic}
							onToggle={() => toggleSection('workerTokenBasic')}
							badge={workerTokenStatus && workerTokenStatus.isValid ? {
								text: 'Active',
								variant: 'success'
							} : {
								text: 'Inactive',
								variant: 'default'
							}}
						/>

						{!collapsedSections.workerTokenBasic && (
							<>
								{/* Worker Token Basic Info Section */}
								<StandardHeader
									title="Basic Information"
									description="Configure worker token credentials and authentication method"
									icon="key"
									variant="secondary"
									isCollapsible={true}
									isCollapsed={collapsedSections.workerTokenBasic}
									onToggle={() => toggleSection('workerTokenBasic')}
								/>

								{!collapsedSections.workerTokenBasic && (
									<div className="ping-card p-4 mb-4">
										<div className="row g-3">
											<div className="col-md-6">
												<BootstrapFormField
													label="Client ID"
													type="text"
													id="worker-client-id"
													value={workerTokenInfo.clientId}
													onChange={(value) => setWorkerTokenInfo(prev => ({ ...prev, clientId: value }))}
													placeholder="Enter Worker Token Client ID"
												/>
											</div>
											<div className="col-md-6">
												<BootstrapFormField
													label="Client Secret"
													type="password"
													id="worker-client-secret"
													value={workerTokenInfo.clientSecret}
													onChange={(value) => setWorkerTokenInfo(prev => ({ ...prev, clientSecret: value }))}
													placeholder="Enter Worker Token Client Secret"
												/>
											</div>
											<div className="col-md-6">
												<BootstrapFormField
													label="Token Auth Method"
													type="select"
													id="worker-auth-method"
													value={workerTokenInfo.tokenAuthMethod}
													onChange={(value) => setWorkerTokenInfo(prev => ({ ...prev, tokenAuthMethod: value as "none" | "client_secret_post" | "client_secret_basic" }))}
												>
													<option value="client_secret_basic">Client Secret Basic</option>
													<option value="client_secret_post">Client Secret Post</option>
													<option value="none">None (Public Client)</option>
												</BootstrapFormField>
											</div>
										</div>

										<div className="d-flex gap-2 mt-3">
											<BootstrapButton
												variant="primary"
												whiteBorder={true}
												onClick={saveWorkerTokenInfo}
												loading={isLoading}
											>
												<MDIIcon icon="FiSave" size={14} />
												{isLoading ? 'Saving...' : 'Save Worker Token Info'}
											</BootstrapButton>
										</div>
									</div>
								)}

								<WorkerTokenButton onTokenObtained={checkWorkerTokenStatus} />

								{workerTokenStatus && (
									<>
										<StandardHeader
											title="Token Status"
											description="View worker token details and expiration information"
											icon="information"
											variant="secondary"
											isCollapsible={true}
											isCollapsed={collapsedSections.workerTokenStatus}
											onToggle={() => toggleSection('workerTokenStatus')}
										/>

										{!collapsedSections.workerTokenStatus && (
											<div
												style={{
													background: 'var(--ping-surface-secondary, #f8fafc)',
													padding: '1rem',
													borderRadius: '0.5rem',
												}}
											>
												<p>
													<strong>Status:</strong> {workerTokenStatus?.isValid ? 'Valid' : 'Invalid'}
												</p>
												{workerTokenStatus?.expiresAt && (
													<p>
														<strong>Expires:</strong>{' '}
														{new Date(workerTokenStatus.expiresAt).toLocaleString()}
													</p>
												)}
											</div>
										)}
									</>
								)}
							</>
						)}
					</div>
				)}

				{activeTab === 'advanced' && (
					<div className="config-section">
						<StandardHeader
							title="Advanced Configuration"
							description="Advanced settings and developer tools"
							icon="cog"
							isCollapsible={true}
							isCollapsed={collapsedSections.advanced}
							onToggle={() => toggleSection('advanced')}
						/>

						{!collapsedSections.advanced && (
							<>
								{/* Authorization Flow Basic Info Section */}
								<StandardHeader
									title="Authorization Flow Basic Information"
									description="Configure authorization flow credentials and settings"
									icon="key"
									variant="secondary"
									isCollapsible={true}
									isCollapsed={collapsedSections.authzFlowBasic}
									onToggle={() => toggleSection('authzFlowBasic')}
								/>

								{!collapsedSections.authzFlowBasic && (
									<div
										style={{
											background: 'var(--ping-surface-secondary, #f8fafc)',
											padding: '1.5rem',
											borderRadius: '0.5rem',
											border: '1px solid var(--ping-border-light, #e5e7eb)',
										}}
									>
										<div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
											<div>
												<label htmlFor="authz-client-id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--ping-text-primary, #1a1a1a)' }}>
													Client ID
												</label>
												<input
													id="authz-client-id"
													type="text"
													value={authzFlowInfo.clientId}
													onChange={(e) => setAuthzFlowInfo(prev => ({ ...prev, clientId: e.target.value }))}
													placeholder="Enter Authorization Flow Client ID"
													style={{
														width: '100%',
														padding: '0.5rem',
														border: '1px solid var(--ping-border-light, #e5e7eb)',
														borderRadius: '0.25rem',
														fontSize: '0.875rem',
													}}
												/>
											</div>
											<div>
												<label htmlFor="authz-client-secret" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--ping-text-primary, #1a1a1a)' }}>
													Client Secret
												</label>
												<input
													id="authz-client-secret"
													type="password"
													value={authzFlowInfo.clientSecret}
													onChange={(e) => setAuthzFlowInfo(prev => ({ ...prev, clientSecret: e.target.value }))}
													placeholder="Enter Authorization Flow Client Secret"
													style={{
														width: '100%',
														padding: '0.5rem',
														border: '1px solid var(--ping-border-light, #e5e7eb)',
														borderRadius: '0.25rem',
														fontSize: '0.875rem',
													}}
												/>
											</div>
											<div>
												<label htmlFor="authz-redirect-uri" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--ping-text-primary, #1a1a1a)' }}>
													Redirect URI
												</label>
												<input
													id="authz-redirect-uri"
													type="url"
													value={authzFlowInfo.redirectUri}
													onChange={(e) => setAuthzFlowInfo(prev => ({ ...prev, redirectUri: e.target.value }))}
													placeholder="https://your-domain.com/callback"
													style={{
														width: '100%',
														padding: '0.5rem',
														border: '1px solid var(--ping-border-light, #e5e7eb)',
														borderRadius: '0.25rem',
														fontSize: '0.875rem',
													}}
												/>
											</div>
											<div>
												<label htmlFor="authz-scopes" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--ping-text-primary, #1a1a1a)' }}>
													Scopes
												</label>
												<input
													id="authz-scopes"
													type="text"
													value={authzFlowInfo.scopes}
													onChange={(e) => setAuthzFlowInfo(prev => ({ ...prev, scopes: e.target.value }))}
													placeholder="openid profile email"
													style={{
														width: '100%',
														padding: '0.5rem',
														border: '1px solid var(--ping-border-light, #e5e7eb)',
														borderRadius: '0.25rem',
														fontSize: '0.875rem',
													}}
												/>
											</div>
										</div>
										<div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
											<button
												type="button"
												onClick={saveAuthzFlowInfo}
												disabled={isLoading || !authzFlowInfo.clientId.trim() || !authzFlowInfo.redirectUri.trim()}
												style={{
													padding: '0.5rem 1rem',
													background: authzFlowInfo.clientId.trim() && authzFlowInfo.redirectUri.trim() ? 'var(--ping-color-primary, #3b82f6)' : 'var(--ping-border-light, #e5e7eb)',
													color: authzFlowInfo.clientId.trim() && authzFlowInfo.redirectUri.trim() ? 'white' : 'var(--ping-text-secondary, #666)',
													border: 'none',
													borderRadius: '0.25rem',
													fontSize: '0.875rem',
													fontWeight: '500',
													cursor: authzFlowInfo.clientId.trim() && authzFlowInfo.redirectUri.trim() ? 'pointer' : 'not-allowed',
												}}
											>
												<MDIIcon icon="FiSave" size={14} style={{ marginRight: '0.25rem' }} />
												{isLoading ? 'Saving...' : 'Save AuthZ Flow Info'}
											</button>
										</div>
									</div>
								)}

								<DomainConfiguration />

								<StandardHeader
									title="Application Information"
									description="View application version and environment details"
									icon="information"
									variant="secondary"
									isCollapsible={true}
									isCollapsed={collapsedSections.appInfo}
									onToggle={() => toggleSection('appInfo')}
								/>

								{!collapsedSections.appInfo && (
									<div
										style={{
											background: 'var(--ping-surface-secondary, #f8fafc)',
											padding: '1rem',
											borderRadius: '0.5rem',
										}}
									>
										<p>
											<strong>Version:</strong> {packageJson.version}
										</p>
										<p>
											<strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
										</p>
										<p>
											<strong>Build:</strong> {packageJson.buildDate || 'Unknown'}
										</p>
									</div>
								)}

								<StandardHeader
									title="Developer Tools"
									description="Access developer resources and tools"
									icon="terminal"
									variant="secondary"
									isCollapsible={true}
									isCollapsed={collapsedSections.devTools}
									onToggle={() => toggleSection('devTools')}
								/>

								{!collapsedSections.devTools && (
									<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
										<button
											type="button"
											className="btn-secondary"
											onClick={() => window.open('/docs', '_blank')}
										>
											<MDIIcon icon="FiExternalLink" size={14} />
											API Documentation
										</button>
										<button
											type="button"
											className="btn-secondary"
											onClick={() => window.open('https://github.com/pingidentity', '_blank')}
										>
											<MDIIcon icon="FiGithub" size={14} />
											GitHub
										</button>
										<button
											type="button"
											className="btn-secondary"
											onClick={() => console.log('Current config:', pingOneConfig)}
										>
											<MDIIcon icon="FiTerminal" size={14} />
											Debug Console
										</button>
									</div>
								)}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
	};

export default ConfigurationPingUI;
