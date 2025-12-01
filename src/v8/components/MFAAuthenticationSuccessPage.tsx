/**
 * @file MFAAuthenticationSuccessPage.tsx
 * @module v8/components
 * @description Success page component for MFA authentication flows
 * @version 8.3.0
 * @since 2025-01-XX
 *
 * Displays authentication success with access token and related information.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCheck, FiCopy, FiHome } from 'react-icons/fi';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { ApiDisplayCheckbox, SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';

interface CompletionResult {
	accessToken?: string;
	tokenType?: string;
	expiresIn?: number;
}

interface DeviceDetails {
	id: string;
	type: string;
	nickname?: string;
	name?: string;
	phone?: string;
	email?: string;
	status?: string;
}

interface LocationState {
	completionResult?: CompletionResult & Record<string, unknown>;
	username?: string;
	userId?: string;
	environmentId?: string;
	deviceType?: string;
	deviceId?: string;
	deviceDetails?: DeviceDetails;
	policyId?: string;
	policyName?: string;
	authenticationId?: string | null;
	challengeId?: string | null;
	timestamp?: string;
	deviceSelectionBehavior?: string;
}

export const MFAAuthenticationSuccessPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const state = location.state as LocationState | null;

	const completionResult = state?.completionResult;
	const username = state?.username;
	const userId = state?.userId;
	const environmentId = state?.environmentId;
	const deviceType = state?.deviceType;
	const deviceId = state?.deviceId;
	const deviceDetails = state?.deviceDetails;
	const policyId = state?.policyId;
	const policyName = state?.policyName;
	const authenticationId = state?.authenticationId;
	const challengeId = state?.challengeId;
	const timestamp = state?.timestamp;
	const deviceSelectionBehavior = state?.deviceSelectionBehavior;

	const handleCopyToken = () => {
		if (completionResult?.accessToken) {
			navigator.clipboard.writeText(completionResult.accessToken);
			toastV8.success('Access token copied to clipboard');
		}
	};

	const handleGoHome = () => {
		navigate('/v8/mfa-hub');
	};

	return (
		<div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
			{/* API Display Toggle - Top */}
			<div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
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
					Authentication Successful!
				</h1>
				<p
					style={{
						margin: '0',
						fontSize: '18px',
						opacity: 0.95,
						fontWeight: '500',
					}}
				>
					Your MFA authentication has been completed successfully
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
							Verification Complete
						</h3>
						<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#047857' }}>
							Your authentication has been verified and tokens have been issued
						</p>
					</div>
				</div>
			</div>

			{/* Token Information Card */}
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
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
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
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
									<span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
								<span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
									Token Type
								</span>
								<div style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500', marginTop: '8px' }}>
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
								<span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
									Expires In
								</span>
								<div style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500', marginTop: '8px' }}>
									{completionResult.expiresIn} seconds
								</div>
								{timestamp && (
									<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
										Expires: {new Date(new Date(timestamp).getTime() + (completionResult.expiresIn * 1000)).toLocaleString()}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Authentication Details Card */}
			{(username || userId || environmentId || deviceType || policyName) && (
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
						👤 Authentication Details
					</h4>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
						{username && (
							<div>
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
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
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
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
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
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
						{deviceType && (
							<div>
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
									Device Type
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
									{deviceType}
									{deviceDetails && (deviceDetails.phone || deviceDetails.email) && (
										<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
											{deviceDetails.phone ? `📱 ${deviceDetails.phone}` : deviceDetails.email ? `📧 ${deviceDetails.email}` : ''}
										</div>
									)}
								</div>
							</div>
						)}
						{deviceDetails && (deviceDetails.phone || deviceDetails.email || deviceDetails.nickname) && (
							<div>
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
									Device Details
								</div>
								<div
									style={{
										fontSize: '14px',
										fontWeight: '500',
										color: '#1f2937',
										padding: '8px 12px',
										background: '#f0f9ff',
										borderRadius: '6px',
										border: '1px solid #bae6fd',
									}}
								>
									{deviceDetails.nickname && (
										<div style={{ marginBottom: '4px' }}>
											<strong>Name:</strong> {deviceDetails.nickname}
										</div>
									)}
									{deviceDetails.phone && (
										<div style={{ marginBottom: '4px' }}>
											<strong>Phone:</strong> {deviceDetails.phone}
										</div>
									)}
									{deviceDetails.email && (
										<div style={{ marginBottom: '4px' }}>
											<strong>Email:</strong> {deviceDetails.email}
										</div>
									)}
									{deviceDetails.status && (
										<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
											Status: {deviceDetails.status}
										</div>
									)}
								</div>
							</div>
						)}
						{policyName && (
							<div>
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
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
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
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
					</div>
				</div>
			)}

			{/* Transaction Details Card */}
			{(authenticationId || challengeId || timestamp || completionResult?.status) && (
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
						{authenticationId && (
							<div>
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
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
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
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
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
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
						{completionResult?.status && (
							<div>
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
									Transaction Status
								</div>
								<div
									style={{
										fontSize: '14px',
										color: completionResult.status === 'COMPLETED' ? '#166534' : '#92400e',
										fontWeight: '500',
										padding: '8px 12px',
										background: completionResult.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
										borderRadius: '6px',
										border: `1px solid ${completionResult.status === 'COMPLETED' ? '#86efac' : '#fbbf24'}`,
									}}
								>
									{completionResult.status}
								</div>
							</div>
						)}
						{completionResult?.message && (
							<div style={{ gridColumn: '1 / -1' }}>
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
									Message
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
									{completionResult.message}
								</div>
							</div>
						)}
					</div>
					
					{/* Additional Completion Result Fields */}
					{completionResult && Object.keys(completionResult).length > 0 && (
						<div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
							<details
								style={{
									cursor: 'pointer',
								}}
							>
								<summary
									style={{
										fontSize: '14px',
										fontWeight: '600',
										color: '#3b82f6',
										marginBottom: '12px',
										userSelect: 'none',
									}}
								>
									View Full Response Data
								</summary>
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
										{JSON.stringify(completionResult, null, 2)}
									</pre>
								</div>
							</details>
						</div>
					)}
				</div>
			)}

			{/* Device Selection Behavior Explanation */}
			{deviceSelectionBehavior && (
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
							<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
								{!['DEFAULT_TO_FIRST', 'PROMPT_TO_SELECT_DEVICE', 'ALWAYS_DISPLAY_DEVICES'].includes(deviceSelectionBehavior) && deviceSelectionBehavior}
							</div>
						</div>
						<div style={{ marginTop: '16px' }}>
							<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
								What This Means
							</div>
							<div style={{ fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }}>
								{deviceSelectionBehavior === 'DEFAULT_TO_FIRST' && (
									<>
										Your MFA policy is configured to <strong>automatically select the first available device</strong> for authentication. 
										This means you did not see a device selection screen because the system automatically chose your device based on your policy settings.
									</>
								)}
								{deviceSelectionBehavior === 'PROMPT_TO_SELECT_DEVICE' && (
									<>
										Your MFA policy is configured to <strong>prompt you to select a device</strong> when multiple devices are available. 
										If you only have one device, it was used automatically. If you saw a device selection screen, it's because you have multiple eligible devices.
									</>
								)}
								{deviceSelectionBehavior === 'ALWAYS_DISPLAY_DEVICES' && (
									<>
										Your MFA policy is configured to <strong>always display the device selection screen</strong>, even if you only have one device. 
										This ensures you have full visibility and control over which device is used for authentication.
									</>
								)}
								{!['DEFAULT_TO_FIRST', 'PROMPT_TO_SELECT_DEVICE', 'ALWAYS_DISPLAY_DEVICES'].includes(deviceSelectionBehavior) && (
									<>
										Your MFA policy uses a custom device selection behavior: <strong>{deviceSelectionBehavior}</strong>. 
										This setting determines how devices are selected during the authentication process.
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Device Details Card */}
			{deviceDetails && (
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
						📱 Device Details
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
						<div>
							<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
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
								{deviceDetails.id}
							</div>
						</div>
						<div>
							<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
								Device Type
							</div>
							<div
								style={{
									fontSize: '14px',
									color: '#1f2937',
									fontWeight: '500',
									padding: '8px 12px',
									background: 'white',
									borderRadius: '6px',
									border: '1px solid #e5e7eb',
								}}
							>
								{deviceDetails.type}
							</div>
						</div>
						<div>
							<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
								Device Name
							</div>
							<div
								style={{
									fontSize: '14px',
									color: '#1f2937',
									fontWeight: '500',
									padding: '8px 12px',
									background: 'white',
									borderRadius: '6px',
									border: '1px solid #e5e7eb',
								}}
							>
								{deviceDetails.nickname || deviceDetails.name || 'Unnamed'}
							</div>
						</div>
						{deviceDetails.phone && (
							<div>
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
									Phone
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
									{deviceDetails.phone}
								</div>
							</div>
						)}
						{deviceDetails.email && (
							<div>
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
									Email
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
									{deviceDetails.email}
								</div>
							</div>
						)}
						{deviceDetails.status && (
							<div>
								<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
									Status
								</div>
								<div
									style={{
										fontSize: '14px',
										color: deviceDetails.status === 'ACTIVE' ? '#166534' : '#92400e',
										fontWeight: '500',
										padding: '8px 12px',
										background: deviceDetails.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
										borderRadius: '6px',
										border: `1px solid ${deviceDetails.status === 'ACTIVE' ? '#86efac' : '#fbbf24'}`,
									}}
								>
									{deviceDetails.status}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
				<button
					type="button"
					onClick={handleGoHome}
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
					<FiHome />
					Back to MFA Hub
				</button>
			</div>
			
			{/* API Display Toggle - Bottom */}
			<div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end' }}>
				<ApiDisplayCheckbox />
			</div>
		</div>
	);
};

export default MFAAuthenticationSuccessPage;

