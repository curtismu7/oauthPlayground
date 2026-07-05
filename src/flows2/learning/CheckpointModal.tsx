// src/flows2/learning/CheckpointModal.tsx
//
// A modal quiz gate between path steps. Renders the step's checkpoint questions one
// at a time; a step is only "passed" once every question is answered correctly (retry
// allowed). Accessible dialog: role/aria-modal, Escape + backdrop close, focus trap-lite,
// and prefers-reduced-motion honored.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import type { Checkpoint } from '../content/learningPaths';
import { tokens } from '../framework/tokens';

const MONO = "'IBM Plex Mono', monospace";

const fadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;

const popIn = keyframes`
	from { opacity: 0; transform: translateY(8px) scale(0.98); }
	to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Backdrop = styled.div`
	position: fixed;
	inset: 0;
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	background: rgba(15, 23, 42, 0.55);
	animation: ${fadeIn} 150ms ease;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

const Dialog = styled.div`
	position: relative;
	width: 100%;
	max-width: 560px;
	max-height: 90vh;
	overflow-y: auto;
	background: ${tokens.color.bg};
	border: 1px solid ${tokens.color.border};
	border-radius: ${tokens.radius.xl};
	box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
	padding: ${tokens.space['3xl']};
	animation: ${popIn} 180ms ease;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

const CloseButton = styled.button`
	position: absolute;
	top: 0.9rem;
	right: 0.9rem;
	width: 2rem;
	height: 2rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 1.1rem;
	line-height: 1;
	border: 1px solid ${tokens.color.border};
	border-radius: ${tokens.radius.pill};
	background: ${tokens.color.bgSubtle};
	color: ${tokens.color.textMuted};
	cursor: pointer;
	transition: all 150ms ease;
	&:hover {
		background: ${tokens.color.neutral300};
		color: ${tokens.color.text};
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

const Eyebrow = styled.p`
	margin: 0 0 0.25rem;
	font-family: ${MONO};
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: ${tokens.color.accent};
`;

const Title = styled.h2`
	margin: 0 0 0.25rem;
	font-size: 1.25rem;
	font-weight: 700;
	color: ${tokens.color.text};
`;

const Progress = styled.p`
	margin: 0 0 1.25rem;
	font-family: ${MONO};
	font-size: 0.75rem;
	color: ${tokens.color.textMuted};
`;

const Question = styled.p`
	margin: 0 0 1rem;
	font-size: 1rem;
	font-weight: 600;
	line-height: 1.5;
	color: ${tokens.color.text};
`;

const Options = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
`;

const Option = styled.button<{ $state: 'idle' | 'correct' | 'wrong' | 'muted' }>`
	text-align: left;
	font-size: 0.9rem;
	line-height: 1.45;
	padding: 0.7rem 0.9rem;
	border-radius: ${tokens.radius.md};
	cursor: pointer;
	transition: all 150ms ease;
	border: 2px solid
		${({ $state }) =>
			$state === 'correct'
				? tokens.color.success
				: $state === 'wrong'
					? tokens.color.error
					: tokens.color.neutral300};
	background: ${({ $state }) =>
		$state === 'correct'
			? tokens.color.successBg
			: $state === 'wrong'
				? tokens.color.errorBg
				: tokens.color.neutral100};
	color: ${({ $state }) =>
		$state === 'correct'
			? tokens.color.successHover
			: $state === 'wrong'
				? tokens.color.errorMuted
				: tokens.color.textSecondary};
	opacity: ${({ $state }) => ($state === 'muted' ? 0.55 : 1)};
	&:hover:not(:disabled) {
		border-color: ${({ $state }) => ($state === 'idle' ? tokens.color.accent : undefined)};
	}
	&:disabled {
		cursor: default;
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

const Explanation = styled.p<{ $correct: boolean }>`
	margin: 1rem 0 0;
	font-size: 0.85rem;
	line-height: 1.5;
	padding: 0.75rem 1rem;
	border-radius: 0 ${tokens.radius.md} ${tokens.radius.md} 0;
	border-left: 3px solid
		${({ $correct }) => ($correct ? tokens.color.success : tokens.color.error)};
	background: ${({ $correct }) => ($correct ? tokens.color.successBg : tokens.color.errorBg)};
	color: ${({ $correct }) => ($correct ? tokens.color.successHover : tokens.color.errorMuted)};
`;

const Footer = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
	margin-top: 1.5rem;
`;

const Advance = styled.button`
	font-family: ${MONO};
	font-size: 0.85rem;
	font-weight: 700;
	letter-spacing: 0.05em;
	padding: 0.7rem 1.4rem;
	border-radius: ${tokens.radius.md};
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
	@media (prefers-reduced-motion: reduce) {
		transition: none;
		&:hover:not(:disabled) {
			transform: none;
		}
	}
`;

const Success = styled.div`
	text-align: center;
	padding: 1.5rem 0 0.5rem;
`;

const SuccessIcon = styled.div`
	width: 3.25rem;
	height: 3.25rem;
	margin: 0 auto 0.75rem;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
	border-radius: ${tokens.radius.pill};
	background: ${tokens.color.successBg};
	border: 2px solid ${tokens.color.successBorder};
	color: ${tokens.color.success};
`;

const SuccessTitle = styled.h3`
	margin: 0 0 0.35rem;
	font-size: 1.1rem;
	font-weight: 700;
	color: ${tokens.color.text};
`;

const SuccessText = styled.p`
	margin: 0;
	font-size: 0.9rem;
	color: ${tokens.color.textMuted};
`;

export interface CheckpointModalProps {
	stepTitle: string;
	checkpoints: Checkpoint[];
	/** Called once every checkpoint has been answered correctly. */
	onPass: () => void;
	onClose: () => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
	stepTitle,
	checkpoints,
	onPass,
	onClose,
}) => {
	const total = checkpoints.length;
	const [index, setIndex] = useState(0);
	const [selected, setSelected] = useState<number | null>(null);
	const [passed, setPassed] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);
	const passFiredRef = useRef(false);

	const firePass = useCallback(() => {
		if (passFiredRef.current) return;
		passFiredRef.current = true;
		onPass();
	}, [onPass]);

	// Empty checkpoints: nothing to gate on — pass immediately.
	useEffect(() => {
		if (total === 0) {
			firePass();
			onClose();
		}
	}, [total, firePass, onClose]);

	// Escape closes; focus the dialog on mount for keyboard users.
	useEffect(() => {
		dialogRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				onClose();
			}
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onClose]);

	if (total === 0) return null;

	const current = checkpoints[index];
	const answeredCorrectly = selected !== null && selected === current.correctAnswer;
	const isLast = index === total - 1;

	const handleSelect = (optionIndex: number) => {
		// Once correct, lock the selection; otherwise allow retry.
		if (answeredCorrectly) return;
		setSelected(optionIndex);
	};

	const handleAdvance = () => {
		if (!answeredCorrectly) return;
		if (isLast) {
			setPassed(true);
			firePass();
			return;
		}
		setIndex((i) => i + 1);
		setSelected(null);
	};

	const optionState = (optionIndex: number): 'idle' | 'correct' | 'wrong' | 'muted' => {
		if (selected === null) return 'idle';
		if (optionIndex === current.correctAnswer && selected === optionIndex) return 'correct';
		if (optionIndex === selected) return 'wrong';
		// After a wrong pick, keep other options tappable for retry.
		return answeredCorrectly ? 'muted' : 'idle';
	};

	return (
		<Backdrop
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<Dialog
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label={`Checkpoint: ${stepTitle}`}
				tabIndex={-1}
			>
				<CloseButton type="button" aria-label="Close checkpoint" onClick={onClose}>
					×
				</CloseButton>

				{passed ? (
					<Success>
						<SuccessIcon aria-hidden="true">✓</SuccessIcon>
						<SuccessTitle>Checkpoint passed</SuccessTitle>
						<SuccessText>You've completed the checkpoint for {stepTitle}.</SuccessText>
						<Footer style={{ justifyContent: 'center' }}>
							<Advance type="button" onClick={onClose}>
								Continue
							</Advance>
						</Footer>
					</Success>
				) : (
					<>
						<Eyebrow>Checkpoint</Eyebrow>
						<Title>{stepTitle}</Title>
						<Progress>
							Question {index + 1} of {total}
						</Progress>

						<Question>{current.question}</Question>
						<Options role="group" aria-label="Answer options">
							{current.options.map((option, i) => {
								const state = optionState(i);
								return (
									<Option
										key={option}
										type="button"
										$state={state}
										disabled={answeredCorrectly && i !== current.correctAnswer}
										aria-pressed={selected === i}
										onClick={() => handleSelect(i)}
									>
										{option}
									</Option>
								);
							})}
						</Options>

						{selected !== null && (
							<Explanation $correct={answeredCorrectly} role="status">
								{answeredCorrectly ? 'Correct. ' : 'Not quite — try again. '}
								{current.explanation}
							</Explanation>
						)}

						<Footer>
							<Advance type="button" disabled={!answeredCorrectly} onClick={handleAdvance}>
								{isLast ? 'Finish' : 'Next question'}
							</Advance>
						</Footer>
					</>
				)}
			</Dialog>
		</Backdrop>
	);
};

export default CheckpointModal;
