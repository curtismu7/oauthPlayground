// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/components/FlowSteps.tsx
// V7.1 Flow Steps - Step-by-step flow execution and display

import { FiCheck, FiClock, FiPlay, FiRefreshCw } from '@icons';
import React from 'react';
import styled from 'styled-components';
import { STEP_METADATA } from '../constants/stepMetadata';
import { UI_CONSTANTS } from '../constants/uiConstants';
import type { FlowVariant, StepCompletionState } from '../types/flowTypes';

interface FlowStepsProps {
	currentStep: number;
	totalSteps: number;
	stepCompletion: StepCompletionState;
	flowVariant: FlowVariant;
	onStepClick?: (step: number) => void;
	showStepDetails?: boolean;
	showProgress?: boolean;
	isInteractive?: boolean;
}

const StepsContainer = styled.div`
  background: ${UI_CONSTANTS.SECTION.BACKGROUND};
  border: ${UI_CONSTANTS.SECTION.BORDER};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  padding: ${UI_CONSTANTS.SPACING.LG};
  margin-bottom: ${UI_CONSTANTS.SPACING.LG};
`;

const StepsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${UI_CONSTANTS.SPACING.LG};
`;

const StepsTitle = styled.h3`
  margin: 0;
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.LG};
  font-weight: ${UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.SEMIBOLD};
  color: ${UI_CONSTANTS.COLORS.GRAY_900};
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.SM};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  color: ${UI_CONSTANTS.COLORS.GRAY_600};
`;

const StepsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${UI_CONSTANTS.SPACING.MD};
`;

const StepItem = styled.div<{
	$isActive: boolean;
	$isCompleted: boolean;
	$isClickable: boolean;
	$variant: FlowVariant;
}>`
  display: flex;
  align-items: flex-start;
  gap: ${UI_CONSTANTS.SPACING.MD};
  padding: ${UI_CONSTANTS.SPACING.LG};
  background: ${(props) => {
		if (props.$isActive) {
			return props.$variant === 'oidc'
				? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
				: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
		}
		return UI_CONSTANTS.COLORS.WHITE;
	}};
  border: 2px solid ${(props) => {
		if (props.$isActive) {
			return props.$variant === 'oidc' ? '#3b82f6' : '#16a34a';
		}
		if (props.$isCompleted) {
			return '#10b981';
		}
		return UI_CONSTANTS.COLORS.GRAY_200;
	}};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  cursor: ${(props) => (props.$isClickable ? 'pointer' : 'default')};
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  &:hover {
    ${(props) =>
			props.$isClickable &&
			`
      transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
      box-shadow: ${UI_CONSTANTS.SECTION.CARD_SHADOW};
    `}
  }
`;

const StepIcon = styled.div<{
	$isActive: boolean;
	$isCompleted: boolean;
	$variant: FlowVariant;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(props) => {
		if (props.$isCompleted) {
			return '#10b981';
		}
		if (props.$isActive) {
			return props.$variant === 'oidc' ? '#3b82f6' : '#16a34a';
		}
		return UI_CONSTANTS.COLORS.GRAY_300;
	}};
  color: ${(props) => {
		if (props.$isCompleted || props.$isActive) {
			return UI_CONSTANTS.COLORS.WHITE;
		}
		return UI_CONSTANTS.COLORS.GRAY_600;
	}};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.LG};
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
`;

const StepContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${UI_CONSTANTS.SPACING.SM};
`;

const StepTitle = styled.div<{ $isActive: boolean; $isCompleted: boolean }>`
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.BASE};
  font-weight: ${(props) =>
		props.$isActive
			? UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.SEMIBOLD
			: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.MEDIUM};
  color: ${(props) => {
		if (props.$isActive) {
			return UI_CONSTANTS.COLORS.GRAY_900;
		}
		if (props.$isCompleted) {
			return UI_CONSTANTS.COLORS.GRAY - 700;
		}
		return UI_CONSTANTS.COLORS.GRAY_600;
	}};
`;

const StepDescription = styled.div<{ $isActive: boolean; $isCompleted: boolean }>`
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  color: ${(props) => {
		if (props.$isActive) {
			return UI_CONSTANTS.COLORS.GRAY_700;
		}
		if (props.$isCompleted) {
			return UI_CONSTANTS.COLORS.GRAY_500;
		}
		return UI_CONSTANTS.COLORS.GRAY_500;
	}};
  line-height: ${UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.RELAXED};
`;

const StepStatus = styled.div<{ $status: 'pending' | 'active' | 'completed' }>`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.XS};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.XS};
  font-weight: ${UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.MEDIUM};
  text-transform: uppercase;
  letter-spacing: ${UI_CONSTANTS.TYPOGRAPHY.LETTER_SPACING.WIDE};
  
  ${({ $status }) => {
		switch ($status) {
			case 'completed':
				return `
          color: #10b981;
        `;
			case 'active':
				return `
          color: #3b82f6;
        `;
			case 'pending':
				return `
          color: ${UI_CONSTANTS.COLORS.GRAY_500};
        `;
			default:
				return '';
		}
	}}
`;

const StepActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.SM};
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.XS};
  padding: ${UI_CONSTANTS.SPACING.SM} ${UI_CONSTANTS.SPACING.MD};
  border: none;
  border-radius: ${UI_CONSTANTS.BUTTON.PRIMARY_BORDER_RADIUS};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  font-weight: ${UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.MEDIUM};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background: ${UI_CONSTANTS.BUTTON.PRIMARY_BACKGROUND};
          color: ${UI_CONSTANTS.BUTTON.PRIMARY_COLOR};
          
          &:hover {
            background: ${UI_CONSTANTS.COLORS.BLUE_600};
            transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
          }
        `;
			case 'secondary':
				return `
          background: ${UI_CONSTANTS.COLORS.GRAY_200};
          color: ${UI_CONSTANTS.COLORS.GRAY_600};
          
          &:hover {
            background: ${UI_CONSTANTS.COLORS.GRAY_300};
            transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
          }
        `;
			default:
				return '';
		}
	}}
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: ${UI_CONSTANTS.COLORS.GRAY_200};
  border-radius: 2px;
  overflow: hidden;
  margin-top: ${UI_CONSTANTS.SPACING.LG};
`;

const ProgressFill = styled.div<{ $progress: number; $variant: FlowVariant }>`
  height: 100%;
  background: ${(props) =>
		props.$variant === 'oidc'
			? 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)'
			: 'linear-gradient(90deg, #16a34a 0%, #15803d 100%)'};
  width: ${(props) => props.$progress}%;
  transition: width ${UI_CONSTANTS.ANIMATION.DURATION_SLOW} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
`;

export const FlowSteps: React.FC<FlowStepsProps> = ({
	currentStep,
	totalSteps,
	stepCompletion,
	flowVariant,
	onStepClick,
	showStepDetails = true,
	showProgress = true,
	isInteractive = true,
}) => {
	const getStepStatus = (stepIndex: number): 'pending' | 'active' | 'completed' => {
		if (stepCompletion[stepIndex] === true) {
			return 'completed';
		}
		if (stepIndex === currentStep) {
			return 'active';
		}
		return 'pending';
	};

	const getStepIcon = (_stepIndex: number, status: 'pending' | 'active' | 'completed') => {
		if (status === 'completed') {
			return <FiCheck />;
		}
		if (status === 'active') {
			return <FiPlay />;
		}
		return <FiClock />;
	};

	const getStepStatusText = (status: 'pending' | 'active' | 'completed') => {
		switch (status) {
			case 'completed':
				return 'Completed';
			case 'active':
				return 'In Progress';
			case 'pending':
				return 'Pending';
			default:
				return 'Unknown';
		}
	};

	const progress = ((currentStep + 1) / totalSteps) * 100;
	const completedSteps = Object.values(stepCompletion).filter(Boolean).length;

	return (
		<StepsContainer>
			<StepsHeader>
				<StepsTitle>Flow Steps</StepsTitle>
				<ProgressIndicator>
					<span>
						{completedSteps} of {totalSteps} completed
					</span>
				</ProgressIndicator>
			</StepsHeader>

			<StepsList>
				{Array.from({ length: totalSteps }, (_, index) => {
					const status = getStepStatus(index);
					const stepConfig = STEP_METADATA[`STEP_${index}` as keyof typeof STEP_METADATA];
					const isClickable = isInteractive && (status === 'completed' || index === currentStep);

					return (
						<StepItem
							key={index}
							$isActive={status === 'active'}
							$isCompleted={status === 'completed'}
							$isClickable={isClickable}
							$variant={flowVariant}
							onClick={() => isClickable && onStepClick?.(index)}
						>
							<StepIcon
								$isActive={status === 'active'}
								$isCompleted={status === 'completed'}
								$variant={flowVariant}
							>
								{getStepIcon(index, status)}
							</StepIcon>

							<StepContent>
								<StepTitle $isActive={status === 'active'} $isCompleted={status === 'completed'}>
									{stepConfig?.title || `Step ${index + 1}`}
								</StepTitle>

								{showStepDetails && (
									<StepDescription
										$isActive={status === 'active'}
										$isCompleted={status === 'completed'}
									>
										{stepConfig?.subtitle || `Complete step ${index + 1} of the flow`}
									</StepDescription>
								)}

								<StepStatus $status={status}>{getStepStatusText(status)}</StepStatus>
							</StepContent>

							{status === 'active' && (
								<StepActions>
									<ActionButton $variant="primary">
										<FiPlay />
										Continue
									</ActionButton>
								</StepActions>
							)}

							{status === 'completed' && (
								<StepActions>
									<ActionButton $variant="secondary">
										<FiRefreshCw />
										Review
									</ActionButton>
								</StepActions>
							)}
						</StepItem>
					);
				})}
			</StepsList>

			{showProgress && (
				<ProgressBar>
					<ProgressFill $progress={progress} $variant={flowVariant} />
				</ProgressBar>
			)}
		</StepsContainer>
	);
};

export default FlowSteps;
