// src/services/unifiedTokenDisplayService.tsx
import React from 'react';
import { FiCopy, FiExternalLink, FiEyeOff, FiInfo, FiKey } from 'react-icons/fi';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import TokenDisplayService from './tokenDisplayService';

// Styled components for unified token display
const TokenContainer = styled.div`
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	margin-bottom: 1rem;
	overflow: hidden;
`;

const TokenHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem;
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border-bottom: 1px solid #e2e8f0;
`;

const TokenLabel = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	color: #1f2937;
	font-size: 0.875rem;
`;

const TokenBadge = styled.span<{ $type: 'access' | 'id' | 'refresh' }>`
	display: inline-flex;
	align-items: center;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 500;
	${({ $type }) => {
		switch ($type) {
			case 'access':
				return `background-color: #dbeafe; color: #1e40af;`;
			case 'id':
				return `background-color: #dcfce7; color: #166534;`;
			case 'refresh':
				return `background-color: #fef3c7; color: #92400e;`;
			default:
				return `background-color: #e5e7eb; color: #4b5563;`;
		}
	}}
`;

const TokenActions = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' | 'management' }>`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.5rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 500;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;

	${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover {
						background: #2563eb;
						transform: translateY(-1px);
						box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
					}
				`;
			case 'secondary':
				return `
					background: #f3f4f6;
					color: #374151;
					&:hover {
						background: #e5e7eb;
						transform: translateY(-1px);
						box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
					}
				`;
			case 'management':
				return `
					background: linear-gradient(135deg, #10b981 0%, #059669 100%);
					color: white;
					&:hover {
						background: linear-gradient(135deg, #059669 0%, #047857 100%);
						transform: translateY(-1px);
						box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
					}
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
	padding: 1.5rem;
	min-height: 120px;
	max-height: 400px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
`;

const TokenValue = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
	font-size: 0.875rem;
	color: #374151;
	word-break: break-all;
	white-space: pre-wrap;
	margin-bottom: 1rem;
	max-height: 300px;
	overflow-y: auto;
`;

const DecodedContent = styled.pre`
	background: #f0fdf4; /* Light green for generated content */
	border: 1px solid #16a34a;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
	font-size: 0.75rem;
	color: #1f2937;
	overflow-y: auto;
	max-height: 300px;
	margin-top: 0.5rem;
	margin-bottom: 0;
`;

const OpaqueMessage = styled.div`
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 0.5rem;
	padding: 1rem;
	color: #92400e;
	font-size: 0.875rem;
	margin-top: 0.5rem;
`;

// Token response type
interface TokenResponse {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	[key: string]: unknown;
}

// Props interface
interface UnifiedTokenDisplayProps {
	tokens: TokenResponse | null;
	flowType: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless';
	flowKey: string;
	showCopyButtons?: boolean;
	showDecodeButtons?: boolean;
	className?: string;
}

// Main component
export const UnifiedTokenDisplay: React.FC<UnifiedTokenDisplayProps> = ({
	tokens,
	flowType,
	flowKey,
	showCopyButtons = true,
	showDecodeButtons = true,
	className,
}) => {
	// Hooks must be called before any early returns
	const [decodedStates, setDecodedStates] = React.useState<Record<string, unknown>>({});
	const [isDecodedStates, setIsDecodedStates] = React.useState<Record<string, boolean>>({});
	const navigate = useNavigate();

	if (!tokens) {
		return null;
	}

	const isOIDC = flowType === 'oidc' || flowType === 'rar' || flowType === 'redirectless';

	const handleCopy = async (token: string, label: string) => {
		await TokenDisplayService.copyToClipboard(token, label);
	};

	const handleDecode = (token: string, label: string) => {
		if (!TokenDisplayService.isJWT(token)) {
			v4ToastManager.showSuccess(`${label} is opaque and cannot be decoded as JWT.`);
			return null;
		}

		const decoded = TokenDisplayService.decodeJWT(token);
		if (decoded) {
			return decoded;
		}
		return null;
	};

	const handleDecodeClick = (token: string, label: string) => {
		const tokenKey = `${label}-${token.substring(0, 20)}`;
		const isDecoded = isDecodedStates[tokenKey] || false;

		if (isDecoded) {
			// Encode: hide decoded content
			setDecodedStates((prev) => ({ ...prev, [tokenKey]: null }));
			setIsDecodedStates((prev) => ({ ...prev, [tokenKey]: false }));
		} else {
			// Decode: show decoded content
			const result = handleDecode(token, label);
			setDecodedStates((prev) => ({ ...prev, [tokenKey]: result }));
			setIsDecodedStates((prev) => ({ ...prev, [tokenKey]: true }));
		}
	};

	const handleSendToTokenManagement = (
		token: string,
		tokenType: 'access' | 'id' | 'refresh',
		label: string,
		navigate: NavigateFunction
	) => {
		// Navigate to Token Management page with token in state
		navigate('/token-management', {
			state: {
				token,
				tokenType,
				label,
				source: flowKey || 'unknown',
			},
		});
		v4ToastManager.showSuccess(`${label} sent to Token Management`);
	};

	const renderToken = (
		token: string,
		label: string,
		tokenType: 'access' | 'id' | 'refresh',
		navigate: NavigateFunction
	) => {
		const tokenKey = `${label}-${token.substring(0, 20)}`;
		const decoded = decodedStates[tokenKey];
		const isDecoded = isDecodedStates[tokenKey] || false;

		return (
			<TokenContainer key={tokenType} className={className}>
				<TokenHeader>
					<TokenLabel>
						{label}
						<TokenBadge $type={tokenType}>
							{tokenType.toUpperCase()} {isOIDC && tokenType === 'id' && '(OIDC)'}
						</TokenBadge>
					</TokenLabel>
					<TokenActions>
						{showDecodeButtons && (
							<ActionButton $variant="secondary" onClick={() => handleDecodeClick(token, label)}>
								{isDecoded ? <FiEyeOff size={14} /> : <FiKey size={14} />}
								{isDecoded ? 'Encode' : 'Decode'}
							</ActionButton>
						)}
						{showCopyButtons && (
							<ActionButton $variant="primary" onClick={() => handleCopy(token, label)}>
								<FiCopy size={14} />
								Copy
							</ActionButton>
						)}
						<ActionButton
							$variant="management"
							onClick={() => handleSendToTokenManagement(token, tokenType, label, navigate)}
						>
							<FiExternalLink size={14} />
							Token Management
						</ActionButton>
					</TokenActions>
				</TokenHeader>
				<TokenContent>
					{!isDecoded ? (
						<TokenValue>{token}</TokenValue>
					) : (
						<DecodedContent>
							{decoded
								? JSON.stringify(decoded, null, 2)
								: 'Token is opaque and cannot be decoded as JWT.'}
						</DecodedContent>
					)}
					{!isDecoded && showDecodeButtons && !TokenDisplayService.isJWT(token) && (
						<OpaqueMessage>
							<FiInfo size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
							{label} is opaque and cannot be decoded as JWT.
						</OpaqueMessage>
					)}
				</TokenContent>
			</TokenContainer>
		);
	};

	return (
		<div style={{ maxWidth: '800px', margin: '0 auto' }}>
			{/* Access Token */}
			{tokens.access_token &&
				renderToken(String(tokens.access_token), 'Access Token', 'access', navigate)}

			{/* ID Token - OIDC flows only */}
			{isOIDC &&
				tokens.id_token &&
				renderToken(String(tokens.id_token), 'ID Token (OIDC)', 'id', navigate)}

			{/* Refresh Token */}
			{tokens.refresh_token &&
				renderToken(String(tokens.refresh_token), 'Refresh Token', 'refresh', navigate)}
		</div>
	);
};

// Service class for easy integration
export class UnifiedTokenDisplayService {
	/**
	 * Show unified token display with flow-specific configuration
	 */
	static showTokens(
		tokens: TokenResponse | null,
		flowType: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless',
		flowKey: string,
		options?: {
			showCopyButtons?: boolean;
			showDecodeButtons?: boolean;
			className?: string;
		}
	) {
		return (
			<UnifiedTokenDisplay
				tokens={tokens}
				flowType={flowType}
				flowKey={flowKey}
				showCopyButtons={options?.showCopyButtons}
				showDecodeButtons={options?.showDecodeButtons}
				className={options?.className}
			/>
		);
	}

	/**
	 * Get flow-specific configuration
	 */
	static getFlowConfig(flowType: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless') {
		const configs = {
			oauth: {
				name: 'OAuth 2.0 Authorization Code',
				showIdToken: false,
				showAccessToken: true,
				showRefreshToken: true,
			},
			oidc: {
				name: 'OpenID Connect Authorization Code',
				showIdToken: true,
				showAccessToken: true,
				showRefreshToken: true,
			},
			par: {
				name: 'PingOne PAR Flow',
				showIdToken: false,
				showAccessToken: true,
				showRefreshToken: true,
			},
			rar: {
				name: 'Rich Authorization Request',
				showIdToken: true,
				showAccessToken: true,
				showRefreshToken: true,
			},
			redirectless: {
				name: 'Redirectless Authentication',
				showIdToken: true,
				showAccessToken: true,
				showRefreshToken: true,
			},
		};

		return configs[flowType];
	}
}

export default UnifiedTokenDisplayService;
