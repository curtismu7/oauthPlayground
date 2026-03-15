/**
 * @file WorkerTokenSectionV8.tsx
 * @module v8/components
 * @description Clean worker token section component for OTP configuration pages
 * @version 8.0.0
 * @since 2024-11-27
 *
 * This component provides a clean, organized section for worker token management
 * using the unifiedWorkerTokenService. It replaces the messy inline worker token
 * functionality that was previously scattered across MFAConfigurationStepV8.
 *
 * Migrated to V9 standards: V9_COLORS, styled-components, Modern Messaging.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import { V9_COLORS } from '@/services/v9/V9ColorStandards';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { workerTokenManager } from '@/services/workerTokenManager';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { handleShowWorkerTokenModal } from '@/v8/utils/workerTokenModalHelperV8';
import { UnifiedFlowErrorHandler } from '@/v8u/services/unifiedFlowErrorHandlerV8U';
import { FiRefreshCw } from '../../icons';
import { WorkerTokenModalV8 } from './WorkerTokenModalV8';
import { WorkerTokenStatusDisplayV8 } from './WorkerTokenStatusDisplayV8';

const MODULE_TAG = '[🔑 WORKER-TOKEN-SECTION-V8]';

interface WorkerTokenSectionV8Props {
	environmentId?: string;
	onTokenUpdated?: (token: string) => void;
	compact?: boolean;
	showSettings?: boolean;
	/** When false, hides the separate Worker Token Status card (e.g. on unified MFA page). */
	showStatusCard?: boolean;
	silentApiRetrieval?: boolean;
	onSilentApiRetrievalChange?: (value: boolean) => void;
	showTokenAtEnd?: boolean;
	onShowTokenAtEndChange?: (value: boolean) => void;
}

// ---------------------------------------------------------------------------
// Styled components (V9 color standards)
// ---------------------------------------------------------------------------

const SectionRoot = styled.div<{ $compact: boolean }>`
	background: ${V9_COLORS.BG.WHITE};
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 8px;
	padding: ${({ $compact }) => ($compact ? '16px' : '24px')};
	margin-bottom: ${({ $compact }) => ($compact ? '16px' : '24px')};
	box-shadow: ${({ $compact }) => ($compact ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)')};
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
`;

const HeaderIcon = styled.span`
	font-size: 20px;
	color: ${V9_COLORS.PRIMARY.BLUE};
`;

const SectionTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
`;

const ServiceBadge = styled.span`
	font-size: 12px;
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	padding: 2px 8px;
	border-radius: 12px;
`;

const Description = styled.p`
	margin: 0 0 16px 0;
	font-size: 14px;
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	line-height: 1.5;
`;

const StatusBox = styled.div<{ $isValid: boolean }>`
	background: ${({ $isValid }) => ($isValid ? V9_COLORS.BG.SUCCESS : V9_COLORS.BG.ERROR)};
	border: 1px solid
		${({ $isValid }) => ($isValid ? V9_COLORS.BG.SUCCESS_BORDER : V9_COLORS.BG.ERROR_BORDER)};
	border-radius: 6px;
	padding: 12px;
	margin-bottom: 16px;
`;

const StatusRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const StatusLabel = styled.div<{ $isValid: boolean }>`
	font-size: 14px;
	font-weight: 600;
	color: ${({ $isValid }) =>
		$isValid ? V9_COLORS.PRIMARY.GREEN_DARK : V9_COLORS.PRIMARY.RED_DARK};
`;

const StatusError = styled.div`
	font-size: 12px;
	color: ${V9_COLORS.PRIMARY.RED_DARK};
	margin-top: 4px;
`;

const RefreshBtn = styled.button`
	padding: 6px 8px;
	background: transparent;
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 4px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ButtonRow = styled.div`
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	margin-bottom: 24px;
`;

const GetTokenButton = styled.button`
	padding: 10px 16px;
	background: ${V9_COLORS.PRIMARY.RED_DARK};
	color: ${V9_COLORS.TEXT.WHITE};
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;
	transition: background 0.2s ease, transform 0.2s ease;
	&:hover {
		background: ${V9_COLORS.BUTTON.DANGER.backgroundHover};
		transform: translateY(-1px);
	}
`;

const UpdateTokenButton = styled.button`
	padding: 10px 16px;
	background: ${V9_COLORS.PRIMARY.GREEN};
	color: ${V9_COLORS.TEXT.WHITE};
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;
	transition: background 0.2s ease, transform 0.2s ease;
	&:hover {
		background: ${V9_COLORS.PRIMARY.GREEN_DARK};
		transform: translateY(-1px);
	}
`;

const ClearTokenButton = styled.button`
	padding: 10px 16px;
	background: ${V9_COLORS.PRIMARY.RED};
	color: ${V9_COLORS.TEXT.WHITE};
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;
	transition: background 0.2s ease, transform 0.2s ease;
	&:hover {
		background: ${V9_COLORS.PRIMARY.RED_DARK};
		transform: translateY(-1px);
	}
`;

const StatusDisplayWrap = styled.div`
	margin-top: 16px;
	margin-bottom: 16px;
`;

