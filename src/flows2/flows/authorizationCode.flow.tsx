// src/flows2/flows/authorizationCode.flow.tsx
//
// Authorization Code (+ PKCE) flow on the flows2 framework. Real PingOne or mock via the
// `mode` toggle; 2.0/2.1 and OIDC toggles. Version-free (no V9/V8U). ~300 LOC vs the
// legacy 1,268-LOC monolith it replaces.
//
// Visual system (adopted from the redesign): deep indigo + teal accent, IBM Plex Mono
// headers, and a signature animated flow diagram on the Configure step.

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
import { CodeBlock, JsonView } from '../framework/CodeBlock';
import { ResultCard } from '../framework/ResultCard';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { clearStash, loadStash, saveStash } from '../framework/authzStash';
import type {
	FlowCredentials,
	FlowError,
	FlowMode,
	OAuthSpec,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import { authorizationCodeService, MOCK_REGISTERED_SECRET } from '../services/authorizationCodeService';

const env = import.meta.env as Record<string, string | undefined>;

// Redesign palette — deep indigo + teal accent.
const DESIGN = {
	primary: '#1e3a8a', // Deep indigo
	accent: '#14b8a6', // Electric teal
	accentHover: '#0d9488',
	neutral100: '#f9fafb',
	neutral300: '#e5e7eb',
	neutral600: '#4b5563',
};

const STEPS: StepDefinition[] = [
	{
		id: 'configure',
		title: 'Configure',
		subtitle: 'App credentials',
		description: 'Enter your application credentials (Environment ID, Client ID, Secret) and redirect URI. These identify your app to the authorization server.',
	},
	{
		id: 'pkce',
		title: 'PKCE',
		subtitle: 'Verifier + challenge',
		description: 'Generate a code verifier and challenge for PKCE (Proof Key for Code Exchange). This adds security by binding the authorization code to your specific app instance.',
	},
	{
		id: 'authorize',
		title: 'Authorize',
		subtitle: 'Redirect to PingOne',
		description: 'Redirect user to PingOne\'s login page. User authenticates and grants your app permission to access their data. Returns an authorization code.',
	},
	{
		id: 'exchange',
		title: 'Exchange',
		subtitle: 'Code → tokens',
		description: 'Exchange the authorization code for tokens (Access Token, ID Token, Refresh Token). This happens securely in the backend—never expose tokens to the browser.',
	},
	{
		id: 'use',
		title: 'Use Tokens',
		subtitle: 'UserInfo + Introspect',
		description: 'Use the access token to call protected APIs. Optionally introspect tokens to verify their claims and expiration time.',
	},
];

const Toggle = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
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
	gap: 0.9rem;
	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const Action = styled.button`
	align-self: flex-start;
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
		background: ${DESIGN.accentHover};
		transform: translateY(-1px);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
`;

// Signature element: animated OAuth flow diagram on the Configure step.
const FlowDiagram = styled.div`
	background: linear-gradient(135deg, ${DESIGN.neutral100} 0%, #f0fdfa 100%);
	border: 2px solid ${DESIGN.accent};
	border-radius: 12px;
	padding: 1.5rem;
	margin: 0.5rem 0 0.5rem;
	svg {
		width: 100%;
		height: auto;
	}
`;

const FlowLabel = styled.div`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.12em;
	color: ${DESIGN.primary};
	text-transform: uppercase;
	margin-bottom: 0.75rem;
`;

const defaultRedirectUri = () =>
	typeof window !== 'undefined' ? `${window.location.origin}/v2/flows/authz-callback` : '';

// Realistic placeholders so the offline mock flow runs with zero PingOne setup
// and the displayed authorize/exchange request still looks complete.
const MOCK_CREDS = {
	environmentId: 'a1234567-b890-c123-d456-e7890f123456',
	region: 'com',
	clientId: 'mock-client-demo-1234567890',
	clientSecret: MOCK_REGISTERED_SECRET,
	scope: 'openid profile email offline_access',
} as const;

const AuthorizationCodeFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [spec, setSpec] = useState<OAuthSpec>('2.1');
	const [oidc, setOidc] = useState(true);
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_USER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_USER_CLIENT_SECRET || '',
		// Request offline_access so PingOne issues a refresh_token, which the
		// Refresh Token flow needs as its input. Users can edit this freely.
		scope: 'openid profile email offline_access',
	});
	const [redirectUri, setRedirectUri] = useState(defaultRedirectUri());
	const [pkce, setPkce] = useState<{ codeVerifier: string; codeChallenge: string } | null>(null);
	const [authState, setAuthState] = useState('');
	const [authUrl, setAuthUrl] = useState('');
	const [code, setCode] = useState('');
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [userInfoData, setUserInfoData] = useState<Record<string, unknown> | null>(null);
	const [introspectData, setIntrospectData] = useState<Record<string, unknown> | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const selectMode = useCallback((m: FlowMode) => {
		setMode(m);
	}, []);

	// Auto-populate mock credentials when mode changes; clear them when switching to real
	useEffect(() => {
		if (mode === 'mock') {
			setCreds((c) => ({
				...c,
				environmentId: c.environmentId || MOCK_CREDS.environmentId,
				region: c.region || MOCK_CREDS.region,
				clientId: c.clientId || MOCK_CREDS.clientId,
				clientSecret: c.clientSecret || MOCK_CREDS.clientSecret,
				scope: c.scope || MOCK_CREDS.scope,
			}));
		} else {
			setCreds((c) => ({
				...c,
				environmentId: c.environmentId === MOCK_CREDS.environmentId ? '' : c.environmentId,
				clientId: c.clientId === MOCK_CREDS.clientId ? '' : c.clientId,
				// coalesce to '' so clientSecret stays `string` (exactOptionalPropertyTypes)
				clientSecret: c.clientSecret === MOCK_CREDS.clientSecret ? '' : c.clientSecret ?? '',
				scope: c.scope === MOCK_CREDS.scope ? '' : c.scope,
			}));
		}
	}, [mode]);

	// Resume after a real redirect: the callback wrote the code into the stash.
	useEffect(() => {
		const stash = loadStash();
		if (!stash) return;
		clearStash();
		if (stash.error) {
			setError({ error: stash.error, error_description: stash.errorDescription });
			return;
		}
		if (stash.code) {
			setMode('real');
			setSpec(stash.spec);
			setOidc(stash.oidc);
			setCreds((c) => ({
				...c,
				environmentId: stash.environmentId,
				region: stash.region,
				clientId: stash.clientId,
				scope: stash.scope || '',
				// secret re-prefilled from env (not stashed)
				clientSecret: c.clientSecret || env.VITE_PINGONE_USER_CLIENT_SECRET || '',
			}));
			setRedirectUri(stash.redirectUri);
			setPkce({ codeVerifier: stash.codeVerifier, codeChallenge: '' });
			setAuthState(stash.state);
			setCode(stash.code);
			engine.goTo(3); // exchange step
		}
	}, [engine]);

	const handlePkce = useCallback(async () => {
		const pair = await authorizationCodeService.generatePkce(mode);
		setPkce({ codeVerifier: pair.codeVerifier, codeChallenge: pair.codeChallenge });
		engine.markComplete('pkce');
	}, [engine, mode]);

	const handleAuthorize = useCallback(async () => {
		setError(null);
		setLoading(true);
		try {
			let active = pkce;
			if (!active) {
				const pair = await authorizationCodeService.generatePkce(mode);
				active = { codeVerifier: pair.codeVerifier, codeChallenge: pair.codeChallenge };
				setPkce(active);
			}
			const state = crypto.randomUUID();
			const nonce = oidc ? crypto.randomUUID() : undefined;
			setAuthState(state);

			const res = await authorizationCodeService.authorize(
				{ credentials: creds, redirectUri, state, nonce, codeChallenge: active.codeChallenge, oidc },
				mode
			);

			if (mode === 'mock') {
				setCode(res.code || '');
				setAuthUrl('');
				engine.markComplete('authorize');
				engine.goTo(3); // exchange
			} else {
				// Capture spec at call time, not closure time, to ensure consistency with current UI state.
				const currentSpec = spec;
				// stash what we need to resume after the round-trip, then leave the SPA
				saveStash({
					state,
					nonce,
					codeVerifier: active.codeVerifier,
					oidc,
					spec: currentSpec,
					environmentId: creds.environmentId,
					region: creds.region,
					clientId: creds.clientId,
					redirectUri,
					scope: creds.scope,
				});
				setAuthUrl(res.url || '');
				if (res.url) window.location.assign(res.url);
			}
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [pkce, oidc, creds, redirectUri, mode, spec, engine]);

	const handleExchange = useCallback(async () => {
		if (!pkce || !code) return;
		setError(null);
		setLoading(true);
		try {
			const r = await authorizationCodeService.exchangeCode(
				{ credentials: creds, redirectUri, code, codeVerifier: pkce.codeVerifier, oidc },
				mode
			);
			setResult(r);
			engine.markComplete('exchange');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [pkce, code, creds, redirectUri, mode, engine]);

	const handleUserInfo = useCallback(async () => {
		if (!result?.accessToken) return;
		setUserInfoData(await authorizationCodeService.userInfo(result.accessToken, creds, mode));
	}, [result, creds, mode]);

	const handleIntrospect = useCallback(async () => {
		if (!result?.accessToken) return;
		setIntrospectData(await authorizationCodeService.introspect(result.accessToken, creds, mode));
	}, [result, creds, mode]);

	// Mock runs offline — never gate it on real credentials.
	const configured =
		mode === 'mock'
			? true
			: Boolean(creds.environmentId && creds.clientId && creds.clientSecret && redirectUri);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Authorization Code + PKCE"
			spec={spec}
			mode={mode}
			onModeChange={selectMode}
			subtitle={"🚀 Live update confirmed — Authorization Code + PKCE\nThe user authenticates at PingOne and is redirected back with a one-time code, which is exchanged (with the PKCE verifier) for tokens. RFC 6749 §4.1 + RFC 7636."}
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure"
					description={engine.current.description}
					explanation="Real mode runs against PingOne via the BFF; mock runs offline. 2.1 forces PKCE and exact redirect matching."
					canPrev={false}
					nextLabel="Continue"
					onNext={engine.goNext}
					canNext={configured}
				>
					<FlowDiagram>
						<FlowLabel>OAuth 2.0 Authorization Code Flow</FlowLabel>
						<svg viewBox="0 0 600 120" preserveAspectRatio="xMidYMid meet">
							<defs>
								<marker id="ac-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
									<polygon points="0 0, 10 3, 0 6" fill={DESIGN.accent} />
								</marker>
							</defs>
							<rect x="10" y="30" width="80" height="60" fill={DESIGN.accent} rx="4" />
							<text x="50" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">Client</text>
							<rect x="140" y="30" width="80" height="60" fill={DESIGN.primary} rx="4" />
							<text x="180" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">AuthZ</text>
							<rect x="270" y="30" width="80" height="60" fill={DESIGN.accent} rx="4" />
							<text x="310" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">User</text>
							<rect x="400" y="30" width="80" height="60" fill={DESIGN.primary} rx="4" />
							<text x="440" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">Token</text>
							<path d="M 90 60 L 140 60" stroke={DESIGN.accent} strokeWidth="2" markerEnd="url(#ac-arrow)" />
							<path d="M 220 60 L 270 60" stroke={DESIGN.accent} strokeWidth="2" markerEnd="url(#ac-arrow)" />
							<path d="M 350 60 L 400 60" stroke={DESIGN.accent} strokeWidth="2" markerEnd="url(#ac-arrow)" />
							<path d="M 440 95 L 440 110 L 50 110 L 50 95" stroke={DESIGN.neutral300} strokeWidth="1" fill="none" />
						</svg>
					</FlowDiagram>
					<Toggle>
						<Pill $active={spec === '2.0'} onClick={() => setSpec('2.0')}>OAuth 2.0</Pill>
						<Pill $active={spec === '2.1'} onClick={() => setSpec('2.1')}>OAuth 2.1</Pill>
						<Pill $active={oidc} onClick={() => setOidc((v) => !v)}>OIDC {oidc ? 'on' : 'off'}</Pill>
					</Toggle>
					<Grid>
						<FieldGroup label="Environment ID" value={creds.environmentId} onChange={set('environmentId')} />
						<FieldGroup label="Region" value={creds.region} onChange={set('region')} placeholder="com | eu | ca | asia" />
						<FieldGroup label="Client ID" value={creds.clientId} onChange={set('clientId')} />
						<FieldGroup label="Client Secret" type="password" value={creds.clientSecret ?? ''} onChange={set('clientSecret')} />
						<FieldGroup label="Redirect URI" value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} hint="Must be registered on the PingOne app" />
						<FieldGroup label="Scope (optional)" value={creds.scope ?? ''} onChange={set('scope')} placeholder={oidc ? 'openid profile email' : 'openid'} />
					</Grid>
				</FlowStep>
			)}

			{cur === 'pkce' && (
				<FlowStep
					title="2. Generate PKCE"
					description={engine.current.description}
					explanation="A high-entropy code_verifier is created and hashed (SHA-256) into the code_challenge sent on the authorization request. RFC 7636."
					nextLabel="Continue"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(pkce)}
				>
					<Action onClick={handlePkce}>Generate verifier + challenge</Action>
					{pkce && (
						<>
							<CodeBlock label="code_verifier" value={pkce.codeVerifier} />
							{pkce.codeChallenge && <CodeBlock label="code_challenge (S256)" value={pkce.codeChallenge} />}
						</>
					)}
					{mode === 'mock' && pkce?.codeChallenge && (
						<Note>
							Mock mode shows an illustrative S256 stand-in, not a real SHA-256 hash. The offline
							token exchange verifies the code_verifier against this deterministic value, so the
							PKCE check still passes end-to-end.
						</Note>
					)}
				</FlowStep>
			)}

			{cur === 'authorize' && (
				<FlowStep
					title="3. Authorize"
					description={engine.current.description}
					explanation={mode === 'real'
						? 'Builds the /as/authorize URL and redirects you to PingOne to sign in. You return to the callback with a one-time code.'
						: 'Mock mode issues a code in-memory (no redirect, no PingOne).'}
					nextLabel="Continue"
					onPrev={engine.goPrev}
					onNext={() => engine.goTo(3)}
					canNext={Boolean(code)}
				>
					<Action onClick={handleAuthorize} disabled={loading || !configured}>
						{loading ? 'Working…' : mode === 'real' ? 'Authorize with PingOne →' : 'Issue authorization code (mock)'}
					</Action>
					{authUrl && <CodeBlock label="Authorization URL" value={authUrl} />}
					{code && <ResultCard title="Authorization code" tone="ok"><CodeBlock value={code} /></ResultCard>}
					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{cur === 'exchange' && (
				<FlowStep
					title="4. Exchange code for tokens"
					description={engine.current.description}
					explanation="POST grant_type=authorization_code with the code and the PKCE code_verifier. PingOne verifies the verifier hashes to the original challenge."
					nextLabel="Use tokens"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(result)}
				>
					<Action onClick={handleExchange} disabled={loading || !code || !pkce}>
						{loading ? 'Exchanging…' : 'Exchange code'}
					</Action>
					<FlowResult result={result} error={error} />
				</FlowStep>
			)}

			{cur === 'use' && (
				<FlowStep
					title="5. Use the tokens"
					description={engine.current.description}
					explanation="Call the OIDC UserInfo endpoint and RFC 7662 introspection with the access token."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					<Toggle>
						<Action onClick={handleUserInfo} disabled={!result?.accessToken}>Call UserInfo</Action>
						<Action onClick={handleIntrospect} disabled={!result?.accessToken}>Introspect token</Action>
					</Toggle>
					{userInfoData && <ResultCard title="UserInfo" tone="info"><JsonView data={userInfoData} /></ResultCard>}
					{introspectData && <ResultCard title="Introspection (RFC 7662)" tone="info"><JsonView data={introspectData} /></ResultCard>}
					<ExplanationPanel title="What the tokens are for">
						The access token authorizes API calls; the ID token (OIDC) carries the user's identity
						claims; introspection lets a resource server check a token's validity and scopes.
					</ExplanationPanel>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default AuthorizationCodeFlow;
