// src/components/FlowWalkthrough.tsx

import { FiGlobe } from 'react-icons/fi';
import styled from 'styled-components';

export interface FlowStep {
	title: string;
	description?: string;
}

export interface FlowWalkthroughProps {
	title: string;
	steps: FlowStep[];
	icon?: React.ReactNode;
}

const Container = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	background: #ffffff;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid #e5e7eb;
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

const StepsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
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

export const FlowWalkthrough = ({ title, steps, icon }: FlowWalkthroughProps) => {
	return (
		<Container>
			<Header>
				<HeaderIcon>{icon || <FiGlobe size={24} />}</HeaderIcon>
				<Title>{title}</Title>
			</Header>
			<StepsContainer>
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
