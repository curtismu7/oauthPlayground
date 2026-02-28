/**
 * @file MFADeviceSelectionInfoModal.tsx
 * @module v8/flows/components/modals
 * @description Info modal explaining Device Selection Behavior options
 * @version 8.3.0
 * @since 2025-01-19
 *
 * Phase 3: Modal Extraction - Device Selection Info Modal
 * Extracted from MFAAuthenticationMainPageV8.tsx lines 6075-6295
 */

import React from 'react';
import { FiX } from '@icons';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';

export interface MFADeviceSelectionInfoModalProps {
	show: boolean;
	onClose: () => void;
}

/**
 * Device Selection Info Modal Component
 * Displays educational content about Device Selection Behavior settings
 */
export const MFADeviceSelectionInfoModal: React.FC<MFADeviceSelectionInfoModalProps> = ({
	show,
	onClose,
}) => {
	if (!show) return null;

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
				zIndex: 10000,
				padding: '20px',
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: 'white',
					borderRadius: '16px',
					padding: '32px',
					maxWidth: '700px',
					width: '100%',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
					maxHeight: '90vh',
					overflowY: 'auto',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						marginBottom: '24px',
					}}
				>
					<h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
						Device Selection Behavior
					</h2>
					<ButtonSpinner
						loading={false}
						onClick={onClose}
						spinnerSize={12}
						spinnerPosition="left"
						loadingText="Closing..."
						style={{
							background: 'rgba(0, 0, 0, 0.1)',
							border: 'none',
							borderRadius: '50%',
							width: '32px',
							height: '32px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							color: '#6b7280',
							padding: 0,
						}}
					>
						<FiX size={20} />
					</ButtonSpinner>
				</div>

				{/* Content */}
				<div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
					<p style={{ margin: '0 0 20px 0' }}>
						The <strong>Device Selection</strong> setting controls how users interact with their MFA
						devices during authentication. This setting determines whether devices are automatically
						selected or if users are prompted to choose.
					</p>

					<h3
						style={{
							margin: '24px 0 12px 0',
							fontSize: '18px',
							fontWeight: '600',
							color: '#1f2937',
						}}
					>
						Available Options:
					</h3>

					{/* DEFAULT_TO_FIRST */}
					<div
						style={{
							padding: '16px',
							background: '#f0fdf4',
							border: '1px solid #bbf7d0',
							borderRadius: '8px',
							marginBottom: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<span
								style={{
									padding: '4px 12px',
									background: '#10b981',
									color: 'white',
									borderRadius: '12px',
									fontSize: '12px',
									fontWeight: '600',
								}}
							>
								DEFAULT_TO_FIRST
							</span>
						</div>
						<p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#166534' }}>
							Automatic Device Selection
						</p>
						<p style={{ margin: 0, fontSize: '14px', color: '#166534' }}>
							<strong>User Experience:</strong> The system automatically selects the first available
							device for authentication. Users do not see a device selection screen.
						</p>
						<p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#166534' }}>
							<strong>When to Use:</strong> Best for single-device users or when you want the
							fastest authentication experience. Users with multiple devices will always use their
							first device.
						</p>
					</div>

					{/* PROMPT_TO_SELECT_DEVICE */}
					<div
						style={{
							padding: '16px',
							background: '#eff6ff',
							border: '1px solid #bfdbfe',
							borderRadius: '8px',
							marginBottom: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<span
								style={{
									padding: '4px 12px',
									background: '#3b82f6',
									color: 'white',
									borderRadius: '12px',
									fontSize: '12px',
									fontWeight: '600',
								}}
							>
								PROMPT_TO_SELECT_DEVICE
							</span>
						</div>
						<p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1e40af' }}>
							Smart Device Selection
						</p>
						<p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
							<strong>User Experience:</strong> If the user has only one device, it is automatically
							selected. If the user has multiple devices, they are shown a device selection screen
							to choose which device to use.
						</p>
						<p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#1e40af' }}>
							<strong>When to Use:</strong> Ideal for most scenarios. Provides convenience for
							single-device users while giving choice to users with multiple devices.
						</p>
					</div>

					{/* ALWAYS_DISPLAY_DEVICES */}
					<div
						style={{
							padding: '16px',
							background: '#fef3c7',
							border: '1px solid #fde68a',
							borderRadius: '8px',
							marginBottom: '16px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<span
								style={{
									padding: '4px 12px',
									background: '#f59e0b',
									color: 'white',
									borderRadius: '12px',
									fontSize: '12px',
									fontWeight: '600',
								}}
							>
								ALWAYS_DISPLAY_DEVICES
							</span>
						</div>
						<p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#92400e' }}>
							Always Show Device Selection
						</p>
						<p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
							<strong>User Experience:</strong> Users always see a device selection screen, even if
							they only have one device. This gives users full visibility and control over which
							device is used.
						</p>
						<p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#92400e' }}>
							<strong>When to Use:</strong> Best for security-conscious environments or when you
							want users to explicitly confirm their device choice. Also useful for testing and
							debugging device selection flows.
						</p>
					</div>

					{/* Tip Box */}
					<div
						style={{
							padding: '16px',
							background: '#f9fafb',
							border: '1px solid #e5e7eb',
							borderRadius: '8px',
							marginTop: '24px',
						}}
					>
						<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
							<strong>💡 Tip:</strong> The device selection behavior is set in your Device
							Authentication Policy. Changing this setting affects all users who authenticate using
							that policy.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
