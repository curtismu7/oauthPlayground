// src/flows2/framework/SpecVsPingOne.tsx
//
// The "Spec vs PingOne" callout: for a single OAuth/OIDC parameter or behavior,
// show side-by-side what the RFC/spec says (left, navy) versus what PingOne
// specifically does — its extensions, constraints, defaults (right, teal).
// This is the core of the app's "…and PingOne's implementation of it" mission.
//
// Pure styled-components, no external libs. Columns stack below 640px.

import React from 'react';
import styled from 'styled-components';
import { tokens } from './tokens';

const MONO = "'IBM Plex Mono', monospace";

export interface SpecVsPingOneEntry {
	id: string;
	/** e.g. "redirect_uri matching" */
	topic: string;
	/** what the RFC says (cite the RFC/section inline) */
	spec: string;
	/** e.g. "RFC 6749 §3.1.2" */
	specRef?: string;
	/** what PingOne specifically does/requires/defaults */
	pingone: string;
	/** optional gotcha / practical tip */
	note?: string;
}

export interface SpecVsPingOneProps {
	/** single-entry callout */
	entry: SpecVsPingOneEntry;
}

export interface SpecVsPingOneListProps {
	entries: SpecVsPingOneEntry[];
	title?: string;
}

const Card = styled.section`
	border: 1px solid ${tokens.color.border};
	border-radius: ${tokens.radius.xl};
	background: ${tokens.color.bg};
	overflow: hidden;
`;

const Topic = styled.h4`
	margin: 0;
	padding: ${tokens.space.md} ${tokens.space.lg};
	font-family: ${MONO};
	font-size: 0.85rem;
	font-weight: 700;
	color: ${tokens.color.text};
	background: ${tokens.color.bgSubtle};
	border-bottom: 1px solid ${tokens.color.border};
`;

const Columns = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const Column = styled.div<{ $side: 'spec' | 'pingone' }>`
	padding: ${tokens.space.lg};
	display: flex;
	flex-direction: column;
	gap: ${tokens.space.sm};
	border-top: 3px solid
		${({ $side }) => ($side === 'spec' ? tokens.color.primary : tokens.color.accent)};

	& + & {
		border-left: 1px solid ${tokens.color.border};
	}
	@media (max-width: 640px) {
		& + & {
			border-left: none;
			border-top: 3px solid ${tokens.color.accent};
		}
	}
`;

const ColumnHead = styled.div<{ $side: 'spec' | 'pingone' }>`
	font-family: ${MONO};
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: ${({ $side }) => ($side === 'spec' ? tokens.color.primary : tokens.color.accent)};
`;

const ColumnBody = styled.p`
	margin: 0;
	font-size: 0.85rem;
	line-height: 1.55;
	color: ${tokens.color.text};
`;

const SpecRefBadge = styled.span`
	align-self: flex-start;
	font-family: ${MONO};
	font-size: 0.68rem;
	font-weight: 600;
	color: ${tokens.color.primary};
	background: ${tokens.color.primarySubtle};
	border: 1px solid ${tokens.color.primaryBorder};
	border-radius: ${tokens.radius.pill};
	padding: 0.15rem 0.6rem;
`;

const FooterNote = styled.p`
	margin: 0;
	font-size: 0.8rem;
	line-height: 1.5;
	color: ${tokens.color.neutral600};
	background: ${tokens.color.neutral100};
	border-top: 1px solid ${tokens.color.border};
	border-left: 3px solid ${tokens.color.accent};
	padding: ${tokens.space.md} ${tokens.space.lg};
`;

export const SpecVsPingOne: React.FC<SpecVsPingOneProps> = ({ entry }) => {
	const { topic, spec, specRef, pingone, note } = entry;
	return (
		<Card aria-label={`Spec vs PingOne: ${topic}`}>
			<Topic>{topic}</Topic>
			<Columns>
				<Column $side="spec">
					<ColumnHead $side="spec">Spec</ColumnHead>
					<ColumnBody>{spec}</ColumnBody>
					{specRef && <SpecRefBadge>{specRef}</SpecRefBadge>}
				</Column>
				<Column $side="pingone">
					<ColumnHead $side="pingone">PingOne</ColumnHead>
					<ColumnBody>{pingone}</ColumnBody>
				</Column>
			</Columns>
			{note && <FooterNote>{note}</FooterNote>}
		</Card>
	);
};

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${tokens.space.lg};
`;

const ListTitle = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 700;
	color: ${tokens.color.text};
`;

export const SpecVsPingOneList: React.FC<SpecVsPingOneListProps> = ({ entries, title }) => (
	<List>
		{title && <ListTitle>{title}</ListTitle>}
		{entries.map((entry) => (
			<SpecVsPingOne key={entry.id} entry={entry} />
		))}
	</List>
);
