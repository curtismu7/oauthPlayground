/**
 * @file MFADeviceSelector.tsx
 * @module v8/flows/components
 * @description Reusable device selector component for MFA flows
 * @version 8.2.0
 */

import React from 'react';
import type { DeviceType } from '../shared/MFATypes';

export interface Device {
	id: string;
	type: string;
	nickname?: string;
	name?: string;
	phone?: string;
	email?: string;
	status?: string;
}

export interface MFADeviceSelectorProps {
	devices: Device[];
	loading: boolean;
	selectedDeviceId: string;
	deviceType: DeviceType;
	onSelectDevice: (deviceId: string) => void;
	onSelectNew: () => void;
	onUseSelected?: () => void;
	renderDeviceInfo?: (device: Device) => React.ReactNode;
}

const DEVICE_ICONS: Record<DeviceType, string> = {
	SMS: '📱',
	EMAIL: '📧',
	TOTP: '🔐',
	FIDO2: '🔑',
};

export const MFADeviceSelector: React.FC<MFADeviceSelectorProps> = ({
	devices,
	loading,
	selectedDeviceId,
	deviceType,
	onSelectDevice,
	onSelectNew,
	onUseSelected,
	renderDeviceInfo,
}) => {
	if (loading) {
		return (
			<div className="info-box" style={{ textAlign: 'center', padding: '10px' }}>
				<p>🔄 Loading existing devices...</p>
			</div>
		);
	}

	return (
		<>
			{devices.length > 0 && (
				<div style={{ marginBottom: '10px' }}>
					<h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
						Existing {deviceType} Devices
					</h3>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: '0',
							marginBottom: '0',
						}}
					>
						{devices.map((device, index) => {
							const borderColor = selectedDeviceId === device.id ? '#10b981' : '#e5e7eb';
							return (
								<div
									role="button"
									tabIndex={0}
									key={device.id}
									onClick={() => onSelectDevice(device.id)}
									style={{
										padding: '8px 12px',
										borderLeft: `1px solid ${borderColor}`,
										borderRight: `1px solid ${borderColor}`,
										borderTop: index === 0 ? `1px solid ${borderColor}` : 'none',
										borderBottom: `1px solid ${borderColor}`,
										borderRadius: '0',
										background: selectedDeviceId === device.id ? '#f0fdf4' : 'white',
										cursor: 'pointer',
										transition: 'all 0.2s',
										marginBottom: '0',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										<input
											type="radio"
											checked={selectedDeviceId === device.id}
											onChange={() => onSelectDevice(device.id)}
											style={{ margin: 0 }}
										/>
										<span style={{ fontSize: '16px' }}>{DEVICE_ICONS[deviceType]}</span>
										<div style={{ flex: 1 }}>
											<div style={{ fontWeight: '600', marginBottom: '2px', fontSize: '13px' }}>
												{device.nickname || device.name || 'Unnamed Device'}
											</div>
											<div style={{ fontSize: '11px', color: '#6b7280' }}>
												{renderDeviceInfo ? (
													renderDeviceInfo(device)
												) : (
													<>
														{device.phone && `Phone: ${device.phone}`}
														{device.email && `Email: ${device.email}`}
														{device.status && ` • Status: ${device.status}`}
													</>
												)}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{selectedDeviceId && selectedDeviceId !== 'new' && onUseSelected && (
						<button
							type="button"
							className="btn btn-primary"
							onClick={onUseSelected}
							style={{ marginBottom: '10px' }}
						>
							Use Selected Device
						</button>
					)}
				</div>
			)}

			<div style={{ marginBottom: '10px' }}>
				<div
					role="button"
					tabIndex={0}
					onClick={onSelectNew}
					style={{
						padding: '8px 12px',
						border: `2px dashed ${selectedDeviceId === 'new' ? '#10b981' : '#d1d5db'}`,
						borderRadius: '6px',
						background: selectedDeviceId === 'new' ? '#f0fdf4' : '#f9fafb',
						cursor: 'pointer',
						transition: 'all 0.2s',
						marginBottom: selectedDeviceId === 'new' ? '10px' : '0',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<input
							type="radio"
							checked={selectedDeviceId === 'new'}
							onChange={onSelectNew}
							style={{ margin: 0 }}
						/>
						<span style={{ fontSize: '20px' }}>➕</span>
						<span style={{ fontWeight: '600' }}>Register New Device</span>
					</div>
				</div>
			</div>
		</>
	);
};
