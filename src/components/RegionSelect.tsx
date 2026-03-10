// src/components/RegionSelect.tsx
// Reusable region dropdown using regionService — all PingOne regions per official docs.
// @see https://developer.pingidentity.com/pingone-api/verify/working-with-pingone-apis.html

import React from 'react';
import { type PingOneRegion, REGIONS_FOR_UI } from '../services/regionService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';

/** Normalize stored region value to REGIONS_FOR_UI value for display. */
export function normalizeRegionForDisplay(r: string | null | undefined): PingOneRegion {
	if (!r) return 'us';
	const v = r.toLowerCase().trim();
	if (v === 'na' || v === 'com') return 'us';
	if (v === 'asia') return 'ap';
	if (v === 'com.au') return 'au';
	return (REGIONS_FOR_UI.some((o) => o.value === v) ? v : 'us') as PingOneRegion;
}

export interface RegionSelectProps {
	value: string;
	onChange: (region: PingOneRegion) => void;
	disabled?: boolean;
	variant?: 'full' | 'compact';
	id?: string;
	className?: string;
	/** Optional: show doc link below (full variant) */
	showDocLink?: boolean;
	/** Custom element for the select (e.g. styled.select). */
	as?: React.ElementType;
	style?: React.CSSProperties;
	/** Accessibility: aria-describedby for hint/error elements */
	'aria-describedby'?: string;
}

const PINGONE_REGION_DOC =
	'https://developer.pingidentity.com/pingone-api/verify/working-with-pingone-apis.html';

const defaultSelectStyle: React.CSSProperties = {
	padding: '0.75rem',
	border: `1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER}`,
	borderRadius: '0.5rem',
	background: 'white',
	color: '#1f2937',
	fontSize: '1rem',
};

/**
 * Region select dropdown. Uses REGIONS_FOR_UI from regionService (all 6 PingOne regions).
 * Full variant: label + select + optional doc link. Compact: just the select.
 */
export const RegionSelect: React.FC<RegionSelectProps> = ({
	value,
	onChange,
	disabled = false,
	variant = 'compact',
	id,
	className = '',
	showDocLink = variant === 'full',
	as: SelectComponent = 'select',
	style,
	'aria-describedby': ariaDescribedBy,
}) => {
	const displayValue = normalizeRegionForDisplay(value);

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onChange(e.target.value as PingOneRegion);
	};

	const resolvedStyle =
		SelectComponent === 'select'
			? {
					...defaultSelectStyle,
					...(variant === 'compact' ? { width: '100%' } : { minWidth: '350px' }),
					...style,
				}
			: style;

	const selectEl = (
		<SelectComponent
			id={id}
			className={className}
			value={displayValue}
			onChange={handleChange}
			disabled={disabled}
			aria-label="PingOne region"
			aria-describedby={ariaDescribedBy}
			{...(resolvedStyle ? { style: resolvedStyle } : {})}
		>
			{REGIONS_FOR_UI.map(({ value: v, label }) => (
				<option key={v} value={v}>
					{label}
				</option>
			))}
		</SelectComponent>
	);

	if (variant === 'compact') {
		return selectEl;
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
			<label htmlFor={id} style={{ fontWeight: 600, color: '#1f2937' }}>
				PingOne Region
			</label>
			{selectEl}
			{showDocLink && (
				<a
					href={PINGONE_REGION_DOC}
					target="_blank"
					rel="noopener noreferrer"
					style={{ fontSize: '0.875rem', color: '#2563eb' }}
				>
					Working with PingOne APIs
				</a>
			)}
		</div>
	);
};
