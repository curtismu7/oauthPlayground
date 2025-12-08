/**
 * @file mfaEducationServiceV8.ts
 * @module v8/services
 * @description Educational content service for PingOne MFA Flow
 * @version 8.0.0
 * @since 2024-11-23
 * 
 * Provides educational tooltips, explanations, and "What's this?" content
 * for all MFA-related concepts, fields, and steps.
 */

const MODULE_TAG = '[📚 MFA-EDUCATION-V8]';

export interface MFAEducationContent {
	title: string;
	description: string;
	learnMoreUrl?: string;
	securityLevel?: 'high' | 'medium' | 'low';
	securityNote?: string;
}

/**
 * MFA Education Service V8
 * 
 * Provides educational content for PingOne MFA concepts including:
 * - Factor types (SMS, Email, TOTP, FIDO2/WebAuthn)
 * - Device management
 * - OTP validation
 * - Security best practices
 * - Recovery flows
 */
export class MFAEducationServiceV8 {
	/**
	 * Get educational content for a specific MFA concept
	 * 
	 * @param key - Education content key (e.g., 'factor.sms', 'device.enrollment')
	 * @returns Educational content with title, description, and optional learn more link
	 * 
	 * @example
	 * const content = MFAEducationServiceV8.getContent('factor.sms');
	 * console.log(content.title); // "SMS Authentication"
	 */
	static getContent(key: string): MFAEducationContent {
		const content = MFAEducationServiceV8.educationContent[key];
		
		if (!content) {
			console.warn(`${MODULE_TAG} No education content found for key: ${key}`);
			return {
				title: 'Information',
				description: 'No additional information available.',
			};
		}
		
		// Removed verbose logging - only log warnings for missing content
		// This prevents console spam when components re-render
		return content;
	}

