// src/flows2/flows/tokenRevocation.flow.tsx
//
// Token Revocation (RFC 7009) + verification via introspection (RFC 7662).
// Step 1: Configure — enter credentials, the token to revoke, and an optional type hint.
// Step 2: Revoke — call the BFF proxy (or mock). RFC 7009 always returns 200.
// Step 3: Verify — introspect the token to confirm it is now active: false.

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
import { JsonView } from '../framework/CodeBlock';
import { ResultCard } from '../framework/ResultCard';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { tokens } from '../framework/tokens';
import type { FlowCredentials, FlowError, FlowMode, StepDefinition } from '../framework/types';
import {
	revocationEndpointFor,
	tokenRevocationService as revSvc,
	type RevocationResponse,
	type TokenTypeHint,
} from '../services/tokenRevocationService';
import {
	introspectionEndpointFor,
	tokenIntrospectionService as intSvc,
	type IntrospectionResponse,
} from '../services/tokenIntrospectionService';
import { useFlowStorage } from '../framework/useFlowStorage';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Client + token to revoke' },
	{ id: 'revoke', title: 'Revoke', subtitle: 'RFC 7009 revocation request' },
	{ id: 'verify', title: 'Verify', subtitle: 'Confirm via introspection (RFC 7662)' },
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

const TokenRevocationFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_WORKER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_WORKER_CLIENT_SECRET || '',
		// The default worker app is registered for client_secret_basic only; sending
		// client_secret_post makes PingOne reject the revoke call with
		// "Unsupported authentication method". Users can still toggle to post.
		authMethod: 'client_secret_basic',
	});
	const [token, setToken] = useState('');
	const [hint, setHint] = useState<TokenTypeHint | undefined>(undefined);

	const [revokeResult, setRevokeResult] = useState<RevocationResponse | null>(null);
	const [revokeError, setRevokeError] = useState<FlowError | null>(null);
	const [revokeLoading, setRevokeLoading] = useState(false);

	const [verifyResult, setVerifyResult] = useState<IntrospectionResponse | null>(null);
	const [verifyError, setVerifyError] = useState<FlowError | null>(null);
	const [verifyLoading, setVerifyLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const { saveState, restoreState } = useFlowStorage('flows2:token-revocation');

	const runRevoke = useCallback(async () => {
		setRevokeLoading(true);
		setRevokeError(null);
		setRevokeResult(null);
		try {
			const r = await revSvc.run({ credentials: creds, token, tokenTypeHint: hint }, mode);
			setRevokeResult(r);
			engine.markComplete('revoke');
		} catch (err) {
			setRevokeError(err as FlowError);
		} finally {
			setRevokeLoading(false);
		}
	}, [creds, token, hint, mode, engine]);

	const runVerify = useCallback(async () => {
		setVerifyLoading(true);
		setVerifyError(null);
		setVerifyResult(null);
		try {
			// No hint — let the AS determine the token type on its own.
			const r = await intSvc.run({ credentials: creds, token, tokenTypeHint: undefined }, mode);
			setVerifyResult(r);
			engine.markComplete('verify');
		} catch (err) {
			setVerifyError(err as FlowError);
		} finally {
			setVerifyLoading(false);
		}
	}, [creds, token, mode, engine]);

	useEffect(() => {
		restoreState().then((saved) => {
			if (!saved) return;
			if (!token && saved.token) setToken(saved.token as string);
			if (!revokeResult && saved.revokeResult) setRevokeResult(saved.revokeResult as typeof revokeResult);
			if (!revokeError && saved.revokeError) setRevokeError(saved.revokeError as typeof revokeError);
			if (!verifyResult && saved.verifyResult) setVerifyResult(saved.verifyResult as typeof verifyResult);
		});
	}, [restoreState]);

	useEffect(() => {
		saveState({ token, hint, revokeResult, revokeError, verifyResult });
	}, [token, hint, revokeResult, revokeError, verifyResult, saveState]);

	const configured = Boolean(creds.environmentId && creds.clientId && token);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Token Revocation"
			spec="2.0"
			mode={mode}
			subtitle="RFC 7009. A client asks the authorization server to invalidate a token — access or refresh. The AS always returns 200, even if the token never existed. Use introspection to confirm the token is gone."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure the revocation request"
					explanation="The revoking party authenticates as the client that originally received the token (RFC 7009 §2.1). Paste any access or refresh token — a token from the Client Credentials or Authorization Code flow works well."
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
						<FieldGroup label="Environment ID" value={creds.environmentId} onChange={set('environmentId')} placeholder="uuid" />
						<FieldGroup label="Region" value={creds.region} onChange={set('region')} placeholder="com | eu | ca | asia" />
						<FieldGroup label="Client ID" value={creds.clientId} onChange={set('clientId')} placeholder="client id" />
						<FieldGroup label="Client Secret" type="password" value={creds.clientSecret ?? ''} onChange={set('clientSecret')} placeholder="client secret" />
					</Grid>
					<FieldGroup
						multiline
						label="Token to revoke (required)"
						value={token}
						onChange={(e) => setToken(e.target.value)}
						placeholder="paste an access or refresh token (e.g. from the Client Credentials or Authorization Code flow)"
					/>
					<Toggle>
						{([[undefined, 'no hint'], ['access_token', 'access_token'], ['refresh_token', 'refresh_token']] as const).map(([v, label]) => (
							<Pill key={label} $active={hint === v} onClick={() => setHint(v)}>
								{label}
							</Pill>
						))}
					</Toggle>
					<ExplanationPanel title="What token_type_hint does">
						The hint is optional and only affects server-side lookup order — it helps the AS search
						the right token store first. The AS will still find and revoke the token even if the hint
						is wrong or absent. It is not a security boundary.
					</ExplanationPanel>
					<ExplanationPanel title="Client authentication method">
						This flow sends client credentials in the request body (<code>client_secret_post</code>,
						RFC 6749 §2.3.1). The Authorization Server can also support{' '}
						<code>client_secret_basic</code> (HTTP Basic auth header). The choice is server policy;
						PingOne accepts <code>client_secret_post</code> for revocation.
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'revoke' && (
				<FlowStep
					title="2. Revoke the token"
					explanation="POST the token to the revocation endpoint along with client credentials (client_secret_post). RFC 7009 §2.2 requires a 200 response for any valid request — the server must not reveal whether the token actually existed (anti-enumeration)."
					nextLabel="Verify"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(revokeResult)}
				>
					<Endpoint>{mode === 'real' ? revocationEndpointFor(creds) : 'mock — no network call, simulated 200'}</Endpoint>
					<Action onClick={runRevoke} disabled={revokeLoading || !configured}>
						{revokeLoading ? 'Revoking…' : mode === 'real' ? 'Revoke real token' : 'Revoke mock token'}
					</Action>
					{revokeError && (
						<ResultCard title={`Error: ${revokeError.error}`} tone="error">
							<JsonView data={revokeError as unknown as Record<string, unknown>} />
						</ResultCard>
					)}
					{revokeResult && (
						<ResultCard title="Revocation accepted (HTTP 200)" tone="ok">
							<JsonView data={revokeResult} />
						</ResultCard>
					)}
					<ExplanationPanel title="RFC 7009 §2.2 — always 200">
						The server must return 200 regardless of whether the token was valid, expired, or never
						issued. Returning 404 or 400 would let an attacker enumerate whether a given token string
						has ever been issued. The 200 is a security feature, not a confirmation.
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'verify' && (
				<FlowStep
					title="3. Verify revocation via introspection"
					explanation="Introspect the same token (RFC 7662) to confirm it is now active: false. This is the only reliable way to check that revocation actually worked — the 200 from step 2 only confirms the request was processed, not its effect."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					<Endpoint>{mode === 'real' ? introspectionEndpointFor(creds) : 'mock — answered locally, no network call'}</Endpoint>
					<Action onClick={runVerify} disabled={verifyLoading || !configured}>
						{verifyLoading ? 'Introspecting…' : mode === 'real' ? 'Introspect (verify revocation)' : 'Introspect mock token'}
					</Action>
					{verifyError && (
						<ResultCard title={`Error: ${verifyError.error}`} tone="error">
							<JsonView data={verifyError as unknown as Record<string, unknown>} />
						</ResultCard>
					)}
					{verifyResult && (
						<ResultCard
							title={verifyResult.active ? 'Token is still ACTIVE — revocation may not have applied' : 'Token is INACTIVE — revocation confirmed'}
							tone={verifyResult.active ? 'error' : 'ok'}
						>
							<JsonView data={verifyResult} />
						</ResultCard>
					)}
					<ExplanationPanel title="Revocation scope — family invalidation">
						Revoking a refresh token typically also invalidates all access tokens derived from it
						(the token "family"). Revoking an access token only invalidates that single token — the
						refresh token and sibling access tokens remain active. Check your AS documentation for
						exact behaviour.
					</ExplanationPanel>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default TokenRevocationFlow;
