// src/pages/PARvsRAR.tsx - PAR vs RAR Comparison and Examples
import React, { useState } from 'react';
import {
	FiCheck,
	FiCode,
	FiCopy,
	FiInfo,
	FiShield,
	FiArrowRight,
	FiBook,
	FiSettings,
	FiSend,
} from 'react-icons/fi';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../components/Card';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { copyToClipboard } from '../utils/clipboard';
import { showFlowSuccess } from '../components/CentralizedSuccessMessage';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  background: white;
  min-height: 100vh;
  color: #1f2937;
  line-height: 1.6;
  padding-top: 100px;
  padding-bottom: 4rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: #6b7280;
    font-size: 1.1rem;
    line-height: 1.6;
  }
`;

const OverviewCard = styled(Card)`
  margin-bottom: 2rem;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const ComparisonCard = styled(Card)<{ $type: 'par' | 'rar' }>`
  border-left: 4px solid ${({ $type, theme }) => 
    $type === 'par' ? '#16a34a' : '#3b82f6'};
`;

const CodeBlock = styled.pre`
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
  position: relative;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const CodeBlockHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const CopyButton = styled.button`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const InfoBox = styled.div`
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const InfoIcon = styled.div`
  color: #3b82f6;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const InfoContent = styled.div`
  flex: 1;

  h4 {
    font-weight: 600;
    color: #1e40af;
    margin-bottom: 0.5rem;
  }

  p {
    color: #1e3a8a;
    margin: 0;
  }
`;

const WarningBox = styled(InfoBox)`
  background-color: #fef3c7;
  border-color: #fcd34d;

  ${InfoIcon} {
    color: #f59e0b;
  }

  h4 {
    color: #92400e;
  }

  p {
    color: #78350f;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  background: white;

  th, td {
    padding: 0.75rem;
    text-align: left;
    border: 1px solid #e5e7eb;
  }

  th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #111827;
  }

  td {
    color: #374151;
  }

  tr:nth-child(even) {
    background-color: #f9fafb;
  }
`;

const ExampleSection = styled.div`
  margin: 2rem 0;
`;

const ExampleTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FlowStep = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-left: 4px solid #3b82f6;
  border-radius: 0.25rem;
`;

const FlowStepNumber = styled.span`
  display: inline-block;
  background: #3b82f6;
  color: white;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  text-align: center;
  line-height: 1.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  margin-right: 0.5rem;
`;

const FlowStepTitle = styled.h4`
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const FlowStepDescription = styled.p`
  color: #6b7280;
  margin: 0;
`;

const PARvsRAR: React.FC = () => {
	const handleCopyCode = (code: string, description: string) => {
		copyToClipboard(code);
		showFlowSuccess(`Copied ${description} to clipboard`);
	};

	return (
		<Container>
			<Header>
				<h1>
					<FiShield size={32} />
					RAR vs PAR and DPoP Guide
				</h1>
				<p>
					Understanding Pushed Authorization Requests (PAR), Rich Authorization Requests (RAR), and Demonstration of Proof-of-Possession (DPoP) with comprehensive examples and use cases.
				</p>
			</Header>

			<OverviewCard>
				<CardHeader>
					<h2>Overview</h2>
				</CardHeader>
				<CardBody>
					<p>
						<strong>PAR (Pushed Authorization Request)</strong> and <strong>RAR (Rich Authorization Requests)</strong> are two powerful OAuth 2.0 extensions that address different security and authorization needs. While they can be used together, they solve distinct problems.
					</p>
					<InfoBox>
						<InfoIcon>
							<FiInfo />
						</InfoIcon>
						<InfoContent>
							<h4>Key Insight</h4>
							<p>
								<strong>PAR</strong> is about <em>how</em> you send authorization requests (securely via POST). 
								<strong>RAR</strong> is about <em>what</em> you request (fine-grained permissions with structured data).
								They complement each other and can be used together for maximum security and precision.
							</p>
						</InfoContent>
					</InfoBox>
				</CardBody>
			</OverviewCard>

			<CollapsibleHeader
				title="What is PAR (Pushed Authorization Request)?"
				theme="green"
				icon={<FiSettings />}
				defaultExpanded={true}
			>
				<Card>
					<CardBody>
						<p>
							<strong>PAR (RFC 9126)</strong> is an OAuth 2.0 extension that allows clients to push authorization request parameters to the authorization server via an authenticated HTTP POST request, rather than exposing them in the browser URL.
						</p>
						<h3>Benefits of PAR:</h3>
						<ul>
							<li>🔒 <strong>Enhanced Security:</strong> Sensitive parameters never appear in browser URLs, logs, or referrer headers</li>
							<li>🛡️ <strong>Parameter Tampering Protection:</strong> Request parameters are validated server-side before user interaction</li>
							<li>✅ <strong>Early Validation:</strong> Errors are caught before redirecting users</li>
							<li>📏 <strong>URL Length:</strong> Avoids URL length limitations with complex requests</li>
							<li>🔍 <strong>Audit Trail:</strong> All requests are logged server-side with authentication</li>
						</ul>

						<ExampleSection>
							<ExampleTitle>
								<FiCode />
								PAR Flow Example
							</ExampleTitle>
							
							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>1</FlowStepNumber>
									Push Authorization Request
								</FlowStepTitle>
								<FlowStepDescription>
									Client sends authorization parameters to the PAR endpoint via authenticated POST request.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>POST to /as/par endpoint</span>
									<CopyButton onClick={() => handleCopyCode(`POST https://auth.pingone.com/{environmentId}/as/par
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${'base64(clientId:clientSecret)'}

