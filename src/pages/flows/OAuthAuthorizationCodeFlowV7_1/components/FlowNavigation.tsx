// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/components/FlowNavigation.tsx
// V7.1 Flow Navigation - Step navigation and flow control

import React from 'react';
import { FiChevronLeft, FiChevronRight, FiHome, FiRefreshCw } from 'react-icons/fi';
import styled from 'styled-components';
import { FLOW_CONSTANTS } from '../constants/flowConstants';
import { STEP_METADATA } from '../constants/stepMetadata';
import { UI_CONSTANTS } from '../constants/uiConstants';

interface FlowNavigationProps {
	currentStep: number;
	totalSteps: number;
	canGoBack: boolean;
	canGoForward: boolean;
	isComplete: boolean;
	onStepChange: (step: number) => void;
	onReset: () => void;
	onGoHome?: () => void;
	stepCompletion?: Record<number, boolean>;
	showStepButtons?: boolean;
	showResetButton?: boolean;
	showHomeButton?: boolean;
}

const NavigationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${UI_CONSTANTS.SPACING.LG};
  background: ${UI_CONSTANTS.LAYOUT.MAIN_CARD_BACKGROUND};
  border: ${UI_CONSTANTS.LAYOUT.MAIN_CARD_BORDER};
  border-radius: ${UI_CONSTANTS.LAYOUT.MAIN_CARD_BORDER_RADIUS};
  margin: ${UI_CONSTANTS.SPACING.LG} 0;
`;

const NavigationLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.MD};
`;

const NavigationRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.MD};
`;

const StepButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.SM};
`;

const StepButton = styled.button<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${UI_CONSTANTS.NAVIGATION.STEP_BUTTON_SIZE};
  height: ${UI_CONSTANTS.NAVIGATION.STEP_BUTTON_SIZE};
  border-radius: ${UI_CONSTANTS.NAVIGATION.STEP_BUTTON_BORDER_RADIUS};
  border: 2px solid ${(props) =>
		props.$active ? '#3b82f6' : props.$completed ? '#10b981' : '#e5e7eb'};
  background: ${(props) =>
		props.$active
			? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
			: props.$completed
				? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
				: 'transparent'};
  color: ${(props) => (props.$active ? '#ffffff' : props.$completed ? '#ffffff' : '#6b7280')};
  font-size: ${UI_CONSTANTS.NAVIGATION.STEP_BUTTON_FONT_SIZE};
  font-weight: ${UI_CONSTANTS.NAVIGATION.STEP_BUTTON_FONT_WEIGHT};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  &:hover {
    background: ${(props) =>
			props.$active
				? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'
				: props.$completed
					? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
					: '#e5e7eb'};
    transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
  }
  
  &:active {
    transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_ACTIVE};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const NavButton = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.SM};
  padding: ${UI_CONSTANTS.SPACING.MD} ${UI_CONSTANTS.SPACING.LG};
  border: none;
  border-radius: ${UI_CONSTANTS.BUTTON.PRIMARY_BORDER_RADIUS};
  font-size: ${UI_CONSTANTS.BUTTON.PRIMARY_FONT_SIZE};
  font-weight: ${UI_CONSTANTS.BUTTON.PRIMARY_FONT_WEIGHT};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background: ${UI_CONSTANTS.BUTTON.PRIMARY_BACKGROUND};
          color: ${UI_CONSTANTS.BUTTON.PRIMARY_COLOR};
          box-shadow: ${UI_CONSTANTS.BUTTON.PRIMARY_SHADOW};
          
          &:hover {
            box-shadow: ${UI_CONSTANTS.BUTTON.PRIMARY_HOVER_SHADOW};
            transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
          }
          
          &:active {
            transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_ACTIVE};
          }
        `;
			case 'secondary':
				return `
          background: ${UI_CONSTANTS.BUTTON.SECONDARY_BACKGROUND};
          color: ${UI_CONSTANTS.BUTTON.SECONDARY_COLOR};
          border: ${UI_CONSTANTS.BUTTON.SECONDARY_BORDER};
          
          &:hover {
            background: ${UI_CONSTANTS.BUTTON.SECONDARY_HOVER_BACKGROUND};
          }
        `;
			case 'danger':
				return `
          background: ${UI_CONSTANTS.STATUS.ERROR_COLOR};
          color: ${UI_CONSTANTS.COLORS.WHITE};
          
          &:hover {
            background: ${UI_CONSTANTS.COLORS.GRAY_700};
          }
        `;
			default:
				return '';
		}
	}}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 0 ${UI_CONSTANTS.SPACING.LG};
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
  width: ${(props) => props.$progress}%;
  transition: width ${UI_CONSTANTS.ANIMATION.DURATION_SLOW} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
`;

const StepInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.XS};
  min-width: 120px;
`;

const StepTitle = styled.div`
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  font-weight: ${UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.SEMIBOLD};
  color: ${UI_CONSTANTS.COLORS.GRAY_700};
  text-align: center;
`;

const StepProgress = styled.div`
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.XS};
  color: ${UI_CONSTANTS.COLORS.GRAY_500};
`;

export const FlowNavigation: React.FC<FlowNavigationProps> = ({
	currentStep,
	totalSteps,
	canGoBack,
	canGoForward,
	isComplete,
	onStepChange,
	onReset,
	onGoHome,
	stepCompletion = {},
	showStepButtons = true,
	showResetButton = true,
	showHomeButton = true,
}) => {
	const progress = ((currentStep + 1) / totalSteps) * 100;
	const currentStepConfig = STEP_METADATA[`STEP_${currentStep}` as keyof typeof STEP_METADATA];

	const handleGoBack = () => {
		if (canGoBack) {
			onStepChange(currentStep - 1);
		}
	};

	const handleGoForward = () => {
		if (canGoForward) {
			onStepChange(currentStep + 1);
		}
	};

	const handleGoHome = () => {
		if (onGoHome) {
			onGoHome();
		} else {
			window.location.href = '/';
		}
	};

	return (
		<NavigationContainer>
			<NavigationLeft>
				{showStepButtons && (
					<StepButtons>
						{Array.from({ length: totalSteps }, (_, index) => (
							<StepButton
								key={index}
								$active={index === currentStep}
								$completed={stepCompletion[index] === true}
								onClick={() => onStepChange(index)}
								title={`Step ${index + 1}: ${STEP_METADATA[`STEP_${index}` as keyof typeof STEP_METADATA]?.title || `Step ${index + 1}`}`}
							>
								{index + 1}
							</StepButton>
						))}
					</StepButtons>
				)}

				<NavButton $variant="secondary" onClick={handleGoBack} disabled={!canGoBack}>
					<FiChevronLeft />
					Back
				</NavButton>
			</NavigationLeft>

			<StepInfo>
				<StepTitle>{currentStepConfig?.title || `Step ${currentStep + 1}`}</StepTitle>
				<StepProgress>
					{currentStep + 1} of {totalSteps}
				</StepProgress>
			</StepInfo>

			<ProgressBar>
				<ProgressFill $progress={progress} />
			</ProgressBar>

			<NavigationRight>
				<NavButton $variant="primary" onClick={handleGoForward} disabled={!canGoForward}>
					Next
					<FiChevronRight />
				</NavButton>

				{showResetButton && (
					<NavButton $variant="secondary" onClick={onReset} title="Reset Flow">
						<FiRefreshCw />
						Reset
					</NavButton>
				)}

				{showHomeButton && (
					<NavButton $variant="secondary" onClick={handleGoHome} title="Go Home">
						<FiHome />
						Home
					</NavButton>
				)}
			</NavigationRight>
		</NavigationContainer>
	);
};

export default FlowNavigation;
