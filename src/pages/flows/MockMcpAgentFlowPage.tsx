// src/pages/flows/MockMcpAgentFlowPage.tsx
// Educational mock flow: Agent → MCP Server → Token Exchange. Teaches secure AI agent authentication.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CodeExamplesSection } from '../../components/CodeExamplesSection';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { callTool, listTools, type MockToolCallResult } from '../../services/mockMcpAgentService';
import { V9_COLORS } from '../../services/v9/V9ColorStandards';
import { V9FlowRestartButton } from '../../services/v9/V9FlowRestartButton';
import V9FlowHeader from '../../services/v9/v9FlowHeaderService';
import { V7MMockBanner } from '../../v7/components/V7MMockBanner';
import {
	getSectionHeaderStyle,
	MOCK_FLOW_CONTAINER_STYLE,
	MOCK_PRIMARY_BTN,
	MOCK_SECTION_BODY_STYLE,
	MOCK_SECTION_STYLE,
} from '../../v7/styles/mockFlowStyles';

function JsonBlock({ data }: { data: object }) {
	return (
		<pre
			style={{
				background: '#f8fafc',
				border: '1px solid #e2e8f0',
				borderRadius: 6,
				padding: 12,
				fontSize: 12,
				overflow: 'auto',
				maxHeight: 240,
			}}
		>
			{JSON.stringify(data, null, 2)}
		</pre>
	);
}

