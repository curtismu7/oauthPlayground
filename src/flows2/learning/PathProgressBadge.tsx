// src/flows2/learning/PathProgressBadge.tsx
//
// A tiny opt-in banner a flow page can render to signal it is part of the learner's
// active path ("Step X of N · <Path Title>"). Renders null when no path is active or
// the current flow isn't in it, so flows are unaffected in free-roam mode.

import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { findPath } from '../content/learningPaths';
import { tokens } from '../framework/tokens';
import { getProgress } from '../services/learningProgress';

const MONO = "'IBM Plex Mono', monospace";

const Banner = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-family: ${MONO};
	font-size: 0.72rem;
	font-weight: 600;
	letter-spacing: 0.02em;
	padding: 0.35rem 0.75rem;
	border-radius: ${tokens.radius.pill};
	background: ${tokens.color.accentBg};
	border: 1px solid ${tokens.color.primaryBorder};
	color: ${tokens.color.primary};
	text-decoration: none;
	transition: all 150ms ease;
	&:hover {
		border-color: ${tokens.color.accent};
		color: ${tokens.color.accentHover};
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

const Marker = styled.span`
	color: ${tokens.color.accent};
`;

export interface PathProgressBadgeProps {
	/** The route of the flow rendering this badge; matched against the active path's steps. */
	flowRoute: string;
}

export const PathProgressBadge: React.FC<PathProgressBadgeProps> = ({ flowRoute }) => {
	const { activePathId } = getProgress();
	if (!activePathId) return null;

	const path = findPath(activePathId);
	if (!path) return null;

	const stepIndex = path.steps.findIndex((s) => s.flowRoute === flowRoute);
	if (stepIndex === -1) return null;

	return (
		<Banner to={`/v2/learn/${activePathId}`}>
			<Marker aria-hidden="true">◆</Marker>
			Step {stepIndex + 1} of {path.steps.length} · {path.title}
		</Banner>
	);
};

export default PathProgressBadge;
