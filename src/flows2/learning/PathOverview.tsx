// src/flows2/learning/PathOverview.tsx
//
// The /v2/learn/:pathId page: an ordered list of the track's steps with per-step state
// (done / current / upcoming), a deep-link into the real flow, and a checkpoint gate.
// Nothing is hard-locked — a learner may open any step (free-roam); upcoming steps are
// only styled as not-yet-reached.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { findPath } from '../content/learningPaths';
import { tokens } from '../framework/tokens';
import { getProgress, markStepComplete, setActivePath } from '../services/learningProgress';
import { CheckpointModal } from './CheckpointModal';

const MONO = "'IBM Plex Mono', monospace";

const Page = styled.div`
	max-width: 820px;
	margin: 0 auto;
	padding: 2rem 1.25rem 4rem;
	color: ${tokens.color.text};
`;

const BackLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-family: ${MONO};
	font-size: 0.75rem;
	font-weight: 600;
	color: ${tokens.color.textMuted};
	text-decoration: none;
	margin-bottom: 1.25rem;
	&:hover {
		color: ${tokens.color.accent};
	}
`;

const Header = styled.header`
	margin-bottom: 1.75rem;
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const Icon = styled.span`
	font-size: 1.8rem;
	line-height: 1;
`;

const Title = styled.h1`
	margin: 0;
	font-size: 1.6rem;
	font-weight: 700;
`;

const Summary = styled.p`
	margin: 0.75rem 0 0;
	color: ${tokens.color.textMuted};
	font-size: 0.95rem;
	line-height: 1.55;
`;

const Overall = styled.p`
	margin: 0.9rem 0 0;
	font-family: ${MONO};
	font-size: 0.78rem;
	font-weight: 600;
	color: ${tokens.color.accent};
`;

const Steps = styled.ol`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.85rem;
`;

const StepCard = styled.li<{ $state: 'done' | 'current' | 'upcoming' }>`
	display: flex;
	gap: 1rem;
	background: ${({ $state }) => ($state === 'current' ? tokens.color.accentBg : tokens.color.bg)};
	border: 1px solid
		${({ $state }) =>
			$state === 'done'
				? tokens.color.successBorder
				: $state === 'current'
					? tokens.color.accent
					: tokens.color.border};
	border-radius: ${tokens.radius.lg};
	padding: 1.25rem;
	opacity: ${({ $state }) => ($state === 'upcoming' ? 0.7 : 1)};
`;

const Index = styled.div<{ $state: 'done' | 'current' | 'upcoming' }>`
	flex-shrink: 0;
	width: 2rem;
	height: 2rem;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: ${MONO};
	font-size: 0.85rem;
	font-weight: 700;
	border-radius: ${tokens.radius.pill};
	color: #fff;
	background: ${({ $state }) =>
		$state === 'done'
			? tokens.color.success
			: $state === 'current'
				? tokens.color.primary
				: tokens.color.borderSubtle};
`;

const StepBody = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const StepHead = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 0.75rem;
	flex-wrap: wrap;
`;

const StepTitle = styled.h2`
	margin: 0;
	font-size: 1.05rem;
	font-weight: 700;
	color: ${tokens.color.text};
`;

const StateTag = styled.span<{ $state: 'done' | 'current' | 'upcoming' }>`
	font-family: ${MONO};
	font-size: 0.65rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.2rem 0.5rem;
	border-radius: ${tokens.radius.pill};
	color: ${({ $state }) =>
		$state === 'done'
			? tokens.color.successHover
			: $state === 'current'
				? tokens.color.accentHover
				: tokens.color.textMuted};
	background: ${({ $state }) =>
		$state === 'done'
			? tokens.color.successBg
			: $state === 'current'
				? tokens.color.accentBg
				: tokens.color.bgSubtle};
`;

const Why = styled.p`
	margin: 0;
	font-size: 0.86rem;
	line-height: 1.5;
	color: ${tokens.color.textMuted};
`;

const Actions = styled.div`
	display: flex;
	gap: 0.6rem;
	flex-wrap: wrap;
	margin-top: 0.25rem;
