// src/pages/flows/v9/MtlsClientAuthFlow.tsx
// mTLS Client Authentication — RFC 8705
// Certificate-bound access tokens: cnf.x5t#S256

import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EphemeralKeyPair {
	publicJwk: JsonWebKey;
	privateKeyJwk: JsonWebKey;
}

interface CertResult {
	certificateJwt: string;
	certBody: Record<string, unknown>;
	thumbprint: string;
	caPublicJwk: Record<string, unknown>;
	pemLike: string;
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

const CA_OPTIONS = [
	'Demo Enterprise CA',
	'AWS Private CA',
	'Google Cloud CA Service',
	'Azure Managed HSM CA',
	'HashiCorp Vault PKI',
] as const;

// ─── Web Crypto helpers ───────────────────────────────────────────────────────

async function generateClientKeyPair(): Promise<EphemeralKeyPair> {
	const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
		'sign',
		'verify',
	]);
	const pubJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
	const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
	const { d: _d, ...pubOnly } = pubJwk;
	void _d;
	return { publicJwk: pubOnly, privateKeyJwk: privJwk };
}

function b64url(buf: Uint8Array | ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf)))
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

const RfcBadge = styled.span`
	display: inline-block;
	background: #dcfce7;
	color: #15803d;
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

const PemBox = styled.pre`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	color: #0f172a;
	border-radius: 0.5rem;
	padding: 1rem;
	font-size: 0.72rem;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-all;
	margin: 0.5rem 0 1rem;
	font-family: 'Courier New', monospace;
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

const MtlsBadge = styled.span`
	background: #dcfce720;
	color: #15803d;
	border: 1px solid #bbf7d0;
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

const ThumbprintBox = styled.div`
	background: #faf5ff;
	border: 1px solid #e9d5ff;
	border-radius: 0.5rem;
	padding: 0.75rem 1rem;
	font-family: monospace;
	font-size: 0.78rem;
	color: #7c3aed;
	margin-bottom: 1rem;
	word-break: break-all;
