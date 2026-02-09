/**
 * @file ShowTokenConfigCheckboxV8.tsx
 * @module v8/components
 * @description Centralized Show Token configuration checkbox component
 * @version 8.1.0
 * @since 2026-02-08
 *
 * Purpose: Provide a single, consistent Show Token checkbox component
 * Ensures foolproof behavior across all pages and flows
 */

import React from 'react';
import { useWorkerTokenConfigV8 } from '@/v8/hooks/useSilentApiConfigV8';

const _MODULE_TAG = '[👁️ SHOW-TOKEN-CONFIG-V8]';

export interface ShowTokenConfigCheckboxV8Props {
	/** Custom className for styling */
	className?: string;
	/** Custom style object */
	style?: React.CSSProperties;
	/** Label override (default: "Show Token After Generation") */
	label?: string;
	/** Description override (default: standard description) */
	description?: string;
	/** Disabled state */
	disabled?: boolean;
	/** Show loading state */
	loading?: boolean;
	/** Additional callback for when value changes */
	onChange?: (value: boolean) => void;
}

/**
 * Centralized Show Token configuration checkbox component
 * Uses the useWorkerTokenConfigV8 hook for consistent state management
 */
export const ShowTokenConfigCheckboxV8: React.FC<ShowTokenConfigCheckboxV8Props> = ({
	className = '',
	style = {},
	label = 'Show Token After Generation',
	description = 'Display generated worker token in modal after successful retrieval',
	disabled = false,
	loading = false,
	onChange,
}) => {
	const { showTokenAtEnd, updateShowTokenAtEnd, isReady } = useWorkerTokenConfigV8();

	const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.checked;

		// Call custom callback if provided
		if (onChange) {
			onChange(newValue);
		}

		// Update centralized configuration
		await updateShowTokenAtEnd(newValue);
	};

	// Show loading state while hook is initializing
	if (!isReady) {
		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
				<input type="checkbox" disabled={true} style={{ cursor: 'not-allowed' }} />
				<span style={{ fontSize: '13px', color: '#6b7280' }}>Loading configuration...</span>
			</div>
		);
	}

	return (
		<div
			className={className}
			style={{
				display: 'flex',
				alignItems: 'flex-start',
				gap: '8px',
				...style,
			}}
		>
			<input
				type="checkbox"
				checked={showTokenAtEnd}
				onChange={handleChange}
				disabled={disabled || loading}
				style={{
					marginTop: '2px',
					cursor: disabled || loading ? 'not-allowed' : 'pointer',
				}}
			/>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
				<span
					style={{
						fontSize: '13px',
						color: disabled ? '#9ca3af' : '#374151',
						fontWeight: '500',
						opacity: loading ? 0.6 : 1,
					}}
				>
					{label}
					{loading && ' (updating...)'}
				</span>
				<span
					style={{
						fontSize: '11px',
						color: disabled ? '#d1d5db' : '#6b7280',
						opacity: loading ? 0.6 : 1,
					}}
				>
					{description}
				</span>
			</div>
		</div>
	);
};

export default ShowTokenConfigCheckboxV8;