	/**
	 * Education content registry
	 * Organized by category: factor types, device management, OTP, security, etc.
	 */
	private static educationContent: Record<string, MFAEducationContent> = {
		// ===== FACTOR TYPES =====
		'factor.sms': {
			title: 'SMS Authentication',
			description: 'SMS sends a one-time passcode (OTP) to your mobile phone via text message. While convenient, SMS is vulnerable to SIM swapping and interception attacks.',
			securityLevel: 'medium',
			securityNote: 'SMS is less secure than TOTP or FIDO2. Consider upgrading to a more secure factor.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_mfa_sms',
		},
		
		'factor.email': {
			title: 'Email Authentication',
			description: 'Email sends a one-time passcode (OTP) to your email address. Security depends on your email provider\'s security measures.',
			securityLevel: 'medium',
			securityNote: 'Email security depends on your email provider. Enable 2FA on your email account.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_mfa_email',
		},
		
		'factor.whatsapp': {
			title: 'WhatsApp Authentication',
			description: 'WhatsApp sends a one-time passcode (OTP) to your WhatsApp number via WhatsApp messages. Similar to SMS but uses WhatsApp\'s messaging platform. All WhatsApp messages are sent by PingOne using its configured WhatsApp sender.',
			securityLevel: 'medium',
			securityNote: 'WhatsApp MFA is similar to SMS in security level. Consider upgrading to TOTP or FIDO2 for higher security.',
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-whatsapp',
		},
		
		'factor.totp': {
			title: 'TOTP (Time-based One-Time Password)',
			description: 'TOTP uses authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator to generate time-based codes. More secure than SMS because codes are generated locally on your device.',
			securityLevel: 'high',
			securityNote: 'TOTP is phishing-resistant and doesn\'t rely on network connectivity.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_mfa_totp',
		},
		
		'factor.fido2': {
			title: 'FIDO2 / WebAuthn',
			description: 'FIDO2 uses hardware security keys, biometric authenticators, or platform authenticators (Windows Hello, Face ID, Touch ID). The most secure MFA method - phishing-resistant and cryptographically secure.',
			securityLevel: 'high',
			securityNote: 'FIDO2 is the gold standard for MFA security. Highly recommended for sensitive applications.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_mfa_fido2',
		},
		
		// ===== DEVICE MANAGEMENT =====
		'device.enrollment': {
			title: 'Device Enrollment',
			description: 'Enrolling a device registers it with PingOne MFA so it can be used for authentication. Users can have multiple enrolled devices for backup and convenience.\n\n**Admin Flow vs User Flow:**\n\n**Admin Flow:** Uses a **Worker Token** (service account token) for administrative operations. This flow allows you to choose the device status when registering:\n- **ACTIVE:** Device is immediately ready for use\n- **ACTIVATION_REQUIRED:** Device requires user verification (OTP) before it can be used\n\n**User Flow:** Uses a **User Token** (access token from OAuth Authorization Code Flow) for user-initiated device registration. Devices are always created with **ACTIVATION_REQUIRED** status, requiring the user to verify ownership via OTP before the device can be used for authentication.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_t_add_mfa_device',
		},
		
		'device.selection': {
			title: 'Device Selection',
			description: 'If you have multiple MFA devices enrolled, you can choose which one to use for authentication. This provides flexibility and backup options if one device is unavailable.',
		},
		
		'device.name': {
			title: 'Device Name (Nickname)',
			description: `A friendly name to identify your MFA device. This helps you distinguish between multiple devices when managing your MFA settings.

**Examples:**
- "My Work Phone"
- "Personal iPhone"
- "YubiKey - Office"
- "Touch ID - MacBook"

**Why it's useful:**
- Easily identify which device to use during authentication
- Manage multiple devices more effectively
- Quickly recognize your devices in the PingOne admin console

**Note:** The device name is also called a "nickname" in the PingOne API. Both terms refer to the same user-friendly identifier for your device.`,
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#put-update-device-nickname',
		},
		
		'device.nickname': {
			title: 'Device Nickname',
			description: 'Give your device a friendly name like "My Work Phone" or "Personal iPhone" to easily identify it later. This is especially helpful when managing multiple devices.',
		},
		
		'device.status': {
			title: 'Device Status',
			description: 'Device status indicates whether a device is active and ready to use. Status values include: ACTIVE (ready to use), PENDING (awaiting verification), SUSPENDED (temporarily disabled), or EXPIRED (needs re-enrollment).',
		},
		
		'device.status.rules': {
			title: 'Device Status Rules for Create Device',
			description: `**ACTIVE vs ACTIVATION_REQUIRED:**

**ACTIVE Status:**
- Device is created and immediately ready to use
- No OTP verification required
- User can use the device right away for MFA
- Only available with **Worker Token** (Admin Flow)
- PingOne's default status if not specified

**ACTIVATION_REQUIRED Status:**
- Device is created but requires OTP verification before first use
- PingOne automatically sends OTP to the device (SMS/Email)
- User must enter the OTP code to activate the device
- Available with both **Worker Token** (Admin Flow) and **User Token** (User Flow)

**Token Type Rules:**

**Worker Token (Admin Flow):**
- Can set device status to either **ACTIVE** or **ACTIVATION_REQUIRED**
- Used for administrative device provisioning
- Obtained via Client Credentials Grant (no user interaction)
- Allows pre-pairing devices (ACTIVE status)

**User Token (User Flow):**
- Can **ONLY** set device status to **ACTIVATION_REQUIRED** (security requirement)
- Used for user self-service device registration
- Obtained from Authorization Code Flow (user logs in to PingOne)
- Always requires activation for security

**Why These Rules?**
User tokens have limited permissions for security. Only worker tokens (admin privileges) can create devices in ACTIVE state, preventing users from bypassing activation requirements.`,
			securityNote: 'User tokens cannot create ACTIVE devices - this prevents security bypass.',
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-sms',
		},
		
		'device.limit': {
			title: 'Device Limit',
			description: 'PingOne MFA enforces a maximum number of devices per user (typically 5-15 depending on configuration). This prevents abuse while allowing reasonable backup options.',
		},
		
		'device.authentication.policy': {
			title: 'Device Authentication Policy',
			description: `A Device Authentication Policy (also called an MFA Policy) defines the authentication methods and security settings for MFA devices in your PingOne environment.

**What it controls:**
- Which MFA methods are allowed (SMS, Email, TOTP, FIDO2, Voice, etc.)
- Security requirements for each method
- Device activation and enrollment rules
- OTP expiration times
- Device limits per user

**For FIDO2 specifically:**
- The policy determines which FIDO2 authenticators are allowed
- RP ID (Relying Party ID) configuration
- Allowed origins for WebAuthn
- User verification requirements

**How to find your Policy ID:**
1. Go to PingOne Admin Console
2. Navigate to **Authentication** → **MFA Policies**
3. Select your policy
4. Copy the Policy ID from the policy details

The policy must be configured in PingOne before you can register devices.`,
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_mfa_policies',
		},
		
		'device.order': {
			title: 'Device Order',
			description: `Device order determines the priority sequence in which MFA devices are used during authentication. When a user has multiple devices, PingOne will try devices in the specified order.

**How Device Order Works:**
- The first device in the order is the **primary** device
- If the primary device is unavailable or fails, PingOne tries the next device in order
- Device order only applies when multiple devices are available
- If no order is set, PingOne uses its default selection logic

**Setting Device Order:**
- Use the "Set Order" button to establish a custom order based on the current device list
- The order is saved as an array of device IDs in the sequence you want
- Device order persists until you change it or remove it

**Removing Device Order:**
- Use the "Remove Order" button to clear the custom order
- After removal, PingOne will use its default device selection logic
- You can set a new order at any time

**API Reference:**
- Set Order: POST /environments/{envID}/users/{userID}/devices/order
- Remove Order: POST /environments/{envID}/users/{userID}/devices/order/remove

**Content-Type Headers:**
- Set Order: application/vnd.pingidentity.device.order+json
- Remove Order: application/vnd.pingidentity.device.order.remove+json`,
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#mfa-devices',
		},
		
		// ===== OTP & VERIFICATION =====
		'otp.code': {
			title: 'One-Time Passcode (OTP)',
			description: 'A temporary code sent to your device that expires after a short time (usually 5-10 minutes). Enter this code to verify you have access to the registered device.',
		},
		
		'otp.expiration': {
			title: 'OTP Expiration',
			description: 'OTP codes expire after a few minutes for security. If your code expires, request a new one. Never share OTP codes with anyone.',
			securityNote: 'Expired codes cannot be used. Request a new code if needed.',
		},
		
		'otp.resend': {
			title: 'Resend OTP',
			description: 'If you didn\'t receive the OTP code, you can request a new one. Check your spam folder for email OTPs, and ensure your phone has signal for SMS OTPs.',
		},
		
		// ===== CREDENTIALS & CONFIGURATION =====
		'credential.environmentId': {
			title: 'Environment ID',
			description: 'Your PingOne environment identifier. This is a UUID that identifies your PingOne tenant. Find this in the PingOne admin console under Settings > Environment Properties.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_environments',
		},
		
		'credential.username': {
			title: 'Username',
			description: 'The username of the user enrolling in MFA. This must match an existing user in your PingOne environment. In production, this would come from the authenticated session.',
		},
		
		'credential.workerToken': {
			title: 'Worker Application Token',
			description: 'A worker application token is required to call PingOne MFA APIs. Worker apps have elevated permissions to manage users and devices. Generate this token using your worker app credentials (client ID + client secret).',
			securityNote: 'Worker tokens should be kept secure and never exposed in client-side code.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_t_create_worker_app',
		},
		
		// ===== PHONE NUMBER =====
		'phone.countryCode': {
			title: 'Country Code',
			description: 'The international dialing code for your country (e.g., +1 for US/Canada, +44 for UK). PingOne uses E.164 format: +[country].[number]',
		},
		
		'phone.number': {
			title: 'Phone Number',
			description: 'Your mobile phone number without the country code. PingOne will format it as +[country].[number] (e.g., +1.5125551234).',
		},
		
		'phone.format': {
			title: 'Phone Number Format',
			description: 'PingOne requires phone numbers in E.164 format: +[country code].[phone number]. For example, a US number would be +1.5125551234 (no spaces, dashes, or parentheses).',
		},
		
		// ===== TOTP SPECIFIC =====
		'totp.qrCode': {
			title: 'TOTP QR Code',
			description: 'Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.) to set up TOTP. The QR code contains your secret key and account information.',
		},
		
		'totp.secret': {
			title: 'TOTP Secret Key',
			description: 'If you can\'t scan the QR code, manually enter this secret key into your authenticator app. Keep this secret secure - anyone with this key can generate valid codes.',
			securityNote: 'Never share your TOTP secret key. Store it securely as a backup.',
		},
		
		'totp.verification': {
			title: 'TOTP Verification',
			description: 'After scanning the QR code, your authenticator app will generate a 6-digit code. Enter this code to verify the setup is working correctly.',
		},
		
		// ===== FIDO2 SPECIFIC =====
		'fido2.webauthn': {
			title: 'WebAuthn Ceremony',
			description: 'WebAuthn is the browser API for FIDO2 authentication. Your browser will prompt you to use your security key, fingerprint, face recognition, or PIN to create a credential.',
		},
		
		'fido2.authenticator': {
			title: 'Authenticator Types',
			description: 'FIDO2 supports multiple authenticator types: hardware security keys (YubiKey, Titan), platform authenticators (Windows Hello, Touch ID, Face ID), and biometric readers.',
		},
		
		'fido2.publicKey': {
			title: 'Public Key Cryptography',
			description: 'FIDO2 uses public key cryptography. Your device creates a key pair: the private key stays on your device (never shared), and the public key is registered with PingOne.',
			securityNote: 'Private keys never leave your device, making FIDO2 extremely secure.',
		},
		
		'fido2.activation': {
			title: 'FIDO2 Device Activation Flow',
			description: `FIDO2 device activation is **WebAuthn-based**, NOT OTP-based. This is different from SMS, Email, and TOTP devices which use one-time passcodes (OTP) for activation.

**FIDO2 Activation Flow (per fido2-2.md):**

1. **Create FIDO2 Device** - Device is created in PingOne with ACTIVATION_REQUIRED status
2. **Get WebAuthn Options** - PingOne returns registration options (challenge, RP ID, etc.)
3. **Run WebAuthn Registration** - Browser calls \`navigator.credentials.create()\` with PingOne's options
4. **Send WebAuthn Result** - Browser sends attestation data (WebAuthn registration result) to backend
5. **Backend Calls FIDO2 Activation** - Backend calls PingOne's FIDO2 activation endpoint with WebAuthn data
6. **Device Becomes ACTIVE** - PingOne validates WebAuthn payload and marks device ACTIVE

**Key Differences from OTP-Based Activation:**

**OTP-Based (SMS/Email/TOTP):**
- Uses one-time passcodes sent via SMS, email, or generated by authenticator app
- User enters OTP code to activate device
- Activation endpoint: Standard device activation with OTP code

**FIDO2 (WebAuthn-Based):**
- Uses WebAuthn registration ceremony (security key, biometric, etc.)
- No OTP codes involved
- Activation endpoint: Dedicated FIDO2 activation endpoint (\`/activate/fido2\`)
- Device becomes ACTIVE after successful WebAuthn validation

**Important Notes:**
- You do NOT need to manually set \`ACTIVATION_CREATED\` status for FIDO2
- FIDO2 activation happens automatically after WebAuthn validation
- The flow is: Pre-activation → FIDO2 activation API → ACTIVE`,
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device-fido2',
		},
		
		// ===== SECURITY & BEST PRACTICES =====
		'security.phishingResistance': {
			title: 'Phishing Resistance',
			description: 'Phishing-resistant MFA methods (TOTP, FIDO2) cannot be tricked by fake login pages. SMS and Email are vulnerable to phishing attacks where attackers intercept codes.',
			securityNote: 'FIDO2 is the most phishing-resistant method available.',
		},
		
		'security.backupDevices': {
			title: 'Backup Devices',
			description: 'Always enroll at least 2 MFA devices. If you lose your primary device, you can still authenticate with your backup device. This prevents account lockout.',
		},
		
		'security.deviceRecovery': {
			title: 'Device Recovery',
			description: 'If you lose access to all your MFA devices, contact your administrator for account recovery. Some organizations provide recovery codes or alternative verification methods.',
		},
		
		// ===== MFA POLICIES =====
		'policy.mfaRequired': {
			title: 'MFA Requirement',
			description: 'Your organization requires multi-factor authentication for enhanced security. This adds an extra layer of protection beyond just your password.',
		},
		
		'policy.stepUp': {
			title: 'Step-Up Authentication',
			description: 'Step-up authentication requires additional MFA verification for sensitive operations, even if you\'re already logged in. This protects high-risk actions.',
		},
		
		// ===== TRANSACTION STATES =====
		'transaction.pending': {
			title: 'Transaction Pending',
			description: 'Your MFA transaction is waiting for verification. Complete the required action (enter OTP, approve push notification, etc.) to proceed.',
		},
		
		'transaction.approved': {
			title: 'Transaction Approved',
			description: 'Your MFA verification was successful. You can now proceed with the authenticated action.',
		},
		
		'transaction.denied': {
			title: 'Transaction Denied',
			description: 'The MFA verification was denied or failed. This could be due to an incorrect code, expired transaction, or explicit denial.',
		},
		
		'transaction.expired': {
			title: 'Transaction Expired',
			description: 'The MFA transaction expired before completion. Start a new transaction to try again.',
		},
		
		// ===== MFA DEVICE AUTHENTICATION FLOW STATES =====
		// Per PingOne MFA API: The /deviceAuthentications endpoint returns status values
		// that identify the next action in the flow. These states prompt for specific flow actions.
		'flow.otp_required': {
			title: 'OTP Required',
			description: 'A one-time passcode (OTP) has been sent to your device. Enter the code you received to complete authentication. The code is typically valid for a few minutes.',
			securityNote: 'Never share your OTP code with anyone. If you didn\'t request this code, do not enter it.',
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#mfa-device-authentications',
		},
		
		'flow.device_selection_required': {
			title: 'Device Selection Required',
			description: 'You have multiple MFA devices enrolled. Please select which device you want to use for this authentication. You can choose from SMS, Email, TOTP, FIDO2, or Push notification devices.',
			securityNote: 'Select the device that is most convenient and secure for you. Having multiple devices provides backup options.',
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#mfa-device-authentications',
		},
		
		'flow.assertion_required': {
			title: 'FIDO2 Assertion Required',
			description: 'Your FIDO2 device (security key, biometric authenticator, or platform authenticator) needs to verify your identity. Use your security key, Touch ID, Face ID, or Windows Hello to complete authentication.',
			securityLevel: 'high',
			securityNote: 'FIDO2 authentication is phishing-resistant and provides the highest level of security.',
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-check-assertion-fido-device',
		},
		
		'flow.push_confirmation_required': {
			title: 'Push Confirmation Required',
			description: 'A push notification has been sent to your mobile device. Please check your phone and approve the sign-in request. The notification will appear in your authenticator app or PingOne mobile app.',
			securityNote: 'Only approve push notifications that you initiated. If you didn\'t request this authentication, deny it immediately.',
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#mfa-device-authentications',
		},
		
		'flow.push_confirmation_timed_out': {
			title: 'Push Confirmation Timed Out',
			description: 'The push notification was sent to your mobile device, but it was not approved within the allowed timeframe. Push notifications typically expire after a few minutes for security reasons.',
			securityNote: 'If you didn\'t receive the push notification, check your device\'s internet connection and notification settings. You can start a new authentication attempt.',
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#mfa-device-authentications',
		},
	};

