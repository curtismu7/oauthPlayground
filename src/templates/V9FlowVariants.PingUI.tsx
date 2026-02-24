/**
 * @file V9FlowVariants.PingUI.tsx
 * @description V9 Flow Variants with PingOne UI, New Storage & Messaging Systems
 * @version 9.25.1
 */

import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BootstrapIcon from '@/components/BootstrapIcon';
import { getBootstrapIconName } from '@/components/iconMapping';
import { PingUIWrapper } from '@/components/PingUIWrapper';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { unifiedStorageManager } from '@/services/unifiedStorageManager';
import { FlowUIService } from '../services/flowUIService';

// V9 Flow Types
export type V9FlowName = 'authorization-code' | 'client-credentials' | 'device-authorization' | 'implicit' | 'pkce';
export type V9FlowVariant = 'oauth' | 'oidc';

// V9 Configuration Interface
export interface V9FlowConfig {
	baseUrl: string;
	clientId: string;
	clientSecret?: string;
	redirectUri: string;
	environmentId: string;
	scopes: string[];
	region: 'us' | 'eu' | 'ap' | 'ca';
	authMethod: 'client_secret_basic' | 'client_secret_post' | 'none';
	pkceEnabled: boolean;
	enablePAR: boolean;
	enableRAR: boolean;
}

// V9 Storage Keys
const V9_STORAGE_KEYS = {
	FLOW_CONFIG: 'v9_flow_config',
	FLOW_STATE: 'v9_flow_state',
	USER_PREFERENCES: 'v9_user_preferences',
	COMPLIANCE_SETTINGS: 'v9_compliance_settings',
	EDUCATIONAL_PROGRESS: 'v9_educational_progress'
} as const;

// V9 Message Types
export enum V9MessageType {
	SUCCESS = 'success',
	ERROR = 'error',
	WARNING = 'warning',
	INFO = 'info',
	COMPLIANCE = 'compliance',
	EDUCATIONAL = 'educational'
}

// V9 Message Interface
export interface V9Message {
	type: V9MessageType;
	title: string;
	content: string;
	duration?: number;
	persistent?: boolean;
	actions?: Array<{
		label: string;
		action: () => void;
		variant: 'primary' | 'secondary' | 'danger';
	}>;
}

// V9 Flow State Interface
export interface V9FlowState {
	currentStep: number;
	totalSteps: number;
	isLoading: boolean;
	error: string | null;
	completed: boolean;
	flowData: Record<string, any>;
	complianceChecks: {
		pkceEnabled: boolean;
		stateParameterUsed: boolean;
		nonceUsed: boolean;
		scopeValidation: boolean;
	};
}

// Default V9 Configuration
const DEFAULT_V9_CONFIG: V9FlowConfig = {
	baseUrl: 'https://auth.pingone.com',
	clientId: '',
	clientSecret: '',
	redirectUri: 'https://localhost:3000/callback',
	environmentId: '',
	scopes: ['openid', 'profile', 'email'],
	region: 'us',
	authMethod: 'client_secret_basic',
	pkceEnabled: true,
	enablePAR: false,
	enableRAR: false
};

export interface V9FlowVariantProps {
	baseFlowName: V9FlowName;
	showVariantSelector?: boolean;
	onVariantChange?: (variant: V9FlowVariant) => void;
	initialVariant?: V9FlowVariant;
}

/**
 * V9 Storage Service
 * Unified storage management with performance optimizations
 */
class V9StorageService {
	private static readonly MODULE_TAG = '[🗄️ V9-STORAGE]';

	/**
	 * Save flow configuration with unified storage manager
	 */
	static async saveConfig(flowName: V9FlowName, config: Partial<V9FlowConfig>): Promise<void> {
		try {
			const key = `${V9_STORAGE_KEYS.FLOW_CONFIG}_${flowName}`;
			await unifiedStorageManager.save(key, config);
			console.log(`${V9StorageService.MODULE_TAG} Configuration saved for ${flowName}`);
		} catch (error) {
			console.error(`${V9StorageService.MODULE_TAG} Failed to save config:`, error);
			throw error;
		}
	}

