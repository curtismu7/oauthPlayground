// src/components/ParameterImpactVisualizer.tsx
/**
 * Parameter Impact Visualizer
 * Shows before/after comparisons of OAuth parameter effects
 */

import { FiAlertCircle, FiCheckCircle, FiClock, FiGlobe, FiLock, FiShield, FiUsers } from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';

const VisualizerContainer = styled.div`
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
	border: 2px solid #cbd5e1;
`;

const Title = styled.h2`
	color: #1e293b;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.5rem;
`;

const Subtitle = styled.p`
	color: #64748b;
	margin: 0 0 2rem 0;
	font-size: 1rem;
`;

const ParameterTabs = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`;

const TabButton = styled.button<{ $active: boolean }>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: ${({ $active }) =>
		$active ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white'};
	color: ${({ $active }) => ($active ? 'white' : '#475569')};
	border: 2px solid ${({ $active }) => ($active ? '#3b82f6' : '#e2e8f0')};

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
`;

const ComparisonContainer = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 2rem;
	margin-bottom: 2rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const ScenarioCard = styled.div<{ variant: 'before' | 'after' }>`
	background: white;
	border-radius: 0.75rem;
	padding: 1.5rem;
	border: 3px solid ${({ variant }) => (variant === 'before' ? '#ef4444' : '#10b981')};
	position: relative;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ScenarioHeader = styled.div<{ variant: 'before' | 'after' }>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid ${({ variant }) => (variant === 'before' ? '#fecaca' : '#d1fae5')};
`;

const HeaderIcon = styled.div<{ variant: 'before' | 'after' }>`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${({ variant }) => (variant === 'before' ? '#ef4444' : '#10b981')};
	color: white;
	font-size: 1.25rem;
`;

const ScenarioTitle = styled.h3<{ variant: 'before' | 'after' }>`
	margin: 0;
	color: ${({ variant }) => (variant === 'before' ? '#dc2626' : '#059669')};
	font-size: 1.25rem;
`;

