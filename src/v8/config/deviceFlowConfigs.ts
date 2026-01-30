/**
 * @file deviceFlowConfigs.ts
 * @module v8/config
 * @description Device flow configurations for unified MFA registration
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Configuration-driven device flows for SMS, Email, Mobile, WhatsApp, TOTP, and FIDO2.
 * This enables a single UnifiedMFARegistrationFlowV8 component to handle all device types
 * using device-specific configurations instead of separate components.
 *
 * Part of Week 3: Device Configuration System
 * Phase 2 of the MFA Consolidation Project
 *
 * @example
 * import { deviceFlowConfigs } from '@/v8/config/deviceFlowConfigs';
 *
 * const smsConfig = deviceFlowConfigs.SMS;
 * const isValid = smsConfig.validationRules.phoneNumber('+15125201234');
 */

import { ValidationServiceV8 } from '@/v8/services/validationServiceV8';
import { validateAndNormalizePhone } from '@/v8/utils/phoneValidationV8';
import type {
	DeviceConfigKey,
	DeviceFlowConfig,
	DeviceFlowConfigMap,
	ValidationFunction,
	ValidationResult,
} from './deviceFlowConfigTypes';

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate phone number for SMS/Voice/WhatsApp
 */
const validatePhoneNumber: ValidationFunction = (value: string): ValidationResult => {
	const result = validateAndNormalizePhone(value, '+1');
	return {
		valid: result.isValid,
		error: result.error,
	};
};

/**
 * Validate email address for Email/WhatsApp
 */
const validateEmail: ValidationFunction = (value: string): ValidationResult => {
	const isValid = ValidationServiceV8.validateEmail(value);
	return {
		valid: isValid,
		error: isValid ? undefined : 'Please enter a valid email address (e.g., user@example.com)',
	};
};

/**
 * Validate country code format
 */
const validateCountryCode: ValidationFunction = (value: string): ValidationResult => {
	// Country code must start with + and have 1-3 digits
	const isValid = /^\+\d{1,3}$/.test(value);
	return {
		valid: isValid,
		error: isValid ? undefined : 'Country code must start with + and have 1-3 digits (e.g., +1)',
	};
};

/**
 * Validate device name (optional field, but if provided must be valid)
 */
const validateDeviceName: ValidationFunction = (value: string): ValidationResult => {
	if (!value || value.trim().length === 0) {
		return { valid: true }; // Optional field
	}

	if (value.length > 50) {
		return {
			valid: false,
			error: 'Device name must be 50 characters or less',
		};
	}

	return { valid: true };
};

/**
 * Validate nickname (optional field)
 */
const validateNickname: ValidationFunction = (value: string): ValidationResult => {
	if (!value || value.trim().length === 0) {
		return { valid: true }; // Optional field
	}

	if (value.length > 100) {
		return {
			valid: false,
			error: 'Nickname must be 100 characters or less',
		};
	}

	return { valid: true };
};

/**
 * No-op validator for fields that don't need validation
 */
const _noValidation: ValidationFunction = (): ValidationResult => {
	return { valid: true };
};

// ============================================================================
// DEVICE FLOW CONFIGURATIONS
// ============================================================================

/**
 * SMS Device Flow Configuration
 * Sends one-time passwords via SMS text message
 */
