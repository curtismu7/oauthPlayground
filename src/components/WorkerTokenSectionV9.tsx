/**
 * @file WorkerTokenSectionV9.tsx
 * @module components
 * @description V9 worker token section — migrated from WorkerTokenSectionV8
 * @version 9.0.0
 * @since 2026-03-06
 *
 * Migration notes:
 * - WorkerTokenModalV8 → WorkerTokenModalV9Styled
 * - WorkerTokenStatusServiceV8 → V9checkWorkerTokenStatus
 * - toastV8 → modernMessaging (migration complete)
 * - Inline styles → styled-components with V9 blue palette
 * - WorkerTokenStatusDisplayV8 → inline status block (no V9 component exists)
 */


import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import {
	V9checkWorkerTokenStatus,
	type V9TokenStatusInfo,
} from '../services/v9/V9WorkerTokenStatusService';
import { modernMessaging } from './v9/V9ModernMessagingComponents';
import WorkerTokenModalV9Styled from './WorkerTokenModalV9Styled';

// ---------------------------------------------------------------------------
// Styled components — V9 blue palette
// ---------------------------------------------------------------------------

const Section = styled.div<{ $compact?: boolean }>`
	background: V9_COLORS.TEXT.WHITE;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	padding: ${({ $compact }) => ($compact ? '1rem' : '1.5rem')};
	margin-bottom: ${({ $compact }) => ($compact ? '1rem' : '1.5rem')};
	box-shadow: ${({ $compact }) => ($compact ? 'none' : '0 1px 3px rgba(0,0,0,0.1)')};
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const Badge = styled.span`
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	background: #f3f4f6;
	padding: 0.125rem 0.5rem;
	border-radius: 0.75rem;
`;

const Description = styled.p`
	margin: 0 0 1rem;
	font-size: 0.875rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	line-height: 1.5;
`;

const StatusBox = styled.div<{ $valid: boolean }>`
	background: ${({ $valid }) => ($valid ? '#f0fdf4' : 'V9_COLORS.BG.ERROR')};
	border: 1px solid ${({ $valid }) => ($valid ? '#86efac' : '#fca5a5')};
	border-radius: 0.375rem;
	padding: 0.75rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.5rem;
