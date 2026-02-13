/**
 * @file DeviceLimitErrorModalV8.tsx
 * @module v8/components
 * @description Modal for device limit errors with navigation to device management
 * @version 8.0.0
 * @since 2026-02-06
 */

import React from 'react';
import { FiAlertTriangle, FiExternalLink, FiTrash2 } from 'react-icons/fi';

const MODULE_TAG = '[🚫 DEVICE-LIMIT-MODAL-V8]';

export interface DeviceLimitErrorModalV8Props {
	/** Whether the modal is open */
	isOpen: boolean;
	/** Callback when modal is closed */
	onClose: () => void;
	/** Callback when user clicks to delete devices */
	onDeleteDevicesClick: () => void;
	/** Current device count */
	deviceCount: number;
	/** Maximum allowed devices */
	maxDevices: number;
}

export const DeviceLimitErrorModalV8: React.FC<DeviceLimitErrorModalV8Props> = ({
	isOpen,
	onClose,
	onDeleteDevicesClick,
	deviceCount,
	maxDevices,
}) => {
	const handleDeleteDevices = () => {
		console.log(`${MODULE_TAG} User clicked to delete devices`);
		onClose();
		onDeleteDevicesClick();
	};

	const handleManageDevices = () => {
		console.log(`${MODULE_TAG} User clicked to manage devices`);
		onClose();
		onDeleteDevicesClick();
	};

	if (!isOpen) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
		>
			<div
				role="document"
				style={{
					backgroundColor: 'white',
					borderRadius: '8px',
					padding: '24px',
					maxWidth: '400px',
					width: '90%',
					boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
				}}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						e.stopPropagation();
						onClose();
					}
				}}
			>
				{/* Header */}
				<div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
					<FiAlertTriangle
						style={{
							color: '#dc2626',
							fontSize: '24px',
							marginRight: '12px',
						}}
					/>
					<h2 id="modal-title" style={{ margin: 0, color: '#1f2937', fontSize: '18px' }}>
						Device Limit Reached
					</h2>
				</div>

				{/* Error Message */}
				<div style={{ marginBottom: '20px' }}>
					<p style={{ margin: '0 0 12px 0', color: '#4b5563', lineHeight: '1.5' }}>
						You have reached the maximum number of registered devices ({deviceCount}/{maxDevices}).
					</p>
					<p
						style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}
					>
						To register a new device, you must first delete some existing devices.
					</p>
				</div>

				{/* Device Count Display */}
				<div
					style={{
						backgroundColor: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '6px',
						padding: '12px',
						marginBottom: '20px',
					}}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<span style={{ color: '#991b1b', fontWeight: '500' }}>Current Devices:</span>
						<span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '16px' }}>
							{deviceCount} / {maxDevices}
						</span>
					</div>
				</div>

				{/* Action Buttons */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
					<button
						type="button"
						onClick={handleDeleteDevices}
						style={{
							backgroundColor: '#dc2626',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							padding: '12px 16px',
							fontSize: '14px',
							fontWeight: '500',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
							transition: 'background-color 0.2s',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.backgroundColor = '#b91c1c';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.backgroundColor = '#dc2626';
						}}
						onFocus={(e) => {
							e.currentTarget.style.backgroundColor = '#b91c1c';
						}}
						onBlur={(e) => {
							e.currentTarget.style.backgroundColor = '#dc2626';
						}}
					>
						<FiTrash2 size={16} />
						Delete Devices to Continue
					</button>

					<button
						type="button"
						onClick={handleManageDevices}
						style={{
							backgroundColor: '#f3f4f6',
							color: '#374151',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							padding: '12px 16px',
							fontSize: '14px',
							fontWeight: '500',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
							transition: 'background-color 0.2s',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.backgroundColor = '#e5e7eb';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.backgroundColor = '#f3f4f6';
						}}
						onFocus={(e) => {
							e.currentTarget.style.backgroundColor = '#e5e7eb';
						}}
						onBlur={(e) => {
							e.currentTarget.style.backgroundColor = '#f3f4f6';
						}}
					>
						<FiExternalLink size={16} />
						Manage Devices
					</button>
				</div>

				{/* Cancel Button */}
				<button
					type="button"
					onClick={onClose}
					style={{
						backgroundColor: 'transparent',
						color: '#6b7280',
						border: 'none',
						padding: '8px 12px',
						fontSize: '14px',
						cursor: 'pointer',
						marginTop: '8px',
						alignSelf: 'flex-start',
					}}
				>
					Cancel
				</button>
			</div>
		</div>
	);
};
