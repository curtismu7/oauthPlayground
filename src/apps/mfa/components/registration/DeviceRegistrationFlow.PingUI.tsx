/**
 * @file DeviceRegistrationFlow.PingUI.tsx
 * @module apps/mfa/components/registration
 * @description Device Registration Flow Component - Ping UI migrated
 * @version 8.0.0-PingUI
 * @since 2026-02-21
 *
 * Ping UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 */

import React, { useCallback, useEffect, useState } from 'react';
// Import new separated services
import { DeviceRegistrationService } from '@/apps/mfa/services/registration/deviceRegistrationService';
import { RegistrationCallbackHandler } from '@/apps/mfa/services/registration/registrationCallbackHandler';
import { RegistrationStateManager } from '@/apps/mfa/services/registration/registrationStateManager';
// Import types
import type {
	DeviceRegistrationData,
	RegistrationFlowState,
	RegistrationStep,
} from '@/apps/mfa/types/mfaFlowTypes';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { MFAErrorBoundary } from '@/v8/components/MFAErrorBoundary';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
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
		FiArrowLeft: 'mdi-arrow-left',
		FiArrowRight: 'mdi-arrow-right',
		FiCheckCircle: 'mdi-check-circle',
		FiUserPlus: 'mdi-account-plus',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

interface DeviceRegistrationFlowPingUIProps {
	initialStep?: RegistrationStep;
	onComplete?: (result: DeviceRegistrationData) => void;
	onError?: (error: Error) => void;
	environmentId?: string;
	region?: string;
}

