/**
 * @file MFAOTPInput.tsx
 * @module v8/flows/components
 * @description Reusable OTP input component for MFA flows
 * @version 8.2.0
 */

import React from 'react';
import { MFAConfigurationServiceV8 } from '../../services/mfaConfigurationServiceV8.ts';

export interface MFAOTPInputProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	placeholder?: string;
	maxLength?: number;
}

export const MFAOTPInput: React.FC<MFAOTPInputProps> = ({
	value,
	onChange,
	disabled = false,
	placeholder,
	maxLength,
}) => {
	// Get configured OTP length from MFA configuration service
	const config = MFAConfigurationServiceV8.loadConfiguration();
	const configuredLength = maxLength ?? config.otpCodeLength;
	const defaultPlaceholder = '0'.repeat(configuredLength);
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, configuredLength);
		onChange(cleaned);
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
			<label
				htmlFor="mfa-otp"
				style={{
					display: 'block',
					marginBottom: '8px',
					fontSize: '14px',
					fontWeight: '600',
					color: '#374151',
					textAlign: 'center',
					width: '100%',
				}}
			>
				OTP Code <span className="required">*</span>
			</label>
			<input
				id="mfa-otp"
				type="text"
				value={value}
				onChange={handleChange}
				disabled={disabled}
				placeholder={placeholder ?? defaultPlaceholder}
				maxLength={configuredLength}
				style={{
					padding: '12px 16px',
					border: `2px solid ${value.length === configuredLength ? '#10b981' : '#d1d5db'}`,
					borderRadius: '8px',
					fontSize: '20px',
					fontFamily: 'monospace',
					letterSpacing: '6px',
					textAlign: 'center',
					color: '#1f2937',
					background: 'white',
					width: '100%',
					maxWidth: '240px',
					outline: 'none',
					transition: 'border-color 0.2s',
				}}
			/>
		</div>
	);
};
