// src/flows2/framework/FlowDiagram.tsx
//
// The signature visual of the flows2 look-and-feel: a horizontal node-sequence
// diagram shown on a flow's first step. Parameterized — each flow passes its own
// `label` and `nodes`, so every page gets a distinctive diagram with zero
// duplicated SVG. Extracted from the /v2/flows/authorization-code reference.

import React from 'react';
import styled from 'styled-components';
import { tokens } from './tokens';

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

export interface FlowDiagramProps {
	/** Caption above the diagram, e.g. "OAuth 2.0 Authorization Code Flow". */
	label: string;
	/** Ordered actors/stages, e.g. ['Client', 'AuthZ', 'User', 'Token']. */
	nodes: string[];
	/** Draw a return path from the last node back to the first (default true). */
	returnPath?: boolean;
}

// Layout constants mirror the reference diagram proportions.
const BOX_W = 80;
const BOX_H = 60;
const STEP = 130; // distance between successive box left edges
const Y = 30;
const MARGIN = 10;

export const FlowDiagram: React.FC<FlowDiagramProps> = ({ label, nodes, returnPath = true }) => {
	const n = Math.max(nodes.length, 1);
	const lastX = MARGIN + (n - 1) * STEP;
	const width = lastX + BOX_W + MARGIN;
	const arrowId = `fd-arrow-${nodes.join('-').replace(/[^a-zA-Z0-9]/g, '')}`;
	const firstCenter = MARGIN + BOX_W / 2;
	const lastCenter = lastX + BOX_W / 2;

	return (
		<Frame>
			<Label>{label}</Label>
			<svg viewBox={`0 0 ${width} 120`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
				<defs>
					<marker id={arrowId} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
						<polygon points="0 0, 10 3, 0 6" fill={tokens.color.accent} />
					</marker>
				</defs>
				{nodes.map((node, i) => {
					const x = MARGIN + i * STEP;
					const fill = i % 2 === 0 ? tokens.color.accent : tokens.color.primary;
					return (
						<g key={node + i}>
							<rect x={x} y={Y} width={BOX_W} height={BOX_H} fill={fill} rx="4" />
							<text
								x={x + BOX_W / 2}
								y={Y + BOX_H / 2 + 5}
								textAnchor="middle"
								fontSize="12"
								fontWeight="bold"
								fill="#fff"
							>
								{node}
							</text>
							{i < nodes.length - 1 && (
								<path
									d={`M ${x + BOX_W} ${Y + BOX_H / 2} L ${x + STEP} ${Y + BOX_H / 2}`}
									stroke={tokens.color.accent}
									strokeWidth="2"
									markerEnd={`url(#${arrowId})`}
								/>
							)}
						</g>
					);
				})}
				{returnPath && nodes.length > 1 && (
					<path
						d={`M ${lastCenter} 95 L ${lastCenter} 110 L ${firstCenter} 110 L ${firstCenter} 95`}
						stroke={tokens.color.neutral300}
						strokeWidth="1"
						fill="none"
					/>
				)}
			</svg>
		</Frame>
	);
};
