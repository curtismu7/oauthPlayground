/**
 * @file UserAuthenticationSuccessPageV8.tsx
 * @module v8/components
 * @description Success page component displayed after successful user authentication
 * @version 8.0.0
 * 
 * Shows user information and session details after OAuth login
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiUser, FiShield } from 'react-icons/fi';

export interface UserInfo {
	sub?: string;
	username?: string;
	email?: string;
	given_name?: string;
	family_name?: string;
	name?: string;
	preferred_username?: string;
	email_verified?: boolean;
	[key: string]: unknown;
}

export interface SessionInfo {
	accessToken: string;
	idToken?: string;
	tokenType: string;
	expiresIn?: number;
	scope?: string; // Granted scopes (from token response)
	requestedScopes?: string; // Scopes that were requested in authorization URL
	environmentId: string;
}

export interface UserAuthenticationSuccessPageV8Props {
	userInfo?: UserInfo;
	sessionInfo: SessionInfo;
	onClose?: () => void;
}

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
 * Fetch user info from PingOne userinfo endpoint
 */
const fetchUserInfo = async (environmentId: string, accessToken: string): Promise<UserInfo | null> => {
	try {
		const userInfoEndpoint = `https://auth.pingone.com/${environmentId}/as/userinfo`;
		const response = await fetch(userInfoEndpoint, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			console.warn('UserInfo request failed:', response.status);
			return null;
		}

		const userInfo = await response.json();
		return userInfo;
	} catch (error) {
		console.error('Failed to fetch user info:', error);
		return null;
	}
};

/**
 * User Authentication Success Page V8
 * 
 * Displays user information and session details after successful OAuth login
 */
