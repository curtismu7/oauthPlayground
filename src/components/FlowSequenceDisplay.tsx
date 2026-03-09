// src/components/FlowSequenceDisplay.tsx
// Reusable component for displaying flow sequences

import React, { useState } from 'react';
import styled from 'styled-components';
import { getFlowSequence } from '../services/flowSequenceService';
import { themeService } from '../services/themeService';

const CollapsibleSection = styled.section`
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: V9_COLORS.TEXT.WHITE;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #14532d;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, V9_COLORS.BG.SUCCESS 0%, #ecfdf3 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	${() => themeService.getCollapseIconStyles()}
	display: inline-flex;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};

	svg {
		width: 16px;
		height: 16px;
	}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const SequenceContainer = styled.div`
	background: V9_COLORS.TEXT.WHITE;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 12px;
	padding: 2rem;
	margin: 0;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const StepsList = styled.ol`
	list-style: none;
	counter-reset: step-counter;
	padding: 0;
	margin: 0 0 1.5rem 0;
`;

const StepItem = styled.li`
	counter-increment: step-counter;
	margin-bottom: 1.25rem;
	padding-left: 0;
	position: relative;

	&:last-child {
		margin-bottom: 0;
	}
`;

const StepNumber = styled.span`
	display: inline-block;
	width: 2rem;
	height: 2rem;
	background: V9_COLORS.PRIMARY.BLUE;
	border-radius: 50%;
	text-align: center;
	line-height: 2rem;
	font-weight: 700;
	margin-right: 0.75rem;
	font-size: 0.875rem;
	color: white;
`;

const StepContent = styled.div`
	display: inline-block;
	vertical-align: top;
	width: calc(100% - 3rem);
`;

const StepTitle = styled.strong`
	display: block;
	font-size: 1rem;
	margin-bottom: 0.25rem;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const StepDescription = styled.span`
	display: block;
	font-size: 0.875rem;
	line-height: 1.5;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	margin-bottom: 0.25rem;
`;

const TechnicalDetails = styled.code`
	display: block;
	background: #f3f4f6;
	padding: 0.5rem 0.75rem;
	border-radius: 6px;
	font-size: 0.8125rem;
	margin-top: 0.5rem;
	color: V9_COLORS.PRIMARY.RED_DARK;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const ExampleDisplay = styled.div`
	background: V9_COLORS.BG.WARNING;
	padding: 0.75rem;
	border-radius: 6px;
	font-size: 0.8125rem;
	margin-top: 0.5rem;
	color: V9_COLORS.PRIMARY.YELLOW_DARK;
	font-style: italic;
	border-left: 3px solid V9_COLORS.PRIMARY.YELLOW;
`;

const BenefitsSection = styled.div`
	background: #f0fdf4;
	border: 1px solid V9_COLORS.BG.SUCCESS_BORDER;
	border-radius: 8px;
	padding: 1.25rem;
	margin-top: 1.5rem;
`;

const BenefitsTitle = styled.h4`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1rem;
	font-weight: 600;
	margin: 0 0 0.75rem 0;
	color: V9_COLORS.TEXT.GRAY_DARK;

	svg {
		color: V9_COLORS.PRIMARY.GREEN;
	}
`;

const BenefitsList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
`;

const BenefitItem = styled.li`
	font-size: 0.875rem;
	line-height: 1.6;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 0.5rem;
	padding-left: 1.5rem;
	position: relative;

	&:last-child {
		margin-bottom: 0;
	}

	&:before {
		content: '✓';
		position: absolute;
		left: 0;
		color: V9_COLORS.PRIMARY.GREEN;
		font-weight: bold;
	}
`;

interface FlowSequenceDisplayProps {
	flowType: string;
}

export const FlowSequenceDisplay: React.FC<FlowSequenceDisplayProps> = ({ flowType }) => {
	const [isCollapsed, setIsCollapsed] = useState(true);
	const sequence = getFlowSequence(flowType);

	if (!sequence) {
		return null;
	}

	const toggleCollapsed = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={toggleCollapsed}
				aria-expanded={!isCollapsed}
				$collapsed={isCollapsed}
			>
				<CollapsibleTitle>
					<span>⚡</span>
					{sequence.title}
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={isCollapsed}>
					<span>⬇️</span>
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!isCollapsed && (
				<CollapsibleContent>
					<SequenceContainer>
						<StepsList>
							{sequence.steps.map((step) => (
								<StepItem key={step.stepNumber}>
									<StepNumber>{step.stepNumber}</StepNumber>
									<StepContent>
										<StepTitle>{step.title}</StepTitle>
										<StepDescription>{step.description}</StepDescription>
										{step.technicalDetails && (
											<TechnicalDetails>{step.technicalDetails}</TechnicalDetails>
										)}
										{step.exampleDisplay && <ExampleDisplay>{step.exampleDisplay}</ExampleDisplay>}
									</StepContent>
								</StepItem>
							))}
						</StepsList>

						{sequence.keyBenefits && sequence.keyBenefits.length > 0 && (
							<BenefitsSection>
								<BenefitsTitle>
									<span>✅</span>
									Key Benefits
								</BenefitsTitle>
								<BenefitsList>
									{sequence.keyBenefits.map((benefit, index) => (
										<BenefitItem key={index}>{benefit}</BenefitItem>
									))}
								</BenefitsList>
							</BenefitsSection>
						)}
					</SequenceContainer>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);
};

export default FlowSequenceDisplay;
