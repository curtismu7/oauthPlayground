/**
 * @file CodeGeneratorsPage.tsx
 * @description Code generators and SDK examples for OAuth 2.0 implementations
 * @version 9.27.0
 */

import React, { useState } from 'react';
import { FiCode, FiDownload, FiCopy, FiTerminal, FiDatabase, FiShield, FiKey, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiBook, FiGitBranch, FiPackage, FiSettings, FiEye, FiEyeOff, FiInfo } from 'react-icons/fi';
import styled from 'styled-components';
import { PageHeaderV8, PageHeaderTextColors } from '@/v8/components/shared/PageHeaderV8';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const _MODULE_TAG = '[💻 CODE-GENERATORS]';

interface CodeGenerator {
	id: string;
	name: string;
	description: string;
	language: string;
	category: 'oauth' | 'oidc' | 'mfa' | 'token' | 'security';
	template: string;
	variables: CodeVariable[];
	examples: CodeExample[];
}

interface CodeVariable {
	name: string;
	description: string;
	defaultValue: string;
	type: 'string' | 'number' | 'boolean' | 'array';
	required: boolean;
}

interface CodeExample {
	title: string;
	description: string;
	code: string;
	language: string;
}

const Container = styled.div`
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;
`;

const Section = styled.div`
	background: white;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin: 1.5rem 0;
`;

const Card = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	transition: all 0.3s ease;
	
	&:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
`;

const CardTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CardDescription = styled.p`
	color: #6b7280;
	font-size: 0.875rem;
	margin: 0 0 1rem 0;
`;

const LanguageBadge = styled.span<{ $language: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	
	${({ $language }) => {
		switch ($language) {
			case 'javascript':
			case 'node':
				return 'background: #f7df1e; color: #323230;';
			case 'python':
				return 'background: #3776ab; color: white;';
			case 'java':
				return 'background: #f89820; color: white;';
			case 'csharp':
				return 'background: #239120; color: white;';
			case 'php':
				return 'background: #777bb4; color: white;';
			case 'ruby':
				return 'background: #cc342d; color: white;';
			case 'go':
				return 'background: #00add8; color: white;';
			case 'curl':
				return 'background: #07407a; color: white;';
			default:
				return 'background: #6b7280; color: white;';
		}
	}}
`;

const CodeDisplay = styled.div`
	background: #1f2937;
	color: #f3f4f6;
	padding: 1.5rem;
	border-radius: 0.5rem;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	margin: 1rem 0;
	position: relative;
`;

const CodeHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid #374151;
`;

const CodeContent = styled.div<{ $obfuscated: boolean }>`
	white-space: pre-wrap;
	word-break: break-all;
	filter: ${({ $obfuscated }) => ($obfuscated ? 'blur(8px)' : 'none')};
	transition: filter 0.3s ease;
`;

const VariableForm = styled.div`
	background: #f8fafc;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const FormGroup = styled.div`
	margin-bottom: 1rem;
	
	label {
		display: block;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
	}
	
	input, select, textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		
		&:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}
	}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

const TabContainer = styled.div`
	border-bottom: 1px solid #e5e7eb;
	margin-bottom: 1rem;
`;

const TabButtons = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
	padding: 0.5rem 1rem;
	border: none;
	background: ${({ $active }) => ($active ? '#3b82f6' : 'transparent')};
	color: ${({ $active }) => ($active ? 'white' : '#6b7280')};
	border-radius: 0.375rem 0.375rem 0 0;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover {
		background: ${({ $active }) => ($active ? '#2563eb' : '#f3f4f6')};
		color: ${({ $active }) => ($active ? 'white' : '#374151');
	}
`;

const TabContent = styled.div`
	padding: 1rem 0;
`;

// Mock code generators data
const mockCodeGenerators: CodeGenerator[] = [
	{
		id: 'oauth-authorization-code-js',
		name: 'OAuth 2.0 Authorization Code',
		description: 'JavaScript implementation of OAuth 2.0 Authorization Code flow',
		language: 'javascript',
		category: 'oauth',
		template: `// OAuth 2.0 Authorization Code Flow Implementation
const OAuthClient = {
  clientId: '{{clientId}}',
  clientSecret: '{{clientSecret}}',
  redirectUri: '{{redirectUri}}',
  authUrl: '{{authUrl}}',
  tokenUrl: '{{tokenUrl}}',
  
  async initiateAuth() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: '{{scopes}}',
      state: this.generateState()
    });
    
    window.location.href = \`\${this.authUrl}?\${params.toString()}\`;
  },
  
  async exchangeCodeForToken(code, state) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
        state: state
      })
    });
    
    return await response.json();
  },
  
  generateState() {
    return Math.random().toString(36).substring(2, 15);
  }
};`,
		variables: [
			{ name: 'clientId', description: 'OAuth client ID', defaultValue: 'your-client-id', type: 'string', required: true },
			{ name: 'clientSecret', description: 'OAuth client secret', defaultValue: 'your-client-secret', type: 'string', required: true },
			{ name: 'redirectUri', description: 'Redirect URI', defaultValue: 'http://localhost:3000/callback', type: 'string', required: true },
			{ name: 'authUrl', description: 'Authorization server URL', defaultValue: 'https://auth.pingone.com/oauth/authorize', type: 'string', required: true },
			{ name: 'tokenUrl', description: 'Token endpoint URL', defaultValue: 'https://auth.pingone.com/oauth/token', type: 'string', required: true },
			{ name: 'scopes', description: 'OAuth scopes', defaultValue: 'openid profile email', type: 'string', required: true }
		],
		examples: [
			{
				title: 'Basic Usage',
				description: 'Simple authorization code flow implementation',
				code: `const client = new OAuthClient();
await client.initiateAuth();`,
				language: 'javascript'
			},
			{
				title: 'Token Exchange',
				description: 'Exchange authorization code for access token',
				code: `const tokenResponse = await client.exchangeCodeForToken(code, state);
console.log('Access Token:', tokenResponse.access_token);`,
				language: 'javascript'
			}
		]
	}
];

