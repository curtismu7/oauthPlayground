/**
 * @file mfaSuccessPageServiceV8.tsx
 * @module v8/flows/shared
 * @description Shared success page component and service for all MFA device types
 * @version 8.4.0
 *
 * This service provides a unified success page component that works for all device types:
 * - SMS, EMAIL, TOTP, FIDO2, VOICE, WHATSAPP, etc.
 *
 * The success page is displayed after:
 * - Device registration (for ACTIVE devices)
 * - Device activation/validation (for ACTIVATION_REQUIRED devices)
 * - Device authentication (for existing devices)
 *
 * NOTE: This service now uses the UnifiedMFASuccessPageV8 component from unifiedMFASuccessPageServiceV8
 */

import React from 'react';
import {
	type UnifiedMFASuccessPageData,
	UnifiedMFASuccessPageV8,
} from '@/v8/services/unifiedMFASuccessPageServiceV8';
import { getFullPhoneNumber } from '../controllers/SMSFlowController';
import type { MFAFlowBaseRenderProps } from './MFAFlowBaseV8';
import type { DeviceType, MFACredentials } from './MFATypes';

export interface MFASuccessPageData {
	deviceId: string;
	deviceType: DeviceType;
	deviceStatus: string;
	nickname?: string;
	username?: string;
	userId?: string;
	environmentId?: string;
	createdAt?: string;
	updatedAt?: string;
	verificationResult?: {
		status: string;
		message?: string;
	};
	// Device-specific fields
	phone?: string;
	email?: string;
	fido2CredentialId?: string;
	secret?: string;
	keyUri?: string;
	// Flow-specific context
	registrationFlowType?: 'admin' | 'user';
	adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	tokenType?: 'worker' | 'user';
}

export interface MFASuccessPageProps extends MFAFlowBaseRenderProps {
	successData: MFASuccessPageData;
	onStartAgain?: () => void;
}

/**
 * Get device type display name
 */
export const getDeviceTypeDisplay = (deviceType: DeviceType): string => {
	const displayNames: Record<string, string> = {
		SMS: 'SMS (Text Message)',
		EMAIL: 'Email',
		TOTP: 'TOTP (Authenticator App)',
		FIDO2: 'FIDO2 (Security Key / Passkey)',
		VOICE: 'Voice',
		WHATSAPP: 'WhatsApp',
		MOBILE: 'Mobile (PingID)',
		OATH_TOKEN: 'OATH Token (PingID)',
	};
	return displayNames[deviceType] || deviceType;
};

/**
 * Get contact info display for device
 */
export const getContactInfoDisplay = (
	deviceType: DeviceType,
	credentials: MFACredentials,
	successData: MFASuccessPageData
): string | null => {
	if (deviceType === 'SMS' || deviceType === 'VOICE' || deviceType === 'WHATSAPP') {
		return successData.phone || getFullPhoneNumber(credentials);
	} else if (deviceType === 'EMAIL') {
		return successData.email || credentials.email || null;
	}
	return null;
};

/**
 * Get success message based on device type and status
 */
export const getSuccessMessage = (deviceType: DeviceType, deviceStatus: string): string => {
	if (deviceStatus === 'ACTIVE') {
		return `Your ${getDeviceTypeDisplay(deviceType)} device has been registered and is ready to use.`;
	} else if (deviceStatus === 'ACTIVATION_REQUIRED') {
		return `Your ${getDeviceTypeDisplay(deviceType)} device has been successfully verified and activated.`;
	}
	return `Your ${getDeviceTypeDisplay(deviceType)} device has been successfully verified.`;
};

/**
 * Get "What's Next?" content based on device type
 */
export const getWhatsNextContent = (deviceType: DeviceType): string[] => {
	const content: Record<DeviceType, string[]> = {
		SMS: [
			'Device is ready for MFA challenges',
			'Users will receive OTP codes via SMS during authentication',
		],
		EMAIL: [
			'Device is ready for MFA challenges',
			'Users will receive OTP codes via email during authentication',
		],
		TOTP: [
			'Device is ready for MFA challenges',
			'Users will generate codes using their authenticator app',
		],
		FIDO2: [
			'Device is ready for MFA challenges',
			'Users will use their security key, Touch ID, Face ID, or Windows Hello during authentication',
		],
		VOICE: [
			'Device is ready for MFA challenges',
			'Users will receive voice calls with OTP codes during authentication',
		],
		WHATSAPP: [
			'Device is ready for MFA challenges',
			'Users will receive WhatsApp messages with OTP codes during authentication',
		],
		MOBILE: [
			'Device is ready for MFA challenges',
			'Users will use the PingID mobile app for authentication',
		],
		OATH_TOKEN: [
			'Device is ready for MFA challenges',
			'Users will use their OATH token for authentication',
		],
	};
	return content[deviceType] || ['Device is ready for MFA challenges'];
};

/**
 * Convert MFASuccessPageData to UnifiedMFASuccessPageData
 */
