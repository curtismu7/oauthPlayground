// src/components/WorkerTokenDetectedBanner.tsx
// Reusable banner component to display when a worker token is detected

import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiDatabase } from 'react-icons/fi';
import styled from 'styled-components';
import { checkTokenExpiration, type TokenExpirationInfo } from '../services/tokenExpirationService';

interface WorkerTokenDetectedBannerProps {
	token: string;
	message?: string;
	tokenExpiryKey?: string; // localStorage key for expiration timestamp
}

const BannerContainer = styled.div`
	padding: 1rem;
	background: #f0fdf4;
	border: 2px solid #10b981;
	border-radius: 0.75rem;
	margin-bottom: 1rem;
	max-width: 100%;
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
`;

const Title = styled.strong`
	color: #065f46;
	font-size: 0.95rem;
`;

const TokenBadge = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.35rem 0.75rem;
	background: #d1fae5;
	border: 1px solid #6ee7b7;
	border-radius: 0.5rem;
	font-size: 0.8rem;
	color: #065f46;
	font-family: 'Monaco', 'Courier New', monospace;
`;

const Message = styled.p`
	margin: 0.5rem 0 0 0;
	font-size: 0.875rem;
	color: #047857;
	line-height: 1.5;
`;

const ExpiryMessage = styled.div<{ $isExpired: boolean; $isExpiringSoon: boolean }>`
	margin-top: 0.5rem;
	padding: 0.5rem;
	border-radius: 0.5rem;
	background: ${({ $isExpired, $isExpiringSoon }) =>
		$isExpired ? '#fee2e2' : $isExpiringSoon ? '#fef3c7' : '#d1fae5'};
	border: 1px solid ${({ $isExpired, $isExpiringSoon }) =>
		$isExpired ? '#f87171' : $isExpiringSoon ? '#fbbf24' : '#6ee7b7'};
	color: ${({ $isExpired, $isExpiringSoon }) =>
		$isExpired ? '#dc2626' : $isExpiringSoon ? '#d97706' : '#065f46'};
	font-size: 0.8rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 500;
`;

/**
 * Banner component that displays when a worker token is detected
 */
export const WorkerTokenDetectedBanner: React.FC<WorkerTokenDetectedBannerProps> = ({
	token,
	message,
	tokenExpiryKey,
}) => {
	const [expiryInfo, setExpiryInfo] = React.useState<{
		isExpired: boolean;
		isExpiringSoon: boolean;
		timeRemaining: string;
		expiryTime: string | null;
	} | null>(null);

	React.useEffect(() => {
		if (!tokenExpiryKey) {
			setExpiryInfo(null);
			return;
		}

		const checkExpiry = () => {
			try {
				// Use the tokenExpirationService to check token status
				const expirationInfo: TokenExpirationInfo | null = checkTokenExpiration(
					token,
					tokenExpiryKey
				);

				if (!expirationInfo) {
					setExpiryInfo(null);
					return;
				}

				const { isExpired, isExpiringSoon, minutesRemaining, expiresAtFormatted } = expirationInfo;

				let timeRemainingText = '';
				if (isExpired) {
					timeRemainingText = 'EXPIRED';
				} else if (minutesRemaining < 5) {
					timeRemainingText = `Expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
				} else if (minutesRemaining < 60) {
					timeRemainingText = `Expires in ${minutesRemaining} minutes`;
				} else {
					const hoursRemaining = Math.floor(minutesRemaining / 60);
					timeRemainingText = `Expires in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} ${minutesRemaining % 60} min`;
				}

				setExpiryInfo({
					isExpired,
					isExpiringSoon,
					timeRemaining: timeRemainingText,
					expiryTime: expiresAtFormatted,
				});
			} catch (error) {
				console.warn('[WorkerTokenDetectedBanner] Error checking expiry:', error);
				setExpiryInfo(null);
			}
		};

		checkExpiry();
		const interval = setInterval(checkExpiry, 60000); // Check every minute

		return () => clearInterval(interval);
	}, [tokenExpiryKey, token]);

	const defaultMessage = expiryInfo?.isExpired
		? '⚠️ Worker token has EXPIRED. Please generate a new token to continue.'
		: expiryInfo?.isExpiringSoon
			? `⚠️ Worker token expires soon (${expiryInfo.timeRemaining}). Consider generating a new token.`
			: expiryInfo
				? `Worker token expires ${expiryInfo.timeRemaining} (${expiryInfo.expiryTime}).`
				: 'Your existing worker token will be used automatically. Worker token credentials below are only needed if the token expires.';

	// Determine if token is valid (not expired and not expiring soon)
	const isValid = expiryInfo && !expiryInfo.isExpired && !expiryInfo.isExpiringSoon;

	return (
		<BannerContainer
			style={{
				// Green background when valid, yellow when expiring soon, red when expired
				background: expiryInfo?.isExpired
					? '#fee2e2'
					: expiryInfo?.isExpiringSoon
						? '#fef3c7'
						: isValid
							? '#f0fdf4' // Green background for valid tokens
							: '#f0fdf4', // Default green if no expiry info
				borderColor: expiryInfo?.isExpired
					? '#ef4444'
					: expiryInfo?.isExpiringSoon
						? '#fbbf24'
						: isValid
							? '#10b981' // Green border for valid tokens
							: '#10b981', // Default green if no expiry info
			}}
		>
			<TitleRow>
				{expiryInfo?.isExpired ? (
					<FiAlertCircle size={18} color="#dc2626" />
				) : (
					<FiCheckCircle size={18} color={expiryInfo?.isExpiringSoon ? '#d97706' : '#10b981'} />
				)}
				<Title
					style={{
						color: expiryInfo?.isExpired
							? '#dc2626'
							: expiryInfo?.isExpiringSoon
								? '#d97706'
								: '#065f46',
					}}
				>
					{expiryInfo?.isExpired ? 'Worker Token EXPIRED' : 'Worker Token Detected'}
				</Title>
			</TitleRow>
			<TokenBadge
				style={{
					background: expiryInfo?.isExpired
						? '#fee2e2'
						: expiryInfo?.isExpiringSoon
							? '#fef3c7'
							: '#d1fae5',
					borderColor: expiryInfo?.isExpired
						? '#f87171'
						: expiryInfo?.isExpiringSoon
							? '#fbbf24'
							: '#6ee7b7',
					color: expiryInfo?.isExpired
						? '#dc2626'
						: expiryInfo?.isExpiringSoon
							? '#d97706'
							: '#065f46',
				}}
			>
				<FiDatabase size={14} /> Token cached • {token.substring(0, 16)}…
			</TokenBadge>
			{expiryInfo && (
				<ExpiryMessage
					$isExpired={expiryInfo.isExpired}
					$isExpiringSoon={expiryInfo.isExpiringSoon}
				>
					<FiClock size={14} />
					<strong>{expiryInfo.timeRemaining}</strong>
					{expiryInfo.expiryTime && !expiryInfo.isExpired && (
						<span style={{ fontSize: '0.75rem', opacity: 0.8 }}> ({expiryInfo.expiryTime})</span>
					)}
				</ExpiryMessage>
			)}
			<Message
				style={{
					color: expiryInfo?.isExpired
						? '#dc2626'
						: expiryInfo?.isExpiringSoon
							? '#d97706'
							: '#047857',
					marginTop: expiryInfo ? '0.5rem' : '0.5rem',
				}}
			>
				{message || defaultMessage}
			</Message>
		</BannerContainer>
	);
};
