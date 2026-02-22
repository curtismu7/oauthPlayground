/**
 * @file PingOneProtectFlowV8.PingUI.tsx
 * @module apps/mfa/flows
 * @description PingOne Protect API Integration Flow - Ping UI migrated
 * @version 8.1.0-PingUI
 * @since 2026-02-21
 *
 * Ping UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 *
 * This flow demonstrates how to integrate PingOne Protect APIs for risk evaluation and fraud detection
 * in your own application. It shows real-world implementation patterns for:
 * - Risk evaluation during authentication flows
 * - Risk policy management
 * - Risk predictor configuration
 * - Event feedback and learning
 * - Integration with existing authentication systems
 */

import React, { useCallback, useEffect, useState } from 'react';
import { usePageScroll } from '@/hooks/usePageScroll';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { useApiDisplayPadding } from '@/v8/hooks/useApiDisplayPadding';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
			role="img"
		></span>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiActivity: 'mdi-activity',
		FiAlertTriangle: 'mdi-alert',
		FiCheckCircle: 'mdi-check-circle',
		FiDatabase: 'mdi-database',
		FiSettings: 'mdi-cog',
		FiTrendingUp: 'mdi-trending-up',
		FiXCircle: 'mdi-close-circle',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

interface RiskEvaluationRequest {
	userId: string;
	sessionId: string;
	ipAddress: string;
	userAgent: string;
	timestamp: string;
	eventType: 'login' | 'transaction' | 'data_access';
	context: Record<string, any>;
}

interface RiskEvaluationResponse {
	riskScore: number;
	riskLevel: 'low' | 'medium' | 'high' | 'critical';
	reasons: string[];
	recommendations: string[];
	confidence: number;
	evaluationId: string;
}

interface RiskPolicy {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	conditions: Array<{
		type: string;
		operator: string;
		value: any;
	}>;
	actions: Array<{
		type: string;
		parameters: Record<string, any>;
	}>;
}

