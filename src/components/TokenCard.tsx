// src/components/TokenCard.tsx
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FiCopy, FiEye, FiEyeOff, FiKey, FiShield, FiExternalLink } from 'react-icons/fi';
import { v4ToastManager } from '../utils/v4ToastMessages';
import TokenDisplayService, { type DecodedJWT, type TokenInfo } from '../services/tokenDisplayService';

interface TokenCardProps {
	label: string;
	token?: string;
	tokenType: 'access' | 'id' | 'refresh';
	isOIDC?: boolean;
	flowKey?: string;
	className?: string;
}

const Card = styled.div`
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	margin-bottom: 1rem;
	overflow: hidden;
`;

const CardHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem;
	background: #f8fafc;
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
	background: ${({ $type }) => {
		switch ($type) {
			case 'access': return '#dbeafe';
			case 'id': return '#dcfce7';
			case 'refresh': return '#fef3c7';
			default: return '#f3f4f6';
		}
	}};
	color: ${({ $type }) => {
		switch ($type) {
			case 'access': return '#1e40af';
			case 'id': return '#166534';
			case 'refresh': return '#92400e';
			default: return '#374151';
		}
	}};
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'management' }>`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.75rem;
	border-radius: 6px;
	border: 1px solid ${({ $variant }) => {
		switch ($variant) {
			case 'primary': return '#3b82f6';
			case 'management': return '#059669';
			default: return '#d1d5db';
		}
	}};
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'primary': return '#3b82f6';
			case 'management': return '#059669';
			default: return 'white';
		}
	}};
	color: ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
			case 'management': return 'white';
			default: return '#374151';
		}
	}};
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $variant }) => {
			switch ($variant) {
				case 'primary': return '#2563eb';
				case 'management': return '#047857';
				default: return '#f9fafb';
			}
		}};
		border-color: ${({ $variant }) => {
			switch ($variant) {
				case 'primary': return '#2563eb';
				case 'management': return '#047857';
				default: return '#9ca3af';
			}
		}};
	}

	&:active {
		transform: translateY(1px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const CardContent = styled.div`
	padding: 1.5rem;
`;

const TokenPreview = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	color: #374151;
	word-break: break-all;
	background: #f8fafc;
	padding: 1rem;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
	margin-bottom: 1rem;
`;

const DecodeModal = styled.div<{ $isOpen: boolean }>`
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

const DecodeModalContent = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 700px;
	max-height: 80vh;
	overflow-y: auto;
	margin: 1rem;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const DecodeModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
`;

const DecodeModalTitle = styled.h3`
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

const DecodeContent = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	color: #374151;
	background: #f8fafc;
	padding: 1rem;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
	overflow-x: auto;
`;

const OpaqueMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem;
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 8px;
	color: #92400e;
	font-size: 0.875rem;
