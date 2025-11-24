/**
 * @file MFAEducationDemo.tsx
 * @module v8/components/__tests__
 * @description Demo component showing MFA educational UI patterns
 * @version 8.0.0
 * @since 2024-11-23
 * 
 * This is a demo/example component showing how to use MFAInfoButtonV8
 * and MFAEducationServiceV8 in the MFA Flow.
 * 
 * NOT FOR PRODUCTION - This is a reference implementation only.
 */

import React from 'react';
import { MFAInfoButtonV8 } from '../MFAInfoButtonV8';
import { MFAEducationServiceV8 } from '@/v8/services/mfaEducationServiceV8';

/**
 * MFA Education Demo Component
 * 
 * Shows examples of:
 * - Info buttons in tooltip mode
 * - Info buttons in modal mode
 * - Factor type comparison grid
 * - Security level indicators
 */
export const MFAEducationDemo: React.FC = () => {
	return (
		<div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
			<h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#1f2937' }}>
				MFA Educational UI Demo
			</h1>
			<p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>
				Examples of educational UI patterns for PingOne MFA Flow
			</p>

			{/* Example 1: Form Fields with Info Buttons */}
			<section style={{ marginBottom: '40px' }}>
				<h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
					1. Form Fields with Info Buttons
				</h2>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					{/* Environment ID */}
					<div>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								fontSize: '14px',
								fontWeight: '500',
								color: '#374151',
								marginBottom: '6px',
							}}
						>
							Environment ID <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
							<MFAInfoButtonV8 contentKey="credential.environmentId" displayMode="modal" />
						</label>
						<input
							type="text"
							placeholder="e.g., 12345678-1234-1234-1234-123456789012"
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								color: '#1f2937',
								background: '#ffffff',
							}}
						/>
					</div>

					{/* Username */}
					<div>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								fontSize: '14px',
								fontWeight: '500',
								color: '#374151',
								marginBottom: '6px',
							}}
						>
							Username <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
							<MFAInfoButtonV8 contentKey="credential.username" />
						</label>
						<input
							type="text"
							placeholder="e.g., john.doe@example.com"
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								color: '#1f2937',
								background: '#ffffff',
							}}
						/>
					</div>

					{/* Phone Number */}
					<div>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								fontSize: '14px',
								fontWeight: '500',
								color: '#374151',
								marginBottom: '6px',
							}}
						>
							Phone Number <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
							<MFAInfoButtonV8 contentKey="phone.number" />
						</label>
						<input
							type="tel"
							placeholder="e.g., 5125551234"
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								color: '#1f2937',
								background: '#ffffff',
							}}
						/>
					</div>
				</div>
			</section>

			{/* Example 2: Factor Type Comparison */}
			<section style={{ marginBottom: '40px' }}>
				<h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
					2. MFA Factor Types Comparison
				</h2>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
						gap: '12px',
					}}
				>
					{MFAEducationServiceV8.getAllFactorTypes().map(({ key, content }) => (
						<div
							key={key}
							style={{
								padding: '16px',
								background: '#f9fafb',
								border: '2px solid #e5e7eb',
								borderRadius: '8px',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLElement).style.borderColor = '#3b82f6';
								(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
								(e.currentTarget as HTMLElement).style.boxShadow = 'none';
							}}
						>
							{/* Factor name and icon */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									marginBottom: '8px',
								}}
							>
								<span style={{ fontSize: '20px' }}>
									{MFAEducationServiceV8.getSecurityLevelIcon(content.securityLevel)}
								</span>
								<strong style={{ fontSize: '14px', color: '#1f2937' }}>{key}</strong>
								<MFAInfoButtonV8
									contentKey={`factor.${key.toLowerCase()}`}
									size="small"
									displayMode="modal"
								/>
							</div>

							{/* Security level badge */}
							<div
								style={{
									fontSize: '10px',
									padding: '4px 8px',
									background: MFAEducationServiceV8.getSecurityLevelColor(content.securityLevel),
									color: 'white',
									borderRadius: '4px',
									display: 'inline-block',
									fontWeight: '600',
									textTransform: 'uppercase',
									letterSpacing: '0.5px',
									marginBottom: '8px',
								}}
							>
								{content.securityLevel} Security
							</div>

							{/* Short description */}
							<p
								style={{
									fontSize: '12px',
									color: '#6b7280',
									lineHeight: '1.5',
									margin: 0,
								}}
							>
								{content.description.substring(0, 80)}...
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Example 3: Info Buttons with Different Modes */}
			<section style={{ marginBottom: '40px' }}>
				<h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
					3. Info Button Display Modes
				</h2>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					{/* Tooltip mode */}
					<div
						style={{
							padding: '16px',
							background: '#f9fafb',
							border: '1px solid #e5e7eb',
							borderRadius: '8px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<strong style={{ fontSize: '14px', color: '#1f2937' }}>Tooltip Mode (Hover)</strong>
							<MFAInfoButtonV8 contentKey="factor.totp" displayMode="tooltip" />
						</div>
						<p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
							Hover over the info button to see a quick tooltip
						</p>
					</div>

					{/* Modal mode */}
					<div
						style={{
							padding: '16px',
							background: '#f9fafb',
							border: '1px solid #e5e7eb',
							borderRadius: '8px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<strong style={{ fontSize: '14px', color: '#1f2937' }}>Modal Mode (Click)</strong>
							<MFAInfoButtonV8 contentKey="factor.fido2" displayMode="modal" />
						</div>
						<p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
							Click the info button to see detailed information in a modal
						</p>
					</div>

					{/* With label */}
					<div
						style={{
							padding: '16px',
							background: '#f9fafb',
							border: '1px solid #e5e7eb',
							borderRadius: '8px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<strong style={{ fontSize: '14px', color: '#1f2937' }}>With Label</strong>
							<MFAInfoButtonV8
								contentKey="security.phishingResistance"
								displayMode="modal"
								label="What's this?"
							/>
						</div>
						<p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
							Info button with custom text label
						</p>
					</div>
				</div>
			</section>

			{/* Example 4: Security Notes */}
			<section style={{ marginBottom: '40px' }}>
				<h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
					4. Security Indicators
				</h2>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
					{/* High security */}
					<div
						style={{
							padding: '12px 16px',
							background: '#d1fae5',
							border: '1px solid #10b981',
							borderRadius: '6px',
						}}
					>
						<p style={{ margin: 0, fontSize: '13px', color: '#065f46', fontWeight: '500' }}>
							🛡️ <strong>High Security:</strong> FIDO2 and TOTP are phishing-resistant and highly
							secure
							<MFAInfoButtonV8 contentKey="factor.fido2" size="small" />
						</p>
					</div>

					{/* Medium security */}
					<div
						style={{
							padding: '12px 16px',
							background: '#fef3c7',
							border: '1px solid #f59e0b',
							borderRadius: '6px',
						}}
					>
						<p style={{ margin: 0, fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
							⚠️ <strong>Medium Security:</strong> SMS and Email are convenient but less secure
							<MFAInfoButtonV8 contentKey="factor.sms" size="small" />
						</p>
					</div>
				</div>
			</section>

			{/* Usage Instructions */}
			<section
				style={{
					marginTop: '40px',
					padding: '20px',
					background: '#eff6ff',
					border: '1px solid #3b82f6',
					borderRadius: '8px',
				}}
			>
				<h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e40af' }}>
					💡 How to Use in MFA Flow
				</h3>
				<ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#1e40af', lineHeight: '1.8' }}>
					<li>Import MFAInfoButtonV8 and MFAEducationServiceV8</li>
					<li>Add info buttons next to form labels</li>
					<li>Use tooltip mode for quick reference</li>
					<li>Use modal mode for detailed explanations</li>
					<li>Show factor comparison grid in Step 0</li>
					<li>Add security indicators for important notes</li>
				</ol>
			</section>
		</div>
	);
};

export default MFAEducationDemo;
