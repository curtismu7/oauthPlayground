/**
 * @file MFADeviceManagerV8.tsx
 * @module v8/components
 * @description MFA Device Management Component - View, rename, block, unblock, delete devices
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Features:
 * - List all MFA devices for a user
 * - Rename devices
 * - Block/Unblock devices
 * - Delete devices
 * - View device details (type, status, phone/email)
 *
 * @example
 * <MFADeviceManagerV8
 *   environmentId="xxx"
 *   username="john.doe"
 * />
 */

import React, { useEffect, useState } from 'react';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔧 DEVICE-MANAGER-V8]';

interface MFADeviceManagerV8Props {
	environmentId: string;
	username: string;
}

interface Device {
	id: string;
	type: string;
	name?: string;
	status: string;
	phone?: string;
	email?: string;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export const MFADeviceManagerV8: React.FC<MFADeviceManagerV8Props> = ({
	environmentId,
	username,
}) => {
	const [devices, setDevices] = useState<Device[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
	const [newName, setNewName] = useState('');

	const loadDevices = async () => {
		console.log(`${MODULE_TAG} Loading devices for user`, { username });
		setIsLoading(true);
		try {
			const deviceList = await MFAServiceV8.getAllDevices({
				environmentId,
				username,
			});

			setDevices(deviceList as Device[]);
			console.log(`${MODULE_TAG} Loaded ${deviceList.length} devices`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load devices`, error);
			toastV8.error(
				`Failed to load devices: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (environmentId && username) {
			loadDevices();
		}
	}, [environmentId, username]);

	const handleRename = async (deviceId: string) => {
		if (!newName.trim()) {
			toastV8.error('Device name cannot be empty');
			return;
		}

		console.log(`${MODULE_TAG} Renaming device`, { deviceId, newName });
		try {
			await MFAServiceV8.updateDevice(
				{
					environmentId,
					username,
					deviceId,
				},
				{ name: newName }
			);

			toastV8.success('Device renamed successfully');
			setEditingDeviceId(null);
			setNewName('');
			await loadDevices();
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to rename device`, error);
			toastV8.error(
				`Failed to rename device: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	const handleBlock = async (deviceId: string) => {
		const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
		const confirmed = await uiNotificationServiceV8.confirm({
			title: 'Block Device',
			message: 'Are you sure you want to block this device?',
			confirmText: 'Block',
			cancelText: 'Cancel',
			severity: 'warning',
		});
		if (!confirmed) {
			return;
		}

		console.log(`${MODULE_TAG} Blocking device`, { deviceId });
		try {
			await MFAServiceV8.blockDevice({
				environmentId,
				username,
				deviceId,
			});

			toastV8.success('Device blocked successfully');
			await loadDevices();
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to block device`, error);
			toastV8.error(
				`Failed to block device: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	const handleUnblock = async (deviceId: string) => {
		console.log(`${MODULE_TAG} Unblocking device`, { deviceId });
		try {
			await MFAServiceV8.unblockDevice({
				environmentId,
				username,
				deviceId,
			});

			toastV8.success('Device unblocked successfully');
			await loadDevices();
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to unblock device`, error);
			toastV8.error(
				`Failed to unblock device: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	const handleDelete = async (deviceId: string) => {
		const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
		const confirmed = await uiNotificationServiceV8.confirm({
			title: 'Delete Device',
			message: 'Are you sure you want to delete this device? This action cannot be undone.',
			confirmText: 'Delete',
			cancelText: 'Cancel',
			severity: 'danger',
		});
		if (!confirmed) {
			return;
		}

		console.log(`${MODULE_TAG} Deleting device`, { deviceId });
		try {
			await MFAServiceV8.deleteDevice({
				environmentId,
				username,
				deviceId,
			});

			toastV8.success('Device deleted successfully');
			await loadDevices();
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to delete device`, error);
			toastV8.error(
				`Failed to delete device: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	const getDeviceIcon = (type: string) => {
		switch (type) {
			case 'SMS':
				return '📱';
			case 'EMAIL':
				return '📧';
			case 'TOTP':
				return '🔐';
			case 'VOICE':
				return '📞';
			default:
				return '🔒';
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return '#10b981';
			case 'BLOCKED':
				return '#ef4444';
			case 'PENDING':
				return '#f59e0b';
			default:
				return '#6b7280';
		}
	};

	if (!environmentId || !username) {
		return (
			<div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
				Please provide environment ID and username to manage devices
			</div>
		);
	}

	return (
		<div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '20px',
				}}
			>
				<div>
					<h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1f2937' }}>
						MFA Device Management
					</h2>
					<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
						User: <strong>{username}</strong>
					</p>
				</div>
				<button
					onClick={loadDevices}
					disabled={isLoading}
					style={{
						padding: '10px 20px',
						background: '#10b981',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: isLoading ? 'not-allowed' : 'pointer',
						opacity: isLoading ? 0.6 : 1,
					}}
				>
					{isLoading ? '🔄 Loading...' : '🔄 Refresh'}
				</button>
			</div>

			{isLoading && devices.length === 0 ? (
				<div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
					Loading devices...
				</div>
			) : devices.length === 0 ? (
				<div
					style={{
						textAlign: 'center',
						padding: '40px',
						background: '#f9fafb',
						borderRadius: '8px',
						border: '1px solid #e5e7eb',
					}}
				>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
					<h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>No Devices Found</h3>
					<p style={{ margin: 0, color: '#6b7280' }}>
						This user doesn't have any MFA devices registered yet.
					</p>
				</div>
			) : (
				<div style={{ display: 'grid', gap: '16px' }}>
					{devices.map((device) => (
						<div
							key={device.id}
							style={{
								background: 'white',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								padding: '20px',
								boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'flex-start',
								}}
							>
								{/* Device Info */}
								<div style={{ flex: 1 }}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '12px',
											marginBottom: '12px',
										}}
									>
										<span style={{ fontSize: '32px' }}>{getDeviceIcon(device.type)}</span>
										<div>
											{editingDeviceId === device.id ? (
												<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
													<input
														type="text"
														value={newName}
														onChange={(e) => setNewName(e.target.value)}
														placeholder="Enter new name"
														style={{
															padding: '6px 12px',
															border: '1px solid #d1d5db',
															borderRadius: '4px',
															fontSize: '14px',
														}}
														autoFocus
													/>
													<button
														onClick={() => handleRename(device.id)}
														style={{
															padding: '6px 12px',
															background: '#10b981',
															color: 'white',
															border: 'none',
															borderRadius: '4px',
															fontSize: '12px',
															cursor: 'pointer',
														}}
													>
														Save
													</button>
													<button
														onClick={() => {
															setEditingDeviceId(null);
															setNewName('');
														}}
														style={{
															padding: '6px 12px',
															background: '#6b7280',
															color: 'white',
															border: 'none',
															borderRadius: '4px',
															fontSize: '12px',
															cursor: 'pointer',
														}}
													>
														Cancel
													</button>
												</div>
											) : (
												<>
													<h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1f2937' }}>
														{device.name || `${device.type} Device`}
													</h3>
													<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
														<span
															style={{
																padding: '2px 8px',
																background: getStatusColor(device.status),
																color: 'white',
																borderRadius: '4px',
																fontSize: '11px',
																fontWeight: '600',
															}}
														>
															{device.status}
														</span>
														<span style={{ fontSize: '12px', color: '#6b7280' }}>
															{device.type}
														</span>
													</div>
												</>
											)}
										</div>
									</div>

									{/* Device Details */}
									<div style={{ marginLeft: '44px', fontSize: '13px', color: '#6b7280' }}>
										{device.phone && (
											<p style={{ margin: '4px 0' }}>
												<strong>Phone:</strong> {device.phone}
											</p>
										)}
										{device.email && (
											<p style={{ margin: '4px 0' }}>
												<strong>Email:</strong> {device.email}
											</p>
										)}
										<p style={{ margin: '4px 0' }}>
											<strong>Device ID:</strong>{' '}
											<code style={{ fontSize: '11px' }}>{device.id}</code>
										</p>
										{device.createdAt && (
											<p style={{ margin: '4px 0' }}>
												<strong>Created:</strong> {new Date(device.createdAt).toLocaleString()}
											</p>
										)}
									</div>
								</div>

								{/* Actions */}
								{editingDeviceId !== device.id && (
									<div
										style={{
											display: 'flex',
											gap: '8px',
											flexWrap: 'wrap',
											justifyContent: 'flex-end',
										}}
									>
										<button
											onClick={() => {
												setEditingDeviceId(device.id);
												setNewName(device.name || '');
											}}
											style={{
												padding: '8px 16px',
												background: '#3b82f6',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '13px',
												fontWeight: '500',
												cursor: 'pointer',
											}}
											title="Rename device"
										>
											✏️ Rename
										</button>

										{device.status === 'ACTIVE' ? (
											<button
												onClick={() => handleBlock(device.id)}
												style={{
													padding: '8px 16px',
													background: '#f59e0b',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													fontSize: '13px',
													fontWeight: '500',
													cursor: 'pointer',
												}}
												title="Block device"
											>
												🚫 Block
											</button>
										) : device.status === 'BLOCKED' ? (
											<button
												onClick={() => handleUnblock(device.id)}
												style={{
													padding: '8px 16px',
													background: '#10b981',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													fontSize: '13px',
													fontWeight: '500',
													cursor: 'pointer',
												}}
												title="Unblock device"
											>
												✅ Unblock
											</button>
										) : null}

										<button
											onClick={() => handleDelete(device.id)}
											style={{
												padding: '8px 16px',
												background: '#ef4444',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '13px',
												fontWeight: '500',
												cursor: 'pointer',
											}}
											title="Delete device"
										>
											🗑️ Delete
										</button>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default MFADeviceManagerV8;
