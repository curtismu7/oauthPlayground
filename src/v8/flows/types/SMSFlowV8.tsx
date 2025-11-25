/**
 * @file SMSFlowV8.tsx
 * @module v8/flows/types
 * @description SMS-specific MFA flow component (Refactored with Controller Pattern)
 * @version 8.2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CountryCodePickerV8 } from '@/v8/components/CountryCodePickerV8';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAFlowBaseV8, type MFAFlowBaseRenderProps } from '../shared/MFAFlowBaseV8';
import type { MFACredentials } from '../shared/MFATypes';
import { getFullPhoneNumber } from '../controllers/SMSFlowController';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFADeviceSelector } from '../components/MFADeviceSelector';
import { MFAOTPInput } from '../components/MFAOTPInput';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';

const MODULE_TAG = '[📱 SMS-FLOW-V8]';

// Step 0: Configure Credentials (SMS-specific)
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

				<div className="form-group">
					<label htmlFor="mfa-phone">
						Phone Number <span className="required">*</span>
						<MFAInfoButtonV8 contentKey="phone.number" displayMode="tooltip" />
					</label>
					<div style={{ display: 'flex', gap: '0' }}>
						<CountryCodePickerV8
							value={credentials.countryCode}
							onChange={(code) => setCredentials({ ...credentials, countryCode: code })}
						/>
						<input
							id="mfa-phone"
							type="tel"
							value={credentials.phoneNumber}
							onChange={(e) => {
								const cleaned = e.target.value.replace(/[^\d\s-]/g, '');
								setCredentials({ ...credentials, phoneNumber: cleaned });
							}}
							placeholder={credentials.countryCode === '+1' ? '5125201234' : '234567890'}
							style={{
								flex: 1,
								padding: '10px 12px',
								border: `1px solid ${
									credentials.phoneNumber
										? credentials.countryCode === '+1'
											? credentials.phoneNumber.replace(/[^\d]/g, '').length === 10
												? '#10b981'
												: '#ef4444'
											: credentials.phoneNumber.replace(/[^\d]/g, '').length >= 6
												? '#10b981'
												: '#ef4444'
										: '#d1d5db'
								}`,
								borderRadius: '0 6px 6px 0',
								fontSize: '14px',
								fontFamily: 'monospace',
								color: '#1f2937',
								background: 'white',
							}}
						/>
					</div>
					<small>
						{credentials.countryCode === '+1' ? (
							<>
								US/Canada: Enter 10-digit number (area code + number)
								{credentials.phoneNumber && (
									<span
										style={{
											marginLeft: '8px',
											color:
												credentials.phoneNumber.replace(/[^\d]/g, '').length === 10
													? '#10b981'
													: '#ef4444',
											fontWeight: '500',
										}}
									>
										{credentials.phoneNumber.replace(/[^\d]/g, '').length === 10
											? `✓ Valid (${getFullPhoneNumber(credentials)})`
											: `✗ Need ${10 - credentials.phoneNumber.replace(/[^\d]/g, '').length} more digit${10 - credentials.phoneNumber.replace(/[^\d]/g, '').length === 1 ? '' : 's'}`}
									</span>
								)}
							</>
						) : (
							<>
								Enter phone number without country code (min 6 digits)
								{credentials.phoneNumber && (
									<span
										style={{
											marginLeft: '8px',
											color:
												credentials.phoneNumber.replace(/[^\d]/g, '').length >= 6
													? '#10b981'
													: '#ef4444',
											fontWeight: '500',
										}}
									>
										{credentials.phoneNumber.replace(/[^\d]/g, '').length >= 6
											? `✓ Valid (${getFullPhoneNumber(credentials)})`
											: `✗ Need ${6 - credentials.phoneNumber.replace(/[^\d]/g, '').length} more digit${6 - credentials.phoneNumber.replace(/[^\d]/g, '').length === 1 ? '' : 's'}`}
									</span>
								)}
							</>
						)}
					</small>
				</div>

				</div>
		</div>
	);
};

// Device selection state management wrapper
const SMSFlowV8WithDeviceSelection: React.FC = () => {
	// Initialize controller using factory
	const controller = useMemo(() => 
		MFAFlowControllerFactory.create({ deviceType: 'SMS' }), []
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

	// Step 1: Device Selection/Registration (using controller)
	const renderStep1WithSelection = (props: MFAFlowBaseRenderProps) => {
		const { credentials, setCredentials, mfaState, setMfaState, nav, setIsLoading, isLoading, setShowDeviceLimitModal, tokenStatus } = props;

		// Load devices when entering step 1
		useEffect(() => {
			const loadDevices = async () => {
				if (!credentials.environmentId || !credentials.username || !tokenStatus.isValid) {
					return;
				}

				if (nav.currentStep === 1 && deviceSelection.existingDevices.length === 0 && !deviceSelection.loadingDevices) {
					setDeviceSelection((prev) => ({ ...prev, loadingDevices: true }));

					try {
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
		}, [nav.currentStep, credentials, tokenStatus]);

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
			if (!credentials.phoneNumber?.trim()) {
				nav.setValidationErrors(['Phone number is required. Please enter a valid phone number.']);
				return;
			}

			setIsLoading(true);
			try {
				const result = await controller.registerDevice(credentials, controller.getDeviceRegistrationParams(credentials));
				
				setMfaState({
					...mfaState,
					deviceId: result.deviceId,
					deviceStatus: result.status,
				});

				// Refresh device list
				const devices = await controller.loadExistingDevices(credentials, tokenStatus);
				setDeviceSelection((prev) => ({
					...prev,
					existingDevices: devices,
				}));

				nav.markStepComplete();
				toastV8.success('SMS device registered successfully!');
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
				<h2>Select or Register SMS Device</h2>
				<p>Choose an existing device or register a new one</p>

				<MFADeviceSelector
					devices={deviceSelection.existingDevices.map((d) => ({
						id: d.id as string,
						type: d.type as string,
						nickname: d.nickname || undefined,
						name: d.name || undefined,
						phone: d.phone || undefined,
						status: d.status || undefined,
					}))}
					loading={deviceSelection.loadingDevices}
					selectedDeviceId={deviceSelection.selectedExistingDevice}
					deviceType="SMS"
					onSelectDevice={handleSelectExistingDevice}
					onSelectNew={handleSelectNewDevice}
					onUseSelected={handleUseSelectedDevice}
					renderDeviceInfo={(device) => (
						<>
							{device.phone && `Phone: ${device.phone}`}
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
							<p>
								<strong>Device Type:</strong> 📱 SMS
							</p>
							<p>
								<strong>Phone Number:</strong> {getFullPhoneNumber(credentials)}
							</p>
							<p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
								PingOne format: +[country].[number] (e.g., +1.5125201234)
							</p>
						</div>

						<div className="form-group" style={{ marginTop: '20px' }}>
							<label htmlFor="mfa-device-name-register">
								Device Name <span className="required">*</span>
							</label>
							<input
								id="mfa-device-name-register"
								type="text"
								value={credentials.deviceName}
								onChange={(e) => setCredentials({ ...credentials, deviceName: e.target.value })}
								placeholder="e.g., My Work Phone, John's iPhone, etc."
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
								Enter a friendly name to identify this device (e.g., "My Work Phone", "Home Laptop")
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
								📋 Phone Number Preview:
							</p>
							<p style={{ margin: '0', fontSize: '14px', fontFamily: 'monospace', color: '#1f2937' }}>
								<strong>Will send:</strong> {getFullPhoneNumber(credentials)}
							</p>
							<p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#92400e' }}>
								PingOne format: +[country].[number] (e.g., +1.5125201234)
							</p>
						</div>

						<button
							type="button"
							className="btn btn-primary"
							disabled={isLoading || !credentials.deviceName?.trim()}
							onClick={handleRegisterDevice}
						>
							{isLoading ? '🔄 Registering...' : 'Register SMS Device'}
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
					</div>
				)}
			</div>
		);
	};

	// Step 2: Send OTP (using controller)
	const createRenderStep2 = () => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, nav, setIsLoading, isLoading } = props;

			const handleSendOTP = async () => {
				await controller.sendOTP(
					credentials,
					mfaState.deviceId,
					otpState,
					setOtpState,
					nav,
					setIsLoading
				);
			};

			return (
				<div className="step-content">
					<h2>
						Send OTP Code
						<MFAInfoButtonV8 contentKey="factor.sms" displayMode="modal" />
					</h2>
					<p>Send a one-time password to the registered device</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Phone Number:</strong> {getFullPhoneNumber(credentials)}
						</p>
						{otpState.sendRetryCount > 0 && (
							<p style={{ marginTop: '8px', fontSize: '13px', color: '#92400e' }}>
								⚠️ Attempt {otpState.sendRetryCount + 1} - If you continue to have issues, check your phone number and try again.
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
							{isLoading ? '🔄 Sending...' : otpState.otpSent ? '🔄 Resend OTP Code' : 'Send OTP Code'}
						</button>

						{otpState.otpSent && (
							<button
								type="button"
								className="btn"
								onClick={() => {
									setOtpState({
										otpSent: false,
										sendRetryCount: 0,
										sendError: null,
									});
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

					{otpState.sendError && (
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
							<p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{otpState.sendError}</p>
							<div style={{ marginTop: '12px', fontSize: '13px' }}>
								<strong>Recovery Options:</strong>
								<ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
									<li>Verify your phone number is correct</li>
									<li>Check that your worker token is valid</li>
									<li>Wait a few minutes and try again (rate limiting)</li>
									<li>Go back and select a different device</li>
								</ul>
							</div>
						</div>
					)}

					{otpState.otpSent && !otpState.sendError && (
						<div className="success-box" style={{ marginTop: '20px' }}>
							<h3>✅ OTP Sent</h3>
							<p>Check your phone for the verification code</p>
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
	const createRenderStep3 = () => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading } = props;

			// If validation is complete, show success screen
			if (mfaState.verificationResult && mfaState.verificationResult.status === 'COMPLETED') {
				return (
					<div className="step-content">
						<h2>MFA Verification Complete</h2>
						<p>Your SMS device has been successfully verified</p>

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
								<strong>Phone Number:</strong> {getFullPhoneNumber(credentials)}
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
								<li>Users will receive OTP codes during authentication</li>
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
					<p>Enter the verification code sent to your phone</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Phone Number:</strong> {getFullPhoneNumber(credentials)}
						</p>
					</div>

					<MFAOTPInput
						value={mfaState.otpCode}
						onChange={(value) => setMfaState({ ...mfaState, otpCode: value })}
						disabled={isLoading}
						placeholder="123456"
					/>

					<div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
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
									validationState,
									setValidationState,
									nav,
									setIsLoading
								);
							}}
						>
							{isLoading ? '🔄 Validating...' : 'Validate OTP'}
						</button>

						<button
							type="button"
							className="btn"
							onClick={() => {
								// Go back to step 2 to resend OTP
								nav.goToStep(1);
							}}
							style={{
								background: '#f3f4f6',
								color: '#374151',
								border: '1px solid #d1d5db',
							}}
						>
							↩️ Request New Code
						</button>
					</div>

					{validationState.validationAttempts > 0 && (
						<div
							className="info-box"
							style={{
								background: validationState.validationAttempts >= 3 ? '#fef2f2' : '#fffbeb',
								border: `1px solid ${validationState.validationAttempts >= 3 ? '#fecaca' : '#fed7aa'}`,
								color: validationState.validationAttempts >= 3 ? '#991b1b' : '#92400e',
								marginTop: '16px',
							}}
						>
							<h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>
								{validationState.validationAttempts >= 3 ? '⚠️ Multiple Failed Attempts' : '⚠️ Validation Failed'}
							</h4>
							<p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
								{validationState.lastValidationError || 'Invalid OTP code entered'}
							</p>
							{validationState.validationAttempts >= 3 && (
								<div style={{ marginTop: '12px', fontSize: '13px' }}>
									<strong>Recovery Options:</strong>
									<ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
										<li>Click "Request New Code" to get a fresh OTP</li>
										<li>Verify you're entering the code from the most recent SMS</li>
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

	// Validation function for Step 0 (using controller)
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
				deviceType="SMS"
				renderStep0={renderStep0}
				renderStep1={renderStep1WithSelection}
				renderStep2={createRenderStep2()}
				renderStep3={createRenderStep3()}
				validateStep0={validateStep0}
				stepLabels={['Configure', 'Select/Register Device', 'Send OTP', 'Validate']}
			/>
			<SuperSimpleApiDisplayV8 />
		</>
	);
};

// Main SMS Flow Component
export const SMSFlowV8: React.FC = () => {
	return <SMSFlowV8WithDeviceSelection />;
};