const MockMcpAgentFlowPage: React.FC = () => {
	const [subjectToken, setSubjectToken] = useState('');
	const [currentToken, setCurrentToken] = useState('');
	const [lastResult, setLastResult] = useState<MockToolCallResult | null>(null);

	function handleGetToken() {
		const result = callTool('mock_get_token', { clientId: 'mock-client', clientSecret: '***' });
		setLastResult(result);
		if (result.success && result.response && 'access_token' in result.response) {
			setSubjectToken(result.response.access_token as string);
			setCurrentToken(result.response.access_token as string);
		}
	}

	function handleTokenExchange() {
		const token = subjectToken || currentToken;
		if (!token) {
			setLastResult({
				success: false,
				tool: 'mock_token_exchange',
				error: 'No subject token. Run step 1 first.',
				request: {},
			});
			return;
		}
		const result = callTool('mock_token_exchange', {
			subject_token: token,
			requested_scope: 'p1:read:user',
		});
		setLastResult(result);
		if (result.success && result.response && 'access_token' in result.response) {
			setCurrentToken(result.response.access_token as string);
		}
	}

	function handleListUsers() {
		const token = currentToken;
		if (!token) {
			setLastResult({
				success: false,
				tool: 'mock_list_users',
				error: 'No token. Run steps 1 and 2 first.',
				request: {},
			});
			return;
		}
		const result = callTool('mock_list_users', { access_token: token });
		setLastResult(result);
	}

	function handleReset() {
		setSubjectToken('');
		setCurrentToken('');
		setLastResult(null);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	const tools = listTools();

	return (
		<div style={MOCK_FLOW_CONTAINER_STYLE}>
			<V7MMockBanner description="This flow simulates an AI Agent using MCP tools and Token Exchange. No real APIs are called. Learn how Host, Client, Agent, and MCP Server use tokens securely." />
			<V9FlowHeader flowId="mock-mcp-agent-flow" customConfig={{ flowType: 'pingone' }} />
			<div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
				<V9FlowRestartButton onRestart={handleReset} label="Reset flow" />
			</div>

			<CollapsibleHeader
				title="Secure AI Agent Authentication"
				subtitle="Token storage, exchange, and MCP consent — read before building your own Agent"
				icon={<span>🔐</span>}
				defaultCollapsed={false}
				theme="ping"
			>
				<div style={{ padding: '1rem 0' }}>
					<p>
						<strong>Token storage:</strong> Never store tokens in plain text in client code, logs,
						or URLs. Worker tokens: use short-lived tokens; store credentials only in secure storage
						(mcp-config.json, env). User tokens: prefer sessionStorage (cleared on tab close); avoid
						localStorage for long-lived tokens. Most secure: backend-only storage.
					</p>
					<p style={{ marginTop: 12 }}>
						<strong>Token Exchange (RFC 8693):</strong> Exchange a subject token for a new token
						with different scope. Do not pass raw tokens in URLs or logs.
					</p>
					<p style={{ marginTop: 12 }}>
						<strong>MCP spec:</strong> Hosts must obtain explicit user consent before invoking
						tools.
					</p>
					<Link
						to="/documentation/mcp"
						style={{ color: V9_COLORS.PRIMARY.BLUE, fontSize: 14, marginTop: 12, display: 'block' }}
					>
						MCP Documentation →
					</Link>
				</div>
			</CollapsibleHeader>

			<div style={MOCK_SECTION_STYLE}>
				<div style={getSectionHeaderStyle('default')}>
					<strong>Step 1 — Get initial token</strong>
				</div>
				<div style={MOCK_SECTION_BODY_STYLE}>
					<p style={{ marginBottom: 8 }}>
						Simulated Agent requests a worker token from the MCP server.
					</p>
					<button type="button" style={MOCK_PRIMARY_BTN} onClick={handleGetToken}>
						Send mock_get_token
					</button>
				</div>
			</div>

			<div style={MOCK_SECTION_STYLE}>
				<div style={getSectionHeaderStyle('default')}>
					<strong>Step 2 — Token exchange</strong>
				</div>
				<div style={MOCK_SECTION_BODY_STYLE}>
					<p style={{ marginBottom: 8 }}>
						Agent exchanges the subject token for a new token with broader scope (RFC 8693).
					</p>
					<button
						type="button"
						style={MOCK_PRIMARY_BTN}
						onClick={handleTokenExchange}
						disabled={!subjectToken && !currentToken}
					>
						Send mock_token_exchange
					</button>
				</div>
			</div>

			<div style={MOCK_SECTION_STYLE}>
				<div style={getSectionHeaderStyle('default')}>
					<strong>Step 3 — List users</strong>
				</div>
				<div style={MOCK_SECTION_BODY_STYLE}>
					<p style={{ marginBottom: 8 }}>Agent calls list-users with the exchanged token.</p>
					<button
						type="button"
						style={MOCK_PRIMARY_BTN}
						onClick={handleListUsers}
						disabled={!currentToken}
					>
						Send mock_list_users
					</button>
				</div>
			</div>

			{lastResult && (
				<div style={MOCK_SECTION_STYLE}>
					<div
						style={{
							...getSectionHeaderStyle('default'),
							background: lastResult.success ? '#d1fae5' : '#fee2e2',
						}}
					>
						<strong>
							{lastResult.success ? '✓' : '✗'} MCP tool: {lastResult.tool}
						</strong>
					</div>
					<div style={MOCK_SECTION_BODY_STYLE}>
						{lastResult.request && (
							<>
								<p style={{ marginBottom: 4 }}>
									<strong>Request:</strong>
								</p>
								<JsonBlock data={lastResult.request} />
								<p style={{ marginTop: 12, marginBottom: 4 }}>
									<strong>Response:</strong>
								</p>
							</>
						)}
						{lastResult.response && <JsonBlock data={lastResult.response} />}
						{lastResult.error && (
							<p style={{ color: '#dc2626', marginTop: 8 }}>{lastResult.error}</p>
						)}
					</div>
				</div>
			)}

			<div style={{ ...MOCK_SECTION_STYLE, marginTop: 16 }}>
				<div style={getSectionHeaderStyle('info')}>
					<strong>Available tools ({tools.tools.length})</strong>
				</div>
				<div style={MOCK_SECTION_BODY_STYLE}>
					<ul style={{ margin: 0, paddingLeft: 20 }}>
						{tools.tools.map((t) => (
							<li key={t.name} style={{ marginBottom: 4 }}>
								<code>{t.name}</code> — {t.description}
							</li>
						))}
					</ul>
				</div>
			</div>

			<CodeExamplesSection
				examples={[
					{
						title: 'Step 1: Get Initial Worker Token',
						description: 'Request a worker token from the MCP server using client credentials.',
						code: `// Get worker token from MCP server
const response = await fetch('https://auth.example.com/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    scope: 'mcp:tools'
  })
});

const data = await response.json();
// Store the access_token securely
// NEVER log or expose tokens in production
const workerToken = data.access_token;`,
					},
					{
						title: 'Step 2: Token Exchange (RFC 8693)',
						description: 'Exchange the subject token for a new token with different scope.',
						code: `// Exchange token for broader scope
const exchangeResponse = await fetch('https://auth.example.com/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    subject_token: workerToken,
    subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    scope: 'p1:read:user p1:update:user'
  })
});

const exchangeData = await exchangeResponse.json();
const exchangedToken = exchangeData.access_token;`,
					},
					{
						title: 'Step 3: Call Protected API',
						description: 'Use the exchanged token to access protected resources.',
						code: `// Call protected API with exchanged token
const apiResponse = await fetch('https://api.pingone.com/v1/environments/{envId}/users', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${exchangedToken}\`,
    'Content-Type': 'application/json'
  }
});

const users = await apiResponse.json();
console.log('Users:', users);`,
					},
					{
						title: 'Security Best Practices',
						description: 'Always follow these security guidelines when implementing token flows.',
						code: `// ✅ DO: Store tokens securely
// Use sessionStorage (cleared on tab close) or secure backend storage
sessionStorage.setItem('access_token', token);

// ✅ DO: Clear tokens on logout
sessionStorage.removeItem('access_token');

// ❌ DON'T: Store tokens in localStorage for long-lived sessions
// localStorage.setItem('access_token', token); // AVOID

// ❌ DON'T: Log tokens or include them in URLs
// console.log('Token:', token); // NEVER DO THIS
// window.location.href = '/callback?token=' + token; // NEVER DO THIS

// ✅ DO: Validate token expiration
function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}`,
					},
				]}
			/>
		</div>
	);
};

export default MockMcpAgentFlowPage;