`;

export const TokenCard: React.FC<TokenCardProps> = ({
	label,
	token = '',
	tokenType,
	isOIDC = false,
	flowKey = '',
	className
}) => {
	const [masked, setMasked] = useState(true);
	const [showDecodeModal, setShowDecodeModal] = useState(false);
	const [decodedContent, setDecodedContent] = useState<DecodedJWT | null>(null);
	const [isOpaque, setIsOpaque] = useState(false);

	const tokenInfo = TokenDisplayService.getTokenInfo(token, tokenType, flowKey);

	// Log token panel rendering
	React.useEffect(() => {
		TokenDisplayService.logTokenRender(tokenInfo);
	}, [tokenInfo]);

	const handleCopy = useCallback(async () => {
		if (!token) return;

		const success = await TokenDisplayService.copyToClipboard(token);
		if (success) {
			TokenDisplayService.logTokenCopy(tokenInfo);
			v4ToastManager.showSuccess(`[📋 COPIED] ${label} copied`);
		} else {
			v4ToastManager.showError('Failed to copy token to clipboard');
		}
	}, [token, label, tokenInfo]);

	const handleDecode = useCallback(() => {
		if (!token) return;

		if (!TokenDisplayService.isJWT(token)) {
			setIsOpaque(true);
			setDecodedContent(null);
			TokenDisplayService.logTokenDecode(tokenInfo, false);
		} else {
			const decoded = TokenDisplayService.decodeJWT(token);
			setIsOpaque(false);
			setDecodedContent(decoded);
			TokenDisplayService.logTokenDecode(tokenInfo, true);
		}
		setShowDecodeModal(true);
	}, [token, tokenInfo]);

	const handleToggleMask = useCallback(() => {
		setMasked(prev => !prev);
	}, []);

	const handleSendToTokenManagement = useCallback(() => {
		// Navigate to Token Management page with token in state
		window.location.href = `/token-management?token=${encodeURIComponent(token)}&type=${tokenType}&source=${encodeURIComponent(flowKey || 'unknown')}&label=${encodeURIComponent(label)}`;
		v4ToastManager.showSuccess(`${label} sent to Token Management`);
	}, [token, tokenType, flowKey, label]);

	const preview = masked ? TokenDisplayService.maskToken(token) : token;
	const displayLabel = TokenDisplayService.getTokenLabel(tokenType, isOIDC);

	const getTokenIcon = () => {
		switch (tokenType) {
			case 'access': return <FiKey size={16} />;
			case 'id': return <FiShield size={16} />;
			case 'refresh': return <FiShield size={16} />;
			default: return <FiShield size={16} />;
		}
	};

	return (
		<Card className={className}>
			<CardHeader>
				<TokenLabel>
					{getTokenIcon()}
					{displayLabel}
					<TokenBadge $type={tokenType}>
						{tokenType.toUpperCase()}
					</TokenBadge>
				</TokenLabel>
				<ActionButtons>
					<ActionButton
						onClick={handleToggleMask}
						title={masked ? 'Show token' : 'Hide token'}
					>
						{masked ? <FiEye size={14} /> : <FiEyeOff size={14} />}
						{masked ? 'Show' : 'Hide'}
					</ActionButton>
					<ActionButton
						onClick={handleDecode}
						title="Decode token"
						disabled={!token}
					>
						<FiKey size={14} />
						Decode
					</ActionButton>
					<ActionButton
						onClick={handleCopy}
						title="Copy token"
						$variant="primary"
						disabled={!token}
					>
						<FiCopy size={14} />
						Copy
					</ActionButton>
					<ActionButton
						onClick={handleSendToTokenManagement}
						title="Send to Token Management"
						$variant="management"
						disabled={!token}
					>
						<FiExternalLink size={14} />
						Token Management
					</ActionButton>
				</ActionButtons>
			</CardHeader>
			<CardContent>
				<TokenPreview>
					{preview}
				</TokenPreview>
			</CardContent>

			<DecodeModal $isOpen={showDecodeModal}>
				<DecodeModalContent>
					<DecodeModalHeader>
						<DecodeModalTitle>
							{displayLabel} - Decoded Content
						</DecodeModalTitle>
						<CloseButton onClick={() => setShowDecodeModal(false)}>
							×
						</CloseButton>
					</DecodeModalHeader>
					
					{isOpaque ? (
						<OpaqueMessage>
							<FiShield size={20} />
							{TokenDisplayService.getOpaqueTokenMessage(tokenType)}
						</OpaqueMessage>
					) : decodedContent ? (
						<div>
							<h4 style={{ marginBottom: '1rem', color: '#374151' }}>Header:</h4>
							<DecodeContent>
								{JSON.stringify(decodedContent.header, null, 2)}
							</DecodeContent>
							
							<h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', color: '#374151' }}>Payload:</h4>
							<DecodeContent>
								{JSON.stringify(decodedContent.payload, null, 2)}
							</DecodeContent>
						</div>
					) : (
						<OpaqueMessage>
							<FiShield size={20} />
							Unable to decode token content.
						</OpaqueMessage>
					)}
				</DecodeModalContent>
			</DecodeModal>
		</Card>
	);
};

export default TokenCard;

