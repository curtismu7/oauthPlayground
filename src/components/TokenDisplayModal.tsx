// src/components/TokenDisplayModal.tsx
// Modal for displaying OAuth tokens (access, ID, refresh)

import React from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { FiCopy, FiKey } from '../services/commonImportsService';
import { decodeJWT, isJWT } from '../utils/jwtDecoder';
import { DraggableModal } from './DraggableModal';

interface TokenDisplayModalProps {
	isOpen: boolean;
	onClose: () => void;
	tokens: {
		access_token?: string;
		id_token?: string;
		refresh_token?: string;
		token_type?: string;
		expires_in?: number;
		scope?: string;
	};
}

const ModalContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	max-height: calc(80vh - 100px);
	overflow-y: auto;
`;

const TokenSection = styled.div`
	background: V9_COLORS.TEXT.WHITE;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	overflow: hidden;
`;

const TokenHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem 1rem;
	background: linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, V9_COLORS.BG.GRAY_MEDIUM 100%);
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
	${({ $type }) => {
		switch ($type) {
			case 'access':
				return `background-color: #dbeafe; color: V9_COLORS.PRIMARY.BLUE_DARK;`;
			case 'id':
				return `background-color: V9_COLORS.BG.SUCCESS; color: V9_COLORS.PRIMARY.GREEN;`;
			case 'refresh':
				return `background-color: V9_COLORS.BG.WARNING; color: V9_COLORS.PRIMARY.YELLOW_DARK;`;
			default:
				return `background-color: V9_COLORS.TEXT.GRAY_LIGHTER; color: #4b5563;`;
		}
	}}
`;

const TokenActions = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.625rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 500;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;

	${({ $variant = 'secondary' }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: V9_COLORS.PRIMARY.BLUE;
					color: white;
					&:hover {
						background: V9_COLORS.PRIMARY.BLUE_DARK;
					}
				`;
			case 'secondary':
				return `
					background: #f3f4f6;
					color: V9_COLORS.TEXT.GRAY_DARK;
					&:hover {
						background: V9_COLORS.TEXT.GRAY_LIGHTER;
					}
				`;
		}
	}}
`;

const TokenContent = styled.div`
	padding: 1rem;
`;

const TokenValue = styled.div<{ $masked?: boolean }>`
	background: V9_COLORS.BG.GRAY_LIGHT;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	padding: 0.75rem;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_DARK;
	word-break: break-all;
	white-space: pre-wrap;
	margin-bottom: 0.75rem;
	max-height: 150px;
	overflow-y: auto;
	
	${({ $masked }) =>
		$masked &&
		`
		filter: blur(4px);
		user-select: none;
		cursor: not-allowed;
	`}
`;

const DecodedSection = styled.div`
	margin-top: 0.75rem;
	padding-top: 0.75rem;
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const DecodedLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	margin-bottom: 0.5rem;
`;

const DecodedContent = styled.pre`
	background: #f0fdf4;
	border: 1px solid V9_COLORS.PRIMARY.GREEN_DARK;
	border-radius: 0.375rem;
	padding: 0.75rem;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
	font-size: 0.7rem;
	color: V9_COLORS.TEXT.GRAY_DARK;
	overflow-x: auto;
	max-height: 200px;
	margin: 0;
`;

const InfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 0.75rem;
	margin-top: 0.75rem;
	padding-top: 0.75rem;
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const InfoItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const InfoLabel = styled.div`
	font-size: 0.7rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	font-weight: 500;
`;

const InfoValue = styled.div`
	font-size: 0.8rem;
	color: V9_COLORS.TEXT.GRAY_DARK;
	font-weight: 600;
`;

export const TokenDisplayModal: React.FC<TokenDisplayModalProps> = ({
	isOpen,
	onClose,
	tokens,
}) => {
	const copyToken = (token: string, label: string) => {
		navigator.clipboard.writeText(token);
		modernMessaging.showFooterMessage({
			type: 'status',
			message: `${label} copied to clipboard`,
			duration: 4000,
		});
	};

	const renderToken = (
		token: string | undefined,
		type: 'access' | 'id' | 'refresh',
		label: string
	) => {
		if (!token) return null;

		const isJwtToken = isJWT(token);
		const decoded = isJwtToken ? decodeJWT(token) : null;

		return (
			<TokenSection key={type}>
				<TokenHeader>
					<TokenLabel>
						<FiKey size={14} />
						{label}
						<TokenBadge $type={type}>{type.toUpperCase()}</TokenBadge>
					</TokenLabel>
					<TokenActions>
						<ActionButton
							$variant="primary"
							onClick={() => copyToken(token, label)}
							title="Copy token"
						>
							<FiCopy size={14} />
							Copy
						</ActionButton>
					</TokenActions>
				</TokenHeader>
				<TokenContent>
					<TokenValue $masked={false}>{token}</TokenValue>

					{decoded && (
						<DecodedSection>
							<DecodedLabel>Decoded JWT</DecodedLabel>
							<DecodedContent>{JSON.stringify(decoded, null, 2)}</DecodedContent>
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
			title="OAuth Tokens"
			width="min(700px, calc(100vw - 2rem))"
			maxHeight="calc(90vh - 2rem)"
		>
			<ModalContent>
				{renderToken(tokens.access_token, 'access', 'Access Token')}
				{renderToken(tokens.id_token, 'id', 'ID Token')}
				{renderToken(tokens.refresh_token, 'refresh', 'Refresh Token')}

				{(tokens.token_type || tokens.expires_in || tokens.scope) && (
					<TokenSection>
						<TokenHeader>
							<TokenLabel>Token Metadata</TokenLabel>
						</TokenHeader>
						<TokenContent>
							<InfoGrid>
								{tokens.token_type && (
									<InfoItem>
										<InfoLabel>Token Type</InfoLabel>
										<InfoValue>{tokens.token_type}</InfoValue>
									</InfoItem>
								)}
								{tokens.expires_in && (
									<InfoItem>
										<InfoLabel>Expires In</InfoLabel>
										<InfoValue>{tokens.expires_in} seconds</InfoValue>
									</InfoItem>
								)}
								{tokens.scope && (
									<InfoItem>
										<InfoLabel>Scope</InfoLabel>
										<InfoValue>{tokens.scope}</InfoValue>
									</InfoItem>
								)}
							</InfoGrid>
						</TokenContent>
					</TokenSection>
				)}
			</ModalContent>
		</DraggableModal>
	);
};
