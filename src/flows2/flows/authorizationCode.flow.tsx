// src/flows2/flows/authorizationCode.flow.tsx
//
// Authorization Code (+ PKCE) flow on the flows2 framework. Real PingOne or mock via the
// `mode` toggle; 2.0/2.1 and OIDC toggles. Version-free (no V9/V8U). ~300 LOC vs the
// legacy 1,268-LOC monolith it replaces.
//
// Visual system (adopted from the redesign): deep indigo + teal accent, IBM Plex Mono
// headers, and a signature animated flow diagram on the Configure step.

import React, { useCallback, useEffect, useState } from 'react';
import { clearStash, loadStash, saveStash } from '../framework/authzStash';
import { CodeBlock } from '../framework/CodeBlock';
import { CredentialsForm } from '../framework/CredentialsForm';
import { useFlowCredentials } from '../framework/useFlowCredentials';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowDiagram } from '../framework/FlowDiagram';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { Action, Note } from '../framework/primitives';
import { RequestPreview } from '../framework/RequestPreview';
import type { CurlRequest } from '../framework/RequestPreview';
import { ResultCard } from '../framework/ResultCard';
import { SpecToggle } from '../framework/SpecToggle';
import type {
	FlowCredentials,
	FlowError,
	FlowMode,
	OAuthSpec,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import { UseTokensStep } from '../framework/UseTokensStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import {
	authorizationCodeService,
	MOCK_REGISTERED_SECRET,
} from '../services/authorizationCodeService';
import { pingoneEndpoints } from '../services/pingone';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{
		id: 'configure',
		title: 'Configure',
		subtitle: 'App credentials',
		description:
			'Enter your application credentials (Environment ID, Client ID, Secret) and redirect URI. These identify your app to the authorization server.',
	},
	{
		id: 'pkce',
		title: 'PKCE',
		subtitle: 'Verifier + challenge',
		description:
			'Generate a code verifier and challenge for PKCE (Proof Key for Code Exchange). This adds security by binding the authorization code to your specific app instance.',
	},
	{
		id: 'authorize',
		title: 'Authorize',
		subtitle: 'Redirect to PingOne',
		description:
			"Redirect user to PingOne's login page. User authenticates and grants your app permission to access their data. Returns an authorization code.",
	},
	{
		id: 'exchange',
		title: 'Exchange',
		subtitle: 'Code → tokens',
		description:
			'Exchange the authorization code for tokens (Access Token, ID Token, Refresh Token). This happens securely in the backend—never expose tokens to the browser.',
	},
	{
		id: 'use',
		title: 'Use Tokens',
		subtitle: 'UserInfo + Introspect',
		description:
			'Use the access token to call protected APIs. Optionally introspect tokens to verify their claims and expiration time.',
	},
];

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
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const selectMode = useCallback((m: FlowMode) => {
		setMode(m);
	}, []);

	const { save: saveCredentials, saving: savingCreds, saved: savedCreds } =
		useFlowCredentials('flows2:authorization-code', creds, setCreds);

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
				clientSecret: c.clientSecret === MOCK_CREDS.clientSecret ? '' : (c.clientSecret ?? ''),
				scope: c.scope === MOCK_CREDS.scope ? '' : c.scope,
			}));
		}
		// Clear PKCE state on mode switch to prevent stale verifier/challenge pairs
		setPkce(null);
		setCode('');
		setAuthUrl('');
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
		// Validate redirect URI format
		if (!redirectUri || !redirectUri.startsWith('http')) {
			setError({
				error: 'invalid_redirect_uri',
				error_description: 'Redirect URI must be a valid HTTP(S) URL',
			});
			setLoading(false);
			return;
		}
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
				{
					credentials: creds,
					redirectUri,
					state,
					nonce,
					codeChallenge: active.codeChallenge,
					oidc,
				},
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
			subtitle={
				'🚀 Live update confirmed — Authorization Code + PKCE\nThe user authenticates at PingOne and is redirected back with a one-time code, which is exchanged (with the PKCE verifier) for tokens. RFC 6749 §4.1 + RFC 7636.'
			}
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
					<FlowDiagram
						label="OAuth 2.0 Authorization Code Flow"
						nodes={['Client', 'AuthZ', 'User', 'Token']}
					/>
					<SpecToggle
						spec={spec}
						onSpecChange={setSpec}
						oidc={oidc}
						onOidcToggle={() => setOidc((v) => !v)}
					/>
					<CredentialsForm
						creds={creds}
						set={set}
						redirectUri={redirectUri}
						onRedirectUriChange={(e) => setRedirectUri(e.target.value)}
						scopePlaceholder={oidc ? 'openid profile email' : 'openid'}
						onSave={saveCredentials}
						saving={savingCreds}
						saved={savedCreds}
					/>
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
							{pkce.codeChallenge && (
								<CodeBlock label="code_challenge (S256)" value={pkce.codeChallenge} />
							)}
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
					explanation={
						mode === 'real'
							? 'Builds the /as/authorize URL and redirects you to PingOne to sign in. You return to the callback with a one-time code.'
							: 'Mock mode issues a code in-memory (no redirect, no PingOne).'
					}
					nextLabel="Continue"
					onPrev={engine.goPrev}
					onNext={() => engine.goTo(3)}
					canNext={Boolean(code)}
				>
					{(() => {
						const ep = pingoneEndpoints(creds);
						const curlReq: CurlRequest = {
							method: 'GET',
							url: ep.authorize,
							params: {
								response_type: 'code',
								client_id: creds.clientId,
								redirect_uri: redirectUri,
								scope: creds.scope || (oidc ? 'openid profile email' : 'openid'),
								state: '<generated at runtime>',
								code_challenge: pkce?.codeChallenge || '<generated>',
								code_challenge_method: 'S256',
								...(oidc ? { nonce: '<generated at runtime>' } : {}),
							},
						};
						return <RequestPreview request={curlReq} />;
					})()}
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
						</ResultCard>
					)}
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
					{(() => {
						const ep = pingoneEndpoints(creds);
						const curlReq: CurlRequest = {
							method: 'POST',
							url: ep.token,
							params: {
								grant_type: 'authorization_code',
								code: code || '<authorization_code>',
								redirect_uri: redirectUri,
								client_id: creds.clientId,
								code_verifier: pkce?.codeVerifier || '<code_verifier>',
							},
						};
						return <RequestPreview request={curlReq} />;
					})()}
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
					<UseTokensStep
						result={result}
						credentials={creds}
						mode={mode}
						tools={['userinfo', 'introspect', 'refresh', 'decode']}
					/>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default AuthorizationCodeFlow;
