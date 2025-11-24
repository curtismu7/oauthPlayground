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
			description: 'Enrolling a device registers it with PingOne MFA so it can be used for authentication. Users can have multiple enrolled devices for backup and convenience.',
			learnMoreUrl: 'https://docs.pingidentity.com/r/en-us/pingone/p1_t_add_mfa_device',
		},
		
		'device.selection': {
			title: 'Device Selection',
			description: 'If you have multiple MFA devices enrolled, you can choose which one to use for authentication. This provides flexibility and backup options if one device is unavailable.',
		},
		
		'device.nickname': {
			title: 'Device Nickname',
			description: 'Give your device a friendly name like "My Work Phone" or "Personal iPhone" to easily identify it later. This is especially helpful when managing multiple devices.',
		},
		
		'device.status': {
			title: 'Device Status',
			description: 'Device status indicates whether a device is active and ready to use. Status values include: ACTIVE (ready to use), PENDING (awaiting verification), SUSPENDED (temporarily disabled), or EXPIRED (needs re-enrollment).',
		},
		
		'device.limit': {
			title: 'Device Limit',
			description: 'PingOne MFA enforces a maximum number of devices per user (typically 5-15 depending on configuration). This prevents abuse while allowing reasonable backup options.',
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
			{ key: 'TOTP', content: MFAEducationServiceV8.getContent('factor.totp') },
			{ key: 'FIDO2', content: MFAEducationServiceV8.getContent('factor.fido2') },
		];
	}
}

export default MFAEducationServiceV8;
