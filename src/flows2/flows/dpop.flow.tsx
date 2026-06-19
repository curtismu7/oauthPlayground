// src/flows2/flows/dpop.flow.tsx
//
// DPoP — Demonstrating Proof of Possession (RFC 9449). A client generates an
// ephemeral EC P-256 key pair, attaches the public key to every token request as
// a signed proof JWT, and receives an access token cryptographically bound to that
// key. A stolen token is useless without the private key.

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { FlowContainer } from '../framework/FlowContainer';
import { FlowResult } from '../framework/FlowResult';
import { FlowStep } from '../framework/FlowStep';
import { useFlowEngine } from '../framework/useFlowEngine';
import { FieldGroup } from '../framework/FieldGroup';
import { JsonView } from '../framework/CodeBlock';
import { CodeBlock } from '../framework/CodeBlock';
import { ResultCard } from '../framework/ResultCard';
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
import {
	dpopService,
	type DPoPKeyPairResult,
	type DPoPProofResult,
} from '../services/dpopService';

const env = import.meta.env as Record<string, string | undefined>;

const STEPS: StepDefinition[] = [
	{ id: 'configure', title: 'Configure', subtitle: 'Client + scope' },
	{ id: 'generate', title: 'Generate Key', subtitle: 'EC P-256 key pair' },
	{ id: 'proof', title: 'Create Proof', subtitle: 'DPoP JWT' },
	{ id: 'request', title: 'Request Token', subtitle: 'DPoP-bound token' },
	{ id: 'inspect', title: 'Inspect', subtitle: 'cnf.jkt binding' },
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

const Mono = styled.span`
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 0.82rem;
	word-break: break-all;
`;

const WarnBanner = styled.div`
	font-size: 0.85rem;
	padding: 0.7rem 1rem;
	border-radius: 8px;
	border: 1px solid #fcd34d;
	background: #fefce8;
	color: #78350f;
	line-height: 1.5;
`;

const DPoPFlow: React.FC = () => {
	const engine = useFlowEngine(STEPS);
	const [mode, setMode] = useState<FlowMode>('real');
	const [creds, setCreds] = useState<FlowCredentials>({
		environmentId: env.VITE_PINGONE_ENVIRONMENT_ID || '',
		region: env.VITE_PINGONE_REGION || 'com',
		clientId: env.VITE_PINGONE_WORKER_CLIENT_ID || '',
		clientSecret: env.VITE_PINGONE_WORKER_CLIENT_SECRET || '',
		scope: '',
		// The default worker app is registered for client_secret_basic only; sending
		// client_secret_post makes PingOne reject the token request with
		// "Unsupported authentication method". Users can still toggle to post.
		authMethod: 'client_secret_basic',
	});
	const [keyPairResult, setKeyPairResult] = useState<DPoPKeyPairResult | null>(null);
	const [proofResult, setProofResult] = useState<DPoPProofResult | null>(null);
	const [result, setResult] = useState<TokenResult | null>(null);
	const [error, setError] = useState<FlowError | null>(null);
	const [loading, setLoading] = useState(false);

	const set = (k: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setCreds((c) => ({ ...c, [k]: e.target.value }));

	const generateKey = useCallback(async () => {
		setLoading(true);
		setError(null);
		setKeyPairResult(null);
		setProofResult(null);
		setResult(null);
		try {
			const kp = await dpopService.generateKeyPair(mode);
			setKeyPairResult(kp);
			engine.markComplete('generate');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [mode, engine]);

	const createProof = useCallback(async () => {
		if (!keyPairResult) return;
		setLoading(true);
		setError(null);
		setProofResult(null);
		setResult(null);
		try {
			const htu = dpopService._tokenEndpointUrl(creds.environmentId, creds.region);
			const pr = await dpopService.createProof({ htm: 'POST', htu }, keyPairResult, mode);
			setProofResult(pr);
			engine.markComplete('proof');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [keyPairResult, creds, mode, engine]);

	const requestToken = useCallback(async () => {
		if (!keyPairResult || !proofResult) return;
		setLoading(true);
		setError(null);
		setResult(null);
		try {
			const r = await dpopService.requestTokenWithDpop(
				creds,
				proofResult.proof,
				keyPairResult.thumbprint,
				mode
			);
			setResult(r);
			engine.markComplete('request');
		} catch (err) {
			setError(err as FlowError);
		} finally {
			setLoading(false);
		}
	}, [keyPairResult, proofResult, creds, mode, engine]);

	const configured = Boolean(creds.environmentId && creds.clientId && creds.clientSecret);
	const cur = engine.current.id;

	return (
		<FlowContainer
			title="DPoP"
			spec="2.0"
			mode={mode}
			subtitle="Demonstrating Proof of Possession (RFC 9449). The client generates an ephemeral EC key pair and attaches a signed proof JWT to every token request, binding the issued token to the key pair — a stolen token is useless without the private key."
			engine={engine}
		>
			{cur === 'configure' && (
				<FlowStep
					title="1. Configure the client"
					explanation="DPoP can layer on top of any grant type. This demo uses client_credentials so there is no user redirect — the DPoP key binding is the point of focus. Real mode calls PingOne via the BFF; mock mode runs offline."
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
						<FieldGroup label="Environment ID" value={creds.environmentId} onChange={set('environmentId')} placeholder="uuid" />
						<FieldGroup label="Region" value={creds.region} onChange={set('region')} placeholder="com | eu | ca | asia" />
						<FieldGroup label="Client ID" value={creds.clientId} onChange={set('clientId')} placeholder="worker client id" />
						<FieldGroup label="Client Secret" type="password" value={creds.clientSecret ?? ''} onChange={set('clientSecret')} placeholder="worker client secret" />
						<FieldGroup label="Scope (optional)" value={creds.scope ?? ''} onChange={set('scope')} placeholder="e.g. p1:read:user" />
					</Grid>
					<ExplanationPanel title="What is DPoP and why does it matter?">
						A bearer access token is like cash — whoever holds it can spend it. DPoP makes it more
						like a signed cheque: the token is cryptographically bound to a public key, and every
						request must carry a fresh proof-of-possession JWT signed by the matching private key.
						Even if an attacker intercepts the token, they cannot use it without the private key the
						client holds in memory. The binding is recorded in the token&apos;s <strong>cnf.jkt</strong>{' '}
						claim — the JWK thumbprint of the public key (RFC 7638).
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'generate' && (
				<FlowStep
					title="2. Generate an ephemeral EC P-256 key pair"
					explanation="The client generates a fresh asymmetric key pair on every session (or token request). The private key never leaves the browser. The public key will be embedded in the DPoP proof header so the authorization server can verify the signature."
					nextLabel="Create Proof"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(keyPairResult)}
				>
					<Action onClick={generateKey} disabled={loading}>
						{loading ? 'Generating…' : mode === 'real' ? 'Generate EC P-256 key pair' : 'Generate mock key pair'}
					</Action>
					{error && !keyPairResult && <FlowResult error={error} />}
					{keyPairResult && (
						<ResultCard title="Public key (JWK — embedded in every proof header)" tone="info">
							<JsonView data={keyPairResult.publicJwk} label="Public JWK" />
							<div style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: tokens.color.textSecondary }}>
								JWK thumbprint (cnf.jkt) — the token will be bound to this value:
								<br />
								<Mono>{keyPairResult.thumbprint}</Mono>
							</div>
						</ResultCard>
					)}
					<ExplanationPanel title="Key generation details">
						<p>
							<strong>Algorithm:</strong> ECDSA with the P-256 (secp256r1) curve, producing ES256
							signatures. P-256 is required by RFC 9449 §4.1.1 as the baseline.
						</p>
						<p>
							<strong>JWK thumbprint (RFC 7638):</strong> A SHA-256 digest of the canonical JSON
							encoding of the public key members (<code>crv</code>, <code>kty</code>, <code>x</code>,{' '}
							<code>y</code> in alphabetical order), base64url-encoded. The authorization server stores
							this in the access token as <code>cnf.jkt</code>.
						</p>
						<p>
							The private key is held in memory only and is never serialised or sent across the wire.
						</p>
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'proof' && (
				<FlowStep
					title="3. Build the DPoP proof JWT"
					explanation="A DPoP proof is a short-lived JWT signed by the private key. Its header embeds the public JWK; its payload names the HTTP method and URL of the upcoming request plus a unique jti and current timestamp so the server can reject replays."
					nextLabel="Request Token"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(proofResult)}
				>
					<Action onClick={createProof} disabled={loading || !keyPairResult}>
						{loading ? 'Signing…' : mode === 'real' ? 'Create + sign DPoP proof' : 'Create mock DPoP proof'}
					</Action>
					{error && !proofResult && <FlowResult error={error} />}
					{proofResult && (
						<>
							<ResultCard title="Decoded DPoP proof header" tone="info">
								<JsonView data={proofResult.header} label="Header" />
							</ResultCard>
							<ResultCard title="Decoded DPoP proof payload" tone="info">
								<JsonView data={proofResult.payload} label="Payload" />
							</ResultCard>
							<ResultCard title="Compact DPoP proof JWT (sent in the DPoP request header)" tone="ok">
								<CodeBlock value={proofResult.proof} label="Compact JWT" />
							</ResultCard>
						</>
					)}
					<ExplanationPanel title="DPoP JWT structure (RFC 9449 §4.2)">
						<p>
							<strong>Header members:</strong>
						</p>
						<ul>
							<li><code>typ: &apos;dpop+jwt&apos;</code> — tells the AS this is a DPoP proof, not a regular JWT.</li>
							<li><code>alg: &apos;ES256&apos;</code> — signature algorithm.</li>
							<li><code>jwk</code> — the public key (no private components). The AS uses this to verify the signature.</li>
						</ul>
						<p>
							<strong>Payload members:</strong>
						</p>
						<ul>
							<li><code>jti</code> — unique identifier; the AS may store seen jti values to block replay within a window.</li>
							<li><code>htm</code> — HTTP method (<code>POST</code> for token requests).</li>
							<li><code>htu</code> — HTTP target URI (token endpoint, no query/fragment).</li>
							<li><code>iat</code> — issued-at timestamp; the AS rejects stale proofs.</li>
							<li><code>nonce</code> (optional) — included when the AS has provided a nonce challenge (RFC 9449 §8).</li>
						</ul>
					</ExplanationPanel>
				</FlowStep>
			)}

			{cur === 'request' && (
				<FlowStep
					title="4. Request a DPoP-bound access token"
					explanation="POST grant_type=client_credentials to the token endpoint with the DPoP proof in the DPoP request header. If the AS supports DPoP it returns an access token with token_type=DPoP and a cnf.jkt claim binding it to the public key thumbprint."
					nextLabel="Inspect"
					onPrev={engine.goPrev}
					onNext={engine.goNext}
					canNext={Boolean(result)}
				>
					<WarnBanner>
						PingOne&apos;s DPoP support is limited at the time of writing. Real mode forwards the
						proof header best-effort — PingOne may accept it, ignore it, or return an error. The
						mock path is the reliable teaching demo.
					</WarnBanner>
					<Action onClick={requestToken} disabled={loading || !keyPairResult || !proofResult}>
						{loading ? 'Requesting…' : mode === 'real' ? 'Request real DPoP token' : 'Request mock DPoP token'}
					</Action>
					<FlowResult result={result} error={error} />
				</FlowStep>
			)}

			{cur === 'inspect' && (
				<FlowStep
					title="5. Inspect the DPoP-bound access token"
					explanation="The access token now carries a cnf.jkt claim: the JWK thumbprint of the public key. Every subsequent API call must carry a fresh DPoP proof signed by the matching private key — the resource server rejects the token otherwise."
					nextLabel="Done"
					onPrev={engine.goPrev}
					onNext={engine.reset}
					canNext
				>
					<FlowResult result={result} />
					{keyPairResult && (
						<ResultCard title="Key binding — cnf.jkt" tone="info">
							<div style={{ fontSize: '0.88rem', color: tokens.color.textSecondary, lineHeight: 1.55 }}>
								The token is bound to this public key thumbprint:
								<br />
								<Mono>{keyPairResult.thumbprint}</Mono>
								<br /><br />
								A resource server that validates DPoP will:
								<ol style={{ paddingLeft: '1.2rem', marginTop: '0.4rem' }}>
									<li>Verify the DPoP proof JWT signature using the embedded public JWK.</li>
									<li>Confirm the proof&apos;s <code>htm</code> and <code>htu</code> match the current request.</li>
									<li>Recompute the JWK thumbprint and check it equals the token&apos;s <code>cnf.jkt</code>.</li>
									<li>Reject the request if any check fails — the token alone is not enough.</li>
								</ol>
							</div>
						</ResultCard>
					)}
					<ExplanationPanel title="Why cnf.jkt makes stolen tokens useless">
						The access token encodes the thumbprint of the client&apos;s public key in the{' '}
						<code>cnf</code> (confirmation) claim. An attacker who steals the access token cannot
						forge a valid DPoP proof for it — they do not hold the private key. The resource server
						rejects the stolen token because the proof signature will not verify against the JWK
						embedded in the proof header, or the recomputed thumbprint will not match{' '}
						<code>cnf.jkt</code>.
					</ExplanationPanel>
				</FlowStep>
			)}
		</FlowContainer>
	);
};

export default DPoPFlow;
