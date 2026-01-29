/**
 * @file deviceFlowConfigTypes.ts
 * @module v8/config
 * @description Type definitions for unified MFA device flow configurations
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Define types for configuration-driven device flows.
 * This enables a single UnifiedMFARegistrationFlowV8 component to handle
 * all device types (SMS, Email, Mobile, WhatsApp, TOTP, FIDO2) using
 * device-specific configurations instead of separate components.
 *
 * @example
 * const smsConfig: DeviceFlowConfig = {
 *   deviceType: 'SMS',
 *   displayName: 'SMS OTP',
 *   requiredFields: ['phoneNumber', 'countryCode'],
 *   validationRules: {
 *     phoneNumber: validatePhoneNumber,
 *     countryCode: validateCountryCode,
 *   },
 *   // ... more config
 * };
 */

import type { MFACredentials, MFAState } from '@/v8/flows/shared/MFATypes';
import type React from 'react';

/**
 * Device types supported by the unified flow
 */
export type DeviceConfigKey = 'SMS' | 'EMAIL' | 'MOBILE' | 'WHATSAPP' | 'TOTP' | 'FIDO2';

/**
 * Validation result for form fields
 */
export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validation function signature for device-specific fields
 */
export type ValidationFunction = (value: string) => ValidationResult;

/**
 * Props for device-specific custom components
 *
 * Used by TOTP (QR code) and FIDO2 (biometric prompt) flows
 * that need custom UI beyond standard form fields.
 */
export interface DeviceSpecificComponentProps {
	credentials: MFACredentials;
	mfaState: MFAState;
	onUpdate: (state: Partial<MFAState>) => void;
	onError: (error: string) => void;
	onSuccess: (data: any) => void;
}

/**
 * API endpoint configuration for device flows
 */
export interface DeviceApiEndpoints {
	/** Device registration endpoint (POST /devices) */
	register: string;

	/** Device activation endpoint (optional, for OTP-based devices) */
	activate?: string;

	/** Send OTP endpoint (optional) */
	sendOTP?: string;
}

/**
 * Documentation configuration for device flows
 */
export interface DeviceDocumentation {
	/** Page title (e.g., "SMS Device Registration API") */
	title: string;

	/** Short description for the documentation page */
	description: string;

	/** Optional full API documentation content (markdown or HTML) */
	apiDocContent?: string;

	/** Optional external documentation URL */
	externalDocsUrl?: string;
}

/**
 * Complete device flow configuration
 *
 * This configuration drives the entire flow for a device type,
 * eliminating the need for separate components per device.
 */
export interface DeviceFlowConfig {
	/** Device type identifier */
	deviceType: DeviceConfigKey;

	/** Display name shown in UI (e.g., "SMS OTP", "Email OTP") */
	displayName: string;

	/** Icon or emoji for the device type */
	icon: string;

	/** Short description of the device type */
	description: string;

	/** Educational content about this MFA method (markdown or HTML) */
	educationalContent?: string;

	/**
	 * Required form fields for this device type
	 *
	 * Examples:
	 * - SMS: ['phoneNumber', 'countryCode']
	 * - Email: ['email']
	 * - TOTP: [] (no additional fields beyond username)
	 */
	requiredFields: string[];

	/**
	 * Optional form fields for this device type
	 *
	 * Example: ['deviceName', 'nickname']
	 */
	optionalFields: string[];

	/**
	 * Validation rules for form fields
	 *
	 * Maps field name to validation function.
	 *
	 * @example
	 * validationRules: {
	 *   phoneNumber: validatePhoneNumber,
	 *   email: validateEmail,
	 * }
	 */
	validationRules: Record<string, ValidationFunction>;

	/**
	 * API endpoints for this device type
	 */
	apiEndpoints: DeviceApiEndpoints;

	/**
	 * Documentation configuration
	 */
	documentation: DeviceDocumentation;

	/**
	 * Device-specific custom component (optional)
	 *
	 * Used for complex flows like TOTP (QR code display)
	 * and FIDO2 (WebAuthn biometric prompt).
	 *
	 * If not provided, standard form rendering is used.
	 */
	customComponent?: React.ComponentType<DeviceSpecificComponentProps>;

	/**
	 * Device behavior flags
	 */

	/** Whether this device supports QR code registration (TOTP) */
	supportsQRCode?: boolean;

	/** Whether this device requires biometric authentication (FIDO2) */
	requiresBiometric?: boolean;

	/** Whether this device supports voice OTP (WhatsApp) */
	supportsVoice?: boolean;

	/** Whether OTP is required for activation */
	requiresOTP?: boolean;

	/**
	 * Default device status when created by admin
	 * Can be overridden by user choice in UI
	 */
	defaultDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';

	/**
	 * Additional device-specific metadata
	 */
	metadata?: Record<string, any>;
}

/**
 * Complete configuration map for all device types
 *
 * Will be implemented in deviceFlowConfigs.ts during Week 3
 */
export type DeviceFlowConfigMap = Record<DeviceConfigKey, DeviceFlowConfig>;

/**
 * Helper type for field value extraction
 */
export type DeviceFieldValues = Record<string, string>;

/**
 * Result of device registration API call
 */
export interface DeviceRegistrationResult {
	deviceId: string;
	userId: string;
	status: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	type: string;
	phone?: string;
	email?: string;
	nickname?: string;

	/** TOTP-specific data */
	totpResult?: {
		qrCode?: string;
		secret?: string;
		manualEntryKey?: string;
	};

	/** FIDO2-specific data */
	fido2Result?: {
		credentialId?: string;
		publicKey?: string;
		attestationObject?: string;
	};

	/** Activation link (HATEOAS) */
	_links?: {
		activate?: {
			href: string;
		};
	};
}

/**
 * Tab identifiers for unified flow navigation
 */
export type FlowTab = 'config' | 'device' | 'docs';

/**
 * Props for the unified MFA registration flow component
 */
export interface UnifiedMFAFlowProps {
	/** Device type to render the flow for */
	deviceType: DeviceConfigKey;

	/** Optional initial tab (defaults to 'config') */
	initialTab?: FlowTab;

	/** Optional callback when flow completes successfully */
	onSuccess?: (result: DeviceRegistrationResult) => void;

	/** Optional callback when flow is cancelled */
	onCancel?: () => void;
}
