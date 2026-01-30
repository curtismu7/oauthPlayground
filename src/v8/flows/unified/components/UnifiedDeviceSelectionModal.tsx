/**
 * @file UnifiedDeviceSelectionModal.tsx
 * @module v8/flows/unified/components
 * @description Modern device selection modal for MFA authentication
 * @version 9.2.2
 * @since 2026-01-30
 *
 * Purpose: Allow users to select which MFA device to authenticate with
 * Shows all registered devices with their types and status
 */

import React, { useState, useEffect } from 'react';
import { colors, spacing } from '@/v8/styles/designTokens';

interface Device {
	id: string;
	type: 'SMS' | 'EMAIL' | 'TOTP' | 'VOICE' | 'FIDO2' | 'MOBILE' | 'WHATSAPP';
	deviceName?: string;
	nickname?: string;
	status: 'ACTIVE' | 'ACTIVATION_REQUIRED' | 'DISABLED';
}

interface UnifiedDeviceSelectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onDeviceSelect: (device: Device) => void;
	username: string;
	environmentId: string;
	loading?: boolean;
	error?: string;
}

const DEVICE_ICONS = {
	SMS: '📱',
	EMAIL: '📧',
	TOTP: '🔐',
	VOICE: '📞',
	FIDO2: '🔑',
	MOBILE: '📲',
	WHATSAPP: '💬',
};

const DEVICE_COLORS = {
	SMS: colors.primary[600],
	EMAIL: colors.success[600],
	TOTP: colors.purple[600],
	VOICE: colors.warning[600],
	FIDO2: colors.info[600],
	MOBILE: colors.primary[500],
	WHATSAPP: colors.success[500],
};

const STATUS_BADGES = {
	ACTIVE: { text: 'Active', color: colors.success[600], bg: colors.success[50] },
	ACTIVATION_REQUIRED: { text: 'Activation Required', color: colors.warning[600], bg: colors.warning[50] },
	DISABLED: { text: 'Disabled', color: colors.gray[600], bg: colors.gray[50] },
};

