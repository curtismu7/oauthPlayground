/**
 * @file DeleteAllDevicesUtilityV8.tsx
 * @module v8/pages
 * @description Utility to delete all MFA devices for a user, with optional device type filtering
 * @version 8.0.0
 * @since 2025-01-07
 *
 * Features:
 * - Delete all devices for a user
 * - Filter by device type (SMS, EMAIL, FIDO2, TOTP, WHATSAPP, etc.)
 * - Worker token and username input
 * - Clear success/error messages
 * - Shows device count before deletion
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiKey, FiLoader, FiTrash2, FiX } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { StorageServiceV8 } from '@/v8/services/storageServiceV8';
import { uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🗑️ DELETE-DEVICES-V8]';

type DeviceType = 'ALL' | 'SMS' | 'EMAIL' | 'FIDO2' | 'TOTP' | 'WHATSAPP' | 'VOICE' | 'OATH';
type DeviceStatus =
	| 'ALL'
	| 'ACTIVE'
	| 'ACTIVATION_REQUIRED'
	| 'BLOCKED'
	| 'LOCKED'
	| 'PENDING'
	| 'SUSPENDED'
	| 'EXPIRED';

const DEVICE_TYPES: Array<{ value: DeviceType; label: string }> = [
	{ value: 'ALL', label: 'All Device Types' },
	{ value: 'SMS', label: 'SMS' },
	{ value: 'EMAIL', label: 'Email' },
	{ value: 'FIDO2', label: 'FIDO2 / Passkey' },
	{ value: 'TOTP', label: 'TOTP' },
	{ value: 'WHATSAPP', label: 'WhatsApp' },
	{ value: 'VOICE', label: 'Voice' },
	{ value: 'OATH', label: 'OATH Token' },
];

const DEVICE_STATUSES: Array<{ value: DeviceStatus; label: string }> = [
	{ value: 'ALL', label: 'All Statuses' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'ACTIVATION_REQUIRED', label: 'Activation Required' },
	{ value: 'BLOCKED', label: 'Blocked' },
	{ value: 'LOCKED', label: 'Locked' },
	{ value: 'PENDING', label: 'Pending' },
	{ value: 'SUSPENDED', label: 'Suspended' },
	{ value: 'EXPIRED', label: 'Expired' },
];

const PAGE_STORAGE_KEY = 'v8:delete-all-devices';
const PAGE_STORAGE_VERSION = 1;

interface DeleteAllDevicesPageState {
	environmentId: string;
	username: string;
	selectedDeviceType: DeviceType;
	selectedDeviceStatus: DeviceStatus;
}

export const DeleteAllDevicesUtilityV8: React.FC = () => {
	const location = useLocation();
	const locationState = location.state as {
		environmentId?: string;
		username?: string;
		deviceType?: DeviceType;
		deviceStatus?: DeviceStatus;
	} | null;

	const [environmentId, setEnvironmentId] = useState(() => {
		// Check location.state first (passed from TOTP flow)
		if (locationState?.environmentId) {
			return locationState.environmentId;
		}
		try {
			const stored = StorageServiceV8.load<DeleteAllDevicesPageState>(PAGE_STORAGE_KEY);
			if (stored?.environmentId) {
				return stored.environmentId;
			}
			const globalEnvId = EnvironmentIdServiceV8.getEnvironmentId();
			if (globalEnvId) {
				return globalEnvId;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load saved environment ID`, error);
		}
		return '';
	});
	const [username, setUsername] = useState(() => {
		// Check location.state first (passed from TOTP flow)
		if (locationState?.username) {
			return locationState.username;
		}
		try {
			const stored = StorageServiceV8.load<DeleteAllDevicesPageState>(PAGE_STORAGE_KEY);
			return stored?.username || '';
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load saved username`, error);
			return '';
		}
	});
	const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType>(() => {
		// Check location.state first (passed from TOTP flow)
		if (locationState?.deviceType && locationState.deviceType !== 'ALL') {
			return locationState.deviceType;
		}
		try {
			const stored = StorageServiceV8.load<DeleteAllDevicesPageState>(PAGE_STORAGE_KEY);
			if (stored?.selectedDeviceType) {
				return stored.selectedDeviceType;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load saved device type filter`, error);
		}
		return 'ALL';
	});
	const [selectedDeviceStatus, setSelectedDeviceStatus] = useState<DeviceStatus>(() => {
		// Check location.state first (passed from TOTP flow)
		if (locationState?.deviceStatus && locationState.deviceStatus !== 'ALL') {
			return locationState.deviceStatus;
		}
		try {
			const stored = StorageServiceV8.load<DeleteAllDevicesPageState>(PAGE_STORAGE_KEY);
			if (stored?.selectedDeviceStatus) {
				return stored.selectedDeviceStatus;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load saved device status filter`, error);
		}
		return 'ALL';
	});
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [devices, setDevices] = useState<Array<Record<string, unknown>>>([]);
	const [error, setError] = useState<string | null>(null);
	const [deletionResults, setDeletionResults] = useState<{
		success: number;
		failed: number;
		errors: Array<{ deviceId: string; error: string }>;
	} | null>(null);
	const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Get worker token status
	const [tokenStatus, setTokenStatus] = useState<any>({
		isValid: false,
		minutesRemaining: 0,
	});

	// Update token status periodically
	useEffect(() => {
		const updateTokenStatus = async () => {
			try {
				const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(status);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to check token status`, error);
				setTokenStatus({ isValid: false, minutesRemaining: 0 });
			}
		};

		updateTokenStatus();
		const interval = setInterval(updateTokenStatus, 30000); // Update every 30 seconds

		return () => clearInterval(interval);
	}, []);

	const selectedCount = devices.filter((device) =>
		selectedDeviceIds.has(device.id as string)
	).length;

	// Persist form state when it changes
	useEffect(() => {
		try {
			const state: DeleteAllDevicesPageState = {
				environmentId: environmentId.trim(),
				username: username.trim(),
				selectedDeviceType,
				selectedDeviceStatus,
			};

			StorageServiceV8.save(PAGE_STORAGE_KEY, state, PAGE_STORAGE_VERSION);

			if (state.environmentId) {
				EnvironmentIdServiceV8.saveEnvironmentId(state.environmentId);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save delete-all-devices state`, error);
		}
	}, [environmentId, username, selectedDeviceType, selectedDeviceStatus]);

	// Load devices for the user
	const handleLoadDevices = useCallback(async () => {
		if (!environmentId.trim() || !username.trim() || !tokenStatus.isValid) {
			setError('Please provide environment ID, username, and a valid worker token');
			return;
		}

		setIsLoading(true);
		setError(null);
		setDevices([]);
		setDeletionResults(null);

		try {
			const allDevices = await MFAServiceV8.getAllDevices({
				environmentId: environmentId.trim(),
				username: username.trim(),
			});

			// Filter by device type if not 'ALL'
			let filteredDevices = allDevices;
			if (selectedDeviceType !== 'ALL') {
				filteredDevices = filteredDevices.filter(
					(d) => (d.type as string)?.toUpperCase() === selectedDeviceType
				);
			}

			// Filter by device status if not 'ALL'
			if (selectedDeviceStatus !== 'ALL') {
				filteredDevices = filteredDevices.filter((d) => {
					const deviceStatus = (d.status as string)?.toUpperCase();
					return deviceStatus === selectedDeviceStatus.toUpperCase();
				});
			}

			setDevices(filteredDevices);
			setSelectedDeviceIds(new Set(filteredDevices.map((d) => d.id as string)));

			if (filteredDevices.length === 0) {
				if (allDevices.length === 0) {
					toastV8.info('No devices found for this user');
				} else {
					const typeFilter = selectedDeviceType !== 'ALL' ? ` ${selectedDeviceType}` : '';
					const statusFilter =
						selectedDeviceStatus !== 'ALL' ? ` with status ${selectedDeviceStatus}` : '';
					toastV8.info(`No${typeFilter} devices${statusFilter} found for this user`);
				}
			} else {
				const typeFilter = selectedDeviceType !== 'ALL' ? ` ${selectedDeviceType}` : '';
				const statusFilter =
					selectedDeviceStatus !== 'ALL' ? ` with status ${selectedDeviceStatus}` : '';
				toastV8.success(
					`Found ${filteredDevices.length}${typeFilter} device(s)${statusFilter} to delete`
				);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load devices';
			setError(errorMessage);
			toastV8.error(`Failed to load devices: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	}, [environmentId, username, selectedDeviceType, selectedDeviceStatus, tokenStatus.isValid]);

	const handleToggleDeviceSelection = useCallback((deviceId: string) => {
		setSelectedDeviceIds((prev) => {
			const next = new Set(prev);
			if (next.has(deviceId)) {
				next.delete(deviceId);
			} else {
				next.add(deviceId);
			}
			return next;
		});
	}, []);

	const handleSelectAll = useCallback(() => {
		setSelectedDeviceIds(new Set(devices.map((d) => d.id as string)));
	}, [devices]);

	const handleClearSelection = useCallback(() => {
		setSelectedDeviceIds(new Set());
	}, []);

	// Delete all devices
	const handleDeleteAll = useCallback(async () => {
		if (devices.length === 0) {
			toastV8.warning('No devices to delete');
			return;
		}

		const devicesToDelete = devices.filter((device) => selectedDeviceIds.has(device.id as string));

		if (devicesToDelete.length === 0) {
			toastV8.warning('No devices selected for deletion');
			return;
		}

		if (!environmentId.trim() || !username.trim() || !tokenStatus.isValid) {
			setError('Please provide environment ID, username, and a valid worker token');
			return;
		}

		// Confirm deletion using custom modal
		const confirmed = await uiNotificationServiceV8.confirm({
			message: `Are you sure you want to delete ${devicesToDelete.length} selected device(s)? This action cannot be undone.`,
			title: 'Confirm Device Deletion',
			severity: 'danger',
			confirmText: 'Delete',
			cancelText: 'Cancel',
		});
		if (!confirmed) {
			return;
		}

		setIsDeleting(true);
		setError(null);
		setDeletionResults(null);

		const results = {
			success: 0,
			failed: 0,
			errors: [] as Array<{ deviceId: string; error: string }>,
		};

		try {
			// Delete devices one by one
			for (const device of devicesToDelete) {
				const deviceId = device.id as string;
				const deviceType = device.type as string;
				const deviceNickname = (device.nickname || device.name || deviceType) as string;

				try {
					await MFAServiceV8.deleteDevice({
						environmentId: environmentId.trim(),
						username: username.trim(),
						deviceId,
					});
					results.success++;
					console.log(`${MODULE_TAG} ✅ Deleted device: ${deviceNickname} (${deviceType})`);
				} catch (deleteError) {
					results.failed++;
					const errorMessage = deleteError instanceof Error ? deleteError.message : 'Unknown error';
					results.errors.push({ deviceId, error: errorMessage });
					console.error(`${MODULE_TAG} ❌ Failed to delete device ${deviceNickname}:`, deleteError);
				}
			}

			setDeletionResults(results);

			// Show summary toast
			if (results.failed === 0) {
				toastV8.success(`Successfully deleted ${results.success} device(s)`);
			} else {
				toastV8.warning(
					`Deleted ${results.success} device(s), but ${results.failed} failed. Check details below.`
				);
			}

			// Reload devices to show updated list
			await handleLoadDevices();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to delete devices';
			setError(errorMessage);
			toastV8.error(`Failed to delete devices: ${errorMessage}`);
		} finally {
			setIsDeleting(false);
		}
	}, [devices, selectedDeviceIds, environmentId, username, tokenStatus.isValid, handleLoadDevices]);

	return (
		<div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
			{/* Header */}
			<div style={{ marginBottom: '32px' }}>
				<h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
					🗑️ Delete All Devices Utility
				</h1>
				<p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
					Delete all MFA devices for a user, with optional filtering by device type and status
				</p>
			</div>

			{/* Configuration Section */}
			<div
				style={{
					background: 'white',
					border: '1px solid #e5e7eb',
					borderRadius: '12px',
					padding: '24px',
					marginBottom: '24px',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				}}
			>
				<h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
					Configuration
				</h2>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
					{/* Environment ID */}
					<div>
						<label
							htmlFor="delete-devices-env-id"
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Environment ID *
						</label>
						<input
							id="delete-devices-env-id"
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="Enter environment ID"
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								fontFamily: 'monospace',
							}}
						/>
					</div>

					{/* Username */}
					<div>
						<label
							htmlFor="delete-devices-username"
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Username *
						</label>
						<input
							id="delete-devices-username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Enter username"
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
							}}
						/>
					</div>

					{/* Device Type Filter */}
					<div>
						<label
							htmlFor="delete-devices-type-filter"
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Device Type Filter
						</label>
						<select
							id="delete-devices-type-filter"
							value={selectedDeviceType}
							onChange={(e) => setSelectedDeviceType(e.target.value as DeviceType)}
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								background: 'white',
							}}
						>
							{DEVICE_TYPES.map((type) => (
								<option key={type.value} value={type.value}>
									{type.label}
								</option>
							))}
						</select>
					</div>

					{/* Device Status Filter */}
					<div>
						<label
							htmlFor="delete-devices-status-filter"
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Device Status Filter
						</label>
						<select
							id="delete-devices-status-filter"
							value={selectedDeviceStatus}
							onChange={(e) => setSelectedDeviceStatus(e.target.value as DeviceStatus)}
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								background: 'white',
							}}
						>
							{DEVICE_STATUSES.map((status) => (
								<option key={status.value} value={status.value}>
									{status.label}
								</option>
							))}
						</select>
					</div>

					{/* Worker Token Status */}
					<div
						style={{
							padding: '12px',
							background: tokenStatus.isValid ? '#ecfccb' : '#fef2f2',
							border: `1px solid ${tokenStatus.isValid ? '#bef264' : '#fecaca'}`,
							borderRadius: '6px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: '8px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							{tokenStatus.isValid ? (
								<FiCheckCircle style={{ color: '#16a34a', fontSize: '18px' }} />
							) : (
								<FiAlertCircle style={{ color: '#dc2626', fontSize: '18px' }} />
							)}
							<span style={{ fontSize: '14px', color: tokenStatus.isValid ? '#365314' : '#991b1b' }}>
								{tokenStatus.isValid
									? `Worker token is valid (${tokenStatus.minutesRemaining} minutes remaining)`
									: 'Worker token is missing or invalid. Please configure it first.'}
							</span>
						</div>
						<button
							type="button"
							onClick={() => setShowWorkerTokenModal(true)}
							style={{
								padding: '6px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '4px',
								background: 'white',
								color: '#374151',
								fontSize: '12px',
								fontWeight: '500',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
							}}
							title="Configure Worker Token"
						>
							<FiKey style={{ fontSize: '14px' }} />
							Configure Token
						</button>
					</div>

					{/* Load Devices Button */}
					<button
						type="button"
						onClick={handleLoadDevices}
						disabled={
							isLoading || !environmentId.trim() || !username.trim() || !tokenStatus.isValid
						}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '6px',
							background:
								isLoading || !environmentId.trim() || !username.trim() || !tokenStatus.isValid
									? '#9ca3af'
									: '#3b82f6',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor:
								isLoading || !environmentId.trim() || !username.trim() || !tokenStatus.isValid
									? 'not-allowed'
									: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
						}}
					>
						{isLoading ? (
							<>
								<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
								Loading Devices...
							</>
						) : (
							<>🔍 Load Devices</>
						)}
					</button>
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<div
					style={{
						padding: '16px',
						background: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '8px',
						marginBottom: '24px',
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
					}}
				>
					<FiAlertCircle style={{ color: '#dc2626', fontSize: '20px', flexShrink: 0 }} />
					<div style={{ flex: 1 }}>
						<strong style={{ color: '#991b1b', display: 'block', marginBottom: '4px' }}>
							Error
						</strong>
						<span style={{ color: '#991b1b' }}>{error}</span>
					</div>
					<button
						type="button"
						onClick={() => setError(null)}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#991b1b',
							padding: '4px',
						}}
					>
						<FiX />
					</button>
				</div>
			)}

			{/* Devices List */}
			{devices.length > 0 && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '20px',
							gap: '12px',
							flexWrap: 'wrap',
						}}
					>
						<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
							Devices to Delete ({devices.length} total, {selectedCount} selected)
						</h2>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
							<button
								type="button"
								onClick={handleSelectAll}
								style={{
									padding: '6px 10px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									background: '#f9fafb',
									fontSize: '12px',
									cursor: 'pointer',
								}}
							>
								Select All
							</button>
							<button
								type="button"
								onClick={handleClearSelection}
								style={{
									padding: '6px 10px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									background: '#f9fafb',
									fontSize: '12px',
									cursor: 'pointer',
								}}
							>
								Clear Selection
							</button>
							<button
								type="button"
								onClick={handleDeleteAll}
								disabled={isDeleting || devices.length === 0 || selectedCount === 0}
								style={{
									padding: '10px 20px',
									border: 'none',
									borderRadius: '6px',
									background:
										isDeleting || devices.length === 0 || selectedCount === 0
											? '#9ca3af'
											: '#ef4444',
									color: 'white',
									fontSize: '16px',
									fontWeight: '600',
									cursor:
										isDeleting || devices.length === 0 || selectedCount === 0
											? 'not-allowed'
											: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								{isDeleting ? (
									<>
										<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
										Deleting...
									</>
								) : (
									<>
										<FiTrash2 />
										Delete Selected ({selectedCount})
									</>
								)}
							</button>
						</div>
					</div>

					<div style={{ display: 'grid', gap: '12px' }}>
						{devices.map((device) => {
							const deviceId = device.id as string;
							const isSelected = selectedDeviceIds.has(deviceId);
							const label = (device.nickname || device.name || deviceId) as string;
							return (
								<div
									key={deviceId}
									style={{
										padding: '16px',
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
										borderRadius: '8px',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
										<input
											type="checkbox"
											checked={isSelected}
											onChange={() => handleToggleDeviceSelection(deviceId)}
											aria-label={`Select device ${label}`}
											style={{ marginTop: '2px' }}
										/>
										<div>
											<div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
												{device.type as string} - {label}
											</div>
											<div style={{ fontSize: '12px', color: '#6b7280' }}>
												ID: <code style={{ fontSize: '11px' }}>{deviceId}</code>
												{typeof device.status !== 'undefined' && (
													<span style={{ marginLeft: '12px' }}>
														Status: <strong>{device.status as string}</strong>
													</span>
												)}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Deletion Results */}
			{deletionResults && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<h2
						style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}
					>
						Deletion Results
					</h2>

					<div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
						<div
							style={{
								padding: '16px',
								background: '#ecfccb',
								border: '1px solid #bef264',
								borderRadius: '8px',
								flex: 1,
							}}
						>
							<div
								style={{
									fontSize: '24px',
									fontWeight: '700',
									color: '#16a34a',
									marginBottom: '4px',
								}}
							>
								{deletionResults.success}
							</div>
							<div style={{ fontSize: '14px', color: '#365314' }}>Successfully Deleted</div>
						</div>
						{deletionResults.failed > 0 && (
							<div
								style={{
									padding: '16px',
									background: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '8px',
									flex: 1,
								}}
							>
								<div
									style={{
										fontSize: '24px',
										fontWeight: '700',
										color: '#dc2626',
										marginBottom: '4px',
									}}
								>
									{deletionResults.failed}
								</div>
								<div style={{ fontSize: '14px', color: '#991b1b' }}>Failed</div>
							</div>
						)}
					</div>

					{deletionResults.errors.length > 0 && (
						<div>
							<h3
								style={{
									margin: '0 0 12px 0',
									fontSize: '16px',
									fontWeight: '600',
									color: '#1f2937',
								}}
							>
								Errors:
							</h3>
							<div style={{ display: 'grid', gap: '8px' }}>
								{deletionResults.errors.map((err, index) => (
									<div
										key={index}
										style={{
											padding: '12px',
											background: '#fef2f2',
											border: '1px solid #fecaca',
											borderRadius: '6px',
											fontSize: '13px',
										}}
									>
										<strong style={{ color: '#991b1b' }}>Device {err.deviceId}:</strong>{' '}
										<span style={{ color: '#991b1b' }}>{err.error}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Info Box */}
			<div
				style={{
					marginTop: '32px',
					padding: '16px',
					background: '#eff6ff',
					border: '1px solid #bfdbfe',
					borderRadius: '8px',
					fontSize: '14px',
					color: '#1e40af',
				}}
			>
				<strong>💡 Note:</strong> This utility uses the PingOne MFA API to delete devices. Make sure
				you have the appropriate permissions and that the worker token has the necessary scopes.
				Deleted devices cannot be recovered.
			</div>

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => {
						setShowWorkerTokenModal(false);
						// Update token status after modal closes
						setTimeout(async () => {
							try {
								const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
								setTokenStatus(status);
							} catch (error) {
								console.error(`${MODULE_TAG} Failed to check token status after modal`, error);
								setTokenStatus({ isValid: false, minutesRemaining: 0 });
							}
						}, 500);
					}}
				/>
			)}
		</div>
	);
};

export default DeleteAllDevicesUtilityV8;
