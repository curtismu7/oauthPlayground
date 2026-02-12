// src/services/workerTokenUIService.tsx
// Reusable UI service for consistent worker token management across pages

import React from 'react';
import { FiKey, FiRefreshCw } from 'react-icons/fi';
import styled from 'styled-components';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import { WorkerTokenModal } from '../components/WorkerTokenModal';

// Styled components for consistent worker token UI
const WorkerTokenButton = styled.button<{ $variant?: 'primary' | 'success' | 'warning' }>`
	padding: 0.75rem 1.5rem;
	background: ${({ $variant }) =>
		$variant === 'success' ? '#10b981' : $variant === 'warning' ? '#f59e0b' : '#3b82f6'};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;
	
	&:hover {
		background: ${({ $variant }) =>
			$variant === 'success' ? '#059669' : $variant === 'warning' ? '#d97706' : '#2563eb'};
	}
	
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ClearTokenButton = styled.button`
	padding: 0.75rem 1.5rem;
	background: #ef4444;
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;
	
	&:hover {
		background: #dc2626;
	}
`;

interface WorkerTokenUIProps {
	// Worker token state
	workerToken: string;
	workerTokenExpiresAt?: number;

	// Modal state
	showModal: boolean;
	onShowModal: () => void;
	onCloseModal: () => void;
	onModalContinue: () => void;

	// Configuration
	flowType?: string;
	environmentId?: string;
	skipCredentialsStep?: boolean;
	prefillCredentials?: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
		region?: string;
		scopes?: string;
	};
	tokenStorageKey?: string;
	tokenExpiryKey?: string;

	// Optional clear token handler
	onClearToken?: () => void;

	// Banner customization
	bannerMessage?: string;

	// Button customization
	generateButtonText?: string;
	readyButtonText?: string;
	refreshButtonText?: string;
}

/**
 * Renders worker token banner when token exists
 */
export const renderWorkerTokenBanner = (
	workerToken: string,
	workerTokenExpiresAt?: number,
	customMessage?: string
) => {
	if (!workerToken) return null;

	const tokenExpiryKey = 'worker_token_expiry';
	const defaultMessage = workerTokenExpiresAt
		? `Your existing worker token will be used automatically. Token expires at ${new Date(workerTokenExpiresAt).toLocaleString()}.`
		: 'Your existing worker token will be used automatically. Worker token credentials below are only needed if the token expires.';

	return (
		<WorkerTokenDetectedBanner
			token={workerToken}
			tokenExpiryKey={tokenExpiryKey}
			message={customMessage || defaultMessage}
		/>
	);
};

/**
 * Renders worker token button based on token state
 */
export const renderWorkerTokenButton = (
	workerToken: string,
	workerTokenExpiresAt: number | undefined,
	onShowModal: () => void,
	generateButtonText: string = 'Get Worker Token',
	readyButtonText: string = 'Worker Token Ready',
	refreshButtonText: string = 'Refresh Worker Token'
) => {
	const hasToken = !!workerToken;
	const isExpired = workerTokenExpiresAt ? Date.now() > workerTokenExpiresAt : false;

	const buttonText =
		hasToken && !isExpired ? readyButtonText : isExpired ? refreshButtonText : generateButtonText;

	const variant = hasToken && !isExpired ? 'success' : isExpired ? 'warning' : 'primary';

	return (
		<WorkerTokenButton $variant={variant} onClick={onShowModal}>
			{hasToken && !isExpired ? <FiKey /> : <FiRefreshCw />}
			{buttonText}
		</WorkerTokenButton>
	);
};

/**
 * Renders clear token button
 */
export const renderClearTokenButton = (workerToken: string, onClearToken: () => void) => {
	if (!workerToken) return null;

	return <ClearTokenButton onClick={onClearToken}>Clear Token</ClearTokenButton>;
};

/**
 * Complete Worker Token UI component with banner, buttons, and modal
 */
export const WorkerTokenUI: React.FC<WorkerTokenUIProps> = ({
	workerToken,
	workerTokenExpiresAt,
	showModal,
	onShowModal,
	onCloseModal,
	onModalContinue,
	flowType = 'flow',
	environmentId = '',
	skipCredentialsStep = false,
	prefillCredentials,
	tokenStorageKey = 'worker_token',
	tokenExpiryKey = 'worker_token_expires_at',
	onClearToken,
	bannerMessage,
	generateButtonText = 'Get Worker Token',
	readyButtonText = 'Worker Token Ready',
	refreshButtonText = 'Refresh Worker Token',
}) => {
	return (
		<>
			{/* Banner */}
			{renderWorkerTokenBanner(workerToken, workerTokenExpiresAt, bannerMessage)}

			{/* Buttons */}
			<div
				style={{
					display: 'flex',
					gap: '1rem',
					alignItems: 'center',
					flexWrap: 'wrap',
					marginTop: '1rem',
				}}
			>
				{renderWorkerTokenButton(
					workerToken,
					workerTokenExpiresAt,
					onShowModal,
					generateButtonText,
					readyButtonText,
					refreshButtonText
				)}

				{onClearToken && renderClearTokenButton(workerToken, onClearToken)}
			</div>

			{/* Modal */}
			{showModal && (
				<WorkerTokenModal
					isOpen={showModal}
					onClose={onCloseModal}
					onContinue={onModalContinue}
					flowType={flowType}
					environmentId={environmentId}
					skipCredentialsStep={skipCredentialsStep}
					prefillCredentials={prefillCredentials}
					tokenStorageKey={tokenStorageKey}
					tokenExpiryKey={tokenExpiryKey}
				/>
			)}
		</>
	);
};

/**
 * Hook for managing worker token state
 */
export const useWorkerTokenState = (
	tokenStorageKey: string = 'worker_token',
	tokenExpiryKey: string = 'worker_token_expires_at'
) => {
	const [workerToken, setWorkerToken] = React.useState<string>(
		() => localStorage.getItem(tokenStorageKey) || ''
	);
	const [workerTokenExpiresAt, setWorkerTokenExpiresAt] = React.useState<number | undefined>(() => {
		const expiresAt = localStorage.getItem(tokenExpiryKey);
		return expiresAt ? parseInt(expiresAt, 10) : undefined;
	});
	const [showWorkerTokenModal, setShowWorkerTokenModal] = React.useState(false);

	// Listen for token updates
	React.useEffect(() => {
		const handleTokenUpdate = () => {
			const token = localStorage.getItem(tokenStorageKey) || '';
			const expiresAt = localStorage.getItem(tokenExpiryKey);
			setWorkerToken(token);
			setWorkerTokenExpiresAt(expiresAt ? parseInt(expiresAt, 10) : undefined);
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		window.addEventListener('workerTokenMetricsUpdated', handleTokenUpdate);

		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
			window.removeEventListener('workerTokenMetricsUpdated', handleTokenUpdate);
		};
	}, [tokenStorageKey, tokenExpiryKey]);

	const clearWorkerToken = () => {
		localStorage.removeItem(tokenStorageKey);
		localStorage.removeItem(tokenExpiryKey);
		setWorkerToken('');
		setWorkerTokenExpiresAt(undefined);
	};

	const handleModalContinue = () => {
		const token = localStorage.getItem(tokenStorageKey) || '';
		const expiresAt = localStorage.getItem(tokenExpiryKey);
		setWorkerToken(token);
		setWorkerTokenExpiresAt(expiresAt ? parseInt(expiresAt, 10) : undefined);
		setShowWorkerTokenModal(false);
	};

	return {
		workerToken,
		workerTokenExpiresAt,
		hasValidToken: !!workerToken && (!workerTokenExpiresAt || Date.now() < workerTokenExpiresAt),
		showWorkerTokenModal,
		setShowWorkerTokenModal,
		handleModalContinue,
		clearWorkerToken,
	};
};
