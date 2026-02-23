/**
 * @file AppPickerV8.tsx
 * @module v8/components
 * @description App picker component for selecting discovered PingOne applications
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useEffect, useState } from 'react';
import { AppDiscoveryServiceV8 } from '@/v8/services/appDiscoveryServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { ConfirmModalV8 } from './ConfirmModalV8';
import { WorkerTokenModalV8 } from './WorkerTokenModalV8';

const MODULE_TAG = '[🎯 APP-PICKER-V8]';

export interface DiscoveredApp {
	id: string;
	name: string;
	description?: string;
	enabled?: boolean;
	redirectUris?: string[];
	logoutUris?: string[];
}

interface AppPickerV8Props {
	environmentId: string;
	onAppSelected: (app: DiscoveredApp) => void;
}

export const AppPickerV8: React.FC<AppPickerV8Props> = ({ environmentId, onAppSelected }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [apps, setApps] = useState<DiscoveredApp[]>([]);
	const [showResults, setShowResults] = useState(false);
	const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync()
	);

	// Check token status on mount and periodically
	useEffect(() => {
		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
			console.log(`${MODULE_TAG} Token status check:`, status);
			setTokenStatus(status);
		};

		checkStatus();

		// Check every minute
		const interval = setInterval(checkStatus, 60000);

		// Listen for storage events (token updates)
		const handleStorageChange = () => {
			console.log(`${MODULE_TAG} Storage/token updated event received`);
			checkStatus();
		};
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
		};
	}, []);

	const handleManageWorkerToken = async () => {
		if (tokenStatus.isValid) {
			// Show confirmation modal instead of system confirm
			setShowConfirmModal(true);
		} else {
			// User explicitly clicked the button - always show modal
			// Use helper to check silentApiRetrieval before showing modal
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
			await handleShowWorkerTokenModal(
				setShowWorkerTokenModal,
				setTokenStatus,
				undefined, // Use default silentApiRetrieval from config
				undefined, // Use default showTokenAtEnd from config
				true // Force show modal - user clicked button
			);
		}
	};

	const handleConfirmRemoveToken = async () => {
		// Clear token using global service
		await workerTokenServiceV8.clearToken();
		window.dispatchEvent(new Event('workerTokenUpdated'));
		const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
		setTokenStatus(newStatus);
		setShowConfirmModal(false);
		toastV8.success('Worker token removed');
	};

	const handleWorkerTokenGenerated = () => {
		// Dispatch custom event for status update
		window.dispatchEvent(new Event('workerTokenUpdated'));
		const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
		setTokenStatus(newStatus);
		toastV8.success('Worker token generated and saved!');
	};

	const handleDiscover = async () => {
		console.log(`${MODULE_TAG} Discover clicked`, {
			environmentId: environmentId?.substring(0, 20),
			tokenStatus: tokenStatus.status,
			isValid: tokenStatus.isValid,
		});

		if (!environmentId.trim()) {
			toastV8.error('Please enter an Environment ID first');
			return;
		}

		// Check token status
		if (!tokenStatus.isValid) {
			console.log(`${MODULE_TAG} Token not valid, showing error`);
			toastV8.error(tokenStatus.message);
			return;
		}

		setIsLoading(true);
		try {
			console.log(`${MODULE_TAG} Discovering apps`, { environmentId });

			// Get worker token directly from global service
			const workerToken = await workerTokenServiceV8.getToken();
			if (!workerToken) {
				toastV8.error('Worker token required - please generate one first');
				setIsLoading(false);
				return;
			}

			// Discover applications using the worker token
			const discovered = await AppDiscoveryServiceV8.discoverApplications(
				environmentId,
				workerToken
			);

			if (discovered && discovered.length > 0) {
				console.log(`${MODULE_TAG} Found ${discovered.length} apps`, discovered);
				setApps(discovered);
				setShowResults(true);
				toastV8.success(`Found ${discovered.length} application(s)`);
			} else {
				toastV8.error('No applications found in this environment');
				setApps([]);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Discovery error`, error);
			toastV8.error(
				error instanceof Error
					? error.message
					: 'Failed to discover applications - check worker token'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectApp = (app: DiscoveredApp) => {
		console.log(`${MODULE_TAG} App selected`, { appId: app.id, appName: app.name });
		onAppSelected(app);
		setShowResults(false);
		setApps([]);
		setSelectedAppId(null);
		toastV8.success(`Selected: ${app.name}`);
	};

	// Debug: Log button state
	console.log(`${MODULE_TAG} Render - Button state:`, {
		isLoading,
		hasEnvironmentId: !!(environmentId && environmentId.trim()),
		tokenStatus: tokenStatus.status,
		tokenIsValid: tokenStatus.isValid,
		buttonDisabled: isLoading || !(environmentId && environmentId.trim()) || !tokenStatus.isValid,
	});

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
			{/* Action Buttons */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'stretch' }}>
					{/* Discover Button */}
					<button
						type="button"
						onClick={handleDiscover}
						disabled={isLoading || !environmentId.trim() || !tokenStatus.isValid}
						className="discover-button"
						style={{
							flex: 1,
							minWidth: '200px',
							padding: '10px 16px',
							background:
								isLoading || !environmentId.trim() || !tokenStatus.isValid ? '#9ca3af' : '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							fontSize: '14px',
							fontWeight: '600',
							cursor:
								isLoading || !environmentId.trim() || !tokenStatus.isValid
									? 'not-allowed'
									: 'pointer',
							transition: 'background 0.2s ease',
						}}
					>
						{isLoading ? '🔄 Discovering...' : '🔍 Discover Apps'}
					</button>
					<style>{`
						.discover-button:not(:disabled):hover {
							background: #2563eb !important;
						}
					`}</style>

					{/* Worker Token Button */}
					<button
						type="button"
						onClick={handleManageWorkerToken}
						className="token-button"
						style={{
							padding: '10px 16px',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'background 0.2s ease',
							whiteSpace: 'nowrap',
						}}
						title={
							tokenStatus.isValid
								? 'Worker token is stored - click to manage'
								: 'No worker token - click to add'
						}
					>
						{tokenStatus.isValid ? '🔑 Manage Token' : '🔑 Add Token'}
					</button>
					<style>{`
						.token-button:hover {
							background: #2563eb !important;
						}
					`}</style>
				</div>

				{/* Token Status Display */}
				<div
					style={{
						padding: '8px 12px',
						background:
							tokenStatus.status === 'valid'
								? '#d1fae5'
								: tokenStatus.status === 'expiring-soon'
									? '#fef3c7'
									: '#fee2e2',
						border: `1px solid ${WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status)}`,
						borderRadius: '4px',
						fontSize: '12px',
						color:
							tokenStatus.status === 'valid'
								? '#065f46'
								: tokenStatus.status === 'expiring-soon'
									? '#92400e'
									: '#991b1b',
						display: 'flex',
						alignItems: 'center',
						gap: '6px',
					}}
				>
					<span>{WorkerTokenStatusServiceV8.getStatusIcon(tokenStatus.status)}</span>
					<span>{tokenStatus.message}</span>
				</div>
			</div>

			{/* Results Dropdown */}
			{showResults && apps.length > 0 && (
				<div
					style={{
						border: '1px solid #d1d5db',
						borderRadius: '4px',
						background: 'white',
						maxHeight: '300px',
						overflow: 'auto',
						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
					}}
				>
					{apps.map((app) => (
						<div
							role="button"
							tabIndex={0}
							key={app.id}
							onClick={() => handleSelectApp(app)}
							style={{
								padding: '12px 16px',
								borderBottom: '1px solid #e5e7eb',
								cursor: 'pointer',
								background: selectedAppId === app.id ? '#eff6ff' : 'white',
								transition: 'background 0.2s ease',
							}}
							onMouseEnter={(e) => {
								if (selectedAppId !== app.id) {
									e.currentTarget.style.background = '#f9fafb';
								}
							}}
							onMouseLeave={(e) => {
								if (selectedAppId !== app.id) {
									e.currentTarget.style.background = 'white';
								}
							}}
						>
							<div
								style={{
									fontWeight: '600',
									fontSize: '13px',
									color: '#1f2937',
									marginBottom: '4px',
								}}
							>
								{app.name}
							</div>
							{app.description && (
								<div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
									{app.description}
								</div>
							)}
							<div style={{ fontSize: '11px', color: '#999' }}>ID: {app.id}</div>
							{app.redirectUris && app.redirectUris.length > 0 && (
								<div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
									Redirect URIs: {app.redirectUris.length}
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* No Results Message */}
			{showResults && apps.length === 0 && (
				<div
					style={{
						padding: '12px 16px',
						background: '#fef3c7',
						borderRadius: '4px',
						border: '1px solid #fcd34d',
						fontSize: '13px',
						color: '#92400e',
					}}
				>
					No applications found. Make sure you have a valid Environment ID and worker token.
				</div>
			)}

			{/* Worker Token Modal */}
			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={handleWorkerTokenGenerated}
				environmentId={environmentId}
			/>

			{/* Confirm Remove Token Modal */}
			<ConfirmModalV8
				isOpen={showConfirmModal}
				title="Remove Worker Token"
				message="Worker token is currently stored.\n\nAre you sure you want to remove it?"
				confirmText="Remove"
				cancelText="Cancel"
				variant="warning"
				onConfirm={handleConfirmRemoveToken}
				onCancel={() => setShowConfirmModal(false)}
			/>
		</div>
	);
};

export default AppPickerV8;
