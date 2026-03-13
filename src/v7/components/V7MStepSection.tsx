// src/v7/components/V7MStepSection.tsx
// Shared step/section card for Mock Flows: bordered block with variant-colored header and body.

import React from 'react';
import {
	getSectionBodyStyle,
	getSectionHeaderStyle,
	MOCK_SECTION_STYLE,
	type SectionHeaderVariant,
} from '../styles/mockFlowStyles';

export interface V7MStepSectionProps {
	title: string;
	icon?: React.ReactNode;
	variant?: SectionHeaderVariant;
	children: React.ReactNode;
	/** Optional max width for body content (e.g. 720 for forms) */
	maxWidth?: number;
	/** Optional extra node in header (e.g. V7MInfoIcon) */
	headerExtra?: React.ReactNode;
}

/**
 * Renders a consistent step/section card used across Mock Flows: section wrapper,
 * header bar with optional icon and variant background, and body area.
 */
export function V7MStepSection({
	title,
	icon,
	variant = 'default',
	children,
	maxWidth,
	headerExtra,
}: V7MStepSectionProps): React.ReactElement {
	return (
		<section style={MOCK_SECTION_STYLE}>
			<header style={getSectionHeaderStyle(variant)}>
				{icon != null && <span>{icon}</span>}
				{title}
				{headerExtra}
			</header>
			<div style={getSectionBodyStyle(maxWidth)}>{children}</div>
		</section>
	);
}
