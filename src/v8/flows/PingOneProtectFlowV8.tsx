/**
 * @file PingOneProtectFlowV8.tsx
 * @module v8/flows
 * @description PingOne Protect API Integration Flow - Demonstrates how to integrate PingOne Protect APIs into your application
 * @version 8.1.0
 * @since 2024-12-01
 *
 * This flow demonstrates how to integrate PingOne Protect APIs for risk evaluation and fraud detection
 * in your own application. It shows real-world implementation patterns for:
 * - Risk evaluation during authentication flows
 * - Risk policy management
 * - Risk predictor configuration
 * - Event feedback and learning
 * - Integration with existing authentication systems
 *
 * @example
 * <PingOneProtectFlowV8 />
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiActivity,
	FiAlertTriangle,
	FiCheckCircle,
	FiDatabase,
	FiSettings,
	FiTrendingUp,
	FiXCircle,
} from 'react-icons/fi';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import uiNotificationServiceV8 from '@/v8/services/uiNotificationServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';

// Types for PingOne Protect
interface ProtectCredentials {
	environmentId: string;
	workerToken: string;
	region: 'us' | 'eu' | 'ap' | 'ca';
}

interface RiskEvaluationEvent {
	ip: string;
	user: {
		id: string;
		name?: string;
		type: 'PING_ONE' | 'EXTERNAL';
		groups?: Array<{ name: string }>;
	};
	targetResource?: {
		id?: string;
		name?: string;
	};
	browser?: {
		userAgent: string;
		cookie?: string;
	};
	device?: {
		externalId?: string;
	};
	session?: {
		id?: string;
	};
	flow: {
		type: 'REGISTRATION' | 'AUTHENTICATION' | 'ACCESS' | 'AUTHORIZATION' | 'TRANSACTION';
		subtype?: string;
	};
	origin?: string;
	sdk?: {
		name?: string;
		version?: string;
		signals?: {
			data?: Record<string, unknown>;
		};
	};
}

interface RiskEvaluationResult {
	id: string;
	environment: { id: string };
	riskPolicySet: {
		id: string;
		name: string;
		targeted: boolean;
	};
	result: {
		level: 'LOW' | 'MEDIUM' | 'HIGH';
		recommendedAction: string;
		type: 'VALUE';
	};
	details: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

interface RiskPolicy {
	id: string;
	name: string;
	description?: string;
	targeted: boolean;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
}

const MODULE_TAG = '[🛡️ PROTECT-FLOW-V8]';
const FLOW_KEY = 'protect-flow-v8';

// Risk level colors and actions
const RISK_LEVEL_CONFIG = {
	LOW: {
		color: '#10b981',
		bgColor: '#f0fdf4',
		borderColor: '#86efac',
		icon: FiCheckCircle,
		action: 'ALLOW',
		description: 'Low risk - Allow access',
	},
	MEDIUM: {
		color: '#f59e0b',
		bgColor: '#fffbeb',
		borderColor: '#fcd34d',
		icon: FiAlertTriangle,
		action: 'CHALLENGE',
		description: 'Medium risk - Require additional verification',
	},
	HIGH: {
		color: '#ef4444',
		bgColor: '#fef2f2',
		borderColor: '#fca5a5',
		icon: FiXCircle,
		action: 'BLOCK',
		description: 'High risk - Block access',
	},
} as const;

type RiskLevel = keyof typeof RISK_LEVEL_CONFIG;

export const PingOneProtectFlowV8: React.FC = () => {
	// Worker token state
	const [tokenStatus, setTokenStatus] = useState(() => {
		return workerTokenServiceV8.checkWorkerTokenStatus();
	});
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Worker Token Settings - Load from config service
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval || false;
		} catch {
			return false;
		}
	});
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd || true;
		} catch {
			return true;
		}
	});

	// Listen for config updates
	useEffect(() => {
		const handleConfigUpdate = (event: CustomEvent) => {
			if (event.detail?.workerToken) {
				setSilentApiRetrieval(event.detail.workerToken.silentApiRetrieval || false);
				setShowTokenAtEnd(event.detail.workerToken.showTokenAtEnd !== false);
			}
		};
		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		return () => {
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		};
	}, []);

	// Credentials state
	const [credentials, setCredentials] = useState<ProtectCredentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oauth', // Use existing flow type
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});
		return {
			environmentId: stored.environmentId || '',
			workerToken: stored.workerToken || '',
			region: (stored.region as ProtectCredentials['region']) || 'us',
		};
	});

	// Flow state
	const [currentStep, setCurrentStep] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [apiResponses, setApiResponses] = useState<
		Array<{ id: string; data: unknown; timestamp: number }>
	>([]);

	// Risk evaluation state
	const [riskEvaluation, setRiskEvaluation] = useState<RiskEvaluationResult | null>(null);
	const [riskPolicies, setRiskPolicies] = useState<RiskPolicy[]>([]);
	const [evaluationEvent, setEvaluationEvent] = useState<Partial<RiskEvaluationEvent>>({
		ip: '192.168.1.100',
		user: {
			id: 'user-12345',
			name: 'John Doe',
			type: 'EXTERNAL',
		},
		targetResource: {
			name: 'My Application',
		},
		browser: {
			userAgent: navigator.userAgent,
		},
		flow: {
			type: 'AUTHENTICATION',
			subtype: 'USER_PASSWORD',
		},
	});

	// Update token status
	useEffect(() => {
		const updateTokenStatus = () => {
			setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
		};

		updateTokenStatus();
		window.addEventListener('workerTokenUpdated', updateTokenStatus);
		return () => window.removeEventListener('workerTokenUpdated', updateTokenStatus);
	}, []);

	// Sync credentials from storage
	useEffect(() => {
		const syncCredentials = () => {
			const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
				flowKey: FLOW_KEY,
				flowType: 'protect',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});
			setCredentials({
				environmentId: stored.environmentId || '',
				workerToken: stored.workerToken || '',
				region: (stored.region as ProtectCredentials['region']) || 'us',
			});
		};

		syncCredentials();
		window.addEventListener('storage', syncCredentials);
		return () => window.removeEventListener('storage', syncCredentials);
	}, []);

	// Save credentials when they change
	useEffect(() => {
		const saveTimeout = setTimeout(() => {
			CredentialsServiceV8.saveCredentials(
				FLOW_KEY,
				credentials as Credentials & { flowType?: string }
			);
		}, 300);
		return () => clearTimeout(saveTimeout);
	}, [credentials]);

	// API call helper
	const makeApiCall = useCallback(
		async (
			method: string,
			endpoint: string,
			body?: Record<string, unknown>,
			description?: string
		) => {
			if (!credentials.environmentId || !credentials.workerToken) {
				uiNotificationServiceV8.showError('Please configure environment ID and worker token first');
				throw new Error('Missing credentials');
			}

			setIsLoading(true);
			const startTime = Date.now();

			try {
				const url = `/api/pingone/protect${endpoint}`;

				const callId = apiCallTrackerService.trackApiCall({
					method: method as 'GET' | 'POST' | 'PATCH' | 'DELETE',
					url,
					headers: {
						'Content-Type': 'application/json',
					},
					body: body || null,
					step: description || 'Protect API Call',
				});

				const requestBody = body
					? JSON.stringify({
							...body,
							environmentId: credentials.environmentId,
							workerToken: credentials.workerToken,
							region: credentials.region,
						})
					: undefined;

				const response = await fetch(url, {
					method,
					headers: {
						'Content-Type': 'application/json',
					},
					body: requestBody || null,
				});

				const responseClone = response.clone();
				let data: unknown;

				try {
					data = await responseClone.json();
				} catch {
					const text = await response.text();
					data = { error: 'Failed to parse response', rawResponse: text.substring(0, 500) };
				}

				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: response.status,
						statusText: response.statusText,
						headers: Object.fromEntries(response.headers.entries()),
						data,
					},
					Date.now() - startTime
				);

				// Store response for display
				setApiResponses((prev) =>
					[
						...prev,
						{
							id: callId,
							data,
							timestamp: Date.now(),
						},
					].slice(-5)
				); // Keep last 5 responses

				if (!response.ok) {
					const errorData = data as Record<string, unknown>;
					throw new Error(
						`API Error: ${response.status} ${response.statusText} - ${errorData.message || errorData.error || 'Unknown error'}`
					);
				}

				return data;
			} finally {
				setIsLoading(false);
			}
		},
		[credentials]
	);

	// API Methods
	const fetchRiskPolicies = useCallback(async () => {
		try {
			const data = await makeApiCall('GET', '/risk-policies', undefined, 'Fetch Risk Policies');
			const policies =
				(data as { _embedded?: { riskPolicySets: RiskPolicy[] } })._embedded?.riskPolicySets || [];
			setRiskPolicies(policies);
			uiNotificationServiceV8.showSuccess(`Loaded ${policies.length} risk policies`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to fetch risk policies:`, error);
			uiNotificationServiceV8.showError('Failed to fetch risk policies');
		}
	}, [makeApiCall]);

	const createRiskEvaluation = useCallback(async () => {
		try {
			if (!evaluationEvent.ip || !evaluationEvent.user?.id) {
				uiNotificationServiceV8.showError(
					'IP address and User ID are required for risk evaluation'
				);
				return;
			}

			const data = await makeApiCall(
				'POST',
				'/risk-evaluations',
				{ event: evaluationEvent },
				'Create Risk Evaluation'
			);
			setRiskEvaluation(data as RiskEvaluationResult);

			const riskLevel = (data as RiskEvaluationResult).result.level;
			uiNotificationServiceV8.showSuccess(`Risk evaluation completed: ${riskLevel} risk`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to create risk evaluation:`, error);
			uiNotificationServiceV8.showError('Failed to create risk evaluation');
		}
	}, [makeApiCall, evaluationEvent]);

	const updateRiskEvaluation = useCallback(
		async (evaluationId: string, completionStatus: 'SUCCESS' | 'FAILED') => {
			try {
				const data = await makeApiCall(
					'PATCH',
					`/risk-evaluations/${evaluationId}`,
					{ completionStatus },
					'Update Risk Evaluation'
				);
				uiNotificationServiceV8.showSuccess(`Risk evaluation updated: ${completionStatus}`);
				return data;
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to update risk evaluation:`, error);
				uiNotificationServiceV8.showError('Failed to update risk evaluation');
				return null;
			}
		},
		[makeApiCall]
	);

	const provideFeedback = useCallback(
		async (evaluationId: string, feedback: 'POSITIVE' | 'NEGATIVE') => {
			try {
				const data = await makeApiCall(
					'POST',
					`/risk-evaluations/${evaluationId}/feedback`,
					{ feedback },
					'Provide Risk Evaluation Feedback'
				);
				uiNotificationServiceV8.showSuccess(`Feedback provided: ${feedback}`);
				return data;
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to provide feedback:`, error);
				uiNotificationServiceV8.showError('Failed to provide feedback');
				return null;
			}
		},
		[makeApiCall]
	);

	// Step handlers
	const handleNext = () => {
		if (currentStep < 4) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	// Render helpers
	const renderRiskLevelBadge = (level: RiskLevel) => {
		const config = RISK_LEVEL_CONFIG[level];
		const Icon = config.icon;

		return (
			<div
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: '8px',
					padding: '8px 16px',
					background: config.bgColor,
					border: `2px solid ${config.borderColor}`,
					borderRadius: '8px',
					color: config.color,
					fontWeight: '600',
				}}
			>
				<Icon size={16} />
				<span>{level}</span>
			</div>
		);
	};

	const renderStep1 = () => (
		<div style={{ padding: '24px' }}>
			<h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
				<FiSettings size={24} />
				Configuration
			</h3>

			<div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
				<div>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
						Environment ID
					</label>
					<input
						type="text"
						value={credentials.environmentId}
						onChange={(e) => setCredentials((prev) => ({ ...prev, environmentId: e.target.value }))}
						placeholder="your-environment-id"
						style={{
							width: '100%',
							padding: '12px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							fontSize: '14px',
						}}
					/>
				</div>

				<div>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Region</label>
					<select
						value={credentials.region}
						onChange={(e) =>
							setCredentials((prev) => ({
								...prev,
								region: e.target.value as ProtectCredentials['region'],
							}))
						}
						style={{
							width: '100%',
							padding: '12px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							fontSize: '14px',
						}}
					>
						<option value="us">United States</option>
						<option value="eu">Europe</option>
						<option value="ap">Asia Pacific</option>
						<option value="ca">Canada</option>
					</select>
				</div>

				<div>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: '8px',
						}}
					>
						<label style={{ fontWeight: '600' }}>Worker Token Status</label>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							{tokenStatus.isValid ? (
								<FiCheckCircle color="#10b981" size={16} />
							) : (
								<FiXCircle color="#ef4444" size={16} />
							)}
							<span
								style={{ fontSize: '14px', color: tokenStatus.isValid ? '#10b981' : '#ef4444' }}
							>
								{tokenStatus.isValid ? 'Valid' : 'Invalid'}
							</span>
						</div>
					</div>
					<button
						type="button"
						onClick={async () => {
							// Pass current checkbox values to override config (page checkboxes take precedence)
							// forceShowModal=true because user explicitly clicked the button - always show modal
							const { handleShowWorkerTokenModal } = await import(
								'@/v8/utils/workerTokenModalHelperV8'
							);
							await handleShowWorkerTokenModal(
								setShowWorkerTokenModal,
								setTokenStatus,
								silentApiRetrieval, // Page checkbox value takes precedence
								showTokenAtEnd, // Page checkbox value takes precedence
								true // Force show modal - user clicked button
							);
						}}
						style={{
							padding: '12px 16px',
							background: tokenStatus.isValid ? '#10b981' : '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
							fontSize: '14px',
							fontWeight: '600',
						}}
					>
						Get worker token
					</button>
				</div>

				{/* Worker Token Settings Checkboxes */}
				<div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
					<label
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							cursor: 'pointer',
							userSelect: 'none',
							padding: '8px',
							borderRadius: '6px',
							transition: 'background-color 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = '#f3f4f6';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'transparent';
						}}
					>
						<input
							type="checkbox"
							checked={silentApiRetrieval}
							onChange={async (e) => {
								const newValue = e.target.checked;
								setSilentApiRetrieval(newValue);
								// Update config service immediately (no cache)
								const config = MFAConfigurationServiceV8.loadConfiguration();
								config.workerToken.silentApiRetrieval = newValue;
								MFAConfigurationServiceV8.saveConfiguration(config);
								// Dispatch event to notify other components
								window.dispatchEvent(
									new CustomEvent('mfaConfigurationUpdated', {
										detail: { workerToken: config.workerToken },
									})
								);
								toastV8.info(`Silent API Token Retrieval set to: ${newValue}`);

								// If enabling silent retrieval and token is missing/expired, attempt silent retrieval now
								if (newValue) {
									const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
									if (!currentStatus.isValid) {
										console.log(
											'[PINGONE-PROTECT-FLOW-V8] Silent API retrieval enabled, attempting to fetch token now...'
										);
										const { handleShowWorkerTokenModal } = await import(
											'@/v8/utils/workerTokenModalHelperV8'
										);
										await handleShowWorkerTokenModal(
											setShowWorkerTokenModal,
											setTokenStatus,
											newValue, // Use new value
											showTokenAtEnd,
											false // Not forced - respect silent setting
										);
									}
								}
							}}
							style={{
								width: '20px',
								height: '20px',
								cursor: 'pointer',
								accentColor: '#6366f1',
								flexShrink: 0,
							}}
						/>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
							<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
								Silent API Token Retrieval
							</span>
							<span style={{ fontSize: '12px', color: '#6b7280' }}>
								Automatically fetch worker token in the background without showing modals
							</span>
						</div>
					</label>

					<label
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							cursor: 'pointer',
							userSelect: 'none',
							padding: '8px',
							borderRadius: '6px',
							transition: 'background-color 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = '#f3f4f6';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'transparent';
						}}
					>
						<input
							type="checkbox"
							checked={showTokenAtEnd}
							onChange={async (e) => {
								const newValue = e.target.checked;
								setShowTokenAtEnd(newValue);
								// Update config service immediately (no cache)
								const config = MFAConfigurationServiceV8.loadConfiguration();
								config.workerToken.showTokenAtEnd = newValue;
								MFAConfigurationServiceV8.saveConfiguration(config);
								// Dispatch event to notify other components
								window.dispatchEvent(
									new CustomEvent('mfaConfigurationUpdated', {
										detail: { workerToken: config.workerToken },
									})
								);
								toastV8.info(`Show Token After Generation set to: ${newValue}`);
							}}
							style={{
								width: '20px',
								height: '20px',
								cursor: 'pointer',
								accentColor: '#6366f1',
								flexShrink: 0,
							}}
						/>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
							<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
								Show Token After Generation
							</span>
							<span style={{ fontSize: '12px', color: '#6b7280' }}>
								Display the generated worker token in a modal after successful retrieval
							</span>
						</div>
					</label>
				</div>
			</div>
		</div>
	);

	const renderStep2 = () => (
		<div style={{ padding: '24px' }}>
			<h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
				<FiDatabase size={24} />
				Risk Policies
			</h3>

			<div style={{ marginBottom: '24px' }}>
				<button
					type="button"
					onClick={fetchRiskPolicies}
					disabled={isLoading || !tokenStatus.isValid}
					style={{
						padding: '12px 24px',
						background: '#3b82f6',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						cursor: isLoading || !tokenStatus.isValid ? 'not-allowed' : 'pointer',
						fontSize: '14px',
						fontWeight: '600',
						opacity: isLoading || !tokenStatus.isValid ? 0.5 : 1,
					}}
				>
					{isLoading ? 'Loading...' : 'Fetch Risk Policies'}
				</button>
			</div>

			{riskPolicies.length > 0 && (
				<div style={{ display: 'grid', gap: '16px' }}>
					<h4>Available Risk Policies ({riskPolicies.length})</h4>
					{riskPolicies.map((policy) => (
						<div
							key={policy.id}
							style={{
								padding: '16px',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								background: 'white',
							}}
						>
							<div
								style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
							>
								<div>
									<h5 style={{ margin: '0 0 8px 0', color: '#374151' }}>{policy.name}</h5>
									{policy.description && (
										<p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
											{policy.description}
										</p>
									)}
									<div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
										<span style={{ color: policy.enabled ? '#10b981' : '#ef4444' }}>
											{policy.enabled ? 'Enabled' : 'Disabled'}
										</span>
										<span style={{ color: '#6b7280' }}>
											{policy.targeted ? 'Targeted' : 'Default'}
										</span>
									</div>
								</div>
								<div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {policy.id}</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);

	const renderStep3 = () => (
		<div style={{ padding: '24px' }}>
			<h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
				<FiActivity size={24} />
				Risk Evaluation
			</h3>

			<div style={{ display: 'grid', gap: '20px', maxWidth: '800px' }}>
				<div>
					<h4 style={{ marginBottom: '16px' }}>Event Configuration</h4>
					<div style={{ display: 'grid', gap: '16px' }}>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
									IP Address *
								</label>
								<input
									type="text"
									value={evaluationEvent.ip || ''}
									onChange={(e) =>
										setEvaluationEvent((prev) => ({
											...prev,
											ip: e.target.value,
										}))
									}
									placeholder="192.168.1.100"
									style={{
										width: '100%',
										padding: '12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
									}}
								/>
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
									User ID *
								</label>
								<input
									type="text"
									value={evaluationEvent.user?.id || ''}
									onChange={(e) =>
										setEvaluationEvent((prev) => ({
											...prev,
											user: { ...prev.user!, id: e.target.value },
										}))
									}
									placeholder="user-12345"
									style={{
										width: '100%',
										padding: '12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
									}}
								/>
							</div>
						</div>

						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
									User Name
								</label>
								<input
									type="text"
									value={evaluationEvent.user?.name || ''}
									onChange={(e) =>
										setEvaluationEvent((prev) => ({
											...prev,
											user: { ...prev.user!, name: e.target.value },
										}))
									}
									placeholder="John Doe"
									style={{
										width: '100%',
										padding: '12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
									}}
								/>
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
									User Type
								</label>
								<select
									value={evaluationEvent.user?.type || 'EXTERNAL'}
									onChange={(e) =>
										setEvaluationEvent((prev) => ({
											...prev,
											user: { ...prev.user!, type: e.target.value as 'PING_ONE' | 'EXTERNAL' },
										}))
									}
									style={{
										width: '100%',
										padding: '12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
									}}
								>
									<option value="EXTERNAL">External</option>
									<option value="PING_ONE">PingOne</option>
								</select>
							</div>
						</div>

						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
									Flow Type
								</label>
								<select
									value={evaluationEvent.flow?.type || 'AUTHENTICATION'}
									onChange={(e) =>
										setEvaluationEvent((prev) => ({
											...prev,
											flow: {
												...prev.flow!,
												type: e.target.value as RiskEvaluationEvent['flow']['type'],
											},
										}))
									}
									style={{
										width: '100%',
										padding: '12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
									}}
								>
									<option value="AUTHENTICATION">Authentication</option>
									<option value="REGISTRATION">Registration</option>
									<option value="ACCESS">Access</option>
									<option value="AUTHORIZATION">Authorization</option>
									<option value="TRANSACTION">Transaction</option>
								</select>
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
									Target Resource
								</label>
								<input
									type="text"
									value={evaluationEvent.targetResource?.name || ''}
									onChange={(e) =>
										setEvaluationEvent((prev) => ({
											...prev,
											targetResource: { ...prev.targetResource!, name: e.target.value },
										}))
									}
									placeholder="My Application"
									style={{
										width: '100%',
										padding: '12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
									}}
								/>
							</div>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
								Browser User Agent
							</label>
							<textarea
								value={evaluationEvent.browser?.userAgent || ''}
								onChange={(e) =>
									setEvaluationEvent((prev) => ({
										...prev,
										browser: { ...prev.browser!, userAgent: e.target.value },
									}))
								}
								placeholder={navigator.userAgent}
								rows={3}
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									resize: 'vertical',
								}}
							/>
						</div>
					</div>
				</div>

				<div>
					<button
						type="button"
						onClick={createRiskEvaluation}
						disabled={isLoading || !tokenStatus.isValid}
						style={{
							padding: '12px 24px',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: isLoading || !tokenStatus.isValid ? 'not-allowed' : 'pointer',
							fontSize: '14px',
							fontWeight: '600',
							opacity: isLoading || !tokenStatus.isValid ? 0.5 : 1,
						}}
					>
						{isLoading ? 'Evaluating...' : 'Create Risk Evaluation'}
					</button>
				</div>

				{riskEvaluation && (
					<div style={{ marginTop: '24px' }}>
						<h4>Risk Evaluation Result</h4>
						<div
							style={{
								padding: '20px',
								border: '2px solid #e5e7eb',
								borderRadius: '8px',
								background: 'white',
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'start',
									marginBottom: '16px',
								}}
							>
								<div>
									<div style={{ marginBottom: '12px' }}>
										{renderRiskLevelBadge(riskEvaluation.result.level)}
									</div>
									<p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
										{RISK_LEVEL_CONFIG[riskEvaluation.result.level].description}
									</p>
									<p style={{ margin: '8px 0 0 0', color: '#374151', fontSize: '14px' }}>
										<strong>Recommended Action:</strong> {riskEvaluation.result.recommendedAction}
									</p>
								</div>
								<div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {riskEvaluation.id}</div>
							</div>

							<div style={{ display: 'flex', gap: '12px' }}>
								<button
									type="button"
									onClick={() => updateRiskEvaluation(riskEvaluation.id, 'SUCCESS')}
									style={{
										padding: '8px 16px',
										background: '#10b981',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										fontSize: '12px',
									}}
								>
									Mark as Success
								</button>
								<button
									type="button"
									onClick={() => updateRiskEvaluation(riskEvaluation.id, 'FAILED')}
									style={{
										padding: '8px 16px',
										background: '#ef4444',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										fontSize: '12px',
									}}
								>
									Mark as Failed
								</button>
								<button
									type="button"
									onClick={() => provideFeedback(riskEvaluation.id, 'POSITIVE')}
									style={{
										padding: '8px 16px',
										background: '#3b82f6',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										fontSize: '12px',
									}}
								>
									Positive Feedback
								</button>
								<button
									type="button"
									onClick={() => provideFeedback(riskEvaluation.id, 'NEGATIVE')}
									style={{
										padding: '8px 16px',
										background: '#f59e0b',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										fontSize: '12px',
									}}
								>
									Negative Feedback
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);

	const renderStep4 = () => (
		<div style={{ padding: '24px' }}>
			<h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
				<FiTrendingUp size={24} />
				Integration Patterns
			</h3>

			<div style={{ display: 'grid', gap: '24px' }}>
				<div>
					<h4>Real-World Integration Examples</h4>
					<div style={{ display: 'grid', gap: '16px' }}>
						<div
							style={{
								padding: '16px',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								background: '#f9fafb',
							}}
						>
							<h5 style={{ margin: '0 0 8px 0', color: '#374151' }}>
								Authentication Flow Integration
							</h5>
							<pre
								style={{
									background: '#f3f4f6',
									padding: '12px',
									borderRadius: '4px',
									fontSize: '12px',
									overflow: 'auto',
									margin: '0',
								}}
							>
								{`// Before authentication
const riskResult = await evaluateRisk({
  ip: request.ip,
  user: { id: userId, type: 'EXTERNAL' },
  flow: { type: 'AUTHENTICATION' },
  browser: { userAgent: request.headers['user-agent'] },
  targetResource: { name: 'MyApp' }
});

if (riskResult.result.level === 'HIGH') {
  return blockAccess('High risk detected');
} else if (riskResult.result.level === 'MEDIUM') {
  return requireMFA();
} else {
  return proceedWithAuth();
}

// After authentication (success/failed)
await updateRiskEvaluation(riskResult.id, 
  authSuccess ? 'SUCCESS' : 'FAILED'
);`}
							</pre>
						</div>

						<div
							style={{
								padding: '16px',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								background: '#f9fafb',
							}}
						>
							<h5 style={{ margin: '0 0 8px 0', color: '#374151' }}>Transaction Protection</h5>
							<pre
								style={{
									background: '#f3f4f6',
									padding: '12px',
									borderRadius: '4px',
									fontSize: '12px',
									overflow: 'auto',
									margin: '0',
								}}
							>
								{`// Before high-value transaction
const transactionRisk = await evaluateRisk({
  ip: request.ip,
  user: { id: userId, type: 'PING_ONE' },
  flow: { type: 'TRANSACTION' },
  targetResource: { 
    name: 'Payment', 
    id: transactionId 
  },
  session: { id: sessionId }
});

if (transactionRisk.result.level === 'HIGH') {
  return requireAdditionalVerification();
}

// Process transaction...
await updateRiskEvaluation(transactionRisk.id, 'SUCCESS');`}
							</pre>
						</div>

						<div
							style={{
								padding: '16px',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								background: '#f9fafb',
							}}
						>
							<h5 style={{ margin: '0 0 8px 0', color: '#374151' }}>
								Account Registration Protection
							</h5>
							<pre
								style={{
									background: '#f3f4f6',
									padding: '12px',
									borderRadius: '4px',
									fontSize: '12px',
									overflow: 'auto',
									margin: '0',
								}}
							>
								{`// During user registration
const registrationRisk = await evaluateRisk({
  ip: request.ip,
  user: { 
    id: newUserId, 
    name: email, 
    type: 'EXTERNAL' 
  },
  flow: { type: 'REGISTRATION' },
  browser: { userAgent: request.headers['user-agent'] },
  targetResource: { name: 'Signup' }
});

if (registrationRisk.result.level === 'HIGH') {
  return blockRegistration('Suspicious registration');
} else if (registrationRisk.result.level === 'MEDIUM') {
  return requireEmailVerification();
}

// After successful registration
await updateRiskEvaluation(registrationRisk.id, 'SUCCESS');`}
							</pre>
						</div>
					</div>
				</div>

				<div>
					<h4>Best Practices</h4>
					<ul style={{ margin: '0', paddingLeft: '20px', color: '#374151' }}>
						<li>Always update risk evaluations with completion status (SUCCESS/FAILED)</li>
						<li>Provide feedback when you have definitive knowledge of outcomes</li>
						<li>Use appropriate flow types for better risk modeling</li>
						<li>Include as much context as possible (device, session, browser info)</li>
						<li>Implement gradual security measures based on risk levels</li>
						<li>Monitor and adjust risk policies based on your specific threat landscape</li>
					</ul>
				</div>
			</div>
		</div>
	);

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 0:
				return renderStep1();
			case 1:
				return renderStep2();
			case 2:
				return renderStep3();
			case 3:
				return renderStep4();
			default:
				return renderStep1();
		}
	};

	return (
		<div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
			{/* Header */}
			<div style={{ marginBottom: '32px' }}>
				<h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
					PingOne Protect API Integration
				</h1>
				<p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
					Learn how to integrate PingOne Protect risk evaluation APIs into your application
				</p>
			</div>

			{/* Progress Bar */}
			<div style={{ marginBottom: '32px' }}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '16px',
					}}
				>
					{['Configuration', 'Risk Policies', 'Risk Evaluation', 'Integration'].map(
						(label, index) => (
							<div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<div
									style={{
										width: '32px',
										height: '32px',
										borderRadius: '50%',
										background: index <= currentStep ? '#3b82f6' : '#e5e7eb',
										color: index <= currentStep ? 'white' : '#6b7280',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '14px',
										fontWeight: '600',
									}}
								>
									{index + 1}
								</div>
								<span
									style={{
										fontSize: '14px',
										fontWeight: index === currentStep ? '600' : '400',
										color: index <= currentStep ? '#1f2937' : '#6b7280',
									}}
								>
									{label}
								</span>
							</div>
						)
					)}
				</div>
				<div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px' }}>
					<div
						style={{
							height: '100%',
							background: '#3b82f6',
							borderRadius: '2px',
							width: `${((currentStep + 1) / 4) * 100}%`,
							transition: 'width 0.3s ease',
						}}
					/>
				</div>
			</div>

			{/* Main Content */}
			<div
				style={{
					background: 'white',
					border: '1px solid #e5e7eb',
					borderRadius: '12px',
					marginBottom: '24px',
				}}
			>
				{renderCurrentStep()}
			</div>

			{/* Navigation */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<button
					type="button"
					onClick={handlePrevious}
					disabled={currentStep === 0}
					style={{
						padding: '12px 24px',
						background: currentStep === 0 ? '#f3f4f6' : '#3b82f6',
						color: currentStep === 0 ? '#9ca3af' : 'white',
						border: 'none',
						borderRadius: '6px',
						cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
						fontSize: '14px',
						fontWeight: '600',
					}}
				>
					Previous
				</button>

				<button
					type="button"
					onClick={handleNext}
					disabled={currentStep === 3}
					style={{
						padding: '12px 24px',
						background: currentStep === 3 ? '#f3f4f6' : '#3b82f6',
						color: currentStep === 3 ? '#9ca3af' : 'white',
						border: 'none',
						borderRadius: '6px',
						cursor: currentStep === 3 ? 'not-allowed' : 'pointer',
						fontSize: '14px',
						fontWeight: '600',
					}}
				>
					{currentStep === 3 ? 'Complete' : 'Next'}
				</button>
			</div>

			{/* API Response Display */}
			{apiResponses.length > 0 && (
				<div style={{ marginTop: '32px' }}>
					<h3 style={{ marginBottom: '16px' }}>API Responses</h3>
					<SuperSimpleApiDisplayV8 />
				</div>
			)}

			{/* Worker Token Modal */}
			{showWorkerTokenModal &&
				(() => {
					// Check if we should show token only (matches MFA pattern)
					try {
						const config = MFAConfigurationServiceV8.loadConfiguration();
						const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();

						// Show token-only if showTokenAtEnd is ON and token is valid
						const showTokenOnly = config.workerToken.showTokenAtEnd && tokenStatus.isValid;

						return (
							<WorkerTokenModalV8
								isOpen={showWorkerTokenModal}
								onClose={() => {
									setShowWorkerTokenModal(false);
									// Refresh token status when modal closes (matches MFA pattern)
									setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
								}}
								showTokenOnly={showTokenOnly}
							/>
						);
					} catch {
						return (
							<WorkerTokenModalV8
								isOpen={showWorkerTokenModal}
								onClose={() => {
									setShowWorkerTokenModal(false);
									setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
								}}
							/>
						);
					}
				})()}
		</div>
	);
};

export default PingOneProtectFlowV8;
