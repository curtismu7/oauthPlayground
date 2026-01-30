/**
 * @file DeviceComponentRegistry.tsx
 * @module v8/flows/unified/components
 * @description Registry of device-specific custom components for complex flows
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Handle the 20% of device flows that are too complex for dynamic forms.
 * TOTP needs QR code display, FIDO2 needs WebAuthn, Mobile needs app pairing.
 *
 * Architecture:
 * - Each component receives standard props (credentials, mfaState, callbacks)
 * - Components manage their own device-specific UI
 * - Registry maps device types to components (null = use DynamicFormRenderer)
 *
 * @example
 * const CustomComponent = DeviceComponentRegistry[deviceType];
 * if (CustomComponent) {
 *   return <CustomComponent {...props} />;
 * } else {
 *   return <DynamicFormRenderer {...props} />;
 * }
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { DeviceConfigKey, DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import type { MFAFlowController } from '@/v8/flows/controllers/MFAFlowController';
import type { MFACredentials, MFAState } from '@/v8/flows/shared/MFATypes';

const MODULE_TAG = '[🎨 DEVICE-COMPONENT-REGISTRY]';

// ============================================================================
// SHARED PROPS INTERFACE
// ============================================================================

/**
 * Props passed to device-specific custom components
 */
export interface DeviceComponentProps {
	/** MFA credentials */
	credentials: MFACredentials;

	/** MFA state (contains device-specific data like QR codes) */
	mfaState: MFAState;

	/** Update MFA state */
	setMfaState: (state: MFAState | ((prev: MFAState) => MFAState)) => void;

	/** Success callback */
	onSuccess: (data: Record<string, unknown>) => void;

	/** Error callback */
	onError: (error: string) => void;

	/** Device controller */
	controller: MFAFlowController;

	/** Device configuration */
	config: DeviceFlowConfig;
}

// ============================================================================
// TOTP REGISTRATION COMPONENT
// ============================================================================

/**
 * TOTP Registration Component
 *
 * Displays QR code and secret key for authenticator app setup.
 * Used for Google Authenticator, Authy, Microsoft Authenticator, etc.
 */
export const TOTPRegistrationComponent: React.FC<DeviceComponentProps> = ({
	mfaState,
	config,
	onSuccess,
	onError,
}) => {
	console.log(`${MODULE_TAG} Rendering TOTP registration component`, {
		hasQRCode: !!mfaState.qrCodeUrl,
		hasSecret: !!mfaState.totpSecret,
	});

	const [showSecret, setShowSecret] = useState(false);
	const [copied, setCopied] = useState(false);

	// Handle copy secret to clipboard
	const handleCopySecret = useCallback(() => {
		if (mfaState.totpSecret) {
			navigator.clipboard
				.writeText(mfaState.totpSecret)
				.then(() => {
					console.log(`${MODULE_TAG} Secret copied to clipboard`);
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				})
				.catch((err) => {
					console.error(`${MODULE_TAG} Failed to copy secret:`, err);
					onError('Failed to copy secret to clipboard');
				});
		}
	}, [mfaState.totpSecret, onError]);

	return (
		<div className="totp-registration-component">
			{/* Header */}
			<div className="totp-header">
				<h3>{config.icon} Set Up Authenticator App</h3>
				<p className="totp-description">
					Scan the QR code below with your authenticator app, or enter the secret key manually.
				</p>
			</div>

			{/* QR Code Display */}
			{mfaState.qrCodeUrl && (
				<div className="qr-code-section">
					<div className="qr-code-container">
						<img src={mfaState.qrCodeUrl} alt="TOTP QR Code" className="qr-code-image" />
					</div>
					<p className="qr-instruction">Scan this QR code with your authenticator app</p>
				</div>
			)}

			{/* Manual Entry Section */}
			{mfaState.totpSecret && (
				<div className="manual-entry-section">
					<button
						type="button"
						onClick={() => setShowSecret(!showSecret)}
						className="toggle-secret-button"
					>
						{showSecret ? 'Hide' : 'Show'} Manual Entry Key
					</button>

					{showSecret && (
						<div className="secret-display">
							<label htmlFor="totp-secret">Secret Key:</label>
							<div className="secret-input-group">
								<input
									id="totp-secret"
									type="text"
									value={mfaState.totpSecret}
									readOnly
									className="secret-input"
									onClick={(e) => e.currentTarget.select()}
								/>
								<button
									type="button"
									onClick={handleCopySecret}
									className="copy-button"
									aria-label="Copy secret to clipboard"
								>
									{copied ? '✓ Copied' : '📋 Copy'}
								</button>
							</div>
							<p className="secret-hint">
								Enter this key manually in your authenticator app if you can't scan the QR code.
							</p>
						</div>
					)}
				</div>
			)}

			{/* Supported Apps */}
			<details className="supported-apps">
				<summary>Supported Authenticator Apps</summary>
				<ul>
					<li>Google Authenticator</li>
					<li>Microsoft Authenticator</li>
					<li>Authy</li>
					<li>1Password</li>
					<li>LastPass Authenticator</li>
					<li>Any TOTP-compatible app</li>
				</ul>
			</details>

			{/* Educational Content */}
			{config.educationalContent && (
				<details className="totp-education">
					<summary>Learn more about TOTP</summary>
					<div
						className="education-content"
						dangerouslySetInnerHTML={{ __html: config.educationalContent }}
					/>
				</details>
			)}

			{/* No QR Code Warning */}
			{!mfaState.qrCodeUrl && !mfaState.totpSecret && (
				<div className="no-data-warning">
					<p>⚠️ QR code and secret not available yet.</p>
					<p>Please complete device registration first.</p>
				</div>
			)}
		</div>
	);
};

