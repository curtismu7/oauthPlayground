// src/flows2/flows/redirectless.flow.tsx
//
// Redirectless / pi.flow grant. PingOne response_mode=pi.flow returns a JSON flow object
// instead of issuing a browser redirect; the SPA drives login by submitting credentials
// directly to the PingOne Flow API (via the BFF), then polls until the flow reaches
// COMPLETED and tokens arrive. Good for mobile / native / SPA embedded-auth UX.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
import { ResultCard } from '../framework/ResultCard';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { tokens } from '../framework/tokens';
import type {
	FlowCredentials,
	FlowError,
	FlowMode,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import {
	redirectlessService,
	type RedirectlessFlowState,
	type RedirectlessPollStatus,
} from '../services/redirectlessService';

const env = import.meta.env as Record<string, string | undefined>;

const POLL_INTERVAL_MS = 3000;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Client + user credentials' },
	{ id: 'start', title: 'Start Flow', subtitle: 'POST to /as/authorize (pi.flow)' },
	{ id: 'authenticate', title: 'Authenticate', subtitle: 'Submit credentials + poll' },
	{ id: 'use', title: 'Use Tokens', subtitle: 'Inspect the result' },
];

// ─── Styled components ────────────────────────────────────────────────────────

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.9rem;
	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

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

// ─── Component ────────────────────────────────────────────────────────────────

const RedirectlessFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_USER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_USER_CLIENT_SECRET || '',
		scope: 'openid profile email',
		authMethod: 'client_secret_post',
	});
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

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

	const stopPolling = useCallback(() => {
		active.current = false;
		setPolling(false);
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
	}, []);

	// Cancel any in-flight poll on unmount.
	useEffect(() => stopPolling, [stopPolling]);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	// ── Step 2: start the flow ────────────────────────────────────────────────
	const startFlow = useCallback(async () => {
		setLoading(true);
		setError(null);
		setFlowState(null);
		setPollStatus(null);
		setResult(null);
		try {
			const state = await redirectlessService.startAuthorize(creds, mode);
			setFlowState(state);
			engine.markComplete('start');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, mode, engine]);

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
				mode
			);
			setFlowState(advanced);

			// If the flow completed immediately (e.g. mock), skip the poll loop.
			if (advanced.status.toUpperCase() === 'COMPLETED') {
				const pollResult = await redirectlessService.poll(creds, advanced, mode);
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
				if (!active.current) return;
				try {
					const r = await redirectlessService.poll(creds, advanced, mode);
					if (!active.current) return;
					setPollStatus(r.status);
					if (r.status === 'complete' && r.token) {
						setResult(r.token);
						engine.markComplete('authenticate');
						stopPolling();
						engine.goNext();
						return;
					}
					if (r.status === 'failed' || r.status === 'error') {
						setError(r.error as FlowError);
						stopPolling();
						return;
					}
					timer.current = setTimeout(tick, POLL_INTERVAL_MS);
				} catch (err) {
					if (!active.current) return;
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
	}, [flowState, creds, username, password, mode, engine, stopPolling]);

	const configured = Boolean(creds.environmentId && creds.clientId);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Redirectless (pi.flow)"
			spec="2.0"
			mode={mode}
			subtitle="Native / embedded authentication without a browser redirect. PingOne returns a JSON flow object (response_mode=pi.flow) that the SPA drives directly — no redirect to a hosted login page."
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
					<Toggle>
						<Pill $active={mode === 'real'} onClick={() => setMode('real')}>Real PingOne</Pill>
						<Pill $active={mode === 'mock'} onClick={() => setMode('mock')}>Mock</Pill>
					</Toggle>
					<Grid>
						<FieldGroup
							label="Environment ID"
							value={creds.environmentId}
							onChange={set('environmentId')}
							placeholder="uuid"
						/>
						<FieldGroup
							label="Region"
							value={creds.region}
							onChange={set('region')}
							placeholder="com | eu | ca | asia"
						/>
						<FieldGroup
							label="Client ID"
							value={creds.clientId}
							onChange={set('clientId')}
							placeholder="application client id"
						/>
						<FieldGroup
							label="Client Secret"
							type="password"
							value={creds.clientSecret ?? ''}
							onChange={set('clientSecret')}
							placeholder="application client secret"
						/>
						<FieldGroup
							label="Scope"
							value={creds.scope ?? ''}
							onChange={set('scope')}
							placeholder="openid profile email"
						/>
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
					<ExplanationPanel title="When to use pi.flow / redirectless">
						Redirectless authentication (response_mode=pi.flow) lets a first-party SPA or
						mobile app drive the login ceremony without redirecting the user to a hosted login
						page. PingOne returns a JSON flow object; the app advances it step-by-step through
						the Flow API. The main security tradeoff is that credentials pass through the
						application itself, so this grant is only appropriate for highly trusted first-party
						clients — a third-party app should always use Authorization Code + redirect instead.
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
									<StatusBadge $tone="info" style={{ display: 'inline-block', padding: '0.15rem 0.5rem' }}>
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
					<FlowResult result={result} />
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default RedirectlessFlow;
