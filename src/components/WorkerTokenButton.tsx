/**
 * @file WorkerTokenButton.tsx
 * @module components
 * @description Standardized worker token button component matching MFA flow
 * @version 1.0.0
 * @since 2025-01-XX
 */

import React, { useState } from 'react';
import { FiCheckCircle, FiKey, FiRefreshCw } from 'react-icons/fi';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '@/v8/services/workerTokenStatusServiceV8';

// Import ButtonSpinner - assuming it's available in the shared components
// If not in this exact path, we may need to adjust the import
const ButtonSpinner = ({
	loading,
	onClick,
	disabled,
	spinnerSize = 14,
	spinnerPosition = 'left',
	loadingText = 'Loading...',
	children,
	style = {},
	...props
}: {
	loading: boolean;
	onClick: () => void | Promise<void>;
	disabled?: boolean;
	spinnerSize?: number;
	spinnerPosition?: 'left' | 'right';
	loadingText?: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
	[key: string]: unknown;
}) => (
	<button
		type="button"
		onClick={onClick}
		disabled={disabled || loading}
		style={{
			padding: '8px 16px',
			border: 'none',
			borderRadius: '6px',
			fontSize: '14px',
			fontWeight: '500',
			cursor: disabled || loading ? 'not-allowed' : 'pointer',
			whiteSpace: 'nowrap',
			display: 'flex',
			alignItems: 'center',
			gap: '8px',
			opacity: loading ? 0.7 : 1,
			...style,
		}}
		{...props}
	>
		{loading && spinnerPosition === 'left' && (
			<FiRefreshCw size={spinnerSize} style={{ animation: 'spin 1s linear infinite' }} />
		)}
		{loading ? loadingText : children}
		{loading && spinnerPosition === 'right' && (
			<FiRefreshCw size={spinnerSize} style={{ animation: 'spin 1s linear infinite' }} />
		)}
	</button>
);

interface WorkerTokenButtonProps {
	/** Optional callback when token is obtained */
	onTokenObtained?: (token: string) => void;
	/** Optional callback when modal closes */
	onModalClose?: () => void;
	/** Optional custom styling */
	buttonStyle?: React.CSSProperties;
	/** Optional override for button text */
	buttonText?: string;
	/** Optional override for loading text */
	loadingText?: string;
	/** Optional environment ID (if not using stored credentials) */
	environmentId?: string;
	/** Whether to show refresh button when token is valid */
	showRefresh?: boolean;
}

/**
 * Standardized Worker Token Button Component
 *
 * This component provides the exact same worker token button behavior
 * as used in the MFA flow, ensuring consistency across the application.
 *
 * Features:
 * - Same styling as MFA flow button
 * - Same loading states and animations
 * - Same modal handling via handleShowWorkerTokenModal
 * - Same token status integration
 * - Optional refresh functionality
 */
