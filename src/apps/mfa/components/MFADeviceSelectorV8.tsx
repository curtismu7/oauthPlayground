/**
 * @file MFADeviceSelectorV8.tsx
 * @module v8/components
 * @description Device selector for MFA flow - shows existing devices and allows selection or registration
 * @version 8.0.0
 * @since 2024-11-23
 */

import React from 'react';

const MODULE_TAG = '[📱 MFA-DEVICE-SELECTOR-V8]';

interface Device {
	id: string;
	type: string;
	nickname?: string;
	status: string;
	phone?: string;
	email?: string;
	[key: string]: unknown;
}

interface MFADeviceSelectorV8Props {
	devices: Array<Record<string, unknown>>;
	loading: boolean;
	selectedDeviceId: string; // 'new' or actual deviceId
	onSelectDevice: (deviceId: string) => void;
	onUseDevice: () => void;
	onRegisterNew: () => void;
	deviceType: string;
	disabled?: boolean;
}

export const MFADeviceSelectorV8: React.FC<MFADeviceSelectorV8Props> = ({
	devices,
	loading,
	selectedDeviceId,
	onSelectDevice,
	onUseDevice,
	onRegisterNew,
	deviceType,
	disabled = false,
}) => {
	console.log(`${MODULE_TAG} Rendering device selector`, {
		deviceCount: devices.length,
		loading,
		selectedDeviceId,
	});

	const getDeviceIcon = (type: string): string => {
		switch (type) {
			case 'SMS':
				return '📱';
			case 'EMAIL':
				return '📧';
			case 'TOTP':
				return '🔐';
			case 'FIDO2':
				return '🔑';
			default:
				return '📱';
		}
	};

	if (loading) {
		return (
			<div
				style={{
					padding: '20px',
					textAlign: 'center',
					background: '#f9fafb', // Light grey background
					borderRadius: '8px',
					marginBottom: '16px',
				}}
			>
				<p
					style={{
						margin: 0,
						fontSize: '14px',
						color: '#6b7280' /* Dark text on light background */,
					}}
				>
					🔄 Loading existing devices...
				</p>
			</div>
		);
	}

	return (
		<div style={{ marginBottom: '20px' }}>
			{devices.length > 0 && (
				<>
					<h3
						style={{
							fontSize: '16px',
							fontWeight: '600',
							marginBottom: '12px',
							color: '#1f2937' /* Dark text on light background */,
						}}
					>
						Existing Devices ({devices.length})
					</h3>
					<div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
						{devices.map((device) => {
							const dev = device as Device;
							const isSelected = selectedDeviceId === dev.id;

							return (
								<button
									key={dev.id}
									type="button"
									onClick={() => !disabled && onSelectDevice(dev.id)}
									disabled={disabled}
									style={{
										padding: '16px',
										background: isSelected ? '#dbeafe' /* Light blue */ : 'white',
										border: `2px solid ${isSelected ? '#3b82f6' /* Blue */ : '#e5e7eb' /* Grey */}`,
										borderRadius: '8px',
										cursor: disabled ? 'not-allowed' : 'pointer',
										transition: 'all 0.2s ease',
										textAlign: 'left',
										width: '100%',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										<div
											style={{
												width: '20px',
												height: '20px',
												borderRadius: '50%',
												border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
												background: isSelected ? '#3b82f6' : 'white',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexShrink: 0,
											}}
										>
											{isSelected && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
										</div>
										<div style={{ flex: 1 }}>
											<div
												style={{
													fontSize: '14px',
													fontWeight: '600',
													color: '#1f2937' /* Dark text on light background */,
													marginBottom: '4px',
												}}
											>
												{getDeviceIcon(dev.type)} {dev.nickname || dev.type}
											</div>
											<div style={{ fontSize: '12px', color: '#6b7280' /* Grey text */ }}>
												Type: {dev.type} • Status: {dev.status}
											</div>
											{dev.phone && (
												<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
													Phone: {dev.phone}
												</div>
											)}
											{dev.email && (
												<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
													Email: {dev.email}
												</div>
											)}
										</div>
									</div>
								</button>
							);
						})}
					</div>
				</>
			)}

			{/* No Devices Message */}
			{devices.length === 0 && (
				<div
					style={{
						padding: '16px',
						background: '#f9fafb' /* Light grey */,
						border: '1px solid #e5e7eb',
						borderRadius: '8px',
						marginBottom: '16px',
					}}
				>
					<p
						style={{
							margin: 0,
							fontSize: '14px',
							color: '#6b7280' /* Dark text on light background */,
						}}
					>
						No existing devices found. Register a new device below.
					</p>
				</div>
			)}

			{/* Register New Device Option */}
			<button
				type="button"
				onClick={() => !disabled && onRegisterNew()}
				disabled={disabled}
				style={{
					padding: '16px',
					background: selectedDeviceId === 'new' ? '#dbeafe' /* Light blue */ : 'white',
					border: `2px dashed ${selectedDeviceId === 'new' ? '#3b82f6' /* Blue */ : '#d1d5db' /* Grey */}`,
					borderRadius: '8px',
					cursor: disabled ? 'not-allowed' : 'pointer',
					transition: 'all 0.2s ease',
					textAlign: 'center',
					width: '100%',
				}}
			>
				<div style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' /* Blue */ }}>
					➕ Register New Device
				</div>
				<div style={{ fontSize: '12px', color: '#6b7280' /* Grey */, marginTop: '4px' }}>
					Add a new {deviceType} device
				</div>
			</button>

			{/* Use Selected Device Button */}
			{selectedDeviceId && selectedDeviceId !== 'new' && (
				<div style={{ marginTop: '16px' }}>
					<button
						type="button"
						className="btn btn-primary"
						onClick={onUseDevice}
						disabled={disabled}
						style={{
							width: '100%',
							padding: '12px 24px',
							background: disabled ? '#d1d5db' : '#10b981' /* Green */,
							color: 'white' /* Light text on dark background */,
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '500',
							cursor: disabled ? 'not-allowed' : 'pointer',
						}}
					>
						{disabled ? '⚠️ Worker Token Required' : 'Use Selected Device'}
					</button>
				</div>
			)}
		</div>
	);
};

export default MFADeviceSelectorV8;
