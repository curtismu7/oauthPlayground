// src/v7/components/V7MFlowOverview.tsx
// Reusable "About this flow" overview section for Mock Flows (same detail level as RAR/PAR).

import React from 'react';
import {
	getSectionBodyStyle,
	getSectionHeaderStyle,
	MOCK_SECTION_STYLE,
} from '../styles/mockFlowStyles';

export interface V7MFlowOverviewProps {
	title: string;
	description: string;
	keyPoint?: string;
	standard?: string;
	benefits?: string[];
	educationalNote?: string;
}

const overviewBodyStyle: React.CSSProperties = {
	fontSize: 14,
	lineHeight: 1.6,
	color: '#374151',
};

const listStyle: React.CSSProperties = {
	margin: '8px 0 0 0',
	paddingLeft: 20,
};

/**
 * Renders an "About this flow" section with description, key point, optional standard, benefits, and educational note.
 * Use on all Mock Flows for consistency with RAR/PAR level of detail.
 */
export function V7MFlowOverview({
	title,
	description,
	keyPoint,
	standard,
	benefits,
	educationalNote,
}: V7MFlowOverviewProps): React.ReactElement {
	return (
		<section style={MOCK_SECTION_STYLE}>
			<header style={getSectionHeaderStyle('info')}>
				<span>ℹ️</span> {title}
			</header>
			<div style={getSectionBodyStyle()}>
				<p style={overviewBodyStyle}>{description}</p>
				{keyPoint && (
					<p style={{ ...overviewBodyStyle, marginTop: 12, fontWeight: 500 }}>{keyPoint}</p>
				)}
				{standard && (
					<p style={{ ...overviewBodyStyle, marginTop: 12, fontStyle: 'italic' }}>{standard}</p>
				)}
				{benefits && benefits.length > 0 && (
					<>
						<p style={{ ...overviewBodyStyle, marginTop: 12, fontWeight: 600 }}>Key benefits</p>
						<ul style={listStyle}>
							{benefits.map((b, i) => (
								<li key={i} style={{ ...overviewBodyStyle, marginTop: 4 }}>
									{b}
								</li>
							))}
						</ul>
					</>
				)}
				{educationalNote && (
					<p
						style={{
							...overviewBodyStyle,
							marginTop: 12,
							padding: 10,
							background: '#fef3c7',
							borderRadius: 6,
							border: '1px solid #fbbf24',
						}}
					>
						<strong>Educational implementation:</strong> {educationalNote}
					</p>
				)}
			</div>
		</section>
	);
}
