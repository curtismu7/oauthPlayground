// src/flows2/flows/refreshToken.flow.tsx
//
// Refresh Token grant (RFC 6749 §6) with OAuth 2.1 rotation teaching. The learner
// pastes an existing refresh_token, fires the exchange, and sees whether the server
// returned a *different* refresh_token — demonstrating the rotation mandate in
// OAuth 2.1 §4.3 and automatic-reuse-revocation (draft-ietf-oauth-security-topics).
//
// Look-and-feel: standardized on the /v2/flows/authorization-code design language —
// shared palette/primitives, signature FlowDiagram, header Real/Mock toggle, spec pills.

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
} from '../framework/types';
import { UseTokensStep } from '../framework/UseTokensStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { pingoneEndpoints } from '../services/pingone';
import { type RefreshResult, refreshTokenService } from '../services/refreshTokenService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Client + paste refresh token' },
	{ id: 'refresh', title: 'Refresh', subtitle: 'Exchange for new tokens' },
	{ id: 'rotation', title: 'Inspect Rotation', subtitle: 'Old vs new refresh token' },
];

// Realistic placeholders so the offline mock flow runs with zero PingOne setup.
const MOCK_CREDS = {
	environmentId: 'a1234567-b890-c123-d456-e7890f123456',
	region: 'com',
	clientId: 'mock-client-demo-1234567890',
	clientSecret: 'mock-client-secret',
	scope: 'openid profile',
} as const;

const MOCK_REFRESH_TOKEN = 'mock-refresh-token-for-demo-use-only';

const TokenCompare = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
`;

const TokenRow = styled.div<{ $highlight?: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	padding: 0.7rem 0.9rem;
	border-radius: ${tokens.radius.md};
	border: 1px solid
		${({ $highlight }) => ($highlight ? tokens.color.successBorder : tokens.color.border)};
	background: ${({ $highlight }) => ($highlight ? tokens.color.successBg : tokens.color.bgSubtle)};
`;

const TokenLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: ${tokens.color.textSecondary};
`;

const TokenValue = styled.div`
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 0.78rem;
	color: ${tokens.color.text};
	word-break: break-all;
`;

const RotationBadge = styled.div<{ $rotated: boolean }>`
	font-size: 0.85rem;
	font-weight: 700;
	padding: 0.5rem 0.85rem;
	border-radius: 8px;
	border: 1px solid
		${({ $rotated }) => ($rotated ? tokens.color.successBorder : tokens.color.errorBorder)};
	background: ${({ $rotated }) => ($rotated ? tokens.color.successBg : tokens.color.errorBg)};
	color: ${({ $rotated }) => ($rotated ? tokens.color.success : tokens.color.errorMuted)};
