// src/components/UltimateTokenDisplayModal.tsx
// Modal wrapper for Ultimate Token Display with VSCode-style syntax highlighting

import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
	FiAlertCircle,
	FiCheck,
	FiCode,
	FiCopy,
	FiEye,
	FiEyeOff,
	FiKey,
	FiShield,
	FiZap,
} from '../services/commonImportsService';
import TokenDisplayService from '../services/tokenDisplayService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { DraggableModal } from './DraggableModal';

interface TokenSet {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
}

type TokenType = 'access' | 'id' | 'refresh';

interface UltimateTokenDisplayModalProps {
	isOpen: boolean;
	onClose: () => void;
	tokens: TokenSet;
	title?: string;
}

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: calc(85vh - 100px);
  overflow-y: auto;
`;

const TokenSection = styled.div<{ $variant: TokenType }>`
  background: #ffffff;
  border: 2px solid ${({ $variant }) => {
		switch ($variant) {
			case 'access':
				return '#3b82f6';
			case 'id':
				return '#22c55e';
			case 'refresh':
				return '#f59e0b';
		}
	}};
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
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
		}
	}};
  border-bottom: 2px solid ${({ $variant }) => {
		switch ($variant) {
			case 'access':
				return '#93c5fd';
			case 'id':
				return '#86efac';
			case 'refresh':
				return '#fcd34d';
		}
	}};
`;

const TokenLabel = styled.div<{ $variant: TokenType }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: ${({ $variant }) => {
		switch ($variant) {
			case 'access':
				return '#1e40af';
			case 'id':
				return '#166534';
			case 'refresh':
				return '#92400e';
		}
	}};
`;

