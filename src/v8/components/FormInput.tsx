/**
 * @file FormInput.tsx
 * @module v8/components
 * @description Enhanced input component with real-time validation
 * @version 9.1.0
 */

import React from 'react';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';
import { colors, spacing, borderRadius, typography, transitions } from '@/v8/design/tokens';

interface FormInputProps {
	label: string;
	name: string;
	type?: string;
	value: string;
	error?: string;
	touched?: boolean;
	required?: boolean;
	placeholder?: string;
	helpText?: string;
	onChange: (name: string, value: string) => void;
	onBlur: (name: string) => void;
}

export const FormInput: React.FC<FormInputProps> = ({
	label,
	name,
	type = 'text',
	value,
	error,
	touched,
	required,
	placeholder,
	helpText,
	onChange,
	onBlur,
}) => {
	const hasError = touched && error;
	const isValid = touched && !error && value;

	return (
		<div style={{ marginBottom: spacing.lg }}>
			<label
				htmlFor={name}
				style={{
					display: 'block',
					fontSize: typography.fontSize.sm,
					fontWeight: typography.fontWeight.semibold,
					color: colors.neutral[700],
					marginBottom: spacing.sm,
				}}
			>
				{label}
				{required && <span style={{ color: colors.error[500], marginLeft: '4px' }}>*</span>}
			</label>

			<div style={{ position: 'relative' }}>
				<input
					id={name}
					name={name}
					type={type}
					value={value}
					onChange={(e) => onChange(name, e.target.value)}
					onBlur={() => onBlur(name)}
					placeholder={placeholder}
					aria-invalid={hasError ? 'true' : 'false'}
					aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
					style={{
						width: '100%',
						padding: `${spacing.md} 40px ${spacing.md} ${spacing.md}`,
						fontSize: typography.fontSize.base,
						border: `2px solid ${hasError ? colors.error[500] : isValid ? colors.success[500] : colors.neutral[300]}`,
						borderRadius: borderRadius.md,
						outline: 'none',
						transition: `all ${transitions.base}`,
						background: hasError ? colors.error[50] : isValid ? colors.success[50] : 'white',
						fontFamily: typography.fontFamily.sans,
					}}
				/>

				{/* Status icon */}
				<div
					style={{
						position: 'absolute',
						right: spacing.md,
						top: '50%',
						transform: 'translateY(-50%)',
					}}
				>
					{hasError && <FiAlertCircle size={20} color={colors.error[500]} />}
					{isValid && <FiCheck size={20} color={colors.success[500]} />}
				</div>
			</div>

			{/* Help text or error message */}
			{hasError ? (
				<p
					id={`${name}-error`}
					role="alert"
					style={{
						margin: `${spacing.sm} 0 0 0`,
						fontSize: typography.fontSize.sm,
						color: colors.error[600],
						display: 'flex',
						alignItems: 'center',
						gap: spacing.xs,
					}}
				>
					<FiAlertCircle size={14} />
					{error}
				</p>
			) : helpText ? (
				<p
					id={`${name}-help`}
					style={{
						margin: `${spacing.sm} 0 0 0`,
						fontSize: typography.fontSize.sm,
						color: colors.neutral[500],
					}}
				>
					{helpText}
				</p>
			) : null}
		</div>
	);
};
