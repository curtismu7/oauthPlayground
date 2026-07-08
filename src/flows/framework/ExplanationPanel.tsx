// src/flows/framework/ExplanationPanel.tsx
//
// Collapsible disclosure panel for progressive explanation. Collapsed by default
// so it doesn't crowd the flow; the learner opens it when they want context.

import React, { useState } from 'react';
import styled from 'styled-components';
import { tokens } from './tokens';

const Wrap = styled.div`
	border: 1px solid ${tokens.color.border};
	border-radius: ${tokens.radius.lg};
	background: ${tokens.color.bgSubtle};
	overflow: hidden;
`;

const Toggle = styled.button<{ $open: boolean }>`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${tokens.space.sm};
	padding: ${tokens.space.md} ${tokens.space.lg};
	background: transparent;
	border: none;
	cursor: pointer;
	text-align: left;
	font-size: 0.82rem;
	font-weight: 600;
	color: ${tokens.color.textSecondary};
	&:hover {
		background: ${tokens.color.border};
	}
`;

const Chevron = styled.span<{ $open: boolean }>`
	font-size: 0.7rem;
	color: ${tokens.color.textMuted};
	transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
	transition: transform 0.18s ease;
	display: inline-block;
	flex-shrink: 0;
`;

const Body = styled.div`
	padding: ${tokens.space.sm} ${tokens.space.lg} ${tokens.space.lg};
	font-size: 0.85rem;
	color: ${tokens.color.textMuted};
	line-height: 1.55;
	border-top: 1px solid ${tokens.color.border};
`;

export interface ExplanationPanelProps {
	title?: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
	title = "What's happening?",
	children,
	defaultOpen = false,
}) => {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<Wrap>
			<Toggle $open={open} onClick={() => setOpen((o) => !o)}>
				<span>{title}</span>
				<Chevron $open={open}>&#9660;</Chevron>
			</Toggle>
			{open && <Body>{children}</Body>}
		</Wrap>
	);
};