const SMS_CONFIG: DeviceFlowConfig = {
	deviceType: 'SMS',
	displayName: 'SMS OTP',
	icon: '📱',
	description: 'Receive verification codes via SMS text message',
	educationalContent: `
## SMS One-Time Password (OTP)

SMS OTP is a widely-used MFA method that sends temporary verification codes to your mobile phone.

### How it Works
1. Register your mobile phone number
2. When you need to authenticate, a 6-digit code is sent via SMS
3. Enter the code within a few minutes to complete authentication

### Security Considerations
- SMS is convenient but vulnerable to SIM swapping attacks
- Use a trusted mobile carrier
- Keep your phone number up to date

### Best Practices
- Never share your OTP codes with anyone
- Be aware of the expiration time (typically 5-10 minutes)
- If you don't receive a code, check your phone signal and request a new one
`,
	requiredFields: ['phoneNumber', 'countryCode'],
	optionalFields: ['deviceName', 'nickname'],
	validationRules: {
		phoneNumber: validatePhoneNumber,
		countryCode: validateCountryCode,
		deviceName: validateDeviceName,
		nickname: validateNickname,
	},
	apiEndpoints: {
		register: '/api/pingone/mfa/register-device',
		activate: '/api/pingone/mfa/activate-device',
		sendOTP: '/api/pingone/mfa/send-otp',
	},
	documentation: {
		title: 'SMS Device Registration API',
		description: 'Register an SMS device for one-time password delivery via text message',
		apiDocContent: `
### SMS Device Registration

**Endpoint:** \`POST /v1/environments/{envId}/users/{userId}/devices\`

**Request Body:**
\`\`\`json
{
  "type": "SMS",
  "phone": "+1.5125201234",
  "name": "My Phone",
  "status": "ACTIVATION_REQUIRED"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "device-id",
  "type": "SMS",
  "phone": "+1.5125201234",
  "status": "ACTIVATION_REQUIRED",
  "_links": {
    "activate": {
      "href": "/v1/environments/{envId}/users/{userId}/devices/{deviceId}"
    }
  }
}
\`\`\`

### Activation

Send the OTP code to activate the device:

\`\`\`json
POST /v1/environments/{envId}/users/{userId}/devices/{deviceId}
Content-Type: application/vnd.pingidentity.device.activate+json

{
  "otp": "123456"
}
\`\`\`
`,
		externalDocsUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_add_mfa_device',
	},
	requiresOTP: true,
	defaultDeviceStatus: 'ACTIVATION_REQUIRED',
	supportsQRCode: false,
	requiresBiometric: false,
	supportsVoice: false,
};

/**
 * Email Device Flow Configuration
 * Sends one-time passwords via email
 */
const EMAIL_CONFIG: DeviceFlowConfig = {
	deviceType: 'EMAIL',
	displayName: 'Email OTP',
	icon: '📧',
	description: 'Receive verification codes via email',
	educationalContent: `
## Email One-Time Password (OTP)

Email OTP sends temporary verification codes to your email address.

### How it Works
1. Register your email address
2. When you need to authenticate, a 6-digit code is sent to your inbox
3. Enter the code to complete authentication

### Security Considerations
- Ensure your email account has strong security (password + 2FA)
- Use a trusted email provider
- Keep your email address up to date

### Best Practices
- Check your spam folder if you don't receive the code
- Never share your OTP codes with anyone
- Email OTPs may take longer to arrive than SMS
`,
	requiredFields: ['email'],
	optionalFields: ['deviceName', 'nickname'],
	validationRules: {
		email: validateEmail,
		deviceName: validateDeviceName,
		nickname: validateNickname,
	},
	apiEndpoints: {
		register: '/api/pingone/mfa/register-device',
		activate: '/api/pingone/mfa/activate-device',
		sendOTP: '/api/pingone/mfa/send-otp',
	},
	documentation: {
		title: 'Email Device Registration API',
		description: 'Register an email device for one-time password delivery via email',
		apiDocContent: `
### Email Device Registration

**Endpoint:** \`POST /v1/environments/{envId}/users/{userId}/devices\`

**Request Body:**
\`\`\`json
{
  "type": "EMAIL",
  "email": "user@example.com",
  "name": "My Email",
  "status": "ACTIVATION_REQUIRED"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "device-id",
  "type": "EMAIL",
  "email": "user@example.com",
  "status": "ACTIVATION_REQUIRED",
  "_links": {
    "activate": {
      "href": "/v1/environments/{envId}/users/{userId}/devices/{deviceId}"
    }
  }
}
\`\`\`

### Activation

Send the OTP code to activate the device:

\`\`\`json
POST /v1/environments/{envId}/users/{userId}/devices/{deviceId}
Content-Type: application/vnd.pingidentity.device.activate+json

{
  "otp": "123456"
}
\`\`\`
`,
		externalDocsUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_add_mfa_device',
	},
	requiresOTP: true,
	defaultDeviceStatus: 'ACTIVATION_REQUIRED',
	supportsQRCode: false,
	requiresBiometric: false,
	supportsVoice: false,
};

/**
 * Mobile Device Flow Configuration
 * Mobile push notifications via PingOne Mobile app
 */
