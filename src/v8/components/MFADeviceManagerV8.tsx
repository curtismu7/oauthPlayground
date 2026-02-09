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
import { FiInfo } from 'react-icons/fi';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { ButtonSpinner } from '../../components/ui';

const MODULE_TAG = '[🔧 DEVICE-MANAGER-V8]';

interface MFADeviceManagerV8Props {
	environmentId: string;
	username: string;
	onUsernameChange?: () => void; // Callback to handle username change
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
	lock?: {
		status?: string;
		expiresAt?: string;
		reason?: string;
	};
	block?: {
		status?: string;
		blockedAt?: string;
	};
	[key: string]: unknown;
}

export const MFADeviceManagerV8: React.FC<MFADeviceManagerV8Props> = ({
	environmentId,
	username,
	onUsernameChange,
}) => {
	const [devices, setDevices] = useState<Device[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
	const [newName, setNewName] = useState('');
	const [showInfo, setShowInfo] = useState(false);
	const [bypassStatus, setBypassStatus] = useState<Record<string, unknown> | null>(null);
	const [processingDeviceId, setProcessingDeviceId] = useState<string | null>(null);
	const [recentlyChangedDevices, setRecentlyChangedDevices] = useState<Set<string>>(new Set());
	const [expandedSecurityDevices, setExpandedSecurityDevices] = useState<Set<string>>(new Set());
	const [expandedRawDevices, setExpandedRawDevices] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (devices.length > 0) {
			const autoExpanded = devices
				.filter((d) => d.lock?.status === 'LOCKED' || d.block?.status === 'BLOCKED')
				.map((d) => d.id);
			setExpandedSecurityDevices(new Set(autoExpanded));
			setExpandedRawDevices(new Set());
		} else {
			setExpandedSecurityDevices(new Set());
			setExpandedRawDevices(new Set());
		}
	}, [devices]);

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
			if (
				typeof navigator !== 'undefined' &&
				navigator.clipboard &&
				navigator.clipboard.writeText
			) {
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

	const _handleSetDeviceOrder = async () => {
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

	const _handleRemoveDeviceOrder = async () => {
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
			await MFAServiceV8.unlockDevice({
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

	const handleAdminActivate = async (deviceId: string) => {
		setProcessingDeviceId(deviceId);
		try {
			console.log(`${MODULE_TAG} Admin activating device`, { deviceId });

			// For admin activation, we can directly activate the device without OTP
			// This uses the worker token which has admin privileges
			const device = devices.find((d) => d.id === deviceId);
			if (!device) {
				throw new Error('Device not found');
			}

			let _activationResult;

			// Use appropriate activation method based on device type
			if (device.type === 'TOTP') {
				// For TOTP devices, we can activate them directly with admin privileges
				// The backend will handle the activation without requiring OTP
				_activationResult = await MFAServiceV8.activateDevice({
					environmentId,
					username,
					deviceId,
					otp: 'ADMIN_ACTIVATION', // Special token for admin activation
				});
			} else if (device.type === 'FIDO2') {
				// For FIDO2 devices, use the FIDO2 activation method
				_activationResult = await MFAServiceV8.activateFIDO2Device({
					environmentId,
					username,
					deviceId,
					workerToken: await MFAServiceV8.getWorkerToken(),
				});
			} else {
				// For SMS, EMAIL, VOICE devices, activate without OTP requirement
				_activationResult = await MFAServiceV8.activateDevice({
					environmentId,
					username,
					deviceId,
					otp: 'ADMIN_ACTIVATION',
				});
			}

			// Mark device as recently changed for visual feedback
			setRecentlyChangedDevices((prev) => new Set(prev).add(deviceId));
			setTimeout(() => {
				setRecentlyChangedDevices((prev) => {
					const next = new Set(prev);
					next.delete(deviceId);
					return next;
				});
			}, 2000); // Remove highlight after 2 seconds

			toastV8.success('Device activated successfully using admin privileges');
			await loadDevices();
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to activate device`, error);
			toastV8.error(
				`Failed to activate device: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setProcessingDeviceId(null);
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
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
							User: <strong>{username}</strong>
						</p>
						{onUsernameChange && (
							<button
								type="button"
								onClick={onUsernameChange}
								style={{
									padding: '4px 8px',
									background: '#f3f4f6',
									color: '#374151',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
									fontSize: '12px',
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
								}}
								title="Change to a different user"
							>
								🔄 Change User
							</button>
						)}
					</div>
				</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'stretch',
						gap: '12px',
						flexWrap: 'wrap',
						justifyContent: 'flex-end',
					}}
				>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: '8px',
							minWidth: '260px',
						}}
					>
						{/* Bypass controls group */}
						<div
							style={{
								border: '1px solid #bfdbfe',
								background: '#eff6ff',
								borderRadius: '10px',
								padding: '8px',
								display: 'flex',
								flexWrap: 'wrap',
								gap: '8px',
								alignItems: 'center',
							}}
						>
							<div
								style={{
									width: '100%',
									fontSize: '11px',
									fontWeight: 600,
									textTransform: 'uppercase',
									letterSpacing: '0.06em',
									color: '#1d4ed8',
									marginBottom: '2px',
								}}
							>
								Bypass controls
							</div>
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
							<button
								type="button"
								onClick={() => setShowInfo((prev) => !prev)}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '4px',
									padding: '4px 8px',
									borderRadius: '4px',
									background: showInfo ? '#dbeafe' : '#eff6ff',
									color: '#1e40af',
									fontWeight: 500,
									cursor: 'pointer',
									fontSize: '12px',
									transition: 'all 0.2s ease',
									verticalAlign: 'middle',
									marginLeft: '6px',
								}}
							>
								<FiInfo size={14} />
								<span>{showInfo ? 'Hide guide' : 'What is this?'}</span>
							</button>
						</div>
					</div>
					<div>
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
						<li>
							Use <em>Refresh</em> to pull the latest devices directly from PingOne before making
							changes.
						</li>
						<li>Each card lists the factor type, nickname, contact details, and current status.</li>
						<li>
							Action buttons let you rename, block/unblock, or delete devices—mirroring what PingOne
							admins do in production.
						</li>
						<li>
							SMS/Email entries show the destination so you can confirm the correct phone or inbox
							is configured.
						</li>
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
						const lock = device.lock;
						const block = device.block;
						const isSecurityExpanded = expandedSecurityDevices.has(device.id);
						const isRawExpanded = expandedRawDevices.has(device.id);
						const securityStateLabel =
							lock?.status === 'LOCKED'
								? 'Locked'
								: block?.status === 'BLOCKED'
									? 'Blocked'
									: device.status || 'Unknown';
						const effectiveStatus =
							lock?.status === 'LOCKED'
								? 'LOCKED'
								: block?.status === 'BLOCKED'
									? 'BLOCKED'
									: device.status || 'UNKNOWN';
						const securityColor = getStatusColor(effectiveStatus);
						let securityBackground = '#e5e7eb';
						switch (effectiveStatus) {
							case 'LOCKED':
							case 'BLOCKED':
								securityBackground = '#fee2e2';
								break;
							case 'ACTIVE':
								securityBackground = '#dcfce7';
								break;
							case 'PENDING':
								securityBackground = '#fef3c7';
								break;
							default:
								securityBackground = '#e5e7eb';
						}
						const deviceIcon = getDeviceIcon(device.type);
						const targetSummary =
							device.type === 'SMS' || device.type === 'VOICE'
								? device.phone || ''
								: device.type === 'EMAIL'
									? device.email || ''
									: device.nickname || device.name || '';

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
										<div
											style={{
												marginBottom: '8px',
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												flexWrap: 'wrap',
											}}
										>
											<span style={{ fontSize: '20px' }}>{deviceIcon}</span>
											<span>
												<strong>{device.type}</strong>
												{targetSummary && (
													<span style={{ marginLeft: '8px', color: '#4b5563' }}>
														to {targetSummary}
													</span>
												)}
											</span>
										</div>
										{device.email && (
											<p style={{ margin: '4px 0' }}>
												<strong>Email:</strong> {device.email}
											</p>
										)}
										{device.phone && (
											<p style={{ margin: '4px 0' }}>
												<strong>Phone:</strong> {device.phone}
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
										<p style={{ margin: '4px 0' }}>
											<strong>Created:</strong>{' '}
											{device.createdAt ? new Date(device.createdAt).toLocaleString() : 'N/A'}
										</p>
										<p style={{ margin: '4px 0' }}>
											<strong>Updated:</strong>{' '}
											{device.updatedAt ? new Date(device.updatedAt).toLocaleString() : 'N/A'}
										</p>
										<div
											style={{
												marginTop: '8px',
												paddingTop: '8px',
												borderTop: '1px dashed #e5e7eb',
											}}
										>
											<button
												type="button"
												onClick={() => {
													setExpandedSecurityDevices((prev) => {
														const next = new Set(prev);
														if (next.has(device.id)) {
															next.delete(device.id);
														} else {
															next.add(device.id);
														}
														return next;
													});
												}}
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													width: '100%',
													padding: '6px 8px',
													borderRadius: '6px',
													border: '1px solid #e5e7eb',
													background: '#f9fafb',
													cursor: 'pointer',
												}}
											>
												<span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>
													Security state
												</span>
												<span
													style={{
														marginLeft: '8px',
														fontSize: '12px',
														fontWeight: 700,
														padding: '2px 8px',
														borderRadius: '999px',
														color: securityColor,
														backgroundColor: securityBackground,
													}}
												>
													{securityStateLabel}
												</span>
												<span style={{ marginLeft: '8px', fontSize: '11px', color: '#4b5563' }}>
													{isSecurityExpanded ? '▲' : '▼'}
												</span>
											</button>
											{isSecurityExpanded && (
												<div style={{ marginTop: '6px', fontSize: '12px' }}>
													{device.status && (
														<p style={{ margin: '2px 0' }}>
															<strong>Status:</strong> {device.status}
														</p>
													)}
													{typeof device.enabled !== 'undefined' && (
														<p style={{ margin: '2px 0' }}>
															<strong>Enabled:</strong> {String(device.enabled)}
														</p>
													)}
													{typeof device.active !== 'undefined' && (
														<p style={{ margin: '2px 0' }}>
															<strong>Active:</strong> {device.active ? 'Active' : 'Inactive'}
														</p>
													)}
													{lock?.status === 'LOCKED' && (
														<div style={{ margin: '4px 0', color: '#b91c1c' }}>
															<p style={{ margin: '2px 0' }}>
																<strong>Lock status:</strong> {lock.status}
															</p>
															{lock.expiresAt && (
																<p style={{ margin: '2px 0' }}>
																	<strong>Lock expires at:</strong>{' '}
																	{new Date(lock.expiresAt).toLocaleString()}
																</p>
															)}
															{lock.reason && (
																<p style={{ margin: '2px 0' }}>
																	<strong>Lock reason:</strong> {lock.reason}
																</p>
															)}
														</div>
													)}
													{block?.status === 'BLOCKED' && (
														<div style={{ margin: '4px 0', color: '#92400e' }}>
															<p style={{ margin: '2px 0' }}>
																<strong>Block status:</strong> {block.status}
															</p>
															{block.blockedAt && (
																<p style={{ margin: '2px 0' }}>
																	<strong>Blocked at:</strong>{' '}
																	{new Date(block.blockedAt).toLocaleString()}
																</p>
															)}
														</div>
													)}
												</div>
											)}
										</div>
										<div style={{ marginTop: '8px' }}>
											<button
												type="button"
												onClick={() => {
													setExpandedRawDevices((prev) => {
														const next = new Set(prev);
														if (next.has(device.id)) {
															next.delete(device.id);
														} else {
															next.add(device.id);
														}
														return next;
													});
												}}
												style={{
													marginTop: '4px',
													padding: '4px 8px',
													borderRadius: '6px',
													border: '1px solid #e5e7eb',
													background: '#f3f4f6',
													fontSize: '11px',
													cursor: 'pointer',
												}}
											>
												{isRawExpanded
													? 'Hide advanced details'
													: 'Show advanced details (raw JSON)'}
											</button>
											{isRawExpanded && (
												<div
													style={{
														marginTop: '6px',
														padding: '8px',
														borderRadius: '6px',
														background: '#111827',
														color: '#e5e7eb',
														fontSize: '11px',
														overflowX: 'auto',
													}}
												>
													<pre
														style={{
															margin: 0,
															whiteSpace: 'pre-wrap',
															wordBreak: 'break-word',
														}}
													>
														{JSON.stringify(device, null, 2)}
													</pre>
												</div>
											)}
										</div>
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

										{/* Unlock Device Button - Always visible */}
										<button
											type="button"
											onClick={() => handleUnlock(device.id)}
											disabled={isProcessing || lock?.status !== 'LOCKED'}
											style={{
												padding: '8px 16px',
												background:
													isProcessing || lock?.status !== 'LOCKED'
														? '#9ca3af'
														: wasRecentlyChanged && lock?.status === 'LOCKED'
															? '#2563eb'
															: '#3b82f6',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '13px',
												fontWeight: '500',
												cursor:
													isProcessing || lock?.status !== 'LOCKED' ? 'not-allowed' : 'pointer',
												opacity: isProcessing || lock?.status !== 'LOCKED' ? 0.5 : 1,
												transition: 'all 0.3s ease',
											}}
											title={
												isProcessing
													? 'Unlocking device...'
													: lock?.status === 'LOCKED'
														? 'Unlock device - Current status: LOCKED (locked due to too many failed attempts)'
														: 'Unlock device - Device is not locked'
											}
										>
											{isProcessing ? '⏳ Unlocking...' : '🔓 Unlock'}
										</button>

										{/* Block Device Button - Always visible */}
										<ButtonSpinner
											loading={isProcessing}
											onClick={() => handleBlock(device.id)}
											disabled={block?.status === 'BLOCKED' || device.status === 'BLOCKED'}
											spinnerSize={16}
											spinnerPosition="left"
											loadingText="Blocking..."
											style={{
												padding: '8px 16px',
												background:
													isProcessing || block?.status === 'BLOCKED' || device.status === 'BLOCKED'
														? '#9ca3af'
														: wasRecentlyChanged && isBlocked
															? '#ef4444'
															: '#f59e0b',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '13px',
												fontWeight: '500',
												cursor:
													isProcessing || block?.status === 'BLOCKED' || device.status === 'BLOCKED'
														? 'not-allowed'
														: 'pointer',
												opacity:
													isProcessing || block?.status === 'BLOCKED' || device.status === 'BLOCKED'
														? 0.5
														: 1,
												transition: 'all 0.3s ease',
												transform: wasRecentlyChanged && isBlocked ? 'scale(1.05)' : 'scale(1)',
											}}
											title={
												isProcessing
													? 'Blocking device...'
													: block?.status === 'BLOCKED' || device.status === 'BLOCKED'
														? 'Block device - Device is already blocked'
														: 'Block device - Current status: ACTIVE'
											}
										>
											{isProcessing ? '' : '🚫 Block'}
										</ButtonSpinner>

										{/* Unblock Device Button - Always visible */}
										<ButtonSpinner
											loading={isProcessing}
											onClick={() => handleUnblock(device.id)}
											disabled={block?.status !== 'BLOCKED' && device.status !== 'BLOCKED'}
											spinnerSize={16}
											spinnerPosition="left"
											loadingText="Unblocking..."
											style={{
												padding: '8px 16px',
												background:
													isProcessing ||
													(block?.status !== 'BLOCKED' && device.status !== 'BLOCKED')
														? '#9ca3af'
														: wasRecentlyChanged && isActive
															? '#10b981'
															: '#10b981',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '13px',
												fontWeight: '500',
												cursor:
													isProcessing ||
													(block?.status !== 'BLOCKED' && device.status !== 'BLOCKED')
														? 'not-allowed'
														: 'pointer',
												opacity:
													isProcessing ||
													(block?.status !== 'BLOCKED' && device.status !== 'BLOCKED')
														? 0.5
														: 1,
												transition: 'all 0.3s ease',
												transform: wasRecentlyChanged && isActive ? 'scale(1.05)' : 'scale(1)',
											}}
											title={
												isProcessing
													? 'Unblocking device...'
													: block?.status === 'BLOCKED' || device.status === 'BLOCKED'
														? 'Unblock device - Current status: BLOCKED'
														: 'Unblock device - Device is not blocked'
											}
										>
											{isProcessing ? '' : '✅ Unblock'}
										</ButtonSpinner>

										{/* Admin Activate Device Button - Show for devices that need activation */}
										{device.status === 'ACTIVATION_REQUIRED' && (
											<ButtonSpinner
												loading={isProcessing}
												onClick={() => handleAdminActivate(device.id)}
												spinnerSize={16}
												spinnerPosition="left"
												loadingText="Activating..."
												style={{
													padding: '8px 16px',
													background: isProcessing
														? '#9ca3af'
														: wasRecentlyChanged
															? '#8b5cf6'
															: '#8b5cf6',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													fontSize: '13px',
													fontWeight: '500',
													cursor: isProcessing ? 'not-allowed' : 'pointer',
													opacity: isProcessing ? 0.5 : 1,
													transition: 'all 0.3s ease',
													transform: wasRecentlyChanged ? 'scale(1.05)' : 'scale(1)',
												}}
												title={
													isProcessing
														? 'Activating device...'
														: 'Admin Activate - Activate device without user OTP (requires admin privileges)'
												}
											>
												{isProcessing ? '' : '👑 Admin Activate'}
											</ButtonSpinner>
										)}

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
