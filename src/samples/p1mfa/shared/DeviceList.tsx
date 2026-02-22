/**
 * @file DeviceList.tsx
 * @module samples/p1mfa/shared
 * @description Display list of user's MFA devices
 * @version 1.0.0
 */

import React from 'react';
import type { Device } from '@/sdk/p1mfa';

interface DeviceListProps {
	devices: Device[];
	onDelete?: (deviceId: string) => void;
	loading?: boolean;
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices, onDelete, loading }) => {
	if (loading) {
		return <div>Loading devices...</div>;
	}

	if (devices.length === 0) {
		return (
			<div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
				No devices registered
			</div>
		);
	}

	return (
		<div style={{ marginTop: '1rem' }}>
			<h3 style={{ marginBottom: '1rem' }}>Registered Devices</h3>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
				{devices.map((device) => (
					<div
						key={device.id}
						style={{
							padding: '1rem',
							border: '1px solid #ddd',
							borderRadius: '4px',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<div>
							<div style={{ fontWeight: 'bold' }}>
								{device.nickname || device.name || 'Unnamed Device'}
							</div>
							<div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
								Type: {device.type} | Status: {device.status}
							</div>
							{device.phone && (
								<div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Phone: {device.phone}</div>
							)}
							{device.email && (
								<div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Email: {device.email}</div>
							)}
						</div>
						{onDelete && (
							<button
								type="button"
								onClick={() => onDelete(device.id)}
								style={{
									padding: '0.5rem 1rem',
									backgroundColor: '#dc3545',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: 'pointer',
								}}
							>
								Delete
							</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
};
