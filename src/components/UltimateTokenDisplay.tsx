// src/components/UltimateTokenDisplay.tsx
// Ultimate Token Display Component - Combines all the best features

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { V9_COLORS } from '@/services/v9/V9ColorStandards';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { FiClock, FiTag, FiUnlock } from '../icons';
import TokenDisplayService from '../services/tokenDisplayService';

interface TokenSet {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	[key: string]: unknown;
}

type TokenType = 'access' | 'id' | 'refresh';
type FlowType = 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless' | 'token-exchange';
type DisplayMode = 'compact' | 'detailed' | 'educational';

interface UltimateTokenDisplayProps {
	tokens: TokenSet | null;
	flowType?: FlowType;
	flowKey?: string;
	displayMode?: DisplayMode;
	title?: string;
	subtitle?: string;
	showCopyButtons?: boolean;
	showDecodeButtons?: boolean;
	showMaskToggle?: boolean;
	showTokenManagement?: boolean;
	showEducationalInfo?: boolean;
	showMetadata?: boolean;
	showSyntaxHighlighting?: boolean;
	defaultMasked?: boolean;
	className?: string;
	onTokenAnalyze?: (tokenType: TokenType, token: string) => void;
}

// Styled Components
const Container = styled.div<{ $mode: DisplayMode }>`
	display: flex;
	flex-direction: column;
	gap: ${({ $mode }) => ($mode === 'compact' ? '0.75rem' : '1.25rem')};
	background: V9_COLORS.TEXT.WHITE;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: ${({ $mode }) => ($mode === 'educational' ? '12px' : '8px')};
	box-shadow: ${({ $mode }) =>
		$mode === 'educational' ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'};
	overflow: hidden;
`;

const Header = styled.div<{ $mode: DisplayMode }>`
	padding: ${({ $mode }) => ($mode === 'compact' ? '1rem' : '1.5rem')};
	background: ${({ $mode }) =>
		$mode === 'educational'
			? 'linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, V9_COLORS.TEXT.GRAY_LIGHTER 100%)'
			: '#f8fafc'};
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const Title = styled.h3<{ $mode: DisplayMode }>`
	margin: 0 0 ${({ $mode }) => ($mode === 'compact' ? '0.25rem' : '0.5rem')} 0;
	font-size: ${({ $mode }) => ($mode === 'compact' ? '1rem' : '1.25rem')};
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Subtitle = styled.p`
	margin: 0;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const TokenSection = styled.div<{ $variant: TokenType; $mode: DisplayMode }>`
	background: V9_COLORS.TEXT.WHITE;
	border: 1px solid
		${({ $variant }) => {
			switch ($variant) {
				case 'access':
					return '#3b82f6';
				case 'id':
					return '#10b981';
				case 'refresh':
					return '#f59e0b';
				default:
					return '#e5e7eb';
			}
		}};
	border-radius: 8px;
	margin: ${({ $mode }) => ($mode === 'compact' ? '0.5rem' : '1rem')};
	overflow: hidden;
	transition: all 0.2s ease;

	&:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}
`;

const TokenHeader = styled.div<{ $variant: TokenType }>`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.25rem;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'access':
				return 'linear-gradient(135deg, #dbeafe 0%, V9_COLORS.TEXT.GRAY_LIGHTER 100%)';
			case 'id':
				return 'linear-gradient(135deg, V9_COLORS.BG.SUCCESS 0%, V9_COLORS.BG.SUCCESS_BORDER 100%)';
			case 'refresh':
				return 'linear-gradient(135deg, V9_COLORS.BG.WARNING 0%, V9_COLORS.BG.WARNING_BORDER 100%)';
			default:
				return '#f8fafc';
		}
	}};
	border-bottom: 1px solid
		${({ $variant }) => {
			switch ($variant) {
				case 'access':
					return '#93c5fd';
				case 'id':
					return '#86efac';
				case 'refresh':
					return '#fcd34d';
				default:
					return '#e5e7eb';
			}
		}};
`;

const TokenLabel = styled.div<{ $variant: TokenType }>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-weight: 600;
	color: ${({ $variant }) => {
		switch ($variant) {
			case 'access':
				return '#2563eb';
			case 'id':
				return '#10b981';
			case 'refresh':
				return '#d97706';
			default:
				return '#1f2937';
		}
	}};
`;

