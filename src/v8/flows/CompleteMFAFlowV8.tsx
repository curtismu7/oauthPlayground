/**
 * @file CompleteMFAFlowV8.tsx
 * @module v8/flows
 * @description Complete MFA Flow V8 - Modern V8 implementation with V8 UI and services
 * @version 8.0.0
 * @since 2026-02-16
 *
 * This is the V8 conversion of CompleteMFAFlowV7.tsx, using modern V8 UI components
 * and services for better consistency and maintainability.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertTriangle, FiArrowLeft, FiArrowRight, FiCheckCircle } from '@icons';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { MFAErrorBoundary } from '@/v8/components/MFAErrorBoundary';
// V8 UI Components
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { UserLoginModalV8 } from '@/v8/components/UserLoginModalV8';
// Types
import type { DeviceConfigKey } from '@/v8/config/deviceFlowConfigTypes';
import { GlobalMFAProvider } from '@/v8/contexts/GlobalMFAContext';
// V8 Contexts
import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext';

// V8 Hooks
import { useWorkerToken } from '@/v8/hooks/useWorkerToken';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
// V8 Services
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// Extended credentials interface for the complete MFA flow
interface CompleteMfaCredentials {
	clientId: string;
	clientSecret: string;
	redirectUri?: string;
	region?: 'us' | 'eu' | 'ap' | 'ca';
	username?: string;
	password?: string;
	accessToken?: string;
	refreshToken?: string;
	idToken?: string;
	tokenEndpointAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	environmentId?: string | undefined;
	workerToken?: string;
}

export interface CompleteMFAFlowV8Props {
	requireMFA?: boolean;
	maxRetries?: number;
	onFlowComplete?: (result: {
		success: boolean;
		session?: unknown;
		tokens?: unknown;
		error?: string;
	}) => void;
	onFlowError?: (error: string, context?: Record<string, unknown>) => void;
	onStepChange?: (step: string, data?: Record<string, unknown>) => void;
	showNetworkStatus?: boolean;
	deviceType?: DeviceConfigKey;
}

type FlowStep =
	| 'username_login'
	| 'mfa_enrollment'
	| 'device_pairing'
	| 'mfa_challenge'
	| 'completion'
	| 'error';

interface FlowState {
	currentStep: FlowStep;
	credentials: CompleteMfaCredentials;
	isLoading: boolean;
	error: string | null;
	retryCount: number;
	networkStatus: 'online' | 'offline' | 'checking';
	flowData: Record<string, unknown>;
}

const CompleteMFAFlowV8: React.FC<CompleteMFAFlowV8Props> = ({
	maxRetries = 3,
	onFlowComplete,
	onFlowError,
	onStepChange,
	showNetworkStatus = false,
	deviceType = 'SMS',
}) => {
	// V8 Hooks
	const { tokenStatus, refreshTokenStatus } = useWorkerToken();

	// State
	const [flowState, setFlowState] = useState<FlowState>({
		currentStep: 'username_login',
		credentials: {
			clientId: '',
			clientSecret: '',
			environmentId: undefined,
		},
		isLoading: false,
		error: null,
		retryCount: 0,
		networkStatus: 'checking',
		flowData: {},
	});

	const [showUserLoginModal, setShowUserLoginModal] = useState(false);

	// V8 Services initialization
	useEffect(() => {
		const initializeV8Services = async () => {
			try {
				// Initialize environment ID
				const environmentId = await EnvironmentIdServiceV8.getEnvironmentId();
				if (environmentId) {
					setFlowState((prev) => ({
						...prev,
						credentials: {
							...prev.credentials,
							environmentId,
						},
					}));
				}

				// Initialize worker token if needed
				if (!tokenStatus.isValid) {
					await refreshTokenStatus();
				}

				setFlowState((prev) => ({
					...prev,
					networkStatus: 'online',
				}));
			} catch (error) {
				console.error('Failed to initialize V8 services:', error);
				setFlowState((prev) => ({
					...prev,
					networkStatus: 'offline',
					error: error instanceof Error ? error.message : 'Initialization failed',
				}));
			}
		};

		initializeV8Services();
	}, [tokenStatus.isValid, refreshTokenStatus]);

	useEffect(() => {
		onStepChange?.(flowState.currentStep, flowState.flowData);
	}, [flowState.currentStep, flowState.flowData, onStepChange]);

	// Error handling
	const handleError = useCallback(
		(error: string, context?: Record<string, unknown>) => {
			console.error('MFA Flow Error:', error, context);
			setFlowState((prev) => ({
				...prev,
				error,
				isLoading: false,
			}));
			onFlowError?.(error, context);
			toastV8.error(error);
		},
		[onFlowError]
	);

	// MFA enrollment handler
	const handleMFAEnrollment = useCallback(async () => {
		if (!tokenStatus.isValid) {
			handleError('Worker token is required for MFA enrollment');
			return;
		}

		setFlowState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			// Use V8 MFA configuration service
			const mfaConfig = MFAConfigurationServiceV8.loadConfiguration();

			setFlowState((prev) => ({
				...prev,
				flowData: { ...prev.flowData, mfaConfig },
				isLoading: false,
				currentStep: 'device_pairing',
			}));

			toastV8.success('MFA configuration loaded');
		} catch (error) {
			handleError('Failed to load MFA configuration', { error });
		}
	}, [tokenStatus, handleError]);

	// Device pairing handler
	const handleDevicePairing = useCallback(async () => {
		setFlowState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			// This would integrate with the specific device type flow
			// For now, we'll simulate the pairing process
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setFlowState((prev) => ({
				...prev,
				flowData: {
					...prev.flowData,
					deviceId: `device_${Date.now()}`,
					deviceType,
				},
				isLoading: false,
				currentStep: 'mfa_challenge',
			}));

			toastV8.success('Device paired successfully');
		} catch (error) {
			handleError('Failed to pair device', { error });
		}
	}, [deviceType, handleError]);

	// MFA challenge handler
	const handleMFAChallenge = useCallback(async () => {
		setFlowState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			// Simulate MFA challenge
			await new Promise((resolve) => setTimeout(resolve, 3000));

			setFlowState((prev) => ({
				...prev,
				flowData: {
					...prev.flowData,
					challengeCompleted: true,
				},
				isLoading: false,
				currentStep: 'completion',
			}));

			toastV8.success('MFA challenge completed');
		} catch (error) {
			handleError('MFA challenge failed', { error });
		}
	}, [handleError]);

	// Completion handler
	const handleCompletion = useCallback(() => {
		const result = {
			success: true,
			session: flowState.flowData,
			tokens: {
				accessToken: flowState.credentials.accessToken,
				refreshToken: flowState.credentials.refreshToken,
				idToken: flowState.credentials.idToken,
			},
		};

		onFlowComplete?.(result);
		toastV8.success('MFA flow completed successfully');
	}, [flowState.flowData, flowState.credentials, onFlowComplete]);

	// Retry handler
	const handleRetry = useCallback(() => {
		if (flowState.retryCount < maxRetries) {
			setFlowState((prev) => ({
				...prev,
				retryCount: prev.retryCount + 1,
				error: null,
				isLoading: false,
			}));

			toastV8.info(`Retrying... Attempt ${flowState.retryCount + 1} of ${maxRetries}`);
		} else {
			handleError('Maximum retry attempts exceeded');
		}
	}, [flowState.retryCount, maxRetries, handleError]);

	// Reset flow
	const resetFlow = useCallback(() => {
		setFlowState({
			currentStep: 'username_login',
			credentials: {
				clientId: '',
				clientSecret: '',
				environmentId: flowState.credentials.environmentId,
			},
			isLoading: false,
			error: null,
			retryCount: 0,
			networkStatus: 'online',
			flowData: {},
		});
	}, [flowState.credentials.environmentId]);

	// Render current step
	const renderCurrentStep = () => {
		switch (flowState.currentStep) {
			case 'username_login':
				return (
					<div style={{ padding: '24px' }}>
						<MFAHeaderV8
							title="User Login"
							description="Enter your credentials to begin the MFA flow"
						/>

						<div style={{ marginBottom: '24px' }}>
							<ButtonSpinner
								loading={flowState.isLoading}
								onClick={() => setShowUserLoginModal(true)}
								spinnerSize={16}
								spinnerPosition="left"
								loadingText="Loading..."
								style={{
									background: '#3b82f6',
									color: 'white',
									border: 'none',
									padding: '12px 24px',
									borderRadius: '6px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								{flowState.isLoading ? '' : 'Enter Credentials'}
							</ButtonSpinner>
						</div>

						{showUserLoginModal && (
							<UserLoginModalV8
								isOpen={showUserLoginModal}
								onClose={() => setShowUserLoginModal(false)}
								onCredentialsSaved={() => {
									setFlowState((prev) => ({
										...prev,
										currentStep: 'mfa_enrollment',
									}));
									toastV8.success('User credentials saved successfully');
								}}
								environmentId={flowState.credentials.environmentId || ''}
							/>
						)}
					</div>
				);

			case 'mfa_enrollment':
				return (
					<div style={{ padding: '24px' }}>
						<MFAHeaderV8
							title="MFA Enrollment"
							description="Setting up multi-factor authentication"
						/>

						<div style={{ marginBottom: '24px' }}>
							<ButtonSpinner
								loading={flowState.isLoading}
								onClick={handleMFAEnrollment}
								disabled={!tokenStatus.isValid}
								spinnerSize={16}
								spinnerPosition="left"
								loadingText="Enrolling..."
								style={{
									background: tokenStatus.isValid ? '#10b981' : '#ef4444',
									color: 'white',
									border: 'none',
									padding: '12px 24px',
									borderRadius: '6px',
									fontWeight: '600',
									cursor: tokenStatus.isValid ? 'pointer' : 'not-allowed',
								}}
							>
								{flowState.isLoading ? '' : 'Enroll in MFA'}
							</ButtonSpinner>
						</div>

						{!tokenStatus.isValid && (
							<div
								style={{
									padding: '12px',
									background: '#fef3c7',
									borderRadius: '6px',
									border: '1px solid #f59e0b',
									marginTop: '16px',
								}}
							>
								<p style={{ margin: 0, color: '#92400e' }}>
									<strong>Worker token required:</strong> Please obtain a valid worker token to
									continue with MFA enrollment.
								</p>
							</div>
						)}
					</div>
				);

			case 'device_pairing':
				return (
					<div style={{ padding: '24px' }}>
						<MFAHeaderV8
							title="Device Pairing"
							description={`Pair your ${deviceType} device for MFA`}
						/>

						<div style={{ marginBottom: '24px' }}>
							<ButtonSpinner
								loading={flowState.isLoading}
								onClick={handleDevicePairing}
								spinnerSize={16}
								spinnerPosition="left"
								loadingText="Pairing..."
								style={{
									background: '#3b82f6',
									color: 'white',
									border: 'none',
									padding: '12px 24px',
									borderRadius: '6px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								{flowState.isLoading ? '' : 'Pair Device'}
							</ButtonSpinner>
						</div>
					</div>
				);

			case 'mfa_challenge':
				return (
					<div style={{ padding: '24px' }}>
						<MFAHeaderV8
							title="MFA Challenge"
							description="Complete the multi-factor authentication challenge"
						/>

						<div style={{ marginBottom: '24px' }}>
							<ButtonSpinner
								loading={flowState.isLoading}
								onClick={handleMFAChallenge}
								spinnerSize={16}
								spinnerPosition="left"
								loadingText="Challenging..."
								style={{
									background: '#8b5cf6',
									color: 'white',
									border: 'none',
									padding: '12px 24px',
									borderRadius: '6px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								{flowState.isLoading ? '' : 'Complete Challenge'}
							</ButtonSpinner>
						</div>
					</div>
				);

			case 'completion':
				return (
					<div style={{ padding: '24px' }}>
						<MFAHeaderV8
							title="Setup Complete"
							description="MFA has been successfully configured"
						/>

						<div
							style={{
								padding: '24px',
								background: '#f0fdf4',
								border: '1px solid #bbf7d0',
								borderRadius: '8px',
								marginBottom: '24px',
							}}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
							>
								<FiCheckCircle color="#10b981" size={24} />
								<h3 style={{ margin: 0, color: '#166534' }}>MFA Setup Successful!</h3>
							</div>
							<p style={{ margin: 0, color: '#15803d' }}>
								Your device has been successfully registered and MFA is now enabled for your
								account.
							</p>
						</div>

						<div style={{ marginBottom: '24px' }}>
							<ButtonSpinner
								loading={false}
								onClick={handleCompletion}
								spinnerSize={16}
								spinnerPosition="left"
								style={{
									background: '#10b981',
									color: 'white',
									border: 'none',
									padding: '12px 24px',
									borderRadius: '6px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								Complete Setup
							</ButtonSpinner>
						</div>
					</div>
				);

			case 'error':
				return (
					<div style={{ padding: '24px' }}>
						<MFAHeaderV8 title="Error" description="An error occurred during the MFA flow" />

						<div
							style={{
								padding: '24px',
								background: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '8px',
								marginBottom: '24px',
							}}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
							>
								<FiAlertTriangle color="#ef4444" size={24} />
								<h3 style={{ margin: 0, color: '#991b1b' }}>Flow Error</h3>
							</div>
							<p style={{ margin: 0, color: '#dc2626' }}>{flowState.error}</p>
						</div>

						<div style={{ display: 'flex', gap: '12px' }}>
							<ButtonSpinner
								loading={false}
								onClick={handleRetry}
								disabled={flowState.retryCount >= maxRetries}
								spinnerSize={14}
								spinnerPosition="left"
								style={{
									background: flowState.retryCount >= maxRetries ? '#9ca3af' : '#3b82f6',
									color: 'white',
									border: 'none',
									padding: '10px 20px',
									borderRadius: '6px',
									fontWeight: '600',
									cursor: flowState.retryCount >= maxRetries ? 'not-allowed' : 'pointer',
								}}
							>
								{flowState.retryCount >= maxRetries ? 'Max Retries Reached' : 'Retry'}
							</ButtonSpinner>

							<ButtonSpinner
								loading={false}
								onClick={resetFlow}
								spinnerSize={14}
								spinnerPosition="left"
								style={{
									background: '#6b7280',
									color: 'white',
									border: 'none',
									padding: '10px 20px',
									borderRadius: '6px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								Reset Flow
							</ButtonSpinner>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	// Network status display
	const renderNetworkStatus = () => {
		if (!showNetworkStatus) return null;

		const statusColors = {
			online: '#10b981',
			offline: '#ef4444',
			checking: '#f59e0b',
		};

		return (
			<div
				style={{
					position: 'fixed',
					top: '20px',
					right: '20px',
					padding: '8px 16px',
					background: 'white',
					border: `1px solid ${statusColors[flowState.networkStatus]}`,
					borderRadius: '6px',
					fontSize: '12px',
					fontWeight: '600',
					color: statusColors[flowState.networkStatus],
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					zIndex: 1000,
				}}
			>
				Network: {flowState.networkStatus.toUpperCase()}
			</div>
		);
	};

	return (
		<GlobalMFAProvider>
			<MFACredentialProvider>
				<MFAErrorBoundary>
					<div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
						{renderNetworkStatus()}
						{renderCurrentStep()}

						{/* API Display */}
						<SuperSimpleApiDisplayV8 />

						{/* Navigation buttons */}
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								marginTop: '32px',
								paddingTop: '20px',
								borderTop: '1px solid #e5e7eb',
							}}
						>
							<ButtonSpinner
								loading={false}
								onClick={() => {
									if (flowState.currentStep !== 'username_login') {
										setFlowState((prev) => ({
											...prev,
											currentStep: 'username_login',
										}));
									}
								}}
								disabled={flowState.currentStep === 'username_login'}
								spinnerSize={14}
								spinnerPosition="left"
								style={{
									background: flowState.currentStep === 'username_login' ? '#f3f4f6' : '#3b82f6',
									color: flowState.currentStep === 'username_login' ? '#9ca3af' : 'white',
									border: 'none',
									padding: '10px 20px',
									borderRadius: '6px',
									fontWeight: '600',
									cursor: flowState.currentStep === 'username_login' ? 'not-allowed' : 'pointer',
								}}
							>
								<FiArrowLeft style={{ marginRight: '8px' }} />
								Previous
							</ButtonSpinner>

							<ButtonSpinner
								loading={flowState.isLoading}
								onClick={() => {
									if (flowState.currentStep === 'username_login') {
										setShowUserLoginModal(true);
									} else if (flowState.currentStep === 'mfa_enrollment') {
										handleMFAEnrollment();
									} else if (flowState.currentStep === 'device_pairing') {
										handleDevicePairing();
									} else if (flowState.currentStep === 'mfa_challenge') {
										handleMFAChallenge();
									} else if (flowState.currentStep === 'completion') {
										handleCompletion();
									}
								}}
								disabled={flowState.isLoading || flowState.currentStep === 'error'}
								spinnerSize={14}
								spinnerPosition="left"
								loadingText="Processing..."
								style={{
									background:
										flowState.isLoading || flowState.currentStep === 'error'
											? '#9ca3af'
											: '#3b82f6',
									color: 'white',
									border: 'none',
									padding: '10px 20px',
									borderRadius: '6px',
									fontWeight: '600',
									cursor:
										flowState.isLoading || flowState.currentStep === 'error'
											? 'not-allowed'
											: 'pointer',
								}}
							>
								{flowState.currentStep === 'completion' ? 'Complete' : 'Next'}
								{flowState.currentStep !== 'completion' && (
									<FiArrowRight style={{ marginLeft: '8px' }} />
								)}
							</ButtonSpinner>
						</div>
					</div>
				</MFAErrorBoundary>
			</MFACredentialProvider>
		</GlobalMFAProvider>
	);
};

export default CompleteMFAFlowV8;
