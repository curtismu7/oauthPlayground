import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const HelpContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HelpHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const HelpTitle = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => ($active ? '#3b82f6' : 'transparent')};
  color: ${({ $active }) => ($active ? '#3b82f6' : '#6b7280')};
  
  &:hover {
    color: #3b82f6;
  }
`;

const ContentArea = styled.div`
  min-height: 400px;
`;

const TutorialSection = styled.div`
  margin-bottom: 2rem;
`;

const TutorialTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
`;

const TutorialStep = styled.div<{ $active: boolean; $completed: boolean }>`
  border: 2px solid ${({ $active, $completed }) =>
		$active ? '#3b82f6' : $completed ? '#22c55e' : '#e5e7eb'};
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: ${({ $active, $completed }) =>
		$active ? '#eff6ff' : $completed ? '#f0fdf4' : 'white'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const StepTitle = styled.h4`
  margin: 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
`;

const StepNumber = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  
  ${({ $active, $completed }) => {
		if ($completed) {
			return `
        background-color: #22c55e;
        color: white;
      `;
		} else if ($active) {
			return `
        background-color: #3b82f6;
        color: white;
      `;
		} else {
			return `
        background-color: #e5e7eb;
        color: #6b7280;
      `;
		}
	}}
`;

const StepDescription = styled.p`
  margin: 0 0 0.75rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 0.75rem 0;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
			case 'secondary':
				return `
          background-color: #6b7280;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
			case 'success':
				return `
          background-color: #10b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
		}
	}}
`;

const FAQItem = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.75rem;
  overflow: hidden;
`;

const FAQQuestion = styled.button`
  width: 100%;
  padding: 1rem;
  background: #f9fafb;
  border: none;
  text-align: left;
  font-weight: 500;
  color: #1f2937;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const FAQAnswer = styled.div<{ $expanded: boolean }>`
  padding: ${({ $expanded }) => ($expanded ? '1rem' : '0 1rem')};
  max-height: ${({ $expanded }) => ($expanded ? '200px' : '0')};
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const TroubleshootingItem = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const TroubleshootingTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #991b1b;
  font-size: 0.875rem;
  font-weight: 600;
`;

const TroubleshootingDescription = styled.p`
  margin: 0 0 0.75rem 0;
  color: #7f1d1d;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const TroubleshootingSolution = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.25rem;
  padding: 0.75rem;
  color: #166534;
  font-size: 0.875rem;
  line-height: 1.5;
`;

interface TutorialStep {
	id: string;
	title: string;
	description: string;
	code?: string;
	completed: boolean;
}

interface FAQItem {
	id: string;
	question: string;
	answer: string;
}

interface TroubleshootingItem {
	id: string;
	title: string;
	description: string;
	solution: string;
}

const TUTORIALS = {
	'authorization-code': {
		title: 'Authorization Code Flow',
		steps: [
			{
				id: 'step-1',
				title: 'Configure Client Settings',
				description: 'Set up your OAuth client with the correct redirect URI and scopes.',
				code: `{
  "client_id": "your-client-id",
  "redirect_uri": "http://localhost:3000/callback",
  "scope": "openid profile email",
  "response_type": "code"
}`,
				completed: false,
			},
			{
				id: 'step-2',
				title: 'Generate Authorization URL',
				description: 'Create the authorization URL with PKCE parameters.',
				code: `const authUrl = \`https://auth.pingone.com/your-environment-id/as/authorize?client_id=\${clientId}&redirect_uri=\${redirectUri}&response_type=code&scope=\${scope}&code_challenge=\${codeChallenge}&code_challenge_method=S256&state=\${state}\`;`,
				completed: false,
			},
			{
				id: 'step-3',
				title: 'Handle Authorization Response',
				description: 'Process the authorization code from the callback.',
				code: `const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');`,
				completed: false,
			},
			{
				id: 'step-4',
				title: 'Exchange Code for Tokens',
				description: 'Exchange the authorization code for access and ID tokens.',
				code: `const tokenResponse = await fetch('https://auth.pingone.com/your-environment-id/as/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier
  })
});`,
				completed: false,
			},
		],
	},
	'implicit-flow': {
		title: 'Implicit Flow',
		steps: [
			{
				id: 'step-1',
				title: 'Configure Client Settings',
				description: 'Set up your OAuth client for implicit flow.',
				code: `{
  "client_id": "your-client-id",
  "redirect_uri": "http://localhost:3000/callback",
  "scope": "openid profile email",
  "response_type": "token id_token"
}`,
				completed: false,
			},
			{
				id: 'step-2',
				title: 'Generate Authorization URL',
				description: 'Create the authorization URL for implicit flow.',
				code: `const authUrl = \`https://auth.pingone.com/your-environment-id/as/authorize?client_id=\${clientId}&redirect_uri=\${redirectUri}&response_type=token%20id_token&scope=\${scope}&state=\${state}&nonce=\${nonce}\`;`,
				completed: false,
			},
			{
				id: 'step-3',
				title: 'Handle Token Response',
				description: 'Extract tokens from the URL fragment.',
				code: `const hashParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = hashParams.get('access_token');
const idToken = hashParams.get('id_token');
const state = hashParams.get('state');`,
				completed: false,
			},
		],
	},
};

