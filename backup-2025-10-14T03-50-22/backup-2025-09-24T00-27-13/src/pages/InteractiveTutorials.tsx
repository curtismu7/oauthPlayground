import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import {
	FiPlay,
	FiCheckCircle,
	FiArrowRight,
	FiBookOpen,
	FiCode,
	FiShield,
	FiUsers,
	FiSettings,
	FiChevronDown,
	FiChevronRight,
	FiStar,
	FiClock,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  p {
    font-size: 1.25rem;
    color: ${({ theme }) => theme.colors.gray600};
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const TutorialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const TutorialCard = styled(Card)`
  height: fit-content;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  }
`;

const TutorialIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  font-size: 2rem;
  transition: transform 0.3s ease;

  &.beginner { background: linear-gradient(135deg, #10b981, #059669); color: white; }
  &.intermediate { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
  &.advanced { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
`;

const DifficultyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 1rem;

  &.beginner { background-color: #dcfce7; color: #166534; }
  &.intermediate { background-color: #dbeafe; color: #1e40af; }
  &.advanced { background-color: #f3e8ff; color: #7c3aed; }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 1rem;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${({ progress }) => progress}%;
`;

const StartButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: #2563eb;
  }
`;

const TutorialModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const StepContainer = styled.div`
  padding: 2rem;
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.125rem;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
`;

const StepContent = styled.div`
  margin-bottom: 2rem;
`;

const CodeBlock = styled.pre`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
  white-space: pre-wrap;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  &.primary {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;

    &:hover {
      background-color: #2563eb;
      border-color: #2563eb;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InteractiveTutorials = () => {
	const navigate = useNavigate();
	const [selectedTutorial, setSelectedTutorial] = useState(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [completedTutorials, setCompletedTutorials] = useState(new Set());

	const tutorials = [
		{
			id: 'oauth-basics',
			title: 'OAuth 2.0 Fundamentals',
			description: 'Learn the core concepts of OAuth 2.0 authorization framework',
			difficulty: 'beginner',
			duration: '15 min',
			icon: FiShield,
			steps: [
				{
					title: 'What is OAuth 2.0?',
					content:
						'OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts on an HTTP service.',
					code: `// OAuth 2.0 Key Concepts
- Resource Owner: The user who owns the data
- Client: The application requesting access
- Authorization Server: Issues access tokens
- Resource Server: Hosts the protected resources`,
					type: 'info',
				},
				{
					title: 'OAuth Roles',
					content: 'Understanding the four main roles in OAuth 2.0 ecosystem.',
					code: `Resource Owner (User)
    ↓ grants permission to
Client Application
    ↓ requests access from
Authorization Server
    ↓ issues tokens to
Resource Server (API)`,
					type: 'diagram',
				},
				{
					title: 'Access Tokens',
					content: 'Bearer tokens that grant access to protected resources.',
					code: `// Example Access Token
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}`,
					type: 'code',
				},
				{
					title: 'Token Types',
					content: 'Different types of tokens used in OAuth flows.',
					code: `Access Token: Short-lived, used for API calls
Refresh Token: Long-lived, used to get new access tokens
Authorization Code: Temporary code exchanged for tokens
ID Token: JWT containing user identity information`,
					type: 'info',
				},
			],
		},
		{
			id: 'auth-code-flow',
			title: 'Authorization Code Flow',
			description: 'Master the most secure OAuth flow for web applications',
			difficulty: 'intermediate',
			duration: '25 min',
			icon: FiCode,
			steps: [
				{
					title: 'Flow Overview',
					content:
						'The Authorization Code flow is the most secure flow for applications that can securely store client secrets.',
					code: `1. Client redirects user to Authorization Server
2. User authenticates and grants consent
3. Authorization Server redirects back with code
4. Client exchanges code for access token`,
					type: 'steps',
				},
				{
					title: 'Authorization Request',
					content: 'The initial request to the authorization endpoint.',
					code: `GET /authorize?
  client_id=your_client_id
  &redirect_uri=https://your-app.com/callback
  &response_type=code
  &scope=openid profile email
  &state=xyz123
  &nonce=abc456`,
					type: 'request',
				},
				{
					title: 'Token Exchange',
					content: 'Exchanging the authorization code for tokens.',
					code: `POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=your_client_id
&client_secret=your_client_secret
&code=auth_code_from_redirect
&redirect_uri=https://your-app.com/callback`,
					type: 'request',
				},
				{
					title: 'Security Features',
					content: 'Built-in security measures of the Authorization Code flow.',
					code: `✅ Client authentication required
✅ Authorization code is short-lived
✅ Tokens never exposed to user agent
✅ Supports refresh tokens
✅ PKCE support for enhanced security`,
					type: 'security',
				},
			],
		},
		{
			id: 'openid-connect',
			title: 'OpenID Connect Deep Dive',
			description: 'Complete guide to identity layer on top of OAuth 2.0',
			difficulty: 'advanced',
			duration: '35 min',
			icon: FiUsers,
			steps: [
				{
					title: 'OIDC vs OAuth',
					content: 'Understanding the relationship between OpenID Connect and OAuth 2.0.',
					code: `OAuth 2.0: Authorization framework
  ↓
OpenID Connect: Identity layer on OAuth 2.0

OIDC adds:
• ID Tokens (JWT with user identity)
• UserInfo endpoint
• Standard claims
• Discovery document
• Dynamic client registration`,
					type: 'comparison',
				},
				{
					title: 'ID Token Structure',
					content: 'Anatomy of a JWT ID Token.',
					code: `Header: {"alg": "RS256", "typ": "JWT"}
Payload: {
  "iss": "https://auth.example.com",
  "sub": "user123",
  "aud": "client_id",
  "exp": 1638360000,
  "iat": 1638356400,
  "name": "John Doe",
  "email": "john@example.com"
}
Signature: Base64Url-encoded signature`,
					type: 'jwt',
				},
				{
					title: 'Standard Claims',
					content: 'Common claims included in ID tokens.',
					code: `sub: Subject (unique user identifier)
name: Full name
given_name: First name
family_name: Last name
email: Email address
email_verified: Email verification status
picture: Profile picture URL
locale: User locale
zoneinfo: Time zone`,
					type: 'claims',
				},
				{
					title: 'Discovery & Metadata',
					content: 'How clients discover OIDC provider capabilities.',
					code: `GET /.well-known/openid-configuration

Response includes:
• authorization_endpoint
• token_endpoint
• userinfo_endpoint
• jwks_uri (JSON Web Key Set)
• issuer
• supported scopes
• supported response types`,
					type: 'discovery',
				},
			],
		},
		{
			id: 'security-best-practices',
			title: 'Security Best Practices',
			description: 'Essential security measures for OAuth and OIDC implementations',
			difficulty: 'advanced',
			duration: '30 min',
			icon: FiShield,
			steps: [
				{
					title: 'Secure Token Storage',
					content: 'Best practices for storing access tokens and refresh tokens.',
					code: `✅ Use HttpOnly, Secure, SameSite cookies
✅ Store tokens in secure storage (not localStorage)
✅ Implement token rotation
✅ Use short-lived access tokens
✅ Validate tokens on every request`,
					type: 'security',
				},
				{
					title: 'PKCE (Proof Key for Code Exchange)',
					content: 'Enhanced security for public clients.',
					code: `1. Client generates code_verifier (random string)
2. Creates code_challenge = BASE64URL(SHA256(code_verifier))
3. Sends code_challenge in authorization request
4. Authorization Server stores code_challenge
5. Client sends code_verifier in token request
6. Server validates: SHA256(code_verifier) === stored_challenge`,
					type: 'security',
				},
				{
					title: 'State Parameter Protection',
					content: 'Preventing CSRF attacks with state parameters.',
					code: `// Generate cryptographically secure state
const state = crypto.randomBytes(32).toString('hex');

// Store state in session
session.state = state;

// Include in authorization request
GET /authorize?client_id=...&state=${state}

// Validate on callback
if (req.query.state !== session.state) {
  throw new Error('Invalid state parameter');
}`,
					type: 'security',
				},
				{
					title: 'Token Validation',
					content: 'Properly validating JWT tokens.',
					code: `✅ Verify signature using JWKS
✅ Check expiration (exp claim)
✅ Validate issuer (iss claim)
✅ Check audience (aud claim)
✅ Verify not before (nbf claim)
✅ Validate nonce (if present)
✅ Check token type and scope`,
					type: 'validation',
				},
			],
		},
	];

	const startTutorial = (tutorial) => {
		setSelectedTutorial(tutorial);
		setCurrentStep(0);
	};

	const nextStep = () => {
		if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const completeTutorial = () => {
		if (selectedTutorial) {
			setCompletedTutorials((prev) => new Set([...prev, selectedTutorial.id]));
			setSelectedTutorial(null);
			setCurrentStep(0);
		}
	};

	const getDifficultyColor = (difficulty) => {
		switch (difficulty) {
			case 'beginner':
				return '#10b981';
			case 'intermediate':
				return '#3b82f6';
			case 'advanced':
				return '#8b5cf6';
			default:
				return '#6b7280';
		}
	};

	const renderStepContent = (step) => {
		switch (step.type) {
			case 'code':
				return (
					<div>
						<p>{step.content}</p>
						<CodeBlock>{step.code}</CodeBlock>
					</div>
				);
			case 'diagram':
				return (
					<div>
						<p>{step.content}</p>
						<div
							style={{
								backgroundColor: '#f8fafc',
								border: '1px solid #e2e8f0',
								borderRadius: '0.5rem',
								padding: '1rem',
								fontFamily: 'monospace',
								whiteSpace: 'pre-line',
							}}
						>
							{step.code}
						</div>
					</div>
				);
			case 'info':
				return (
					<div>
						<p>{step.content}</p>
						<CodeBlock>{step.code}</CodeBlock>
					</div>
				);
			case 'security':
				return (
					<div>
						<p>{step.content}</p>
						<div
							style={{
								backgroundColor: '#dcfce7',
								border: '1px solid #bbf7d0',
								borderRadius: '0.5rem',
								padding: '1rem',
								fontFamily: 'monospace',
								color: '#166534',
							}}
						>
							{step.code}
						</div>
					</div>
				);
			default:
				return (
					<div>
						<p>{step.content}</p>
						<CodeBlock>{step.code}</CodeBlock>
					</div>
				);
		}
	};

	return (
		<Container>
			<Header>
				<h1>
					<FiBookOpen />
					Interactive Tutorials
				</h1>
				<p>
					Step-by-step guided learning paths to master OAuth 2.0 and OpenID Connect. Choose a
					tutorial and follow along with interactive examples and explanations.
				</p>
			</Header>

			<TutorialGrid>
				{tutorials.map((tutorial) => {
					const progress = completedTutorials.has(tutorial.id)
						? 100
						: selectedTutorial?.id === tutorial.id
							? Math.round((currentStep / tutorial.steps.length) * 100)
							: 0;

					return (
						<TutorialCard key={tutorial.id} onClick={() => startTutorial(tutorial)}>
							<CardBody style={{ textAlign: 'center' }}>
								<TutorialIcon className={tutorial.difficulty}>
									<tutorial.icon size={32} />
								</TutorialIcon>

								<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
									{tutorial.title}
								</h3>

								<p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
									{tutorial.description}
								</p>

								<DifficultyBadge className={tutorial.difficulty}>
									<FiStar size={12} />
									{tutorial.difficulty.charAt(0).toUpperCase() + tutorial.difficulty.slice(1)}
								</DifficultyBadge>

								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
										marginBottom: '1rem',
									}}
								>
									<FiClock size={14} style={{ color: '#6b7280' }} />
									<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
										{tutorial.duration}
									</span>
								</div>

								{progress > 0 && (
									<div style={{ marginBottom: '1rem' }}>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												marginBottom: '0.5rem',
											}}
										>
											<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Progress</span>
											<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{progress}%</span>
										</div>
										<ProgressBar>
											<ProgressFill progress={progress} />
										</ProgressBar>
									</div>
								)}

								<StartButton>
									<FiPlay size={16} />
									{completedTutorials.has(tutorial.id) ? 'Review Tutorial' : 'Start Tutorial'}
								</StartButton>
							</CardBody>
						</TutorialCard>
					);
				})}
			</TutorialGrid>

			{/* Tutorial Modal */}
			{selectedTutorial && (
				<TutorialModal>
					<ModalContent>
						<ModalHeader>
							<h2>{selectedTutorial.title}</h2>
							<CloseButton onClick={() => setSelectedTutorial(null)}>×</CloseButton>
						</ModalHeader>

						<StepContainer>
							<StepHeader>
								<div className="step-number">{currentStep + 1}</div>
								<h3>{selectedTutorial.steps[currentStep].title}</h3>
							</StepHeader>

							<StepContent>{renderStepContent(selectedTutorial.steps[currentStep])}</StepContent>

							<NavigationButtons>
								<NavButton onClick={prevStep} disabled={currentStep === 0}>
									<FiChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
									Previous
								</NavButton>

								<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
									Step {currentStep + 1} of {selectedTutorial.steps.length}
								</div>

								{currentStep === selectedTutorial.steps.length - 1 ? (
									<NavButton className="primary" onClick={completeTutorial}>
										Complete Tutorial
										<FiCheckCircle size={16} />
									</NavButton>
								) : (
									<NavButton onClick={nextStep}>
										Next
										<FiChevronRight size={16} />
									</NavButton>
								)}
							</NavigationButtons>
						</StepContainer>
					</ModalContent>
				</TutorialModal>
			)}
		</Container>
	);
};

export default InteractiveTutorials;
