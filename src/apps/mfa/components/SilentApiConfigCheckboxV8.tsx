/**
 * @file SilentApiConfigCheckboxV8.tsx
 * @module v8/components
 * @description Centralized Silent API configuration checkbox component
 * @version 8.1.0
 * @since 2026-02-08
 *
 * Purpose: Provide a single, consistent Silent API checkbox component
 * Ensures foolproof behavior across all pages and flows
 */

import React from 'react';
import { useV8SilentApi } from '@/hooks/useUniversalSilentApi';

const _MODULE_TAG = '[🔕 SILENT-API-CONFIG-V8]';

export interface SilentApiConfigCheckboxV8Props {
	/** Custom className for styling */
	className?: string;
	/** Custom style object */
	style?: React.CSSProperties;
	/** Label override (default: "Silent API Token Retrieval") */
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
 * Centralized Silent API configuration checkbox component
 * Uses the universal Silent API service for consistent state management
 */
export const SilentApiConfigCheckboxV8: React.FC<SilentApiConfigCheckboxV8Props> = ({
	className = '',
	style = {},
	label = 'Silent API Token Retrieval',
	description = 'Automatically fetch worker token in background without showing modals',
	disabled = false,
	loading = false,
	onChange,
}) => {
	const { config, toggleSilentApi, isLoading: hookLoading, error } = useV8SilentApi();
	const { silentApiRetrieval } = config;

	const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.checked;

		// Call custom callback if provided
		if (onChange) {
			onChange(newValue);
		}

		// Use universal service toggle (handles mutual exclusivity automatically)
		toggleSilentApi();
	};

	// Show loading state while hook is initializing
	if (hookLoading) {
		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
				<input type="checkbox" checked={false} disabled={true} style={{ cursor: 'not-allowed' }} />
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
				checked={silentApiRetrieval === true}
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

export default SilentApiConfigCheckboxV8;
