/**
 * @file FIDO2FlowV8.tsx
 * @module v8/flows/types
 * @description FIDO2-specific MFA flow component (Refactored with Controller Pattern)
 * @version 8.2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAFlowBaseV8, type MFAFlowBaseRenderProps } from '../shared/MFAFlowBaseV8';
import type { DeviceType, MFACredentials } from '../shared/MFATypes';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFADeviceSelector } from '../components/MFADeviceSelector';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { FIDO2FlowController } from '../controllers/FIDO2FlowController';
import { FIDO2Service } from '@/services/fido2Service';
import { FiShield } from 'react-icons/fi';

const MODULE_TAG = '[🔑 FIDO2-FLOW-V8]';

// Step 0: Configure Credentials (FIDO2-specific - no phone/email needed)
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

	// Check WebAuthn support
	const [webAuthnSupported, setWebAuthnSupported] = useState(false);
	const [webAuthnCapabilities, setWebAuthnCapabilities] = useState<ReturnType<typeof FIDO2Service.getCapabilities> | null>(null);

	useEffect(() => {
		const supported = FIDO2Service.isWebAuthnSupported();
		setWebAuthnSupported(supported);
		if (supported) {
			setWebAuthnCapabilities(FIDO2Service.getCapabilities());
		}
	}, []);

	return (
		<div className="step-content">
			<h2>
				Configure MFA Settings
				<MFAInfoButtonV8 contentKey="device.enrollment" displayMode="modal" />
			</h2>
			<p>Enter your PingOne environment details and user information</p>

			{/* WebAuthn Support Check */}
			{!webAuthnSupported && (
				<div className="info-box" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', marginBottom: '20px' }}>
					<h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>⚠️ WebAuthn Not Supported</h4>
					<p style={{ margin: '0', fontSize: '14px' }}>
						Your browser does not support WebAuthn. Please use a modern browser (Chrome, Firefox, Safari, Edge) to register FIDO2 devices.
					</p>
				</div>
			)}

			{webAuthnCapabilities && (
				<div className="info-box" style={{ marginBottom: '20px' }}>
					<h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>🔐 WebAuthn Capabilities</h4>
					<ul style={{ margin: '0', paddingLeft: '20px' }}>
						<li>WebAuthn Supported: ✅</li>
						{webAuthnCapabilities.platformAuthenticator && <li>Platform Authenticator (Touch ID, Face ID, Windows Hello): ✅</li>}
						{webAuthnCapabilities.crossPlatformAuthenticator && <li>Cross-Platform Authenticator (YubiKey, etc.): ✅</li>}
						{webAuthnCapabilities.userVerification && <li>User Verification: ✅</li>}
					</ul>
				</div>
			)}

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
							Select which PingOne policy governs FIDO2 authentications.
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
						Policies are fetched from PingOne Device Authentication Policies.
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
const FIDO2FlowV8WithDeviceSelection: React.FC = () => {
	// Initialize controller using factory
	const controller = useMemo(() => 
		MFAFlowControllerFactory.create({ deviceType: 'FIDO2' }) as FIDO2FlowController, []
	);

	// Device selection state
	const [deviceSelection, setDeviceSelection] = useState({
		existingDevices: [] as Array<Record<string, unknown>>,
		loadingDevices: false,
		selectedExistingDevice: '',
		showRegisterForm: false,
	});

	// FIDO2-specific state
	const [credentialId, setCredentialId] = useState<string>('');
	const [isRegistering, setIsRegistering] = useState(false);

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
					deviceName: credentials.deviceType || 'FIDO2',
				});
			}
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
					setMfaState((prev) => ({
						...prev,
						deviceId: deviceSelection.selectedExistingDevice,
						nickname: (device.nickname as string) || (device.name as string) || '',
						authenticationId: authResult.authenticationId,
						deviceAuthId: authResult.authenticationId,
						environmentId: credentials.environmentId,
						nextStep: authResult.nextStep,
					}));

					// Handle nextStep response
					if (authResult.nextStep === 'COMPLETED') {
						// Authentication already complete
						nav.markStepComplete();
						nav.goToStep(3); // Go to success step
						toastV8.success('Authentication successful!');
					} else if (authResult.nextStep === 'ASSERTION_REQUIRED') {
						// For FIDO2, user needs to complete WebAuthn assertion
						nav.markStepComplete();
						nav.goToStep(3); // Go to WebAuthn assertion step
						toastV8.success('Device selected. Please complete WebAuthn authentication.');
					} else if (authResult.nextStep === 'SELECTION_REQUIRED') {
						// Shouldn't happen if deviceId is provided, but handle it
						nav.setValidationErrors(['Multiple devices found. Please select a specific device.']);
						toastV8.warning('Please select a specific device');
					} else {
						nav.markStepComplete();
						nav.goToStep(3); // Default to assertion step
						toastV8.success('Device selected successfully!');
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

		// Handle device registration with WebAuthn
		const handleRegisterDevice = async () => {
			if (!FIDO2Service.isWebAuthnSupported()) {
				nav.setValidationErrors(['WebAuthn is not supported in this browser. Please use a modern browser.']);
				return;
			}

			setIsLoading(true);
			setIsRegistering(true);
			try {
				// First, create the device in PingOne
				const deviceParams = controller.getDeviceRegistrationParams(credentials);
				const deviceResult = await controller.registerDevice(credentials, deviceParams);
				
				// Then, register the FIDO2 credential using WebAuthn
				const fido2Result = await controller.registerFIDO2Device(credentials, deviceResult.deviceId);
				
				setMfaState({
					...mfaState,
					deviceId: deviceResult.deviceId,
					deviceStatus: fido2Result.status,
				});

				if (fido2Result.credentialId) {
					setCredentialId(fido2Result.credentialId);
				}

				// Refresh device list
				const devices = await controller.loadExistingDevices(credentials, tokenStatus);
				setDeviceSelection((prev) => ({
					...prev,
					existingDevices: devices,
				}));

				nav.markStepComplete();
				toastV8.success('FIDO2 device registered successfully!');
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
				setIsRegistering(false);
			}
		};

		return (
			<div className="step-content">
				<h2>Select or Register FIDO2 Device</h2>
				<p>Choose an existing device or register a new security key</p>

				<MFADeviceSelector
					devices={deviceSelection.existingDevices as Array<{ id: string; type: string; nickname?: string; name?: string; status?: string }>}
					loading={deviceSelection.loadingDevices}
					selectedDeviceId={deviceSelection.selectedExistingDevice}
					deviceType="FIDO2"
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

						<div className="info-box" style={{ marginTop: '20px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
							<h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1e40af' }}>🔐 WebAuthn Registration</h4>
							<p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
								When you click "Register FIDO2 Device", your browser will prompt you to:
							</p>
							<ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
								<li>Use your security key, Touch ID, Face ID, or Windows Hello</li>
								<li>Follow the on-screen prompts to complete registration</li>
								<li>Confirm the registration when prompted</li>
							</ul>
						</div>

						<button
							type="button"
							className="btn btn-primary"
							disabled={isLoading || isRegistering}
							onClick={handleRegisterDevice}
						>
							{isRegistering ? '🔐 Registering with WebAuthn...' : isLoading ? '🔄 Registering...' : 'Register FIDO2 Device'}
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
						{credentialId && (
							<p style={{ marginTop: '12px', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
								<strong>Credential ID:</strong> {credentialId.substring(0, 40)}...
							</p>
						)}
					</div>
				)}
			</div>
		);
	};

	// Step 2: FIDO2 Device Ready (skip OTP sending - uses WebAuthn)
	const createRenderStep2 = () => {
		return (props: MFAFlowBaseRenderProps) => {
			const { mfaState, credentials } = props;
			const navigate = useNavigate();

			return (
				<div className="step-content">
					<h2>
						FIDO2 Device Ready
						<MFAInfoButtonV8 contentKey="factor.fido2" displayMode="modal" />
					</h2>
					<p>Your security key is set up and ready to use</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Status:</strong> {mfaState.deviceStatus || 'Ready'}
						</p>
					</div>

					{mfaState.authenticationId && (
						<div
							style={{
								marginBottom: '16px',
								padding: '14px 16px',
								background: '#f0f9ff',
								border: '1px solid #bae6fd',
								borderRadius: '10px',
								display: 'flex',
								flexDirection: 'column',
								gap: '8px',
							}}
						>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
								<div>
									<p style={{ margin: 0, fontSize: '14px', color: '#0c4a6e', fontWeight: 600 }}>Device Authentication ID</p>
									<p style={{ margin: '2px 0 0', fontFamily: 'monospace', color: '#1f2937' }}>{mfaState.authenticationId}</p>
								</div>
								<button
									type="button"
									onClick={() => {
										const params = new URLSearchParams({
											environmentId: credentials.environmentId?.trim() || '',
											authenticationId: mfaState.authenticationId!,
										});

										if (credentials.deviceAuthenticationPolicyId?.trim()) {
											params.set('policyId', credentials.deviceAuthenticationPolicyId.trim());
										}

										if (credentials.username?.trim()) {
											params.set('username', credentials.username.trim());
										}

										if (mfaState.deviceId) {
											params.set('deviceId', mfaState.deviceId);
										}

										navigate(`/v8/mfa/device-authentication-details?${params.toString()}`, {
											state: { autoFetch: true },
										});
									}}
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '6px',
										padding: '8px 12px',
										borderRadius: '8px',
										border: '1px solid #3b82f6',
										background: '#ffffff',
										color: '#1d4ed8',
										fontWeight: 600,
										cursor: 'pointer',
									}}
								>
									<FiShield />
									View Session Details
								</button>
							</div>
							<p style={{ margin: 0, fontSize: '13px', color: '#0c4a6e' }}>
								Dig into the PingOne device authentication record if you need to confirm WebAuthn registration status.
							</p>
						</div>
					)}

					<div className="success-box" style={{ marginTop: '20px' }}>
						<h3>✅ Setup Complete</h3>
						<p>Your FIDO2 device has been registered successfully.</p>
						<p style={{ marginTop: '12px', fontSize: '14px' }}>
							This device can now be used for MFA authentication. When authenticating, you'll be prompted to use your security key, Touch ID, Face ID, or Windows Hello.
						</p>
						<p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
							💡 <strong>Tip:</strong> FIDO2 authentication uses WebAuthn, which provides strong security without requiring codes.
						</p>
					</div>
				</div>
			);
		};
	};

	// Step 3: Success screen (FIDO2 doesn't need OTP validation)
	const createRenderStep3 = () => {
		return (props: MFAFlowBaseRenderProps) => {
			const { mfaState } = props;

			return (
				<div className="step-content">
					<h2>MFA Registration Complete</h2>
					<p>Your FIDO2 device has been successfully registered</p>

					<div className="success-box">
						<h3>✅ Registration Successful</h3>
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						{mfaState.nickname && (
							<p>
								<strong>Nickname:</strong> {mfaState.nickname}
							</p>
						)}
						<p>
							<strong>Device Type:</strong> FIDO2 (Security Key / Passkey)
						</p>
						<p>
							<strong>Status:</strong> {mfaState.deviceStatus || 'Active'}
						</p>
						{credentialId && (
							<p style={{ marginTop: '12px', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
								<strong>Credential ID:</strong> {credentialId.substring(0, 40)}...
							</p>
						)}
					</div>

					<div className="info-box">
						<h4>What's Next?</h4>
						<ul>
							<li>This device can now be used for MFA challenges</li>
							<li>Users will be prompted to use their security key, Touch ID, Face ID, or Windows Hello during authentication</li>
							<li>You can test MFA in your authentication flows</li>
						</ul>
					</div>
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
				deviceType="FIDO2"
				renderStep0={renderStep0}
				renderStep1={renderStep1WithSelection}
				renderStep2={createRenderStep2()}
				renderStep3={createRenderStep3()}
				validateStep0={validateStep0}
				stepLabels={['Configure', 'Select/Register Device', 'Device Ready', 'Complete']}
			/>
			<SuperSimpleApiDisplayV8 />
		</>
	);
};

// Main FIDO2 Flow Component
export const FIDO2FlowV8: React.FC = () => {
	return <FIDO2FlowV8WithDeviceSelection />;
};

