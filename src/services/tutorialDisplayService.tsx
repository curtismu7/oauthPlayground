// src/services/tutorialDisplayService.tsx
// ⭐ V6 SERVICE - Enhanced tutorial display service using react-joyride
// Used in: InteractiveTutorials, OAuthOIDCTraining
// Purpose: Provides better organized, step-by-step tutorial experiences

import React, { useCallback, useState } from 'react';
import Joyride, { CallBackProps, EVENTS, STATUS } from 'react-joyride';
import styled from 'styled-components';

export interface TutorialStep {
	id: string;
	title: string;
	content: React.ReactNode;
	target?: string;
	placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
	disableBeacon?: boolean;
	hideFooter?: boolean;
}

export interface TutorialConfig {
	id: string;
	title: string;
	description: string;
	steps: TutorialStep[];
	continuous?: boolean;
	showProgress?: boolean;
	showSkipButton?: boolean;
	locale?: {
		back?: string;
		close?: string;
		last?: string;
		next?: string;
		skip?: string;
	};
}

export interface TutorialDisplayServiceConfig {
	theme?: 'light' | 'dark' | 'blue' | 'green';
	width?: number;
	height?: number;
	borderRadius?: number;
	primaryColor?: string;
}

const TutorialContainer = styled.div<{ $theme: string }>`
  .joyride-tooltip {
    border-radius: ${(props) => (props.$theme === 'blue' ? '12px' : '8px')};
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .joyride-tooltip-content {
    padding: 24px;
  }

  .joyride-tooltip-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: #1f2937;
  }

  .joyride-tooltip-description {
    font-size: 1rem;
    line-height: 1.6;
    color: #4b5563;
    margin-bottom: 16px;
  }

  .joyride-tooltip-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  .joyride-button {
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .joyride-button--primary {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }

  .joyride-button--primary:hover {
    background: #2563eb;
    border-color: #2563eb;
  }

  .joyride-button--secondary {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
  }

  .joyride-button--secondary:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }

  .joyride-progress {
    background: #e5e7eb;
    border-radius: 4px;
    height: 4px;
    margin-bottom: 16px;
  }

  .joyride-progress-bar {
    background: #3b82f6;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
`;

const TutorialCard = styled.div<{ $theme: string }>`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 8px;
    color: #1f2937;
  }

  p {
    color: #6b7280;
    margin-bottom: 16px;
    line-height: 1.6;
  }

  .tutorial-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: #9ca3af;
  }
`;

const DifficultyBadge = styled.span<{ $difficulty: string }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  ${(props) => {
		switch (props.$difficulty) {
			case 'beginner':
				return 'background: #dcfce7; color: #166534;';
			case 'intermediate':
				return 'background: #fef3c7; color: #92400e;';
			case 'advanced':
				return 'background: #fee2e2; color: #dc2626;';
			default:
				return 'background: #f3f4f6; color: #6b7280;';
		}
	}}
`;

const TutorialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StartButton = styled.button<{ $disabled?: boolean }>`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
  pointer-events: ${(props) => (props.$disabled ? 'none' : 'auto')};

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

export class TutorialDisplayService {
	static createTutorialDisplay(config: TutorialDisplayServiceConfig = {}) {
		const { theme = 'blue', primaryColor = '#3b82f6' } = config;

		return function TutorialDisplay({
			tutorials,
			onTutorialStart,
			onTutorialComplete,
		}: {
			tutorials: TutorialConfig[];
			onTutorialStart?: (tutorial: TutorialConfig) => void;
			onTutorialComplete?: (tutorial: TutorialConfig) => void;
		}) {
			const [run, setRun] = useState(false);
			const [stepIndex, setStepIndex] = useState(0);
			const [currentTutorial, setCurrentTutorial] = useState<TutorialConfig | null>(null);
			const [steps, setSteps] = useState<Step[]>([]);

			const handleTutorialStart = useCallback(
				(tutorial: TutorialConfig) => {
					const joyrideSteps: Step[] = tutorial.steps.map((step) => ({
						target: step.target || 'body',
						content: (
							<div>
								<h4>{step.title}</h4>
								<div>{step.content}</div>
							</div>
						),
						placement: step.placement || 'auto',
						disableBeacon: step.disableBeacon || false,
						hideFooter: step.hideFooter || false,
					}));

					setSteps(joyrideSteps);
					setCurrentTutorial(tutorial);
					setRun(true);
					setStepIndex(0);
					onTutorialStart?.(tutorial);
				},
				[onTutorialStart]
			);

			const handleJoyrideCallback = useCallback(
				(data: CallBackProps) => {
					const { status, type } = data;

					if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
						// Update state to advance the tour
						setStepIndex(data.index + (data.action === 'prev' ? -1 : 1));
					} else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
						// Need to set our running state to false, so we can restart if we click start again.
						setRun(false);
						setStepIndex(0);
						if (currentTutorial && status === STATUS.FINISHED) {
							onTutorialComplete?.(currentTutorial);
						}
					}
				},
				[currentTutorial, onTutorialComplete]
			);

			return (
				<TutorialContainer $theme={theme}>
					<TutorialGrid>
						{tutorials.map((tutorial) => (
							<TutorialCard
								key={tutorial.id}
								$theme={theme}
								onClick={() => handleTutorialStart(tutorial)}
							>
								<h3>{tutorial.title}</h3>
								<p>{tutorial.description}</p>
								<div className="tutorial-meta">
									<span>{tutorial.steps.length} steps</span>
									<DifficultyBadge $difficulty="beginner">Beginner</DifficultyBadge>
								</div>
								<StartButton onClick={() => handleTutorialStart(tutorial)}>
									Start Tutorial
								</StartButton>
							</TutorialCard>
						))}
					</TutorialGrid>

					<Joyride
						callback={handleJoyrideCallback}
						continuous={currentTutorial?.continuous !== false}
						run={run}
						stepIndex={stepIndex}
						steps={steps}
						showProgress={currentTutorial?.showProgress !== false}
						showSkipButton={currentTutorial?.showSkipButton !== false}
						styles={{
							options: {
								primaryColor,
								width: 400,
								zIndex: 10000,
							},
						}}
						locale={
							currentTutorial?.locale || {
								back: 'Back',
								close: 'Close',
								last: 'Finish',
								next: 'Next',
								skip: 'Skip',
							}
						}
					/>
				</TutorialContainer>
			);
		};
	}

	static createTutorialSteps(tutorial: TutorialConfig): TutorialStep[] {
		return tutorial.steps;
	}

	static createTutorialCard(tutorial: TutorialConfig, onStart: () => void) {
		return (
			<TutorialCard key={tutorial.id} $theme="blue">
				<h3>{tutorial.title}</h3>
				<p>{tutorial.description}</p>
				<div className="tutorial-meta">
					<span>{tutorial.steps.length} steps</span>
					<DifficultyBadge $difficulty="beginner">Beginner</DifficultyBadge>
				</div>
				<StartButton onClick={onStart}>Start Tutorial</StartButton>
			</TutorialCard>
		);
	}
}

export default TutorialDisplayService;