const convertToUnifiedData = (
	successData: MFASuccessPageData,
	credentials: MFACredentials,
	policyId?: string,
	policyName?: string,
	fidoPolicy?: { id?: string; name?: string; [key: string]: unknown }
): UnifiedMFASuccessPageData => {
	// Ensure deviceType is preserved - use successData.deviceType first, fallback to credentials.deviceType
	const deviceType = successData.deviceType || credentials.deviceType || 'SMS';

	// Debug logging for FIDO2
	if (deviceType === 'FIDO2' || successData.deviceType === 'FIDO2') {
		console.log('[MFASuccessPageV8] Converting FIDO2 success data:', {
			successDataDeviceType: successData.deviceType,
			credentialsDeviceType: credentials.deviceType,
			finalDeviceType: deviceType,
		});
	}

	return {
		flowType: 'registration',
		username: successData.username || credentials.username,
		userId: successData.userId,
		environmentId: successData.environmentId || credentials.environmentId,
		deviceId: successData.deviceId,
		deviceType: deviceType as DeviceType,
		deviceStatus: successData.deviceStatus,
		deviceNickname: successData.nickname,
		deviceName: successData.nickname,
		phone:
			successData.phone || (credentials.phoneNumber ? getFullPhoneNumber(credentials) : undefined),
		email: successData.email || credentials.email,
		policyId: policyId || credentials.deviceAuthenticationPolicyId,
		policyName: policyName,
		fidoPolicy: fidoPolicy,
		verificationResult: successData.verificationResult,
		responseData: {
			deviceId: successData.deviceId,
			deviceType: deviceType as DeviceType,
			deviceStatus: successData.deviceStatus,
			nickname: successData.nickname,
			createdAt: successData.createdAt,
			updatedAt: successData.updatedAt,
			verificationResult: successData.verificationResult,
			fido2CredentialId: successData.fido2CredentialId,
			secret: successData.secret,
			keyUri: successData.keyUri,
		},
		timestamp: successData.createdAt || successData.updatedAt || new Date().toISOString(),
		registrationFlowType: successData.registrationFlowType,
		adminDeviceStatus: successData.adminDeviceStatus,
		tokenType: successData.tokenType || credentials.tokenType,
		clientId: credentials.clientId,
	};
};

/**
 * Unified MFA Success Page Component
 * Works for all device types
 * Now uses the UnifiedMFASuccessPageV8 component
 */
export const MFASuccessPageV8: React.FC<MFASuccessPageProps> = ({
	successData,
	credentials,
	onStartAgain,
	...props
}) => {
	// Get policy information from credentials or props
	const policyId = credentials.deviceAuthenticationPolicyId;
	const policyName = (props as { policyName?: string }).policyName;
	const fidoPolicy = (
		props as { fidoPolicy?: { id?: string; name?: string; [key: string]: unknown } }
	).fidoPolicy;

	const unifiedData = convertToUnifiedData(
		successData,
		credentials,
		policyId,
		policyName,
		fidoPolicy
	);

	return <UnifiedMFASuccessPageV8 data={unifiedData} onStartAgain={onStartAgain} />;
};

/**
 * Helper function to build success page data from MFA state and credentials
 */
export const buildSuccessPageData = (
	credentials: MFACredentials,
	mfaState: MFAFlowBaseRenderProps['mfaState'],
	registrationFlowType?: 'admin' | 'user',
	adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED',
	tokenType?: 'worker' | 'user'
): MFASuccessPageData => {
	return {
		deviceId: mfaState.deviceId || '',
		deviceType: credentials.deviceType || 'SMS',
		deviceStatus: mfaState.deviceStatus || 'ACTIVE',
		nickname: mfaState.nickname,
		username: credentials.username,
		userId: mfaState.userId,
		environmentId: mfaState.environmentId || credentials.environmentId,
		createdAt: mfaState.createdAt,
		updatedAt: mfaState.updatedAt,
		verificationResult: mfaState.verificationResult,
		phone: credentials.phoneNumber ? getFullPhoneNumber(credentials) : undefined,
		email: credentials.email,
		fido2CredentialId: mfaState.fido2CredentialId,
		secret: mfaState.secret,
		keyUri: mfaState.keyUri,
		registrationFlowType,
		adminDeviceStatus,
		tokenType,
	};
};

/**
 * Helper function to check if we should show success page
 */
export const shouldShowSuccessPage = (mfaState: MFAFlowBaseRenderProps['mfaState']): boolean => {
	return (
		mfaState.verificationResult?.status === 'COMPLETED' ||
		mfaState.deviceStatus === 'ACTIVE' ||
		!!mfaState.deviceId
	);
};

/**
 * Helper function to navigate to success page
 * Returns the step number that should show the success page
 */
export const getSuccessPageStep = (deviceType: DeviceType): number => {
	// SMS and Email use step 4 (after validation)
	// TOTP and FIDO2 use step 3 (after activation/registration)
	if (deviceType === 'SMS' || deviceType === 'EMAIL') {
		return 4;
	}
	return 3;
};
