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
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { Button } from '@/v8/components/Button';
import { colors, spacing } from '@/v8/styles/designTokens';
import { FiX } from '../../../../icons';

import { logger } from '../../../../utils/logger';

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
	const [isGettingWorkerToken, setIsGettingWorkerToken] = useState(false);

	function openGlobalWorkerTokenModal(source: string): void {
		window.dispatchEvent(new CustomEvent('open-worker-token-modal', { detail: { source } }));
	}

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

	const handleGetWorkerToken = () => {
		setIsGettingWorkerToken(true);
		openGlobalWorkerTokenModal('UnifiedErrorDisplayV8');
		// Reset loading after a short delay; global modal opens with its own wait screen
		setTimeout(() => setIsGettingWorkerToken(false), 600);
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
										<span style={{ fontSize: '14px' }}>🔑</span>
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

			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</>
	);
};
