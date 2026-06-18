// src/flows2/flows/refreshToken.flow.tsx
//
// Refresh Token grant (RFC 6749 §6) with OAuth 2.1 rotation teaching. The learner
// pastes an existing refresh_token, fires the exchange, and sees whether the server
// returned a *different* refresh_token — demonstrating the rotation mandate in
// OAuth 2.1 §4.3 and automatic-reuse-revocation (draft-ietf-oauth-security-topics).

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
import { ResultCard } from '../framework/ResultCard';
import { ExplanationPanel } from '../framework/ExplanationPanel';
import { tokens } from '../framework/tokens';
import type {
	ClientAuthMethod,
	FlowCredentials,
	FlowError,
	FlowMode,
	StepDefinition,
} from '../framework/types';
import { refreshTokenService, type RefreshResult } from '../services/refreshTokenService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Client + paste refresh token' },
	{ id: 'refresh', title: 'Refresh', subtitle: 'Exchange for new tokens' },
	{ id: 'rotation', title: 'Inspect Rotation', subtitle: 'Old vs new refresh token' },
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

	const configured = Boolean(creds.environmentId && creds.clientId && inputRefreshToken.trim());
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="Refresh Token"
			spec="2.1"
			mode={mode}
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
							placeholder="client id"
						/>
						<FieldGroup
							label="Client Secret"
							type="password"
							value={creds.clientSecret ?? ''}
							onChange={set('clientSecret')}
							placeholder="leave blank for public clients"
						/>
						<FieldGroup
							label="Scope (optional)"
							value={creds.scope ?? ''}
							onChange={set('scope')}
							placeholder="openid profile"
						/>
					</Grid>
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
						Access tokens are intentionally short-lived. A refresh_token lets the client obtain
						a new access_token without prompting the user again (RFC 6749 §1.5). In OAuth 2.1
						the refresh grant is constrained: public clients MUST use PKCE, and servers MUST
						rotate refresh tokens to limit the blast radius of token theft.
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
					<Action onClick={doRefresh} disabled={loading || !configured}>
						{loading
							? 'Refreshing…'
							: mode === 'real'
								? 'Refresh tokens'
								: 'Refresh tokens (mock)'}
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
									<TokenValue>
										{result.token.refreshToken ?? '(none returned)'}
									</TokenValue>
								</TokenRow>
							</TokenCompare>
							<ExplanationPanel title="Refresh token rotation (OAuth 2.1 mandate)">
								<strong>Rotation (OAuth 2.1 §4.3):</strong> Every successful refresh must
								issue a NEW refresh_token and invalidate the old one. This bounds the
								lifetime of any stolen token to a single use.
								<br /><br />
								<strong>Automatic-reuse-revocation:</strong> If an attacker reuses the old
								(rotated-away) refresh_token, the authorization server detects the duplicate
								and MUST revoke the entire token family for that grant — logging out both
								the legitimate user and the attacker (draft-ietf-oauth-security-topics §4.14).
								<br /><br />
								<strong>Sender-constrained refresh tokens (future):</strong> DPoP or
								mTLS can bind a refresh_token to a specific client key-pair, so possession
								of the token string alone is not enough — the client must also prove
								control of the private key on every use (RFC 9449 / RFC 8705).
							</ExplanationPanel>
						</>
					)}
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default RefreshTokenFlow;
