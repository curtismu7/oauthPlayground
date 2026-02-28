import React from 'react';
import { FiCode, FiDownload, FiExternalLink, FiGithub, FiPlay } from '@icons';
import styled from 'styled-components';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import PageLayoutService from '../services/pageLayoutService';

const _Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const _Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 2.5rem;
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

const Card = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
`;

const CardHeader = styled.div`
  margin-bottom: 1.5rem;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.6;
  }
`;

const SdkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SdkCard = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const SdkHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  
  .sdk-icon {
    width: 48px;
    height: 48px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
  }
  
  .sdk-info {
    flex: 1;
    
    h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.gray900};
      margin-bottom: 0.25rem;
    }
    
    .sdk-version {
      font-size: 0.875rem;
      color: ${({ theme }) => theme.colors.gray600};
    }
  }
`;

const SdkDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray700};
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const SdkActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.a<{ $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  ${({ $variant, theme }) => {
		if ($variant === 'primary') {
			return `
        background-color: ${theme.colors.primary};
        color: white;
        
        &:hover {
          background-color: ${theme.colors.primaryDark};
          transform: translateY(-1px);
        }
      `;
		} else {
			return `
        background-color: white;
        color: ${theme.colors.gray700};
        border: 1px solid ${theme.colors.gray300};
        
        &:hover {
          background-color: ${theme.colors.gray50};
          border-color: ${theme.colors.gray400};
        }
      `;
		}
	}}
`;

const CodeBlock = styled.pre`
  background-color: #1f2937;
  color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  margin: 1rem 0;
  border: 1px solid #374151;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    color: ${({ theme }) => theme.colors.gray700};
    
    &::before {
      content: '✓';
      color: ${({ theme }) => theme.colors.success};
      font-weight: bold;
    }
  }
`;

const SdkSampleApp: React.FC = () => {
	usePageScroll({ pageName: 'SDK Sample App', force: true });

	// Use V6 pageLayoutService for consistent dimensions and FlowHeader integration
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem', // Wider for SDK content (1152px)
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'sdk-sample-app', // Enables FlowHeader integration
	};

	const {
		PageContainer,
		ContentWrapper,
		FlowHeader: LayoutFlowHeader,
	} = PageLayoutService.createPageLayout(pageConfig);

	const sdks = [
		{
			id: 'nodejs',
			name: 'Node.js SDK',
			version: 'v2.0.0',
			icon: <FiCode />,
			description:
				'Official PingOne SDK for Node.js applications with full OAuth 2.0 and OpenID Connect support.',
			features: [
				'Authorization Code Flow with PKCE',
				'Client Credentials Flow',
				'Token management and refresh',
				'JWT validation and parsing',
				'TypeScript support',
			],
			installCommand: 'npm install @pingidentity/pingone-nodejs-sdk',
			docsUrl: 'https://docs.pingidentity.com/sdks/latest/sdks/nodejs/index.html',
			githubUrl: 'https://github.com/pingidentity/pingone-nodejs-sdk',
		},
		{
			id: 'python',
			name: 'Python SDK',
			version: 'v1.5.0',
			icon: <FiCode />,
			description: 'Python SDK for building secure applications with PingOne identity services.',
			features: [
				'Django and Flask integration',
				'Async/await support',
				'Token caching and management',
				'Custom claim validation',
				'Webhook handling',
			],
			installCommand: 'pip install pingone-python-sdk',
			docsUrl: 'https://docs.pingidentity.com/sdks/latest/sdks/python/index.html',
			githubUrl: 'https://github.com/pingidentity/pingone-python-sdk',
		},
		{
			id: 'java',
			name: 'Java SDK',
			version: 'v3.1.0',
			icon: <FiCode />,
			description:
				'Enterprise-grade Java SDK with Spring Boot integration and comprehensive OAuth support.',
			features: [
				'Spring Boot auto-configuration',
				'Servlet filter integration',
				'JWT validation with Nimbus',
				'Token introspection',
				'Maven and Gradle support',
			],
			installCommand: 'mvn dependency:get -Dartifact=com.pingidentity:pingone-java-sdk:3.1.0',
			docsUrl: 'https://docs.pingidentity.com/sdks/latest/sdks/java/index.html',
			githubUrl: 'https://github.com/pingidentity/pingone-java-sdk',
		},
		{
			id: 'csharp',
			name: '.NET SDK',
			version: 'v2.2.0',
			icon: <FiCode />,
			description:
				'Microsoft .NET SDK for ASP.NET Core applications with built-in authentication middleware.',
			features: [
				'ASP.NET Core middleware',
				'Dependency injection support',
				'Configuration binding',
				'Token caching with Redis',
				'OpenTelemetry integration',
			],
			installCommand: 'dotnet add package PingOne.DotNet.Sdk',
			docsUrl: 'https://docs.pingidentity.com/sdks/latest/sdks/dotnet/index.html',
			githubUrl: 'https://github.com/pingidentity/pingone-dotnet-sdk',
		},
	];

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}

				<CollapsibleHeader
					title="Quick Start Guide"
					subtitle="Get started with PingOne SDKs in minutes. Choose your preferred language and follow the installation and setup instructions."
					icon={<FiPlay />}
					defaultCollapsed={false}
				>
					<div style={{ padding: '1.5rem' }}>
						<Card>
							<CardHeader>
								<h2>
									<FiPlay />
									Quick Start Guide
								</h2>
								<p>
									Get started with PingOne SDKs in minutes. Choose your preferred language and
									follow the installation and setup instructions.
								</p>
							</CardHeader>

							<div>
								<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
									1. Install the SDK
								</h3>
								<CodeBlock>{`# Choose your language
