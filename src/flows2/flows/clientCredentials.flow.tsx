// src/flows2/flows/clientCredentials.flow.tsx
//
// Client Credentials grant (RFC 6749 §4.4), real PingOne by default. Uses the shared flows2
// primitives (FieldGroup / ResultCard / JsonView / tokens) for visual parity with the other flows.

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { JsonView } from '../framework/CodeBlock';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { FieldGroup } from '../framework/FieldGroup';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowDiagram } from '../framework/FlowDiagram';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { Action, Grid, Pill, Toggle } from '../framework/primitives';
import { ResultCard } from '../framework/ResultCard';
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
import { useFlowEngine } from '../framework/useFlowEngine';
import { clientCredentialsService } from '../services/clientCredentialsService';

const env = import.meta.env as Record<string, string | undefined>;

// Realistic placeholders so the offline mock flow runs with zero PingOne setup
const MOCK_CREDS = {
	environmentId: 'a1234567-b890-c123-d456-e7890f123456',
	region: 'com',
	clientId: 'mock-worker-client-id',
	clientSecret: 'mock-client-secret',
	scope: 'p1:read:user',
} as const;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Worker app credentials' },
	{ id: 'request', title: 'Request', subtitle: 'Get an access token' },
	{ id: 'inspect', title: 'Inspect', subtitle: 'Introspect the token' },
];

// Chip and Hint are unique to this flow — not part of shared primitives.
const Chip = styled.button<{ $on: boolean }>`
	font-size: 0.74rem;
	font-weight: 600;
	padding: 0.22rem 0.6rem;
	border-radius: 999px;
	cursor: pointer;
	border: 1px solid ${({ $on }) => ($on ? tokens.color.primary : tokens.color.border)};
	background: ${({ $on }) => ($on ? tokens.color.primarySubtle : '#fff')};
	color: ${({ $on }) => ($on ? tokens.color.primary : tokens.color.textMuted)};
`;

const Hint = styled.div`
	font-size: 0.78rem;
	color: ${tokens.color.textMuted};
	margin-bottom: 0.3rem;
`;

const ClientCredentialsFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [spec, setSpec] = useState<OAuthSpec>('2.0');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_WORKER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_WORKER_CLIENT_SECRET || '',
		scope: '',
		// PingOne worker apps default to Basic auth at the token endpoint.
		authMethod: 'client_secret_basic',
	});
	const [audience, setAudience] = useState('');
	const [resource, setResource] = useState('');
	const [discoveredScopes, setDiscoveredScopes] = useState<string[]>([]);
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [introspectData, setIntrospectData] = useState<Record<string, unknown> | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const selectMode = useCallback((m: FlowMode) => setMode(m), []);

	// Auto-populate mock credentials when mode changes; clear them when switching to real
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
			setCreds(
				(c) =>
					({
						...c,
						environmentId: c.environmentId === MOCK_CREDS.environmentId ? '' : c.environmentId,
						clientId: c.clientId === MOCK_CREDS.clientId ? '' : c.clientId,
						clientSecret: c.clientSecret === MOCK_CREDS.clientSecret ? '' : (c.clientSecret ?? ''),
						scope: c.scope === MOCK_CREDS.scope ? '' : c.scope,
					}) as FlowCredentials
			);
		}
	}, [mode]);

	const discover = useCallback(async () => {
		try {
			setError(null);
			const scopes = await clientCredentialsService.discover(creds, mode);
			setDiscoveredScopes(scopes);
		} catch (err) {
			setError(err as FlowError);
			setDiscoveredScopes([]);
		}
	}, [creds, mode]);

	const toggleScope = (scope: string) =>
		setCreds((c) => {
			const have = (c.scope || '').split(/\s+/).filter(Boolean);
			const next = have.includes(scope) ? have.filter((s) => s !== scope) : [...have, scope];
			return { ...c, scope: next.join(' ') };
		});

	const run = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResult(null);
		setIntrospectData(null);
		try {
			const r = await clientCredentialsService.run(
				{ credentials: creds, audience, resource },
				mode
			);
			setResult(r);
			engine.markComplete('request');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, audience, resource, mode, engine]);

	const inspect = useCallback(async () => {
		if (!result?.accessToken) return;
		setIntrospectData(await clientCredentialsService.introspect(result.accessToken, creds, mode));
		engine.markComplete('inspect');
	}, [result, creds, mode, engine]);

	// Mock runs offline — never gate it on real credentials.
	const configured =
		mode === 'mock' ? true : Boolean(creds.environmentId && creds.clientId && creds.clientSecret);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Client Credentials"
			spec={spec}
			mode={mode}
			onModeChange={selectMode}
			subtitle="Machine-to-machine grant (RFC 6749 §4.4) — a confidential client authenticates with its own credentials and receives an access token. No user, no redirect."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure the worker app"
					explanation="The client authenticates directly at the token endpoint with client_id + client_secret. Real mode calls PingOne via the BFF; mock mode returns a token offline."
					canPrev={false}
					nextLabel="Continue"
					onNext={engine.goNext}
					canNext={configured}
				>
					<FlowDiagram
						label="OAuth 2.0 Client Credentials"
						nodes={['Client', 'Token EP', 'Access Token']}
					/>
					<Toggle>
						<Pill $active={spec === '2.0'} onClick={() => setSpec('2.0')}>
							OAuth 2.0
						</Pill>
						<Pill $active={spec === '2.1'} onClick={() => setSpec('2.1')}>
							OAuth 2.1
						</Pill>
					</Toggle>
					<Toggle>
						{(['client_secret_basic', 'client_secret_post'] as ClientAuthMethod[]).map((m) => (
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
							placeholder="worker client id"
						/>
						<FieldGroup
							label="Client Secret"
							type="password"
							value={creds.clientSecret ?? ''}
							onChange={set('clientSecret')}
							placeholder="worker client secret"
						/>
						<FieldGroup
							label="Scope (optional)"
							value={creds.scope ?? ''}
							onChange={set('scope')}
							placeholder="e.g. p1:read:user"
						/>
						<FieldGroup
							label="Audience (optional, RFC 8707)"
							value={audience}
							onChange={(e) => setAudience(e.target.value)}
							placeholder="target resource"
						/>
						<FieldGroup
							label="Resource (optional, RFC 8707)"
							value={resource}
							onChange={(e) => setResource(e.target.value)}
							placeholder="resource URI"
						/>
					</Grid>
					<div>
						<Hint>Discover the scopes this environment advertises, then click to add them:</Hint>
						<Toggle>
							<Pill $active={false} onClick={discover}>
								Discover scopes
							</Pill>
							{discoveredScopes.map((s) => (
								<Chip
									key={s}
									$on={(creds.scope || '').split(/\s+/).includes(s)}
									onClick={() => toggleScope(s)}
								>
									{s}
								</Chip>
							))}
						</Toggle>
					</div>
					<ExplanationPanel title="When to use Client Credentials">
						The client authenticates as itself — there is no user and no redirect. Use it for
						service-to-service / machine-to-machine calls. (User identity and delegation belong to
						Authorization Code and RFC 8693 token exchange, respectively.)
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'request' && (
				<FlowStep
					title="2. Request the token"
					explanation="POST grant_type=client_credentials to the token endpoint. The response is a bearer access token scoped to the client — decoded below so you can see its claims (aud, scope, exp)."
					nextLabel="Inspect"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(result)}
				>
					<Action onClick={run} disabled={loading || !configured}>
						{loading
							? 'Requesting…'
							: mode === 'real'
								? 'Request real token'
								: 'Request mock token'}
					</Action>
					<FlowResult result={result} error={error} />
				</FlowStep>
			)}

			{cur === 'inspect' && (
				<FlowStep
					title="3. Introspect the token"
					explanation="RFC 7662 introspection asks the authorization server whether the token is active and what it carries (scope, aud, exp). A resource server does this to validate an incoming token."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					<Action onClick={inspect} disabled={!result?.accessToken}>
						Introspect access token
					</Action>
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

export default ClientCredentialsFlow;