const Timeline = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const TimelineEvent = styled.div<{ type: 'normal' | 'danger' | 'success' | 'warning' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	border-left: 4px solid ${({ type }) => {
		switch (type) {
			case 'danger':
				return '#ef4444';
			case 'success':
				return '#10b981';
			case 'warning':
				return '#f59e0b';
			default:
				return '#3b82f6';
		}
	}};
	background: ${({ type }) => {
		switch (type) {
			case 'danger':
				return '#fee2e2';
			case 'success':
				return '#d1fae5';
			case 'warning':
				return '#fef3c7';
			default:
				return '#dbeafe';
		}
	}};
`;

const EventTime = styled.div`
	font-weight: 600;
	font-size: 0.875rem;
	color: #64748b;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const EventDescription = styled.div`
	color: #1e293b;
	line-height: 1.6;
	font-size: 0.95rem;
`;

const Impact = styled.div<{ type: 'negative' | 'positive' }>`
	margin-top: 2rem;
	padding: 1.5rem;
	border-radius: 0.75rem;
	background: ${({ type }) =>
		type === 'negative'
			? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
			: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'};
	border: 2px solid ${({ type }) => (type === 'negative' ? '#ef4444' : '#10b981')};
`;

const ImpactTitle = styled.div`
	font-weight: 700;
	font-size: 1.1rem;
	margin-bottom: 0.75rem;
	color: #1e293b;
`;

const ImpactText = styled.div`
	color: #475569;
	line-height: 1.6;
`;

const CodeBlock = styled.pre`
	background: #1e293b;
	color: #f1f5f9;
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
	margin: 1rem 0;
`;

type ParameterType = 'max_age' | 'prompt' | 'state' | 'nonce' | 'pkce' | 'resource' | 'login_hint';

interface Scenario {
	before: {
		events: Array<{
			time: string;
			description: string;
			type: 'normal' | 'danger' | 'success' | 'warning';
		}>;
		impact: string;
	};
	after: {
		events: Array<{
			time: string;
			description: string;
			type: 'normal' | 'danger' | 'success' | 'warning';
		}>;
		impact: string;
	};
	code?: string;
}

const scenarios: Record<ParameterType, Scenario> = {
	max_age: {
		before: {
			events: [
				{
					time: '10:00 AM',
					description: '☕ User logs in at coffee shop on laptop',
					type: 'normal',
				},
				{
					time: '10:45 AM',
					description: '🚶 User closes laptop and leaves',
					type: 'normal',
				},
				{
					time: '11:15 AM',
					description: '😈 Attacker opens the laptop',
					type: 'warning',
				},
				{
					time: '11:16 AM',
					description: '💀 Still logged in! Attacker accesses sensitive data for 45 minutes',
					type: 'danger',
				},
			],
			impact:
				'🚨 Security Breach: Session stayed active 76 minutes after user left. No re-authentication required.',
		},
		after: {
			events: [
				{
					time: '10:00 AM',
					description: '☕ User logs in at coffee shop (max_age=300 set)',
					type: 'normal',
				},
				{
					time: '10:45 AM',
					description: '🚶 User closes laptop and leaves',
					type: 'normal',
				},
				{
					time: '11:15 AM',
					description: '😈 Attacker opens the laptop',
					type: 'warning',
				},
				{
					time: '11:16 AM',
					description:
						'🛡️ Auth expired! Attacker sees login screen. Last auth was 76 min ago (max: 5 min)',
					type: 'success',
				},
			],
			impact:
				'✅ Protected: max_age forced re-authentication because last login exceeded 5 minutes.',
		},
		code: `// Authorization request with max_age
const authUrl = \`https://auth.pingone.com/\${envId}/as/authorize?
  client_id=\${clientId}
  &redirect_uri=\${redirectUri}
  &response_type=code
  &scope=openid
  &max_age=300  // Force re-auth if last login > 5 minutes
  &state=\${state}\`;

// When user returns, check auth_time in ID token
const idToken = jwt.decode(tokens.id_token);
const authAge = Date.now()/1000 - idToken.auth_time;

if (authAge > 300) {
  // User authentication is too old, re-authenticate
  console.log('Auth too old, forcing re-login');
}`,
	},
	prompt: {
		before: {
			events: [
				{
					time: 'Step 1',
					description: '👤 User clicks "Login with Google" on your app',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '🔄 Browser redirects to Google - user already logged in',
					type: 'normal',
				},
				{
					time: 'Step 3',
					description: '⚡ Google silently approves and redirects back (NO consent screen shown)',
					type: 'warning',
				},
				{
					time: 'Step 4',
					description: '😕 User confused: "Did I just grant access? What did I share?"',
					type: 'danger',
				},
			],
			impact:
				'⚠️ UX Issue: User granted permissions without seeing what was shared. No transparency.',
		},
		after: {
			events: [
				{
					time: 'Step 1',
					description: '👤 User clicks "Login with Google" (prompt=consent)',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '🔄 Browser redirects to Google',
					type: 'normal',
				},
				{
					time: 'Step 3',
					description: '📋 Consent screen ALWAYS shown: "App X wants: email, profile"',
					type: 'normal',
				},
				{
					time: 'Step 4',
					description: '✅ User makes informed decision and approves',
					type: 'success',
				},
			],
			impact:
				"✅ Transparency: User always sees what permissions they're granting, even if already logged in.",
		},
		code: `// Force consent screen to always show
const authUrl = \`https://auth.example.com/authorize?
  client_id=\${clientId}
  &redirect_uri=\${redirectUri}
  &response_type=code
  &scope=openid email profile
  &prompt=consent  // ALWAYS show consent, even if approved before
  &state=\${state}\`;

// Other prompt values:
// prompt=none    → Silent auth, fail if interaction needed
// prompt=login   → Force re-login, even if already logged in  
// prompt=select_account → Show account picker`,
	},
	state: {
		before: {
			events: [
				{
					time: 'Step 1',
					description: '👤 Victim visits your OAuth app',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '😈 Attacker intercepts the authorization URL',
					type: 'warning',
				},
				{
					time: 'Step 3',
					description: '🎣 Attacker tricks victim into using THEIR authorization URL',
					type: 'danger',
				},
				{
					time: 'Step 4',
					description:
						"💀 Victim completes auth with attacker's OAuth flow - account linked to attacker!",
					type: 'danger',
				},
			],
			impact:
				"🚨 CSRF Attack: Victim's account is now linked to attacker's OAuth profile. Data breach!",
		},
		after: {
			events: [
				{
					time: 'Step 1',
					description: '👤 Victim visits your app (state=abc123 generated)',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '😈 Attacker intercepts and replaces with their URL (state=xyz789)',
					type: 'warning',
				},
				{
					time: 'Step 3',
					description: "🎣 Victim clicks attacker's URL, completes auth",
					type: 'warning',
				},
				{
					time: 'Step 4',
					description: '🛡️ App checks state: xyz789 ≠ abc123. Request REJECTED!',
					type: 'success',
				},
			],
			impact: '✅ CSRF Blocked: State parameter validation detected the attack. Account safe!',
		},
		code: `// ALWAYS use state parameter
import crypto from 'crypto';

// Before redirect: Generate and store state
const state = crypto.randomBytes(32).toString('hex');
sessionStorage.setItem('oauth_state', state);

const authUrl = \`https://auth.example.com/authorize?
  client_id=\${clientId}
  &state=\${state}  // CRITICAL for CSRF protection
  &redirect_uri=\${redirectUri}
  &response_type=code\`;

// After redirect: VALIDATE state
const returnedState = new URLSearchParams(location.search).get('state');
const expectedState = sessionStorage.getItem('oauth_state');

if (returnedState !== expectedState) {
  throw new Error('CSRF attack detected! State mismatch.');
}`,
	},
	nonce: {
		before: {
			events: [
				{
					time: 'Step 1',
					description: '👤 User authenticates and receives ID token',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '😈 Attacker intercepts the ID token from network traffic',
					type: 'warning',
				},
				{
					time: 'Step 3',
					description: '🔄 Attacker replays the stolen ID token on their own device',
					type: 'danger',
				},
				{
					time: 'Step 4',
					description: '💀 App accepts the replayed ID token - attacker authenticated as victim!',
					type: 'danger',
				},
			],
			impact: "🚨 ID Token Replay: Attacker reuses victim's ID token to impersonate them.",
		},
		after: {
			events: [
				{
					time: 'Step 1',
					description: '👤 User authenticates (nonce=xyz123 in request)',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '🔐 ID token includes nonce claim: "nonce": "xyz123"',
					type: 'normal',
				},
				{
					time: 'Step 3',
					description: '😈 Attacker steals and tries to replay ID token',
					type: 'warning',
				},
				{
					time: 'Step 4',
					description:
						"🛡️ Nonce mismatch! Attacker's session expected different nonce. Attack failed!",
					type: 'success',
				},
			],
			impact:
				'✅ Replay Blocked: Nonce ensures each ID token is tied to a specific authentication request.',
		},
		code: `// Generate nonce for each auth request
const nonce = crypto.randomBytes(32).toString('hex');
sessionStorage.setItem('oauth_nonce', nonce);

const authUrl = \`https://auth.example.com/authorize?
  client_id=\${clientId}
  &response_type=id_token  // Or 'code id_token' for hybrid
  &nonce=\${nonce}  // Prevents ID token replay attacks
  &redirect_uri=\${redirectUri}\`;

// Validate nonce when receiving ID token
const idToken = jwt.decode(tokens.id_token);
const expectedNonce = sessionStorage.getItem('oauth_nonce');

if (idToken.nonce !== expectedNonce) {
  throw new Error('ID token replay attack detected!');
}

// Nonce should be different for EVERY authentication request`,
	},
	pkce: {
		before: {
			events: [
				{
					time: 'Step 1',
					description: '📱 Mobile app initiates OAuth flow',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '😈 Attacker intercepts authorization code from callback',
					type: 'warning',
				},
				{
					time: 'Step 3',
					description: '💀 Attacker exchanges code for tokens (no client secret in mobile apps!)',
					type: 'danger',
				},
				{
					time: 'Step 4',
					description: "🚨 Attacker has access token and can access victim's data",
					type: 'danger',
				},
			],
			impact: "🚨 Authorization Code Interception: Mobile apps can't keep client_secret secure!",
		},
		after: {
			events: [
				{
					time: 'Step 1',
					description: '📱 App generates code_verifier and code_challenge',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '🔒 Auth request includes code_challenge (hashed verifier)',
					type: 'normal',
				},
				{
					time: 'Step 3',
					description: '😈 Attacker intercepts authorization code',
					type: 'warning',
				},
				{
					time: 'Step 4',
					description: "🛡️ Token exchange fails! Attacker doesn't have code_verifier. App safe!",
					type: 'success',
				},
			],
			impact:
				'✅ PKCE Protection: Even if authorization code is stolen, tokens cannot be obtained.',
		},
		code: `// Step 1: Generate PKCE pair
import crypto from 'crypto';

const codeVerifier = crypto.randomBytes(32).toString('hex');
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Step 2: Authorization request with code_challenge
const authUrl = \`https://auth.example.com/authorize?
  client_id=\${clientId}
  &code_challenge=\${codeChallenge}
  &code_challenge_method=S256  // SHA-256 hashing
  &response_type=code\`;

// Step 3: Token exchange with code_verifier
const tokenResponse = await fetch(tokenEndpoint, {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    code_verifier: codeVerifier,  // Proves you initiated the flow
    client_id: clientId,
  }),
});

// Server validates: hash(code_verifier) === code_challenge`,
	},
	resource: {
		before: {
			events: [
				{
					time: 'Step 1',
					description: '👤 User logs into multi-tenant SaaS app',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '🎫 App receives ONE access token for "api.example.com"',
					type: 'normal',
				},
				{
					time: 'Step 3',
					description: '😈 Token is stolen by malicious script',
					type: 'warning',
				},
				{
					time: 'Step 4',
					description:
						'💀 Attacker uses token to access ALL customer APIs (CustomerA, CustomerB, CustomerC)',
					type: 'danger',
				},
			],
			impact:
				'🚨 Excessive Scope: One stolen token compromises ALL customer data across the platform.',
		},
		after: {
			events: [
				{
					time: 'Step 1',
					description: '👤 User logs in, requests access to CustomerA API only',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '🎫 Token contains: aud: ["https://customerA.api.com"]',
					type: 'normal',
				},
				{
					time: 'Step 3',
					description: '😈 Token is stolen by malicious script',
					type: 'warning',
				},
				{
					time: 'Step 4',
					description:
						'🛡️ CustomerB/C APIs reject token! Only CustomerA API accepts it. Blast radius limited!',
					type: 'success',
				},
			],
			impact:
				'✅ Least Privilege: Resource indicators limit token scope to specific APIs. Breach contained!',
		},
		code: `// Request tokens for specific resources (RFC 8707)
const authUrl = \`https://auth.example.com/authorize?
  client_id=\${clientId}
  &response_type=code
  &scope=openid read:data
  &resource=https://customerA.api.com  // Limit to specific API
  &redirect_uri=\${redirectUri}\`;

// Token will have audience claim:
const accessToken = {
  aud: ["https://customerA.api.com"],  // Only valid here
  scope: "read:data",
  // ...other claims
};

// API validates audience:
if (!token.aud.includes('https://customerA.api.com')) {
  return res.status(403).json({ error: 'Invalid audience' });
}

// Benefits: Stolen token CANNOT access other APIs`,
	},
	login_hint: {
		before: {
			events: [
				{
					time: 'Step 1',
					description: '👤 User clicks "Sign in with Google" for 5th time today',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '⌨️ User manually types email again: "john.doe@company.com"',
					type: 'warning',
				},
				{
					time: 'Step 3',
					description: '😤 User frustrated: "Why do I keep typing this?"',
					type: 'danger',
				},
				{
					time: 'Step 4',
					description: '❌ High friction UX leads to login abandonment',
					type: 'danger',
				},
			],
			impact:
				'⚠️ Poor UX: Users must manually enter email every time. Increased friction and abandonment.',
		},
		after: {
			events: [
				{
					time: 'Step 1',
					description: '👤 User clicks "Sign in with Google" (login_hint=john.doe@company.com)',
					type: 'normal',
				},
				{
					time: 'Step 2',
					description: '✨ Email field pre-populated! User just clicks "Continue"',
					type: 'success',
				},
				{
					time: 'Step 3',
					description: '😊 User appreciates seamless experience',
					type: 'success',
				},
				{
					time: 'Step 4',
					description: '✅ Faster login flow, higher completion rate',
					type: 'success',
				},
			],
			impact:
				'✅ Improved UX: Pre-populated email saves time and reduces friction. Better conversion!',
		},
		code: `// Remember user's email from previous session
const lastEmail = localStorage.getItem('user_email');

const authUrl = \`https://auth.example.com/authorize?
  client_id=\${clientId}
  &response_type=code
  &scope=openid email
  &login_hint=\${encodeURIComponent(lastEmail)}  // Pre-fill email
  &redirect_uri=\${redirectUri}\`;

// After successful login, save email for next time
const idToken = jwt.decode(tokens.id_token);
localStorage.setItem('user_email', idToken.email);

// Works with: emails, phone numbers, or user IDs
// Provider-dependent support (check docs)`,
	},
};

