/**
 * @file MFAFlowV8.tsx
 * @module v8/flows
 * @description PingOne MFA Flow - SMS Device Registration and OTP Validation
 * @version 8.0.0
 * @since 2024-11-19
 * 
 * Demonstrates PingOne MFA API:
 * - Step 0: Configure credentials (environment, client, user)
 * - Step 1: Register SMS device
 * - Step 2: Send OTP to device
 * - Step 3: Validate OTP
 * - Step 4: Success - Device verified
 * 
 * @example
 * <MFAFlowV8 />
 */

import React, { useEffect, useState } from 'react';
import StepActionButtonsV8 from '@/v8/components/StepActionButtonsV8';
import StepValidationFeedbackV8 from '@/v8/components/StepValidationFeedbackV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { CountryCodePickerV8 } from '@/v8/components/CountryCodePickerV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { FlowResetServiceV8 } from '@/v8/services/flowResetServiceV8';
import { MFAServiceV8, type RegisterDeviceParams } from '@/v8/services/mfaServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { SuperSimpleApiDisplayV8, ApiDisplayCheckbox } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { MFASettingsModalV8 } from '@/v8/components/MFASettingsModalV8';
import { MFADeviceLimitModalV8 } from '@/v8/components/MFADeviceLimitModalV8';
import { FIDO2Service, type FIDO2Config } from '@/services/fido2Service';

const MODULE_TAG = '[📱 MFA-FLOW-V8]';
const FLOW_KEY = 'mfa-flow-v8';

interface Credentials {
	environmentId: string;
	clientId: string;
	username: string;
	deviceType: 'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2';
	countryCode: string;
	phoneNumber: string;
	email: string;
	deviceName: string;
	[key: string]: unknown;
}

interface MFAState {
	deviceId: string;
	otpCode: string;
	deviceStatus: string;
	verificationResult: {
		status: string;
		message: string;
	} | null;
	// Additional device registration fields
	nickname?: string;
	environmentId?: string;
	userId?: string;
	createdAt?: string;
	updatedAt?: string;
	// TOTP-specific fields
	qrCodeUrl?: string;
	totpSecret?: string;
	// FIDO2-specific fields
	fido2CredentialId?: string;
	fido2PublicKey?: string;
	fido2RegistrationComplete?: boolean;
}

