// src/flows2/flows/userInfo.flow.tsx
//
// UserInfo (OIDC §5.3). The client presents a user-delegated access token to the
// authorization server's UserInfo endpoint and receives live, server-authoritative
// claims about the authenticated end-user — the complement to the ID token.
// Uses the shared flows2 primitives for visual parity with the other flows.

import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
import { JsonView } from '../framework/CodeBlock';
import { ResultCard } from '../framework/ResultCard';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { tokens } from '../framework/tokens';
import type { FlowError, FlowMode, StepDefinition } from '../framework/types';
import { decodeJwtPayload } from '../services/pingone';
import {
	userInfoEndpointFor,
	userInfoService as svc,
	type UserInfoResponse,
} from '../services/userInfoService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Environment + user token' },
	{ id: 'fetch', title: 'Fetch', subtitle: 'Call the UserInfo endpoint' },
	{ id: 'compare', title: 'Compare', subtitle: 'UserInfo vs ID token claims' },
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

const Endpoint = styled.code`
	display: block;
	font-size: 0.8rem;
	color: ${tokens.color.textMuted};
	word-break: break-all;
`;

const UserInfoFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [environmentId, setEnvironmentId] = useState(env.VITE_PINGONE_ENVIRONMENT_ID || '');
	const [region, setRegion] = useState(env.VITE_PINGONE_REGION || 'com');
	const [accessToken, setAccessToken] = useState('');
	const [result, setResult] = useState<UserInfoResponse | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	const run = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResult(null);
		try {
			const r = await svc.run({ environmentId, region, accessToken }, mode);
			setResult(r);
			engine.markComplete('fetch');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [environmentId, region, accessToken, mode, engine]);

	const configured = mode === 'mock' ? Boolean(environmentId) : Boolean(environmentId && accessToken);
	// Decode the access token locally — works only if it's a JWT; null for opaque tokens.
	const localClaims = useMemo(
		() => (accessToken ? decodeJwtPayload(accessToken) : null),
		[accessToken]
	);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="UserInfo"
			spec="2.0"
			mode={mode}
			subtitle="OIDC §5.3. Present a user-delegated access token to the UserInfo endpoint and receive live, server-authoritative claims about the end-user — distinct from what was baked into the ID token at issue time."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure the UserInfo call"
					explanation="UserInfo requires a user-delegated access token — one issued via the Authorization Code flow, where a real user authenticated. Client Credentials (machine-to-machine) tokens have no user context and will be rejected."
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
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="uuid"
						/>
						<FieldGroup
							label="Region"
							value={region}
							onChange={(e) => setRegion(e.target.value)}
							placeholder="com | eu | ca | asia"
						/>
					</Grid>
					<FieldGroup
						multiline
						label="Access token (user-delegated, required)"
						value={accessToken}
						onChange={(e) => setAccessToken(e.target.value)}
						placeholder="paste an access token from the Authorization Code flow"
					/>
					<ExplanationPanel title="Why not a worker token?">
						Client Credentials tokens represent an application, not a user — there is no subject
						(end-user) for the UserInfo endpoint to return claims about. Only tokens issued through
						a flow where a human authenticated (Authorization Code, Device Authorization) carry the
						user context that UserInfo needs.
					</ExplanationPanel>
					<ExplanationPanel title="Where does the UserInfo endpoint come from?">
						Every OIDC provider advertises it in the Discovery document at
						<code> /.well-known/openid-configuration</code> under the key{' '}
						<code>userinfo_endpoint</code>. Clients should always discover it there rather than
						hard-coding the path.
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'fetch' && (
				<FlowStep
					title="2. Fetch UserInfo claims"
					explanation="The access token is sent as a Bearer credential in the Authorization header. The AS validates it, checks the granted scopes (openid is required; profile, email, phone expand the returned claims), and replies with live claim values."
					nextLabel="Compare"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(result)}
				>
					<Endpoint>
						{mode === 'real'
							? userInfoEndpointFor(environmentId, region)
							: 'mock — answered locally, no network call'}
					</Endpoint>
					<Action onClick={run} disabled={loading || !configured}>
						{loading ? 'Fetching…' : mode === 'real' ? 'Fetch UserInfo' : 'Fetch mock UserInfo'}
					</Action>
					{error && (
						<ResultCard title={`Error: ${error.error}`} tone="error">
							<JsonView data={error as unknown as Record<string, unknown>} />
						</ResultCard>
					)}
					{result && (
						<ResultCard title="UserInfo claims (server-authoritative)" tone="ok">
							<JsonView data={result} />
						</ResultCard>
					)}
				</FlowStep>
			)}

			{cur === 'compare' && (
				<FlowStep
					title="3. Compare UserInfo vs ID token"
					explanation="The ID token is a signed assertion baked at issue time — claims were true then, and the token is self-contained. UserInfo is a live query answered now. For low-churn attributes (sub, email) they match; for dynamic ones (groups, entitlements, updated_at) UserInfo reflects the current state."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					{result && (
						<ResultCard title="UserInfo claims (live, server-authoritative)" tone="ok">
							<JsonView data={result} />
						</ResultCard>
					)}
					<ResultCard title="Access token payload (local decode, NOT authoritative)" tone="info">
						{localClaims ? (
							<JsonView data={localClaims} />
						) : (
							'This access token is opaque (not a JWT) — there is no local payload to decode. UserInfo is the only way to inspect the user claims it represents.'
						)}
					</ResultCard>
					<ExplanationPanel title="Why both exist">
						The ID token is for the client: a compact, verifiable, offline-usable assertion that
						the user authenticated. UserInfo is for the resource server (or the client when it
						needs fresh data): a live claim set that reflects the user's state right now. Because
						ID tokens are signed at issue time, a long-lived token may carry stale data — use
						UserInfo when you need the current truth (e.g. checking updated roles or email
						verified status).
					</ExplanationPanel>
					<ExplanationPanel title="Scope controls what you get">
						The scopes granted with the access token gate the UserInfo response:{' '}
						<code>openid</code> alone returns only <code>sub</code>; adding <code>profile</code>{' '}
						unlocks name fields; <code>email</code> adds email + email_verified;{' '}
						<code>phone</code> adds phone_number. The server never returns claims beyond what the
						user consented to when the token was issued.
					</ExplanationPanel>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default UserInfoFlow;