const FAQ_ITEMS: FAQItem[] = [
	{
		id: 'faq-1',
		question: 'What is the difference between Authorization Code and Implicit flows?',
		answer:
			'Authorization Code flow is more secure as it exchanges an authorization code for tokens server-side, while Implicit flow returns tokens directly to the client. Authorization Code flow is recommended for most applications.',
	},
	{
		id: 'faq-2',
		question: 'How do I implement PKCE?',
		answer:
			'PKCE (Proof Key for Code Exchange) adds security to the Authorization Code flow by using a code verifier and code challenge. Generate a random code verifier, create a SHA256 hash (code challenge), and include both in your token exchange request.',
	},
	{
		id: 'faq-3',
		question: 'What scopes should I request?',
		answer:
			'Common scopes include "openid" for OpenID Connect, "profile" for user profile information, "email" for email address, and custom scopes for your application\'s specific needs. Only request the minimum scopes required.',
	},
	{
		id: 'faq-4',
		question: 'How do I handle token refresh?',
		answer:
			'Use the refresh_token to obtain new access tokens when they expire. Make a POST request to the token endpoint with grant_type=refresh_token and the refresh token.',
	},
	{
		id: 'faq-5',
		question: 'What is the state parameter for?',
		answer:
			'The state parameter helps prevent CSRF attacks by maintaining state between the request and callback. Generate a random value, store it, and verify it matches in the callback.',
	},
];

const TROUBLESHOOTING_ITEMS: TroubleshootingItem[] = [
	{
		id: 'trouble-1',
		title: 'Invalid redirect URI error',
		description:
			"The redirect URI in your request doesn't match the one configured in your OAuth client.",
		solution:
			'Ensure the redirect_uri parameter exactly matches the URI configured in your PingOne client settings, including the protocol (http vs https) and port.',
	},
	{
		id: 'trouble-2',
		title: 'Invalid client error',
		description: "The client_id or client_secret is incorrect or the client doesn't exist.",
		solution:
			'Verify your client_id and client_secret are correct in your PingOne environment. Check that the client is properly configured and active.',
	},
	{
		id: 'trouble-3',
		title: 'Token expired error',
		description: 'The access token has expired and needs to be refreshed.',
		solution:
			'Use the refresh_token to obtain a new access token, or redirect the user through the authorization flow again if no refresh token is available.',
	},
	{
		id: 'trouble-4',
		title: 'Invalid scope error',
		description: "The requested scope is not allowed for this client or doesn't exist.",
		solution:
			'Check that the scope parameter contains only scopes that are configured for your client in PingOne. Remove any invalid or unauthorized scopes.',
	},
	{
		id: 'trouble-5',
		title: 'PKCE verification failed',
		description:
			"The code verifier doesn't match the code challenge used in the authorization request.",
		solution:
			"Ensure you're using the same code verifier that was used to generate the code challenge. The code verifier should be stored securely between the authorization and token requests.",
	},
];

