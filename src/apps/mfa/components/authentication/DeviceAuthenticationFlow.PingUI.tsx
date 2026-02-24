/**
 * @file DeviceAuthenticationFlow.PingUI.tsx
 * @module apps/mfa/components/authentication
 * @description Device Authentication Flow Component - Ping UI migrated
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
import { DeviceAuthenticationService } from '@/apps/mfa/services/authentication/deviceAuthenticationService';
// Import types
import type {
	AuthenticationFlowState,
	AuthenticationStep,
	MFADevice,
} from '@/apps/mfa/types/mfaFlowTypes';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { MFAErrorBoundary } from '@/v8/components/MFAErrorBoundary';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// Bootstrap Icon Component (migrated from MDI)
import BootstrapIcon from '@/components/BootstrapIcon';
import { getBootstrapIconName } from '@/components/iconMapping';

interface DeviceAuthenticationFlowProps {
	initialStep?: AuthenticationStep;
	onComplete?: (result: unknown) => void;
	onError?: (error: unknown) => void;
	deviceId?: string;
}

const DeviceAuthenticationFlowPingUI: React.FC<DeviceAuthenticationFlowProps> = ({
	initialStep = 'device_selection',
	onComplete,
	onError,
	deviceId,
}) => {
	const [flowState, setFlowState] = useState<AuthenticationFlowState>({
		currentStep: initialStep,
		isLoading: false,
		error: null,
		device: null,
		challenge: null,
	});

	const [availableDevices, setAvailableDevices] = useState<MFADevice[]>([]);

	// Initialize flow
	useEffect(() => {
		const initializeFlow = async () => {
			try {
				setFlowState((prev) => ({ ...prev, isLoading: true }));

				// Get available devices
				const devices = await DeviceAuthenticationService.getAvailableDevices();
				setAvailableDevices(devices);

				// If deviceId provided, set it as current device
				if (deviceId) {
					const device = devices.find((d) => d.id === deviceId);
					if (device) {
						setFlowState((prev) => ({ ...prev, device }));
					}
				}
			} catch (error) {
				console.error('Failed to initialize authentication flow:', error);
				setFlowState((prev) => ({ ...prev, error: error as Error, isLoading: false }));
				onError?.(error);
			} finally {
				setFlowState((prev) => ({ ...prev, isLoading: false }));
			}
		};

		initializeFlow();
	}, [deviceId, onError]);

	// Handle device selection
	const handleDeviceSelect = useCallback(
		async (device: MFADevice) => {
			try {
				setFlowState((prev) => ({ ...prev, isLoading: true, error: null }));

				// Set current device
				setFlowState((prev) => ({ ...prev, device }));

				// Start authentication challenge
				const challenge = await DeviceAuthenticationService.startChallenge(device.id);
				setFlowState((prev) => ({ ...prev, challenge, currentStep: 'challenge_response' }));

				toastV8.info('Authentication challenge started');
			} catch (error) {
				console.error('Failed to start authentication challenge:', error);
				setFlowState((prev) => ({ ...prev, error: error as Error, isLoading: false }));
				toastV8.error('Failed to start authentication challenge');
				onError?.(error);
			} finally {
				setFlowState((prev) => ({ ...prev, isLoading: false }));
			}
		},
		[onError]
	);

	// Handle challenge response
	const handleChallengeResponse = useCallback(
		async (response: unknown) => {
			try {
				setFlowState((prev) => ({ ...prev, isLoading: true, error: null }));

				if (!flowState.challenge || !flowState.device) {
					throw new Error('No active challenge or device');
				}

				// Submit challenge response
				const result = await DeviceAuthenticationService.submitResponse(
					flowState.challenge.id,
					response
				);

				if (result.success) {
					setFlowState((prev) => ({ ...prev, currentStep: 'success' }));
					toastV8.success('Device authentication successful');
					onComplete?.(result);
				} else {
					setFlowState((prev) => ({
						...prev,
						error: new Error(result.message || 'Authentication failed'),
					}));
					toastV8.error(result.message || 'Authentication failed');
				}
			} catch (error) {
				console.error('Failed to submit challenge response:', error);
				setFlowState((prev) => ({ ...prev, error: error as Error, isLoading: false }));
				toastV8.error('Failed to submit challenge response');
				onError?.(error);
			} finally {
				setFlowState((prev) => ({ ...prev, isLoading: false }));
			}
		},
		[flowState.challenge, flowState.device, onComplete, onError]
	);

	// Handle retry
	const handleRetry = useCallback(() => {
		setFlowState((prev) => ({ ...prev, error: null, currentStep: 'device_selection' }));
	}, []);

	// Handle back navigation
	const handleBack = useCallback(() => {
		if (flowState.currentStep === 'challenge_response') {
			setFlowState((prev) => ({ ...prev, currentStep: 'device_selection', challenge: null }));
		}
	}, [flowState.currentStep]);

	return (
		<div className="end-user-nano">
			<MFAErrorBoundary>
				<div
					style={{
						maxWidth: '600px',
						margin: '0 auto',
						padding: 'var(--ping-spacing-lg, 2rem)',
						background: 'var(--ping-surface-primary, #ffffff)',
						borderRadius: 'var(--ping-border-radius-lg, 12px)',
						boxShadow: 'var(--ping-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
						transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
					}}
				>
					<MFAHeaderV8
						title="Device Authentication"
						subtitle="Authenticate your device to continue"
						showBack={flowState.currentStep !== 'device_selection'}
						onBack={handleBack}
					/>

					{/* Device Selection Step */}
					{flowState.currentStep === 'device_selection' && (
						<div
							style={{
								animation: 'fadeIn var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
						>
							<h3
								style={{
									margin: 'var(--ping-spacing-lg, 2rem) 0 var(--ping-spacing-md, 1rem)',
									color: 'var(--ping-text-primary, #1a1a1a)',
									fontSize: '1.125rem',
									fontWeight: 600,
								}}
							>
								Select Your Device
							</h3>

							{availableDevices.length === 0 ? (
								<div
									style={{
										textAlign: 'center',
										padding: 'var(--ping-spacing-xl, 3rem)',
										color: 'var(--ping-text-secondary, #6b7280)',
									}}
								>
									<BootstrapIcon
										icon={getBootstrapIconName("FiLock")}
										size={48}
										aria-label="No devices available"
										style={{ marginBottom: 'var(--ping-spacing-md, 1rem)' }}
									/>
									<p>No devices available for authentication</p>
								</div>
							) : (
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: 'var(--ping-spacing-md, 1rem)',
									}}
								>
									{availableDevices.map((device) => (
										<button
											key={device.id}
											type="button"
											onClick={() => handleDeviceSelect(device)}
											onFocus={(e) => {
												if (!flowState.isLoading) {
													e.currentTarget.style.background =
														'var(--ping-surface-secondary, #f9fafb)';
													e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
												}
											}}
											onBlur={(e) => {
												if (!flowState.isLoading) {
													e.currentTarget.style.background = 'var(--ping-surface-primary, #ffffff)';
													e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
												}
											}}
											onKeyDown={(e) => {
												if ((e.key === 'Enter' || e.key === ' ') && !flowState.isLoading) {
													e.preventDefault();
													handleDeviceSelect(device);
												}
											}}
											disabled={flowState.isLoading}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 'var(--ping-spacing-md, 1rem)',
												padding: 'var(--ping-spacing-lg, 2rem)',
												border: '1px solid var(--ping-border-color, #e5e7eb)',
												borderRadius: 'var(--ping-border-radius-md, 8px)',
												background: 'var(--ping-surface-primary, #ffffff)',
												cursor: flowState.isLoading ? 'not-allowed' : 'pointer',
												transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
												opacity: flowState.isLoading ? 0.6 : 1,
											}}
											onMouseOver={(e) => {
												if (!flowState.isLoading) {
													e.currentTarget.style.background =
														'var(--ping-surface-secondary, #f9fafb)';
													e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
												}
											}}
											onMouseOut={(e) => {
												if (!flowState.isLoading) {
													e.currentTarget.style.background = 'var(--ping-surface-primary, #ffffff)';
													e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
												}
											}}
										>
											<BootstrapIcon
												icon={getBootstrapIconName("FiShieldAlt")}
												size={24}
												aria-label={`Device: ${device.name}`}
												style={{ color: 'var(--ping-primary-color, #3b82f6)' }}
											/>
											<div style={{ textAlign: 'left' }}>
												<div
													style={{
														fontWeight: 600,
														color: 'var(--ping-text-primary, #1a1a1a)',
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
													{device.type} • {device.status}
												</div>
											</div>
											{flowState.isLoading && flowState.device?.id === device.id && (
												<ButtonSpinner size="sm" />
											)}
										</button>
									))}
								</div>
							)}
						</div>
					)}

					{/* Challenge Response Step */}
					{flowState.currentStep === 'challenge_response' && flowState.challenge && (
						<div
							style={{
								animation: 'fadeIn var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
						>
							<h3
								style={{
									margin: 'var(--ping-spacing-lg, 2rem) 0 var(--ping-spacing-md, 1rem)',
									color: 'var(--ping-text-primary, #1a1a1a)',
									fontSize: '1.125rem',
									fontWeight: 600,
								}}
							>
								Authentication Required
							</h3>

							<div
								style={{
									padding: 'var(--ping-spacing-lg, 2rem)',
									background: 'var(--ping-surface-secondary, #f9fafb)',
									borderRadius: 'var(--ping-border-radius-md, 8px)',
									border: '1px solid var(--ping-border-color, #e5e7eb)',
								}}
							>
								<p
									style={{
										marginBottom: 'var(--ping-spacing-md, 1rem)',
										color: 'var(--ping-text-secondary, #6b7280)',
									}}
								>
									{flowState.challenge.message ||
										'Please complete the authentication challenge on your device.'}
								</p>

								{flowState.challenge.type === 'push' && (
									<div
										style={{
											textAlign: 'center',
											padding: 'var(--ping-spacing-lg, 2rem)',
										}}
									>
										<BootstrapIcon
											icon={getBootstrapIconName("FiShieldAlt")}
											size={48}
											aria-label="Push notification sent"
											style={{
												color: 'var(--ping-primary-color, #3b82f6)',
												marginBottom: 'var(--ping-spacing-md, 1rem)',
											}}
										/>
										<p
											style={{
												color: 'var(--ping-text-primary, #1a1a1a)',
												fontWeight: 500,
											}}
										>
											Check your device for the authentication notification
										</p>
									</div>
								)}
							</div>

							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									marginTop: 'var(--ping-spacing-lg, 2rem)',
									gap: 'var(--ping-spacing-md, 1rem)',
								}}
							>
								<button
									type="button"
									onClick={handleBack}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											handleBack();
										}
									}}
									disabled={flowState.isLoading}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 'var(--ping-spacing-sm, 0.5rem)',
										padding: 'var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 2rem)',
										border: '1px solid var(--ping-border-color, #e5e7eb)',
										borderRadius: 'var(--ping-border-radius-md, 8px)',
										background: 'var(--ping-surface-primary, #ffffff)',
										color: 'var(--ping-text-primary, #1a1a1a)',
										cursor: flowState.isLoading ? 'not-allowed' : 'pointer',
										transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
									}}
								>
									<BootstrapIcon icon={getBootstrapIconName("FiArrowLeft")} size={16} aria-label="Back" />
									Back
								</button>

								<button
									type="button"
									onClick={() => handleChallengeResponse({})}
									onKeyDown={(e) => {
										if ((e.key === 'Enter' || e.key === ' ') && !flowState.isLoading) {
											e.preventDefault();
											handleChallengeResponse({});
										}
									}}
									disabled={flowState.isLoading}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 'var(--ping-spacing-sm, 0.5rem)',
										padding: 'var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 2rem)',
										border: 'none',
										borderRadius: 'var(--ping-border-radius-md, 8px)',
										background: 'var(--ping-primary-color, #3b82f6)',
										color: 'white',
										cursor: flowState.isLoading ? 'not-allowed' : 'pointer',
										transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
										opacity: flowState.isLoading ? 0.6 : 1,
									}}
								>
									{flowState.isLoading ? (
										<ButtonSpinner size="sm" />
									) : (
										<>
											Continue
											<BootstrapIcon icon={getBootstrapIconName("FiArrowRight")} size={16} aria-label="Continue" />
										</>
									)}
								</button>
							</div>
						</div>
					)}

					{/* Success Step */}
					{flowState.currentStep === 'success' && (
						<div
							style={{
								animation: 'fadeIn var(--ping-transition-fast, 0.15s) ease-in-out',
								textAlign: 'center',
								padding: 'var(--ping-spacing-xl, 3rem)',
							}}
						>
							<BootstrapIcon
								icon={getBootstrapIconName("FiCheckCircle")}
								size={64}
								aria-label="Authentication successful"
								style={{
									color: 'var(--ping-success-color, #10b981)',
									marginBottom: 'var(--ping-spacing-lg, 2rem)',
								}}
							/>
							<h3
								style={{
									marginBottom: 'var(--ping-spacing-md, 1rem)',
									color: 'var(--ping-text-primary, #1a1a1a)',
									fontSize: '1.25rem',
									fontWeight: 600,
								}}
							>
								Authentication Successful
							</h3>
							<p
								style={{
									color: 'var(--ping-text-secondary, #6b7280)',
									marginBottom: 'var(--ping-spacing-lg, 2rem)',
								}}
							>
								Your device has been successfully authenticated.
							</p>
						</div>
					)}

					{/* Error Display */}
					{flowState.error && (
						<div
							style={{
								marginTop: 'var(--ping-spacing-lg, 2rem)',
								padding: 'var(--ping-spacing-md, 1rem)',
								background: 'var(--ping-error-background, #fef2f2)',
								border: '1px solid var(--ping-error-border, #fecaca)',
								borderRadius: 'var(--ping-border-radius-md, 8px)',
								color: 'var(--ping-error-text, #dc2626)',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--ping-spacing-sm, 0.5rem)',
									marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
								}}
							>
								<BootstrapIcon icon={getBootstrapIconName("FiLock")} size={16} aria-label="Error" />
								<strong>Authentication Error</strong>
							</div>
							<p style={{ margin: 0 }}>
								{flowState.error.message || 'An unexpected error occurred during authentication.'}
							</p>
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
									marginTop: 'var(--ping-spacing-sm, 0.5rem)',
									padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
									border: '1px solid var(--ping-error-border, #fecaca)',
									borderRadius: 'var(--ping-border-radius-sm, 4px)',
									background: 'var(--ping-error-background, #fef2f2)',
									color: 'var(--ping-error-text, #dc2626)',
									cursor: 'pointer',
									fontSize: '0.875rem',
									transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
								}}
							>
								Retry
							</button>
						</div>
					)}
				</div>
			</MFAErrorBoundary>
		</div>
	);
};

export default DeviceAuthenticationFlowPingUI;
