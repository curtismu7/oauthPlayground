/**
 * @file DeviceManagementSectionV8.tsx
 * @module v8/components/sections
 * @description Device Management Section Component
 * @version 3.0.0
 * 
 * Extracted from MFAAuthenticationMainPageV8.tsx as part of V3 refactoring.
 * This component handles the device management UI including:
 * - Device list display
 * - Device selection
 * - Device refresh
 * - Loading states
 * - Error handling
 */

import React from 'react';
import type { UseMFADevicesReturn } from '@/v8/hooks/useMFADevices';

export interface DeviceManagementSectionProps {
	/** MFA devices hook return value */
	mfaDevices: UseMFADevicesReturn;
	/** Callback when refresh devices is clicked */
	onRefreshDevices?: () => Promise<void>;
	/** Show device details */
	showDetails?: boolean;
}

/**
 * Device Management Section Component
 * Displays device list and management controls
 */
export const DeviceManagementSectionV8: React.FC<DeviceManagementSectionProps> = ({
	mfaDevices,
	onRefreshDevices,
	showDetails = true,
}) => {
	return (
		<div
			style={{
				background: 'white',
				borderRadius: '8px',
				padding: '24px',
				marginBottom: '24px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				border: '1px solid #e5e7eb',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '20px',
				}}
			>
				<h2
					style={{
						fontSize: '18px',
						fontWeight: '600',
						color: '#1f2937',
						margin: 0,
					}}
				>
					📱 Device Management
				</h2>
				<button
					type="button"
					onClick={onRefreshDevices}
					disabled={mfaDevices.isLoading}
					style={{
						padding: '8px 16px',
						border: '1px solid #d1d5db',
						borderRadius: '6px',
						background: 'white',
						color: '#374151',
						cursor: mfaDevices.isLoading ? 'not-allowed' : 'pointer',
						fontWeight: '500',
						fontSize: '14px',
						transition: 'all 0.2s ease',
						opacity: mfaDevices.isLoading ? 0.6 : 1,
					}}
				>
					{mfaDevices.isLoading ? '⏳ Loading...' : '🔄 Refresh'}
				</button>
			</div>

			{/* Loading State */}
			{mfaDevices.isLoading && (
				<div
					style={{
						padding: '40px 20px',
						textAlign: 'center',
						color: '#6b7280',
					}}
				>
					<div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
					<p style={{ margin: 0, fontSize: '14px' }}>Loading devices...</p>
				</div>
			)}

			{/* Error State */}
			{mfaDevices.error && !mfaDevices.isLoading && (
				<div
					style={{
						padding: '16px',
						background: '#fef2f2',
						border: '1px solid #dc2626',
						borderRadius: '6px',
						marginBottom: '16px',
					}}
				>
					<p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>
						⚠️ {mfaDevices.error}
					</p>
				</div>
			)}

			{/* No Devices State */}
			{!mfaDevices.isLoading && !mfaDevices.error && !mfaDevices.hasDevices && (
				<div
					style={{
						padding: '40px 20px',
						textAlign: 'center',
						color: '#6b7280',
					}}
				>
					<div style={{ fontSize: '32px', marginBottom: '12px' }}>📱</div>
					<p style={{ margin: 0, fontSize: '14px' }}>No devices found</p>
					<p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
						Devices will appear here once loaded
					</p>
				</div>
			)}

			{/* Devices List */}
			{!mfaDevices.isLoading && mfaDevices.hasDevices && (
				<div>
					<div
						style={{
							padding: '12px 16px',
							background: '#f0fdf4',
							border: '1px solid #10b981',
							borderRadius: '6px',
							marginBottom: '16px',
						}}
					>
						<p style={{ fontSize: '14px', color: '#065f46', margin: 0 }}>
							✅ {mfaDevices.deviceCount} device{mfaDevices.deviceCount !== 1 ? 's' : ''} loaded
						</p>
					</div>

					{showDetails && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
							{mfaDevices.devices.map((device, index) => {
								const deviceType = (device.type as string) || 'UNKNOWN';
								const deviceName = (device.name as string) || `Device ${index + 1}`;
								const deviceStatus = (device.status as string) || 'UNKNOWN';
								const isSelected = mfaDevices.selectedDevice?.id === device.id;

								return (
									<div
										key={device.id as string || index}
										onClick={() => mfaDevices.selectDevice(device)}
										style={{
											padding: '16px',
											border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
											borderRadius: '8px',
											background: isSelected ? '#eff6ff' : 'white',
											cursor: 'pointer',
											transition: 'all 0.2s ease',
										}}
									>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'flex-start',
											}}
										>
											<div style={{ flex: 1 }}>
												<div
													style={{
														fontSize: '15px',
														fontWeight: '600',
														color: '#1f2937',
														marginBottom: '4px',
													}}
												>
													{deviceName}
												</div>
												<div
													style={{
														fontSize: '13px',
														color: '#6b7280',
														marginBottom: '8px',
													}}
												>
													Type: {deviceType}
												</div>
												<div
													style={{
														display: 'inline-block',
														padding: '4px 8px',
														borderRadius: '4px',
														fontSize: '12px',
														fontWeight: '500',
														background:
															deviceStatus === 'ACTIVE'
																? '#d1fae5'
																: deviceStatus === 'ACTIVATION_REQUIRED'
																	? '#fef3c7'
																	: '#f3f4f6',
														color:
															deviceStatus === 'ACTIVE'
																? '#065f46'
																: deviceStatus === 'ACTIVATION_REQUIRED'
																	? '#92400e'
																	: '#6b7280',
													}}
												>
													{deviceStatus}
												</div>
											</div>
											{isSelected && (
												<div
													style={{
														fontSize: '20px',
														color: '#3b82f6',
													}}
												>
													✓
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default DeviceManagementSectionV8;
