// src/flows2/flows/redirectless.flow.tsx
//
// Redirectless (pi.flow). This is the ordinary Authorization Code flow with ONE extra
// parameter on the /authorize request: response_mode=pi.flow. That single change makes
// PingOne skip the browser redirect — /authorize returns the authorization response as a
// JSON "flow" object (HTTP 200) instead of a 302, redirect_uri is not required, and the
// app drives any interactive steps (e.g. username/password) through the flow object until
// tokens are returned directly in the JSON body. Good for native mobile apps and SPAs that
// render their own login UI.
// Ref: https://developer.pingidentity.com/pingone-api/auth/auth-config-options/browserless-authentication-flow-options.html
//
// FLAG: response_mode=pi.flow is a PingOne extension — not part of any OAuth 2.0/2.1 RFC
// (the underlying grant is standard Authorization Code). Real mode requires a PingOne
// environment with the app configured for pi.flow. Mock mode runs fully offline.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { CredentialsForm } from '../framework/CredentialsForm';
import { useFlowCredentials } from '../framework/useFlowCredentials';
import { RequestPreview } from '../framework/RequestPreview';
import type { CurlRequest } from '../framework/RequestPreview';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { FieldGroup } from '../framework/FieldGroup';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowDiagram } from '../framework/FlowDiagram';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { Action, Grid } from '../framework/primitives';
import { ResultCard } from '../framework/ResultCard';
import { SpecToggle } from '../framework/SpecToggle';
import { TokenLifetimeConfig } from '../framework/TokenLifetimeConfig';
import { tokens } from '../framework/tokens';
import type {
	FlowCredentials,
	FlowError,
	FlowMode,
	OAuthSpec,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import type { TokenLifetimes } from '../framework/TokenLifetimeConfig';
import { UseTokensStep } from '../framework/UseTokensStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { pingoneEndpoints } from '../services/pingone';
import {
	type RedirectlessFlowState,
	type RedirectlessPollStatus,
	redirectlessService,
} from '../services/redirectlessService';

const env = import.meta.env as Record<string, string | undefined>;

const POLL_INTERVAL_MS = 3000;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Client + user credentials' },
	{ id: 'start', title: 'Start Flow', subtitle: 'POST to /as/authorize (pi.flow)' },
	{ id: 'authenticate', title: 'Authenticate', subtitle: 'Submit credentials + poll' },
	{ id: 'use', title: 'Use Tokens', subtitle: 'Inspect the result' },
];

// ─── Local styled component (status badge — not in primitives) ────────────────

const StatusBadge = styled.div<{ $tone: 'info' | 'success' | 'error' }>`
	font-size: 0.85rem;
	font-weight: 600;
	padding: 0.5rem 0.85rem;
	border-radius: 8px;
	border: 1px solid
		${({ $tone }) =>
			$tone === 'success'
				? tokens.color.successBorder
				: $tone === 'error'
					? tokens.color.errorBorder
					: tokens.color.primaryBorder};
	background: ${({ $tone }) =>
		$tone === 'success'
			? tokens.color.successBg
			: $tone === 'error'
				? tokens.color.errorBg
				: tokens.color.primarySubtle};
	color: ${({ $tone }) =>
		$tone === 'success'
			? tokens.color.success
			: $tone === 'error'
				? tokens.color.errorMuted
				: tokens.color.primary};
`;

