/**
 * @file MFAOTPInput.tsx
 * @module v8/flows/components
 * @description Reusable OTP input component for MFA flows
 * @version 8.2.0
 */

import React from 'react';

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
	placeholder = '123456',
	maxLength = 6,
}) => {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, maxLength);
		onChange(cleaned);
	};

	return (
		<div className="form-group">
			<label htmlFor="mfa-otp">
				OTP Code <span className="required">*</span>
			</label>
			<input
				id="mfa-otp"
				type="text"
				value={value}
				onChange={handleChange}
				disabled={disabled}
				placeholder={placeholder}
				style={{
					padding: '6px 10px',
					border: `1px solid ${value.length === maxLength ? '#10b981' : '#d1d5db'}`,
					borderRadius: '6px',
					fontSize: '18px',
					fontFamily: 'monospace',
					letterSpacing: '4px',
					textAlign: 'center',
					color: '#1f2937',
					background: 'white',
					width: '100%',
					maxWidth: '200px',
				}}
			/>
			<small>Enter the {maxLength}-digit code from your {placeholder.includes('email') ? 'email' : 'phone'}</small>
		</div>
	);
};

