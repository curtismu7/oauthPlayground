/**
 * @file TOTPFlowV8.tsx
 * @module v8/flows/types
 * @description TOTP-specific MFA flow component (Refactored with Controller Pattern)
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

const MODULE_TAG = '[🔐 TOTP-FLOW-V8]';

// Step 0: Configure Credentials (TOTP-specific - no phone/email needed)
const renderStep0 = (props: MFAFlowBaseRenderProps) => {
	const { credentials, setCredentials, tokenStatus } = props;

	return (
		<div className="step-content">
			<h2>
				Configure MFA Settings
				<MFAInfoButtonV8 contentKey="device.enrollment" displayMode="modal" />
			</h2>
			<p>Enter your PingOne environment details and user information</p>

			{/* Worker Token Status */}
			<div style={{ marginBottom: '20px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
					<button
						type="button"
						onClick={() => {
							if (tokenStatus.isValid) {
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
							padding: '10px 16px',
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
							padding: '10px 16px',
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
const TOTPFlowV8WithDeviceSelection: React.FC = () => {
	// Initialize controller using factory
	const controller = useMemo(() => 
		MFAFlowControllerFactory.create({ deviceType: 'TOTP' }), []
	);

	// Device selection state
	const [deviceSelection, setDeviceSelection] = useState({
		existingDevices: [] as Array<Record<string, unknown>>,
		loadingDevices: false,
		selectedExistingDevice: '',
		showRegisterForm: false,
	});

	// TOTP-specific state (QR code, secret)
	const [totpSecret, setTotpSecret] = useState<string>('');
	const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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
		const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading, setShowDeviceLimitModal, tokenStatus } = props;

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
			// Set default device name based on device type if not already set
			if (!credentials.deviceName?.trim()) {
				setCredentials({
					...credentials,
					deviceName: credentials.deviceType || 'TOTP',
				});
			}
		};

		// Handle using selected existing device
		const handleUseSelectedDevice = () => {
			if (deviceSelection.selectedExistingDevice && deviceSelection.selectedExistingDevice !== 'new') {
				nav.markStepComplete();
				toastV8.success('Device selected successfully!');
			}
		};

		// Handle device registration
		const handleRegisterDevice = async () => {
			setIsLoading(true);
			try {
				const result = await controller.registerDevice(credentials, controller.getDeviceRegistrationParams(credentials));
				
				// TOTP devices return secret and QR code in the response
				const deviceResponse = result as Record<string, unknown> & {
					secret?: string;
					qrCode?: { href?: string };
				};

				setMfaState({
					...mfaState,
					deviceId: result.deviceId,
					deviceStatus: result.status,
				});

				// Store TOTP-specific data
				if (deviceResponse.secret) {
					setTotpSecret(deviceResponse.secret as string);
				}
				if (deviceResponse.qrCode?.href) {
					setQrCodeUrl(deviceResponse.qrCode.href as string);
				}

				// Refresh device list
				const devices = await controller.loadExistingDevices(credentials, tokenStatus);
				setDeviceSelection((prev) => ({
					...prev,
					existingDevices: devices,
				}));

				nav.markStepComplete();
				toastV8.success('TOTP device registered successfully!');
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
				<h2>Select or Register TOTP Device</h2>
				<p>Choose an existing device or register a new authenticator app</p>

				<MFADeviceSelector
					devices={deviceSelection.existingDevices as Array<{ id: string; type: string; nickname?: string; name?: string; status?: string }>}
					loading={deviceSelection.loadingDevices}
					selectedDeviceId={deviceSelection.selectedExistingDevice}
					deviceType="TOTP"
					onSelectDevice={handleSelectExistingDevice}
					onSelectNew={handleSelectNewDevice}
					onUseSelected={handleUseSelectedDevice}
					renderDeviceInfo={(device) => (
						<>
							{device.status && `Status: ${device.status}`}
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
									// Set default device name based on device type if not already set
									const defaultDeviceName = newDeviceType;
									const updatedCredentials = {
										...credentials,
										deviceType: newDeviceType,
										deviceName: credentials.deviceName || defaultDeviceName,
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

						<button
							type="button"
							className="btn btn-primary"
							disabled={isLoading}
							onClick={handleRegisterDevice}
						>
							{isLoading ? '🔄 Registering...' : 'Register TOTP Device'}
						</button>
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
						{totpSecret && (
							<div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
								<p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600' }}>
									🔑 Secret Key:
								</p>
								<p style={{ margin: '0', fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all' }}>
									{totpSecret}
								</p>
							</div>
						)}
						{qrCodeUrl && (
							<div style={{ marginTop: '16px', textAlign: 'center' }}>
								<p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
									📱 QR Code:
								</p>
								<img src={qrCodeUrl} alt="TOTP QR Code" style={{ maxWidth: '300px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
								<p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
									Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		);
	};

	// Step 2: TOTP Device Ready (skip OTP sending - codes come from app)
	const createRenderStep2 = () => {
		return (props: MFAFlowBaseRenderProps) => {
			const { mfaState } = props;

			return (
				<div className="step-content">
					<h2>
						TOTP Device Ready
						<MFAInfoButtonV8 contentKey="factor.totp" displayMode="modal" />
					</h2>
					<p>Your authenticator app is set up and ready to use</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Status:</strong> {mfaState.deviceStatus || 'Ready'}
						</p>
					</div>

					<div className="success-box" style={{ marginTop: '20px' }}>
						<h3>✅ Setup Complete</h3>
						<p>Your TOTP device has been registered successfully.</p>
						<p style={{ marginTop: '12px', fontSize: '14px' }}>
							Open your authenticator app and enter the 6-digit code to verify the setup.
						</p>
						<p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
							💡 <strong>Tip:</strong> TOTP codes refresh every 30 seconds. Make sure you're entering the current code from your app.
						</p>
					</div>
				</div>
			);
		};
	};

	// Step 3: Validate OTP (using controller)
	const createRenderStep3 = (
		validationAttempts: number,
		setValidationAttempts: (value: number | ((prev: number) => number)) => void,
		lastValidationError: string | null,
		setLastValidationError: (value: string | null) => void
	) => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading } = props;

			// If validation is complete, show success screen
			if (mfaState.verificationResult && mfaState.verificationResult.status === 'COMPLETED') {
				return (
					<div className="step-content">
						<h2>MFA Verification Complete</h2>
						<p>Your TOTP device has been successfully verified</p>

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
								<strong>Status:</strong>{' '}
								{mfaState.verificationResult?.status || mfaState.deviceStatus || 'Verified'}
							</p>
							{mfaState.verificationResult?.message && (
								<p>
									<strong>Message:</strong> {mfaState.verificationResult.message}
								</p>
							)}
						</div>

						<div className="info-box">
							<h4>What's Next?</h4>
							<ul>
								<li>This device can now be used for MFA challenges</li>
								<li>Users will generate codes using their authenticator app</li>
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
					<p>Enter the 6-digit code from your authenticator app</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Device Name:</strong> {mfaState.nickname || 'TOTP Device'}
						</p>
					</div>

					<MFAOTPInput
						value={mfaState.otpCode}
						onChange={(value) => setMfaState({ ...mfaState, otpCode: value })}
						disabled={isLoading}
					/>
					<small>Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.)</small>

					<div style={{ display: 'flex', gap: '12px', marginTop: '20px', marginBottom: '20px' }}>
						<button
							type="button"
							className="btn btn-primary"
							disabled={isLoading || mfaState.otpCode.length !== 6}
							onClick={async () => {
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
							}}
						>
							{isLoading ? '🔄 Validating...' : 'Validate OTP'}
						</button>
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
										<li>Make sure you're entering the current code (codes refresh every 30 seconds)</li>
										<li>Verify your device time is synchronized</li>
										<li>Check that you scanned the QR code correctly</li>
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
				deviceType="TOTP"
				renderStep0={renderStep0}
				renderStep1={renderStep1WithSelection}
				renderStep2={createRenderStep2()}
				renderStep3={createRenderStep3(validationState.validationAttempts, (v) => setValidationState({ ...validationState, validationAttempts: typeof v === 'function' ? v(validationState.validationAttempts) : v }), validationState.lastValidationError, (v) => setValidationState({ ...validationState, lastValidationError: v }))}
				validateStep0={validateStep0}
				stepLabels={['Configure', 'Select/Register Device', 'Device Ready', 'Validate']}
			/>
			<SuperSimpleApiDisplayV8 />
		</>
	);
};

// Main TOTP Flow Component
export const TOTPFlowV8: React.FC = () => {
	return <TOTPFlowV8WithDeviceSelection />;
};