`;

const OpenButton = styled.button`
	font-family: ${MONO};
	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.03em;
	padding: 0.5rem 1rem;
	border-radius: ${tokens.radius.md};
	border: none;
	background: ${tokens.color.accent};
	color: #fff;
	cursor: pointer;
	transition: all 150ms ease;
	&:hover {
		background: ${tokens.color.accentHover};
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

const CheckpointButton = styled.button`
	font-family: ${MONO};
	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.03em;
	padding: 0.5rem 1rem;
	border-radius: ${tokens.radius.md};
	border: 1px solid ${tokens.color.borderSubtle};
	background: ${tokens.color.bg};
	color: ${tokens.color.primary};
	cursor: pointer;
	transition: all 150ms ease;
	&:hover:not(:disabled) {
		border-color: ${tokens.color.accent};
		color: ${tokens.color.accentHover};
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

const NotFound = styled.div`
	max-width: 620px;
	margin: 4rem auto;
	text-align: center;
	color: ${tokens.color.textMuted};
`;

const PathOverview: React.FC = () => {
	const { pathId } = useParams<{ pathId: string }>();
	const navigate = useNavigate();
	const path = pathId ? findPath(pathId) : undefined;
	const [completed, setCompleted] = useState<Set<string>>(
		() => new Set(getProgress().completedStepIds)
	);
	const [openCheckpointStepId, setOpenCheckpointStepId] = useState<string | null>(null);

	// Mark this path active whenever it is opened.
	useEffect(() => {
		if (pathId && path) setActivePath(pathId);
	}, [pathId, path]);

	if (!path || !pathId) {
		return (
			<NotFound>
				<h1>Path not found</h1>
				<p>That learning path doesn't exist.</p>
				<Link to="/v2/learn">← Back to Learning Paths</Link>
			</NotFound>
		);
	}

	const doneCount = path.steps.reduce((n, s) => (completed.has(s.id) ? n + 1 : n), 0);
	// The current step is the first not-yet-done step in order.
	const currentIndex = path.steps.findIndex((s) => !completed.has(s.id));

	const stepState = (stepId: string, i: number): 'done' | 'current' | 'upcoming' => {
		if (completed.has(stepId)) return 'done';
		if (i === currentIndex) return 'current';
		return 'upcoming';
	};

	const handlePass = (stepId: string) => {
		markStepComplete(pathId, stepId);
		setCompleted(new Set(getProgress().completedStepIds));
		setOpenCheckpointStepId(null);
	};

	const activeCheckpointStep = path.steps.find((s) => s.id === openCheckpointStepId);

	return (
		<Page>
			<BackLink to="/v2/learn">← Learning Paths</BackLink>

			<Header>
				<TitleRow>
					<Icon aria-hidden="true">{path.icon}</Icon>
					<Title>{path.title}</Title>
				</TitleRow>
				<Summary>{path.summary}</Summary>
				<Overall>
					{doneCount} of {path.steps.length} steps complete
				</Overall>
			</Header>

			<Steps>
				{path.steps.map((step, i) => {
					const state = stepState(step.id, i);
					const hasCheckpoints = step.checkpoints.length > 0;
					return (
						<StepCard key={step.id} $state={state}>
							<Index $state={state} aria-hidden="true">
								{state === 'done' ? '✓' : i + 1}
							</Index>
							<StepBody>
								<StepHead>
									<StepTitle>{step.title}</StepTitle>
									<StateTag $state={state}>
										{state === 'done' ? 'Done' : state === 'current' ? 'Current' : 'Upcoming'}
									</StateTag>
								</StepHead>
								<Why>{step.why}</Why>
								<Actions>
									<OpenButton type="button" onClick={() => navigate(step.flowRoute)}>
										Open flow →
									</OpenButton>
									<CheckpointButton
										type="button"
										disabled={!hasCheckpoints}
										onClick={() => setOpenCheckpointStepId(step.id)}
									>
										{state === 'done' ? 'Review checkpoint' : 'Checkpoint'}
									</CheckpointButton>
								</Actions>
							</StepBody>
						</StepCard>
					);
				})}
			</Steps>

			{activeCheckpointStep && activeCheckpointStep.checkpoints.length > 0 && (
				<CheckpointModal
					stepTitle={activeCheckpointStep.title}
					checkpoints={activeCheckpointStep.checkpoints}
					onPass={() => handlePass(activeCheckpointStep.id)}
					onClose={() => setOpenCheckpointStepId(null)}
				/>
			)}
		</Page>
	);
};

export default PathOverview;
