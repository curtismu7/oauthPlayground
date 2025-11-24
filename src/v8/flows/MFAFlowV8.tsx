/**
 * @file MFAFlowV8.tsx
 * @module v8/flows
 * @description PingOne MFA Flow - SMS Device Registration and OTP Validation
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Demonstrates PingOne MFA API:
 * - Step 0: Configure credentials (environment, client, user)
 * - Step 1: Register MFA device
 * - Step 2: Validate OTP or complete FIDO2 registration
 * - Step 3: Success - Device verified
 *
 * @example
 * <MFAFlowV8 />
 */

import React, { useEffect, useState, useMemo, useId, useRef } from 'react';
import { usePageScroll } from '@/hooks/usePageScroll';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { type FIDO2Config, FIDO2Service } from '@/services/fido2Service';
import { CountryCodePickerV8 } from '@/v8/components/CountryCodePickerV8';
import { MFADeviceLimitModalV8 } from '@/v8/components/MFADeviceLimitModalV8';
import { MFADeviceSelectorV8 } from '@/v8/components/MFADeviceSelectorV8';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { MFASettingsModalV8 } from '@/v8/components/MFASettingsModalV8';
import StepActionButtonsV8 from '@/v8/components/StepActionButtonsV8';
import StepValidationFeedbackV8 from '@/v8/components/StepValidationFeedbackV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { FlowResetServiceV8 } from '@/v8/services/flowResetServiceV8';
import { MFAEducationServiceV8 } from '@/v8/services/mfaEducationServiceV8';
import { MFAServiceV8, type RegisterDeviceParams } from '@/v8/services/mfaServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

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

	// Scroll to top on page load
	usePageScroll({ pageName: 'MFA Flow V8', force: true });

	const nav = useStepNavigationV8(4, {
		onStepChange: (step) => {
			console.log(`${MODULE_TAG} Step changed to`, { step });
			// Scroll to top when step changes
			window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		},
	});

	const [credentials, setCredentials] = useState<Credentials>(() => {
		// Load flow-specific credentials
		const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		// Get global environment ID if not in flow-specific storage
		const globalEnvId = EnvironmentIdServiceV8.getEnvironmentId();
		const environmentId = stored.environmentId || globalEnvId || '';

		console.log(`${MODULE_TAG} Loading credentials`, {
			flowSpecificEnvId: stored.environmentId,
			globalEnvId,
			usingEnvId: environmentId,
		});

		return {
			environmentId,
			clientId: stored.clientId || '',
			username: stored.username || '',
			deviceType: (stored.deviceType as 'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2') || 'SMS',
			countryCode: stored.countryCode || '+1',
			phoneNumber: stored.phoneNumber || '',
			email: stored.email || '',
			deviceName: stored.deviceName || '',
		};
	});

	const previousCredentialsRef = useRef<Credentials | null>(null);
	const initialCredentialsRef = useRef<Credentials>(credentials);

	const [mfaState, setMfaState] = useState<MFAState>({
		deviceId: '',
		otpCode: '',
		deviceStatus: '',
		verificationResult: null,
	});

	const [existingDevices, setExistingDevices] = useState<Array<Record<string, unknown>>>([]);
	const [loadingDevices, setLoadingDevices] = useState(false);
	const [selectedExistingDevice, setSelectedExistingDevice] = useState<string>(''); // 'new' or deviceId
	const [showRegisterForm, setShowRegisterForm] = useState(false);

	const [showDeviceLimitModal, setShowDeviceLimitModal] = useState(false);

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [testMode, setTestMode] = useState(false);
	const [mockOTP] = useState('123456');
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const [isLoading, setIsLoading] = useState(false);

	const idPrefix = useId();
	const envIdInputId = `${idPrefix}-env-id`;
	const usernameInputId = `${idPrefix}-username`;
	const deviceTypeSelectId = `${idPrefix}-device-type`;
	const phoneInputId = `${idPrefix}-phone`;
	const emailInputId = `${idPrefix}-email`;
	const deviceNameInputId = `${idPrefix}-device-name`;
	const deviceNameRegisterId = `${idPrefix}-device-name-register`;
	const otpInputId = `${idPrefix}-otp`;
	const factorTypes = useMemo(() => MFAEducationServiceV8.getAllFactorTypes(), []);

	const navigateTo = (path: string) => {
		window.location.href = path;
	};

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
		if (testMode) {
			console.log(`${MODULE_TAG} Test mode active - skipping credential persistence`);
			return;
		}

		console.log(`${MODULE_TAG} Credentials changed, saving`, credentials);
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials);

		// Save environment ID globally so it's shared across all flows
		if (credentials.environmentId) {
			EnvironmentIdServiceV8.saveEnvironmentId(credentials.environmentId);
			console.log(`${MODULE_TAG} Environment ID saved globally`, {
				environmentId: credentials.environmentId,
			});
		}

		console.log(`${MODULE_TAG} Credentials saved to localStorage`);
	}, [credentials, testMode]);

	// Get full phone number with country code (PingOne format: +15125201234)
	const getFullPhoneNumber = (): string => {
		// Remove all non-digit characters from phone number
		const cleanedPhone = credentials.phoneNumber.replace(/[^\d]/g, '');

		// Combine country code and cleaned phone number
		const countryCode = credentials.countryCode.startsWith('+')
			? credentials.countryCode
			: `+${credentials.countryCode}`;
		// PingOne requires E.164 format: +[country][number] (e.g., +15125201234)
		return `${countryCode}${cleanedPhone}`;
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

		// Check worker token
		if (!tokenStatus.isValid) {
			errors.push('Worker token is required - please add a token first');
		}

		nav.setValidationErrors(errors);
		nav.setValidationWarnings(warnings);

		return errors.length === 0;
	};

	const handleManageWorkerToken = async () => {
		if (tokenStatus.isValid) {
			// Show confirmation to remove token
			const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
			const confirmed = await uiNotificationServiceV8.confirm({
				title: 'Remove Worker Token',
				message: 'Worker token is currently stored.\n\nDo you want to remove it?',
				confirmText: 'Remove',
				cancelText: 'Cancel',
				severity: 'warning',
			});
			if (confirmed) {
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

			{/* Test Mode Toggle */}
			<div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb' /* Light grey */, borderRadius: '8px', border: '1px solid #e5e7eb' }}>
				<label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#1f2937' /* Dark text */ }}>
					<input
						type="checkbox"
						checked={testMode}
						onChange={(e) => {
							const enabled = e.target.checked;
							console.log(`${MODULE_TAG} Test mode toggled`, { enabled });
							setTestMode(enabled);
							if (enabled) {
								// Pre-fill test credentials with valid UUID format (no "test-" prefix)
								setCredentials({
									...credentials,
									environmentId: '12345678-1234-1234-1234-123456789012',
									username: 'test.user@example.com',
									deviceName: 'Test Device',
									phoneNumber: '5125551234',
									email: 'test@example.com',
								});
								console.log(`${MODULE_TAG} Test mode enabled - credentials pre-filled`);
								toastV8.success('✅ Test mode enabled - using mock credentials');
							} else {
								console.log(`${MODULE_TAG} Test mode disabled`);
								toastV8.info('Test mode disabled - will use real API calls');
							}
						}}
						style={{ width: '18px', height: '18px', cursor: 'pointer' }}
					/>
					<span>🧪 Test Mode - Use mock devices for testing (no real API calls)</span>
				</label>
				{testMode && (
					<div style={{ marginTop: '12px', padding: '16px', background: '#fef3c7' /* Light yellow */, border: '2px solid #f59e0b', borderRadius: '6px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)' }}>
						<p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700', color: '#92400e' /* Dark text */, display: 'flex', alignItems: 'center', gap: '8px' }}>
							<span style={{ fontSize: '20px' }}>🧪</span>
							<span>TEST MODE ACTIVE</span>
						</p>
						<p style={{ margin: 0, fontSize: '13px', color: '#92400e' /* Dark text */, lineHeight: '1.5' }}>
							<strong>All API calls are disabled.</strong> Using mock devices and credentials. Perfect for learning and testing the MFA flow without a real PingOne environment.
						</p>
					</div>
				)}
			</div>

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
					<label htmlFor={envIdInputId}>
						Environment ID <span className="required">*</span>
						<MFAInfoButtonV8 contentKey="credential.environmentId" displayMode="modal" />
					</label>
					<input
						id={envIdInputId}
						type="text"
						value={credentials.environmentId}
						onChange={(e) => setCredentials({ ...credentials, environmentId: e.target.value })}
						placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
					/>
					<small>PingOne environment ID</small>
				</div>

				<div className="form-group">
					<label htmlFor={usernameInputId}>
						Username <span className="required">*</span>
						<MFAInfoButtonV8 contentKey="credential.username" />
					</label>
					<input
						id={usernameInputId}
						type="text"
						value={credentials.username}
						onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
						placeholder="john.doe"
					/>
					<small>PingOne username to register MFA device for</small>
				</div>
			</div>

			<div className="info-box" style={{ marginTop: '20px' }}>
				<p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
					<strong>ℹ️ Next Step:</strong> After configuring your credentials, you'll select a device type and provide device-specific information in Step 1.
				</p>
			</div>
		</div>
	);

	// Render Step 0 - Device Type Selection (moved from credentials)
	const renderDeviceTypeSelection = () => {
		if (currentStep !== 0) return null;

		return null; // Device type selection moved to Step 1
	};

	// Hidden fields for device-specific inputs (moved to Step 1)
	const renderHiddenDeviceFields = () => {
		return null;
		
		// Old code - now moved to Step 1 when registering new device
		/*
		{credentials.deviceType === 'SMS' && (
					<div className="form-group">
						<label htmlFor={phoneInputId}>
							Phone Number <span className="required">*</span>
							<MFAInfoButtonV8 contentKey="phone.format" displayMode="modal" />
						</label>
						<div style={{ display: 'flex', gap: '0' }}>
							<CountryCodePickerV8
								value={credentials.countryCode}
								onChange={(code) => setCredentials({ ...credentials, countryCode: code })}
							/>
							<input
								id={phoneInputId}
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
						<label htmlFor={emailInputId}>
							Email Address <span className="required">*</span>
							<MFAInfoButtonV8 contentKey="factor.email" />
						</label>
						<input
							id={emailInputId}
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
					<label htmlFor={deviceNameInputId}>
						Device Name <span className="required">*</span>
						<MFAInfoButtonV8 contentKey="device.nickname" />
					</label>
					<input
						id={deviceNameInputId}
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

	// Load existing devices when entering Step 1
	const loadExistingDevices = async () => {
		if (!credentials.environmentId || !credentials.username || !tokenStatus.isValid) {
			console.log(`${MODULE_TAG} Cannot load devices - missing credentials or token`);
			return;
		}

		console.log(`${MODULE_TAG} Loading existing devices for user`, {
			username: credentials.username,
		});

		setLoadingDevices(true);
		try {
			const devices = await MFAServiceV8.getAllDevices({
				environmentId: credentials.environmentId,
				username: credentials.username,
			});

			console.log(`${MODULE_TAG} Loaded ${devices.length} existing devices`, devices);
			setExistingDevices(devices);

			// If no devices, show register form by default
			if (devices.length === 0) {
				setShowRegisterForm(true);
				setSelectedExistingDevice('new');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load existing devices`, error);
			// If loading fails, show register form
			setShowRegisterForm(true);
			setSelectedExistingDevice('new');
		} finally {
			setLoadingDevices(false);
		}
	};

	// Load devices when entering Step 1
	// biome-ignore lint/correctness/useExhaustiveDependencies: Only load once when entering step
	useEffect(() => {
		if (nav.currentStep === 1 && existingDevices.length === 0 && !loadingDevices) {
			loadExistingDevices();
		}
	}, [nav.currentStep]);

	// Step 1: Select or Register Device
	const renderStep1 = () => {
		return (
			<div className="step-content">
				<h2>Select Device Type and Register Device</h2>
				<p>Choose a device type, then select an existing device or register a new one</p>

				{/* Token Status Warning */}
				{!tokenStatus.isValid && (
					<div
						style={{
							marginBottom: '16px',
							padding: '12px',
							background: '#fee2e2',
							border: '1px solid #ef4444',
							borderRadius: '6px',
							color: '#991b1b',
						}}
					>
						<p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
							⚠️ Worker Token Required
						</p>
						<p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
							{tokenStatus.message} Please go back to Step 0 and click "Add Token" to generate a
							worker token.
						</p>
					</div>
				)}

				{/* Device Type Selection */}
				<div className="form-group" style={{ marginBottom: '24px' }}>
					<label htmlFor={deviceTypeSelectId}>
						Device Type <span className="required">*</span>
						<MFAInfoButtonV8 contentKey="device.types" displayMode="modal" />
					</label>
					<select
						id={deviceTypeSelectId}
						value={credentials.deviceType}
						onChange={(e) => {
							const newType = e.target.value as 'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2';
							setCredentials({ ...credentials, deviceType: newType });
							// Reset device selection when type changes
							setSelectedExistingDevice('');
							setShowRegisterForm(false);
							setExistingDevices([]);
						}}
						style={{
							padding: '10px 12px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							fontSize: '14px',
							color: '#1f2937',
							background: 'white',
							width: '100%',
						}}
					>
						{factorTypes.map((factor) => (
							<option key={factor.type} value={factor.type}>
								{factor.icon} {factor.name} - {factor.description}
							</option>
						))}
					</select>
					<small>Select the type of MFA device you want to use</small>
				</div>

				{/* Device Name Input */}
				<div className="form-group" style={{ marginBottom: '24px' }}>
					<label htmlFor={deviceNameInputId}>
						Device Name <span className="required">*</span>
						<MFAInfoButtonV8 contentKey="device.nickname" />
					</label>
					<input
						id={deviceNameInputId}
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
						Enter a friendly name to identify this device
						{credentials.deviceName && (
							<span
								style={{
									marginLeft: '8px',
									color: '#10b981',
									fontWeight: '500',
								}}
							>
								✓ Ready to use: "{credentials.deviceName}"
							</span>
						)}
					</small>
				</div>

				{/* Device-specific fields (phone/email) */}
				{credentials.deviceType === 'SMS' && (
					<div className="form-group" style={{ marginBottom: '24px' }}>
						<label htmlFor={phoneInputId}>
							Phone Number <span className="required">*</span>
							<MFAInfoButtonV8 contentKey="phone.format" displayMode="modal" />
						</label>
						<div style={{ display: 'flex', gap: '0' }}>
							<CountryCodePickerV8
								value={credentials.countryCode}
								onChange={(code) => setCredentials({ ...credentials, countryCode: code })}
							/>
							<input
								id={phoneInputId}
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
					<div className="form-group" style={{ marginBottom: '24px' }}>
						<label htmlFor={emailInputId}>
							Email Address <span className="required">*</span>
							<MFAInfoButtonV8 contentKey="factor.email" />
						</label>
						<input
							id={emailInputId}
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

				{/* Refresh Devices Button */}
				{existingDevices.length > 0 && (
					<div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
						<button
							type="button"
							onClick={loadExistingDevices}
							disabled={loadingDevices || !tokenStatus.isValid}
							style={{
								padding: '8px 16px',
								background: 'white',
								color: '#6b7280' /* Dark text on light background */,
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '13px',
								fontWeight: '500',
								cursor: loadingDevices || !tokenStatus.isValid ? 'not-allowed' : 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
							}}
							title="Refresh device list"
						>
							<span>{loadingDevices ? '🔄' : '🔃'}</span>
							<span>Refresh Devices</span>
						</button>
					</div>
				)}

				{/* Device Selector Component */}
				<MFADeviceSelectorV8
					devices={existingDevices}
					loading={loadingDevices}
					selectedDeviceId={selectedExistingDevice}
					onSelectDevice={(deviceId) => {
						console.log(`${MODULE_TAG} Device selected`, { deviceId });
						setSelectedExistingDevice(deviceId);
						setShowRegisterForm(false);

						// Find and set device info
						const device = existingDevices.find((d) => d.id === deviceId);
						if (device) {
							setMfaState({
								...mfaState,
								deviceId: device.id as string,
								deviceStatus: device.status as string,
								nickname: device.nickname as string,
							});
							setCredentials((prev) => ({
								...prev,
								deviceType: (device.type || prev.deviceType) as 'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2',
							}));
						}
					}}
					onUseDevice={() => {
						console.log(`${MODULE_TAG} Using existing device`, {
							deviceId: selectedExistingDevice,
						});
						nav.markStepComplete();
						nav.goToNext();
						toastV8.success('Device selected successfully!');
					}}
					onRegisterNew={() => {
						console.log(`${MODULE_TAG} User chose to register new device`);
						setSelectedExistingDevice('new');
						setShowRegisterForm(true);
						setMfaState({
							...mfaState,
							deviceId: '',
							deviceStatus: '',
						});
					}}
					deviceType={credentials.deviceType}
					disabled={!tokenStatus.isValid}
				/>

				{selectedExistingDevice && selectedExistingDevice !== 'new' && (
					(() => {
						const selectedDevice = existingDevices.find((device) => device.id === selectedExistingDevice);
						if (!selectedDevice) {
							return null;
						}

						const details: Array<{ label: string; value: string | undefined }> = [
							{ label: 'Type', value: selectedDevice.type as string | undefined },
							{ label: 'Status', value: selectedDevice.status as string | undefined },
							{ label: 'Nickname', value: selectedDevice.nickname as string | undefined },
							{ label: 'Phone', value: selectedDevice.phone as string | undefined },
							{ label: 'Email', value: selectedDevice.email as string | undefined },
						];

						return (
							<div
								style={{
									marginTop: '16px',
									padding: '16px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									background: '#f9fafb',
								}}
							>
								<h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1f2937', fontWeight: 600 }}>
									Selected Device Details
								</h4>
								<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '4px' }}>
									{details
										.filter(({ value }) => value)
										.map(({ label, value }) => (
											<li key={label} style={{ fontSize: '13px', color: '#374151' }}>
												<strong style={{ fontWeight: 600 }}>{label}:</strong> {value}
											</li>
										))}
								</ul>
								<p style={{ fontSize: '13px', color: '#6b7280', margin: '12px 0 0 0' }}>
									Click <em>Use Selected Device</em> above to move forward with verification.
								</p>
							</div>
						);
					})()
				)}

				{/* Registration Form - Only shown when "Register New" is selected */}
				{showRegisterForm && (
					<>
						<h3
							style={{
								fontSize: '16px',
								fontWeight: '600',
								marginTop: '24px',
								marginBottom: '12px',
								color: '#1f2937',
							}}
						>
							Register New Device
						</h3>

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
							PingOne format: +[country][number] (e.g., +15125201234)
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
						FIDO2 devices use WebAuthn-compatible security keys, biometric authenticators, or
						platform authenticators (e.g., Windows Hello, Face ID, Touch ID)
					</p>
				)}
			</div>

			{/* Device Name Input - Final chance to name it */}
			<div className="form-group" style={{ marginTop: '20px' }}>
				<label htmlFor={deviceNameRegisterId}>
					Device Name <span className="required">*</span>
					<MFAInfoButtonV8 contentKey="device.nickname" />
				</label>
				<input
					id={deviceNameRegisterId}
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
						<strong>Will send:</strong> {getFullPhoneNumber()}
					</p>
					<p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#92400e' }}>
						PingOne format: E.164 (e.g., +15125201234)
					</p>
				</div>
			)}

			<button
				type="button"
				className="btn btn-primary"
				disabled={isLoading || !credentials.deviceName?.trim()}
				style={testMode ? {
					background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
					border: '2px solid #d97706',
					boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
				} : undefined}
				onClick={async () => {
					console.log(`${MODULE_TAG} Registering ${credentials.deviceType} device`, {
						testMode,
						deviceType: credentials.deviceType,
						deviceName: credentials.deviceName,
					});

					// Validate device name before proceeding
					if (!credentials.deviceName?.trim()) {
						nav.setValidationErrors([
							'Device name is required. Please enter a name for this device.',
						]);
						setIsLoading(false);
						return;
					}

					// Test mode: Skip API call and use mock device (check BEFORE setIsLoading)
					if (testMode) {
						console.log(`${MODULE_TAG} ✅ Test mode detected - using mock device registration`);
						setIsLoading(true);
						
						// Simulate a brief delay to make it feel realistic
						await new Promise(resolve => setTimeout(resolve, 500));
						
						const mockDeviceId = `test-device-${Date.now()}`;
						setMfaState({
							...mfaState,
							deviceId: mockDeviceId,
							deviceStatus: 'ACTIVE',
							nickname: credentials.deviceName,
							environmentId: credentials.environmentId,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						});
						
						console.log(`${MODULE_TAG} ✅ Mock device created`, { mockDeviceId });
						toastV8.success(`✅ Test device registered: ${credentials.deviceName}`);
						nav.markStepComplete();
						setIsLoading(false);
						return;
					}

					console.log(`${MODULE_TAG} Real mode - proceeding with actual API call`);
					setIsLoading(true);
					try {
						
						// Handle FIDO2 registration separately (requires WebAuthn ceremony)
						if (credentials.deviceType === 'FIDO2') {
							console.log(`${MODULE_TAG} Starting FIDO2 device registration with WebAuthn`);

							// Check WebAuthn support
							if (!FIDO2Service.isWebAuthnSupported()) {
								throw new Error(
									'WebAuthn is not supported in this browser. Please use a modern browser that supports FIDO2.'
								);
							}

							// Show progress toast
							toastV8.info('🔐 Preparing FIDO2 registration...');

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
							toastV8.info('🔑 Please complete the WebAuthn registration prompt...');
							
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

							// Reload devices list
							await loadExistingDevices();
							
							nav.markStepComplete();
							toastV8.success('✅ FIDO2 device registered successfully!');
							
							// Auto-advance through Step 2 (no OTP needed for FIDO2)
							setTimeout(() => {
								console.log(`${MODULE_TAG} Auto-advancing to Step 3 for FIDO2 verification`);
								nav.markStepComplete(); // Mark Step 2 complete
								nav.goToNext(); // Go to Step 2
								setTimeout(() => {
									nav.goToNext(); // Go to Step 3 (verification)
									toastV8.info('🔐 Ready to verify your FIDO2 device');
								}, 300);
							}, 500);
							
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
								charCodes: Array.from(fullPhone)
									.map((c) => `${c}(${c.charCodeAt(0)})`)
									.join(' '),
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

							// Auto-activate TOTP device after registration
							try {
								console.log(`${MODULE_TAG} Auto-activating TOTP device`);
								await MFAServiceV8.activateTOTPDevice({
									environmentId: credentials.environmentId,
									username: credentials.username,
									deviceId: result.deviceId,
								});
								console.log(`${MODULE_TAG} TOTP device activated successfully`);
								toastV8.success('🔐 TOTP device activated!');
							} catch (activationError) {
								console.warn(`${MODULE_TAG} TOTP activation failed (non-critical)`, activationError);
								// Don't fail the whole flow if activation fails
								toastV8.warning('Device registered but activation failed. You can activate it manually.');
							}
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

						// Reload devices list to show the new device
						await loadExistingDevices();
						
						nav.markStepComplete();
						toastV8.success(`${credentials.deviceType} device registered successfully!`);
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
							nav.setValidationErrors([`Device registration failed: ${errorMessage}`]);
							toastV8.error('Device limit exceeded. Please delete an existing device first.');
						} else {
							// Show regular inline error for other errors
							nav.setValidationErrors([`Failed to register device: ${errorMessage}`]);
							toastV8.error(`Registration failed: ${errorMessage}`);
						}
					} finally {
						setIsLoading(false);
					}
				}}
			>
				{isLoading
					? testMode 
						? '🧪 Creating Test Device...'
						: '🔄 Registering...'
					: !tokenStatus.isValid
						? '⚠️ Worker Token Required'
						: testMode
							? `🧪 Register Test ${credentials.deviceType} Device`
							: `Register ${credentials.deviceType} Device`}
			</button>
			{!tokenStatus.isValid && (
				<p style={{ marginTop: '8px', fontSize: '13px', color: '#991b1b' }}>
					Please go back to Step 0 and add a worker token to continue.
				</p>
			)}
					</>
				)}

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
						<div
							style={{
								marginTop: '16px',
								padding: '16px',
								background: '#f9fafb' /* Light background */,
								borderRadius: '8px',
								border: '1px solid #e5e7eb',
							}}
						>
							<h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1f2937' /* Dark text on light background */, display: 'flex', alignItems: 'center', gap: '8px' }}>
								📱 Scan QR Code with Authenticator App
								<MFAInfoButtonV8 contentKey="totp.qrCode" displayMode="modal" />
							</h4>
							<div
								style={{
									textAlign: 'center',
									padding: '16px',
									background: 'white',
									borderRadius: '6px',
								}}
							>
								<img
									src={mfaState.qrCodeUrl}
									alt="TOTP QR Code"
									style={{ maxWidth: '200px', height: 'auto' }}
								/>
							</div>
							{mfaState.totpSecret && (
								<div style={{ marginTop: '12px' }}>
									<p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' /* Dark text */, display: 'flex', alignItems: 'center', gap: '8px' }}>
										<strong>Manual Entry Key:</strong>
										<MFAInfoButtonV8 contentKey="totp.secret" displayMode="modal" size="small" />
									</p>
									<p
										style={{
											margin: '0',
											fontSize: '14px',
											fontFamily: 'monospace',
											color: '#1f2937' /* Dark text */,
											background: 'white',
											padding: '8px',
											borderRadius: '4px',
											wordBreak: 'break-all',
										}}
									>
										{mfaState.totpSecret}
									</p>
									<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' /* Dark text */ }}>
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
	};

	// Step 2: Validate OTP or complete FIDO2 verification
	const renderStep2 = () => {
		if (!mfaState.deviceId) {
			return (
				<div className="step-content">
					<h2>Device Registration Required</h2>
					<p>Please register or select a device in the previous step before continuing.</p>
				</div>
			);
		}

		// FIDO2 validation uses WebAuthn authentication instead of OTP
		if (credentials.deviceType === 'FIDO2') {
			return (
				<div className="step-content">
					<h2>Verify FIDO2 Device</h2>
					<p>Complete the WebAuthn authentication to verify your device</p>

					{/* Progress indicator during authentication */}
					{isLoading && (
						<div style={{
							marginBottom: '20px',
							padding: '16px',
							background: '#eff6ff', // Light blue background
							border: '2px solid #3b82f6',
							borderRadius: '8px',
							textAlign: 'center'
						}}>
							<div style={{
								fontSize: '32px',
								marginBottom: '8px',
								animation: 'pulse 1.5s ease-in-out infinite'
							}}>
								🔐
							</div>
							<p style={{
								margin: '0 0 4px 0',
								fontSize: '14px',
								fontWeight: '600',
								color: '#1e40af' // Dark blue text on light background
							}}>
								Waiting for WebAuthn Authentication...
							</p>
							<p style={{
								margin: 0,
								fontSize: '12px',
								color: '#1e40af' // Dark blue text on light background
							}}>
								Please complete the authentication prompt on your device
							</p>
						</div>
					)}

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
									throw new Error(
										'FIDO2 credential ID is missing. Please register the device first.'
									);
								}

								// Show progress toast
								toastV8.info('🔐 Please complete the WebAuthn authentication prompt...');

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
									allowCredentials: [
										{
											id: credentialIdBuffer,
											type: 'public-key',
										},
									],
									userVerification: 'preferred',
								};

								console.log(`${MODULE_TAG} Requesting WebAuthn authentication`);

								// Request authentication
								const credential = (await navigator.credentials.get({
									publicKey: authOptions,
								})) as PublicKeyCredential | null;

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
								toastV8.success('✅ FIDO2 device verified successfully!');
								
								// Auto-advance to success step
								setTimeout(() => {
									console.log(`${MODULE_TAG} Auto-advancing to success step`);
									nav.goToNext();
								}, 800);
							} catch (error) {
								console.error(`${MODULE_TAG} FIDO2 authentication failed`, error);
								const errorMessage = error instanceof Error ? error.message : 'Unknown error';
								
								// Provide helpful error messages
								let userMessage = errorMessage;
								if (errorMessage.includes('cancelled')) {
									userMessage = 'Authentication was cancelled. Please try again.';
								} else if (errorMessage.includes('timeout')) {
									userMessage = 'Authentication timed out. Please try again.';
								} else if (errorMessage.includes('not supported')) {
									userMessage = 'FIDO2 is not supported in this browser. Please use Chrome, Firefox, Safari, or Edge.';
								}
								
								nav.setValidationErrors([`FIDO2 authentication failed: ${userMessage}`]);
								toastV8.error(userMessage);
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

		const verificationTarget =
			credentials.deviceType === 'TOTP'
				? 'your authenticator app'
				: credentials.deviceType === 'SMS'
					? 'your phone'
					: 'your email inbox';

		// OTP validation for SMS, EMAIL, and TOTP
		return (
			<div className="step-content">
				<h2>Validate OTP Code</h2>
				<p>
					Enter the 6-digit code from {verificationTarget}. For SMS and Email factors, the code is
					sent automatically immediately after registration.
				</p>

				{testMode && (
					<div
						style={{
							marginBottom: '20px',
							padding: '16px',
							background: '#fef3c7',
							border: '2px solid #f59e0b',
							borderRadius: '8px',
						}}
					>
						<p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
							🧪 TEST MODE - Mock OTP Code
						</p>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
							<code
								style={{
									fontSize: '24px',
									fontWeight: '700',
									letterSpacing: '4px',
									color: '#92400e',
									background: 'white',
									padding: '8px 16px',
									borderRadius: '6px',
								}}
							>
								{mockOTP}
							</code>
							<button
								type="button"
								onClick={() => {
									navigator.clipboard.writeText(mockOTP);
									toastV8.success('Test OTP copied to clipboard!');
								}}
								style={{
									padding: '8px 12px',
									background: 'white',
									border: '1px solid #f59e0b',
									borderRadius: '4px',
									cursor: 'pointer',
									fontSize: '12px',
									color: '#92400e',
								}}
							>
								📋 Copy
							</button>
						</div>
						<p style={{ margin: 0, fontSize: '12px', color: '#92400e' }}>
							Use this code to simulate verification. In test mode, no real OTP is sent.
						</p>
					</div>
				)}

				<div className="info-box">
					<p>
						<strong>Device ID:</strong> {mfaState.deviceId}
					</p>
					{credentials.deviceType === 'SMS' && (
						<p>
							<strong>Phone Number:</strong> {getFullPhoneNumber()}
						</p>
					)}
					{credentials.deviceType === 'EMAIL' && (
						<p>
							<strong>Email:</strong> {credentials.email}
						</p>
					)}
				</div>

				<div className="form-group">
					<label htmlFor={otpInputId}>
						OTP Code <span className="required">*</span>
						<MFAInfoButtonV8 contentKey="otp.code" displayMode="modal" />
					</label>
					<input
						id={otpInputId}
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
							// Test mode: Validate against mock OTP
							if (testMode) {
								console.log(`${MODULE_TAG} Test mode: Validating against mock OTP`);
								if (mfaState.otpCode === mockOTP) {
									setMfaState({
										...mfaState,
										verificationResult: {
											status: 'COMPLETED',
											message: 'Test OTP verified successfully',
										},
									});
									nav.markStepComplete();
									toastV8.success('Test OTP verified! Device is now active.');
									setIsLoading(false);
									return;
								} else {
									throw new Error(`Invalid test OTP. Expected: ${mockOTP}`);
								}
							}
							
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
							toastV8.success('OTP verified successfully! Device is now active.');
						} catch (error) {
							console.error(`${MODULE_TAG} OTP validation failed`, error);
							const errorMessage = error instanceof Error ? error.message : 'Unknown error';
							nav.setValidationErrors([`Failed to validate OTP: ${errorMessage}`]);
							toastV8.error(`Invalid OTP code. Please try again.`);
							
							// Clear the OTP input for retry
							setMfaState({ ...mfaState, otpCode: '' });
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

	// Step 3: Success
	const renderStep3 = () => (
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
			default:
				return renderStep0();
		}
	};

	const isNextDisabled = useMemo(() => {
		if (isLoading) return true;
		switch (nav.currentStep) {
			case 0: {
				// Step 0 only requires environment ID, username, and worker token
				return (
					!tokenStatus.isValid ||
					!credentials.environmentId.trim() ||
					!credentials.username.trim()
				);
			}
			case 1: {
				// Step 1 requires device type, device name, and device-specific fields
				const sanitizedPhone = credentials.phoneNumber.replace(/[^\d]/g, '');
				const hasPhoneError =
					credentials.deviceType === 'SMS' &&
					sanitizedPhone.length < (credentials.countryCode === '+1' ? 10 : 6);
				const hasEmailError =
					credentials.deviceType === 'EMAIL' &&
					!credentials.email.trim();
				
				// Can proceed if device is registered OR all fields are valid for registration
				const canRegister = 
					credentials.deviceName.trim() &&
					!hasPhoneError &&
					!hasEmailError;
				
				return !mfaState.deviceId && !canRegister;
			}
			case 2:
				if (!mfaState.deviceId) return true;
				return credentials.deviceType === 'FIDO2'
					? !!mfaState.verificationResult && mfaState.verificationResult.status === 'COMPLETED'
						? false
						: isLoading
					: !mfaState.otpCode || mfaState.otpCode.length !== 6;
			case 3:
				return false;
			default:
				return true;
		}
	}, [
		credentials.deviceName,
		credentials.deviceType,
		credentials.email,
		credentials.environmentId,
		credentials.phoneNumber,
		credentials.username,
		credentials.countryCode,ntryCode,
		isLoading,
		mfaState.deviceId,
		mfaState.otpCode,
		mfaState.verificationResult,
		nav.currentStep,
		tokenStatus.isValid,
	]);

	const nextDisabledReason = useMemo(() => {
		if (isLoading) return 'Processing...';
		switch (nav.currentStep) {
			case 0:
				if (!tokenStatus.isValid) return 'Worker token is required';
				return 'Please complete all required fields';
			case 1:
				return 'Please register or select a device first';
			case 2:
				return credentials.deviceType === 'FIDO2'
					? 'Authenticate with your FIDO2 device to continue'
					: 'Validate the OTP code to continue';
			case 3:
				return '';
			default:
				return '';
		}
	}, [credentials.deviceType, isLoading, nav.currentStep, tokenStatus.isValid]);

	return (
		<div className="mfa-flow-v8">
			<div className="flow-header">
				<div className="header-content">
					<div className="header-left">
						<div>
							<div className="version-tag">MFA FLOW V8</div>
							<h1>PingOne Multi-Factor Authentication</h1>
							<p>Configure credentials, register a device, and validate it end-to-end.</p>
						</div>
					</div>
					<div className="header-right">
						<div className="step-badge">
							<span className="step-number">{nav.currentStep + 1}</span>
							<span className="step-divider">/</span>
							<span className="step-total">4</span>
						</div>
					</div>
				</div>
				<div className="mfa-nav-links">
					<button type="button" className="nav-link-btn" onClick={() => navigateTo('/v8/mfa-hub')}>
						<span role="img" aria-label="hub">
							🏠
						</span>
						<span>MFA Hub</span>
					</button>
					<button
						type="button"
						className="nav-link-btn"
						onClick={() => navigateTo('/v8/mfa-device-management')}
					>
						<span role="img" aria-label="devices">
							🔐
						</span>
						<span>Device Management</span>
					</button>
					<button
						type="button"
						className="nav-link-btn"
						onClick={() => navigateTo('/v8/mfa-reporting')}
					>
						<span role="img" aria-label="reporting">
							📊
						</span>
						<span>Reporting & Logs</span>
					</button>
				</div>
			</div>

			<div className="flow-container">
				<div className="step-breadcrumb">
					{['Configure', 'Register Device', 'Validate', 'Success'].map((label, idx) => (
						<div key={label} className="breadcrumb-item">
							<span
								className={`breadcrumb-text ${idx === nav.currentStep ? 'active' : ''} ${nav.completedSteps.includes(idx) ? 'completed' : ''}`}
							>
								{label}
							</span>
							{idx < 3 && <span className="breadcrumb-arrow">→</span>}
						</div>
					))}
				</div>

				<div className="step-content-wrapper">{renderStepContent()}</div>

				<StepValidationFeedbackV8 errors={nav.validationErrors} warnings={nav.validationWarnings} />

				<StepActionButtonsV8
					currentStep={nav.currentStep}
					totalSteps={4}
					isNextDisabled={isNextDisabled}
					nextDisabledReason={nextDisabledReason}
					onPrevious={() => {
						nav.setValidationErrors([]);
						nav.setValidationWarnings([]);
						nav.goToPrevious();
					}}
					onNext={() => {
						if (nav.currentStep === 0) {
							if (validateStep0()) {
								nav.goToNext();
							}
						} else if (nav.currentStep === 1) {
							if (mfaState.deviceId) {
								nav.goToNext();
							} else {
								nav.setValidationErrors(['Please register or select a device before continuing.']);
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

			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={handleWorkerTokenGenerated}
				environmentId={credentials.environmentId}
			/>

			<MFASettingsModalV8
				isOpen={showSettingsModal}
				onClose={() => setShowSettingsModal(false)}
				environmentId={credentials.environmentId}
			/>

			<style>{`
				@keyframes pulse {
					0%, 100% {
						opacity: 1;
						transform: scale(1);
					}
					50% {
						opacity: 0.7;
						transform: scale(1.1);
					}
				}

				.mfa-flow-v8 {
					max-width: 1000px;
					margin: 0 auto;
					background: #f8f9fa;
					min-height: 100vh;
					padding-bottom: 40px;
				}

				.flow-header {
					background: linear-gradient(135deg, #10b981 0%, #059669 100%);
					padding: 28px 40px;
					margin-bottom: 0;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				}

				.header-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 24px;
				}

				.header-left {
					display: flex;
					flex-direction: column;
					gap: 12px;
					flex: 1;
				}

				.version-tag {
					font-size: 11px;
					font-weight: 700;
					color: rgba(26, 26, 26, 0.7);
					letter-spacing: 1.5px;
					text-transform: uppercase;
				}

				.flow-header h1 {
					font-size: 26px;
					font-weight: 700;
					margin: 0 0 4px 0;
					color: #1a1a1a;
				}

				.flow-header p {
					font-size: 13px;
					color: rgba(26, 26, 26, 0.75);
					margin: 0;
				}

				.header-right {
					display: flex;
					align-items: center;
				}

				.step-badge {
					background: rgba(255, 255, 255, 0.95);
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
					color: #10b981;
				}

				.step-divider {
					font-size: 12px;
					color: #999;
					font-weight: 500;
				}

				.step-total {
					font-size: 14px;
					font-weight: 600;
					color: #666;
				}

				.mfa-nav-links {
					display: flex;
					gap: 12px;
					padding: 16px 0 0 0;
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

				.flow-container {
					display: flex;
					flex-direction: column;
					gap: 16px;
					margin: 0 40px;
					padding: 24px 0 0 0;
				}

				.step-breadcrumb {
					background: linear-gradient(to bottom, #d1fae5, #a7f3d0);
					padding: 24px;
					border-radius: 12px;
					display: flex;
					align-items: center;
					gap: 16px;
					flex-wrap: wrap;
					border: 1px solid #10b981;
				}

				.breadcrumb-item {
					display: flex;
					align-items: center;
					gap: 12px;
				}

				.breadcrumb-text {
					font-size: 14px;
					font-weight: 500;
					color: #6b7280;
					padding: 8px 14px;
					border-radius: 6px;
					background: white;
					border: 1px solid #e8e8e8;
					transition: all 0.3s ease;
				}

				.breadcrumb-text.completed {
					color: white;
					background: #10b981;
					border-color: #10b981;
					font-weight: 700;
					box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
				}

				.breadcrumb-text.active {
					color: white;
					background: #059669;
					border-color: #059669;
					font-weight: 700;
					box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
					transform: scale(1.05);
				}

				.breadcrumb-arrow {
					color: #10b981;
					font-size: 18px;
					font-weight: 700;
					opacity: 0.6;
				}

				.step-content-wrapper {
					background: white;
					border: 1px solid #ddd;
					border-radius: 8px;
					padding: 24px;
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
					color: #374151;
				}

				.form-group input,
				.form-group select,
				.form-group textarea {
					padding: 10px 12px;
					border: 1px solid #d1d5db;
					border-radius: 6px;
					font-size: 14px;
					font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
					color: #1f2937;
					background: white;
					transition: border-color 0.15s ease, box-shadow 0.15s ease;
				}

				.form-group input:focus,
				.form-group select:focus,
				.form-group textarea:focus {
					outline: none;
					border-color: #10b981;
					box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
				}

				.form-group small {
					font-size: 12px;
					color: #6b7280;
					line-height: 1.4;
				}

				.info-box {
					background: #dbeafe;
					border: 1px solid #93c5fd;
					border-radius: 8px;
					padding: 16px;
					margin: 16px 0;
				}

				.success-box {
					background: #d1fae5;
					border: 1px solid #6ee7b7;
					border-radius: 8px;
					padding: 16px;
					margin: 16px 0;
				}

				.success-box h3 {
					margin: 0 0 12px 0;
					font-size: 18px;
					color: #065f46;
				}

				.success-box p {
					margin: 8px 0;
					font-size: 14px;
					color: #047857;
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
					background: #10b981;
					color: white;
				}

				.btn-primary:hover {
					background: #059669;
				}

				.btn-primary:disabled {
					background: #d1d5db;
					cursor: not-allowed;
				}

				.btn-reset {
					background: #f59e0b;
					color: white;
				}

				.btn-reset:hover {
					background: #d97706;
				}

				@media (max-width: 768px) {
					.flow-container {
						margin: 0 20px;
					}
				}

				@media (max-width: 600px) {
					.mfa-flow-v8 {
						padding: 16px;
					}

					.flow-header {
						padding: 20px;
					}

					.flow-header h1 {
						font-size: 20px;
					}

					.flow-container {
						margin: 0;
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

			<MFADeviceLimitModalV8
				isOpen={showDeviceLimitModal}
				onClose={() => setShowDeviceLimitModal(false)}
				deviceType={credentials.deviceType}
			/>
		</div>
	);
};

export default MFAFlowV8;
