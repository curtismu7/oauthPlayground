// src/components/ColoredTokenDisplay.tsx
import React, { useState } from 'react';
import { FiExternalLink, FiInfo } from 'react-icons/fi';
import styled from 'styled-components';
import { CopyButtonService } from '../services/copyButtonService';

interface TokenPayload {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	grant_type?: string;
	[key: string]: unknown;
}

interface ColoredTokenDisplayProps {
	tokens: TokenPayload;
	showCopyButton?: boolean;
	showInfoButton?: boolean;
	showOpenButton?: boolean;
	onOpen?: () => void;
	label?: string;
	height?: string;
}

const TokenContainer = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
	position: relative;
	max-width: 100%;
	width: 100%;
	overflow: visible;
	box-sizing: border-box;
`;

const TokenLabel = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const TokenContent = styled.div`
	background: #f0fdf4; /* Light green for generated content */
	border: 1px solid #16a34a;
	border-radius: 8px;
	padding: 1rem 5rem 1rem 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	word-break: break-word;
	white-space: pre-wrap;
	position: relative;
	min-height: ${({ height }) => height || '150px'};
	overflow-x: auto;
	overflow-y: hidden;
	max-width: 100%;
	width: 100%;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
`;

const ColoredTokenText = styled.span<{ $color: string; $fontWeight?: string }>`
	color: ${({ $color }) => $color};
	font-weight: ${({ $fontWeight }) => $fontWeight || '400'};
`;

const ActionButtons = styled.div`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	display: flex;
	gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.75rem;
	border-radius: 4px;
	border: 1px solid ${({ $variant }) => ($variant === 'primary' ? '#3b82f6' : '#d1d5db')};
	background: ${({ $variant }) => ($variant === 'primary' ? '#3b82f6' : 'white')};
	color: ${({ $variant }) => ($variant === 'primary' ? 'white' : '#374151')};
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $variant }) => ($variant === 'primary' ? '#2563eb' : '#f9fafb')};
		border-color: ${({ $variant }) => ($variant === 'primary' ? '#2563eb' : '#9ca3af')};
	}

	&:active {
		transform: translateY(1px);
	}
`;

const InfoModal = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const InfoModalContent = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 700px;
	max-height: 80vh;
	overflow-y: auto;
	margin: 1rem;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const InfoModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
`;

const InfoModalTitle = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	color: #6b7280;
	padding: 0.25rem;

	&:hover {
		color: #374151;
	}
`;

const TokenList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const TokenItem = styled.div`
	padding: 1rem;
	background: #f8fafc;
	border-radius: 8px;
	border-left: 4px solid #3b82f6;
`;

const TokenName = styled.div`
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.25rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const TokenDescription = styled.div`
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
	margin-bottom: 0.5rem;
`;

const TokenValue = styled.div`
	color: #059669;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	word-break: break-all;
	background: #f0fdf4;
	padding: 0.5rem;
	border-radius: 4px;
	border: 1px solid #bbf7d0;
`;

const TokenType = styled.div<{ $type: string }>`
	display: inline-block;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
	background: ${({ $type }) => {
		switch ($type) {
			case 'access_token':
				return '#dbeafe';
			case 'id_token':
				return '#dcfce7';
			case 'refresh_token':
				return '#fef3c7';
			case 'scope':
				return '#e0e7ff';
			default:
				return '#f3f4f6';
		}
	}};
	color: ${({ $type }) => {
		switch ($type) {
			case 'access_token':
				return '#1e40af';
			case 'id_token':
				return '#166534';
			case 'refresh_token':
				return '#92400e';
			case 'scope':
				return '#3730a3';
			default:
				return '#374151';
		}
	}};
`;

// Color scheme for JSON syntax highlighting
const JSON_COLORS = {
	key: '#7c3aed', // Purple for keys
	string: '#059669', // Green for strings
	number: '#dc2626', // Red for numbers
	boolean: '#ea580c', // Orange for booleans
	null: '#6b7280', // Gray for null
	punctuation: '#1f2937', // Dark gray for punctuation
	whitespace: '#ffffff', // White for whitespace
};

type ColoredJsonPart = { text: string; color: string; fontWeight?: string };

