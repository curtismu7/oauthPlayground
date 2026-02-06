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
	FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
	ApiDisplayCheckbox,
	SuperSimpleApiDisplayV8,
} from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { TokenDisplayServiceV8 } from '@/v8/services/tokenDisplayServiceV8';
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
/**
 * Decode JWT token (without verification) to extract payload
 */
const decodeJWT = (token: string): Record<string, unknown> | null => {
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
				.join('')
		);
		return JSON.parse(jsonPayload);
	} catch (error) {
		console.error('Failed to decode JWT:', error);
		return null;
	}
};

/**
 * Fetch user info from PingOne userinfo endpoint via backend proxy
 */
const fetchUserInfo = async (
	environmentId: string,
	accessToken: string
): Promise<Record<string, unknown> | null> => {
	try {
		const userInfoEndpoint = `https://auth.pingone.com/${environmentId}/as/userinfo`;
		const proxyEndpoint = '/api/pingone/userinfo';

		const response = await fetch(proxyEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				userInfoEndpoint,
				accessToken,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.warn(
				'UserInfo request failed:',
				response.status,
				errorData.message || errorData.error
			);
			return null;
		}

		const userInfo = await response.json();
		return userInfo;
	} catch (error) {
		console.error('Failed to fetch user info:', error);
		return null;
	}
};