	/**
	 * Get security level color for UI display
	 * 
	 * @param level - Security level (high, medium, low)
	 * @returns Color code for the security level
	 */
	static getSecurityLevelColor(level?: 'high' | 'medium' | 'low'): string {
		switch (level) {
			case 'high':
				return '#10b981'; // Green - high security
			case 'medium':
				return '#f59e0b'; // Amber - medium security
			case 'low':
				return '#ef4444'; // Red - low security
			default:
				return '#6b7280'; // Gray - no security level
		}
	}

	/**
	 * Get security level icon for UI display
	 * 
	 * @param level - Security level (high, medium, low)
	 * @returns Emoji icon for the security level
	 */
	static getSecurityLevelIcon(level?: 'high' | 'medium' | 'low'): string {
		switch (level) {
			case 'high':
				return '🛡️'; // Shield - high security
			case 'medium':
				return '⚠️'; // Warning - medium security
			case 'low':
				return '⚡'; // Lightning - low security
			default:
				return 'ℹ️'; // Info - no security level
		}
	}

	/**
	 * Get all factor types with their education content
	 * 
	 * @returns Array of factor types with education content
	 */
	static getAllFactorTypes(): Array<{ key: string; content: MFAEducationContent }> {
		return [
			{ key: 'SMS', content: MFAEducationServiceV8.getContent('factor.sms') },
			{ key: 'EMAIL', content: MFAEducationServiceV8.getContent('factor.email') },
			{ key: 'WHATSAPP', content: MFAEducationServiceV8.getContent('factor.whatsapp') },
			{ key: 'TOTP', content: MFAEducationServiceV8.getContent('factor.totp') },
			{ key: 'FIDO2', content: MFAEducationServiceV8.getContent('factor.fido2') },
		];
	}
}

export default MFAEducationServiceV8;