// ============================================================================
// FIDO2 REGISTRATION COMPONENT
// ============================================================================

/**
 * FIDO2 Registration Component
 *
 * Triggers WebAuthn credential registration for security keys and biometrics.
 * Used for YubiKey, Windows Hello, Touch ID, Face ID, etc.
 */
export const FIDO2RegistrationComponent: React.FC<DeviceComponentProps> = ({
	credentials,
	mfaState,
	setMfaState,
	onSuccess,
	onError,
	controller,
	config,
}) => {
	console.log(`${MODULE_TAG} Rendering FIDO2 registration component`, {
		hasOptions: !!mfaState.publicKeyCredentialCreationOptions,
	});

	const [isRegistering, setIsRegistering] = useState(false);
	const [browserSupported, setBrowserSupported] = useState(true);

	// Check browser support on mount
	useEffect(() => {
		const supported =
			window.PublicKeyCredential !== undefined && navigator.credentials !== undefined;

		console.log(`${MODULE_TAG} WebAuthn support:`, supported);
		setBrowserSupported(supported);

		if (!supported) {
			onError(
				'Your browser does not support FIDO2/WebAuthn. Please use a modern browser like Chrome, Firefox, Safari, or Edge.'
			);
		}
	}, [onError]);

	/**
	 * Handle WebAuthn registration
	 */
	const handleWebAuthnRegistration = useCallback(async () => {
		console.log(`${MODULE_TAG} Starting WebAuthn registration`);
		setIsRegistering(true);

		try {
			// Check if we have credential creation options
			const options = mfaState.publicKeyCredentialCreationOptions;

			if (!options) {
				throw new Error(
					'Missing WebAuthn credential creation options. Please complete device registration first.'
				);
			}

			console.log(`${MODULE_TAG} Creating credential with options:`, options);

			// Call WebAuthn API
			const credential = (await navigator.credentials.create({
				publicKey: options as PublicKeyCredentialCreationOptions,
			})) as PublicKeyCredential | null;

			if (!credential) {
				throw new Error('WebAuthn credential creation cancelled or failed');
			}

			console.log(`${MODULE_TAG} WebAuthn credential created:`, credential);

			// Update state with credential
			setMfaState((prev) => ({
				...prev,
				webAuthnCredential: credential,
			}));

			// Call success callback
			onSuccess({
				credential,
				credentialId: credential.id,
			});
		} catch (error: unknown) {
			console.error(`${MODULE_TAG} WebAuthn registration failed:`, error);

			// Handle common errors
			let errorMessage = 'Biometric registration failed';

			if (error instanceof Error) {
				if (error.name === 'NotAllowedError') {
					errorMessage = 'Registration was cancelled or timed out';
				} else if (error.name === 'InvalidStateError') {
					errorMessage = 'This authenticator has already been registered';
				} else if (error.name === 'NotSupportedError') {
					errorMessage = 'This device does not support biometric authentication';
				} else if (error.name === 'SecurityError') {
					errorMessage = 'Registration failed due to security constraints';
				} else {
					errorMessage = error.message;
				}
			}

			onError(errorMessage);
		} finally {
			setIsRegistering(false);
		}
	}, [mfaState, setMfaState, onSuccess, onError]);

	return (
		<div className="fido2-registration-component">
			{/* Header */}
			<div className="fido2-header">
				<h3>{config.icon} Register Security Key or Biometric</h3>
				<p className="fido2-description">
					Use a hardware security key or your device's biometric authentication (fingerprint, facial
					recognition).
				</p>
			</div>

			{/* Browser Support Check */}
			{!browserSupported && (
				<div className="browser-not-supported">
					<p>❌ Your browser does not support FIDO2/WebAuthn</p>
					<p>Please use Chrome, Firefox, Safari, or Edge</p>
				</div>
			)}

			{/* Registration Button */}
			{browserSupported && (
				<div className="fido2-registration-section">
					<button
						type="button"
						onClick={handleWebAuthnRegistration}
						disabled={isRegistering || !mfaState.publicKeyCredentialCreationOptions}
						className="webauthn-register-button"
					>
						{isRegistering ? 'Registering...' : '🔐 Register FIDO2 Device'}
					</button>

					{isRegistering && (
						<p className="registration-hint">
							Follow the prompts from your browser to use your security key or biometric...
						</p>
					)}

					{!mfaState.publicKeyCredentialCreationOptions && (
						<p className="no-options-warning">
							⚠️ WebAuthn options not available yet. Complete device registration first.
						</p>
					)}
				</div>
			)}

			{/* Supported Authenticators */}
			<details className="supported-authenticators">
				<summary>Supported Authenticators</summary>
				<div className="authenticator-lists">
					<div>
						<h4>Hardware Security Keys</h4>
						<ul>
							<li>YubiKey (5 Series, Security Key)</li>
							<li>Google Titan Security Key</li>
							<li>Feitian ePass FIDO2</li>
							<li>Thetis FIDO2 Security Key</li>
						</ul>
					</div>
					<div>
						<h4>Platform Authenticators</h4>
						<ul>
							<li>Windows Hello (fingerprint, facial recognition)</li>
							<li>Touch ID (MacBook, iMac)</li>
							<li>Face ID (iPhone, iPad)</li>
							<li>Android Biometrics</li>
						</ul>
					</div>
				</div>
			</details>

			{/* Educational Content */}
			{config.educationalContent && (
				<details className="fido2-education">
					<summary>Learn more about FIDO2</summary>
					<div
						className="education-content"
						dangerouslySetInnerHTML={{ __html: config.educationalContent }}
					/>
				</details>
			)}
		</div>
	);
};

