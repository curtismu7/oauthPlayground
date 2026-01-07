/**
 * @file unifiedMFASuccessPageServiceV8.tsx
 * @module v8/services
 * @description Unified success page service for all MFA flows (registration and authentication)
 * @version 8.4.0
 *
 * This service provides a unified success page component that works for:
 * - All device types: SMS, EMAIL, TOTP, FIDO2, VOICE, WHATSAPP, etc.
 * - Both registration and authentication flows
 *
 * Features:
 * - Device type display
 * - Contact info (email, phone)
 * - Collapsed JSON response
 * - User ID and username
 * - FIDO policy information (if applicable)
 */

import React, { useEffect, useState } from 'react';
import {
	FiBook,
	FiCheck,
	FiChevronDown,
	FiChevronUp,
	FiCopy,
	FiHome,
	FiInfo,
	FiShield,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
	ApiDisplayCheckbox,
	SuperSimpleApiDisplayV8,
} from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { DeviceType } from '../flows/shared/MFATypes';

export interface UnifiedMFASuccessPageData {
	// Flow type
	flowType: 'registration' | 'authentication';

	// User information
	username?: string;
	userId?: string;
	environmentId?: string;

	// Device information
	deviceId?: string;
	deviceType?: DeviceType | string;
	deviceStatus?: string;
	deviceNickname?: string;
	deviceName?: string;
	phone?: string;
	email?: string;

	// Policy information
	policyId?: string;
	policyName?: string;
	fidoPolicy?: {
		id?: string;
		name?: string;
		[key: string]: unknown;
	};

	// Authentication/Registration result
	completionResult?: {
		accessToken?: string;
		tokenType?: string;
		expiresIn?: number;
		scope?: string;
		status?: string;
		message?: string;
		[key: string]: unknown;
	};

	// Verification result (for registration flows)
	verificationResult?: {
		status: string;
		message?: string;
		[key: string]: unknown;
	};

	// Transaction details
	authenticationId?: string | null;
	challengeId?: string | null;
	timestamp?: string;
	deviceSelectionBehavior?: string;

	// Additional response data (for JSON display)
	responseData?: Record<string, unknown>;

	// Flow-specific context for documentation
	registrationFlowType?: 'admin' | 'user';
	adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	tokenType?: 'worker' | 'user';
	clientId?: string; // For Authorization Code Flow documentation
}

export interface UnifiedMFASuccessPageProps {
	data: UnifiedMFASuccessPageData;
	onStartAgain?: () => void;
}

/**
 * Get device type display name
 */
