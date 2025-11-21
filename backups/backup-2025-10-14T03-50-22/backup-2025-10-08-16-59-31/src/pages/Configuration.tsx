import React, { useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiCopy,
	FiDownload,
	FiExternalLink,
	FiGithub,
	FiGlobe,
	FiInfo,
	FiPackage,
	FiPlay,
	FiSave,
	FiSettings,
	FiTerminal,
} from 'react-icons/fi';
import styled from 'styled-components';
import packageJson from '../../package.json';
import { CredentialsInput } from '../components/CredentialsInput';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowHeader } from '../services/flowHeaderService';
import { FlowUIService } from '../services/flowUIService';
import { credentialManager } from '../utils/credentialManager';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
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

const StepCard = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  
  .step-number {
    width: 32px;
    height: 32px;
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin: 0;
  }
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
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const InfoBox = styled.div<{ $type?: 'info' | 'warning' | 'success' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  border-left: 4px solid;
  
  ${({ $type }) => {
		switch ($type) {
			case 'warning':
				return `
          background-color: #fef3c7;
          border-left-color: #f59e0b;
          color: #92400e;
        `;
			case 'success':
				return `
          background-color: #d1fae5;
          border-left-color: #10b981;
          color: #065f46;
        `;
			default:
				return `
          background-color: #dbeafe;
          border-left-color: #3b82f6;
          color: #1e40af;
        `;
		}
	}}
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  
  .feature-icon {
    color: ${({ theme }) => theme.colors.success};
    font-size: 1.25rem;
  }
  
  .feature-text {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray700};
    font-weight: 500;
  }
