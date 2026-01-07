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
			description:
				'SMS sends a one-time passcode (OTP) to your mobile phone via text message. While convenient, SMS is vulnerable to SIM swapping and interception attacks.',
			securityLevel: 'medium',
			securityNote:
				'SMS is less secure than TOTP or FIDO2. Consider upgrading to a more secure factor.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_mfa_sms',
		},

		'factor.email': {
			title: 'Email Authentication',
			description:
				"Email sends a one-time passcode (OTP) to your email address. Security depends on your email provider's security measures.",
			securityLevel: 'medium',
			securityNote:
				'Email security depends on your email provider. Enable 2FA on your email account.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_mfa_email',
		},

		'factor.whatsapp': {
			title: 'WhatsApp Authentication',
			description:
				"WhatsApp sends a one-time passcode (OTP) to your WhatsApp number via WhatsApp messages. Similar to SMS but uses WhatsApp's messaging platform. All WhatsApp messages are sent by PingOne using its configured WhatsApp sender.",
			securityLevel: 'medium',
			securityNote:
				'WhatsApp MFA is similar to SMS in security level. Consider upgrading to TOTP or FIDO2 for higher security.',
			learnMoreUrl:
				'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-whatsapp',
		},

		'factor.totp': {
			title: 'TOTP (Time-based One-Time Password)',
			description:
				'TOTP uses authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator to generate time-based codes. More secure than SMS because codes are generated locally on your device.',
			securityLevel: 'high',
			securityNote: "TOTP is phishing-resistant and doesn't rely on network connectivity.",
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_mfa_totp',
		},

		'factor.fido2': {
			title: 'FIDO2 / WebAuthn',
			description:
				'FIDO2 uses hardware security keys, biometric authenticators, or platform authenticators (Windows Hello, Face ID, Touch ID). The most secure MFA method - phishing-resistant and cryptographically secure.',
			securityLevel: 'high',
			securityNote:
				'FIDO2 is the gold standard for MFA security. Highly recommended for sensitive applications.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_mfa_fido2',
		},

		// ===== DEVICE MANAGEMENT =====
		'device.enrollment': {
			title: 'Device Enrollment',
			description:
				'Enrolling a device registers it with PingOne MFA so it can be used for authentication. Users can have multiple enrolled devices for backup and convenience.\n\n**Admin Flow vs User Flow:**\n\n**Admin Flow:** Uses a **Worker Token** (service account token) for administrative operations. This flow allows you to choose the device status when registering:\n- **ACTIVE:** Device is immediately ready for use\n- **ACTIVATION_REQUIRED:** Device requires user verification (OTP) before it can be used\n\n**User Flow:** Uses a **User Token** (access token from OAuth Authorization Code Flow) for user-initiated device registration. Devices are always created with **ACTIVATION_REQUIRED** status, requiring the user to verify ownership via OTP before the device can be used for authentication.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_t_add_mfa_device',
		},

		'mfa.registrationFlowType': {
			title: 'Registration Flow Type',
			description: `The registration flow type determines how devices are registered and which token type is used for the registration process.

**Admin Flow (Worker Token):**
- Uses a **Worker Token** (service account token) obtained via Client Credentials Grant
- Allows administrative device provisioning
- Can choose device status: **ACTIVE** or **ACTIVATION_REQUIRED**
- **ACTIVE:** Device is immediately ready for use (no activation required)
- **ACTIVATION_REQUIRED:** Device requires OTP verification before first use
- Used for bulk device provisioning or administrative setup
- No user authentication required

**User Flow (User Token):**
- Uses a **User Token** (access token) obtained from OAuth Authorization Code Flow
- Requires user to authenticate with PingOne first
- Devices are **always** created with **ACTIVATION_REQUIRED** status
- User must verify device ownership via OTP before device can be used
- Used for user self-service device registration
- Provides better security by requiring user verification

**Key Differences:**
- **Admin Flow:** More flexibility (can create ACTIVE devices), uses worker token, no user auth
- **User Flow:** More secure (always requires activation), uses user token, requires user authentication

**When to Use Each:**
- **Admin Flow:** Bulk provisioning, testing, administrative device management
- **User Flow:** Production user self-service, user-initiated device enrollment`,
			securityNote: 'User Flow provides better security by always requiring device activation.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_t_add_mfa_device',
		},

		'device.selection': {
			title: 'Device Selection',
			description:
				'If you have multiple MFA devices enrolled, you can choose which one to use for authentication. This provides flexibility and backup options if one device is unavailable.',
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
			learnMoreUrl:
				'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#put-update-device-nickname',
		},

		'device.nickname': {
			title: 'Device Nickname',
			description:
				'Give your device a friendly name like "My Work Phone" or "Personal iPhone" to easily identify it later. This is especially helpful when managing multiple devices.',
		},

		'device.status': {
			title: 'Device Status',
			description:
				'Device status indicates whether a device is active and ready to use. Status values include: ACTIVE (ready to use), PENDING (awaiting verification), SUSPENDED (temporarily disabled), or EXPIRED (needs re-enrollment).',
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
			learnMoreUrl:
				'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-sms',
		},

		'device.limit': {
			title: 'Device Limit',
			description:
				'PingOne MFA enforces a maximum number of devices per user (typically 5-15 depending on configuration). This prevents abuse while allowing reasonable backup options.',
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

		'policy.skipUserLockVerification': {
			title: 'Skip User Lock Verification',
			description:
				"When enabled (true), the system will skip checking if the user account is locked before allowing authentication. When disabled (false), the system will check the user's lock status and prevent authentication if the account is locked.",
			securityLevel: 'high',
			securityNote:
				'Skipping lock verification can allow locked accounts to authenticate. Use with caution.',
		},

		'policy.pairingDisabled': {
			title: 'Pairing Disabled',
			description:
				'When enabled (true), device pairing/registration is disabled for this policy. Users cannot register new MFA devices when this setting is active.',
			securityLevel: 'medium',
			securityNote:
				'Disabling pairing prevents new device registration. Users must use existing devices.',
		},

		'policy.promptForNicknameOnPairing': {
			title: 'Prompt for Nickname on Pairing',
			description:
				'When enabled (true), users will be prompted to enter a custom nickname for their device after successful pairing. When disabled (false), the device name is set automatically without user input.',
			securityLevel: 'low',
		},

		'policy.authentication.deviceSelection': {
			title: 'Method Selection',
			description: `This setting controls how users select devices during authentication in PingOne.

**User selected default (DEFAULT_TO_FIRST):** PingOne attempts to authenticate with the user's default device first. If that fails or no default is set, it may prompt the user.

**Prompt user to select (PROMPT_TO_SELECT_DEVICE):** If the user has multiple devices, PingOne prompts them to choose one. If only one device exists, it's auto-selected.

**Always display devices (ALWAYS_DISPLAY_DEVICES):** PingOne always displays a list of available devices for the user to choose from, even if only one device exists.`,
			securityLevel: 'low',
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#device-authentication-policies',
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
			description:
				'A temporary code sent to your device that expires after a short time (usually 5-10 minutes). Enter this code to verify you have access to the registered device.',
		},

		'otp.expiration': {
			title: 'OTP Expiration',
			description:
				'OTP codes expire after a few minutes for security. If your code expires, request a new one. Never share OTP codes with anyone.',
		},

		'otp.failure.coolDown.duration': {
			title: 'OTP Failure Cooldown Duration',
			description: `The duration (number of time units) a user is blocked after reaching the maximum number of passcode failures.

**Range:**
- Minimum: 0 (for some device types) or 2 (for others)
- Maximum: 30
- Default: 0 or 2 (depending on device type)

**Important Notes:**
- When using the "onetime authentication" feature, users are NOT blocked after maximum failures even if a block duration is specified
- The duration is combined with the time unit (MINUTES or SECONDS) to determine the actual lockout period
- For example: duration=5 with timeUnit=MINUTES means a 5-minute lockout

**Security Consideration:**
- Setting duration to 0 disables the cooldown period
- Longer durations provide better protection against brute-force attacks but may frustrate legitimate users
- Recommended: 5-10 minutes for most use cases`,
			securityLevel: 'medium',
			securityNote:
				'Cooldown periods help prevent brute-force attacks by temporarily locking accounts after multiple failed attempts.',
		},

		'otp.failure.coolDown.timeUnit': {
			title: 'OTP Failure Cooldown Time Unit',
			description: `The type of time unit for the OTP failure cooldown duration.

**Valid Values:**
- \`MINUTES\` - Duration is measured in minutes
- \`SECONDS\` - Duration is measured in seconds

**Examples:**
- duration=5, timeUnit=MINUTES → 5-minute lockout
- duration=300, timeUnit=SECONDS → 5-minute lockout (300 seconds = 5 minutes)
- duration=1, timeUnit=MINUTES → 1-minute lockout

**Best Practices:**
- Use MINUTES for most scenarios (easier to understand)
- Use SECONDS for fine-grained control (e.g., 30-second lockouts)
- Ensure the combination of duration and timeUnit provides appropriate security without excessive user friction`,
			securityLevel: 'low',
		},

		'otp.failure.count': {
			title: 'OTP Failure Count',
			description: `The maximum number of OTP entry failures allowed before triggering the cooldown period.

**Range:**
- Minimum: 1
- Maximum: 7
- Default: 5

**How It Works:**
- Each time a user enters an incorrect OTP code, the failure count increments
- When the failure count reaches this maximum, the cooldown period is triggered
- During the cooldown period, the user cannot attempt to enter another OTP code
- The cooldown duration is controlled by the "Cooldown Duration" and "Time Unit" settings

**Security Consideration:**
- Lower values (1-3) provide stronger protection but may frustrate legitimate users
- Higher values (5-7) are more user-friendly but provide less protection against brute-force attacks
- Recommended: 5 failures for most use cases`,
			securityLevel: 'medium',
			securityNote:
				'Failure count limits help prevent brute-force attacks by blocking repeated incorrect attempts.',
		},

		'policy.deviceType.configuration': {
			title: 'Device Type Configuration',
			description: `Each device type (EMAIL, TOTP, SMS, VOICE, MOBILE, FIDO2, WHATSAPP) can have specific configuration options in the policy.

**Device Type Settings:**
- Each device type can have its own enabled/disabled status
- Device-specific pairing settings (e.g., pairingDisabled per device type)
- Device-specific authentication requirements
- Custom configuration options per device type

**Important:**
- All device type configurations must be present in the policy JSON (even if empty objects)
- PingOne API requires all device types to be included when creating or updating a policy
- Device type settings override environment-level settings for that specific device type

**Configuration Structure:**
Each device type (email, totp, sms, voice, mobile, fido2, whatsapp, name) is represented as an object in the policy JSON. These objects can contain device-specific settings like:
- \`enabled\`: Whether this device type is enabled
- \`pairingDisabled\`: Whether pairing is disabled for this device type
- Other device-specific configuration options`,
			securityLevel: 'low',
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#device-authentication-policies',
		},

		'policy.promptForNicknameOnPairing.explanation': {
			title: 'Why Can I (or Can\'t I) Update the Device Nickname?',
			description: `The ability to set a custom device nickname during registration depends on your Device Authentication Policy setting.

**When \`promptForNicknameOnPairing\` is \`true\`:**
- ✅ You CAN enter a custom nickname for your device
- The nickname field will be visible and editable during device registration
- This allows you to give your device a memorable name (e.g., "My iPhone", "Work Laptop")

**When \`promptForNicknameOnPairing\` is \`false\`:**
- ❌ You CANNOT enter a custom nickname during registration
- The nickname field will be hidden or disabled
- PingOne will automatically assign a device name based on the device type and registration details

**How to Change This Setting:**
1. Go to PingOne Admin Console
2. Navigate to **Authentication** → **MFA Policies**
3. Select your policy
4. Update the "Prompt for Nickname on Pairing" setting
5. Save the policy

**Note:** This is a policy-level setting that affects all devices registered under that policy. You cannot override it for individual devices.`,
			securityLevel: 'low',
			securityNote: 'Expired codes cannot be used. Request a new code if needed.',
		},

		'otp.resend': {
			title: 'Resend OTP',
			description:
				"If you didn't receive the OTP code, you can request a new one. Check your spam folder for email OTPs, and ensure your phone has signal for SMS OTPs.",
		},

		'otp.validation': {
			title: 'OTP Validation',
			description:
				'Enter the one-time passcode (OTP) sent to your device or generated by your authenticator app. For SMS/Email devices, the code is sent automatically. For TOTP devices, use the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.). The code typically expires after 5-10 minutes.',
			securityNote: 'Never share your OTP code with anyone. It is valid for a single use only.',
		},

		// ===== CREDENTIALS & CONFIGURATION =====
		'credential.environmentId': {
			title: 'Environment ID',
			description:
				'Your PingOne environment identifier. This is a UUID that identifies your PingOne tenant. Find this in the PingOne admin console under Settings > Environment Properties.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_c_environments',
		},

		'credential.username': {
			title: 'Username',
			description:
				'The username of the user enrolling in MFA. This must match an existing user in your PingOne environment. In production, this would come from the authenticated session.',
		},

		'credential.workerToken': {
			title: 'Worker Application Token',
			description:
				'A worker application token is required to call PingOne MFA APIs. Worker apps have elevated permissions to manage users and devices. Generate this token using your worker app credentials (client ID + client secret).',
			securityNote: 'Worker tokens should be kept secure and never exposed in client-side code.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_t_create_worker_app',
		},

		// ===== PHONE NUMBER =====
		'phone.countryCode': {
			title: 'Country Code',
			description:
				'The international dialing code for your country (e.g., +1 for US/Canada, +44 for UK). PingOne uses E.164 format: +[country].[number]',
		},

		'phone.number': {
			title: 'Phone Number',
			description:
				'Your mobile phone number without the country code. PingOne will format it as +[country].[number] (e.g., +1.5125551234).',
		},

		'phone.format': {
			title: 'Phone Number Format',
			description:
				'PingOne requires phone numbers in E.164 format: +[country code].[phone number]. For example, a US number would be +1.5125551234 (no spaces, dashes, or parentheses).',
		},

		// ===== TOTP SPECIFIC =====
		'totp.qrCode': {
			title: 'TOTP QR Code',
			description:
				'Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.) to set up TOTP. The QR code contains your secret key and account information.',
		},

		'totp.secret': {
			title: 'TOTP Secret Key',
			description:
				"If you can't scan the QR code, manually enter this secret key into your authenticator app. Keep this secret secure - anyone with this key can generate valid codes.",
			securityNote: 'Never share your TOTP secret key. Store it securely as a backup.',
		},

		'totp.verification': {
			title: 'TOTP Verification',
			description:
				'After scanning the QR code, your authenticator app will generate a 6-digit code. Enter this code to verify the setup is working correctly.',
		},

		// ===== FIDO2 SPECIFIC =====
		'fido2.webauthn': {
			title: 'WebAuthn Ceremony',
			description:
				'WebAuthn is the browser API for FIDO2 authentication. Your browser will prompt you to use your security key, fingerprint, face recognition, or PIN to create a credential.',
		},

		'fido2.authenticator': {
			title: 'Authenticator Types',
			description:
				'FIDO2 supports multiple authenticator types: hardware security keys (YubiKey, Titan), platform authenticators (Windows Hello, Touch ID, Face ID), and biometric readers.',
		},

		'fido2.publicKey': {
			title: 'Public Key Cryptography',
			description:
				'FIDO2 uses public key cryptography. Your device creates a key pair: the private key stays on your device (never shared), and the public key is registered with PingOne.',
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
			learnMoreUrl:
				'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device-fido2',
		},

		'fido2.passkeys.vs.webauthn': {
			title: 'Passkeys vs WebAuthn',
			description: `**Passkeys** and **WebAuthn** are related but distinct concepts:

**WebAuthn:**
- The **browser API** that enables passwordless authentication
- A technical standard (W3C) that defines how browsers interact with authenticators
- The underlying protocol that makes passkeys possible
- Can be used for both passkeys and traditional FIDO2 credentials

**Passkeys:**
- A **user-friendly term** for WebAuthn credentials that are synced across devices
- Built on top of WebAuthn technology
- Designed for seamless, passwordless authentication
- Can be synced via iCloud Keychain (Apple), Google Password Manager, or Microsoft Account
- Provides a smoother user experience with automatic credential discovery

**Key Difference:**
- **WebAuthn** = The technology/protocol
- **Passkeys** = The user experience built on WebAuthn (synced, discoverable credentials)

All passkeys use WebAuthn, but not all WebAuthn credentials are passkeys. Traditional FIDO2 security keys are WebAuthn-based but not passkeys because they're device-bound.`,
			learnMoreUrl:
				'https://docs.pingidentity.com/sdks/latest/sdks/use-cases/how-to-go-passwordless-with-passkeys.html',
		},

		'fido2.passkeys.vs.device.binding': {
			title: 'Passkeys vs Device Binding',
			description: `**Passkeys** and **Device Binding** represent different approaches to credential storage:

**Passkeys:**
- Credentials are **synced across devices** via cloud services (iCloud Keychain, Google Password Manager)
- Users can authenticate on any device where they're signed in
- Provides seamless cross-device authentication
- Better user experience for passwordless flows
- Credentials are discoverable and automatically suggested

**Device Binding:**
- Credentials are **bound to a specific device** (hardware security key, device TPM)
- Cannot be transferred or synced to other devices
- Higher security isolation - credentials never leave the device
- Requires physical access to the device for authentication
- Better for high-security scenarios where credential portability is a concern

**When to Use Each:**
- **Passkeys**: Consumer applications, convenience-focused authentication, cross-device workflows
- **Device Binding**: High-security environments, compliance requirements, scenarios where credential portability is a risk`,
			learnMoreUrl:
				'https://docs.pingidentity.com/sdks/latest/sdks/use-cases/how-to-go-passwordless-with-passkeys.html',
		},

		'fido2.biometrics.vs.webauthn': {
			title: 'Biometrics vs WebAuthn',
			description: `**Biometrics** and **WebAuthn** work together but serve different roles:

**Biometrics (Touch ID, Face ID, Windows Hello):**
- A **user verification method** used during WebAuthn authentication
- Provides convenient, secure user authentication
- Stored locally on the device (never transmitted)
- Used to unlock the private key stored on the device
- Part of the WebAuthn user verification process

**WebAuthn:**
- The **authentication protocol** that defines how credentials are created and used
- Specifies how biometrics are integrated into the authentication flow
- Defines the cryptographic operations (key generation, signing)
- Handles the communication between browser, authenticator, and server

**How They Work Together:**
1. WebAuthn creates a credential (public/private key pair)
2. The private key is stored securely on the device
3. When authenticating, WebAuthn requests user verification
4. Biometrics (or PIN/password) unlock the private key
5. The private key signs a challenge, proving user identity

**Key Point:** Biometrics are a **method** of user verification within WebAuthn, not a separate authentication technology.`,
			learnMoreUrl:
				'https://docs.pingidentity.com/sdks/latest/sdks/use-cases/how-to-go-passwordless-with-passkeys.html',
		},

		'fido2.comparison.table': {
			title: 'WebAuthn vs Device Binding/JWS Verification Comparison',
			description: `This comparison table shows the key differences between WebAuthn and Device Binding/JWS Verification approaches.`,
		},

		// ===== SECURITY & BEST PRACTICES =====
		'security.phishingResistance': {
			title: 'Phishing Resistance',
			description:
				'Phishing-resistant MFA methods (TOTP, FIDO2) cannot be tricked by fake login pages. SMS and Email are vulnerable to phishing attacks where attackers intercept codes.',
			securityNote: 'FIDO2 is the most phishing-resistant method available.',
		},

		'security.backupDevices': {
			title: 'Backup Devices',
			description:
				'Always enroll at least 2 MFA devices. If you lose your primary device, you can still authenticate with your backup device. This prevents account lockout.',
		},

		'security.deviceRecovery': {
			title: 'Device Recovery',
			description:
				'If you lose access to all your MFA devices, contact your administrator for account recovery. Some organizations provide recovery codes or alternative verification methods.',
		},

		// ===== MFA POLICIES =====
		'policy.mfaRequired': {
			title: 'MFA Requirement',
			description:
				'Your organization requires multi-factor authentication for enhanced security. This adds an extra layer of protection beyond just your password.',
		},

		'policy.stepUp': {
			title: 'Step-Up Authentication',
			description:
				"Step-up authentication requires additional MFA verification for sensitive operations, even if you're already logged in. This protects high-risk actions.",
		},

		// ===== TRANSACTION STATES =====
		'transaction.pending': {
			title: 'Transaction Pending',
			description:
				'Your MFA transaction is waiting for verification. Complete the required action (enter OTP, approve push notification, etc.) to proceed.',
		},

		'transaction.approved': {
			title: 'Transaction Approved',
			description:
				'Your MFA verification was successful. You can now proceed with the authenticated action.',
		},

		'transaction.denied': {
			title: 'Transaction Denied',
			description:
				'The MFA verification was denied or failed. This could be due to an incorrect code, expired transaction, or explicit denial.',
		},

		'transaction.expired': {
			title: 'Transaction Expired',
			description:
				'The MFA transaction expired before completion. Start a new transaction to try again.',
		},

		// ===== MFA DEVICE AUTHENTICATION FLOW STATES =====
		// Per PingOne MFA API: The /deviceAuthentications endpoint returns status values
		// that identify the next action in the flow. These states prompt for specific flow actions.
		'flow.otp_required': {
			title: 'OTP Required',
			description:
				'A one-time passcode (OTP) has been sent to your device. Enter the code you received to complete authentication. The code is typically valid for a few minutes.',
			securityNote:
				"Never share your OTP code with anyone. If you didn't request this code, do not enter it.",
			learnMoreUrl:
				'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#mfa-device-authentications',
		},

		'flow.device_selection_required': {
			title: 'Device Selection Required',
			description:
				'You have multiple MFA devices enrolled. Please select which device you want to use for this authentication. You can choose from SMS, Email, TOTP, FIDO2, or Push notification devices.',
			securityNote:
				'Select the device that is most convenient and secure for you. Having multiple devices provides backup options.',
			learnMoreUrl:
				'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#mfa-device-authentications',
		},

		'flow.assertion_required': {
			title: 'FIDO2 Assertion Required',
			description:
				'Your FIDO2 device (security key, biometric authenticator, or platform authenticator) needs to verify your identity. Use your security key, Touch ID, Face ID, or Windows Hello to complete authentication.',
			securityLevel: 'high',
			securityNote:
				'FIDO2 authentication is phishing-resistant and provides the highest level of security.',
			learnMoreUrl:
				'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-check-assertion-fido-device',
		},

		'flow.push_confirmation_required': {
			title: 'Push Confirmation Required',
			description:
				'A push notification has been sent to your mobile device. Please check your phone and approve the sign-in request. The notification will appear in your authenticator app or PingOne mobile app.',
			securityNote:
				"Only approve push notifications that you initiated. If you didn't request this authentication, deny it immediately.",
			learnMoreUrl:
				'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#mfa-device-authentications',
		},

		'flow.push_confirmation_timed_out': {
			title: 'Push Confirmation Timed Out',
			description:
				'The push notification was sent to your mobile device, but it was not approved within the allowed timeframe. Push notifications typically expire after a few minutes for security reasons.',
			securityNote:
				"If you didn't receive the push notification, check your device's internet connection and notification settings. You can start a new authentication attempt.",
			learnMoreUrl:
				'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#mfa-device-authentications',
		},

		'mfa.settings': {
			title: 'PingOne MFA Settings',
			description:
				'Environment-level MFA settings control behavior across all MFA policies in your PingOne environment. These settings include pairing configuration (max devices, pairing key format), lockout policies (failure count, duration), and OTP settings (length, validity). Policy-specific settings like device selection and authentication methods are configured in Device Authentication Policies.',
			securityLevel: 'high',
			securityNote:
				'MFA settings affect security across your entire environment. Changes should be carefully reviewed and tested.',
			learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#mfa-settings',
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