export const UnifiedDeviceSelectionModal: React.FC<UnifiedDeviceSelectionModalProps> = ({
	isOpen,
	onClose,
	onDeviceSelect,
	username,
	environmentId,
	loading = false,
	error = null,
}) => {
	const [devices, setDevices] = useState<Device[]>([]);
	const [searchQuery, setSearchQuery] = useState('');

	// Mock device data - in real implementation, this would come from API
	useEffect(() => {
		if (isOpen && username && environmentId) {
			// Simulate API call to get user's devices
			setTimeout(() => {
				const mockDevices: Device[] = [
					{
						id: 'device-1',
						type: 'SMS',
						deviceName: 'iPhone 15 Pro',
						nickname: 'My Phone',
						status: 'ACTIVE',
					},
					{
						id: 'device-2',
						type: 'EMAIL',
						deviceName: 'Gmail Account',
						nickname: 'Work Email',
						status: 'ACTIVE',
					},
					{
						id: 'device-3',
						type: 'TOTP',
						deviceName: 'Google Authenticator',
						nickname: 'Authenticator App',
						status: 'ACTIVE',
					},
					{
						id: 'device-4',
						type: 'FIDO2',
						deviceName: 'YubiKey 5',
						nickname: 'Security Key',
						status: 'ACTIVE',
					},
				];
				setDevices(mockDevices);
			}, 1000);
		}
	}, [isOpen, username, environmentId]);

	// Filter devices based on search query
	const filteredDevices = devices.filter(device =>
		device.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
		device.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
		device.type.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Only show active devices for authentication
	const availableDevices = filteredDevices.filter(device => device.status === 'ACTIVE');

	const handleDeviceSelect = (device: Device) => {
		onDeviceSelect(device);
		onClose();
	};

	if (!isOpen) return null;

	return (
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
				zIndex: 1000,
			}}
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === 'Escape') {
					onClose();
				}
			}}
			role="dialog"
			aria-modal="true"
			>
			<div
				style={{
					background: 'white',
					borderRadius: '16px',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
					maxWidth: '600px',
					width: '90%',
					maxHeight: '80vh',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						padding: spacing[6],
						borderBottom: `1px solid ${colors.gray[200]}`,
					}}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
						<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: colors.gray[900] }}>
							🔓 Select Authentication Device
						</h2>
						<button
							type="button"
							onClick={onClose}
							style={{
								background: 'none',
								border: 'none',
								fontSize: '24px',
								color: colors.gray[400],
								cursor: 'pointer',
								padding: '0',
								lineHeight: 1,
							}}
						>
							×
						</button>
					</div>
					
					<div style={{ fontSize: '14px', color: colors.gray[600], lineHeight: 1.5 }}>
						Choose which MFA device to authenticate with for <strong>{username}</strong>
					</div>

					{/* Search */}
					<div style={{ marginTop: spacing[4] }}>
						<input
							type="text"
							placeholder="Search devices..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							style={{
								width: '100%',
								padding: spacing[3],
								border: `1px solid ${colors.gray[300]}`,
								borderRadius: '8px',
								fontSize: '14px',
								boxSizing: 'border-box',
							}}
						/>
					</div>
				</div>

				{/* Content */}
				<div
					style={{
						flex: 1,
						padding: spacing[6],
						overflowY: 'auto',
					}}
				>
					{loading ? (
						<div style={{ textAlign: 'center', padding: spacing[8] }}>
							<div style={{ fontSize: '32px', marginBottom: spacing[4] }}>⏳</div>
							<p style={{ color: colors.gray[600] }}>Loading your devices...</p>
						</div>
					) : error ? (
						<div style={{ textAlign: 'center', padding: spacing[8] }}>
							<div style={{ fontSize: '32px', marginBottom: spacing[4], color: colors.error[500] }}>⚠️</div>
							<p style={{ color: colors.error[600] }}>{error}</p>
						</div>
					) : availableDevices.length === 0 ? (
						<div style={{ textAlign: 'center', padding: spacing[8] }}>
							<div style={{ fontSize: '32px', marginBottom: spacing[4] }}>📱</div>
							<p style={{ color: colors.gray[600] }}>
								No active MFA devices found. Please register a device first.
							</p>
						</div>
					) : (
						<div style={{ display: 'grid', gap: spacing[4] }}>
							{availableDevices.map((device) => (
								<div
									key={device.id}
									onClick={() => handleDeviceSelect(device)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											handleDeviceSelect(device);
										}
									}}
									style={{
										padding: spacing[4],
										border: `2px solid ${colors.gray[200]}`,
										borderRadius: '12px',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
										display: 'flex',
										alignItems: 'center',
										gap: spacing[4],
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.borderColor = DEVICE_COLORS[device.type];
										e.currentTarget.style.backgroundColor = colors.gray[50];
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.borderColor = colors.gray[200];
										e.currentTarget.style.backgroundColor = 'white';
									}}
									role="button"
									tabIndex={0}
								>
									{/* Device Icon */}
									<div
										style={{
											fontSize: '32px',
											width: '48px',
											height: '48px',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											background: `${DEVICE_COLORS[device.type]}15`,
											borderRadius: '8px',
										}}
									>
										{DEVICE_ICONS[device.type]}
									</div>

									{/* Device Info */}
									<div style={{ flex: 1 }}>
										<div style={{ fontWeight: '600', color: colors.gray[900], marginBottom: spacing[1] }}>
											{device.nickname || device.deviceName || `${device.type} Device`}
										</div>
										<div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
											<span
												style={{
													fontSize: '12px',
													color: colors.gray[600],
													background: `${DEVICE_COLORS[device.type]}15`,
													padding: '2px 6px',
													borderRadius: '4px',
												}}
											>
												{device.type}
											</span>
											<span
												style={{
													fontSize: '12px',
													padding: '2px 6px',
													borderRadius: '4px',
													background: STATUS_BADGES[device.status].bg,
													color: STATUS_BADGES[device.status].color,
												}}
											>
												{STATUS_BADGES[device.status].text}
											</span>
										</div>
									</div>

									{/* Arrow */}
									<div style={{ color: colors.gray[400] }}>
										→
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div
					style={{
						padding: spacing[6],
						borderTop: `1px solid ${colors.gray[200]}`,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<div style={{ fontSize: '12px', color: colors.gray[500] }}>
						{availableDevices.length} device{availableDevices.length !== 1 ? 's' : ''} available
					</div>
					<button
						type="button"
						onClick={onClose}
						style={{
							padding: `${spacing[2]} ${spacing[4]}`,
							background: colors.gray[100],
							border: `1px solid ${colors.gray[300]}`,
							borderRadius: '6px',
							color: colors.gray[700],
							fontSize: '14px',
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};
