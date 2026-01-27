/**
 * @file MFAPolicyInfoModal.tsx
 * @module v8/flows/components/modals
 * @description Info modal explaining Device Authentication Policies
 * @version 8.3.0
 * @since 2025-01-19
 *
 * Phase 3: Modal Extraction - Policy Info Modal
 * Extracted from MFAAuthenticationMainPageV8.tsx lines 6296-6450
 */

import React from 'react';
import { FiX } from 'react-icons/fi';

export interface MFAPolicyInfoModalProps {
	show: boolean;
	onClose: () => void;
}

/**
 * Policy Info Modal Component
 * Displays educational content about Device Authentication Policies
 */
export const MFAPolicyInfoModal: React.FC<MFAPolicyInfoModalProps> = ({ show, onClose }) => {
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
						What is a Device Authentication Policy?
					</h2>
					<button
						type="button"
						onClick={onClose}
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
						}}
					>
						<FiX size={20} />
					</button>
				</div>

				{/* Content */}
				<div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
					<p style={{ margin: '0 0 20px 0' }}>
						A <strong>Device Authentication Policy</strong> is a configuration that controls how
						multi-factor authentication (MFA) works for your users. It determines which device types
						are allowed, how devices are selected during authentication, and what authentication
						methods are required.
					</p>

					<h3
						style={{
							margin: '24px 0 12px 0',
							fontSize: '18px',
							fontWeight: '600',
							color: '#1f2937',
						}}
					>
						Key Features:
					</h3>
					<ul style={{ margin: '0 0 20px 0', paddingLeft: '24px' }}>
						<li style={{ marginBottom: '8px' }}>
							<strong>Device Selection Behavior:</strong> Controls how users select devices during
							authentication (e.g., automatically select first device, prompt user to choose, always
							display all devices).
						</li>
						<li style={{ marginBottom: '8px' }}>
							<strong>Allowed Device Types:</strong> Specifies which device types (SMS, EMAIL,
							FIDO2, TOTP, etc.) can be used for authentication and registration.
						</li>
						<li style={{ marginBottom: '8px' }}>
							<strong>Authentication Requirements:</strong> Defines which device types are required,
							optional, or excluded from the authentication flow.
						</li>
						<li style={{ marginBottom: '8px' }}>
							<strong>Challenge Configuration:</strong> Sets up OTP requirements, challenge
							timeouts, retry limits, and other security parameters.
						</li>
					</ul>

					<h3
						style={{
							margin: '24px 0 12px 0',
							fontSize: '18px',
							fontWeight: '600',
							color: '#1f2937',
						}}
					>
						How It Works:
					</h3>
					<ol style={{ margin: '0 0 20px 0', paddingLeft: '24px' }}>
						<li style={{ marginBottom: '8px' }}>
							When you select a policy, it applies to{' '}
							<strong>both authentication and device registration</strong> flows.
						</li>
						<li style={{ marginBottom: '8px' }}>
							The policy determines which device types users can register and use for
							authentication.
						</li>
						<li style={{ marginBottom: '8px' }}>
							During authentication, the policy controls how devices are presented and selected.
						</li>
						<li style={{ marginBottom: '8px' }}>
							The policy enforces security requirements like OTP length, challenge timeouts, and
							retry limits.
						</li>
					</ol>

					{/* Tip Box */}
					<div
						style={{
							padding: '16px',
							background: '#eff6ff',
							border: '1px solid #bfdbfe',
							borderRadius: '8px',
							marginTop: '24px',
						}}
					>
						<p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
							<strong>💡 Tip:</strong> The policy you select here will be used for all
							authentication attempts and device registrations. Make sure the policy allows the
							device types you want to test.
						</p>
					</div>

					{/* Got It Button */}
					<button
						type="button"
						onClick={onClose}
						style={{
							width: '100%',
							marginTop: '24px',
							padding: '12px 24px',
							border: 'none',
							borderRadius: '8px',
							background: '#3b82f6',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'background 0.2s',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#2563eb';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#3b82f6';
						}}
					>
						Got it!
					</button>
				</div>
			</div>
		</div>
	);
};
