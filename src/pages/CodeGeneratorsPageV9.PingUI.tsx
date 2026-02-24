/**
 * @file CodeGeneratorsPageV9.PingUI.tsx
 * @description Simplified PingOne UI V9 OAuth Code Generators Hub
 * @version 9.25.1
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BootstrapIcon from '@/components/BootstrapIcon';
import { getBootstrapIconName } from '@/components/iconMapping';
import { PingUIWrapper } from '@/components/PingUIWrapper';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

interface CodeGenerator {
	id: string;
	title: string;
	description: string;
	category: 'authentication' | 'authorization' | 'tokens' | 'api';
	language: 'javascript' | 'python' | 'curl' | 'java' | 'csharp' | 'typescript';
	flow: 'authorization-code' | 'client-credentials' | 'device-code' | 'pkce';
}

interface GeneratedContent {
	type: 'code' | 'postman' | 'collection';
	title: string;
	content: string;
	language: string;
}

// Available code generators using existing services
const availableGenerators: CodeGenerator[] = [
	{
		id: 'auth-code-js',
		title: 'Authorization Code Flow',
		description: 'OAuth 2.0 Authorization Code implementation with PKCE',
		category: 'authentication',
		language: 'javascript',
		flow: 'authorization-code'
	},
	{
		id: 'client-credentials-python',
		title: 'Client Credentials Flow',
		description: 'Service-to-service authentication using client credentials',
		category: 'authentication',
		language: 'python',
		flow: 'client-credentials'
	},
	{
		id: 'device-code-curl',
		title: 'Device Code Flow',
		description: 'Device authorization for limited input devices',
		category: 'authentication',
		language: 'curl',
		flow: 'device-code'
	},
	{
		id: 'pkce-typescript',
		title: 'PKCE Authorization Code',
		description: 'Authorization Code with Proof Key for Code Exchange',
		category: 'authentication',
		language: 'typescript',
		flow: 'pkce'
	}
];

export const CodeGeneratorsPageV9: React.FC = () => {
	const navigate = useNavigate();
	const [selectedGenerator, setSelectedGenerator] = useState<CodeGenerator | null>(null);
	const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [copiedText, setCopiedText] = useState('');

	// Configuration for code generation
	const [config, setConfig] = useState({
		baseUrl: 'https://auth.pingone.com',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/callback',
		environmentId: '',
		scopes: ['openid', 'profile', 'email']
	});

	const handleGeneratorSelect = async (generator: CodeGenerator) => {
		setSelectedGenerator(generator);
		setGeneratedContent(null);
		await generateContent(generator);
	};

	const generateContent = async (generator: CodeGenerator) => {
		setIsLoading(true);
		try {
			// Generate code templates based on flow type
			const templates: Record<string, Record<string, string>> = {
				'authorization-code': {
					javascript: `// OAuth 2.0 Authorization Code Flow with PKCE
// Generated for ${generator.title}

const config = {
  baseUrl: '${config.baseUrl}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  environmentId: '${config.environmentId}'
};

// Generate PKCE verifier and challenge
async function generatePKCE() {
  const verifier = generateRandomString(128);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=/g, '');
  
  return { verifier, challenge };
}

// Step 1: Build authorization URL
const authUrl = new URL(\`\${config.baseUrl}/oauth2/authorize\`);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', config.clientId);
authUrl.searchParams.set('redirect_uri', config.redirectUri);
authUrl.searchParams.set('scope', config.scopes.join(' '));
authUrl.searchParams.set('state', generateRandomString(32));

console.log('Authorization URL:', authUrl.toString());
// Redirect user to authUrl`,
					typescript: `// OAuth 2.0 Authorization Code Flow with PKCE (TypeScript)
// Generated for ${generator.title}

interface Config {
  baseUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  environmentId: string;
}

const config: Config = {
  baseUrl: '${config.baseUrl}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  environmentId: '${config.environmentId}'
};

interface PKCEPair {
  verifier: string;
  challenge: string;
}

// Generate PKCE verifier and challenge
async function generatePKCE(): Promise<PKCEPair> {
  const verifier = generateRandomString(128);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=/g, '');
  
  return { verifier, challenge };
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((str, byte) => str + possible[byte % possible.length], '');
}

// Build authorization URL
const authUrl = new URL(\`\${config.baseUrl}/oauth2/authorize\`);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', config.clientId);
authUrl.searchParams.set('redirect_uri', config.redirectUri);
authUrl.searchParams.set('scope', config.scopes.join(' '));
authUrl.searchParams.set('state', generateRandomString(32));

console.log('Authorization URL:', authUrl.toString());`
				},
				'client-credentials': {
					python: `# OAuth 2.0 Client Credentials Flow
# Generated for ${generator.title}

import requests
import base64
from urllib.parse import urlencode

class ClientCredentialsFlow:
    def __init__(self, base_url: str, client_id: str, client_secret: str, environment_id: str):
        self.base_url = base_url
        self.client_id = client_id
        self.client_secret = client_secret
        self.environment_id = environment_id
        self.token_url = f"{base_url}/oauth2/token"
    
    def get_access_token(self, scopes: list = None) -> dict:
        """Get access token using client credentials flow"""
        if scopes is None:
            scopes = ['openid', 'profile', 'email']
        
        # Prepare authentication
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = {
            'grant_type': 'client_credentials',
            'scope': ' '.join(scopes)
        }
        
        try:
            response = requests.post(self.token_url, headers=headers, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            print("Access token obtained successfully!")
            return token_data
            
        except requests.exceptions.RequestException as e:
            print(f"Error obtaining access token: {e}")
            raise

# Usage example
if __name__ == "__main__":
    flow = ClientCredentialsFlow(
        base_url="${config.baseUrl}",
        client_id="${config.clientId}",
        client_secret="${config.clientSecret}",
        environment_id="${config.environmentId}"
    )
    
    try:
        token = flow.get_access_token(${JSON.stringify(config.scopes)})
        print("Token:", token)
    except Exception as e:
        print("Failed to get token:", e)`
				},
				'device-code': {
					curl: `# OAuth 2.0 Device Authorization Flow
# Generated for ${generator.title}

#!/bin/bash

# Configuration
BASE_URL="${config.baseUrl}"
CLIENT_ID="${config.clientId}"
ENVIRONMENT_ID="${config.environmentId}"

# Step 1: Initiate Device Authorization
echo "Initiating device authorization..."
DEVICE_AUTH_RESPONSE=$(curl -s -X POST \\
  "\${BASE_URL}/oauth2/device_authorization" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "client_id=\${CLIENT_ID}" \\
  -d "scope=${config.scopes.join(' ')}")

# Extract device code and user code
DEVICE_CODE=$(echo "$DEVICE_AUTH_RESPONSE" | jq -r '.device_code')
USER_CODE=$(echo "$DEVICE_AUTH_RESPONSE" | jq -r '.user_code')
VERIFICATION_URI=$(echo "$DEVICE_AUTH_RESPONSE" | jq -r '.verification_uri_complete')

echo "Device Code: $DEVICE_CODE"
echo "User Code: $USER_CODE"
echo "Verification URI: $VERIFICATION_URI"

# Step 2: Instruct user to authenticate
echo ""
echo "Please visit the following URL and enter the user code:"
echo "$VERIFICATION_URI"
echo "User Code: $USER_CODE"
echo ""
echo "Press Enter after you have authenticated..."
read -r

# Step 3: Poll for token
echo "Polling for access token..."
while true; do
    TOKEN_RESPONSE=$(curl -s -X POST \\
      "\${BASE_URL}/oauth2/token" \\
      -H "Content-Type: application/x-www-form-urlencoded" \\
      -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \\
      -d "device_code=\${DEVICE_CODE}" \\
      -d "client_id=\${CLIENT_ID}")
    
    ERROR=$(echo "$TOKEN_RESPONSE" | jq -r '.error // empty')
    
    if [ "$ERROR" = "authorization_pending" ]; then
        echo "Authorization pending... waiting 5 seconds"
        sleep 5
    elif [ "$ERROR" = "slow_down" ]; then
        echo "Slow down requested... waiting 10 seconds"
        sleep 10
    elif [ -n "$ERROR" ]; then
        echo "Error: $ERROR"
        echo "$TOKEN_RESPONSE"
        exit 1
    else
        ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')
        echo "Access token obtained successfully!"
        echo "Access Token: $ACCESS_TOKEN"
        break
    fi
done`
				},
				'pkce': {
					typescript: `// OAuth 2.0 PKCE Authorization Code Flow
// Generated for ${generator.title}

interface Config {
  baseUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  environmentId: string;
}

const config: Config = {
  baseUrl: '${config.baseUrl}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  environmentId: '${config.environmentId}'
};

interface PKCEPair {
  verifier: string;
  challenge: string;
}

// Generate cryptographically random string
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((str, byte) => str + possible[byte % possible.length], '');
}

// Generate PKCE verifier and challenge
async function generatePKCE(): Promise<PKCEPair> {
  const verifier = generateRandomString(128);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=/g, '');
  
  return { verifier, challenge };
}

// Step 1: Initiate authorization
async function initiateAuthorization(): Promise<void> {
  const { verifier, challenge } = await generatePKCE();
  
  // Store verifier securely (e.g., sessionStorage)
  sessionStorage.setItem('pkce_verifier', verifier);
  
  // Build authorization URL
  const authUrl = new URL(\`\${config.baseUrl}/oauth2/authorize\`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('scope', config.scopes.join(' '));
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', generateRandomString(32));
  
  console.log('Authorization URL:', authUrl.toString());
  window.location.href = authUrl.toString();
}

// Step 2: Exchange authorization code for token
async function exchangeCodeForToken(authorizationCode: string): Promise<any> {
  const verifier = sessionStorage.getItem('pkce_verifier');
  if (!verifier) {
    throw new Error('PKCE verifier not found in session storage');
  }
  
  const tokenUrl = \`\${config.baseUrl}/oauth2/token\`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: verifier
  });
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString()
  });
  
  if (!response.ok) {
    throw new Error(\`Token exchange failed: \${response.statusText}\`);
  }
  
  const tokenData = await response.json();
  sessionStorage.removeItem('pkce_verifier');
  
  console.log('Access token obtained:', tokenData);
  return tokenData;
}

// Usage
console.log('PKCE Authorization Code Flow initialized');
console.log('Call initiateAuthorization() to start the flow');`
				}
			};

			const template = templates[generator.flow]?.[generator.language];
			
			if (template) {
				const content: GeneratedContent = {
					type: 'code',
					title: `${generator.title} - ${generator.language}`,
					content: template,
					language: generator.language
				};
				setGeneratedContent(content);
			} else {
				// Fallback template
				const fallbackTemplate = `// ${generator.title}
// ${generator.description}
// Language: ${generator.language}
// Flow: ${generator.flow}

const config = {
  baseUrl: '${config.baseUrl}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  environmentId: '${config.environmentId}'
};

// TODO: Implement ${generator.flow} logic here
console.log('Configuration:', config);`;

				const content: GeneratedContent = {
					type: 'code',
					title: `${generator.title} - ${generator.language}`,
					content: fallbackTemplate,
					language: generator.language
				};
				setGeneratedContent(content);
			}
		} catch (error) {
			console.error('Error generating content:', error);
			toastV8.error('Failed to generate content');
		} finally {
			setIsLoading(false);
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

	const downloadContent = (content: GeneratedContent) => {
		const blob = new Blob([content.content], { 
			type: content.type === 'postman' ? 'application/json' : 'text/plain' 
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${content.title.replace(/\s+/g, '_').toLowerCase()}.${content.language}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toastV8.success('Download started');
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case 'authentication': return 'primary';
			case 'authorization': return 'success';
			case 'tokens': return 'warning';
			case 'api': return 'info';
			default: return 'secondary';
		}
	};

	const getLanguageColor = (language: string) => {
		switch (language) {
			case 'javascript': return 'warning';
			case 'typescript': return 'primary';
			case 'python': return 'info';
			case 'curl': return 'dark';
			case 'java': return 'warning';
			case 'csharp': return 'primary';
			default: return 'secondary';
		}
	};

	return (
		<PingUIWrapper>
			<div className="container-fluid py-4">
				{/* Header */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex align-items-center justify-content-between">
							<div>
								<h1 className="h2 mb-2">
									<BootstrapIcon 
										icon={getBootstrapIconName("code")} 
										size={24} 
										className="me-2" 
									/>
									Code Generators V9
								</h1>
								<p className="text-muted mb-0">
									Simplified OAuth 2.0 code generation using PingOne services
								</p>
							</div>
							<button
								className="btn btn-outline-secondary"
								type="button"
								onClick={() => navigate('/')}
							>
								<BootstrapIcon 
									icon={getBootstrapIconName("arrow-left")} 
									size={16} 
									className="me-1" 
								/>
								Back
							</button>
						</div>
					</div>
				</div>

				{/* Configuration */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="card">
							<div className="card-header">
								<h5 className="card-title mb-0">
									<BootstrapIcon 
										icon={getBootstrapIconName("gear")} 
										size={16} 
										className="me-2" 
									/>
									Configuration
								</h5>
							</div>
							<div className="card-body">
								<div className="row g-3">
									<div className="col-md-6">
										<label htmlFor="baseUrl" className="form-label">Base URL</label>
										<input
											id="baseUrl"
											type="text"
											className="form-control"
											value={config.baseUrl}
											onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
										/>
									</div>
									<div className="col-md-6">
										<label htmlFor="clientId" className="form-label">Client ID</label>
										<input
											id="clientId"
											type="text"
											className="form-control"
											value={config.clientId}
											onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
											placeholder="your-client-id"
										/>
									</div>
									<div className="col-md-6">
										<label htmlFor="clientSecret" className="form-label">Client Secret</label>
										<input
											id="clientSecret"
											type="password"
											className="form-control"
											value={config.clientSecret}
											onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
											placeholder="your-client-secret"
										/>
									</div>
									<div className="col-md-6">
										<label htmlFor="redirectUri" className="form-label">Redirect URI</label>
										<input
											id="redirectUri"
											type="text"
											className="form-control"
											value={config.redirectUri}
											onChange={(e) => setConfig(prev => ({ ...prev, redirectUri: e.target.value }))}
										/>
									</div>
									<div className="col-md-6">
										<label htmlFor="environmentId" className="form-label">Environment ID</label>
										<input
											id="environmentId"
											type="text"
											className="form-control"
											value={config.environmentId}
											onChange={(e) => setConfig(prev => ({ ...prev, environmentId: e.target.value }))}
											placeholder="your-environment-id"
										/>
									</div>
									<div className="col-md-6">
										<label htmlFor="scopes" className="form-label">Scopes</label>
										<input
											id="scopes"
											type="text"
											className="form-control"
											value={config.scopes.join(' ')}
											onChange={(e) => setConfig(prev => ({ 
												...prev, 
												scopes: e.target.value.split(' ').filter(Boolean) 
											}))}
											placeholder="openid profile email"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Available Generators */}
				<div className="row mb-4">
					<div className="col-12">
						<h3 className="h4 mb-3">
							<BootstrapIcon 
								icon={getBootstrapIconName("list")} 
								size={20} 
								className="me-2" 
							/>
							Available Generators ({availableGenerators.length})
						</h3>
						<div className="row g-3">
							{availableGenerators.map((generator) => (
								<div key={generator.id} className="col-md-6 col-lg-4">
									<div className="card h-100">
										<div className="card-body">
											<h5 className="card-title">{generator.title}</h5>
											<p className="card-text text-muted small">{generator.description}</p>
											<div className="d-flex gap-2 mb-3">
												<span className={`badge bg-${getCategoryColor(generator.category)}`}>
													{generator.category}
												</span>
												<span className={`badge bg-${getLanguageColor(generator.language)}`}>
													{generator.language}
												</span>
											</div>
											<button
												className="btn btn-primary w-100"
												type="button"
												onClick={() => handleGeneratorSelect(generator)}
												disabled={isLoading}
											>
												<BootstrapIcon 
													icon={getBootstrapIconName("code")} 
													size={16} 
													className="me-1" 
												/>
												{isLoading ? 'Generating...' : 'Generate'}
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Generated Content */}
				{selectedGenerator && generatedContent && (
					<div className="row">
						<div className="col-12">
							<div className="card">
								<div className="card-header d-flex justify-content-between align-items-center">
									<h5 className="card-title mb-0">
										<BootstrapIcon 
											icon={getBootstrapIconName("file-earmark-code")} 
											size={16} 
											className="me-2" 
										/>
										{generatedContent.title}
									</h5>
									<div className="d-flex gap-2">
										<button
											className="btn btn-outline-secondary btn-sm"
											type="button"
											onClick={() => copyToClipboard(generatedContent.content, 'Generated Content')}
										>
											<BootstrapIcon 
												icon={getBootstrapIconName(copiedText === 'Generated Content' ? "check-circle" : "clipboard")} 
												size={14} 
												className="me-1" 
											/>
											{copiedText === 'Generated Content' ? 'Copied!' : 'Copy'}
										</button>
										<button
											className="btn btn-outline-secondary btn-sm"
											type="button"
											onClick={() => downloadContent(generatedContent)}
										>
											<BootstrapIcon 
												icon={getBootstrapIconName("download")} 
												size={14} 
												className="me-1" 
											/>
											Download
										</button>
										<button
											className="btn btn-outline-secondary btn-sm"
											type="button"
											onClick={() => setSelectedGenerator(null)}
										>
											<BootstrapIcon 
												icon={getBootstrapIconName("x")} 
												size={14} 
												className="me-1" 
											/>
											Close
										</button>
									</div>
								</div>
								<div className="card-body">
									<div className="bg-dark text-light p-3 rounded">
										<pre className="mb-0" style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
											{generatedContent.content}
										</pre>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</PingUIWrapper>
	);
};

export default CodeGeneratorsPageV9;