const MOBILE_CONFIG: DeviceFlowConfig = {
	deviceType: 'MOBILE',
	displayName: 'Mobile Push',
	icon: '📲',
	description: 'Receive push notifications on your mobile device',
	educationalContent: `
## Mobile Push Notifications

Mobile push authentication uses the PingOne Mobile app to send secure push notifications to your device.

### How it Works
1. Install the PingOne Mobile app on your smartphone
2. Pair your device by scanning a QR code or entering a pairing key
3. When you need to authenticate, receive a push notification
4. Approve or deny the authentication request in the app

### Security Considerations
- Most secure MFA method (cryptographic signatures)
- Requires the PingOne Mobile app
- Device must have internet connectivity

### Best Practices
- Keep the app up to date
- Enable biometric authentication in the app
- Only approve authentication requests you initiated
- Report lost or stolen devices immediately
`,
	requiredFields: [],
	optionalFields: ['deviceName', 'nickname'],
	validationRules: {
		deviceName: validateDeviceName,
		nickname: validateNickname,
	},
	apiEndpoints: {
		register: '/api/pingone/mfa/register-device',
	},
	documentation: {
		title: 'Mobile Push Device Registration API',
		description: 'Register a mobile device for push notification authentication',
		apiDocContent: `
### Mobile Device Registration

**Endpoint:** \`POST /v1/environments/{envId}/users/{userId}/devices\`

**Request Body:**
\`\`\`json
{
  "type": "MOBILE",
  "name": "My iPhone"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "device-id",
  "type": "MOBILE",
  "status": "ACTIVATION_REQUIRED",
  "pairingKey": "ABC123DEF456",
  "qrCode": "data:image/png;base64,...",
  "_links": {
    "activate": {
      "href": "/v1/environments/{envId}/users/{userId}/devices/{deviceId}"
    }
  }
}
\`\`\`

### Pairing

The user scans the QR code or enters the pairing key in the PingOne Mobile app.
Once paired, the device status changes to ACTIVE.
`,
		externalDocsUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_add_mfa_device',
	},
	requiresOTP: false,
	defaultDeviceStatus: 'ACTIVATION_REQUIRED',
	supportsQRCode: true,
	requiresBiometric: false,
	supportsVoice: false,
};

/**
 * WhatsApp Device Flow Configuration
 * Sends one-time passwords via WhatsApp
 */
const WHATSAPP_CONFIG: DeviceFlowConfig = {
	deviceType: 'WHATSAPP',
	displayName: 'WhatsApp OTP',
	icon: '💬',
	description: 'Receive verification codes via WhatsApp',
	educationalContent: `
## WhatsApp One-Time Password (OTP)

WhatsApp OTP sends temporary verification codes via WhatsApp message.

### How it Works
1. Register your phone number or email address
2. When you need to authenticate, a code is sent via WhatsApp
3. Enter the code to complete authentication

### Requirements
- WhatsApp must be enabled in your PingOne environment
- You must have WhatsApp installed on your device
- Your phone number must be registered with WhatsApp

### Security Considerations
- More secure than SMS (end-to-end encryption)
- Requires WhatsApp account
- Requires internet connectivity

### Best Practices
- Ensure your WhatsApp account is secure
- Never share your OTP codes with anyone
- Keep your phone number up to date
`,
	requiredFields: ['phoneNumber', 'countryCode', 'email'],
	optionalFields: ['deviceName', 'nickname'],
	validationRules: {
		phoneNumber: validatePhoneNumber,
		countryCode: validateCountryCode,
		email: validateEmail,
		deviceName: validateDeviceName,
		nickname: validateNickname,
	},
	apiEndpoints: {
		register: '/api/pingone/mfa/register-device',
		activate: '/api/pingone/mfa/activate-device',
		sendOTP: '/api/pingone/mfa/send-otp',
	},
	documentation: {
		title: 'WhatsApp Device Registration API',
		description: 'Register a WhatsApp device for one-time password delivery via WhatsApp',
		apiDocContent: `
### WhatsApp Device Registration

**Endpoint:** \`POST /v1/environments/{envId}/users/{userId}/devices\`

**Request Body:**
\`\`\`json
{
  "type": "WHATSAPP",
  "phone": "+1.5125201234",
  "email": "user@example.com",
  "name": "My WhatsApp",
  "status": "ACTIVATION_REQUIRED"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "device-id",
  "type": "WHATSAPP",
  "phone": "+1.5125201234",
  "status": "ACTIVATION_REQUIRED",
  "_links": {
    "activate": {
      "href": "/v1/environments/{envId}/users/{userId}/devices/{deviceId}"
    }
  }
}
\`\`\`

### Activation

Send the OTP code to activate the device:

\`\`\`json
POST /v1/environments/{envId}/users/{userId}/devices/{deviceId}
Content-Type: application/vnd.pingidentity.device.activate+json

{
  "otp": "123456"
}
\`\`\`

**Note:** WhatsApp must be enabled in your PingOne environment for this to work.
`,
		externalDocsUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_add_mfa_device',
	},
	requiresOTP: true,
	defaultDeviceStatus: 'ACTIVATION_REQUIRED',
	supportsQRCode: false,
	requiresBiometric: false,
	supportsVoice: false,
};

