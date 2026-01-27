/**
 * @file UserTokenStatusDisplayV8U.tsx
 * @module v8u/components
 * @description Comprehensive user token monitoring display for unified flows
 * @version 8.0.0
 * @since 2026-01-25
 *
 * Features:
 * - Monitor Access Tokens, ID Tokens, and Refresh Tokens
 * - Real-time status updates with expiration tracking
 * - OAuth flow integration
 * - Token validation and metadata display
 * - Compact and detailed view modes
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiActivity,
	FiAlertCircle,
	FiCheckCircle,
	FiClock,
	FiCopy,
	FiEye,
	FiEyeOff,
	FiGlobe,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiTrash2,
	FiUser,
	FiZap,
} from 'react-icons/fi';
import styled, { css, keyframes } from 'styled-components';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// Flow types for dropdowns
const FLOW_TYPES = [
	{ value: 'oauth-authz', label: 'OAuth Authorization Code' },
	{ value: 'implicit', label: 'OAuth Implicit' },
	{ value: 'hybrid', label: 'OIDC Hybrid' },
	{ value: 'client-credentials', label: 'Client Credentials' },
	{ value: 'device-code', label: 'Device Code' },
	{ value: 'ropc', label: 'Resource Owner Password' },
	{ value: 'pkce', label: 'PKCE' },
];

// Animation keyframes
const pulse = keyframes`
	0%, 100% { transform: scale(1); opacity: 1; }
	50% { transform: scale(1.05); opacity: 0.9; }
`;

const glow = keyframes`
	0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
	50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
`;

const slideIn = keyframes`
	from { transform: translateY(-10px); opacity: 0; }
	to { transform: translateY(0); opacity: 1; }
`;

// Styled components
const TokenContainer = styled.div<{ $variant: 'valid' | 'invalid' | 'warning' | 'info' }>`
	background: linear-gradient(135deg, 
		${(props) =>
			props.$variant === 'valid'
				? 'rgba(59, 130, 246, 0.1)'
				: props.$variant === 'warning'
					? 'rgba(245, 158, 11, 0.1)'
					: props.$variant === 'info'
						? 'rgba(16, 185, 129, 0.1)'
						: 'rgba(239, 68, 68, 0.1)'},
		${(props) =>
			props.$variant === 'valid'
				? 'rgba(37, 99, 235, 0.05)'
				: props.$variant === 'warning'
					? 'rgba(251, 191, 36, 0.05)'
					: props.$variant === 'info'
						? 'rgba(34, 197, 94, 0.05)'
						: 'rgba(248, 113, 113, 0.05)'});
	border: 2px solid ${(props) =>
		props.$variant === 'valid'
			? '#3b82f6'
			: props.$variant === 'warning'
				? '#f59e0b'
				: props.$variant === 'info'
					? '#10b981'
					: '#ef4444'};
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 16px;
	position: relative;
	overflow: hidden;
	backdrop-filter: blur(10px);
	box-shadow: 
		0 4px 16px rgba(0, 0, 0, 0.1),
		0 2px 8px rgba(0, 0, 0, 0.05),
		inset 0 1px 0 rgba(255, 255, 255, 0.2);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	animation: ${css`${slideIn} 0.5s ease-out`};

	&:hover {
		transform: translateY(-1px);
		box-shadow: 
			0 6px 24px rgba(0, 0, 0, 0.15),
			0 3px 12px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	${(props) =>
		props.$variant === 'valid' &&
		css`
		animation: ${slideIn} 0.5s ease-out, ${glow} 3s ease-in-out infinite;
	`}
`;

const TokenHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
`;

const TokenTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;

const TokenIcon = styled.div<{
	$variant: 'valid' | 'invalid' | 'warning' | 'info';
	$tokenType?: string;
}>`
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, 
		${(props) =>
			props.$variant === 'valid'
				? '#3b82f6'
				: props.$variant === 'warning'
					? '#f59e0b'
					: props.$variant === 'info'
						? '#10b981'
						: '#ef4444'},
		${(props) =>
			props.$variant === 'valid'
				? '#2563eb'
				: props.$variant === 'warning'
					? '#d97706'
					: props.$variant === 'info'
						? '#059669'
						: '#dc2626'});
	box-shadow: 
		0 2px 8px rgba(0, 0, 0, 0.15),
		inset 0 1px 0 rgba(255, 255, 255, 0.2);
	color: white;
	font-size: 14px;
	animation: ${css`${pulse} 2s ease-in-out infinite`};
`;

const TokenText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const TokenLabel = styled.div`
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	font-weight: 600;
	color: #6b7280;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const TokenValue = styled.div<{ $variant: 'valid' | 'invalid' | 'warning' | 'info' }>`
	font-size: 14px;
	font-weight: 700;
	background: linear-gradient(135deg, 
		${(props) =>
			props.$variant === 'valid'
				? '#3b82f6'
				: props.$variant === 'warning'
					? '#f59e0b'
					: props.$variant === 'info'
						? '#10b981'
						: '#ef4444'},
		${(props) =>
			props.$variant === 'valid'
				? '#2563eb'
				: props.$variant === 'warning'
					? '#d97706'
					: props.$variant === 'info'
						? '#059669'
						: '#dc2626'});
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
`;

const TokenDetails = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 10px;
	margin-top: 12px;
`;

const TokenDetail = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 8px 10px;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 6px;
	border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DetailLabel = styled.div`
	font-size: 9px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #9ca3af;
	font-weight: 600;
`;

const DetailValue = styled.div<{ $highlight?: boolean; $monospace?: boolean }>`
	font-size: 12px;
	font-weight: 600;
	color: ${(props) => (props.$highlight ? '#3b82f6' : '#e5e7eb')};
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	font-family: ${(props) => (props.$monospace ? 'monospace' : 'inherit')};
	word-break: break-all;
	${(props) =>
		props.$highlight &&
		`
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	`}
`;

const TokenActions = styled.div`
	display: flex;
	gap: 8px;
	margin-top: 12px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	background: ${(props) =>
		props.$variant === 'primary'
			? '#3b82f6'
			: props.$variant === 'danger'
				? '#ef4444'
				: 'transparent'};
	border: 1px solid ${(props) =>
		props.$variant === 'primary'
			? '#3b82f6'
			: props.$variant === 'danger'
				? '#ef4444'
				: 'rgba(255, 255, 255, 0.2)'};
	border-radius: 6px;
	padding: 6px 10px;
	color: ${(props) =>
		props.$variant === 'primary' || props.$variant === 'danger' ? 'white' : '#e5e7eb'};
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 11px;
	transition: all 0.2s;
	font-weight: 500;

	&:hover {
		background: ${(props) =>
			props.$variant === 'primary'
				? '#2563eb'
				: props.$variant === 'danger'
					? '#dc2626'
					: 'rgba(255, 255, 255, 0.1)'};
		transform: scale(1.02);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
	padding-bottom: 12px;
	border-bottom: 2px solid #e5e7eb;
`;

const SectionTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 700;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const RefreshButton = styled.button`
	background: transparent;
	border: 1px solid rgba(59, 130, 246, 0.3);
	border-radius: 6px;
	padding: 6px 10px;
	color: #3b82f6;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	transition: all 0.2s;

	&:hover {
		background: rgba(59, 130, 246, 0.1);
		transform: scale(1.02);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spin {
		animation: spin 1s linear infinite;
	}
`;

const DropdownContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	margin-bottom: 12px;
`;

const DropdownLabel = styled.label`
	font-size: 12px;
	font-weight: 600;
	color: #374151;
	margin-bottom: 4px;
`;

const DropdownSelect = styled.select`
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 13px;
	color: #374151;
	background: white;
	cursor: pointer;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&:hover {
		border-color: #9ca3af;
	}
`;

// Token interfaces
export interface UserTokenInfo {
	type: 'access_token' | 'id_token' | 'refresh_token';
	token: string;
	expiresAt?: number;
	issuedAt?: number;
	scope?: string;
	issuer?: string;
	audience?: string;
	subject?: string;
	isValid: boolean;
	status: 'valid' | 'expired' | 'missing' | 'expiring-soon';
}

export interface UserTokenStatusDisplayProps {
	/** Show refresh button */
	showRefresh?: boolean;
	/** Auto-refresh interval in seconds */
	refreshInterval?: number;
	/** Compact mode */
	compact?: boolean;
}

