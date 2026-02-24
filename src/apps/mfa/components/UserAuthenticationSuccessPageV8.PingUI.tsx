/**
 * @file UserAuthenticationSuccessPageV8.PingUI.tsx
 * @module v8/components
 * @description Ping UI migrated success page component displayed after successful user authentication
 * @version 8.0.0-Bootstrap
 *
 * Shows user information and session details after OAuth login
 * Migrated to Ping UI with Bootstrap icons and CSS variables.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// Bootstrap Icon Component (migrated from MDI)
import BootstrapIcon from '@/components/BootstrapIcon';
import { getBootstrapIconName } from '@/components/iconMapping';
import { TokenDisplayServiceV8 } from '@/v8/services/tokenDisplayServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

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

export interface UserAuthenticationSuccessPageV8PingUIProps {
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
				.map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
				.join('')
		);
		return JSON.parse(jsonPayload);
	} catch (error) {
		console.error('Failed to decode JWT:', error);
		return null;
	}
};

// Styled Components
const SuccessContainer = styled.div`
	background: var(--ping-surface-primary, white);
	border-radius: var(--ping-border-radius-xl, 1rem);
	padding: var(--ping-spacing-xxl, 3rem);
	max-width: 800px;
	width: 100%;
	margin: var(--ping-spacing-lg, 1.5rem) auto;
	box-shadow: var(--ping-shadow-xl, 0 20px 40px rgba(0, 0, 0, 0.1));
`;

const SuccessHeader = styled.div`
	text-align: center;
	margin-bottom: var(--ping-spacing-xxl, 3rem);
`;

const SuccessIcon = styled.div`
	color: var(--ping-success-color, #10b981);
	font-size: 4rem;
	margin-bottom: var(--ping-spacing-lg, 1.5rem);
`;

const SuccessTitle = styled.h1`
	color: var(--ping-text-primary, #1e293b);
	font-size: 2rem;
	font-weight: 700;
	margin: 0 0 var(--ping-spacing-md, 1rem) 0;
`;

const SuccessSubtitle = styled.p`
	color: var(--ping-text-secondary, #64748b);
	font-size: 1.125rem;
	margin: 0;
`;

const Section = styled.div`
	margin-bottom: var(--ping-spacing-xxl, 3rem);
`;

const SectionTitle = styled.h2`
	color: var(--ping-text-primary, #1e293b);
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0 0 var(--ping-spacing-lg, 1.5rem) 0;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const UserInfoCard = styled.div`
	background: var(--ping-surface-secondary, #f8fafc);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	border-radius: var(--ping-border-radius-lg, 12px);
	padding: var(--ping-spacing-xl, 2rem);
`;

const UserInfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: var(--ping-spacing-lg, 1.5rem);
`;

const UserInfoItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: var(--ping-spacing-xs, 0.5rem);
`;

const UserInfoLabel = styled.div`
	color: var(--ping-text-secondary, #64748b);
	font-size: 0.875rem;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const UserInfoValue = styled.div`
	color: var(--ping-text-primary, #1e293b);
	font-size: 1rem;
	font-weight: 500;
	word-break: break-all;
`;

const TokenCard = styled.div`
	background: var(--ping-surface-secondary, #f8fafc);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	border-radius: var(--ping-border-radius-lg, 12px);
	padding: var(--ping-spacing-xl, 2rem);
`;

const TokenItem = styled.div`
	margin-bottom: var(--ping-spacing-lg, 1.5rem);
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const TokenHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: var(--ping-spacing-sm, 0.75rem);
`;

const TokenTitle = styled.h3`
	color: var(--ping-text-primary, #1e293b);
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0;
`;

const TokenValue = styled.div`
	background: var(--ping-code-background, #1e293b);
	color: var(--ping-code-text, #e2e8f0);
	padding: var(--ping-spacing-md, 1rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	word-break: break-all;
	position: relative;
`;

const CopyButton = styled.button`
	position: absolute;
	top: var(--ping-spacing-sm, 0.75rem);
	right: var(--ping-spacing-sm, 0.75rem);
	background: var(--ping-surface-primary, white);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	color: var(--ping-text-primary, #1e293b);
	padding: var(--ping-spacing-xs, 0.5rem) var(--ping-spacing-sm, 0.75rem);
	border-radius: var(--ping-border-radius-sm, 4px);
	font-size: 0.75rem;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-xs, 0.25rem);

	&:hover {
		background: var(--ping-primary-color, #3b82f6);
		color: white;
		border-color: var(--ping-primary-color, #3b82f6);
	}
`;

const TokenMetadata = styled.div`
	display: flex;
	gap: var(--ping-spacing-md, 1rem);
	margin-top: var(--ping-spacing-sm, 0.75rem);
	flex-wrap: wrap;
`;

const MetadataItem = styled.div`
	background: var(--ping-surface-primary, white);
	border: 1px solid var(--ping-border-light, #f1f5f9);
	padding: var(--ping-spacing-xs, 0.5rem) var(--ping-spacing-sm, 0.75rem);
	border-radius: var(--ping-border-radius-sm, 4px);
	font-size: 0.75rem;
	color: var(--ping-text-secondary, #64748b);
`;

const ActionButtons = styled.div`
	display: flex;
	gap: var(--ping-spacing-md, 1rem);
	justify-content: center;
	margin-top: var(--ping-spacing-xxl, 3rem);
`;

const PrimaryButton = styled.button`
	background: var(--ping-primary-color, #3b82f6);
	color: white;
	border: none;
	padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-xl, 2rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);

	&:hover {
		background: var(--ping-primary-hover, #2563eb);
		transform: translateY(-1px);
	}
`;

const SecondaryButton = styled.button`
	background: transparent;
	color: var(--ping-text-primary, #1e293b);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-xl, 2rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

	&:hover {
		background: var(--ping-surface-secondary, #f8fafc);
		border-color: var(--ping-primary-color, #3b82f6);
		color: var(--ping-primary-color, #3b82f6);
	}
`;

export const UserAuthenticationSuccessPageV8PingUI: React.FC<
	UserAuthenticationSuccessPageV8PingUIProps
> = ({ userInfo, sessionInfo, onClose }) => {
	const navigate = useNavigate();
	const [idTokenPayload, setIdTokenPayload] = useState<Record<string, unknown> | null>(null);

	// Decode ID token if present
	useEffect(() => {
		if (sessionInfo.idToken) {
			const payload = decodeJWT(sessionInfo.idToken);
			setIdTokenPayload(payload);
		}
	}, [sessionInfo.idToken]);

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toastV8.success(`${label} copied to clipboard`);
		} catch (_error) {
			toastV8.error('Failed to copy to clipboard');
		}
	};

	const handleContinue = () => {
		if (onClose) {
			onClose();
		} else {
			navigate('/');
		}
	};

	const formatExpirationTime = (expiresIn?: number) => {
		if (!expiresIn) return 'Unknown';
		const hours = Math.floor(expiresIn / 3600);
		const minutes = Math.floor((expiresIn % 3600) / 60);
		return `${hours}h ${minutes}m`;
	};

	const getUserDisplayName = () => {
		if (userInfo?.name) return userInfo.name;
		if (userInfo?.given_name && userInfo?.family_name) {
			return `${userInfo.given_name} ${userInfo.family_name}`;
		}
		if (userInfo?.preferred_username) return userInfo.preferred_username;
		if (userInfo?.username) return userInfo.username;
		if (userInfo?.email) return userInfo.email;
		return 'Unknown User';
	};

	return (
		<div className="end-user-nano">
			<SuccessContainer>
				<SuccessHeader>
					<SuccessIcon>
						<BootstrapIcon
							icon={getBootstrapIconName('check-circle')}
							size={64}
							ariaLabel="Success"
						/>
					</SuccessIcon>
					<SuccessTitle>Authentication Successful!</SuccessTitle>
					<SuccessSubtitle>You have successfully authenticated with PingOne</SuccessSubtitle>
				</SuccessHeader>

				{userInfo && (
					<Section>
						<SectionTitle>
							<BootstrapIcon
								icon={getBootstrapIconName('person')}
								size={24}
								ariaLabel="User Information"
							/>
							User Information
						</SectionTitle>
						<UserInfoCard>
							<UserInfoGrid>
								<UserInfoItem>
									<UserInfoLabel>Name</UserInfoLabel>
									<UserInfoValue>{getUserDisplayName()}</UserInfoValue>
								</UserInfoItem>
								{userInfo.email && (
									<UserInfoItem>
										<UserInfoLabel>Email</UserInfoLabel>
										<UserInfoValue>{userInfo.email}</UserInfoValue>
									</UserInfoItem>
								)}
								{userInfo.sub && (
									<UserInfoItem>
										<UserInfoLabel>Subject ID</UserInfoLabel>
										<UserInfoValue>{userInfo.sub}</UserInfoValue>
									</UserInfoItem>
								)}
								{userInfo.email_verified !== undefined && (
									<UserInfoItem>
										<UserInfoLabel>Email Verified</UserInfoLabel>
										<UserInfoValue>
											{userInfo.email_verified ? '✅ Verified' : '❌ Not Verified'}
										</UserInfoValue>
									</UserInfoItem>
								)}
							</UserInfoGrid>
						</UserInfoCard>
					</Section>
				)}

				<Section>
					<SectionTitle>
						<BootstrapIcon
							icon={getBootstrapIconName('shield')}
							size={24}
							ariaLabel="Session Information"
						/>
						Session Information
					</SectionTitle>
					<TokenCard>
						<TokenItem>
							<TokenHeader>
								<TokenTitle>Access Token</TokenTitle>
								<CopyButton
									onClick={() => copyToClipboard(sessionInfo.accessToken, 'Access Token')}
								>
									<BootstrapIcon
										icon={getBootstrapIconName('clipboard')}
										size={12}
										ariaLabel="Copy"
									/>
									Copy
								</CopyButton>
							</TokenHeader>
							<TokenValue>{TokenDisplayServiceV8.maskToken(sessionInfo.accessToken)}</TokenValue>
							<TokenMetadata>
								<MetadataItem>Type: {sessionInfo.tokenType}</MetadataItem>
								<MetadataItem>Expires: {formatExpirationTime(sessionInfo.expiresIn)}</MetadataItem>
								{sessionInfo.scope && <MetadataItem>Scope: {sessionInfo.scope}</MetadataItem>}
							</TokenMetadata>
						</TokenItem>

						{sessionInfo.idToken && (
							<TokenItem>
								<TokenHeader>
									<TokenTitle>ID Token</TokenTitle>
									<CopyButton onClick={() => copyToClipboard(sessionInfo.idToken!, 'ID Token')}>
										<BootstrapIcon
											icon={getBootstrapIconName('clipboard')}
											size={12}
											ariaLabel="Copy"
										/>
										Copy
									</CopyButton>
								</TokenHeader>
								<TokenValue>{TokenDisplayServiceV8.maskToken(sessionInfo.idToken)}</TokenValue>
								<TokenMetadata>
									<MetadataItem>Environment: {sessionInfo.environmentId}</MetadataItem>
									{sessionInfo.requestedScopes && (
										<MetadataItem>Requested: {sessionInfo.requestedScopes}</MetadataItem>
									)}
								</TokenMetadata>
							</TokenItem>
						)}

						{idTokenPayload && (
							<TokenItem>
								<TokenHeader>
									<TokenTitle>ID Token Payload</TokenTitle>
								</TokenHeader>
								<TokenValue>{JSON.stringify(idTokenPayload, null, 2)}</TokenValue>
							</TokenItem>
						)}
					</TokenCard>
				</Section>

				<ActionButtons>
					<PrimaryButton onClick={handleContinue}>Continue</PrimaryButton>
					<SecondaryButton onClick={() => navigate('/dashboard')}>Go to Dashboard</SecondaryButton>
				</ActionButtons>
			</SuccessContainer>
		</div>
	);
};

export default UserAuthenticationSuccessPageV8PingUI;
