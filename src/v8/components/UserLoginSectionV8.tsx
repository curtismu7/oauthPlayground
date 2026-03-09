/**
 * @file UserLoginSectionV8.tsx
 * @module v8/components
 * @description Clean user login section component for OTP configuration pages
 * @version 8.0.0
 * @since 2024-11-27
 *
 * This component provides a clean, organized section for user token management
 * for user flows. It replaces the messy inline user login functionality that was
 * previously scattered across MFAConfigurationStepV8.
 */

import { FiRefreshCw } from '@icons';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/NewAuthContext';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { UserLoginModalV8 } from './UserLoginModalV8';

const MODULE_TAG = '[👤 USER-LOGIN-SECTION-V8]';

interface UserLoginSectionV8Props {
	onTokenUpdated?: (token: string) => void;
	compact?: boolean;
	showUserInfo?: boolean;
}

export const UserLoginSectionV8: React.FC<UserLoginSectionV8Props> = ({
	onTokenUpdated,
	compact = false,
	showUserInfo = true,
}) => {
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Get auth context for user token
	const authContext = useAuth();
	const userToken = authContext.tokens?.access_token;
	const isAuthenticated = authContext.isAuthenticated;
	const userInfo = authContext.user;

	const handleRefreshToken = async () => {
		setIsRefreshing(true);
		try {
			// In a real implementation, you might want to refresh the token here
			// For now, just trigger a status update
			if (onTokenUpdated && userToken) {
				onTokenUpdated(userToken);
			}
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'User token status refreshed',
				duration: 3000,
			});
		} catch (error) {
			console.error(MODULE_TAG, 'Error refreshing user token:', error);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to refresh user token',
				dismissible: true,
			});
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleLogin = () => {
		setShowLoginModal(true);
	};

	const handleLogout = async () => {
		try {
			// Use auth context logout if available
			if (authContext.logout) {
				await authContext.logout();
			}
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'User logged out successfully',
				duration: 3000,
			});
		} catch (error) {
			console.error(MODULE_TAG, 'Error logging out user:', error);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to log out user',
				dismissible: true,
			});
		}
	};

	const sectionStyle = compact
		? {
				background: '#ffffff',
				border: '1px solid #e5e7eb',
				borderRadius: '8px',
				padding: '16px',
				marginBottom: '16px',
			}
		: {
				background: '#ffffff',
				border: '1px solid #e5e7eb',
				borderRadius: '8px',
				padding: '24px',
				marginBottom: '24px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
			};

	return (
		<>
			<div style={sectionStyle}>
				{/* Header */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
					<span style={{ fontSize: 20, color: '#10b981' }}>👤</span>
					<h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
						User Token (User Flow)
					</h3>
					{!compact && (
						<span
							style={{
								fontSize: '12px',
								color: '#6b7280',
								background: '#f3f4f6',
								padding: '2px 8px',
								borderRadius: '12px',
							}}
						>
							OAuth Access Token
						</span>
					)}
				</div>

				{/* Description */}
				{!compact && (
					<p
						style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}
					>
						User tokens are OAuth access tokens obtained via Authorization Code Flow. They are used
						for user-initiated device registration and always create devices with
						ACTIVATION_REQUIRED status.
					</p>
				)}

				{/* Token Status */}
				<div
					style={{
						background: isAuthenticated ? '#f0fdf4' : '#fef2f2',
						border: `1px solid ${isAuthenticated ? '#86efac' : '#fca5a5'}`,
						borderRadius: '6px',
						padding: '12px',
						marginBottom: '16px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div>
							<div
								style={{
									fontSize: '14px',
									fontWeight: '600',
									color: isAuthenticated ? '#166534' : '#991b1b',
								}}
							>
								Status: {isAuthenticated ? 'Logged In' : 'Not Logged In'}
							</div>
							{!isAuthenticated && (
								<div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '4px' }}>
									No user token available - please log in to continue
								</div>
							)}
							{isAuthenticated && showUserInfo && userInfo && (
								<div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
									User: {userInfo.email || userInfo.name || 'Unknown'}
								</div>
							)}
						</div>
						{isAuthenticated && (
							<button
								onClick={handleRefreshToken}
								disabled={isRefreshing}
								type="button"
								style={{
									padding: '6px 8px',
									background: 'transparent',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									fontSize: '12px',
									color: '#6b7280',
								}}
								title="Refresh user token"
							>
								<FiRefreshCw
									size={12}
									style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
								/>
								Refresh
							</button>
						)}
					</div>
				</div>

				{/* Action Buttons */}
				<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
					{!isAuthenticated ? (
						<button
							onClick={handleLogin}
							type="button"
							style={{
								padding: '10px 16px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#059669';
								e.currentTarget.style.transform = 'translateY(-1px)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#10b981';
								e.currentTarget.style.transform = 'translateY(0)';
							}}
						>
							<span style={{ fontSize: '16px' }}>❓</span>
							User Login
						</button>
					) : (
						<>
							<button
								onClick={handleLogin}
								type="button"
								style={{
									padding: '10px 16px',
									background: '#10b981',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#059669';
									e.currentTarget.style.transform = 'translateY(-1px)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = '#10b981';
									e.currentTarget.style.transform = 'translateY(0)';
								}}
							>
								<span style={{ fontSize: '16px' }}>👤</span>
								Update Token
							</button>
							<button
								onClick={handleLogout}
								type="button"
								style={{
									padding: '10px 16px',
									background: '#ef4444',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#dc2626';
									e.currentTarget.style.transform = 'translateY(-1px)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = '#ef4444';
									e.currentTarget.style.transform = 'translateY(0)';
								}}
							>
								Log Out
							</button>
						</>
					)}
				</div>
			</div>

			{/* User Login Modal */}
			<UserLoginModalV8
				isOpen={showLoginModal}
				onClose={() => setShowLoginModal(false)}
				onTokenReceived={(token) => {
					setShowLoginModal(false);
					if (onTokenUpdated) {
						onTokenUpdated(token);
					}
				}}
			/>
		</>
	);
};
