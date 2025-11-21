// src/components/password-reset/shared/PasswordInput.tsx
// Shared password input component with show/hide toggle

import React, { useState } from 'react';
import { FiEye, FiEyeOff } from '../../../services/commonImportsService';
import { FormGroup, Input, Label } from './PasswordResetSharedComponents';

interface PasswordInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
	label,
	value,
	onChange,
	placeholder = 'Enter password',
	required = false,
	disabled = false,
}) => {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<FormGroup>
			<Label>
				{label}
				{required && <span style={{ color: '#DC2626' }}> *</span>}
			</Label>
			<div style={{ position: 'relative' }}>
				<Input
					type={showPassword ? 'text' : 'password'}
					placeholder={placeholder}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					style={{ paddingRight: '3rem' }}
				/>
				<button
					type="button"
					onClick={() => setShowPassword(!showPassword)}
					disabled={disabled}
					style={{
						position: 'absolute',
						right: '0.75rem',
						top: '50%',
						transform: 'translateY(-50%)',
						background: 'none',
						border: 'none',
						color: '#6B7280',
						cursor: disabled ? 'not-allowed' : 'pointer',
						padding: '0.25rem',
						opacity: disabled ? 0.5 : 1,
					}}
				>
					{showPassword ? <FiEyeOff /> : <FiEye />}
				</button>
			</div>
		</FormGroup>
	);
};
