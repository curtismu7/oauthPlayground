/**
 * @file EmailFlowV8.tsx
 * @module v8/flows/types
 * @description Email-specific MFA flow component (Refactored with Controller Pattern)
 * @version 8.2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAFlowBaseV8, type MFAFlowBaseRenderProps } from '../shared/MFAFlowBaseV8';
import type { DeviceType, MFACredentials } from '../shared/MFATypes';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFADeviceSelector } from '../components/MFADeviceSelector';
import { MFAOTPInput } from '../components/MFAOTPInput';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';

const MODULE_TAG = '[📧 EMAIL-FLOW-V8]';

// Step 0: Configure Credentials (Email-specific)
const renderStep0 = (props: MFAFlowBaseRenderProps) => {
	const {
		credentials,
		setCredentials,
		tokenStatus,
		deviceAuthPolicies,
		isLoadingPolicies,
		policiesError,
		refreshDeviceAuthPolicies,
	} = props;

	return (
		<div className="step-content">
			<h2>
				Configure MFA Settings
				<MFAInfoButtonV8 contentKey="device.enrollment" displayMode="modal" />
			</h2>
			<p>Enter your PingOne environment details and user information</p>

			{/* Worker Token Status */}
			<div style={{ marginBottom: '10px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
					<button
						type="button"
						onClick={() => {
							if (tokenStatus.isValid) {
								// Remove token directly
								import('@/v8/services/workerTokenServiceV8').then(({ workerTokenServiceV8 }) => {
									workerTokenServiceV8.clearToken();
									window.dispatchEvent(new Event('workerTokenUpdated'));
									WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
									toastV8.success('Worker token removed');
								});
							} else {
								props.setShowWorkerTokenModal(true);
							}
						}}
						className="token-button"
						style={{
							padding: '6px 12px',
							background: tokenStatus.isValid ? '#10b981' : '#ef4444',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<span>🔑</span>
						<span>{tokenStatus.isValid ? 'Manage Token' : 'Add Token'}</span>
					</button>

					<button
						type="button"
						onClick={() => props.setShowSettingsModal(true)}
						className="token-button"
						style={{
							padding: '6px 12px',
							background:
								!tokenStatus.isValid || !credentials.environmentId ? '#e5e7eb' : '#6366f1',
							color: !tokenStatus.isValid || !credentials.environmentId ? '#9ca3af' : 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor:
								!tokenStatus.isValid || !credentials.environmentId ? 'not-allowed' : 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
						disabled={!credentials.environmentId || !tokenStatus.isValid}
					>
						<span>⚙️</span>
						<span>MFA Settings</span>
					</button>

					<div
						style={{
							flex: 1,
							padding: '10px 12px',
							background: tokenStatus.isValid
								? tokenStatus.status === 'expiring-soon'
									? '#fef3c7'
									: '#d1fae5'
								: '#fee2e2',
							border: `1px solid ${WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status)}`,
							borderRadius: '4px',
							fontSize: '12px',
							fontWeight: '500',
							color: tokenStatus.isValid
								? tokenStatus.status === 'expiring-soon'
									? '#92400e'
									: '#065f46'
								: '#991b1b',
						}}
					>
						<span>{WorkerTokenStatusServiceV8.getStatusIcon(tokenStatus.status)}</span>
						<span style={{ marginLeft: '6px' }}>{tokenStatus.message}</span>
					</div>
				</div>

				{!tokenStatus.isValid && (
					<div className="info-box" style={{ marginBottom: '0' }}>
						<p>
							<strong>⚠️ Worker Token Required:</strong> This flow uses a worker token to look up
							users and manage MFA devices. Please click "Add Token" to configure your worker token
							credentials.
						</p>
					</div>
				)}
			</div>

			<div className="credentials-grid">
				<div className="form-group">
					<label htmlFor="mfa-env-id">
						Environment ID <span className="required">*</span>
					</label>
					<input
						id="mfa-env-id"
						type="text"
						value={credentials.environmentId}
						onChange={(e) => setCredentials({ ...credentials, environmentId: e.target.value })}
						placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
					/>
					<small>PingOne environment ID</small>
				</div>

				<div className="form-group">
					<label htmlFor="mfa-device-auth-policy">
						Device Authentication Policy <span className="required">*</span>
					</label>

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							flexWrap: 'wrap',
							marginBottom: '12px',
						}}
					>
						<button
							type="button"
							onClick={() => void refreshDeviceAuthPolicies()}
							className="token-button"
							style={{
								padding: '8px 18px',
								background: '#0284c7',
								color: 'white',
								border: 'none',
								borderRadius: '999px',
								fontSize: '13px',
								fontWeight: '700',
								cursor: isLoadingPolicies ? 'not-allowed' : 'pointer',
								opacity: isLoadingPolicies ? 0.6 : 1,
								boxShadow: '0 8px 18px rgba(2,132,199,0.25)',
								transition: 'transform 0.15s ease, box-shadow 0.15s ease',
							}}
							disabled={isLoadingPolicies || !tokenStatus.isValid || !credentials.environmentId}
							onMouseEnter={(e) => {
								if (!isLoadingPolicies) {
									(e.currentTarget.style.transform = 'translateY(-1px)');
								}
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0)';
							}}
						>
							{isLoadingPolicies ? 'Refreshing…' : 'Refresh Policies'}
						</button>
						<span style={{ fontSize: '13px', color: '#475569' }}>
							Policies load from PingOne using your worker token.
						</span>
					</div>

					{policiesError && (
						<div className="info-box" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
							<strong>Failed to load policies:</strong> {policiesError}. Retry after verifying access.
						</div>
					)}

					{deviceAuthPolicies.length > 0 ? (
						<select
							id="mfa-device-auth-policy"
							value={credentials.deviceAuthenticationPolicyId || ''}
							onChange={(e) =>
								setCredentials({
									...credentials,
									deviceAuthenticationPolicyId: e.target.value,
								})
							}
						>
							{deviceAuthPolicies.map((policy) => (
								<option key={policy.id} value={policy.id}>
									{policy.name || policy.id} ({policy.id})
								</option>
							))}
						</select>
					) : (
						<input
							id="mfa-device-auth-policy"
							type="text"
							value={credentials.deviceAuthenticationPolicyId || ''}
							onChange={(e) =>
								setCredentials({
									...credentials,
									deviceAuthenticationPolicyId: e.target.value.trim(),
								})
							}
							placeholder="Enter a Device Authentication Policy ID"
						/>
					)}

					<div
						style={{
							marginTop: '12px',
							padding: '12px 14px',
							background: '#f1f5f9',
							borderRadius: '10px',
							fontSize: '12px',
							color: '#475569',
							lineHeight: 1.5,
						}}
					>
						Controls how PingOne challenges the user during MFA authentication.
					</div>
				</div>

				<div className="form-group">
					<label htmlFor="mfa-username">
						Username <span className="required">*</span>
					</label>
					<input
						id="mfa-username"
						type="text"
						value={credentials.username}
						onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
						placeholder="john.doe"
					/>
					<small>PingOne username to register MFA device for</small>
				</div>
			</div>
		</div>
	);
};

// Device selection state management wrapper
const EmailFlowV8WithDeviceSelection: React.FC = () => {
	// Initialize controller using factory
	const controller = useMemo(() => 
		MFAFlowControllerFactory.create({ deviceType: 'EMAIL' }), []
	);

	// Device selection state
	const [deviceSelection, setDeviceSelection] = useState({
		existingDevices: [] as Array<Record<string, unknown>>,
		loadingDevices: false,
		selectedExistingDevice: '',
		showRegisterForm: false,
	});

	// OTP state
	const [otpState, setOtpState] = useState({
		otpSent: false,
		sendError: null as string | null,
		sendRetryCount: 0,
	});

	// Validation state
	const [validationState, setValidationState] = useState({
		validationAttempts: 0,
		lastValidationError: null as string | null,
	});

	// State to trigger device loading - updated from render function
	const [deviceLoadTrigger, setDeviceLoadTrigger] = useState<{
		currentStep: number;
		environmentId: string;
		username: string;
		tokenValid: boolean;
	} | null>(null);

	// Load devices when entering step 1 - moved to parent component level
	useEffect(() => {
		if (!deviceLoadTrigger) return;

		const loadDevices = async () => {
			if (!deviceLoadTrigger.environmentId || !deviceLoadTrigger.username || !deviceLoadTrigger.tokenValid) {
				return;
			}

			if (deviceLoadTrigger.currentStep === 1 && deviceSelection.existingDevices.length === 0 && !deviceSelection.loadingDevices) {
				setDeviceSelection((prev) => ({ ...prev, loadingDevices: true }));

				try {
					const credentials: MFACredentials = {
						environmentId: deviceLoadTrigger.environmentId,
						username: deviceLoadTrigger.username,
					};
					const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
					const devices = await controller.loadExistingDevices(credentials, tokenStatus);
					setDeviceSelection({
						existingDevices: devices,
						loadingDevices: false,
						selectedExistingDevice: devices.length === 0 ? 'new' : '',
						showRegisterForm: devices.length === 0,
					});
				} catch (error) {
					console.error(`${MODULE_TAG} Failed to load devices`, error);
					setDeviceSelection((prev) => ({
						...prev,
						loadingDevices: false,
						selectedExistingDevice: 'new',
						showRegisterForm: true,
					}));
				}
			}
		};

		loadDevices();
	}, [deviceLoadTrigger?.currentStep, deviceLoadTrigger?.environmentId, deviceLoadTrigger?.username, deviceLoadTrigger?.tokenValid]);

	// Step 1: Device Selection/Registration (using controller)
	const renderStep1WithSelection = (props: MFAFlowBaseRenderProps) => {
		const { credentials, setCredentials, mfaState, setMfaState, nav, setIsLoading, isLoading, setShowDeviceLimitModal, tokenStatus } = props;

		// Update trigger state for device loading effect (only when on step 1 and values changed)
		if (nav.currentStep === 1) {
			const newTrigger = {
				currentStep: nav.currentStep,
				environmentId: credentials.environmentId || '',
				username: credentials.username || '',
				tokenValid: tokenStatus.isValid,
			};
			// Only update if values actually changed to avoid infinite loops
			if (
				!deviceLoadTrigger ||
				deviceLoadTrigger.currentStep !== newTrigger.currentStep ||
				deviceLoadTrigger.environmentId !== newTrigger.environmentId ||
				deviceLoadTrigger.username !== newTrigger.username ||
				deviceLoadTrigger.tokenValid !== newTrigger.tokenValid
			) {
				setDeviceLoadTrigger(newTrigger);
			}
		}

		// Handle selecting an existing device
		const handleSelectExistingDevice = (deviceId: string) => {
			setDeviceSelection((prev) => ({
				...prev,
				selectedExistingDevice: deviceId,
				showRegisterForm: false,
			}));
			const device = deviceSelection.existingDevices.find((d: Record<string, unknown>) => d.id === deviceId);
			if (device) {
				setMfaState({
					...mfaState,
					deviceId: deviceId,
					deviceStatus: (device.status as string) || 'ACTIVE',
					nickname: (device.nickname as string) || (device.name as string) || '',
				});
			}
		};

		// Handle selecting "new device"
		const handleSelectNewDevice = () => {
			setDeviceSelection((prev) => ({
				...prev,
				selectedExistingDevice: 'new',
				showRegisterForm: true,
			}));
			setMfaState({
				...mfaState,
				deviceId: '',
				deviceStatus: '',
			});
			// Reset device name to device type when selecting new device
			setCredentials({
				...credentials,
				deviceName: credentials.deviceType || 'EMAIL',
			});
		};

		// Handle using selected existing device - trigger authentication flow
		const handleUseSelectedDevice = async () => {
			if (deviceSelection.selectedExistingDevice && deviceSelection.selectedExistingDevice !== 'new') {
				const device = deviceSelection.existingDevices.find((d: Record<string, unknown>) => d.id === deviceSelection.selectedExistingDevice);
				if (!device) {
					toastV8.error('Device not found');
					return;
				}

				setIsLoading(true);
				try {
					// Initialize device authentication for existing device
					const authResult = await controller.initializeDeviceAuthentication(
						credentials,
						deviceSelection.selectedExistingDevice
					);

					// Update state with authentication info
					// Don't check device status - just trigger authentication immediately
					setMfaState({
						...mfaState,
						deviceId: deviceSelection.selectedExistingDevice,
						nickname: (device.nickname as string) || (device.name as string) || '',
						authenticationId: authResult.authenticationId,
						nextStep: authResult.nextStep,
					});

					// Handle nextStep response
					if (authResult.nextStep === 'COMPLETED') {
						// Authentication already complete
						nav.markStepComplete();
						nav.goToStep(4); // Go to success step
						toastV8.success('Authentication successful!');
					} else if (authResult.nextStep === 'OTP_REQUIRED') {
						// Navigate to Send OTP step (Step 3) to allow resend / instructions, then to validation
						setOtpState({
							otpSent: true,
							sendRetryCount: 0,
							sendError: null,
						});
						nav.markStepComplete();
						nav.goToStep(3); // Proceed to Send OTP step
						toastV8.success('OTP sent to your email. Proceed to validate the code.');
					} else if (authResult.nextStep === 'SELECTION_REQUIRED') {
						// Shouldn't happen if deviceId is provided, but handle it
						nav.setValidationErrors(['Multiple devices found. Please select a specific device.']);
						toastV8.warning('Please select a specific device');
					} else {
						nav.markStepComplete();
						nav.goToStep(3); // Default to Send OTP step for email authentication
						toastV8.success('Device selected successfully! Follow the next steps to finish.');
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					console.error(`${MODULE_TAG} Failed to initialize authentication:`, error);
					nav.setValidationErrors([`Failed to authenticate: ${errorMessage}`]);
					toastV8.error(`Authentication failed: ${errorMessage}`);
				} finally {
					setIsLoading(false);
				}
			}
		};

		// Handle device registration
		const handleRegisterDevice = async () => {
			if (!credentials.email?.trim()) {
				nav.setValidationErrors(['Email address is required. Please enter a valid email address.']);
				return;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
				nav.setValidationErrors(['Please enter a valid email address format.']);
				return;
			}
			// Set default device name to device type if not provided
			const finalDeviceName = credentials.deviceName?.trim() || credentials.deviceType || 'EMAIL';
			if (!finalDeviceName) {
				nav.setValidationErrors(['Device name is required. Please enter a name for this device.']);
				return;
			}
			// Update credentials with device name if it was empty
			if (!credentials.deviceName?.trim()) {
				setCredentials({ ...credentials, deviceName: finalDeviceName });
			}

			setIsLoading(true);
			try {
				// Ensure device name is set before registration
				const registrationCredentials = {
					...credentials,
					deviceName: finalDeviceName,
				};
				const result = await controller.registerDevice(registrationCredentials, controller.getDeviceRegistrationParams(registrationCredentials));
				
				setMfaState({
					...mfaState,
					deviceId: result.deviceId,
					deviceStatus: result.status,
				});

				// Refresh device list
				const devices = await controller.loadExistingDevices(registrationCredentials, tokenStatus);
				setDeviceSelection((prev) => ({
					...prev,
					existingDevices: devices,
				}));

				// Automatically send OTP after device registration
				console.log(`${MODULE_TAG} Device registered, automatically sending OTP...`);
				try {
					await controller.sendOTP(
						registrationCredentials,
						result.deviceId,
						otpState,
						setOtpState,
						nav,
						setIsLoading
					);
					// OTP sent successfully, navigate to validation step
					nav.markStepComplete();
					nav.goToNext(); // Go to Validate OTP step (Step 4)
					toastV8.success('Email device registered and OTP sent successfully!');
				} catch (otpError) {
					// Device registered but OTP send failed - still navigate to Send OTP step
					console.error(`${MODULE_TAG} Device registered but OTP send failed:`, otpError);
					nav.markStepComplete();
					nav.goToNext(); // Go to Send OTP step (Step 3) so user can retry
					toastV8.success('Email device registered successfully!');
					toastV8.warning('OTP could not be sent automatically. Please send it manually on the next step.');
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				const isDeviceLimitError =
					errorMessage.toLowerCase().includes('exceed') ||
					errorMessage.toLowerCase().includes('limit') ||
					errorMessage.toLowerCase().includes('maximum');

				if (isDeviceLimitError) {
					setShowDeviceLimitModal(true);
					nav.setValidationErrors([`Device registration failed: ${errorMessage}`]);
					toastV8.error('Device limit exceeded. Please delete an existing device first.');
				} else {
					nav.setValidationErrors([`Failed to register device: ${errorMessage}`]);
					toastV8.error(`Registration failed: ${errorMessage}`);
				}
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<div className="step-content">
				<h2>Select or Register Email Device</h2>
				<p>Choose an existing device or register a new one</p>

				<MFADeviceSelector
					devices={deviceSelection.existingDevices as Array<{ id: string; type: string; nickname?: string; name?: string; email?: string; status?: string }>}
					loading={deviceSelection.loadingDevices}
					selectedDeviceId={deviceSelection.selectedExistingDevice}
					deviceType="EMAIL"
					onSelectDevice={handleSelectExistingDevice}
					onSelectNew={handleSelectNewDevice}
					onUseSelected={handleUseSelectedDevice}
					renderDeviceInfo={(device) => (
						<>
							{device.email && `Email: ${device.email}`}
							{device.status && ` • Status: ${device.status}`}
						</>
					)}
				/>

				{deviceSelection.showRegisterForm && (
					<div>
						<div className="info-box">
							<p>
								<strong>Username:</strong> {credentials.username}
							</p>
						</div>

						<div className="form-group" style={{ marginTop: '0' }}>
							<label htmlFor="mfa-device-type-register">
								Device Type <span className="required">*</span>
								<MFAInfoButtonV8 contentKey="device.enrollment" displayMode="tooltip" />
							</label>
							<select
								id="mfa-device-type-register"
								value={credentials.deviceType}
								onChange={(e) => {
									const newDeviceType = e.target.value as DeviceType;
									// If device name matches old device type, update it to new device type
									// Otherwise, if device name is empty, set it to new device type
									const oldDeviceType = credentials.deviceType;
									const shouldUpdateDeviceName = 
										!credentials.deviceName?.trim() || 
										credentials.deviceName === oldDeviceType;
									const updatedCredentials = {
										...credentials,
										deviceType: newDeviceType,
										deviceName: shouldUpdateDeviceName ? newDeviceType : credentials.deviceName,
									};
									setCredentials(updatedCredentials);
									// Save credentials and trigger flow reload
									CredentialsServiceV8.saveCredentials('mfa-flow-v8', updatedCredentials);
									// Dispatch event to notify router
									window.dispatchEvent(new CustomEvent('mfaDeviceTypeChanged', { detail: newDeviceType }));
									// Reload to switch to new device type flow
									setTimeout(() => {
										window.location.reload();
									}, 100);
								}}
								style={{
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									color: '#1f2937',
									background: 'white',
									width: '100%',
									cursor: 'pointer',
								}}
							>
								<option value="SMS">📱 SMS (Text Message)</option>
								<option value="EMAIL">📧 Email</option>
								<option value="TOTP">🔐 TOTP (Authenticator App)</option>
								<option value="FIDO2">🔑 FIDO2 (Security Key / Passkey)</option>
								<option value="MOBILE">📲 Mobile (PingID)</option>
								<option value="OATH_TOKEN">🎫 OATH Token (PingID)</option>
								<option value="VOICE">📞 Voice</option>
								<option value="WHATSAPP">💬 WhatsApp</option>
								<option value="PLATFORM">🔒 Platform (FIDO2 Biometrics - Deprecated)</option>
								<option value="SECURITY_KEY">🔐 Security Key (FIDO2/U2F - Deprecated)</option>
							</select>
							<small>Select the type of MFA device you want to register</small>
						</div>

						{credentials.deviceType === 'EMAIL' && (
							<>
								<div className="form-group" style={{ marginTop: '0' }}>
									<label htmlFor="mfa-email-register">
										Email Address <span className="required">*</span>
									</label>
									<input
										id="mfa-email-register"
										type="email"
										value={credentials.email}
										onChange={(e) => setCredentials({ ...credentials, email: e.target.value.trim() })}
										placeholder="user@example.com"
										style={{
											padding: '10px 12px',
											border: `1px solid ${
												credentials.email
													? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)
														? '#10b981'
														: '#ef4444'
													: '#d1d5db'
											}`,
											borderRadius: '6px',
											fontSize: '14px',
											color: '#1f2937',
											background: 'white',
											width: '100%',
										}}
									/>
									<small>
										Enter a valid email address
										{credentials.email && (
											<span
												style={{
													marginLeft: '8px',
													color: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email) ? '#10b981' : '#ef4444',
													fontWeight: '500',
												}}
											>
												{/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)
													? `✓ Valid (${credentials.email})`
													: '✗ Invalid email format'}
											</span>
										)}
									</small>
								</div>

								<div className="form-group" style={{ marginTop: '0' }}>
									<label htmlFor="mfa-device-name-register">
										Device Name <span className="required">*</span>
									</label>
									<input
										id="mfa-device-name-register"
										type="text"
										value={credentials.deviceName || credentials.deviceType || 'EMAIL'}
										onChange={(e) => setCredentials({ ...credentials, deviceName: e.target.value })}
										placeholder={credentials.deviceType || 'EMAIL'}
										style={{
											padding: '10px 12px',
											border: `1px solid ${credentials.deviceName ? '#10b981' : '#d1d5db'}`,
											borderRadius: '6px',
											fontSize: '14px',
											color: '#1f2937',
											background: 'white',
											width: '100%',
										}}
									/>
									<small>
										Enter a friendly name to identify this device (e.g., "My Work Email", "Personal Email")
										{credentials.deviceName && (
											<span
												style={{
													marginLeft: '8px',
													color: '#10b981',
													fontWeight: '500',
												}}
											>
												✓ Device will be registered as: "{credentials.deviceName}"
											</span>
										)}
									</small>
								</div>

								<div
									style={{
										marginBottom: '16px',
										padding: '12px',
										background: '#fef3c7',
										border: '1px solid #fbbf24',
										borderRadius: '6px',
									}}
								>
									<p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#92400e' }}>
										📋 Email Address Preview:
									</p>
									<p style={{ margin: '0', fontSize: '14px', fontFamily: 'monospace', color: '#1f2937' }}>
										<strong>Will register:</strong> {credentials.email}
									</p>
								</div>

								<button
									type="button"
									className="btn btn-primary"
									disabled={isLoading || !credentials.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email) || !credentials.deviceName?.trim()}
									onClick={handleRegisterDevice}
								>
									{isLoading ? '🔄 Registering...' : 'Register Email Device'}
								</button>
							</>
						)}
					</div>
				)}

				{mfaState.deviceId && (
					<div className="success-box" style={{ marginTop: '20px' }}>
						<h3>✅ Device Ready</h3>
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Status:</strong> {mfaState.deviceStatus}
						</p>
					</div>
				)}
			</div>
		);
	};

	// Step 2: Send OTP (using controller)
	const createRenderStep2 = (
		otpSent: boolean,
		setOtpSent: (value: boolean) => void,
		sendError: string | null,
		setSendError: (value: string | null) => void,
		sendRetryCount: number,
		setSendRetryCount: (value: number | ((prev: number) => number)) => void
	) => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, nav, setIsLoading, isLoading } = props;

			const handleSendOTP = async () => {
				await controller.sendOTP(
					credentials,
					mfaState.deviceId,
					{ otpSent, sendError, sendRetryCount },
					(state) => {
						if (typeof state === 'function') {
							const current = { otpSent, sendError, sendRetryCount };
							const updated = state(current);
							setOtpSent(updated.otpSent ?? current.otpSent);
							setSendError(updated.sendError ?? current.sendError);
							setSendRetryCount(updated.sendRetryCount ?? current.sendRetryCount);
						} else {
							if (state.otpSent !== undefined) setOtpSent(state.otpSent);
							if (state.sendError !== undefined) setSendError(state.sendError);
							if (state.sendRetryCount !== undefined) setSendRetryCount(state.sendRetryCount);
						}
					},
					nav,
					setIsLoading
				);
			};

			return (
				<div className="step-content">
					<h2>
						Send OTP Code
						<MFAInfoButtonV8 contentKey="factor.email" displayMode="modal" />
					</h2>
					<p>Send a one-time password to the registered email address</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Email Address:</strong> {credentials.email}
						</p>
						{sendRetryCount > 0 && (
							<p style={{ marginTop: '8px', fontSize: '13px', color: '#92400e' }}>
								⚠️ Attempt {sendRetryCount + 1} - If you continue to have issues, check your email address and try again.
							</p>
						)}
					</div>

					<div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
						<button
							type="button"
							className="btn btn-primary"
							onClick={handleSendOTP}
							disabled={isLoading}
						>
							{isLoading ? '🔄 Sending...' : otpSent ? '🔄 Resend OTP Code' : 'Send OTP Code'}
						</button>

						{otpSent && (
							<button
								type="button"
								className="btn"
								onClick={() => {
									setOtpSent(false);
									setSendRetryCount(0);
									setSendError(null);
								}}
								style={{
									background: '#f3f4f6',
									color: '#374151',
									border: '1px solid #d1d5db',
								}}
							>
								Clear Status
							</button>
						)}
					</div>

					{sendError && (
						<div
							className="info-box"
							style={{
								background: '#fef2f2',
								border: '1px solid #fecaca',
								color: '#991b1b',
								marginTop: '16px',
							}}
						>
							<h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>⚠️ Error Sending OTP</h4>
							<p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{sendError}</p>
							<div style={{ marginTop: '12px', fontSize: '13px' }}>
								<strong>Recovery Options:</strong>
								<ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
									<li>Verify your email address is correct</li>
									<li>Check that your worker token is valid</li>
									<li>Wait a few minutes and try again (rate limiting)</li>
									<li>Go back and select a different device</li>
								</ul>
							</div>
						</div>
					)}

					{otpSent && !sendError && (
						<div className="success-box" style={{ marginTop: '20px' }}>
							<h3>✅ OTP Sent</h3>
							<p>Check your email for the verification code</p>
							<p style={{ marginTop: '12px', fontSize: '14px' }}>
								After receiving the code, proceed to the next step to validate it.
							</p>
							<p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
								💡 <strong>Tip:</strong> OTP codes typically expire after 5-10 minutes. If you don't receive the code, click "Resend OTP Code" above.
							</p>
						</div>
					)}
				</div>
			);
		};
	};

	// Step 3: Validate OTP (using controller)
	const createRenderStep3 = (
		validationAttempts: number,
		setValidationAttempts: (value: number | ((prev: number) => number)) => void,
		lastValidationError: string | null,
		setLastValidationError: (value: string | null) => void,
		otpState: { otpSent: boolean; sendError: string | null; sendRetryCount: number },
		setOtpState: (state: Partial<typeof otpState> | ((prev: typeof otpState) => Partial<typeof otpState>)) => void
	) => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading } = props;

			// If validation is complete, show success screen
			if (mfaState.verificationResult && mfaState.verificationResult.status === 'COMPLETED') {
				return (
					<div className="step-content">
						<h2>MFA Verification Complete</h2>
						<p>Your Email device has been successfully verified</p>

						<div className="success-box">
							<h3>✅ Verification Successful</h3>
							<p>
								<strong>Device ID:</strong> {mfaState.deviceId}
							</p>
							{mfaState.nickname && (
								<p>
									<strong>Nickname:</strong> {mfaState.nickname}
								</p>
							)}
							<p>
								<strong>Email Address:</strong> {credentials.email}
							</p>
							<p>
								<strong>Status:</strong>{' '}
								{mfaState.verificationResult?.status || mfaState.deviceStatus || 'Verified'}
							</p>
							{mfaState.verificationResult?.message && (
								<p>
									<strong>Message:</strong> {mfaState.verificationResult.message}
								</p>
							)}
							{mfaState.environmentId && (
								<p>
									<strong>Environment ID:</strong> {mfaState.environmentId}
								</p>
							)}
							{mfaState.userId && (
								<p>
									<strong>User ID:</strong> {mfaState.userId}
								</p>
							)}
							{mfaState.createdAt && (
								<p>
									<strong>Created At:</strong> {new Date(mfaState.createdAt).toLocaleString()}
								</p>
							)}
							{mfaState.updatedAt && (
								<p>
									<strong>Updated At:</strong> {new Date(mfaState.updatedAt).toLocaleString()}
								</p>
							)}
						</div>

						<div className="info-box">
							<h4>What's Next?</h4>
							<ul>
								<li>This device can now be used for MFA challenges</li>
								<li>Users will receive OTP codes via email during authentication</li>
								<li>You can test MFA in your authentication flows</li>
							</ul>
						</div>
					</div>
				);
			}

			// Show validation UI
			return (
				<div className="step-content">
					<h2>
						Validate OTP Code
						<MFAInfoButtonV8 contentKey="otp.validation" displayMode="modal" />
					</h2>
					<p>Enter the verification code sent to your email</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Email Address:</strong> {credentials.email}
						</p>
					</div>

					<MFAOTPInput
						value={mfaState.otpCode}
						onChange={(value) => setMfaState({ ...mfaState, otpCode: value })}
						disabled={isLoading}
					/>
					<small>Enter the 6-digit code from your email</small>

					<div style={{ display: 'flex', gap: '12px', marginTop: '20px', marginBottom: '20px' }}>
						<button
							type="button"
							className="btn btn-primary"
							disabled={isLoading || mfaState.otpCode.length !== 6}
							onClick={async () => {
								// Use authentication endpoint if authenticationId exists (existing device)
								// Otherwise use registration endpoint (new device)
								if (mfaState.authenticationId) {
									await controller.validateOTPForDevice(
										credentials,
										mfaState.authenticationId,
										mfaState.otpCode,
										mfaState,
										setMfaState,
										{ validationAttempts, lastValidationError },
										(state) => {
											if (typeof state === 'function') {
												const current = { validationAttempts, lastValidationError };
												const updated = state(current);
												setValidationAttempts(updated.validationAttempts ?? current.validationAttempts);
												setLastValidationError(updated.lastValidationError ?? current.lastValidationError);
											} else {
												if (state.validationAttempts !== undefined) setValidationAttempts(state.validationAttempts);
												if (state.lastValidationError !== undefined) setLastValidationError(state.lastValidationError);
											}
										},
										nav,
										setIsLoading
									);
								} else {
									await controller.validateOTP(
										credentials,
										mfaState.deviceId,
										mfaState.otpCode,
										mfaState,
										setMfaState,
										{ validationAttempts, lastValidationError },
										(state) => {
											if (typeof state === 'function') {
												const current = { validationAttempts, lastValidationError };
												const updated = state(current);
												setValidationAttempts(updated.validationAttempts ?? current.validationAttempts);
												setLastValidationError(updated.lastValidationError ?? current.lastValidationError);
											} else {
												if (state.validationAttempts !== undefined) setValidationAttempts(state.validationAttempts);
												if (state.lastValidationError !== undefined) setLastValidationError(state.lastValidationError);
											}
										},
										nav,
										setIsLoading
									);
								}
							}}
						>
							{isLoading ? '🔄 Validating...' : 'Validate OTP'}
						</button>

						{/* Only show resend button for registration flow (not authentication) */}
						{!mfaState.authenticationId && (
							<button
								type="button"
								className="btn"
								disabled={isLoading}
								onClick={async () => {
									// Resend OTP directly from validation step (registration flow only)
									setIsLoading(true);
									try {
										await controller.sendOTP(
											credentials,
											mfaState.deviceId,
											otpState,
											setOtpState,
											nav,
											setIsLoading
										);
										toastV8.success('OTP code resent successfully!');
									} catch (error) {
										const errorMessage = error instanceof Error ? error.message : 'Unknown error';
										toastV8.error(`Failed to resend OTP: ${errorMessage}`);
									} finally {
										setIsLoading(false);
									}
								}}
								style={{
									background: '#f3f4f6',
									color: '#374151',
									border: '1px solid #d1d5db',
								}}
							>
								{isLoading ? '🔄 Sending...' : '🔄 Resend OTP Code'}
							</button>
						)}
					</div>

					{validationAttempts > 0 && (
						<div
							className="info-box"
							style={{
								background: validationAttempts >= 3 ? '#fef2f2' : '#fffbeb',
								border: `1px solid ${validationAttempts >= 3 ? '#fecaca' : '#fed7aa'}`,
								color: validationAttempts >= 3 ? '#991b1b' : '#92400e',
								marginTop: '16px',
							}}
						>
							<h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>
								{validationAttempts >= 3 ? '⚠️ Multiple Failed Attempts' : '⚠️ Validation Failed'}
							</h4>
							<p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
								{lastValidationError || 'Invalid OTP code entered'}
							</p>
							{validationAttempts >= 3 && (
								<div style={{ marginTop: '12px', fontSize: '13px' }}>
									<strong>Recovery Options:</strong>
									<ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
										<li>Click "Request New Code" to get a fresh OTP</li>
										<li>Verify you're entering the code from the most recent email</li>
										<li>Check that the code hasn't expired (typically 5-10 minutes)</li>
										<li>Go back and select a different device if available</li>
									</ul>
								</div>
							)}
						</div>
					)}
				</div>
			);
		};
	};

	// Validation function for Step 0
	const validateStep0 = (
		credentials: MFACredentials,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	): boolean => {
		return controller.validateCredentials(credentials, tokenStatus, nav);
	};

	return (
		<>
			<MFAFlowBaseV8
				deviceType="EMAIL"
				renderStep0={renderStep0}
				renderStep1={renderStep1WithSelection}
				renderStep2={createRenderStep2(otpState.otpSent, (v) => setOtpState({ ...otpState, otpSent: v }), otpState.sendError, (v) => setOtpState({ ...otpState, sendError: v }), otpState.sendRetryCount, (v) => setOtpState({ ...otpState, sendRetryCount: typeof v === 'function' ? v(otpState.sendRetryCount) : v }))}
				renderStep3={createRenderStep3(
					validationState.validationAttempts,
					(v) => setValidationState({ ...validationState, validationAttempts: typeof v === 'function' ? v(validationState.validationAttempts) : v }),
					validationState.lastValidationError,
					(v) => setValidationState({ ...validationState, lastValidationError: v }),
					otpState,
					setOtpState
				)}
				validateStep0={validateStep0}
				stepLabels={['Configure', 'Select/Register Device', 'Send OTP', 'Validate']}
			/>
			<SuperSimpleApiDisplayV8 />
		</>
	);
};

// Main Email Flow Component
export const EmailFlowV8: React.FC = () => {
	return <EmailFlowV8WithDeviceSelection />;
};