`;

const Configuration: React.FC = () => {
	usePageScroll({ pageName: 'Configuration & Setup', force: true });
	const [copiedText, setCopiedText] = useState<string>('');

	// Credential state
	const [credentials, setCredentials] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'http://localhost:3000/callback',
		scopes: 'openid profile email',
	});
	const [hasCredentials, setHasCredentials] = useState(false);
	const [credentialsSaved, setCredentialsSaved] = useState(false);

	// Load existing credentials on mount
	useEffect(() => {
		const loadCredentials = () => {
			try {
				const configCredentials = credentialManager.loadConfigCredentials();
				if (configCredentials.environmentId && configCredentials.clientId) {
					setCredentials({
						environmentId: configCredentials.environmentId,
						clientId: configCredentials.clientId,
						clientSecret: configCredentials.clientSecret || '',
						redirectUri: configCredentials.redirectUri || 'http://localhost:3000/callback',
						scopes: Array.isArray(configCredentials.scopes)
							? configCredentials.scopes.join(' ')
							: configCredentials.scopes || 'openid profile email',
					});
					setHasCredentials(true);
				}
			} catch (error) {
				console.error('Failed to load credentials:', error);
			}
		};

		loadCredentials();
	}, []);

	// Save credentials to config storage
	const saveCredentials = async () => {
		try {
			const credentialsToSave = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes.split(' ').filter((s) => s.trim()),
				loginHint: '',
			};

			credentialManager.saveConfigCredentials(credentialsToSave);
			setHasCredentials(true);
			setCredentialsSaved(true);

			// Show success message
			setTimeout(() => setCredentialsSaved(false), 3000);
		} catch (error) {
			console.error('Failed to save credentials:', error);
		}
	};

	// Handle credential changes
	const handleCredentialChange = (field: string, value: string) => {
		setCredentials((prev) => ({ ...prev, [field]: value }));
		setCredentialsSaved(false);
	};

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedText(label);
			setTimeout(() => setCopiedText(''), 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const CodeBlockWithCopy = ({ children, label }: { children: string; label: string }) => (
		<CodeBlock>
			<CopyButton onClick={() => copyToClipboard(children, label)}>
				<FiCopy />
				{copiedText === label ? 'Copied!' : 'Copy'}
			</CopyButton>
			{children}
		</CodeBlock>
	);

	return (
		<Container>
			<FlowHeader flowId="configuration" />

			<Header>
				<h1>
					<FiSettings />
					Setup & Config
				</h1>
				<p>
					Complete setup guide for the PingOne OAuth/OIDC Playground. Get your environment
					configured and start exploring OAuth flows in minutes.
				</p>
			</Header>

			<CollapsibleHeader
				title="Application Information"
				subtitle="Current version and system requirements for the OAuth Playground"
				icon={<FiPackage />}
				defaultCollapsed={false}
			>
				<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
							gap: '1rem',
							marginBottom: '2rem',
						}}
					>
						<div style={{ textAlign: 'center', padding: '1rem' }}>
							<div
								style={{
									fontSize: '2rem',
									fontWeight: '700',
									color: '#3b82f6',
									marginBottom: '0.5rem',
								}}
							>
								{packageJson.version}
							</div>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Version</div>
						</div>
						<div style={{ textAlign: 'center', padding: '1rem' }}>
							<div
								style={{
									fontSize: '2rem',
									fontWeight: '700',
									color: '#10b981',
									marginBottom: '0.5rem',
								}}
							>
								Node.js 16+
							</div>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Requirement</div>
						</div>
						<div style={{ textAlign: 'center', padding: '1rem' }}>
							<div
								style={{
									fontSize: '2rem',
									fontWeight: '700',
									color: '#f59e0b',
									marginBottom: '0.5rem',
								}}
							>
								React + Vite
							</div>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Framework</div>
						</div>
					</div>

					<FeatureGrid>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Interactive OAuth Flows</span>
						</FeatureItem>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Real PingOne Integration</span>
						</FeatureItem>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Token Management</span>
						</FeatureItem>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Educational Content</span>
						</FeatureItem>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Flow Comparison Tools</span>
						</FeatureItem>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Interactive Diagrams</span>
						</FeatureItem>
					</FeatureGrid>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Quick Start Setup"
				subtitle="Get the OAuth Playground running in minutes with these simple steps"
				icon={<FiTerminal />}
				defaultCollapsed={false}
			>
				<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
					<StepCard>
						<StepHeader>
							<div className="step-number">1</div>
							<h3>Clone the Repository</h3>
						</StepHeader>
						<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
							Clone the OAuth Playground repository to your local machine.
						</p>
						<CodeBlockWithCopy label="clone">
							{`git clone https://github.com/curtismu7/oauthPlayground.git