npm install @pingidentity/pingone-nodejs-sdk  # Node.js
pip install pingone-python-sdk                # Python
# Add to pom.xml or build.gradle             # Java
dotnet add package PingOne.DotNet.Sdk         # .NET`}</CodeBlock>

								<h3
									style={{
										fontSize: '1.25rem',
										fontWeight: '600',
										marginBottom: '1rem',
										marginTop: '2rem',
									}}
								>
									2. Configure Your Application
								</h3>
								<CodeBlock>{`// Initialize the SDK with your credentials
const pingOne = new PingOneSDK({
  environmentId: process.env.PINGONE_ENVIRONMENT_ID,
  clientId: process.env.PINGONE_CLIENT_ID,
  clientSecret: process.env.PINGONE_CLIENT_SECRET,
  redirectUri: process.env.PINGONE_REDIRECT_URI
});`}</CodeBlock>

								<h3
									style={{
										fontSize: '1.25rem',
										fontWeight: '600',
										marginBottom: '1rem',
										marginTop: '2rem',
									}}
								>
									3. Implement OAuth Flow
								</h3>
								<CodeBlock>{`// Start authorization flow
app.get('/login', (req, res) => {
  const authUrl = pingOne.getAuthorizationUrl({
    scope: 'openid profile email',
    state: generateRandomString()
  });
  res.redirect(authUrl);
});

// Handle callback
app.get('/callback', async (req, res) => {
  const tokens = await pingOne.exchangeCodeForTokens(req.query.code);
  // Store tokens and redirect to dashboard
  res.redirect('/dashboard');
});`}</CodeBlock>
							</div>
						</Card>

						<Card>
							<CardHeader>
								<h2>
									<FiGithub />
									Available SDKs
								</h2>
								<p>Official PingOne SDKs for popular programming languages and frameworks.</p>
							</CardHeader>

							<SdkGrid>
								{sdks.map((sdk) => (
									<SdkCard key={sdk.id}>
										<SdkHeader>
											<div className="sdk-icon">{sdk.icon}</div>
											<div className="sdk-info">
												<h3>{sdk.name}</h3>
												<div className="sdk-version">{sdk.version}</div>
											</div>
										</SdkHeader>

										<SdkDescription>{sdk.description}</SdkDescription>

										<FeatureList>
											{sdk.features.map((feature, index) => (
												<li key={index}>{feature}</li>
											))}
										</FeatureList>

										<div style={{ marginBottom: '1rem' }}>
											<strong>Install:</strong>
											<CodeBlock style={{ margin: '0.5rem 0', fontSize: '0.8rem' }}>
												{sdk.installCommand}
											</CodeBlock>
										</div>

										<SdkActions>
											<ActionButton
												href={sdk.docsUrl}
												target="_blank"
												rel="noopener noreferrer"
												$variant="primary"
											>
												<FiExternalLink />
												Documentation
											</ActionButton>
											<ActionButton
												href={sdk.githubUrl}
												target="_blank"
												rel="noopener noreferrer"
												$variant="secondary"
											>
												<FiGithub />
												GitHub
											</ActionButton>
										</SdkActions>
									</SdkCard>
								))}
							</SdkGrid>
						</Card>
					</div>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Sample Applications"
					subtitle="Download and run complete sample applications that demonstrate OAuth 2.0 and OpenID Connect integration patterns."
					icon={<FiDownload />}
					defaultCollapsed={false}
				>
					<div style={{ padding: '1.5rem' }}>
						<Card>
							<CardHeader>
								<h2>
									<FiDownload />
									Sample Applications
								</h2>
								<p>
									Download and run complete sample applications that demonstrate OAuth 2.0 and
									OpenID Connect integration patterns.
								</p>
							</CardHeader>

							<div style={{ display: 'grid', gap: '1rem' }}>
								<div
									style={{
										padding: '1.5rem',
										background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
										border: '2px solid #0ea5e9',
										borderRadius: '0.75rem',
									}}
								>
									<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
										OAuth Playground (This Application)
									</h3>
									<p style={{ color: '#0369a1', marginBottom: '1rem' }}>
										Interactive web application for learning and testing OAuth 2.0 and OpenID
										Connect flows.
									</p>
									<ActionButton
										href="https://github.com/curtismu7/oauthPlayground"
										target="_blank"
										rel="noopener noreferrer"
										$variant="primary"
									>
										<FiGithub />
										View on GitHub
									</ActionButton>
								</div>

								<div
									style={{
										padding: '1.5rem',
										background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
										border: '2px solid #22c55e',
										borderRadius: '0.75rem',
									}}
								>
									<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
										Enterprise Sample Applications
									</h3>
									<p style={{ color: '#15803d', marginBottom: '1rem' }}>
										Production-ready examples for enterprise applications with advanced security
										features.
									</p>
									<ActionButton
										href="https://docs.pingidentity.com/sdks/latest/sdks/index.html#sample-applications"
										target="_blank"
										rel="noopener noreferrer"
										$variant="primary"
									>
										<FiExternalLink />
										View Samples
									</ActionButton>
								</div>
							</div>
						</Card>
					</div>
				</CollapsibleHeader>
			</ContentWrapper>
		</PageContainer>
	);
};

export default SdkSampleApp;
