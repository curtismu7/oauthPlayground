/**
 * @file IntegratedMFASample.tsx
 * @module samples/p1mfa
 * @description Integrated MFA Sample - Complete OIDC sign-in + MFA enrollment + authentication flow
 * @version 1.0.0
 *
 * This sample demonstrates the complete flow:
 * 1. OIDC sign-in (Auth Code + PKCE)
 * 2. MFA enrollment (SMS or FIDO2)
 * 3. MFA authentication/step-up
 */

import React, { useState } from 'react';
import { type Device, FIDO2Helper, type P1MFAConfig, P1MFASDK, SMSHelper } from '@/sdk/p1mfa';
import { CredentialsForm } from './shared/CredentialsForm';
import { DeviceList } from './shared/DeviceList';
import { StatusDisplay } from './shared/StatusDisplay';

type Tab =
	| 'config'
	| 'oidc-signin'
	| 'enroll-sms'
	| 'enroll-fido2'
	| 'auth-sms'
	| 'auth-fido2'
	| 'devices';

interface UserContext {
	userId?: string;
	username?: string;
	accessToken?: string;
	idToken?: string;
	refreshToken?: string;
}

export const IntegratedMFASample: React.FC = () => {
	const [sdk, setSdk] = useState<P1MFASDK | null>(null);
	const [config, setConfig] = useState<P1MFAConfig | null>(null);
	const [activeTab, setActiveTab] = useState<Tab>('config');
	const [userContext, setUserContext] = useState<UserContext>({});
	const [devices, setDevices] = useState<Device[]>([]);
	const [loadingDevices, setLoadingDevices] = useState(false);

	// OIDC Sign-in state
	const [oidcConfig, setOidcConfig] = useState({
		clientId: '',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'openid profile email',
		policyId: '',
	});

	// SMS Enrollment state
	const [smsEnrollState, setSmsEnrollState] = useState({
		phone: '',
		deviceId: '',
		otp: '',
		step: 'input' as 'input' | 'created' | 'activating' | 'success',
	});

	// FIDO2 Enrollment state
	const [fido2EnrollState, setFido2EnrollState] = useState({
		deviceId: '',
		creationOptions: null as PublicKeyCredentialCreationOptions | null,
		step: 'input' as 'input' | 'created' | 'webauthn' | 'activating' | 'success',
	});

	// SMS Auth state
	const [smsAuthState, setSmsAuthState] = useState({
		authenticationId: '',
		otp: '',
		step: 'input' as 'input' | 'initialized' | 'verifying' | 'success',
	});

	// FIDO2 Auth state
	const [fido2AuthState, setFido2AuthState] = useState({
		authenticationId: '',
		challengeId: '',
		assertionOptions: null as PublicKeyCredentialRequestOptions | null,
		step: 'input' as 'input' | 'initialized' | 'webauthn' | 'completing' | 'success',
	});

	const handleInitialize = async (sdkConfig: P1MFAConfig) => {
		try {
			const newSdk = new P1MFASDK();
			await newSdk.initialize(sdkConfig);
			setSdk(newSdk);
			setConfig(sdkConfig);
			setActiveTab('oidc-signin');
		} catch (error) {
			console.error('Failed to initialize SDK:', error);
		}
	};

	const handleOIDCSignIn = async () => {
		// Step 1: Build authorization URL with PKCE
		const codeVerifier = generateCodeVerifier();
		const codeChallenge = await generateCodeChallenge(codeVerifier);
		const state = randomString(32);

		// Store PKCE values
		sessionStorage.setItem('p1mfa_code_verifier', codeVerifier);
		sessionStorage.setItem('p1mfa_state', state);

		// Build authorization URL
		const authUrl = new URL(`https://auth.pingone.com/${config?.environmentId}/as/authorize`);
		authUrl.searchParams.set('client_id', oidcConfig.clientId);
		authUrl.searchParams.set('response_type', 'code');
		authUrl.searchParams.set('redirect_uri', oidcConfig.redirectUri);
		authUrl.searchParams.set('scope', oidcConfig.scope);
		authUrl.searchParams.set('code_challenge', codeChallenge);
		authUrl.searchParams.set('code_challenge_method', 'S256');
		authUrl.searchParams.set('state', state);

		// Redirect to authorization endpoint
		window.location.href = authUrl.toString();
	};

	const handleEnrollSMS = async () => {
		if (!sdk || !userContext.userId || !smsEnrollState.phone) return;

		try {
			// Step 1: Create SMS device
			const result = await SMSHelper.registerSMSDevice(sdk, {
				userId: userContext.userId,
				type: 'SMS',
				phone: smsEnrollState.phone,
				status: 'ACTIVATION_REQUIRED',
			});

			setSmsEnrollState((prev) => ({
				...prev,
				deviceId: result.deviceId,
				step: 'created',
			}));

			// Step 2: Send OTP
			await SMSHelper.sendOTP(sdk, userContext.userId, result.deviceId);
		} catch (error) {
			console.error('Failed to enroll SMS device:', error);
		}
	};

	const handleActivateSMS = async () => {
		if (!sdk || !userContext.userId || !smsEnrollState.deviceId || !smsEnrollState.otp) return;

		try {
			await SMSHelper.activateSMSDevice(sdk, {
				userId: userContext.userId,
				deviceId: smsEnrollState.deviceId,
				otp: smsEnrollState.otp,
			});

			setSmsEnrollState((prev) => ({ ...prev, step: 'success' }));
			await loadDevices();
		} catch (error) {
			console.error('Failed to activate SMS device:', error);
		}
	};

	const handleEnrollFIDO2 = async () => {
		if (!sdk || !userContext.userId || !oidcConfig.policyId) return;

		try {
			// Step 1: Create FIDO2 device
			const result = await FIDO2Helper.registerFIDO2Device(sdk, {
				userId: userContext.userId,
				type: 'FIDO2',
				policy: oidcConfig.policyId,
			});

			// Parse creation options
			let creationOptions: PublicKeyCredentialCreationOptions;
			if (typeof result.publicKeyCredentialCreationOptions === 'string') {
				creationOptions = JSON.parse(result.publicKeyCredentialCreationOptions);
			} else {
				creationOptions = result.publicKeyCredentialCreationOptions!;
			}

			// Convert byte arrays
			const toUint8Array = (arr: number[]): Uint8Array => new Uint8Array(arr);
			if (Array.isArray(creationOptions.challenge)) {
				creationOptions.challenge = toUint8Array(creationOptions.challenge) as BufferSource;
			}
			if (creationOptions.user && Array.isArray(creationOptions.user.id)) {
				creationOptions.user.id = toUint8Array(creationOptions.user.id) as BufferSource;
			}

			setFido2EnrollState((prev) => ({
				...prev,
				deviceId: result.deviceId,
				creationOptions,
				step: 'webauthn',
			}));
		} catch (error) {
			console.error('Failed to enroll FIDO2 device:', error);
		}
	};

	const handleWebAuthnRegistration = async () => {
		if (!fido2EnrollState.creationOptions || !sdk || !userContext.userId) return;

		try {
			// Step 2: Create WebAuthn credential
			const credential = await FIDO2Helper.createWebAuthnCredential(
				fido2EnrollState.creationOptions
			);

			setFido2EnrollState((prev) => ({ ...prev, step: 'activating' }));

			// Step 3: Activate device
			await FIDO2Helper.activateFIDO2Device(sdk, {
				userId: userContext.userId,
				deviceId: fido2EnrollState.deviceId,
				fido2Credential: credential,
			});

			setFido2EnrollState((prev) => ({ ...prev, step: 'success' }));
			await loadDevices();
		} catch (error) {
			console.error('Failed to complete FIDO2 registration:', error);
		}
	};

	const handleAuthSMS = async () => {
		if (!sdk || !userContext.userId || !oidcConfig.policyId) return;

		try {
			// Initialize device authentication
			const result = await sdk.initializeAuthentication({
				userId: userContext.userId,
				deviceAuthenticationPolicyId: oidcConfig.policyId,
			});

			setSmsAuthState((prev) => ({
				...prev,
				authenticationId: result.authenticationId,
				step: 'initialized',
			}));
		} catch (error) {
			console.error('Failed to initialize SMS authentication:', error);
		}
	};

	const handleCompleteSMSAuth = async () => {
		if (!sdk || !smsAuthState.authenticationId || !smsAuthState.otp) return;

		try {
			const result = await sdk.completeAuthentication({
				authenticationId: smsAuthState.authenticationId,
				otp: smsAuthState.otp,
			});

			setSmsAuthState((prev) => ({ ...prev, step: 'success' }));
		} catch (error) {
			console.error('Failed to complete SMS authentication:', error);
		}
	};

	const handleAuthFIDO2 = async () => {
		if (!sdk || !userContext.userId || !oidcConfig.policyId) return;

		try {
			// Initialize device authentication
			const result = await sdk.initializeAuthentication({
				userId: userContext.userId,
				deviceAuthenticationPolicyId: oidcConfig.policyId,
			});

			// For FIDO2, we need to get assertion options from the authentication response
			// This would typically come from the _links in the response
			// For this sample, we'll construct basic options
			const assertionOptions: PublicKeyCredentialRequestOptions = {
				challenge: new Uint8Array(32), // In real app, get from auth response
				timeout: 60000,
				rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
			};

			setFido2AuthState((prev) => ({
				...prev,
				authenticationId: result.authenticationId,
				assertionOptions,
				step: 'webauthn',
			}));
		} catch (error) {
			console.error('Failed to initialize FIDO2 authentication:', error);
		}
	};

	const handleWebAuthnAssertion = async () => {
		if (!fido2AuthState.assertionOptions || !sdk || !fido2AuthState.authenticationId) return;

		try {
			// Get WebAuthn assertion
			const assertion = await FIDO2Helper.getWebAuthnAssertion(fido2AuthState.assertionOptions);

			setFido2AuthState((prev) => ({ ...prev, step: 'completing' }));

			// Complete authentication
			const result = await sdk.completeAuthentication({
				authenticationId: fido2AuthState.authenticationId,
				fido2Assertion: assertion,
			});

			setFido2AuthState((prev) => ({ ...prev, step: 'success' }));
		} catch (error) {
			console.error('Failed to complete FIDO2 authentication:', error);
		}
	};

	const loadDevices = async () => {
		if (!sdk || !userContext.userId) return;

		setLoadingDevices(true);
		try {
			const deviceList = await sdk.listDevices(userContext.userId);
			setDevices(deviceList);
		} catch (error) {
			console.error('Failed to load devices:', error);
		} finally {
			setLoadingDevices(false);
		}
	};

	// Helper functions
	const generateCodeVerifier = (): string => {
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		const base64 = btoa(String.fromCharCode.apply(null, Array.from(array)));
		return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	};

	const generateCodeChallenge = async (verifier: string): Promise<string> => {
		const encoder = new TextEncoder();
		const data = encoder.encode(verifier);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = new Uint8Array(hashBuffer);
		const base64 = btoa(String.fromCharCode.apply(null, Array.from(hashArray)));
		return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	};

	const randomString = (length: number): string => {
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
	};

	return (
		<div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
			<h1 style={{ marginBottom: '2rem' }}>P1MFA SDK - Integrated Sample</h1>
			<p style={{ marginBottom: '2rem', color: '#6c757d' }}>
				Complete flow: OIDC Sign-in → MFA Enrollment → MFA Authentication
			</p>

			{/* Tabs */}
			<div
				style={{
					display: 'flex',
					gap: '0.5rem',
					marginBottom: '2rem',
					borderBottom: '2px solid #ddd',
					flexWrap: 'wrap',
				}}
			>
				{[
					{ id: 'config', label: 'Environment Config' },
					{ id: 'oidc-signin', label: 'OIDC Sign-in' },
					{ id: 'enroll-sms', label: 'Enroll SMS' },
					{ id: 'enroll-fido2', label: 'Enroll FIDO2' },
					{ id: 'auth-sms', label: 'Authenticate (SMS)' },
					{ id: 'auth-fido2', label: 'Authenticate (FIDO2)' },
					{ id: 'devices', label: 'Devices' },
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => {
							setActiveTab(tab.id as Tab);
							if (tab.id === 'devices' && sdk && userContext.userId) {
								loadDevices();
							}
						}}
						disabled={!sdk && tab.id !== 'config'}
						style={{
							padding: '0.75rem 1.5rem',
							border: 'none',
							backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
							color: activeTab === tab.id ? 'white' : '#007bff',
							cursor: sdk || tab.id === 'config' ? 'pointer' : 'not-allowed',
							opacity: sdk || tab.id === 'config' ? 1 : 0.5,
							borderBottom: activeTab === tab.id ? '3px solid #007bff' : 'none',
							whiteSpace: 'nowrap',
						}}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Content */}
			{activeTab === 'config' && (
				<div>
					<h2>Step 1: Environment Configuration</h2>
					<CredentialsForm onSubmit={handleInitialize} />
					<div style={{ marginTop: '2rem' }}>
						<h3>OIDC Application Configuration</h3>
						<div style={{ marginBottom: '1rem' }}>
							<label htmlFor="clientId" style={{ display: 'block', marginBottom: '0.5rem' }}>
								Client ID *
							</label>
							<input
								id="clientId"
								type="text"
								value={oidcConfig.clientId}
								onChange={(e) => setOidcConfig((prev) => ({ ...prev, clientId: e.target.value }))}
								style={{
									width: '100%',
									maxWidth: '400px',
									padding: '0.5rem',
									border: '1px solid #ccc',
									borderRadius: '4px',
								}}
							/>
						</div>
						<div style={{ marginBottom: '1rem' }}>
							<label htmlFor="policyId" style={{ display: 'block', marginBottom: '0.5rem' }}>
								Device Authentication Policy ID *
							</label>
							<input
								id="policyId"
								type="text"
								value={oidcConfig.policyId}
								onChange={(e) => setOidcConfig((prev) => ({ ...prev, policyId: e.target.value }))}
								style={{
									width: '100%',
									maxWidth: '400px',
									padding: '0.5rem',
									border: '1px solid #ccc',
									borderRadius: '4px',
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{activeTab === 'oidc-signin' && sdk && (
				<div>
					<h2>Step 2: OIDC Sign-in (Auth Code + PKCE)</h2>
					<p style={{ marginBottom: '1rem', color: '#6c757d' }}>
						Start the OIDC authorization flow. After successful sign-in, you'll be redirected back
						with tokens.
					</p>
					<button
						onClick={handleOIDCSignIn}
						disabled={!oidcConfig.clientId}
						style={{
							padding: '0.75rem 1.5rem',
							backgroundColor: '#007bff',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: oidcConfig.clientId ? 'pointer' : 'not-allowed',
							opacity: oidcConfig.clientId ? 1 : 0.5,
						}}
					>
						Start OIDC Sign-in
					</button>
					{userContext.userId && (
						<div
							style={{
								marginTop: '1rem',
								padding: '1rem',
								backgroundColor: '#d4edda',
								borderRadius: '4px',
							}}
						>
							<p>
								<strong>Signed in as:</strong> {userContext.userId}
							</p>
						</div>
					)}
				</div>
			)}

			{activeTab === 'enroll-sms' && sdk && userContext.userId && (
				<div>
					<h2>Step 3: Enroll SMS Device</h2>
					{smsEnrollState.step === 'input' && (
						<div>
							<div style={{ marginBottom: '1rem' }}>
								<label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem' }}>
									Phone Number * (e.g., +1234567890)
								</label>
								<input
									id="phone"
									type="tel"
									value={smsEnrollState.phone}
									onChange={(e) =>
										setSmsEnrollState((prev) => ({ ...prev, phone: e.target.value }))
									}
									style={{
										width: '100%',
										maxWidth: '400px',
										padding: '0.5rem',
										border: '1px solid #ccc',
										borderRadius: '4px',
									}}
								/>
							</div>
							<button
								onClick={handleEnrollSMS}
								disabled={!smsEnrollState.phone}
								style={{
									padding: '0.75rem 1.5rem',
									backgroundColor: '#007bff',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: smsEnrollState.phone ? 'pointer' : 'not-allowed',
									opacity: smsEnrollState.phone ? 1 : 0.5,
								}}
							>
								Register SMS Device
							</button>
						</div>
					)}
					{smsEnrollState.step === 'created' && (
						<div>
							<p style={{ marginBottom: '1rem' }}>
								Device created! OTP sent. Please enter the code:
							</p>
							<div style={{ marginBottom: '1rem' }}>
								<label htmlFor="otp" style={{ display: 'block', marginBottom: '0.5rem' }}>
									OTP Code *
								</label>
								<input
									id="otp"
									type="text"
									value={smsEnrollState.otp}
									onChange={(e) => setSmsEnrollState((prev) => ({ ...prev, otp: e.target.value }))}
									maxLength={6}
									style={{
										width: '100%',
										maxWidth: '200px',
										padding: '0.5rem',
										border: '1px solid #ccc',
										borderRadius: '4px',
										fontSize: '1.25rem',
										textAlign: 'center',
										letterSpacing: '0.5rem',
									}}
								/>
							</div>
							<button
								onClick={handleActivateSMS}
								disabled={!smsEnrollState.otp || smsEnrollState.otp.length < 6}
								style={{
									padding: '0.75rem 1.5rem',
									backgroundColor: '#28a745',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor:
										smsEnrollState.otp && smsEnrollState.otp.length >= 6
											? 'pointer'
											: 'not-allowed',
									opacity: smsEnrollState.otp && smsEnrollState.otp.length >= 6 ? 1 : 0.5,
								}}
							>
								Activate Device
							</button>
						</div>
					)}
					{smsEnrollState.step === 'success' && (
						<div style={{ padding: '1rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
							<p>
								<strong>Success!</strong> SMS device enrolled and activated.
							</p>
						</div>
					)}
				</div>
			)}

			{activeTab === 'enroll-fido2' && sdk && userContext.userId && (
				<div>
					<h2>Step 3: Enroll FIDO2 Device</h2>
					{fido2EnrollState.step === 'input' && (
						<div>
							<button
								onClick={handleEnrollFIDO2}
								disabled={!oidcConfig.policyId}
								style={{
									padding: '0.75rem 1.5rem',
									backgroundColor: '#007bff',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: oidcConfig.policyId ? 'pointer' : 'not-allowed',
									opacity: oidcConfig.policyId ? 1 : 0.5,
								}}
							>
								Register FIDO2 Device
							</button>
						</div>
					)}
					{fido2EnrollState.step === 'webauthn' && (
						<div>
							<p style={{ marginBottom: '1rem' }}>
								Device created! Click below to create WebAuthn credential:
							</p>
							<button
								onClick={handleWebAuthnRegistration}
								style={{
									padding: '0.75rem 1.5rem',
									backgroundColor: '#28a745',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: 'pointer',
								}}
							>
								Create WebAuthn Credential
							</button>
						</div>
					)}
					{fido2EnrollState.step === 'success' && (
						<div style={{ padding: '1rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
							<p>
								<strong>Success!</strong> FIDO2 device enrolled and activated.
							</p>
						</div>
					)}
				</div>
			)}

			{activeTab === 'auth-sms' && sdk && userContext.userId && (
				<div>
					<h2>Step 4: Authenticate with SMS OTP</h2>
					{smsAuthState.step === 'input' && (
						<div>
							<button
								onClick={handleAuthSMS}
								disabled={!oidcConfig.policyId}
								style={{
									padding: '0.75rem 1.5rem',
									backgroundColor: '#007bff',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: oidcConfig.policyId ? 'pointer' : 'not-allowed',
									opacity: oidcConfig.policyId ? 1 : 0.5,
								}}
							>
								Initialize SMS Authentication
							</button>
						</div>
					)}
					{smsAuthState.step === 'initialized' && (
						<div>
							<p style={{ marginBottom: '1rem' }}>OTP sent! Please enter the code:</p>
							<div style={{ marginBottom: '1rem' }}>
								<label htmlFor="authOtp" style={{ display: 'block', marginBottom: '0.5rem' }}>
									OTP Code *
								</label>
								<input
									id="authOtp"
									type="text"
									value={smsAuthState.otp}
									onChange={(e) => setSmsAuthState((prev) => ({ ...prev, otp: e.target.value }))}
									maxLength={6}
									style={{
										width: '100%',
										maxWidth: '200px',
										padding: '0.5rem',
										border: '1px solid #ccc',
										borderRadius: '4px',
										fontSize: '1.25rem',
										textAlign: 'center',
										letterSpacing: '0.5rem',
									}}
								/>
							</div>
							<button
								onClick={handleCompleteSMSAuth}
								disabled={!smsAuthState.otp || smsAuthState.otp.length < 6}
								style={{
									padding: '0.75rem 1.5rem',
									backgroundColor: '#28a745',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor:
										smsAuthState.otp && smsAuthState.otp.length >= 6 ? 'pointer' : 'not-allowed',
									opacity: smsAuthState.otp && smsAuthState.otp.length >= 6 ? 1 : 0.5,
								}}
							>
								Verify OTP
							</button>
						</div>
					)}
					{smsAuthState.step === 'success' && (
						<div style={{ padding: '1rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
							<p>
								<strong>Success!</strong> SMS authentication completed.
							</p>
						</div>
					)}
				</div>
			)}

			{activeTab === 'auth-fido2' && sdk && userContext.userId && (
				<div>
					<h2>Step 4: Authenticate with FIDO2</h2>
					{fido2AuthState.step === 'input' && (
						<div>
							<button
								onClick={handleAuthFIDO2}
								disabled={!oidcConfig.policyId}
								style={{
									padding: '0.75rem 1.5rem',
									backgroundColor: '#007bff',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: oidcConfig.policyId ? 'pointer' : 'not-allowed',
									opacity: oidcConfig.policyId ? 1 : 0.5,
								}}
							>
								Initialize FIDO2 Authentication
							</button>
						</div>
					)}
					{fido2AuthState.step === 'webauthn' && (
						<div>
							<p style={{ marginBottom: '1rem' }}>Click below to get WebAuthn assertion:</p>
							<button
								onClick={handleWebAuthnAssertion}
								style={{
									padding: '0.75rem 1.5rem',
									backgroundColor: '#28a745',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: 'pointer',
								}}
							>
								Get WebAuthn Assertion
							</button>
						</div>
					)}
					{fido2AuthState.step === 'success' && (
						<div style={{ padding: '1rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
							<p>
								<strong>Success!</strong> FIDO2 authentication completed.
							</p>
						</div>
					)}
				</div>
			)}

			{activeTab === 'devices' && sdk && (
				<div>
					<h2>Registered Devices</h2>
					<div style={{ marginBottom: '1rem' }}>
						<label htmlFor="devicesUserId" style={{ display: 'block', marginBottom: '0.5rem' }}>
							User ID *
						</label>
						<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
							<input
								id="devicesUserId"
								type="text"
								value={userContext.userId || ''}
								onChange={(e) => setUserContext((prev) => ({ ...prev, userId: e.target.value }))}
								placeholder="Enter User ID"
								style={{
									width: '100%',
									maxWidth: '400px',
									padding: '0.5rem',
									border: '1px solid #ccc',
									borderRadius: '4px',
								}}
							/>
							<button
								onClick={loadDevices}
								disabled={!userContext.userId || loadingDevices}
								style={{
									padding: '0.5rem 1rem',
									backgroundColor: '#007bff',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: userContext.userId && !loadingDevices ? 'pointer' : 'not-allowed',
									opacity: userContext.userId && !loadingDevices ? 1 : 0.5,
								}}
							>
								Load Devices
							</button>
						</div>
					</div>
					<DeviceList devices={devices} loading={loadingDevices} />
				</div>
			)}
		</div>
	);
};