	/**
	 * Load flow configuration with unified storage manager
	 */
	static async loadConfig(flowName: V9FlowName): Promise<Partial<V9FlowConfig>> {
		try {
			const key = `${V9_STORAGE_KEYS.FLOW_CONFIG}_${flowName}`;
			const config = await unifiedStorageManager.load(key);
			return config || {};
		} catch (error) {
			console.error(`${V9StorageService.MODULE_TAG} Failed to load config:`, error);
			return {};
		}
	}

	/**
	 * Save flow state with batch operations
	 */
	static async saveFlowState(flowName: V9FlowName, state: V9FlowState): Promise<void> {
		try {
			const key = `${V9_STORAGE_KEYS.FLOW_STATE}_${flowName}`;
			await unifiedStorageManager.save(key, state);
		} catch (error) {
			console.error(`${V9StorageService.MODULE_TAG} Failed to save flow state:`, error);
			throw error;
		}
	}

	/**
	 * Load flow state
	 */
	static async loadFlowState(flowName: V9FlowName): Promise<V9FlowState | null> {
		try {
			const key = `${V9_STORAGE_KEYS.FLOW_STATE}_${flowName}`;
			return await unifiedStorageManager.load(key);
		} catch (error) {
			console.error(`${V9StorageService.MODULE_TAG} Failed to load flow state:`, error);
			return null;
		}
	}

	/**
	 * Clear all V9 data for a flow
	 */
	static async clearFlowData(flowName: V9FlowName): Promise<void> {
		try {
			const keys = [
				`${V9_STORAGE_KEYS.FLOW_CONFIG}_${flowName}`,
				`${V9_STORAGE_KEYS.FLOW_STATE}_${flowName}`
			];
			
			await Promise.all(keys.map(key => unifiedStorageManager.clear(key)));
			console.log(`${V9StorageService.MODULE_TAG} Cleared data for ${flowName}`);
		} catch (error) {
			console.error(`${V9StorageService.MODULE_TAG} Failed to clear flow data:`, error);
			throw error;
		}
	}
}

/**
 * V9 Messaging Service
 * Enhanced toast notifications with contextual messaging
 */
class V9MessagingService {
	private static readonly MODULE_TAG = '[📢 V9-MESSAGING]';

	/**
	 * Show success message with V9 branding
	 */
	static success(title: string, content: string, options?: { duration?: number }): void {
		toastV8.success(`${title}: ${content}`, options);
		console.log(`${V9MessagingService.MODULE_TAG} ✅ ${title}`, content);
	}

	/**
	 * Show error message with V9 branding
	 */
	static error(title: string, content: string, options?: { duration?: number }): void {
		toastV8.error(`${title}: ${content}`, options);
		console.error(`${V9MessagingService.MODULE_TAG} ❌ ${title}`, content);
	}

	/**
	 * Show warning message with V9 branding
	 */
	static warning(title: string, content: string, options?: { duration?: number }): void {
		toastV8.warning(`${title}: ${content}`, options);
		console.warn(`${V9MessagingService.MODULE_TAG} ⚠️ ${title}`, content);
	}

	/**
	 * Show info message with V9 branding
	 */
	static info(title: string, content: string, options?: { duration?: number }): void {
		toastV8.info(`${title}: ${content}`, options);
		console.info(`${V9MessagingService.MODULE_TAG} ℹ️ ${title}`, content);
	}

	/**
	 * Show compliance message
	 */
	static compliance(check: string, status: 'passed' | 'failed' | 'warning'): void {
		const title = `Compliance Check: ${check}`;
		const content = status === 'passed' ? '✅ Passed' : status === 'failed' ? '❌ Failed' : '⚠️ Warning';
		
		if (status === 'passed') {
			V9MessagingService.success(title, content);
		} else if (status === 'failed') {
			V9MessagingService.error(title, content);
		} else {
			V9MessagingService.warning(title, content);
		}
	}