// Realistic placeholders so the offline mock flow runs with zero PingOne setup.
const MOCK_CREDS = {
	environmentId: 'a1234567-b890-c123-d456-e7890f123456',
	region: 'com',
	clientId: 'mock-client-demo-1234567890',
	clientSecret: 'mock-client-secret',
	scope: 'openid profile email',
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

const RedirectlessFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [spec, setSpec] = useState<OAuthSpec>('2.0');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		// pi.flow here requests response_type=token id_token, which the CODE-only
		// user app rejects ("Unsupported response type"). Default to the SPA app,
		// which is registered for TOKEN/ID_TOKEN and is a public client.
		clientId: env.VITE_PINGONE_IMPLICIT_CLIENT_ID || env.VITE_PINGONE_USER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_IMPLICIT_CLIENT_SECRET || '',
		scope: 'openid profile email',
		authMethod: 'client_secret_basic',
	});
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [tokenLifetimes, setTokenLifetimes] = useState<TokenLifetimes>({
		accessTokenSeconds: 3600,
		idTokenSeconds: 3600,
		refreshTokenSeconds: 86400,
	});

	const updateTokenLifetime = (k: keyof TokenLifetimes) => (v: number | string) => {
		setTokenLifetimes((prev) => ({ ...prev, [k]: Number(v) }));
	};

	const [flowState, setFlowState] = useState<RedirectlessFlowState | null>(null);
	const [pollStatus, setPollStatus] = useState<RedirectlessPollStatus | null>(null);
	const [polling, setPolling] = useState(false);
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	// Poll loop refs — same pattern as deviceAuthorization.flow.tsx
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const active = useRef(false);
	const enteredPollPath = useRef(false);
	const mounted = useRef(true);

	const stopPolling = useCallback(() => {
		active.current = false;
		setPolling(false);
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
	}, []);

	// Cancel any in-flight poll on unmount.
	useEffect(() => {
		return () => {
			mounted.current = false;
			stopPolling();
		};
	}, [stopPolling]);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const selectMode = useCallback((m: FlowMode) => setMode(m), []);

	const { save: saveCredentials, saving: savingCreds, saved: savedCreds } =
		useFlowCredentials('flows2:redirectless', creds, setCreds);

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
			setCreds((c) => ({
				...c,
				environmentId: c.environmentId === MOCK_CREDS.environmentId ? '' : c.environmentId,
				clientId: c.clientId === MOCK_CREDS.clientId ? '' : c.clientId,
				clientSecret: c.clientSecret === MOCK_CREDS.clientSecret ? '' : (c.clientSecret ?? ''),
				scope: c.scope === MOCK_CREDS.scope ? '' : c.scope,
			}));
		}
		setFlowState(null);
		setPollStatus(null);
		setResult(null);
	}, [mode]);

	// ── Step 2: start the flow ────────────────────────────────────────────────
	const startFlow = useCallback(async () => {
		setLoading(true);
		setError(null);
		setFlowState(null);
		setPollStatus(null);
		setResult(null);
		try {
			const state = await redirectlessService.startAuthorize(creds, mode, tokenLifetimes, creds.authMethod);
			setFlowState(state);
			engine.markComplete('start');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, mode, engine, tokenLifetimes]);

	// ── Step 3: submit credentials then poll ─────────────────────────────────
	const authenticate = useCallback(async () => {
		if (!flowState) return;
		enteredPollPath.current = false;
		setLoading(true);
		setError(null);
		try {
			const advanced = await redirectlessService.submitCredentials(
				creds,
				flowState,
				username,
				password,
				mode,
				tokenLifetimes,
				creds.authMethod
			);
			setFlowState(advanced);

			// If the flow completed immediately (e.g. mock), skip the poll loop.
			if (typeof advanced.status === 'string' && advanced.status.toUpperCase() === 'COMPLETED') {
				const pollResult = await redirectlessService.poll(creds, advanced, mode, tokenLifetimes, creds.authMethod);
				if (pollResult.status === 'complete' && pollResult.token) {
					setResult(pollResult.token);
					setPollStatus('complete');
					engine.markComplete('authenticate');
					engine.goNext();
					return;
				}
			}

			// Otherwise start a poll loop (real mode: flow may still be PENDING after cred check).
			setLoading(false);
			active.current = true;
			enteredPollPath.current = true;
			setPolling(true);
			setPollStatus('pending');

			const tick = async () => {
				if (!active.current || !mounted.current) return;
				try {
					const r = await redirectlessService.poll(creds, advanced, mode, tokenLifetimes, creds.authMethod);
					if (!active.current || !mounted.current) return;
					setPollStatus(r.status);
					if (r.status === 'complete' && r.token) {
						if (!mounted.current) return;
						setResult(r.token);
						engine.markComplete('authenticate');
						stopPolling();
						engine.goNext();
						return;
					}
					if (r.status === 'failed' || r.status === 'error') {
						if (!mounted.current) return;
						setError(r.error as FlowError);
						stopPolling();
						return;
					}
					if (mounted.current) {
						timer.current = setTimeout(tick, POLL_INTERVAL_MS);
					}
				} catch (err) {
					if (!active.current || !mounted.current) return;
					setError(err as FlowError);
					setPollStatus('error');
					stopPolling();
				}
			};

			timer.current = setTimeout(tick, POLL_INTERVAL_MS);
			return; // loading already cleared above
		} catch (err) {
			setError(err as FlowError);
		} finally {
			// Only clear loading if we didn't enter the poll path (poll path clears it before tick).
			if (!enteredPollPath.current) setLoading(false);
		}
	}, [flowState, creds, username, password, mode, engine, stopPolling, tokenLifetimes]);

	// Mock runs offline — never gate it on real credentials.
	const configured = mode === 'mock' ? true : Boolean(creds.environmentId && creds.clientId);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Redirectless (pi.flow)"
			spec={spec}
			mode={mode}
			onModeChange={selectMode}
			subtitle="The Authorization Code flow with one added parameter — response_mode=pi.flow. PingOne skips the browser redirect: /authorize returns the authorization response as a JSON flow object (no redirect_uri needed) and tokens come back directly in the response body."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure client + user credentials"
					explanation="The app authenticates the user entirely within the SPA by posting credentials to PingOne's Flow API. Because the app handles credentials directly, it must be a highly trusted first-party client — this grant is inappropriate for third-party or public clients."
					canPrev={false}
					nextLabel="Continue"
					onNext={engine.goNext}
					canNext={configured}
				>
					<FlowDiagram
						label="Authorization Code + response_mode=pi.flow"
						nodes={['Client', '/authorize +pi.flow', 'Tokens (JSON)']}
						returnPath={false}
					/>
					<SpecToggle spec={spec} onSpecChange={setSpec} />
					<CredentialsForm
						creds={creds}
						set={set}
						scopePlaceholder="openid profile email"
						onSave={saveCredentials}
						saving={savingCreds}
						saved={savedCreds}
					/>
					<TokenLifetimeConfig
						lifetimes={tokenLifetimes}
						onChange={updateTokenLifetime}
						showIdToken={true}
						showRefreshToken={true}
					/>
					<Grid>
						<FieldGroup
							label="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="user@example.com"
						/>
						<FieldGroup
							label="Password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="user password"
						/>
					</Grid>
					<ExplanationPanel title="It's Authorization Code + one parameter">
						pi.flow is not a separate grant — it is the standard Authorization Code request with
						<code> response_mode=pi.flow</code> added. That one parameter tells PingOne to skip the
						browser redirect: <code>redirect_uri</code> is no longer required, <code>/authorize</code>
						returns the authorization response as a JSON flow object (HTTP 200), and the app advances
						any interactive steps through that object until tokens are returned directly in the body.
						The security tradeoff is that credentials pass through the application itself, so this is
						only appropriate for highly trusted first-party clients — a third-party app should always
						use Authorization Code with a browser redirect instead.
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'start' && (
				<FlowStep
					title="2. Start the redirectless flow"
					explanation="POST /api/pingone/redirectless/authorize with response_mode=pi.flow. PingOne returns a flow object with a flowId, a status (e.g. USERNAME_PASSWORD_REQUIRED), and a resumeUrl. No browser redirect occurs."
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(flowState)}
				>
					{(() => {
						const ep = pingoneEndpoints(creds);
						const curlReq: CurlRequest = {
							method: 'POST',
							url: ep.authorize,
							params: {
								response_type: 'code',
								response_mode: 'pi.flow',
								client_id: creds.clientId,
								scope: creds.scope || 'openid profile email',
							},
						};
						return <RequestPreview request={curlReq} />;
					})()}
					<Action onClick={startFlow} disabled={loading || !configured}>
						{loading
							? 'Starting…'
							: mode === 'real'
								? 'POST /as/authorize (pi.flow)'
								: 'Start mock flow'}
					</Action>
					{error && !flowState && <FlowResult error={error} />}
					{flowState && (
						<ResultCard title="Flow object (pi.flow response)" tone="info">
							<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
								<div>
									<strong>Flow ID:</strong>{' '}
									<code style={{ fontSize: '0.82rem' }}>{flowState.flowId}</code>
								</div>
								<div>
									<strong>Status:</strong>{' '}
									<StatusBadge
										$tone="info"
										style={{ display: 'inline-block', padding: '0.15rem 0.5rem' }}
									>
										{flowState.status}
									</StatusBadge>
								</div>
								{flowState.resumeUrl && (
									<div style={{ fontSize: '0.8rem', color: tokens.color.textMuted }}>
										Resume URL: {flowState.resumeUrl}
									</div>
								)}
							</div>
						</ResultCard>
					)}
				</FlowStep>
			)}

			{cur === 'authenticate' && (
				<FlowStep
					title="3. Submit credentials + poll for completion"
					explanation="POST credentials to /api/pingone/flows/check-username-password (the BFF proxies to PingOne's Flow API). If the flow does not complete immediately, poll /api/pingone/redirectless/poll with the resumeUrl until the status is COMPLETED and tokens arrive."
					onPrev={() => {
						stopPolling();
						engine.goPrev();
					}}
					onNext={engine.goNext}
					canNext={Boolean(result)}
				>
					{!polling ? (
						<Action
							onClick={authenticate}
							disabled={loading || !flowState || !username || !password}
						>
							{loading ? 'Submitting…' : 'Submit credentials'}
						</Action>
					) : (
						<Action onClick={stopPolling}>Stop polling</Action>
					)}
					{pollStatus && pollStatus !== 'complete' && pollStatus !== 'error' && (
						<StatusBadge $tone="info">
							{pollStatus === 'pending'
								? 'Flow in progress — polling for completion…'
								: `Status: ${pollStatus}`}
						</StatusBadge>
					)}
					{pollStatus === 'complete' && (
						<StatusBadge $tone="success">Flow completed — tokens received.</StatusBadge>
					)}
					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{cur === 'use' && (
				<FlowStep
					title="4. Use the tokens"
					explanation="The flow returned an access token and, for the openid scope, an id_token. Decoded claims are shown below — no signature verification."
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
					<FlowResult result={result} />
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default RedirectlessFlow;