`;

const StatusText = styled.div<{ $valid: boolean }>`
	font-size: 0.875rem;
	font-weight: 600;
	color: ${({ $valid }) => ($valid ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.PRIMARY.RED_DARK')};
`;

const StatusSub = styled.div`
	font-size: 0.75rem;
	color: #7f1d1d;
	margin-top: 0.25rem;
`;

const ExpiryText = styled.div`
	font-size: 0.75rem;
	color: V9_COLORS.PRIMARY.GREEN;
	margin-top: 0.25rem;
`;

const RefreshBtn = styled.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.5rem;
	background: transparent;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.25rem;
	cursor: pointer;
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	flex-shrink: 0;
	&:hover {
		background: #f9fafb;
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const Actions = styled.div`
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
	margin-bottom: 1rem;
`;

const Btn = styled.button<{ $variant: 'primary' | 'danger' | 'success' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1rem;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s, transform 0.1s;
	color: white;
	background: ${({ $variant }) =>
		$variant === 'primary'
			? 'V9_COLORS.PRIMARY.BLUE_DARK'
			: $variant === 'success'
				? 'V9_COLORS.PRIMARY.GREEN'
				: 'V9_COLORS.PRIMARY.RED'};
	&:hover {
		background: ${({ $variant }) =>
			$variant === 'primary'
				? 'V9_COLORS.PRIMARY.BLUE_DARK'
				: $variant === 'success'
					? 'V9_COLORS.PRIMARY.GREEN_DARK'
					: 'V9_COLORS.PRIMARY.RED_DARK'};
		transform: translateY(-1px);
	}
	&:active {
		transform: translateY(0);
	}
`;

// ---------------------------------------------------------------------------
// Props & component
// ---------------------------------------------------------------------------

export interface WorkerTokenSectionV9Props {
	environmentId?: string;
	onTokenUpdated?: (token: string) => void;
	compact?: boolean;
	showSettings?: boolean;
}

export const WorkerTokenSectionV9: React.FC<WorkerTokenSectionV9Props> = ({
	environmentId,
	onTokenUpdated,
	compact = false,
	// showSettings kept for interface compatibility — V9 section has no settings UI
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	showSettings: _showSettings = true,
}) => {
	const [showModal, setShowModal] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [tokenStatus, setTokenStatus] = useState<V9TokenStatusInfo>({
		status: 'missing',
		message: 'Checking token status…',
		isValid: false,
	});

	const updateStatus = useCallback(async () => {
		const status = await V9checkWorkerTokenStatus();
		setTokenStatus(status);
		if (status.isValid && status.token && onTokenUpdated) {
			onTokenUpdated(status.token);
		}
	}, [onTokenUpdated]);

	// Initial check + listen for global updates
	useEffect(() => {
		updateStatus();
		const handler = () => {
			void updateStatus();
		};
		window.addEventListener('workerTokenUpdated', handler);
		return () => window.removeEventListener('workerTokenUpdated', handler);
	}, [updateStatus]);

	// Allow external components to trigger modal open
	useEffect(() => {
		const handler = () => setShowModal(true);
		window.addEventListener('show-worker-token-modal', handler);
		return () => window.removeEventListener('show-worker-token-modal', handler);
	}, []);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await updateStatus();
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Worker token status refreshed',
				duration: 3000,
			});
		} catch {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Refresh failed',
				message: 'Failed to refresh worker token status',
				dismissible: true,
			});
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleClear = async () => {
		try {
			await unifiedWorkerTokenService.clearToken();
			window.dispatchEvent(new Event('workerTokenUpdated'));
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Worker token cleared',
				duration: 3000,
			});
		} catch {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Clear failed',
				message: 'Failed to clear worker token',
				dismissible: true,
			});
		}
	};

	const expiryLabel =
		tokenStatus.minutesRemaining !== undefined
			? tokenStatus.minutesRemaining > 60
				? `Expires in ${Math.floor(tokenStatus.minutesRemaining / 60)}h ${tokenStatus.minutesRemaining % 60}m`
				: `Expires in ${tokenStatus.minutesRemaining}m`
			: null;

	return (
		<>
			<Section $compact={compact}>
				<Header>
					<span style={{ fontSize: 20, color: 'V9_COLORS.PRIMARY.BLUE_DARK' }}>🔑</span>
					<Title>Worker Token (Admin Flow)</Title>
					{!compact && <Badge>Service Account</Badge>}
				</Header>

				{!compact && (
					<Description>
						Worker tokens are service account credentials used for administrative operations. They
						allow you to perform API calls on behalf of your PingOne environment.
					</Description>
				)}

				<StatusBox $valid={tokenStatus.isValid}>
					<div>
						<StatusText $valid={tokenStatus.isValid}>
							{tokenStatus.isValid ? (
								<>
									<FiCheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
									Active
								</>
							) : (
								<>
									<FiAlertCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
									Not configured
								</>
							)}
						</StatusText>
						{!tokenStatus.isValid && <StatusSub>{tokenStatus.message}</StatusSub>}
						{tokenStatus.isValid && expiryLabel && <ExpiryText>{expiryLabel}</ExpiryText>}
						{tokenStatus.isValid && tokenStatus.environmentId && (
							<ExpiryText>Env: {tokenStatus.environmentId}</ExpiryText>
						)}
					</div>
					<RefreshBtn
						type="button"
						onClick={() => void handleRefresh()}
						disabled={isRefreshing}
						title="Refresh status"
					>
						<FiRefreshCw
							size={12}
							style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
						/>
						Refresh
					</RefreshBtn>
				</StatusBox>

				<Actions>
					{!tokenStatus.isValid ? (
						<Btn type="button" $variant="primary" onClick={() => setShowModal(true)}>
							<span style={{ fontSize: '14px' }}>🔑</span>
							Get Worker Token
						</Btn>
					) : (
						<>
							<Btn type="button" $variant="success" onClick={() => setShowModal(true)}>
								<span style={{ fontSize: '14px' }}>🔑</span>
								Update Token
							</Btn>
							<Btn type="button" $variant="danger" onClick={() => void handleClear()}>
								<span style={{ fontSize: '14px' }}>❌</span>
								Clear Token
							</Btn>
						</>
					)}
				</Actions>
			</Section>

			<WorkerTokenModalV9Styled
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				environmentId={environmentId ?? ''}
				onTokenGenerated={(token: string) => {
					setShowModal(false);
					if (onTokenUpdated) onTokenUpdated(token);
					window.dispatchEvent(new Event('workerTokenUpdated'));
				}}
			/>
		</>
	);
};

export default WorkerTokenSectionV9;
