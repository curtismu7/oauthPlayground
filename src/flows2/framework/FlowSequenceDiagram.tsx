// src/flows2/framework/FlowSequenceDiagram.tsx
//
// A live UML-style sequence diagram for the flows2 framework. Actors are labeled
// vertical lanes across the top with lifelines dropping down; interactions are
// horizontal request/response arrows stacked top-to-bottom in array order.
//
// The point of this component is *live highlighting*: it is driven by a flow's
// step engine (the caller passes `activeStepId` = engine.current.id and
// `completedStepIds` = engine.completed). Interactions in the active step glow in
// teal accent with an animated pulse; completed steps are muted grey; future
// steps are faint. It is a pure presentational component — no engine import —
// matching the SVG + styled-components aesthetic of FlowDiagram.tsx.

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { tokens } from './tokens';

export interface SequenceActor {
	id: string;
	label: string;
}

export interface SequenceInteraction {
	/** Stable id. */
	id: string;
	/** Actor id the arrow starts from. */
	from: string;
	/** Actor id the arrow points to. */
	to: string;
	/** Primary label above the arrow, e.g. "GET /as/authorize". */
	label: string;
	/** Optional sub-label below the arrow, e.g. "response_type=code&code_challenge=...". */
	detail?: string;
	/** Response/redirect (dashed) vs request (solid). Default solid. */
	dashed?: boolean;
	/** Which flow step (StepDefinition.id) this interaction belongs to. */
	stepId: string;
}

export interface FlowSequenceDiagramProps {
	actors: SequenceActor[];
	interactions: SequenceInteraction[];
	/** engine.current.id — interactions whose stepId matches are highlighted. */
	activeStepId: string;
	/** engine.completed — interactions in these steps are drawn "done". */
	completedStepIds: ReadonlySet<string>;
	title?: string;
}

type ArrowState = 'active' | 'done' | 'future';

// Pulse the active arrow's stroke so the current interaction reads as "live".
const pulse = keyframes`
	0%, 100% { stroke-opacity: 1; }
	50% { stroke-opacity: 0.35; }
`;

const Frame = styled.div`
	background: linear-gradient(135deg, ${tokens.color.neutral100} 0%, ${tokens.color.accentBg} 100%);
	border: 2px solid ${tokens.color.accent};
	border-radius: 12px;
	padding: 1.5rem;
	margin: 0.5rem 0;

	svg {
		width: 100%;
		height: auto;
	}

	.seq-arrow[data-state='active'] .seq-line {
		animation: ${pulse} 1.6s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.seq-arrow[data-state='active'] .seq-line {
			animation: none;
		}
	}
`;

const Label = styled.div`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.12em;
	color: ${tokens.color.primary};
	text-transform: uppercase;
	margin-bottom: 0.75rem;
`;

// Layout constants — mirror the proportions of FlowDiagram for a consistent look.
const MARGIN_X = 24;
const ACTOR_W = 148;
const ACTOR_H = 46;
const LANE_STEP = 200; // distance between successive lifeline centers
const HEAD_GAP = 34; // space between actor boxes and the first arrow row
const ROW_H = 62; // vertical space per interaction
const FOOT_GAP = 24; // space below the last arrow row
const SELF_W = 42; // width of a self-interaction loop
const SELF_H = 22; // height of a self-interaction loop

// Per-state visual treatment for arrows + labels.
const STATE_STYLE: Record<ArrowState, { color: string; width: number; opacity: number }> = {
	active: { color: tokens.color.accent, width: 2.5, opacity: 1 },
	done: { color: tokens.color.neutral600, width: 1.75, opacity: 1 },
	future: { color: tokens.color.borderSubtle, width: 1.5, opacity: 0.5 },
};

function resolveState(
	stepId: string,
	activeStepId: string,
	completedStepIds: ReadonlySet<string>
): ArrowState {
	if (stepId === activeStepId) return 'active';
	if (completedStepIds.has(stepId)) return 'done';
	return 'future';
}