/**
 * TOTP Device Flow Configuration
 * Time-based one-time password (authenticator apps)
 */
const TOTP_CONFIG: DeviceFlowConfig = {
	deviceType: 'TOTP',
	displayName: 'Authenticator App (TOTP)',
	icon: '🔐',
	description: 'Use an authenticator app like Google Authenticator or Authy',
	educationalContent: `
## Time-Based One-Time Password (TOTP)

TOTP uses authenticator apps to generate time-based verification codes.

### How it Works
1. Install an authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
2. Scan the QR code or enter the secret key manually
3. The app generates a new 6-digit code every 30 seconds
4. Enter the current code to authenticate

### Supported Apps
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- LastPass Authenticator
- Any TOTP-compatible app

### Security Considerations
- Most secure software-based MFA method
- Works offline (no internet required)
- Codes rotate every 30 seconds
- Backup your secret key in case you lose your device

### Best Practices
- Save the secret key in a secure location
- Enable cloud backup in your authenticator app (if available)
- Consider registering multiple devices for redundancy
`,
	requiredFields: [],
	optionalFields: ['deviceName', 'nickname'],
	validationRules: {
		deviceName: validateDeviceName,
		nickname: validateNickname,
	},
	apiEndpoints: {
		register: '/api/pingone/mfa/register-device',
	},
	documentation: {
		title: 'TOTP Device Registration API',
		description: 'Register a TOTP authenticator app device',
		apiDocContent: `
### TOTP Device Registration

**Endpoint:** \`POST /v1/environments/{envId}/users/{userId}/devices\`

**Request Body:**
\`\`\`json
{
  "type": "TOTP",
  "name": "My Authenticator App"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "device-id",
  "type": "TOTP",
  "status": "ACTIVATION_REQUIRED",
  "secret": "BASE32ENCODEDSECRET",
  "qrCode": "data:image/png;base64,...",
  "keyUri": "otpauth://totp/PingOne:user@example.com?secret=BASE32ENCODEDSECRET&issuer=PingOne",
  "_links": {
    "activate": {
      "href": "/v1/environments/{envId}/users/{userId}/devices/{deviceId}"
    }
  }
}
\`\`\`

### Activation

Send a TOTP code to activate the device:

\`\`\`json
POST /v1/environments/{envId}/users/{userId}/devices/{deviceId}
Content-Type: application/vnd.pingidentity.device.activate+json

{
  "otp": "123456"
}
\`\`\`

The device becomes ACTIVE once the correct TOTP code is validated.
`,
		externalDocsUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_add_mfa_device',
	},
	requiresOTP: true,
	defaultDeviceStatus: 'ACTIVATION_REQUIRED',
	supportsQRCode: true,
	requiresBiometric: false,
	supportsVoice: false,
};

/**
 * FIDO2 Device Flow Configuration
 * WebAuthn/FIDO2 biometric authentication
 */