const InteractiveHelpSystem: React.FC = () => {
	const [activeTab, setActiveTab] = useState<'tutorials' | 'faq' | 'troubleshooting'>('tutorials');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTutorial, setSelectedTutorial] = useState<string>('authorization-code');
	const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>([]);
	const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

	useEffect(() => {
		if (selectedTutorial && TUTORIALS[selectedTutorial as keyof typeof TUTORIALS]) {
			setTutorialSteps(TUTORIALS[selectedTutorial as keyof typeof TUTORIALS].steps);
		}
	}, [selectedTutorial]);

	const handleStepComplete = (stepId: string) => {
		setTutorialSteps((prev) =>
			prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step))
		);
	};

	const handleFAQToggle = (faqId: string) => {
		setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
	};

	const filteredFAQ = FAQ_ITEMS.filter(
		(item) =>
			item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.answer.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const filteredTroubleshooting = TROUBLESHOOTING_ITEMS.filter(
		(item) =>
			item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.solution.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const renderTutorials = () => (
		<div>
			<div style={{ marginBottom: '1rem' }}>
				<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
					Select Tutorial:
				</label>
				<select
					value={selectedTutorial}
					onChange={(e) => setSelectedTutorial(e.target.value)}
					style={{
						width: '100%',
						padding: '0.5rem',
						border: '1px solid #d1d5db',
						borderRadius: '0.375rem',
						fontSize: '0.875rem',
					}}
				>
					{Object.entries(TUTORIALS).map(([key, tutorial]) => (
						<option key={key} value={key}>
							{tutorial.title}
						</option>
					))}
				</select>
			</div>

			<TutorialSection>
				<TutorialTitle>
					{TUTORIALS[selectedTutorial as keyof typeof TUTORIALS]?.title} Tutorial
				</TutorialTitle>

				{tutorialSteps.map((step, index) => (
					<TutorialStep
						key={step.id}
						$active={false}
						$completed={step.completed}
						onClick={() => handleStepComplete(step.id)}
					>
						<StepHeader>
							<StepTitle>{step.title}</StepTitle>
							<StepNumber $active={false} $completed={step.completed}>
								{step.completed ? '' : index + 1}
							</StepNumber>
						</StepHeader>
						<StepDescription>{step.description}</StepDescription>
						{step.code && <CodeBlock>{step.code}</CodeBlock>}
						{!step.completed && (
							<Button
								$variant="success"
								onClick={(e) => {
									e.stopPropagation();
									handleStepComplete(step.id);
								}}
							>
								Mark as Complete
							</Button>
						)}
					</TutorialStep>
				))}
			</TutorialSection>
		</div>
	);

	const renderFAQ = () => (
		<div>
			{filteredFAQ.map((item) => (
				<FAQItem key={item.id}>
					<FAQQuestion onClick={() => handleFAQToggle(item.id)}>
						{item.question}
						<span>{expandedFAQ === item.id ? '' : '+'}</span>
					</FAQQuestion>
					<FAQAnswer $expanded={expandedFAQ === item.id}>{item.answer}</FAQAnswer>
				</FAQItem>
			))}
		</div>
	);

	const renderTroubleshooting = () => (
		<div>
			{filteredTroubleshooting.map((item) => (
				<TroubleshootingItem key={item.id}>
					<TroubleshootingTitle>{item.title}</TroubleshootingTitle>
					<TroubleshootingDescription>{item.description}</TroubleshootingDescription>
					<TroubleshootingSolution>
						<strong>Solution:</strong> {item.solution}
					</TroubleshootingSolution>
				</TroubleshootingItem>
			))}
		</div>
	);

	return (
		<HelpContainer>
			<HelpHeader>
				<HelpTitle>Interactive Help System</HelpTitle>
			</HelpHeader>

			<SearchContainer>
				<SearchInput
					type="text"
					placeholder="Search help topics..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</SearchContainer>

			<TabContainer>
				<Tab $active={activeTab === 'tutorials'} onClick={() => setActiveTab('tutorials')}>
					Tutorials
				</Tab>
				<Tab $active={activeTab === 'faq'} onClick={() => setActiveTab('faq')}>
					FAQ
				</Tab>
				<Tab
					$active={activeTab === 'troubleshooting'}
					onClick={() => setActiveTab('troubleshooting')}
				>
					Troubleshooting
				</Tab>
			</TabContainer>

			<ContentArea>
				{activeTab === 'tutorials' && renderTutorials()}
				{activeTab === 'faq' && renderFAQ()}
				{activeTab === 'troubleshooting' && renderTroubleshooting()}
			</ContentArea>
		</HelpContainer>
	);
};

export default InteractiveHelpSystem;
