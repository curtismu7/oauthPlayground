// src/flows2/learning/LearningPathsPage.tsx
//
// The /v2/learn landing page: the three curriculum tracks as cards with a progress
// ring and a Start/Continue action. Free-roam over the raw flows is always allowed —
// these tracks are an optional guided spine on top.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { learningPaths } from '../content/learningPaths';
import { tokens } from '../framework/tokens';
import { getProgress, resetProgress, setActivePath } from '../services/learningProgress';

const MONO = "'IBM Plex Mono', monospace";

const Page = styled.div`
	max-width: 920px;
	margin: 0 auto;
	padding: 2rem 1.25rem 4rem;
	color: ${tokens.color.text};
`;

const Header = styled.header`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1.75rem;
`;

const Title = styled.h1`
	margin: 0 0 0.4rem;
	font-size: 1.7rem;
	font-weight: 700;
`;

const Intro = styled.p`
	margin: 0;
	max-width: 42rem;
	color: ${tokens.color.textMuted};
	font-size: 0.95rem;
	line-height: 1.55;
`;

const ResetButton = styled.button`
	font-family: ${MONO};
	font-size: 0.72rem;
	font-weight: 600;
	letter-spacing: 0.03em;
	background: none;
	border: none;
	padding: 0.25rem 0;
	color: ${tokens.color.textMuted};
	text-decoration: underline;
	text-underline-offset: 3px;
	cursor: pointer;
	transition: color 150ms ease;
	&:hover {
		color: ${tokens.color.error};
	}
`;

const Cards = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	gap: 1.25rem;
`;

const Card = styled.article`
	display: flex;
	flex-direction: column;
	gap: 0.85rem;
	background: ${tokens.color.bg};
	border: 1px solid ${tokens.color.border};
	border-radius: ${tokens.radius.xl};
	padding: 1.5rem;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
	transition: box-shadow 150ms ease, transform 150ms ease;
	&:hover {
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
		transform: translateY(-2px);
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
		&:hover {
			transform: none;
		}
	}
`;

const CardTop = styled.div`
	display: flex;
	align-items: center;
	gap: 0.9rem;
`;

const Icon = styled.span`
	font-size: 1.6rem;
	line-height: 1;
`;

const CardTitle = styled.h2`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 700;
	color: ${tokens.color.primary};
`;

const Summary = styled.p`
	margin: 0;
	flex: 1;
	color: ${tokens.color.textMuted};
	font-size: 0.86rem;
	line-height: 1.5;
`;

const CardFooter = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-top: 0.25rem;
`;

const StartButton = styled.button`
	font-family: ${MONO};
	font-size: 0.8rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	padding: 0.6rem 1.1rem;
	border-radius: ${tokens.radius.md};
	border: none;
	background: ${tokens.color.accent};
	color: #fff;
	cursor: pointer;
	transition: all 150ms ease;
	&:hover {
		background: ${tokens.color.accentHover};
		transform: translateY(-1px);
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
		&:hover {
			transform: none;
		}
	}
`;

const RingWrap = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-family: ${MONO};
	font-size: 0.72rem;
	color: ${tokens.color.textMuted};
`;

const RING_SIZE = 40;
const RING_STROKE = 4;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

const ProgressRing: React.FC<{ done: number; total: number }> = ({ done, total }) => {
	const fraction = total === 0 ? 0 : done / total;
	const offset = RING_C * (1 - fraction);
	const complete = done >= total && total > 0;
	return (
		<RingWrap>
			<svg
				width={RING_SIZE}
				height={RING_SIZE}
				viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
				role="img"
				aria-label={`${done} of ${total} steps complete`}
			>
				<circle
					cx={RING_SIZE / 2}
					cy={RING_SIZE / 2}
					r={RING_R}
					fill="none"
					stroke={tokens.color.neutral300}
					strokeWidth={RING_STROKE}
				/>
				<circle
					cx={RING_SIZE / 2}
					cy={RING_SIZE / 2}
					r={RING_R}
					fill="none"
					stroke={complete ? tokens.color.success : tokens.color.accent}
					strokeWidth={RING_STROKE}
					strokeLinecap="round"
					strokeDasharray={RING_C}
					strokeDashoffset={offset}
					transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
				/>
			</svg>
			<span>
				{done}/{total}
			</span>
		</RingWrap>
	);
};

const LearningPathsPage: React.FC = () => {
	const navigate = useNavigate();
	const [progress, setProgress] = useState(() => getProgress());

	const handleStart = (pathId: string) => {
		setActivePath(pathId);
		setProgress(getProgress());
		navigate(`/v2/learn/${pathId}`);
	};

	const handleReset = () => {
		resetProgress();
		setProgress(getProgress());
	};

	const doneSet = new Set(progress.completedStepIds);

	return (
		<Page>
			<Header>
				<div>
					<Title>Learning Paths</Title>
					<Intro>
						Guided tracks that sequence the existing flows into a curriculum. Follow one start to
						finish, or ignore them entirely — free-roam across every flow is always allowed.
					</Intro>
				</div>
				<ResetButton type="button" onClick={handleReset}>
					Reset progress
				</ResetButton>
			</Header>

			<Cards>
				{learningPaths.map((path) => {
					const stepIds = path.steps.map((s) => s.id);
					const done = stepIds.reduce((n, id) => (doneSet.has(id) ? n + 1 : n), 0);
					const started = done > 0;
					return (
						<Card key={path.id}>
							<CardTop>
								<Icon aria-hidden="true">{path.icon}</Icon>
								<CardTitle>{path.title}</CardTitle>
							</CardTop>
							<Summary>{path.summary}</Summary>
							<CardFooter>
								<ProgressRing done={done} total={path.steps.length} />
								<StartButton type="button" onClick={() => handleStart(path.id)}>
									{started ? 'Continue' : 'Start'}
								</StartButton>
							</CardFooter>
						</Card>
					);
				})}
			</Cards>
		</Page>
	);
};

export default LearningPathsPage;
