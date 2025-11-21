// src/examples/FlowWithCodeExamples.tsx

import React from 'react';
import styled from 'styled-components';
import { CodeExamplesInline } from '../components/CodeExamplesInline';
import { CodeExamplesConfig } from '../services/codeExamplesService';

const FlowContainer = styled.div`
	padding: 2rem;
	max-width: 800px;
	margin: 0 auto;
`;

const StepContainer = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const StepTitle = styled.h3`
	margin: 0 0 1rem 0;
	color: #1f2937;
	font-size: 1.25rem;
`;

const StepDescription = styled.p`
	margin: 0 0 1rem 0;
	color: #6b7280;
	line-height: 1.5;
`;

const CodeExamplesSection = styled.div`
	margin-top: 1.5rem;
`;

// Example: How to integrate code examples into an existing flow component
export const FlowWithCodeExamples: React.FC = () => {
	// This would typically come from your flow state/context
	const flowConfig: Partial<CodeExamplesConfig> = {
		baseUrl: 'https://auth.pingone.com',
		clientId: 'your-client-id',
		clientSecret: 'your-client-secret',
		redirectUri: 'https://your-app.com/callback',
		scopes: ['openid', 'profile', 'email'],
		environmentId: 'your-environment-id',
	};

	return (
		<FlowContainer>
			<StepContainer>
				<StepTitle>Step 1: Generate Authorization URL</StepTitle>
				<StepDescription>
					Create the authorization URL that users will visit to authenticate. This URL contains your
					client ID, redirect URI, and requested scopes.
				</StepDescription>

				{/* Your existing step content here */}
				<div
					style={{
						background: '#f3f4f6',
						padding: '1rem',
						borderRadius: '6px',
						marginBottom: '1rem',
					}}
				>
					<p>Your existing step UI components go here...</p>
					<p>Buttons, forms, inputs, etc.</p>
				</div>

				<CodeExamplesSection>
					<CodeExamplesInline
						flowType="authorization-code"
						stepId="step1"
						config={flowConfig}
						compact={true}
					/>
				</CodeExamplesSection>
			</StepContainer>

			<StepContainer>
				<StepTitle>Step 2: Handle Authorization Callback</StepTitle>
				<StepDescription>
					Process the authorization code returned from the callback URL. Extract the code and state
					parameters from the URL.
				</StepDescription>

				{/* Your existing step content here */}
				<div
					style={{
						background: '#f3f4f6',
						padding: '1rem',
						borderRadius: '6px',
						marginBottom: '1rem',
					}}
				>
					<p>Your existing step UI components go here...</p>
					<p>Callback handling, URL parsing, etc.</p>
				</div>

				<CodeExamplesSection>
					<CodeExamplesInline
						flowType="authorization-code"
						stepId="step2"
						config={flowConfig}
						compact={true}
					/>
				</CodeExamplesSection>
			</StepContainer>

			<StepContainer>
				<StepTitle>Step 3: Exchange Code for Token</StepTitle>
				<StepDescription>
					Exchange the authorization code for access and ID tokens by making a POST request to the
					token endpoint.
				</StepDescription>

				{/* Your existing step content here */}
				<div
					style={{
						background: '#f3f4f6',
						padding: '1rem',
						borderRadius: '6px',
						marginBottom: '1rem',
					}}
				>
					<p>Your existing step UI components go here...</p>
					<p>Token exchange logic, error handling, etc.</p>
				</div>

				<CodeExamplesSection>
					<CodeExamplesInline
						flowType="authorization-code"
						stepId="step3"
						config={flowConfig}
						compact={false} // Show full examples for this important step
					/>
				</CodeExamplesSection>
			</StepContainer>
		</FlowContainer>
	);
};

export default FlowWithCodeExamples;