export const UserTokenStatusDisplayV8U: React.FC<UserTokenStatusDisplayProps> = ({
	showRefresh = true,
	refreshInterval = 10,
	compact = false,
}) => {
	const [tokens, setTokens] = useState<UserTokenInfo[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
	const [selectedFlowType, setSelectedFlowType] = useState('oauth-authz');
	const [selectedTokenType, setSelectedTokenType] = useState('access_token');

	// Initialize tokens
	useEffect(() => {
		updateTokenStatus();
		const interval = setInterval(updateTokenStatus, refreshInterval * 1000);
		return () => clearInterval(interval);
	}, [refreshInterval]);

	const updateTokenStatus = useCallback(async () => {
		try {
			// Check for different token types in various storage locations
			const tokenPromises = [checkAccessToken(), checkIdToken(), checkRefreshToken()];

			const resolvedTokens = await Promise.all(tokenPromises);
			setTokens(resolvedTokens.filter(Boolean) as UserTokenInfo[]);
		} catch (error) {
			console.error('[UserTokenStatusDisplayV8U] Failed to update token status:', error);
		}
	}, []);

	const checkAccessToken = async (): Promise<UserTokenInfo | null> => {
		try {
			// Check localStorage for access token
			const accessToken = localStorage.getItem('access_token');
			if (!accessToken) return null;

			// Parse JWT to get expiration
			const payload = parseJWT(accessToken);
			const now = Date.now();
			const expiresAt = payload.exp * 1000;
			const isValid = expiresAt > now;
			const timeRemaining = expiresAt - now;
			const isExpiringSoon = timeRemaining < 5 * 60 * 1000; // 5 minutes

			return {
				type: 'access_token',
				token: accessToken,
				expiresAt,
				issuedAt: payload.iat * 1000,
				scope: payload.scope || localStorage.getItem('token_scope') || undefined,
				issuer: payload.iss,
				audience: payload.aud,
				subject: payload.sub,
				isValid,
				status: !isValid ? 'expired' : isExpiringSoon ? 'expiring-soon' : 'valid',
			};
		} catch (error) {
			console.error('[UserTokenStatusDisplayV8U] Error checking access token:', error);
			return null;
		}
	};

	const checkIdToken = async (): Promise<UserTokenInfo | null> => {
		try {
			const idToken = localStorage.getItem('id_token');
			if (!idToken) return null;

			const payload = parseJWT(idToken);
			const now = Date.now();
			const expiresAt = payload.exp * 1000;
			const isValid = expiresAt > now;
			const isExpiringSoon = expiresAt - now < 5 * 60 * 1000;

			return {
				type: 'id_token',
				token: idToken,
				expiresAt,
				issuedAt: payload.iat * 1000,
				issuer: payload.iss,
				audience: payload.aud,
				subject: payload.sub,
				isValid,
				status: !isValid ? 'expired' : isExpiringSoon ? 'expiring-soon' : 'valid',
			};
		} catch (error) {
			console.error('[UserTokenStatusDisplayV8U] Error checking ID token:', error);
			return null;
		}
	};

	const checkRefreshToken = async (): Promise<UserTokenInfo | null> => {
		try {
			const refreshToken = localStorage.getItem('refresh_token');
			if (!refreshToken) return null;

			// Refresh tokens typically don't expire, but we can check if they exist
			return {
				type: 'refresh_token',
				token: refreshToken,
				isValid: true,
				status: 'valid',
			};
		} catch (error) {
			console.error('[UserTokenStatusDisplayV8U] Error checking refresh token:', error);
			return null;
		}
	};

	const parseJWT = (token: string) => {
		try {
			const base64Url = token.split('.')[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			return JSON.parse(window.atob(base64));
		} catch (error) {
			console.error('[UserTokenStatusDisplayV8U] Error parsing JWT:', error);
			return {};
		}
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await updateTokenStatus();
			toastV8.success('User token status refreshed');
		} catch (error) {
			toastV8.error('Failed to refresh token status');
		} finally {
			setTimeout(() => setIsRefreshing(false), 500);
		}
	};

	const copyToken = async (token: string, type: string) => {
		try {
			await navigator.clipboard.writeText(token);
			toastV8.success(`${type} copied to clipboard`);
		} catch (error) {
			toastV8.error('Failed to copy token');
		}
	};

	const clearToken = async (type: string) => {
		try {
			const storageKey =
				type === 'access_token'
					? 'access_token'
					: type === 'id_token'
						? 'id_token'
						: 'refresh_token';
			localStorage.removeItem(storageKey);
			await updateTokenStatus();
			toastV8.success(`${type} cleared`);
		} catch (error) {
			toastV8.error('Failed to clear token');
		}
	};

	const getVariant = (status: string): 'valid' | 'invalid' | 'warning' | 'info' => {
		switch (status) {
			case 'valid':
				return 'valid';
			case 'expiring-soon':
				return 'warning';
			case 'expired':
				return 'invalid';
			case 'missing':
				return 'info';
			default:
				return 'info';
		}
	};

	const getTokenIcon = (type: string) => {
		switch (type) {
			case 'access_token':
				return <FiKey />;
			case 'id_token':
				return <FiUser />;
			case 'refresh_token':
				return <FiRefreshCw />;
			default:
				return <FiShield />;
		}
	};

	const formatTimeRemaining = (expiresAt?: number) => {
		if (!expiresAt) return 'N/A';
		const now = Date.now();
		const remaining = expiresAt - now;
		if (remaining <= 0) return 'Expired';
		const minutes = Math.floor(remaining / 60000);
		const hours = Math.floor(minutes / 60);
		if (hours > 0) return `${hours}h ${minutes % 60}m`;
		return `${minutes}m`;
	};

	const maskToken = (token: string) => {
		if (showTokens[token]) return token;
		if (token.length <= 16) return '*'.repeat(token.length);
		return token.substring(0, 8) + '...' + token.substring(token.length - 8);
	};

	if (compact) {
		return (
			<div style={{ fontSize: '14px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
					<FiUser />
					<strong>User Tokens:</strong>
					{showRefresh && (
						<RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
							<FiRefreshCw className={isRefreshing ? 'spin' : ''} />
						</RefreshButton>
					)}
				</div>
				{tokens.length === 0 ? (
					<div style={{ color: '#6b7280', fontSize: '12px' }}>No user tokens found</div>
				) : (
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
						{tokens.map((token, index) => (
							<div
								key={index}
								style={{
									padding: '4px 8px',
									borderRadius: '4px',
									background: token.isValid ? '#dbeafe' : '#fee2e2',
									color: token.isValid ? '#1e40af' : '#991b1b',
									fontSize: '11px',
									border: `1px solid ${token.isValid ? '#3b82f6' : '#ef4444'}`,
								}}
							>
								{token.type.replace('_', ' ')}: {token.status}
							</div>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div>
			<SectionHeader>
				<SectionTitle>
					<FiUser />
					User Token Monitoring
				</SectionTitle>
				{showRefresh && (
					<RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
						<FiRefreshCw className={isRefreshing ? 'spin' : ''} />
						Refresh
					</RefreshButton>
				)}
			</SectionHeader>

			{/* Flow Selection Dropdowns */}
			<div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
				<DropdownContainer>
					<DropdownLabel>Flow Type</DropdownLabel>
					<DropdownSelect
						value={selectedFlowType}
						onChange={(e) => setSelectedFlowType(e.target.value)}
					>
						{FLOW_TYPES.map((flow) => (
							<option key={flow.value} value={flow.value}>
								{flow.label}
							</option>
						))}
					</DropdownSelect>
				</DropdownContainer>

				<DropdownContainer>
					<DropdownLabel>Token Type</DropdownLabel>
					<DropdownSelect
						value={selectedTokenType}
						onChange={(e) => setSelectedTokenType(e.target.value)}
					>
						<option value="access_token">Access Token</option>
						<option value="id_token">ID Token</option>
						<option value="refresh_token">Refresh Token</option>
					</DropdownSelect>
				</DropdownContainer>
			</div>

			{tokens.length === 0 ? (
				<TokenContainer $variant="info">
					<TokenHeader>
						<TokenTitle>
							<div
								style={{
									width: '32px',
									height: '32px',
									borderRadius: '8px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									background: 'linear-gradient(135deg, #10b981, #059669)',
									boxShadow:
										'0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
									color: 'white',
									fontSize: '14px',
								}}
							>
								<FiInfo />
							</div>
							<TokenText>
								<TokenLabel>No User Tokens</TokenLabel>
								<TokenValue $variant="info">No tokens found</TokenValue>
							</TokenText>
						</TokenTitle>
					</TokenHeader>
					<div style={{ fontSize: '12px', color: '#6b7280' }}>
						No user tokens (access, ID, or refresh) found in localStorage. Perform an OAuth flow to
						generate tokens.
					</div>
				</TokenContainer>
			) : (
				tokens.map((token, index) => (
					<TokenContainer key={index} $variant={getVariant(token.status)}>
						<TokenHeader>
							<TokenTitle>
								<div
									style={{
										width: '32px',
										height: '32px',
										borderRadius: '8px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
										boxShadow:
											'0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
										color: 'white',
										fontSize: '14px',
										animation: 'pulse 2s ease-in-out infinite',
									}}
								>
									{token.type === 'access_token' ? (
										<FiKey />
									) : token.type === 'id_token' ? (
										<FiUser />
									) : (
										<FiRefreshCw />
									)}
								</div>
								<TokenText>
									<TokenLabel>{token.type.replace('_', ' ').toUpperCase()}</TokenLabel>
									<TokenValue $variant={getVariant(token.status)}>
										{token.status.replace('-', ' ').toUpperCase()}
									</TokenValue>
								</TokenText>
							</TokenTitle>
						</TokenHeader>

						<TokenDetails>
							<TokenDetail>
								<DetailLabel>Token</DetailLabel>
								<DetailValue $monospace $highlight={showTokens[token.token]}>
									{maskToken(token.token)}
								</DetailValue>
							</TokenDetail>

							{token.expiresAt && (
								<TokenDetail>
									<DetailLabel>Expires In</DetailLabel>
									<DetailValue $highlight={token.isValid}>
										{formatTimeRemaining(token.expiresAt)}
									</DetailValue>
								</TokenDetail>
							)}

							{token.issuedAt && (
								<TokenDetail>
									<DetailLabel>Issued At</DetailLabel>
									<DetailValue>{new Date(token.issuedAt).toLocaleTimeString()}</DetailValue>
								</TokenDetail>
							)}

							{token.scope && (
								<TokenDetail>
									<DetailLabel>Scope</DetailLabel>
									<DetailValue>{token.scope}</DetailValue>
								</TokenDetail>
							)}

							{token.issuer && (
								<TokenDetail>
									<DetailLabel>Issuer</DetailLabel>
									<DetailValue>{token.issuer}</DetailValue>
								</TokenDetail>
							)}

							{token.subject && (
								<TokenDetail>
									<DetailLabel>Subject</DetailLabel>
									<DetailValue>{token.subject}</DetailValue>
								</TokenDetail>
							)}
						</TokenDetails>

						<TokenActions>
							<ActionButton
								onClick={() =>
									setShowTokens((prev) => ({ ...prev, [token.token]: !prev[token.token] }))
								}
							>
								{showTokens[token.token] ? <FiEyeOff /> : <FiEye />}
								{showTokens[token.token] ? 'Hide' : 'Show'}
							</ActionButton>
							<ActionButton onClick={() => copyToken(token.token, token.type)}>
								<FiCopy />
								Copy
							</ActionButton>
							<ActionButton $variant="danger" onClick={() => clearToken(token.type)}>
								<FiTrash2 />
								Clear
							</ActionButton>
						</TokenActions>
					</TokenContainer>
				))
			)}
		</div>
	);
};

export default UserTokenStatusDisplayV8U;
