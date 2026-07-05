// src/flows2/framework/__tests__/FlowSequenceDiagram.test.tsx
//
// Behavioural tests for the live sequence diagram: actor + interaction rendering,
// step-driven highlighting (data-state = active|done|future), and graceful
// skipping of interactions that reference an unknown actor.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
	FlowSequenceDiagram,
	type SequenceActor,
	type SequenceInteraction,
} from '../FlowSequenceDiagram';

const actors: SequenceActor[] = [
	{ id: 'browser', label: 'Browser / User' },
	{ id: 'app', label: 'Your App' },
	{ id: 'authz', label: 'PingOne AuthZ' },
];

const interactions: SequenceInteraction[] = [
	{ id: 'i-configure', from: 'app', to: 'authz', label: 'register client', stepId: 'configure' },
	{ id: 'i-authorize', from: 'browser', to: 'authz', label: 'GET /as/authorize', stepId: 'authorize' },
	{ id: 'i-redirect', from: 'authz', to: 'browser', label: '302 Redirect', dashed: true, stepId: 'authorize' },
	{ id: 'i-exchange', from: 'app', to: 'authz', label: 'POST /as/token', stepId: 'exchange' },
];

function renderDiagram(overrides: Partial<React.ComponentProps<typeof FlowSequenceDiagram>> = {}) {
	return render(
		<FlowSequenceDiagram
			actors={actors}
			interactions={interactions}
			activeStepId="authorize"
			completedStepIds={new Set(['configure'])}
			title="Authorization Code Sequence"
			{...overrides}
		/>
	);
}

describe('FlowSequenceDiagram', () => {
	it('renders every actor label', () => {
		renderDiagram();
		for (const actor of actors) {
			expect(screen.getByText(actor.label)).toBeInTheDocument();
		}
	});

	it('renders each interaction label', () => {
		renderDiagram();
		for (const it of interactions) {
			expect(screen.getByText(it.label)).toBeInTheDocument();
		}
	});

	it('marks the active-step interactions with data-state="active"', () => {
		const { container } = renderDiagram();
		const active = container.querySelectorAll('.seq-arrow[data-state="active"]');
		// Both "authorize"-step interactions (request + redirect) should be active.
		expect(active.length).toBe(2);
		active.forEach((g) => {
			expect(g.getAttribute('data-step-id')).toBe('authorize');
		});
	});

	it('marks completed-step interactions "done" and future ones "future"', () => {
		const { container } = renderDiagram();
		const done = container.querySelectorAll('.seq-arrow[data-state="done"]');
		const future = container.querySelectorAll('.seq-arrow[data-state="future"]');
		expect(done.length).toBe(1); // configure
		expect(future.length).toBe(1); // exchange
	});

	it('gracefully skips interactions referencing an unknown actor', () => {
		const withBadRef: SequenceInteraction[] = [
			...interactions,
			{ id: 'i-bogus', from: 'app', to: 'ghost', label: 'to nowhere', stepId: 'authorize' },
			{ id: 'i-bogus2', from: 'phantom', to: 'app', label: 'from nowhere', stepId: 'authorize' },
		];
		const { container } = renderDiagram({ interactions: withBadRef });
		// The bad interactions are dropped; only the 4 valid ones are drawn.
		expect(container.querySelectorAll('.seq-arrow').length).toBe(4);
		expect(screen.queryByText('to nowhere')).not.toBeInTheDocument();
		expect(screen.queryByText('from nowhere')).not.toBeInTheDocument();
	});

	it('renders actors and lifelines with an empty interaction set', () => {
		const { container } = renderDiagram({ interactions: [] });
		expect(container.querySelectorAll('.seq-arrow').length).toBe(0);
		expect(screen.getByText('Your App')).toBeInTheDocument();
	});

	it('exposes an accessible role/label from the title', () => {
		renderDiagram({ title: 'My Sequence' });
		expect(screen.getByRole('img', { name: 'My Sequence' })).toBeInTheDocument();
	});
});
