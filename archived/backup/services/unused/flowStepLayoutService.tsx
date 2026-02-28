// src/services/flowStepLayoutService.tsx
// Service for standardized step-by-step flow layout patterns used across all V5 flows

import React from 'react';
import styled from 'styled-components';

export interface FlowStepLayoutConfig {
	flowType: 'oauth' | 'oidc' | 'pingone';
	showStepper?: boolean;
	enableAutoAdvance?: boolean;
	theme?: 'blue' | 'green' | 'purple';
	maxWidth?: string;
	responsive?: boolean;
}

export interface StepMetadata {
	title: string;
	subtitle: string;
}

const StepContainer = styled.div<{ $maxWidth?: string; $responsive?: boolean }>`
	max-width: ${({ $maxWidth }) => $maxWidth || '1200px'};
	margin: 0 auto;
	padding: ${({ $responsive }) => ($responsive ? '1rem' : '2rem')};

	@media (max-width: 768px) {
		padding: 1rem;
	}
`;

const StepHeader = styled.div<{ $flowType: FlowStepLayoutConfig['flowType'] }>`
	background: ${({ $flowType }) => {
		switch ($flowType) {
			case 'oauth':
				return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
			case 'oidc':
				return 'linear-gradient(135deg, #10b981 0%, #047857 100%)';
			case 'pingone':
				return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			default:
				return 'linear-gradient(135deg, #6b7280 0%, #374151 100%)';
		}
	}};
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0;
	border-radius: 12px 12px 0 0;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const VersionBadge = styled.span`
	align-self: flex-start;
	background: rgba(59, 130, 246, 0.2);
	border: 1px solid #60a5fa;
	color: #dbeafe;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
`;

const StepHeaderTitle = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;

	@media (max-width: 768px) {
		font-size: 1.5rem;
	}
`;

const StepHeaderSubtitle = styled.p`
	font-size: 1.125rem;
	margin: 0;
	opacity: 0.9;

	@media (max-width: 768px) {
		font-size: 1rem;
	}
`;

const StepContent = styled.div`
	padding: 2rem;
	background-color: #ffffff;
	border-radius: 0 0 12px 12px;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	border-top: none;
`;

const CollapsibleSection = styled.section`
	margin-bottom: 1.5rem;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	overflow: hidden;
	background: #ffffff;
`;

const CollapsibleHeaderButton = styled.button<{ $theme?: string }>`
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border: none;
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: all 0.2s ease;
	font-size: 1rem;
	font-weight: 600;

	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.div<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.5rem;
	height: 1.5rem;
	transition: transform 0.2s ease;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	color: #666;
`;

const CollapsibleContent = styled.div<{ $collapsed: boolean }>`
	padding: ${({ $collapsed }) => ($collapsed ? '0' : '1.5rem')};
	padding-top: ${({ $collapsed }) => ($collapsed ? '0' : '0')};
	max-height: ${({ $collapsed }) => ($collapsed ? '0' : '1000px')};
	overflow: hidden;
	transition: all 0.3s ease;
`;

const StepNavigationContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 1px solid #e2e8f0;
`;

const NavigationButtons = styled.div`
	display: flex;
	gap: 1rem;
`;

const StepIndicator = styled.div`
	font-size: 0.875rem;
	color: #666;
	font-weight: 500;
`;

export interface CollapsibleSectionProps {
	title: string;
	children: React.ReactNode;
	defaultCollapsed?: boolean;
	icon?: React.ReactNode;
}

export const CollapsibleSectionComponent: React.FC<CollapsibleSectionProps> = ({
	title,
	children,
	defaultCollapsed = false,
	icon,
}) => {
	const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

	return (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => setIsCollapsed(!isCollapsed)}>
				<CollapsibleTitle>
					{icon}
					{title}
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={isCollapsed}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<polyline points="6,9 12,15 18,9"></polyline>
					</svg>
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			<CollapsibleContent $collapsed={isCollapsed}>{children}</CollapsibleContent>
		</CollapsibleSection>
	);
};

export interface StepNavigationProps {
	currentStep: number;
	totalSteps: number;
	onPrevious?: () => void;
	onNext?: () => void;
	onReset?: () => void;
	canNavigateNext?: boolean;
	canNavigatePrevious?: boolean;
	nextButtonText?: string;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
	currentStep,
	totalSteps,
	onPrevious,
	onNext,
	onReset,
	canNavigateNext = true,
	canNavigatePrevious = true,
	nextButtonText = 'Next',
}) => {
	return (
		<StepNavigationContainer>
			<StepIndicator>
				Step {currentStep + 1} of {totalSteps}
			</StepIndicator>
			<NavigationButtons>
				{onReset && (
					<button
						onClick={onReset}
						style={{
							padding: '0.5rem 1rem',
							background: '#6b7280',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
						}}
					>
						Reset
					</button>
				)}
				{onPrevious && (
					<button
						onClick={onPrevious}
						disabled={!canNavigatePrevious}
						style={{
							padding: '0.5rem 1rem',
							background: canNavigatePrevious ? '#6b7280' : '#d1d5db',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: canNavigatePrevious ? 'pointer' : 'not-allowed',
						}}
					>
						Previous
					</button>
				)}
				{onNext && (
					<button
						onClick={onNext}
						disabled={!canNavigateNext}
						style={{
							padding: '0.5rem 1rem',
							background: canNavigateNext ? '#3b82f6' : '#d1d5db',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: canNavigateNext ? 'pointer' : 'not-allowed',
						}}
					>
						{nextButtonText}
					</button>
				)}
			</NavigationButtons>
		</StepNavigationContainer>
	);
};

export class FlowStepLayoutService {
	static createStepLayout(config: FlowStepLayoutConfig) {
		const { flowType, maxWidth = '1200px', responsive = true } = config;

		return {
			StepContainer: styled(StepContainer).attrs({
				$maxWidth: maxWidth,
				$responsive: responsive,
			})``,

			StepHeader: styled(StepHeader).attrs({
				$flowType: flowType,
			})``,

			StepHeaderLeft,
			VersionBadge,
			StepHeaderTitle,
			StepHeaderSubtitle,
			StepContent,
			CollapsibleSectionComponent,
			StepNavigation,
		};
	}

	static getDefaultConfig(flowType: FlowStepLayoutConfig['flowType']): FlowStepLayoutConfig {
		const baseConfig: FlowStepLayoutConfig = {
			flowType,
			showStepper: true,
			enableAutoAdvance: false,
			theme: 'blue',
			maxWidth: '1200px',
			responsive: true,
		};

		// Flow-specific customizations
		switch (flowType) {
			case 'oauth':
				return { ...baseConfig, theme: 'blue' };
			case 'oidc':
				return { ...baseConfig, theme: 'green' };
			case 'pingone':
				return { ...baseConfig, theme: 'purple' };
			default:
				return baseConfig;
		}
	}
}

export default FlowStepLayoutService;
