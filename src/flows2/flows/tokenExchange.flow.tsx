// src/flows2/flows/tokenExchange.flow.tsx
//
// Token Exchange grant (RFC 8693), real PingOne by default. A subject token (and optional
// actor token) is exchanged for a narrowed / delegated token; when an actor token is present
// the BFF enforces the subject's may_act rule and the issued token carries an act claim.
// Uses the shared flows2 primitives for visual parity with the other flows.
//
// FLAG: PingOne real support for RFC 8693 token exchange is limited — it requires a custom
// resource server and the VITE_PINGONE_TOKEN_EXCHANGE_SCOPE env var to be set. The mock
// path runs fully offline and is always reliable.

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { JsonView } from '../framework/CodeBlock';
import { CredentialsForm } from '../framework/CredentialsForm';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { FieldGroup } from '../framework/FieldGroup';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowDiagram } from '../framework/FlowDiagram';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { Action, Pill, Toggle } from '../framework/primitives';
import { ResultCard } from '../framework/ResultCard';
import { SpecToggle } from '../framework/SpecToggle';
import { tokens } from '../framework/tokens';
import type {
	ClientAuthMethod,
	FlowCredentials,
	FlowError,
	FlowMode,
	OAuthSpec,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import { UseTokensStep } from '../framework/UseTokensStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { type MayActResult, tokenExchangeService as svc } from '../services/tokenExchangeService';

const env = import.meta.env as Record<string, string | undefined>;

// Realistic placeholders so the offline mock flow runs with zero PingOne setup.
const MOCK_CREDS = {
	environmentId: 'a1234567-b890-c123-d456-e7890f123456',
	region: 'com',
	clientId: 'mock-client-demo-1234567890',
	clientSecret: 'mock-client-secret',
	scope: 'access',
} as const;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Subject + actor tokens' },
	{ id: 'exchange', title: 'Exchange', subtitle: 'Trade for a new token' },
	{ id: 'inspect', title: 'Inspect', subtitle: 'Introspect the result' },
];

// SecondaryAction is unique to this flow — not part of shared primitives.
const SecondaryAction = styled(Action)`
	border-color: ${tokens.color.primaryBorder};
	background: ${tokens.color.primary};
	&:hover:not(:disabled) {
		background: ${tokens.color.primaryHover};
		transform: translateY(-1px);
	}
`;

const TokenExchangeFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [spec, setSpec] = useState<OAuthSpec>('2.0');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_TOKEN_EXCHANGE_CLIENT_ID || env.VITE_PINGONE_WORKER_CLIENT_ID || '',
		clientSecret:
			env.VITE_PINGONE_TOKEN_EXCHANGE_CLIENT_SECRET || env.VITE_PINGONE_WORKER_CLIENT_SECRET || '',
		authMethod: 'client_secret_post',
	});
	const [subjectToken, setSubjectToken] = useState('');
	const [actorToken, setActorToken] = useState('');
	// PingOne token exchange only issues tokens for custom resources, so default the
	// requested scope to the OAuth Playground custom-resource scope.
	const [requestedScopes, setRequestedScopes] = useState(
		env.VITE_PINGONE_TOKEN_EXCHANGE_SCOPE || 'access'
	);
	const [audience, setAudience] = useState('');
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [mayAct, setMayAct] = useState<MayActResult | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const selectMode = useCallback((m: FlowMode) => setMode(m), []);

	// Auto-populate mock credentials when mode changes; clear them when switching to real.
	useEffect(() => {
		if (mode === 'mock') {
			setCreds((c) => ({
				...c,
				environmentId: c.environmentId || MOCK_CREDS.environmentId,
				region: c.region || MOCK_CREDS.region,
				clientId: c.clientId || MOCK_CREDS.clientId,
				clientSecret: c.clientSecret || MOCK_CREDS.clientSecret,
			}));
		} else {
			setCreds((c) => ({
				...c,
				environmentId: c.environmentId === MOCK_CREDS.environmentId ? '' : c.environmentId,
				clientId: c.clientId === MOCK_CREDS.clientId ? '' : c.clientId,
				clientSecret: c.clientSecret === MOCK_CREDS.clientSecret ? '' : (c.clientSecret ?? ''),
			}));
		}
	}, [mode]);

	const run = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResult(null);
		try {
			const r = await svc.run(
				{
					credentials: creds,
					subjectToken,
					actorToken: actorToken || undefined,
					requestedScopes,
					audience,
				},
				mode
			);
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

	// Mock runs offline — never gate it on real credentials.
	const configured =
		mode === 'mock' ? true : Boolean(creds.environmentId && creds.clientId && subjectToken);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Token Exchange"
			spec={spec}
			mode={mode}
			onModeChange={selectMode}
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
					<FlowDiagram
						label="OAuth 2.0 Token Exchange"
						nodes={['Subject Token', 'Token EP', 'Exchanged Token']}
					/>
					<SpecToggle spec={spec} onSpecChange={setSpec} />
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
					<CredentialsForm
						creds={creds}
						set={set}
						showScope={false}
					/>
					<FieldGroup
						label="Requested scopes (optional)"
						value={requestedScopes}
						onChange={(e) => setRequestedScopes(e.target.value)}
						placeholder="narrow the issued token"
					/>
					<FieldGroup
						label="Audience (optional, RFC 8707)"
						value={audience}
						onChange={(e) => setAudience(e.target.value)}
						placeholder="target resource"
					/>
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
						Use it to swap one token for another without re-authenticating the user — narrowing
						scope/audience for a downstream service, or delegating so a service (the actor) can act
						on a user's (the subject's) behalf. Delegation is gated by the subject token's may_act
						claim, and the issued token records the chain in its act claim.
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
							{loading
								? 'Exchanging…'
								: mode === 'real'
									? 'Exchange real token'
									: 'Exchange mock token'}
						</Action>
						{actorToken && (
							<SecondaryAction onClick={checkDelegation}>
								Validate delegation (may_act)
							</SecondaryAction>
						)}
					</Toggle>
					{mayAct && (
						<ResultCard
							title={
								mayAct.valid ? 'Delegation approved (may_act)' : 'Delegation rejected (may_act)'
							}
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
					<UseTokensStep
						result={result}
						credentials={creds}
						mode={mode}
						tools={['introspect', 'decode']}
					/>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default TokenExchangeFlow;
