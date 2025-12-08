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

import React, { useCallback, useEffect, useState } from 'react';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';

const MODULE_TAG = '[🔧 DEVICE-MANAGER-V8]';

interface MFADeviceManagerV8Props {
	environmentId: string;
	username: string;
}

interface Device {
	id: string;
	type: string;
	name?: string;
	nickname?: string;
	status: string;
	phone?: string;
	email?: string;
	active?: boolean;
	enabled?: boolean;
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
	const [showInfo, setShowInfo] = useState(false);
	const [bypassStatus, setBypassStatus] = useState<Record<string, unknown> | null>(null);
	const [processingDeviceId, setProcessingDeviceId] = useState<string | null>(null);
	const [recentlyChangedDevices, setRecentlyChangedDevices] = useState<Set<string>>(new Set());

	const loadDevices = useCallback(async () => {
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
	}, [environmentId, username]);

	useEffect(() => {
		if (environmentId && username) {
			loadDevices();
		}
	}, [environmentId, username, loadDevices]);

	const handleAllowBypass = async () => {
		console.log(`${MODULE_TAG} Allowing MFA bypass for user`, {
			environmentId,
			username,
		});
		if (!environmentId || !username) {
			toastV8.error('Environment ID and username are required to allow bypass');
			return;
		}
		try {
			const user = await MFAServiceV8.lookupUserByUsername(environmentId, username);
			await MFAServiceV8.allowMfaBypass(environmentId, user.id);
			toastV8.success('MFA bypass allowed for user');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to allow MFA bypass`, error);
			toastV8.error(
				`Failed to allow MFA bypass: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	const handleCopyDeviceId = async (deviceId: string) => {
		try {
			if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(deviceId);
			} else if (typeof document !== 'undefined') {
				const textarea = document.createElement('textarea');
				textarea.value = deviceId;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				document.body.removeChild(textarea);
			}
			toastV8.success('Device ID copied to clipboard');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to copy device ID`, error);
			toastV8.error('Failed to copy device ID');
		}
	};

	const handleCheckBypass = async () => {
		console.log(`${MODULE_TAG} Checking MFA bypass status for user`, {
			environmentId,
			username,
		});
		if (!environmentId || !username) {
			toastV8.error('Environment ID and username are required to check bypass status');
			return;
		}
		try {
			const user = await MFAServiceV8.lookupUserByUsername(environmentId, username);
			const status = await MFAServiceV8.checkMfaBypassStatus(environmentId, user.id);
			setBypassStatus(status);
			toastV8.info(
				`MFA bypass status: ${
					typeof status.enabled !== 'undefined' ? String(status.enabled) : 'see console for details'
				}`
			);
			console.log(`${MODULE_TAG} MFA bypass status response`, status);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to check MFA bypass status`, error);
			toastV8.error(
				`Failed to check MFA bypass status: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	};

	const handleSetDeviceOrder = async () => {
		console.log(`${MODULE_TAG} Setting device order`, {
			environmentId,
			username,
			deviceCount: devices.length,
		});
		if (!environmentId || !username) {
			toastV8.error('Environment ID and username are required to set device order');
			return;
		}
		if (devices.length === 0) {
			toastV8.error('No devices available to set order');
			return;
		}
		try {
			const user = await MFAServiceV8.lookupUserByUsername(environmentId, username);
			const orderedDeviceIds = devices.map((d) => d.id);
			await MFAServiceV8.setUserMfaDeviceOrder(environmentId, user.id, orderedDeviceIds);
			toastV8.success('Device order updated successfully');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to set device order`, error);
			toastV8.error(
				`Failed to set device order: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	const handleRemoveDeviceOrder = async () => {
		console.log(`${MODULE_TAG} Removing device order`, {
			environmentId,
			username,
		});
		if (!environmentId || !username) {
			toastV8.error('Environment ID and username are required to remove device order');
			return;
		}
		try {
			const user = await MFAServiceV8.lookupUserByUsername(environmentId, username);
			await MFAServiceV8.removeUserMfaDeviceOrder(environmentId, user.id);
			toastV8.success('Device order removed successfully');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to remove device order`, error);
			toastV8.error(
				`Failed to remove device order: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	const handleRename = async (deviceId: string) => {
		if (!newName.trim()) {
			toastV8.error('Device nickname cannot be empty');
			return;
		}

		console.log(`${MODULE_TAG} Renaming device`, { deviceId, newName });
		try {
			await MFAServiceV8.updateDeviceNickname(
				{
					environmentId,
					username,
					deviceId,
				},
				newName
			);

			toastV8.success('Device nickname updated successfully');
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
		setProcessingDeviceId(deviceId);
		try {
			await MFAServiceV8.blockDevice({
				environmentId,
				username,
				deviceId,
			});

			// Mark device as recently changed for visual feedback
			setRecentlyChangedDevices((prev) => new Set(prev).add(deviceId));
			setTimeout(() => {
				setRecentlyChangedDevices((prev) => {
					const next = new Set(prev);
					next.delete(deviceId);
					return next;
				});
			}, 2000); // Remove highlight after 2 seconds

			toastV8.success('Device blocked successfully');
			await loadDevices();
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to block device`, error);
			toastV8.error(
				`Failed to block device: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setProcessingDeviceId(null);
		}
	};

	const handleUnblock = async (deviceId: string) => {
		console.log(`${MODULE_TAG} Unblocking device`, { deviceId });
		setProcessingDeviceId(deviceId);
		try {
			await MFAServiceV8.unblockDevice({
				environmentId,
				username,
				deviceId,
			});

			// Mark device as recently changed for visual feedback
			setRecentlyChangedDevices((prev) => new Set(prev).add(deviceId));
			setTimeout(() => {
				setRecentlyChangedDevices((prev) => {
					const next = new Set(prev);
					next.delete(deviceId);
					return next;
				});
			}, 2000); // Remove highlight after 2 seconds

			toastV8.success('Device unblocked successfully');
			await loadDevices();
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to unblock device`, error);
			toastV8.error(
				`Failed to unblock device: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setProcessingDeviceId(null);
		}
	};

	const handleUnlock = async (deviceId: string) => {
		console.log(`${MODULE_TAG} Unlocking device`, { deviceId });
		setProcessingDeviceId(deviceId);
		try {
			await MFAServiceV8.unblockDevice({
				environmentId,
				username,
				deviceId,
			});

			// Mark device as recently changed for visual feedback
			setRecentlyChangedDevices((prev) => new Set(prev).add(deviceId));
			setTimeout(() => {
				setRecentlyChangedDevices((prev) => {
					const next = new Set(prev);
					next.delete(deviceId);
					return next;
				});
			}, 2000); // Remove highlight after 2 seconds

			toastV8.success('Device unlocked successfully');
			await loadDevices();
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to unlock device`, error);
			toastV8.error(
				`Failed to unlock device: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setProcessingDeviceId(null);
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
			case 'LOCKED':
				return '#dc2626';
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
					gap: '12px',
					flexWrap: 'wrap',
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
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
					<button
						type="button"
						onClick={() => setShowInfo((prev) => !prev)}
						style={{
							padding: '8px 12px',
							borderRadius: '8px',
							border: '1px solid #bae6fd',
							background: showInfo ? '#dbeafe' : '#eff6ff',
							color: '#1d4ed8',
							fontWeight: 600,
							cursor: 'pointer',
							fontSize: '13px',
						}}
					>
						{showInfo ? 'Hide guide' : 'What is this?'}
					</button>
					<button
						type="button"
						onClick={handleAllowBypass}
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
						title="Allow MFA bypass for this user"
					>
						✅ Allow Bypass
					</button>
					<button
						type="button"
						onClick={handleCheckBypass}
						style={{
							padding: '8px 16px',
							background: '#6366f1',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '13px',
							fontWeight: '500',
							cursor: 'pointer',
						}}
						title="Check MFA bypass status for this user"
					>
						🔍 Check Bypass
					</button>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<button
							type="button"
							onClick={handleSetDeviceOrder}
							style={{
								padding: '8px 16px',
								background: '#8b5cf6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '13px',
								fontWeight: '500',
								cursor: 'pointer',
							}}
							title="Set device order based on current list"
						>
							📋 Set Order
						</button>
						<MFAInfoButtonV8 contentKey="device.order" displayMode="modal" />
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<button
							type="button"
							onClick={handleRemoveDeviceOrder}
							style={{
								padding: '8px 16px',
								background: '#ec4899',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '13px',
								fontWeight: '500',
								cursor: 'pointer',
							}}
							title="Remove device order"
						>
							🗑️ Remove Order
						</button>
						<MFAInfoButtonV8 contentKey="device.order" displayMode="modal" />
					</div>
					<button
						type="button"
						onClick={async () => {
							// Refresh device list instead of navigating
							await loadDevices();
						}}
						style={{
							padding: '10px 20px',
							background: '#10b981',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						🔄 Refresh
					</button>
				</div>
			</div>

			{bypassStatus && (
				<div
					style={{
						marginTop: '12px',
						marginBottom: '12px',
						padding: '10px 12px',
						background: '#fef9c3',
						border: '1px solid #facc15',
						borderRadius: '8px',
						color: '#713f12',
						fontSize: '12px',
						lineHeight: 1.4,
					}}
				>
					<div style={{ fontWeight: 600, marginBottom: '4px' }}>MFA Bypass Status (last check)</div>
					<p style={{ margin: '2px 0' }}>
						<strong>Enabled:</strong>{' '}
						{typeof (bypassStatus as { enabled?: unknown }).enabled !== 'undefined'
							? String((bypassStatus as { enabled?: unknown }).enabled)
							: 'Unknown'}
					</p>
					<p style={{ margin: '2px 0' }}>
						<strong>Raw:</strong>{' '}
						<code style={{ fontSize: '11px', wordBreak: 'break-all' }}>
							{JSON.stringify(bypassStatus)}
						</code>
					</p>
				</div>
			)}

			{showInfo && (
				<div
					style={{
						marginBottom: '20px',
						padding: '14px',
						background: '#ecfccb',
						border: '1px solid #bef264',
						borderRadius: '10px',
						color: '#365314',
						fontSize: '13px',
						lineHeight: 1.6,
					}}
				>
					<strong>How to use this console:</strong>
					<ul style={{ margin: '8px 0 0 18px' }}>
						<li>Use <em>Refresh</em> to pull the latest devices directly from PingOne before making changes.</li>
						<li>Each card lists the factor type, nickname, contact details, and current status.</li>
						<li>
							Action buttons let you rename, block/unblock, or delete devices—mirroring what PingOne admins do in production.
						</li>
						<li>SMS/Email entries show the destination so you can confirm the correct phone or inbox is configured.</li>
					</ul>
				</div>
			)}

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
					{devices.map((device) => {
						const isProcessing = processingDeviceId === device.id;
						const wasRecentlyChanged = recentlyChangedDevices.has(device.id);
						const isBlocked = device.status === 'BLOCKED';
						const isActive = device.status === 'ACTIVE';

						return (
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
										<div style={{ marginBottom: '8px' }}>
											<strong>Type:</strong> {device.type}
											{device.status && (
												<span style={{ marginLeft: '12px' }}>
													<strong>Status:</strong> {device.status}
												</span>
											)}
										</div>
										{device.email && (
											<p style={{ margin: '4px 0' }}>
												<strong>Email:</strong> {device.email}
											</p>
										)}
										{device.name && (
											<p style={{ margin: '4px 0' }}>
												<strong>Name:</strong> {device.name}
											</p>
										)}
										{device.nickname && (
											<p style={{ margin: '4px 0' }}>
												<strong>Nickname:</strong> {device.nickname}
											</p>
										)}
										{typeof device.enabled !== 'undefined' && (
											<p style={{ margin: '4px 0' }}>
												<strong>Enabled:</strong> {String(device.enabled)}
											</p>
										)}
										{typeof device.active !== 'undefined' && (
											<p style={{ margin: '4px 0' }}>
												<strong>Active:</strong> {device.active ? 'Active' : 'Inactive'}
											</p>
										)}
										<p
											style={{
												margin: '4px 0',
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
											}}
										>
											<span>
												<strong>Device ID:</strong>{' '}
												<code style={{ fontSize: '11px' }}>{device.id}</code>
											</span>
											<button
												type="button"
												onClick={() => handleCopyDeviceId(device.id)}
												style={{
													padding: '2px 8px',
													fontSize: '11px',
													borderRadius: '4px',
													border: '1px solid #d1d5db',
													background: '#f9fafb',
													color: '#374151',
													cursor: 'pointer',
												}}
												title="Copy Device ID to clipboard"
											>
												Copy
											</button>
										</p>
										{device.createdAt && (
											<p style={{ margin: '4px 0' }}>
												<strong>Created:</strong> {new Date(device.createdAt).toLocaleString()}
											</p>
										)}
										{device.updatedAt && (
											<p style={{ margin: '4px 0' }}>
												<strong>Updated:</strong> {new Date(device.updatedAt).toLocaleString()}
											</p>
										)}
									</div>
								</div>

								{/* Actions */}
								{editingDeviceId === device.id ? (
									<div
										style={{
											display: 'flex',
											gap: '8px',
											flexWrap: 'wrap',
											justifyContent: 'flex-end',
										}}
									>
										<input
											type="text"
											value={newName}
											onChange={(e) => setNewName(e.target.value)}
											placeholder="Enter new nickname"
											style={{
												padding: '6px 12px',
												border: '1px solid #d1d5db',
												borderRadius: '4px',
												fontSize: '14px',
											}}
										/>
										<button
											type="button"
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
											type="button"
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
									<div
										style={{
											display: 'flex',
											gap: '8px',
											flexWrap: 'wrap',
											justifyContent: 'flex-end',
										}}
									>
										<button
											type="button"
											onClick={() => {
												setEditingDeviceId(device.id);
												setNewName(device.nickname || device.name || '');
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
												type="button"
												onClick={() => handleBlock(device.id)}
												disabled={isProcessing}
												style={{
													padding: '8px 16px',
													background: isProcessing
														? '#d97706'
														: wasRecentlyChanged && isBlocked
														? '#ef4444'
														: '#f59e0b',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													fontSize: '13px',
													fontWeight: '500',
													cursor: isProcessing ? 'wait' : 'pointer',
													opacity: isProcessing ? 0.7 : 1,
													transition: 'all 0.3s ease',
													transform: wasRecentlyChanged && isBlocked ? 'scale(1.05)' : 'scale(1)',
												}}
												title={isProcessing ? 'Blocking device...' : 'Block device - Current status: ACTIVE'}
											>
												{isProcessing ? '⏳ Blocking...' : '🚫 Block (ACTIVE)'}
											</button>
										) : device.status === 'BLOCKED' ? (
											<button
												type="button"
												onClick={() => handleUnblock(device.id)}
												disabled={isProcessing}
												style={{
													padding: '8px 16px',
													background: isProcessing
														? '#059669'
														: wasRecentlyChanged && isActive
														? '#10b981'
														: '#10b981',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													fontSize: '13px',
													fontWeight: '500',
													cursor: isProcessing ? 'wait' : 'pointer',
													opacity: isProcessing ? 0.7 : 1,
													transition: 'all 0.3s ease',
													transform: wasRecentlyChanged && isActive ? 'scale(1.05)' : 'scale(1)',
												}}
												title={isProcessing ? 'Unblocking device...' : 'Unblock device - Current status: BLOCKED'}
											>
												{isProcessing ? '⏳ Unblocking...' : '✅ Unblock (BLOCKED)'}
											</button>
										) : device.status === 'LOCKED' ? (
											<button
												type="button"
												onClick={() => handleUnlock(device.id)}
												disabled={isProcessing}
												style={{
													padding: '8px 16px',
													background: isProcessing ? '#2563eb' : '#3b82f6',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													fontSize: '13px',
													fontWeight: '500',
													cursor: isProcessing ? 'wait' : 'pointer',
													opacity: isProcessing ? 0.7 : 1,
													transition: 'all 0.3s ease',
												}}
												title={isProcessing ? 'Unlocking device...' : 'Unlock device - Current status: LOCKED (locked due to too many failed attempts)'}
											>
												{isProcessing ? '⏳ Unlocking...' : '🔓 Unlock'}
											</button>
										) : null}

										<button
											type="button"
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
						);
					})}
				</div>
			)}
		</div>
	);
};
export default MFADeviceManagerV8;
