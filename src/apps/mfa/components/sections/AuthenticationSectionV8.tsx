/**
 * @file AuthenticationSectionV8.tsx
 * @module v8/components/sections
 * @description Authentication Section Component
 * @version 3.0.0
 *
 * Extracted from MFAAuthenticationMainPageV8.tsx as part of V3 refactoring.
 * This component handles the authentication UI including:
 * - Username input
 * - Start Authentication button
 * - Device selection
 * - Authentication status display
 * - Challenge handling
 */

import React from 'react';
import type { UseMFAAuthenticationReturn } from '@/v8/hooks/useMFAAuthentication';
import type { UseMFADevicesReturn } from '@/v8/hooks/useMFADevices';

export interface AuthenticationSectionProps {
	/** MFA authentication hook return value */
	mfaAuth: UseMFAAuthenticationReturn;
	/** MFA devices hook return value */
	mfaDevices: UseMFADevicesReturn;
	/** Username for authentication */
	username: string;
	/** Callback when username changes */
	onUsernameChange: (value: string) => void;
	/** Callback when start authentication is clicked */
	onStartAuthentication?: () => Promise<void>;
	/** Whether authentication is in progress */
	isAuthenticating?: boolean;
	/** Whether worker token is valid */
	tokenIsValid?: boolean;
}

const _MODULE_TAG = '[🔐 AUTHENTICATION-SECTION-V8]';

/**
 * Authentication Section Component
 * Displays authentication controls and status
 */
export const AuthenticationSectionV8: React.FC<AuthenticationSectionProps> = ({
	mfaAuth,
	mfaDevices,
	username,
	onUsernameChange,
	onStartAuthentication,
	isAuthenticating = false,
	tokenIsValid = false,
}) => {
	const canStartAuth = username.trim() && tokenIsValid && !isAuthenticating;

	return (
		<div
			style={{
				background: 'white',
				borderRadius: '8px',
				padding: '24px',
				marginBottom: '24px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				border: '1px solid #e5e7eb',
			}}
		>
			<h2
				style={{
					fontSize: '18px',
					fontWeight: '600',
					color: '#1f2937',
					marginBottom: '20px',
				}}
			>
				🔐 MFA Authentication
			</h2>

			{/* Username Input */}
			<div style={{ marginBottom: '20px' }}>
				<label
					htmlFor="auth-username"
					style={{
						display: 'block',
						fontSize: '14px',
						fontWeight: '500',
						color: '#374151',
						marginBottom: '6px',
					}}
					htmlFor="username"
				>
					Username
				</label>
				<input
					id="auth-username"
					type="text"
					value={username}
					onChange={(e) => onUsernameChange(e.target.value)}
					placeholder="Enter username for authentication"
					disabled={isAuthenticating}
					style={{
						width: '100%',
						padding: '10px 12px',
						border: '1px solid #d1d5db',
						borderRadius: '6px',
						fontSize: '14px',
						outline: 'none',
						opacity: isAuthenticating ? 0.6 : 1,
					}}
				/>
			</div>

			{/* Start Authentication Button */}
			<div style={{ marginBottom: '20px' }}>
				<button
					type="button"
					onClick={onStartAuthentication}
					disabled={!canStartAuth}
					style={{
						width: '100%',
						padding: '12px 16px',
						border: 'none',
						borderRadius: '6px',
						background: canStartAuth ? '#3b82f6' : '#9ca3af',
						color: 'white',
						cursor: canStartAuth ? 'pointer' : 'not-allowed',
						fontWeight: '600',
						fontSize: '15px',
						transition: 'all 0.2s ease',
						opacity: isAuthenticating ? 0.7 : 1,
					}}
				>
					{isAuthenticating ? '⏳ Authenticating...' : '🚀 Start MFA Authentication'}
				</button>
			</div>

			{/* Authentication Status */}
			{mfaAuth.isAuthenticating && (
				<div
					style={{
						padding: '12px 16px',
						background: '#fef3c7',
						border: '1px solid #fbbf24',
						borderRadius: '6px',
						marginBottom: '16px',
					}}
				>
					<p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
						⏳ Authentication in progress...
					</p>
				</div>
			)}

			{/* Active Challenge Indicator */}
			{mfaAuth.hasActiveChallenge && (
				<div
					style={{
						padding: '12px 16px',
						background: '#dbeafe',
						border: '1px solid #3b82f6',
						borderRadius: '6px',
						marginBottom: '16px',
					}}
				>
					<p style={{ fontSize: '14px', color: '#1e40af', margin: 0 }}>
						🔑 Active challenge - please complete authentication
					</p>
				</div>
			)}

			{/* Device Selection Status */}
			{mfaDevices.hasDevices && (
				<div
					style={{
						padding: '12px 16px',
						background: '#f0fdf4',
						border: '1px solid #10b981',
						borderRadius: '6px',
					}}
				>
					<p style={{ fontSize: '14px', color: '#065f46', margin: 0 }}>
						✅ {mfaDevices.deviceCount} device{mfaDevices.deviceCount !== 1 ? 's' : ''} available
					</p>
				</div>
			)}

			{/* Devices Error Warning */}
			{mfaDevices.devicesError && username.trim() && tokenIsValid && (
				<div
					style={{
						padding: '12px 16px',
						background: '#fef2f2',
						border: '1px solid #dc2626',
						borderRadius: '6px',
						marginTop: '16px',
					}}
				>
					<p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>{mfaDevices.devicesError}</p>
				</div>
			)}

			{/* No Devices Warning */}
			{!mfaDevices.isLoading &&
				!mfaDevices.hasDevices &&
				!mfaDevices.devicesError &&
				username.trim() &&
				tokenIsValid && (
					<div
						style={{
							padding: '12px 16px',
							background: '#fef2f2',
							border: '1px solid #dc2626',
							borderRadius: '6px',
						}}
					>
						<p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>
							⚠️ No devices found for this user
						</p>
					</div>
				)}
			{!tokenIsValid && (
				<div
					style={{
						padding: '12px 16px',
						background: '#fef2f2',
						border: '1px solid #dc2626',
						borderRadius: '6px',
						marginTop: '16px',
					}}
				>
					<p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>
						⚠️ Worker token required - please get a valid worker token first
					</p>
				</div>
			)}
		</div>
	);
};

export default AuthenticationSectionV8;
