// src/flows/framework/ResultCard.tsx
//
// Bordered card for displaying an outcome. The 'tone' prop tints the left accent
// border and title colour: ok=success green, error=red, info=primary navy.

import React from 'react';
import styled from 'styled-components';
import { tokens } from './tokens';

type Tone = 'ok' | 'error' | 'info';

function accentColor(tone: Tone): string {
	if (tone === 'ok') return tokens.color.success;
	if (tone === 'error') return tokens.color.error;
	return tokens.color.primary;
}

function bgColor(tone: Tone): string {
	if (tone === 'ok') return tokens.color.successBg;
	if (tone === 'error') return tokens.color.errorBg;
	return tokens.color.primarySubtle;
}

const Card = styled.div<{ $tone: Tone }>`
	background: ${({ $tone }) => bgColor($tone)};
	border: 1px solid ${tokens.color.border};
	border-left: 3px solid ${({ $tone }) => accentColor($tone)};
	border-radius: ${tokens.radius.xl};
	padding: ${tokens.space['2xl']};
	display: flex;
	flex-direction: column;
	gap: ${tokens.space.md};
`;

const Title = styled.div<{ $tone: Tone }>`
	font-size: 0.75rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: ${({ $tone }) => accentColor($tone)};
`;

const Body = styled.div`
	font-size: 0.9rem;
	color: ${tokens.color.text};
	line-height: 1.5;
`;

export interface ResultCardProps {
	title: string;
	tone?: Tone;
	children: React.ReactNode;
}

export const ResultCard: React.FC<ResultCardProps> = ({ title, tone = 'info', children }) => {
	return (
		<Card $tone={tone}>
			<Title $tone={tone}>{title}</Title>
			<Body>{children}</Body>
		</Card>
	);
};
