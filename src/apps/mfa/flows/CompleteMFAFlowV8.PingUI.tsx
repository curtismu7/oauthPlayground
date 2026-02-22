/**
 * @file CompleteMFAFlowV8.PingUI.tsx
 * @module v8/flows
 * @description Ping UI migrated Complete MFA Flow V8 - Modern V8 implementation with V8 UI and services
 * @version 8.0.0
 * @since 2026-02-16
 *
 * This is the V8 conversion of CompleteMFAFlowV7.tsx, using modern V8 UI components
 * and services for better consistency and maintainability.
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
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

// MDI Icon Component with proper accessibility
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
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
		></i>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiAlertTriangle: 'mdi-alert',
		FiArrowLeft: 'mdi-arrow-left',
		FiArrowRight: 'mdi-arrow-right',
		FiCheckCircle: 'mdi-check-circle',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

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
}

interface CompleteMFAFlowV8PingUIProps {
	credentials: CompleteMfaCredentials;
	deviceType: DeviceConfigKey;
	onComplete?: (result: any) => void;
	onError?: (error: Error) => void;
	onCancel?: () => void;
}

// Styled Components
const FlowContainer = styled.div`
	background: var(--ping-surface-primary, white);
	border-radius: var(--ping-border-radius-xl, 1rem);
	padding: var(--ping-spacing-xl, 2rem);
	max-width: 800px;
	width: 100%;
	margin: var(--ping-spacing-lg, 1.5rem) auto;
	box-shadow: var(--ping-shadow-xl, 0 20px 40px rgba(0, 0, 0, 0.1));
`;

const FlowHeader = styled.div`
	margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const _FlowTitle = styled.h2`
	color: var(--ping-text-primary, #1e293b);
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0 0 var(--ping-spacing-sm, 0.75rem) 0;
`;

const FlowDescription = styled.p`
	color: var(--ping-text-secondary, #64748b);
	font-size: 1rem;
	line-height: 1.6;
	margin: 0;
`;

const FlowContent = styled.div`
	margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const NavigationButtons = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: var(--ping-spacing-md, 1rem);
`;

const NavigationButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	background: ${({ $variant }) =>
		$variant === 'primary' ? 'var(--ping-primary-color, #3b82f6)' : 'transparent'};
	color: ${({ $variant }) =>
		$variant === 'primary' ? 'white' : 'var(--ping-text-primary, #1e293b)'};
	border: ${({ $variant }) =>
		$variant === 'primary' ? 'none' : '1px solid var(--ping-border-default, #e2e8f0)'};
	padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 1.5rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);

	&:hover {
		background: ${({ $variant }) =>
			$variant === 'primary'
				? 'var(--ping-primary-hover, #2563eb)'
				: 'var(--ping-surface-secondary, #f8fafc)'};
		border-color: var(--ping-primary-color, #3b82f6);
		color: var(--ping-primary-color, #3b82f6);
		transform: translateY(-1px);
	}

	&:disabled {
		background: var(--ping-border-default, #e2e8f0);
		color: var(--ping-text-secondary, #64748b);
		cursor: not-allowed;
		transform: none;
	}
`;

const StatusIndicator = styled.div<{ $status: 'idle' | 'loading' | 'success' | 'error' }>`
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);
	padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-size: 0.875rem;
	font-weight: 500;
	background: ${({ $status }) => {
		switch ($status) {
			case 'loading':
				return 'var(--ping-info-light, #eff6ff)';
			case 'success':
				return 'var(--ping-success-light, #d1fae5)';
			case 'error':
				return 'var(--ping-error-light, #fef2f2)';
			default:
				return 'var(--ping-surface-secondary, #f8fafc)';
		}
	}};
	color: ${({ $status }) => {
		switch ($status) {
			case 'loading':
				return 'var(--ping-info-dark, #1e40af)';
			case 'success':
				return 'var(--ping-success-dark, #065f46)';
			case 'error':
				return 'var(--ping-error-dark, #991b1b)';
			default:
				return 'var(--ping-text-secondary, #64748b)';
		}
	}};
`;

const ErrorBox = styled.div`
	background: var(--ping-error-light, #fef2f2);
	border: 1px solid var(--ping-error-color, #ef4444);
	border-radius: var(--ping-border-radius-md, 8px);
	padding: var(--ping-spacing-md, 1rem);
	margin-bottom: var(--ping-spacing-lg, 1.5rem);
	display: flex;
	align-items: flex-start;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const ErrorText = styled.div`
	color: var(--ping-error-dark, #991b1b);
	font-size: 0.875rem;
	line-height: 1.5;
	flex: 1;
`;

export const CompleteMFAFlowV8PingUI: React.FC<CompleteMFAFlowV8PingUIProps> = ({
	credentials,
	deviceType,
	onComplete,
	onError,
	onCancel,
}) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [flowStatus, setFlowStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

	const { workerToken, hasWorkerToken, refreshWorkerToken } = useWorkerToken();

	// Check if we have required credentials
	useEffect(() => {
		if (!credentials.clientId || !credentials.clientSecret) {
			setError('Missing required credentials (clientId and clientSecret)');
			setFlowStatus('error');
		}
	}, [credentials]);

	// Auto-refresh worker token if needed
	useEffect(() => {
		if (!hasWorkerToken && credentials.environmentId) {
			refreshWorkerToken();
		}
	}, [hasWorkerToken, credentials.environmentId, refreshWorkerToken]);

	const handleNext = useCallback(async () => {
		if (isLoading) return;

		setError(null);
		setIsLoading(true);
		setFlowStatus('loading');

		try {
			// Simulate flow step processing
			await new Promise((resolve) => setTimeout(resolve, 1000));

			if (currentStep < 3) {
				setCurrentStep((prev) => prev + 1);
				setFlowStatus('success');
			} else {
				// Flow completed
				const result = {
					success: true,
					deviceType,
					credentials,
					workerToken,
				};
				onComplete?.(result);
				setFlowStatus('success');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(errorMessage);
			setFlowStatus('error');
			onError?.(err instanceof Error ? err : new Error(errorMessage));
		} finally {
			setIsLoading(false);
		}
	}, [currentStep, deviceType, credentials, workerToken, onComplete, onError, isLoading]);

	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
			setError(null);
		}
	}, [currentStep]);

	const handleCancel = useCallback(() => {
		onCancel?.();
	}, [onCancel]);

	const getStepTitle = () => {
		switch (currentStep) {
			case 0:
				return 'Configure MFA Device';
			case 1:
				return 'Set Authentication Method';
			case 2:
				return 'Register Device';
			case 3:
				return 'Complete Setup';
			default:
				return 'Unknown Step';
		}
	};

	const getStepDescription = () => {
		switch (currentStep) {
			case 0:
				return 'Configure your MFA device type and authentication method';
			case 1:
				return 'Choose how users will authenticate with this device';
			case 2:
				return 'Register the device with PingOne MFA service';
			case 3:
				return 'Review and complete the MFA device setup';
			default:
				return 'Processing step...';
		}
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<div>
						<h3
							style={{
								margin: '0 0 var(--ping-spacing-md, 1rem) 0',
								color: 'var(--ping-text-primary, #1e293b)',
								fontSize: '1.125rem',
							}}
						>
							Device Configuration
						</h3>
						<p
							style={{
								margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
								color: 'var(--ping-text-secondary, #64748b)',
								lineHeight: '1.6',
							}}
						>
							Device Type: <strong>{deviceType}</strong>
						</p>
						<SuperSimpleApiDisplayV8
							title="Device Configuration"
							data={{
								deviceType,
								clientId: credentials.clientId,
								environmentId: credentials.environmentId,
							}}
						/>
					</div>
				);
			case 1:
				return (
					<div>
						<h3
							style={{
								margin: '0 0 var(--ping-spacing-md, 1rem) 0',
								color: 'var(--ping-text-primary, #1e293b)',
								fontSize: '1.125rem',
							}}
						>
							Authentication Method
						</h3>
						<p
							style={{
								margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
								color: 'var(--ping-text-secondary, #64748b)',
								lineHeight: '1.6',
							}}
						>
							Configure how users will authenticate with this MFA device.
						</p>
						<SuperSimpleApiDisplayV8
							title="Authentication Settings"
							data={{
								authMethod: 'push',
								requireUserVerification: true,
								timeout: 300,
							}}
						/>
					</div>
				);
			case 2:
				return (
					<div>
						<h3
							style={{
								margin: '0 0 var(--ping-spacing-md, 1rem) 0',
								color: 'var(--ping-text-primary, #1e293b)',
								fontSize: '1.125rem',
							}}
						>
							Device Registration
						</h3>
						<p
							style={{
								margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
								color: 'var(--ping-text-secondary, #64748b)',
								lineHeight: '1.6',
							}}
						>
							Registering device with PingOne MFA service...
						</p>
						<SuperSimpleApiDisplayV8
							title="Registration Details"
							data={{
								status: 'registering',
								deviceId: 'pending',
								registrationToken: 'generated',
							}}
						/>
					</div>
				);
			case 3:
				return (
					<div>
						<h3
							style={{
								margin: '0 0 var(--ping-spacing-md, 1rem) 0',
								color: 'var(--ping-text-primary, #1e293b)',
								fontSize: '1.125rem',
							}}
						>
							Setup Complete
						</h3>
						<p
							style={{
								margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
								color: 'var(--ping-text-secondary, #64748b)',
								lineHeight: '1.6',
							}}
						>
							MFA device has been successfully configured and registered.
						</p>
						<SuperSimpleApiDisplayV8
							title="Final Configuration"
							data={{
								status: 'active',
								deviceId: 'device-12345',
								registrationDate: new Date().toISOString(),
							}}
						/>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className="end-user-nano">
			<MFAErrorBoundary>
				<GlobalMFAProvider>
					<MFACredentialProvider>
						<FlowContainer>
							<FlowHeader>
								<MFAHeaderV8
									title="Complete MFA Setup"
									subtitle={`Step ${currentStep + 1} of 4: ${getStepTitle()}`}
								/>
								<FlowDescription>{getStepDescription()}</FlowDescription>
							</FlowHeader>

							{error && (
								<ErrorBox>
									<MDIIcon icon="FiAlertTriangle" size={20} ariaLabel="Error" />
									<ErrorText>{error}</ErrorText>
								</ErrorBox>
							)}

							<FlowContent>{renderStepContent()}</FlowContent>

							<NavigationButtons>
								<div>
									{currentStep > 0 && (
										<NavigationButton onClick={handlePrevious} disabled={isLoading}>
											<MDIIcon icon="FiArrowLeft" size={16} ariaLabel="Previous" />
											Previous
										</NavigationButton>
									)}
								</div>

								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 'var(--ping-spacing-md, 1rem)',
									}}
								>
									<StatusIndicator $status={flowStatus}>
										{flowStatus === 'loading' && <ButtonSpinner size={16} />}
										{flowStatus === 'success' && (
											<MDIIcon icon="FiCheckCircle" size={16} ariaLabel="Success" />
										)}
										{flowStatus === 'error' && (
											<MDIIcon icon="FiAlertTriangle" size={16} ariaLabel="Error" />
										)}
										{flowStatus.charAt(0).toUpperCase() + flowStatus.slice(1)}
									</StatusIndicator>

									{currentStep < 3 ? (
										<NavigationButton
											onClick={handleNext}
											$variant="primary"
											disabled={isLoading || !hasWorkerToken}
										>
											Next
											<MDIIcon icon="FiArrowRight" size={16} ariaLabel="Next" />
										</NavigationButton>
									) : (
										<NavigationButton onClick={handleNext} $variant="primary" disabled={isLoading}>
											Complete Setup
											<MDIIcon icon="FiCheckCircle" size={16} ariaLabel="Complete" />
										</NavigationButton>
									)}
								</div>
							</NavigationButtons>

							{onCancel && (
								<div style={{ marginTop: 'var(--ping-spacing-lg, 1.5rem)' }}>
									<NavigationButton onClick={handleCancel}>Cancel Setup</NavigationButton>
								</div>
							)}

							{showLoginModal && (
								<UserLoginModalV8
									isOpen={showLoginModal}
									onClose={() => setShowLoginModal(false)}
								/>
							)}
						</FlowContainer>
					</MFACredentialProvider>
				</GlobalMFAProvider>
			</MFAErrorBoundary>
		</div>
	);
};

export default CompleteMFAFlowV8PingUI;
