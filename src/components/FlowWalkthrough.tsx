// src/components/FlowWalkthrough.tsx


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
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.75rem;
	background: V9_COLORS.TEXT.WHITE;
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
	border-bottom: ${({ $isCollapsible }) => ($isCollapsible ? 'none' : '1px solid V9_COLORS.TEXT.GRAY_LIGHTER')};
	cursor: ${({ $isCollapsible }) => ($isCollapsible ? 'pointer' : 'default')};
	padding: ${({ $isCollapsible }) => ($isCollapsible ? '1.5rem' : '0')};
	border-radius: ${({ $isCollapsible }) => ($isCollapsible ? '0.75rem 0.75rem 0 0' : '0')};
	
	&:hover {
		background: ${({ $isCollapsible }) => ($isCollapsible ? 'V9_COLORS.BG.GRAY_LIGHT' : 'transparent')};
	}
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const HeaderIcon = styled.div`
	color: V9_COLORS.PRIMARY.BLUE_DARK;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Title = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
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
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
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
	border-left: 3px solid V9_COLORS.PRIMARY.BLUE;
	background: V9_COLORS.BG.GRAY_LIGHT;
	border-radius: 0.5rem;
	transition: all 0.2s ease;

	&:hover {
		background: V9_COLORS.BG.GRAY_MEDIUM;
		border-left-color: V9_COLORS.PRIMARY.BLUE_DARK;
	}
`;

const StepNumber = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	min-width: 2rem;
	background: V9_COLORS.PRIMARY.BLUE;
	color: V9_COLORS.TEXT.WHITE;
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
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
					<HeaderIcon>{icon || <span style={{ fontSize: '24px' }}>🌐</span>}</HeaderIcon>
					<Title>{title}</Title>
				</HeaderContent>
				<ChevronIcon $collapsed={isCollapsed}>
					<span>⬇️</span>
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