const PingOneProtectFlowV8PingUI: React.FC = () => {
	const [riskEvaluation, setRiskEvaluation] = useState<RiskEvaluationResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [_selectedPolicy, _setSelectedPolicy] = useState<RiskPolicy | null>(null);
	const [policies, setPolicies] = useState<RiskPolicy[]>([]);
	const [evaluationHistory, setEvaluationHistory] = useState<RiskEvaluationResponse[]>([]);

	const apiDisplayPadding = useApiDisplayPadding();
	const { scrollToTop } = usePageScroll();

	// Services
	const _credentialsService = new CredentialsServiceV8();
	const _environmentIdService = new EnvironmentIdServiceV8();

	// Load initial data
	useEffect(() => {
		loadRiskPolicies();
		loadEvaluationHistory();
	}, [loadEvaluationHistory, loadRiskPolicies]);

	const loadRiskPolicies = async () => {
		try {
			// Mock policies - in real implementation, this would call the PingOne Protect API
			const mockPolicies: RiskPolicy[] = [
				{
					id: 'policy_1',
					name: 'High Risk IP Detection',
					description: 'Flag logins from known malicious IP addresses',
					enabled: true,
					conditions: [
						{ type: 'ip_reputation', operator: 'equals', value: 'malicious' },
						{ type: 'risk_score', operator: 'greater_than', value: 80 },
					],
					actions: [
						{ type: 'require_mfa', parameters: { methods: ['totp', 'push'] } },
						{ type: 'notify_admin', parameters: { immediate: true } },
					],
				},
				{
					id: 'policy_2',
					name: 'Anomalous Location Detection',
					description: 'Detect logins from unusual geographic locations',
					enabled: true,
					conditions: [
						{ type: 'location_anomaly', operator: 'greater_than', value: 0.8 },
						{ type: 'time_since_last_login', operator: 'less_than', value: 3600 },
					],
					actions: [{ type: 'require_verification', parameters: { type: 'email' } }],
				},
				{
					id: 'policy_3',
					name: 'Device Trust Verification',
					description: 'Verify device trust status before allowing access',
					enabled: false,
					conditions: [{ type: 'device_trust', operator: 'equals', value: 'untrusted' }],
					actions: [{ type: 'block_access', parameters: { reason: 'untrusted_device' } }],
				},
			];
			setPolicies(mockPolicies);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load risk policies';
			setError(errorMessage);
		}
	};

	const loadEvaluationHistory = async () => {
		try {
			// Mock evaluation history
			const mockHistory: RiskEvaluationResponse[] = [
				{
					riskScore: 25,
					riskLevel: 'low',
					reasons: ['Known device', 'Familiar location'],
					recommendations: ['Allow access'],
					confidence: 0.95,
					evaluationId: 'eval_1',
				},
				{
					riskScore: 65,
					riskLevel: 'medium',
					reasons: ['New device', 'Unusual time'],
					recommendations: ['Require MFA', 'Monitor session'],
					confidence: 0.87,
					evaluationId: 'eval_2',
				},
			];
			setEvaluationHistory(mockHistory);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load evaluation history';
			setError(errorMessage);
		}
	};

	const handleRiskEvaluation = useCallback(async (_request: RiskEvaluationRequest) => {
		try {
			setIsLoading(true);
			setError(null);

			// Mock risk evaluation - in real implementation, this would call PingOne Protect API
			const mockResponse: RiskEvaluationResponse = {
				riskScore: Math.floor(Math.random() * 100),
				riskLevel: 'low',
				reasons: ['Normal login pattern', 'Trusted device'],
				recommendations: ['Allow access'],
				confidence: 0.92,
				evaluationId: `eval_${Date.now()}`,
			};

			// Determine risk level based on score
			if (mockResponse.riskScore < 30) {
				mockResponse.riskLevel = 'low';
				mockResponse.recommendations = ['Allow access'];
			} else if (mockResponse.riskScore < 70) {
				mockResponse.riskLevel = 'medium';
				mockResponse.recommendations = ['Require additional verification'];
				mockResponse.reasons = ['New device detected', 'Unusual location'];
			} else {
				mockResponse.riskLevel = 'high';
				mockResponse.recommendations = ['Block access', 'Notify security team'];
				mockResponse.reasons = ['Suspicious activity detected', 'High risk IP address'];
			}

			setRiskEvaluation(mockResponse);
			setEvaluationHistory((prev) => [mockResponse, ...prev.slice(0, 9)]);

			toastV8.success(
				`Risk evaluation completed: ${mockResponse.riskLevel} risk (${mockResponse.riskScore})`
			);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Risk evaluation failed';
			setError(errorMessage);
			toastV8.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handlePolicyToggle = async (policyId: string) => {
		try {
			setPolicies((prev) =>
				prev.map((policy) =>
					policy.id === policyId ? { ...policy, enabled: !policy.enabled } : policy
				)
			);

			const policy = policies.find((p) => p.id === policyId);
			toastV8.success(`Policy "${policy?.name}" ${policy?.enabled ? 'disabled' : 'enabled'}`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to toggle policy';
			setError(errorMessage);
			toastV8.error(errorMessage);
		}
	};

	const handleTestEvaluation = () => {
		const testRequest: RiskEvaluationRequest = {
			userId: 'test_user_123',
			sessionId: `session_${Date.now()}`,
			ipAddress: '192.168.1.100',
			userAgent: navigator.userAgent,
			timestamp: new Date().toISOString(),
			eventType: 'login',
			context: {
				deviceType: 'web',
				location: 'US',
				previousLogins: 5,
			},
		};
		handleRiskEvaluation(testRequest);
	};

	const getRiskLevelColor = (level: string) => {
		switch (level) {
			case 'low':
				return 'var(--ping-success-color, #22c55e)';
			case 'medium':
				return 'var(--ping-warning-color, #f59e0b)';
			case 'high':
				return 'var(--ping-error-color, #ef4444)';
			case 'critical':
				return 'var(--ping-error-dark, #dc2626)';
			default:
				return 'var(--ping-text-secondary, #6b7280)';
		}
	};

	const renderRiskEvaluationCard = () => {
		if (!riskEvaluation) return null;

		return (
			<div
				style={{
					background: 'var(--ping-surface-primary, #ffffff)',
					border: '1px solid var(--ping-border-color, #e5e7eb)',
					borderRadius: 'var(--ping-border-radius-lg, 12px)',
					padding: 'var(--ping-spacing-xl, 2rem)',
					marginBottom: 'var(--ping-spacing-xl, 2rem)',
				}}
			>
				<h3
					style={{
						margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
						fontSize: '1.25rem',
						fontWeight: 600,
						color: 'var(--ping-text-primary, #1a1a1a)',
						display: 'flex',
						alignItems: 'center',
						gap: 'var(--ping-spacing-sm, 0.5rem)',
					}}
				>
					<MDIIcon
						icon="FiActivity"
						size={24}
						ariaLabel="Risk Evaluation"
						style={{ color: getRiskLevelColor(riskEvaluation.riskLevel) }}
					/>
					Latest Risk Evaluation
				</h3>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: 'var(--ping-spacing-lg, 1.5rem)',
						marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
					}}
				>
					<div>
						<div
							style={{
								fontSize: '0.875rem',
								color: 'var(--ping-text-secondary, #6b7280)',
								marginBottom: 'var(--ping-spacing-xs, 0.25rem)',
							}}
						>
							Risk Score
						</div>
						<div
							style={{
								fontSize: '2rem',
								fontWeight: 700,
								color: getRiskLevelColor(riskEvaluation.riskLevel),
							}}
						>
							{riskEvaluation.riskScore}
						</div>
					</div>
					<div>
						<div
							style={{
								fontSize: '0.875rem',
								color: 'var(--ping-text-secondary, #6b7280)',
								marginBottom: 'var(--ping-spacing-xs, 0.25rem)',
							}}
						>
							Risk Level
						</div>
						<div
							style={{
								fontSize: '1.25rem',
								fontWeight: 600,
								color: getRiskLevelColor(riskEvaluation.riskLevel),
								textTransform: 'capitalize',
							}}
						>
							{riskEvaluation.riskLevel}
						</div>
					</div>
					<div>
						<div
							style={{
								fontSize: '0.875rem',
								color: 'var(--ping-text-secondary, #6b7280)',
								marginBottom: 'var(--ping-spacing-xs, 0.25rem)',
							}}
						>
							Confidence
						</div>
						<div
							style={{
								fontSize: '1.25rem',
								fontWeight: 600,
								color: 'var(--ping-text-primary, #1a1a1a)',
							}}
						>
							{Math.round(riskEvaluation.confidence * 100)}%
						</div>
					</div>
				</div>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: 'var(--ping-spacing-lg, 1.5rem)',
					}}
				>
					<div>
						<h4
							style={{
								margin: '0 0 var(--ping-spacing-md, 1rem) 0',
								fontSize: '1rem',
								fontWeight: 600,
								color: 'var(--ping-text-primary, #1a1a1a)',
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-xs, 0.25rem)',
							}}
						>
							<MDIIcon icon="FiAlertTriangle" size={16} ariaLabel="Reasons" />
							Reasons
						</h4>
						<ul
							style={{
								margin: 0,
								paddingLeft: 'var(--ping-spacing-lg, 1.5rem)',
								color: 'var(--ping-text-secondary, #6b7280)',
							}}
						>
							{riskEvaluation.reasons.map((reason, index) => (
								<li key={index} style={{ marginBottom: 'var(--ping-spacing-xs, 0.25rem)' }}>
									{reason}
								</li>
							))}
						</ul>
					</div>
					<div>
						<h4
							style={{
								margin: '0 0 var(--ping-spacing-md, 1rem) 0',
								fontSize: '1rem',
								fontWeight: 600,
								color: 'var(--ping-text-primary, #1a1a1a)',
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-xs, 0.25rem)',
							}}
						>
							<MDIIcon icon="FiCheckCircle" size={16} ariaLabel="Recommendations" />
							Recommendations
						</h4>
						<ul
							style={{
								margin: 0,
								paddingLeft: 'var(--ping-spacing-lg, 1.5rem)',
								color: 'var(--ping-text-secondary, #6b7280)',
							}}
						>
							{riskEvaluation.recommendations.map((recommendation, index) => (
								<li key={index} style={{ marginBottom: 'var(--ping-spacing-xs, 0.25rem)' }}>
									{recommendation}
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		);
	};

	const renderPoliciesSection = () => (
		<div
			style={{
				background: 'var(--ping-surface-primary, #ffffff)',
				border: '1px solid var(--ping-border-color, #e5e7eb)',
				borderRadius: 'var(--ping-border-radius-lg, 12px)',
				padding: 'var(--ping-spacing-xl, 2rem)',
				marginBottom: 'var(--ping-spacing-xl, 2rem)',
			}}
		>
			<h3
				style={{
					margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
					fontSize: '1.25rem',
					fontWeight: 600,
					color: 'var(--ping-text-primary, #1a1a1a)',
					display: 'flex',
					alignItems: 'center',
					gap: 'var(--ping-spacing-sm, 0.5rem)',
				}}
			>
				<MDIIcon icon="FiSettings" size={24} ariaLabel="Risk Policies" />
				Risk Policies
			</h3>

			<div
				style={{
					display: 'grid',
					gap: 'var(--ping-spacing-lg, 1.5rem)',
				}}
			>
				{policies.map((policy) => (
					<div
						key={policy.id}
						style={{
							border: '1px solid var(--ping-border-color, #e5e7eb)',
							borderRadius: 'var(--ping-border-radius-md, 8px)',
							padding: 'var(--ping-spacing-lg, 1.5rem)',
							transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
							e.currentTarget.style.boxShadow =
								'var(--ping-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
							e.currentTarget.style.boxShadow = 'none';
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								marginBottom: 'var(--ping-spacing-md, 1rem)',
							}}
						>
							<div>
								<h4
									style={{
										margin: '0 0 var(--ping-spacing-xs, 0.25rem) 0',
										fontSize: '1.125rem',
										fontWeight: 600,
										color: 'var(--ping-text-primary, #1a1a1a)',
									}}
								>
									{policy.name}
								</h4>
								<p
									style={{
										margin: 0,
										fontSize: '0.875rem',
										color: 'var(--ping-text-secondary, #6b7280)',
										lineHeight: '1.5',
									}}
								>
									{policy.description}
								</p>
							</div>
							<button
								onClick={() => handlePolicyToggle(policy.id)}
								style={{
									padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
									background: policy.enabled
										? 'var(--ping-success-color, #22c55e)'
										: 'var(--ping-text-secondary, #6b7280)',
									border: 'none',
									borderRadius: 'var(--ping-border-radius-sm, 4px)',
									color: 'white',
									fontSize: '0.75rem',
									fontWeight: 500,
									cursor: 'pointer',
									transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
								}}
								onMouseOver={(e) => {
									e.currentTarget.style.opacity = '0.8';
								}}
								onMouseOut={(e) => {
									e.currentTarget.style.opacity = '1';
								}}
							>
								{policy.enabled ? 'Enabled' : 'Disabled'}
							</button>
						</div>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: 'var(--ping-spacing-md, 1rem)',
							}}
						>
							<div>
								<div
									style={{
										fontSize: '0.75rem',
										fontWeight: 600,
										color: 'var(--ping-text-secondary, #6b7280)',
										marginBottom: 'var(--ping-spacing-xs, 0.25rem)',
										textTransform: 'uppercase',
									}}
								>
									Conditions
								</div>
								<div
									style={{
										fontSize: '0.875rem',
										color: 'var(--ping-text-primary, #1a1a1a)',
									}}
								>
									{policy.conditions.length} condition{policy.conditions.length !== 1 ? 's' : ''}
								</div>
							</div>
							<div>
								<div
									style={{
										fontSize: '0.75rem',
										fontWeight: 600,
										color: 'var(--ping-text-secondary, #6b7280)',
										marginBottom: 'var(--ping-spacing-xs, 0.25rem)',
										textTransform: 'uppercase',
									}}
								>
									Actions
								</div>
								<div
									style={{
										fontSize: '0.875rem',
										color: 'var(--ping-text-primary, #1a1a1a)',
									}}
								>
									{policy.actions.length} action{policy.actions.length !== 1 ? 's' : ''}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);

	const renderEvaluationHistory = () => (
		<div
			style={{
				background: 'var(--ping-surface-primary, #ffffff)',
				border: '1px solid var(--ping-border-color, #e5e7eb)',
				borderRadius: 'var(--ping-border-radius-lg, 12px)',
				padding: 'var(--ping-spacing-xl, 2rem)',
			}}
		>
			<h3
				style={{
					margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
					fontSize: '1.25rem',
					fontWeight: 600,
					color: 'var(--ping-text-primary, #1a1a1a)',
					display: 'flex',
					alignItems: 'center',
					gap: 'var(--ping-spacing-sm, 0.5rem)',
				}}
			>
				<MDIIcon icon="FiTrendingUp" size={24} ariaLabel="Evaluation History" />
				Evaluation History
			</h3>

			{evaluationHistory.length === 0 ? (
				<p
					style={{
						textAlign: 'center',
						color: 'var(--ping-text-secondary, #6b7280)',
						fontStyle: 'italic',
					}}
				>
					No evaluation history available. Run a test evaluation to see results.
				</p>
			) : (
				<div
					style={{
						overflow: 'auto',
						border: '1px solid var(--ping-border-color, #e5e7eb)',
						borderRadius: 'var(--ping-border-radius-md, 8px)',
					}}
				>
					<table
						style={{
							width: '100%',
							borderCollapse: 'collapse',
							minWidth: '600px',
						}}
					>
						<thead>
							<tr
								style={{
									background: 'var(--ping-surface-secondary, #f8fafc)',
									borderBottom: '1px solid var(--ping-border-color, #e5e7eb)',
								}}
							>
								<th
									style={{
										padding: 'var(--ping-spacing-md, 1rem)',
										textAlign: 'left',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: 'var(--ping-text-primary, #1a1a1a)',
									}}
								>
									Evaluation ID
								</th>
								<th
									style={{
										padding: 'var(--ping-spacing-md, 1rem)',
										textAlign: 'left',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: 'var(--ping-text-primary, #1a1a1a)',
									}}
								>
									Risk Score
								</th>
								<th
									style={{
										padding: 'var(--ping-spacing-md, 1rem)',
										textAlign: 'left',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: 'var(--ping-text-primary, #1a1a1a)',
									}}
								>
									Risk Level
								</th>
								<th
									style={{
										padding: 'var(--ping-spacing-md, 1rem)',
										textAlign: 'left',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: 'var(--ping-text-primary, #1a1a1a)',
									}}
								>
									Confidence
								</th>
							</tr>
						</thead>
						<tbody>
							{evaluationHistory.map((evaluation, index) => (
								<tr
									key={evaluation.evaluationId}
									style={{
										borderBottom:
											index < evaluationHistory.length - 1
												? '1px solid var(--ping-border-color, #e5e7eb)'
												: 'none',
										transition: 'background-color var(--ping-transition-fast, 0.15s) ease-in-out',
									}}
									onMouseOver={(e) => {
										e.currentTarget.style.backgroundColor =
											'var(--ping-surface-secondary, #f8fafc)';
									}}
									onMouseOut={(e) => {
										e.currentTarget.style.backgroundColor = 'transparent';
									}}
								>
									<td
										style={{
											padding: 'var(--ping-spacing-md, 1rem)',
											fontSize: '0.875rem',
											color: 'var(--ping-text-primary, #1a1a1a)',
											fontFamily: 'monospace',
										}}
									>
										{evaluation.evaluationId}
									</td>
									<td
										style={{
											padding: 'var(--ping-spacing-md, 1rem)',
											fontSize: '0.875rem',
											color: 'var(--ping-text-primary, #1a1a1a)',
											fontWeight: 600,
										}}
									>
										{evaluation.riskScore}
									</td>
									<td
										style={{
											padding: 'var(--ping-spacing-md, 1rem)',
											fontSize: '0.875rem',
											color: getRiskLevelColor(evaluation.riskLevel),
											fontWeight: 600,
											textTransform: 'capitalize',
										}}
									>
										{evaluation.riskLevel}
									</td>
									<td
										style={{
											padding: 'var(--ping-spacing-md, 1rem)',
											fontSize: '0.875rem',
											color: 'var(--ping-text-primary, #1a1a1a)',
										}}
									>
										{Math.round(evaluation.confidence * 100)}%
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);

	return (
		<div className="end-user-nano">
			<div
				style={{
					minHeight: '100vh',
					background: 'var(--ping-surface-primary, #ffffff)',
					color: 'var(--ping-text-primary, #1a1a1a)',
				}}
			>
				{/* Header */}
				<MFAHeaderV8
					title="PingOne Protect Integration"
					subtitle="Risk evaluation and fraud detection API integration"
					onBack={scrollToTop}
				/>

				{/* Controls */}
				<div
					style={{
						padding: 'var(--ping-spacing-xl, 2rem)',
						paddingBottom: 0,
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 'var(--ping-spacing-md, 1rem)',
							marginBottom: 'var(--ping-spacing-xl, 2rem)',
						}}
					>
						<button
							onClick={handleTestEvaluation}
							disabled={isLoading}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-sm, 0.5rem)',
								padding: 'var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 1.5rem)',
								background: 'var(--ping-primary-color, #3b82f6)',
								border: '1px solid var(--ping-primary-color, #3b82f6)',
								borderRadius: 'var(--ping-border-radius-md, 8px)',
								color: 'white',
								fontSize: '0.875rem',
								fontWeight: 500,
								cursor: isLoading ? 'not-allowed' : 'pointer',
								transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
							onMouseOver={(e) => {
								if (!isLoading) {
									e.currentTarget.style.backgroundColor = 'var(--ping-primary-dark, #2563eb)';
									e.currentTarget.style.borderColor = 'var(--ping-primary-dark, #2563eb)';
								}
							}}
							onMouseOut={(e) => {
								e.currentTarget.style.backgroundColor = 'var(--ping-primary-color, #3b82f6)';
								e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
							}}
						>
							<MDIIcon icon="FiActivity" size={16} ariaLabel="Test" />
							{isLoading ? 'Evaluating...' : 'Run Test Evaluation'}
						</button>

						{error && (
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--ping-spacing-sm, 0.5rem)',
									padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
									background: 'var(--ping-error-light, #fef2f2)',
									border: '1px solid var(--ping-error-color, #ef4444)',
									borderRadius: 'var(--ping-border-radius-md, 8px)',
									color: 'var(--ping-error-color, #ef4444)',
									fontSize: '0.875rem',
									marginLeft: 'auto',
								}}
							>
								<MDIIcon icon="FiXCircle" size={16} ariaLabel="Error" />
								{error}
							</div>
						)}
					</div>
				</div>

				{/* Content */}
				<div
					style={{
						padding: 'var(--ping-spacing-xl, 2rem)',
					}}
				>
					{renderRiskEvaluationCard()}
					{renderPoliciesSection()}
					{renderEvaluationHistory()}
				</div>

				{/* API Display */}
				<SuperSimpleApiDisplayV8
					title="PingOne Protect API"
					description="API endpoints and data structures for risk evaluation"
					apiCalls={[]}
					padding={apiDisplayPadding}
				/>
			</div>
		</div>
	);
};

export default PingOneProtectFlowV8PingUI;
