// src/pages/flows/v9/AttestationClientAuthFlow.tsx
// Attestation-Based Client Authentication demo
// draft-ietf-oauth-attestation-based-client-auth
// https://datatracker.ietf.org/doc/draft-ietf-oauth-attestation-based-client-auth/

import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';
// ─── Types ────────────────────────────────────────────────────────────────────

interface EphemeralKeyPair {
	publicJwk: Record<string, unknown>;
	privateKeyJwk: JsonWebKey;
}

interface AttestationResult {
	attestationJwt: string;
	decodedHeader: Record<string, unknown>;
	decodedPayload: Record<string, unknown>;
	attesterPublicJwk: Record<string, unknown>;
}

interface TokenResult {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	atPayload: Record<string, unknown>;
	verificationSteps: Record<string, string>;
}

type Step = 0 | 1 | 2 | 3;

const ATTESTERS = [
	'demo-mdm',
	'google-play-integrity',
	'apple-device-check',
	'aws-nitro',
	'k8s-admission',
] as const;
type Attester = (typeof ATTESTERS)[number];

const ATTESTER_LABELS: Record<Attester, string> = {
	'demo-mdm': 'Demo MDM (generic)',
	'google-play-integrity': 'Google Play Integrity',
	'apple-device-check': 'Apple DeviceCheck',
	'aws-nitro': 'AWS Nitro Enclaves',
	'k8s-admission': 'Kubernetes Admission Webhook',
};

// ─── Crypto helpers (Web Crypto API — runs in browser) ───────────────────────

async function generateEphemeralKeyPair(): Promise<EphemeralKeyPair> {
	const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
		'sign',
		'verify',
	]);
	const publicJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
	const privateKeyJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
	// strip private-key-only fields from public JWK
	const { d: _d, ...pubOnly } = publicJwk;
	void _d; // suppress unused warning
	return { publicJwk: pubOnly, privateKeyJwk };
}

function b64url(buf: Uint8Array | ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(buf)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

async function signJwtBrowser(
	header: Record<string, unknown>,
	payload: Record<string, unknown>,
	privateKeyJwk: JsonWebKey
): Promise<string> {
	const key = await crypto.subtle.importKey(
		'jwk',
		privateKeyJwk,
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['sign']
	);
	const enc = new TextEncoder();
	const hdr = b64url(enc.encode(JSON.stringify(header)));
	const pld = b64url(enc.encode(JSON.stringify(payload)));
	const signing = `${hdr}.${pld}`;
	const sig = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		key,
		enc.encode(signing)
	);
	return `${signing}.${b64url(sig)}`;
}

// ─── Styled components ────────────────────────────────────────────────────────

const Page = styled.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 2rem 1.5rem;
	font-family: system-ui, sans-serif;
`;

const PageTitle = styled.h1`
	font-size: 1.75rem;
	font-weight: 700;
	color: #111;
	margin-bottom: 0.25rem;
`;

const PageSubtitle = styled.p`
	color: #555;
	margin-bottom: 2rem;
	line-height: 1.5;
	a {
		color: #2563eb;
		text-decoration: none;
		&:hover {
			text-decoration: underline;
		}
	}
`;

const DraftBadge = styled.span`
	display: inline-block;
	background: #fef3c7;
	color: #92400e;
	font-size: 0.7rem;
	font-weight: 600;
	padding: 0.15rem 0.5rem;
	border-radius: 9999px;
	margin-left: 0.5rem;
	vertical-align: middle;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const Stepper = styled.div`
	display: flex;
	margin-bottom: 2rem;
	border-radius: 0.5rem;
	overflow: hidden;
	border: 1px solid #e5e7eb;
`;

const StepTab = styled.button<{ $active: boolean; $done: boolean }>`
	flex: 1;
	padding: 0.65rem 0.5rem;
	border: none;
	font-size: 0.8rem;
	font-weight: 600;
	cursor: pointer;
	background: ${({ $active, $done }) => ($active ? '#1d4ed8' : $done ? '#dcfce7' : '#f9fafb')};
	color: ${({ $active, $done }) => ($active ? '#fff' : $done ? '#15803d' : '#6b7280')};
	border-right: 1px solid #e5e7eb;
	&:last-child {
		border-right: none;
	}
`;

const Card = styled.div`
	background: #fff;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.25rem;
`;

const CardTitle = styled.h2`
	font-size: 1rem;
	font-weight: 700;
	color: #111;
	margin: 0 0 1rem;
`;