response_type=code&
client_id=your_client_id&
redirect_uri=https://app.example.com/callback&
scope=openid profile email&
state=random_state_string&
code_challenge=code_challenge_value&
code_challenge_method=S256&
nonce=random_nonce_string`, 'PAR request')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`POST https://auth.pingone.com/{environmentId}/as/par
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${'base64(clientId:clientSecret)'}

response_type=code&
client_id=your_client_id&
redirect_uri=https://app.example.com/callback&
scope=openid profile email&
state=random_state_string&
code_challenge=code_challenge_value&
code_challenge_method=S256&
nonce=random_nonce_string`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>2</FlowStepNumber>
									Receive Request URI
								</FlowStepTitle>
								<FlowStepDescription>
									Authorization server validates parameters and returns a short-lived request URI.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>PAR Response</span>
									<CopyButton onClick={() => handleCopyCode(`{
  "request_uri": "urn:ietf:params:oauth:request_uri:abc123def456",
  "expires_in": 90
}`, 'PAR response')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`{
  "request_uri": "urn:ietf:params:oauth:request_uri:abc123def456",
  "expires_in": 90
}`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>3</FlowStepNumber>
									Redirect User with Request URI
								</FlowStepTitle>
								<FlowStepDescription>
									Client redirects user to authorization endpoint with only the request URI (much shorter and safer).
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>Authorization URL with Request URI</span>
									<CopyButton onClick={() => handleCopyCode(`https://auth.pingone.com/{environmentId}/as/authorize?request_uri=urn:ietf:params:oauth:request_uri:abc123def456&response_type=code`, 'Authorization URL')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`https://auth.pingone.com/{environmentId}/as/authorize?request_uri=urn:ietf:params:oauth:request_uri:abc123def456&response_type=code`}</CodeBlock>
							</FlowStep>
						</ExampleSection>

						<ExampleSection>
							<ExampleTitle>
								<FiCode />
								JavaScript PAR Implementation
							</ExampleTitle>
							<CodeBlockHeader>
								<span>Complete PAR Example - JavaScript</span>
								<CopyButton onClick={() => handleCopyCode(`const crypto = require('crypto');

async function pushAuthorizationRequest(config) {
  const parEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/par\`;
  
  // Generate PKCE parameters
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  const requestData = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: crypto.randomBytes(16).toString('hex'),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  try {
    const response = await fetch(parEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Basic \${Buffer.from(\`\${config.clientId}:\${config.clientSecret}\`).toString('base64')}\`
      },
      body: requestData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('PAR successful!');
      console.log('Request URI:', result.request_uri);
      console.log('Expires in:', result.expires_in, 'seconds');
      
      // Generate authorization URL
      const authUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize?request_uri=\${result.request_uri}&response_type=code\`;
      
      return {
        request_uri: result.request_uri,
        expires_in: result.expires_in,
        code_verifier: codeVerifier,
        auth_url: authUrl
      };
    } else {
      throw new Error(\`PAR failed: \${result.error} - \${result.error_description}\`);
    }
  } catch (error) {
    console.error('PAR error:', error);
    throw error;
  }
}

// Usage
const config = {
  baseUrl: 'https://auth.pingone.com',
  environmentId: 'your-env-id',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://app.example.com/callback',
  scopes: ['openid', 'profile', 'email']
};

pushAuthorizationRequest(config)
  .then(result => {
    console.log('Redirect user to:', result.auth_url);
    // Store code_verifier for token exchange
  })
  .catch(error => console.error('Error:', error));`, 'PAR JavaScript code')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
							</CodeBlockHeader>
							<CodeBlock>{`const crypto = require('crypto');

async function pushAuthorizationRequest(config) {
  const parEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/par\`;
  
  // Generate PKCE parameters
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  const requestData = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: crypto.randomBytes(16).toString('hex'),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  try {
    const response = await fetch(parEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Basic \${Buffer.from(\`\${config.clientId}:\${config.clientSecret}\`).toString('base64')}\`
      },
      body: requestData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('PAR successful!');
      console.log('Request URI:', result.request_uri);
      console.log('Expires in:', result.expires_in, 'seconds');
      
      // Generate authorization URL
      const authUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize?request_uri=\${result.request_uri}&response_type=code\`;
      
      return {
        request_uri: result.request_uri,
        expires_in: result.expires_in,
        code_verifier: codeVerifier,
        auth_url: authUrl
      };
    } else {
      throw new Error(\`PAR failed: \${result.error} - \${result.error_description}\`);
    }
  } catch (error) {
    console.error('PAR error:', error);
    throw error;
  }
}

// Usage
const config = {
  baseUrl: 'https://auth.pingone.com',
  environmentId: 'your-env-id',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://app.example.com/callback',
  scopes: ['openid', 'profile', 'email']
};

pushAuthorizationRequest(config)
  .then(result => {
    console.log('Redirect user to:', result.auth_url);
    // Store code_verifier for token exchange
  })
  .catch(error => console.error('Error:', error));`}</CodeBlock>
						</ExampleSection>
					</CardBody>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="What is RAR (Rich Authorization Requests)?"
				theme="blue"
				icon={<FiBook />}
				defaultExpanded={true}
			>
				<Card>
					<CardBody>
						<p>
							<strong>RAR (RFC 9396)</strong> is an OAuth 2.0 extension that enables clients to express fine-grained authorization details beyond simple scope strings using structured JSON data called <strong>authorization_details</strong>.
						</p>
						<h3>Benefits of RAR:</h3>
						<ul>
							<li>🎯 <strong>Fine-Grained Permissions:</strong> Specify exact resources, actions, and constraints</li>
							<li>📊 <strong>Structured Data:</strong> Use JSON objects instead of overloaded scope strings</li>
							<li>👥 <strong>Better User Consent:</strong> Clear, human-readable permission descriptions</li>
							<li>🔒 <strong>Contextual Security:</strong> Request specific permissions with explicit limits</li>
							<li>📝 <strong>Rich Auditing:</strong> Detailed authorization logs for compliance</li>
						</ul>

						<ExampleSection>
							<ExampleTitle>
								<FiCode />
								RAR Authorization Details Example
							</ExampleTitle>
							
							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>1</FlowStepNumber>
									Define Authorization Details
								</FlowStepTitle>
								<FlowStepDescription>
									Create structured authorization_details JSON describing fine-grained permissions.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>RAR authorization_details Structure</span>
									<CopyButton onClick={() => handleCopyCode(`{
  "authorization_details": [
    {
      "type": "payment_initiation",
      "locations": ["https://api.bank.com/payments"],
      "actions": ["initiate", "status"],
      "instructedAmount": {
        "currency": "USD",
        "amount": "250.00"
      },
      "creditorName": "ABC Supplies",
      "creditorAccount": {
        "iban": "US12345678901234567890"
      },
      "remittanceInformation": "Invoice #789"
    },
    {
      "type": "account_information",
      "locations": ["https://api.bank.com/accounts"],
      "actions": ["read"],
      "datatypes": ["account", "balance"]
    }
  ]
}`, 'RAR authorization details')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`{
  "authorization_details": [
    {
      "type": "payment_initiation",
      "locations": ["https://api.bank.com/payments"],
      "actions": ["initiate", "status"],
      "instructedAmount": {
        "currency": "USD",
        "amount": "250.00"
      },
      "creditorName": "ABC Supplies",
      "creditorAccount": {
        "iban": "US12345678901234567890"
      },
      "remittanceInformation": "Invoice #789"
    },
    {
      "type": "account_information",
      "locations": ["https://api.bank.com/accounts"],
      "actions": ["read"],
      "datatypes": ["account", "balance"]
    }
  ]
}`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>2</FlowStepNumber>
									Include in Authorization Request
								</FlowStepTitle>
								<FlowStepDescription>
									Add authorization_details parameter to the authorization request (can be used with or without PAR).
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>Authorization URL with RAR</span>
									<CopyButton onClick={() => handleCopyCode(`https://auth.pingone.com/{environmentId}/as/authorize?response_type=code&client_id=your_client_id&redirect_uri=https://app.example.com/callback&scope=openid&authorization_details={"authorization_details":[{"type":"payment_initiation","locations":["https://api.bank.com/payments"],"actions":["initiate","status"],"instructedAmount":{"currency":"USD","amount":"250.00"}}]}&state=random_state`, 'RAR authorization URL')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`https://auth.pingone.com/{environmentId}/as/authorize?
  response_type=code&
  client_id=your_client_id&
  redirect_uri=https://app.example.com/callback&
  scope=openid&
  authorization_details={"authorization_details":[{"type":"payment_initiation","locations":["https://api.bank.com/payments"],"actions":["initiate","status"],"instructedAmount":{"currency":"USD","amount":"250.00"}}]}&
  state=random_state`}</CodeBlock>
							</FlowStep>
						</ExampleSection>

						<ExampleSection>
							<ExampleTitle>
								<FiCode />
								JavaScript RAR Implementation
							</ExampleTitle>
							<CodeBlockHeader>
								<span>Complete RAR Example - JavaScript</span>
								<CopyButton onClick={() => handleCopyCode(`const crypto = require('crypto');

// Define fine-grained authorization details
const authorizationDetails = [
  {
    type: 'payment_initiation',
    locations: ['https://api.bank.com/payments'],
    actions: ['initiate', 'status'],
    instructedAmount: {
      currency: 'USD',
      amount: '250.00'
    },
    creditorName: 'ABC Supplies',
    creditorAccount: {
      iban: 'US12345678901234567890'
    },
    remittanceInformation: 'Invoice #789'
  },
  {
    type: 'account_information',
    locations: ['https://api.bank.com/accounts'],
    actions: ['read'],
    datatypes: ['account', 'balance']
  }
];

function generateRARAuthUrl(config, authorizationDetails) {
  const baseUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize\`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: crypto.randomBytes(16).toString('hex'),
    authorization_details: JSON.stringify({
      authorization_details: authorizationDetails
    })
  });
  
  return \`\${baseUrl}?\${params.toString()}\`;
}

// Usage
const config = {
  baseUrl: 'https://auth.pingone.com',
  environmentId: 'your-env-id',
  clientId: 'your-client-id',
  redirectUri: 'https://app.example.com/callback',
  scopes: ['openid']
};

const authUrl = generateRARAuthUrl(config, authorizationDetails);
console.log('RAR Authorization URL:', authUrl);`, 'RAR JavaScript code')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
							</CodeBlockHeader>
							<CodeBlock>{`const crypto = require('crypto');

// Define fine-grained authorization details
const authorizationDetails = [
  {
    type: 'payment_initiation',
    locations: ['https://api.bank.com/payments'],
    actions: ['initiate', 'status'],
    instructedAmount: {
      currency: 'USD',
      amount: '250.00'
    },
    creditorName: 'ABC Supplies',
    creditorAccount: {
      iban: 'US12345678901234567890'
    },
    remittanceInformation: 'Invoice #789'
  },
  {
    type: 'account_information',
    locations: ['https://api.bank.com/accounts'],
    actions: ['read'],
    datatypes: ['account', 'balance']
  }
];

function generateRARAuthUrl(config, authorizationDetails) {
  const baseUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize\`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: crypto.randomBytes(16).toString('hex'),
    authorization_details: JSON.stringify({
      authorization_details: authorizationDetails
    })
  });
  
  return \`\${baseUrl}?\${params.toString()}\`;
}

// Usage
const config = {
  baseUrl: 'https://auth.pingone.com',
  environmentId: 'your-env-id',
  clientId: 'your-client-id',
  redirectUri: 'https://app.example.com/callback',
  scopes: ['openid']
};

const authUrl = generateRARAuthUrl(config, authorizationDetails);
console.log('RAR Authorization URL:', authUrl);`}</CodeBlock>
						</ExampleSection>

						<ExampleSection>
							<ExampleTitle>
								<FiCode />
								RAR Use Cases
							</ExampleTitle>
							<ComparisonGrid>
								<Card>
									<CardHeader>
										<h4>Banking & Payments</h4>
									</CardHeader>
									<CardBody>
										<p>Request specific payment amounts, accounts, and time limits:</p>
										<CodeBlock>{`{
  "type": "payment_initiation",
  "instructedAmount": {
    "currency": "USD",
    "amount": "500.00"
  },
  "maxAmount": "1000.00",
  "creditorAccount": {
    "iban": "DE89370400440532013000"
  }
}`}</CodeBlock>
									</CardBody>
								</Card>
								<Card>
									<CardHeader>
										<h4>Healthcare Records</h4>
									</CardHeader>
									<CardBody>
										<p>Specify patient data access with date ranges and purposes:</p>
										<CodeBlock>{`{
  "type": "patient_records",
  "patient_id": "12345",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "purpose": "treatment",
  "datatypes": ["diagnosis", "medications"]
}`}</CodeBlock>
									</CardBody>
								</Card>
								<Card>
									<CardHeader>
										<h4>File System Access</h4>
									</CardHeader>
									<CardBody>
										<p>Request access to specific files or folders with actions:</p>
										<CodeBlock>{`{
  "type": "file_access",
  "locations": [
    "/documents/projects/",
    "/documents/reports/"
  ],
  "actions": ["read"],
  "constraints": {
    "max_file_size": "10MB"
  }
}`}</CodeBlock>
									</CardBody>
								</Card>
							</ComparisonGrid>
						</ExampleSection>
					</CardBody>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="PAR vs RAR: Key Differences"
				theme="highlight"
				icon={<FiSend />}
				defaultExpanded={true}
			>
				<Card>
					<CardBody>
						<Table>
							<thead>
								<tr>
									<th>Aspect</th>
									<th>PAR (Pushed Authorization Request)</th>
									<th>RAR (Rich Authorization Requests)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td><strong>RFC</strong></td>
									<td>RFC 9126</td>
									<td>RFC 9396</td>
								</tr>
								<tr>
									<td><strong>Primary Purpose</strong></td>
									<td>Secure transport of authorization parameters</td>
									<td>Fine-grained permission specification</td>
								</tr>
								<tr>
									<td><strong>Problem Solved</strong></td>
									<td>How to send requests securely</td>
									<td>What permissions to request</td>
								</tr>
								<tr>
									<td><strong>Method</strong></td>
									<td>POST request to /as/par endpoint</td>
									<td>authorization_details parameter in request</td>
								</tr>
								<tr>
									<td><strong>Returns</strong></td>
									<td>Short-lived request_uri</td>
									<td>Same as standard OAuth (code/token)</td>
								</tr>
								<tr>
									<td><strong>Data Format</strong></td>
									<td>Standard OAuth parameters (form-encoded)</td>
									<td>Structured JSON (authorization_details)</td>
								</tr>
								<tr>
									<td><strong>Security Focus</strong></td>
									<td>Parameter protection, tampering prevention</td>
									<td>Granular permission control</td>
								</tr>
								<tr>
									<td><strong>Use Case</strong></td>
									<td>Any OAuth flow needing secure parameter transport</td>
									<td>Complex authorization scenarios requiring fine-grained control</td>
								</tr>
								<tr>
									<td><strong>Can Combine?</strong></td>
									<td>✅ Yes - works with RAR</td>
									<td>✅ Yes - works with PAR</td>
								</tr>
							</tbody>
						</Table>

						<InfoBox>
							<InfoIcon>
								<FiInfo />
							</InfoIcon>
							<InfoContent>
								<h4>Combining PAR + RAR</h4>
								<p>
									PAR and RAR are complementary and work great together! You can push RAR authorization_details 
									via PAR for maximum security and precision. This gives you:
								</p>
								<ul>
									<li>Secure parameter transport (PAR)</li>
									<li>Fine-grained permissions (RAR)</li>
									<li>Early validation of complex authorization details</li>
									<li>Complete audit trail</li>
								</ul>
							</InfoContent>
						</InfoBox>
					</CardBody>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="PAR + RAR Combined Example"
				theme="highlight"
				icon={<FiCheck />}
				defaultExpanded={true}
			>
				<Card>
					<CardBody>
						<p>
							The best practice is to use PAR and RAR together. This example shows how to push RAR authorization_details via PAR.
						</p>

						<FlowStep>
							<FlowStepTitle>
								<FlowStepNumber>1</FlowStepNumber>
								Push RAR via PAR
							</FlowStepTitle>
							<FlowStepDescription>
								Send authorization_details (RAR) to the PAR endpoint with other OAuth parameters.
							</FlowStepDescription>
							<CodeBlockHeader>
								<span>PAR Request with RAR authorization_details</span>
								<CopyButton onClick={() => handleCopyCode(`POST https://auth.pingone.com/{environmentId}/as/par
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${'base64(clientId:clientSecret)'}

response_type=code&
client_id=your_client_id&
redirect_uri=https://app.example.com/callback&
scope=openid&
authorization_details={"authorization_details":[{"type":"payment_initiation","locations":["https://api.bank.com/payments"],"actions":["initiate"],"instructedAmount":{"currency":"USD","amount":"250.00"}}]}&
state=random_state&
code_challenge=code_challenge_value&
code_challenge_method=S256`, 'PAR + RAR request')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
							</CodeBlockHeader>
							<CodeBlock>{`POST https://auth.pingone.com/{environmentId}/as/par
Content-Type: application/x-www-form-urlencoded
Authorization: Basic ${'base64(clientId:clientSecret)'}

response_type=code&
client_id=your_client_id&
redirect_uri=https://app.example.com/callback&
scope=openid&
authorization_details={"authorization_details":[{"type":"payment_initiation","locations":["https://api.bank.com/payments"],"actions":["initiate"],"instructedAmount":{"currency":"USD","amount":"250.00"}}]}&
state=random_state&
code_challenge=code_challenge_value&
code_challenge_method=S256`}</CodeBlock>
						</FlowStep>

						<FlowStep>
							<FlowStepTitle>
								<FlowStepNumber>2</FlowStepNumber>
								Receive Request URI
							</FlowStepTitle>
							<FlowStepDescription>
								Authorization server validates both PAR parameters and RAR authorization_details, returns request_uri.
							</FlowStepDescription>
							<CodeBlockHeader>
								<span>PAR Response (same as standard PAR)</span>
								<CopyButton onClick={() => handleCopyCode(`{
  "request_uri": "urn:ietf:params:oauth:request_uri:abc123def456",
  "expires_in": 90
}`, 'PAR response')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
							</CodeBlockHeader>
							<CodeBlock>{`{
  "request_uri": "urn:ietf:params:oauth:request_uri:abc123def456",
  "expires_in": 90
}`}</CodeBlock>
						</FlowStep>

						<FlowStep>
							<FlowStepTitle>
								<FlowStepNumber>3</FlowStepNumber>
								Redirect with Request URI
							</FlowStepTitle>
							<FlowStepDescription>
								User is redirected with only the request_uri. The authorization server retrieves the stored RAR details.
							</FlowStepDescription>
							<CodeBlockHeader>
								<span>Clean Authorization URL</span>
								<CopyButton onClick={() => handleCopyCode(`https://auth.pingone.com/{environmentId}/as/authorize?request_uri=urn:ietf:params:oauth:request_uri:abc123def456&response_type=code`, 'Authorization URL')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
							</CodeBlockHeader>
							<CodeBlock>{`https://auth.pingone.com/{environmentId}/as/authorize?request_uri=urn:ietf:params:oauth:request_uri:abc123def456&response_type=code`}</CodeBlock>
						</FlowStep>

						<ExampleSection>
							<ExampleTitle>
								<FiCode />
								Complete PAR + RAR JavaScript Implementation
							</ExampleTitle>
							<CodeBlockHeader>
								<span>Full Example: PAR with RAR</span>
								<CopyButton onClick={() => handleCopyCode(`const crypto = require('crypto');

async function pushPARWithRAR(config, authorizationDetails) {
  const parEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/par\`;
  
  // Generate PKCE parameters
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  // Prepare request data with RAR authorization_details
  const requestData = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: crypto.randomBytes(16).toString('hex'),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    authorization_details: JSON.stringify({
      authorization_details: authorizationDetails
    })
  });
  
  try {
    const response = await fetch(parEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Basic \${Buffer.from(\`\${config.clientId}:\${config.clientSecret}\`).toString('base64')}\`
      },
      body: requestData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('PAR + RAR successful!');
      console.log('Request URI:', result.request_uri);
      
      // Generate clean authorization URL
      const authUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize?request_uri=\${result.request_uri}&response_type=code\`;
      
      return {
        request_uri: result.request_uri,
        expires_in: result.expires_in,
        code_verifier: codeVerifier,
        auth_url: authUrl
      };
    } else {
      throw new Error(\`PAR + RAR failed: \${result.error} - \${result.error_description}\`);
    }
  } catch (error) {
    console.error('PAR + RAR error:', error);
    throw error;
  }
}

// Usage with RAR authorization details
const config = {
  baseUrl: 'https://auth.pingone.com',
  environmentId: 'your-env-id',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://app.example.com/callback',
  scopes: ['openid']
};

const rarDetails = [
  {
    type: 'payment_initiation',
    locations: ['https://api.bank.com/payments'],
    actions: ['initiate', 'status'],
    instructedAmount: {
      currency: 'USD',
      amount: '250.00'
    }
  }
];

pushPARWithRAR(config, rarDetails)
  .then(result => {
    console.log('Redirect user to:', result.auth_url);
    // Store code_verifier for token exchange
  })
  .catch(error => console.error('Error:', error));`, 'PAR + RAR JavaScript code')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
							</CodeBlockHeader>
							<CodeBlock>{`const crypto = require('crypto');

async function pushPARWithRAR(config, authorizationDetails) {
  const parEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/par\`;
  
  // Generate PKCE parameters
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  // Prepare request data with RAR authorization_details
  const requestData = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: crypto.randomBytes(16).toString('hex'),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    authorization_details: JSON.stringify({
      authorization_details: authorizationDetails
    })
  });
  
  try {
    const response = await fetch(parEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Basic \${Buffer.from(\`\${config.clientId}:\${config.clientSecret}\`).toString('base64')}\`
      },
      body: requestData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('PAR + RAR successful!');
      console.log('Request URI:', result.request_uri);
      
      // Generate clean authorization URL
      const authUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize?request_uri=\${result.request_uri}&response_type=code\`;
      
      return {
        request_uri: result.request_uri,
        expires_in: result.expires_in,
        code_verifier: codeVerifier,
        auth_url: authUrl
      };
    } else {
      throw new Error(\`PAR + RAR failed: \${result.error} - \${result.error_description}\`);
    }
  } catch (error) {
    console.error('PAR + RAR error:', error);
    throw error;
  }
}

// Usage with RAR authorization details
const config = {
  baseUrl: 'https://auth.pingone.com',
  environmentId: 'your-env-id',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://app.example.com/callback',
  scopes: ['openid']
};

const rarDetails = [
  {
    type: 'payment_initiation',
    locations: ['https://api.bank.com/payments'],
    actions: ['initiate', 'status'],
    instructedAmount: {
      currency: 'USD',
      amount: '250.00'
    }
  }
];

pushPARWithRAR(config, rarDetails)
  .then(result => {
    console.log('Redirect user to:', result.auth_url);
    // Store code_verifier for token exchange
  })
  .catch(error => console.error('Error:', error));`}</CodeBlock>
						</ExampleSection>
					</CardBody>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="When to Use PAR, RAR, or Both"
				theme="orange"
				icon={<FiSettings />}
				defaultExpanded={false}
			>
				<Card>
					<CardBody>
						<ComparisonGrid>
							<ComparisonCard $type="par">
								<CardHeader>
									<h3>Use PAR When:</h3>
								</CardHeader>
								<CardBody>
									<ul>
										<li>✅ You need to protect sensitive parameters from URL exposure</li>
										<li>✅ You want early validation of authorization parameters</li>
										<li>✅ You're dealing with long URLs that might exceed browser limits</li>
										<li>✅ You need comprehensive server-side audit trails</li>
										<li>✅ You want to prevent parameter tampering attacks</li>
										<li>✅ You're working with public clients (mobile apps, SPAs)</li>
									</ul>
								</CardBody>
							</ComparisonCard>

							<ComparisonCard $type="rar">
								<CardHeader>
									<h3>Use RAR When:</h3>
								</CardHeader>
								<CardBody>
									<ul>
										<li>✅ You need fine-grained, contextual permissions</li>
										<li>✅ Simple scopes aren't expressive enough</li>
										<li>✅ You want to specify exact resources, actions, and constraints</li>
										<li>✅ You need better user consent screens with detailed descriptions</li>
										<li>✅ You're building APIs with complex authorization requirements</li>
										<li>✅ You need structured audit logs for compliance</li>
									</ul>
								</CardBody>
							</ComparisonCard>

							<Card>
								<CardHeader>
									<h3>Use PAR + RAR When:</h3>
								</CardHeader>
								<CardBody>
									<ul>
										<li>✅ You need both secure transport AND fine-grained permissions</li>
										<li>✅ You're building high-security financial or healthcare applications</li>
										<li>✅ You want maximum security and precision in authorization</li>
										<li>✅ You need early validation of complex authorization_details</li>
										<li>✅ You want comprehensive audit trails with detailed authorization data</li>
										<li>✅ You're implementing PCI-DSS, HIPAA, or other compliance requirements</li>
									</ul>
									<WarningBox style={{ marginTop: '1rem' }}>
										<InfoIcon>
											<FiInfo />
										</InfoIcon>
										<InfoContent>
											<h4>Best Practice</h4>
											<p>
												For production applications handling sensitive data, using PAR + RAR together 
												provides the best security posture and user experience.
											</p>
										</InfoContent>
									</WarningBox>
								</CardBody>
							</Card>
						</ComparisonGrid>
					</CardBody>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="OAuth 2.1 JWT & DPoP Advancements (RFC 9449 / RFC 9448)"
				theme="highlight"
				icon={<FiShield />}
				defaultExpanded={false}
			>
				<Card>
					<CardBody>
						<p>
							OAuth 2.1 introduces significant security enhancements through <strong>JWT-based client authentication (RFC 9448)</strong> and 
							<strong>Demonstration of Proof-of-Possession (DPoP, RFC 9449)</strong>. These specifications work together with PAR and RAR to 
							provide comprehensive security for modern OAuth implementations.
						</p>

						<h3>JWT-Based Client Authentication (RFC 9448)</h3>
						<p>
							RFC 9448 defines a method for clients to authenticate using JWT-based assertions instead of traditional client secrets. 
							This approach provides several advantages:
						</p>
						<ul>
							<li>🔐 <strong>No Shared Secrets:</strong> Eliminates the need to store client secrets, reducing security risks</li>
							<li>🎯 <strong>Asymmetric Cryptography:</strong> Uses public/private key pairs for stronger authentication</li>
							<li>⏱️ <strong>Time-Limited Assertions:</strong> JWTs have expiration times, limiting exposure window</li>
							<li>🔍 <strong>Audit Trail:</strong> JWT claims provide rich context for authentication events</li>
							<li>📦 <strong>Self-Contained:</strong> All authentication information is in the JWT itself</li>
						</ul>

						<ExampleSection>
							<ExampleTitle>
								<FiCode />
								JWT-Based Client Authentication Example
							</ExampleTitle>
							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>1</FlowStepNumber>
									Create JWT Client Assertion
								</FlowStepTitle>
								<FlowStepDescription>
									Client creates a JWT containing authentication claims signed with its private key.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>JWT Client Assertion Structure</span>
									<CopyButton onClick={() => handleCopyCode(`{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "client-key-id"
  },
  "payload": {
    "iss": "client-id",
    "sub": "client-id",
    "aud": "https://auth.pingone.com/{environmentId}/as/token",
    "jti": "unique-assertion-id",
    "exp": 1234567890,
    "iat": 1234567860
  }
}`, 'JWT Client Assertion')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "client-key-id"
  },
  "payload": {
    "iss": "client-id",
    "sub": "client-id",
    "aud": "https://auth.pingone.com/{environmentId}/as/token",
    "jti": "unique-assertion-id",
    "exp": 1234567890,
    "iat": 1234567860
  }
}`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>2</FlowStepNumber>
									Token Request with JWT Assertion
								</FlowStepTitle>
								<FlowStepDescription>
									Client uses the JWT assertion in the client_assertion parameter instead of client_secret.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>Token Request with JWT Authentication</span>
									<CopyButton onClick={() => handleCopyCode(`POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=authorization_code_value&
redirect_uri=https://app.example.com/callback&
client_id=your_client_id&
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&
client_assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImNsaWVudC1rZXktaWQifQ...`, 'Token request with JWT')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=authorization_code_value&
redirect_uri=https://app.example.com/callback&
client_id=your_client_id&
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&
client_assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImNsaWVudC1rZXktaWQifQ...`}</CodeBlock>
							</FlowStep>
						</ExampleSection>

						<h3>Demonstration of Proof-of-Possession (DPoP, RFC 9449)</h3>
						<p>
							DPoP provides proof that the client presenting an access token actually possesses the private key associated with that token. 
							This prevents token replay attacks and provides binding between the token and the HTTP request.
						</p>
						<ul>
							<li>🛡️ <strong>Token Binding:</strong> Binds access tokens to specific HTTP requests and methods</li>
							<li>🚫 <strong>Replay Protection:</strong> Each proof includes a unique jti (JWT ID) preventing replay attacks</li>
							<li>🔗 <strong>Request Binding:</strong> Proof includes HTTP method and URI, ensuring token is used for intended request</li>
							<li>⏱️ <strong>Freshness:</strong> Includes iat (issued at) timestamp for freshness validation</li>
							<li>🔐 <strong>Key Possession:</strong> Proves client controls the private key, not just the token</li>
						</ul>

						<ExampleSection>
							<ExampleTitle>
								<FiCode />
								DPoP Proof Creation Example
							</ExampleTitle>
							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>1</FlowStepNumber>
									Generate DPoP Key Pair
								</FlowStepTitle>
								<FlowStepDescription>
									Client generates an asymmetric key pair for DPoP proofs (typically ES256 or RS256).
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>DPoP Key Pair Generation</span>
									<CopyButton onClick={() => handleCopyCode(`// Generate DPoP key pair
const keyPair = await crypto.subtle.generateKey(
  {
    name: 'ECDSA',
    namedCurve: 'P-256'
  },
  true, // extractable
  ['sign', 'verify']
);

// Export public key as JWK
const publicKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);`, 'DPoP key generation')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`// Generate DPoP key pair
const keyPair = await crypto.subtle.generateKey(
  {
    name: 'ECDSA',
    namedCurve: 'P-256'
  },
  true, // extractable
  ['sign', 'verify']
);

// Export public key as JWK
const publicKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>2</FlowStepNumber>
									Create DPoP Proof JWT
								</FlowStepTitle>
								<FlowStepDescription>
									Create a DPoP proof JWT containing HTTP method, URI, timestamp, and optionally the access token hash.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>DPoP Proof JWT Structure</span>
									<CopyButton onClick={() => handleCopyCode(`{
  "header": {
    "typ": "dpop+jwt",
    "alg": "ES256",
    "jwk": {
      "kty": "EC",
      "crv": "P-256",
      "x": "base64url-encoded-x-coordinate",
      "y": "base64url-encoded-y-coordinate"
    }
  },
  "payload": {
    "jti": "unique-proof-id",
    "htm": "POST",
    "htu": "https://api.example.com/resource",
    "iat": 1234567890,
    "ath": "base64url-encoded-sha256-hash-of-access-token"
  }
}`, 'DPoP proof JWT')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`{
  "header": {
    "typ": "dpop+jwt",
    "alg": "ES256",
    "jwk": {
      "kty": "EC",
      "crv": "P-256",
      "x": "base64url-encoded-x-coordinate",
      "y": "base64url-encoded-y-coordinate"
    }
  },
  "payload": {
    "jti": "unique-proof-id",
    "htm": "POST",
    "htu": "https://api.example.com/resource",
    "iat": 1234567890,
    "ath": "base64url-encoded-sha256-hash-of-access-token"
  }
}`}</CodeBlock>
							</FlowStep>

							<FlowStep>
								<FlowStepTitle>
									<FlowStepNumber>3</FlowStepNumber>
									Include DPoP Proof in API Request
								</FlowStepTitle>
								<FlowStepDescription>
									Include the DPoP proof in the DPoP header when making API requests with the access token.
								</FlowStepDescription>
								<CodeBlockHeader>
									<span>API Request with DPoP Proof</span>
									<CopyButton onClick={() => handleCopyCode(`POST https://api.example.com/resource
Authorization: Bearer access_token_here
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiamZrIjp7Imt0eSI6IkVDIiw...`, 'DPoP API request')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>{`POST https://api.example.com/resource
Authorization: Bearer access_token_here
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiamZrIjp7Imt0eSI6IkVDIiw...`}</CodeBlock>
							</FlowStep>
						</ExampleSection>

						<h3>Combining PAR, RAR, JWT Auth, and DPoP</h3>
						<p>
							These OAuth 2.1 enhancements work together to provide comprehensive security:
						</p>
						<ul>
							<li>
								<strong>PAR + JWT Client Auth:</strong> Push authorization requests securely using JWT-based client authentication 
								instead of client secrets
							</li>
							<li>
								<strong>RAR + DPoP:</strong> Request fine-grained permissions with proof of possession for token usage
							</li>
							<li>
								<strong>Complete Flow:</strong> PAR (secure transport) + RAR (fine-grained permissions) + JWT Auth (no secrets) + DPoP (token binding)
							</li>
						</ul>

						<InfoBox>
							<InfoIcon>
								<FiInfo />
							</InfoIcon>
							<InfoContent>
								<h4>PingOne Support Status</h4>
								<p>
									<strong>JWT-Based Client Authentication (RFC 9448):</strong> Supported by PingOne for client authentication.
									<br />
									<strong>DPoP (RFC 9449):</strong> Not currently supported by PingOne. The playground includes educational mock implementations 
									to demonstrate DPoP concepts and security benefits.
								</p>
							</InfoContent>
						</InfoBox>

						<ExampleSection>
							<ExampleTitle>
								<FiCode />
								Complete Example: PAR + RAR + JWT Auth + DPoP
							</ExampleTitle>
							<CodeBlockHeader>
								<span>Full OAuth 2.1 Flow with All Enhancements</span>
								<CopyButton onClick={() => handleCopyCode(`// 1. Generate DPoP key pair
const dpopKeyPair = await generateDPoPKeyPair();

// 2. Create JWT client assertion for authentication
const clientAssertion = await createJWTClientAssertion({
  clientId: 'your-client-id',
  tokenEndpoint: 'https://auth.pingone.com/{envId}/as/token',
  privateKey: clientPrivateKey
});

// 3. Push authorization request with RAR (using JWT auth)
const parResponse = await pushPARRequest({
  clientId: 'your-client-id',
  clientAssertion: clientAssertion,
  authorizationDetails: [{
    type: 'payment_initiation',
    locations: ['https://api.bank.com/payments'],
    actions: ['initiate'],
    instructedAmount: { currency: 'USD', amount: '250.00' }
  }]
});

// 4. Exchange authorization code for access token (with DPoP public key)
const tokenResponse = await exchangeCodeForToken({
  code: authorizationCode,
  clientAssertion: clientAssertion,
  dpopKeyThumbprint: await getDPoPKeyThumbprint(dpopKeyPair.publicKey)
});

// 5. Make API request with DPoP proof
const dpopProof = await createDPoPProof({
  httpMethod: 'POST',
  httpUri: 'https://api.bank.com/payments',
  accessToken: tokenResponse.access_token,
  privateKey: dpopKeyPair.privateKey
});

const apiResponse = await fetch('https://api.bank.com/payments', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${tokenResponse.access_token}\`,
    'DPoP': dpopProof
  },
  body: JSON.stringify({ amount: 250.00 })
});`, 'Complete OAuth 2.1 flow')}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
							</CodeBlockHeader>
							<CodeBlock>{`// 1. Generate DPoP key pair
const dpopKeyPair = await generateDPoPKeyPair();

// 2. Create JWT client assertion for authentication
const clientAssertion = await createJWTClientAssertion({
  clientId: 'your-client-id',
  tokenEndpoint: 'https://auth.pingone.com/{envId}/as/token',
  privateKey: clientPrivateKey
});

// 3. Push authorization request with RAR (using JWT auth)
const parResponse = await pushPARRequest({
  clientId: 'your-client-id',
  clientAssertion: clientAssertion,
  authorizationDetails: [{
    type: 'payment_initiation',
    locations: ['https://api.bank.com/payments'],
    actions: ['initiate'],
    instructedAmount: { currency: 'USD', amount: '250.00' }
  }]
});

// 4. Exchange authorization code for access token (with DPoP public key)
const tokenResponse = await exchangeCodeForToken({
  code: authorizationCode,
  clientAssertion: clientAssertion,
  dpopKeyThumbprint: await getDPoPKeyThumbprint(dpopKeyPair.publicKey)
});

// 5. Make API request with DPoP proof
const dpopProof = await createDPoPProof({
  httpMethod: 'POST',
  httpUri: 'https://api.bank.com/payments',
  accessToken: tokenResponse.access_token,
  privateKey: dpopKeyPair.privateKey
});

const apiResponse = await fetch('https://api.bank.com/payments', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${tokenResponse.access_token}\`,
    'DPoP': dpopProof
  },
  body: JSON.stringify({ amount: 250.00 })
});`}</CodeBlock>
						</ExampleSection>
					</CardBody>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Summary & Next Steps"
				theme="green"
				icon={<FiCheck />}
				defaultExpanded={false}
			>
				<Card>
					<CardBody>
						<h3>Key Takeaways</h3>
						<ul>
							<li>
								<strong>PAR (RFC 9126)</strong> solves the "how" - it provides secure transport of authorization 
								parameters via authenticated POST requests, preventing URL exposure and parameter tampering.
							</li>
							<li>
								<strong>RAR (RFC 9396)</strong> solves the "what" - it enables fine-grained authorization 
								specifications using structured JSON, going beyond simple scope strings.
							</li>
							<li>
								<strong>DPoP (RFC 9449)</strong> solves the "proof" - it provides demonstration of proof-of-possession 
								for access tokens, preventing token replay attacks and binding tokens to specific HTTP requests.
							</li>
							<li>
								<strong>JWT-Based Client Authentication (RFC 9448)</strong> eliminates the need for shared client secrets 
								by using asymmetric cryptography with JWT assertions.
							</li>
							<li>
								<strong>PAR + RAR + DPoP + JWT Auth</strong> together provide comprehensive security for modern OAuth 2.1 applications, 
								combining secure transport, fine-grained permissions, token binding, and secret-less authentication.
							</li>
							<li>
								PAR and RAR are fully supported by PingOne. DPoP is available as educational mock implementations 
								to demonstrate security concepts and best practices.
							</li>
						</ul>

						<h3>Next Steps</h3>
						<ul>
							<li>Explore the <strong>PingOne PAR Flow</strong> page to try PAR in action</li>
							<li>Check out the <strong>RAR Flow</strong> page for interactive RAR examples</li>
							<li>Review the <strong>OAuth 2.1</strong> specification for the latest OAuth best practices</li>
							<li>Learn about <strong>JWT-based client authentication</strong> to eliminate client secrets</li>
							<li>Understand <strong>DPoP</strong> for token binding and replay attack prevention</li>
							<li>Implement <strong>PAR + RAR + DPoP + JWT Auth</strong> in your applications for maximum security</li>
						</ul>
					</CardBody>
				</Card>
			</CollapsibleHeader>
		</Container>
	);
};

export default PARvsRAR;

