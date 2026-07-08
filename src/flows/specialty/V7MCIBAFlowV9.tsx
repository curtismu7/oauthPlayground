// src/flows/specialty/V7MCIBAFlowV9.tsx
// CIBA (Client Initiated Backchannel Authentication) Mock — flows2 modern implementation
// OpenID Connect CIBA Core 1.0 — no external API calls, fully in-browser simulation

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import type { StepDefinition, FlowError } from '../framework/types';
import type { V9MockCIBADeliveryMode } from '../../platform/mock/V9MockCIBAService';
import { V9MockCIBAService } from '../../platform/mock/V9MockCIBAService';
import { introspectToken, type V9MockIntrospectionResponse } from '../../platform/mock/V9MockIntrospectionService';

type TokenResult = {
	access_token: string;
	id_token: string;
	token_type: 'Bearer';
	expires_in: number;
	scope?: string;
};

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Delivery mode & credentials' },
	{ id: 'request', title: 'Request', subtitle: 'Backchannel auth request' },
	{ id: 'approve', title: 'Approve', subtitle: 'Simulate device approval' },
	{ id: 'poll', title: 'Poll', subtitle: 'Fetch tokens' },
	{ id: 'use', title: 'Use', subtitle: 'Inspect & introspect' },
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

const StatusCard = styled.div<{ $status: string }>`
	padding: 0.8rem;
	border-radius: 8px;
	border: 1px solid ${tokens.color.border};
	margin: 0.8rem 0;
	background: ${({ $status }) => {
		switch ($status) {
			case 'pending':
				return '#fef3c7';
			case 'approved':
				return '#d1fae5';
			case 'done':
				return '#d1fae5';
			case 'denied':
			case 'expired':
				return '#fee2e2';
			default:
				return tokens.color.bgSubtle;
		}
	}};
	font-size: 0.95rem;
	line-height: 1.5;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.9rem;
	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const CIBAFlowV2: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [deliveryMode, setDeliveryMode] = useState<V9MockCIBADeliveryMode>('poll');
	const [clientId, setClientId] = useState('ciba-client-001');
	const [scope, setScope] = useState('openid profile email');
	const [loginHint, setLoginHint] = useState('user@example.com');
	const [bindingMessage, setBindingMessage] = useState('Sign in to app');
	const [clientNotificationToken, setClientNotificationToken] = useState('ciba-token-xyz');

	const [authReqId, setAuthReqId] = useState('');
	const [expiresIn, setExpiresIn] = useState<number | null>(null);
	const [status, setStatus] = useState<'idle' | 'pending' | 'approved' | 'denied' | 'expired' | 'done'>('idle');
	const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);
	const [introspectResult, setIntrospectResult] = useState<V9MockIntrospectionResponse | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);
	const [pollCount, setPollCount] = useState(0);

	const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
	const cur = engine.current.id;

	useEffect(() => {
		return () => {
			if (pollInterval.current) clearInterval(pollInterval.current);
		};
	}, []);

	const handleRequest = useCallback(async () => {
		setError(null);
		setLoading(true);
		try {
			const res = V9MockCIBAService.requestBackchannelAuth(
				{
					client_id: clientId,
					scope,
					login_hint: loginHint,
					user_email: loginHint,
					binding_message: bindingMessage,
					delivery_mode: deliveryMode,
				},
				120,
				5
			);

			if ('error' in res) {
				setError({ error: res.error, error_description: res.error_description });
				return;
			}

			setAuthReqId(res.auth_req_id);
			setExpiresIn(res.expires_in);
			setStatus('pending');
			setTokenResult(null);
			setIntrospectResult(null);
			setPollCount(0);

			if (deliveryMode === 'poll') {
				pollInterval.current = setInterval(() => {
					setPollCount((c) => c + 1);
				}, 5000);
			}

			engine.markComplete('request');
			engine.goNext();
		} finally {
			setLoading(false);
		}
	}, [clientId, scope, loginHint, bindingMessage, deliveryMode, engine]);

	const handleApprove = useCallback(() => {
		if (!authReqId) {
			setError({ error: 'invalid_request', error_description: 'No auth_req_id available' });
			return;
		}

		const ok = V9MockCIBAService.approveRequest(authReqId);
		if (ok) {
			setStatus('approved');
			engine.markComplete('approve');
			engine.goNext();
		} else {
			setStatus('expired');
			setError({ error: 'expired_token', error_description: 'The auth_req_id has expired' });
		}
	}, [authReqId, engine]);

	const handleDeny = useCallback(() => {
		if (authReqId) {
			V9MockCIBAService.denyRequest(authReqId);
		}
		setStatus('denied');
		if (pollInterval.current) clearInterval(pollInterval.current);
		setError({ error: 'access_denied', error_description: 'User denied the request' });
	}, [authReqId]);

	const handlePoll = useCallback(async () => {
		if (!authReqId) {
			setError({ error: 'invalid_request', error_description: 'No auth_req_id available' });
			return;
		}

		setLoading(true);
		try {
			const res = V9MockCIBAService.pollForToken(authReqId);

			if ('error' in res) {
				if (res.error === 'authorization_pending') {
					setError({ error: res.error, error_description: 'Waiting for user approval' });
				} else if (res.error === 'access_denied') {
					setStatus('denied');
					if (pollInterval.current) clearInterval(pollInterval.current);
					setError({ error: res.error, error_description: 'User denied the request' });
				} else if (res.error === 'expired_token') {
					setStatus('expired');
					if (pollInterval.current) clearInterval(pollInterval.current);
					setError({ error: res.error, error_description: 'The auth_req_id has expired' });
				} else {
					setError({ error: res.error, error_description: res.error_description });
				}
				return;
			}

			if (pollInterval.current) clearInterval(pollInterval.current);
			setTokenResult(res as TokenResult);
			setStatus('done');
			engine.markComplete('poll');
			engine.goNext();
		} finally {
			setLoading(false);
		}
	}, [authReqId, engine]);

	const handleIntrospect = useCallback(() => {
		if (!tokenResult?.access_token) {
			setError({ error: 'invalid_request', error_description: 'No access token available' });
			return;
		}
		setIntrospectResult(introspectToken(tokenResult.access_token));
	}, [tokenResult]);

	const configured = Boolean(clientId && scope && loginHint && bindingMessage);

	return (
		<FlowContainer
			title="CIBA (Backchannel Authentication)"
			spec="OIDC"
			mode="mock"
			subtitle="Client-initiated out-of-band authentication. The user approves on a separate device (phone, biometric) while your app polls, receives a ping, or gets pushed the token."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure"
					explanation="Select delivery mode (poll/ping/push) and app credentials. Mock mode runs offline with no PingOne setup needed."
					canPrev={false}
					nextLabel="Continue"
					onNext={engine.goNext}
					canNext={true}
				>
					<Toggle>
						<Pill $active={deliveryMode === 'poll'} onClick={() => setDeliveryMode('poll')}>
							Poll
						</Pill>
						<Pill $active={deliveryMode === 'ping'} onClick={() => setDeliveryMode('ping')}>
							Ping
						</Pill>
						<Pill $active={deliveryMode === 'push'} onClick={() => setDeliveryMode('push')}>
							Push
						</Pill>
					</Toggle>

					<ExplanationPanel title={`${deliveryMode.charAt(0).toUpperCase() + deliveryMode.slice(1)} mode`}>
						{deliveryMode === 'poll' &&
							'Client repeatedly polls the token endpoint until approval is received or timeout. No notification endpoint needed.'}
						{deliveryMode === 'ping' &&
							'Server sends a ping notification to your client_notification_endpoint when ready. You then fetch tokens.'}
						{deliveryMode === 'push' &&
							'Server pushes the complete token response directly to your client_notification_endpoint. Most efficient.'}
					</ExplanationPanel>

					<Grid>
						<FieldGroup
							label="Client ID"
							value={clientId}
							onChange={(e) => setClientId(e.target.value)}
						/>
						<FieldGroup
							label="Scope"
							value={scope}
							onChange={(e) => setScope(e.target.value)}
							placeholder="openid profile email"
						/>
						<FieldGroup
							label="Login Hint (user identifier)"
							value={loginHint}
							onChange={(e) => setLoginHint(e.target.value)}
							placeholder="user@example.com"
						/>
						<FieldGroup
							label="Binding Message"
							value={bindingMessage}
							onChange={(e) => setBindingMessage(e.target.value)}
							placeholder="Sign in to app"
						/>
						{deliveryMode !== 'poll' && (
							<FieldGroup
								label="Client Notification Token"
								value={clientNotificationToken}
								onChange={(e) => setClientNotificationToken(e.target.value)}
								placeholder="Required for ping/push"
							/>
						)}
					</Grid>
				</FlowStep>
			)}

			{cur === 'request' && (
				<FlowStep
					title="2. Send Backchannel Request"
					explanation="POST to /bc-authorize with client credentials, user identifier, and binding message. The server returns auth_req_id."
					nextLabel="Next"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(authReqId)}
				>
					<Action onClick={handleRequest} disabled={loading || !configured}>
						{loading ? 'Sending…' : 'Request Backchannel Auth'}
					</Action>

					{authReqId && (
						<>
							<ResultCard title="BC-Authorize response" tone="ok">
								<CodeBlock label="auth_req_id" value={authReqId} />
								<CodeBlock label="expires_in" value={String(expiresIn)} />
							</ResultCard>
						</>
					)}

					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{cur === 'approve' && (
				<FlowStep
					title="3. Simulate User Approval"
					explanation="In a real flow, the user approves on their separate device (phone push, biometric, etc.). Here we simulate that approval."
					nextLabel="Next"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={status === 'approved'}
				>
					<StatusCard $status={status}>
						{status === 'pending' && '⏳ Waiting for approval on your authentication device…'}
						{status === 'approved' && '✅ User approved! Proceed to fetch tokens.'}
						{status === 'denied' && '❌ User denied the request.'}
						{status === 'expired' && '❌ Request expired. Start a new one.'}
					</StatusCard>

					{status !== 'approved' && status !== 'denied' && status !== 'expired' && (
						<div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
							<Action onClick={handleApprove} disabled={status === 'approved'}>
								Approve
							</Action>
							<Action onClick={handleDeny} style={{ background: '#ef4444', borderColor: '#dc2626' }}>
								Deny
							</Action>
						</div>
					)}

					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{cur === 'poll' && (
				<FlowStep
					title="4. Fetch Tokens"
					explanation={
						deliveryMode === 'poll'
							? 'Poll the token endpoint until the server returns tokens or an error.'
							: `Wait for the server's ${deliveryMode} notification, then fetch tokens.`
					}
					nextLabel="Use Tokens"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(tokenResult)}
				>
					<Action onClick={handlePoll} disabled={loading || !authReqId}>
						{loading ? 'Polling…' : 'Fetch Token'}
					</Action>

					{tokenResult && (
						<ResultCard title="Token response" tone="ok">
							<CodeBlock label="access_token" value={tokenResult.access_token.substring(0, 50) + '...'} />
							<CodeBlock label="token_type" value={tokenResult.token_type} />
							<CodeBlock label="expires_in" value={String(tokenResult.expires_in)} />
						</ResultCard>
					)}

					{error && <FlowResult error={error} />}
				</FlowStep>
			)}

			{cur === 'use' && (
				<FlowStep
					title="5. Use & Inspect Tokens"
					explanation="Introspect the access token to verify its claims, scopes, and validity."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					<Action onClick={handleIntrospect} disabled={!tokenResult?.access_token}>
						Introspect Token
					</Action>

					{tokenResult && (
						<ResultCard title="Token payload" tone="info">
							<JsonView
								data={{
									access_token: tokenResult.access_token.substring(0, 30) + '...',
									token_type: tokenResult.token_type,
									expires_in: tokenResult.expires_in,
									scope: tokenResult.scope,
								}}
							/>
						</ResultCard>
					)}

					{introspectResult && (
						<ResultCard title="Introspection result" tone="info">
							<JsonView data={introspectResult} />
						</ResultCard>
					)}

					<ExplanationPanel title="What just happened">
						CIBA allows apps on untrusted devices (kiosks, IoT, call centers) to initiate authentication on the user's trusted device
						(phone, biometric) without ever redirecting. The user approves on their device, and your app receives tokens via poll, ping,
						or push.
					</ExplanationPanel>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default CIBAFlowV2;

export const V7MCIBAFlowV9 = CIBAFlowV2;