const FIDO2_CONFIG: DeviceFlowConfig = {
	deviceType: 'FIDO2',
	displayName: 'Security Key / Biometric',
	icon: '🔑',
	description: 'Use a hardware security key or biometric authentication (fingerprint, Face ID)',
	educationalContent: `
## FIDO2 / WebAuthn Authentication

FIDO2 is the most secure MFA method, using public key cryptography and biometric authentication.

### How it Works
1. Register your security key or biometric authenticator
2. When you need to authenticate, you'll be prompted to use your device
3. For security keys: Insert and touch the key
4. For biometrics: Use fingerprint or facial recognition

### Supported Authenticators
**Hardware Security Keys:**
- YubiKey (5 Series, Security Key)
- Google Titan Security Key
- Feitian ePass FIDO2
- Thetis FIDO2 Security Key

**Platform Authenticators:**
- Windows Hello (fingerprint, facial recognition)
- Touch ID (MacBook, iMac)
- Face ID (iPhone, iPad)
- Android Biometrics

### Security Considerations
- Phishing-resistant (most secure MFA method)
- Uses public key cryptography
- No codes to enter or intercept
- Works offline

### Best Practices
- Register multiple security keys for backup
- Keep security keys in a safe place
- For platform authenticators, ensure device security is enabled
- Security keys should be from reputable manufacturers
`,
	requiredFields: [],
	optionalFields: ['deviceName', 'nickname'],
	validationRules: {
		deviceName: validateDeviceName,
		nickname: validateNickname,
	},
	apiEndpoints: {
		register: '/api/pingone/mfa/register-device',
	},
	documentation: {
		title: 'FIDO2 Device Registration API',
		description: 'Register a FIDO2 security key or biometric authenticator',
		apiDocContent: `
### FIDO2 Device Registration

FIDO2 registration uses the WebAuthn API and requires browser support.

**Endpoint:** \`POST /v1/environments/{envId}/users/{userId}/devices\`

**Request Body:**
\`\`\`json
{
  "type": "FIDO2",
  "name": "My Security Key"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "device-id",
  "type": "FIDO2",
  "status": "ACTIVE",
  "publicKeyCredentialCreationOptions": {
    "challenge": "base64-encoded-challenge",
    "rp": {
      "name": "PingOne",
      "id": "example.com"
    },
    "user": {
      "id": "base64-encoded-user-id",
      "name": "user@example.com",
      "displayName": "John Doe"
    },
    "pubKeyCredParams": [
      { "type": "public-key", "alg": -7 },
      { "type": "public-key", "alg": -257 }
    ],
    "timeout": 60000,
    "authenticatorSelection": {
      "authenticatorAttachment": "platform",
      "requireResidentKey": false,
      "userVerification": "preferred"
    }
  }
}
\`\`\`

### Client-Side WebAuthn Flow

1. Call \`navigator.credentials.create()\` with the publicKeyCredentialCreationOptions
2. User completes biometric/security key authentication
3. Send the credential response back to complete registration

**Note:** FIDO2 devices are immediately ACTIVE after registration (no OTP activation needed).
`,
		externalDocsUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_add_mfa_device_fido2',
	},
	requiresOTP: false,
	defaultDeviceStatus: 'ACTIVE',
	supportsQRCode: false,
	requiresBiometric: true,
	supportsVoice: false,
};

// ============================================================================
// DEVICE FLOW CONFIG MAP
// ============================================================================

/**
 * Complete configuration map for all device types
 * This is the main export used by the unified MFA flow component
 */
