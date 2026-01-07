/**
 * @file DeviceFailureModalV8.tsx
 * @module v8/components
 * @description Modal component for displaying device failure errors (NO_USABLE_DEVICES)
 * @version 8.0.0
 * @since 2025-01-XX
 *
 * This component displays a user-friendly modal when device authentication fails
 * due to NO_USABLE_DEVICES errors, showing which devices are unavailable and why.
 */

import React from 'react';
import { FiAlertCircle, FiRefreshCw, FiUnlock, FiX } from 'react-icons/fi';

export interface UnavailableDevice {
	id: string;
	type?: string;
	status?: string;
	nickname?: string;
	reason?: string;
}

export interface DeviceFailureModalProps {
	isOpen: boolean;
	onClose: () => void;
	errorMessage: string;
	unavailableDevices: UnavailableDevice[];
	onUnlockDevice?: (deviceId: string) => void;
	onTryAnotherDevice?: () => void;
	onRetry?: () => void;
}

/**
 * Modal component for displaying device failure errors
 * Shows unavailable devices and provides actions to resolve the issue
 */
export const DeviceFailureModalV8: React.FC<DeviceFailureModalProps> = ({
	isOpen,
	onClose,
	errorMessage,
	unavailableDevices,
	onUnlockDevice,
	onTryAnotherDevice,
	onRetry,
}) => {
	// Handle ESC key to close modal
	React.useEffect(() => {
		if (!isOpen) return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	// Determine the primary reason for the failure
	const getFailureReason = (): string => {
		if (errorMessage.includes('locked') || errorMessage.includes('too many')) {
			return 'Device Locked';
		}
		if (errorMessage.includes('daily limit') || errorMessage.includes('limit exceeded')) {
			return 'Daily Limit Exceeded';
		}
		if (errorMessage.includes("Couldn't find authenticating device")) {
			return 'No Authenticating Device Found';
		}
		return 'Device Unavailable';
	};

	const failureReason = getFailureReason();

	// Get device type display name
	const getDeviceTypeDisplay = (type?: string): string => {
		if (!type) return 'Unknown';
		const typeMap: Record<string, string> = {
			SMS: '📱 SMS',
			EMAIL: '📧 Email',
			TOTP: '🔐 Authenticator App',
			FIDO2: '🔑 Passkey / Security Key',
			WHATSAPP: '💬 WhatsApp',
			VOICE: '📞 Voice',
		};
		return typeMap[type] || type;
	};

	// Get device status display
	const getDeviceStatusDisplay = (status?: string): string => {
		if (!status) return 'Unknown';
		const statusMap: Record<string, string> = {
			LOCKED: '🔒 Locked',
			BLOCKED: '🚫 Blocked',
			ACTIVATION_REQUIRED: '⏳ Activation Required',
			EXPIRED: '⏰ Expired',
			SUSPENDED: '⏸️ Suspended',
		};
		return statusMap[status] || status;
	};

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
		>
			<div
				style={{
					background: 'white',
					borderRadius: '16px',
					padding: '0',
					maxWidth: '600px',
					width: '90%',
					maxHeight: '90vh',
					overflow: 'auto',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
						padding: '24px 32px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						borderRadius: '16px 16px 0 0',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<FiAlertCircle size={24} color="white" />
						<h3
							style={{
								margin: 0,
								fontSize: '20px',
								fontWeight: '600',
								color: 'white',
							}}
						>
							Device Authentication Failed
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						style={{
							background: 'transparent',
							border: 'none',
							color: 'white',
							cursor: 'pointer',
							padding: '4px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
						aria-label="Close modal"
					>
						<FiX size={20} />
					</button>
				</div>

				{/* Content */}
				<div style={{ padding: '32px' }}>
					{/* Error Message */}
					<div
						style={{
							background: '#fef2f2',
							border: '1px solid #fecaca',
							borderRadius: '8px',
							padding: '16px',
							marginBottom: '24px',
						}}
					>
						<div
							style={{
								fontSize: '14px',
								fontWeight: '600',
								color: '#991b1b',
								marginBottom: '8px',
							}}
						>
							{failureReason}
						</div>
						<div style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: '1.5' }}>
							{errorMessage}
						</div>
					</div>

					{/* Unavailable Devices List */}
					{unavailableDevices.length > 0 && (
						<div style={{ marginBottom: '24px' }}>
							<h4
								style={{
									margin: '0 0 12px 0',
									fontSize: '16px',
									fontWeight: '600',
									color: '#374151',
								}}
							>
								Unavailable Devices ({unavailableDevices.length})
							</h4>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{unavailableDevices.map((device, index) => (
									<div
										key={device.id || index}
										style={{
											background: '#f9fafb',
											border: '1px solid #e5e7eb',
											borderRadius: '8px',
											padding: '12px',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<div style={{ flex: 1 }}>
											<div
												style={{
													fontSize: '14px',
													fontWeight: '500',
													color: '#111827',
													marginBottom: '4px',
												}}
											>
												{device.nickname || `Device ${index + 1}`}
											</div>
											<div
												style={{
													fontSize: '12px',
													color: '#6b7280',
													display: 'flex',
													gap: '12px',
													flexWrap: 'wrap',
												}}
											>
												{device.type && <span>{getDeviceTypeDisplay(device.type)}</span>}
												{device.status && <span>{getDeviceStatusDisplay(device.status)}</span>}
												{device.reason && <span>• {device.reason}</span>}
											</div>
											<div
												style={{
													fontSize: '11px',
													color: '#9ca3af',
													marginTop: '4px',
													fontFamily: 'monospace',
												}}
											>
												ID: {device.id.substring(0, 8)}...
											</div>
										</div>
										{device.status === 'LOCKED' && onUnlockDevice && (
											<button
												type="button"
												onClick={() => onUnlockDevice(device.id)}
												style={{
													background: '#3b82f6',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													padding: '6px 12px',
													fontSize: '12px',
													fontWeight: '500',
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'center',
													gap: '4px',
												}}
											>
												<FiUnlock size={14} />
												Unlock
											</button>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Help Text */}
					<div
						style={{
							background: '#eff6ff',
							border: '1px solid #bfdbfe',
							borderRadius: '8px',
							padding: '12px',
							marginBottom: '24px',
						}}
					>
						<div
							style={{
								fontSize: '13px',
								color: '#1e40af',
								lineHeight: '1.5',
							}}
						>
							<strong>What does this mean?</strong>
							<br />
							{failureReason === 'Device Locked' && (
								<>
									Your device has been temporarily locked due to too many failed authentication
									attempts. You can unlock it using the "Unlock" button above, or try again later.
								</>
							)}
							{failureReason === 'Daily Limit Exceeded' && (
								<>
									You've exceeded the daily limit for SMS authentication attempts. Please try again
									tomorrow or use a different authentication method.
								</>
							)}
							{failureReason === 'No Authenticating Device Found' && (
								<>
									No active devices were found for authentication. Please register a new device or
									contact your administrator.
								</>
							)}
							{![
								'Device Locked',
								'Daily Limit Exceeded',
								'No Authenticating Device Found',
							].includes(failureReason) && (
								<>
									One or more of your devices are temporarily unavailable. Please try another device
									or contact your administrator for assistance.
								</>
							)}
						</div>
					</div>

					{/* Action Buttons */}
					<div
						style={{
							display: 'flex',
							gap: '12px',
							justifyContent: 'flex-end',
							flexWrap: 'wrap',
						}}
					>
						{onRetry && (
							<button
								type="button"
								onClick={onRetry}
								style={{
									background: '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									padding: '10px 20px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								<FiRefreshCw size={16} />
								Retry
							</button>
						)}
						{onTryAnotherDevice && (
							<button
								type="button"
								onClick={onTryAnotherDevice}
								style={{
									background: '#10b981',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									padding: '10px 20px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								Try Another Device
							</button>
						)}
						<button
							type="button"
							onClick={onClose}
							style={{
								background: '#f3f4f6',
								color: '#374151',
								border: 'none',
								borderRadius: '8px',
								padding: '10px 20px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
							}}
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