const Label = styled.label`
	display: block;
	font-size: 0.8rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.3rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.5rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.4rem;
	font-size: 0.9rem;
	margin-bottom: 1rem;
	box-sizing: border-box;
	&:focus {
		outline: 2px solid #2563eb;
		border-color: transparent;
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.5rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.4rem;
	font-size: 0.9rem;
	margin-bottom: 1rem;
	background: #fff;
`;

const Btn = styled.button<{ $variant?: 'primary' | 'ghost' }>`
	padding: 0.6rem 1.25rem;
	border-radius: 0.4rem;
	font-size: 0.875rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	background: ${({ $variant }) => ($variant === 'ghost' ? '#f3f4f6' : '#1d4ed8')};
	color: ${({ $variant }) => ($variant === 'ghost' ? '#374151' : '#fff')};
	margin-right: 0.5rem;
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	&:hover:not(:disabled) {
		filter: brightness(0.92);
	}
`;

const Pre = styled.pre`
	background: #0f172a;
	color: #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	font-size: 0.75rem;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-all;
	margin: 0.5rem 0 1rem;
`;

const ApiBox = styled.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.5rem;
	padding: 0.75rem 1rem;
	font-size: 0.8rem;
	color: #15803d;
	margin-bottom: 1rem;
	font-family: monospace;
`;

const ErrorBox = styled.div`
	background: #fef2f2;
	border: 1px solid #fca5a5;
	border-radius: 0.5rem;
	padding: 0.75rem 1rem;
	font-size: 0.85rem;
	color: #dc2626;
	margin-bottom: 1rem;
`;

const CalloutBox = styled.div<{ $color?: 'blue' | 'amber' | 'green' }>`
	background: ${({ $color }) =>
		$color === 'amber' ? '#fffbeb' : $color === 'green' ? '#f0fdf4' : '#eff6ff'};
	border-left: 4px solid
		${({ $color }) => ($color === 'amber' ? '#f59e0b' : $color === 'green' ? '#16a34a' : '#2563eb')};
	border-radius: 0 0.4rem 0.4rem 0;
	padding: 0.75rem 1rem;
	font-size: 0.82rem;
	color: ${({ $color }) =>
		$color === 'amber' ? '#92400e' : $color === 'green' ? '#14532d' : '#1e40af'};
	margin-bottom: 1rem;
	line-height: 1.5;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	font-size: 0.82rem;
	margin-bottom: 1rem;
	th,
	td {
		padding: 0.5rem 0.75rem;
		border: 1px solid #e5e7eb;
		text-align: left;
	}
	th {
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
	}
	tr:nth-child(even) td {
		background: #f9fafb;
	}
`;

const ClaimRow = styled.div`
	display: flex;
	gap: 0.5rem;
	font-size: 0.8rem;
	padding: 0.3rem 0;
	border-bottom: 1px solid #f3f4f6;
	font-family: monospace;
`;

const ClaimKey = styled.span`
	color: #7c3aed;
	min-width: 200px;
	flex-shrink: 0;
`;

const ClaimVal = styled.span`
	color: #065f46;
	word-break: break-all;
`;

const AttestBadge = styled.span`
	background: #dbeafe;
	color: #1d4ed8;
	font-size: 0.65rem;
	font-weight: 700;
	padding: 0.1rem 0.4rem;
	border-radius: 9999px;
	margin-left: 0.4rem;
	vertical-align: middle;
`;

const VerifyBadge = styled.span<{ $pass: boolean }>`
	background: ${({ $pass }) => ($pass ? '#dcfce7' : '#fee2e2')};
	color: ${({ $pass }) => ($pass ? '#15803d' : '#dc2626')};
	font-size: 0.72rem;
	font-weight: 700;
	padding: 0.2rem 0.5rem;
	border-radius: 0.25rem;