export const UserAuthenticationSuccessPageV8: React.FC<UserAuthenticationSuccessPageV8Props> = ({
	userInfo: initialUserInfo,
	sessionInfo,
	onClose,
}) => {
	const navigate = useNavigate();
	const [userInfo, setUserInfo] = useState<UserInfo | null>(initialUserInfo || null);
	const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(!initialUserInfo);

	// Try to get user info from ID token if available, otherwise fetch from userinfo endpoint
	useEffect(() => {
		const loadUserInfo = async () => {
			if (initialUserInfo) {
				setUserInfo(initialUserInfo);
				setIsLoadingUserInfo(false);
				return;
			}

			// Try to decode ID token first
			if (sessionInfo.idToken) {
				const decoded = decodeJWT(sessionInfo.idToken);
				if (decoded && decoded.sub && typeof decoded.sub === 'string') {
					setUserInfo(decoded as UserInfo);
					setIsLoadingUserInfo(false);
					return;
				}
			}

			// Fallback to userinfo endpoint
			setIsLoadingUserInfo(true);
			const info = await fetchUserInfo(sessionInfo.environmentId, sessionInfo.accessToken);
			if (info) {
				setUserInfo(info);
			}
			setIsLoadingUserInfo(false);
		};

		loadUserInfo();
	}, [initialUserInfo, sessionInfo]);

	// Calculate token expiration time
	const expirationDate = sessionInfo.expiresIn
		? new Date(Date.now() + sessionInfo.expiresIn * 1000)
		: null;

	// Format scopes for display
	const grantedScopes = sessionInfo.scope?.split(' ').filter(Boolean) || [];
	const requestedScopes = sessionInfo.requestedScopes?.split(' ').filter(Boolean) || [];

	const handleContinue = () => {
		if (onClose) {
			onClose();
		} else {
			navigate('/v8/mfa-hub');
		}
	};

	return (
		<div
			style={{
				maxWidth: '800px',
				margin: '0 auto',
				padding: '32px',
				background: '#f8f9fa',
				minHeight: '100vh',
			}}
		>
			<div
				style={{
					background: 'white',
					borderRadius: '12px',
					padding: '32px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
				}}
			>
				{/* Header */}
				<div style={{ textAlign: 'center', marginBottom: '32px' }}>
					<div
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: '64px',
							height: '64px',
							borderRadius: '50%',
							background: '#d1fae5',
							marginBottom: '16px',
						}}
					>
						<FiCheckCircle size={32} color="#10b981" />
					</div>
					<h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600', color: '#1f2937' }}>
						Authentication Successful
					</h1>
					<p style={{ margin: 0, fontSize: '16px', color: '#6b7280' }}>
						You now have an active PingOne session
					</p>
				</div>

				{/* User Information Section */}
				<div
					style={{
						background: '#eff6ff',
						border: '1px solid #93c5fd',
						borderRadius: '8px',
						padding: '20px',
						marginBottom: '20px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
						<FiUser size={20} color="#3b82f6" />
						<h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
							User Information
						</h2>
					</div>

					{isLoadingUserInfo ? (
						<p style={{ margin: 0, color: '#6b7280' }}>Loading user information...</p>
					) : userInfo ? (
						<div style={{ display: 'grid', gap: '12px' }}>
							{userInfo.username && (
								<div>
									<strong style={{ color: '#374151' }}>Username:</strong>{' '}
									<span style={{ color: '#6b7280' }}>{userInfo.username}</span>
								</div>
							)}
							{userInfo.preferred_username && !userInfo.username && (
								<div>
									<strong style={{ color: '#374151' }}>Username:</strong>{' '}
									<span style={{ color: '#6b7280' }}>{userInfo.preferred_username}</span>
								</div>
							)}
							{userInfo.email && (
								<div>
									<strong style={{ color: '#374151' }}>Email:</strong>{' '}
									<span style={{ color: '#6b7280' }}>{userInfo.email}</span>
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
									<span style={{ color: '#6b7280' }}>{userInfo.name}</span>
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
									<span style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '13px' }}>
										{userInfo.sub}
									</span>
								</div>
							)}
						</div>
					) : (
						<p style={{ margin: 0, color: '#6b7280' }}>User information not available</p>
					)}
				</div>

				{/* Session Information Section */}
				<div
					style={{
						background: '#f0fdf4',
						border: '1px solid #6ee7b7',
						borderRadius: '8px',
						padding: '20px',
						marginBottom: '20px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
						<FiShield size={20} color="#10b981" />
						<h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#065f46' }}>
							PingOne Session
						</h2>
					</div>

					<div style={{ display: 'grid', gap: '12px' }}>
						<div>
							<strong style={{ color: '#374151' }}>Token Type:</strong>{' '}
							<span style={{ color: '#6b7280' }}>{sessionInfo.tokenType || 'Bearer'}</span>
						</div>
						{expirationDate && (
							<div>
								<strong style={{ color: '#374151' }}>Expires:</strong>{' '}
								<span style={{ color: '#6b7280' }}>
									{expirationDate.toLocaleString()} (
									{Math.round((expirationDate.getTime() - Date.now()) / 1000 / 60)} minutes)
								</span>
							</div>
						)}
						{sessionInfo.expiresIn && (
							<div>
								<strong style={{ color: '#374151' }}>Expires In:</strong>{' '}
								<span style={{ color: '#6b7280' }}>{sessionInfo.expiresIn} seconds</span>
							</div>
						)}
						{requestedScopes.length > 0 && (
							<div>
								<strong style={{ color: '#374151' }}>Requested Scopes:</strong>
								<div
									style={{
										marginTop: '8px',
										display: 'flex',
										flexWrap: 'wrap',
										gap: '6px',
									}}
								>
									{requestedScopes.map((scope) => {
										const isGranted = grantedScopes.includes(scope);
										return (
											<span
												key={scope}
												style={{
													padding: '4px 10px',
													background: isGranted ? '#dbeafe' : '#fee2e2',
													border: `1px solid ${isGranted ? '#93c5fd' : '#fca5a5'}`,
													borderRadius: '4px',
													fontSize: '12px',
													color: isGranted ? '#1e40af' : '#991b1b',
													position: 'relative',
												}}
												title={isGranted ? 'Granted' : 'Not granted'}
											>
												{scope}
												{!isGranted && (
													<span
														style={{
															marginLeft: '4px',
															fontSize: '10px',
															opacity: 0.8,
														}}
													>
														⚠️
													</span>
												)}
											</span>
										);
									})}
								</div>
								{requestedScopes.some((scope) => !grantedScopes.includes(scope)) && (
									<p style={{ marginTop: '8px', fontSize: '12px', color: '#991b1b' }}>
										⚠️ Some requested scopes were not granted. Verify your OAuth application has these scopes available in PingOne Admin Console.
									</p>
								)}
							</div>
						)}
						{grantedScopes.length > 0 && (
							<div>
								<strong style={{ color: '#374151' }}>Granted Scopes:</strong>
								<div
									style={{
										marginTop: '8px',
										display: 'flex',
										flexWrap: 'wrap',
										gap: '6px',
									}}
								>
									{grantedScopes.map((scope) => (
										<span
											key={scope}
											style={{
												padding: '4px 10px',
												background: '#d1fae5',
												border: '1px solid #6ee7b7',
												borderRadius: '4px',
												fontSize: '12px',
												color: '#065f46',
											}}
										>
											{scope}
										</span>
									))}
								</div>
							</div>
						)}
						<div>
							<strong style={{ color: '#374151' }}>Environment ID:</strong>{' '}
							<span style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '13px' }}>
								{sessionInfo.environmentId}
							</span>
						</div>
					</div>
				</div>

				{/* What's Next Section */}
				<div
					style={{
						background: '#fffbeb',
						border: '1px solid #fcd34d',
						borderRadius: '8px',
						padding: '20px',
						marginBottom: '24px',
					}}
				>
					<h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
						What's Next?
					</h3>
					<ul style={{ margin: 0, paddingLeft: '20px', color: '#78350f' }}>
						<li style={{ marginBottom: '8px' }}>Your access token is stored and ready to use</li>
						<li style={{ marginBottom: '8px' }}>
							You can now use this token for MFA device registration (User Flow)
						</li>
						<li style={{ marginBottom: '8px' }}>
							The token will be automatically included in API requests when needed
						</li>
					</ul>
				</div>

				{/* Continue Button */}
				<div style={{ textAlign: 'center' }}>
					<button
						type="button"
						onClick={handleContinue}
						style={{
							padding: '12px 32px',
							background: '#10b981',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '16px',
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
						Continue
					</button>
				</div>
			</div>
		</div>
	);
};

