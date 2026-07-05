// src/flows2/flows/samlBearerAssertion.flow.tsx
//
// SAML Bearer Assertion grant (RFC 7522), real PingOne by default.
// Generates a mock SAML 2.0 assertion and exchanges it for an access token.

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useFlowStorage } from '../framework/useFlowStorage';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
import { JsonView } from '../framework/CodeBlock';
import { ResultCard } from '../framework/ResultCard';
import { tokens } from '../framework/tokens';
import type { FlowError, FlowMode, StepDefinition, TokenResult } from '../framework/types';
import { samlBearerService, type SAMLBearerAssertionData } from '../services/samlBearerService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'App & SAML details' },
	{ id: 'build', title: 'Build SAML', subtitle: 'Assertion parameters' },
	{ id: 'generate', title: 'Generate', subtitle: 'SAML assertion' },
	{ id: 'request', title: 'Request', subtitle: 'Get access token' },
	{ id: 'inspect', title: 'Inspect', subtitle: 'Introspect token' },
];

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.9rem;
	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
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

const Toggle = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
`;

const Hint = styled.div`
	font-size: 0.78rem;
	color: ${tokens.color.textMuted};
	margin-bottom: 0.3rem;
`;

const CodeBox = styled.pre`
	background: ${tokens.color.bgMuted};
	border: 1px solid ${tokens.color.border};
	border-radius: 6px;
	padding: 1rem;
	overflow-x: auto;
	font-size: 0.75rem;
	line-height: 1.4;
