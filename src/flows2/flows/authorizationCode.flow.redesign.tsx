// src/flows2/flows/authorizationCode.flow.redesign.tsx
//
// Authorization Code (+ PKCE) flow — redesigned with distinctive visual system.
// Signature: animated OAuth 2.0 flow diagram showing client → authz endpoint → user → token endpoint.
// Color: deep indigo + teal accent. Typography: IBM Plex Mono for headers.

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
import { CodeBlock, JsonView } from '../framework/CodeBlock';
import { ResultCard } from '../framework/ResultCard';
import { loadStash, saveStash } from '../framework/authzStash';
import type {
	FlowCredentials,
	FlowError,
	FlowMode,
	OAuthSpec,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import { authorizationCodeService, MOCK_REGISTERED_SECRET } from '../services/authorizationCodeService';


// Design tokens — new color system (deep indigo + teal accent)
const DESIGN = {
	primary: '#1e3a8a',        // Deep indigo
	accent: '#14b8a6',         // Electric teal
	success: '#10b981',        // Emerald (button)
	error: '#dc2626',
	neutral100: '#f9fafb',
	neutral200: '#f3f4f6',
	neutral300: '#e5e7eb',
	neutral600: '#4b5563',
	neutral900: '#111827',
};

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'App credentials' },
	{ id: 'pkce', title: 'PKCE', subtitle: 'Verifier + challenge' },
	{ id: 'authorize', title: 'Authorize', subtitle: 'Redirect to PingOne' },
	{ id: 'exchange', title: 'Exchange', subtitle: 'Code → tokens' },
	{ id: 'use', title: 'Use Tokens', subtitle: 'UserInfo + Introspect' },
];

// Signature element: animated flow diagram
const FlowDiagram = styled.div`
	background: linear-gradient(135deg, ${DESIGN.neutral100} 0%, #f0fdf4 100%);
	border: 2px solid ${DESIGN.accent};
	border-radius: 12px;
	padding: 2rem 1.5rem;
	margin: 1.5rem 0;
	font-family: 'IBM Plex Mono', monospace;
	position: relative;
	
	svg {
		width: 100%;
		height: auto;
	}
`;

const FlowLabel = styled.div`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.75rem;
	font-weight: 700;
	letter-spacing: 0.1em;
	color: ${DESIGN.primary};
	text-transform: uppercase;
	margin: 1rem 0 0.5rem 0;
`;

const Toggle = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
	margin-bottom: 1.5rem;
`;

const Pill = styled.button<{ $active: boolean }>`
	font-size: 0.82rem;
	font-weight: 600;
	padding: 0.4rem 0.9rem;
	border-radius: 8px;
	cursor: pointer;
	border: 2px solid ${({ $active }) => ($active ? DESIGN.accent : DESIGN.neutral300)};
	background: ${({ $active }) => ($active ? DESIGN.accent : DESIGN.neutral100)};
	color: ${({ $active }) => ($active ? '#fff' : DESIGN.primary)};
	transition: all 150ms ease;
	
	&:hover {
		border-color: ${DESIGN.accent};
	}
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const Action = styled.button`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.85rem;
	font-weight: 700;
	letter-spacing: 0.05em;
	padding: 0.7rem 1.4rem;
	border-radius: 8px;
	border: none;
	background: ${DESIGN.accent};
	color: #fff;
	cursor: pointer;
	transition: all 150ms ease;
	
	&:hover:not(:disabled) {
		background: #0d9488;
		transform: translateY(-1px);
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const Heading = styled.h3`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.95rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	color: ${DESIGN.primary};
	text-transform: uppercase;
	margin: 1.5rem 0 0.75rem 0;
	
	&:first-child {
		margin-top: 0;
	}
`;

const Note = styled.p`
	margin: 0;
	font-size: 0.82rem;
	line-height: 1.5;
	color: ${DESIGN.neutral600};
	background: ${DESIGN.neutral100};
	border-left: 3px solid ${DESIGN.accent};
	border-radius: 0 8px 8px 0;
	padding: 0.75rem 1rem;
	margin-bottom: 1rem;