`;

// RFC 8705 specific claims
const MTLS_CLAIMS = new Set(['cnf', 'x5t#S256', 'tls_client_auth', 'certificate_thumbprint_s256']);

function ClaimsDisplay({ payload }: { payload: Record<string, unknown> }) {
	return (
		<div>
			{Object.entries(payload).map(([k, v]) => (
				<ClaimRow key={k}>
					<ClaimKey>
						{k}
						{(MTLS_CLAIMS.has(k) || (k === 'cnf' && Boolean(v))) && <MtlsBadge>RFC 8705</MtlsBadge>}
					</ClaimKey>
					<ClaimVal>
						{typeof v === 'object' ? JSON.stringify(v) : String(v)}
						{(k === 'exp' || k === 'iat' || k === 'notBefore' || k === 'notAfter') &&
						typeof v === 'number'
							? ` (${new Date(v * 1000).toLocaleString()})`
							: ''}
					</ClaimVal>
				</ClaimRow>
			))}
		</div>
	);
}

// ─── Component ────────────────────────────────────────────────────────────────

const MtlsClientAuthFlow: React.FC = () => {
	const [step, setStep] = useState<Step>(0);

	// Config
	const [clientId, setClientId] = useState('payments-service');
	const [subjectCN, setSubjectCN] = useState('CN=payments-service,O=Acme Corp,C=US');
	const [ca, setCa] = useState<string>(CA_OPTIONS[0]);
	const [audience, setAudience] = useState('https://api.example.com');
	const [scope, setScope] = useState('read write');

	// Runtime
	const [clientKP, setClientKP] = useState<EphemeralKeyPair | null>(null);
	const [certResult, setCertResult] = useState<CertResult | null>(null);
	const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Step 1 → generate key + request certificate
	const requestCertificate = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			// Client generates key pair (simulates: openssl genrsa / ecparam + req)
			const kp = await generateClientKeyPair();
			setClientKP(kp);

			// CSR → CA signs certificate
			const res = await fetch('/api/mtls/issue-certificate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clientPublicJwk: kp.publicJwk,
					subject: subjectCN,
					ca,
				}),
			});
			const data = (await res.json()) as CertResult & { success?: boolean; error?: string };
			if (!res.ok || !data.success) throw new Error(data.error ?? 'Certificate issuance failed');
			setCertResult(data);
			setStep(2);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [subjectCN, ca]);

	// Step 2 → prove possession + request token
	const requestToken = useCallback(async () => {
		if (!certResult || !clientKP) return;
		setLoading(true);
		setError(null);
		try {
			const now = Math.floor(Date.now() / 1000);
			// Proof JWT — signed by client private key (simulates TLS certificate_verify handshake message)
			const proofJwt = await signJwtBrowser(
				{ alg: 'ES256', typ: 'JWT' },
				{
					iss: clientId,
					aud: `${window.location.origin}/api/mtls/token`,
					iat: now,
					exp: now + 60,
					jti: crypto.randomUUID(),
					// Include cert thumbprint in proof so AS can cross-check
					'x5t#S256': certResult.thumbprint,
				},
				clientKP.privateKeyJwk
			);

			const res = await fetch('/api/mtls/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					certificate_jwt: certResult.certificateJwt,
					proof_jwt: proofJwt,
					client_id: clientId,
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
	}, [certResult, clientKP, clientId, scope, audience]);

	const reset = () => {
		setStep(0);
		setClientKP(null);
		setCertResult(null);
		setTokenResult(null);
		setError(null);
	};

	const STEPS = ['1. Configure', '2. Certificate', '3. Token Request', '4. Results'];

	return (
		<Page>
			<V9FlowHeader flowId="mtls-client-auth" />
			<PageTitle>
				mTLS Client Authentication
				<RfcBadge>RFC 8705</RfcBadge>
			</PageTitle>
			<PageSubtitle>
				Demonstrates{' '}
				<a href="https://www.rfc-editor.org/rfc/rfc8705" target="_blank" rel="noopener noreferrer">
					RFC 8705 — OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens
				</a>
				. The client authenticates with a TLS client certificate; the issued access token's{' '}
				<code>cnf.x5t#S256</code> claim binds it to that certificate thumbprint. Resource servers
				verify the thumbprint on every API call.
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
						<strong>How mTLS auth works:</strong> The client presents an X.509 certificate during
						the TLS handshake. The AS verifies the certificate chain and issues an access token with{' '}
						<code>cnf.x5t#S256</code> — the SHA-256 thumbprint of that certificate. At every API
						call, the resource server re-verifies that the thumbprint in the token matches the
						certificate the client is presenting in the current TLS connection. Stolen tokens are
						useless without the private key.
					</CalloutBox>
					<Card>
						<CardTitle>Client Configuration</CardTitle>
						<Label>Client ID</Label>
						<Input
							value={clientId}
							onChange={(e) => setClientId(e.target.value)}
							placeholder="my-service"
						/>
						<Label>Certificate Subject (Distinguished Name)</Label>
						<Input
							value={subjectCN}
							onChange={(e) => setSubjectCN(e.target.value)}
							placeholder="CN=my-service,O=Acme Corp,C=US"
						/>
						<Label>Certificate Authority</Label>
						<Select value={ca} onChange={(e) => setCa(e.target.value)}>
							{CA_OPTIONS.map((c) => (
								<option key={c} value={c}>
									{c}
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
					<Btn onClick={() => setStep(1)}>Next: Request Certificate →</Btn>
				</>
			)}

			{/* ── Step 1: Generate key + CSR ── */}
			{step === 1 && (
				<>
					<CalloutBox $color="amber">
						<strong>Step 1 — Generate key pair + request certificate.</strong> Your browser
						generates an EC P-256 key pair (simulates <code>openssl ecparam -genkey</code>). The
						public key is sent to the demo CA as a Certificate Signing Request. The CA returns a
						signed certificate binding your public key to the subject DN.
					</CalloutBox>
					<Card>
						<CardTitle>Certificate Request → POST /api/mtls/issue-certificate</CardTitle>
						<Pre>
							{JSON.stringify(
								{
									subject: subjectCN,
									ca,
									clientPublicJwk: '{ kty:"EC", crv:"P-256", x:"...", y:"..." }',
									keyUsage: ['digitalSignature', 'keyAgreement'],
									extendedKeyUsage: ['clientAuth'],
								},
								null,
								2
							)}
						</Pre>
					</Card>
					<Btn onClick={requestCertificate} disabled={loading}>
						{loading
							? 'Generating key + requesting certificate…'
							: 'Generate Key + Request Certificate'}
					</Btn>
					<Btn $variant="ghost" onClick={() => setStep(0)}>
						← Back
					</Btn>
				</>
			)}

			{/* ── Step 2: Show cert + trigger token request ── */}
			{step === 2 && certResult && clientKP && (
				<>
					<CalloutBox $color="amber">
						<strong>Certificate issued by {ca}.</strong> The <code>x5t#S256</code> thumbprint is
						computed as SHA-256 of the certificate body. The AS will embed this thumbprint in the{' '}
						<code>cnf</code> claim of every access token issued to this client. Next: prove
						possession of the private key.
					</CalloutBox>
					<Card>
						<CardTitle>Client Certificate (PEM representation)</CardTitle>
						<PemBox>{certResult.pemLike}</PemBox>
						<CardTitle style={{ marginTop: '1rem' }}>Certificate Fields</CardTitle>
						<ClaimsDisplay payload={certResult.certBody} />
					</Card>
					<Card>
						<CardTitle>Certificate Thumbprint (x5t#S256)</CardTitle>
						<ThumbprintBox>
							SHA-256(cert) = <strong>{certResult.thumbprint}</strong>
						</ThumbprintBox>
						<p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>
							This thumbprint will appear as <code>cnf.x5t#S256</code> in the access token. The
							resource server validates it against the certificate presented in each TLS connection.
						</p>
					</Card>
					<Card>
						<CardTitle>Token Request — POST /api/mtls/token</CardTitle>
						<ApiBox>Simulates: TLS mutual auth + AS token endpoint</ApiBox>
						<Pre>
							{JSON.stringify(
								{
									client_id: clientId,
									certificate_jwt: `${certResult.certificateJwt.slice(0, 40)}…`,
									proof_jwt: '<signed-by-client-private-key>',
									grant_type: 'client_credentials',
									scope,
								},
								null,
								2
							)}
						</Pre>
					</Card>
					<Btn onClick={requestToken} disabled={loading}>
						{loading
							? 'Signing proof + requesting token…'
							: 'Present Certificate + Request Token →'}
					</Btn>
					<Btn $variant="ghost" onClick={() => setStep(1)}>
						← Back
					</Btn>
				</>
			)}

			{/* ── Step 3: Results ── */}
			{step === 3 && tokenResult && certResult && (
				<>
					<CalloutBox $color="green">
						<strong>Certificate-bound token issued.</strong> The AS verified the certificate chain
						and the possession proof. The <code>cnf.x5t#S256</code> claim ties this token to the
						client certificate — it cannot be used from any other TLS connection.
					</CalloutBox>

					<Card>
						<CardTitle>AS Verification Steps</CardTitle>
						{Object.entries(tokenResult.verificationSteps).map(([k, v]) => (
							<ClaimRow key={k}>
								<ClaimKey style={{ color: '#374151' }}>{k.replace(/_/g, ' ')}</ClaimKey>
								<ClaimVal>
									<VerifyBadge $pass={v === 'PASS' || v.includes('cnf')}>{v}</VerifyBadge>
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

					<Card>
						<CardTitle>How a Resource Server Validates a Certificate-Bound Token</CardTitle>
						<Table>
							<thead>
								<tr>
									<th>Step</th>
									<th>What the RS checks</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>1</td>
									<td>Verify AT signature against AS JWKS</td>
								</tr>
								<tr>
									<td>2</td>
									<td>
										Check AT <code>exp</code> / <code>aud</code>
									</td>
								</tr>
								<tr>
									<td>3</td>
									<td>
										Extract <code>cnf.x5t#S256</code> from AT
									</td>
								</tr>
								<tr>
									<td>4</td>
									<td>Compute SHA-256 of the TLS client certificate in the current connection</td>
								</tr>
								<tr>
									<td>5</td>
									<td>Compare: AT thumbprint === connection thumbprint → ALLOW / DENY</td>
								</tr>
							</tbody>
						</Table>
					</Card>

					<Card>
						<CardTitle>mTLS vs DPoP vs Attestation</CardTitle>
						<Table>
							<thead>
								<tr>
									<th></th>
									<th>mTLS (RFC 8705)</th>
									<th>DPoP (RFC 9449)</th>
									<th>Attestation (draft)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Token binding</td>
									<td>
										<code>cnf.x5t#S256</code> (cert thumbprint)
									</td>
									<td>
										<code>cnf.jkt</code> (JWK thumbprint)
									</td>
									<td>
										<code>cnf.jwk</code> (ephemeral key)
									</td>
								</tr>
								<tr>
									<td>Proof in request</td>
									<td>TLS handshake (transport layer)</td>
									<td>
										<code>DPoP</code> HTTP header (app layer)
									</td>
									<td>
										<code>client_assertion</code> (app layer)
									</td>
								</tr>
								<tr>
									<td>Requires PKI</td>
									<td>Yes — CA must sign cert</td>
									<td>No — client self-generates</td>
									<td>Partial — attester signs</td>
								</tr>
								<tr>
									<td>Key rotation</td>
									<td>Certificate renewal (CSR to CA)</td>
									<td>Client generates new keypair anytime</td>
									<td>Automatic — ephemeral per request</td>
								</tr>
								<tr>
									<td>Replay protection</td>
									<td>TLS session uniqueness</td>
									<td>
										<code>ath</code> + <code>nonce</code> claims
									</td>
									<td>
										<code>jti</code> + short TTL
									</td>
								</tr>
								<tr>
									<td>Best for</td>
									<td>Enterprise / server-to-server with PKI</td>
									<td>Mobile / public clients</td>
									<td>Cloud-native / platform-attested workloads</td>
								</tr>
							</tbody>
						</Table>
					</Card>

					<Card>
						<CardTitle>Spec References</CardTitle>
						<ul style={{ paddingLeft: '1.25rem', lineHeight: 2, fontSize: '0.85rem' }}>
							<li>
								<a
									href="https://www.rfc-editor.org/rfc/rfc8705"
									target="_blank"
									rel="noopener noreferrer"
								>
									RFC 8705
								</a>{' '}
								— OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens
							</li>
							<li>
								<a
									href="https://www.rfc-editor.org/rfc/rfc9449"
									target="_blank"
									rel="noopener noreferrer"
								>
									RFC 9449
								</a>{' '}
								— OAuth 2.0 Demonstrating Proof of Possession (DPoP) — compare/contrast
							</li>
							<li>
								<a
									href="https://openid.net/specs/openid-financial-api-part-2-1_0.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									FAPI 2.0 Security Profile
								</a>{' '}
								— mandates MTLS or DPoP for certificate-bound tokens
							</li>
							<li>
								<a
									href="https://www.rfc-editor.org/rfc/rfc7517"
									target="_blank"
									rel="noopener noreferrer"
								>
									RFC 7517 (JWK)
								</a>{' '}
								— <code>x5t#S256</code> thumbprint format
							</li>
						</ul>
					</Card>
					<Btn onClick={reset}>↺ Run Again</Btn>
				</>
			)}
		</Page>
	);
};

export default MtlsClientAuthFlow;
