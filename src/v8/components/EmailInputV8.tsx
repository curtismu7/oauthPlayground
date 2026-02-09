/**
 * @file EmailInputV8.tsx
 * @module v8/components
 * @description Reusable email input component with validation
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Provide a consistent email input component across all V8 flows.
 * Includes built-in validation, error display, and accessibility features.
 *
 * @example
 * <EmailInputV8
 *   value={email}
 *   onChange={setEmail}
 *   error={emailError}
 *   required={true}
 * />
 */

import React, { useCallback, useState } from 'react';

const MODULE_TAG = '[✉️ EMAIL-INPUT-V8]';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface EmailInputV8Props {
	/** Current email value */
	value: string;

	/** Change handler */
	onChange: (value: string) => void;

	/** Blur handler (optional) */
	onBlur?: () => void;

	/** Error message to display */
	error?: string;

	/** Whether field is required */
	required?: boolean;

	/** Whether field is disabled */
	disabled?: boolean;

	/** Placeholder text */
	placeholder?: string;

	/** Custom label (defaults to "Email Address") */
	label?: string;

	/** Field ID (defaults to "email") */
	id?: string;

	/** Custom CSS class */
	className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Email Input Component
 *
 * Reusable email input with validation and error display.
 */
export const EmailInputV8: React.FC<EmailInputV8Props> = ({
	value,
	onChange,
	onBlur,
	error,
	required = false,
	disabled = false,
	placeholder = 'user@example.com',
	label = 'Email Address',
	id = 'email',
	className = '',
}) => {
	// ========================================================================
	// STATE
	// ========================================================================

	// Track if field has been touched
	const [touched, setTouched] = useState(false);

	// ========================================================================
	// HANDLERS
	// ========================================================================

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			console.log(`${MODULE_TAG} Email changed:`, newValue);
			onChange(newValue);
		},
		[onChange]
	);

	const handleBlur = useCallback(() => {
		console.log(`${MODULE_TAG} Email field blurred`);
		setTouched(true);
		if (onBlur) {
			onBlur();
		}
	}, [onBlur]);

	// ========================================================================
	// COMPUTED PROPERTIES
	// ========================================================================

	const hasError = !!error;
	const showError = hasError && touched;

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className={`email-input-v8 ${className} ${showError ? 'has-error' : ''}`.trim()}>
			<label htmlFor={id} className="email-label">
				{label}
				{required && (
					<span className="required" aria-label="required">
						{' '}
						*
					</span>
				)}
			</label>

			<input
				id={id}
				type="email"
				value={value}
				onChange={handleChange}
				onBlur={handleBlur}
				disabled={disabled}
				placeholder={placeholder}
				required={required}
				className={`email-input ${showError ? 'input-error' : ''}`.trim()}
				aria-invalid={showError}
				aria-describedby={showError ? `${id}-error` : undefined}
				autoComplete="email"
			/>

			{showError && (
				<span id={`${id}-error`} className="error-message" role="alert">
					{error}
				</span>
			)}

			{!showError && (
				<span className="field-hint" style={{ marginTop: '8px', display: 'block' }}>
					Enter a valid email address
				</span>
			)}
		</div>
	);
};

export default EmailInputV8;
