// src/components/WorkerTokenStatusLabel.tsx
// Displays current worker token status and time remaining before expiration.

import React from 'react';
import styled from 'styled-components';
import { formatTimeRemaining } from '../services/tokenExpirationService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';

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

const STATUS_EVENTS = [
	'workerTokenUpdated',
	'workerTokenMetricsUpdated',
	'workerTokenAuditUpdated',
] as const;

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
	const [tokenState, setTokenState] = React.useState<{
		tokenValue: string;
		expiresAtValue: number | undefined;
	}>({ tokenValue: '', expiresAtValue: undefined });

	// Load token state from global service
	React.useEffect(() => {
		const loadTokenState = async () => {
			// Use props if provided (for backwards compatibility)
			if (token || expiresAt) {
				setTokenState({
					tokenValue: token ?? '',
					expiresAtValue: typeof expiresAt === 'number' ? expiresAt : undefined,
				});
				return;
			}

			// Otherwise, load from global service
			try {
				const tokenValue = await unifiedWorkerTokenService.getToken();
				// Get expiration from service - need to check stored data
				const credentials = await unifiedWorkerTokenService.loadCredentials();
				if (credentials && tokenValue) {
					// Try to get expiration from browser storage (unified service stores it there)
					try {
						const stored = localStorage.getItem('unified_worker_token');
						if (stored) {
							const data = JSON.parse(stored);
							setTokenState({
								tokenValue: tokenValue,
								expiresAtValue: data.expiresAt,
							});
						} else {
							setTokenState({
								tokenValue: tokenValue,
								expiresAtValue: undefined,
							});
						}
					} catch {
						setTokenState({
							tokenValue: tokenValue,
							expiresAtValue: undefined,
						});
					}
				} else {
					setTokenState({ tokenValue: '', expiresAtValue: undefined });
				}
			} catch (error) {
				console.error('[WorkerTokenStatusLabel] Failed to load token state:', error);
				setTokenState({ tokenValue: '', expiresAtValue: undefined });
			}
		};

		loadTokenState();

		// Set up interval to check token state periodically
		const intervalId = setInterval(loadTokenState, 30000); // Check every 30 seconds

		// Listen for storage events
		const handleStorageChange = () => {
			loadTokenState();
		};
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);

		return () => {
			clearInterval(intervalId);
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
		};
	}, [token, expiresAt]);

	const computeStatus = React.useCallback((): { text: string; variant: StatusVariant } => {
		const { tokenValue, expiresAtValue } = tokenState;

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
		const variant: StatusVariant =
			diffMinutes <= 5 ? 'danger' : diffMinutes <= 15 ? 'warning' : 'success';
		const expiresAtTime = new Date(expiresAtValue).toLocaleString();

		return {
			text: `Worker token valid — ${timeLabel} (expires ${expiresAtTime})`,
			variant,
		};
	}, [tokenState]);

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
