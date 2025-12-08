/**
 * @file mfaSuccessPageServiceV8.tsx
 * @module v8/flows/shared
 * @description Shared success page component and service for all MFA device types
 * @version 8.3.0
 * 
 * This service provides a unified success page component that works for all device types:
 * - SMS, EMAIL, TOTP, FIDO2, VOICE, WHATSAPP, etc.
 * 
 * The success page is displayed after:
 * - Device registration (for ACTIVE devices)
 * - Device activation/validation (for ACTIVATION_REQUIRED devices)
 * - Device authentication (for existing devices)
 */

import React from 'react';
import type { DeviceType, MFACredentials } from './MFATypes';
import type { MFAFlowBaseRenderProps } from './MFAFlowBaseV8';
import { getFullPhoneNumber } from '../controllers/SMSFlowController';

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
	return content[deviceType] || [
		'Device is ready for MFA challenges',
	];
};

/**
 * Unified MFA Success Page Component
 * Works for all device types
 */
export const MFASuccessPageV8: React.FC<MFASuccessPageProps> = ({ successData, credentials, onStartAgain }) => {
	const deviceTypeDisplay = getDeviceTypeDisplay(successData.deviceType);
	const contactInfo = getContactInfoDisplay(successData.deviceType, credentials, successData);
	const successMessage = getSuccessMessage(successData.deviceType, successData.deviceStatus);
	const whatsNext = getWhatsNextContent(successData.deviceType);

	return (
		<div className="step-content">
			<h2>MFA {successData.deviceStatus === 'ACTIVE' ? 'Registration' : 'Verification'} Complete</h2>
			<p>{successMessage}</p>

			<div className="success-box">
				<h3>✅ {successData.deviceStatus === 'ACTIVE' ? 'Registration' : 'Verification'} Successful</h3>
				
				{credentials.username && (
					<p>
						<strong>Username:</strong> {credentials.username}
					</p>
				)}
				
				{successData.userId && (
					<p>
						<strong>User ID:</strong> {successData.userId}
					</p>
				)}
				
				<p>
					<strong>Device ID:</strong> {successData.deviceId}
				</p>
				
				{successData.nickname && (
					<p>
						<strong>Nickname:</strong> {successData.nickname}
					</p>
				)}
				
				{contactInfo && (
					<p>
						<strong>
							{successData.deviceType === 'SMS' || successData.deviceType === 'VOICE' || successData.deviceType === 'WHATSAPP'
								? 'Phone Number'
								: successData.deviceType === 'EMAIL'
									? 'Email Address'
									: 'Contact Info'}
							:
						</strong>{' '}
						{contactInfo}
					</p>
				)}
				
				<p>
					<strong>Device Type:</strong> {deviceTypeDisplay}
				</p>
				
				<p>
					<strong>Status:</strong>{' '}
					{successData.verificationResult?.status || successData.deviceStatus || 'Verified'}
				</p>
				
				{successData.verificationResult?.message && (
					<p>
						<strong>Message:</strong> {successData.verificationResult.message}
					</p>
				)}
				
				{successData.environmentId && (
					<p>
						<strong>Environment ID:</strong> {successData.environmentId}
					</p>
				)}
				
				{successData.createdAt && (
					<p>
						<strong>Created At:</strong> {new Date(successData.createdAt).toLocaleString()}
					</p>
				)}
				
				{successData.updatedAt && (
					<p>
						<strong>Updated At:</strong> {new Date(successData.updatedAt).toLocaleString()}
					</p>
				)}
				
				{successData.fido2CredentialId && (
					<p style={{ marginTop: '12px', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
						<strong>Credential ID:</strong> {successData.fido2CredentialId.substring(0, 40)}...
					</p>
				)}
			</div>

			<div className="info-box">
				<h4>What's Next?</h4>
				<ul>
					{whatsNext.map((item, index) => (
						<li key={index}>{item}</li>
					))}
				</ul>
			</div>

			{onStartAgain && (
				<div style={{ marginTop: '24px', textAlign: 'center' }}>
					<button
						type="button"
						onClick={onStartAgain}
						style={{
							padding: '12px 24px',
							background: '#10b981',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '15px',
							fontWeight: '600',
							cursor: 'pointer',
							boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#059669';
							e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#10b981';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
						}}
					>
						Start Again
					</button>
				</div>
			)}
		</div>
	);
};

/**
 * Helper function to build success page data from MFA state and credentials
 */
export const buildSuccessPageData = (
	credentials: MFACredentials,
	mfaState: MFAFlowBaseRenderProps['mfaState']
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

