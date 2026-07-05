// src/pages/design/DesignSystemPage.tsx
//
// Living style guide for the app's standard visual language (route /design).
// Renders every token, primitive, and the page shell as live examples — the
// visible contract each migrated page is checked against.

import React from 'react';
import styled from 'styled-components';
import {
	PageShell,
	Section,
	SectionHead,
	SectionOrder,
	tokens,
	fonts,
	Pill,
	Action,
	Note,
	Card,
	Grid,
} from '../../design';

const Swatches = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`;

const Swatch = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	font-size: 0.72rem;
	color: ${tokens.color.textMuted};
`;

const Chip = styled.div<{ $bg: string }>`
	width: 88px;
	height: 44px;
	border-radius: ${tokens.radius.md};
	border: 1px solid ${tokens.color.border};
	background: ${({ $bg }) => $bg};
`;

const Row = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.6rem;
	margin-bottom: 0.75rem;
`;

const Mono = styled.p`
	font-family: ${fonts.mono};
	color: ${tokens.color.text};
	margin: 0;
`;

const palette: Array<[string, string]> = [
	['primary', tokens.color.primary],
	['accent', tokens.color.accent],
	['accentHover', tokens.color.accentHover],
	['text', tokens.color.text],
	['textMuted', tokens.color.textMuted],
	['bgSubtle', tokens.color.bgSubtle],
	['border', tokens.color.border],
	['success', tokens.color.success],
	['error', tokens.color.error],
];

const DesignSystemPage: React.FC = () => (
	<PageShell
		title="Design System"
		intro="The standard visual language, promoted from the Use Cases page. Every page adopting the standard composes these tokens and primitives."
	>
		<Section>
			<SectionHead>
				<SectionOrder>1</SectionOrder>
				<h2>Color</h2>
			</SectionHead>
			<Swatches>
				{palette.map(([name, hex]) => (
					<Swatch key={name}>
						<Chip $bg={hex} />
						<span>{name}</span>
						<span>{hex}</span>
					</Swatch>
				))}
			</Swatches>
		</Section>

		<Section>
			<SectionHead>
				<SectionOrder>2</SectionOrder>
				<h2>Primitives</h2>
			</SectionHead>
			<Row>
				<Pill $active type="button">Active pill</Pill>
				<Pill $active={false} type="button">Muted pill</Pill>
				<Action type="button">Action button</Action>
			</Row>
			<Note>Note — inline teaching/caveat with a teal left rule.</Note>
			<Grid style={{ marginTop: '0.9rem' }}>
				<Card>Card A</Card>
				<Card>Card B</Card>
			</Grid>
		</Section>

		<Section>
			<SectionHead>
				<SectionOrder>3</SectionOrder>
				<h2>Typography</h2>
			</SectionHead>
			<p>Body text uses the system sans stack.</p>
			<Mono>IBM Plex Mono — the signature accent (badges, labels, actions).</Mono>
		</Section>
	</PageShell>
);

export default DesignSystemPage;
