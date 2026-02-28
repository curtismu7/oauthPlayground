// src/components/SecurityThreatTheater.tsx
/**
 * Security Threat Theater
 * Interactive attack simulations showing what happens when security parameters are missing
 */

import React, { useCallback, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiMonitor,
	FiPlay,
	FiRefreshCw,
	FiShield,
	FiUnlock,
	FiUser,
	FiXCircle,
} from '@icons';
import styled, { keyframes } from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

const TheaterContainer = styled.div`
	background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
	box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
	border: 2px solid #1d4ed8;
`;

const Title = styled.h2`
	color: #f1f5f9;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.75rem;
`;

const Subtitle = styled.p`
	color: #cbd5e1;
	margin: 0 0 2rem 0;
	font-size: 1.05rem;
	line-height: 1.6;
`;

const AttackSelector = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin-bottom: 2rem;
`;

const AttackCard = styled.button<{ $selected: boolean }>`
	background: ${({ $selected }) =>
		$selected
			? 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)'
			: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'};
	border: 2px solid ${({ $selected }) => ($selected ? '#1d4ed8' : '#475569')};
	border-radius: 0.75rem;
	padding: 1.5rem;
	cursor: pointer;
	transition: all 0.2s;
	text-align: left;

	&:hover {
		transform: translateY(-4px);
		border-color: #1d4ed8;
		box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
	}
`;

const AttackIcon = styled.div`
	font-size: 2rem;
	margin-bottom: 0.75rem;
`;

const AttackTitle = styled.div`
	color: #f1f5f9;
	font-weight: 700;
	font-size: 1.1rem;
	margin-bottom: 0.5rem;
`;

const AttackDescription = styled.div`
	color: #94a3b8;
	font-size: 0.9rem;
	line-height: 1.5;
`;

const SeasonBadge = styled.span<{ $season: 'season1' | 'season2' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.25rem 0.6rem;
	border-radius: 999px;
	font-size: 0.75rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: ${({ $season }) => ($season === 'season2' ? '#fbbf24' : '#93c5fd')};
	background: ${({ $season }) =>
		$season === 'season2' ? 'rgba(250, 204, 21, 0.12)' : 'rgba(59, 130, 246, 0.12)'};
`;

const SimulationArea = styled.div`
	background: #0f172a;
	border-radius: 0.75rem;
	padding: 2rem;
	margin-bottom: 2rem;
	border: 2px solid #334155;
	min-height: 400px;
`;

const ControlBar = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`;

const SimulationButton = styled.button<{ variant?: 'primary' | 'danger' | 'success' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	border: none;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;
	background: ${({ variant }) => {
		switch (variant) {
			case 'danger':
				return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
			case 'success':
				return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
			default:
				return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
		}
	}};
	color: white;

	&:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const pulse = keyframes`
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
`;

const Actor = styled.div<{ role: 'user' | 'attacker' | 'server'; $active?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	padding: 1.5rem;
	background: ${({ role }) => {
		switch (role) {
			case 'user':
				return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
			case 'attacker':
				return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
			case 'server':
				return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
		}
	}};
	border-radius: 0.75rem;
	border: 3px solid ${({ role, $active }) => {
		if ($active) return '#fbbf24';
		switch (role) {
			case 'user':
				return '#60a5fa';
			case 'attacker':
				return '#f87171';
			case 'server':
				return '#34d399';
		}
	}};
	animation: ${({ $active }) => ($active ? pulse : 'none')} 1.5s ease-in-out infinite;
	flex: 1;
	min-width: 150px;
`;

const ActorIcon = styled.div`
	font-size: 3rem;
	color: white;
`;

const ActorLabel = styled.div`
	color: white;
	font-weight: 700;
	font-size: 1.1rem;
	text-align: center;
`;

const ActorStatus = styled.div`
	color: #e2e8f0;
	font-size: 0.875rem;
	text-align: center;
	min-height: 40px;
`;

const ActorsContainer = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	justify-content: space-around;
`;

const EventLog = styled.div`
	background: #1e293b;
	border-radius: 0.5rem;
	padding: 1rem;
	max-height: 300px;
	overflow-y: auto;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
