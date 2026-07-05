// src/flows2/flows/implicitHybrid.flow.tsx
//
// Implicit + Hybrid flow — flows2 clean-core rebuild. Spec '2.0' only.
// Taught explicitly as LEGACY / AVOID: implicit removed in OAuth 2.1 (RFC 9700).
//
// Both sub-modes return via the URL *fragment* (#…) with response_mode=fragment:
//   implicit  → response_type=token (or 'id_token token' for OIDC)
//   hybrid    → response_type='code id_token' + a back-channel code exchange
//
// Real redirect: window.location.assign → PingOne → /v2/flows/implicit-hybrid-callback
//   (the dedicated FRAGMENT callback) → stash result → navigate back here.
// Mock: fragment params generated offline, stash written immediately.

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
	applyImplicitHybridSabotage,
	implicitHybridSabotageScenarios,
} from '../content/implicitHybridSabotage';
import {
	implicitHybridActors,
	implicitHybridInteractions,
} from '../content/implicitHybridSequence';
import { implicitHybridSpecVsPingOne } from '../content/implicitHybridSpecVsPingOne';
import { BreakItLab } from '../framework/BreakItLab';
import { CodeBlock, JsonView } from '../framework/CodeBlock';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { FieldGroup } from '../framework/FieldGroup';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowResult } from '../framework/FlowResult';
import { FlowSequenceDiagram } from '../framework/FlowSequenceDiagram';
import { FlowStep } from '../framework/FlowStep';
import { ResultCard } from '../framework/ResultCard';
import { SpecVsPingOneList } from '../framework/SpecVsPingOne';
import { tokens } from '../framework/tokens';
import type {
	FlowCredentials,
	FlowError,
	FlowMode,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import { useFlowEngine } from '../framework/useFlowEngine';
import { useFlowStorage } from '../framework/useFlowStorage';
import { PathProgressBadge } from '../learning/PathProgressBadge';
import {
	type FragmentParams,
	type ImplicitHybridSubMode,
	implicitHybridService,
} from '../services/implicitHybridService';
import {
	IH_PENDING_KEY,
	IH_RESULT_KEY,
	type ImplicitHybridPending,
} from './ImplicitHybridCallback';

// ── Step definitions ─────────────────────────────────────────────────────────

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'App credentials + sub-mode' },
	{ id: 'authorize', title: 'Authorize', subtitle: 'Redirect to PingOne (fragment)' },
	{ id: 'result', title: 'Result', subtitle: 'Fragment tokens (+ exchange)' },
	{ id: 'explain', title: 'Inspect', subtitle: 'Why this flow is retired' },
];

// ── Styled components ────────────────────────────────────────────────────────

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

const WarnBanner = styled.div`
	background: #fef9c3;
	border: 1px solid #fde047;
	border-left: 3px solid #ca8a04;
	border-radius: ${tokens.radius.lg};
	padding: ${tokens.space.md} ${tokens.space.lg};
	font-size: 0.84rem;
	color: #713f12;
	line-height: 1.5;
`;

// ── Env prefill ──────────────────────────────────────────────────────────────

const env = import.meta.env as Record<string, string | undefined>;

const defaultRedirectUri = () =>
	typeof window !== 'undefined'
		? `${window.location.origin}/v2/flows/implicit-hybrid-callback`
		: '';

// ── Component ────────────────────────────────────────────────────────────────

const ImplicitHybridFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [subMode, setSubMode] = useState<ImplicitHybridSubMode>('implicit');
	const [oidc, setOidc] = useState(true);
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_IMPLICIT_CLIENT_ID || env.VITE_PINGONE_USER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_IMPLICIT_CLIENT_SECRET || '',
		scope: '',
	});
	const [redirectUri, setRedirectUri] = useState(defaultRedirectUri());
	const [authUrl, setAuthUrl] = useState('');
	const [fragmentParams, setFragmentParams] = useState<FragmentParams | null>(null);
	const [exchangeResult, setExchangeResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);
	// Break-it Lab: the sabotage scenario selected for the authorize step (null = run
	// correctly). Applied to the outgoing authorize params right before dispatch.
	const [sabotageId, setSabotageId] = useState<string | null>(null);

	const { saveState, restoreState } = useFlowStorage('flows2:implicit-hybrid');

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	// Resume after the real redirect: the dedicated callback wrote the fragment
	// params into sessionStorage under IH_RESULT_KEY and navigate()d back here.
	useEffect(() => {
		let raw: string | null = null;
		try {
			raw = sessionStorage.getItem(IH_RESULT_KEY);
		} catch {
			// sessionStorage unavailable
		}
		if (!raw) return;

		try {
			sessionStorage.removeItem(IH_RESULT_KEY);
		} catch {
			// noop
		}

		try {
			const params = JSON.parse(raw) as FragmentParams;
			if (!params.state) {
				setError({
					error: 'missing_state',
					error_description: 'Authorization response missing state parameter.',
				});
				return;
			}
			if (!params.access_token && !params.code) {
				setError({
					error: 'missing_token',
					error_description: 'Authorization response missing access_token or code.',
				});
				return;
			}
			setFragmentParams(params);
			engine.markComplete('authorize');
			engine.goTo(2); // result step
		} catch (_err) {
			setError({
				error: 'parse_error',
				error_description: 'Failed to parse authorization response.',
			});
		}
	}, [engine]);

	const handleAuthorize = useCallback(async () => {
		setError(null);
		setLoading(true);
		try {
			// Break-it Lab: apply the selected authorize-stage sabotage (e.g. tamper state)
			// to the outgoing params. No-op when nothing is selected or the scenario is
			// simulate-only (omit-nonce, unsupported-response-type).
			const authorizeParams = applyImplicitHybridSabotage(sabotageId, 'authorize', {
				state: crypto.randomUUID(),
				nonce: crypto.randomUUID(),
			});
			const state = authorizeParams.state;
			const nonce = authorizeParams.nonce;

			if (mode === 'mock') {
				// Generate offline fragment params and advance immediately.
				const frag = implicitHybridService.mockFragment(subMode, oidc, state, nonce, creds);
				setFragmentParams(frag as FragmentParams);
				engine.markComplete('authorize');
				engine.goTo(2);
				return;
			}

			// Real mode: stash what we need to resume, then redirect to PingOne.
			const pending: ImplicitHybridPending = {
				state,
				nonce,
				subMode,
				oidc,
				environmentId: creds.environmentId,
				region: creds.region,
				clientId: creds.clientId,
				redirectUri,
				scope: creds.scope,
			};
			try {
				sessionStorage.setItem(IH_PENDING_KEY, JSON.stringify(pending));
			} catch {
				// sessionStorage unavailable
			}

			const url = implicitHybridService.buildAuthorizeUrl({
				credentials: creds,
				subMode,
				oidc,
				redirectUri,
				state,
				nonce,
			});
			setAuthUrl(url);
			window.location.assign(url);
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [mode, subMode, oidc, creds, redirectUri, engine, sabotageId]);

	// Hybrid only: exchange the front-channel code at the token endpoint.
	const handleExchange = useCallback(async () => {
		if (!fragmentParams?.code) {
			setError({
				error: 'missing_code',
				error_description:
					'Authorization code not found. The authorization response may have been truncated or corrupted. Try starting the flow again.',
			});
			return;
		}
		setError(null);
		setLoading(true);
		try {
			const result = await implicitHybridService.exchangeCode(
				{
					credentials: creds,
					redirectUri,
					code: fragmentParams.code,
				},
				mode
			);
			setExchangeResult(result);
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [fragmentParams, creds, redirectUri, mode]);

	useEffect(() => {
		restoreState().then((saved) => {
			if (!saved) return;
			if (!fragmentParams && saved.fragmentParams)
				setFragmentParams(saved.fragmentParams as typeof fragmentParams);
			if (!exchangeResult && saved.exchangeResult)
				setExchangeResult(saved.exchangeResult as typeof exchangeResult);
			if (!error && saved.error) setError(saved.error as typeof error);
		});
	}, [restoreState, fragmentParams, exchangeResult, error]);

	useEffect(() => {
		saveState({ fragmentParams, exchangeResult, error });
	}, [fragmentParams, exchangeResult, error, saveState]);

	// Break-it Lab reads back the actual outcome of the last authorize run to compare
	// against the scenario's predicted error.
	const lastOutcome = error ? { error } : fragmentParams ? { ok: true } : null;

	const configured = Boolean(
		creds.environmentId &&
			creds.clientId &&
			redirectUri &&
			(subMode === 'implicit' || creds.clientSecret)
	);

	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Implicit + Hybrid (Legacy)"
			spec="2.0"
			mode={mode}
			subtitle="Access tokens returned directly in the URL fragment. Implicit is removed in OAuth 2.1 (RFC 9700); hybrid is a transitional pattern. Both are presented for educational purposes — do not use in new applications."
			engine={engine}
		>
			<PathProgressBadge flowRoute="/v2/flows/implicit-hybrid" />
			<FlowSequenceDiagram
				title="Live sequence — the current step is highlighted"
				actors={implicitHybridActors}
				interactions={implicitHybridInteractions}
				activeStepId={cur}
				completedStepIds={engine.completed}
			/>
			{/* ── Step 1: Configure ─────────────────────────────────────────── */}
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure"
					explanation="Choose Implicit (token in fragment, no code exchange) or Hybrid (code + id_token in fragment, then a back-channel code exchange). Both use response_mode=fragment."
					canPrev={false}
					nextLabel="Continue"
					onNext={engine.goNext}
					canNext={configured}
				>
					<WarnBanner>
						Legacy flows — educational use only. Implicit is removed in OAuth 2.1. Use Authorization
						Code + PKCE for all new applications.
					</WarnBanner>

					<Toggle>
						<Pill $active={mode === 'real'} onClick={() => setMode('real')}>
							Real PingOne
						</Pill>
						<Pill $active={mode === 'mock'} onClick={() => setMode('mock')}>
							Mock
						</Pill>
					</Toggle>

					<Toggle>
						<Pill $active={subMode === 'implicit'} onClick={() => setSubMode('implicit')}>
							Implicit
						</Pill>
						<Pill $active={subMode === 'hybrid'} onClick={() => setSubMode('hybrid')}>
							Hybrid
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
						{subMode === 'hybrid' && (
							<FieldGroup
								label="Client Secret"
								type="password"
								value={creds.clientSecret ?? ''}
								onChange={set('clientSecret')}
								hint="Required for the hybrid back-channel code exchange"
							/>
						)}
						<FieldGroup
							label="Redirect URI"
							value={redirectUri}
							onChange={(e) => setRedirectUri(e.target.value)}
							hint="Must be registered on the PingOne app; receives the fragment"
						/>
						<FieldGroup
							label="Scope (optional)"
							value={creds.scope ?? ''}
							onChange={set('scope')}
							placeholder={oidc ? 'openid profile email' : 'openid'}
						/>
					</Grid>
					<SpecVsPingOneList
						title="Spec vs PingOne — how this flow differs on PingOne"
						entries={implicitHybridSpecVsPingOne}
					/>
				</FlowStep>
			)}

			{/* ── Step 2: Authorize ─────────────────────────────────────────── */}
			{cur === 'authorize' && (
				<FlowStep
					title="2. Authorize"
					explanation={
						mode === 'real'
							? `Builds the /as/authorize URL with response_type=${subMode === 'hybrid' ? 'code id_token' : oidc ? 'id_token token' : 'token'} and response_mode=fragment, then redirects you to PingOne. You return to /v2/flows/implicit-hybrid-callback where the fragment is parsed.`
							: 'Mock mode generates offline fragment params (no redirect, no PingOne).'
					}
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(fragmentParams)}
				>
					<BreakItLab
						scenarios={implicitHybridSabotageScenarios}
						stage="authorize"
						selectedId={sabotageId}
						onSelect={setSabotageId}
						lastOutcome={lastOutcome}
					/>
					<Action onClick={handleAuthorize} disabled={loading || !configured}>
						{loading
							? 'Working…'
							: mode === 'real'
								? `Authorize with PingOne (${subMode}) →`
								: `Issue ${subMode} fragment (mock)`}
					</Action>
					{authUrl && <CodeBlock label="Authorization URL" value={authUrl} />}
					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{/* ── Step 3: Result ────────────────────────────────────────────── */}
			{cur === 'result' && (
				<FlowStep
					title="3. Fragment result"
					explanation={
						subMode === 'hybrid'
							? 'The front-channel fragment contains a code and an id_token. Validate the id_token nonce and c_hash, then exchange the code at the token endpoint (back-channel) for a full token set including refresh_token.'
							: 'Tokens arrive directly in the URL fragment. The client reads window.location.hash — they never reach the server. No code exchange step.'
					}
					nextLabel="Inspect (why this is legacy)"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext
				>
					{fragmentParams && (
						<ResultCard title="Fragment params (#…)" tone="ok">
							<JsonView data={fragmentParams} />
						</ResultCard>
					)}

					{subMode === 'hybrid' && (
						<>
							<Action onClick={handleExchange} disabled={loading || !fragmentParams?.code}>
								{loading ? 'Exchanging…' : 'Exchange code (back-channel)'}
							</Action>
							{exchangeResult && (
								<ResultCard title="Token endpoint response (back-channel)" tone="info">
									<FlowResult result={exchangeResult} />
								</ResultCard>
							)}
						</>
					)}

					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{/* ── Step 4: Explain ───────────────────────────────────────────── */}
			{cur === 'explain' && (
				<FlowStep
					title="4. Why this flow is retired"
					explanation="OAuth 2.1 (RFC 9700 / Security BCP) removes both implicit and hybrid flows. Authorization Code + PKCE achieves the same goals with a much stronger security posture."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					<ExplanationPanel title="Why implicit was removed (OAuth 2.1)" defaultOpen>
						<ul>
							<li>
								<strong>Tokens exposed in the URL.</strong> The fragment leaks into browser history,
								server logs, and Referer headers. Any script or extension on the page can read
								window.location.hash.
							</li>
							<li>
								<strong>No client authentication.</strong> The authorization server cannot verify
								which client received the token — there is no code binding it to a secret.
							</li>
							<li>
								<strong>No PKCE equivalent.</strong> Without a code verifier, an intercepted
								authorization response immediately yields a usable token.
							</li>
							<li>
								<strong>No refresh tokens.</strong> Access tokens must be long-lived, increasing the
								window of exposure for any leakage.
							</li>
						</ul>
					</ExplanationPanel>

					<ExplanationPanel title="Why hybrid is a transitional pattern" defaultOpen>
						<ul>
							<li>
								<strong>Code in the front channel.</strong> Hybrid sends the authorization code in
								the fragment, where it is still exposed to the browser — the same risk profile as
								implicit.
							</li>
							<li>
								<strong>Immediate id_token for identity.</strong> The id_token in the fragment lets
								the app display who the user is before the back-channel code exchange completes. The
								c_hash claim cryptographically binds the id_token to the code.
							</li>
							<li>
								<strong>Better than implicit, worse than auth code.</strong> Hybrid trades some
								security for reduced round-trips. RFC 9700 recommends against it; use Authorization
								Code + PKCE with OIDC instead.
							</li>
						</ul>
					</ExplanationPanel>

					<ExplanationPanel title="What to use instead">
						Use <strong>Authorization Code + PKCE</strong> (response_type=code,
						response_mode=query). Tokens are only returned from the token endpoint over a
						server-to-server TLS connection — never visible in the URL. PKCE binds the code to the
						client without a client secret, making it safe for public clients (SPAs, mobile apps)
						and confidential clients alike.
					</ExplanationPanel>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default ImplicitHybridFlow;
