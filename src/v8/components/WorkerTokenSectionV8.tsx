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
 */

import React, { useState } from 'react';
import { FiKey, FiRefreshCw } from 'react-icons/fi';
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { handleShowWorkerTokenModal } from '@/v8/utils/workerTokenModalHelperV8';
import { WorkerTokenModalV8 } from './WorkerTokenModalV8';
import { WorkerTokenStatusDisplayV8 } from './WorkerTokenStatusDisplayV8';

const MODULE_TAG = '[🔑 WORKER-TOKEN-SECTION-V8]';

interface WorkerTokenSectionV8Props {
	environmentId?: string;
	onTokenUpdated?: (token: string) => void;
	compact?: boolean;
	showSettings?: boolean;
	silentApiRetrieval?: boolean;
	onSilentApiRetrievalChange?: (value: boolean) => void;
	showTokenAtEnd?: boolean;
	onShowTokenAtEndChange?: (value: boolean) => void;
}

export const WorkerTokenSectionV8: React.FC<WorkerTokenSectionV8Props> = ({
	environmentId,
	onTokenUpdated,
	compact = false,
	showSettings = true,
	silentApiRetrieval = false,
	onSilentApiRetrievalChange,
	showTokenAtEnd = false,
	onShowTokenAtEndChange,
}) => {
	const [showModal, setShowModal] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Get current worker token status
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

		// Listen for worker token updates
		const handleTokenUpdate = () => {
			updateStatus();
		};
		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
	}, []);

	const handleRefreshToken = async () => {
		setIsRefreshing(true);
		try {
			// Refresh token status
			const newStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(newStatus);
			if (onTokenUpdated && newStatus.isValid && newStatus.token) {
				onTokenUpdated(newStatus.token);
			}
			toastV8.success('Worker token status refreshed');
		} catch (error) {
			console.error(MODULE_TAG, 'Error refreshing worker token:', error);
			toastV8.error('Failed to refresh worker token');
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleClearToken = async () => {
		try {
			await unifiedWorkerTokenService.clearToken();
			window.dispatchEvent(new Event('workerTokenUpdated'));
			toastV8.success('Worker token cleared');
		} catch (error) {
			console.error(MODULE_TAG, 'Error clearing worker token:', error);
			toastV8.error('Failed to clear worker token');
		}
	};

	const handleGetToken = async () => {
		// Use the silent retrieval helper
		// If silentApiRetrieval is enabled, don't force modal (allow silent retrieval)
		// If silentApiRetrieval is disabled, force modal for explicit credential configuration
		await handleShowWorkerTokenModal(
			setShowModal,
			setTokenStatus,
			silentApiRetrieval, // Use the prop value
			showTokenAtEnd, // Use the prop value
			!silentApiRetrieval, // forceShowModal = true only if silent retrieval is disabled
			undefined // No silent loading state needed
		);
	};

	const sectionStyle = compact
		? {
				background: '#ffffff',
				border: '1px solid #e5e7eb',
				borderRadius: '8px',
				padding: '16px',
				marginBottom: '16px',
			}
		: {
				background: '#ffffff',
				border: '1px solid #e5e7eb',
				borderRadius: '8px',
				padding: '24px',
				marginBottom: '24px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
			};

	return (
		<>
			<div style={sectionStyle}>
				{/* Header */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
					<FiKey size={20} color="#3b82f6" />
					<h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
						Worker Token (Admin Flow)
					</h3>
					{!compact && (
						<span
							style={{
								fontSize: '12px',
								color: '#6b7280',
								background: '#f3f4f6',
								padding: '2px 8px',
								borderRadius: '12px',
							}}
						>
							Service Account
						</span>
					)}
				</div>

				{/* Description */}
				{!compact && (
					<p
						style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}
					>
						Worker tokens are service account credentials used for administrative operations. They
						allow you to register devices with custom status (ACTIVE or ACTIVATION_REQUIRED).
					</p>
				)}

				{/* Token Status */}
				<div
					style={{
						background: tokenStatus.isValid ? '#f0fdf4' : '#fef2f2',
						border: `1px solid ${tokenStatus.isValid ? '#86efac' : '#fca5a5'}`,
						borderRadius: '6px',
						padding: '12px',
						marginBottom: '16px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div>
							<div
								style={{
									fontSize: '14px',
									fontWeight: '600',
									color: tokenStatus.isValid ? '#166534' : '#991b1b',
								}}
							>
								Status: {tokenStatus.isValid ? 'Active' : 'Not Set'}
							</div>
							{!tokenStatus.isValid && (
								<div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '4px' }}>
									{tokenStatus.error || 'No worker token configured'}
								</div>
							)}
						</div>
						{showSettings && (
							<button
								type="button"
								onClick={handleRefreshToken}
								disabled={isRefreshing}
								style={{
									padding: '6px 8px',
									background: 'transparent',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									fontSize: '12px',
									color: '#6b7280',
								}}
								title="Refresh token status"
							>
								<FiRefreshCw
									size={12}
									style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
								/>
								Refresh
							</button>
						)}
					</div>
				</div>

				{/* Action Buttons */}
				<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
					{!tokenStatus.isValid ? (
						<button
							type="button"
							onClick={handleGetToken}
							style={{
								padding: '10px 16px',
								background: '#dc2626',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#b91c1c';
								e.currentTarget.style.transform = 'translateY(-1px)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#dc2626';
								e.currentTarget.style.transform = 'translateY(0)';
							}}
						>
							<FiKey size={16} />
							Get Worker Token
						</button>
					) : (
						<>
							<button
								type="button"
								onClick={handleGetToken}
								style={{
									padding: '10px 16px',
									background: '#10b981',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#059669';
									e.currentTarget.style.transform = 'translateY(-1px)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = '#10b981';
									e.currentTarget.style.transform = 'translateY(0)';
								}}
							>
								<FiKey size={16} />
								Update Token
							</button>
							<button
								type="button"
								onClick={handleClearToken}
								style={{
									padding: '10px 16px',
									background: '#ef4444',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#dc2626';
									e.currentTarget.style.transform = 'translateY(-1px)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = '#ef4444';
									e.currentTarget.style.transform = 'translateY(0)';
								}}
							>
								Clear Token
							</button>
						</>
					)}
				</div>

				{/* Worker Token Status Display - Between buttons and checkboxes */}
				<div style={{ marginTop: '16px', marginBottom: '16px' }}>
					<WorkerTokenStatusDisplayV8
						mode="compact"
						showRefresh={true}
						refreshInterval={10}
						showConfig={false}
					/>
				</div>

				{/* Worker Token Settings Checkboxes */}
				{showSettings && (
					<div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								cursor: 'pointer',
								fontSize: '14px',
								color: '#374151',
							}}
						>
							<input
								type="checkbox"
								checked={silentApiRetrieval}
								onChange={(e) => onSilentApiRetrievalChange?.(e.target.checked)}
								style={{
									width: '16px',
									height: '16px',
									cursor: 'pointer',
								}}
							/>
							<span>
								<strong>Silent API Retrieval</strong> - Automatically fetch worker token without
								showing modal
							</span>
						</label>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								cursor: 'pointer',
								fontSize: '14px',
								color: '#374151',
							}}
						>
							<input
								type="checkbox"
								checked={showTokenAtEnd}
								onChange={(e) => onShowTokenAtEndChange?.(e.target.checked)}
								style={{
									width: '16px',
									height: '16px',
									cursor: 'pointer',
								}}
							/>
							<span>
								<strong>Show Token at End</strong> - Display the worker token after successful
								retrieval
							</span>
						</label>
					</div>
				)}
			</div>

			{/* Worker Token Modal */}
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
