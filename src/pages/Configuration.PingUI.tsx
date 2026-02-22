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
import type { StepCredentials } from '../components/steps/CommonSteps';
import { WorkerTokenButton } from '../components/WorkerTokenButton';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import { usePageScroll } from '../hooks/usePageScroll';
import { callbackUriService } from '../services/callbackUriService';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { CopyButtonService } from '../services/copyButtonService';
import { credentialStorageManager } from '../services/credentialStorageManager';
import { FlowHeader } from '../services/flowHeaderService';
import { SaveButton } from '../services/saveButtonService';
import { credentialManager } from '../utils/credentialManager';
import { v4ToastManager } from '../utils/v4ToastMessages';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '../v8/services/workerTokenStatusServiceV8';

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
	const { scrollToTopAfterAction } = usePageScroll();

	// State for PingOne application configuration
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
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
	});

	// State for worker token
	const [workerTokenStatus, setWorkerTokenStatus] = useState<TokenStatusInfo | null>(null);

	// State for UI
	const [showSecret, setShowSecret] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<'pingone' | 'worker' | 'advanced'>('pingone');

	// Load saved configuration on mount
	useEffect(() => {
		loadSavedConfiguration();
		checkWorkerTokenStatus();
	}, []);

	const loadSavedConfiguration = useCallback(() => {
		try {
			const savedConfig = credentialStorageManager.loadCredentials();
			if (savedConfig) {
				setPingOneConfig(prev => ({
					...prev,
					clientId: savedConfig.clientId || '',
					clientSecret: savedConfig.clientSecret || '',
					environmentId: savedConfig.environmentId || '',
					redirectUri: savedConfig.redirectUri || callbackUriService.getCallbackUrl(),
					scopes: savedConfig.scopes || 'openid profile email',
				}));
			}
		} catch (error) {
			console.error('Failed to load saved configuration:', error);
			v4ToastManager.error('Failed to load saved configuration');
		}
	}, []);

	const checkWorkerTokenStatus = useCallback(() => {
		try {
			const status = WorkerTokenStatusServiceV8.getTokenStatus();
			setWorkerTokenStatus(status);
		} catch (error) {
			console.error('Failed to check worker token status:', error);
		}
	}, []);

	const handlePingOneConfigChange = useCallback((field: keyof PingOneApplicationState, value: string) => {
		setPingOneConfig(prev => ({
			...prev,
			[field]: value,
		}));
	}, []);

	const validateConfiguration = useCallback(() => {
		const errors: Record<string, string> = {};

		if (!pingOneConfig.clientId.trim()) {
			errors.clientId = 'Client ID is required';
		}

		if (!pingOneConfig.environmentId.trim()) {
			errors.environmentId = 'Environment ID is required';
		}

		if (!pingOneConfig.redirectUri.trim()) {
			errors.redirectUri = 'Redirect URI is required';
		} else if (!isValidUrl(pingOneConfig.redirectUri)) {
			errors.redirectUri = 'Invalid URL format';
		}

		if (!pingOneConfig.scopes.trim()) {
			errors.scopes = 'At least one scope is required';
		}

		setPingOneConfig(prev => ({
			...prev,
			errors,
			isValid: Object.keys(errors).length === 0,
		}));

		return Object.keys(errors).length === 0;
	}, [pingOneConfig]);

	const saveConfiguration = useCallback(async () => {
		if (!validateConfiguration()) {
			v4ToastManager.error('Please fix validation errors before saving');
			return;
		}

		setIsLoading(true);

		try {
			// Save to credential storage
			credentialStorageManager.saveCredentials({
				clientId: pingOneConfig.clientId,
				clientSecret: pingOneConfig.clientSecret,
				environmentId: pingOneConfig.environmentId,
				redirectUri: pingOneConfig.redirectUri,
				scopes: pingOneConfig.scopes,
			});

			// Update callback URI service
			callbackUriService.setCallbackUrl(pingOneConfig.redirectUri);

			v4ToastManager.success('Configuration saved successfully');
		} catch (error) {
			console.error('Failed to save configuration:', error);
			v4ToastManager.error('Failed to save configuration');
		} finally {
			setIsLoading(false);
		}
	}, [pingOneConfig, validateConfiguration]);

	const copyToClipboard = useCallback(async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.success(`${label} copied to clipboard`);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			v4ToastManager.error('Failed to copy to clipboard');
		}
	}, []);

	const generateWorkerToken = useCallback(() => {
		// This would integrate with the worker token service
		v4ToastManager.info('Worker token generation not implemented yet');
	}, []);

	const isValidUrl = (url: string): boolean => {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	};

	const configurationSummary = useMemo(() => {
		return {
			hasClientId: !!pingOneConfig.clientId,
			hasClientSecret: !!pingOneConfig.clientSecret,
			hasEnvironmentId: !!pingOneConfig.environmentId,
			hasValidRedirectUri: isValidUrl(pingOneConfig.redirectUri),
			hasScopes: !!pingOneConfig.scopes,
			isComplete: pingOneConfig.isValid,
		};
	}, [pingOneConfig]);

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

				{workerTokenStatus && workerTokenStatus.isValid && (
					<WorkerTokenDetectedBanner tokenStatus={workerTokenStatus} />
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
						<div className="section-header">
							<h2 className="section-title">
								<MDIIcon icon="FiKey" size={20} />
								PingOne Application Configuration
							</h2>
							<div className="status-indicator success">
								<MDIIcon icon="FiCheckCircle" size={12} />
								{configurationSummary.isComplete ? 'Complete' : 'Incomplete'}
							</div>
						</div>

						<div className="summary-grid">
							<div className={`summary-item ${configurationSummary.hasClientId ? 'complete' : ''}`}>
								<MDIIcon icon="FiCheckCircle" size={16} className="icon" />
								<span>Client ID</span>
							</div>
							<div className={`summary-item ${configurationSummary.hasEnvironmentId ? 'complete' : ''}`}>
								<MDIIcon icon="FiCheckCircle" size={16} className="icon" />
								<span>Environment ID</span>
							</div>
							<div className={`summary-item ${configurationSummary.hasValidRedirectUri ? 'complete' : ''}`}>
								<MDIIcon icon="FiCheckCircle" size={16} className="icon" />
								<span>Redirect URI</span>
							</div>
							<div className={`summary-item ${configurationSummary.hasScopes ? 'complete' : ''}`}>
								<MDIIcon icon="FiCheckCircle" size={16} className="icon" />
								<span>Scopes</span>
							</div>
						</div>

						<PingOneApplicationConfig
							config={pingOneConfig}
							onChange={handlePingOneConfigChange}
							onValidate={validateConfiguration}
						/>

						<div className="form-group">
							<ConfigurationURIChecker />
						</div>

						<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
							<button
								type="button"
								className="btn-primary"
								onClick={saveConfiguration}
								disabled={isLoading || !pingOneConfig.isValid}
							>
								<MDIIcon icon="FiSave" size={16} />
								{isLoading ? 'Saving...' : 'Save Configuration'}
							</button>

							<button
								type="button"
								className="btn-secondary"
								onClick={() => copyToClipboard(pingOneConfig.redirectUri, 'Redirect URI')}
							>
								<MDIIcon icon="FiCopy" size={14} />
								Copy Redirect URI
							</button>
						</div>
					</div>
				)}

				{activeTab === 'worker' && (
					<div className="config-section">
						<div className="section-header">
							<h2 className="section-title">
								<MDIIcon icon="FiPackage" size={20} />
								Worker Token Configuration
							</h2>
							{workerTokenStatus && (
								<div className={`status-indicator ${workerTokenStatus.isValid ? 'success' : 'error'}`}>
									<MDIIcon icon={workerTokenStatus.isValid ? 'FiCheckCircle' : 'FiAlertCircle'} size={12} />
									{workerTokenStatus.isValid ? 'Active' : 'Inactive'}
								</div>
							)}
						</div>

						<WorkerTokenButton onTokenGenerated={checkWorkerTokenStatus} />

						{workerTokenStatus && (
							<div style={{ marginTop: '1.5rem' }}>
								<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
									Token Status
								</h3>
								<div style={{ background: 'var(--ping-surface-secondary, #f8fafc)', padding: '1rem', borderRadius: '0.5rem' }}>
									<p><strong>Status:</strong> {workerTokenStatus.isValid ? 'Valid' : 'Invalid'}</p>
									{workerTokenStatus.expiresAt && (
										<p><strong>Expires:</strong> {new Date(workerTokenStatus.expiresAt).toLocaleString()}</p>
									)}
									{workerTokenStatus.issuedAt && (
										<p><strong>Issued:</strong> {new Date(workerTokenStatus.issuedAt).toLocaleString()}</p>
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{activeTab === 'advanced' && (
					<div className="config-section">
						<div className="section-header">
							<h2 className="section-title">
								<MDIIcon icon="FiSettings" size={20} />
								Advanced Configuration
							</h2>
						</div>

						<DomainConfiguration />

						<div style={{ marginTop: '2rem' }}>
							<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
								Application Information
							</h3>
							<div style={{ background: 'var(--ping-surface-secondary, #f8fafc)', padding: '1rem', borderRadius: '0.5rem' }}>
								<p><strong>Version:</strong> {packageJson.version}</p>
								<p><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</p>
								<p><strong>Build:</strong> {packageJson.buildDate || 'Unknown'}</p>
							</div>
						</div>

						<div style={{ marginTop: '2rem' }}>
							<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
								Developer Tools
							</h3>
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
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ConfigurationPingUI;
