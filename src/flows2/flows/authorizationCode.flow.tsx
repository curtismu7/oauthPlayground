// src/flows2/flows/authorizationCode.flow.tsx
//
// Authorization Code (+ PKCE) flow on the flows2 framework. Real PingOne or mock via the
// `mode` toggle; 2.0/2.1 and OIDC toggles. Version-free (no V9/V8U). ~300 LOC vs the
// legacy 1,268-LOC monolith it replaces.

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
	OAuthSpec,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import { authorizationCodeService } from '../services/authorizationCodeService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'App credentials' },
	{ id: 'pkce', title: 'PKCE', subtitle: 'Verifier + challenge' },
	{ id: 'authorize', title: 'Authorize', subtitle: 'Redirect to PingOne' },
	{ id: 'exchange', title: 'Exchange', subtitle: 'Code → tokens' },
	{ id: 'use', title: 'Use Tokens', subtitle: 'UserInfo + Introspect' },
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
	border: 1px solid ${tokens.color.successBorder ?? '#15803d'};
	background: ${tokens.color.success};
	color: #fff;
	cursor: pointer;
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const defaultRedirectUri = () =>
	typeof window !== 'undefined' ? `${window.location.origin}/v2/flows/authz-callback` : '';

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
		scope: '',
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
	}, [engine]);

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
				// stash what we need to resume after the round-trip, then leave the SPA
				saveStash({
					state,
					nonce,
					codeVerifier: active.codeVerifier,
					oidc,
					spec,
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

	const configured = Boolean(creds.environmentId && creds.clientId && creds.clientSecret && redirectUri);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Authorization Code + PKCE"
			spec={spec}
			mode={mode}
			subtitle="The user authenticates at PingOne and is redirected back with a one-time code, which is exchanged (with the PKCE verifier) for tokens. RFC 6749 §4.1 + RFC 7636."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure"
					explanation="Real mode runs against PingOne via the BFF; mock runs offline. 2.1 forces PKCE and exact redirect matching."
					canPrev={false}
					nextLabel="Continue"
					onNext={engine.goNext}
					canNext={configured}
				>
					<Toggle>
						<Pill $active={mode === 'real'} onClick={() => setMode('real')}>Real PingOne</Pill>
						<Pill $active={mode === 'mock'} onClick={() => setMode('mock')}>Mock</Pill>
					</Toggle>
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
				</FlowStep>
			)}

			{cur === 'authorize' && (
				<FlowStep
					title="3. Authorize"
					explanation={mode === 'real'
						? 'Builds the /as/authorize URL and redirects you to PingOne to sign in. You return to the callback with a one-time code.'
						: 'Mock mode issues a code in-memory (no redirect, no PingOne).'}
					nextLabel="Skip"
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