export const UnifiedMFASuccessPageV8: React.FC<UnifiedMFASuccessPageProps> = ({
	data,
	onStartAgain,
}) => {
	const navigate = useNavigate();
	const [jsonExpanded, setJsonExpanded] = useState(false);
	const [apiDisplayVisible, setApiDisplayVisible] = useState(apiDisplayServiceV8.isVisible());
	const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
	const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);
	const [tokenCopied, setTokenCopied] = useState(false);

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

	// Fetch user info when access token is available (for authentication flows)
	useEffect(() => {
		const loadUserInfo = async () => {
			// Only fetch for authentication flows with access token
			if (flowType === 'authentication' && completionResult?.accessToken && environmentId) {
				setIsLoadingUserInfo(true);
				try {
					// Try to decode ID token first if available (from completionResult)
					const idToken = completionResult.idToken as string | undefined;
					if (idToken) {
						const decoded = decodeJWT(idToken);
						if (decoded?.sub) {
							setUserInfo(decoded);
							setIsLoadingUserInfo(false);
							return;
						}
					}

					// Fallback to userinfo endpoint
					const info = await fetchUserInfo(environmentId, completionResult.accessToken);
					if (info) {
						setUserInfo(info);
					}
				} catch (error) {
					console.error('Failed to load user info:', error);
				} finally {
					setIsLoadingUserInfo(false);
				}
			}
		};

		loadUserInfo();
	}, [flowType, completionResult?.accessToken, completionResult?.idToken, environmentId]);

	const handleCopyToken = async () => {
		if (completionResult?.accessToken) {
			const success = await TokenDisplayServiceV8.copyToClipboard(
				completionResult.accessToken,
				'Access Token'
			);
			if (success) {
				setTokenCopied(true);
				toastV8.success('Access token copied to clipboard!');
				setTimeout(() => setTokenCopied(false), 2000);
			} else {
				toastV8.error('Failed to copy access token');
			}
		}
	};

	const handleGoHome = () => {
		if (onStartAgain) {
			onStartAgain();
		} else {
			navigate('/v8/unified-mfa');
		}
	};

	const handleGoToAuthentication = () => {
		navigate('/v8/unified-mfa');
	};

	const handleGoToDocumentation = () => {
		// Map device type to documentation route
		const docsRouteMap: Record<string, string> = {
			SMS: '/v8/mfa/register/sms/docs',
			EMAIL: '/v8/mfa/register/email/docs',
			WHATSAPP: '/v8/mfa/register/whatsapp/docs',
			VOICE: '/v8/mfa/register/sms/docs', // Voice uses SMS flow
			FIDO2: '/v8/mfa/register/fido2/docs',
			TOTP: '/v8/mfa/register/totp/docs',
			MOBILE: '/v8/mfa/register/mobile/docs',
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
		deviceTypeStr &&
		['SMS', 'EMAIL', 'WHATSAPP', 'VOICE', 'FIDO2', 'TOTP', 'MOBILE'].includes(deviceTypeStr);
	// Show button for registration flows OR FIDO2 authentication flows
	const showDocumentationButton =
		hasDocumentation &&
		(flowType === 'registration' || (flowType === 'authentication' && deviceTypeStr === 'FIDO2'));

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
			<div
				style={{
					marginBottom: '24px',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
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

				{/* Callback Processed Section (for authentication flows) */}
				{flowType === 'authentication' && completionResult?.accessToken && (
					<div
						style={{
							background: '#dcfce7',
							border: '1px solid #86efac',
							borderRadius: '8px',
							padding: '16px',
							marginTop: '16px',
						}}
					>
						<div
							style={{
								fontSize: '14px',
								fontWeight: '600',
								color: '#166534',
								marginBottom: '12px',
							}}
						>
							Callback Processed
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<FiCheck size={16} color="#10b981" />
								<span style={{ fontSize: '14px', color: '#166534' }}>
									MFA authentication completed
								</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<FiCheck size={16} color="#10b981" />
								<span style={{ fontSize: '14px', color: '#166534' }}>Access token received</span>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* User Information Section (for authentication flows with access token) */}
			{flowType === 'authentication' && completionResult?.accessToken && (
				<div
					style={{
						background: '#eff6ff',
						border: '1px solid #93c5fd',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
						<FiUser size={24} color="#3b82f6" />
						<h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e40af' }}>
							User Information
						</h3>
					</div>

					{isLoadingUserInfo ? (
						<p style={{ margin: 0, color: '#6b7280' }}>Loading user information...</p>
					) : userInfo ? (
						<div style={{ display: 'grid', gap: '12px' }}>
							{userInfo.username && (
								<div>
									<strong style={{ color: '#374151' }}>Username:</strong>{' '}
									<span style={{ color: '#6b7280' }}>{String(userInfo.username)}</span>
								</div>
							)}
							{userInfo.preferred_username && !userInfo.username && (
								<div>
									<strong style={{ color: '#374151' }}>Username:</strong>{' '}
									<span style={{ color: '#6b7280' }}>{String(userInfo.preferred_username)}</span>
								</div>
							)}
							{userInfo.email && (
								<div>
									<strong style={{ color: '#374151' }}>Email:</strong>{' '}
									<span style={{ color: '#6b7280' }}>{String(userInfo.email)}</span>
									{userInfo.email_verified !== undefined && (
										<span
											style={{
												marginLeft: '8px',
												padding: '2px 8px',
												borderRadius: '4px',
												fontSize: '12px',
												background: userInfo.email_verified ? '#d1fae5' : '#fee2e2',
												color: userInfo.email_verified ? '#065f46' : '#991b1b',
											}}
										>
											{userInfo.email_verified ? 'Verified' : 'Unverified'}
										</span>
									)}
								</div>
							)}
							{userInfo.name && (
								<div>
									<strong style={{ color: '#374151' }}>Name:</strong>{' '}
									<span style={{ color: '#6b7280' }}>{String(userInfo.name)}</span>
								</div>
							)}
							{(userInfo.given_name || userInfo.family_name) && (
								<div>
									<strong style={{ color: '#374151' }}>Full Name:</strong>{' '}
									<span style={{ color: '#6b7280' }}>
										{[userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ')}
									</span>
								</div>
							)}
							{userInfo.sub && (
								<div>
									<strong style={{ color: '#374151' }}>User ID:</strong>{' '}
									<span
										style={{
											color: '#6b7280',
											fontFamily: 'monospace',
											fontSize: '13px',
										}}
									>
										{String(userInfo.sub)}
									</span>
								</div>
							)}
						</div>
					) : (
						<p style={{ margin: 0, color: '#6b7280' }}>
							User information not available. Make sure your access token has the required scopes.
						</p>
					)}
				</div>
			)}

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

			{/* Access Token Information Card (for authentication flows) */}
			{completionResult?.accessToken && (
				<div
					style={{
						background: '#f0fdf4',
						border: '2px solid #6ee7b7',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
						<FiShield size={24} color="#10b981" />
						<h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#065f46' }}>
							🔑 Access Token
						</h3>
					</div>
					<div style={{ display: 'grid', gap: '12px' }}>
						<div
							style={{
								background: '#f9fafb',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								padding: '16px',
								marginBottom: '16px',
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '12px',
								}}
							>
								<strong style={{ color: '#374151', fontSize: '14px' }}>Access Token</strong>
								<button
									type="button"
									onClick={handleCopyToken}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
										padding: '6px 12px',
										background: tokenCopied ? '#10b981' : '#3b82f6',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										cursor: 'pointer',
										fontSize: '12px',
										fontWeight: '600',
										transition: 'background 0.2s',
									}}
									onMouseEnter={(e) => {
										if (!tokenCopied) {
											e.currentTarget.style.background = '#2563eb';
										}
									}}
									onMouseLeave={(e) => {
										if (!tokenCopied) {
											e.currentTarget.style.background = '#3b82f6';
										}
									}}
								>
									<FiCopy size={14} />
									{tokenCopied ? '✓ Copied!' : 'Copy Token'}
								</button>
							</div>
							<div
								style={{
									fontSize: '12px',
									color: '#1f2937',
									fontFamily: 'monospace',
									wordBreak: 'break-all',
									background: 'white',
									padding: '12px',
									borderRadius: '6px',
									border: '1px solid #d1d5db',
									maxHeight: '150px',
									overflowY: 'auto',
									lineHeight: '1.5',
								}}
							>
								{completionResult.accessToken}
							</div>
							{TokenDisplayServiceV8.isJWT(completionResult.accessToken) && (
								<button
									type="button"
									onClick={() => {
										const decoded = TokenDisplayServiceV8.decodeJWT(completionResult.accessToken!);
										if (decoded) {
											const payload = JSON.stringify(decoded.payload, null, 2);
											alert(`Token Payload:\n\n${payload}`);
										} else {
											toastV8.error('Failed to decode token');
										}
									}}
									style={{
										marginTop: '8px',
										padding: '6px 12px',
										background: '#f3f4f6',
										color: '#374151',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										cursor: 'pointer',
										fontSize: '12px',
										fontWeight: '600',
									}}
								>
									🔍 Decode Token
								</button>
							)}
						</div>

						{/* Token Metadata */}
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
								gap: '12px',
							}}
						>
							{completionResult.tokenType && (
								<div>
									<strong style={{ color: '#374151' }}>Token Type:</strong>{' '}
									<span style={{ color: '#6b7280' }}>{completionResult.tokenType}</span>
								</div>
							)}
							{completionResult.expiresIn && (
								<div>
									<strong style={{ color: '#374151' }}>Expires In:</strong>{' '}
									<span style={{ color: '#6b7280' }}>
										{completionResult.expiresIn} seconds
										{timestamp && (
											<span style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>
												(
												{new Date(
													new Date(timestamp).getTime() + completionResult.expiresIn * 1000
												).toLocaleString()}
												)
											</span>
										)}
									</span>
								</div>
							)}
						</div>
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