`;

const SAMLBearerAssertionFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');

	// Step 1: Configure
	const [envId, setEnvId] = useState(env.VITE_PINGONE_ENVIRONMENT_ID || '');
	const [region, setRegion] = useState(env.VITE_PINGONE_REGION || 'com');
	const [clientId, setClientId] = useState(env.VITE_PINGONE_WORKER_CLIENT_ID || '');

	// Step 2: Build SAML
	const [samlData, setSamlData] = useState<SAMLBearerAssertionData>({
		issuer: 'https://idp.example.com',
		subject: 'user@example.com',
		audience: '',
		notBefore: new Date().toISOString().split('.')[0] + 'Z',
		notOnOrAfter: new Date(Date.now() + 3600000).toISOString().split('.')[0] + 'Z',
	});

	const [scopes, setScopes] = useState('');

	// Step 3: Generate
	const [samlXml, setSamlXml] = useState<string | null>(null);
	const [samlB64, setSamlB64] = useState<string | null>(null);

	// Step 4: Request
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	// Step 5: Inspect
	const [introspectData, setIntrospectData] = useState<Record<string, unknown> | null>(null);

	const { saveState, restoreState } = useFlowStorage('flows2:saml-bearer');

	useEffect(() => {
		restoreState().then((saved) => {
			if (!saved) return;
			if (saved.samlXml) setSamlXml(saved.samlXml as string);
			if (saved.samlB64) setSamlB64(saved.samlB64 as string);
			if (!result && saved.result) setResult(saved.result as typeof result);
			if (!error && saved.error) setError(saved.error as typeof error);
			if (!introspectData && saved.introspectData) setIntrospectData(saved.introspectData as typeof introspectData);
		});
	}, [restoreState, samlXml, samlB64, result, error, introspectData]);

	const configured = Boolean(envId && clientId && samlData.issuer && samlData.subject);
	const cur = engine.current.id;

	const handleGenerateSAML = useCallback(async () => {
		const xml = samlBearerService.generateAssertion(samlData);
		setSamlXml(xml);
		setSamlB64(btoa(xml));
		engine.markComplete('generate');
		engine.goNext();
	}, [samlData, engine]);

	const handleRequestToken = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResult(null);

		// Update audience if not set
		const aud = samlData.audience || `https://${region}-oauth.example.com`;
		const updatedSamlData = { ...samlData, audience: aud };

		try {
			const r = await samlBearerService.run(
				{
					environmentId: envId,
					region,
					clientId,
					assertion: updatedSamlData,
					scopes,
				},
				mode
			);
			setResult(r);
			engine.markComplete('request');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [envId, region, clientId, samlData, scopes, mode, engine]);

	const handleIntrospect = useCallback(async () => {
		if (!result?.accessToken) return;
		const data = await samlBearerService.introspect(result.accessToken, envId, region, mode);
		setIntrospectData(data);
		engine.markComplete('inspect');
	}, [result, envId, region, mode, engine]);

	useEffect(() => {
		saveState({ samlData, samlXml, samlB64, result, error, introspectData });
	}, [samlData, samlXml, samlB64, result, error, introspectData, saveState]);

	return (
		<FlowContainer
			title="SAML Bearer Assertion"
			spec="2.0"
			mode={mode}
			subtitle="SAML Bearer Assertion grant (RFC 7522) — exchange a SAML assertion for an access token."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure the application"
					explanation="SAML Bearer Assertion flow requires PingOne environment details and a client ID. Real mode would call PingOne; mock mode simulates the exchange."
					canPrev={false}
					onNext={engine.goNext}
					canNext={configured}
				>
					<Toggle>
						<Pill $active={mode === 'real'} onClick={() => setMode('real')}>
							Real PingOne
						</Pill>
						<Pill $active={mode === 'mock'} onClick={() => setMode('mock')}>
							Mock
						</Pill>
					</Toggle>
					<Grid>
						<FieldGroup label="Environment ID" value={envId} onChange={(e) => setEnvId(e.target.value)} placeholder="uuid" />
						<FieldGroup label="Region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="com | eu | ca | asia" />
						<FieldGroup label="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="oauth client id" />
						<FieldGroup label="Scope (optional)" value={scopes} onChange={(e) => setScopes(e.target.value)} placeholder="e.g. openid profile" />
					</Grid>
				</FlowStep>
			)}

			{cur === 'build' && (
				<FlowStep
					title="2. Build the SAML assertion"
					explanation="Define the SAML assertion: issuer (IdP), subject (user), audience (token endpoint), and conditions (time window)."
					onNext={engine.goNext}
					onPrev={engine.goPrev}
					canNext={Boolean(samlData.issuer && samlData.subject)}
				>
					<Grid>
						<FieldGroup
							label="Issuer (Identity Provider)"
							value={samlData.issuer}
							onChange={(e) => setSamlData((s) => ({ ...s, issuer: e.target.value }))}
							placeholder="https://idp.example.com"
						/>
						<FieldGroup
							label="Subject (User)"
							value={samlData.subject}
							onChange={(e) => setSamlData((s) => ({ ...s, subject: e.target.value }))}
							placeholder="user@example.com"
						/>
						<FieldGroup
							label="Audience (Token Endpoint)"
							value={samlData.audience}
							onChange={(e) => setSamlData((s) => ({ ...s, audience: e.target.value }))}
							placeholder="https://auth.example.com/as/token"
						/>
					</Grid>
					<Hint>Optional: Set validity window</Hint>
					<Grid>
						<FieldGroup
							label="NotBefore (optional)"
							type="datetime-local"
							value={samlData.notBefore?.split('.')[0] || ''}
							onChange={(e) => setSamlData((s) => ({ ...s, notBefore: e.target.value + 'Z' }))}
						/>
						<FieldGroup
							label="NotOnOrAfter (optional)"
							type="datetime-local"
							value={samlData.notOnOrAfter?.split('.')[0] || ''}
							onChange={(e) => setSamlData((s) => ({ ...s, notOnOrAfter: e.target.value + 'Z' }))}
						/>
					</Grid>
				</FlowStep>
			)}

			{cur === 'generate' && (
				<FlowStep
					title="3. Generate SAML assertion"
					explanation="Generate a mock SAML 2.0 assertion in XML and Base64-encoded form."
					onNext={engine.goNext}
					onPrev={engine.goPrev}
				>
					<Action onClick={handleGenerateSAML}>Generate SAML Assertion</Action>

					{samlXml && (
						<ResultCard tone="ok" title="Generated SAML Assertion (XML)">
							<CodeBox>{samlXml}</CodeBox>
						</ResultCard>
					)}

					{samlB64 && (
						<ResultCard tone="info" title="Base64-Encoded">
							<CodeBox>{samlB64}</CodeBox>
						</ResultCard>
					)}
				</FlowStep>
			)}

			{cur === 'request' && (
				<FlowStep
					title="4. Exchange for access token"
					explanation="POST the SAML assertion to the token endpoint (grant_type=urn:ietf:params:oauth:grant-type:saml2-bearer)."
					onNext={engine.goNext}
					onPrev={engine.goPrev}
					canNext={Boolean(result)}
				>
					<Action onClick={handleRequestToken} disabled={loading}>
						{loading ? 'Requesting...' : 'Request Token'}
					</Action>
					<FlowResult result={result} error={error} />
				</FlowStep>
			)}

			{cur === 'inspect' && (
				<FlowStep
					title="5. Introspect the token"
					explanation="RFC 7662 token introspection: check token validity, scope, and claims."
					onPrev={engine.goPrev}
				>
					<Action onClick={handleIntrospect} disabled={!result?.accessToken}>
						Introspect Token
					</Action>
					{introspectData && <JsonView data={introspectData} />}
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default SAMLBearerAssertionFlow;
