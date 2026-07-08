// src/flows/flows/oidcDiscovery.flow.tsx
//
// OIDC Discovery + JWKS teaching flow. No browser redirect. Four steps:
//   1. Configure  — environment id + region
//   2. Discover   — fetch .well-known/openid-configuration and display key fields + full doc
//   3. JWKS       — fetch the signing keys and list kid / kty / alg / use per key
//   4. Inspect    — explanation of why discovery and JWKS matter

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { UseCaseBanner } from '../framework/UseCaseBanner';
import { FlowStep } from '../framework/FlowStep';
import { FlowResult } from '../framework/FlowResult';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
import { ResultCard } from '../framework/ResultCard';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { JsonView } from '../framework/CodeBlock';
import { tokens } from '../framework/tokens';
import type {
	FlowCredentials,
	FlowError,
	FlowMode,
	StepDefinition,
} from '../framework/types';
import {
	oidcDiscoveryService,
	type DiscoveryDocument,
	type JwksResult,
	type JwkKey,
} from '../services/oidcDiscoveryService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Environment + region' },
	{ id: 'discover', title: 'Discover', subtitle: 'openid-configuration' },
	{ id: 'jwks', title: 'JWKS', subtitle: 'Signing keys' },
	{ id: 'inspect', title: 'Inspect', subtitle: 'Why it matters' },
];

// ---------------------------------------------------------------------------
// Local styled primitives
// ---------------------------------------------------------------------------

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

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.9rem;
	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const EndpointTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	font-size: 0.83rem;
`;

const Th = styled.th`
	text-align: left;
	font-weight: 700;
	color: ${tokens.color.textSecondary};
	padding: 0.35rem 0.5rem;
	border-bottom: 1px solid ${tokens.color.border};
`;

const Td = styled.td`
	padding: 0.35rem 0.5rem;
	color: ${tokens.color.text};
	border-bottom: 1px solid ${tokens.color.bgSubtle};
	word-break: break-all;
`;

const KeyCard = styled.div`
	border: 1px solid ${tokens.color.border};
	border-radius: ${tokens.radius.lg};
	padding: ${tokens.space.lg};
	background: ${tokens.color.bgSubtle};
	display: flex;
	flex-direction: column;
	gap: ${tokens.space.sm};
`;

const KeyMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
`;

const Tag = styled.span`
	font-size: 0.75rem;
	font-weight: 700;
	padding: 0.2rem 0.55rem;
	border-radius: ${tokens.radius.pill};
	background: ${tokens.color.primarySubtle};
	color: ${tokens.color.primary};
	border: 1px solid ${tokens.color.primaryBorder};
`;

const KidLabel = styled.code`
	font-size: 0.8rem;
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	color: ${tokens.color.textSecondary};
	word-break: break-all;
`;

const KeyGrid = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickEndpoints(doc: DiscoveryDocument): Array<{ label: string; field: string }> {
	return [
		{ label: 'issuer', field: 'issuer' },
		{ label: 'authorization_endpoint', field: 'authorization_endpoint' },
		{ label: 'token_endpoint', field: 'token_endpoint' },
		{ label: 'userinfo_endpoint', field: 'userinfo_endpoint' },
		{ label: 'jwks_uri', field: 'jwks_uri' },
		{ label: 'end_session_endpoint', field: 'end_session_endpoint' },
		{ label: 'introspection_endpoint', field: 'introspection_endpoint' },
		{ label: 'revocation_endpoint', field: 'revocation_endpoint' },
	].filter(({ field }) => field in doc && doc[field] != null);
}

