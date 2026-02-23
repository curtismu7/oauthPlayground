/**
 * @file CodeGeneratorsPage.tsx
 * @description Interactive code generators for OAuth 2.0 implementations
 * @version 9.27.0
 */

import React, { useState } from 'react';
import { FiCode, FiCopy, FiDownload, FiTerminal, FiDatabase, FiKey, FiShield, FiCheckCircle, FiAlertTriangle, FiGitBranch } from 'react-icons/fi';
import styled from 'styled-components';
import { PageHeaderV8, PageHeaderTextColors } from '@/v8/components/shared/PageHeaderV8';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const _MODULE_TAG = '[💻 CODE-GENERATORS]';

interface CodeGenerator {
	id: string;
	title: string;
	description: string;
	category: 'authentication' | 'authorization' | 'tokens' | 'api';
	language: 'javascript' | 'python' | 'curl' | 'java' | 'csharp';
	variables: CodeVariable[];
	examples: CodeExample[];
}

interface CodeVariable {
	name: string;
	type: 'string' | 'number' | 'boolean';
	description: string;
	defaultValue: string;
	required: boolean;
}

interface CodeExample {
	title: string;
	description: string;
	template: string;
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
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 1.5rem;
	margin: 1.5rem 0;
`;

const GeneratorCard = styled.div`
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

const GeneratorTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.5rem 0;
`;

const GeneratorDescription = styled.p`
	color: #6b7280;
	font-size: 0.875rem;
	margin: 0 0 1rem 0;
`;

const CategoryBadge = styled.span<{ $category: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	
	${({ $category }) => {
		switch ($category) {
			case 'authentication':
				return 'background: #3b82f6; color: white;';
			case 'authorization':
				return 'background: #10b981; color: white;';
			case 'tokens':
				return 'background: #f59e0b; color: white;';
			case 'api':
				return 'background: #8b5cf6; color: white;';
			default:
				return 'background: #6b7280; color: white;';
		}
	}}
`;

const LanguageBadge = styled.span<{ $language: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	
	${({ $language }) => {
		switch ($language) {
			case 'javascript':
				return 'background: #f7df1e; color: #323230;';
			case 'python':
				return 'background: #3776ab; color: white;';
			case 'curl':
				return 'background: #07407a; color: white;';
			case 'java':
				return 'background: #f89820; color: white;';
			case 'csharp':
				return 'background: #239120; color: white;';
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

const LanguageBadgeDisplay = styled.span<{ $language: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	
	${({ $language }) => {
		switch ($language) {
			case 'javascript':
				return 'background: #f7df1e; color: #323230;';
			case 'python':
				return 'background: #3776ab; color: white;';
			case 'curl':
				return 'background: #07407a; color: white;';
			case 'java':
				return 'background: #f89820; color: white;';
			case 'csharp':
				return 'background: #239120; color: white;';
			default:
				return 'background: #6b7280; color: white;';
		}
	}}
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
`;

const Label = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.25rem;
`;

const Input = styled.input`
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
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

const TabContainer = styled.div`
	background: #f8fafc;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
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
		title: 'OAuth 2.0 Authorization Code Flow',
		description: 'Complete JavaScript implementation of OAuth 2.0 authorization code flow',
		category: 'authentication',
		language: 'javascript',
		variables: [
			{
				name: 'clientId',
				type: 'string',
				description: 'Your OAuth client ID',
				defaultValue: 'your-client-id',
				required: true
			},
			{
				name: 'clientSecret',
				type: 'string',
				description: 'Your OAuth client secret',
				defaultValue: 'your-client-secret',
				required: true
			},
			{
				name: 'redirectUri',
				type: 'string',
				description: 'Callback URL after authorization',
				defaultValue: 'https://app.example.com/callback',
				required: true
			},
			{
				name: 'authUrl',
				type: 'string',
				description: 'OAuth authorization endpoint',
				defaultValue: 'https://auth.pingone.com/oauth/authorize',
				required: true
			},
			{
				name: 'tokenUrl',
				type: 'string',
				description: 'OAuth token endpoint',
				defaultValue: 'https://auth.pingone.com/oauth/token',
				required: true
			}
		],
		examples: [
			{
				title: 'Authorization Request',
				description: 'Redirect user to authorization endpoint',
				template: `const authUrl = \`\${authUrl}?response_type=code&client_id=\${clientId}&redirect_uri=\${redirectUri}&scope=openid profile&state=\${generateState()}\`;
window.location.href = authUrl;`
			},
			{
				title: 'Token Exchange',
				description: 'Exchange authorization code for access token',
				template: `const tokenResponse = await fetch(tokenUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': \`Basic \${btoa(\`\${clientId}:\${clientSecret}\`)}\`
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: redirectUri
  })
});

const tokens = await tokenResponse.json();`
			}
		]
	},
	{
		id: 'oauth-client-credentials-python',
		title: 'OAuth 2.0 Client Credentials Flow',
		description: 'Python implementation for service-to-service authentication',
		category: 'authentication',
		language: 'python',
		variables: [
			{
				name: 'clientId',
				type: 'string',
				description: 'Your OAuth client ID',
				defaultValue: 'your-client-id',
				required: true
			},
			{
				name: 'clientSecret',
				type: 'string',
				description: 'Your OAuth client secret',
				defaultValue: 'your-client-secret',
				required: true
			},
			{
				name: 'tokenUrl',
				type: 'string',
				description: 'OAuth token endpoint',
				defaultValue: 'https://auth.pingone.com/oauth/token',
				required: true
			},
			{
				name: 'scopes',
				type: 'string',
				description: 'Requested scopes',
				defaultValue: 'openid profile',
				required: false
			}
		],
		examples: [
			{
				title: 'Token Request',
				description: 'Request access token using client credentials',
				template: `import requests
import base64

# Encode client credentials
credentials = base64.b64encode(f"{clientId}:{clientSecret}".encode()).decode()

# Make token request
response = requests.post(
    tokenUrl,
    headers={
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/x-www-form-urlencoded"
    },
    data={
        "grant_type": "client_credentials",
        "scope": scopes
    }
)

tokens = response.json()`
			}
		]
	}
];

export const CodeGeneratorsPage: React.FC = () => {
	const [selectedGenerator, setSelectedGenerator] = useState<CodeGenerator | null>(null);
	const [variables, setVariables] = useState<Record<string, string>>({});
	const [generatedCode, setGeneratedCode] = useState<string>('');
	const [activeTab, setActiveTab] = useState<'variables' | 'examples'>('variables');
	const [copiedText, setCopiedText] = useState('');

	const handleGeneratorSelect = (generator: CodeGenerator) => {
		setSelectedGenerator(generator);
		setActiveTab('variables');
		
		// Initialize variables with default values
		const defaultVars: Record<string, string> = {};
		generator.variables.forEach(variable => {
			defaultVars[variable.name] = variable.defaultValue;
		});
		setVariables(defaultVars);
		setGeneratedCode('');
	};

	const handleVariableChange = (name: string, value: string) => {
		setVariables(prev => ({ ...prev, [name]: value }));
	};

	const generateCode = () => {
		if (!selectedGenerator) return;
		
		let code = selectedGenerator.examples[0]?.template || '';
		
		// Replace variables in template
		selectedGenerator.variables.forEach(variable => {
			const regex = new RegExp(`\\$\\{${variable.name}\\}`, 'g');
			code = code.replace(regex, variables[variable.name] || '');
		});
		
		setGeneratedCode(code);
		setActiveTab('examples');
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

	const getCategoryColor = (category: string) => {
		switch (category) {
			case 'authentication': return '#3b82f6';
			case 'authorization': return '#10b981';
			case 'tokens': return '#f59e0b';
			case 'api': return '#8b5cf6';
			default: return '#6b7280';
		}
	};

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case 'authentication': return <FiShield />;
			case 'authorization': return <FiKey />;
			case 'tokens': return <FiDatabase />;
			case 'api': return <FiTerminal />;
			default: return <FiCode />;
		}
	};

	return (
		<Container>
			<PageHeaderV8
				title="Code Generators"
				subtitle="Interactive code generators for OAuth 2.0 implementations"
				gradient="#8b5cf6"
				textColor={PageHeaderTextColors.white}
			/>

			<Section>
				<SectionTitle>
					<FiCode />
					Available Code Generators ({mockCodeGenerators.length})
				</SectionTitle>
				
				<Grid>
					{mockCodeGenerators.map((generator) => (
						<GeneratorCard key={generator.id}>
							<GeneratorTitle>{generator.title}</GeneratorTitle>
							<GeneratorDescription>{generator.description}</GeneratorDescription>
							
							<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
								<CategoryBadge $category={generator.category}>
									{generator.category}
								</CategoryBadge>
								<LanguageBadge $language={generator.language}>
									{generator.language}
								</LanguageBadge>
							</div>
							
							<BootstrapButton
								variant="primary"
								onClick={() => handleGeneratorSelect(generator)}
								style={{ width: '100%' }}
							>
								<FiCode />
								Generate Code
							</BootstrapButton>
						</GeneratorCard>
					))}
				</Grid>
			</Section>

			{selectedGenerator && (
				<Section>
					<SectionTitle>
						<FiTerminal />
						{selectedGenerator.title}
					</SectionTitle>
					
					<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
						<CategoryBadge $category={selectedGenerator.category}>
							{selectedGenerator.category}
						</CategoryBadge>
						<LanguageBadge $language={selectedGenerator.language}>
							{selectedGenerator.language}
						</LanguageBadge>
					</div>
					
					<TabContainer>
						<TabButtons>
							<TabButton
								$active={activeTab === 'variables'}
								onClick={() => setActiveTab('variables')}
							>
								Variables ({selectedGenerator.variables.length})
							</TabButton>
							<TabButton
								$active={activeTab === 'examples'}
								onClick={() => setActiveTab('examples')}
							>
								Examples ({selectedGenerator.examples.length})
							</TabButton>
						</TabButtons>
						
						<TabContent>
							{activeTab === 'variables' && (
								<VariableForm>
									{selectedGenerator.variables.map((variable, index) => (
										<FormGroup key={index}>
											<Label>
												{variable.name}
												{variable.required && <span style={{ color: '#ef4444' }}> *</span>}
											</Label>
											<Input
												type={variable.type === 'number' ? 'number' : variable.type === 'boolean' ? 'checkbox' : 'text'}
												value={variables[variable.name] || ''}
												onChange={(e) => handleVariableChange(variable.name, e.target.value)}
												placeholder={variable.description}
											/>
											<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
												{variable.description}
											</div>
										</FormGroup>
									))}
									
									<ActionButtons>
										<BootstrapButton
											variant="primary"
											onClick={generateCode}
										>
											<FiTerminal />
											Generate Code
										</BootstrapButton>
										
										<BootstrapButton
											variant="secondary"
											onClick={() => setSelectedGenerator(null)}
										>
											Close
										</BootstrapButton>
									</ActionButtons>
								</VariableForm>
							)}
							
							{activeTab === 'examples' && (
								<>
									{generatedCode && (
										<CodeDisplay>
											<CodeHeader>
												<div>
													<LanguageBadgeDisplay $language={selectedGenerator.language}>
														{selectedGenerator.language}
													</LanguageBadgeDisplay>
												</div>
												<BootstrapButton
													variant="secondary"
													onClick={() => copyToClipboard(generatedCode, 'Generated Code')}
													style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
												>
													{copiedText === 'Generated Code' ? <FiCheckCircle /> : <FiCopy />}
													{copiedText === 'Generated Code' ? 'Copied!' : 'Copy'}
												</BootstrapButton>
											</CodeHeader>
											
											<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
												{generatedCode}
											</pre>
										</CodeDisplay>
									)}
									
									{!generatedCode && (
										<div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
											<FiTerminal size={24} style={{ marginBottom: '1rem' }} />
											<div>Configure variables and click "Generate Code" to see the output</div>
										</div>
									)}
									
									<ActionButtons>
										<BootstrapButton
											variant="secondary"
											onClick={() => setActiveTab('variables')}
										>
											<FiGitBranch />
											Back to Variables
										</BootstrapButton>
										
										<BootstrapButton
											variant="secondary"
											onClick={() => setSelectedGenerator(null)}
										>
											Close
										</BootstrapButton>
									</ActionButtons>
								</>
							)}
						</TabContent>
					</TabContainer>
				</Section>
			)}
		</Container>
	);
};

export default CodeGeneratorsPage;
