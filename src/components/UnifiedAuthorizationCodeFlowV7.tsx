// src/components/UnifiedAuthorizationCodeFlowV7.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { useAuth } from '@/contexts/NewAuthContext';
import { logger } from '../utils/logger';

// MDI Icon Component for React Icons migration
const MDIIcon: React.FC<{ icon: string; size?: number; className?: string }> = ({
	icon,
	size = 16,
	className = '',
}) => {
	const iconMap: Record<string, string> = {
		FiShield: 'mdi-shield-check',
		FiKey: 'mdi-key',
		FiSettings: 'mdi-cog',
		FiExternalLink: 'mdi-open-in-new',
		FiCheck: 'mdi-check',
		FiInfo: 'mdi-information',
	};

	const mdiIcon = iconMap[icon] || 'mdi-help';

	return <i className={`mdi ${mdiIcon} ${className}`} style={{ fontSize: `${size}px` }}></i>;
};

// Styled Components
const FlowContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
	background: V9_COLORS.TEXT.WHITE;
	border-radius: 12px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const FlowHeader = styled.div`
	text-align: center;
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const FlowTitle = styled.h1`
	font-size: 2rem;
	font-weight: 700;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
`;

const FlowSubtitle = styled.p`
	font-size: 1.1rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	margin: 0;
	line-height: 1.6;
`;

const ModeSelector = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	padding: 1.5rem;
	background: #f9fafb;
	border-radius: 8px;
	border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const ModeButton = styled.button<{ $active: boolean }>`
	flex: 1;
	padding: 1rem;
	border: 2px solid ${({ $active }) => ($active ? 'V9_COLORS.PRIMARY.BLUE' : 'V9_COLORS.TEXT.GRAY_LIGHTER')};
	background: ${({ $active }) => ($active ? 'V9_COLORS.PRIMARY.BLUE' : 'V9_COLORS.TEXT.WHITE')};
	color: ${({ $active }) => ($active ? 'V9_COLORS.TEXT.WHITE' : 'V9_COLORS.TEXT.GRAY_DARK')};
	border-radius: 8px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $active }) => ($active ? 'V9_COLORS.PRIMARY.BLUE_DARK' : '#f3f4f6')};
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
`;

const ModeDescription = styled.div`
	margin-top: 1rem;
	padding: 1rem;
	background: V9_COLORS.BG.GRAY_LIGHT;
	border-radius: 6px;
	border-left: 4px solid V9_COLORS.PRIMARY.BLUE;
`;

const ConfigurationSection = styled.div`
	margin-bottom: 2rem;
	padding: 1.5rem;
	background: V9_COLORS.TEXT.WHITE;
	border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 8px;
`;

const SectionTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: center;
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const InfoBox = styled.div`
	margin-top: 1rem;
	padding: 1rem;
	background: V9_COLORS.BG.GRAY_LIGHT;
	border-radius: 6px;
	border-left: 4px solid #0ea5e9;
`;

const InfoTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoText = styled.p`
	font-size: 0.9rem;
	color: #075985;
	margin: 0;
	line-height: 1.5;
