// src/flows2/learning/__tests__/CheckpointModal.test.tsx

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Checkpoint } from '../../content/learningPaths';
import { CheckpointModal } from '../CheckpointModal';

const twoCheckpoints: Checkpoint[] = [
	{
		question: 'Which grant is machine-to-machine?',
		options: ['authorization_code', 'client_credentials', 'implicit'],
		correctAnswer: 1,
		explanation: 'client_credentials authenticates the app itself.',
	},
	{
		question: 'Which scope yields a refresh token?',
		options: ['openid', 'offline_access', 'email'],
		correctAnswer: 1,
		explanation: 'offline_access signals a refresh token is wanted.',
	},
];

describe('CheckpointModal', () => {
	it('renders the first question and its options', () => {
		render(
			<CheckpointModal
				stepTitle="Client Credentials"
				checkpoints={twoCheckpoints}
				onPass={vi.fn()}
				onClose={vi.fn()}
			/>
		);
		expect(screen.getByText('Which grant is machine-to-machine?')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'client_credentials' })).toBeInTheDocument();
		expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
	});

	it('reveals the explanation on a wrong answer and does NOT call onPass', () => {
		const onPass = vi.fn();
		render(
			<CheckpointModal
				stepTitle="Client Credentials"
				checkpoints={twoCheckpoints}
				onPass={onPass}
				onClose={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByRole('button', { name: 'authorization_code' }));

		// Explanation is surfaced with a "try again" nudge.
		expect(screen.getByText(/client_credentials authenticates the app itself/)).toBeInTheDocument();
		expect(screen.getByText(/try again/i)).toBeInTheDocument();
		// The Finish/Next action stays disabled and onPass has not fired.
		expect(onPass).not.toHaveBeenCalled();
	});

	it('calls onPass only after every question is answered correctly', () => {
		const onPass = vi.fn();
		render(
			<CheckpointModal
				stepTitle="Client Credentials"
				checkpoints={twoCheckpoints}
				onPass={onPass}
				onClose={vi.fn()}
			/>
		);

		// Q1 correct → advance.
		fireEvent.click(screen.getByRole('button', { name: 'client_credentials' }));
		expect(onPass).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Next question' }));

		// Q2 appears.
		expect(screen.getByText('Which scope yields a refresh token?')).toBeInTheDocument();
		expect(onPass).not.toHaveBeenCalled();

		// Q2 correct → finish → onPass fires.
		fireEvent.click(screen.getByRole('button', { name: 'offline_access' }));
		fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
		expect(onPass).toHaveBeenCalledTimes(1);
		// Success state is shown before close.
		expect(screen.getByText('Checkpoint passed')).toBeInTheDocument();
	});

	it('allows retry after a wrong answer and then passes on the correct option', () => {
		const onPass = vi.fn();
		render(
			<CheckpointModal
				stepTitle="Refresh"
				checkpoints={[twoCheckpoints[1]]}
				onPass={onPass}
				onClose={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByRole('button', { name: 'openid' }));
		expect(onPass).not.toHaveBeenCalled();
		// Retry with the correct option.
		fireEvent.click(screen.getByRole('button', { name: 'offline_access' }));
		fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
		expect(onPass).toHaveBeenCalledTimes(1);
	});

	it('closes on Escape', () => {
		const onClose = vi.fn();
		render(
			<CheckpointModal
				stepTitle="Client Credentials"
				checkpoints={twoCheckpoints}
				onPass={vi.fn()}
				onClose={onClose}
			/>
		);
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(onClose).toHaveBeenCalled();
	});
});