export const deviceFlowConfigs: DeviceFlowConfigMap = {
	SMS: SMS_CONFIG,
	EMAIL: EMAIL_CONFIG,
	MOBILE: MOBILE_CONFIG,
	WHATSAPP: WHATSAPP_CONFIG,
	TOTP: TOTP_CONFIG,
	FIDO2: FIDO2_CONFIG,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get device configuration by device type
 * @param deviceType - Device type key
 * @returns Device flow configuration
 * @throws Error if device type is not supported
 * @example
 * const config = getDeviceConfig('SMS');
 */
export function getDeviceConfig(deviceType: DeviceConfigKey): DeviceFlowConfig {
	const config = deviceFlowConfigs[deviceType];
	if (!config) {
		throw new Error(`Unsupported device type: ${deviceType}`);
	}
	return config;
}

/**
 * Get all supported device types
 * @returns Array of device type keys
 * @example
 * const types = getSupportedDeviceTypes(); // ['SMS', 'EMAIL', ...]
 */
export function getSupportedDeviceTypes(): DeviceConfigKey[] {
	return Object.keys(deviceFlowConfigs) as DeviceConfigKey[];
}

/**
 * Check if a device type is supported
 * @param deviceType - Device type to check
 * @returns True if device type is supported
 * @example
 * if (isDeviceTypeSupported('SMS')) { ... }
 */
export function isDeviceTypeSupported(deviceType: string): deviceType is DeviceConfigKey {
	return deviceType in deviceFlowConfigs;
}

/**
 * Get validation rules for a specific device type
 * @param deviceType - Device type key
 * @returns Validation rules for the device type
 * @example
 * const rules = getDeviceValidationRules('SMS');
 * const isValid = rules.phoneNumber('+15125201234');
 */
export function getDeviceValidationRules(
	deviceType: DeviceConfigKey
): Record<string, ValidationFunction> {
	const config = getDeviceConfig(deviceType);
	return config.validationRules;
}

/**
 * Get API endpoints for a specific device type
 * @param deviceType - Device type key
 * @returns API endpoints for the device type
 * @example
 * const endpoints = getDeviceApiEndpoints('SMS');
 * console.log(endpoints.register); // '/api/pingone/mfa/register-device'
 */
export function getDeviceApiEndpoints(deviceType: DeviceConfigKey) {
	const config = getDeviceConfig(deviceType);
	return config.apiEndpoints;
}

/**
 * Get required fields for a specific device type
 * @param deviceType - Device type key
 * @returns Array of required field names
 * @example
 * const fields = getRequiredFields('SMS'); // ['phoneNumber', 'countryCode']
 */
export function getRequiredFields(deviceType: DeviceConfigKey): string[] {
	const config = getDeviceConfig(deviceType);
	return config.requiredFields;
}

/**
 * Get optional fields for a specific device type
 * @param deviceType - Device type key
 * @returns Array of optional field names
 * @example
 * const fields = getOptionalFields('SMS'); // ['deviceName', 'nickname']
 */
export function getOptionalFields(deviceType: DeviceConfigKey): string[] {
	const config = getDeviceConfig(deviceType);
	return config.optionalFields;
}

/**
 * Validate all fields for a device type
 * @param deviceType - Device type key
 * @param fieldValues - Field values to validate
 * @returns Validation results for all fields
 * @example
 * const results = validateDeviceFields('SMS', {
 *   phoneNumber: '+15125201234',
 *   countryCode: '+1'
 * });
 */
export function validateDeviceFields(
	deviceType: DeviceConfigKey,
	fieldValues: Record<string, string>
): Record<string, ValidationResult> {
	const config = getDeviceConfig(deviceType);
	const results: Record<string, ValidationResult> = {};

	// Validate all fields that have values
	for (const [field, value] of Object.entries(fieldValues)) {
		const validator = config.validationRules[field];
		if (validator) {
			results[field] = validator(value);
		}
	}

	// Check for missing required fields
	for (const requiredField of config.requiredFields) {
		if (!fieldValues[requiredField] || fieldValues[requiredField].trim() === '') {
			results[requiredField] = {
				valid: false,
				error: `${requiredField} is required`,
			};
		}
	}

	return results;
}

/**
 * Check if all required fields are valid
 * @param deviceType - Device type key
 * @param fieldValues - Field values to validate
 * @returns True if all required fields are valid
 * @example
 * const isValid = areRequiredFieldsValid('SMS', { phoneNumber: '+15125201234', countryCode: '+1' });
 */
export function areRequiredFieldsValid(
	deviceType: DeviceConfigKey,
	fieldValues: Record<string, string>
): boolean {
	const validationResults = validateDeviceFields(deviceType, fieldValues);
	const config = getDeviceConfig(deviceType);

	// Check if all required fields are valid
	for (const requiredField of config.requiredFields) {
		const result = validationResults[requiredField];
		if (!result || !result.valid) {
			return false;
		}
	}

	return true;
}

/**
 * Get display information for a device type
 * @param deviceType - Device type key
 * @returns Display information (name, icon, description)
 * @example
 * const info = getDeviceDisplayInfo('SMS');
 * console.log(info.displayName); // 'SMS OTP'
 * console.log(info.icon); // '📱'
 */
export function getDeviceDisplayInfo(deviceType: DeviceConfigKey): {
	displayName: string;
	icon: string;
	description: string;
} {
	const config = getDeviceConfig(deviceType);
	return {
		displayName: config.displayName,
		icon: config.icon,
		description: config.description,
	};
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default deviceFlowConfigs;
