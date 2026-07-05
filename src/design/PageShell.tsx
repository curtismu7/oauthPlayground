// src/design/PageShell.tsx
//
// The standard page frame, extracted from the /v2/use-cases reference: a centered
// max-width column, a navy page title, a muted intro line, and slotted content.
// Section/SectionHead/SectionOrder are the grouping blocks the reference uses.

import React from 'react';
import styled from 'styled-components';
import { tokens } from './tokens';
import { fonts } from './typography';

const Page = styled.div`
	max-width: 960px;
	margin: 0 auto;
	padding: 2rem 1.25rem 4rem;
	color: ${tokens.color.text};
`;

const PageTitle = styled.h1`
	margin: 0 0 0.35rem;
	font-size: 1.6rem;
	color: ${tokens.color.primary};
`;

const Intro = styled.p`
	margin: 0 0 2rem;
	font-size: 0.95rem;
	line-height: 1.55;
	color: ${tokens.color.textMuted};
`;

export const Section = styled.section`
	margin-bottom: 2.25rem;
`;

export const SectionHead = styled.div`
	display: flex;
	align-items: baseline;
	gap: 0.6rem;
	margin-bottom: 0.15rem;
`;

export const SectionOrder = styled.span`
	font-family: ${fonts.mono};
	font-size: 0.85rem;
	font-weight: 700;
	color: ${tokens.color.accentHover};
`;

export interface PageShellProps {
	title: string;
	intro?: React.ReactNode;
	children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ title, intro, children }) => (
	<Page>
		<PageTitle>{title}</PageTitle>
		{intro ? <Intro>{intro}</Intro> : null}
		{children}
	</Page>
);
