// src/flows2/flows/tokenExchange.flow.tsx
//
// Token Exchange grant (RFC 8693), real PingOne by default. A subject token (and optional
// actor token) is exchanged for a narrowed / delegated token; when an actor token is present
// the BFF enforces the subject's may_act rule and the issued token carries an act claim.
// Uses the shared flows2 primitives for visual parity with the other flows.

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowResult } from '../framework/FlowResult';
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
	TokenResult,
} from '../framework/types';
import { tokenExchangeService as svc, type MayActResult } from '../services/tokenExchangeService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Subject + actor tokens' },
	{ id: 'exchange', title: 'Exchange', subtitle: 'Trade for a new token' },
	{ id: 'inspect', title: 'Inspect', subtitle: 'Introspect the result' },
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

const SecondaryAction = styled(Action)`
	border-color: ${tokens.color.primaryBorder};
	background: ${tokens.color.primary};
`;

const TokenExchangeFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_WORKER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_WORKER_CLIENT_SECRET || '',
		authMethod: 'client_secret_post',
	});
	const [subjectToken, setSubjectToken] = useState('');
	const [actorToken, setActorToken] = useState('');
	const [requestedScopes, setRequestedScopes] = useState('');
	const [audience, setAudience] = useState('');
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [mayAct, setMayAct] = useState<MayActResult | null>(null);
	const [introspectData, setIntrospectData] = useState<Record<string, unknown> | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const run = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResult(null);
		setIntrospectData(null);
		try {
			const r = await svc.run({ credentials: creds, subjectToken, actorToken: actorToken || undefined, requestedScopes, audience }, mode);
			setResult(r);
			engine.markComplete('exchange');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, subjectToken, actorToken, requestedScopes, audience, mode, engine]);

	const checkDelegation = useCallback(async () => {
		if (!subjectToken || !actorToken) return;
		setMayAct(await svc.validateMayAct(subjectToken, actorToken, mode));
	}, [subjectToken, actorToken, mode]);

	const inspect = useCallback(async () => {
		if (!result?.accessToken) return;
		setIntrospectData(await svc.introspect(result.accessToken, creds, mode));
		engine.markComplete('inspect');
	}, [result, creds, mode, engine]);

	const configured = Boolean(creds.environmentId && creds.clientId && subjectToken);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Token Exchange"
			spec="2.0"
			mode={mode}
			subtitle="Delegation / on-behalf-of (RFC 8693). A subject token is exchanged for a narrowed token; with an actor token the subject's may_act rule is enforced and the issued token carries an act claim."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure the exchange"
					explanation="The requesting client presents a subject_token (whose identity is preserved) and, for delegation, an actor_token. Real mode calls PingOne via the BFF, which enforces may_act; mock mode runs offline."
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
						<FieldGroup label="Client ID (requesting client)" value={creds.clientId} onChange={set('clientId')} placeholder="client id" />
						<FieldGroup label="Client Secret" type="password" value={creds.clientSecret ?? ''} onChange={set('clientSecret')} placeholder="client secret" />
						<FieldGroup label="Requested scopes (optional)" value={requestedScopes} onChange={(e) => setRequestedScopes(e.target.value)} placeholder="narrow the issued token" />
						<FieldGroup label="Audience (optional, RFC 8707)" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="target resource" />
					</Grid>
					<FieldGroup
						multiline
						label="Subject token (required) — the token being exchanged"
						value={subjectToken}
						onChange={(e) => setSubjectToken(e.target.value)}
						placeholder="paste an access token (e.g. from the Authorization Code flow)"
					/>
					<FieldGroup
						multiline
						label="Actor token (optional) — the delegate acting on the subject's behalf"
						value={actorToken}
						onChange={(e) => setActorToken(e.target.value)}
						placeholder="paste the actor's access token to request delegation (drives the act claim)"
					/>
					<ExplanationPanel title="When to use Token Exchange">
						Use it to swap one token for another without re-authenticating the user — narrowing scope/audience
						for a downstream service, or delegating so a service (the actor) can act on a user's (the subject's)
						behalf. Delegation is gated by the subject token's may_act claim, and the issued token records the
						chain in its act claim.
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'exchange' && (
				<FlowStep
					title="2. Exchange the token"
					explanation="POST grant_type=urn:ietf:params:oauth:grant-type:token-exchange with the subject (and optional actor) token. The issued token is decoded below; an act claim appears when delegation was approved."
					nextLabel="Inspect"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(result)}
				>
					<Toggle>
						<Action onClick={run} disabled={loading || !configured}>
							{loading ? 'Exchanging…' : mode === 'real' ? 'Exchange real token' : 'Exchange mock token'}
						</Action>
						{actorToken && (
							<SecondaryAction onClick={checkDelegation}>
								Validate delegation (may_act)
							</SecondaryAction>
						)}
					</Toggle>
					{mayAct && (
						<ResultCard
							title={mayAct.valid ? 'Delegation approved (may_act)' : 'Delegation rejected (may_act)'}
							tone={mayAct.valid ? 'ok' : 'error'}
						>
							<JsonView data={mayAct as unknown as Record<string, unknown>} />
						</ResultCard>
					)}
					<FlowResult result={result} error={error} />
				</FlowStep>
			)}

			{cur === 'inspect' && (
				<FlowStep
					title="3. Introspect the issued token"
					explanation="RFC 7662 introspection confirms the exchanged token is active and shows what it carries — scope, aud, exp, and the act claim recording the delegation chain."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					<Action onClick={inspect} disabled={!result?.accessToken}>Introspect issued token</Action>
					{introspectData && (
						<ResultCard title="Introspection (RFC 7662)" tone="info">
							<JsonView data={introspectData} />
						</ResultCard>
					)}
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default TokenExchangeFlow;
