// src/components/AutoEnvironmentIdInput.tsx
// Drop-in replacement for any environment ID input field.
//
// Usage:
//   <AutoEnvironmentIdInput value={envId} onChange={setEnvId} />
//
// The component auto-populates from the global store on mount and whenever
// the store is updated by another flow. The user can always override it.

import React, { useEffect, useId, useRef } from 'react';
import { useAutoEnvironmentId } from '../hooks/useAutoEnvironmentId';

interface AutoEnvironmentIdInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
	value: string;
	onChange: (value: string) => void;
	/** Optional label text; if omitted, no label is rendered */
	label?: string;
	/** CSS className for the outer wrapper div */
	wrapperClassName?: string;
	/** CSS className for the input itself */
	inputClassName?: string;
	/** Show a small "Auto-filled" badge when value came from global store */
	showBadge?: boolean;
}

export const AutoEnvironmentIdInput: React.FC<AutoEnvironmentIdInputProps> = ({
	value,
	onChange,
	label,
	wrapperClassName,
	inputClassName,
	showBadge = true,
	placeholder = 'e.g. 12345678-1234-1234-1234-123456789abc',
	...rest
}) => {
	const { environmentId: autoEnvId } = useAutoEnvironmentId(false);
	const autoFilled = useRef(false);
	const generatedId = useId();
	const inputId = rest.id ?? generatedId;

	// Auto-fill from global store only when the current value is empty
	useEffect(() => {
		if (!value && autoEnvId) {
			onChange(autoEnvId);
			autoFilled.current = true;
		}
		// If the global store updates while the field still has the old auto-filled value,
		// update it automatically (but don't override manual user input).
		if (autoFilled.current && autoEnvId && value !== autoEnvId) {
			onChange(autoEnvId);
		}
	}, [autoEnvId, value, onChange]);

	const isAutoFilled = showBadge && autoFilled.current && value === autoEnvId;

	return (
		<div className={wrapperClassName} style={{ position: 'relative' }}>
			{label && (
				<label
					htmlFor={inputId}
					style={{
						display: 'block',
						fontWeight: 600,
						color: '#111827',
						fontSize: '0.875rem',
						marginBottom: '0.25rem',
					}}
				>
					{label}
					{isAutoFilled && (
						<span
							style={{
								marginLeft: '0.5rem',
								fontSize: '0.7rem',
								fontWeight: 500,
								background: '#ecfdf5',
								color: '#065f46',
								border: '1px solid #a7f3d0',
								borderRadius: '9999px',
								padding: '0.1rem 0.45rem',
								verticalAlign: 'middle',
							}}
						>
							Auto-filled
						</span>
					)}
				</label>
			)}
			<input
				{...rest}
				id={inputId}
				type="text"
				value={value}
				placeholder={placeholder}
				onChange={(e) => {
					autoFilled.current = false;
					onChange(e.target.value);
				}}
				className={inputClassName}
				style={{
					width: '100%',
					padding: '0.5rem 0.75rem',
					border: `1px solid ${isAutoFilled ? '#a7f3d0' : '#d1d5db'}`,
					borderRadius: '0.375rem',
					fontSize: '0.875rem',
					background: isAutoFilled ? '#f0fdf4' : 'white',
					...rest.style,
				}}
			/>
			{!label && isAutoFilled && (
				<span
					style={{
						position: 'absolute',
						top: '50%',
						right: '0.5rem',
						transform: 'translateY(-50%)',
						fontSize: '0.65rem',
						fontWeight: 500,
						background: '#ecfdf5',
						color: '#065f46',
						border: '1px solid #a7f3d0',
						borderRadius: '9999px',
						padding: '0.1rem 0.4rem',
						pointerEvents: 'none',
					}}
				>
					Auto-filled
				</span>
			)}
		</div>
	);
};

export default AutoEnvironmentIdInput;