// ============================================================================
// MOBILE REGISTRATION COMPONENT
// ============================================================================

/**
 * Mobile Registration Component
 *
 * Displays QR code for PingOne Mobile app pairing.
 * Used for mobile push notifications.
 */
export const MobileRegistrationComponent: React.FC<DeviceComponentProps> = ({
	mfaState,
	config,
}) => {
	console.log(`${MODULE_TAG} Rendering Mobile registration component`, {
		hasQRCode: !!mfaState.qrCodeUrl,
		hasPairingKey: !!mfaState.pairingKey,
	});

	const [copied, setCopied] = useState(false);

	// Handle copy pairing key to clipboard
	const handleCopyPairingKey = useCallback(() => {
		if (mfaState.pairingKey) {
			navigator.clipboard
				.writeText(mfaState.pairingKey)
				.then(() => {
					console.log(`${MODULE_TAG} Pairing key copied to clipboard`);
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				})
				.catch((err) => {
					console.error(`${MODULE_TAG} Failed to copy pairing key:`, err);
				});
		}
	}, [mfaState.pairingKey]);

	return (
		<div className="mobile-registration-component">
			{/* Header */}
			<div className="mobile-header">
				<h3>{config.icon} Pair PingOne Mobile App</h3>
				<p className="mobile-description">
					Scan the QR code below with the PingOne Mobile app to pair your device.
				</p>
			</div>

			{/* QR Code Display */}
			{mfaState.qrCodeUrl && (
				<div className="pairing-qr-section">
					<div className="pairing-qr-container">
						<img
							src={mfaState.qrCodeUrl}
							alt="Mobile Pairing QR Code"
							className="pairing-qr-image"
						/>
					</div>
					<p className="qr-instruction">Open PingOne Mobile app and scan this QR code</p>
				</div>
			)}

			{/* Manual Pairing Key */}
			{mfaState.pairingKey && (
				<div className="pairing-key-section">
					<h4>Manual Pairing</h4>
					<p>If you can't scan the QR code, enter this pairing key manually:</p>

					<div className="pairing-key-display">
						<input
							type="text"
							value={mfaState.pairingKey}
							readOnly
							className="pairing-key-input"
							onClick={(e) => e.currentTarget.select()}
						/>
						<button
							type="button"
							onClick={handleCopyPairingKey}
							className="copy-button"
							aria-label="Copy pairing key to clipboard"
						>
							{copied ? '✓ Copied' : '📋 Copy'}
						</button>
					</div>
				</div>
			)}

			{/* App Download Instructions */}
			<div className="app-download-section">
				<h4>Don't have the app?</h4>
				<p>Download PingOne Mobile from your app store:</p>
				<div className="app-store-buttons">
					<a
						href="https://apps.apple.com/app/pingone/id1063305932"
						target="_blank"
						rel="noopener noreferrer"
						className="app-store-link"
					>
						📱 Download for iOS
					</a>
					<a
						href="https://play.google.com/store/apps/details?id=com.pingidentity.pingone"
						target="_blank"
						rel="noopener noreferrer"
						className="app-store-link"
					>
						🤖 Download for Android
					</a>
				</div>
			</div>

			{/* Educational Content */}
			{config.educationalContent && (
				<details className="mobile-education">
					<summary>Learn more about Mobile Push</summary>
					<div
						className="education-content"
						dangerouslySetInnerHTML={{ __html: config.educationalContent }}
					/>
				</details>
			)}

			{/* No QR Code Warning */}
			{!mfaState.qrCodeUrl && !mfaState.pairingKey && (
				<div className="no-data-warning">
					<p>⚠️ Pairing QR code and key not available yet.</p>
					<p>Please complete device registration first.</p>
				</div>
			)}
		</div>
	);
};

// ============================================================================
// DEVICE COMPONENT REGISTRY
// ============================================================================

/**
 * Device Component Registry
 *
 * Maps device types to custom components.
 * - null = use DynamicFormRenderer (SMS, Email, WhatsApp)
 * - Component = use custom component (TOTP, FIDO2, Mobile)
 */
export const DeviceComponentRegistry: Record<
	DeviceConfigKey,
	React.FC<DeviceComponentProps> | null
> = {
	SMS: null, // Use DynamicFormRenderer
	EMAIL: null, // Use DynamicFormRenderer
	WHATSAPP: null, // Use DynamicFormRenderer
	TOTP: TOTPRegistrationComponent,
	FIDO2: FIDO2RegistrationComponent,
	MOBILE: MobileRegistrationComponent,
};

// ============================================================================
// EXPORTS
// ============================================================================

export default DeviceComponentRegistry;
