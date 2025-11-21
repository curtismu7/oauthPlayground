// src/pages/flows/PARFlowV7.tsx
// OAuth 2.0 Pushed Authorization Requests (PAR) Flow - V7
// Simplified, educational implementation based on Authorization Code Flow pattern

import styled from 'styled-components';
import { FlowUIService } from '../../services/flowUIService';

// Get UI components from FlowUIService
const Container = FlowUIService.getContainer();
const ContentWrapper = FlowUIService.getContentWrapper();

const MainCard = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const StepHeader = styled.div<{ $variant: 'oauth' | 'oidc' }>`
	background: ${(props) =>
		props.$variant === 'oidc'
			? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
			: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'};
	color: white;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const VersionBadge = styled.span<{ $variant: 'oauth' | 'oidc' }>`
	align-self: flex-start;
	background: ${(props) =>
		props.$variant === 'oidc' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(22, 163, 74, 0.2)'};
	color: ${(props) => (props.$variant === 'oidc' ? '#1d4ed8' : '#15803d')};
	padding: 0.25rem 0.75rem;
	border-radius: 999px;
	font-size: 0.75rem;
	font-weight: 600;
`;

const PlaceholderSection = styled.div`
	padding: 2rem 2.5rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const PlaceholderTitle = styled.h2`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: #0f172a;
`;

const PlaceholderCopy = styled.p`
	margin: 0;
	color: #475569;
	line-height: 1.6;
`;

const PARFlowV7 = () => (
	<Container>
		<ContentWrapper>
			<MainCard>
				<StepHeader $variant="oauth">
					<StepHeaderLeft>
						<h1>Pushed Authorization Requests (PAR) Flow</h1>
						<VersionBadge $variant="oauth">Version 7</VersionBadge>
					</StepHeaderLeft>
				</StepHeader>
				<PlaceholderSection>
					<PlaceholderTitle>Implementation Coming Soon</PlaceholderTitle>
					<PlaceholderCopy>
						This flow is under active construction. Check back shortly for the full guided PAR
						walkthrough.
					</PlaceholderCopy>
				</PlaceholderSection>
			</MainCard>
		</ContentWrapper>
	</Container>
);

export default PARFlowV7;