`;

const defaultRedirectUri = () =>
	typeof window !== 'undefined' ? `${window.location.origin}/v2/flows/authz-callback` : '';

const MOCK_CREDS = {
	environmentId: 'mock-environment-id',
	clientId: 'mock-client-id',
	clientSecret: MOCK_REGISTERED_SECRET,
	redirectUri: defaultRedirectUri(),
	region: 'com',
};

const AuthorizationCodeFlowRedesign: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('mock');
	const [spec, setSpec] = useState<OAuthSpec>('2.1');
	const [oidc, setOidc] = useState(false);

	const [creds, setCreds] = useState<FlowCredentials>(loadStash() || MOCK_CREDS);
	const [pkceEnabled] = useState(true);
	const [verifier, setVerifier] = useState('');
	const [challenge, setChallenge] = useState('');
	const [authzResult, setAuthzResult] = useState<{ url: string; code?: string } | null>(null);
	const [exchangeResult, setExchangeResult] = useState<TokenResult | null>(null);
	const [userinfoResult, setUserinfoResult] = useState<Record<string, unknown> | null>(null);
	const [introspectResult, setIntrospectResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const updated = { ...creds, [k]: e.target.value };
		setCreds(updated);
		saveStash(updated);
	};

	const generatePkce = useCallback(async () => {
		const pair = await authorizationCodeService.generatePkce(mode);
		setVerifier(pair.codeVerifier);
		setChallenge(pair.codeChallenge);
		engine.markComplete('pkce');
		engine.goNext();
	}, [mode, engine]);

	const handleAuthorize = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await authorizationCodeService.authorize(
				{
					credentials: creds,
					pkce: pkceEnabled ? { verifier, challenge } : undefined,
					oidc,
					spec,
				},
				mode
			);
			setAuthzResult(result);
			engine.markComplete('authorize');
			engine.goNext();
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, pkceEnabled, verifier, challenge, oidc, spec, mode, engine]);

	const handleExchange = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await authorizationCodeService.exchange(
				{
					credentials: creds,
					code: authzResult?.code || 'mock-code',
					pkce: pkceEnabled ? { verifier } : undefined,
				},
				mode
			);
			setExchangeResult(result);
			engine.markComplete('exchange');
			engine.goNext();
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, authzResult, pkceEnabled, verifier, mode, engine]);

	const handleUserinfo = useCallback(async () => {
		if (!exchangeResult?.accessToken) return;
		try {
			const result = await authorizationCodeService.userinfo(exchangeResult.accessToken, creds, mode);
			setUserinfoResult(result);
		} catch (err) {
			setError(err as FlowError);
		}
	}, [exchangeResult, creds, mode]);

	const handleIntrospect = useCallback(async () => {
		if (!exchangeResult?.accessToken) return;
		try {
			const result = await authorizationCodeService.introspect(exchangeResult.accessToken, creds, mode);
			setIntrospectResult(result);
		} catch (err) {
			setError(err as FlowError);
		}
	}, [exchangeResult, creds, mode]);

	const configured = Boolean(creds.environmentId && creds.clientId && creds.redirectUri);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Authorization Code"
			spec={spec}
			mode={mode}
			subtitle="OAuth 2.0/2.1 Authorization Code flow with PKCE — the standard way to get access tokens on behalf of a user."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure Your App"
					explanation="Set up your OAuth application credentials. Real mode calls PingOne; mock mode runs offline."
					canPrev={false}
					onNext={engine.goNext}
					canNext={configured}
				>
					<Toggle>
						<Pill $active={mode === 'real'} onClick={() => setMode('real')}>
							Real PingOne
						</Pill>
						<Pill $active={mode === 'mock'} onClick={() => setMode('mock')}>
							Mock
						</Pill>
					</Toggle>

					<FlowDiagram>
						<FlowLabel>OAuth 2.0 Authorization Code Flow</FlowLabel>
						<svg viewBox="0 0 600 120" preserveAspectRatio="xMidYMid meet">
							{/* Client */}
							<rect x="10" y="30" width="80" height="60" fill={DESIGN.accent} rx="4" />
							<text x="50" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">
								Client
							</text>

							{/* Authz Endpoint */}
							<rect x="140" y="30" width="80" height="60" fill={DESIGN.primary} rx="4" />
							<text x="180" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">
								AuthZ
							</text>

							{/* User */}
							<rect x="270" y="30" width="80" height="60" fill={DESIGN.accent} rx="4" />
							<text x="310" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">
								User
							</text>

							{/* Token Endpoint */}
							<rect x="400" y="30" width="80" height="60" fill={DESIGN.primary} rx="4" />
							<text x="440" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">
								Token
							</text>

							{/* Arrows */}
							<path d="M 90 60 L 140 60" stroke={DESIGN.accent} strokeWidth="2" markerEnd="url(#arrowhead)" />
							<path d="M 220 60 L 270 60" stroke={DESIGN.accent} strokeWidth="2" markerEnd="url(#arrowhead)" />
							<path d="M 350 60 L 400 60" stroke={DESIGN.accent} strokeWidth="2" markerEnd="url(#arrowhead)" />
							<path d="M 440 95 L 440 110 L 50 110 L 50 95" stroke={DESIGN.neutral300} strokeWidth="1" />

							{/* Arrow marker */}
							<defs>
								<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
									<polygon points="0 0, 10 3, 0 6" fill={DESIGN.accent} />
								</marker>
							</defs>
						</svg>
					</FlowDiagram>

					<Heading>Credentials</Heading>
					<Grid>
						<FieldGroup
							label="Environment ID"
							value={creds.environmentId}
							onChange={set('environmentId')}
							placeholder="UUID"
						/>
						<FieldGroup label="Region" value={creds.region} onChange={set('region')} placeholder="com | eu | ca | asia" />
						<FieldGroup label="Client ID" value={creds.clientId} onChange={set('clientId')} placeholder="oauth client id" />
						<FieldGroup
							label="Client Secret"
							type="password"
							value={creds.clientSecret ?? ''}
							onChange={set('clientSecret')}
							placeholder="leave empty for public clients"
						/>
						<FieldGroup
							label="Redirect URI"
							value={creds.redirectUri}
							onChange={set('redirectUri')}
							placeholder="https://localhost:3000/callback"
						/>
					</Grid>

					<Heading>Spec & Options</Heading>
					<Toggle>
						<Pill $active={spec === '2.0'} onClick={() => setSpec('2.0')}>
							OAuth 2.0
						</Pill>
						<Pill $active={spec === '2.1'} onClick={() => setSpec('2.1')}>
							OAuth 2.1
						</Pill>
						<Pill $active={oidc} onClick={() => setOidc(!oidc)}>
							{oidc ? 'OIDC ✓' : 'OIDC'}
						</Pill>
					</Toggle>
				</FlowStep>
			)}

			{cur === 'pkce' && (
				<FlowStep
					title="2. Generate PKCE"
					explanation="Create a code verifier and challenge for additional security (required in OAuth 2.1, optional in 2.0)."
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(verifier && challenge)}
				>
					<Action onClick={generatePkce}>Generate PKCE Verifier & Challenge</Action>

					{verifier && challenge && (
						<>
							<Note>Code Verifier (keep secret, send to token endpoint): {verifier.substring(0, 20)}…</Note>
							<Note>Code Challenge (send to authorization endpoint): {challenge.substring(0, 20)}…</Note>
						</>
					)}
				</FlowStep>
			)}

			{cur === 'authorize' && (
				<FlowStep
					title="3. Redirect to Authorization Endpoint"
					explanation="The user logs in and grants permission. The authz endpoint redirects back with an authorization code."
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(authzResult)}
				>
					<Action onClick={handleAuthorize} disabled={loading}>
						{loading ? 'Authorizing…' : 'Authorize'}
					</Action>

					{authzResult && (
						<ResultCard title="Authorization URL" tone="ok">
							<CodeBlock value={authzResult.url} />
						</ResultCard>
					)}

					<FlowResult error={error} />
				</FlowStep>
			)}

			{cur === 'exchange' && (
				<FlowStep
					title="4. Exchange Code for Tokens"
					explanation="POST the authorization code (+ code verifier if PKCE) to the token endpoint. Receive access token."
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(exchangeResult)}
				>
					<Action onClick={handleExchange} disabled={loading}>
						{loading ? 'Exchanging…' : 'Exchange Code'}
					</Action>

					<FlowResult result={exchangeResult} error={error} />
				</FlowStep>
			)}

			{cur === 'use' && (
				<FlowStep title="5. Use the Access Token" explanation="Call downstream APIs (UserInfo, your own APIs) with the token." onPrev={engine.goPrev}>
					<Heading>UserInfo</Heading>
					<Action onClick={handleUserinfo} disabled={!exchangeResult?.accessToken}>
						Fetch UserInfo
					</Action>
					{userinfoResult && <JsonView data={userinfoResult} />}

					<Heading style={{ marginTop: '2rem' }}>Introspect Token</Heading>
					<Action onClick={handleIntrospect} disabled={!exchangeResult?.accessToken}>
						Introspect
					</Action>
					{introspectResult && <JsonView data={introspectResult} />}

					<FlowResult error={error} />
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default AuthorizationCodeFlowRedesign;