const DeviceRegistrationFlowPingUI: React.FC<DeviceRegistrationFlowPingUIProps> = ({
	initialStep = 'device_selection',
	onComplete,
	onError,
	environmentId,
	region,
}) => {
	// State management
	const [flowState, setFlowState] = useState<RegistrationFlowState | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [registrationData, setRegistrationData] = useState<DeviceRegistrationData | null>(null);

	// Service instances
	const registrationService = new DeviceRegistrationService();
	const stateManager = new RegistrationStateManager();
	const _callbackHandler = new RegistrationCallbackHandler();

	// Initialize flow
	useEffect(() => {
		const initializeFlow = async () => {
			try {
				setIsLoading(true);
				const initialState = await stateManager.initializeFlow({
					flowType: 'registration',
					initialStep,
					environmentId,
					region,
				});
				setFlowState(initialState);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to initialize registration flow';
				setError(errorMessage);
				onError?.(err);
			} finally {
				setIsLoading(false);
			}
		};

		initializeFlow();
	}, [initialStep, environmentId, region, onError, stateManager.initializeFlow]);

	// Handle device selection
	const handleDeviceSelection = useCallback(
		async (deviceType: string) => {
			if (!flowState) return;

			try {
				setIsLoading(true);
				setError(null);

				const updatedState = await registrationService.selectDeviceType(flowState, deviceType);
				setFlowState(updatedState);

				// Auto-proceed to next step if device is supported
				if (updatedState.currentStep === 'device_configuration') {
					await handleDeviceConfiguration(updatedState);
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to select device type';
				setError(errorMessage);
				toastV8.error(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[flowState, handleDeviceConfiguration, registrationService.selectDeviceType]
	);

	// Handle device configuration
	const handleDeviceConfiguration = useCallback(
		async (currentState?: RegistrationFlowState) => {
			const stateToUse = currentState || flowState;
			if (!stateToUse) return;

			try {
				setIsLoading(true);
				setError(null);

				const configData = await registrationService.generateDeviceConfig(stateToUse);
				setRegistrationData(configData);

				const updatedState = await stateManager.updateStep(stateToUse, 'registration_complete');
				setFlowState(updatedState);

				// Show success message
				toastV8.success('Device registered successfully!');
				onComplete?.(configData);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to configure device';
				setError(errorMessage);
				toastV8.error(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[flowState, onComplete, registrationService.generateDeviceConfig, stateManager.updateStep]
	);

	// Handle step navigation
	const handleBack = useCallback(async () => {
		if (!flowState) return;

		try {
			setIsLoading(true);
			setError(null);

			const previousState = await stateManager.goBack(flowState);
			setFlowState(previousState);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to go back';
			setError(errorMessage);
			toastV8.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [flowState, stateManager.goBack]);

	// Handle retry
	const handleRetry = useCallback(() => {
		setError(null);
		// Re-initialize current step
		if (flowState) {
			handleDeviceSelection(flowState.selectedDevice?.type || '');
		}
	}, [flowState, handleDeviceSelection]);

	// Render current step
	const renderCurrentStep = () => {
		if (!flowState) return null;

		switch (flowState.currentStep) {
			case 'device_selection':
				return (
					<div
						style={{
							padding: 'var(--ping-spacing-xl, 2rem)',
							textAlign: 'center',
						}}
					>
						<div
							style={{
								marginBottom: 'var(--ping-spacing-xl, 2rem)',
							}}
						>
							<MDIIcon
								icon="FiUserPlus"
								size={64}
								ariaLabel="Device Registration"
								style={{ color: 'var(--ping-primary-color, #3b82f6)' }}
							/>
							<h2
								style={{
									margin: 'var(--ping-spacing-lg, 1.5rem) 0 var(--ping-spacing-md, 1rem) 0',
									fontSize: '1.5rem',
									fontWeight: 600,
									color: 'var(--ping-text-primary, #1a1a1a)',
								}}
							>
								Device Registration
							</h2>
							<p
								style={{
									margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
									fontSize: '1rem',
									color: 'var(--ping-text-secondary, #6b7280)',
									lineHeight: '1.6',
								}}
							>
								Select the type of device you want to register for multi-factor authentication
							</p>
						</div>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
								gap: 'var(--ping-spacing-lg, 1.5rem)',
								maxWidth: '600px',
								margin: '0 auto',
							}}
						>
							{[
								{
									type: 'mobile',
									name: 'Mobile Device',
									description: 'Register your smartphone or tablet',
								},
								{
									type: 'hardware',
									name: 'Hardware Token',
									description: 'Register a physical security key',
								},
								{
									type: 'email',
									name: 'Email Authentication',
									description: 'Register your email address',
								},
							].map((device) => (
								<button
									type="button"
									key={device.type}
									onClick={() => handleDeviceSelection(device.type)}
									disabled={isLoading}
									style={{
										padding: 'var(--ping-spacing-lg, 1.5rem)',
										background: 'var(--ping-surface-primary, #ffffff)',
										border: '2px solid var(--ping-border-color, #e5e7eb)',
										borderRadius: 'var(--ping-border-radius-lg, 12px)',
										cursor: isLoading ? 'not-allowed' : 'pointer',
										transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
										textAlign: 'left',
									}}
									onMouseOver={(e) => {
										if (!isLoading) {
											e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
											e.currentTarget.style.transform = 'translateY(-2px)';
											e.currentTarget.style.boxShadow =
												'var(--ping-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))';
										}
									}}
									onMouseOut={(e) => {
										if (!isLoading) {
											e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
											e.currentTarget.style.transform = 'translateY(0)';
											e.currentTarget.style.boxShadow = 'none';
										}
									}}
									onFocus={(e) => {
										if (!isLoading) {
											e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
											e.currentTarget.style.transform = 'translateY(-2px)';
											e.currentTarget.style.boxShadow =
												'var(--ping-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))';
										}
									}}
									onBlur={(e) => {
										if (!isLoading) {
											e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
											e.currentTarget.style.transform = 'translateY(0)';
											e.currentTarget.style.boxShadow = 'none';
										}
									}}
								>
									<div
										style={{
											fontSize: '1.125rem',
											fontWeight: 600,
											color: 'var(--ping-text-primary, #1a1a1a)',
											marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
										}}
									>
										{device.name}
									</div>
									<div
										style={{
											fontSize: '0.875rem',
											color: 'var(--ping-text-secondary, #6b7280)',
										}}
									>
										{device.description}
									</div>
								</button>
							))}
						</div>
					</div>
				);

			case 'device_configuration':
				return (
					<div
						style={{
							padding: 'var(--ping-spacing-xl, 2rem)',
							textAlign: 'center',
						}}
					>
						<div
							style={{
								marginBottom: 'var(--ping-spacing-xl, 2rem)',
							}}
						>
							<MDIIcon
								icon="FiCheckCircle"
								size={64}
								ariaLabel="Device Configured"
								style={{ color: 'var(--ping-success-color, #22c55e)' }}
							/>
							<h2
								style={{
									margin: 'var(--ping-spacing-lg, 1.5rem) 0 var(--ping-spacing-md, 1rem) 0',
									fontSize: '1.5rem',
									fontWeight: 600,
									color: 'var(--ping-text-primary, #1a1a1a)',
								}}
							>
								Device Configured
							</h2>
							<p
								style={{
									margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
									fontSize: '1rem',
									color: 'var(--ping-text-secondary, #6b7280)',
									lineHeight: '1.6',
								}}
							>
								Your device has been successfully configured and is ready to use
							</p>
						</div>

						{registrationData && (
							<div
								style={{
									background: 'var(--ping-surface-secondary, #f8fafc)',
									border: '1px solid var(--ping-border-color, #e5e7eb)',
									borderRadius: 'var(--ping-border-radius-lg, 12px)',
									padding: 'var(--ping-spacing-lg, 1.5rem)',
									textAlign: 'left',
									maxWidth: '500px',
									margin: '0 auto',
								}}
							>
								<h3
									style={{
										margin: '0 0 var(--ping-spacing-md, 1rem) 0',
										fontSize: '1.125rem',
										fontWeight: 600,
										color: 'var(--ping-text-primary, #1a1a1a)',
									}}
								>
									Registration Details
								</h3>
								<div
									style={{
										display: 'grid',
										gap: 'var(--ping-spacing-sm, 0.75rem)',
									}}
								>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											padding: 'var(--ping-spacing-sm, 0.5rem) 0',
											borderBottom: '1px solid var(--ping-border-color, #e5e7eb)',
										}}
									>
										<span style={{ color: 'var(--ping-text-secondary, #6b7280)' }}>
											Device Type:
										</span>
										<span style={{ color: 'var(--ping-text-primary, #1a1a1a)', fontWeight: 500 }}>
											{registrationData.deviceType}
										</span>
									</div>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											padding: 'var(--ping-spacing-sm, 0.5rem) 0',
											borderBottom: '1px solid var(--ping-border-color, #e5e7eb)',
										}}
									>
										<span style={{ color: 'var(--ping-text-secondary, #6b7280)' }}>Device ID:</span>
										<span style={{ color: 'var(--ping-text-primary, #1a1a1a)', fontWeight: 500 }}>
											{registrationData.deviceId}
										</span>
									</div>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											padding: 'var(--ping-spacing-sm, 0.5rem) 0',
										}}
									>
										<span style={{ color: 'var(--ping-text-secondary, #6b7280)' }}>Status:</span>
										<span
											style={{
												color: 'var(--ping-success-color, #22c55e)',
												fontWeight: 500,
											}}
										>
											Active
										</span>
									</div>
								</div>
							</div>
						)}

						<div
							style={{
								marginTop: 'var(--ping-spacing-xl, 2rem)',
								display: 'flex',
								justifyContent: 'center',
								gap: 'var(--ping-spacing-md, 1rem)',
							}}
						>
							<button
								type="button"
								onClick={handleBack}
								disabled={isLoading}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--ping-spacing-sm, 0.5rem)',
									padding: 'var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 1.5rem)',
									background: 'var(--ping-surface-primary, #ffffff)',
									border: '1px solid var(--ping-border-color, #e5e7eb)',
									borderRadius: 'var(--ping-border-radius-md, 8px)',
									color: 'var(--ping-text-primary, #1a1a1a)',
									cursor: isLoading ? 'not-allowed' : 'pointer',
									transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
								}}
								onMouseOver={(e) => {
									if (!isLoading) {
										e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
										e.currentTarget.style.backgroundColor = 'var(--ping-primary-light, #dbeafe)';
									}
								}}
								onMouseOut={(e) => {
									e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
									e.currentTarget.style.backgroundColor = 'var(--ping-surface-primary, #ffffff)';
								}}
								onFocus={(e) => {
									if (!isLoading) {
										e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
										e.currentTarget.style.backgroundColor = 'var(--ping-primary-light, #dbeafe)';
									}
								}}
								onBlur={(e) => {
									e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
									e.currentTarget.style.backgroundColor = 'var(--ping-surface-primary, #ffffff)';
								}}
							>
								<MDIIcon icon="FiArrowLeft" size={16} ariaLabel="Back" />
								Back
							</button>

							<button
								type="button"
								onClick={() => onComplete?.(registrationData)}
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
									cursor: isLoading ? 'not-allowed' : 'pointer',
									transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
								}}
								onMouseOver={(e) => {
									if (!isLoading) {
										e.currentTarget.style.backgroundColor = 'var(--ping-primary-hover, #2563eb)';
										e.currentTarget.style.borderColor = 'var(--ping-primary-hover, #2563eb)';
									}
								}}
								onMouseOut={(e) => {
									e.currentTarget.style.backgroundColor = 'var(--ping-primary-color, #3b82f6)';
									e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
								}}
								onFocus={(e) => {
									if (!isLoading) {
										e.currentTarget.style.backgroundColor = 'var(--ping-primary-hover, #2563eb)';
										e.currentTarget.style.borderColor = 'var(--ping-primary-hover, #2563eb)';
									}
								}}
								onBlur={(e) => {
									e.currentTarget.style.backgroundColor = 'var(--ping-primary-color, #3b82f6)';
									e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
								}}
							>
								Complete
								<MDIIcon icon="FiArrowRight" size={16} ariaLabel="Complete" />
							</button>
						</div>
					</div>
				);

			case 'registration_complete':
				return (
					<div
						style={{
							padding: 'var(--ping-spacing-xl, 2rem)',
							textAlign: 'center',
						}}
					>
						<div
							style={{
								marginBottom: 'var(--ping-spacing-xl, 2rem)',
							}}
						>
							<MDIIcon
								icon="FiCheckCircle"
								size={64}
								ariaLabel="Registration Complete"
								style={{ color: 'var(--ping-success-color, #22c55e)' }}
							/>
							<h2
								style={{
									margin: 'var(--ping-spacing-lg, 1.5rem) 0 var(--ping-spacing-md, 1rem) 0',
									fontSize: '1.5rem',
									fontWeight: 600,
									color: 'var(--ping-text-primary, #1a1a1a)',
								}}
							>
								Registration Complete!
							</h2>
							<p
								style={{
									margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
									fontSize: '1rem',
									color: 'var(--ping-text-secondary, #6b7280)',
									lineHeight: '1.6',
								}}
							>
								Your device has been successfully registered and is ready for use
							</p>
						</div>

						<button
							type="button"
							onClick={() => onComplete?.(registrationData)}
							onFocus={(e) => {
								e.currentTarget.style.backgroundColor = 'var(--ping-primary-dark, #2563eb)';
								e.currentTarget.style.borderColor = 'var(--ping-primary-dark, #2563eb)';
							}}
							onBlur={(e) => {
								e.currentTarget.style.backgroundColor = 'var(--ping-primary-color, #3b82f6)';
								e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									onComplete?.(registrationData);
								}
							}}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-sm, 0.5rem)',
								padding: 'var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 1.5rem)',
								background: 'var(--ping-primary-color, #3b82f6)',
								border: '1px solid var(--ping-primary-color, #3b82f6)',
								borderRadius: 'var(--ping-border-radius-md, 8px)',
								color: 'white',
								cursor: 'pointer',
								transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
								margin: '0 auto',
							}}
							onMouseOver={(e) => {
								e.currentTarget.style.backgroundColor = 'var(--ping-primary-dark, #2563eb)';
								e.currentTarget.style.borderColor = 'var(--ping-primary-dark, #2563eb)';
							}}
							onMouseOut={(e) => {
								e.currentTarget.style.backgroundColor = 'var(--ping-primary-color, #3b82f6)';
								e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
							}}
						>
							Continue
							<MDIIcon icon="FiArrowRight" size={16} ariaLabel="Continue" />
						</button>
					</div>
				);

			default:
				return (
					<div
						style={{
							padding: 'var(--ping-spacing-xl, 2rem)',
							textAlign: 'center',
						}}
					>
						<p style={{ color: 'var(--ping-text-secondary, #6b7280)' }}>
							Unknown step: {flowState.currentStep}
						</p>
					</div>
				);
		}
	};

	// Loading state
	if (isLoading && !flowState) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '400px',
				}}
			>
				<ButtonSpinner size="lg" />
			</div>
		);
	}

	// Error state
	if (error && !flowState) {
		return (
			<div
				style={{
					padding: 'var(--ping-spacing-xl, 2rem)',
					textAlign: 'center',
				}}
			>
				<div
					style={{
						background: 'var(--ping-error-light, #fef2f2)',
						border: '1px solid var(--ping-error-color, #ef4444)',
						borderRadius: 'var(--ping-border-radius-lg, 12px)',
						padding: 'var(--ping-spacing-lg, 1.5rem)',
						marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
					}}
				>
					<h3
						style={{
							margin: '0 0 var(--ping-spacing-sm, 0.5rem) 0',
							color: 'var(--ping-error-color, #ef4444)',
							fontSize: '1.125rem',
							fontWeight: 600,
						}}
					>
						Registration Error
					</h3>
					<p
						style={{
							margin: 0,
							color: 'var(--ping-text-secondary, #6b7280)',
						}}
					>
						{error}
					</p>
				</div>

				<button
					type="button"
					onClick={handleRetry}
					onFocus={(e) => {
						e.currentTarget.style.backgroundColor = 'var(--ping-primary-dark, #2563eb)';
						e.currentTarget.style.borderColor = 'var(--ping-primary-dark, #2563eb)';
					}}
					onBlur={(e) => {
						e.currentTarget.style.backgroundColor = 'var(--ping-primary-color, #3b82f6)';
						e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleRetry();
						}
					}}
					style={{
						padding: 'var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 1.5rem)',
						background: 'var(--ping-primary-color, #3b82f6)',
						border: '1px solid var(--ping-primary-color, #3b82f6)',
						borderRadius: 'var(--ping-border-radius-md, 8px)',
						color: 'white',
						cursor: 'pointer',
						transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
					}}
					onMouseOver={(e) => {
						e.currentTarget.style.backgroundColor = 'var(--ping-primary-dark, #2563eb)';
						e.currentTarget.style.borderColor = 'var(--ping-primary-dark, #2563eb)';
					}}
					onMouseOut={(e) => {
						e.currentTarget.style.backgroundColor = 'var(--ping-primary-color, #3b82f6)';
						e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
					}}
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="end-user-nano">
			<MFAErrorBoundary>
				<div
					style={{
						background: 'var(--ping-surface-primary, #ffffff)',
						borderRadius: 'var(--ping-border-radius-lg, 12px)',
						boxShadow: 'var(--ping-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
						overflow: 'hidden',
					}}
				>
					{/* Header */}
					<MFAHeaderV8
						title="Device Registration"
						subtitle="Register your device for secure authentication"
						onBack={flowState?.currentStep !== 'device_selection' ? handleBack : undefined}
					/>

					{/* Error display */}
					{error && flowState && (
						<div
							style={{
								margin: 'var(--ping-spacing-lg, 1.5rem) var(--ping-spacing-xl, 2rem) 0',
							}}
						>
							<div
								style={{
									background: 'var(--ping-error-light, #fef2f2)',
									border: '1px solid var(--ping-error-color, #ef4444)',
									borderRadius: 'var(--ping-border-radius-md, 8px)',
									padding: 'var(--ping-spacing-md, 1rem)',
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--ping-spacing-sm, 0.5rem)',
								}}
							>
								<MDIIcon
									icon="FiCheckCircle"
									size={16}
									ariaLabel="Error"
									style={{ color: 'var(--ping-error-color, #ef4444)' }}
								/>
								<span style={{ color: 'var(--ping-error-color, #ef4444)', fontSize: '0.875rem' }}>
									{error}
								</span>
								<button
									type="button"
									onClick={handleRetry}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											handleRetry();
										}
									}}
									style={{
										marginLeft: 'auto',
										padding: 'var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem)',
										background: 'var(--ping-error-color, #ef4444)',
										border: 'none',
										borderRadius: 'var(--ping-border-radius-sm, 4px)',
										color: 'white',
										fontSize: '0.75rem',
										cursor: 'pointer',
									}}
								>
									Retry
								</button>
							</div>
						</div>
					)}

					{/* Current step content */}
					{renderCurrentStep()}

					{/* Loading overlay */}
					{isLoading && flowState && (
						<div
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								background: 'rgba(255, 255, 255, 0.8)',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								zIndex: 10,
							}}
						>
							<ButtonSpinner size="lg" />
						</div>
					)}
				</div>
			</MFAErrorBoundary>
		</div>
	);
};

export default DeviceRegistrationFlowPingUI;
