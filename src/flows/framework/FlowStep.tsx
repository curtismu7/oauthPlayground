// src/flows/framework/FlowStep.tsx
//
// One step's body: title, explanation, content (inputs/actions), and nav buttons.

import React from 'react';
import styled from 'styled-components';

const Card = styled.section`
	background: #fff;
	border: 1px solid #e2e8f0;
	border-radius: 14px;
	padding: 1.5rem;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`;

const StepTitle = styled.h2`
	font-size: 1.2rem;
	font-weight: 700;
	margin: 0 0 0.35rem;
`;

const Description = styled.div`
	margin: 0 0 0.8rem;
	padding: 0.75rem 0.9rem;
	background: #f0f9ff;
	border: 1px solid #bae6fd;
	border-radius: 8px;
	color: #0369a1;
	font-size: 0.9rem;
	line-height: 1.5;
`;

const Explanation = styled.p`
	margin: 0 0 1.1rem;
	color: #475569;
	font-size: 0.92rem;
	line-height: 1.5;
`;

const Body = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const Nav = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 0.75rem;
	margin-top: 1.5rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'ghost' }>`
	font-size: 0.9rem;
	font-weight: 600;
	padding: 0.55rem 1.1rem;
	border-radius: 8px;
	cursor: pointer;
	border: 1px solid ${({ $variant }) => ($variant === 'primary' ? '#1e3a8a' : '#cbd5e1')};
	background: ${({ $variant }) => ($variant === 'primary' ? '#1e40af' : '#fff')};
	color: ${({ $variant }) => ($variant === 'primary' ? '#fff' : '#334155')};
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

export interface FlowStepProps {
	title: string;
	description?: React.ReactNode;
	explanation?: React.ReactNode;
	children: React.ReactNode;
	canPrev?: boolean;
	canNext?: boolean;
	nextLabel?: string;
	onPrev?: () => void;
	onNext?: () => void;
}

export const FlowStep: React.FC<FlowStepProps> = ({
	title,
	description,
	explanation,
	children,
	canPrev = true,
	canNext = true,
	nextLabel = 'Next',
	onPrev,
	onNext,
}) => {
	return (
		<Card>
			<StepTitle>{title}</StepTitle>
			{description && <Description>{description}</Description>}
			{explanation && <Explanation>{explanation}</Explanation>}
			<Body>{children}</Body>
			<Nav>
				<Button $variant="ghost" onClick={onPrev} disabled={!canPrev || !onPrev}>
					Back
				</Button>
				<Button $variant="primary" onClick={onNext} disabled={!canNext || !onNext}>
					{nextLabel}
				</Button>
			</Nav>
		</Card>
	);
};
