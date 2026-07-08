import React from 'react';
import styled from 'styled-components';

const NextStepsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin-top: 0.5rem;
`;

const NextStepItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 0.75rem;
	background: COLORS.BG.GRAY_LIGHT;
	border: 1px solid COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 8px;
	font-size: 0.875rem;
	color: #334155;
	line-height: 1.5;
	transition: all 0.2s ease;

	&:hover {
		background: COLORS.BG.GRAY_MEDIUM;
		border-color: #cbd5e1;
	}
`;

const NextStepIcon = styled.div`
	color: COLORS.PRIMARY.GREEN;
	font-size: 1rem;
	margin-top: 0.125rem;
	flex-shrink: 0;
`;

const NextStepText = styled.div`
	flex: 1;
`;

interface NextStepsProps {
	steps: string[];
}

const NextSteps: React.FC<NextStepsProps> = ({ steps }) => {
	return (
		<NextStepsList>
			{steps.map((step, index) => (
				<NextStepItem key={index}>
					<NextStepIcon>
						<span>✅</span>
					</NextStepIcon>
					<NextStepText>{step}</NextStepText>
				</NextStepItem>
			))}
		</NextStepsList>
	);
};

export default NextSteps;
