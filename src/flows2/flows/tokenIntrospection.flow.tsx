// src/flows2/flows/tokenIntrospection.flow.tsx
//
// Token Introspection (RFC 7662), real PingOne by default. The client asks the
// authorization server whether a token is active and what it carries — the authoritative
// answer, unlike a local JWT decode (which cannot see revocation and fails on opaque
// tokens). Uses the shared flows2 primitives for visual parity with the other flows.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
import { JsonView } from '../framework/CodeBlock';
import { ResultCard } from '../framework/ResultCard';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { tokens } from '../framework/tokens';
import type {
	ClientAuthMethod,
	FlowCredentials,
	FlowError,
	FlowMode,
	StepDefinition,
} from '../framework/types';
import { decodeJwtPayload } from '../services/pingone';
import {
	introspectionEndpointFor,
	tokenIntrospectionService as svc,
	type IntrospectionResponse,
	type TokenTypeHint,
} from '../services/tokenIntrospectionService';
import { useFlowStorage } from '../framework/useFlowStorage';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Client + token to inspect' },
	{ id: 'introspect', title: 'Introspect', subtitle: 'Ask the AS (RFC 7662)' },
	{ id: 'compare', title: 'Compare', subtitle: 'vs a local decode' },
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

const TokenIntrospectionFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_WORKER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_WORKER_CLIENT_SECRET || '',
		// The default worker app is registered for client_secret_basic only; sending
		// client_secret_post makes PingOne reject the introspect call with
		// "Unsupported authentication method". Users can still toggle to post.
		authMethod: 'client_secret_basic',
	});
	const [token, setToken] = useState('');
	const [hint, setHint] = useState<TokenTypeHint | undefined>(undefined);
	const [result, setResult] = useState<IntrospectionResponse | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const { saveState, restoreState } = useFlowStorage('flows2:token-introspection');

	const run = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResult(null);
		try {
			const r = await svc.run({ credentials: creds, token, tokenTypeHint: hint }, mode);
			setResult(r);
			engine.markComplete('introspect');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, token, hint, mode, engine]);

	useEffect(() => {
		restoreState().then((saved) => {
			if (!saved) return;
			if (!token && saved.token) setToken(saved.token as string);
			if (!result && saved.result) setResult(saved.result as typeof result);
			if (!error && saved.error) setError(saved.error as typeof error);
		});
	}, [restoreState]);

	useEffect(() => {
		saveState({ token, hint, result, error });
	}, [token, hint, result, error, saveState]);

	const configured = Boolean(creds.environmentId && creds.clientId && token);
	const localClaims = useMemo(() => (token ? decodeJwtPayload(token) : null), [token]);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Token Introspection"
			spec="2.0"
			mode={mode}
			subtitle="RFC 7662. A client asks the authorization server whether a token is active and what it carries — the authoritative answer, valid even for opaque or revoked tokens."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure the introspection call"
					explanation="Introspection is a protected endpoint: the caller authenticates as a client (RFC 7662 §2.1). Paste any token issued by your environment — an access token from the Authorization Code or Client Credentials flow works well."
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
						<FieldGroup label="Client ID" value={creds.clientId} onChange={set('clientId')} placeholder="client id" />
						<FieldGroup label="Client Secret" type="password" value={creds.clientSecret ?? ''} onChange={set('clientSecret')} placeholder="client secret" />
					</Grid>
					<FieldGroup
						multiline
						label="Token to introspect (required)"
						value={token}
						onChange={(e) => setToken(e.target.value)}
						placeholder="paste an access or refresh token (e.g. from the Authorization Code flow)"
					/>
					<Toggle>
						{([[undefined, 'no hint'], ['access_token', 'access_token'], ['refresh_token', 'refresh_token']] as const).map(([v, label]) => (
							<Pill key={label} $active={hint === v} onClick={() => setHint(v)}>
								{label}
							</Pill>
						))}
					</Toggle>
					<ExplanationPanel title="When to use introspection">
						Resource servers use it to validate tokens they cannot (or should not) decode themselves:
						opaque tokens have no readable payload, and even a valid JWT may have been revoked since it
						was issued. The optional token_type_hint just tells the AS which token store to search first.
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'introspect' && (
				<FlowStep
					title="2. Ask the authorization server"
					explanation="POST token (and the client's own credentials) to the introspection endpoint. The response is a JSON object whose only guaranteed member is active — everything else (scope, sub, exp, aud) appears only while the token is live (RFC 7662 §2.2)."
					nextLabel="Compare"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(result)}
				>
					<Endpoint>{mode === 'real' ? introspectionEndpointFor(creds) : 'mock — answered locally, no network call'}</Endpoint>
					<Action onClick={run} disabled={loading || !configured}>
						{loading ? 'Introspecting…' : mode === 'real' ? 'Introspect real token' : 'Introspect mock token'}
					</Action>
					{error && (
						<ResultCard title={`Error: ${error.error}`} tone="error">
							<JsonView data={error as unknown as Record<string, unknown>} />
						</ResultCard>
					)}
					{result && (
						<ResultCard
							title={result.active ? 'Token is ACTIVE' : 'Token is INACTIVE'}
							tone={result.active ? 'ok' : 'error'}
						>
							<JsonView data={result} />
						</ResultCard>
					)}
				</FlowStep>
			)}

			{cur === 'compare' && (
				<FlowStep
					title="3. Compare with a local decode"
					explanation="A local JWT decode reads the payload without asking the AS — fast, but not authoritative: it cannot detect revocation, and it fails entirely on opaque tokens. Introspection is the server's truth; note that an inactive token returns ONLY { active: false }, never its old claims."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					{result && (
						<ResultCard title="Introspection (authoritative)" tone={result.active ? 'ok' : 'error'}>
							<JsonView data={result} />
						</ResultCard>
					)}
					<ResultCard title="Local decode (NOT authoritative)" tone="info">
						{localClaims ? (
							<JsonView data={localClaims} />
						) : (
							'This token is opaque (or not a JWT) — there is nothing to decode locally. Introspection is the only way to learn its state.'
						)}
					</ResultCard>
					<ExplanationPanel title="Why both exist">
						JWT validation (signature + exp, offline) scales — no network hop per request — but a token
						stays "valid" until it expires even if it was revoked. Introspection trades a network call
						for live truth. Many deployments combine them: local checks per request, introspection for
						high-value operations.
					</ExplanationPanel>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default TokenIntrospectionFlow;
