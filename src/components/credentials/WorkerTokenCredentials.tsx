/**
 * @file WorkerTokenCredentials.tsx
 * @description Unified, production-ready worker token component
 * Replaces scattered V8/V9 implementations with consolidated dashboard + modal
 * Features: token generation, management, history, status display, decode/encode tools
 */

import React, { useState } from 'react';
import { UnifiedWorkerTokenDashboard } from '../UnifiedWorkerTokenDashboard';
import { WorkerTokenGenerationModal } from '../WorkerTokenGenerationModal';
import { WorkerTokenStatusDisplay } from '../WorkerTokenStatusDisplay';

export type WorkerTokenGrantType = 'client_credentials' | 'authorization_code';

export interface WorkerTokenCredentialsProps {
	/** Orientation: modal, inline, or status displays */
	variant?: 'modal' | 'inline' | 'status-badge' | 'status-banner' | 'status-inline';
	/** Density: compact for embedding, full for standalone */
	size?: 'compact' | 'full';
	/** Modal state (modal variant) */
	isOpen?: boolean;
	onClose?: () => void;
	/** Backward compat props (no longer used) */
	environmentId?: string;
	grantType?: WorkerTokenGrantType;
	redirectUri?: string;
	onTokenGenerated?: (token: string) => void;
}

/**
 * Unified Worker Token Component
 *
 * Usage:
 * - Modal: <WorkerTokenCredentials variant="modal" isOpen={open} onClose={close} />
 * - Inline: <WorkerTokenCredentials variant="inline" />
 * - Status Badge: <WorkerTokenCredentials variant="status-badge" />
 * - Full Dashboard: <WorkerTokenCredentials variant="inline" size="full" />
 *
 * Features:
 * - Generate new tokens with configurable roles & scopes
 * - Live expiry countdown (updates every second)
 * - View token history (active, revoked, expired)
 * - Revoke tokens immediately
 * - Decode JWT tokens
 * - Encode payloads to JWT
 * - HTTP-only cookie storage (1 hour TTL)
 */
export const WorkerTokenCredentials: React.FC<WorkerTokenCredentialsProps> = ({
	variant = 'inline',
	size = 'full',
	isOpen = false,
	onClose,
	onTokenGenerated,
}) => {
	const [modalOpen, setModalOpen] = useState(isOpen);

	const handleModalOpen = () => setModalOpen(true);
	const handleModalClose = () => {
		setModalOpen(false);
		onClose?.();
	};

	// Modal variant
	if (variant === 'modal') {
		return <WorkerTokenGenerationModal isOpen={modalOpen} onClose={handleModalClose} onTokenGenerated={onTokenGenerated} />;
	}

	// Status badge variant
	if (variant === 'status-badge') {
		return <WorkerTokenStatusDisplay variant="badge" />;
	}

	// Status banner variant
	if (variant === 'status-banner') {
		return <WorkerTokenStatusDisplay variant="banner" />;
	}

	// Status inline variant
	if (variant === 'status-inline') {
		return <WorkerTokenStatusDisplay variant="inline" />;
	}

	// Inline/Dashboard variant (default)
	return (
		<div
			style={{
				padding: size === 'compact' ? '12px' : '20px',
				maxWidth: size === 'compact' ? '100%' : '1200px',
				margin: '0 auto',
			}}
		>
			{/* Status display at top */}
			<div style={{ marginBottom: '20px' }}>
				<WorkerTokenStatusDisplay variant="all" />
			</div>

			{/* Generate button */}
			<button
				onClick={handleModalOpen}
				style={{
					padding: size === 'compact' ? '6px 12px' : '8px 16px',
					background: '#3b82f6',
					color: 'white',
					border: 'none',
					borderRadius: '4px',
					cursor: 'pointer',
					fontSize: size === 'compact' ? '12px' : '13px',
					fontWeight: '500',
					marginBottom: '20px',
				}}
			>
				+ Generate New Token
			</button>

			{/* Modal */}
			<WorkerTokenGenerationModal isOpen={modalOpen} onClose={handleModalClose} onTokenGenerated={onTokenGenerated} />

			{/* Full dashboard (only in full size mode) */}
			{size === 'full' && <UnifiedWorkerTokenDashboard />}
		</div>
	);
};

/**
 * Backward compatibility exports for V8/V9 code
 */
export const WorkerTokenModal = WorkerTokenCredentials;
export const WorkerTokenSection = WorkerTokenCredentials;