cd oauthPlayground`}
						</CodeBlockWithCopy>
					</StepCard>

					<StepCard>
						<StepHeader>
							<div className="step-number">2</div>
							<h3>Install Dependencies</h3>
						</StepHeader>
						<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
							Install all required Node.js dependencies.
						</p>
						<CodeBlockWithCopy label="install">{`npm install`}</CodeBlockWithCopy>
						<InfoBox $type="info">
							<strong>Note:</strong> This project requires Node.js version 16.0 or higher. Check
							your version with <code>node --version</code>.
						</InfoBox>
					</StepCard>

					<StepCard>
						<StepHeader>
							<div className="step-number">3</div>
							<h3>Configure PingOne Credentials</h3>
						</StepHeader>
						<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
							Set up your PingOne application credentials once, and they'll be available across all
							OAuth flows. You only need to configure this once!
						</p>

						{credentialsSaved && (
							<InfoBox $type="success">
								<FiCheckCircle size={16} />
								<strong>Credentials saved!</strong> Your PingOne credentials are now configured and
								will be used across all flows.
							</InfoBox>
						)}

						<CredentialsInput
							environmentId={credentials.environmentId}
							clientId={credentials.clientId}
							clientSecret={credentials.clientSecret}
							redirectUri={credentials.redirectUri}
							scopes={credentials.scopes}
							onEnvironmentIdChange={(value) => handleCredentialChange('environmentId', value)}
							onClientIdChange={(value) => handleCredentialChange('clientId', value)}
							onClientSecretChange={(value) => handleCredentialChange('clientSecret', value)}
							onRedirectUriChange={(value) => handleCredentialChange('redirectUri', value)}
							onScopesChange={(value) => handleCredentialChange('scopes', value)}
							onCopy={copyToClipboard}
							showEnvironmentIdInput={true}
							onDiscoveryComplete={async (result) => {
								if (result.success && result.document) {
									console.log('OIDC Discovery completed successfully');
									// Auto-populate environment ID if it's a PingOne issuer
									const envId = result.document.issuer.split('/').pop();
									if (envId) {
										handleCredentialChange('environmentId', envId);
									}
									// Set default redirect URI if not already set
									if (!credentials.redirectUri) {
										handleCredentialChange('redirectUri', 'http://localhost:3000/callback');
									}
								}
							}}
							copiedField={copiedText}
						/>

						<div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
							<button
								onClick={saveCredentials}
								style={{
									background: hasCredentials ? '#10b981' : '#3b82f6',
									color: 'white',
									border: '1px solid #ffffff',
									borderRadius: '0.5rem',
									padding: '0.75rem 1.5rem',
									fontSize: '0.875rem',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = hasCredentials ? '#059669' : '#2563eb';
									e.currentTarget.style.borderColor = '#ffffff';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = hasCredentials ? '#10b981' : '#3b82f6';
									e.currentTarget.style.borderColor = '#ffffff';
								}}
							>
								<FiSave size={16} />
								{hasCredentials ? 'Update Credentials' : 'Save Credentials'}
							</button>
						</div>
					</StepCard>

					<StepCard>
						<StepHeader>
							<div className="step-number">4</div>
							<h3>Start the Application</h3>
						</StepHeader>
						<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
							Start the full-stack application with frontend and backend services.
						</p>
						<CodeBlockWithCopy label="start">{`npm start`}</CodeBlockWithCopy>
						<InfoBox $type="info">
							<strong>What happens:</strong> This command starts both the frontend (React/Vite) and
							backend (Express) servers, performs health checks, and automatically opens your
							browser to <code>https://localhost:3000</code>.
						</InfoBox>
					</StepCard>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Alternative Startup Options"
				subtitle="Different ways to start the application depending on your needs"
				icon={<FiPlay />}
				defaultCollapsed={true}
			>
				<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
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
								Development Mode
							</h3>
							<p style={{ color: '#0369a1', marginBottom: '1rem' }}>
								For active development with hot reloading and detailed error messages.
							</p>
							<CodeBlockWithCopy label="dev">{`npm run dev`}</CodeBlockWithCopy>
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
								Simple Start
							</h3>
							<p style={{ color: '#15803d', marginBottom: '1rem' }}>
								Quick start without advanced monitoring or health checks.
							</p>
							<CodeBlockWithCopy label="simple">{`npm run start:simple`}</CodeBlockWithCopy>
						</div>

						<div
							style={{
								padding: '1.5rem',
								background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
								border: '2px solid #f59e0b',
								borderRadius: '0.75rem',
							}}
						>
							<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
								Individual Servers
							</h3>
							<p style={{ color: '#92400e', marginBottom: '1rem' }}>
								Start frontend and backend servers separately.
							</p>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
								<CodeBlockWithCopy label="frontend">{`npm run start:frontend`}</CodeBlockWithCopy>
								<CodeBlockWithCopy label="backend">{`npm run start:backend`}</CodeBlockWithCopy>
							</div>
						</div>
					</div>
					<div
						style={{
							padding: '1.5rem',
							background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
							border: '2px solid #8b5cf6',
							borderRadius: '0.75rem',
						}}
					>
						<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
							Redirect Server Launcher
						</h3>
						<p style={{ color: '#5b21b6', marginBottom: '1rem' }}>
							Runs both redirect-friendly servers with the project defaults.
						</p>
						<CodeBlockWithCopy label="redirect-script">{`./redirect-servers.sh`}</CodeBlockWithCopy>
						<p style={{ color: '#4c1d95', fontSize: '0.85rem', marginTop: '0.75rem' }}>
							If the script is not executable, run:
						</p>
						<CodeBlockWithCopy label="redirect-chmod">{`chmod +x redirect-servers.sh`}</CodeBlockWithCopy>
					</div>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Troubleshooting"
				subtitle="Common issues and their solutions"
				icon={<FiAlertCircle />}
				defaultCollapsed={true}
			>
				<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
					<div style={{ display: 'grid', gap: '1rem' }}>
						<InfoBox $type="warning">
							<strong>Port Already in Use:</strong> The restart script automatically handles this,
							but if issues persist, check what's using ports 3000 and 3001 with{' '}
							<code>lsof -i :3000</code>
							and <code>lsof -i :3001</code>.
						</InfoBox>

						<InfoBox $type="warning">
							<strong>Dependencies Issues:</strong> Try a clean reinstall with
							<code>rm -rf node_modules package-lock.json && npm install</code>.
						</InfoBox>

						<InfoBox $type="warning">
							<strong>SSL Certificate Warnings:</strong> Click "Advanced" → "Proceed to localhost
							(unsafe)" in Chrome, or set <code>VITE_DEV_SERVER_HTTPS=false</code> in{' '}
							<code>.env</code> for HTTP-only mode.
						</InfoBox>

						<InfoBox $type="info">
							<strong>Environment Variables:</strong> The application uses environment variables for
							PingOne configuration. Check the <code>.env</code> file exists and contains the
							required variables.
						</InfoBox>
					</div>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Additional Resources"
				subtitle="Explore more resources to get the most out of the OAuth Playground"
				icon={<FiExternalLink />}
				defaultCollapsed={true}
			>
				<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
						<a
							href="https://github.com/curtismu7/oauthPlayground"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1.5rem',
								backgroundColor: '#3b82f6',
								color: 'white',
								textDecoration: 'none',
								borderRadius: '0.5rem',
								fontWeight: '600',
								fontSize: '0.875rem',
								border: '1px solid #ffffff',
								transition: 'all 0.2s',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#2563eb';
								e.currentTarget.style.borderColor = '#ffffff';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = '#3b82f6';
								e.currentTarget.style.borderColor = '#ffffff';
							}}
						>
							<FiGithub />
							View on GitHub
						</a>

						<a
							href="https://docs.pingidentity.com/pingone/auth/v1/api/#openid-connectoauth-2"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1.5rem',
								backgroundColor: 'white',
								color: '#3b82f6',
								textDecoration: 'none',
								borderRadius: '0.5rem',
								fontWeight: '600',
								fontSize: '0.875rem',
								border: '1px solid #3b82f6',
								transition: 'all 0.2s',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f8fafc';
								e.currentTarget.style.borderColor = '#2563eb';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'white';
								e.currentTarget.style.borderColor = '#3b82f6';
							}}
						>
							<FiExternalLink />
							PingOne API Docs
						</a>

						<a
							href="https://docs.pingidentity.com/sdks/latest/sdks/index.html"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1.5rem',
								backgroundColor: 'white',
								color: '#3b82f6',
								textDecoration: 'none',
								borderRadius: '0.5rem',
								fontWeight: '600',
								fontSize: '0.875rem',
								border: '1px solid #3b82f6',
								transition: 'all 0.2s',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f8fafc';
								e.currentTarget.style.borderColor = '#2563eb';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'white';
								e.currentTarget.style.borderColor = '#3b82f6';
							}}
						>
							<FiDownload />
							PingOne SDKs
						</a>
					</div>
				</Card>
			</CollapsibleHeader>
		</Container>
	);
};

export default Configuration;
