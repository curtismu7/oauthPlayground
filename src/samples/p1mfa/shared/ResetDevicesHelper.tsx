/**
 * @file ResetDevicesHelper.tsx
 * @module samples/p1mfa/shared
 * @description Admin helper to reset/delete all user devices (admin-only)
 * @version 1.0.0
 */

import React, { useState } from 'react';
import type { P1MFASDK, Device } from '@/sdk/p1mfa';

interface ResetDevicesHelperProps {
	sdk: P1MFASDK | null;
	userId: string;
	onDevicesReset?: () => void;
}

export const ResetDevicesHelper: React.FC<ResetDevicesHelperProps> = ({
	sdk,
	userId,
	onDevicesReset,
}) => {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{ success: boolean; message: string; deleted: number } | null>(
		null
	);

	const handleReset = async () => {
		if (!sdk || !userId) return;

		if (
			!confirm(
				`Are you sure you want to delete ALL MFA devices for user ${userId}? This action cannot be undone.`
			)
		) {
			return;
		}

		setLoading(true);
		setResult(null);

		try {
			// Get all devices
			const devices = await sdk.listDevices(userId);
			let deleted = 0;
			const errors: string[] = [];

			// Delete each device
			for (const device of devices) {
				try {
					await sdk.deleteDevice(userId, device.id);
					deleted++;
				} catch (error) {
					errors.push(`Failed to delete ${device.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
				}
			}

			if (errors.length > 0) {
				setResult({
					success: false,
					message: `Deleted ${deleted} of ${devices.length} devices. Errors: ${errors.join(', ')}`,
					deleted,
				});
			} else {
				setResult({
					success: true,
					message: `Successfully deleted ${deleted} device(s)`,
					deleted,
				});
			}

			onDevicesReset?.();
		} catch (error) {
			setResult({
				success: false,
				message: `Failed to reset devices: ${error instanceof Error ? error.message : 'Unknown error'}`,
				deleted: 0,
			});
		} finally {
			setLoading(false);
		}
	};

	if (!sdk || !userId) {
		return null;
	}

	return (
		<div
			style={{
				marginTop: '1rem',
				padding: '1rem',
				backgroundColor: '#fff3cd',
				border: '1px solid #ffc107',
				borderRadius: '4px',
			}}
		>
			<h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
				⚠️ Admin Helper: Reset User Devices
			</h4>
			<p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#856404' }}>
				Delete all MFA devices for this user. Use with caution - this action cannot be undone.
			</p>
			<button
				onClick={handleReset}
				disabled={loading}
				style={{
					padding: '0.5rem 1rem',
					backgroundColor: '#dc3545',
					color: 'white',
					border: 'none',
					borderRadius: '4px',
					cursor: loading ? 'not-allowed' : 'pointer',
					opacity: loading ? 0.5 : 1,
					fontSize: '0.875rem',
				}}
			>
				{loading ? 'Deleting...' : 'Delete All Devices'}
			</button>
			{result && (
				<div
					style={{
						marginTop: '0.75rem',
						padding: '0.75rem',
						backgroundColor: result.success ? '#d4edda' : '#f8d7da',
						border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
						borderRadius: '4px',
						color: result.success ? '#155724' : '#721c24',
						fontSize: '0.875rem',
					}}
				>
					{result.message}
				</div>
			)}
		</div>
	);
};