export const MFAFlowV8: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing MFA flow`);

	const nav = useStepNavigationV8(5, {
		onStepChange: (step) => console.log(`${MODULE_TAG} Step changed to`, { step }),
	});

	const [credentials, setCredentials] = useState<Credentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});
		
		return {
			environmentId: stored.environmentId || '',
			clientId: stored.clientId || '',
			username: stored.username || '',
			deviceType: (stored.deviceType as 'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2') || 'SMS',
			countryCode: stored.countryCode || '+1',
			phoneNumber: stored.phoneNumber || '',
			email: stored.email || '',
			deviceName: stored.deviceName || '',
		};
	});

	const [mfaState, setMfaState] = useState<MFAState>({
		deviceId: '',
		otpCode: '',
		deviceStatus: '',
		verificationResult: null,
	});

	const [showDeviceLimitModal, setShowDeviceLimitModal] = useState(false);

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const [isLoading, setIsLoading] = useState(false);

	// Check token status periodically
	useEffect(() => {
		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(status);
		};

		// Check every 30 seconds
		const interval = setInterval(checkStatus, 30000);

		// Listen for storage changes
		const handleStorageChange = () => {
			checkStatus();
		};
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
		};
	}, []);

	// Clear API calls on mount
	useEffect(() => {
		apiCallTrackerService.clearApiCalls();
	}, []);

	// Save credentials when they change (but don't validate yet)
	useEffect(() => {
		console.log(`${MODULE_TAG} Credentials changed, saving`, credentials);
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials);
		console.log(`${MODULE_TAG} Credentials saved to localStorage`);
	}, [credentials]);

	// Get full phone number with country code (PingOne format: +1.5125201234)
	const getFullPhoneNumber = (): string => {
		// Remove all non-digit characters from phone number
		const cleanedPhone = credentials.phoneNumber.replace(/[^\d]/g, '');
		// Ensure country code starts with +
		const countryCode = credentials.countryCode.startsWith('+') 
			? credentials.countryCode 
			: `+${credentials.countryCode}`;
		// PingOne requires format: +[country].[number] (e.g., +1.5125201234)
		return `${countryCode}.${cleanedPhone}`;
	};

	// Validate only when trying to proceed to next step
	const validateStep0 = (): boolean => {
		console.log(`${MODULE_TAG} Validating step 0`, credentials);
		
		const errors: string[] = [];
		const warnings: string[] = [];
		
		if (!credentials.environmentId?.trim()) {
			errors.push('Environment ID is required');
		}
		
		if (!credentials.username?.trim()) {
			errors.push('Username is required');
		}
		
		// Validate based on device type
		if (credentials.deviceType === 'SMS') {
			if (!credentials.phoneNumber?.trim()) {
				errors.push('Phone Number is required for SMS devices');
			} else {
				const cleanedPhone = credentials.phoneNumber.replace(/[^\d]/g, '');
				const fullPhone = getFullPhoneNumber();
				
				// Country-specific validation
				if (credentials.countryCode === '+1') {
					// US/Canada requires exactly 10 digits
					if (cleanedPhone.length !== 10) {
						errors.push(`US/Canada phone numbers must be exactly 10 digits (you have ${cleanedPhone.length})`);
					}
				} else {
					// General validation for other countries
					if (cleanedPhone.length < 6) {
						errors.push('Phone number is too short (minimum 6 digits)');
					} else if (cleanedPhone.length > 15) {
						errors.push('Phone number is too long (maximum 15 digits)');
					}
				}
				
				// Show current format
				if (cleanedPhone.length > 0) {
					console.log(`${MODULE_TAG} Phone validation:`, {
						countryCode: credentials.countryCode,
						phoneNumber: credentials.phoneNumber,
						cleanedPhone: cleanedPhone,
						cleanedLength: cleanedPhone.length,
						fullPhone: fullPhone,
					});
				}
			}
		} else if (credentials.deviceType === 'EMAIL') {
			if (!credentials.email?.trim()) {
				errors.push('Email is required for EMAIL devices');
			} else if (!credentials.email.includes('@')) {
				errors.push('Email must be a valid email address');
			}
		} else if (credentials.deviceType === 'TOTP') {
			// TOTP doesn't require phone or email
		} else if (credentials.deviceType === 'FIDO2') {
			// FIDO2 doesn't require phone or email, but requires WebAuthn support
			if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
				if (!window.PublicKeyCredential || !navigator.credentials) {
					errors.push('WebAuthn is not supported in this browser. Please use a modern browser that supports FIDO2.');
				}
			}
			// Just needs device name which is validated below
		}
		
		if (!credentials.deviceName?.trim()) {
			errors.push('Device Name is required');
		}
		
		// Check worker token
		if (!tokenStatus.isValid) {
			errors.push('Worker token is required - please add a token first');
		}
		
		nav.setValidationErrors(errors);
		nav.setValidationWarnings(warnings);
		
		return errors.length === 0;
	};

	const handleManageWorkerToken = () => {
		if (tokenStatus.isValid) {
			// Show confirmation to remove token
			if (confirm('Worker token is currently stored.\n\nDo you want to remove it?')) {
				workerTokenServiceV8.clearToken();
				window.dispatchEvent(new Event('workerTokenUpdated'));
				const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(newStatus);
				toastV8.success('Worker token removed');
			}
		} else {
			// Open the worker token modal
			setShowWorkerTokenModal(true);
		}
	};

	const handleWorkerTokenGenerated = () => {
		// Dispatch custom event for status update
		window.dispatchEvent(new Event('workerTokenUpdated'));
		const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
		setTokenStatus(newStatus);
		toastV8.success('Worker token generated and saved!');
	};

	// Step 0: Configure Credentials
	const renderStep0 = () => (
		<div className="step-content">
			<h2>Configure MFA Settings</h2>
			<p>Enter your PingOne environment details and user information</p>

			{/* Worker Token Status */}
			<div style={{ marginBottom: '20px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
					<button
						type="button"
						onClick={handleManageWorkerToken}
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
						title={
							tokenStatus.isValid
								? 'Worker token is stored - click to manage'
								: 'No worker token - click to add'
						}
					>
						<span>🔑</span>
						<span>{tokenStatus.isValid ? 'Manage Token' : 'Add Token'}</span>
					</button>

					<button
						type="button"
						onClick={() => setShowSettingsModal(true)}
						className="token-button"
						style={{
							padding: '10px 16px',
							background: !tokenStatus.isValid || !credentials.environmentId ? '#e5e7eb' : '#6366f1',
							color: !tokenStatus.isValid || !credentials.environmentId ? '#9ca3af' : 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: !tokenStatus.isValid || !credentials.environmentId ? 'not-allowed' : 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
						title="Configure MFA Settings for this Environment"
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
						onChange={(e) =>
							setCredentials({ ...credentials, environmentId: e.target.value })
						}
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
					<label htmlFor="mfa-device-type">
						Device Type <span className="required">*</span>
					</label>
					<select
						id="mfa-device-type"
						value={credentials.deviceType}
						onChange={(e) =>
							setCredentials({ ...credentials, deviceType: e.target.value as 'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2' })
						}
					>
						<option value="SMS">📱 SMS (Text Message)</option>
						<option value="EMAIL">📧 Email</option>
						<option value="TOTP">🔐 TOTP (Authenticator App)</option>
						<option value="FIDO2">🔑 FIDO2 (Security Key/Biometric)</option>
					</select>
					<small>Choose how you want to receive OTP codes</small>
				</div>

				{credentials.deviceType === 'SMS' && (
					<div className="form-group">
						<label htmlFor="mfa-phone">
							Phone Number <span className="required">*</span>
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
									// Remove any non-digit characters except spaces and dashes
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
												? `✓ Valid (${getFullPhoneNumber()})`
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
												? `✓ Valid (${getFullPhoneNumber()})`
												: `✗ Need ${6 - credentials.phoneNumber.replace(/[^\d]/g, '').length} more digit${6 - credentials.phoneNumber.replace(/[^\d]/g, '').length === 1 ? '' : 's'}`}
										</span>
									)}
								</>
							)}
						</small>
					</div>
				)}

				{credentials.deviceType === 'EMAIL' && (
					<div className="form-group">
						<label htmlFor="mfa-email">
							Email Address <span className="required">*</span>
						</label>
						<input
							id="mfa-email"
							type="email"
							value={credentials.email}
							onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
							placeholder="john.doe@example.com"
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
							Email address to receive OTP codes
							{credentials.email && (
								<span
									style={{
										marginLeft: '8px',
										color: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)
											? '#10b981'
											: '#ef4444',
										fontWeight: '500',
									}}
								>
									{/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)
										? '✓ Valid email format'
										: '✗ Invalid email format'}
								</span>
							)}
						</small>
					</div>
				)}

				<div className="form-group">
					<label htmlFor="mfa-device-name">
						Device Name <span className="required">*</span>
					</label>
					<input
						id="mfa-device-name"
						type="text"
						value={credentials.deviceName}
						onChange={(e) => setCredentials({ ...credentials, deviceName: e.target.value })}
						placeholder="My iPhone"
					/>
					<small>A friendly name to identify this device</small>
				</div>
			</div>
		</div>
	);

	// Step 1: Register Device
	const renderStep1 = () => (
		<div className="step-content">
			<h2>Register {credentials.deviceType} Device</h2>
			<p>Register a new {credentials.deviceType} device for the user</p>

			<div className="info-box">
				<p>
					<strong>Username:</strong> {credentials.username}
				</p>
				<p>
					<strong>Device Type:</strong>{' '}
					{credentials.deviceType === 'SMS'
						? '📱 SMS'
						: credentials.deviceType === 'EMAIL'
							? '📧 Email'
							: credentials.deviceType === 'TOTP'
								? '🔐 TOTP'
								: '🔑 FIDO2'}
				</p>
				{credentials.deviceType === 'SMS' && (
					<>
						<p>
							<strong>Phone Number:</strong> {getFullPhoneNumber()}
						</p>
						<p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
							PingOne format: +[country].[number] (e.g., +1.5125201234)
						</p>
					</>
				)}
				{credentials.deviceType === 'EMAIL' && (
					<p>
						<strong>Email:</strong> {credentials.email}
					</p>
				)}
				{credentials.deviceType === 'TOTP' && (
					<p style={{ fontSize: '13px', color: '#6b7280' }}>
						TOTP devices use authenticator apps like Google Authenticator, Authy, or Microsoft
						Authenticator
					</p>
				)}
				{credentials.deviceType === 'FIDO2' && (
					<p style={{ fontSize: '13px', color: '#6b7280' }}>
						FIDO2 devices use WebAuthn-compatible security keys, biometric authenticators, or platform
						authenticators (e.g., Windows Hello, Face ID, Touch ID)
					</p>
				)}
			</div>

			{/* Device Name Input - Final chance to name it */}
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

			{credentials.deviceType === 'SMS' && (
				<div style={{ marginBottom: '16px', padding: '12px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px' }}>
					<p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#92400e' }}>
						📋 Phone Number Preview:
					</p>
					<p style={{ margin: '0', fontSize: '14px', fontFamily: 'monospace', color: '#1f2937' }}>
						<strong>Will send:</strong> {getFullPhoneNumber()}
					</p>
					<p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#92400e' }}>
						PingOne format: +[country].[number] (e.g., +1.5125201234)
					</p>
				</div>
			)}

			<button
				type="button"
				className="btn btn-primary"
				disabled={isLoading || !credentials.deviceName?.trim()}
				onClick={async () => {
					console.log(`${MODULE_TAG} Registering ${credentials.deviceType} device`);
					
					// Validate device name before proceeding
					if (!credentials.deviceName?.trim()) {
						nav.setValidationErrors([
							'Device name is required. Please enter a name for this device.',
						]);
						setIsLoading(false);
						return;
					}
					
					setIsLoading(true);
					try {
						// Handle FIDO2 registration separately (requires WebAuthn ceremony)
						if (credentials.deviceType === 'FIDO2') {
							console.log(`${MODULE_TAG} Starting FIDO2 device registration with WebAuthn`);
							
							// Check WebAuthn support
							if (!FIDO2Service.isWebAuthnSupported()) {
								throw new Error('WebAuthn is not supported in this browser. Please use a modern browser that supports FIDO2.');
							}
							
							// First, create the device placeholder with PingOne
							const deviceParams: RegisterDeviceParams = {
								environmentId: credentials.environmentId,
								username: credentials.username,
								type: 'FIDO2',
								name: credentials.deviceName.trim(),
								nickname: credentials.deviceName.trim(),
							};
							
							// Register the device placeholder with PingOne
							const result = await MFAServiceV8.registerDevice(deviceParams);
							
							// Now perform WebAuthn credential creation
							const challenge = FIDO2Service.generateChallenge();
							const config: FIDO2Config = {
								rpId: window.location.hostname,
								rpName: 'OAuth Playground',
								userDisplayName: `${credentials.username} (${credentials.deviceName})`,
								userName: credentials.username,
								userHandle: credentials.username,
								challenge: challenge,
								timeout: 60000,
								attestation: 'none',
								authenticatorSelection: {
									userVerification: 'preferred',
									residentKey: 'preferred',
								},
							};
							
							console.log(`${MODULE_TAG} Creating WebAuthn credential`);
							const fido2Result = await FIDO2Service.registerCredential(config);
							
							if (!fido2Result.success || !fido2Result.credentialId) {
								throw new Error(fido2Result.error || 'FIDO2 credential registration failed');
							}
							
							// Store FIDO2 credential info for validation step
							setMfaState({
								...mfaState,
								deviceId: result.deviceId,
								deviceStatus: result.status,
								...(result.nickname ? { nickname: result.nickname } : {}),
								...(result.environmentId ? { environmentId: result.environmentId } : {}),
								...(result.userId ? { userId: result.userId } : {}),
								...(result.createdAt ? { createdAt: result.createdAt } : {}),
								...(result.updatedAt ? { updatedAt: result.updatedAt } : {}),
								fido2CredentialId: fido2Result.credentialId,
								fido2PublicKey: fido2Result.publicKey || '',
								fido2RegistrationComplete: true,
							});
							
							console.log(`${MODULE_TAG} FIDO2 device registered successfully`, {
								deviceId: result.deviceId,
								credentialId: fido2Result.credentialId,
							});
							
							nav.markStepComplete();
							return;
						}
						
						// Handle SMS, EMAIL, and TOTP devices
						const deviceParams: RegisterDeviceParams = {
							environmentId: credentials.environmentId,
							username: credentials.username,
							type: (credentials.deviceType as 'SMS' | 'EMAIL' | 'TOTP') || 'SMS',
							name: credentials.deviceName.trim(),
							nickname: credentials.deviceName.trim(), // Also pass as nickname for clarity
						};

						if (credentials.deviceType === 'SMS') {
							const fullPhone = getFullPhoneNumber();
							console.log(`${MODULE_TAG} Phone number format:`, {
								countryCode: credentials.countryCode,
								phoneNumber: credentials.phoneNumber,
								fullPhone: fullPhone,
								length: fullPhone.length,
								charCodes: Array.from(fullPhone).map(c => `${c}(${c.charCodeAt(0)})`).join(' '),
							});
							deviceParams.phone = fullPhone;
							console.log(`${MODULE_TAG} Sending phone to API:`, deviceParams.phone);
						} else if (credentials.deviceType === 'EMAIL') {
							deviceParams.email = credentials.email;
						}

						const result = await MFAServiceV8.registerDevice(deviceParams);

						console.log(`${MODULE_TAG} Device registered successfully`, {
							deviceId: result.deviceId,
							userId: result.userId,
							status: result.status,
							type: result.type,
						});

						// For TOTP, we need to get the device details to retrieve QR code
						let qrCodeUrl = '';
						let totpSecret = '';
						
						if (credentials.deviceType === 'TOTP') {
							console.log(`${MODULE_TAG} Fetching TOTP device details for QR code`);
							const deviceDetails = await MFAServiceV8.getDevice({
								environmentId: credentials.environmentId,
								username: credentials.username,
								deviceId: result.deviceId,
							});
							
							// Extract QR code URL and secret from device details
							const deviceDetailsTyped = deviceDetails as {
								_links?: { 'authenticate.qrCode'?: { href?: string } };
								otp?: { secret?: string };
							};
							qrCodeUrl = deviceDetailsTyped._links?.['authenticate.qrCode']?.href || '';
							totpSecret = deviceDetailsTyped.otp?.secret || '';
							
							console.log(`${MODULE_TAG} TOTP device details:`, {
								hasQrCode: !!qrCodeUrl,
								hasSecret: !!totpSecret,
							});
						}

						setMfaState({
							...mfaState,
							deviceId: result.deviceId,
							deviceStatus: result.status,
							...(result.nickname ? { nickname: result.nickname } : {}),
							...(result.environmentId ? { environmentId: result.environmentId } : {}),
							...(result.userId ? { userId: result.userId } : {}),
							...(result.createdAt ? { createdAt: result.createdAt } : {}),
							...(result.updatedAt ? { updatedAt: result.updatedAt } : {}),
							qrCodeUrl: qrCodeUrl,
							totpSecret: totpSecret,
						});

						nav.markStepComplete();
					} catch (error) {
						console.error(`${MODULE_TAG} Device registration failed`, error);
						const errorMessage = error instanceof Error ? error.message : 'Unknown error';
						
						// Check if error is about device limit
						const isDeviceLimitError = 
							errorMessage.toLowerCase().includes('exceed') ||
							errorMessage.toLowerCase().includes('limit') ||
							errorMessage.toLowerCase().includes('maximum');
						
						if (isDeviceLimitError) {
							// Show nice modal for device limit errors
							setShowDeviceLimitModal(true);
							// Still set validation error for step feedback
							nav.setValidationErrors([
								`Device registration failed: ${errorMessage}`,
							]);
						} else {
							// Show regular inline error for other errors
							nav.setValidationErrors([
								`Failed to register device: ${errorMessage}`,
							]);
						}
					} finally {
						setIsLoading(false);
					}
				}}
			>
				{isLoading ? '🔄 Registering...' : `Register ${credentials.deviceType} Device`}
			</button>

			{mfaState.deviceId && (
				<div className="success-box">
					<h3>✅ Device Registered</h3>
					<p>
						<strong>Device ID:</strong> {mfaState.deviceId}
					</p>
					{mfaState.nickname && (
						<p>
							<strong>Nickname:</strong> {mfaState.nickname}
						</p>
					)}
					<p>
						<strong>Status:</strong> {mfaState.deviceStatus}
					</p>
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
					
					{credentials.deviceType === 'TOTP' && mfaState.qrCodeUrl && (
						<div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
							<h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1f2937' }}>
								📱 Scan QR Code with Authenticator App
							</h4>
							<div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '6px' }}>
								<img 
									src={mfaState.qrCodeUrl} 
									alt="TOTP QR Code" 
									style={{ maxWidth: '200px', height: 'auto' }}
								/>
							</div>
							{mfaState.totpSecret && (
								<div style={{ marginTop: '12px' }}>
									<p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}>
										<strong>Manual Entry Key:</strong>
									</p>
									<p style={{ margin: '0', fontSize: '14px', fontFamily: 'monospace', color: '#1f2937', background: 'white', padding: '8px', borderRadius: '4px', wordBreak: 'break-all' }}>
										{mfaState.totpSecret}
									</p>
									<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
										Use this key if you can't scan the QR code
									</p>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);

	// Step 2: Send OTP (or skip for TOTP/FIDO2)
	const renderStep2 = () => {
		// TOTP doesn't need to send OTP - it's generated by the app
		if (credentials.deviceType === 'TOTP') {
			return (
				<div className="step-content">
					<h2>TOTP Device Ready</h2>
					<p>Your authenticator app is now configured and ready to use</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p style={{ marginTop: '12px', fontSize: '14px' }}>
							Your authenticator app should now be showing a 6-digit code that changes every 30
							seconds. You'll use this code to verify the device in the next step.
						</p>
					</div>

					<button
						type="button"
						className="btn btn-primary"
						onClick={() => {
							console.log(`${MODULE_TAG} TOTP device ready, proceeding to validation`);
							nav.markStepComplete();
						}}
					>
						Continue to Validation
					</button>
				</div>
			);
		}

		// FIDO2 doesn't need to send OTP - it uses WebAuthn authentication
		if (credentials.deviceType === 'FIDO2') {
			return (
				<div className="step-content">
					<h2>FIDO2 Device Ready</h2>
					<p>Your FIDO2 device is now registered and ready to use</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						{mfaState.fido2CredentialId && (
							<p>
								<strong>Credential ID:</strong> {mfaState.fido2CredentialId.substring(0, 32)}...
							</p>
						)}
						<p style={{ marginTop: '12px', fontSize: '14px' }}>
							Your FIDO2 passkey has been successfully registered. In the next step, you'll verify
							the device by authenticating with your security key or biometric authenticator.
						</p>
					</div>

					<button
						type="button"
						className="btn btn-primary"
						onClick={() => {
							console.log(`${MODULE_TAG} FIDO2 device ready, proceeding to validation`);
							nav.markStepComplete();
						}}
					>
						Continue to Validation
					</button>
				</div>
			);
		}

		// SMS and EMAIL need to send OTP
		return (
			<div className="step-content">
				<h2>Send OTP Code</h2>
				<p>Send a one-time password to the registered device</p>

				<div className="info-box">
					<p>
						<strong>Device ID:</strong> {mfaState.deviceId}
					</p>
					<p>
						<strong>{credentials.deviceType === 'SMS' ? 'Phone Number' : 'Email'}:</strong>{' '}
						{credentials.deviceType === 'SMS' ? getFullPhoneNumber() : credentials.email}
					</p>
				</div>

				<button
					type="button"
					className="btn btn-primary"
					onClick={async () => {
						console.log(`${MODULE_TAG} Sending OTP`);
						setIsLoading(true);
						try {
							await MFAServiceV8.sendOTP({
								environmentId: credentials.environmentId,
								username: credentials.username,
								deviceId: mfaState.deviceId,
							});

							console.log(`${MODULE_TAG} OTP sent successfully`);
							nav.markStepComplete();
							} catch (error) {
						console.error(`${MODULE_TAG} Failed to send OTP`, error);
						const errorMessage = error instanceof Error ? error.message : 'Unknown error';
						
						// Check if it's a worker token error
						if (errorMessage.toLowerCase().includes('worker token') || 
						    errorMessage.toLowerCase().includes('missing') ||
						    errorMessage.toLowerCase().includes('invalid')) {
							nav.setValidationErrors([
								`Worker token is missing or invalid. Please click "Manage Token" button to generate a new worker token.`,
							]);
						} else {
							nav.setValidationErrors([
								`Failed to send OTP: ${errorMessage}`,
							]);
						}
					} finally {
						setIsLoading(false);
					}
					}}
					disabled={isLoading}
				>
					{isLoading ? '🔄 Sending...' : 'Send OTP Code'}
				</button>

				{nav.completedSteps.includes(2) && (
					<div className="success-box">
						<h3>✅ OTP Sent</h3>
						<p>
							Check your {credentials.deviceType === 'SMS' ? 'phone' : 'email'} for the verification
							code
						</p>
					</div>
				)}
			</div>
		);
	};

	// Step 3: Validate OTP or FIDO2
	const renderStep3 = () => {
		// FIDO2 validation uses WebAuthn authentication instead of OTP
		if (credentials.deviceType === 'FIDO2') {
			return (
				<div className="step-content">
					<h2>Validate FIDO2 Device</h2>
					<p>Authenticate using your registered FIDO2 passkey to verify the device</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						{mfaState.fido2CredentialId && (
							<p>
								<strong>Credential ID:</strong> {mfaState.fido2CredentialId.substring(0, 32)}...
							</p>
						)}
						<p style={{ marginTop: '12px', fontSize: '14px' }}>
							Click the button below to authenticate with your security key or biometric
							authenticator. You'll be prompted to use your registered passkey.
						</p>
					</div>

					<button
						type="button"
						className="btn btn-primary"
						disabled={isLoading || !mfaState.fido2RegistrationComplete}
						onClick={async () => {
							console.log(`${MODULE_TAG} Starting FIDO2 authentication`);
							setIsLoading(true);
							try {
								if (!mfaState.fido2CredentialId) {
									throw new Error('FIDO2 credential ID is missing. Please register the device first.');
								}

								// Generate challenge for authentication
								const challenge = FIDO2Service.generateChallenge();
								
								// Helper function to convert base64 to ArrayBuffer
								const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
									const binary = atob(base64);
									const bytes = new Uint8Array(binary.length);
									for (let i = 0; i < binary.length; i++) {
										bytes[i] = binary.charCodeAt(i);
									}
									return bytes.buffer;
								};
								
								// Convert credential ID from base64 to ArrayBuffer
								const credentialIdBuffer = base64ToArrayBuffer(mfaState.fido2CredentialId);
								
								// Create authentication options
								const authOptions: PublicKeyCredentialRequestOptions = {
									challenge: base64ToArrayBuffer(challenge),
									timeout: 60000,
									rpId: window.location.hostname,
									allowCredentials: [{
										id: credentialIdBuffer,
										type: 'public-key',
									}],
									userVerification: 'preferred',
								};

								console.log(`${MODULE_TAG} Requesting WebAuthn authentication`);
								
								// Request authentication
								const credential = await navigator.credentials.get({
									publicKey: authOptions,
								}) as PublicKeyCredential | null;

								if (!credential) {
									throw new Error('Authentication was cancelled or failed');
								}

								console.log(`${MODULE_TAG} FIDO2 authentication successful`);
								
								// Mark validation as successful
								setMfaState({
									...mfaState,
									verificationResult: {
										status: 'COMPLETED',
										message: 'FIDO2 device authenticated successfully',
									},
								});

								nav.markStepComplete();
								toastV8.success('FIDO2 device authenticated successfully!');
							} catch (error) {
								console.error(`${MODULE_TAG} FIDO2 authentication failed`, error);
								const errorMessage = error instanceof Error ? error.message : 'Unknown error';
								nav.setValidationErrors([`FIDO2 authentication failed: ${errorMessage}`]);
								toastV8.error(`Authentication failed: ${errorMessage}`);
							} finally {
								setIsLoading(false);
							}
						}}
					>
						{isLoading ? '🔄 Authenticating...' : '🔑 Authenticate with FIDO2'}
					</button>

					{mfaState.verificationResult && mfaState.verificationResult.status === 'COMPLETED' && (
						<div className="success-box" style={{ marginTop: '20px' }}>
							<h3>✅ FIDO2 Device Verified</h3>
							<p>Your FIDO2 device has been successfully authenticated and verified.</p>
						</div>
					)}
				</div>
			);
		}

		// OTP validation for SMS, EMAIL, and TOTP
		return (
			<div className="step-content">
				<h2>Validate OTP Code</h2>
				<p>
					{credentials.deviceType === 'TOTP'
						? 'Enter the 6-digit code from your authenticator app'
						: credentials.deviceType === 'SMS'
							? 'Enter the code you received via SMS'
							: 'Enter the code you received via email'}
				</p>

				<div className="form-group">
					<label htmlFor="mfa-otp-code">
						OTP Code <span className="required">*</span>
					</label>
					<input
						id="mfa-otp-code"
						type="text"
						value={mfaState.otpCode}
						onChange={(e) => setMfaState({ ...mfaState, otpCode: e.target.value })}
						placeholder="Enter 6-digit code"
						maxLength={6}
						style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
					/>
				</div>

				<button
					type="button"
					className="btn btn-primary"
					disabled={isLoading || !mfaState.otpCode || mfaState.otpCode.length !== 6}
					onClick={async () => {
						console.log(`${MODULE_TAG} Validating OTP`);
						setIsLoading(true);
						try {
							const result = await MFAServiceV8.validateOTP({
								environmentId: credentials.environmentId,
								username: credentials.username,
								deviceId: mfaState.deviceId,
								otp: mfaState.otpCode,
							});

							console.log(`${MODULE_TAG} OTP validated successfully`, result);

							setMfaState({
								...mfaState,
								verificationResult: {
									status: result.status,
									message: result.message || 'OTP verified successfully',
								},
							});

							nav.markStepComplete();
						} catch (error) {
							console.error(`${MODULE_TAG} OTP validation failed`, error);
							nav.setValidationErrors([
								`Failed to validate OTP: ${error instanceof Error ? error.message : 'Unknown error'}`,
							]);
						} finally {
							setIsLoading(false);
						}
					}}
				>
				{isLoading ? '🔄 Validating...' : 'Validate OTP'}
			</button>
		</div>
	);
	};

	// Step 4: Success
	const renderStep4 = () => (
		<div className="step-content">
			<h2>MFA Verification Complete</h2>
			<p>Your device has been successfully verified</p>

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
				{credentials.deviceType === 'SMS' && (
					<p>
						<strong>Phone Number:</strong> {getFullPhoneNumber()}
					</p>
				)}
				{credentials.deviceType === 'EMAIL' && credentials.email && (
					<p>
						<strong>Email:</strong> {credentials.email}
					</p>
				)}
				<p>
					<strong>Status:</strong> {mfaState.verificationResult?.status || mfaState.deviceStatus || 'Verified'}
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

	const renderStepContent = () => {
		switch (nav.currentStep) {
			case 0:
				return renderStep0();
			case 1:
				return renderStep1();
			case 2:
				return renderStep2();
			case 3:
				return renderStep3();
			case 4:
				return renderStep4();
			default:
				return null;
		}
	};

	const isNextDisabled = (() => {
		if (isLoading) return true;
		switch (nav.currentStep) {
			case 0: {
				// Basic fields
				if (!credentials.environmentId || !credentials.username || !credentials.deviceName || !tokenStatus.isValid) {
					return true;
				}
				
				// Device type specific validation
				if (credentials.deviceType === 'SMS') {
					const cleanedPhone = credentials.phoneNumber.replace(/[^\d]/g, '');
					if (!credentials.phoneNumber) return true;
					// US/Canada needs 10 digits, others need at least 6
					if (credentials.countryCode === '+1') {
						return cleanedPhone.length !== 10;
					}
					return cleanedPhone.length < 6;
				} else if (credentials.deviceType === 'EMAIL') {
					return !credentials.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email);
				} else if (credentials.deviceType === 'TOTP' || credentials.deviceType === 'FIDO2') {
					// TOTP and FIDO2 only need basic fields
					return false;
				}
				return false;
			}
			case 1:
				return !mfaState.deviceId;
			case 2:
				return !nav.completedSteps.includes(2);
			case 3:
				if (!mfaState.verificationResult) {
					return true;
				}
				return mfaState.verificationResult.status !== 'COMPLETED';
			default:
				return false;
		}
	})();

	const nextDisabledReason = (() => {
		if (isLoading) return 'Processing...';
		switch (nav.currentStep) {
			case 0:
				if (!tokenStatus.isValid) return 'Worker token is required';
				return 'Please complete all required fields';
			case 1:
				return 'Please register a device first';
			case 2:
				if (credentials.deviceType === 'TOTP' || credentials.deviceType === 'FIDO2') {
					return 'Click Continue to proceed';
				}
				return 'Please send the OTP code first';
			case 3:
				if (credentials.deviceType === 'FIDO2') {
					return 'Please authenticate with your FIDO2 device first';
				}
				return 'Please validate the OTP code first';
			default:
				return '';
		}
	})();

	return (
		<div className="mfa-flow-v8">
			<div className="flow-header">
				<div className="header-content">
					<div className="header-left">
						<span className="version-tag">V8</span>
						<div className="header-text">
							<h1>PingOne MFA Flow</h1>
							<p>SMS Device Registration and OTP Validation</p>
						</div>
					</div>
					<div className="header-right">
						<div className="step-badge">
							<span className="step-number">{nav.currentStep + 1}</span>
							<span className="step-divider">of</span>
							<span className="step-total">5</span>
						</div>
					</div>
				</div>
			</div>

			<div className="flow-container">
				{/* MFA Navigation Links */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
					<div className="mfa-nav-links" style={{ marginBottom: 0 }}>
						<button
							onClick={() => window.location.href = '/v8/mfa-hub'}
							className="nav-link-btn"
							title="Go to MFA Hub"
						>
							🏠 MFA Hub
						</button>
						<button
							onClick={() => window.location.href = '/v8/mfa-device-management'}
							className="nav-link-btn"
							title="Manage MFA Devices"
						>
							🔧 Device Management
						</button>
						<button
							onClick={() => window.location.href = '/v8/mfa-reporting'}
							className="nav-link-btn"
							title="View MFA Reports"
						>
							📊 Reporting
						</button>
					</div>
					<ApiDisplayCheckbox />
				</div>

				<div className="step-breadcrumb">
					{['Configure', 'Register', 'Send OTP', 'Validate', 'Success'].map((label, idx) => (
						<div key={idx} className="breadcrumb-item">
							<span
								className={`breadcrumb-text ${idx === nav.currentStep ? 'active' : ''} ${nav.completedSteps.includes(idx) ? 'completed' : ''}`}
							>
								{label}
							</span>
							{idx < 4 && <span className="breadcrumb-arrow">→</span>}
						</div>
					))}
				</div>

				<div className="step-content-wrapper">{renderStepContent()}</div>

				<StepValidationFeedbackV8 errors={nav.validationErrors} warnings={nav.validationWarnings} />

				<StepActionButtonsV8
					currentStep={nav.currentStep}
					totalSteps={5}
					isNextDisabled={isNextDisabled}
					nextDisabledReason={nextDisabledReason}
					onPrevious={() => {
						// Clear validation errors when going back
						nav.setValidationErrors([]);
						nav.setValidationWarnings([]);
						nav.goToPrevious();
					}}
					onNext={() => {
						// Validate current step before proceeding
						if (nav.currentStep === 0) {
							if (validateStep0()) {
								nav.goToNext();
							}
						} else {
							nav.goToNext();
						}
					}}
					onFinal={() => {
						console.log(`${MODULE_TAG} Starting new flow`);
						nav.reset();
						nav.setValidationErrors([]);
						nav.setValidationWarnings([]);
						setMfaState({
							deviceId: '',
							otpCode: '',
							deviceStatus: '',
							verificationResult: null,
						});
					}}
				>
					<button
						type="button"
						className="btn btn-reset"
						onClick={() => {
							console.log(`${MODULE_TAG} Resetting flow`);
							FlowResetServiceV8.resetFlow(FLOW_KEY);
							nav.reset();
							setMfaState({
								deviceId: '',
								otpCode: '',
								deviceStatus: '',
								verificationResult: null,
							});
						}}
						title="Reset flow and clear all data"
					>
						Reset Flow
					</button>
				</StepActionButtonsV8>
			</div>

			{/* Worker Token Modal */}
			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={handleWorkerTokenGenerated}
				environmentId={credentials.environmentId}
			/>

			{/* MFA Settings Modal */}
			<MFASettingsModalV8
				isOpen={showSettingsModal}
				onClose={() => setShowSettingsModal(false)}
				environmentId={credentials.environmentId}
			/>

			<style>{`
				.mfa-flow-v8 {
					max-width: 1000px;
					margin: 0 auto;
					background: #f8f9fa; /* Light grey background */
					min-height: 100vh;
				}

				.mfa-nav-links {
					display: flex;
					gap: 12px;
					padding: 16px 0;
					flex-wrap: wrap;
				}

				.nav-link-btn {
					padding: 10px 20px;
					background: white;
					color: #1f2937;
					border: 1px solid #e5e7eb;
					border-radius: 8px;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.nav-link-btn:hover {
					background: #f9fafb;
					border-color: #10b981;
					color: #10b981;
					transform: translateY(-2px);
					box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
				}

				.flow-header {
					background: linear-gradient(135deg, #10b981 0%, #059669 100%); /* Green gradient */
					padding: 28px 40px;
					margin-bottom: 0;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				}

				.header-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
				}

				.header-left {
					display: flex;
					align-items: flex-start;
					gap: 20px;
					flex: 1;
				}

				.version-tag {
					font-size: 11px;
					font-weight: 700;
					color: rgba(26, 26, 26, 0.7); /* Dark text on light background */
					letter-spacing: 1.5px;
					text-transform: uppercase;
					padding-top: 2px;
				}

				.header-text {
					margin: 0;
				}

				.flow-header h1 {
					font-size: 26px;
					font-weight: 700;
					margin: 0 0 4px 0;
					color: #1a1a1a; /* Dark text on light background */
				}

				.flow-header p {
					font-size: 13px;
					color: rgba(26, 26, 26, 0.75); /* Dark text on light background */
					margin: 0;
				}

				.header-right {
					display: flex;
					align-items: center;
				}

				.step-badge {
					background: rgba(255, 255, 255, 0.95); /* Light background */
					padding: 12px 20px;
					border-radius: 24px;
					display: flex;
					align-items: center;
					gap: 8px;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				}

				.step-number {
					font-size: 18px;
					font-weight: 700;
					color: #10b981; /* Green */
				}

				.step-divider {
					font-size: 12px;
					color: #999; /* Grey */
					font-weight: 500;
				}

				.step-total {
					font-size: 14px;
					font-weight: 600;
					color: #666; /* Dark grey */
				}

				.step-breadcrumb {
					background: linear-gradient(to bottom, #d1fae5, #a7f3d0); /* Light green gradient */
					padding: 28px 40px;
					border-bottom: 2px solid #10b981;
					display: flex;
					align-items: center;
					gap: 16px;
					flex-wrap: wrap;
				}

				.breadcrumb-item {
					display: flex;
					align-items: center;
					gap: 16px;
				}

				.breadcrumb-text {
					font-size: 15px;
					font-weight: 500;
					color: #6b7280; /* Grey text */
					padding: 10px 16px;
					border-radius: 6px;
					background: white; /* Light background */
					border: 1px solid #e8e8e8;
					transition: all 0.3s ease;
					cursor: default;
				}

				.breadcrumb-text.completed {
					color: white; /* Light text on dark background */
					background: #10b981; /* Green */
					border-color: #10b981;
					font-weight: 700;
					box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
				}

				.breadcrumb-text.active {
					color: white; /* Light text on dark background */
					background: #059669; /* Dark green */
					border-color: #059669;
					font-weight: 700;
					box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
					transform: scale(1.05);
				}

				.breadcrumb-arrow {
					color: #10b981; /* Green */
					font-size: 20px;
					font-weight: 700;
					opacity: 0.6;
				}

				.flow-container {
					display: flex;
					flex-direction: column;
					gap: 16px;
				}

				.step-content-wrapper {
					background: white; /* Light background */
					border: 1px solid #ddd;
					border-radius: 8px;
					padding: 20px;
					min-height: auto;
				}

				.step-content h2 {
					font-size: 20px;
					font-weight: 600;
					margin: 0 0 8px 0;
					color: #1f2937; /* Dark text on light background */
				}

				.step-content > p {
					font-size: 14px;
					color: #6b7280; /* Grey text on light background */
					margin: 0 0 20px 0;
				}

				.credentials-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 16px;
				}

				.form-group {
					display: flex;
					flex-direction: column;
					gap: 6px;
				}

				.form-group label {
					font-size: 13px;
					font-weight: 500;
					color: #374151; /* Dark text on light background */
				}

				.required {
					color: #ef4444; /* Red */
					margin-left: 2px;
				}

				.form-group input {
					padding: 10px 12px;
					border: 1px solid #d1d5db;
					border-radius: 6px;
					font-size: 14px;
					font-family: monospace;
					color: #1f2937; /* Dark text on light background */
					background: white; /* Light background */
				}

				.form-group input:focus {
					outline: none;
					border-color: #10b981; /* Green */
					box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
				}

				.form-group small {
					font-size: 12px;
					color: #6b7280; /* Grey text on light background */
				}

				.info-box {
					background: #dbeafe; /* Light blue background */
					border: 1px solid #93c5fd;
					border-radius: 8px;
					padding: 16px;
					margin: 16px 0;
				}

				.info-box p {
					margin: 8px 0;
					font-size: 14px;
					color: #1e40af; /* Dark blue text on light background */
				}

				.info-box h4 {
					margin: 0 0 12px 0;
					font-size: 16px;
					color: #1e40af; /* Dark blue text on light background */
				}

				.info-box ul {
					margin: 8px 0;
					padding-left: 20px;
					color: #1e40af; /* Dark blue text on light background */
				}

				.info-box li {
					margin: 4px 0;
				}

				.success-box {
					background: #d1fae5; /* Light green background */
					border: 1px solid #6ee7b7;
					border-radius: 8px;
					padding: 16px;
					margin: 16px 0;
				}

				.success-box h3 {
					margin: 0 0 12px 0;
					font-size: 18px;
					color: #065f46; /* Dark green text on light background */
				}

				.success-box p {
					margin: 8px 0;
					font-size: 14px;
					color: #047857; /* Dark green text on light background */
				}

				.btn {
					padding: 12px 24px;
					border: none;
					border-radius: 6px;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.btn-primary {
					background: #10b981; /* Green */
					color: white; /* Light text on dark background */
				}

				.btn-primary:hover {
					background: #059669; /* Dark green */
				}

				.btn-primary:disabled {
					background: #d1d5db; /* Grey */
					cursor: not-allowed;
				}

				.btn-reset {
					background: #f59e0b; /* Orange */
					color: white; /* Light text on dark background */
					align-self: flex-start;
				}

				.btn-reset:hover {
					background: #d97706; /* Dark orange */
				}

				@media (max-width: 600px) {
					.mfa-flow-v8 {
						padding: 12px;
					}

					.flow-header h1 {
						font-size: 20px;
					}

					.credentials-grid {
						grid-template-columns: 1fr;
					}

					.btn {
						width: 100%;
					}
				}
			`}</style>
			
			<SuperSimpleApiDisplayV8 />

			{/* Device Limit Modal */}
			<MFADeviceLimitModalV8
				isOpen={showDeviceLimitModal}
				onClose={() => setShowDeviceLimitModal(false)}
				deviceType={credentials.deviceType}
			/>
		</div>
	);
};

export default MFAFlowV8;
