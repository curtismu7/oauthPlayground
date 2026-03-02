/**
 * @file WorkerTokenExpiryBannerV8.tsx
 * @description Proactive banner shown whenever the worker token is invalid,
 *   expired, or expiring soon. Self-contained — polls token status every 30s.
 *   Drop it anywhere that has worker-token functionality; pass onFixToken to open
 *   the token modal.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
	checkWorkerTokenStatusSync,
	type TokenStatusInfo,
} from '@/v8/services/workerTokenStatusServiceV8';

export interface WorkerTokenExpiryBannerV8Props {
	/** Called when the user clicks "Fix Token" — typically opens WorkerTokenModalV8 */
	onFixToken: () => void;
	/** Poll interval in ms. Default: 30 000 (30 s). */
	pollIntervalMs?: number;
	/** Extra margin-bottom. Default: '16px'. */
	marginBottom?: string;
}

export const WorkerTokenExpiryBannerV8: React.FC<WorkerTokenExpiryBannerV8Props> = ({
	onFixToken,
	pollIntervalMs = 30_000,
	marginBottom = '16px',
}) => {
	const [status, setStatus] = useState<TokenStatusInfo>(() => checkWorkerTokenStatusSync());
	const [dismissed, setDismissed] = useState(false);

	const refresh = useCallback(() => {
		const next = checkWorkerTokenStatusSync();
		setStatus(next);
		// Auto-un-dismiss if status changes (e.g. new token generated)
		if (next.status === 'valid') setDismissed(false);
	}, []);

	// Re-check on mount and on an interval
	useEffect(() => {
		refresh();
		const id = setInterval(refresh, pollIntervalMs);
		return () => clearInterval(id);
	}, [refresh, pollIntervalMs]);

	// Also listen for the global token-updated event fired after modal success
	useEffect(() => {
		window.addEventListener('workerTokenUpdated', refresh);
		return () => window.removeEventListener('workerTokenUpdated', refresh);
	}, [refresh]);

	// Don't show when token is valid or user dismissed during this session
	if (status.status === 'valid' || dismissed) return null;

	const isExpired = status.status === 'expired' || status.status === 'missing';
	const _isExpiringSoon = status.status === 'expiring-soon';

	const colors = isExpired
		? {
				bg: '#fef2f2',
				border: '#fca5a5',
				leftBorder: '#ef4444',
				dot: '#ef4444',
				titleColor: '#991b1b',
				subColor: '#b91c1c',
			}
		: {
				bg: '#fffbeb',
				border: '#fcd34d',
				leftBorder: '#f59e0b',
				dot: '#f59e0b',
				titleColor: '#92400e',
				subColor: '#b45309',
			};

	const title = isExpired
		? 'Worker Token Invalid — API calls will fail until you refresh it.'
		: `Worker Token Expiring Soon — API calls will fail until you refresh it.`;

	const subtitle = isExpired
		? 'Worker token is invalid or expired'
		: `Expires in ${status.minutesRemaining ?? 0} minute${(status.minutesRemaining ?? 0) !== 1 ? 's' : ''}`;

	return (
		<div
			role="alert"
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: '12px',
				padding: '12px 16px',
				background: colors.bg,
				border: `1px solid ${colors.border}`,
				borderLeft: `4px solid ${colors.leftBorder}`,
				borderRadius: '8px',
				marginBottom,
				flexWrap: 'wrap',
			}}
		>
			{/* Left: dot + text */}
			<div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
				<span
					aria-hidden
					style={{
						width: 12,
						height: 12,
						borderRadius: '50%',
						background: colors.dot,
						flexShrink: 0,
						marginTop: 3,
					}}
				/>
				<div style={{ minWidth: 0 }}>
					<div
						style={{
							fontWeight: 700,
							fontSize: '13px',
							color: colors.titleColor,
							lineHeight: 1.4,
						}}
					>
						{title}
					</div>
					<div
						style={{
							fontSize: '12px',
							color: colors.subColor,
							marginTop: 2,
						}}
					>
						{subtitle}
					</div>
				</div>
			</div>

			{/* Right: Fix Token + dismiss */}
			<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
				<button
					type="button"
					onClick={onFixToken}
					style={{
						padding: '7px 16px',
						background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer',
						fontWeight: 600,
						fontSize: '13px',
						display: 'flex',
						alignItems: 'center',
						gap: '6px',
						whiteSpace: 'nowrap',
						boxShadow: '0 1px 4px rgba(59,130,246,0.4)',
					}}
				>
					🔑 Fix Token
				</button>
				<button
					type="button"
					onClick={() => setDismissed(true)}
					title="Dismiss"
					style={{
						padding: '6px 10px',
						background: 'transparent',
						color: '#94a3b8',
						border: '1px solid #e2e8f0',
						borderRadius: '6px',
						cursor: 'pointer',
						fontSize: '14px',
						lineHeight: 1,
					}}
				>
					✕
				</button>
			</div>
		</div>
	);
};

export default WorkerTokenExpiryBannerV8;