const TokenBadge = styled.span<{ $variant: TokenType }>`
	display: inline-flex;
	align-items: center;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'access':
				return '#2563eb';
			case 'id':
				return '#10b981';
			case 'refresh':
				return '#d97706';
			default:
				return '#6b7280';
		}
	}};
	color: white;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'warning' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.5rem 0.75rem;
	border-radius: 6px;
	border: none;
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: ${V9_COLORS.PRIMARY.BLUE};
					color: ${V9_COLORS.TEXT.WHITE};
					&:hover { background: ${V9_COLORS.PRIMARY.BLUE_DARK}; transform: translateY(-1px); }
				`;
			case 'success':
				return `
					background: ${V9_COLORS.PRIMARY.GREEN};
					color: ${V9_COLORS.TEXT.WHITE};
					&:hover { background: ${V9_COLORS.PRIMARY.GREEN_DARK}; transform: translateY(-1px); }
				`;
			case 'warning':
				return `
					background: ${V9_COLORS.PRIMARY.YELLOW};
					color: ${V9_COLORS.TEXT.WHITE};
					&:hover { background: ${V9_COLORS.PRIMARY.YELLOW_DARK}; transform: translateY(-1px); }
				`;
			default:
				/* outline primary: never grey when enabled */
				return `
					background: ${V9_COLORS.TEXT.WHITE};
					color: ${V9_COLORS.PRIMARY.BLUE};
					border: 1px solid ${V9_COLORS.PRIMARY.BLUE};
					&:hover { background: ${V9_COLORS.BG.GRAY_LIGHT}; border-color: ${V9_COLORS.PRIMARY.BLUE_DARK}; color: ${V9_COLORS.PRIMARY.BLUE_DARK}; transform: translateY(-1px); }
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
		background: ${V9_COLORS.TEXT.GRAY_LIGHT} !important;
		border-color: ${V9_COLORS.TEXT.GRAY_LIGHT} !important;
		color: ${V9_COLORS.TEXT.GRAY_MEDIUM} !important;
	}
`;

const TokenContent = styled.div`
	padding: 1.25rem;
`;

const TokenValue = styled.div<{ $masked?: boolean; $highlighted?: boolean }>`
	font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	color: V9_COLORS.TEXT.GRAY_DARK;
	background: ${({ $highlighted }) => ($highlighted ? '#f0fdf4' : '#f8fafc')};
	border: 1px solid ${({ $highlighted }) => ($highlighted ? '#10b981' : '#e5e7eb')};
	border-radius: 6px;
	padding: 1rem;
	word-break: break-all;
	white-space: pre-wrap;
	overflow-x: auto;
	margin-bottom: 1rem;
	position: relative;

	${({ $masked }) =>
		$masked &&
		`
    filter: blur(4px);
    user-select: none;
    transition: filter 0.3s ease;
    
    &:hover {
      filter: blur(2px);
    }
  `}
`;

const DecodedSection = styled.div`
	margin-top: 1rem;
	padding-top: 1rem;
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const DecodedTitle = styled.h4`
	margin: 0 0 0.75rem 0;
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const DecodedContent = styled.div`
	background: #f0fdf4;
	border: 1px solid V9_COLORS.PRIMARY.GREEN;
	border-radius: 6px;
	padding: 1rem;
	font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
	font-size: 0.75rem;
	line-height: 1.5;
	color: V9_COLORS.TEXT.GRAY_DARK;
	overflow-x: auto;
	white-space: pre-wrap;
	max-height: 300px;
	overflow-y: auto;
`;

const MetadataGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
	padding: 1rem;
	background: V9_COLORS.BG.GRAY_LIGHT;
	border-radius: 6px;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const MetadataItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const MetadataLabel = styled.span`
	font-size: 0.75rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const MetadataValue = styled.span`
	font-size: 0.875rem;
	font-weight: 500;
	color: V9_COLORS.TEXT.GRAY_DARK;
	font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
`;

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem 2rem;
	text-align: center;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const EmptyStateIcon = styled.div`
	font-size: 3rem;
	margin-bottom: 1rem;
	opacity: 0.5;
`;

const EmptyStateText = styled.p`
	margin: 0;
	font-size: 1rem;
	font-weight: 500;