const parseJsonWithColors = (obj: unknown, indent = 0): ColoredJsonPart[] => {
	const parts: ColoredJsonPart[] = [];
	const spaces = '  '.repeat(indent);

	if (obj === null) {
		parts.push({ text: 'null', color: JSON_COLORS.null });
	} else if (typeof obj === 'boolean') {
		parts.push({ text: obj.toString(), color: JSON_COLORS.boolean });
	} else if (typeof obj === 'number') {
		parts.push({ text: obj.toString(), color: JSON_COLORS.number });
	} else if (typeof obj === 'string') {
		parts.push({ text: `"${obj}"`, color: JSON_COLORS.string });
	} else if (Array.isArray(obj)) {
		parts.push({ text: '[\n', color: JSON_COLORS.punctuation });
		obj.forEach((item, index) => {
			parts.push({ text: `${spaces}  `, color: JSON_COLORS.whitespace });
			parts.push(...parseJsonWithColors(item, indent + 1));
			if (index < obj.length - 1) {
				parts.push({ text: ',\n', color: JSON_COLORS.punctuation });
			} else {
				parts.push({ text: '\n', color: JSON_COLORS.whitespace });
			}
		});
		parts.push({ text: `${spaces}]`, color: JSON_COLORS.punctuation });
	} else if (typeof obj === 'object') {
		parts.push({ text: '{\n', color: JSON_COLORS.punctuation });
		const record = obj as Record<string, unknown>;
		const keys = Object.keys(record);
		keys.forEach((key, index) => {
			parts.push({ text: `${spaces}  `, color: JSON_COLORS.whitespace });
			parts.push({ text: `"${key}"`, color: JSON_COLORS.key, fontWeight: '600' });
			parts.push({ text: ': ', color: JSON_COLORS.punctuation });
			parts.push(...parseJsonWithColors(record[key], indent + 1));
			if (index < keys.length - 1) {
				parts.push({ text: ',\n', color: JSON_COLORS.punctuation });
			} else {
				parts.push({ text: '\n', color: JSON_COLORS.whitespace });
			}
		});
		parts.push({ text: `${spaces}}`, color: JSON_COLORS.punctuation });
	}

	return parts;
};

const getTokenInfo = (tokens: TokenPayload) => {
	const tokenInfo = [
		{
			name: 'access_token',
			description:
				'The access token that your application can use to make API calls on behalf of the user.',
			type: 'access_token',
			value: tokens.access_token || 'Not present',
		},
		{
			name: 'id_token',
			description: 'The OpenID Connect ID token containing user identity information (JWT format).',
			type: 'id_token',
			value: tokens.id_token || 'Not present',
		},
		{
			name: 'refresh_token',
			description:
				'Token used to obtain new access tokens without requiring user re-authentication.',
			type: 'refresh_token',
			value: tokens.refresh_token || 'Not present',
		},
		{
			name: 'token_type',
			description: 'The type of token issued. Typically "Bearer" for OAuth 2.0 access tokens.',
			type: 'metadata',
			value: tokens.token_type || 'Not specified',
		},
		{
			name: 'expires_in',
			description: 'The number of seconds until the access token expires.',
			type: 'metadata',
			value: tokens.expires_in ? `${tokens.expires_in} seconds` : 'Not specified',
		},
		{
			name: 'scope',
			description: 'The permissions granted to the access token.',
			type: 'scope',
			value: tokens.scope || 'Not specified',
		},
		{
			name: 'grant_type',
			description: 'The OAuth grant type used to obtain these tokens.',
			type: 'metadata',
			value: tokens.grant_type || 'Not specified',
		},
	];

	return tokenInfo.filter(
		(token) => token.value !== 'Not present' && token.value !== 'Not specified'
	);
};

export const ColoredTokenDisplay: React.FC<ColoredTokenDisplayProps> = ({
	tokens,
	showCopyButton = true,
	showInfoButton = true,
	showOpenButton = false,
	onOpen,
	label = 'Raw Token Response',
	height,
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const coloredParts = parseJsonWithColors(tokens);
	const tokenInfo = getTokenInfo(tokens);

	const handleOpen = () => {
		// Open token management or external tool
		onOpen?.();
	};

	return (
		<TokenContainer>
			<TokenLabel>
				{label}
				{showInfoButton && (
					<ActionButton onClick={() => setShowInfo(true)} $variant="secondary">
						<FiInfo size={14} />
						Explain Tokens
					</ActionButton>
				)}
			</TokenLabel>

			<TokenContent height={height}>
				<ActionButtons>
					{showCopyButton && (
						<CopyButtonService
							text={JSON.stringify(tokens, null, 2)}
							label="Token Response"
							size="sm"
							variant="primary"
							showLabel={false}
						/>
					)}
					{showOpenButton && (
						<ActionButton onClick={handleOpen} $variant="secondary">
							<FiExternalLink size={14} />
							Open
						</ActionButton>
					)}
				</ActionButtons>

				{coloredParts.map((part, index) => (
					<ColoredTokenText key={index} $color={part.color} $fontWeight={part.fontWeight}>
						{part.text}
					</ColoredTokenText>
				))}
			</TokenContent>

			<InfoModal $isOpen={showInfo}>
				<InfoModalContent>
					<InfoModalHeader>
						<InfoModalTitle>Token Response Breakdown</InfoModalTitle>
						<CloseButton onClick={() => setShowInfo(false)}>×</CloseButton>
					</InfoModalHeader>

					<TokenList>
						{tokenInfo.map((token, index) => (
							<TokenItem key={index}>
								<TokenType $type={token.type}>{token.type.toUpperCase()}</TokenType>
								<TokenName>{token.name}</TokenName>
								<TokenDescription>{token.description}</TokenDescription>
								<TokenValue>{token.value}</TokenValue>
							</TokenItem>
						))}
					</TokenList>
				</InfoModalContent>
			</InfoModal>
		</TokenContainer>
	);
};

export default ColoredTokenDisplay;
