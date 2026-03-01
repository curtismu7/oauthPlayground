// src/components/FlowWalkthrough.tsx

import { FiChevronDown, FiGlobe } from '@icons';
import { useState } from 'react';
import styled from 'styled-components';
import { themeService } from '../services/themeService';

export interface FlowStep {
	title: string;
	description?: string;
}

export interface FlowWalkthroughProps {
	title: string;
	steps: FlowStep[];
	icon?: React.ReactNode;
	defaultCollapsed?: boolean;
}

const Container = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	background: #ffffff;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const Header = styled.div<{ $isCollapsible?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	margin-bottom: ${({ $isCollapsible }) => ($isCollapsible ? '0' : '1.5rem')};
	padding-bottom: ${({ $isCollapsible }) => ($isCollapsible ? '0' : '1rem')};
	border-bottom: ${({ $isCollapsible }) => ($isCollapsible ? 'none' : '1px solid #e5e7eb')};
	cursor: ${({ $isCollapsible }) => ($isCollapsible ? 'pointer' : 'default')};
	padding: ${({ $isCollapsible }) => ($isCollapsible ? '1.5rem' : '0')};
	border-radius: ${({ $isCollapsible }) => ($isCollapsible ? '0.75rem 0.75rem 0 0' : '0')};
	
	&:hover {
		background: ${({ $isCollapsible }) => ($isCollapsible ? '#f8fafc' : 'transparent')};
	}
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const HeaderIcon = styled.div`
	color: #2563eb;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Title = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0;
`;

const ChevronIcon = styled.div<{ $collapsed: boolean }>`
	${() => themeService.getCollapseIconStyles()}
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	
	svg {
		width: 16px;
		height: 16px;
	}
	
	&:hover {
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)')};
	}
`;

const StepsContainer = styled.div<{ $collapsed: boolean }>`
	display: ${({ $collapsed }) => ($collapsed ? 'none' : 'flex')};
	flex-direction: column;
	gap: 1rem;
	padding: 1.5rem;
	border-top: 1px solid #e5e7eb;
	animation: ${({ $collapsed }) => ($collapsed ? 'none' : 'fadeIn 0.2s ease')};

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const StepItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 0.75rem;
	border-left: 3px solid #3b82f6;
	background: #f8fafc;
	border-radius: 0.5rem;
	transition: all 0.2s ease;

	&:hover {
		background: #f1f5f9;
		border-left-color: #2563eb;
	}
`;

const StepNumber = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	min-width: 2rem;
	background: #3b82f6;
	color: #ffffff;
	border-radius: 50%;
	font-weight: 600;
	font-size: 0.875rem;
	flex-shrink: 0;
`;

const StepContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	flex: 1;
`;

const StepTitle = styled.div`
	font-size: 0.9375rem;
	font-weight: 600;
	color: #1e293b;
	line-height: 1.4;
`;

const StepDescription = styled.div`
	font-size: 0.875rem;
	color: #64748b;
	line-height: 1.5;
`;

export const FlowWalkthrough = ({
	title,
	steps,
	icon,
	defaultCollapsed = false,
}: FlowWalkthroughProps) => {
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

	const toggleCollapsed = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<Container>
			<Header $isCollapsible={true} onClick={toggleCollapsed}>
				<HeaderContent>
					<HeaderIcon>{icon || <FiGlobe size={24} />}</HeaderIcon>
					<Title>{title}</Title>
				</HeaderContent>
				<ChevronIcon $collapsed={isCollapsed}>
					<FiChevronDown />
				</ChevronIcon>
			</Header>
			<StepsContainer $collapsed={isCollapsed}>
				{steps.map((step, index) => (
					<StepItem key={index}>
						<StepNumber>{index + 1}</StepNumber>
						<StepContent>
							<StepTitle>{step.title}</StepTitle>
							{step.description && <StepDescription>{step.description}</StepDescription>}
						</StepContent>
					</StepItem>
				))}
			</StepsContainer>
		</Container>
	);
};

export default FlowWalkthrough;