`;

const RefreshTokenFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [spec, setSpec] = useState<OAuthSpec>('2.1');
	const [oidc, setOidc] = useState(true);
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_USER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_USER_CLIENT_SECRET || '',
		scope: 'openid profile',
		authMethod: 'client_secret_post',
	});
	const [inputRefreshToken, setInputRefreshToken] = useState('');
	const [result, setResult] = useState<RefreshResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const selectMode = useCallback((m: FlowMode) => setMode(m), []);

	const { save: saveCredentials, saving: savingCreds, saved: savedCreds } =
		useFlowCredentials('flows2:refresh-token', creds, setCreds);

	// Auto-populate mock credentials when mode changes; clear them when switching to real.
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
			setInputRefreshToken((t) => t || MOCK_REFRESH_TOKEN);
		} else {
			setCreds((c) => ({
				...c,
				environmentId: c.environmentId === MOCK_CREDS.environmentId ? '' : c.environmentId,
				clientId: c.clientId === MOCK_CREDS.clientId ? '' : c.clientId,
				clientSecret: c.clientSecret === MOCK_CREDS.clientSecret ? '' : (c.clientSecret ?? ''),
				scope: c.scope === MOCK_CREDS.scope ? '' : c.scope,
			}));
			setInputRefreshToken((t) => (t === MOCK_REFRESH_TOKEN ? '' : t));
		}
	}, [mode]);

	const doRefresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResult(null);
		try {
			const r = await refreshTokenService.refresh(creds, inputRefreshToken, mode);
			setResult(r);
			engine.markComplete('refresh');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [creds, inputRefreshToken, mode, engine]);

	// Mock runs offline — never gate it on real credentials.
	const configured =
		mode === 'mock'
			? true
			: Boolean(creds.environmentId && creds.clientId && inputRefreshToken.trim());
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Refresh Token"
			spec={spec}
			mode={mode}
			onModeChange={selectMode}
			subtitle="Exchange a refresh_token for new tokens (RFC 6749 §6). OAuth 2.1 mandates rotation — the server MUST return a new refresh_token, and MUST revoke all tokens if the old one is reused."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure and paste your refresh token"
					explanation="Obtain a refresh_token from any OAuth flow that includes offline_access or openid scope (e.g., Authorization Code or Device Authorization). Paste it below. Real mode calls PingOne via the BFF; mock mode runs offline and demonstrates rotation without a server."
					canPrev={false}
					nextLabel="Continue"
					onNext={engine.goNext}
					canNext={configured}
				>
					<FlowDiagram
						label="OAuth 2.0 Refresh Token Grant"
						nodes={['Refresh Token', 'Token EP', 'New Tokens']}
					/>
					<SpecToggle
						spec={spec}
						onSpecChange={setSpec}
						oidc={oidc}
						onOidcToggle={() => setOidc((v) => !v)}
					/>
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
						scopePlaceholder="openid profile"
						onSave={saveCredentials}
						saving={savingCreds}
						saved={savedCreds}
					/>
					<FieldGroup
						label="Refresh Token (paste here)"
						value={inputRefreshToken}
						onChange={(e) => setInputRefreshToken(e.target.value)}
						placeholder="Paste a refresh_token obtained from a previous OAuth flow"
						multiline
						rows={3}
						hint="You can get one from the Authorization Code or Device Authorization flows above."
					/>
					<ExplanationPanel title="Why refresh tokens?">
						Access tokens are intentionally short-lived. A refresh_token lets the client obtain a
						new access_token without prompting the user again (RFC 6749 §1.5). In OAuth 2.1 the
						refresh grant is constrained: public clients MUST use PKCE, and servers MUST rotate
						refresh tokens to limit the blast radius of token theft.
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'refresh' && (
				<FlowStep
					title="2. Exchange the refresh token"
					explanation="POST grant_type=refresh_token to the token endpoint. PingOne returns a fresh access_token and, with rotation enabled, a brand-new refresh_token. The old one is immediately invalidated."
					nextLabel="Inspect Rotation"
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
								grant_type: 'refresh_token',
								refresh_token: inputRefreshToken || '<refresh_token>',
								client_id: creds.clientId,
								scope: creds.scope || undefined,
							},
						};
						return <RequestPreview request={curlReq} />;
					})()}
					<Action onClick={doRefresh} disabled={loading || !configured}>
						{loading ? 'Refreshing…' : mode === 'real' ? 'Refresh tokens' : 'Refresh tokens (mock)'}
					</Action>
					{error && <FlowResult error={error} />}
					{result && (
						<ResultCard title="Token endpoint response" tone="ok">
							<FlowResult result={result.token} />
						</ResultCard>
					)}
				</FlowStep>
			)}

			{cur === 'rotation' && (
				<FlowStep
					title="3. Inspect token rotation"
					explanation="OAuth 2.1 §4.3 requires refresh token rotation. Compare the token you submitted to the one returned. If they differ, rotation occurred. If the old token were reused, the server should detect it and revoke the entire token family (automatic-reuse-revocation)."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					<UseTokensStep
						result={result?.token ?? null}
						credentials={creds}
						mode={mode}
						tools={['userinfo', 'introspect', 'refresh', 'decode']}
					/>
					{result && (
						<>
							<RotationBadge $rotated={result.rotated}>
								{result.rotated
									? 'Rotation detected — a new refresh_token was issued. The submitted token is now invalid.'
									: 'No rotation — the server returned the same refresh_token (or none). Check your PingOne app settings.'}
							</RotationBadge>
							<TokenCompare>
								<TokenRow>
									<TokenLabel>Submitted refresh_token (old)</TokenLabel>
									<TokenValue>{result.submittedRefreshToken}</TokenValue>
								</TokenRow>
								<TokenRow $highlight={result.rotated}>
									<TokenLabel>
										Returned refresh_token (new){result.rotated ? ' — different' : ' — same'}
									</TokenLabel>
									<TokenValue>{result.token.refreshToken ?? '(none returned)'}</TokenValue>
								</TokenRow>
							</TokenCompare>
							<ExplanationPanel title="Refresh token rotation (OAuth 2.1 mandate)">
								<strong>Rotation (OAuth 2.1 §4.3):</strong> Every successful refresh must issue a
								NEW refresh_token and invalidate the old one. This bounds the lifetime of any stolen
								token to a single use.
								<br />
								<br />
								<strong>Automatic-reuse-revocation:</strong> If an attacker reuses the old
								(rotated-away) refresh_token, the authorization server detects the duplicate and
								MUST revoke the entire token family for that grant — logging out both the legitimate
								user and the attacker (draft-ietf-oauth-security-topics §4.14).
								<br />
								<br />
								<strong>Sender-constrained refresh tokens (future):</strong> DPoP or mTLS can bind a
								refresh_token to a specific client key-pair, so possession of the token string alone
								is not enough — the client must also prove control of the private key on every use
								(RFC 9449 / RFC 8705).
							</ExplanationPanel>
						</>
					)}
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default RefreshTokenFlow;