function pickSupported(doc: DiscoveryDocument): Array<{ label: string; field: string }> {
	return [
		{ label: 'scopes_supported', field: 'scopes_supported' },
		{ label: 'grant_types_supported', field: 'grant_types_supported' },
		{ label: 'response_types_supported', field: 'response_types_supported' },
		{ label: 'id_token_signing_alg_values_supported', field: 'id_token_signing_alg_values_supported' },
		{ label: 'code_challenge_methods_supported', field: 'code_challenge_methods_supported' },
	].filter(({ field }) => field in doc && doc[field] != null);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const OidcDiscoveryFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: '',
	});
	const [discovery, setDiscovery] = useState<DiscoveryDocument | null>(null);
	const [jwks, setJwks] = useState<JwksResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const runDiscover = useCallback(async () => {
		setLoading(true);
		setError(null);
		setDiscovery(null);
		setJwks(null);
		try {
			const doc = await oidcDiscoveryService.discover(creds, mode);
			setDiscovery(doc);
			engine.markComplete('discover');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, mode, engine]);

	const runFetchJwks = useCallback(async () => {
		setLoading(true);
		setError(null);
		setJwks(null);
		try {
			const jwksUri = typeof discovery?.jwks_uri === 'string' ? discovery.jwks_uri : undefined;
			const result = await oidcDiscoveryService.fetchJwks(creds, mode, jwksUri);
			setJwks(result);
			engine.markComplete('jwks');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, mode, engine, discovery]);

	const configured = Boolean(creds.environmentId && creds.region);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="OIDC Discovery + JWKS"
			spec="2.0"
			mode={mode}
			subtitle="Fetch .well-known/openid-configuration so clients self-configure their endpoints, then inspect the JSON Web Key Set clients use to verify id_token signatures."
			engine={engine}
		>
			<UseCaseBanner />
			{/* ------------------------------------------------------------------ */}
			{/* Step 1 — Configure                                                  */}
			{/* ------------------------------------------------------------------ */}
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure the environment"
					explanation="Enter the PingOne environment ID and region. No client credentials are needed — discovery and JWKS are public endpoints. Real mode proxies through the BFF to avoid CORS; mock mode runs entirely offline."
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
					</Grid>
					<ExplanationPanel title="What is OIDC Discovery?">
						OpenID Connect Discovery (RFC 8414) lets any client learn an authorization server's
						endpoints and capabilities from a single URL:
						{' '}<code>{'<issuer>/.well-known/openid-configuration'}</code>. Instead of hardcoding
						the token endpoint, clients fetch the document once and read it — this means
						endpoint URLs can change without breaking clients that respect the spec.
					</ExplanationPanel>
				</FlowStep>
			)}

			{/* ------------------------------------------------------------------ */}
			{/* Step 2 — Discover                                                   */}
			{/* ------------------------------------------------------------------ */}
			{cur === 'discover' && (
				<FlowStep
					title="2. Fetch the discovery document"
					explanation="The BFF fetches <issuer>/.well-known/openid-configuration and returns the full metadata object. Key endpoints and supported capabilities are highlighted below."
					nextLabel="Fetch JWKS"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(discovery)}
				>
					<Action onClick={runDiscover} disabled={loading || !configured}>
						{loading ? 'Fetching…' : mode === 'real' ? 'Fetch discovery document' : 'Fetch mock discovery document'}
					</Action>

					{error && !discovery && <FlowResult error={error} />}

					{discovery && (
						<>
							<ResultCard title="Key endpoints" tone="info">
								<EndpointTable>
									<thead>
										<tr>
											<Th>Field</Th>
											<Th>Value</Th>
										</tr>
									</thead>
									<tbody>
										{pickEndpoints(discovery).map(({ label, field }) => (
											<tr key={field}>
												<Td><code>{label}</code></Td>
												<Td>{String(discovery[field])}</Td>
											</tr>
										))}
									</tbody>
								</EndpointTable>
							</ResultCard>

							<ResultCard title="Supported capabilities" tone="info">
								<EndpointTable>
									<thead>
										<tr>
											<Th>Field</Th>
											<Th>Values</Th>
										</tr>
									</thead>
									<tbody>
										{pickSupported(discovery).map(({ label, field }) => (
											<tr key={field}>
												<Td><code>{label}</code></Td>
												<Td>
													{Array.isArray(discovery[field])
														? (discovery[field] as string[]).join(', ')
														: String(discovery[field])}
												</Td>
											</tr>
										))}
									</tbody>
								</EndpointTable>
							</ResultCard>

							<JsonView data={discovery} label="Full discovery document" />
						</>
					)}
				</FlowStep>
			)}

			{/* ------------------------------------------------------------------ */}
			{/* Step 3 — JWKS                                                       */}
			{/* ------------------------------------------------------------------ */}
			{cur === 'jwks' && (
				<FlowStep
					title="3. Fetch the signing keys (JWKS)"
					explanation="The jwks_uri in the discovery document points to a JSON Web Key Set. Clients fetch this to obtain the public keys used to verify id_token signatures. Each key is identified by its kid (key ID), which is embedded in the JWT header."
					nextLabel="Inspect"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(jwks)}
				>
					<Action onClick={runFetchJwks} disabled={loading || !configured}>
						{loading ? 'Fetching…' : mode === 'real' ? 'Fetch JWKS' : 'Fetch mock JWKS'}
					</Action>

					{error && !jwks && <FlowResult error={error} />}

					{jwks && (
						<>
							<ResultCard title={`${jwks.keys.length} key${jwks.keys.length === 1 ? '' : 's'} found`} tone="ok">
								<KeyGrid>
									{jwks.keys.map((key: JwkKey, i: number) => (
										<KeyCard key={key.kid || i}>
											<KidLabel>kid: {key.kid}</KidLabel>
											<KeyMeta>
												{key.kty && <Tag>kty: {key.kty}</Tag>}
												{key.alg && <Tag>alg: {key.alg}</Tag>}
												{key.use && <Tag>use: {key.use}</Tag>}
											</KeyMeta>
										</KeyCard>
									))}
								</KeyGrid>
							</ResultCard>

							<JsonView data={jwks.raw} label="Full JWKS response" />
						</>
					)}
				</FlowStep>
			)}

			{/* ------------------------------------------------------------------ */}
			{/* Step 4 — Inspect / Explain                                          */}
			{/* ------------------------------------------------------------------ */}
			{cur === 'inspect' && (
				<FlowStep
					title="4. Why discovery and JWKS matter"
					explanation="Discovery removes hardcoded endpoints. JWKS provides the public keys clients use to verify id_token signatures. Together they enable zero-configuration client setup and safe key rotation."
					nextLabel="Start over"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					<ExplanationPanel title="Discovery removes hardcoded endpoints" defaultOpen>
						Without discovery, every client developer has to manually find and hardcode the
						authorization endpoint, token endpoint, and userinfo endpoint. If the server moves
						or adds an endpoint (e.g. device authorization, PAR), every client breaks silently.
						With discovery, clients fetch the metadata document once at startup and self-configure.
						RFC 8414 standardizes this pattern across all OAuth 2.0 authorization servers.
					</ExplanationPanel>

					<ExplanationPanel title="JWKS and id_token signature verification" defaultOpen>
						When a client receives an id_token (a signed JWT), it must verify the signature to
						confirm the token came from the correct issuer and was not tampered with. The JWT
						header contains a <code>kid</code> field — the client looks up the matching key in
						the JWKS and uses it to verify the RSA or EC signature. The signature check binds
						the claims to a specific issuer and prevents token forgery.
					</ExplanationPanel>

					<ExplanationPanel title="Key rotation">
						Authorization servers rotate their signing keys periodically (or in response to a
						compromise). Because the JWKS endpoint is live, clients can re-fetch it whenever
						they encounter an unknown <code>kid</code>. This means key rotation is transparent
						to clients — no configuration update needed. PingOne's discovery document always
						points <code>jwks_uri</code> at the current active keyset.
					</ExplanationPanel>

					{discovery && (
						<ResultCard title="Discovery document fetched this session" tone="info">
							<div style={{ fontSize: '0.85rem', color: tokens.color.textMuted }}>
								issuer: <strong>{String(discovery.issuer)}</strong>
							</div>
						</ResultCard>
					)}
					{jwks && (
						<ResultCard title="JWKS fetched this session" tone="ok">
							<div style={{ fontSize: '0.85rem', color: tokens.color.textMuted }}>
								{jwks.keys.length} signing key{jwks.keys.length === 1 ? '' : 's'} — kid
								{jwks.keys.length === 1 ? '' : 's'}:{' '}
								<strong>{jwks.keys.map((k: JwkKey) => k.kid).join(', ')}</strong>
							</div>
						</ResultCard>
					)}
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default OidcDiscoveryFlow;