const CheckboxGroup = styled.div`
	margin-top: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const CheckboxLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	font-size: 14px;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	& input {
		width: 16px;
		height: 16px;
		cursor: pointer;
	}
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WorkerTokenSectionV8: React.FC<WorkerTokenSectionV8Props> = ({
	environmentId,
	onTokenUpdated,
	compact = false,
	showSettings = true,
	showStatusCard = true,
	silentApiRetrieval = false,
	onSilentApiRetrievalChange,
	showTokenAtEnd = false,
	onShowTokenAtEndChange,
}) => {
	const [showModal, setShowModal] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const [tokenStatus, setTokenStatus] = React.useState<{
		isValid: boolean;
		token?: string;
		error?: string;
	}>({ isValid: false });

	// Update token status when component mounts or when worker token changes
	React.useEffect(() => {
		const updateStatus = async () => {
			const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(status);
		};
		updateStatus();

		const handleTokenUpdate = () => {
			updateStatus();
		};
		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
	}, []);

	const handleRefreshToken = async () => {
		setIsRefreshing(true);
		try {
			const newStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(newStatus);
			if (onTokenUpdated && newStatus.isValid && newStatus.token) {
				onTokenUpdated(newStatus.token);
			}
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Worker token status refreshed',
				duration: 3000,
			});
		} catch (error) {
			UnifiedFlowErrorHandler.handleError(error, {
				operation: 'refresh-worker-token',
				component: MODULE_TAG,
			});
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleClearToken = async () => {
		try {
			await unifiedWorkerTokenService.clearToken();
			window.dispatchEvent(new Event('workerTokenUpdated'));
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Worker token cleared',
				duration: 3000,
			});
		} catch (error) {
			UnifiedFlowErrorHandler.handleError(error, {
				operation: 'clear-worker-token',
				component: MODULE_TAG,
			});
		}
	};

	const handleGetToken = async () => {
		modernMessaging.showWaitScreen({
			message: 'Getting worker token...',
			detail: 'This may take a few seconds. Status will update when ready.',
		});

		try {
			if (!tokenStatus.isValid) {
				try {
					const credsResult = await unifiedWorkerTokenService.loadCredentials();
					if (credsResult.success) {
						const newToken = await workerTokenManager.refreshToken();
						if (newToken) {
							const newStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
							setTokenStatus(newStatus);
							if (onTokenUpdated) onTokenUpdated(newToken);
							modernMessaging.showFooterMessage({
								type: 'info',
								message: 'Worker token refreshed automatically',
								duration: 3000,
							});
							return;
						}
					}
				} catch {
					// Credentials may be invalid or network unavailable — fall through to modal
				}
			}
			await handleShowWorkerTokenModal(
				setShowModal,
				setTokenStatus,
				silentApiRetrieval,
				showTokenAtEnd,
				true, // User clicked "Get Worker Token" — always show modal; checkbox only affects automatic fetches
				undefined
			);
		} finally {
			modernMessaging.hideWaitScreen();
		}
	};

	return (
		<>
			<SectionRoot $compact={compact}>
				<SectionHeader>
					<HeaderIcon>🔑</HeaderIcon>
					<SectionTitle>Worker Token (Admin Flow)</SectionTitle>
					{!compact && <ServiceBadge>Service Account</ServiceBadge>}
				</SectionHeader>

				{!compact && (
					<Description>
						Worker tokens are service account credentials used for administrative operations. They
						allow you to register devices with custom status (ACTIVE or ACTIVATION_REQUIRED).
					</Description>
				)}

				<StatusBox $isValid={tokenStatus.isValid}>
					<StatusRow>
						<div>
							<StatusLabel $isValid={tokenStatus.isValid}>
								Status: {tokenStatus.isValid ? 'Active' : 'Not Set'}
							</StatusLabel>
							{!tokenStatus.isValid && (
								<StatusError>{tokenStatus.error || 'No worker token configured'}</StatusError>
							)}
						</div>
						{showSettings && (
							<RefreshBtn
								type="button"
								onClick={handleRefreshToken}
								disabled={isRefreshing}
								title="Refresh token status"
							>
								<FiRefreshCw
									size={12}
									style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
								/>
								Refresh
							</RefreshBtn>
						)}
					</StatusRow>
				</StatusBox>

				<ButtonRow>
					{!tokenStatus.isValid ? (
						<GetTokenButton type="button" onClick={handleGetToken}>
							<span style={{ fontSize: 16 }}>🔑</span>
							Get Worker Token
						</GetTokenButton>
					) : (
						<>
							<UpdateTokenButton type="button" onClick={handleGetToken}>
								<span style={{ fontSize: 16 }}>🔑</span>
								Update Token
							</UpdateTokenButton>
							<ClearTokenButton type="button" onClick={handleClearToken}>
								Clear Token
							</ClearTokenButton>
						</>
					)}
				</ButtonRow>

				{showStatusCard && (
					<StatusDisplayWrap>
						<WorkerTokenStatusDisplayV8
							mode="compact"
							showRefresh={true}
							refreshInterval={10}
							showConfig={false}
						/>
					</StatusDisplayWrap>
				)}

				{showSettings && (
					<CheckboxGroup>
						<CheckboxLabel>
							<input
								type="checkbox"
								title="Automatically fetch worker token without showing the modal when token is needed"
								checked={silentApiRetrieval}
								onChange={(e) => onSilentApiRetrievalChange?.(e.target.checked)}
							/>
							<span>
								<strong>Silent API Retrieval</strong> - Automatically fetch worker token without
								showing modal
							</span>
						</CheckboxLabel>
						<CheckboxLabel>
							<input
								type="checkbox"
								title="Display the worker token after successful retrieval"
								checked={showTokenAtEnd}
								onChange={(e) => onShowTokenAtEndChange?.(e.target.checked)}
							/>
							<span>
								<strong>Show Token at End</strong> - Display the worker token after successful
								retrieval
							</span>
						</CheckboxLabel>
					</CheckboxGroup>
				)}
			</SectionRoot>

			<WorkerTokenModalV8
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				onTokenGenerated={(token) => {
					setShowModal(false);
					if (onTokenUpdated) {
						onTokenUpdated(token);
					}
					window.dispatchEvent(new Event('workerTokenUpdated'));
				}}
				environmentId={environmentId || ''}
			/>
		</>
	);
};
