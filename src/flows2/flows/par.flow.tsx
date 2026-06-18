// src/flows2/flows/par.flow.tsx
//
// Pushed Authorization Request (PAR) flow — RFC 9126, OAuth 2.1 hardening.
// The client POSTs the full authorization request to the AS back channel first
// (integrity-protected, never visible in the URL), receives a short-lived
// request_uri, then redirects with only client_id + request_uri on the front channel.
// REDIRECT-based: reuses the shared AuthCallback + authzStash; stash.returnTo = '/v2/flows/par'.

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
import { tokens } from '../framework/tokens';
import { clearStash, loadStash, saveStash } from '../framework/authzStash';
import type {
	FlowCredentials,
	FlowError,
	FlowMode,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import { parService } from '../services/parService';
import type { PkcePair } from '../services/parService';

const env = import.meta.env as Record<string, string | undefined>;

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'App credentials' },
	{ id: 'push', title: 'Push Request', subtitle: 'Back-channel PAR' },
	{ id: 'authorize', title: 'Authorize', subtitle: 'Front-channel redirect' },
	{ id: 'exchange', title: 'Exchange', subtitle: 'Code → tokens' },
	{ id: 'use', title: 'Use Tokens', subtitle: 'Inspect the result' },
];

const PAR_RETURN_TO = '/v2/flows/par';

// ─── Styled primitives (match authorizationCode.flow.tsx exactly) ─────────────

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
	border: 1px solid ${({ $active }) => ($active ? tokens.color.primary : tokens.color.border)};
	background: ${({ $active }) => ($active ? tokens.color.bgSubtle : '#fff')};
	color: ${({ $active }) => ($active ? tokens.color.primary : tokens.color.textMuted)};
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
	font-size: 0.9rem;
	font-weight: 700;
	padding: 0.6rem 1.2rem;
	border-radius: 8px;
	border: 1px solid ${tokens.color.successBorder};
	background: ${tokens.color.success};
	color: #fff;
	cursor: pointer;
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultRedirectUri = () =>
	typeof window !== 'undefined' ? `${window.location.origin}/v2/flows/authz-callback` : '';

// ─── Component ────────────────────────────────────────────────────────────────

const PARFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_USER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_USER_CLIENT_SECRET || '',
		scope: '',
	});
	const [redirectUri, setRedirectUri] = useState(defaultRedirectUri());
	const [pkce, setPkce] = useState<PkcePair | null>(null);
	const [authState, setAuthState] = useState('');
	const [pushResult, setPushResult] = useState<{ requestUri: string; expiresIn: number; raw: Record<string, unknown> } | null>(null);
	const [authorizeUrl, setAuthorizeUrl] = useState('');
	const [code, setCode] = useState('');
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	// Resume after real redirect: AuthCallback wrote the code into the stash.
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
			setCreds((c) => ({
				...c,
				environmentId: stash.environmentId,
				region: stash.region,
				clientId: stash.clientId,
				scope: stash.scope || '',
				clientSecret: c.clientSecret || env.VITE_PINGONE_USER_CLIENT_SECRET || '',
			}));
			setRedirectUri(stash.redirectUri);
			setPkce({ codeVerifier: stash.codeVerifier, codeChallenge: '', codeChallengeMethod: 'S256' });
			setAuthState(stash.state);
			setCode(stash.code);
			engine.goTo(3); // exchange step
		}
	}, [engine]);

	// ─── Step handlers ────────────────────────────────────────────────────────

	const handlePush = useCallback(async () => {
		setError(null);
		setLoading(true);
		try {
			const pair = await parService.generatePkce(mode);
			setPkce(pair);

			const state = crypto.randomUUID();
			setAuthState(state);

			const pushed = await parService.pushAuthorizationRequest(
				{
					credentials: creds,
					redirectUri,
					state,
					nonce: crypto.randomUUID(),
					codeChallenge: pair.codeChallenge,
					scope: creds.scope,
				},
				mode
			);
			setPushResult(pushed);

			const url = parService.buildAuthorizeUrl(creds, pushed.requestUri);
			setAuthorizeUrl(url);

			engine.markComplete('push');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, redirectUri, mode, engine]);

	const handleAuthorize = useCallback(() => {
		if (!pushResult || !pkce) return;
		setError(null);

		if (mode === 'mock') {
			// Offline: simulate the code the AS would issue after a successful login.
			setCode(`mock-par-code-${Date.now()}`);
			engine.markComplete('authorize');
			engine.goTo(3);
			return;
		}

		// Real: stash what we need to resume, then leave the SPA.
		saveStash({
			state: authState,
			codeVerifier: pkce.codeVerifier,
			oidc: true,
			spec: '2.1',
			environmentId: creds.environmentId,
			region: creds.region,
			clientId: creds.clientId,
			redirectUri,
			scope: creds.scope,
			returnTo: PAR_RETURN_TO,
		});
		window.location.assign(authorizeUrl);
	}, [pushResult, pkce, mode, authState, creds, redirectUri, authorizeUrl, engine]);

	const handleExchange = useCallback(async () => {
		if (!pkce || !code) return;
		setError(null);
		setLoading(true);
		try {
			const r = await parService.exchangeCode(
				{ credentials: creds, redirectUri, code, codeVerifier: pkce.codeVerifier },
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

	// ─── Computed guards ──────────────────────────────────────────────────────

	const configured = Boolean(creds.environmentId && creds.clientId && creds.clientSecret && redirectUri);
	const cur = engine.current.id;

	// ─── Render ───────────────────────────────────────────────────────────────

	return (
		<FlowContainer
			title="Pushed Authorization Request (PAR)"
			spec="2.1"
			mode={mode}
			subtitle="The client sends the full authorization request to the AS back channel first (RFC 9126), receives a short-lived request_uri, then redirects with only client_id + request_uri — nothing tamperable in the URL."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure"
					explanation="Real mode runs against PingOne via the BFF at /api/par; mock runs fully offline. PAR is mandatory-ish in FAPI 2.0 / OAuth 2.1 security profiles."
					canPrev={false}
					nextLabel="Continue"
					onNext={engine.goNext}
					canNext={configured}
				>
					<Toggle>
						<Pill $active={mode === 'real'} onClick={() => setMode('real')}>Real PingOne</Pill>
						<Pill $active={mode === 'mock'} onClick={() => setMode('mock')}>Mock</Pill>
					</Toggle>
					<Grid>
						<FieldGroup label="Environment ID" value={creds.environmentId} onChange={set('environmentId')} />
						<FieldGroup label="Region" value={creds.region} onChange={set('region')} placeholder="com | eu | ca | asia" />
						<FieldGroup label="Client ID" value={creds.clientId} onChange={set('clientId')} />
						<FieldGroup label="Client Secret" type="password" value={creds.clientSecret ?? ''} onChange={set('clientSecret')} />
						<FieldGroup label="Redirect URI" value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} hint="Must be registered on the PingOne app" />
						<FieldGroup label="Scope (optional)" value={creds.scope ?? ''} onChange={set('scope')} placeholder="openid profile email" />
					</Grid>
				</FlowStep>
			)}

			{cur === 'push' && (
				<FlowStep
					title="2. Push the authorization request"
					explanation="PKCE is generated first, then the full authorization request (response_type, client_id, redirect_uri, scope, state, code_challenge) is POSTed to /as/par — the AS back channel. The response is a short-lived request_uri."
					nextLabel="Continue"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(pushResult)}
				>
					<ExplanationPanel title="Why PAR?">
						In a normal authorization request the parameters travel in the URL — browser history,
						referrer headers, and server logs can all see them. PAR moves them to a direct
						back-channel POST (authenticated with the client secret), so the front-channel URL
						carries only an opaque reference. The AS can validate and bind the request before
						any redirect happens — a hard requirement in FAPI 2.0 and recommended in OAuth 2.1.
					</ExplanationPanel>
					<Action onClick={handlePush} disabled={loading || !configured}>
						{loading ? 'Pushing…' : 'Generate PKCE + push authorization request'}
					</Action>
					{pushResult && (
						<>
							<ResultCard title="PAR response" tone="ok">
								<CodeBlock label="request_uri" value={pushResult.requestUri} />
								<CodeBlock label="expires_in" value={String(pushResult.expiresIn) + 's'} />
							</ResultCard>
							<JsonView data={pushResult.raw} />
						</>
					)}
					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{cur === 'authorize' && (
				<FlowStep
					title="3. Authorize (front channel)"
					explanation={
						mode === 'real'
							? 'Builds the /as/authorize URL with only client_id + request_uri and redirects to PingOne. The user authenticates, and PingOne redirects back with a code.'
							: 'Mock mode issues a code in-memory — no redirect, no PingOne.'
					}
					nextLabel="Skip"
					onPrev={engine.goPrev}
					onNext={() => engine.goTo(3)}
					canNext={Boolean(code)}
				>
					<ExplanationPanel title="Front-channel URL — clean by design">
						The authorize URL carries only <code>client_id</code> and <code>request_uri</code>.
						All the sensitive parameters (scope, redirect_uri, code_challenge) are already
						registered at the AS and are referenced by the opaque URI — not exposed in the URL.
					</ExplanationPanel>
					{authorizeUrl && <CodeBlock label="Authorization URL" value={authorizeUrl} />}
					<Action onClick={handleAuthorize} disabled={!pushResult || !pkce}>
						{mode === 'real' ? 'Redirect to PingOne →' : 'Issue code (mock)'}
					</Action>
					{code && <ResultCard title="Authorization code" tone="ok"><CodeBlock value={code} /></ResultCard>}
					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{cur === 'exchange' && (
				<FlowStep
					title="4. Exchange code for tokens"
					explanation="POST grant_type=authorization_code with the code and the PKCE code_verifier. The AS verifies the verifier against the challenge that was locked in via the PAR request."
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
					explanation="The access token is the result of a fully integrity-protected authorization flow — every parameter was committed at the AS before any redirect."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					{result && (
						<ResultCard title="Token response" tone="info">
							<JsonView data={result.raw} />
						</ResultCard>
					)}
					<ExplanationPanel title="PAR in OAuth 2.1 and FAPI">
						PAR (RFC 9126) is RECOMMENDED in OAuth 2.1 and REQUIRED in FAPI 2.0 Baseline.
						By binding the full request at the AS before the redirect, PAR eliminates open
						redirector attacks, request tampering, and mix-up attacks. Combined with PKCE and
						short-lived request_uri TTLs, it delivers the strongest front-channel security
						available without JAR (request objects).
					</ExplanationPanel>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default PARFlow;