`;

// Types
export type FlowMode = 'oauth' | 'oidc';

export interface UnifiedAuthCodeFlowV7Props {
	onComplete?: (result: { success: boolean; mode: FlowMode; data?: any }) => void;
	className?: string;
}

// Main Component
export const UnifiedAuthorizationCodeFlowV7: React.FC<UnifiedAuthCodeFlowV7Props> = ({
	onComplete,
	className = '',
}) => {
	const _navigate = useNavigate();
	const _authContext = useAuth();
	const [mode, setMode] = useState<FlowMode>('oauth');
	const [isGenerating, setIsGenerating] = useState(false);
	const [authUrl, setAuthUrl] = useState<string>('');
	const [error, setError] = useState<string>('');

	// Mode descriptions
	const modeDescriptions = {
		oauth: {
			title: 'OAuth 2.0 Authorization Code Flow',
			description:
				'Standard OAuth 2.0 flow for authorization code grant. Provides access tokens for API access.',
			features: [
				'Access token for API access',
				'Refresh token for long-term access',
				'Standard OAuth 2.0 compliance',
				'Widely supported across platforms',
			],
		},
		oidc: {
			title: 'OpenID Connect (OIDC) Authorization Code Flow',
			description:
				'OAuth 2.0 + OpenID Connect. Provides both access tokens and user identity information.',
			features: [
				'Access token for API access',
				'ID token for user identity',
				'Refresh token for long-term access',
				'User profile information',
				'Standard OpenID Connect compliance',
			],
		},
	};

	// Generate authorization URL
	const generateAuthUrl = useCallback(async () => {
		setIsGenerating(true);
		setError('');
		setAuthUrl('');

		try {
			logger.info('UnifiedAuthFlowV7', 'Generating authorization URL', { mode });

			// Simulate URL generation (in real implementation, this would call your auth service)
			const baseUrl = 'https://auth.pingone.com';
			const clientId = 'your-client-id';
			const redirectUri = encodeURIComponent(`${window.location.origin}/callback`);
			const scopes = mode === 'oidc' ? 'openid profile email' : 'read write';

			const state = Math.random().toString(36).substring(7);
			const generatedUrl = `${baseUrl}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}`;

			setAuthUrl(generatedUrl);

			logger.info('UnifiedAuthFlowV7', 'Authorization URL generated successfully', {
				mode,
				urlLength: generatedUrl.length,
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to generate authorization URL';
			setError(errorMessage);
			logger.error(
				'UnifiedAuthFlowV7',
				'Failed to generate authorization URL',
				undefined,
				err as Error
			);
		} finally {
			setIsGenerating(false);
		}
	}, [mode]);

	// Handle authorization
	const handleAuthorize = useCallback(() => {
		if (!authUrl) {
			setError('Please generate an authorization URL first');
			return;
		}

		logger.info('UnifiedAuthFlowV7', 'Redirecting to authorization', { mode, url: authUrl });

		// Store mode in session for callback handling
		sessionStorage.setItem('unified_auth_mode', mode);

		// Redirect to authorization server
		window.location.href = authUrl;
	}, [authUrl, mode]);

	// Check for callback on mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const state = urlParams.get('state');
		const errorParam = urlParams.get('error');

		if (code && state) {
			// Handle successful callback
			const storedMode = sessionStorage.getItem('unified_auth_mode') as FlowMode;

			logger.info('UnifiedAuthFlowV7', 'Authorization callback received', {
				code: `${code.substring(0, 10)}...`,
				mode: storedMode,
			});

			// In real implementation, exchange code for tokens
			onComplete?.({
				success: true,
				mode: storedMode || 'oauth',
				data: { authorizationCode: code, state },
			});

			// Clean up
			sessionStorage.removeItem('unified_auth_mode');
		} else if (errorParam) {
			// Handle error callback
			setError(`Authorization failed: ${errorParam}`);
			onComplete?.({
				success: false,
				mode,
				data: { error: errorParam },
			});
		}
	}, [mode, onComplete]);

	return (
		<FlowContainer className={className}>
			<FlowHeader>
				<FlowTitle>
					<MDIIcon icon="FiShield" size={32} />
					Unified Authorization Code Flow V7
				</FlowTitle>
				<FlowSubtitle>
					Choose between OAuth 2.0 and OpenID Connect flows with a single, unified interface
				</FlowSubtitle>
			</FlowHeader>

			<ModeSelector>
				<ModeButton $active={mode === 'oauth'} onClick={() => setMode('oauth')}>
					<MDIIcon icon="FiKey" size={20} />
					OAuth 2.0
				</ModeButton>
				<ModeButton $active={mode === 'oidc'} onClick={() => setMode('oidc')}>
					<MDIIcon icon="FiShield" size={20} />
					OpenID Connect
				</ModeButton>
			</ModeSelector>

			<ModeDescription>
				<InfoTitle>
					<MDIIcon icon="FiInfo" size={16} />
					{modeDescriptions[mode].title}
				</InfoTitle>
				<InfoText>{modeDescriptions[mode].description}</InfoText>
				<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
					{modeDescriptions[mode].features.map((feature, index) => (
						<li key={index} style={{ color: '#075985', marginBottom: '0.25rem' }}>
							{feature}
						</li>
					))}
				</ul>
			</ModeDescription>

			<ConfigurationSection>
				<SectionTitle>
					<MDIIcon icon="FiSettings" size={20} />
					Authorization Configuration
				</SectionTitle>

				<div style={{ marginBottom: '1rem' }}>
					<strong>Selected Mode:</strong> {mode.toUpperCase()}
				</div>

				<div style={{ marginBottom: '1rem' }}>
					<strong>Flow Type:</strong> Authorization Code Grant
				</div>

				<div style={{ marginBottom: '1rem' }}>
					<strong>Scopes:</strong> {mode === 'oidc' ? 'openid profile email' : 'read write'}
				</div>

				<InfoBox>
					<InfoTitle>
						<MDIIcon icon="FiInfo" size={16} />
						Configuration Notes
					</InfoTitle>
					<InfoText>
						This unified flow automatically handles the differences between OAuth 2.0 and OIDC. When
						OIDC mode is selected, an ID token will be requested in addition to the access token.
					</InfoText>
				</InfoBox>
			</ConfigurationSection>

			{authUrl && (
				<ConfigurationSection>
					<SectionTitle>
						<MDIIcon icon="FiExternalLink" size={20} />
						Generated Authorization URL
					</SectionTitle>
					<div
						style={{
							padding: '1rem',
							background: 'V9_COLORS.BG.GRAY_LIGHT',
							borderRadius: '6px',
							border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							wordBreak: 'break-all',
							fontFamily: 'monospace',
							fontSize: '0.9rem',
						}}
					>
						{authUrl}
					</div>
				</ConfigurationSection>
			)}

			{error && (
				<ConfigurationSection>
					<div
						style={{
							padding: '1rem',
							background: 'V9_COLORS.BG.ERROR',
							borderRadius: '6px',
							border: '1px solid V9_COLORS.BG.ERROR_BORDER',
							color: 'V9_COLORS.PRIMARY.RED_DARK',
						}}
					>
						<strong>Error:</strong> {error}
					</div>
				</ConfigurationSection>
			)}

			<ActionButtons>
				<ButtonSpinner
					loading={isGenerating}
					onClick={generateAuthUrl}
					disabled={isGenerating}
					spinnerSize={16}
					spinnerPosition="left"
					loadingText="Generating..."
					style={{
						padding: '12px 24px',
						border: 'none',
						borderRadius: '8px',
						background: 'V9_COLORS.PRIMARY.BLUE',
						color: 'white',
						fontWeight: '600',
						cursor: 'pointer',
					}}
				>
					<MDIIcon icon="FiSettings" size={16} />
					Generate Authorization URL
				</ButtonSpinner>

				<ButtonSpinner
					loading={false}
					onClick={handleAuthorize}
					disabled={!authUrl || isGenerating}
					spinnerSize={16}
					spinnerPosition="left"
					style={{
						padding: '12px 24px',
						border: 'none',
						borderRadius: '8px',
						background: 'V9_COLORS.PRIMARY.GREEN',
						color: 'white',
						fontWeight: '600',
						cursor: 'pointer',
					}}
				>
					<MDIIcon icon="FiExternalLink" size={16} />
					Authorize
				</ButtonSpinner>
			</ActionButtons>
		</FlowContainer>
	);
};

export default UnifiedAuthorizationCodeFlowV7;
