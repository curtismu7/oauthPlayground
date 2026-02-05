/**
 * @file UnifiedMFAV8.tsx
 * @module v8/flows
 * @description Unified MFA - Single route with tab-based navigation and state machine
 * @version 8.0.0
 * @since 2025-01-20
 *
 * Features:
 * - Single stable route (/v8/unified-mfa)
 * - Tab-based navigation (config | register | auth | docs | success)
 * - State machine driven UI
 * - Route lock during active flows
 * - Full journaling and persistence
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MFATabsV8 from '../dependencies/v8/components/UnifiedMFATabsV8.tsx';
import { unifiedLoggerV8 } from '../dependencies/v8/services/unifiedLoggerV8';
import { unifiedLogShipperV8 } from '../dependencies/v8/services/unifiedLogShipperV8';
import {
	type UnifiedMFAStateData,
	unifiedStateServiceV8,
} from '../dependencies/v8/services/unifiedStateServiceV8';
import { workerTokenServiceV8 } from '../dependencies/v8/services/workerTokenServiceV8';
import { toastV8 } from '../dependencies/v8/utils/toastNotificationsV8';

// biome-ignore lint/suspicious/noExplicitAny: Empty interface for self-contained component
type UnifiedMFAV8Props = Record<string, never>;

export const UnifiedMFAV8: React.FC<UnifiedMFAV8Props> = () => {
	const [searchParams] = useSearchParams();
	const [currentState, setCurrentState] = useState<UnifiedMFAStateData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [runId, setRunId] = useState<string | null>(null);
	const [isLocked, setIsLocked] = useState(false);

	// Get valid tabs for current state
	const getValidTabsForState = useCallback((state: UnifiedMFAStateData['state']): string[] => {
		switch (state) {
			case 'INIT':
				return ['config'];
			case 'CONFIG':
				return ['config', 'register', 'docs'];
			case 'DEVICE_DISCOVERY':
				return ['register', 'docs'];
			case 'AUTH_INIT':
			case 'AUTH_VERIFY':
				return ['register', 'docs'];
			case 'SUCCESS':
				return ['success', 'docs'];
			case 'ERROR':
				return ['config', 'docs'];
			default:
				return ['config', 'docs'];
		}
	}, []);

	// Generate runId on component mount
	useEffect(() => {
		const generateRunId = () => {
			const timestamp = Date.now();
			const random = Math.random().toString(36).substr(2, 8);
			return `run-${timestamp}-${random}`;
		};

		const newRunId = generateRunId();
		setRunId(newRunId);
		setIsLocked(true); // Lock route immediately

		return () => {
			// Cleanup on unmount
			if (newRunId) {
				unifiedLoggerV8.cleanup();
				unifiedStateServiceV8.clearState().catch(console.error);
				unifiedLogShipperV8.stop();
			}
		};
	}, []);

	// Initialize state machine when runId is available
	useEffect(() => {
		if (!runId) return;

		const initializeFlow = async () => {
			try {
				setIsLoading(true);

				// Initialize logger with runId
				await unifiedLoggerV8.initialize(runId);
				unifiedLoggerV8.setTransactionId('init');

				// Initialize log shipper
				await unifiedLogShipperV8.initialize();

				// Get environment ID from worker token service or URL params
				const envId = searchParams.get('envId') || 'default-env';

				// Initialize state machine
				const state = await unifiedStateServiceV8.initialize(runId, envId);
				setCurrentState(state);

				// Check if worker token is already available
				const workerToken = await workerTokenServiceV8.loadCredentials();
				if (workerToken) {
					// Transition to CONFIG state
					const configState = await unifiedStateServiceV8.processEvent('WORKER_TOKEN_LOADED', {
						workerToken: {
							token: workerToken.accessToken,
							expiresAt: workerToken.expiresAt || Date.now() + 3600000,
						},
					});
					setCurrentState(configState);
				}

				// Log client event
				await unifiedLoggerV8.logClientEvent({
					transactionId: state.transactionId,
					type: 'user_action',
					data: {
						action: 'flow_initialized',
						envId,
						hasWorkerToken: !!workerToken,
						tab: searchParams.get('tab') || 'config',
					},
				});
			} catch (error) {
				console.error('Failed to initialize Unified MFA:', error);
				toastV8.error('Failed to initialize MFA flow');

				// Log error
				await unifiedLoggerV8.logClientEvent({
					transactionId: 'init',
					type: 'error',
					data: {
						error: error instanceof Error ? error.message : String(error),
						phase: 'initialization',
					},
				});
			} finally {
				setIsLoading(false);
			}
		};

		initializeFlow();
	}, [runId, searchParams]);

	// Subscribe to state changes
	useEffect(() => {
		if (!runId) return;

		const unsubscribe = unifiedStateServiceV8.onStateChange((newState) => {
			setCurrentState(newState);

			// Log state change
			unifiedLoggerV8.logClientEvent({
				transactionId: newState.transactionId,
				type: 'ui_event',
				data: {
					event: 'state_updated',
					newState: newState.state,
					timestamp: Date.now(),
				},
			});
		});

		return unsubscribe;
	}, [runId]);

	// Handle tab changes (without navigation)
	const handleTabChange = useCallback(
		async (tab: string) => {
			if (!currentState || !runId) return;

			// Validate tab change based on current state
			const validTabs = getValidTabsForState(currentState.state);
			if (!validTabs.includes(tab)) {
				toastV8.warning(`Cannot switch to ${tab} in current state: ${currentState.state}`);
				return;
			}

			// Update URL query param without navigation
			const url = new URL(window.location.href);
			url.searchParams.set('tab', tab);
			window.history.replaceState({}, '', url.toString());

			// Log tab change
			await unifiedLoggerV8.logClientEvent({
				transactionId: currentState.transactionId,
				type: 'user_action',
				data: {
					action: 'tab_changed',
					from: searchParams.get('tab') || 'config',
					to: tab,
					state: currentState.state,
				},
			});
		},
		[currentState, runId, searchParams, getValidTabsForState]
	);

	// Handle flow cancellation
	const handleCancel = useCallback(async () => {
		if (!currentState || !runId) return;

		try {
			// Transition to ERROR state for cancellation
			await unifiedStateServiceV8.processEvent('CANCEL', {
				error: {
					code: 'USER_CANCELLED',
					message: 'User cancelled the MFA flow',
					retryable: true,
				},
			});

			// Unlock route
			setIsLocked(false);

			toastV8.info('MFA flow cancelled');

			// Log cancellation
			await unifiedLoggerV8.logClientEvent({
				transactionId: currentState.transactionId,
				type: 'user_action',
				data: {
					action: 'flow_cancelled',
					state: currentState.state,
				},
			});
		} catch (error) {
			console.error('Failed to cancel flow:', error);
			toastV8.error('Failed to cancel flow');
		}
	}, [currentState, runId]);

	// Handle flow reset
	const handleReset = useCallback(async () => {
		if (!runId) return;

		try {
			// Clear current state and reinitialize
			await unifiedStateServiceV8.clearState();

			const envId = searchParams.get('envId') || 'default-env';
			const newState = await unifiedStateServiceV8.initialize(runId, envId);
			setCurrentState(newState);

			toastV8.info('MFA flow reset');

			// Log reset
			await unifiedLoggerV8.logClientEvent({
				transactionId: newState.transactionId,
				type: 'user_action',
				data: {
					action: 'flow_reset',
					envId,
				},
			});
		} catch (error) {
			console.error('Failed to reset flow:', error);
			toastV8.error('Failed to reset flow');
		}
	}, [runId, searchParams]);

	// Prevent navigation when locked
	useEffect(() => {
		if (!isLocked) return;

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (currentState && currentState.state !== 'SUCCESS' && currentState.state !== 'ERROR') {
				e.preventDefault();
				e.returnValue = 'MFA flow is in progress. Are you sure you want to leave?';
				return e.returnValue;
			}
		};

		const handlePopState = (e: PopStateEvent) => {
			if (isLocked) {
				e.preventDefault();
				window.history.pushState(null, '', window.location.href);
				toastV8.warning('Navigation is locked during active MFA flow');
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('popstate', handlePopState);
		};
	}, [isLocked, currentState]);

	// Loading state
	if (isLoading) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '400px',
					flexDirection: 'column',
					gap: '16px',
				}}
			>
				<div style={{ fontSize: '18px', fontWeight: '500' }}>Initializing Unified MFA...</div>
				{runId && (
					<div style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
						runId: {runId}
					</div>
				)}
			</div>
		);
	}

	// Error state
	if (!currentState) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '400px',
					flexDirection: 'column',
					gap: '16px',
				}}
			>
				<div style={{ fontSize: '18px', color: '#ef4444' }}>Failed to initialize MFA flow</div>
				<button
					type="button"
					onClick={handleReset}
					style={{
						padding: '8px 16px',
						backgroundColor: '#3b82f6',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Retry
				</button>
			</div>
		);
	}

	// Main component
	return (
		<div
			style={{
				maxWidth: '1200px',
				margin: '0 auto',
				padding: '20px',
				fontFamily: 'system-ui, -apple-system, sans-serif',
			}}
		>
			{/* Header with runId and status */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '24px',
					padding: '16px',
					backgroundColor: '#f8fafc',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
				}}
			>
				<div>
					<h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Unified MFA</h1>
					<div
						style={{
							fontSize: '12px',
							color: '#64748b',
							fontFamily: 'monospace',
							marginTop: '4px',
						}}
					>
						runId: {runId} | state: {currentState.state} | txn: {currentState.transactionId}
					</div>
				</div>

				<div style={{ display: 'flex', gap: '8px' }}>
					{isLocked && (
						<button
							type="button"
							onClick={handleCancel}
							style={{
								padding: '8px 16px',
								backgroundColor: '#ef4444',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '14px',
							}}
						>
							Cancel Flow
						</button>
					)}

					<button
						onClick={handleReset}
						style={{
							padding: '8px 16px',
							backgroundColor: '#6b7280',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '14px',
						}}
					>
						Reset
					</button>
				</div>
			</div>

			{/* Tab-based navigation */}
			<MFATabsV8
				currentState={currentState}
				runId={runId}
				onTabChange={handleTabChange}
				onCancel={handleCancel}
				onReset={handleReset}
			/>
		</div>
	);
};

export default UnifiedMFAV8;
