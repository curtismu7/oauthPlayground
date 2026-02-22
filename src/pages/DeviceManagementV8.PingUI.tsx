/**
 * @file DeviceManagementV8.PingUI.tsx
 * @module pages
 * @description PingOne UI styled comprehensive device management page with individual and bulk operations
 * @version 9.13.0-PingUI
 * @since 2026-02-22
 *
 * PingOne UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied PingOne UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 * - PingOne UI card, button, and table styling patterns
 *
 * Features:
 * - View all MFA devices with filtering options
 * - Individual device operations (delete, activate, deactivate, rename)
 * - Bulk operations (delete all devices by type/status)
 * - Device usage statistics and recommendations
 * - PingOne UI styling and components
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { toastV8 } from '../v8/utils/toastNotificationsV8';
import { EnvironmentIdServiceV8 } from '../v8/services/environmentIdServiceV8';
import { MFAServiceV8 } from '../apps/mfa/services/mfaServiceV8';
import { DeviceManagementService } from '../services/deviceManagementService';
import { workerTokenServiceV8 } from '../v8/services/workerTokenServiceV8';
import { StorageServiceV8 } from '../v8/services/storageServiceV8';

// MDI Icon Mapping for React Icons → MDI CSS
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		FiCellphone: 'mdi-cellphone',
		FiTrash2: 'mdi-delete',
		FiTrash: 'mdi-delete',
		FiDeleteSweep: 'mdi-delete-sweep',
		FiSelectAll: 'mdi-select-all',
		FiDeselectAll: 'mdi-select-off',
		FiChartBar: 'mdi-chart-bar',
		FiDevices: 'mdi-devices',
		FiCog: 'mdi-cog',
		FiList: 'mdi-format-list-bulleted',
		FiCellphoneOff: 'mdi-cellphone-off',
		FiWarning: 'mdi-alert',
		FiLoading: 'mdi-loading',
	};
	return iconMap[fiIcon] || 'mdi-help-circle';
};

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			title={ariaLabel}
			aria-hidden={ariaHidden}
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

const DeviceManagementV8PingUI: React.FC = () => {
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

	// Get status badge style
	const getStatusBadgeStyle = (status: string): React.CSSProperties => {
		const colors: Record<string, string> = {
			ACTIVE: 'var(--ping-success-color, #28a745)',
			PENDING: 'var(--ping-warning-color, #ffc107)',
			BLOCKED: 'var(--ping-error-color, #dc3545)',
			EXPIRED: 'var(--ping-text-secondary, #6c757d)',
		};

		return {
			background: colors[status] || 'var(--ping-text-secondary, #6c757d)',
			color: 'white',
			padding: 'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem)',
			borderRadius: 'var(--ping-border-radius-sm, 0.25rem)',
			fontSize: '12px',
			fontWeight: '500',
			display: 'inline-block',
		};
	};

	// Get button style
	const getButtonStyle = (variant: 'primary' | 'danger' | 'secondary' = 'primary'): React.CSSProperties => {
		const baseStyle: React.CSSProperties = {
			display: 'inline-flex',
			alignItems: 'center',
			gap: 'var(--ping-spacing-xs, 0.25rem)',
			padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
			borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
			fontWeight: '500',
			cursor: 'pointer',
			transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
			border: '1px solid transparent',
		};

		switch (variant) {
			case 'primary':
				return {
					...baseStyle,
					background: 'var(--ping-primary-color, #0066cc)',
					color: 'white',
					borderColor: 'var(--ping-primary-color, #0066cc)',
				};
			case 'danger':
				return {
					...baseStyle,
					background: 'var(--ping-error-color, #dc3545)',
					color: 'white',
					borderColor: 'var(--ping-error-color, #dc3545)',
				};
			default:
				return {
					...baseStyle,
					background: 'var(--ping-secondary-color, #f8f9fa)',
					color: 'var(--ping-text-color, #1a1a1a)',
					borderColor: 'var(--ping-border-color, #dee2e6)',
				};
		}
	};

	// Get card style
	const getCardStyle = (): React.CSSProperties => ({
		background: 'var(--ping-secondary-color, #f8f9fa)',
		borderRadius: 'var(--ping-border-radius-lg, 0.5rem)',
		padding: 'var(--ping-spacing-xl, 2rem)',
		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
		border: '1px solid var(--ping-border-color, #dee2e6)',
		marginBottom: 'var(--ping-spacing-xl, 2rem)',
	});

	// Get table style
	const getTableStyle = (): React.CSSProperties => ({
		width: '100%',
		borderCollapse: 'collapse',
		marginTop: 'var(--ping-spacing-md, 1rem)',
		background: 'var(--ping-secondary-color, #f8f9fa)',
		borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
		overflow: 'hidden',
	});

	// Get table header style
	const getTableHeaderStyle = (): React.CSSProperties => ({
		background: 'var(--ping-primary-color, #0066cc)',
		color: 'white',
		padding: 'var(--ping-spacing-md, 1rem)',
		textAlign: 'left',
		fontWeight: '600',
		borderBottom: '1px solid var(--ping-border-color, #dee2e6)',
	});

	// Get table cell style
	const getCellStyle = (): React.CSSProperties => ({
		padding: 'var(--ping-spacing-md, 1rem)',
		borderBottom: '1px solid var(--ping-border-color, #dee2e6)',
		background: 'white',
	});

	if (loading) {
		return (
			<div className="end-user-nano">
				<div
					style={{
						minHeight: '100vh',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: 'var(--ping-secondary-color, #f8f9fa)',
					}}
				>
					<div
						style={{
							textAlign: 'center',
							padding: 'var(--ping-spacing-xl, 2rem)',
						}}
					>
						<MDIIcon
							icon="FiCellphone"
							size={48}
							ariaLabel="Loading devices"
							style={{
								marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
								color: 'var(--ping-primary-color, #0066cc)',
							}}
						/>
						<h2
							style={{
								fontSize: '24px',
								fontWeight: '700',
								color: 'var(--ping-text-color, #1a1a1a)',
								marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
							}}
						>
							Device Management
						</h2>
						<p
							style={{
								color: 'var(--ping-text-secondary, #6c757d)',
								margin: 0,
							}}
						>
							Loading devices...
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="end-user-nano">
			<div
				style={{
					maxWidth: '1200px',
					margin: '0 auto',
					padding: 'var(--ping-spacing-xl, 2rem)',
				}}
			>
				{/* Header */}
				<div
					style={{
						textAlign: 'center',
						marginBottom: 'var(--ping-spacing-2xl, 3rem)',
					}}
				>
					<h1
						style={{
							fontSize: '32px',
							fontWeight: '700',
							color: 'var(--ping-text-color, #1a1a1a)',
							marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 'var(--ping-spacing-sm, 0.5rem)',
						}}
					>
						<MDIIcon icon="FiCellphone" size={32} />
						Device Management
					</h1>
					<p
						style={{
							color: 'var(--ping-text-secondary, #6c757d)',
							margin: 0,
							fontSize: '16px',
						}}
					>
						Manage your MFA devices - view, edit, and delete devices
					</p>
				</div>

				{/* Device Statistics */}
				<div style={getCardStyle()}>
					<h3
						style={{
							fontSize: '20px',
							fontWeight: '600',
							color: 'var(--ping-text-color, #1a1a1a)',
							marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
							display: 'flex',
							alignItems: 'center',
							gap: 'var(--ping-spacing-sm, 0.5rem)',
						}}
					>
						<MDIIcon icon="FiChartBar" size={20} />
						Device Statistics
					</h3>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
							gap: 'var(--ping-spacing-lg, 1.5rem)',
						}}
					>
						<div>
							<div
								style={{
									fontSize: '32px',
									fontWeight: '700',
									color: 'var(--ping-primary-color, #0066cc)',
								}}
							>
								{deviceStats.total}
							</div>
							<div
								style={{
									color: 'var(--ping-text-secondary, #6c757d)',
									fontSize: '14px',
								}}
							>
								Total Devices
							</div>
						</div>
						<div>
							<div
								style={{
									fontSize: '32px',
									fontWeight: '700',
									color: 'var(--ping-success-color, #28a745)',
								}}
							>
								{deviceStats.byStatus.ACTIVE || 0}
							</div>
							<div
								style={{
									color: 'var(--ping-text-secondary, #6c757d)',
									fontSize: '14px',
								}}
							>
								Active
							</div>
						</div>
						<div>
							<div
								style={{
									fontSize: '32px',
									fontWeight: '700',
									color: 'var(--ping-warning-color, #ffc107)',
								}}
							>
								{deviceStats.byStatus.PENDING || 0}
							</div>
							<div
								style={{
									color: 'var(--ping-text-secondary, #6c757d)',
									fontSize: '14px',
								}}
							>
								Pending
							</div>
						</div>
					</div>
				</div>

				{/* Device Type Breakdown */}
				<div style={getCardStyle()}>
					<h3
						style={{
							fontSize: '20px',
							fontWeight: '600',
							color: 'var(--ping-text-color, #1a1a1a)',
							marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
							display: 'flex',
							alignItems: 'center',
							gap: 'var(--ping-spacing-sm, 0.5rem)',
						}}
					>
						<MDIIcon icon="FiDevices" size={20} />
						Devices by Type
					</h3>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
							gap: 'var(--ping-spacing-md, 1rem)',
						}}
					>
						{Object.entries(deviceStats.byType).map(([type, count]) => (
							<div
								key={type}
								style={{
									textAlign: 'center',
									padding: 'var(--ping-spacing-md, 1rem)',
									background: 'white',
									borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
									border: '1px solid var(--ping-border-color, #dee2e6)',
								}}
							>
								<div
									style={{
										fontSize: '24px',
										fontWeight: '600',
										color: 'var(--ping-text-color, #1a1a1a)',
									}}
								>
									{count}
								</div>
								<div
									style={{
										color: 'var(--ping-text-secondary, #6c757d)',
										fontSize: '14px',
									}}
								>
									{type}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Action Buttons */}
				<div style={getCardStyle()}>
					<h3
						style={{
							fontSize: '20px',
							fontWeight: '600',
							color: 'var(--ping-text-color, #1a1a1a)',
							marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
							display: 'flex',
							alignItems: 'center',
							gap: 'var(--ping-spacing-sm, 0.5rem)',
						}}
					>
						<MDIIcon icon="FiCog" size={20} />
						Device Operations
					</h3>
					<div
						style={{
							display: 'flex',
							gap: 'var(--ping-spacing-md, 1rem)',
							flexWrap: 'wrap',
						}}
					>
						<button
							type="button"
							style={getButtonStyle('danger')}
							onClick={() => setShowDeleteAllModal(true)}
							disabled={devices.length === 0}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#c82333';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = 'var(--ping-error-color, #dc3545)';
							}}
						>
							<MDIIcon icon="FiDeleteSweep" size={16} />
							Delete All Devices
						</button>
						<button
							type="button"
							style={getButtonStyle('secondary')}
							onClick={handleSelectAll}
							disabled={devices.length === 0}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = 'var(--ping-hover-color, #f1f3f4)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = 'var(--ping-secondary-color, #f8f9fa)';
							}}
						>
							<MDIIcon icon="FiSelectAll" size={16} />
							{selectedDevices.size === devices.length ? 'Deselect All' : 'Select All'}
						</button>
						{selectedDevices.size > 0 && (
							<button
								type="button"
								style={getButtonStyle('danger')}
								onClick={() => {
									// Delete selected devices
									Promise.all(
										Array.from(selectedDevices).map((deviceId) => handleDeleteDevice(deviceId))
									);
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#c82333';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'var(--ping-error-color, #dc3545)';
								}}
							>
								<MDIIcon icon="FiTrash" size={16} />
								Delete Selected ({selectedDevices.size})
							</button>
						)}
					</div>
				</div>

				{/* Device List */}
				<div style={getCardStyle()}>
					<h3
						style={{
							fontSize: '20px',
							fontWeight: '600',
							color: 'var(--ping-text-color, #1a1a1a)',
							marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
							display: 'flex',
							alignItems: 'center',
							gap: 'var(--ping-spacing-sm, 0.5rem)',
						}}
					>
						<MDIIcon icon="FiList" size={20} />
						Device List ({devices.length})
					</h3>
					{devices.length === 0 ? (
						<div
							style={{
								textAlign: 'center',
								padding: 'var(--ping-spacing-2xl, 3rem)',
								color: 'var(--ping-text-secondary, #6c757d)',
							}}
						>
							<MDIIcon
								icon="FiCellphoneOff"
								size={64}
								style={{
									marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
									color: 'var(--ping-text-secondary, #6c757d)',
								}}
							/>
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
											style={{
												marginRight: 'var(--ping-spacing-xs, 0.25rem)',
											transform: 'scale(1.2)',
											cursor: 'pointer',
											}}
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
												style={{
													marginRight: 'var(--ping-spacing-xs, 0.25rem)',
													transform: 'scale(1.2)',
													cursor: 'pointer',
												}}
											/>
										</td>
										<td style={getCellStyle()}>{device.type}</td>
										<td style={getCellStyle()}>{device.name}</td>
										<td style={getCellStyle()}>
											<span style={getStatusBadgeStyle(device.status)}>
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
												type="button"
												style={{
													...getButtonStyle('danger'),
													padding: 'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem)',
													fontSize: '14px',
												}}
												onClick={() => handleDeleteDevice(device.id)}
												onMouseEnter={(e) => {
													e.currentTarget.style.background = '#c82333';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.background = 'var(--ping-error-color, #dc3545)';
												}}
											>
												<MDIIcon icon="FiTrash" size={14} />
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
								background: 'var(--ping-secondary-color, #f8f9fa)',
								borderRadius: 'var(--ping-border-radius-lg, 0.5rem)',
								padding: 'var(--ping-spacing-xl, 2rem)',
								maxWidth: '500px',
								width: '90%',
								maxHeight: '80vh',
								overflow: 'auto',
								boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
							}}
							onClick={(e) => e.stopPropagation()}
						>
							<h2
								style={{
									fontSize: '24px',
									fontWeight: '600',
									color: 'var(--ping-text-color, #1a1a1a)',
									marginBottom: 'var(--ping-spacing-md, 1rem)',
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--ping-spacing-sm, 0.5rem)',
								}}
							>
								<MDIIcon
									icon="FiWarning"
									size={24}
									style={{ color: 'var(--ping-error-color, #dc3545)' }}
								/>
								Delete All Devices
							</h2>
							<p
								style={{
									marginBottom: 'var(--ping-spacing-xl, 2rem)',
									color: 'var(--ping-text-secondary, #6c757d)',
									lineHeight: '1.6',
								}}
							>
								This will permanently delete {getFilteredDevicesForDeletion().length} devices. This action cannot be undone.
							</p>

							<div style={{ marginBottom: 'var(--ping-spacing-lg, 1.5rem)' }}>
								<label
									style={{
										display: 'block',
										marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
										fontWeight: '600',
										color: 'var(--ping-text-color, #1a1a1a)',
									}}
								>
									Device Type Filter
								</label>
								<select
									style={{
										width: '100%',
										padding: 'var(--ping-spacing-sm, 0.5rem)',
										border: '1px solid var(--ping-border-color, #dee2e6)',
										borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
										background: 'white',
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

							<div style={{ marginBottom: 'var(--ping-spacing-lg, 1.5rem)' }}>
								<label
									style={{
										display: 'block',
										marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
										fontWeight: '600',
										color: 'var(--ping-text-color, #1a1a1a)',
									}}
								>
									Status Filter
								</label>
								<select
									style={{
										width: '100%',
										padding: 'var(--ping-spacing-sm, 0.5rem)',
										border: '1px solid var(--ping-border-color, #dee2e6)',
										borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
										background: 'white',
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

							<div
								style={{
									marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
									padding: 'var(--ping-spacing-md, 1rem)',
									background: 'var(--ping-error-color, #dc3545)',
									borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
									border: '1px solid var(--ping-error-color, #dc3545)',
								}}
							>
								<div
									style={{
										fontWeight: '600',
										color: 'white',
										marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
									}}
								>
									Devices to be deleted:
								</div>
								<div
									style={{
										fontSize: '14px',
										color: 'white',
									}}
								>
									{getFilteredDevicesForDeletion().length} devices will be permanently deleted
								</div>
							</div>

							<div
								style={{
									display: 'flex',
									gap: 'var(--ping-spacing-md, 1rem)',
									justifyContent: 'flex-end',
								}}
							>
								<button
									type="button"
									style={getButtonStyle('secondary')}
									onClick={() => setShowDeleteAllModal(false)}
									disabled={isDeleting}
								>
									Cancel
								</button>
								<button
									type="button"
									style={getButtonStyle('danger')}
									onClick={handleDeleteAllDevices}
									disabled={isDeleting}
								>
									{isDeleting ? (
										<>
											<MDIIcon
												icon="FiLoading"
												size={16}
												style={{
													animation: 'spin 1s linear infinite',
													marginRight: 'var(--ping-spacing-xs, 0.25rem)',
												}}
											/>
											Deleting...
										</>
									) : (
										<>
											<MDIIcon icon="FiDeleteSweep" size={16} />
											Delete All
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DeviceManagementV8PingUI;
