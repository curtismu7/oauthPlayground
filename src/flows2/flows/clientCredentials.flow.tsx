// src/flows2/flows/clientCredentials.flow.tsx
//
// Client Credentials grant (RFC 6749 §4.4), real PingOne by default. Uses the shared flows2
// primitives (FieldGroup / ResultCard / JsonView / tokens) for visual parity with the other flows.

import React, { useCallback, useEffect, useState } from 'react';
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
import { Action, Pill, Toggle } from '../framework/primitives';
import { SpecToggle } from '../framework/SpecToggle';
import { tokens } from '../framework/tokens';
import { TokenLifetimeConfig } from '../framework/TokenLifetimeConfig';
import type { TokenLifetimes } from '../framework/TokenLifetimeConfig';
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
import { clientCredentialsService } from '../services/clientCredentialsService';
import { pingoneEndpoints } from '../services/pingone';

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
	const [tokenLifetimes, setTokenLifetimes] = useState<TokenLifetimes>({ accessTokenSeconds: 3600, idTokenSeconds: 3600, refreshTokenSeconds: 86400 });
	const updateTokenLifetime = (k: keyof TokenLifetimes) => (v: number | string) => { setTokenLifetimes((prev) => ({ ...prev, [k]: Number(v) })); };
	const [audience, setAudience] = useState('');
	const [resource, setResource] = useState('');
	const [discoveredScopes, setDiscoveredScopes] = useState<string[]>([]);
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const selectMode = useCallback((m: FlowMode) => setMode(m), []);

	const { save: saveCredentials, saving: savingCreds, saved: savedCreds } =
		useFlowCredentials('flows2:client-credentials', creds, setCreds);

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
		try {
			const r = await clientCredentialsService.run({ credentials: creds, audience, resource }, mode, tokenLifetimes, creds.authMethod);
			setResult(r);
			engine.markComplete('request');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, audience, resource, mode, engine, tokenLifetimes]);

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
					<SpecToggle spec={spec} onSpecChange={setSpec} />
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
					<CredentialsForm
						creds={creds}
						set={set}
						scopePlaceholder="e.g. p1:read:user"
						onSave={saveCredentials}
						saving={savingCreds}
						saved={savedCreds}
					/>
					<TokenLifetimeConfig lifetimes={tokenLifetimes} onChange={updateTokenLifetime} showIdToken={false} showRefreshToken={false} />
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
					{(() => {
						const ep = pingoneEndpoints(creds);
						const curlReq: CurlRequest = {
							method: 'POST',
							url: ep.token,
							params: {
								grant_type: 'client_credentials',
								client_id: creds.clientId,
								scope: creds.scope || undefined,
								audience: audience || undefined,
								resource: resource || undefined,
							},
						};
						return <RequestPreview request={curlReq} />;
					})()}
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

export default ClientCredentialsFlow;
