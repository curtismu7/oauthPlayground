// src/flows2/flows/hybrid.flow.tsx
//
// Hybrid Flow (OpenID Connect) on the flows2 framework. Real PingOne or mock via the
// `mode` toggle. Uses response_type=code id_token for front-channel code+id_token,
// then back-channel code exchange for access token. ~300 LOC.
//
// FLAG: PingOne support for hybrid response_type in real mode depends on the
// application configuration — the flow is a transitional OIDC pattern and is not
// recommended under OAuth 2.1. Mock mode is always available offline.

import React, { useCallback, useEffect, useState } from 'react';
import { clearStash, loadStash, saveStash } from '../framework/authzStash';
import { CodeBlock, JsonView } from '../framework/CodeBlock';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { FieldGroup } from '../framework/FieldGroup';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowDiagram } from '../framework/FlowDiagram';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { Action, Grid, Note, Pill, Toggle } from '../framework/primitives';
import { ResultCard } from '../framework/ResultCard';
import type {
	FlowCredentials,
	FlowError,
	FlowMode,
	OAuthSpec,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import { useFlowEngine } from '../framework/useFlowEngine';
import { authorizationCodeService } from '../services/authorizationCodeService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'App credentials' },
	{ id: 'authorize', title: 'Authorize', subtitle: 'Redirect to PingOne' },
	{ id: 'exchange', title: 'Exchange', subtitle: 'Code → access token' },
	{ id: 'use', title: 'Use Tokens', subtitle: 'UserInfo + Introspect' },
];

const defaultRedirectUri = () =>
	typeof window !== 'undefined' ? `${window.location.origin}/v2/flows/authz-callback` : '';

// Realistic placeholders so the offline mock flow runs with zero PingOne setup.
const MOCK_CREDS = {
	environmentId: 'a1234567-b890-c123-d456-e7890f123456',
	region: 'com',
	clientId: 'mock-hybrid-demo-1234567890',
	clientSecret: 'mock-client-secret',
	scope: 'openid profile email',
} as const;

const HybridFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [spec, setSpec] = useState<OAuthSpec>('2.0');
	const [oidc, setOidc] = useState(true);
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_USER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_USER_CLIENT_SECRET || '',
		scope: 'openid profile email',
	});
	const [redirectUri, setRedirectUri] = useState(defaultRedirectUri());
	const [authUrl, setAuthUrl] = useState('');
	const [code, setCode] = useState('');
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [userInfoData, setUserInfoData] = useState<Record<string, unknown> | null>(null);
	const [introspectData, setIntrospectData] = useState<Record<string, unknown> | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const selectMode = useCallback((m: FlowMode) => setMode(m), []);

	// Auto-populate mock credentials when mode changes; clear them when switching to real.
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
			setCreds(
				(c) =>
					({
						...c,
						environmentId: c.environmentId === MOCK_CREDS.environmentId ? '' : c.environmentId,
						clientId: c.clientId === MOCK_CREDS.clientId ? '' : c.clientId,
						clientSecret: c.clientSecret === MOCK_CREDS.clientSecret ? '' : (c.clientSecret ?? ''),
						scope: c.scope === MOCK_CREDS.scope ? '' : c.scope,
					}) as FlowCredentials
			);
		}
		setCode('');
		setAuthUrl('');
	}, [mode]);

	// Resume after a real redirect: the callback wrote the code into the stash.
	useEffect(() => {
		const stash = loadStash();
		if (!stash) return;
		clearStash();
		if (stash.error) {
			setError({ error: stash.error, error_description: stash.errorDescription } as FlowError);
			return;
		}
		if (stash.code) {
			if (!stash.redirectUri) {
				setError({
					error: 'invalid_stash',
					error_description: 'Authorization stash missing redirect URI',
				});
				return;
			}
			setMode('real');
			setCreds((c) => ({
				...c,
				environmentId: stash.environmentId,
				region: stash.region,
				clientId: stash.clientId,
				scope: stash.scope || '',
				clientSecret: c.clientSecret || env.VITE_PINGONE_USER_CLIENT_SECRET || '',
			}));
			setRedirectUri(stash.redirectUri);
			setCode(stash.code);
			engine.goTo(2); // exchange step
		}
	}, [engine]);

	const handleAuthorize = useCallback(async () => {
		setError(null);
		setLoading(true);
		try {
			const state = crypto.randomUUID();
			const nonce = crypto.randomUUID();

			if (mode === 'mock') {
				// Mock mode: issue code in-memory (hybrid would also return id_token in real mode)
				const mockCode = crypto.randomUUID().substring(0, 12);
				setCode(mockCode);
				engine.markComplete('authorize');
				engine.goTo(2); // exchange
				setLoading(false);
				return;
			}

			// Real mode: build hybrid authorize URL (response_type=code id_token)
			const scope = creds.scope?.trim() || 'openid profile email';
			const params = new URLSearchParams({
				response_type: 'code id_token',
				client_id: creds.clientId,
				redirect_uri: redirectUri,
				scope,
				state,
				nonce,
				response_mode: 'form_post', // or could use 'query'
			});

			const url = `https://auth.pingone.com/${creds.environmentId}/as/authorize?${params.toString()}`;
			setAuthUrl(url);

			// Stash for resuming after redirect
			saveStash({
				state,
				nonce,
				codeVerifier: '', // Hybrid doesn't use PKCE by default
				oidc: true,
				spec,
				environmentId: creds.environmentId,
				region: creds.region,
				clientId: creds.clientId,
				redirectUri,
				scope,
			});

			window.location.assign(url);
		} catch (err) {
			setError(err as FlowError);
			setLoading(false);
		}
	}, [creds, redirectUri, mode, spec, engine]);

	const handleExchange = useCallback(async () => {
		if (!code) return;
		setError(null);
		setLoading(true);
		try {
			// Back-channel code exchange: exchange code for access token (+ refresh token)
			const r = await authorizationCodeService.exchangeCode(
				{
					credentials: creds,
					redirectUri,
					code,
					codeVerifier: 'pkce-not-used', // Hybrid doesn't use PKCE, but the service requires it
					oidc: true,
				},
				mode
			);
			setResult(r);
			engine.markComplete('exchange');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [code, creds, redirectUri, mode, engine]);

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
			title="Hybrid Flow (OpenID Connect)"
			spec={spec}
			mode={mode}
			onModeChange={selectMode}
			subtitle="Front-channel returns code + ID token; back-channel exchanges code for access token. OpenID Connect extension to OAuth 2.0 (Section 3.3). A transitional flow between implicit and authorization code."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure"
					explanation="Real mode runs against PingOne via the BFF; mock runs offline. The hybrid flow sends response_type=code id_token to PingOne."
					canPrev={false}
					nextLabel="Continue"
					onNext={engine.goNext}
					canNext={configured}
				>
					<FlowDiagram
						label="OIDC Hybrid Flow"
						nodes={['Client', 'AuthZ', 'User', 'Code + Token']}
					/>
					<Toggle>
						<Pill $active={spec === '2.0'} onClick={() => setSpec('2.0')}>
							OAuth 2.0
						</Pill>
						<Pill $active={spec === '2.1'} onClick={() => setSpec('2.1')}>
							OAuth 2.1
						</Pill>
						<Pill $active={oidc} onClick={() => setOidc((v) => !v)}>
							OIDC {oidc ? 'on' : 'off'}
						</Pill>
					</Toggle>
					<Grid>
						<FieldGroup
							label="Environment ID"
							value={creds.environmentId}
							onChange={set('environmentId')}
						/>
						<FieldGroup
							label="Region"
							value={creds.region}
							onChange={set('region')}
							placeholder="com | eu | ca | asia"
						/>
						<FieldGroup label="Client ID" value={creds.clientId} onChange={set('clientId')} />
						<FieldGroup
							label="Client Secret"
							type="password"
							value={creds.clientSecret ?? ''}
							onChange={set('clientSecret')}
						/>
						<FieldGroup
							label="Redirect URI"
							value={redirectUri}
							onChange={(e) => setRedirectUri(e.target.value)}
							hint="Must be registered on the PingOne app"
						/>
						<FieldGroup
							label="Scope (optional)"
							value={creds.scope ?? ''}
							onChange={set('scope')}
							placeholder="openid profile email"
						/>
					</Grid>
					<ExplanationPanel title="Hybrid vs. Authorization Code">
						Hybrid returns both code and ID token from the front-channel authorization endpoint,
						saving a round-trip for the ID token. The code is then exchanged back-channel for the
						access token. Use this when you need the ID token immediately for client-side user
						identification.
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'authorize' && (
				<FlowStep
					title="2. Authorize"
					explanation={
						mode === 'real'
							? 'Builds the /as/authorize URL with response_type=code id_token and redirects you to PingOne to sign in. You return to the callback with a code and ID token.'
							: 'Mock mode issues a code in-memory (no redirect, no PingOne). In real mode, an ID token would also be returned.'
					}
					nextLabel="Continue"
					onPrev={engine.goPrev}
					onNext={() => engine.goTo(2)}
					canNext={Boolean(code)}
				>
					<Action onClick={handleAuthorize} disabled={loading || !configured}>
						{loading
							? 'Working…'
							: mode === 'real'
								? 'Authorize with PingOne →'
								: 'Issue authorization code (mock)'}
					</Action>
					{authUrl && <CodeBlock label="Authorization URL" value={authUrl} />}
					{code && (
						<ResultCard title="Authorization code" tone="ok">
							<CodeBlock value={code} />
							<Note>
								In the hybrid flow, the authorization endpoint returns both the code and an ID token
								in the URL query parameters. The code is exchanged back-channel for the access
								token, while the ID token can be decoded client-side immediately for user
								identification.
							</Note>
						</ResultCard>
					)}
					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{cur === 'exchange' && (
				<FlowStep
					title="3. Exchange code for access token"
					explanation="POST grant_type=authorization_code with the code to get the access token (and refresh token). The ID token was already returned from step 2 in the front-channel."
					nextLabel="Use tokens"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(result)}
				>
					<Action onClick={handleExchange} disabled={loading || !code}>
						{loading ? 'Exchanging…' : 'Exchange code'}
					</Action>
					<FlowResult result={result} error={error} />
				</FlowStep>
			)}

			{cur === 'use' && (
				<FlowStep
					title="4. Use the tokens"
					explanation="Call the OIDC UserInfo endpoint and RFC 7662 introspection with the access token. The ID token is already available from step 2 and can be decoded client-side."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					<Toggle>
						<Action onClick={handleUserInfo} disabled={!result?.accessToken}>
							Call UserInfo
						</Action>
						<Action onClick={handleIntrospect} disabled={!result?.accessToken}>
							Introspect token
						</Action>
					</Toggle>
					{userInfoData && (
						<ResultCard title="UserInfo" tone="info">
							<JsonView data={userInfoData} />
						</ResultCard>
					)}
					{introspectData && (
						<ResultCard title="Introspection (RFC 7662)" tone="info">
							<JsonView data={introspectData} />
						</ResultCard>
					)}
					<ExplanationPanel title="What each token does">
						The ID token carries the user's identity (sub, name, email, …) and was decoded
						client-side in step 2. The access token authorizes API calls to protected resources.
						Introspection lets a resource server validate the access token. Hybrid saves a
						round-trip by returning the ID token in the front-channel authorization response.
					</ExplanationPanel>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default HybridFlow;