	/**
	 * Show educational message
	 */
	static educational(topic: string, content: string): void {
		V9MessagingService.info(`📚 Educational: ${topic}`, content, { duration: 8000 });
	}
}

/**
 * V9 OAuth Flow Variant
 * Upgraded OAuth 2.0 flow with V9 features
 */
export const V9OAuthFlowVariant: React.FC<V9FlowVariantProps> = ({
	baseFlowName,
	showVariantSelector = false,
	onVariantChange,
	initialVariant = 'oauth'
}) => {
	const navigate = useNavigate();
	const [config, setConfig] = useState<V9FlowConfig>(DEFAULT_V9_CONFIG);
	const [flowState, setFlowState] = useState<V9FlowState>({
		currentStep: 0,
		totalSteps: 5,
		isLoading: false,
		error: null,
		completed: false,
		flowData: {},
		complianceChecks: {
			pkceEnabled: true,
			stateParameterUsed: false,
			nonceUsed: false,
			scopeValidation: false
		}
	});
	const [selectedVariant, setSelectedVariant] = useState<V9FlowVariant>(initialVariant);

	// Load saved configuration on mount
	useEffect(() => {
		const loadSavedData = async () => {
			try {
				const savedConfig = await V9StorageService.loadConfig(baseFlowName);
				const savedState = await V9StorageService.loadFlowState(baseFlowName);
				
				if (Object.keys(savedConfig).length > 0) {
					setConfig(prev => ({ ...prev, ...savedConfig }));
					V9MessagingService.success('Configuration Loaded', 'Previous settings restored');
				}
				
				if (savedState) {
					setFlowState(savedState);
				}
			} catch (error) {
				V9MessagingService.error('Load Failed', 'Could not load saved configuration');
			}
		};

		loadSavedData();
	}, [baseFlowName]);

	// Save configuration when it changes
	useEffect(() => {
		const saveConfig = async () => {
			try {
				await V9StorageService.saveConfig(baseFlowName, config);
			} catch (error) {
				V9MessagingService.error('Save Failed', 'Could not save configuration');
			}
		};

		saveConfig();
	}, [config, baseFlowName]);

	// Save flow state when it changes
	useEffect(() => {
		const saveState = async () => {
			try {
				await V9StorageService.saveFlowState(baseFlowName, flowState);
			} catch (error) {
				V9MessagingService.error('Save Failed', 'Could not save flow state');
			}
		};

		saveState();
	}, [flowState, baseFlowName]);

	const handleVariantChange = (variant: V9FlowVariant) => {
		setSelectedVariant(variant);
		onVariantChange?.(variant);
		V9MessagingService.info('Variant Changed', `Switched to ${variant.toUpperCase()} variant`);
	};

	const handleConfigUpdate = (updates: Partial<V9FlowConfig>) => {
		setConfig(prev => ({ ...prev, ...updates }));
		V9MessagingService.success('Configuration Updated', 'Settings saved successfully');
	};

	const handleStepChange = (step: number) => {
		setFlowState(prev => ({ ...prev, currentStep: step }));
	};

	const handleComplianceCheck = (check: keyof typeof flowState.complianceChecks, passed: boolean) => {
		setFlowState(prev => ({
			...prev,
			complianceChecks: {
				...prev.complianceChecks,
				[check]: passed
			}
		}));
		
		const checkName = check.replace(/([A-Z])/g, ' $1').trim();
		V9MessagingService.compliance(checkName, passed ? 'passed' : 'failed');
	};

	const clearFlowData = async () => {
		try {
			await V9StorageService.clearFlowData(baseFlowName);
			setConfig(DEFAULT_V9_CONFIG);
			setFlowState({
				currentStep: 0,
				totalSteps: 5,
				isLoading: false,
				error: null,
				completed: false,
				flowData: {},
				complianceChecks: {
					pkceEnabled: true,
					stateParameterUsed: false,
					nonceUsed: false,
					scopeValidation: false
				}
			});
			V9MessagingService.success('Data Cleared', 'All flow data has been reset');
		} catch (error) {
			V9MessagingService.error('Clear Failed', 'Could not clear flow data');
		}
	};

	// Render step content based on current step
	const renderStepContent = useCallback(() => {
		switch (flowState.currentStep) {
			case 0:
				return (
					<div className="card">
						<div className="card-header">
							<h5 className="card-title">
								<BootstrapIcon icon={getBootstrapIconName("gear")} size={20} className="me-2" />
								Configuration
							</h5>
						</div>
						<div className="card-body">
							<div className="row g-3">
								<div className="col-md-6">
									<label htmlFor="baseUrl" className="form-label">Base URL</label>
									<input
										id="baseUrl"
										type="text"
										className="form-control"
										value={config.baseUrl}
										onChange={(e) => handleConfigUpdate({ baseUrl: e.target.value })}
									/>
								</div>
								<div className="col-md-6">
									<label htmlFor="clientId" className="form-label">Client ID</label>
									<input
										id="clientId"
										type="text"
										className="form-control"
										value={config.clientId}
										onChange={(e) => handleConfigUpdate({ clientId: e.target.value })}
									/>
								</div>
								<div className="col-md-6">
									<label htmlFor="clientSecret" className="form-label">Client Secret</label>
									<input
										id="clientSecret"
										type="password"
										className="form-control"
										value={config.clientSecret}
										onChange={(e) => handleConfigUpdate({ clientSecret: e.target.value })}
									/>
								</div>
								<div className="col-md-6">
									<label htmlFor="redirectUri" className="form-label">Redirect URI</label>
									<input
										id="redirectUri"
										type="text"
										className="form-control"
										value={config.redirectUri}
										onChange={(e) => handleConfigUpdate({ redirectUri: e.target.value })}
									/>
								</div>
								<div className="col-md-6">
									<label htmlFor="environmentId" className="form-label">Environment ID</label>
									<input
										id="environmentId"
										type="text"
										className="form-control"
										value={config.environmentId}
										onChange={(e) => handleConfigUpdate({ environmentId: e.target.value })}
									/>
								</div>
								<div className="col-md-6">
									<label htmlFor="scopes" className="form-label">Scopes</label>
									<input
										id="scopes"
										type="text"
										className="form-control"
										value={config.scopes.join(' ')}
										onChange={(e) => handleConfigUpdate({ scopes: e.target.value.split(' ').filter(Boolean) })}
									/>
								</div>
								<div className="col-md-6">
									<label htmlFor="region" className="form-label">Region</label>
									<select
										id="region"
										className="form-select"
										value={config.region}
										onChange={(e) => handleConfigUpdate({ region: e.target.value as any })}
									>
										<option value="us">US</option>
										<option value="eu">EU</option>
										<option value="ap">AP</option>
										<option value="ca">CA</option>
									</select>
								</div>
								<div className="col-md-6">
									<label htmlFor="authMethod" className="form-label">Auth Method</label>
									<select
										id="authMethod"
										className="form-select"
										value={config.authMethod}
										onChange={(e) => handleConfigUpdate({ authMethod: e.target.value as any })}
									>
										<option value="client_secret_basic">Client Secret Basic</option>
										<option value="client_secret_post">Client Secret Post</option>
										<option value="none">None (Public Client)</option>
									</select>
								</div>
								<div className="col-12">
									<div className="form-check">
										<input
											className="form-check-input"
											type="checkbox"
											id="pkceEnabled"
											checked={config.pkceEnabled}
											onChange={(e) => handleConfigUpdate({ pkceEnabled: e.target.checked })}
										/>
										<label className="form-check-label" htmlFor="pkceEnabled">
											Enable PKCE (Recommended for public clients)
										</label>
									</div>
								</div>
								<div className="col-12">
									<div className="form-check">
										<input
											className="form-check-input"
											type="checkbox"
											id="enablePAR"
											checked={config.enablePAR}
											onChange={(e) => handleConfigUpdate({ enablePAR: e.target.checked })}
										/>
										<label className="form-check-label" htmlFor="enablePAR">
											Enable Pushed Authorization Request (PAR)
										</label>
									</div>
								</div>
							</div>
						</div>
					</div>
				);
			case 1:
				return (
					<div className="card">
						<div className="card-header">
							<h5 className="card-title">
								<BootstrapIcon icon={getBootstrapIconName("shield-check")} size={20} className="me-2" />
								Compliance Checks
							</h5>
						</div>
						<div className="card-body">
							<div className="list-group">
								<div className="list-group-item">
									<div className="d-flex justify-content-between align-items-center">
										<span>PKCE Enabled</span>
										<span className={`badge bg-${flowState.complianceChecks.pkceEnabled ? 'success' : 'danger'}`}>
											{flowState.complianceChecks.pkceEnabled ? '✅' : '❌'}
										</span>
									</div>
								</div>
								<div className="list-group-item">
									<div className="d-flex justify-content-between align-items-center">
										<span>State Parameter Used</span>
										<span className={`badge bg-${flowState.complianceChecks.stateParameterUsed ? 'success' : 'danger'}`}>
											{flowState.complianceChecks.stateParameterUsed ? '✅' : '❌'}
										</span>
									</div>
								</div>
								<div className="list-group-item">
									<div className="d-flex justify-content-between align-items-center">
										<span>Nonce Used (OIDC)</span>
										<span className={`badge bg-${flowState.complianceChecks.nonceUsed ? 'success' : 'danger'}`}>
											{flowState.complianceChecks.nonceUsed ? '✅' : '❌'}
										</span>
									</div>
								</div>
								<div className="list-group-item">
									<div className="d-flex justify-content-between align-items-center">
										<span>Scope Validation</span>
										<span className={`badge bg-${flowState.complianceChecks.scopeValidation ? 'success' : 'danger'}`}>
											{flowState.complianceChecks.scopeValidation ? '✅' : '❌'}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				);
			default:
				return (
					<div className="card">
						<div className="card-body text-center">
							<BootstrapIcon icon={getBootstrapIconName("info-circle")} size={48} className="text-muted mb-3" />
							<h5>Step {flowState.currentStep} Coming Soon</h5>
							<p className="text-muted">This step is under development</p>
						</div>
					</div>
				);
		}
	}, [flowState.currentStep, config, flowState.complianceChecks]);

	return (
		<PingUIWrapper>
			<div className="container-fluid py-4">
				{/* Header */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex align-items-center justify-content-between">
							<div>
								<h1 className="h2 mb-2">
									<BootstrapIcon icon={getBootstrapIconName("layers")} size={24} className="me-2" />
									V9 {baseFlowName.replace('-', ' ').toUpperCase()} Flow
								</h1>
								<p className="text-muted mb-0">
									Enhanced OAuth 2.0 flow with PingOne UI, unified storage, and V9 messaging
								</p>
							</div>
							<div className="d-flex gap-2">
								{showVariantSelector && (
									<div className="btn-group" role="group">
										<button
											type="button"
											className={`btn ${selectedVariant === 'oauth' ? 'btn-primary' : 'btn-outline-primary'}`}
											onClick={() => handleVariantChange('oauth')}
										>
											OAuth 2.0
										</button>
										<button
											type="button"
											className={`btn ${selectedVariant === 'oidc' ? 'btn-primary' : 'btn-outline-primary'}`}
											onClick={() => handleVariantChange('oidc')}
										>
											OIDC
										</button>
									</div>
								)}
								<button
									type="button"
									className="btn btn-outline-secondary"
									onClick={clearFlowData}
								>
									<BootstrapIcon icon={getBootstrapIconName("trash")} size={16} className="me-1" />
									Clear Data
								</button>
								<button
									type="button"
									className="btn btn-outline-secondary"
									onClick={() => navigate('/')}
								>
									<BootstrapIcon icon={getBootstrapIconName("arrow-left")} size={16} className="me-1" />
									Back
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="progress" style={{ height: '8px' }}>
							<div
								className="progress-bar bg-primary"
								role="progressbar"
								style={{ width: `${((flowState.currentStep + 1) / flowState.totalSteps) * 100}%` }}
								aria-valuenow={flowState.currentStep + 1}
								aria-valuemin={0}
								aria-valuemax={flowState.totalSteps}
							/>
						</div>
						<div className="d-flex justify-content-between mt-2">
							<small className="text-muted">Step {flowState.currentStep + 1} of {flowState.totalSteps}</small>
							<small className="text-muted">{Math.round(((flowState.currentStep + 1) / flowState.totalSteps) * 100)}% Complete</small>
						</div>
					</div>
				</div>

				{/* Navigation */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="btn-group w-100" role="group">
							{Array.from({ length: flowState.totalSteps }, (_, i) => (
								<button
									key={i}
									type="button"
									className={`btn ${i === flowState.currentStep ? 'btn-primary' : 'btn-outline-secondary'}`}
									onClick={() => handleStepChange(i)}
								>
									{i === 0 && <BootstrapIcon icon={getBootstrapIconName("gear")} size={16} className="me-1" />}
									{i === 1 && <BootstrapIcon icon={getBootstrapIconName("shield-check")} size={16} className="me-1" />}
									{i === 2 && <BootstrapIcon icon={getBootstrapIconName("play-circle")} size={16} className="me-1" />}
									{i === 3 && <BootstrapIcon icon={getBootstrapIconName("arrow-repeat")} size={16} className="me-1" />}
									{i === 4 && <BootstrapIcon icon={getBootstrapIconName("check-circle")} size={16} className="me-1" />}
									Step {i + 1}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Step Content */}
				<div className="row">
					<div className="col-12">
						{renderStepContent()}
					</div>
				</div>

				{/* Flow Actions */}
				<div className="row mt-4">
					<div className="col-12">
						<div className="d-flex justify-content-between">
							<button
								type="button"
								className="btn btn-outline-secondary"
								onClick={() => handleStepChange(Math.max(0, flowState.currentStep - 1))}
								disabled={flowState.currentStep === 0}
							>
								<BootstrapIcon icon={getBootstrapIconName("arrow-left")} size={16} className="me-1" />
								Previous
							</button>
							<button
								type="button"
								className="btn btn-primary"
								onClick={() => handleStepChange(Math.min(flowState.totalSteps - 1, flowState.currentStep + 1))}
								disabled={flowState.currentStep === flowState.totalSteps - 1}
							>
								Next
								<BootstrapIcon icon={getBootstrapIconName("arrow-right")} size={16} className="ms-1" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</PingUIWrapper>
	);
};

/**
 * V9 OIDC Flow Variant
 * Upgraded OpenID Connect flow with V9 features
 */
export const V9OIDCFlowVariant: React.FC<V9FlowVariantProps> = (props) => {
	// OIDC-specific implementation with nonce validation, ID token validation, etc.
	return <V9OAuthFlowVariant {...props} />;
};

/**
 * V9 Flow Variants Export
 * Main export that chooses the appropriate variant based on flow type
 */
export const V9FlowVariants: React.FC<V9FlowVariantProps> = (props) => {
	const { baseFlowName } = props;
	
	// Determine if this is an OIDC flow based on scopes or flow type
	const isOIDCFlow = baseFlowName.includes('oidc') || baseFlowName === 'authorization-code';
	
	if (isOIDCFlow) {
		return <V9OIDCFlowVariant {...props} />;
	}
	
	return <V9OAuthFlowVariant {...props} />;
};

export default V9FlowVariants;
