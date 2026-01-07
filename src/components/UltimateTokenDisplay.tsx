// src/components/UltimateTokenDisplay.tsx
// Ultimate Token Display Component - Combines all the best features
import React, { useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiCheck,
	FiClock,
	FiCode,
	FiCopy,
	FiExternalLink,
	FiKey,
	FiLock,
	FiShield,
	FiTag,
	FiUnlock,
	FiZap,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import TokenDisplayService from '../services/tokenDisplayService';
import { v4ToastManager } from '../utils/v4ToastMessages';

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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: ${({ $mode }) => ($mode === 'educational' ? '12px' : '8px')};
  box-shadow: ${({ $mode }) =>
		$mode === 'educational' ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'};
  overflow: hidden;
`;

const Header = styled.div<{ $mode: DisplayMode }>`
  padding: ${({ $mode }) => ($mode === 'compact' ? '1rem' : '1.5rem')};
  background: ${({ $mode }) =>
		$mode === 'educational' ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' : '#f8fafc'};
  border-bottom: 1px solid #e2e8f0;
`;

const Title = styled.h3<{ $mode: DisplayMode }>`
  margin: 0 0 ${({ $mode }) => ($mode === 'compact' ? '0.25rem' : '0.5rem')} 0;
  font-size: ${({ $mode }) => ($mode === 'compact' ? '1rem' : '1.25rem')};
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const TokenSection = styled.div<{ $variant: TokenType; $mode: DisplayMode }>`
  background: #ffffff;
  border: 1px solid ${({ $variant }) => {
		switch ($variant) {
			case 'access':
				return '#3b82f6';
			case 'id':
				return '#22c55e';
			case 'refresh':
				return '#f59e0b';
			default:
				return '#e2e8f0';
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
				return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
			case 'id':
				return 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)';
			case 'refresh':
				return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
			default:
				return '#f8fafc';
		}
	}};
  border-bottom: 1px solid ${({ $variant }) => {
		switch ($variant) {
			case 'access':
				return '#93c5fd';
			case 'id':
				return '#86efac';
			case 'refresh':
				return '#fcd34d';
			default:
				return '#e2e8f0';
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
				return '#1e40af';
			case 'id':
				return '#166534';
			case 'refresh':
				return '#92400e';
			default:
				return '#374151';
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
				return '#1e40af';
			case 'id':
				return '#166534';
			case 'refresh':
				return '#92400e';
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
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; transform: translateY(-1px); }
        `;
			case 'success':
				return `
          background: #22c55e;
          color: white;
          &:hover { background: #16a34a; transform: translateY(-1px); }
        `;
			case 'warning':
				return `
          background: #f59e0b;
          color: white;
          &:hover { background: #d97706; transform: translateY(-1px); }
        `;
			default:
				return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover { background: #e5e7eb; transform: translateY(-1px); }
        `;
		}
	}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const TokenContent = styled.div`
  padding: 1.25rem;
`;

const TokenValue = styled.div<{ $masked?: boolean; $highlighted?: boolean }>`
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #374151;
  background: ${({ $highlighted }) => ($highlighted ? '#f0fdf4' : '#f8fafc')};
  border: 1px solid ${({ $highlighted }) => ($highlighted ? '#22c55e' : '#e2e8f0')};
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
  border-top: 1px solid #e2e8f0;
`;

const DecodedTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DecodedContent = styled.div`
  background: #f0fdf4;
  border: 1px solid #22c55e;
  border-radius: 6px;
  padding: 1rem;
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #374151;
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
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
`;

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MetadataLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetadataValue = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: #6b7280;
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
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.875rem;
  margin-top: 1rem;
`;

const _SyntaxHighlightedJSON = styled.div`
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  
  .json-key { color: #7c3aed; font-weight: 600; }
  .json-string { color: #059669; }
  .json-number { color: #dc2626; }
  .json-boolean { color: #ea580c; }
  .json-null { color: #6b7280; }
  .json-punctuation { color: #374151; }
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
				return <FiKey size={16} />;
			case 'id':
				return <FiShield size={16} />;
			case 'refresh':
				return <FiZap size={16} />;
			default:
				return <FiLock size={16} />;
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
			v4ToastManager.showSuccess(`${getTokenLabel(tokenType)} copied to clipboard`);

			setTimeout(() => {
				setCopiedStates((prev) => ({ ...prev, [tokenType]: false }));
			}, 2000);
		} catch (_error) {
			v4ToastManager.showError('Failed to copy token');
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
		v4ToastManager.showSuccess(`${getTokenLabel(tokenType)} sent to Token Management`);
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
								<FiCode size={14} />
								{isDecoded ? 'Hide Decode' : 'Decode JWT'}
							</ActionButton>
						)}

						{showCopyButtons && (
							<ActionButton
								onClick={() => handleCopy(tokenType, token)}
								title="Copy token"
								$variant="primary"
							>
								{isCopied ? <FiCheck size={14} /> : <FiCopy size={14} />}
								{isCopied ? 'Copied!' : 'Copy'}
							</ActionButton>
						)}

						{showTokenManagement && (
							<ActionButton
								onClick={() => handleSendToTokenManagement(tokenType, token)}
								title="Send to Token Management"
								$variant="success"
							>
								<FiExternalLink size={14} />
								Analyze
							</ActionButton>
						)}

						{onTokenAnalyze && (
							<ActionButton
								onClick={() => onTokenAnalyze(tokenType, token)}
								title="Custom analysis"
							>
								<FiZap size={14} />
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
									<FiAlertCircle size={20} />
									{TokenDisplayService.getOpaqueTokenMessage(tokenType)}
								</OpaqueMessage>
							) : decodedContent ? (
								<>
									<DecodedTitle>
										<FiKey size={16} />
										JWT Header
									</DecodedTitle>
									<DecodedContent>{JSON.stringify(decodedContent.header, null, 2)}</DecodedContent>

									<DecodedTitle style={{ marginTop: '1rem' }}>
										<FiShield size={16} />
										JWT Payload
									</DecodedTitle>
									<DecodedContent>{JSON.stringify(decodedContent.payload, null, 2)}</DecodedContent>
								</>
							) : (
								<OpaqueMessage>
									<FiAlertCircle size={20} />
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
						<FiLock />
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
							<FiShield size={20} />
							{displayTitle}
						</Title>
						{subtitle !== false && <Subtitle>{displaySubtitle}</Subtitle>}
					</div>
					<button
						type="button"
						onClick={() => setShowInfo((prev) => !prev)}
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
					</button>
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
