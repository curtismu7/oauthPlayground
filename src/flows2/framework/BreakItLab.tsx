// src/flows2/framework/BreakItLab.tsx
//
// Presentational "Break-it Lab" panel. A learner picks a sabotage scenario for the
// current step's stage, runs the step, and the panel compares the server's actual
// response to the predicted error — teaching what each security check defends.
//
// This component holds no flow logic: selection is lifted to the parent via `onSelect`,
// and the actual run outcome is passed back in via `lastOutcome`. The parent decides
// when to call `applyAuthzCodeSabotage` and how to run the request.

import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { tokens } from './tokens';
import { Pill, Toggle } from './primitives';
import type { SabotageScenario, SabotageStage } from './sabotage';

export interface BreakItLabProps {
	scenarios: SabotageScenario[];
	/** Only scenarios for this stage are shown. */
	stage: SabotageStage;
	selectedId: string | null;
	/** Toggle a scenario; null = "run it correctly". */
	onSelect: (id: string | null) => void;
	/** The actual result after running the step, if any. */
	lastOutcome?: { error?: { error: string; error_description?: string } | null; ok?: boolean } | null;
}

const Panel = styled.section`
	border: 1px solid ${tokens.color.errorBorder};
	border-radius: ${tokens.radius.xl};
	background: ${tokens.color.errorBg};
	overflow: hidden;
`;

const Header = styled.button<{ $open: boolean }>`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${tokens.space.md};
	padding: ${tokens.space.lg} ${tokens.space.xl};
	background: transparent;
	border: none;
	cursor: pointer;
	font-size: 0.9rem;
	font-weight: 700;
	color: ${tokens.color.errorMuted};
	text-align: left;
`;

const Chevron = styled.span<{ $open: boolean }>`
	font-size: 0.75rem;
	transition: transform 150ms ease;
	transform: rotate(${({ $open }) => ($open ? '90deg' : '0deg')});
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

const Body = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${tokens.space.lg};
	padding: 0 ${tokens.space.xl} ${tokens.space.xl};
`;

const SectionLabel = styled.div`
	font-size: 0.7rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: ${tokens.color.textMuted};
	margin-bottom: ${tokens.space.xs};
`;

// A neutral "run correctly" pill uses the accent (teal) vocabulary; scenario pills stay
// on the standard Pill styling so the destructive intent is carried by the panel chrome.
const InfoCard = styled.div<{ $tone: 'error' | 'success' | 'neutral' }>`
	border-radius: ${tokens.radius.md};
	padding: ${tokens.space.md} ${tokens.space.lg};
	font-size: 0.82rem;
	line-height: 1.5;
	border: 1px solid
		${({ $tone }) =>
			$tone === 'error'
				? tokens.color.errorBorder
				: $tone === 'success'
					? tokens.color.successBorder
					: tokens.color.border};
	background: ${({ $tone }) =>
		$tone === 'error' ? '#fff' : $tone === 'success' ? tokens.color.successBg : tokens.color.bg};
	color: ${tokens.color.text};
`;

const ErrorCode = styled.code`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.78rem;
	color: ${tokens.color.errorMuted};
`;

const Defends = styled.p`
	margin: 0;
	font-size: 0.82rem;
	line-height: 1.5;
	color: ${tokens.color.successHover};
	background: ${tokens.color.successBg};
	border-left: 3px solid ${tokens.color.success};
	border-radius: 0 ${tokens.radius.md} ${tokens.radius.md} 0;
	padding: ${tokens.space.md} ${tokens.space.lg};
`;

const Field = styled.div`
	& + & {
		margin-top: ${tokens.space.sm};
	}
`;

/** Did the actual outcome's error code match the scenario's predicted error code? */
function matchedPrediction(
	scenario: SabotageScenario,
	lastOutcome: BreakItLabProps['lastOutcome']
): boolean {
	return Boolean(lastOutcome?.error && lastOutcome.error.error === scenario.expectedError.error);
}

export const BreakItLab: React.FC<BreakItLabProps> = ({
	scenarios,
	stage,
	selectedId,
	onSelect,
	lastOutcome,
}) => {
	const [open, setOpen] = useState(false);

	const stageScenarios = useMemo(
		() => scenarios.filter((s) => s.stage === stage),
		[scenarios, stage]
	);

	const selected = useMemo(
		() => stageScenarios.find((s) => s.id === selectedId) ?? null,
		[stageScenarios, selectedId]
	);

	// Nothing to sabotage at this stage → render nothing.
	if (stageScenarios.length === 0) return null;

	return (
		<Panel>
			<Header
				type="button"
				$open={open}
				aria-expanded={open}
				onClick={() => setOpen((o) => !o)}
			>
				<span>🧪 Break-it Lab</span>
				<Chevron $open={open} aria-hidden>
					▶
				</Chevron>
			</Header>

			{open && (
				<Body>
					<div>
						<SectionLabel>Pick a sabotage — then run this step</SectionLabel>
						<Toggle>
							<Pill
								type="button"
								$active={selectedId === null}
								onClick={() => onSelect(null)}
							>
								Run it correctly
							</Pill>
							{stageScenarios.map((s) => (
								<Pill
									key={s.id}
									type="button"
									$active={selectedId === s.id}
									onClick={() => onSelect(selectedId === s.id ? null : s.id)}
								>
									{s.label}
								</Pill>
							))}
						</Toggle>
					</div>

					{selected && (
						<>
							<InfoCard $tone="neutral">
								<Field>
									<strong>What changes:</strong> {selected.what}
								</Field>
								{selected.simulateOnly && (
									<Field>
										<em>
											Simulated — this rejection needs a prior successful exchange, so
											the predicted error is shown without a live call.
										</em>
									</Field>
								)}
							</InfoCard>

							<InfoCard $tone="error">
								<Field>
									<strong>Predicted rejection:</strong>{' '}
									<ErrorCode>{selected.expectedError.error}</ErrorCode>
									{typeof selected.expectedError.status === 'number' && (
										<> (HTTP {selected.expectedError.status})</>
									)}
								</Field>
								<Field>{selected.expectedError.error_description}</Field>
							</InfoCard>

							{/* Compare the actual run outcome to the prediction. */}
							{!selected.simulateOnly &&
								(lastOutcome == null ? (
									<InfoCard $tone="neutral">
										Run the step to see how the authorization server responds.
									</InfoCard>
								) : matchedPrediction(selected, lastOutcome) ? (
									<InfoCard $tone="success">
										✓ Server rejected it as predicted:{' '}
										<ErrorCode>{lastOutcome!.error!.error}</ErrorCode>
										{lastOutcome!.error!.error_description
											? ` — ${lastOutcome!.error!.error_description}`
											: ''}
									</InfoCard>
								) : lastOutcome.error ? (
									<InfoCard $tone="neutral">
										Server returned{' '}
										<ErrorCode>{lastOutcome.error.error}</ErrorCode>, which differs from
										the predicted <ErrorCode>{selected.expectedError.error}</ErrorCode>.
									</InfoCard>
								) : (
									<InfoCard $tone="neutral">
										The step succeeded — the sabotage did not trigger the predicted
										rejection this time.
									</InfoCard>
								))}

							<Defends>
								<strong>Why the check exists:</strong> {selected.defends}
							</Defends>
						</>
					)}
				</Body>
			)}
		</Panel>
	);
};