const ParameterImpactVisualizer: React.FC = () => {
	const [selectedParameter, setSelectedParameter] = useState<ParameterType>('max_age');

	const scenario = scenarios[selectedParameter];

	return (
		<VisualizerContainer>
			<Title>
				<FiShield size={28} style={{ color: '#3b82f6' }} />
				Parameter Impact Visualizer
			</Title>
			<Subtitle>
				See exactly what happens WITH and WITHOUT each OAuth parameter. Real-world scenarios with
				security implications.
			</Subtitle>

			<ParameterTabs>
				<TabButton
					$active={selectedParameter === 'max_age'}
					onClick={() => setSelectedParameter('max_age')}
				>
					<FiClock />
					max_age
				</TabButton>
				<TabButton
					$active={selectedParameter === 'prompt'}
					onClick={() => setSelectedParameter('prompt')}
				>
					<FiUsers />
					prompt
				</TabButton>
				<TabButton
					$active={selectedParameter === 'state'}
					onClick={() => setSelectedParameter('state')}
				>
					<FiShield />
					state
				</TabButton>
				<TabButton
					$active={selectedParameter === 'nonce'}
					onClick={() => setSelectedParameter('nonce')}
				>
					<FiLock />
					nonce
				</TabButton>
				<TabButton
					$active={selectedParameter === 'pkce'}
					onClick={() => setSelectedParameter('pkce')}
				>
					<FiCheckCircle />
					PKCE
				</TabButton>
				<TabButton
					$active={selectedParameter === 'resource'}
					onClick={() => setSelectedParameter('resource')}
				>
					<FiGlobe />
					resource
				</TabButton>
				<TabButton
					$active={selectedParameter === 'login_hint'}
					onClick={() => setSelectedParameter('login_hint')}
				>
					<FiUsers />
					login_hint
				</TabButton>
			</ParameterTabs>

			<ComparisonContainer>
				<ScenarioCard variant="before">
					<ScenarioHeader variant="before">
						<HeaderIcon variant="before">
							<FiAlertCircle />
						</HeaderIcon>
						<div>
							<ScenarioTitle variant="before">❌ WITHOUT {selectedParameter}</ScenarioTitle>
							<div style={{ color: '#64748b', fontSize: '0.875rem' }}>See what goes wrong</div>
						</div>
					</ScenarioHeader>

					<Timeline>
						{scenario.before.events.map((event, index) => (
							<TimelineEvent key={index} type={event.type}>
								<EventTime>
									<FiClock size={14} />
									{event.time}
								</EventTime>
								<EventDescription>{event.description}</EventDescription>
							</TimelineEvent>
						))}
					</Timeline>

					<Impact type="negative">
						<ImpactTitle>💥 Security/UX Impact</ImpactTitle>
						<ImpactText>{scenario.before.impact}</ImpactText>
					</Impact>
				</ScenarioCard>

				<ScenarioCard variant="after">
					<ScenarioHeader variant="after">
						<HeaderIcon variant="after">
							<FiCheckCircle />
						</HeaderIcon>
						<div>
							<ScenarioTitle variant="after">✅ WITH {selectedParameter}</ScenarioTitle>
							<div style={{ color: '#64748b', fontSize: '0.875rem' }}>See how it protects</div>
						</div>
					</ScenarioHeader>

					<Timeline>
						{scenario.after.events.map((event, index) => (
							<TimelineEvent key={index} type={event.type}>
								<EventTime>
									<FiClock size={14} />
									{event.time}
								</EventTime>
								<EventDescription>{event.description}</EventDescription>
							</TimelineEvent>
						))}
					</Timeline>

					<Impact type="positive">
						<ImpactTitle>✨ Protected by {selectedParameter}</ImpactTitle>
						<ImpactText>{scenario.after.impact}</ImpactText>
					</Impact>
				</ScenarioCard>
			</ComparisonContainer>

			{scenario.code && (
				<div>
					<h3 style={{ color: '#1e293b', marginBottom: '1rem' }}>💻 Implementation Code</h3>
					<CodeBlock>{scenario.code}</CodeBlock>
				</div>
			)}

			<div
				style={{
					marginTop: '2rem',
					padding: '1.5rem',
					background: 'white',
					borderRadius: '0.75rem',
					border: '2px solid #3b82f6',
				}}
			>
				<div
					style={{
						color: '#1e293b',
						fontWeight: 600,
						marginBottom: '0.5rem',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
				>
					<FiCheckCircle style={{ color: '#3b82f6' }} />
					Key Takeaway
				</div>
				<div style={{ color: '#475569', lineHeight: '1.6' }}>
					OAuth parameters aren't just "nice to have" — they're critical security controls. Each one
					prevents a specific attack or improves user experience. Always use them in production!
				</div>
			</div>
		</VisualizerContainer>
	);
};

export default ParameterImpactVisualizer;
