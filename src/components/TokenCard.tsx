// src/components/InlineTokenDisplay.tsx

import { FiCopy, FiExternalLink, FiKey, FiShield } from '@icons';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import TokenDisplayService, { type DecodedJWT } from '../services/tokenDisplayService';

interface InlineTokenDisplayProps {
	label: string;
	token?: string;
	tokenType: 'access' | 'id' | 'refresh';
	isOIDC?: boolean;
	flowKey?: string;
	className?: string;
	defaultMasked?: boolean;
	allowMaskToggle?: boolean;
}

const Card = styled.div`
	background: V9_COLORS.TEXT.WHITE;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	margin-bottom: 1rem;
	overflow: hidden;
	max-width: 1200px; /* Wider for better token display */
	width: 100%;
	margin-left: auto;
	margin-right: auto;
`;

const CardHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem;
	background: V9_COLORS.BG.GRAY_LIGHT;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const TokenLabel = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
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
			case 'access':
				return '#dbeafe';
			case 'id':
				return 'V9_COLORS.BG.SUCCESS';
			case 'refresh':
				return 'V9_COLORS.BG.WARNING';
			default:
				return '#f3f4f6';
		}
	}};
	color: ${({ $type }) => {
		switch ($type) {
			case 'access':
				return 'V9_COLORS.PRIMARY.BLUE_DARK';
			case 'id':
				return 'V9_COLORS.PRIMARY.GREEN';
			case 'refresh':
				return 'V9_COLORS.PRIMARY.YELLOW_DARK';
			default:
				return 'V9_COLORS.TEXT.GRAY_DARK';
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
			case 'primary':
				return 'V9_COLORS.PRIMARY.BLUE';
			case 'management':
				return 'V9_COLORS.PRIMARY.GREEN_DARK';
			default:
				return 'V9_COLORS.TEXT.GRAY_LIGHTER';
		}
	}};
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return 'V9_COLORS.PRIMARY.BLUE';
			case 'management':
				return 'V9_COLORS.PRIMARY.GREEN_DARK';
			default:
				return 'white';
		}
	}};
	color: ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
			case 'management':
				return 'white';
			default:
				return 'V9_COLORS.TEXT.GRAY_DARK';
		}
	}};
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $variant }) => {
			switch ($variant) {
				case 'primary':
					return 'V9_COLORS.PRIMARY.BLUE_DARK';
				case 'management':
					return '#047857';
				default:
					return '#f9fafb';
			}
		}};
		border-color: ${({ $variant }) => {
			switch ($variant) {
				case 'primary':
					return 'V9_COLORS.PRIMARY.BLUE_DARK';
				case 'management':
					return '#047857';
				default:
					return 'V9_COLORS.TEXT.GRAY_LIGHT';
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
	color: V9_COLORS.TEXT.GRAY_DARK;
	background: #f0fdf4; /* Light green for generated content */
	padding: 1rem;
	border-radius: 8px;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	margin-bottom: 1rem;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-all;
	overflow-wrap: anywhere;
	max-width: 100%;
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
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	padding: 0.25rem;

	&:hover {
		color: V9_COLORS.TEXT.GRAY_DARK;
	}
`;

const DecodeContent = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	color: V9_COLORS.TEXT.GRAY_DARK;
	background: #f0fdf4; /* Light green for generated content */
	padding: 1rem;
	border-radius: 8px;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	overflow-x: auto;
`;

const OpaqueMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem;
	background: V9_COLORS.BG.WARNING;
	border: 1px solid V9_COLORS.PRIMARY.YELLOW;
	border-radius: 8px;
	color: V9_COLORS.PRIMARY.YELLOW_DARK;
	font-size: 0.875rem;
`;

export const InlineTokenDisplay: React.FC<InlineTokenDisplayProps> = ({
	label,
	token = '',
	tokenType,
	isOIDC = false,
	flowKey = '',
	className,
	defaultMasked = false,
	allowMaskToggle = true,
}) => {
	// Tokens always visible (no masking)
	const [masked] = useState(false);
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
			modernMessaging.showFooterMessage({
				type: 'status',
				message: `[📋 COPIED] ${label} copied`,
				duration: 4000,
			});
		} else {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to copy token to clipboard',
				dismissible: true,
			});
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

	const handleSendToTokenManagement = useCallback(() => {
		// Navigate to Token Management page with token in state
		window.location.href = `/token-management?token=${encodeURIComponent(token)}&type=${tokenType}&source=${encodeURIComponent(flowKey || 'unknown')}&label=${encodeURIComponent(label)}`;
		modernMessaging.showFooterMessage({
			type: 'status',
			message: `${label} sent to Token Management`,
			duration: 4000,
		});
	}, [token, tokenType, flowKey, label]);

	const preview = masked ? TokenDisplayService.maskToken(token) : token;
	const displayLabel = TokenDisplayService.getTokenLabel(tokenType, isOIDC);

	const getTokenIcon = () => {
		switch (tokenType) {
			case 'access':
				return <FiKey size={16} />;
			case 'id':
				return <FiShield size={16} />;
			case 'refresh':
				return <FiShield size={16} />;
			default:
				return <FiShield size={16} />;
		}
	};

	return (
		<Card className={className}>
			<CardHeader>
				<TokenLabel>
					{getTokenIcon()}
					{displayLabel}
					<TokenBadge $type={tokenType}>{tokenType.toUpperCase()}</TokenBadge>
				</TokenLabel>
				<ActionButtons>
					<ActionButton onClick={handleDecode} title="Decode token" disabled={!token}>
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
				<TokenPreview>{preview}</TokenPreview>
			</CardContent>

			<DecodeModal $isOpen={showDecodeModal}>
				<DecodeModalContent>
					<DecodeModalHeader>
						<DecodeModalTitle>{displayLabel} - Decoded Content</DecodeModalTitle>
						<CloseButton onClick={() => setShowDecodeModal(false)}>×</CloseButton>
					</DecodeModalHeader>

					{isOpaque ? (
						<OpaqueMessage>
							<FiShield size={20} />
							{TokenDisplayService.getOpaqueTokenMessage(tokenType)}
						</OpaqueMessage>
					) : decodedContent ? (
						<div>
							<h4 style={{ marginBottom: '1rem', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>Header:</h4>
							<DecodeContent>{JSON.stringify(decodedContent.header, null, 2)}</DecodeContent>

							<h4
								style={{
									marginBottom: '1rem',
									marginTop: '1.5rem',
									color: 'V9_COLORS.TEXT.GRAY_DARK',
								}}
							>
								Payload:
							</h4>
							<DecodeContent>{JSON.stringify(decodedContent.payload, null, 2)}</DecodeContent>
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

export default InlineTokenDisplay;
