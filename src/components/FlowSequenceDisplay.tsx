// src/components/FlowSequenceDisplay.tsx
// Reusable component for displaying flow sequences

import React, { useState } from 'react';
import { FiCheckCircle, FiChevronDown, FiZap } from '@icons';
import styled from 'styled-components';
import { getFlowSequence } from '../services/flowSequenceService';
import { themeService } from '../services/themeService';

const CollapsibleSection = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
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
		background: linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%);
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
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 2rem;
	margin: 0;
	color: #1f2937;
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
	background: #3b82f6;
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
	color: #1f2937;
`;

const StepDescription = styled.span`
	display: block;
	font-size: 0.875rem;
	line-height: 1.5;
	color: #6b7280;
	margin-bottom: 0.25rem;
`;

const TechnicalDetails = styled.code`
	display: block;
	background: #f3f4f6;
	padding: 0.5rem 0.75rem;
	border-radius: 6px;
	font-size: 0.8125rem;
	margin-top: 0.5rem;
	color: #dc2626;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	border: 1px solid #e5e7eb;
`;

const ExampleDisplay = styled.div`
	background: #fef3c7;
	padding: 0.75rem;
	border-radius: 6px;
	font-size: 0.8125rem;
	margin-top: 0.5rem;
	color: #92400e;
	font-style: italic;
	border-left: 3px solid #f59e0b;
`;

const BenefitsSection = styled.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
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
	color: #1f2937;

	svg {
		color: #10b981;
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
	color: #374151;
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
		color: #10b981;
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
					<FiZap />
					{sequence.title}
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={isCollapsed}>
					<FiChevronDown />
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
									<FiCheckCircle />
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
