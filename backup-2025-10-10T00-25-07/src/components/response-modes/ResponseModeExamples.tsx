// src/components/response-modes/ResponseModeExamples.tsx
// Example presets for the Response Modes learn page

import React from 'react';
import { FiPlay, FiCopy } from 'react-icons/fi';
import styled from 'styled-components';

export interface ResponseModeExample {
	id: string;
	title: string;
	description: string;
	flowKey: 'authorization_code' | 'implicit' | 'hybrid' | 'device' | 'client_credentials';
	responseType:
		| 'code'
		| 'token'
		| 'id_token'
		| 'token id_token'
		| 'code id_token'
		| 'code token'
		| 'code token id_token';
	responseMode: 'query' | 'fragment' | 'form_post' | 'pi.flow';
	clientId: string;
	redirectUri: string;
	scope: string;
	state: string;
	nonce?: string;
	extraParams?: Record<string, string>;
}

// Predefined examples
export const RESPONSE_MODE_EXAMPLES: ResponseModeExample[] = [
	{
		id: 'auth-code-query',
		title: 'Authorization Code + Query String',
		description: 'Traditional web application with server-side token exchange',
		flowKey: 'authorization_code',
		responseType: 'code',
		responseMode: 'query',
		clientId: 'web_app_client',
		redirectUri: 'https://myapp.com/callback',
		scope: 'openid profile email',
		state: 'xyz123',
	},
	{
		id: 'implicit-fragment',
		title: 'Implicit Flow + URL Fragment',
		description: 'Single Page Application receiving tokens directly',
		flowKey: 'implicit',
		responseType: 'token id_token',
		responseMode: 'fragment',
		clientId: 'spa_client',
		redirectUri: 'https://myapp.com/callback',
		scope: 'openid profile email',
		state: 'abc456',
	},
	{
		id: 'hybrid-form-post',
		title: 'Hybrid Flow + Form POST',
		description: 'Secure parameter transmission without URL exposure',
		flowKey: 'hybrid',
		responseType: 'code id_token',
		responseMode: 'form_post',
		clientId: 'hybrid_client',
		redirectUri: 'https://myapp.com/callback',
		scope: 'openid profile email',
		state: 'def789',
		nonce: 'nonce123',
	},
	{
		id: 'pingone-flow',
		title: 'PingOne Flow Object',
		description: 'Embedded authentication without browser redirects',
		flowKey: 'authorization_code',
		responseType: 'code',
		responseMode: 'pi.flow',
		clientId: 'mobile_app_client',
		redirectUri: 'https://myapp.com/callback',
		scope: 'openid profile email',
		state: 'ghi012',
	},
];

// Styled Components
const ExamplesContainer = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const ExamplesTitle = styled.h4`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ExamplesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const ExampleCard = styled.div`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }
`;

const ExampleHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const ExampleTitle = styled.h5`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
`;

const ExampleIcon = styled.div`
  color: #3b82f6;
  margin-top: 0.125rem;
`;

const ExampleDescription = styled.p`
  margin: 0 0 0.75rem 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
`;

const ExampleDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ExampleDetail = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
`;

const ExampleDetailLabel = styled.span`
  color: #6b7280;
  font-weight: 500;
`;

const ExampleDetailValue = styled.code`
  color: #111827;
  background: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
`;

interface ResponseModeExamplesProps {
	onSelectExample: (example: ResponseModeExample) => void;
	className?: string;
}

const ResponseModeExamples: React.FC<ResponseModeExamplesProps> = ({
	onSelectExample,
	className,
}) => {
	return (
		<ExamplesContainer className={className}>
			<ExamplesTitle>
				<FiPlay size={16} />
				Example Presets
			</ExamplesTitle>
			<ExamplesGrid>
				{RESPONSE_MODE_EXAMPLES.map((example) => (
					<ExampleCard key={example.id} onClick={() => onSelectExample(example)}>
						<ExampleHeader>
							<ExampleTitle>{example.title}</ExampleTitle>
							<ExampleIcon>
								<FiCopy size={14} />
							</ExampleIcon>
						</ExampleHeader>
						<ExampleDescription>{example.description}</ExampleDescription>
						<ExampleDetails>
							<ExampleDetail>
								<ExampleDetailLabel>Flow:</ExampleDetailLabel>
								<ExampleDetailValue>{example.flowKey}</ExampleDetailValue>
							</ExampleDetail>
							<ExampleDetail>
								<ExampleDetailLabel>Response Type:</ExampleDetailLabel>
								<ExampleDetailValue>{example.responseType}</ExampleDetailValue>
							</ExampleDetail>
							<ExampleDetail>
								<ExampleDetailLabel>Response Mode:</ExampleDetailLabel>
								<ExampleDetailValue>{example.responseMode}</ExampleDetailValue>
							</ExampleDetail>
						</ExampleDetails>
					</ExampleCard>
				))}
			</ExamplesGrid>
		</ExamplesContainer>
	);
};

export default ResponseModeExamples;
