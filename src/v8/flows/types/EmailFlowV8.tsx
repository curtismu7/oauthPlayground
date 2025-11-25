/**
 * @file EmailFlowV8.tsx
 * @module v8/flows/types
 * @description Email-specific MFA flow component
 * @version 8.1.0
 */

import React, { useEffect, useState } from 'react';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { MFAServiceV8, type RegisterDeviceParams } from '@/v8/services/mfaServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAFlowBaseV8, type MFAFlowBaseRenderProps } from '../shared/MFAFlowBaseV8';
import type { MFACredentials } from '../shared/MFATypes';

const MODULE_TAG = '[📧 EMAIL-FLOW-V8]';

// Validate email format
const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

// Step 0: Configure Credentials (Email-specific)
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
					<label htmlFor="mfa-email">
						Email Address <span className="required">*</span>
						<MFAInfoButtonV8 contentKey="factor.email" displayMode="tooltip" />
					</label>
					<input
						id="mfa-email"
						type="email"
						value={credentials.email}
						onChange={(e) => setCredentials({ ...credentials, email: e.target.value.trim() })}
						placeholder="user@example.com"
						style={{
							padding: '10px 12px',
							border: `1px solid ${
								credentials.email
									? isValidEmail(credentials.email)
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
									color: isValidEmail(credentials.email) ? '#10b981' : '#ef4444',
									fontWeight: '500',
								}}
							>
								{isValidEmail(credentials.email)
									? `✓ Valid (${credentials.email})`
									: '✗ Invalid email format'}
							</span>
						)}
					</small>
				</div>

				</div>
		</div>
	);
};

// Step 2: Send OTP (needs access to wrapper state)
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
			console.log(`${MODULE_TAG} Sending OTP`);
			setIsLoading(true);
			setSendError(null);
			try {
				await MFAServiceV8.sendOTP({
					environmentId: credentials.environmentId,
					username: credentials.username,
					deviceId: mfaState.deviceId,
				});

				console.log(`${MODULE_TAG} OTP sent successfully`);
				setOtpSent(true);
				nav.markStepComplete();
				toastV8.success('OTP sent successfully!');
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to send OTP`, error);
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				setSendError(errorMessage);
				setSendRetryCount((prev) => prev + 1);

				if (
					errorMessage.toLowerCase().includes('worker token') ||
					errorMessage.toLowerCase().includes('missing') ||
					errorMessage.toLowerCase().includes('invalid')
				) {
					nav.setValidationErrors([
						`Worker token is missing or invalid. Please click "Manage Token" button to generate a new worker token.`,
					]);
				} else if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many')) {
					nav.setValidationErrors([
						`Rate limit exceeded. Please wait a few minutes before trying again.`,
					]);
				} else {
					nav.setValidationErrors([`Failed to send OTP: ${errorMessage}`]);
				}
				toastV8.error(`Failed to send OTP: ${errorMessage}`);
			} finally {
				setIsLoading(false);
			}
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