`;

const LogEntry = styled.div<{ type: 'info' | 'warning' | 'danger' | 'success' }>`
	padding: 0.5rem;
	margin-bottom: 0.5rem;
	border-left: 3px solid ${({ type }) => {
		switch (type) {
			case 'danger':
				return '#ef4444';
			case 'warning':
				return '#f59e0b';
			case 'success':
				return '#10b981';
			default:
				return '#3b82f6';
		}
	}};
	color: ${({ type }) => {
		switch (type) {
			case 'danger':
				return '#fca5a5';
			case 'warning':
				return '#fbbf24';
			case 'success':
				return '#6ee7b7';
			default:
				return '#93c5fd';
		}
	}};
	background: rgba(0, 0, 0, 0.3);
	border-radius: 0.25rem;
`;

const Outcome = styled.div<{ success: boolean }>`
	margin-top: 2rem;
	padding: 2rem;
	border-radius: 0.75rem;
	background: ${({ success }) =>
		success
			? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
			: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'};
	border: 3px solid ${({ success }) => (success ? '#10b981' : '#ef4444')};
`;

const OutcomeTitle = styled.div<{ success: boolean }>`
	font-size: 1.5rem;
	font-weight: 700;
	color: ${({ success }) => (success ? '#065f46' : '#991b1b')};
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const OutcomeText = styled.div`
	color: #1e293b;
	font-size: 1.05rem;
	line-height: 1.7;
`;

const MitigationBox = styled.div`
	margin-top: 1rem;
	padding: 1rem;
	background: rgba(59, 130, 246, 0.1);
	border-left: 4px solid #3b82f6;
	border-radius: 0.375rem;
`;

const CodeExample = styled.pre`
	background: #1e293b;
	color: #f1f5f9;
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
	margin-top: 1rem;
`;

type AttackType =
	| 'csrf'
	| 'token-replay'
	| 'code-interception'
	| 'session-hijack'
	| 'refresh-token-theft'
	| 'redirectless-abuse'
	| 'par-impersonation';

interface LogMessage {
	type: 'info' | 'warning' | 'danger' | 'success';
	message: string;
	timestamp: number;
}

interface AttackScenario {
	id: AttackType;
	icon: string;
	title: string;
	description: string;
	season?: 'season1' | 'season2';
	withoutDefense: {
		steps: Array<{
			actor: 'user' | 'attacker' | 'server';
			action: string;
			delay: number;
		}>;
		outcome: string;
		severity: 'critical' | 'high' | 'medium';
	};
	withDefense: {
		parameter: string;
		steps: Array<{
			actor: 'user' | 'attacker' | 'server';
			action: string;
			delay: number;
		}>;
		outcome: string;
	};
	mitigation: {
		parameter: string;
		code: string;
		explanation: string;
	};
}

const ATTACK_SCENARIOS: Record<AttackType, AttackScenario> = {
	csrf: {
		id: 'csrf',
		icon: '🎣',
		title: 'CSRF Attack',
		description:
			'Cross-Site Request Forgery - attacker tricks user into authenticating with malicious OAuth request',
		withoutDefense: {
			steps: [
				{ actor: 'user', action: 'Victim visits attacker.com', delay: 1000 },
				{
					actor: 'attacker',
					action: 'Attacker initiates OAuth flow with THEIR state',
					delay: 1500,
				},
				{ actor: 'user', action: 'Victim completes authentication', delay: 2000 },
				{
					actor: 'attacker',
					action: "Victim's account linked to attacker's OAuth profile!",
					delay: 1500,
				},
				{
					actor: 'server',
					action: 'Server accepts the request - NO state validation',
					delay: 1000,
				},
			],
			outcome: "💀 BREACH: Attacker can now access victim's data. Account compromise!",
			severity: 'critical',
		},
		withDefense: {
			parameter: 'state',
			steps: [
				{
					actor: 'user',
					action: 'User initiates OAuth (state=abc123 generated & stored)',
					delay: 1000,
				},
				{
					actor: 'attacker',
					action: 'Attacker intercepts and replaces state with xyz789',
					delay: 1500,
				},
				{ actor: 'user', action: 'User completes authentication', delay: 2000 },
				{
					actor: 'server',
					action: 'Server checks: returned xyz789 ≠ expected abc123',
					delay: 1500,
				},
				{ actor: 'server', action: '🛡️ REJECTED! CSRF detected. User safe!', delay: 1000 },
			],
			outcome: '✅ PROTECTED: State parameter validation blocked the CSRF attack!',
		},
		mitigation: {
			parameter: 'state',
			code: `// Generate & store state before redirect
const state = crypto.randomBytes(32).toString('hex');
sessionStorage.setItem('oauth_state', state);

// Include in authorization request
const authUrl = \`\${authEndpoint}?
  client_id=\${clientId}
  &state=\${state}
  &redirect_uri=\${redirectUri}\`;

// VALIDATE on callback
const returned = new URLSearchParams(location.search).get('state');
if (returned !== sessionStorage.getItem('oauth_state')) {
  throw new Error('CSRF attack detected!');
}`,
			explanation:
				'The state parameter acts as a CSRF token. Generate a random value, store it securely, send it with the auth request, and ALWAYS validate it on callback. Any mismatch indicates an attack.',
		},
	},
	'token-replay': {
		id: 'token-replay',
		icon: '🔄',
		title: 'ID Token Replay Attack',
		description: 'Attacker steals and reuses an ID token to impersonate the user',
		withoutDefense: {
			steps: [
				{ actor: 'user', action: 'User authenticates and receives ID token', delay: 1000 },
				{ actor: 'attacker', action: '😈 Intercepts ID token from network traffic', delay: 1500 },
				{ actor: 'attacker', action: 'Replays stolen ID token in their own session', delay: 2000 },
				{ actor: 'server', action: 'Server accepts token - no replay protection', delay: 1500 },
				{ actor: 'attacker', action: '💀 Successfully authenticated as victim!', delay: 1000 },
			],
			outcome: '💀 BREACH: Attacker impersonated user with replayed ID token!',
			severity: 'high',
		},
		withDefense: {
			parameter: 'nonce',
			steps: [
				{
					actor: 'user',
					action: 'OAuth request includes nonce=xyz123 (stored in session)',
					delay: 1000,
				},
				{
					actor: 'server',
					action: 'ID token includes nonce claim: "nonce": "xyz123"',
					delay: 1500,
				},
				{ actor: 'attacker', action: '😈 Steals ID token and tries to replay it', delay: 2000 },
				{
					actor: 'server',
					action: "App checks: token nonce ≠ attacker's session nonce",
					delay: 1500,
				},
				{ actor: 'server', action: '🛡️ REJECTED! Replay attack blocked!', delay: 1000 },
			],
			outcome: '✅ PROTECTED: Nonce ensures each ID token is tied to a specific request!',
		},
		mitigation: {
			parameter: 'nonce',
			code: `// Generate nonce for each auth request
const nonce = crypto.randomBytes(32).toString('hex');
sessionStorage.setItem('oauth_nonce', nonce);

// Include in auth request
const authUrl = \`\${authEndpoint}?
  response_type=id_token  // or 'code id_token'
  &nonce=\${nonce}
  &client_id=\${clientId}\`;

// Validate nonce in received ID token
const idToken = jwt.decode(tokens.id_token);
const expected = sessionStorage.getItem('oauth_nonce');

if (idToken.nonce !== expected) {
  throw new Error('ID token replay detected!');
}

// Generate NEW nonce for EVERY auth request`,
			explanation:
				'The nonce (number used once) binds an ID token to a specific authentication request. Even if a token is stolen, it can only be used in the session it was issued for.',
		},
	},
	'code-interception': {
		id: 'code-interception',
		icon: '📱',
		title: 'Authorization Code Interception',
		description: 'Attacker intercepts authorization code on mobile/SPA and exchanges it for tokens',
		withoutDefense: {
			steps: [
				{ actor: 'user', action: 'Mobile app initiates OAuth flow', delay: 1000 },
				{ actor: 'server', action: 'Returns authorization code to app', delay: 1500 },
				{ actor: 'attacker', action: '😈 Intercepts code from callback URL', delay: 2000 },
				{
					actor: 'attacker',
					action: 'Exchanges code for tokens (no client_secret in mobile!)',
					delay: 1500,
				},
				{ actor: 'attacker', action: "💀 Has access token! Can access victim's APIs", delay: 1000 },
			],
			outcome: "💀 BREACH: Mobile apps can't protect client secrets. Code stolen = tokens stolen!",
			severity: 'critical',
		},
		withDefense: {
			parameter: 'PKCE',
			steps: [
				{ actor: 'user', action: 'App generates code_verifier + code_challenge', delay: 1000 },
				{ actor: 'user', action: 'Auth request includes code_challenge', delay: 1500 },
				{ actor: 'attacker', action: '😈 Intercepts authorization code', delay: 2000 },
				{
					actor: 'attacker',
					action: 'Tries to exchange code (missing code_verifier)',
					delay: 1500,
				},
				{ actor: 'server', action: '🛡️ REJECTED! code_challenge validation failed', delay: 1000 },
			],
			outcome: '✅ PROTECTED: PKCE makes authorization code useless without code_verifier!',
		},
		mitigation: {
			parameter: 'PKCE (code_challenge + code_verifier)',
			code: `// Step 1: Generate PKCE pair
const codeVerifier = crypto.randomBytes(32).toString('hex');
const hash = crypto.createHash('sha256').update(codeVerifier).digest();
const codeChallenge = base64url(hash);

// Step 2: Auth request with code_challenge
const authUrl = \`\${authEndpoint}?
  code_challenge=\${codeChallenge}
  &code_challenge_method=S256
  &client_id=\${clientId}\`;

// Step 3: Token exchange includes code_verifier
const tokenReq = await fetch(tokenEndpoint, {
  method: 'POST',
  body: new URLSearchParams({
    code: authCode,
    code_verifier: codeVerifier,  // Proves you initiated flow
    client_id: clientId,
  }),
});

// Server validates: SHA256(code_verifier) === code_challenge`,
			explanation:
				'PKCE (Proof Key for Code Exchange) prevents authorization code interception. Even if the code is stolen, tokens cannot be obtained without the code_verifier, which never leaves the device.',
		},
	},
	'session-hijack': {
		id: 'session-hijack',
		icon: '⏱️',
		title: 'Session Hijacking',
		description: 'Attacker gains access to unattended device with active session',
		withoutDefense: {
			steps: [
				{ actor: 'user', action: 'User logs in at 10:00 AM at coffee shop', delay: 1000 },
				{
					actor: 'user',
					action: '🚶 User leaves laptop open and walks away at 10:30 AM',
					delay: 1500,
				},
				{
					actor: 'attacker',
					action: '😈 Attacker sits down at 11:00 AM (30 min later)',
					delay: 2000,
				},
				{
					actor: 'attacker',
					action: 'Still logged in! No re-authentication required',
					delay: 1500,
				},
				{ actor: 'attacker', action: '💀 Accesses sensitive data for hours', delay: 1000 },
			],
			outcome: '💀 BREACH: Session stayed active indefinitely. Data exposed!',
			severity: 'high',
		},
		withDefense: {
			parameter: 'max_age',
			steps: [
				{ actor: 'user', action: 'Logs in with max_age=300 (5 minutes)', delay: 1000 },
				{ actor: 'user', action: '🚶 Leaves laptop at 10:30 AM', delay: 1500 },
				{ actor: 'attacker', action: '😈 Attacker accesses laptop at 11:00 AM', delay: 2000 },
				{ actor: 'server', action: 'Checks: last auth 30 min ago > max_age (5 min)', delay: 1500 },
				{ actor: 'server', action: '🛡️ Forces re-login! Session expired', delay: 1000 },
			],
			outcome: '✅ PROTECTED: max_age limited session lifetime. Attacker sees login screen!',
		},
		mitigation: {
			parameter: 'max_age',
			code: `// Set max authentication age (in seconds)
const authUrl = \`\${authEndpoint}?
  max_age=300  // 5 minutes for high-security
  &client_id=\${clientId}
  &response_type=code
  &scope=openid\`;

// Server includes auth_time in ID token
// Client validates authentication freshness
const idToken = jwt.decode(tokens.id_token);
const authAge = Date.now()/1000 - idToken.auth_time;

if (authAge > 300) {
  // Force re-authentication
  console.log('Auth too old, re-authenticating...');
  redirectToAuth({ max_age: 300 });
}

// Recommended: 5-15 min for banking, 60 min for general apps`,
			explanation:
				"max_age limits how old the user's authentication can be. If the last authentication exceeds this age, the user must re-authenticate. Critical for high-security operations and shared devices.",
		},
	},
	'refresh-token-theft': {
		id: 'refresh-token-theft',
		icon: '🧪',
		title: 'Refresh Token Theft',
		description: 'Compromised SPA or malware steals long-lived refresh token stored in browser',
		season: 'season2',
		withoutDefense: {
			steps: [
				{
					actor: 'user',
					action: 'SPA stores refresh_token in localStorage for convenience',
					delay: 1000,
				},
				{
					actor: 'attacker',
					action: '😈 Injects malicious script via XSS vulnerability',
					delay: 1500,
				},
				{ actor: 'attacker', action: 'Copies refresh_token value from storage', delay: 2000 },
				{ actor: 'attacker', action: 'Uses stolen refresh token on their own device', delay: 2000 },
				{ actor: 'server', action: '✅ Issues new access tokens again and again', delay: 1500 },
			],
			outcome: '💀 BREACH: Attacker holds long-lived access. Complete account takeover.',
			severity: 'critical',
		},
		withDefense: {
			parameter: 'Refresh Token Rotation',
			steps: [
				{
					actor: 'server',
					action: 'Refresh tokens stored server-side only (httpOnly cookie)',
					delay: 1000,
				},
				{
					actor: 'server',
					action: 'Enables PingOne refresh token rotation + reuse detection',
					delay: 1500,
				},
				{ actor: 'attacker', action: '😈 Steals previous refresh_token', delay: 2000 },
				{
					actor: 'server',
					action: 'Detects reuse, revokes session + triggers MFA challenge',
					delay: 2000,
				},
				{ actor: 'user', action: 'Receives alert + forced re-authentication', delay: 1500 },
			],
			outcome: '✅ PROTECTED: Reuse detection kills stolen token instantly and alerts user.',
		},
		mitigation: {
			parameter: 'Refresh Token Rotation',
			code: `// Enable refresh token rotation when exchanging code
const response = await fetch(tokenEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id,
    client_secret,
    // PingOne Tenant → Policies → Refresh Token → enable rotation + reuse detection
  }),
});

const tokens = await response.json();
// Store refresh token httpOnly server-side only!
setSecureCookie('refresh_token', tokens.refresh_token, { httpOnly: true, sameSite: 'strict' });

// Detect reuse
app.use(async (req, res, next) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) return next();

  const introspection = await pingOne.introspectRefreshToken(refreshToken);
  if (introspection.reused) {
    await pingOne.revokeSession(introspection.session.id);
    throw new Error('Refresh token reuse detected. Session revoked.');
  }
  next();
});`,
			explanation:
				'Never store refresh tokens in browser storage. Use server-side storage + rotation. PingOne refresh token rotation issues one-time tokens and revokes sessions when reuse is detected — stopping long-lived compromise.',
		},
	},
	'redirectless-abuse': {
		id: 'redirectless-abuse',
		icon: '🛰️',
		title: 'Redirectless Resume Hijack',
		description: 'Attacker replays stolen resume payload to finish victim’s redirectless login',
		season: 'season2',
		withoutDefense: {
			steps: [
				{
					actor: 'server',
					action: 'PingOne sends JSON {resumeUrl, code, state} to SPA',
					delay: 1000,
				},
				{
					actor: 'attacker',
					action: '😈 Intercepts network response via compromised browser extension',
					delay: 1800,
				},
				{
					actor: 'attacker',
					action: 'Posts resume payload to resumeUrl before the real app',
					delay: 2000,
				},
				{ actor: 'server', action: 'Issues tokens to attacker channel', delay: 1500 },
				{ actor: 'user', action: 'Victim app sees flow expired error', delay: 1200 },
			],
			outcome: '💀 BREACH: Redirectless flow finalized by attacker. Victim loses session.',
			severity: 'high',
		},
		withDefense: {
			parameter: 'resumeId + state validation',
			steps: [
				{
					actor: 'server',
					action: 'Encrypts resume payload and stores with session nonce',
					delay: 1000,
				},
				{ actor: 'attacker', action: '😈 Replays stolen payload', delay: 2000 },
				{
					actor: 'server',
					action: 'Validates resumeId + nonce mismatch, blocks request',
					delay: 1800,
				},
				{ actor: 'server', action: 'Real user resumes flow, validation succeeds', delay: 1800 },
				{ actor: 'server', action: '🛡️ Issues tokens to legitimate channel only', delay: 1500 },
			],
			outcome: '✅ PROTECTED: Replay blocked because resume payload bound to session identity.',
		},
		mitigation: {
			parameter: 'resumeId + state validation',
			code: `// Store resume payload securely
const resume = await RedirectlessAuthService.handlePendingResume();
sessionStorage.setItem('redirectless_flow', JSON.stringify({
  resumeUrl: resume.resumeUrl,
  state: resume.state,
  nonce: crypto.randomUUID(),
}));

// When resuming
const saved = JSON.parse(sessionStorage.getItem('redirectless_flow') ?? '{}');
if (saved.state !== returnedState) {
  throw new Error('State mismatch on resume');
}

// Include nonce binding for backend validation
await fetch('/api/redirectless/resume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resumeUrl: saved.resumeUrl,
    nonce: saved.nonce,
    expectedState: saved.state,
  }),
});`,
			explanation:
				'Bind PingOne redirectless resume payloads to your SPA session using state + nonce. Validate both server-side before resuming the flow. If an attacker replays the JSON payload elsewhere, validation fails and tokens are never issued.',
		},
	},
	'par-impersonation': {
		id: 'par-impersonation',
		icon: '🚀',
		title: 'Pushed Authorization Request Impersonation',
		description: 'Attacker registers PAR without signed client assertion and hijacks request URI',
		season: 'season2',
		withoutDefense: {
			steps: [
				{ actor: 'server', action: 'Client posts PAR without client authentication', delay: 1000 },
				{
					actor: 'attacker',
					action: '😈 Crafts own PAR pointing to malicious redirect_uri',
					delay: 1800,
				},
				{ actor: 'attacker', action: 'Reuses request_uri from honest client', delay: 2000 },
				{ actor: 'server', action: 'Redirects user to attacker redirect_uri', delay: 1500 },
				{
					actor: 'attacker',
					action: '💀 Receives authorization code meant for victim app',
					delay: 1500,
				},
			],
			outcome: '💀 BREACH: Unsigned PAR lets attacker impersonate legitimate request URI.',
			severity: 'high',
		},
		withDefense: {
			parameter: 'client_assertion (private_key_jwt)',
			steps: [
				{
					actor: 'server',
					action: 'Signs PAR with private key (kid registered in PingOne)',
					delay: 1000,
				},
				{ actor: 'attacker', action: '😈 Attempts to replay request_uri', delay: 2000 },
				{ actor: 'server', action: 'Verifies signature against client', delay: 1500 },
				{ actor: 'server', action: '🛡️ Rejects unsigned or mismatched request_uri', delay: 1500 },
				{ actor: 'user', action: 'Completes flow safely with original redirect_uri', delay: 1200 },
			],
			outcome: '✅ PROTECTED: Signed PAR locks request_uri to your client identity.',
		},
		mitigation: {
			parameter: 'client_assertion (private_key_jwt)',
			code: `// Create signed JWT for PAR (private_key_jwt)
import { SignJWT } from 'jose';

const assertion = await new SignJWT({
  iss: clientId,
  sub: clientId,
  aud: \`https://auth.pingone.com/\${envId}/as/par\`,
  jti: crypto.randomUUID(),
})
  .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: signingKeyId })
  .setIssuedAt()
  .setExpirationTime('5m')
  .sign(privateKey);

// Submit PAR
await fetch(\`https://auth.pingone.com/\${envId}/as/par\`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: clientId,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: assertion,
    response_type: 'code',
    redirect_uri,
    scope: 'openid profile',
  }),
});`,
			explanation:
				'Always authenticate Pushed Authorization Requests with private_key_jwt. PingOne verifies the signature, ensuring only your client can issue request_uri values. Attackers cannot forge or replay them without your key.',
		},
	},
};

const SecurityThreatTheater: React.FC = () => {
	const [selectedAttack, setSelectedAttack] = useState<AttackType>('csrf');
	const [isSimulating, setIsSimulating] = useState(false);
	const [simulationMode, setSimulationMode] = useState<'vulnerable' | 'protected' | null>(null);
	const [activeActor, setActiveActor] = useState<'user' | 'attacker' | 'server' | null>(null);
	const [logs, setLogs] = useState<LogMessage[]>([]);
	const [showOutcome, setShowOutcome] = useState(false);

	const scenario = ATTACK_SCENARIOS[selectedAttack];

	const addLog = useCallback((type: LogMessage['type'], message: string) => {
		setLogs((prev) => [...prev, { type, message, timestamp: Date.now() }]);
	}, []);

	const runSimulation = useCallback(
		async (mode: 'vulnerable' | 'protected') => {
			setIsSimulating(true);
			setSimulationMode(mode);
			setShowOutcome(false);
			setLogs([]);

			const steps =
				mode === 'vulnerable' ? scenario.withoutDefense.steps : scenario.withDefense.steps;

			addLog(
				'info',
				`🎬 Starting ${mode === 'vulnerable' ? 'VULNERABLE' : 'PROTECTED'} simulation...`
			);

			if (mode === 'protected') {
				addLog('success', `🛡️ Defense enabled: ${scenario.mitigation.parameter}`);
			} else {
				addLog('warning', `⚠️ No ${scenario.mitigation.parameter} protection`);
			}

			for (let i = 0; i < steps.length; i++) {
				const step = steps[i];
				await new Promise((resolve) => setTimeout(resolve, step.delay));

				setActiveActor(step.actor);

				const logType =
					step.action.includes('💀') || step.action.includes('😈')
						? 'danger'
						: step.action.includes('🛡️') || step.action.includes('✅')
							? 'success'
							: step.action.includes('⚠️')
								? 'warning'
								: 'info';

				addLog(logType, `[${step.actor.toUpperCase()}] ${step.action}`);
			}

			setActiveActor(null);
			await new Promise((resolve) => setTimeout(resolve, 500));
			setShowOutcome(true);
			setIsSimulating(false);

			if (mode === 'protected') {
				v4ToastManager.showSuccess('Attack blocked by security parameter!');
			} else {
				v4ToastManager.showError('Security breach demonstrated!');
			}
		},
		[scenario, addLog]
	);

	const resetSimulation = useCallback(() => {
		setIsSimulating(false);
		setSimulationMode(null);
		setActiveActor(null);
		setLogs([]);
		setShowOutcome(false);
	}, []);

	return (
		<TheaterContainer>
			<Title>
				<FiAlertTriangle size={32} style={{ color: '#fbbf24' }} />
				Security Threat Theater
			</Title>
			<Subtitle>
				🎭 Watch real OAuth attacks in action. See EXACTLY what happens when security parameters are
				missing, and how they protect against attacks.
			</Subtitle>

			<AttackSelector>
				{(Object.keys(ATTACK_SCENARIOS) as AttackType[]).map((attackType) => {
					const attack = ATTACK_SCENARIOS[attackType];
					return (
						<AttackCard
							key={attackType}
							$selected={selectedAttack === attackType}
							onClick={() => {
								setSelectedAttack(attackType);
								resetSimulation();
							}}
						>
							<AttackIcon>{attack.icon}</AttackIcon>
							{attack.season ? (
								<SeasonBadge $season={attack.season}>
									{attack.season === 'season2' ? 'Season 2' : 'Season 1'}
								</SeasonBadge>
							) : null}
							<AttackTitle>{attack.title}</AttackTitle>
							<AttackDescription>{attack.description}</AttackDescription>
						</AttackCard>
					);
				})}
			</AttackSelector>

			<SimulationArea>
				<ControlBar>
					<SimulationButton
						variant="danger"
						onClick={() => runSimulation('vulnerable')}
						disabled={isSimulating}
					>
						<FiPlay />
						Run Vulnerable Scenario
					</SimulationButton>
					<SimulationButton
						variant="success"
						onClick={() => runSimulation('protected')}
						disabled={isSimulating}
					>
						<FiShield />
						Run Protected Scenario
					</SimulationButton>
					<SimulationButton onClick={resetSimulation} disabled={isSimulating}>
						<FiRefreshCw />
						Reset
					</SimulationButton>
				</ControlBar>

				<ActorsContainer>
					<Actor $active={activeActor === 'user'}>
						<ActorIcon>
							<FiUser />
						</ActorIcon>
						<ActorLabel>👤 User</ActorLabel>
						<ActorStatus>{activeActor === 'user' ? '🔄 Acting...' : 'Waiting...'}</ActorStatus>
					</Actor>

					<Actor $active={activeActor === 'attacker'}>
						<ActorIcon>
							<FiUnlock />
						</ActorIcon>
						<ActorLabel>😈 Attacker</ActorLabel>
						<ActorStatus>
							{activeActor === 'attacker' ? '💀 Attacking...' : 'Waiting...'}
						</ActorStatus>
					</Actor>

					<Actor $active={activeActor === 'server'}>
						<ActorIcon>
							<FiMonitor />
						</ActorIcon>
						<ActorLabel>🖥️ Server</ActorLabel>
						<ActorStatus>{activeActor === 'server' ? '⚙️ Processing...' : 'Waiting...'}</ActorStatus>
					</Actor>
				</ActorsContainer>

				{logs.length > 0 && (
					<div>
						<div
							style={{
								color: '#f1f5f9',
								fontWeight: 600,
								marginBottom: '0.75rem',
								fontSize: '1.1rem',
							}}
						>
							📊 Event Log:
						</div>
						<EventLog>
							{logs.map((log, index) => (
								<LogEntry key={index} type={log.type}>
									{log.message}
								</LogEntry>
							))}
						</EventLog>
					</div>
				)}
			</SimulationArea>

			{showOutcome && simulationMode && (
				<Outcome success={simulationMode === 'protected'}>
					<OutcomeTitle success={simulationMode === 'protected'}>
						{simulationMode === 'protected' ? (
							<>
								<FiCheckCircle size={32} />
								Attack Blocked!
							</>
						) : (
							<>
								<FiXCircle size={32} />
								Security Breach!
							</>
						)}
					</OutcomeTitle>

					<OutcomeText>
						{simulationMode === 'vulnerable'
							? scenario.withoutDefense.outcome
							: scenario.withDefense.outcome}
					</OutcomeText>

					{simulationMode === 'protected' && (
						<MitigationBox>
							<div
								style={{
									fontWeight: 700,
									marginBottom: '0.75rem',
									color: '#1e293b',
									fontSize: '1.1rem',
								}}
							>
								🛡️ How {scenario.mitigation.parameter} Protected Us:
							</div>
							<div style={{ color: '#475569', marginBottom: '1rem', lineHeight: '1.6' }}>
								{scenario.mitigation.explanation}
							</div>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
								💻 Implementation:
							</div>
							<CodeExample>{scenario.mitigation.code}</CodeExample>
						</MitigationBox>
					)}

					{simulationMode === 'vulnerable' && (
						<MitigationBox>
							<div
								style={{
									fontWeight: 700,
									marginBottom: '0.75rem',
									color: '#1e293b',
									fontSize: '1.1rem',
								}}
							>
								✅ How to Prevent This Attack:
							</div>
							<div style={{ color: '#475569', marginBottom: '1rem', lineHeight: '1.6' }}>
								<strong>Always use the {scenario.mitigation.parameter} parameter!</strong>{' '}
								{scenario.mitigation.explanation}
							</div>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
								💻 Add This Code:
							</div>
							<CodeExample>{scenario.mitigation.code}</CodeExample>
						</MitigationBox>
					)}
				</Outcome>
			)}

			<div
				style={{
					marginTop: '2rem',
					padding: '1.5rem',
					background: 'rgba(239, 68, 68, 0.1)',
					borderRadius: '0.75rem',
					border: '2px solid #ef4444',
				}}
			>
				<div
					style={{
						color: '#fca5a5',
						fontWeight: 700,
						marginBottom: '0.75rem',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
				>
					<FiAlertTriangle size={20} />
					Critical Security Warning
				</div>
				<div style={{ color: '#e2e8f0', lineHeight: '1.6', fontSize: '0.95rem' }}>
					These attacks are NOT theoretical — they happen in production every day. Security
					parameters like <code>state</code>, <code>nonce</code>, and <code>PKCE</code> are
					REQUIRED, not optional. Every parameter you skip is a vulnerability you introduce.
				</div>
			</div>
		</TheaterContainer>
	);
};

export default SecurityThreatTheater;