`;

const OpaqueMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem;
	background: V9_COLORS.BG.WARNING;
	border: 1px solid V9_COLORS.PRIMARY.YELLOW;
	border-radius: 6px;
	color: V9_COLORS.PRIMARY.YELLOW_DARK;
	font-size: 0.875rem;
	margin-top: 1rem;
`;

const _SyntaxHighlightedJSON = styled.div`
	font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
	font-size: 0.875rem;
	line-height: 1.6;

	.json-key {
		color: #7c3aed;
		font-weight: 600;
	}
	.json-string {
		color: V9_COLORS.PRIMARY.GREEN_DARK;
	}
	.json-number {
		color: V9_COLORS.PRIMARY.RED_DARK;
	}
	.json-boolean {
		color: #ea580c;
	}
	.json-null {
		color: V9_COLORS.TEXT.GRAY_MEDIUM;
	}
	.json-punctuation {
		color: V9_COLORS.TEXT.GRAY_DARK;
	}
`;

// Component Implementation
export const UltimateTokenDisplay: React.FC<UltimateTokenDisplayProps> = ({
	tokens,
	flowType = 'oauth',
	flowKey = '',
	displayMode = 'detailed',
	title,
	subtitle,
	showCopyButtons = true,
	showDecodeButtons = true,
	showMaskToggle: _showMaskToggle = true,
	showTokenManagement: _showTokenManagement = true,
	showEducationalInfo: _showEducationalInfo = false,
	showMetadata = true,
	showSyntaxHighlighting = false,
	defaultMasked: _defaultMasked = false,
	className,
	onTokenAnalyze,
}) => {
	const navigate = useNavigate();

	// State management - tokens always visible (no masking)
	const [maskedStates] = useState<Record<TokenType, boolean>>({
		access: false,
		id: false,
		refresh: false,
	});

	const [decodedStates, setDecodedStates] = useState<Record<TokenType, boolean>>({
		access: false,
		id: false,
		refresh: false,
	});

	const [copiedStates, setCopiedStates] = useState<Record<TokenType, boolean>>({
		access: false,
		id: false,
		refresh: false,
	});
	const [showInfo, setShowInfo] = useState(false);

	// Computed values
	const availableTokens = useMemo(() => {
		if (!tokens) return [] as TokenType[];
		const tokenKeys: TokenType[] = ['access', 'id', 'refresh'];
		return tokenKeys.filter((key) => {
			const tokenKey = `${key}_token` as keyof TokenSet;
			return typeof tokens[tokenKey] === 'string' && tokens[tokenKey];
		});
	}, [tokens]);

	const isOIDCFlow = flowType === 'oidc' || flowType === 'rar' || flowType === 'redirectless';

	// Helper functions
	const getTokenIcon = (tokenType: TokenType) => {
		switch (tokenType) {
			case 'access':
				return <span style={{ fontSize: '16px' }}>🔑</span>;
			case 'id':
				return <span style={{ fontSize: '16px' }}>🛡️</span>;
			case 'refresh':
				return <span style={{ fontSize: '16px' }}>⚡</span>;
			default:
				return <span style={{ fontSize: '16px' }}>🔒</span>;
		}
	};

	const getTokenLabel = (tokenType: TokenType) => {
		switch (tokenType) {
			case 'access':
				return 'Access Token';
			case 'id':
				return isOIDCFlow ? 'ID Token (OIDC)' : 'ID Token';
			case 'refresh':
				return 'Refresh Token';
			default:
				return 'Token';
		}
	};

	const maskToken = (token: string) => {
		if (token.length <= 24) return '••••••••••••••••••••';
		return `${token.substring(0, 8)}••••••••••••••••••••${token.substring(token.length - 8)}`;
	};

	const formatExpiry = (seconds: number) => {
		if (!seconds || Number.isNaN(seconds)) return 'Unknown';
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
		if (minutes > 0) return `${minutes}m ${secs}s`;
		return `${secs}s`;
	};

	// Event handlers
	const handleToggleDecode = (tokenType: TokenType) => {
		setDecodedStates((prev) => ({ ...prev, [tokenType]: !prev[tokenType] }));
	};

	const handleCopy = async (tokenType: TokenType, token: string) => {
		try {
			await navigator.clipboard.writeText(token);
			setCopiedStates((prev) => ({ ...prev, [tokenType]: true }));
			modernMessaging.showFooterMessage({
				type: 'status',
				message: `${getTokenLabel(tokenType)} copied to clipboard`,
				duration: 4000,
			});

			setTimeout(() => {
				setCopiedStates((prev) => ({ ...prev, [tokenType]: false }));
			}, 2000);
		} catch (_error) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to copy token',
				dismissible: true,
			});
		}
	};

	const handleSendToTokenManagement = (tokenType: TokenType, token: string) => {
		navigate('/token-management', {
			state: {
				token,
				tokenType,
				label: getTokenLabel(tokenType),
				source: flowKey || 'ultimate-token-display',
			},
		});
		modernMessaging.showFooterMessage({
			type: 'status',
			message: `${getTokenLabel(tokenType)} sent to Token Management`,
			duration: 4000,
		});
	};

	const renderToken = (tokenType: TokenType) => {
		const tokenKey = `${tokenType}_token` as keyof TokenSet;
		const token = tokens![tokenKey] as string;
		const isMasked = maskedStates[tokenType];
		const isDecoded = decodedStates[tokenType];
		const isCopied = copiedStates[tokenType];
		const isJWT = TokenDisplayService.isJWT(token);

		let decodedContent = null;
		if (isDecoded && isJWT) {
			decodedContent = TokenDisplayService.decodeJWT(token);
		}

		return (
			<TokenSection key={tokenType} $variant={tokenType} $mode={displayMode}>
				<TokenHeader $variant={tokenType}>
					<TokenLabel $variant={tokenType}>
						{getTokenIcon(tokenType)}
						{getTokenLabel(tokenType)}
						<TokenBadge $variant={tokenType}>{tokenType}</TokenBadge>
					</TokenLabel>

					<ActionButtons>
						{showDecodeButtons && isJWT && (
							<ActionButton
								onClick={() => handleToggleDecode(tokenType)}
								title={isDecoded ? 'Hide decoded content' : 'Show decoded content'}
								$variant="warning"
							>
								<i className="bi bi-question-circle" style={{ fontSize: '14px' }}></i>
								{isDecoded ? 'Hide Decode' : 'Decode JWT'}
							</ActionButton>
						)}

						{showCopyButtons && (
							<ActionButton
								onClick={() => handleCopy(tokenType, token)}
								title="Copy token"
								$variant="primary"
							>
								{isCopied ? (
									<span style={{ fontSize: '14px' }}>✅</span>
								) : (
									<span style={{ fontSize: '14px' }}>📋</span>
								)}
								{isCopied ? 'Copied!' : 'Copy'}
							</ActionButton>
						)}

						{_showTokenManagement && (
							<ActionButton
								onClick={() => handleSendToTokenManagement(tokenType, token)}
								title="Send to Token Management"
								$variant="success"
							>
								<span style={{ fontSize: '14px' }}>🔗</span>
								Analyze
							</ActionButton>
						)}

						{onTokenAnalyze && (
							<ActionButton
								onClick={() => onTokenAnalyze(tokenType, token)}
								title="Custom analysis"
							>
								<span style={{ fontSize: '14px' }}>⚡</span>
								Analyze
							</ActionButton>
						)}
					</ActionButtons>
				</TokenHeader>

				<TokenContent>
					<TokenValue $masked={isMasked} $highlighted={showSyntaxHighlighting}>
						{isMasked ? maskToken(token) : token}
					</TokenValue>

					{isDecoded && (
						<DecodedSection>
							{!isJWT ? (
								<OpaqueMessage>
									<span style={{ fontSize: '20px' }}>⚠️</span>
									{TokenDisplayService.getOpaqueTokenMessage(tokenType)}
								</OpaqueMessage>
							) : decodedContent ? (
								<>
									<DecodedTitle>
										<span style={{ fontSize: '16px' }}>🔑</span>
										JWT Header
									</DecodedTitle>
									<DecodedContent>{JSON.stringify(decodedContent.header, null, 2)}</DecodedContent>

									<DecodedTitle style={{ marginTop: '1rem' }}>
										<span style={{ fontSize: '16px' }}>🛡️</span>
										JWT Payload
									</DecodedTitle>
									<DecodedContent>{JSON.stringify(decodedContent.payload, null, 2)}</DecodedContent>
								</>
							) : (
								<OpaqueMessage>
									<span style={{ fontSize: '20px' }}>⚠️</span>
									Failed to decode JWT token
								</OpaqueMessage>
							)}
						</DecodedSection>
					)}
				</TokenContent>
			</TokenSection>
		);
	};

	// Main render
	if (!tokens || availableTokens.length === 0) {
		return (
			<Container $mode={displayMode} className={className}>
				<EmptyState>
					<EmptyStateIcon>
						<span>🔒</span>
					</EmptyStateIcon>
					<EmptyStateText>
						No tokens available yet. Complete the authentication flow to retrieve tokens.
					</EmptyStateText>
				</EmptyState>
			</Container>
		);
	}

	const displayTitle = title || `${flowType.toUpperCase()} Tokens`;
	const displaySubtitle =
		subtitle ||
		`${availableTokens.length} token${availableTokens.length !== 1 ? 's' : ''} retrieved from ${flowKey || 'authentication flow'}`;

	return (
		<Container $mode={displayMode} className={className}>
			<Header $mode={displayMode}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						gap: '1rem',
					}}
				>
					<div>
						<Title $mode={displayMode}>
							<span style={{ fontSize: '20px' }}>🛡️</span>
							{displayTitle}
						</Title>
						{subtitle !== false && <Subtitle>{displaySubtitle}</Subtitle>}
					</div>
					<ButtonSpinner
						loading={false}
						onClick={() => setShowInfo((prev) => !prev)}
						spinnerSize={10}
						spinnerPosition="left"
						loadingText="Loading..."
						style={{
							padding: '6px 12px',
							borderRadius: '999px',
							border: '1px solid #c7d2fe',
							background: showInfo ? '#e0e7ff' : '#eef2ff',
							color: '#312e81',
							fontWeight: 600,
							cursor: 'pointer',
							fontSize: '0.85rem',
							whiteSpace: 'nowrap',
						}}
					>
						{showInfo ? 'Hide token guide' : 'What is this?'}
					</ButtonSpinner>
				</div>
			</Header>

			{showInfo && (
				<div
					style={{
						padding: '16px 20px',
						background: '#fefce8',
						borderBottom: '1px solid #fcd34d',
						color: '#7c2d12',
						fontSize: '0.9rem',
						lineHeight: 1.6,
					}}
				>
					<strong>Token viewer primer:</strong>
					<ul style={{ margin: '8px 0 0 20px' }}>
						<li>
							Each colored card represents a different token returned from PingOne (access, ID,
							refresh).
						</li>
						<li>
							Use the copy, decode, and analyze buttons to inspect JWT structure, scopes, and
							expiry.
						</li>
						<li>
							Masking is off by default so you can see the raw string—use the toggle if you need to
							hide secrets before screensharing.
						</li>
						<li>
							The metadata grid at the bottom summarizes token type, expiry, and scopes for quick
							reference.
						</li>
					</ul>
				</div>
			)}

			{availableTokens.map(renderToken)}

			{showMetadata && (tokens.token_type || tokens.expires_in || tokens.scope) && (
				<MetadataGrid>
					{tokens.token_type && (
						<MetadataItem>
							<MetadataLabel>
								<FiTag size={12} style={{ marginRight: '0.25rem' }} />
								Token Type
							</MetadataLabel>
							<MetadataValue>{tokens.token_type}</MetadataValue>
						</MetadataItem>
					)}

					{typeof tokens.expires_in === 'number' && (
						<MetadataItem>
							<MetadataLabel>
								<FiClock size={12} style={{ marginRight: '0.25rem' }} />
								Expires In
							</MetadataLabel>
							<MetadataValue>{formatExpiry(tokens.expires_in)}</MetadataValue>
						</MetadataItem>
					)}

					{tokens.scope && (
						<MetadataItem>
							<MetadataLabel>
								<FiUnlock size={12} style={{ marginRight: '0.25rem' }} />
								Scope
							</MetadataLabel>
							<MetadataValue>{tokens.scope}</MetadataValue>
						</MetadataItem>
					)}
				</MetadataGrid>
			)}
		</Container>
	);
};

export default UltimateTokenDisplay;