// Step 3: Validate OTP and show success (needs access to wrapper state)
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

				<div className="form-group">
					<label htmlFor="mfa-otp">
						OTP Code <span className="required">*</span>
					</label>
					<input
						id="mfa-otp"
						type="text"
						value={mfaState.otpCode}
						onChange={(e) => {
							const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
							setMfaState({ ...mfaState, otpCode: cleaned });
						}}
						placeholder="123456"
						style={{
							padding: '10px 12px',
							border: `1px solid ${mfaState.otpCode.length === 6 ? '#10b981' : '#d1d5db'}`,
							borderRadius: '6px',
							fontSize: '18px',
							fontFamily: 'monospace',
							letterSpacing: '4px',
							textAlign: 'center',
							color: '#1f2937',
							background: 'white',
							width: '100%',
							maxWidth: '200px',
						}}
					/>
					<small>Enter the 6-digit code from your email</small>
				</div>

				<div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
					<button
						type="button"
						className="btn btn-primary"
						disabled={isLoading || mfaState.otpCode.length !== 6}
						onClick={async () => {
							console.log(`${MODULE_TAG} Validating OTP`);
							setIsLoading(true);
							setLastValidationError(null);
							try {
								const result = await MFAServiceV8.validateOTP({
									environmentId: credentials.environmentId,
									username: credentials.username,
									deviceId: mfaState.deviceId,
									otp: mfaState.otpCode,
								});

								setMfaState({
									...mfaState,
									verificationResult: {
										status: result.status,
										message: result.message || 'OTP validated successfully',
									},
								});

								if (result.valid) {
									setValidationAttempts(0);
									nav.markStepComplete();
									toastV8.success('OTP validated successfully!');
									// Re-render will show success screen
								} else {
									setValidationAttempts((prev) => prev + 1);
									setLastValidationError('Invalid OTP code');
									nav.setValidationErrors(['Invalid OTP code. Please try again.']);
									toastV8.error('Invalid OTP code');
								}
							} catch (error) {
								console.error(`${MODULE_TAG} OTP validation failed`, error);
								const errorMessage = error instanceof Error ? error.message : 'Unknown error';
								setValidationAttempts((prev) => prev + 1);
								setLastValidationError(errorMessage);

								// Provide specific error handling
								if (errorMessage.toLowerCase().includes('expired')) {
									nav.setValidationErrors([
										'OTP code has expired. Please go back and request a new code.',
									]);
								} else if (errorMessage.toLowerCase().includes('too many') || errorMessage.toLowerCase().includes('attempts')) {
									nav.setValidationErrors([
										'Too many failed attempts. Please wait a few minutes or request a new code.',
									]);
								} else {
									nav.setValidationErrors([`OTP validation failed: ${errorMessage}`]);
								}
								toastV8.error(`Validation failed: ${errorMessage}`);
							} finally {
								setIsLoading(false);
							}
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
	const errors: string[] = [];

	if (!credentials.environmentId?.trim()) {
		errors.push('Environment ID is required');
	}

	if (!credentials.username?.trim()) {
		errors.push('Username is required');
	}

	if (!credentials.email?.trim()) {
		errors.push('Email address is required for Email devices');
	} else if (!isValidEmail(credentials.email)) {
		errors.push('Invalid email address format');
	}

	if (!tokenStatus.isValid) {
		errors.push('Worker token is required - please add a token first');
	}

	nav.setValidationErrors(errors);
	return errors.length === 0;
};

// Device selection state management wrapper
const EmailFlowV8WithDeviceSelection: React.FC = () => {
	const [existingDevices, setExistingDevices] = useState<Array<Record<string, unknown>>>([]);
	const [loadingDevices, setLoadingDevices] = useState(false);
	const [selectedExistingDevice, setSelectedExistingDevice] = useState<string>(''); // 'new' or deviceId
	const [showRegisterForm, setShowRegisterForm] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [credentialsForDeviceLoad, setCredentialsForDeviceLoad] = useState<MFACredentials | null>(null);
	const [tokenStatusForDeviceLoad, setTokenStatusForDeviceLoad] = useState<ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus> | null>(null);
	
	// OTP sending state
	const [otpSent, setOtpSent] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	const [sendRetryCount, setSendRetryCount] = useState(0);
	
	// OTP validation state
	const [validationAttempts, setValidationAttempts] = useState(0);
	const [lastValidationError, setLastValidationError] = useState<string | null>(null);

	// Load devices when entering step 1
	useEffect(() => {
		const loadExistingDevices = async () => {
			if (!credentialsForDeviceLoad?.environmentId || !credentialsForDeviceLoad?.username || !tokenStatusForDeviceLoad?.isValid) {
				return;
			}

			if (currentStep === 1 && existingDevices.length === 0 && !loadingDevices) {
				console.log(`${MODULE_TAG} Loading existing devices`);
				setLoadingDevices(true);

				try {
					const devices = await MFAServiceV8.getAllDevices({
						environmentId: credentialsForDeviceLoad.environmentId,
						username: credentialsForDeviceLoad.username,
						deviceType: 'EMAIL',
						countryCode: credentialsForDeviceLoad.countryCode,
						phoneNumber: credentialsForDeviceLoad.phoneNumber,
						email: credentialsForDeviceLoad.email,
						deviceName: credentialsForDeviceLoad.deviceName,
					});

					console.log(`${MODULE_TAG} Loaded ${devices.length} devices`);
					const emailDevices = devices.filter(
						(d: Record<string, unknown>) => d.type === 'EMAIL'
					);
					setExistingDevices(emailDevices);

					if (emailDevices.length === 0) {
						setShowRegisterForm(true);
						setSelectedExistingDevice('new');
					}
				} catch (error) {
					console.error(`${MODULE_TAG} Failed to load devices`, error);
					setShowRegisterForm(true);
					setSelectedExistingDevice('new');
				} finally {
					setLoadingDevices(false);
				}
			}
		};

		loadExistingDevices();
	}, [currentStep, credentialsForDeviceLoad, tokenStatusForDeviceLoad, existingDevices.length, loadingDevices]);

	// Enhanced renderStep1 with device selection
	const renderStep1WithSelection = (props: MFAFlowBaseRenderProps) => {
		const { credentials, setCredentials, mfaState, setMfaState, nav, setIsLoading, isLoading, setShowDeviceLimitModal } = props;

		// Update state for device loading
		useEffect(() => {
			setCurrentStep(nav.currentStep);
			setCredentialsForDeviceLoad(credentials);
			setTokenStatusForDeviceLoad(props.tokenStatus);
		}, [nav.currentStep, credentials, props.tokenStatus]);

		// Handle selecting an existing device
		const handleSelectExistingDevice = (deviceId: string) => {
			setSelectedExistingDevice(deviceId);
			setShowRegisterForm(false);
			const device = existingDevices.find((d: Record<string, unknown>) => d.id === deviceId);
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
			setSelectedExistingDevice('new');
			setShowRegisterForm(true);
			setMfaState({
				...mfaState,
				deviceId: '',
				deviceStatus: '',
			});
		};

		// Handle using selected existing device
		const handleUseSelectedDevice = () => {
			if (selectedExistingDevice && selectedExistingDevice !== 'new') {
				nav.markStepComplete();
				toastV8.success('Device selected successfully!');
			}
		};

		return (
			<div className="step-content">
				<h2>Select or Register Email Device</h2>
				<p>Choose an existing device or register a new one</p>

				{loadingDevices && (
					<div className="info-box" style={{ textAlign: 'center', padding: '20px' }}>
						<p>🔄 Loading existing devices...</p>
					</div>
				)}

				{!loadingDevices && existingDevices.length > 0 && (
					<div style={{ marginBottom: '20px' }}>
						<h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
							Existing Email Devices
						</h3>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '12px',
								marginBottom: '16px',
							}}
						>
							{existingDevices.map((device: Record<string, unknown>) => (
								<div
									key={device.id as string}
									onClick={() => handleSelectExistingDevice(device.id as string)}
									style={{
										padding: '16px',
										border: `2px solid ${
											selectedExistingDevice === device.id ? '#10b981' : '#e5e7eb'
										}`,
										borderRadius: '8px',
										background: selectedExistingDevice === device.id ? '#f0fdf4' : 'white',
										cursor: 'pointer',
										transition: 'all 0.2s',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										<input
											type="radio"
											checked={selectedExistingDevice === device.id}
											onChange={() => handleSelectExistingDevice(device.id as string)}
											style={{ margin: 0 }}
										/>
										<span style={{ fontSize: '20px' }}>📧</span>
										<div style={{ flex: 1 }}>
											<div style={{ fontWeight: '600', marginBottom: '4px' }}>
												{device.nickname || device.name || 'Unnamed Device'}
											</div>
											<div style={{ fontSize: '13px', color: '#6b7280' }}>
												{device.email && `Email: ${device.email}`}
												{device.status && ` • Status: ${device.status}`}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>

						{selectedExistingDevice && selectedExistingDevice !== 'new' && (
							<button
								type="button"
								className="btn btn-primary"
								onClick={handleUseSelectedDevice}
								style={{ marginBottom: '20px' }}
							>
								Use Selected Device
							</button>
						)}
					</div>
				)}

				{!loadingDevices && (
					<div style={{ marginBottom: '20px' }}>
						<div
							onClick={handleSelectNewDevice}
							style={{
								padding: '16px',
								border: `2px dashed ${selectedExistingDevice === 'new' ? '#10b981' : '#d1d5db'}`,
								borderRadius: '8px',
								background: selectedExistingDevice === 'new' ? '#f0fdf4' : '#f9fafb',
								cursor: 'pointer',
								transition: 'all 0.2s',
								marginBottom: selectedExistingDevice === 'new' ? '20px' : '0',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
								<input
									type="radio"
									checked={selectedExistingDevice === 'new'}
									onChange={handleSelectNewDevice}
									style={{ margin: 0 }}
								/>
								<span style={{ fontSize: '20px' }}>➕</span>
								<span style={{ fontWeight: '600' }}>Register New Device</span>
							</div>
						</div>
					</div>
				)}

				{showRegisterForm && (
					<div>
						<div className="info-box">
							<p>
								<strong>Username:</strong> {credentials.username}
							</p>
							<p>
								<strong>Device Type:</strong> 📧 Email
							</p>
							<p>
								<strong>Email Address:</strong> {credentials.email}
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
								placeholder="e.g., My Work Email, Personal Email, etc."
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
							disabled={isLoading}
							onClick={async () => {
								console.log(`${MODULE_TAG} Registering Email device`);

								setIsLoading(true);
								try {
									const deviceParams: RegisterDeviceParams = {
										environmentId: credentials.environmentId,
										username: credentials.username,
										type: 'EMAIL',
										email: credentials.email,
										name: `Email Device - ${new Date().toLocaleDateString()}`,
										nickname: `Email Device - ${new Date().toLocaleDateString()}`,
									};

									const result = await MFAServiceV8.registerDevice(deviceParams);

									setMfaState({
										...mfaState,
										deviceId: result.deviceId,
										deviceStatus: result.status,
										...(result.nickname ? { nickname: result.nickname } : {}),
										...(result.environmentId ? { environmentId: result.environmentId } : {}),
										...(result.userId ? { userId: result.userId } : {}),
										...(result.createdAt ? { createdAt: result.createdAt } : {}),
										...(result.updatedAt ? { updatedAt: result.updatedAt } : {}),
									});

									// Refresh device list
									const devices = await MFAServiceV8.getAllDevices({
										environmentId: credentials.environmentId,
										username: credentials.username,
										deviceType: 'EMAIL',
										countryCode: credentials.countryCode,
										phoneNumber: credentials.phoneNumber,
										email: credentials.email,
										deviceName: credentials.deviceName,
									});
									const emailDevices = devices.filter(
										(d: Record<string, unknown>) => d.type === 'EMAIL'
									);
									setExistingDevices(emailDevices);

									nav.markStepComplete();
									toastV8.success('Email device registered successfully!');
								} catch (error) {
									console.error(`${MODULE_TAG} Device registration failed`, error);
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
							}}
						>
							{isLoading ? '🔄 Registering...' : 'Register Email Device'}
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

	return (
		<>
			<MFAFlowBaseV8
				deviceType="EMAIL"
				renderStep0={renderStep0}
				renderStep1={renderStep1WithSelection}
				renderStep2={createRenderStep2(otpSent, setOtpSent, sendError, setSendError, sendRetryCount, setSendRetryCount)}
				renderStep3={createRenderStep3(validationAttempts, setValidationAttempts, lastValidationError, setLastValidationError)}
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

