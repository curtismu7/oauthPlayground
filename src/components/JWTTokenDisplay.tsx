// src/components/JWTTokenDisplay.tsx

import React, { useState } from 'react';
import styled from 'styled-components';
import { CopyButtonService } from '../services/copyButtonService';
import { type DecodedJWT, decodeJWT, isJWT } from '../utils/jwtDecoder';

interface JWTTokenDisplayProps {
	token: string;
	tokenType?: string;
	onCopy?: (text: string, label: string) => void;
	copyLabel?: string;
	showTokenType?: boolean;
	showExpiry?: boolean;
	expiresIn?: number;
	scope?: string;
}

const TokenContainer = styled.div`
	background: V9_COLORS.BG.GRAY_LIGHT;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 8px;
	padding: 1rem;
	margin: 0.5rem 0;
`;

const TokenHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.75rem;
`;

const TokenTitle = styled.h4`
	margin: 0;
	color: V9_COLORS.PRIMARY.BLUE_DARK;
	font-size: 0.9rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const TokenActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ToggleButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	background: V9_COLORS.PRIMARY.BLUE;
	color: white;
	border: none;
	border-radius: 4px;
	padding: 0.375rem 0.75rem;
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background: V9_COLORS.PRIMARY.BLUE_DARK;
	}

	&:disabled {
		background: V9_COLORS.TEXT.GRAY_LIGHT;
		cursor: not-allowed;
	}
`;

const TokenValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
	font-size: 0.75rem;
	word-break: break-all;
	background: #f0fdf4; /* Light green for generated content */
	border: 1px solid V9_COLORS.PRIMARY.GREEN_DARK;
	border-radius: 4px;
	padding: 0.75rem;
	margin-bottom: 0.5rem;
	white-space: pre-wrap;
	line-height: 1.4;
`;

const TokenInfo = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 0.5rem;
	margin-top: 0.5rem;
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const InfoItem = styled.div`
	display: flex;
	justify-content: space-between;
`;

const InfoLabel = styled.span`
	font-weight: 500;
`;

const InfoValue = styled.span`
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const DecodedSection = styled.div`
	margin-top: 1rem;
	padding-top: 1rem;
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const DecodedTitle = styled.h5`
	margin: 0 0 0.5rem 0;
	color: V9_COLORS.PRIMARY.BLUE_DARK;
	font-size: 0.8rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.25rem;
`;

const DecodedContent = styled.div`
	background: #f0fdf4; /* Light green for generated content */
	border: 1px solid V9_COLORS.PRIMARY.GREEN_DARK;
	border-radius: 4px;
	padding: 0.75rem;
	font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
	font-size: 0.7rem;
	white-space: pre-wrap;
	line-height: 1.4;
	max-height: 300px;
	overflow-y: auto;
`;

const ErrorMessage = styled.div`
	color: V9_COLORS.PRIMARY.RED_DARK;
	font-size: 0.75rem;
	font-style: italic;
	margin-top: 0.5rem;
`;

export const JWTTokenDisplay: React.FC<JWTTokenDisplayProps> = ({
	token,
	tokenType = 'Access Token',
	_onCopy,
	copyLabel,
	showTokenType = true,
	showExpiry = true,
	expiresIn,
	scope,
}) => {
	const [isDecoded, setIsDecoded] = useState(false);
	const [decodedToken, setDecodedToken] = useState<DecodedJWT | null>(null);
	const [decodeError, setDecodeError] = useState<string | null>(null);
	const displayTokenType = tokenType || 'Token';

	const handleToggleDecode = () => {
		if (!isDecoded) {
			// Decode the token
			if (isJWT(token)) {
				const decoded = decodeJWT(token);
				if (decoded) {
					setDecodedToken(decoded);
					setDecodeError(null);
				} else {
					setDecodeError('Failed to decode JWT token');
				}
			} else {
				setDecodeError('Token does not appear to be a JWT');
			}
		}
		setIsDecoded(!isDecoded);
	};

	const formatExpiry = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m ${remainingSeconds}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${remainingSeconds}s`;
		} else {
			return `${remainingSeconds}s`;
		}
	};

	return (
		<TokenContainer>
			<TokenHeader>
				<TokenTitle>
					<span style={{ fontSize: '14px' }}>🔑</span>
					{displayTokenType}
				</TokenTitle>
				<TokenActions>
					<ToggleButton
						onClick={handleToggleDecode}
						disabled={!isJWT(token)}
						title={
							!isJWT(token)
								? 'Token is not a JWT'
								: isDecoded
									? 'Hide decoded token'
									: 'Show decoded token'
						}
					>
						{isDecoded ? (
							<span style={{ fontSize: '12px' }}>🙈</span>
						) : (
							<span style={{ fontSize: '12px' }}>👁️</span>
						)}
						{isDecoded ? 'Hide Decoded' : 'Decode JWT'}
					</ToggleButton>
					<CopyButtonService
						text={token}
						label={copyLabel || displayTokenType}
						size="sm"
						variant="secondary"
						showLabel={true}
					/>
				</TokenActions>
			</TokenHeader>

			<TokenValue>{token}</TokenValue>

			{(showTokenType || showExpiry || scope) && (
				<TokenInfo>
					{showTokenType && (
						<InfoItem>
							<InfoLabel>Type:</InfoLabel>
							<InfoValue>{tokenType}</InfoValue>
						</InfoItem>
					)}
					{showExpiry && expiresIn && (
						<InfoItem>
							<InfoLabel>Expires In:</InfoLabel>
							<InfoValue>{formatExpiry(expiresIn)}</InfoValue>
						</InfoItem>
					)}
					{scope && (
						<InfoItem>
							<InfoLabel>Scope:</InfoLabel>
							<InfoValue>{scope}</InfoValue>
						</InfoItem>
					)}
				</TokenInfo>
			)}

			{isDecoded && (
				<DecodedSection>
					<DecodedTitle>Decoded JWT</DecodedTitle>
					{decodeError ? (
						<ErrorMessage>{decodeError}</ErrorMessage>
					) : decodedToken ? (
						<DecodedContent>{JSON.stringify(decodedToken.payload, null, 2)}</DecodedContent>
					) : null}
				</DecodedSection>
			)}
		</TokenContainer>
	);
};

export default JWTTokenDisplay;