export const CodeGeneratorsPage: React.FC = () => {
	const [selectedGenerator, setSelectedGenerator] = useState<CodeGenerator | null>(null);
	const [generatedCode, setGeneratedCode] = useState<string>('');
	const [variables, setVariables] = useState<Record<string, string>>({});
	const [showCode, setShowCode] = useState(true);
	const [copiedText, setCopiedText] = useState('');
	const [activeTab, setActiveTab] = useState<'generator' | 'examples'>('generator');

	const handleGeneratorSelect = (generator: CodeGenerator) => {
		setSelectedGenerator(generator);
		setActiveTab('generator');
		
		// Initialize variables with default values
		const defaultVars: Record<string, string> = {};
		generator.variables.forEach(variable => {
			defaultVars[variable.name] = variable.defaultValue;
		});
		setVariables(defaultVars);
		
		// Generate initial code
		generateCode(generator, defaultVars);
	};

	const generateCode = (generator: CodeGenerator, vars: Record<string, string>) => {
		let code = generator.template;
		
		// Replace variables in template
		Object.entries(vars).forEach(([key, value]) => {
			const regex = new RegExp(`{{${key}}}`, 'g');
			code = code.replace(regex, value);
		});
		
		setGeneratedCode(code);
	};

	const handleVariableChange = (name: string, value: string) => {
		const newVars = { ...variables, [name]: value };
		setVariables(newVars);
		
		if (selectedGenerator) {
			generateCode(selectedGenerator, newVars);
		}
	};

	const copyToClipboard = (text: string, type: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedText(type);
			toastV8.success(`${type} copied to clipboard`);
			setTimeout(() => setCopiedText(''), 2000);
		}).catch(() => {
			toastV8.error('Failed to copy to clipboard');
		});
	};

	const downloadCode = () => {
		if (!selectedGenerator) return;
		
		const blob = new Blob([generatedCode], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${selectedGenerator.name.replace(/\s+/g, '-').toLowerCase()}.${selectedGenerator.language}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		
		toastV8.success('Code downloaded successfully');
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case 'oauth': return '#3b82f6';
			case 'oidc': return '#10b981';
			case 'mfa': return '#f59e0b';
			case 'token': return '#ef4444';
			case 'security': return '#8b5cf6';
			default: return '#6b7280';
		}
	};

	return (
		<Container>
			<PageHeaderV8
				title="Code Generators & SDK Examples"
				subtitle="Interactive code generators and SDK examples for OAuth 2.0 implementations"
				gradient="#8b5cf6"
				textColor={PageHeaderTextColors.white}
			/>

			<Section>
				<SectionTitle>
					<FiCode />
					Available Code Generators
				</SectionTitle>
				
				<Grid>
					{mockCodeGenerators.map((generator) => (
						<Card key={generator.id}>
							<CardTitle>
								<FiPackage />
								{generator.name}
							</CardTitle>
							<CardDescription>
								{generator.description}
							</CardDescription>
							
							<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
								<LanguageBadge $language={generator.language}>
									{generator.language}
								</LanguageBadge>
								<span
									style={{
										padding: '0.25rem 0.5rem',
										borderRadius: '0.25rem',
										fontSize: '0.75rem',
										background: getCategoryColor(generator.category),
										color: 'white'
									}}
								>
									{generator.category}
								</span>
							</div>
							
							<BootstrapButton
								variant="primary"
								onClick={() => handleGeneratorSelect(generator)}
								style={{ width: '100%' }}
							>
								<FiCode />
								Generate Code
							</BootstrapButton>
						</Card>
					))}
				</Grid>
			</Section>

			{selectedGenerator && (
				<Section>
					<SectionTitle>
						<FiTerminal />
						{selectedGenerator.name} - Code Generator
					</SectionTitle>
					
					<TabContainer>
						<TabButtons>
							<TabButton
								$active={activeTab === 'generator'}
								onClick={() => setActiveTab('generator')}
							>
								<FiSettings />
								Generator
							</TabButton>
							<TabButton
								$active={activeTab === 'examples'}
								onClick={() => setActiveTab('examples')}
							>
								<FiBook />
								Examples
							</TabButton>
						</TabButtons>
					</TabContainer>
					
					<TabContent>
						{activeTab === 'generator' ? (
							<>
								<VariableForm>
									<h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>
										Configuration Variables
									</h3>
									{selectedGenerator.variables.map((variable) => (
										<FormGroup key={variable.name}>
											<label htmlFor={variable.name}>
												{variable.name}
												{variable.required && <span style={{ color: '#ef4444' }}> *</span>}
											</label>
											<input
												id={variable.name}
												type="text"
												value={variables[variable.name] || ''}
												onChange={(e) => handleVariableChange(variable.name, e.target.value)}
												placeholder={variable.defaultValue}
											/>
											<small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
												{variable.description}
											</small>
										</FormGroup>
									))}
								</VariableForm>

								<CodeDisplay>
									<CodeHeader>
										<div>
											<span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
												Generated {selectedGenerator.language} Code
											</span>
										</div>
										<BootstrapButton
											variant="secondary"
											onClick={() => setShowCode(!showCode)}
											style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
										>
											{showCode ? <FiEyeOff /> : <FiEye />}
										</BootstrapButton>
									</CodeHeader>
									
									<CodeContent $obfuscated={!showCode}>
										{generatedCode}
									</CodeContent>
								</CodeDisplay>

								<ActionButtons>
									<BootstrapButton
										variant="primary"
										onClick={() => copyToClipboard(generatedCode, 'Generated Code')}
									>
										{copiedText === 'Generated Code' ? <FiRefreshCw /> : <FiCopy />}
										{copiedText === 'Generated Code' ? 'Copied!' : 'Copy Code'}
									</BootstrapButton>
									
									<BootstrapButton
										variant="primary"
										onClick={downloadCode}
									>
										<FiDownload />
										Download
									</BootstrapButton>
									
									<BootstrapButton
										variant="secondary"
										onClick={() => generateCode(selectedGenerator, variables)}
									>
										<FiRefreshCw />
										Regenerate
									</BootstrapButton>
								</ActionButtons>
							</>
						) : (
							<>
								<h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>
									Code Examples
								</h3>
								{selectedGenerator.examples.map((example, index) => (
									<div key={index} style={{ marginBottom: '2rem' }}>
										<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
											{example.title}
										</h4>
										<p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
											{example.description}
										</p>
										<CodeDisplay>
											<CodeHeader>
												<div>
													<LanguageBadge $language={example.language}>
														{example.language}
													</LanguageBadge>
												</div>
												<BootstrapButton
													variant="secondary"
													onClick={() => copyToClipboard(example.code, 'Example Code')}
													style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
												>
													{copiedText === 'Example Code' ? <FiRefreshCw /> : <FiCopy />}
												</BootstrapButton>
											</CodeHeader>
											
											<CodeContent $obfuscated={false}>
												{example.code}
											</CodeContent>
										</CodeDisplay>
									</div>
								))}
							</>
						)}
					</TabContent>
				</Section>
			)}

			<Section>
				<SectionTitle>
					<FiInfo />
					Development Best Practices
				</SectionTitle>
				
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
					<div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.375rem', padding: '1rem' }}>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Security</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Never hardcode client secrets in production code</li>
							<li>Use environment variables for sensitive configuration</li>
							<li>Implement proper token storage and expiration handling</li>
							<li>Validate all input parameters and tokens</li>
						</ul>
					</div>
					
					<div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.375rem', padding: '1rem' }}>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>Error Handling</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li>Implement proper error handling for network requests</li>
							<li>Handle token expiration and refresh scenarios</li>
							<li>Provide meaningful error messages to users</li>
							<li>Log errors appropriately for debugging</li>
						</ul>
					</div>
					
					<div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.375rem', padding: '1rem' }}>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Performance</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e40af' }}>
							<li>Cache access tokens when appropriate</li>
							<li>Use connection pooling for HTTP requests</li>
							<li>Implement token refresh before expiration</li>
							<li>Minimize unnecessary API calls</li>
						</ul>
					</div>
				</div>
			</Section>
		</Container>
	);
};

export default CodeGeneratorsPage;