export const FlowSequenceDiagram: React.FC<FlowSequenceDiagramProps> = ({
	actors,
	interactions,
	activeStepId,
	completedStepIds,
	title = 'Sequence',
}) => {
	// Unique-per-instance suffix so multiple diagrams on one page don't share
	// <marker> ids (which would cross-colour arrowheads).
	const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');

	const laneX = (i: number): number => MARGIN_X + ACTOR_W / 2 + i * LANE_STEP;
	const actorIndex = new Map(actors.map((a, i) => [a.id, i]));

	// Filter out interactions that reference an unknown actor — render the rest in
	// order with no gaps (rows are indexed against the *kept* list).
	const drawable = interactions.filter(
		(it) => actorIndex.has(it.from) && actorIndex.has(it.to)
	);

	const n = Math.max(actors.length, 1);
	const width = MARGIN_X * 2 + ACTOR_W + (n - 1) * LANE_STEP;
	const rowsTop = ACTOR_H + HEAD_GAP;
	const height = rowsTop + Math.max(drawable.length, 1) * ROW_H + FOOT_GAP;
	const lifelineBottom = height - 8;

	return (
		<Frame>
			<Label>{title}</Label>
			<svg
				viewBox={`0 0 ${width} ${height}`}
				preserveAspectRatio="xMidYMid meet"
				role="img"
				aria-label={title}
			>
				<defs>
					{(Object.keys(STATE_STYLE) as ArrowState[]).map((state) => (
						<marker
							key={state}
							id={`seq-arrow-${state}-${uid}`}
							markerWidth="10"
							markerHeight="10"
							refX="8"
							refY="3"
							orient="auto"
						>
							<polygon points="0 0, 10 3, 0 6" fill={STATE_STYLE[state].color} />
						</marker>
					))}
				</defs>

				{/* Lifelines */}
				{actors.map((actor, i) => {
					const x = laneX(i);
					return (
						<line
							key={`lifeline-${actor.id}`}
							x1={x}
							y1={ACTOR_H}
							x2={x}
							y2={lifelineBottom}
							stroke={tokens.color.border}
							strokeWidth="1.5"
							strokeDasharray="4 4"
						/>
					);
				})}

				{/* Actor heads */}
				{actors.map((actor, i) => {
					const x = MARGIN_X + i * LANE_STEP;
					const fill = i % 2 === 0 ? tokens.color.accent : tokens.color.primary;
					return (
						<g key={`actor-${actor.id}`}>
							<rect x={x} y={0} width={ACTOR_W} height={ACTOR_H} rx="6" fill={fill} />
							<text
								x={x + ACTOR_W / 2}
								y={ACTOR_H / 2 + 4}
								textAnchor="middle"
								fontFamily="'IBM Plex Mono', monospace"
								fontSize="12"
								fontWeight="700"
								fill="#ffffff"
							>
								{actor.label}
							</text>
						</g>
					);
				})}

				{/* Interaction arrows */}
				{drawable.map((it, row) => {
					const state = resolveState(it.stepId, activeStepId, completedStepIds);
					const style = STATE_STYLE[state];
					const marker = `url(#seq-arrow-${state}-${uid})`;
					const y = rowsTop + row * ROW_H + ROW_H / 2;
					const fromX = laneX(actorIndex.get(it.from) as number);
					const toX = laneX(actorIndex.get(it.to) as number);
					const isSelf = it.from === it.to;
					const dash = it.dashed ? '6 4' : undefined;

					// Label anchored to the midpoint of the arrow (or to the right of a
					// self-loop), placed above the line with the detail below it.
					const labelX = isSelf ? fromX + SELF_W + 8 : (fromX + toX) / 2;
					const labelAnchor: 'start' | 'middle' = isSelf ? 'start' : 'middle';

					return (
						<g
							key={it.id}
							className="seq-arrow"
							data-state={state}
							data-step-id={it.stepId}
							opacity={style.opacity}
						>
							<text
								x={labelX}
								y={y - 10}
								textAnchor={labelAnchor}
								fontFamily="'IBM Plex Mono', monospace"
								fontSize="11"
								fontWeight={state === 'active' ? 700 : 600}
								fill={state === 'future' ? tokens.color.textMuted : tokens.color.text}
							>
								{it.label}
							</text>
							{it.detail && (
								<text
									x={labelX}
									y={y + 15}
									textAnchor={labelAnchor}
									fontFamily="'IBM Plex Mono', monospace"
									fontSize="9"
									fill={tokens.color.textMuted}
								>
									{it.detail}
								</text>
							)}
							{isSelf ? (
								<path
									className="seq-line"
									d={`M ${fromX} ${y - SELF_H / 2} h ${SELF_W} v ${SELF_H} h ${-SELF_W}`}
									fill="none"
									stroke={style.color}
									strokeWidth={style.width}
									strokeDasharray={dash}
									markerEnd={marker}
								/>
							) : (
								<line
									className="seq-line"
									x1={fromX}
									y1={y}
									x2={toX}
									y2={y}
									stroke={style.color}
									strokeWidth={style.width}
									strokeDasharray={dash}
									markerEnd={marker}
								/>
							)}
						</g>
					);
				})}
			</svg>
		</Frame>
	);
};
