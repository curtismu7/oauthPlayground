import { useState } from 'react';
import { FiCode, FiPlay } from 'react-icons/fi';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../components/Card';
import InteractiveTutorial from '../components/InteractiveTutorial';
import OAuthUtilities from '../components/OAuthUtilities';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.75rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const TabNavigation = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray200};
`;

const TabButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.gray600)};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom-color: ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.gray50};
  }
`;

const TutorialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const TutorialCard = styled(Card)`
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const TutorialMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const DifficultyBadge = styled.span<{ $difficulty: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${({ $difficulty, theme }) => {
		switch ($difficulty) {
			case 'Beginner':
				return `${theme.colors.success}20`;
			case 'Intermediate':
				return `${theme.colors.warning}20`;
			case 'Advanced':
				return `${theme.colors.danger}20`;
			default:
				return theme.colors.gray200;
		}
	}};
  color: ${({ $difficulty, theme }) => {
		switch ($difficulty) {
			case 'Beginner':
				return theme.colors.success;
			case 'Intermediate':
				return theme.colors.warning;
			case 'Advanced':
				return theme.colors.danger;
			default:
				return theme.colors.gray600;
		}
	}};
`;

const EnhancedTutorials = () => {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<'tutorials' | 'utilities'>('tutorials');
	const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);

	const tutorials = [
		{
			id: 'oauth-basics',
			title: 'OAuth 2.0 Fundamentals',
			description:
				'Learn the core concepts of OAuth 2.0 including flows, tokens, and security considerations.',
			estimatedTime: '15 minutes',
			difficulty: 'Beginner' as const,
			steps: [
				{
					id: 'step1',
					title: 'Understanding OAuth Roles',
					description:
						'Learn about the four key roles in OAuth: Resource Owner, Client, Authorization Server, and Resource Server.',
					content: (
						<div>
							<p>
								<strong>Resource Owner:</strong> The user who owns the data (you!)
							</p>
							<p>
								<strong>Client:</strong> The application requesting access
							</p>
							<p>
								<strong>Authorization Server:</strong> Issues tokens (PingOne)
							</p>
							<p>
								<strong>Resource Server:</strong> Hosts the protected data
							</p>
						</div>
					),
				},
				{
					id: 'step2',
					title: 'OAuth Flow Overview',
					description: 'See how these roles interact in a typical OAuth flow.',
					action: {
						type: 'navigate' as const,
						label: 'View Flow Diagram',
						path: '/flows',
					},
				},
				{
					id: 'step3',
					title: 'Security Considerations',
					description: 'Understand why OAuth is secure and what can go wrong.',
					codeExample: `// Always validate tokens
const isValid = await validateToken(accessToken);
if (!isValid) {
  throw new Error('Invalid token');
}`,
				},
			],
		},
		{
			id: 'authorization-code-tutorial',
			title: 'Authorization Code Flow Tutorial',
			description:
				'Step-by-step guide through the most secure OAuth flow for server-side applications.',
			estimatedTime: '20 minutes',
			difficulty: 'Intermediate' as const,
			steps: [
				{
					id: 'step1',
					title: 'Configure Your Application',
					description: 'Set up the OAuth configuration for Authorization Code flow.',
					action: {
						type: 'configure' as const,
						label: 'Open Configuration',
						onClick: () => navigate('/configuration'),
					},
				},
				{
					id: 'step2',
					title: 'Start Authorization Request',
					description: 'Initiate the OAuth flow by redirecting to the authorization server.',
					action: {
						type: 'execute' as const,
						label: 'Start Flow',
						onClick: () => navigate('/flows/authorization-code'),
					},
				},
				{
					id: 'step3',
					title: 'Handle the Callback',
					description: 'Process the authorization code and exchange it for tokens.',
					action: {
						type: 'observe' as const,
						label: 'View Callback',
						onClick: () => navigate('/callback'),
					},
				},
				{
					id: 'step4',
					title: 'Use the Access Token',
					description: 'Make authenticated requests with your access token.',
					codeExample: `fetch('/api/userinfo', {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
})`,
				},
			],
		},
		{
			id: 'pkce-tutorial',
			title: 'PKCE Flow Mastery',
			description:
				'Learn to implement PKCE (Proof Key for Code Exchange) for enhanced security in public clients.',
			estimatedTime: '25 minutes',
			difficulty: 'Intermediate' as const,
			steps: [
				{
					id: 'step1',
					title: 'Generate Code Verifier',
					description: 'Create a cryptographically random code verifier.',
					codeExample: `const codeVerifier = generateRandomString(64);
console.log('Code Verifier:', codeVerifier);`,
				},
				{
					id: 'step2',
					title: 'Create Code Challenge',
					description: 'Generate the SHA256 hash of the code verifier.',
					action: {
						type: 'execute' as const,
						label: 'Try PKCE Flow',
						onClick: () => navigate('/flows/pkce'),
					},
				},
			],
		},
		{
			id: 'token-validation',
			title: 'JWT Token Validation',
			description:
				'Master the art of validating JWT tokens including signature verification and claims validation.',
			estimatedTime: '30 minutes',
			difficulty: 'Advanced' as const,
			steps: [
				{
					id: 'step1',
					title: 'Decode JWT Structure',
					description: 'Understand the three parts of a JWT: header, payload, and signature.',
					codeExample: `const [header, payload, signature] = jwt.split('.');
const decodedHeader = JSON.parse(atob(header));
const decodedPayload = JSON.parse(atob(payload));`,
				},
				{
					id: 'step2',
					title: 'Verify Token Signature',
					description: 'Use JWKS to verify the token signature.',
					action: {
						type: 'execute' as const,
						label: 'Validate Token',
						onClick: () => navigate('/oidc/id-tokens'),
					},
				},
			],
		},
	];

	const selectedTutorialData = tutorials.find((t) => t.id === selectedTutorial);

	if (selectedTutorial && selectedTutorialData) {
		return (
			<Container>
				<InteractiveTutorial
					tutorial={selectedTutorialData}
					onTutorialComplete={() => {
						console.log('Tutorial completed!');
						// Could track completion, show achievement, etc.
					}}
					onStepComplete={(stepId) => {
						console.log('Step completed:', stepId);
					}}
				/>
				<div style={{ textAlign: 'center', marginTop: '2rem' }}>
					<button
						onClick={() => setSelectedTutorial(null)}
						style={{
							padding: '0.75rem 1.5rem',
							background: 'none',
							border: '2px solid #ccc',
							borderRadius: '0.5rem',
							cursor: 'pointer',
						}}
					>
						Back to Tutorials
					</button>
				</div>
			</Container>
		);
	}

	return (
		<Container>
			<PageHeader>
				<h1>Interactive Learning Center</h1>
				<p>
					Master OAuth 2.0 and OpenID Connect through hands-on tutorials and practical tools. Learn
					by doing with real implementations and immediate feedback.
				</p>
			</PageHeader>

			<TabNavigation>
				<TabButton $active={activeTab === 'tutorials'} onClick={() => setActiveTab('tutorials')}>
					<FiPlay size={16} />
					Interactive Tutorials
				</TabButton>
				<TabButton $active={activeTab === 'utilities'} onClick={() => setActiveTab('utilities')}>
					<FiCode size={16} />
					Developer Utilities
				</TabButton>
			</TabNavigation>

			{activeTab === 'tutorials' && (
				<div>
					<h2 style={{ marginBottom: '1.5rem' }}>Choose Your Learning Path</h2>
					<TutorialGrid>
						{tutorials.map((tutorial) => (
							<TutorialCard key={tutorial.id} onClick={() => setSelectedTutorial(tutorial.id)}>
								<CardHeader>
									<h3>{tutorial.title}</h3>
								</CardHeader>
								<CardBody>
									<p>{tutorial.description}</p>
									<TutorialMeta>
										<span>{tutorial.estimatedTime}</span>
										<DifficultyBadge $difficulty={tutorial.difficulty}>
											{tutorial.difficulty}
										</DifficultyBadge>
									</TutorialMeta>
								</CardBody>
							</TutorialCard>
						))}
					</TutorialGrid>
				</div>
			)}

			{activeTab === 'utilities' && <OAuthUtilities />}
		</Container>
	);
};

export default EnhancedTutorials;