export const getDeviceTypeDisplay = (deviceType?: DeviceType | string): string => {
	if (!deviceType) return 'Unknown';

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
 * Unified MFA Success Page Component
 * Works for all device types and both registration/authentication flows
 */
export const UnifiedMFASuccessPageV8: React.FC<UnifiedMFASuccessPageProps> = ({
	data,
	onStartAgain,
}) => {
	const navigate = useNavigate();
	const [jsonExpanded, setJsonExpanded] = useState(false);
	const [apiDisplayVisible, setApiDisplayVisible] = useState(apiDisplayServiceV8.isVisible());

	const {
		flowType,
		username,
		userId,
		environmentId,
		deviceId,
		deviceType,
		deviceStatus,
		deviceNickname,
		deviceName,
		phone,
		email,
		policyId,
		policyName,
		fidoPolicy,
		completionResult,
		verificationResult,
		authenticationId,
		challengeId,
		timestamp,
		deviceSelectionBehavior,
		responseData,
	} = data;

	const deviceTypeDisplay = getDeviceTypeDisplay(deviceType);
	const contactInfo = phone || email;
	const contactLabel = phone ? 'Phone' : email ? 'Email' : null;

	// Subscribe to API display visibility changes to adjust bottom padding
	useEffect(() => {
		const unsubscribe = apiDisplayServiceV8.subscribe((isVisible) => {
			setApiDisplayVisible(isVisible);
		});
		return unsubscribe;
	}, []);

	// Calculate bottom padding based on API display visibility
	// API display max height is 400px (when there are calls) or 180px (when empty)
	// Add extra padding to ensure buttons are fully visible
	const bottomPadding = apiDisplayVisible ? '500px' : '24px';

	const handleCopyToken = () => {
		if (completionResult?.accessToken) {
			navigator.clipboard.writeText(completionResult.accessToken);
			toastV8.success('Access token copied to clipboard');
		}
	};

	const handleGoHome = () => {
		if (onStartAgain) {
			onStartAgain();
		} else {
			navigate('/v8/mfa-hub');
		}
	};

	const handleGoToAuthentication = () => {
		navigate('/v8/mfa-hub');
	};

	const handleGoToDocumentation = () => {
		// Map device type to documentation route
		const docsRouteMap: Record<string, string> = {
			SMS: '/v8/mfa/register/sms/docs',
			EMAIL: '/v8/mfa/register/email/docs',
			WHATSAPP: '/v8/mfa/register/whatsapp/docs',
			VOICE: '/v8/mfa/register/sms/docs', // Voice uses SMS flow
			FIDO2: '/v8/mfa/register/fido2/docs',
		};

		const route = docsRouteMap[deviceType as string] || '/v8/mfa/register/sms/docs';

		// Pass flow-specific data via location.state for documentation page
		navigate(route, {
			state: {
				registrationFlowType: data.registrationFlowType,
				adminDeviceStatus: data.adminDeviceStatus,
				tokenType: data.tokenType,
				environmentId: data.environmentId,
				userId: data.userId,
				deviceId: data.deviceId,
				policyId: data.policyId,
				deviceStatus: data.deviceStatus,
				username: data.username,
				clientId: data.clientId,
				phone: data.phone,
				email: data.email,
				deviceName: data.deviceName || data.deviceNickname,
			},
		});
	};

	// Show documentation button for all registration flows that have documentation
	// Also show for FIDO2 authentication flows (FIDO2 has both registration and authentication docs)
	// Normalize deviceType to string for comparison
	const deviceTypeStr = String(deviceType || '').toUpperCase();
	const hasDocumentation =
		deviceTypeStr && ['SMS', 'EMAIL', 'WHATSAPP', 'VOICE', 'FIDO2'].includes(deviceTypeStr);
	// Show button for registration flows OR FIDO2 authentication flows
	const showDocumentationButton = hasDocumentation && (flowType === 'registration' || (flowType === 'authentication' && deviceTypeStr === 'FIDO2'));
	
	// Debug logging for FIDO2 documentation button
	if (deviceTypeStr === 'FIDO2' || deviceType === 'FIDO2') {
		console.log('[UnifiedMFASuccessPageV8] FIDO2 documentation button check:', {
			deviceType,
			deviceTypeStr,
			flowType,
			hasDocumentation,
			showDocumentationButton,
			deviceTypeIncluded: ['SMS', 'EMAIL', 'WHATSAPP', 'VOICE', 'FIDO2'].includes(deviceTypeStr),
		});
	}

	// Build JSON response for display
	const jsonResponse = responseData || completionResult || verificationResult || {};

	return (
		<div
			style={{
				padding: '24px',
				paddingBottom: bottomPadding,
				maxWidth: '900px',
				margin: '0 auto',
				minHeight: '100vh',
			}}
		>
			{/* Top Navigation - Back to Hub Button */}
			<div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<button
					type="button"
					onClick={handleGoHome}
					style={{
						padding: '10px 20px',
						fontSize: '14px',
						fontWeight: '600',
						borderRadius: '8px',
						border: '1px solid #10b981',
						background: '#10b981',
						color: 'white',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
					}}
				>
					<FiHome />
					Back to MFA Hub
				</button>
				<ApiDisplayCheckbox />
			</div>

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />

			{/* Celebratory Header */}
			<div
				style={{
					textAlign: 'center',
					marginBottom: '32px',
					padding: '32px',
					background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
					borderRadius: '16px',
					color: 'white',
					boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
				}}
			>
				<div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
				<h1
					style={{
						margin: '0 0 12px 0',
						fontSize: '32px',
						fontWeight: '700',
						color: 'white',
					}}
				>
					{flowType === 'authentication'
						? 'Authentication Successful!'
						: 'Registration Successful!'}
				</h1>
				<p
					style={{
						margin: '0',
						fontSize: '18px',
						opacity: 0.95,
						fontWeight: '500',
					}}
				>
					Your MFA {flowType === 'authentication' ? 'authentication' : 'device registration'} has
					been completed successfully
				</p>
			</div>

			{/* Success Confirmation Card */}
			<div
				style={{
					background: '#f0fdf4',
					border: '2px solid #10b981',
					borderRadius: '12px',
					padding: '24px',
					marginBottom: '24px',
					boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
					<div
						style={{
							width: '48px',
							height: '48px',
							borderRadius: '12px',
							background: '#10b981',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<FiCheck style={{ color: 'white', fontSize: '24px' }} />
					</div>
					<div>
						<h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#065f46' }}>
							{flowType === 'authentication' ? 'Verification Complete' : 'Registration Complete'}
						</h3>
						<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#047857' }}>
							{flowType === 'authentication'
								? 'Your authentication has been verified and tokens have been issued'
								: 'Your device has been registered and is ready to use'}
						</p>
					</div>
				</div>
			</div>

			{/* Device Summary Card */}
			{(deviceType || deviceId || contactInfo) && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '20px',
						marginBottom: '24px',
						boxShadow: '0 2px 6px rgba(15, 118, 110, 0.08)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
						<div
							style={{
								width: '40px',
								height: '40px',
								borderRadius: '10px',
								background: '#ecfdf5',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#047857',
							}}
						>
							<FiInfo />
						</div>
						<div>
							<h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#065f46' }}>
								Device Information
							</h3>
							<p style={{ margin: '4px 0 0', color: '#047857', fontSize: '14px' }}>
								{deviceTypeDisplay} device details
							</p>
						</div>
					</div>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
							gap: '16px',
						}}
					>
						{deviceType && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										textTransform: 'uppercase',
										letterSpacing: '0.5px',
										marginBottom: '6px',
									}}
								>
									Device Type
								</div>
								<div
									style={{
										background: '#f9fafb',
										padding: '10px 12px',
										borderRadius: '8px',
										border: '1px solid #e5e7eb',
										fontWeight: 600,
									}}
								>
									{deviceTypeDisplay}
								</div>
							</div>
						)}
						{contactInfo && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										textTransform: 'uppercase',
										letterSpacing: '0.5px',
										marginBottom: '6px',
									}}
								>
									{contactLabel}
								</div>
								<div
									style={{
										background: '#eef2ff',
										padding: '10px 12px',
										borderRadius: '8px',
										border: '1px solid #c7d2fe',
										fontWeight: 600,
									}}
								>
									{contactInfo}
								</div>
							</div>
						)}
						{(deviceNickname || deviceName) && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										textTransform: 'uppercase',
										letterSpacing: '0.5px',
										marginBottom: '6px',
									}}
								>
									Device Name
								</div>
								<div
									style={{
										background: '#f9fafb',
										padding: '10px 12px',
										borderRadius: '8px',
										border: '1px solid #e5e7eb',
										fontWeight: 600,
									}}
								>
									{deviceNickname || deviceName}
								</div>
							</div>
						)}
						{deviceStatus && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										textTransform: 'uppercase',
										letterSpacing: '0.5px',
										marginBottom: '6px',
									}}
								>
									Device Status
								</div>
								<div
									style={{
										background: deviceStatus === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
										border: `1px solid ${deviceStatus === 'ACTIVE' ? '#86efac' : '#fcd34d'}`,
										padding: '10px 12px',
										borderRadius: '8px',
										fontWeight: 600,
										color: deviceStatus === 'ACTIVE' ? '#166534' : '#92400e',
									}}
								>
									{deviceStatus}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Token Information Card (for authentication flows) */}
			{completionResult && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<h4
						style={{
							margin: '0 0 20px 0',
							fontSize: '18px',
							fontWeight: '600',
							color: '#1f2937',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						🔑 Access Token Information
					</h4>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
							gap: '16px',
						}}
					>
						{completionResult.accessToken && (
							<div
								style={{
									background: '#f9fafb',
									padding: '16px',
									borderRadius: '8px',
									border: '1px solid #e5e7eb',
									gridColumn: '1 / -1',
								}}
							>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										marginBottom: '8px',
									}}
								>
									<span
										style={{
											fontSize: '12px',
											color: '#6b7280',
											fontWeight: '600',
											textTransform: 'uppercase',
											letterSpacing: '0.5px',
										}}
									>
										Access Token
									</span>
									<button
										type="button"
										onClick={handleCopyToken}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '4px',
											padding: '4px 8px',
											background: '#3b82f6',
											color: 'white',
											border: 'none',
											borderRadius: '4px',
											cursor: 'pointer',
											fontSize: '12px',
											fontWeight: '500',
										}}
									>
										<FiCopy size={14} />
										Copy
									</button>
								</div>
								<div
									style={{
										fontSize: '13px',
										color: '#1f2937',
										fontFamily: 'monospace',
										background: 'white',
										padding: '12px',
										borderRadius: '6px',
										wordBreak: 'break-all',
										border: '1px solid #e5e7eb',
									}}
								>
									{completionResult.accessToken}
								</div>
							</div>
						)}
						{completionResult.tokenType && (
							<div
								style={{
									background: '#f9fafb',
									padding: '16px',
									borderRadius: '8px',
									border: '1px solid #e5e7eb',
								}}
							>
								<span
									style={{
										fontSize: '12px',
										color: '#6b7280',
										fontWeight: '600',
										textTransform: 'uppercase',
										letterSpacing: '0.5px',
									}}
								>
									Token Type
								</span>
								<div
									style={{
										fontSize: '16px',
										color: '#1f2937',
										fontWeight: '500',
										marginTop: '8px',
									}}
								>
									{completionResult.tokenType}
								</div>
							</div>
						)}
						{completionResult.expiresIn && (
							<div
								style={{
									background: '#f9fafb',
									padding: '16px',
									borderRadius: '8px',
									border: '1px solid #e5e7eb',
								}}
							>
								<span
									style={{
										fontSize: '12px',
										color: '#6b7280',
										fontWeight: '600',
										textTransform: 'uppercase',
										letterSpacing: '0.5px',
									}}
								>
									Expires In
								</span>
								<div
									style={{
										fontSize: '16px',
										color: '#1f2937',
										fontWeight: '500',
										marginTop: '8px',
									}}
								>
									{completionResult.expiresIn} seconds
								</div>
								{timestamp && (
									<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
										Expires:{' '}
										{new Date(
											new Date(timestamp).getTime() + completionResult.expiresIn * 1000
										).toLocaleString()}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			{/* User and Authentication Details Card */}
			{(username || userId || environmentId || policyName || fidoPolicy) && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<h4
						style={{
							margin: '0 0 20px 0',
							fontSize: '18px',
							fontWeight: '600',
							color: '#1f2937',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						👤 {flowType === 'authentication' ? 'Authentication Details' : 'Registration Details'}
					</h4>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
							gap: '16px',
						}}
					>
						{username && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Username
								</div>
								<div
									style={{
										fontSize: '14px',
										fontWeight: '500',
										color: '#1f2937',
										padding: '8px 12px',
										background: '#f9fafb',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{username}
								</div>
							</div>
						)}
						{userId && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									User ID
								</div>
								<div
									style={{
										fontSize: '14px',
										fontWeight: '500',
										color: '#1f2937',
										fontFamily: 'monospace',
										wordBreak: 'break-all',
										padding: '8px 12px',
										background: '#f9fafb',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{userId}
								</div>
							</div>
						)}
						{environmentId && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Environment ID
								</div>
								<div
									style={{
										fontSize: '14px',
										fontWeight: '500',
										color: '#1f2937',
										fontFamily: 'monospace',
										wordBreak: 'break-all',
										padding: '8px 12px',
										background: '#f9fafb',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{environmentId}
								</div>
							</div>
						)}
						{policyName && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Policy Used
								</div>
								<div
									style={{
										fontSize: '14px',
										fontWeight: '500',
										color: '#1f2937',
										padding: '8px 12px',
										background: '#dcfce7',
										borderRadius: '6px',
										border: '1px solid #86efac',
									}}
								>
									{policyName}
								</div>
							</div>
						)}
						{policyId && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Policy ID
								</div>
								<div
									style={{
										fontSize: '13px',
										fontWeight: '500',
										color: '#1f2937',
										fontFamily: 'monospace',
										wordBreak: 'break-all',
										padding: '8px 12px',
										background: '#f9fafb',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{policyId}
								</div>
							</div>
						)}
						{fidoPolicy && (
							<div style={{ gridColumn: '1 / -1' }}>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									FIDO Policy
								</div>
								<div
									style={{
										fontSize: '14px',
										fontWeight: '500',
										color: '#1f2937',
										padding: '8px 12px',
										background: '#fef3c7',
										borderRadius: '6px',
										border: '1px solid #fcd34d',
									}}
								>
									{fidoPolicy.name || fidoPolicy.id || 'FIDO Policy'}
									{fidoPolicy.id && (
										<div
											style={{
												fontSize: '12px',
												color: '#6b7280',
												marginTop: '4px',
												fontFamily: 'monospace',
											}}
										>
											ID: {fidoPolicy.id}
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Transaction Details Card */}
			{(authenticationId || challengeId || timestamp || deviceId) && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<h4
						style={{
							margin: '0 0 20px 0',
							fontSize: '18px',
							fontWeight: '600',
							color: '#1f2937',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						📋 Transaction Details
					</h4>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
							gap: '16px',
							padding: '16px',
							background: '#f9fafb',
							borderRadius: '8px',
							border: '1px solid #e5e7eb',
						}}
					>
						{deviceId && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Device ID
								</div>
								<div
									style={{
										fontSize: '13px',
										color: '#1f2937',
										fontFamily: 'monospace',
										wordBreak: 'break-all',
										padding: '8px 12px',
										background: 'white',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{deviceId}
								</div>
							</div>
						)}
						{authenticationId && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Authentication ID
								</div>
								<div
									style={{
										fontSize: '13px',
										color: '#1f2937',
										fontFamily: 'monospace',
										wordBreak: 'break-all',
										padding: '8px 12px',
										background: 'white',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{authenticationId}
								</div>
							</div>
						)}
						{challengeId && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Challenge ID
								</div>
								<div
									style={{
										fontSize: '13px',
										color: '#1f2937',
										fontFamily: 'monospace',
										wordBreak: 'break-all',
										padding: '8px 12px',
										background: 'white',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{challengeId}
								</div>
							</div>
						)}
						{timestamp && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Transaction Time
								</div>
								<div
									style={{
										fontSize: '14px',
										color: '#1f2937',
										padding: '8px 12px',
										background: 'white',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}
								>
									{new Date(timestamp).toLocaleString()}
								</div>
							</div>
						)}
						{(completionResult?.status || verificationResult?.status) && (
							<div>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Status
								</div>
								<div
									style={{
										fontSize: '14px',
										color:
											(completionResult?.status || verificationResult?.status) === 'COMPLETED'
												? '#166534'
												: '#92400e',
										fontWeight: '500',
										padding: '8px 12px',
										background:
											(completionResult?.status || verificationResult?.status) === 'COMPLETED'
												? '#dcfce7'
												: '#fef3c7',
										borderRadius: '6px',
										border: `1px solid ${(completionResult?.status || verificationResult?.status) === 'COMPLETED' ? '#86efac' : '#fbbf24'}`,
									}}
								>
									{completionResult?.status || verificationResult?.status}
								</div>
							</div>
						)}
						{(completionResult?.message || verificationResult?.message) && (
							<div style={{ gridColumn: '1 / -1' }}>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '6px',
										fontWeight: '500',
									}}
								>
									Message
								</div>
								<div
									style={{
										fontSize: '14px',
										color: '#1f2937',
										fontWeight: '500',
										padding: '12px 16px',
										background: '#f0fdf4',
										borderRadius: '6px',
										border: '1px solid #86efac',
										lineHeight: '1.5',
									}}
								>
									{completionResult?.message || verificationResult?.message}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* JSON Response Card (Collapsed) */}
			{Object.keys(jsonResponse).length > 0 && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<button
						type="button"
						onClick={() => setJsonExpanded(!jsonExpanded)}
						style={{
							width: '100%',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							background: 'transparent',
							border: 'none',
							cursor: 'pointer',
							padding: '0',
							marginBottom: jsonExpanded ? '16px' : '0',
						}}
					>
						<h4
							style={{
								margin: 0,
								fontSize: '18px',
								fontWeight: '600',
								color: '#1f2937',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							📄 Response Data (JSON)
						</h4>
						{jsonExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
					</button>
					{jsonExpanded && (
						<div
							style={{
								background: '#f9fafb',
								padding: '16px',
								borderRadius: '8px',
								border: '1px solid #e5e7eb',
								overflow: 'auto',
								maxHeight: '400px',
							}}
						>
							<pre
								style={{
									margin: 0,
									fontSize: '12px',
									fontFamily: 'monospace',
									color: '#1f2937',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
								}}
							>
								{JSON.stringify(jsonResponse, null, 2)}
							</pre>
						</div>
					)}
				</div>
			)}

			{/* Device Selection Behavior (for authentication flows) */}
			{deviceSelectionBehavior && flowType === 'authentication' && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<h4
						style={{
							margin: '0 0 20px 0',
							fontSize: '18px',
							fontWeight: '600',
							color: '#1f2937',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						⚙️ Device Selection Behavior
					</h4>
					<div
						style={{
							padding: '16px',
							background: '#f0f9ff',
							borderRadius: '8px',
							border: '1px solid #bae6fd',
						}}
					>
						<div style={{ marginBottom: '12px' }}>
							<div
								style={{
									fontSize: '12px',
									color: '#6b7280',
									marginBottom: '6px',
									fontWeight: '600',
									textTransform: 'uppercase',
									letterSpacing: '0.5px',
								}}
							>
								Policy Setting
							</div>
							<div
								style={{
									fontSize: '14px',
									color: '#1f2937',
									fontWeight: '600',
									padding: '8px 12px',
									background: 'white',
									borderRadius: '6px',
									border: '1px solid #bae6fd',
									display: 'inline-block',
								}}
							>
								{deviceSelectionBehavior === 'DEFAULT_TO_FIRST' && 'Default to First Device'}
								{deviceSelectionBehavior === 'PROMPT_TO_SELECT_DEVICE' && 'Prompt to Select Device'}
								{deviceSelectionBehavior === 'ALWAYS_DISPLAY_DEVICES' && 'Always Display Devices'}
								{![
									'DEFAULT_TO_FIRST',
									'PROMPT_TO_SELECT_DEVICE',
									'ALWAYS_DISPLAY_DEVICES',
								].includes(deviceSelectionBehavior) && deviceSelectionBehavior}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div
				style={{
					display: 'flex',
					gap: '12px',
					justifyContent: 'center',
					marginTop: '32px',
					flexWrap: 'wrap',
				}}
			>
				<button
					type="button"
					onClick={handleGoHome}
					style={{
						padding: '12px 24px',
						fontSize: '16px',
						fontWeight: '600',
						borderRadius: '8px',
						border: '1px solid #10b981',
						background: '#10b981',
						color: 'white',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
					}}
				>
					<FiHome />
					Back to MFA Hub
				</button>
				{/* Show Documentation button for registration flows and FIDO2 authentication flows */}
				{showDocumentationButton && (
					<button
						type="button"
						onClick={handleGoToDocumentation}
						style={{
							padding: '12px 24px',
							fontSize: '16px',
							fontWeight: '600',
							borderRadius: '8px',
							border: '1px solid #f59e0b',
							background: '#f59e0b',
							color: 'white',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<FiBook />
						View Documentation
					</button>
				)}
				{/* Show Authentication button only for registration flows */}
				{flowType === 'registration' && (
					<button
						type="button"
						onClick={handleGoToAuthentication}
						style={{
							padding: '12px 24px',
							fontSize: '16px',
							fontWeight: '600',
							borderRadius: '8px',
							border: '1px solid #3b82f6',
							background: '#3b82f6',
							color: 'white',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<FiShield />
						Authentication
					</button>
				)}
			</div>

			{/* API Display Toggle - Bottom */}
			<div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end' }}>
				<ApiDisplayCheckbox />
			</div>
		</div>
	);
};