const TokenBadge = styled.span<{ $variant: TokenType }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
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
		}
	}};
  color: white;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'warning' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4); }
        `;
			case 'warning':
				return `
          background: #f59e0b;
          color: white;
          &:hover { background: #d97706; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4); }
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
`;

const TokenContent = styled.div`
  padding: 1.25rem;
`;

const TokenValue = styled.div<{ $masked?: boolean }>`
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #1e293b;
  background: #1e1e1e; /* VSCode dark background */
  border: 1px solid #3e3e42;
  border-radius: 6px;
  padding: 1rem;
  word-break: break-all;
  white-space: pre-wrap;
  overflow-x: auto;
  margin-bottom: 1rem;
  color: #d4d4d4; /* VSCode default text color */
  
  ${({ $masked }) =>
		$masked &&
		`
    filter: blur(4px);
    user-select: none;
    transition: filter 0.3s ease;
    cursor: not-allowed;
    
    &:hover {
      filter: blur(2px);
    }
  `}
`;

const DecodedSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #e2e8f0;
`;

const DecodedTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DecodedContent = styled.pre`
  background: #1e1e1e; /* VSCode dark background */
  border: 1px solid #3e3e42;
  border-radius: 6px;
  padding: 1rem;
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
  max-height: 300px;
  overflow-y: auto;
  margin: 0 0 1rem 0;
  color: #d4d4d4; /* VSCode default text color */
  
  /* VSCode-style syntax highlighting */
  .json-key { color: #9cdcfe; } /* Light blue for keys */
  .json-string { color: #ce9178; } /* Orange for strings */
  .json-number { color: #b5cea8; } /* Light green for numbers */
  .json-boolean { color: #569cd6; } /* Blue for booleans */
  .json-null { color: #569cd6; } /* Blue for null */
  .json-punctuation { color: #d4d4d4; } /* Default for punctuation */
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
  font-size: 0.7rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetadataValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
`;

// Syntax highlighting helper
const syntaxHighlightJSON = (json: string): JSX.Element => {
	const highlighted = json.replace(
		/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
		(match) => {
			let cls = 'json-number';
			if (/^"/.test(match)) {
				if (/:$/.test(match)) {
					cls = 'json-key';
				} else {
					cls = 'json-string';
				}
			} else if (/true|false/.test(match)) {
				cls = 'json-boolean';
			} else if (/null/.test(match)) {
				cls = 'json-null';
			}
			return `<span class="${cls}">${match}</span>`;
		}
	);

	return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

export const UltimateTokenDisplayModal: React.FC<UltimateTokenDisplayModalProps> = ({
	isOpen,
	onClose,
	tokens,
	title = 'OAuth Tokens',
}) => {
	// Tokens always visible (no masking)
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

	const availableTokens = useMemo(() => {
		const tokenKeys: TokenType[] = ['access', 'id', 'refresh'];
		return tokenKeys.filter((key) => {
			const tokenKey = `${key}_token` as keyof TokenSet;
			return typeof tokens[tokenKey] === 'string' && tokens[tokenKey];
		});
	}, [tokens]);

	const getTokenIcon = (tokenType: TokenType) => {
		switch (tokenType) {
			case 'access':
				return <FiKey size={16} />;
			case 'id':
				return <FiShield size={16} />;
			case 'refresh':
				return <FiZap size={16} />;
		}
	};

	const getTokenLabel = (tokenType: TokenType) => {
		switch (tokenType) {
			case 'access':
				return 'Access Token';
			case 'id':
				return 'ID Token';
			case 'refresh':
				return 'Refresh Token';
		}
	};

	const maskToken = (token: string) => {
		if (token.length <= 24) return '••••••••••••••••••••';
		return `${token.substring(0, 12)}${'•'.repeat(20)}${token.substring(token.length - 12)}`;
	};

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

	const renderToken = (tokenType: TokenType) => {
		const tokenKey = `${tokenType}_token` as keyof TokenSet;
		const token = tokens[tokenKey] as string;
		if (!token) return null;

		const isMasked = maskedStates[tokenType];
		const isDecoded = decodedStates[tokenType];
		const isCopied = copiedStates[tokenType];
		const isJWT = TokenDisplayService.isJWT(token);

		let decodedContent = null;
		if (isDecoded && isJWT) {
			decodedContent = TokenDisplayService.decodeJWT(token);
		}

		return (
			<TokenSection key={tokenType} $variant={tokenType}>
				<TokenHeader $variant={tokenType}>
					<TokenLabel $variant={tokenType}>
						{getTokenIcon(tokenType)}
						{getTokenLabel(tokenType)}
						<TokenBadge $variant={tokenType}>{tokenType}</TokenBadge>
					</TokenLabel>

					<ActionButtons>
						{isJWT && (
							<ActionButton
								onClick={() => handleToggleDecode(tokenType)}
								title={isDecoded ? 'Hide decoded content' : 'Show decoded content'}
								$variant="warning"
							>
								<FiCode size={14} />
								{isDecoded ? 'Hide' : 'Decode'}
							</ActionButton>
						)}

						<ActionButton
							onClick={() => handleCopy(tokenType, token)}
							title="Copy token"
							$variant="primary"
						>
							{isCopied ? <FiCheck size={14} /> : <FiCopy size={14} />}
							{isCopied ? 'Copied!' : 'Copy'}
						</ActionButton>
					</ActionButtons>
				</TokenHeader>

				<TokenContent>
					<TokenValue $masked={false}>{token}</TokenValue>

					{isDecoded && (
						<DecodedSection>
							{!isJWT ? (
								<OpaqueMessage>
									<FiAlertCircle size={20} />
									This is an opaque token and cannot be decoded. Only JWT tokens can be decoded.
								</OpaqueMessage>
							) : decodedContent ? (
								<>
									<DecodedTitle>
										<FiKey size={16} />
										JWT Header
									</DecodedTitle>
									<DecodedContent>
										{syntaxHighlightJSON(JSON.stringify(decodedContent.header, null, 2))}
									</DecodedContent>

									<DecodedTitle>
										<FiShield size={16} />
										JWT Payload
									</DecodedTitle>
									<DecodedContent>
										{syntaxHighlightJSON(JSON.stringify(decodedContent.payload, null, 2))}
									</DecodedContent>
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

	return (
		<DraggableModal
			isOpen={isOpen}
			onClose={onClose}
			title={title}
			width="min(900px, calc(100vw - 2rem))"
			maxHeight="calc(90vh - 2rem)"
		>
			<ModalContent>
				{availableTokens.length === 0 ? (
					<div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
						No tokens available to display
					</div>
				) : (
					<>
						{availableTokens.map(renderToken)}

						{(tokens.token_type || tokens.expires_in || tokens.scope) && (
							<MetadataGrid>
								{tokens.token_type && (
									<MetadataItem>
										<MetadataLabel>Token Type</MetadataLabel>
										<MetadataValue>{tokens.token_type}</MetadataValue>
									</MetadataItem>
								)}
								{tokens.expires_in && (
									<MetadataItem>
										<MetadataLabel>Expires In</MetadataLabel>
										<MetadataValue>{tokens.expires_in} seconds</MetadataValue>
									</MetadataItem>
								)}
								{tokens.scope && (
									<MetadataItem>
										<MetadataLabel>Scope</MetadataLabel>
										<MetadataValue>{tokens.scope}</MetadataValue>
									</MetadataItem>
								)}
							</MetadataGrid>
						)}
					</>
				)}
			</ModalContent>
		</DraggableModal>
	);
};
