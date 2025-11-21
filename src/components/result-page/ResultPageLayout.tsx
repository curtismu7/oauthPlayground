// src/components/result-page/ResultPageLayout.tsx
import React from 'react';
import styled from 'styled-components';
import V7StepperService from '../../services/v7StepperService';

interface ResultPageLayoutProps {
	flowName: string;
	subtitle?: string;
	version?: string;
	summary?: React.ReactNode;
	actions?: React.ReactNode;
	children?: React.ReactNode;
}

const PageWrapper = styled.div`
	background: linear-gradient(180deg, #f4f6fb 0%, #eef2ff 100%);
	min-height: 100vh;
	padding: clamp(1.5rem, 3vw, 3rem);
	margin: 0;
`;

const SummaryCard = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	padding: 2rem;
	margin-bottom: 2rem;
`;

/**
 * Renders a standardized layout for result pages with a shared hero header and optional summary card.
 */
const ResultPageLayout: React.FC<ResultPageLayoutProps> = ({
	flowName,
	subtitle,
	version = 'V7',
	summary,
	actions,
	children,
}) => {
	const {
		StepContainer,
		StepHeader,
		StepHeaderLeft,
		StepHeaderRight,
		VersionBadge,
		StepHeaderTitle,
		StepHeaderSubtitle,
		StepContent,
	} = V7StepperService.createStepLayout({ theme: 'blue', showProgress: false });

	return (
		<PageWrapper>
			<StepContainer>
				<StepHeader>
					<StepHeaderLeft>
						<StepHeaderTitle>{flowName}</StepHeaderTitle>
						{subtitle ? <StepHeaderSubtitle>{subtitle}</StepHeaderSubtitle> : null}
					</StepHeaderLeft>
					<StepHeaderRight>
						<VersionBadge>{version}</VersionBadge>
					</StepHeaderRight>
				</StepHeader>
				<StepContent>
					{summary ? <SummaryCard>{summary}</SummaryCard> : null}
					{children}
				</StepContent>
			</StepContainer>
			{actions}
		</PageWrapper>
	);
};

export default ResultPageLayout;