export const WorkerTokenButton: React.FC<WorkerTokenButtonProps> = ({
	onTokenObtained,
	onModalClose,
	buttonStyle = {},
	buttonText,
	loadingText = 'Getting Token...',
	environmentId,
	showRefresh = false,
}) => {
	const [isGettingWorkerToken, setIsGettingWorkerToken] = useState(false);
	const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo>(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync()
	);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Update token status periodically
	React.useEffect(() => {
		const checkStatus = () => {
			const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
			setTokenStatus(currentStatus);
		};

		// Check status every 30 seconds
		const interval = setInterval(checkStatus, 30000);

		// Listen for storage changes
		const handleStorageChange = () => checkStatus();
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
		};
	}, []);

	const handleGetWorkerToken = async () => {
		setIsGettingWorkerToken(true);
		try {
			// Use the same helper as MFA flow
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');

			// User explicitly clicked the button - always show modal
			await handleShowWorkerTokenModal(
				setShowWorkerTokenModal,
				setTokenStatus,
				false, // silentApiRetrieval - default to false for explicit button clicks
				false, // showTokenAtEnd - default to false
				true // forceShowModal - always show modal when user clicks button
			);
		} finally {
			setIsGettingWorkerToken(false);
		}
	};

	const handleRefreshToken = async () => {
		setIsGettingWorkerToken(true);
		try {
			const { unifiedWorkerTokenService } = await import('@/services/unifiedWorkerTokenService');
			const token = await unifiedWorkerTokenService.getToken();
			if (token) {
				const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
				setTokenStatus(newStatus);
				onTokenObtained?.(token);
			}
		} catch (error) {
			console.error('Failed to refresh worker token:', error);
		} finally {
			setIsGettingWorkerToken(false);
		}
	};

	const handleModalClose = () => {
		setShowWorkerTokenModal(false);
		// Refresh token status when modal closes
		const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
		setTokenStatus(newStatus);
		onModalClose?.();
	};

	// Determine button styling based on token status (same as MFA)
	const getButtonStyle = (): React.CSSProperties => {
		const baseStyle = {
			...buttonStyle,
		};

		if (tokenStatus.status === 'expiring-soon') {
			return {
				...baseStyle,
				background: '#f59e0b',
				color: 'white',
			};
		}

		if (tokenStatus.isValid) {
			return {
				...baseStyle,
				background: '#10b981',
				color: 'white',
			};
		}

		return {
			...baseStyle,
			background: '#dc2626',
			color: 'white',
		};
	};

	// Determine button text
	const getButtonText = (): string => {
		if (buttonText) return buttonText;

		if (tokenStatus.isValid) {
			if (tokenStatus.status === 'expiring-soon') {
				return 'Refresh Worker Token';
			}
			return 'Refresh Worker Token';
		}

		return 'Get Worker Token';
	};

	// Load WorkerTokenModalV8 component when needed
	const [WorkerTokenModalV8, setWorkerTokenModalV8] = React.useState<
		typeof import('@/v8/components/WorkerTokenModalV8').WorkerTokenModalV8 | null
	>(null);

	React.useEffect(() => {
		const loadModal = async () => {
			try {
				const modalModule = await import('@/v8/components/WorkerTokenModalV8');
				setWorkerTokenModalV8(() => modalModule.WorkerTokenModalV8);
			} catch (error) {
				console.error('Failed to load WorkerTokenModalV8:', error);
			}
		};

		if (showWorkerTokenModal && !WorkerTokenModalV8) {
			loadModal();
		}
	}, [showWorkerTokenModal, WorkerTokenModalV8]);

	return (
		<div
			style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}
		>
			{/* Main Worker Token Button */}
			<ButtonSpinner
				loading={isGettingWorkerToken}
				onClick={handleGetWorkerToken}
				disabled={isGettingWorkerToken}
				spinnerSize={14}
				spinnerPosition="left"
				loadingText={loadingText}
				style={getButtonStyle()}
			>
				{isGettingWorkerToken ? (
					''
				) : (
					<>
						{tokenStatus.isValid ? <FiCheckCircle size={14} /> : <FiKey size={14} />}
						{getButtonText()}
					</>
				)}
			</ButtonSpinner>

			{/* Optional Refresh Button */}
			{showRefresh && tokenStatus.isValid && (
				<ButtonSpinner
					loading={isGettingWorkerToken}
					onClick={handleRefreshToken}
					disabled={isGettingWorkerToken}
					spinnerSize={12}
					spinnerPosition="left"
					loadingText="Refreshing..."
					style={{
						padding: '6px 12px',
						fontSize: '12px',
						background: '#f3f4f6',
						color: '#374151',
						border: '1px solid #d1d5db',
					}}
				>
					<FiRefreshCw size={12} />
					Refresh
				</ButtonSpinner>
			)}

			{/* Worker Token Modal */}
			{showWorkerTokenModal && WorkerTokenModalV8 && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={handleModalClose}
					onTokenGenerated={(token) => {
						const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
						setTokenStatus(newStatus);
						onTokenObtained?.(token);
					}}
					environmentId={environmentId || ''}
				/>
			)}
		</div>
	);
};

export default WorkerTokenButton;
