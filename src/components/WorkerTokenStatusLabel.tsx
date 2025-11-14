// src/components/WorkerTokenStatusLabel.tsx
// Displays current worker token status and time remaining before expiration.

import React from 'react';
import styled from 'styled-components';
import { formatTimeRemaining } from '../services/tokenExpirationService';

type StatusVariant = 'success' | 'warning' | 'danger';

const StatusText = styled.span<{ $variant: StatusVariant }>`
	font-size: 0.75rem;
	font-weight: 500;
	color: ${({ $variant }) => {
		if ($variant === 'success') return '#047857';
		if ($variant === 'warning') return '#b45309';
		return '#b91c1c';
	}};
`;

const STATUS_EVENTS = ['workerTokenUpdated', 'workerTokenMetricsUpdated', 'workerTokenAuditUpdated'] as const;

export interface WorkerTokenStatusLabelProps {
	token?: string | null | undefined;
	expiresAt?: number | null;
	tokenStorageKey?: string;
	tokenExpiryKey?: string;
	align?: 'flex-start' | 'center' | 'flex-end';
}

export const WorkerTokenStatusLabel: React.FC<WorkerTokenStatusLabelProps> = ({
	token,
	expiresAt,
	tokenStorageKey,
	tokenExpiryKey,
	align = 'flex-start',
}) => {
	const readTokenState = React.useCallback(() => {
		let resolvedToken = token ?? '';
		let resolvedExpiry = typeof expiresAt === 'number' ? expiresAt : undefined;

		if (!token && tokenStorageKey) {
			resolvedToken = localStorage.getItem(tokenStorageKey) ?? '';
		}

		if (typeof expiresAt !== 'number' && tokenExpiryKey) {
			const storedExpiry = localStorage.getItem(tokenExpiryKey);
			if (storedExpiry) {
				const parsed = Number.parseInt(storedExpiry, 10);
				if (!Number.isNaN(parsed)) {
					resolvedExpiry = parsed;
				}
			}
		}

		return { tokenValue: resolvedToken, expiresAtValue: resolvedExpiry };
	}, [token, expiresAt, tokenStorageKey, tokenExpiryKey]);

	const computeStatus = React.useCallback((): { text: string; variant: StatusVariant } => {
		const { tokenValue, expiresAtValue } = readTokenState();

		if (!tokenValue) {
			return {
				text: 'No worker token saved. Generate one to continue.',
				variant: 'danger',
			};
		}

		if (!expiresAtValue) {
			return {
				text: 'Worker token present. Expiration unknown — consider generating a fresh token.',
				variant: 'warning',
			};
		}

		const now = Date.now();
		if (expiresAtValue <= now) {
			return {
				text: 'Worker token expired. Generate a new token.',
				variant: 'danger',
			};
		}

		const diffMinutes = Math.floor((expiresAtValue - now) / 60000);
		const timeLabel = formatTimeRemaining(expiresAtValue);
		const variant: StatusVariant = diffMinutes <= 5 ? 'danger' : diffMinutes <= 15 ? 'warning' : 'success';
		const expiresAtTime = new Date(expiresAtValue).toLocaleString();

		return {
			text: `Worker token valid — ${timeLabel} (expires ${expiresAtTime})`,
			variant,
		};
	}, [readTokenState]);

	const [status, setStatus] = React.useState(computeStatus);

	React.useEffect(() => {
		setStatus(computeStatus());
	}, [computeStatus]);

	React.useEffect(() => {
		const intervalId = window.setInterval(() => {
			setStatus(computeStatus());
		}, 60000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [computeStatus]);

	React.useEffect(() => {
		const handleUpdate = () => setStatus(computeStatus());
		const events = STATUS_EVENTS;

		events.forEach((event) => window.addEventListener(event, handleUpdate));
		window.addEventListener('storage', handleUpdate);

		return () => {
			events.forEach((event) => window.removeEventListener(event, handleUpdate));
			window.removeEventListener('storage', handleUpdate);
		};
	}, [computeStatus]);

	return (
		<StatusText $variant={status.variant} style={{ alignSelf: align }}>
			{status.text}
		</StatusText>
	);
};

export default WorkerTokenStatusLabel;


