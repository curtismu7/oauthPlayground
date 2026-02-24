/**
 * @file MFADeviceSelectionInfoModal.PingUI.tsx
 * @module apps/mfa/flows/components/modals
 * @description Info modal explaining Device Selection Behavior options - Ping UI migrated
 * @version 8.3.0-PingUI
 * @since 2026-02-21
 *
 * Ping UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 *
 * Phase 3: Modal Extraction - Device Selection Info Modal
 * Extracted from MFAAuthenticationMainPageV8.tsx lines 6075-6295
 */

import React from 'react';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';

// Bootstrap Icon Component (migrated from MDI)
import BootstrapIcon from '@/components/BootstrapIcon';
import { getBootstrapIconName } from '@/components/iconMapping';

export interface MFADeviceSelectionInfoModalPingUIProps {
	show: boolean;
	onClose: () => void;
}

/**
 * Device Selection Info Modal Component - Ping UI Version
 * Displays educational content about Device Selection Behavior settings
 */
export const MFADeviceSelectionInfoModalPingUI: React.FC<
	MFADeviceSelectionInfoModalPingUIProps
> = ({ show, onClose }) => {
	if (!show) return null;

	return (
		<div className="end-user-nano">
			<div
				role="button"
				tabIndex={0}
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
					padding: 'var(--ping-spacing-xl, 2rem)',
				}}
				onClick={onClose}
			>
				<div
					role="button"
					tabIndex={0}
					style={{
						background: 'var(--ping-surface-primary, #ffffff)',
						borderRadius: 'var(--ping-border-radius-xl, 16px)',
						padding: 'var(--ping-spacing-2xl, 2.5rem)',
						maxWidth: '700px',
						width: '100%',
						boxShadow: 'var(--ping-shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.3))',
						maxHeight: '90vh',
						overflowY: 'auto',
						transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'flex-start',
							marginBottom: 'var(--ping-spacing-xl, 2rem)',
						}}
					>
						<h2
							style={{
								margin: 0,
								fontSize: 'var(--ping-font-size-xl, 1.5rem)',
								fontWeight: 'var(--ping-font-weight-bold, 700)',
								color: 'var(--ping-text-primary, #1f2937)',
							}}
						>
							Device Selection Behavior
						</h2>
						<div
							style={{
								background: 'var(--ping-surface-secondary, #f3f4f6)',
								border: 'none',
								borderRadius: '50%',
								width: '32px',
								height: '32px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								color: 'var(--ping-text-secondary, #6b7280)',
								padding: 0,
								transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.backgroundColor = 'var(--ping-surface-hover, #e5e7eb)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.backgroundColor = 'var(--ping-surface-secondary, #f3f4f6)';
							}}
						>
							<ButtonSpinner
								loading={false}
								onClick={onClose}
								spinnerSize={12}
								spinnerPosition="left"
								loadingText="Closing..."
								style={{
									background: 'transparent',
									border: 'none',
									borderRadius: '50%',
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: 'var(--ping-text-secondary, #6b7280)',
									padding: 0,
								}}
							>
								<BootstrapIcon icon={getBootstrapIconName("FiX")} size={20} aria-label="Close modal" />
							</ButtonSpinner>
						</div>
					</div>

					{/* Content */}
					<div
						style={{
							fontSize: 'var(--ping-font-size-base, 1rem)',
							lineHeight: 'var(--ping-line-height-relaxed, 1.6)',
							color: 'var(--ping-text-secondary, #374151)',
						}}
					>
						<p style={{ margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0' }}>
							The <strong>Device Selection</strong> setting controls how users interact with their
							MFA devices during authentication. This setting determines whether devices are
							automatically selected or if users are prompted to choose.
						</p>

						<h3
							style={{
								margin: 'var(--ping-spacing-xl, 2rem) 0 var(--ping-spacing-md, 1rem) 0',
								fontSize: 'var(--ping-font-size-lg, 1.125rem)',
								fontWeight: 'var(--ping-font-weight-semibold, 600)',
								color: 'var(--ping-text-primary, #1f2937)',
							}}
						>
							Available Options:
						</h3>

						{/* DEFAULT_TO_FIRST */}
						<div
							style={{
								padding: 'var(--ping-spacing-lg, 1.5rem)',
								background: 'var(--ping-success-light, #f0fdf4)',
								border: '1px solid var(--ping-success-border, #bbf7d0)',
								borderRadius: 'var(--ping-border-radius-md, 8px)',
								marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
								transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.boxShadow =
									'var(--ping-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.boxShadow = 'none';
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--ping-spacing-sm, 0.5rem)',
									marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
								}}
							>
								<span
									style={{
										padding: 'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-md, 1rem)',
										background: 'var(--ping-success-color, #10b981)',
										color: 'white',
										borderRadius: 'var(--ping-border-radius-full, 12px)',
										fontSize: 'var(--ping-font-size-xs, 0.75rem)',
										fontWeight: 'var(--ping-font-weight-semibold, 600)',
									}}
								>
									DEFAULT_TO_FIRST
								</span>
							</div>
							<p
								style={{
									margin: '0 0 var(--ping-spacing-sm, 0.5rem) 0',
									fontWeight: 'var(--ping-font-weight-semibold, 600)',
									color: 'var(--ping-success-dark, #166534)',
								}}
							>
								Automatic Device Selection
							</p>
							<p
								style={{
									margin: 0,
									fontSize: 'var(--ping-font-size-sm, 0.875rem)',
									color: 'var(--ping-success-dark, #166534)',
								}}
							>
								<strong>User Experience:</strong> The system automatically selects the first
								available device for authentication. Users do not see a device selection screen.
							</p>
							<p
								style={{
									margin: 'var(--ping-spacing-sm, 0.5rem) 0 0 0',
									fontSize: 'var(--ping-font-size-sm, 0.875rem)',
									color: 'var(--ping-success-dark, #166534)',
								}}
							>
								<strong>When to Use:</strong> Best for single-device users or when you want the
								fastest authentication experience. Users with multiple devices will always use their
								first device.
							</p>
						</div>

						{/* PROMPT_TO_SELECT_DEVICE */}
						<div
							style={{
								padding: 'var(--ping-spacing-lg, 1.5rem)',
								background: 'var(--ping-primary-light, #eff6ff)',
								border: '1px solid var(--ping-primary-border, #bfdbfe)',
								borderRadius: 'var(--ping-border-radius-md, 8px)',
								marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
								transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.boxShadow =
									'var(--ping-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.boxShadow = 'none';
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--ping-spacing-sm, 0.5rem)',
									marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
								}}
							>
								<span
									style={{
										padding: 'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-md, 1rem)',
										background: 'var(--ping-primary-color, #3b82f6)',
										color: 'white',
										borderRadius: 'var(--ping-border-radius-full, 12px)',
										fontSize: 'var(--ping-font-size-xs, 0.75rem)',
										fontWeight: 'var(--ping-font-weight-semibold, 600)',
									}}
								>
									PROMPT_TO_SELECT_DEVICE
								</span>
							</div>
							<p
								style={{
									margin: '0 0 var(--ping-spacing-sm, 0.5rem) 0',
									fontWeight: 'var(--ping-font-weight-semibold, 600)',
									color: 'var(--ping-primary-dark, #1e40af)',
								}}
							>
								Smart Device Selection
							</p>
							<p
								style={{
									margin: 0,
									fontSize: 'var(--ping-font-size-sm, 0.875rem)',
									color: 'var(--ping-primary-dark, #1e40af)',
								}}
							>
								<strong>User Experience:</strong> If the user has only one device, it is
								automatically selected. If the user has multiple devices, they are shown a device
								selection screen to choose which device to use.
							</p>
							<p
								style={{
									margin: 'var(--ping-spacing-sm, 0.5rem) 0 0 0',
									fontSize: 'var(--ping-font-size-sm, 0.875rem)',
									color: 'var(--ping-primary-dark, #1e40af)',
								}}
							>
								<strong>When to Use:</strong> Ideal for most scenarios. Provides convenience for
								single-device users while giving choice to users with multiple devices.
							</p>
						</div>

						{/* ALWAYS_DISPLAY_DEVICES */}
						<div
							style={{
								padding: 'var(--ping-spacing-lg, 1.5rem)',
								background: 'var(--ping-warning-light, #fef3c7)',
								border: '1px solid var(--ping-warning-border, #fde68a)',
								borderRadius: 'var(--ping-border-radius-md, 8px)',
								marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
								transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.boxShadow =
									'var(--ping-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.boxShadow = 'none';
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--ping-spacing-sm, 0.5rem)',
									marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
								}}
							>
								<span
									style={{
										padding: 'var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-md, 1rem)',
										background: 'var(--ping-warning-color, #f59e0b)',
										color: 'white',
										borderRadius: 'var(--ping-border-radius-full, 12px)',
										fontSize: 'var(--ping-font-size-xs, 0.75rem)',
										fontWeight: 'var(--ping-font-weight-semibold, 600)',
									}}
								>
									ALWAYS_DISPLAY_DEVICES
								</span>
							</div>
							<p
								style={{
									margin: '0 0 var(--ping-spacing-sm, 0.5rem) 0',
									fontWeight: 'var(--ping-font-weight-semibold, 600)',
									color: 'var(--ping-warning-dark, #92400e)',
								}}
							>
								Always Show Device Selection
							</p>
							<p
								style={{
									margin: 0,
									fontSize: 'var(--ping-font-size-sm, 0.875rem)',
									color: 'var(--ping-warning-dark, #92400e)',
								}}
							>
								<strong>User Experience:</strong> Users always see a device selection screen, even
								if they only have one device. This gives users full visibility and control over
								which device is used.
							</p>
							<p
								style={{
									margin: 'var(--ping-spacing-sm, 0.5rem) 0 0 0',
									fontSize: 'var(--ping-font-size-sm, 0.875rem)',
									color: 'var(--ping-warning-dark, #92400e)',
								}}
							>
								<strong>When to Use:</strong> Best for security-conscious environments or when you
								want users to explicitly confirm their device choice. Also useful for testing and
								debugging device selection flows.
							</p>
						</div>

						{/* Tip Box */}
						<div
							style={{
								padding: 'var(--ping-spacing-lg, 1.5rem)',
								background: 'var(--ping-surface-secondary, #f9fafb)',
								border: '1px solid var(--ping-border-color, #e5e7eb)',
								borderRadius: 'var(--ping-border-radius-md, 8px)',
								marginTop: 'var(--ping-spacing-xl, 2rem)',
								transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.boxShadow =
									'var(--ping-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.boxShadow = 'none';
							}}
						>
							<p
								style={{
									margin: 0,
									fontSize: 'var(--ping-font-size-sm, 0.875rem)',
									color: 'var(--ping-text-secondary, #6b7280)',
								}}
							>
								<strong>💡 Tip:</strong> The device selection behavior is set in your Device
								Authentication Policy. Changing this setting affects all users who authenticate
								using that policy.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MFADeviceSelectionInfoModalPingUI;
