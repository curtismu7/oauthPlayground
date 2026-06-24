// src/flows2/flows/deviceAuthorization.flow.tsx
//
// Device Authorization grant (RFC 8628), real PingOne by default. The user authorizes on a
// second device using a short user_code while this flow polls the token endpoint. Uses the
// shared flows2 primitives for visual parity with the other flows.

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
	ClientAuthMethod,
	FlowCredentials,
	FlowError,
	FlowMode,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import {
	deviceAuthorizationService as svc,
	type DeviceCodeResult,
	type PollStatus,
} from '../services/deviceAuthorizationService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Device client + scope' },
	{ id: 'request', title: 'Device Code', subtitle: 'Get a user code' },
	{ id: 'authorize', title: 'Authorize', subtitle: 'Verify + poll' },
	{ id: 'use', title: 'Use Tokens', subtitle: 'Inspect the result' },
];

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

const UserCode = styled.div`
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 1.9rem;
	font-weight: 700;
	letter-spacing: 0.18em;
	color: ${tokens.color.primary};
	background: ${tokens.color.primarySubtle};
	border: 1px solid ${tokens.color.primaryBorder};
	border-radius: 10px;
	padding: 0.7rem 1rem;
	text-align: center;
`;

const VerifyLink = styled.a`
	font-size: 0.9rem;
	font-weight: 600;
	color: ${tokens.color.primary};
	word-break: break-all;
`;

const Status = styled.div<{ $tone: PollStatus }>`
	font-size: 0.85rem;
	font-weight: 600;
	padding: 0.5rem 0.85rem;
	border-radius: 8px;
	border: 1px solid
		${({ $tone }) =>
			$tone === 'complete'
				? tokens.color.successBorder
				: $tone === 'denied' || $tone === 'expired' || $tone === 'error'
					? '#fecaca'
					: tokens.color.border};
	background: ${({ $tone }) =>
		$tone === 'complete'
			? tokens.color.successBg
			: $tone === 'denied' || $tone === 'expired' || $tone === 'error'
				? '#fef2f2'
				: tokens.color.bgSubtle};
	color: ${({ $tone }) =>
		$tone === 'complete'
			? tokens.color.success
			: $tone === 'denied' || $tone === 'expired' || $tone === 'error'
				? '#991b1b'
				: tokens.color.textSecondary};
`;

const STATUS_TEXT: Record<PollStatus, string> = {
	pending: 'Waiting for you to authorize on the other device… (authorization_pending)',
	slow_down: 'Server asked us to slow down — increasing the poll interval (slow_down).',
	complete: 'Authorized — tokens received.',
	denied: 'Authorization was denied (access_denied).',
	expired: 'The device code expired before it was authorized (expired_token).',
	error: 'Polling failed.',
};

const DeviceAuthorizationFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_DEVICE_CLIENT_ID || env.VITE_PINGONE_USER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_DEVICE_CLIENT_SECRET || '',
		scope: 'openid profile email',
		authMethod: 'client_secret_post',
	});
	const [device, setDevice] = useState<DeviceCodeResult | null>(null);
	const [status, setStatus] = useState<PollStatus | null>(null);
	const [polling, setPolling] = useState(false);
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	// Poll loop bookkeeping — a ref so the recursive setTimeout always sees live values
	// and so unmount/Stop can cancel cleanly.
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const attempt = useRef(0);
	const active = useRef(false);
	const mounted = useRef(true);

	const stopPolling = useCallback(() => {
		active.current = false;
		setPolling(false);
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
	}, []);

	// Cancel any in-flight poll when the component unmounts.
	useEffect(() => {
		return () => {
			mounted.current = false;
			stopPolling();
		};
	}, [stopPolling]);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const requestCode = useCallback(async () => {
		setLoading(true);
		setError(null);
		setDevice(null);
		setStatus(null);
		setResult(null);
		try {
			const d = await svc.requestDeviceCode(creds, mode);
			setDevice(d);
			engine.markComplete('request');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, mode, engine]);

	const startPolling = useCallback(() => {
		if (!device) return;
		active.current = true;
		attempt.current = 0;
		setPolling(true);
		setStatus('pending');
		let intervalMs = Math.max(1, device.interval) * 1000;

		const tick = async () => {
			if (!active.current || !mounted.current) return;
			try {
				const r = await svc.pollOnce(creds, device.deviceCode, mode, attempt.current);
				attempt.current += 1;
				if (!active.current || !mounted.current) return;
				setStatus(r.status);
				if (r.status === 'complete' && r.token) {
					if (!mounted.current) return;
					setResult(r.token);
					engine.markComplete('authorize');
					stopPolling();
					engine.goNext();
					return;
				}
				if (r.status === 'denied' || r.status === 'expired' || r.status === 'error') {
					if (!mounted.current) return;
					setError({ error: r.error?.error || r.status, error_description: r.error?.error_description });
					stopPolling();
					return;
				}
				if (r.status === 'slow_down') intervalMs += 5000; // RFC 8628 §3.5
				timer.current = setTimeout(tick, intervalMs);
			} catch (err) {
				if (!active.current || !mounted.current) return;
				setError(err as FlowError);
				setStatus('error');
				stopPolling();
			}
		};

		// First poll after one interval — the user needs time to enter the code.
		timer.current = setTimeout(tick, intervalMs);
	}, [device, creds, mode, engine, stopPolling]);

	const configured = Boolean(creds.environmentId && creds.clientId);
	const cur = engine.current.id;
	const verifyHref = device?.verificationUriComplete || device?.verificationUri;

	return (
		<FlowContainer
			title="Device Authorization"
			spec="2.0"
			mode={mode}
			subtitle="Browserless / input-constrained devices (RFC 8628). The device shows a short user code; the user authorizes it on a phone or laptop while the device polls for tokens."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure the device client"
					explanation="The device client requests a device + user code with its client_id. PingOne app must have the Device Authorization grant enabled. Real mode calls PingOne via the BFF; mock mode runs offline."
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
						{(['client_secret_post', 'client_secret_basic'] as ClientAuthMethod[]).map((m) => (
							<Pill
								key={m}
								$active={creds.authMethod === m}
								onClick={() => setCreds((c) => ({ ...c, authMethod: m }))}
							>
								{m}
							</Pill>
						))}
					</Toggle>
					<Grid>
						<FieldGroup label="Environment ID" value={creds.environmentId} onChange={set('environmentId')} placeholder="uuid" />
						<FieldGroup label="Region" value={creds.region} onChange={set('region')} placeholder="com | eu | ca | asia" />
						<FieldGroup label="Client ID" value={creds.clientId} onChange={set('clientId')} placeholder="device client id" />
						<FieldGroup label="Client Secret (confidential clients)" type="password" value={creds.clientSecret ?? ''} onChange={set('clientSecret')} placeholder="leave blank for public clients" />
						<FieldGroup label="Scope" value={creds.scope ?? ''} onChange={set('scope')} placeholder="openid profile email" />
					</Grid>
					<ExplanationPanel title="When to use Device Authorization">
						Use it when the device has no browser or no keyboard — smart TVs, CLIs, IoT. The user
						moves to a second device to authorize, so credentials are never typed on the constrained
						device. The device polls the token endpoint until the user finishes (RFC 8628 §3.4).
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'request' && (
				<FlowStep
					title="2. Request a device code"
					explanation="POST to the device_authorization endpoint with the client_id. PingOne returns a device_code (polled secretly), a user_code (shown to the human), a verification_uri, and a poll interval."
					nextLabel="Authorize"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(device)}
				>
					<Action onClick={requestCode} disabled={loading || !configured}>
						{loading ? 'Requesting…' : mode === 'real' ? 'Request device code' : 'Request mock device code'}
					</Action>
					{error && !device && <FlowResult error={error} />}
					{device && (
						<ResultCard title="Device authorization response (RFC 8628 §3.2)" tone="info">
							<div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
								<div>Enter this code on the verification page:</div>
								<UserCode>{device.userCode}</UserCode>
								<div>
									Verification URI:{' '}
									{verifyHref ? (
										<VerifyLink href={verifyHref} target="_blank" rel="noreferrer">
											{verifyHref}
										</VerifyLink>
									) : (
										'—'
									)}
								</div>
								<div style={{ fontSize: '0.8rem', color: tokens.color.textMuted }}>
									Expires in {device.expiresIn}s · poll interval {device.interval}s
								</div>
							</div>
						</ResultCard>
					)}
				</FlowStep>
			)}

			{cur === 'authorize' && (
				<FlowStep
					title="3. Authorize, then poll for tokens"
					explanation="Open the verification URI on a second device, enter the user code, and sign in. Meanwhile this device polls the token endpoint. PingOne replies authorization_pending until you finish, then returns tokens."
					nextLabel="Use Tokens"
					onPrev={() => {
						stopPolling();
						engine.goPrev();
					}}
					onNext={engine.goNext}
					canNext={Boolean(result)}
				>
					{verifyHref && (
						<div style={{ marginBottom: '0.4rem' }}>
							1) Go to{' '}
							<VerifyLink href={verifyHref} target="_blank" rel="noreferrer">
								{verifyHref}
							</VerifyLink>{' '}
							and enter <strong>{device?.userCode}</strong>
						</div>
					)}
					{!polling ? (
						<Action onClick={startPolling} disabled={!device}>
							Start polling
						</Action>
					) : (
						<Action onClick={stopPolling}>Stop polling</Action>
					)}
					{status && <Status $tone={status}>{STATUS_TEXT[status]}</Status>}
					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{cur === 'use' && (
				<FlowStep
					title="4. Use the tokens"
					explanation="The poll returned an access token (and, for openid scope, an id_token + refresh_token). Decoded claims are shown below — no signature verification."
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

export default DeviceAuthorizationFlow;
