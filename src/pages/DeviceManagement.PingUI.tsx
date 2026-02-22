/**
 * @file DeviceManagement.PingUI.tsx
 * @module pages
 * @description Comprehensive device management page with individual and bulk operations
 * @version 9.13.0-PingUI
 * @since 2026-02-22
 *
 * Features:
 * - View all MFA devices with filtering options
 * - Individual device operations (delete, activate, deactivate, rename)
 * - Bulk operations (delete all devices by type/status)
 * - Device usage statistics and recommendations
 * - PingOne UI styling and components
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toastV8 } from '../v8/utils/toastNotificationsV8';
import { EnvironmentIdServiceV8 } from '../v8/services/environmentIdServiceV8';
import { MFAServiceV8 } from '../apps/mfa/services/mfaServiceV8';
import { DeviceManagementService } from '../services/deviceManagementService';
import { workerTokenServiceV8 } from '../v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '../v8/services/workerTokenStatusServiceV8';
import { StorageServiceV8 } from '../v8/services/storageServiceV8';

// MDI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	ariaLabel?: string;
	ariaHidden?: boolean;
}> = ({ icon, size = 20, className = '', style, ariaLabel, ariaHidden = false }) => {
	const iconClass = `mdi mdi-${icon} ${className}`.trim();
	return (
		<i
			className={iconClass}
			style={{ fontSize: `${size}px`, ...style }}
			title={ariaLabel}
			aria-hidden={!ariaLabel}
		/>
	);
};

interface Device {
	id: string;
	type: string;
	status: string;
	name?: string;
	createdAt: string;
	lastUsed?: string;
}

interface DeleteAllDevicesOptions {
	deviceType: string;
	status: string;
	confirmation: boolean;
}

const DeviceManagement: React.FC = () => {
	const navigate = useNavigate();
	const [devices, setDevices] = useState<Device[]>([]);
	const [loading, setLoading] = useState(true);
	const [workerToken, setWorkerToken] = useState<string>('');
	const [username, setUsername] = useState<string>('');
	const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
	const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
	const [deleteAllOptions, setDeleteAllOptions] = useState<DeleteAllDevicesOptions>({
		deviceType: 'ALL',
		status: 'ALL',
		confirmation: true,
	});
	const [isDeleting, setIsDeleting] = useState(false);
	const [environmentId, setEnvironmentId] = useState<string>('');

	// Load initial data
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				setLoading(true);
				
				// Load environment ID
				const envId = EnvironmentIdServiceV8.getEnvironmentId();
				if (envId) {
					setEnvironmentId(envId);
				}

				// Load worker token
				const token = workerTokenServiceV8.getWorkerToken();
				if (token) {
					setWorkerToken(token);
				}

				// Load username from storage
				const storedUsername = StorageServiceV8.get('device-management-username');
				if (storedUsername) {
					setUsername(storedUsername);
				}

				// Load devices if we have credentials
				if (token && storedUsername) {
					await loadDevices(token, storedUsername);
				}
			} catch (error) {
				console.error('Failed to load initial data:', error);
				toastV8.error('Failed to load device management data');
			} finally {
				setLoading(false);
			}
		};

		loadInitialData();
	}, []);

	// Load devices from API
	const loadDevices = useCallback(async (token: string, user: string) => {
		try {
			const deviceList = await MFAServiceV8.getRegisteredDevices({
				environmentId,
				workerToken: token,
				username: user,
			});
			
			// Transform devices to our interface
			const transformedDevices: Device[] = deviceList.map((device: any) => ({
				id: device.id,
				type: device.type,
				status: device.status,
				name: device.name || device.displayName || `${device.type} Device`,
				createdAt: device.createdAt || new Date().toISOString(),
				lastUsed: device.lastUsed,
			}));
			
			setDevices(transformedDevices);
		} catch (error) {
			console.error('Failed to load devices:', error);
			toastV8.error('Failed to load devices');
			setDevices([]);
		}
	}, [environmentId]);

	// Handle device selection
	const handleDeviceSelection = useCallback((deviceId: string, selected: boolean) => {
		setSelectedDevices((prev) => {
			const newSet = new Set(prev);
			if (selected) {
				newSet.add(deviceId);
			} else {
				newSet.delete(deviceId);
			}
			return newSet;
		});
	}, []);

	// Handle select all devices
	const handleSelectAll = useCallback(() => {
		if (selectedDevices.size === devices.length) {
			setSelectedDevices(new Set());
		} else {
			setSelectedDevices(new Set(devices.map((d) => d.id)));
		}
	}, [devices, selectedDevices.size]);

	// Handle individual device deletion
	const handleDeleteDevice = useCallback(async (deviceId: string) => {
		if (!workerToken || !username) {
			toastV8.error('Worker token and username are required');
			return;
		}

		try {
			setLoading(true);
			
			const result = await DeviceManagementService.deleteDevice(
				{
					environmentId,
					workerToken,
					username,
				},
				deviceId
			);

			if (result.success) {
				toastV8.success('Device deleted successfully');
				await loadDevices(workerToken, username);
			} else {
				toastV8.error(result.error || 'Failed to delete device');
			}
		} catch (error) {
			console.error('Failed to delete device:', error);
			toastV8.error('Failed to delete device');
		} finally {
			setLoading(false);
		}
	}, [workerToken, username, environmentId, loadDevices]);

	// Handle delete all devices
	const handleDeleteAllDevices = useCallback(async () => {
		if (!workerToken || !username) {
			toastV8.error('Worker token and username are required');
			return;
		}

		try {
			setIsDeleting(true);
			
			const result = await DeviceManagementService.deleteAllDevices(
				{
					environmentId,
					workerToken,
					username,
				},
				{
					deviceType: deleteAllOptions.deviceType === 'ALL' ? undefined : deleteAllOptions.deviceType,
					status: deleteAllOptions.status === 'ALL' ? undefined : deleteAllOptions.status,
					confirmBeforeDelete: false, // Already confirmed via modal
				}
			);

			if (result.success) {
				toastV8.success(`Successfully deleted ${result.deletedCount} devices`);
				await loadDevices(workerToken, username);
				setSelectedDevices(new Set());
				setShowDeleteAllModal(false);
			} else {
				toastV8.error(result.error || 'Failed to delete devices');
			}
		} catch (error) {
			console.error('Failed to delete all devices:', error);
			toastV8.error('Failed to delete all devices');
		} finally {
			setIsDeleting(false);
		}
	}, [workerToken, username, environmentId, deleteAllOptions, loadDevices]);

	// Get device statistics
	const deviceStats = useMemo(() => {
		const total = devices.length;
		const byType = devices.reduce((acc, device) => {
			acc[device.type] = (acc[device.type] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		const byStatus = devices.reduce((acc, device) => {
			acc[device.status] = (acc[device.status] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		return { total, byType, byStatus };
	}, [devices]);

	// Get filtered devices for delete all operation
	const getFilteredDevicesForDeletion = useCallback(() => {
		let filtered = devices;
		
		if (deleteAllOptions.deviceType !== 'ALL') {
			filtered = filtered.filter((d) => d.type === deleteAllOptions.deviceType);
		}
		
		if (deleteAllOptions.status !== 'ALL') {
			filtered = filtered.filter((d) => d.status === deleteAllOptions.status);
		}
		
		return filtered;
	}, [devices, deleteAllOptions]);

	// Style functions
	const getContainerStyle = () => ({
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '2rem',
	});

	const getHeaderStyle = () => ({
		marginBottom: '2rem',
		textAlign: 'center',
	});

	const getTitleStyle = () => ({
		fontSize: '2rem',
		fontWeight: '700',
		color: 'var(--brand-text, #1f2937)',
		marginBottom: '0.5rem',
	});

	const getCardStyle = () => ({
		background: 'var(--brand-surface, white)',
		borderRadius: 'var(--brand-radius-lg, 0.75rem)',
		padding: '1.5rem',
		boxShadow: 'var(--brand-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1))',
		border: '1px solid var(--brand-border, #e5e7eb)',
		marginBottom: '1.5rem',
	});

	const getButtonStyle = (variant: 'primary' | 'danger' | 'secondary' = 'primary') => {
		const baseStyle = {
			padding: '0.75rem 1.5rem',
			borderRadius: 'var(--brand-radius-md, 0.5rem)',
			fontWeight: '500',
			cursor: 'pointer',
			border: 'none',
			transition: 'all 0.15s ease-in-out',
		};

		switch (variant) {
			case 'primary':
				return {
					...baseStyle,
					background: 'var(--brand-primary, #3b82f6)',
					color: 'white',
				};
			case 'danger':
				return {
					...baseStyle,
					background: 'var(--brand-error, #ef4444)',
					color: 'white',
				};
			default:
				return {
					...baseStyle,
					background: 'var(--brand-secondary, #6b7280)',
					color: 'white',
				};
		}
	};

	const getTableStyle = () => ({
		width: '100%',
		borderCollapse: 'collapse',
		marginTop: '1rem',
	});

	const getTableHeaderStyle = () => ({
		background: 'var(--brand-surface-secondary, #f9fafb)',
		padding: '0.75rem',
		textAlign: 'left',
		fontWeight: '600',
		color: 'var(--brand-text, #1f2937)',
		borderBottom: '1px solid var(--brand-border, #e5e7eb)',
	});

	const getCellStyle = () => ({
		padding: '0.75rem',
		borderBottom: '1px solid var(--brand-border, #e5e7eb)',
	});

	const getBadgeStyle = (status: string) => {
		const colors: Record<string, string> = {
			ACTIVE: 'var(--brand-success, #10b981)',
			PENDING: 'var(--brand-warning, #f59e0b)',
			BLOCKED: 'var(--brand-error, #ef4444)',
			EXPIRED: 'var(--brand-text-secondary, #6b7280)',
		};

		return {
			background: colors[status] || 'var(--brand-text-secondary, #6b7280)',
			color: 'white',
			padding: '0.25rem 0.75rem',
			borderRadius: '9999px',
			fontSize: '0.75rem',
			fontWeight: '500',
			display: 'inline-block',
		};
	};

	if (loading) {
		return (
			<div style={getContainerStyle()}>
				<div style={getHeaderStyle()}>
					<h1 style={getTitleStyle()}>
						<MDIIcon icon="cellphone" size={24} />
						Device Management
					</h1>
					<p style={{ color: 'var(--brand-text-secondary, #6b7280)' }}>
						Loading devices...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div style={getContainerStyle()}>
			<div style={getHeaderStyle()}>
				<h1 style={getTitleStyle()}>
					<MDIIcon icon="cellphone" size={24} />
					Device Management
				</h1>
				<p style={{ color: 'var(--brand-text-secondary, #6b7280)' }}>
					Manage your MFA devices - view, edit, and delete devices
				</p>
			</div>

			{/* Device Statistics */}
			<div style={getCardStyle()}>
				<h3 style={{ marginBottom: '1rem' }}>
					<MDIIcon icon="chart-bar" size={20} /> Device Statistics
				</h3>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
					<div>
						<div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--brand-primary, #3b82f6)' }}>
							{deviceStats.total}
						</div>
						<div style={{ color: 'var(--brand-text-secondary, #6b7280)' }}>Total Devices</div>
					</div>
					<div>
						<div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--brand-success, #10b981)' }}>
							{deviceStats.byStatus.ACTIVE || 0}
						</div>
						<div style={{ color: 'var(--brand-text-secondary, #6b7280)' }}>Active</div>
					</div>
					<div>
						<div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--brand-warning, #f59e0b)' }}>
							{deviceStats.byStatus.PENDING || 0}
						</div>
						<div style={{ color: 'var(--brand-text-secondary, #6b7280)' }}>Pending</div>
					</div>
				</div>
			</div>

			{/* Device Type Breakdown */}
			<div style={getCardStyle()}>
				<h3 style={{ marginBottom: '1rem' }}>
					<MDIIcon icon="devices" size={20} /> Devices by Type
				</h3>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
					{Object.entries(deviceStats.byType).map(([type, count]) => (
						<div key={type} style={{ textAlign: 'center' }}>
							<div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--brand-text, #1f2937)' }}>
								{count}
							</div>
							<div style={{ color: 'var(--brand-text-secondary, #6b7280)' }}>{type}</div>
						</div>
					))}
				</div>
			</div>

			{/* Action Buttons */}
			<div style={getCardStyle()}>
				<h3 style={{ marginBottom: '1rem' }}>
					<MDIIcon icon="cog" size={20} /> Device Operations
				</h3>
				<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
					<button
						style={getButtonStyle('primary')}
						onClick={() => setShowDeleteAllModal(true)}
						disabled={devices.length === 0}
					>
						<MDIIcon icon="delete-sweep" size={16} style={{ marginRight: '0.5rem' }} />
						Delete All Devices
					</button>
					<button
						style={getButtonStyle('secondary')}
						onClick={handleSelectAll}
						disabled={devices.length === 0}
					>
						<MDIIcon icon="select-all" size={16} style={{ marginRight: '0.5rem' }} />
						{selectedDevices.size === devices.length ? 'Deselect All' : 'Select All'}
					</button>
					{selectedDevices.size > 0 && (
						<button
							style={getButtonStyle('danger')}
							onClick={() => {
								// Delete selected devices
								Promise.all(
									Array.from(selectedDevices).map((deviceId) => handleDeleteDevice(deviceId))
								);
							}}
						>
							<MDIIcon icon="delete" size={16} style={{ marginRight: '0.5rem' }} />
							Delete Selected ({selectedDevices.size})
						</button>
					)}
				</div>
			</div>

			{/* Device List */}
			<div style={getCardStyle()}>
				<h3 style={{ marginBottom: '1rem' }}>
					<MDIIcon icon="list" size={20} /> Device List ({devices.length})
				</h3>
				{devices.length === 0 ? (
					<div style={{ textAlign: 'center', padding: '2rem', color: 'var(--brand-text-secondary, #6b7280)' }}>
						<MDIIcon icon="cellphone-off" size={48} style={{ marginBottom: '1rem' }} />
						<div>No devices found</div>
					</div>
				) : (
					<table style={getTableStyle()}>
						<thead>
							<tr>
								<th style={getTableHeaderStyle()}>
									<input
										type="checkbox"
										checked={selectedDevices.size === devices.length}
										onChange={handleSelectAll}
									/>
								</th>
								<th style={getTableHeaderStyle()}>Type</th>
								<th style={getTableHeaderStyle()}>Name</th>
								<th style={getTableHeaderStyle()}>Status</th>
								<th style={getTableHeaderStyle()}>Created</th>
								<th style={getTableHeaderStyle()}>Last Used</th>
								<th style={getTableHeaderStyle()}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{devices.map((device) => (
								<tr key={device.id}>
									<td style={getCellStyle()}>
										<input
											type="checkbox"
											checked={selectedDevices.has(device.id)}
											onChange={(e) => handleDeviceSelection(device.id, e.target.checked)}
										/>
									</td>
									<td style={getCellStyle()}>{device.type}</td>
									<td style={getCellStyle()}>{device.name}</td>
									<td style={getCellStyle()}>
										<span style={getBadgeStyle(device.status)}>
											{device.status}
										</span>
									</td>
									<td style={getCellStyle()}>
										{new Date(device.createdAt).toLocaleDateString()}
									</td>
									<td style={getCellStyle()}>
										{device.lastUsed ? new Date(device.lastUsed).toLocaleDateString() : 'Never'}
									</td>
									<td style={getCellStyle()}>
										<button
											style={{
												...getButtonStyle('danger'),
												padding: '0.5rem 1rem',
												fontSize: '0.875rem',
											}}
											onClick={() => handleDeleteDevice(device.id)}
										>
											<MDIIcon icon="delete" size={14} />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Delete All Devices Modal */}
			{showDeleteAllModal && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 10000,
					}}
					onClick={() => setShowDeleteAllModal(false)}
				>
					<div
						style={{
							background: 'white',
							borderRadius: 'var(--brand-radius-lg, 0.75rem)',
							padding: '2rem',
							maxWidth: '500px',
							width: '90%',
							maxHeight: '80vh',
							overflow: 'auto',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<h2 style={{ marginBottom: '1rem' }}>
							<MDIIcon icon="warning" size={24} style={{ marginRight: '0.5rem', color: '#ef4444' }} />
							Delete All Devices
						</h2>
						<p style={{ marginBottom: '1.5rem', color: 'var(--brand-text-secondary, #6b7280)' }}>
							This will permanently delete {getFilteredDevicesForDeletion().length} devices. This action cannot be undone.
						</p>

						<div style={{ marginBottom: '1.5rem' }}>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
								Device Type Filter
							</label>
							<select
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid var(--brand-border, #e5e7eb)',
									borderRadius: 'var(--brand-radius-md, 0.5rem)',
								}}
								value={deleteAllOptions.deviceType}
								onChange={(e) => setDeleteAllOptions({ ...deleteAllOptions, deviceType: e.target.value })}
							>
								<option value="ALL">All Types</option>
								<option value="SMS">SMS</option>
								<option value="EMAIL">Email</option>
								<option value="TOTP">TOTP</option>
								<option value="FIDO2">FIDO2</option>
							</select>
						</div>

						<div style={{ marginBottom: '1.5rem' }}>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
								Status Filter
							</label>
							<select
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid var(--brand-border, #e5e7eb)',
									borderRadius: 'var(--brand-radius-md, 0.5rem)',
								}}
								value={deleteAllOptions.status}
								onChange={(e) => setDeleteAllOptions({ ...deleteAllOptions, status: e.target.value })}
							>
								<option value="ALL">All Statuses</option>
								<option value="ACTIVE">Active</option>
								<option value="PENDING">Pending</option>
								<option value="BLOCKED">Blocked</option>
								<option value="EXPIRED">Expired</option>
							</select>
						</div>

						<div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--brand-error-light, #fef2f2)', borderRadius: 'var(--brand-radius-sm, 0.25rem)' }}>
							<div style={{ fontWeight: '600', color: 'var(--brand-error-dark, #991b1b)', marginBottom: '0.5rem' }}>
								Devices to be deleted:
							</div>
							<div style={{ fontSize: '0.875rem', color: 'var(--brand-error-dark, #991b1b)' }}>
								{getFilteredDevicesForDeletion().length} devices will be permanently deleted
							</div>
						</div>

						<div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
							<button
								style={getButtonStyle('secondary')}
								onClick={() => setShowDeleteAllModal(false)}
								disabled={isDeleting}
							>
								Cancel
							</button>
							<button
								style={getButtonStyle('danger')}
								onClick={handleDeleteAllDevices}
								disabled={isDeleting}
							>
								{isDeleting ? (
									<>
										<MDIIcon icon="loading" size={16} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
										Deleting...
									</>
								) : (
									<>
										<MDIIcon icon="delete-sweep" size={16} style={{ marginRight: '0.5rem' }} />
										Delete All
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DeviceManagement;
