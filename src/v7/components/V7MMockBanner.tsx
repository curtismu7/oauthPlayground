// src/v7/components/V7MMockBanner.tsx
// Shared educational mock mode banner for all Mock Flows.

import React from 'react';
import { MOCK_FLOW_BANNER_DESC_STYLE, MOCK_FLOW_BANNER_STYLE } from '../styles/mockFlowStyles';

export interface V7MMockBannerDeprecation {
	short: string;
	learnMoreUrl?: string;
	/** When set, "Learn more" is a button that calls this (e.g. open modal). Use when no URL. */
	onLearnMoreClick?: () => void;
}

export interface V7MMockBannerProps {
	description: string;
	deprecation?: V7MMockBannerDeprecation;
}

/**
 * Renders the standard "Educational Mock Mode" banner used on every Mock Flow.
 * Optionally shows a deprecation line with "Learn more" link or button.
 */
export function V7MMockBanner({
	description,
	deprecation,
}: V7MMockBannerProps): React.ReactElement {
	return (
		<div style={MOCK_FLOW_BANNER_STYLE}>
			<strong>📚 Educational Mock Mode</strong>
			<p style={MOCK_FLOW_BANNER_DESC_STYLE}>{description}</p>
			{deprecation && (
				<p style={{ ...MOCK_FLOW_BANNER_DESC_STYLE, marginTop: 8 }}>
					{deprecation.short}
					{deprecation.learnMoreUrl && (
						<>
							{' '}
							<a href={deprecation.learnMoreUrl} target="_blank" rel="noopener noreferrer">
								Learn more
							</a>
						</>
					)}
					{deprecation.onLearnMoreClick && !deprecation.learnMoreUrl && (
						<>
							{' '}
							<button
								type="button"
								onClick={deprecation.onLearnMoreClick}
								style={{
									background: 'none',
									border: 'none',
									color: '#2563eb',
									cursor: 'pointer',
									padding: 0,
									textDecoration: 'underline',
								}}
							>
								Learn more
							</button>
						</>
					)}
				</p>
			)}
		</div>
	);
}
