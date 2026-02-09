/**
 * @file UnifiedErrorDisplayV8.tsx
 * @module v8/flows/unified/components
 * @description Error display component with worker token recovery option
 * @version 9.2.0
 * @since 2026-02-06
 *
 * Purpose: Display errors with optional worker token button for token-related errors
 * Following SWE-15 principles for reusable error handling
 */

import React, { useState } from 'react';
import { FiKey, FiX } from 'react-icons/fi';
import { Button } from '@/v8/components/Button';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { globalEnvironmentService } from '@/v8/services/globalEnvironmentService';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { colors, spacing } from '@/v8/styles/designTokens';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🚨 UNIFIED-ERROR-DISPLAY-V8]';

interface UnifiedErrorDisplayV8Props {
	/** Error message to display */
	message: string;
	/** Optional error details */
	details?: string;
	/** Whether to show worker token button */
	showWorkerTokenButton?: boolean;
	/** Callback when error is dismissed */
	onDismiss?: () => void;
	/** Custom className for styling */
	className?: string;
	/** Error type for styling */
	type?: 'error' | 'warning' | 'info';
}

export const UnifiedErrorDisplayV8: React.FC<UnifiedErrorDisplayV8Props> = ({
	message,
	details,
	showWorkerTokenButton = false,
	onDismiss,
	className = '',
	type = 'error',
}) => {
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [isGettingWorkerToken, setIsGettingWorkerToken] = useState(false);

	// Determine if this is a worker token related error
	const isWorkerTokenError = React.useMemo(() => {
		const lowerMessage = message.toLowerCase();
		const lowerDetails = details?.toLowerCase() || '';

		return (
			lowerMessage.includes('worker token') ||
			lowerMessage.includes('token required') ||
			lowerMessage.includes('invalid token') ||
			lowerMessage.includes('expired token') ||
			lowerDetails.includes('worker token') ||
			lowerDetails.includes('token required') ||
			lowerDetails.includes('invalid token') ||
			lowerDetails.includes('expired token')
		);
	}, [message, details]);

	// Auto-show worker token button for token-related errors
	const shouldShowWorkerTokenButton = showWorkerTokenButton || isWorkerTokenError;

	const handleGetWorkerToken = async () => {
		setIsGettingWorkerToken(true);
		try {
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');

			await handleShowWorkerTokenModal(
				setShowWorkerTokenModal,
				() => {}, // Token status will be checked after modal closes
				false, // Show modal (not silent)
				false, // Don't show token at end
				false, // setIsGettingWorkerToken parameter
				setIsGettingWorkerToken
			);
		} catch (error) {
			console.error(`${MODULE_TAG} Error opening worker token modal:`, error);
			toastV8.error('Failed to open worker token modal');
		} finally {
			setIsGettingWorkerToken(false);
		}
	};

	const handleWorkerTokenModalClose = async () => {
		setShowWorkerTokenModal(false);
		// Check token status after modal closes
		const tokenStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
		if (tokenStatus.isValid) {
			toastV8.success('Worker token configured successfully!');
			// Auto-dismiss error if token is now valid
			if (onDismiss) {
				onDismiss();
			}
		}
	};

	const getErrorStyles = () => {
		const baseStyles = {
			display: 'flex',
			alignItems: 'flex-start',
			gap: spacing[3],
			padding: spacing[4],
			borderRadius: '8px',
			border: `1px solid`,
			marginBottom: spacing[4],
			background: 'white',
		};

		switch (type) {
			case 'warning':
				return {
					...baseStyles,
					borderColor: colors.warning[400],
					background: colors.warning[50],
				};
			case 'info':
				return {
					...baseStyles,
					borderColor: colors.info[400],
					background: colors.info[50],
				};
			default: // error
				return {
					...baseStyles,
					borderColor: colors.error[400],
					background: colors.error[50],
				};
		}
	};

	const getIconColor = () => {
		switch (type) {
			case 'warning':
				return colors.warning[600];
			case 'info':
				return colors.info[600];
			default: // error
				return colors.error[600];
		}
	};

	if (!message) return null;

	return (
		<>
			<div className={`unified-error-display ${className}`} style={getErrorStyles()}>
				{/* Error Icon */}
				<div style={{ flexShrink: 0, marginTop: '2px' }}>
					<FiX size={20} color={getIconColor()} style={{ strokeWidth: 2.5 }} />
				</div>

				{/* Error Content */}
				<div style={{ flex: 1, minWidth: 0 }}>
					<div
						style={{
							fontSize: '14px',
							fontWeight: '600',
							color: getIconColor(),
							marginBottom: details ? spacing[1] : 0,
							whiteSpace: 'pre-line',
						}}
					>
						{message}
					</div>

					{details && (
						<div
							style={{
								fontSize: '13px',
								color: colors.gray[600],
								whiteSpace: 'pre-line',
							}}
						>
							{details}
						</div>
					)}

					{/* Action Buttons */}
					<div
						style={{
							display: 'flex',
							gap: spacing[2],
							marginTop: spacing[3],
							alignItems: 'center',
						}}
					>
						{shouldShowWorkerTokenButton && (
							<Button
								onClick={handleGetWorkerToken}
								disabled={isGettingWorkerToken}
								variant="secondary"
								size="sm"
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: spacing[1],
								}}
							>
								{isGettingWorkerToken ? (
									<>
										<div
											style={{
												width: '14px',
												height: '14px',
												border: `2px solid ${colors.gray[400]}`,
												borderTop: `2px solid ${colors.blue[600]}`,
												borderRadius: '50%',
												animation: 'spin 1s linear infinite',
											}}
										/>
										Getting Token...
									</>
								) : (
									<>
										<FiKey size={14} />
										Get Worker Token
									</>
								)}
							</Button>
						)}

						{onDismiss && (
							<Button
								onClick={onDismiss}
								variant="ghost"
								size="sm"
								style={{
									fontSize: '13px',
									color: colors.gray[600],
								}}
							>
								Dismiss
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Worker Token Modal */}
			{globalEnvironmentService.getEnvironmentId() && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={handleWorkerTokenModalClose}
					environmentId={globalEnvironmentService.getEnvironmentId()}
				/>
			)}

			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</>
	);
};