`;

// Draft-specific claims
const ATTEST_CLAIMS = new Set(['cnf', 'client_attestation', 'policy-ids', 'attester', 'jkt']);

function ClaimsDisplay({ payload }: { payload: Record<string, unknown> }) {
	return (
		<div>
			{Object.entries(payload).map(([k, v]) => (
				<ClaimRow key={k}>
					<ClaimKey>
						{k}
						{ATTEST_CLAIMS.has(k) && <AttestBadge>ATTEST</AttestBadge>}
					</ClaimKey>
					<ClaimVal>
						{typeof v === 'object' ? JSON.stringify(v) : String(v)}
						{(k === 'exp' || k === 'iat') && typeof v === 'number'
							? ` (${new Date(v * 1000).toLocaleTimeString()})`
							: ''}
					</ClaimVal>
				</ClaimRow>
			))}
		</div>
	);
}

// ─── Component ────────────────────────────────────────────────────────────────

const AttestationClientAuthFlow: React.FC = () => {
	const [step, setStep] = useState<Step>(0);

	// Config
	const [clientId, setClientId] = useState('my-mobile-app-v2');
	const [attester, setAttester] = useState<Attester>('demo-mdm');
	const [audience, setAudience] = useState('https://api.example.com');
	const [scope, setScope] = useState('read write');

	// Runtime state
	const [ephemeralKP, setEphemeralKP] = useState<EphemeralKeyPair | null>(null);
	const [attestResult, setAttestResult] = useState<AttestationResult | null>(null);
	const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Step 1 → generate ephemeral key + request attestation
	const requestAttestation = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			// 1a. Generate ephemeral key pair in the browser (simulates client)
			const kp = await generateEphemeralKeyPair();
			setEphemeralKP(kp);

			// 1b. Send public JWK to attester to bind into attestation JWT
			const res = await fetch('/api/attestation/issue-attestation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clientId,
					clientEphemeralPublicJwk: kp.publicJwk,
					attester,
					policies: ['integrity-pass', 'no-jailbreak'],
				}),
			});
			const data = (await res.json()) as AttestationResult & { success?: boolean; error?: string };
			if (!res.ok || !data.success) throw new Error(data.error ?? 'Attestation failed');
			setAttestResult(data);
			setStep(2);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [clientId, attester]);

	// Step 2 → build PoP JWT in browser + send combined assertion to AS
	const requestToken = useCallback(async () => {
		if (!attestResult || !ephemeralKP) return;
		setLoading(true);
		setError(null);
		try {
			const now = Math.floor(Date.now() / 1000);
			// Client Attestation PoP JWT — signed by client ephemeral private key
			const popHeader = { alg: 'ES256', typ: 'JWT' };
			const popPayload = {
				iss: clientId,
				aud: `${window.location.origin}/api/attestation/token`,
				iat: now,
				exp: now + 60, // 1-minute PoP window
				jti: crypto.randomUUID(),
			};
			const popJwt = await signJwtBrowser(popHeader, popPayload, ephemeralKP.privateKeyJwk);

			// Combined assertion: <attestation>~<pop>
			const clientAssertion = `${attestResult.attestationJwt}~${popJwt}`;

			const res = await fetch('/api/attestation/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					client_assertion_type:
						'urn:ietf:params:oauth:client-assertion-type:jwt-client-attestation',
					client_assertion: clientAssertion,
					grant_type: 'client_credentials',
					scope,
					audience,
				}),
			});
			const data = (await res.json()) as TokenResult & {
				error?: string;
				error_description?: string;
			};
			if (!res.ok || data.error) {
				throw new Error(data.error_description ?? data.error ?? 'Token request failed');
			}
			setTokenResult(data);
			setStep(3);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [attestResult, ephemeralKP, clientId, scope, audience]);

	const reset = () => {
		setStep(0);
		setEphemeralKP(null);
		setAttestResult(null);
		setTokenResult(null);
		setError(null);
	};

	const STEPS = ['1. Configure', '2. Attestation', '3. Token Request', '4. Results'];

	return (
		<Page>
			<V9FlowHeader flowId="attestation-client-auth" />
			<PageTitle>
				Attestation-Based Client Auth
				<DraftBadge>IETF Draft</DraftBadge>
			</PageTitle>
			<PageSubtitle>
				Demonstrates{' '}
				<a
					href="https://datatracker.ietf.org/doc/draft-ietf-oauth-attestation-based-client-auth/"
					target="_blank"
					rel="noopener noreferrer"
				>
					draft-ietf-oauth-attestation-based-client-auth
				</a>
				: a client proves its identity using a platform-issued{' '}
				<strong>Client Attestation JWT</strong> + a short-lived{' '}
				<strong>Proof-of-Possession JWT</strong> — no <code>client_secret</code>, no
				pre-registration of credentials.
			</PageSubtitle>

			<Stepper>
				{STEPS.map((label, i) => (
					<StepTab
						key={label}
						$active={step === i}
						$done={step > i}
						onClick={() => {
							if (i < step) setStep(i as Step);
						}}
					>
						{step > i ? '✓ ' : ''}
						{label}
					</StepTab>
				))}
			</Stepper>

			{error && <ErrorBox>⚠️ {error}</ErrorBox>}

			{/* ── Step 0: Configure ── */}
			{step === 0 && (
				<>
					<CalloutBox>
						<strong>How it works:</strong> Instead of a long-lived <code>client_secret</code>, the
						AS trusts a platform <em>Attester</em> (MDM, app store, device enclave). The Attester
						signs a JWT binding the client's ephemeral public key. The client then proves possession
						of the matching private key with a short-lived PoP JWT. Combined as{' '}
						<code>&lt;attestation&gt;~&lt;pop&gt;</code> — two tokens, one assertion.
					</CalloutBox>
					<Card>
						<CardTitle>Client Configuration</CardTitle>
						<Label>Client ID (app identifier)</Label>
						<Input
							value={clientId}
							onChange={(e) => setClientId(e.target.value)}
							placeholder="my-app-v2"
						/>
						<Label>Attester / Platform</Label>
						<Select value={attester} onChange={(e) => setAttester(e.target.value as Attester)}>
							{ATTESTERS.map((a) => (
								<option key={a} value={a}>
									{ATTESTER_LABELS[a]}
								</option>
							))}
						</Select>
						<Label>Target Audience</Label>
						<Input
							value={audience}
							onChange={(e) => setAudience(e.target.value)}
							placeholder="https://api.example.com"
						/>
						<Label>Requested Scope</Label>
						<Input
							value={scope}
							onChange={(e) => setScope(e.target.value)}
							placeholder="read write"
						/>
					</Card>
					<Btn onClick={() => setStep(1)}>Next: Request Attestation →</Btn>
				</>
			)}

			{/* ── Step 1: Request attestation JWT ── */}
			{step === 1 && (
				<>
					<CalloutBox $color="amber">
						<strong>Step 1 — Client generates an ephemeral key pair</strong> (in your browser via
						Web Crypto API), then asks the Attester to sign a{' '}
						<strong>Client Attestation JWT</strong> binding that public key. In production this
						happens out-of-band (e.g. at app install time via MDM or app store integrity API).
					</CalloutBox>
					<Card>
						<CardTitle>Request → POST /api/attestation/issue-attestation</CardTitle>
						<Pre>
							{JSON.stringify(
								{
									clientId,
									clientEphemeralPublicJwk: '{ kty: "EC", crv: "P-256", x: "...", y: "..." }',
									attester,
									policies: ['integrity-pass', 'no-jailbreak'],
								},
								null,
								2
							)}
						</Pre>
					</Card>
					<Btn onClick={requestAttestation} disabled={loading}>
						{loading
							? 'Generating key + requesting attestation…'
							: 'Generate Ephemeral Key + Request Attestation'}
					</Btn>
					<Btn $variant="ghost" onClick={() => setStep(0)}>
						← Back
					</Btn>
				</>
			)}

			{/* ── Step 2: Show attestation + trigger token request ── */}
			{step === 2 && attestResult && ephemeralKP && (
				<>
					<CalloutBox $color="amber">
						<strong>Attestation JWT issued</strong> by the demo Attester. Notice the{' '}
						<AttestBadge>ATTEST</AttestBadge> claims: <code>cnf.jwk</code> binds the client's
						ephemeral public key, <code>client_attestation</code> records platform integrity
						results, and <code>policy-ids</code> lists enforced policies. The client will now sign a
						PoP JWT with the matching private key.
					</CalloutBox>
					<Card>
						<CardTitle>Client Attestation JWT (from Attester)</CardTitle>
						<Pre style={{ fontSize: '0.68rem' }}>{attestResult.attestationJwt}</Pre>
						<CardTitle style={{ marginTop: '1rem' }}>Decoded Header</CardTitle>
						<ClaimsDisplay payload={attestResult.decodedHeader} />
						<CardTitle style={{ marginTop: '1rem' }}>Decoded Payload</CardTitle>
						<ClaimsDisplay payload={attestResult.decodedPayload} />
					</Card>
					<Card>
						<CardTitle>Ephemeral Key Pair (generated in browser)</CardTitle>
						<Pre>{JSON.stringify(ephemeralKP.publicJwk, null, 2)}</Pre>
					</Card>
					<Card>
						<CardTitle>Token Request — POST /api/attestation/token</CardTitle>
						<ApiBox>
							client_assertion_type =
							urn:ietf:params:oauth:client-assertion-type:jwt-client-attestation
						</ApiBox>
						<Pre>
							{JSON.stringify(
								{
									client_assertion: `${attestResult.attestationJwt.slice(0, 40)}…~<pop-jwt>`,
									grant_type: 'client_credentials',
									scope,
									audience,
								},
								null,
								2
							)}
						</Pre>
					</Card>
					<Btn onClick={requestToken} disabled={loading}>
						{loading ? 'Signing PoP + requesting token…' : 'Sign PoP JWT + Request Token →'}
					</Btn>
					<Btn $variant="ghost" onClick={() => setStep(1)}>
						← Back
					</Btn>
				</>
			)}

			{/* ── Step 3: Results ── */}
			{step === 3 && tokenResult && (
				<>
					<CalloutBox $color="green">
						<strong>Token issued.</strong> The AS verified both the Attestation JWT (attester
						signature) and the PoP JWT (ephemeral key signature from <code>cnf.jwk</code>). No{' '}
						<code>client_secret</code> was ever transmitted.
					</CalloutBox>

					{/* Verification steps */}
					<Card>
						<CardTitle>AS Verification Steps</CardTitle>
						{Object.entries(tokenResult.verificationSteps).map(([k, v]) => (
							<ClaimRow key={k}>
								<ClaimKey style={{ color: '#374151' }}>{k.replace(/_/g, ' ')}</ClaimKey>
								<ClaimVal>
									<VerifyBadge $pass={v === 'PASS'}>{v}</VerifyBadge>
								</ClaimVal>
							</ClaimRow>
						))}
					</Card>

					<Card>
						<CardTitle>Issued Access Token</CardTitle>
						<ApiBox>
							✓ {tokenResult.token_type} · {tokenResult.expires_in}s · scope: {tokenResult.scope}
						</ApiBox>
						<Pre style={{ fontSize: '0.68rem' }}>{tokenResult.access_token}</Pre>
						<CardTitle style={{ marginTop: '1rem' }}>Access Token Claims</CardTitle>
						<ClaimsDisplay payload={tokenResult.atPayload} />
					</Card>

					{/* Comparison table */}
					<Card>
						<CardTitle>Attestation Auth vs Traditional Client Auth</CardTitle>
						<Table>
							<thead>
								<tr>
									<th></th>
									<th>client_secret_post</th>
									<th>private_key_jwt</th>
									<th>Attestation (this draft)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Secret at AS</td>
									<td>Stored hashed secret</td>
									<td>Stored public key</td>
									<td>No stored credential — trusts Attester</td>
								</tr>
								<tr>
									<td>Pre-registration</td>
									<td>Required</td>
									<td>Required (JWKS endpoint)</td>
									<td>None — identity attested dynamically</td>
								</tr>
								<tr>
									<td>Key rotation</td>
									<td>Manual admin action</td>
									<td>Update JWKS endpoint</td>
									<td>Automatic — ephemeral key per request</td>
								</tr>
								<tr>
									<td>Proof type</td>
									<td>Knowledge (secret)</td>
									<td>Possession (private key)</td>
									<td>Attestation + Possession (two-factor)</td>
								</tr>
								<tr>
									<td>Platform binding</td>
									<td>None</td>
									<td>None</td>
									<td>Yes — attester certifies runtime environment</td>
								</tr>
							</tbody>
						</Table>
					</Card>

					{/* Spec links */}
					<Card>
						<CardTitle>Spec References</CardTitle>
						<ul style={{ paddingLeft: '1.25rem', lineHeight: 2, fontSize: '0.85rem' }}>
							<li>
								<a
									href="https://datatracker.ietf.org/doc/draft-ietf-oauth-attestation-based-client-auth/"
									target="_blank"
									rel="noopener noreferrer"
								>
									draft-ietf-oauth-attestation-based-client-auth
								</a>{' '}
								— Attestation-Based Client Authentication
							</li>
							<li>
								<a
									href="https://datatracker.ietf.org/doc/draft-ietf-oauth-status-assertions/"
									target="_blank"
									rel="noopener noreferrer"
								>
									draft-ietf-oauth-status-assertions
								</a>{' '}
								— Status Assertions (companion spec)
							</li>
							<li>
								<a
									href="https://www.rfc-editor.org/rfc/rfc7521"
									target="_blank"
									rel="noopener noreferrer"
								>
									RFC 7521
								</a>{' '}
								— Assertion Framework (foundation)
							</li>
							<li>
								<a
									href="https://www.rfc-editor.org/rfc/rfc7523"
									target="_blank"
									rel="noopener noreferrer"
								>
									RFC 7523
								</a>{' '}
								— JWT Client Authentication (predecessor)
							</li>
						</ul>
					</Card>
					<Btn onClick={reset}>↺ Run Again</Btn>
				</>
			)}
		</Page>
	);
};

export default AttestationClientAuthFlow;
