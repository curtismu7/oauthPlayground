// src/flows2/flows/clientCredentials.flow.tsx
//
// Client Credentials grant (RFC 6749 §4.4), real PingOne by default. First flow of the
// flows2 clean-core rebuild — ~190 LOC vs the ~450–1,100 LOC legacy V9 monoliths.

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import type {
	ClientAuthMethod,
	FlowCredentials,
	FlowError,
	FlowMode,
	StepDefinition,
	TokenResult,
} from '../framework/types';
import { clientCredentialsService } from '../services/clientCredentialsService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Worker app credentials' },
	{ id: 'request', title: 'Request & Inspect', subtitle: 'Get a real access token' },
];

const Field = styled.label`
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
	font-size: 0.82rem;
	font-weight: 600;
	color: #334155;
`;

const Input = styled.input`
	font-size: 0.9rem;
	padding: 0.5rem 0.65rem;
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	font-family: inherit;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.9rem;
	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const ModeToggle = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const ModeButton = styled.button<{ $active: boolean }>`
	font-size: 0.82rem;
	font-weight: 600;
	padding: 0.4rem 0.9rem;
	border-radius: 8px;
	cursor: pointer;
	border: 1px solid ${({ $active }) => ($active ? '#1e3a8a' : '#cbd5e1')};
	background: ${({ $active }) => ($active ? '#eff6ff' : '#fff')};
	color: ${({ $active }) => ($active ? '#1e3a8a' : '#475569')};
`;

const Run = styled.button`
	align-self: flex-start;
	font-size: 0.9rem;
	font-weight: 700;
	padding: 0.6rem 1.2rem;
	border-radius: 8px;
	border: 1px solid #15803d;
	background: #16a34a;
	color: #fff;
	cursor: pointer;
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ClientCredentialsFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_WORKER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_WORKER_CLIENT_SECRET || '',
		scope: '',
		// PingOne worker apps default to Basic auth at the token endpoint.
		authMethod: 'client_secret_basic',
	});
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const run = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResult(null);
		try {
			const r = await clientCredentialsService.run({ credentials: creds }, mode);
			setResult(r);
			engine.markComplete('request');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, mode, engine]);

	const configured = Boolean(creds.environmentId && creds.clientId && creds.clientSecret);

	return (
		<FlowContainer
			title="Client Credentials"
			spec="2.0"
			mode={mode}
			subtitle="Machine-to-machine grant (RFC 6749 §4.4) — a confidential client authenticates with its own credentials and receives an access token. No user, no redirect."
			engine={engine}
		>
			{engine.current.id === 'configure' && (
				<FlowStep
					title="1. Configure the worker app"
					explanation="The client authenticates directly at the token endpoint with client_id + client_secret. Real mode calls PingOne via the BFF; mock mode returns a fake token offline."
					canPrev={false}
					nextLabel="Continue"
					onNext={engine.goNext}
					canNext={configured}
				>
					<ModeToggle>
						<ModeButton $active={mode === 'real'} onClick={() => setMode('real')}>
							Real PingOne
						</ModeButton>
						<ModeButton $active={mode === 'mock'} onClick={() => setMode('mock')}>
							Mock
						</ModeButton>
					</ModeToggle>
					<ModeToggle>
						{(['client_secret_basic', 'client_secret_post'] as ClientAuthMethod[]).map((m) => (
							<ModeButton
								key={m}
								$active={creds.authMethod === m}
								onClick={() => setCreds((c) => ({ ...c, authMethod: m }))}
							>
								{m}
							</ModeButton>
						))}
					</ModeToggle>
					<Grid>
						<Field>
							Environment ID
							<Input value={creds.environmentId} onChange={set('environmentId')} placeholder="uuid" />
						</Field>
						<Field>
							Region
							<Input value={creds.region} onChange={set('region')} placeholder="com | eu | ca | asia" />
						</Field>
						<Field>
							Client ID
							<Input value={creds.clientId} onChange={set('clientId')} placeholder="worker client id" />
						</Field>
						<Field>
							Client Secret
							<Input
								type="password"
								value={creds.clientSecret ?? ''}
								onChange={set('clientSecret')}
								placeholder="worker client secret"
							/>
						</Field>
						<Field>
							Scope (optional)
							<Input value={creds.scope ?? ''} onChange={set('scope')} placeholder="e.g. p1:read:user" />
						</Field>
					</Grid>
				</FlowStep>
			)}

			{engine.current.id === 'request' && (
				<FlowStep
					title="2. Request the token"
					explanation="POST grant_type=client_credentials to the token endpoint. The response is a bearer access token scoped to the client — decoded below so you can see its claims (aud, scope, exp)."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext={Boolean(result)}
				>
					<Run onClick={run} disabled={loading || !configured}>
						{loading ? 'Requesting…' : mode === 'real' ? 'Request real token' : 'Request mock token'}
					</Run>
					<FlowResult result={result} error={error} />
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default ClientCredentialsFlow;
