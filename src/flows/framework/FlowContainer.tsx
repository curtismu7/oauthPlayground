// src/flows/framework/FlowContainer.tsx
//
// Page shell for a flows2 flow: title/spec header + a step rail + the active step's body.
// Self-contained styling so flows2 stays decoupled from the legacy v8u/v9 component web.

import React from 'react';
import styled from 'styled-components';
import type { FlowEngine } from './useFlowEngine';
import type { FlowMode, OAuthSpec } from './types';

const Page = styled.div`
	max-width: 920px;
	margin: 0 auto;
	padding: 2rem 1.25rem 4rem;
	color: #0f172a;
`;

const Header = styled.header`
	margin-bottom: 1.5rem;
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex-wrap: wrap;
`;

const Title = styled.h1`
	font-size: 1.6rem;
	font-weight: 700;
	margin: 0;
`;

const Badge = styled.span<{ $variant?: 'spec' }>`
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	padding: 0.2rem 0.55rem;
	border-radius: 999px;
	text-transform: uppercase;
	color: #fff;
	background: ${({ $variant }) =>
		$variant === 'spec' ? '#1e3a8a' : '#1e3a8a'};
`;

const ModeToggleContainer = styled.div`
	display: inline-flex;
	gap: 0.25rem;
	padding: 0.2rem;
	background: #f1f5f9;
	border-radius: 999px;
	border: 1px solid #cbd5e1;
`;

const ModeToggleButton = styled.button<{ $active: boolean }>`
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	padding: 0.2rem 0.55rem;
	border-radius: 999px;
	text-transform: uppercase;
	border: none;
	cursor: pointer;
	transition: all 150ms ease;
	background: ${({ $active }) => ($active ? '#14b8a6' : 'transparent')};
	color: ${({ $active }) => ($active ? '#fff' : '#64748b')};

	&:hover {
		background: ${({ $active }) => ($active ? '#0d9488' : '#e2e8f0')};
	}
`;

const Subtitle = styled.p`
	margin: 0.5rem 0 0;
	color: #475569;
	font-size: 0.95rem;
	white-space: pre-line;
`;

const Rail = styled.ol`
	display: flex;
	gap: 0.5rem;
	list-style: none;
	padding: 0;
	margin: 1.25rem 0;
	flex-wrap: wrap;
`;

const RailItem = styled.li<{ $active: boolean; $done: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.82rem;
	font-weight: 600;
	padding: 0.35rem 0.7rem;
	border-radius: 8px;
	cursor: pointer;
	color: ${({ $active }) => ($active ? '#1e3a8a' : '#64748b')};
	background: ${({ $active, $done }) => ($active ? '#eff6ff' : $done ? '#f0fdf4' : '#f8fafc')};
	border: 1px solid ${({ $active, $done }) => ($active ? '#bfdbfe' : $done ? '#bbf7d0' : '#e2e8f0')};
`;

const Dot = styled.span<{ $active: boolean; $done: boolean }>`
	width: 1.4rem;
	height: 1.4rem;
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 0.72rem;
	color: #fff;
	background: ${({ $active, $done }) => ($done ? '#16a34a' : $active ? '#1e3a8a' : '#94a3b8')};
`;

export interface FlowContainerProps {
	title: string;
	spec?: OAuthSpec;
	mode: FlowMode;
	onModeChange?: (mode: FlowMode) => void;
	subtitle?: string;
	engine: FlowEngine;
	children: React.ReactNode;
}

export const FlowContainer: React.FC<FlowContainerProps> = ({
	title,
	spec,
	mode,
	onModeChange,
	subtitle,
	engine,
	children,
}) => {
	return (
		<Page>
			<Header>
				<TitleRow>
					<Title>{title}</Title>
					{spec && <Badge $variant="spec">OAuth {spec}</Badge>}
					{onModeChange ? (
						<ModeToggleContainer>
							<ModeToggleButton
								$active={mode === 'real'}
								onClick={() => onModeChange('real')}
							>
								Real PingOne
							</ModeToggleButton>
							<ModeToggleButton
								$active={mode === 'mock'}
								onClick={() => onModeChange('mock')}
							>
								Mock
							</ModeToggleButton>
						</ModeToggleContainer>
					) : (
						<Badge $variant="spec">
							{mode === 'real' ? 'Real PingOne' : 'Mock'}
						</Badge>
					)}
				</TitleRow>
				{subtitle && <Subtitle>{subtitle}</Subtitle>}
			</Header>

			<Rail>
				{engine.steps.map((step, i) => {
					const active = i === engine.index;
					const done = engine.completed.has(step.id);
					return (
						<RailItem
							key={step.id}
							$active={active}
							$done={done}
							onClick={() => engine.goTo(i)}
						>
							<Dot $active={active} $done={done}>
								{done ? '✓' : i + 1}
							</Dot>
							{step.title}
						</RailItem>
					);
				})}
			</Rail>

			{children}
		</Page>
	);
};
