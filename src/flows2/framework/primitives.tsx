// src/flows2/framework/primitives.tsx
//
// Shared look-and-feel primitives for flows2, extracted from the
// /v2/flows/authorization-code reference so every flow renders the same
// signature design language (deep indigo + teal accent, IBM Plex Mono) without
// each page re-declaring a local DESIGN object. Import these instead of
// hand-rolling buttons/pills/notes per flow.

import styled from 'styled-components';
import { tokens } from './tokens';

const MONO = "'IBM Plex Mono', monospace";

// Row of pills (spec toggle, OIDC toggle, grouped actions). Wraps on small screens.
export const Toggle = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
`;

// Signature pill button — the spec/OIDC toggle vocabulary. Active = teal fill.
export const Pill = styled.button<{ $active: boolean }>`
	font-size: 0.82rem;
	font-weight: 600;
	padding: 0.4rem 0.9rem;
	border-radius: 8px;
	cursor: pointer;
	border: 2px solid ${({ $active }) => ($active ? tokens.color.accent : tokens.color.neutral300)};
	background: ${({ $active }) => ($active ? tokens.color.accent : tokens.color.neutral100)};
	color: ${({ $active }) => ($active ? '#fff' : tokens.color.primary)};
	transition: all 150ms ease;
	&:hover {
		border-color: ${tokens.color.accent};
	}
`;

// Primary in-step action button (Generate, Authorize, Exchange, …). Teal, mono.
export const Action = styled.button`
	align-self: flex-start;
	font-family: ${MONO};
	font-size: 0.85rem;
	font-weight: 700;
	letter-spacing: 0.05em;
	padding: 0.7rem 1.4rem;
	border-radius: 8px;
	border: none;
	background: ${tokens.color.accent};
	color: #fff;
	cursor: pointer;
	transition: all 150ms ease;
	&:hover:not(:disabled) {
		background: ${tokens.color.accentHover};
		transform: translateY(-1px);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

// Inline teaching/caveat note with a teal left rule.
export const Note = styled.p`
	margin: 0;
	font-size: 0.82rem;
	line-height: 1.5;
	color: ${tokens.color.neutral600};
	background: ${tokens.color.neutral100};
	border-left: 3px solid ${tokens.color.accent};
	border-radius: 0 8px 8px 0;
	padding: 0.75rem 1rem;
`;

// Two-column responsive field grid for the Configure step.
export const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.9rem;
	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;
