/**
 * @file TokenStatusPageV8U.tsx
 * @module v8u/pages
 * @description Token Status Monitoring Page for v8 unified flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This page provides a comprehensive token status monitoring interface for OAuth flows.
 * Features include:
 * - Worker token status monitoring with configuration
 * - User token monitoring (Access, ID, and Refresh tokens)
 * - Real-time token status updates
 * - OAuth configuration management
 * - Token refresh and validation
 */

import React, { useEffect, useState } from 'react';
import { FiCode, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
import WorkerTokenStatusDisplayV8 from '@/v8/components/WorkerTokenStatusDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '@/v8/services/workerTokenStatusServiceV8';
import UserTokenStatusDisplayV8U from '@/v8u/components/UserTokenStatusDisplayV8U';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
import { useStandardSpinner, StandardModalSpinner } from '../../components/ui/StandardSpinner';

// Token monitoring interfaces

// Styled components
const PageContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const PageHeader = styled.div`
	margin-bottom: 32px;
`;

const PageTitle = styled.h1`
	font-size: 32px;
	font-weight: 700;
	color: #1f2937;
	margin: 0 0 8px 0;
`;

const PageDescription = styled.p`
	font-size: 16px;
	color: #6b7280;
	margin: 0;
	line-height: 1.6;
`;

const TokenStatusCard = styled.div`
	background: white;
	border-radius: 12px;
	padding: 24px;
	margin-bottom: 24px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
`;

const TokenStatusHeader = styled.div`
	margin-bottom: 16px;
`;

const TokenStatusTitle = styled.h2`
	font-size: 20px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const TokenStatusDescription = styled.p`
	font-size: 14px;
	color: #6b7280;
	margin: 8px 0 0 0;
	line-height: 1.5;
`;

const ActionButton = styled.button`
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 8px 16px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: all 0.2s;

	&:hover {
		background: #2563eb;
		transform: scale(1.02);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
`;

const TokenStatusPageV8U: React.FC = () => {
	const [, setTokenStatus] = useState<TokenStatusInfo>({
		isValid: false,
		status: 'missing',
		message: 'Checking...',
		expiresAt: null,
		minutesRemaining: 0,
	});

	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return config.workerToken?.silentApiRetrieval || false;
	});

	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return config.workerToken?.showTokenAtEnd || false;
	});

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Standardized spinner hooks for token status operations
	const statusSpinner = useStandardSpinner(2000); // Token status check - 2 seconds
	const modalSpinner = useStandardSpinner(4000);  // Worker token modal - 4 seconds
	const configSpinner = useStandardSpinner(1500); // Config update - 1.5 seconds

	// Update token status on mount and set up interval
	useEffect(() => {
		const updateTokenStatus = async () => {
			try {
				const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(status);
			} catch (error) {
				logger.error('[TOKEN-STATUS-V8U] Failed to check token status:', error);
				setTokenStatus({
					isValid: false,
					status: 'error',
					message: 'Failed to check status',
					expiresAt: null,
					minutesRemaining: 0,
				});
			}
		};

		// Initial check
		updateTokenStatus();

		// Set up interval for periodic updates
		const interval = setInterval(updateTokenStatus, 5000);

		// Listen for configuration updates
		const handleConfigUpdate = () => {
			const config = MFAConfigurationServiceV8.loadConfiguration();
			setSilentApiRetrieval(config.workerToken?.silentApiRetrieval || false);
			setShowTokenAtEnd(config.workerToken?.showTokenAtEnd || false);
		};

		const handleTokenUpdate = () => {
			updateTokenStatus();
		};

		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate);
		window.addEventListener('workerTokenUpdated', handleTokenUpdate);

		return () => {
			clearInterval(interval);
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate);
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, []);

	const handleShowWorkerTokenModal = async () => {
		try {
			console.log('[TOKEN-STATUS-V8U] Starting worker token modal with params:', {
				silentApiRetrieval,
				showTokenAtEnd,
				hasSetShowWorkerTokenModal: typeof setShowWorkerTokenModal,
				hasSetTokenStatus: typeof setTokenStatus,
			});
			
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
			console.log('[TOKEN-STATUS-V8U] Successfully imported handleShowWorkerTokenModal');
			
			await handleShowWorkerTokenModal(
				setShowWorkerTokenModal,
				setTokenStatus,
				silentApiRetrieval,
				showTokenAtEnd,
				false
			);
			
			console.log('[TOKEN-STATUS-V8U] Worker token modal completed successfully');
		} catch (error) {
			console.error('[TOKEN-STATUS-V8U] Detailed error:', {
				error,
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				name: error instanceof Error ? error.name : 'Unknown',
			});
			logger.error('[TOKEN-STATUS-V8U] Error showing worker token modal:', error);
		}
	};

	return (
		<PageContainer>
			{/* Modal Spinners for Token Status Operations */}
			<StandardModalSpinner
				show={statusSpinner.isLoading}
				message="Checking token status..."
				theme="blue"
			/>
			<StandardModalSpinner
				show={modalSpinner.isLoading}
				message="Loading worker token..."
				theme="green"
			/>
			<StandardModalSpinner
				show={configSpinner.isLoading}
				message="Updating configuration..."
				theme="orange"
			/>
			
			<PageHeader>
				<PageTitle>Token Status Monitoring</PageTitle>
				<PageDescription>
					Comprehensive token status monitoring for OAuth flows and API authentication. Track worker
					tokens, user tokens, and manage OAuth configuration settings in real-time.
				</PageDescription>
			</PageHeader>

			{/* Worker Token Status Section */}
			<TokenStatusCard>
				<TokenStatusHeader>
					<TokenStatusTitle>
						<FiShield />
						Worker Token Status
					</TokenStatusTitle>
				</TokenStatusHeader>
				<TokenStatusDescription>
					Monitor the worker token used for API authentication and management operations. Check
					token validity, expiration, and refresh status.
				</TokenStatusDescription>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					<div style={{ display: 'flex', gap: '8px' }}>
						<ActionButton onClick={handleShowWorkerTokenModal}>
							<FiShield />
							Get Worker Token
						</ActionButton>
					</div>

					{/* Detailed Worker Token Settings Checkboxes - Same as Main Page */}
					<div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								cursor: 'pointer',
								userSelect: 'none',
								padding: '8px',
								borderRadius: '6px',
								transition: 'background-color 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f3f4f6';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'transparent';
							}}
						>
							<input
								type="checkbox"
								checked={silentApiRetrieval}
								onChange={async (e) => {
									const newValue = e.target.checked;
									setSilentApiRetrieval(newValue);
									// Update config service immediately (no cache)
									const config = MFAConfigurationServiceV8.loadConfiguration();
									config.workerToken.silentApiRetrieval = newValue;
									MFAConfigurationServiceV8.saveConfiguration(config);
									// Dispatch event to notify other components
									window.dispatchEvent(
										new CustomEvent('mfaConfigurationUpdated', {
											detail: { workerToken: config.workerToken },
										})
									);

									// If enabling silent retrieval and token is missing/expired, attempt silent retrieval now
									if (newValue) {
										try {
											const currentStatus =
												await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
											if (!currentStatus.isValid) {
												logger.debug(
													'[TOKEN-STATUS-V8U] Silent API retrieval enabled, attempting to fetch token now...'
												);
												const { handleShowWorkerTokenModal } = await import(
													'@/v8/utils/workerTokenModalHelperV8'
												);
												await handleShowWorkerTokenModal(
													setShowWorkerTokenModal,
													setTokenStatus,
													newValue, // Use new value
													showTokenAtEnd,
													false // Not forced - respect silent setting
												);
											}
										} catch (error) {
											logger.error('[TOKEN-STATUS-V8U] Error in silent retrieval:', error);
										}
									}
								}}
								style={{
									width: '20px',
									height: '20px',
									cursor: 'pointer',
									accentColor: '#6366f1',
									flexShrink: 0,
								}}
							/>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
								<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
									Silent API Token Retrieval
								</span>
								<span style={{ fontSize: '12px', color: '#6b7280' }}>
									Automatically fetch worker token in the background without showing modals
								</span>
							</div>
						</label>

						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								cursor: 'pointer',
								userSelect: 'none',
								padding: '8px',
								borderRadius: '6px',
								transition: 'background-color 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f3f4f6';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'transparent';
							}}
						>
							<input
								type="checkbox"
								checked={showTokenAtEnd}
								onChange={(e) => {
									const newValue = e.target.checked;
									setShowTokenAtEnd(newValue);
									// Update config service immediately (no cache)
									const config = MFAConfigurationServiceV8.loadConfiguration();
									config.workerToken.showTokenAtEnd = newValue;
									MFAConfigurationServiceV8.saveConfiguration(config);
									// Dispatch event to notify other components
									window.dispatchEvent(
										new CustomEvent('mfaConfigurationUpdated', {
											detail: { workerToken: config.workerToken },
										})
									);
								}}
								style={{
									width: '20px',
									height: '20px',
									cursor: 'pointer',
									accentColor: '#6366f1',
									flexShrink: 0,
								}}
							/>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
								<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
									Show Token After Generation
								</span>
								<span style={{ fontSize: '12px', color: '#6b7280' }}>
									Display the generated worker token in a modal after successful retrieval
								</span>
							</div>
						</label>
					</div>

					{/* Worker Token Status Display - Moved below buttons */}
					<WorkerTokenStatusDisplayV8 mode="compact" showRefresh={true} />
				</div>
			</TokenStatusCard>

			{/* User Token Status Section */}
			<TokenStatusCard>
				<TokenStatusHeader>
					<TokenStatusTitle>
						<FiCode />
						User Token Status
					</TokenStatusTitle>
				</TokenStatusHeader>
				<TokenStatusDescription>
					Monitor user authentication tokens (Access, ID, and Refresh tokens) from OAuth flows and
					unified authentication.
				</TokenStatusDescription>

				<UserTokenStatusDisplayV8U showRefresh={true} refreshInterval={10} />
			</TokenStatusCard>

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
				/>
			)}
		</PageContainer>
	);
};

export default TokenStatusPageV8U;
