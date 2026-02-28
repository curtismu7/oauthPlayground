// src/services/rawTokenResponseService.tsx
import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import styled from 'styled-components';
import { ColoredTokenDisplay } from '../components/ColoredTokenDisplay';

interface RawTokenResponseServiceProps {
	tokens: Record<string, any>;
	onNavigateToTokenManagement?: () => void;
	showIndividualTokens?: boolean;
	children?: React.ReactNode; // For additional content after individual tokens
}

const ResultsSection = styled.div`
	margin: 2rem 0;
	padding: 1.5rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ResultsHeading = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
`;

const HelperText = styled.p`
	margin-bottom: 1.5rem;
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const IndividualTokensContainer = styled.div`
	margin-bottom: 2rem;
`;

const RawResponseContainer = styled.div`
	margin-top: 2rem;
`;

const RawResponseTitle = styled.h4`
	margin-bottom: 1rem;
	color: #374151;
	font-size: 1rem;
	font-weight: 600;
`;

const RawResponseDescription = styled.p`
	margin-bottom: 1rem;
	color: #6b7280;
	font-size: 0.875rem;
`;

export const RawTokenResponseService: React.FC<RawTokenResponseServiceProps> = ({
	tokens,
	onNavigateToTokenManagement,
	showIndividualTokens = true,
	children,
}) => {
	// Check if we have any tokens
	const hasTokens =
		tokens &&
		Object.values(tokens).some((value) => value !== null && value !== undefined && value !== '');

	if (!hasTokens) {
		return (
			<ResultsSection>
				<ResultsHeading>
					<FiCheckCircle size={18} /> Token Response
				</ResultsHeading>
				<HelperText>Complete the authorization step to receive tokens.</HelperText>
				<div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
					<p>Complete the authorization step to receive tokens</p>
				</div>
			</ResultsSection>
		);
	}

	return (
		<ResultsSection>
			<ResultsHeading>
				<FiCheckCircle size={18} /> Token Response
			</ResultsHeading>
			<HelperText>
				Review the raw token response. Copy the JSON or open the token management tooling to inspect
				each token.
			</HelperText>

			{/* Individual Token Displays (if enabled and children provided) */}
			{showIndividualTokens && children && (
				<IndividualTokensContainer>{children}</IndividualTokensContainer>
			)}

			{/* Raw Token Response */}
			<RawResponseContainer>
				<RawResponseTitle>Raw Token Response</RawResponseTitle>
				<RawResponseDescription>
					Review the raw token response. Copy the JSON or open the token management tooling to
					inspect each token.
				</RawResponseDescription>
				<ColoredTokenDisplay
					tokens={tokens}
					label="Raw Token Response"
					showCopyButton={true}
					showInfoButton={true}
					showOpenButton={true}
					onOpen={onNavigateToTokenManagement || (() => console.log('Opening token management...'))}
					height="200px"
				/>
			</RawResponseContainer>
		</ResultsSection>
	);
};

export default RawTokenResponseService;
