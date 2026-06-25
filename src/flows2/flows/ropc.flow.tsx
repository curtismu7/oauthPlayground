// src/flows2/flows/ropc.flow.tsx
//
// Resource Owner Password Credentials grant (RFC 6749 §4.3), spec '2.0'.
// Taught as an explicit ANTI-PATTERN: removed in OAuth 2.1 because the client
// handles the user's password directly, defeating MFA, consent, and federation.
// Only justifiable for legacy first-party migration scenarios.

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
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
import { useFlowStorage } from '../framework/useFlowStorage';
import { ropcService } from '../services/ropcService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Client + user credentials' },
	{ id: 'request', title: 'Request Token', subtitle: 'POST grant_type=password' },
	{ id: 'use', title: 'Use Tokens', subtitle: 'Inspect the result' },
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

// Warning banner for the anti-pattern callout — amber/orange palette to signal caution.
const WarningBanner = styled.div`
	background: #fffbeb;
	border: 1px solid #fcd34d;
	border-left: 4px solid #f59e0b;
	border-radius: ${tokens.radius.lg};
	padding: ${tokens.space.lg} ${tokens.space.xl};
	font-size: 0.88rem;
	color: #78350f;
	line-height: 1.55;
`;

const WarningTitle = styled.div`
	font-size: 0.82rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: #b45309;
	margin-bottom: ${tokens.space.sm};
`;

const RopcFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_USER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_USER_CLIENT_SECRET || '',
		scope: 'openid',
		authMethod: 'client_secret_post',
	});
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	const { saveState, restoreState } = useFlowStorage('flows2:ropc');

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const requestToken = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResult(null);
		if (!username || !password) {
			setError({ error: 'invalid_input', error_description: 'Username and password are required' });
			setLoading(false);
			return;
		}
		try {
			const r = await ropcService.runPasswordGrant(creds, username, password, mode);
			setResult(r);
			engine.markComplete('request');
			engine.goNext();
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, username, password, mode, engine]);

	useEffect(() => {
		restoreState().then((saved) => {
			if (!saved) return;
			if (!result && saved.result) setResult(saved.result as typeof result);
			if (!error && saved.error) setError(saved.error as typeof error);
			if (!username && saved.username) setUsername(saved.username as string);
		});
	}, [restoreState, result, error, username]);

	useEffect(() => {
		saveState({ result, error, username });
	}, [result, error, username, saveState]);

	// All three fields required before the token request is allowed.
	const canRequest = Boolean(creds.environmentId && creds.clientId && username && password);
	const configured = Boolean(creds.environmentId && creds.clientId);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Resource Owner Password Credentials"
			spec="2.0"
			mode={mode}
			subtitle="RFC 6749 §4.3 — the client collects the user's username and password and posts them directly to the token endpoint. Removed in OAuth 2.1."
			engine={engine}
		>
			{/* Anti-pattern warning is shown on every step so the teaching message is persistent. */}
			<WarningBanner>
				<WarningTitle>Anti-pattern — removed in OAuth 2.1</WarningTitle>
				ROPC requires the client to directly handle the user's password. This defeats
				multi-factor authentication (the AS never gets to challenge the user), consent
				screens (the user cannot see or approve requested scopes), and identity
				federation (SSO/social login is impossible). The client is also tempted to store
				the password for reuse. OAuth 2.1 (draft-ietf-oauth-v2-1) removes this grant
				entirely. Only consider it for legacy first-party migration when no redirect-capable
				browser is available — and replace it with Authorization Code + PKCE as soon
				as feasible.
			</WarningBanner>

			{cur === 'configure' && (
				<FlowStep
					title="1. Configure the client"
					explanation="Enter your PingOne environment and client credentials. The client must have the Resource Owner Password Credentials grant enabled. Real mode calls PingOne via the BFF; mock mode runs offline."
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
							placeholder="your-client-id"
						/>
						<FieldGroup
							label="Client Secret"
							type="password"
							value={creds.clientSecret ?? ''}
							onChange={set('clientSecret')}
							placeholder="your-client-secret"
						/>
						<FieldGroup
							label="Scope"
							value={creds.scope ?? ''}
							onChange={set('scope')}
							placeholder="openid profile email"
						/>
					</Grid>
					<ExplanationPanel title="Client auth: post vs basic">
						client_secret_post sends client_id and client_secret in the POST body.
						client_secret_basic sends them as an HTTP Basic Authorization header
						(base64(client_id:client_secret)). Both are RFC 6749 §2.3 compliant; PingOne
						supports either. The password grant parameters (username, password, scope) always
						go in the body regardless of which method you choose.
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'request' && (
				<FlowStep
					title="2. Request tokens with user credentials"
					explanation="Enter the resource owner's username and password. These are posted directly to the token endpoint as grant_type=password. The authorization server validates them and issues tokens — no redirect, no browser, no consent screen."
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(result)}
				>
					<Grid>
						<FieldGroup
							label="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="user@example.com"
						/>
						<FieldGroup
							label="Password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="user password"
						/>
					</Grid>
					<Action onClick={requestToken} disabled={loading || !canRequest}>
						{loading
							? 'Requesting…'
							: mode === 'real'
								? 'Request tokens'
								: 'Request mock tokens'}
					</Action>
					{error && <FlowResult error={error} />}
					<ExplanationPanel title="What gets sent to the token endpoint">
						The BFF posts to PingOne's /as/token with Content-Type application/x-www-form-urlencoded.
						The body is: grant_type=password &amp; username=&lt;value&gt; &amp; password=&lt;value&gt;
						&amp; scope=&lt;value&gt; plus client credentials according to the auth method selected
						on the previous step. There is no authorization endpoint call, no redirect, and no user
						agent involved — the client learns the password.
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'use' && (
				<FlowStep
					title="3. Use the tokens"
					explanation="The token endpoint returned an access token and, for openid scope, an id_token and refresh_token. Decoded claims are shown below — no signature verification."
					onPrev={engine.goPrev}
					nextLabel="Done"
					onNext={engine.reset}
					canNext
				>
					<FlowResult result={result} />
					<ExplanationPanel title="Why ROPC was removed from OAuth 2.1" defaultOpen>
						OAuth 2.1 (draft-ietf-oauth-v2-1-12 §B.1.1) formally removes the password grant
						because:
						(1) The client application sees and stores the user's raw password, widening the attack
						surface dramatically — a compromised client exposes every user's password.
						(2) The authorization server cannot add MFA or step-up challenges because the
						interaction is entirely between the client and the token endpoint.
						(3) Consent screens are skipped — the user cannot review or approve what the client
						is requesting on their behalf.
						(4) Identity federation (SAML IdP, social login, FIDO2) is incompatible with a
						username/password POST.
						Use Authorization Code + PKCE for all new applications. For legacy migration,
						move users to the new flow as soon as the application can open a browser or
						webview.
					</ExplanationPanel>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default RopcFlow;
