// src/pages/flows/v9/WIMSEFlow.tsx
// WIMSE — Workload Identity in Multi-System Environments demo
// draft-ietf-wimse-arch + draft-ietf-wimse-workload-identity-token + RFC 8693

import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WitResult {
	wit: string;
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	publicJwk: Record<string, unknown>;
}

interface ExchangeResult {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	issued_token_type: string;
	atPayload: Record<string, unknown>;
}

type Step = 0 | 1 | 2 | 3;

const PLATFORMS = ['generic', 'aws', 'gcp', 'azure', 'kubernetes'] as const;
type Platform = (typeof PLATFORMS)[number];

const PLATFORM_LABELS: Record<Platform, string> = {
	generic: 'Generic (SPIFFE)',
	aws: 'AWS (EC2 Instance Identity)',
	gcp: 'GCP (Workload Identity)',
	azure: 'Azure (Managed Identity)',
	kubernetes: 'Kubernetes (ServiceAccount)',
};

// ─── Styled components ────────────────────────────────────────────────────────

const Page = styled.div`
	max-width: 860px;
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
	gap: 0;
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
	transition: background 0.15s;
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
	margin-bottom: 1rem;
	margin-top: 0;
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
	&:focus {
		outline: 2px solid #2563eb;
		border-color: transparent;
	}
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

const CalloutBox = styled.div<{ $color?: 'blue' | 'amber' }>`
	background: ${({ $color }) => ($color === 'amber' ? '#fffbeb' : '#eff6ff')};
	border-left: 4px solid ${({ $color }) => ($color === 'amber' ? '#f59e0b' : '#2563eb')};
	border-radius: 0 0.4rem 0.4rem 0;
	padding: 0.75rem 1rem;
	font-size: 0.82rem;
	color: ${({ $color }) => ($color === 'amber' ? '#92400e' : '#1e40af')};
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

const WimseBadge = styled.span`
	background: #7c3aed20;
	color: #7c3aed;
	font-size: 0.65rem;
	font-weight: 700;
	padding: 0.1rem 0.4rem;
	border-radius: 9999px;
	margin-left: 0.4rem;
	vertical-align: middle;
`;

// WIMSE-specific claim keys per draft-ietf-wimse-workload-identity-token
const WIMSE_CLAIMS = new Set(['wid', 'platform', 'platform_attestation', 'act']);

function ClaimsDisplay({ payload }: { payload: Record<string, unknown> }) {
	return (
		<div>
			{Object.entries(payload).map(([k, v]) => (
				<ClaimRow key={k}>
					<ClaimKey>
						{k}
						{WIMSE_CLAIMS.has(k) && <WimseBadge>WIMSE</WimseBadge>}
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

const WIMSEFlow: React.FC = () => {
	const [step, setStep] = useState<Step>(0);

	const [workloadId, setWorkloadId] = useState('spiffe://demo.local/payments-processor');
	const [audience, setAudience] = useState('https://api.example.com/inventory');
	const [platform, setPlatform] = useState<Platform>('generic');
	const [scope, setScope] = useState('read:inventory write:orders');

	const [witResult, setWitResult] = useState<WitResult | null>(null);
	const [exchangeResult, setExchangeResult] = useState<ExchangeResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const issueWit = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/wimse/issue-wit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ workloadId, audience, platform }),
			});
			const data = (await res.json()) as WitResult & { success?: boolean; error?: string };
			if (!res.ok || !data.success) throw new Error(data.error ?? 'Failed to issue WIT');
			setWitResult(data);
			setStep(2);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [workloadId, audience, platform]);

	const doExchange = useCallback(async () => {
		if (!witResult) return;
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/wimse/token-exchange', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subject_token: witResult.wit,
					subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
					requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
					audience,
					scope,
				}),
			});
			const data = (await res.json()) as ExchangeResult & {
				error?: string;
				error_description?: string;
			};
			if (!res.ok || data.error) {
				throw new Error(data.error_description ?? data.error ?? 'Exchange failed');
			}
			setExchangeResult(data);
			setStep(3);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [witResult, audience, scope]);

	const reset = () => {
		setStep(0);
		setWitResult(null);
		setExchangeResult(null);
		setError(null);
	};

	const STEPS = ['1. Configure', '2. Issue WIT', '3. Token Exchange', '4. Compare'];

	return (
		<Page>
			<PageTitle>
				WIMSE — Workload Identity Demo
				<DraftBadge>IETF Draft</DraftBadge>
			</PageTitle>
			<PageSubtitle>
				Demonstrates the WIMSE flow: a platform-issued{' '}
				<strong>Workload Identity Token (WIT)</strong> exchanged for a scoped access token via{' '}
				<a
					href="https://datatracker.ietf.org/doc/draft-ietf-wimse-arch/"
					target="_blank"
					rel="noopener noreferrer"
				>
					draft-ietf-wimse-arch
				</a>{' '}
				and{' '}
				<a href="https://www.rfc-editor.org/rfc/rfc8693" target="_blank" rel="noopener noreferrer">
					RFC 8693 Token Exchange
				</a>
				. No PingOne required — all signing is local to this server.
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

			{/* Step 0 — Configure */}
			{step === 0 && (
				<>
					<CalloutBox>
						<strong>What is WIMSE?</strong> Instead of pre-registering a <code>client_id</code>/
						<code>client_secret</code>, a workload proves its identity using a short-lived JWT
						issued by the <em>platform it runs on</em> (AWS, GCP, Kubernetes, SPIFFE). This token is
						exchanged for a scoped access token via RFC 8693 — no long-lived secrets, no
						pre-registration.
					</CalloutBox>
					<Card>
						<CardTitle>Workload Configuration</CardTitle>
						<Label>Workload ID (SPIFFE URI or service name)</Label>
						<Input
							value={workloadId}
							onChange={(e) => setWorkloadId(e.target.value)}
							placeholder="spiffe://trust-domain/service-name"
						/>
						<Label>Target Audience (service being called)</Label>
						<Input
							value={audience}
							onChange={(e) => setAudience(e.target.value)}
							placeholder="https://api.example.com/service"
						/>
						<Label>Platform / Attestation Type</Label>
						<Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
							{PLATFORMS.map((p) => (
								<option key={p} value={p}>
									{PLATFORM_LABELS[p]}
								</option>
							))}
						</Select>
						<Label>Scopes to request after exchange</Label>
						<Input
							value={scope}
							onChange={(e) => setScope(e.target.value)}
							placeholder="read:resource write:resource"
						/>
					</Card>
					<Btn onClick={() => setStep(1)}>Next: Issue WIT →</Btn>
				</>
			)}

			{/* Step 1 — Issue WIT */}
			{step === 1 && (
				<>
					<CalloutBox>
						<strong>Step 1:</strong> The platform signs a <strong>Workload Identity Token</strong>{' '}
						(WIT) binding this workload to its identity. It includes WIMSE-specific claims:{' '}
						<code>wid</code> (workload ID), <code>platform</code>, and{' '}
						<code>platform_attestation</code>. The token is short-lived (5 min) — no long-lived
						secrets.
					</CalloutBox>
					<Card>
						<CardTitle>Request — POST /api/wimse/issue-wit</CardTitle>
						<Pre>
							{JSON.stringify({ workloadId, audience, platform, ttlSeconds: 300 }, null, 2)}
						</Pre>
					</Card>
					<Btn onClick={issueWit} disabled={loading}>
						{loading ? 'Issuing WIT…' : 'Issue Workload Identity Token'}
					</Btn>
					<Btn $variant="ghost" onClick={() => setStep(0)}>
						← Back
					</Btn>
				</>
			)}

			{/* Step 2 — Show WIT + trigger exchange */}
			{step === 2 && witResult && (
				<>
					<CalloutBox $color="amber">
						<strong>WIT issued.</strong> The token below is signed with an EC P-256 key local to
						this demo server. In production this would be signed by your platform (AWS STS, GCP
						Metadata Service, SPIRE). Notice the <WimseBadge>WIMSE</WimseBadge> claims.
					</CalloutBox>
					<Card>
						<CardTitle>Workload Identity Token (WIT)</CardTitle>
						<Pre style={{ fontSize: '0.68rem' }}>{witResult.wit}</Pre>
						<CardTitle style={{ marginTop: '1rem' }}>Decoded Header</CardTitle>
						<ClaimsDisplay payload={witResult.header} />
						<CardTitle style={{ marginTop: '1rem' }}>Decoded Payload</CardTitle>
						<ClaimsDisplay payload={witResult.payload} />
					</Card>
					<Card>
						<CardTitle>Token Exchange Request (RFC 8693)</CardTitle>
						<ApiBox>POST /api/wimse/token-exchange</ApiBox>
						<Pre>
							{JSON.stringify(
								{
									subject_token: `${witResult.wit.slice(0, 40)}…`,
									subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
									requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
									audience,
									scope,
								},
								null,
								2
							)}
						</Pre>
					</Card>
					<Btn onClick={doExchange} disabled={loading}>
						{loading ? 'Exchanging…' : 'Execute Token Exchange →'}
					</Btn>
					<Btn $variant="ghost" onClick={() => setStep(1)}>
						← Back
					</Btn>
				</>
			)}

			{/* Step 3 — Results + comparison */}
			{step === 3 && exchangeResult && witResult && (
				<>
					<CalloutBox>
						<strong>Exchange complete.</strong> The WIT was verified (signature + expiry) and a
						scoped access token was issued. The <code>act</code> claim records the originating
						workload. The audience is narrowed to the specific target service.
					</CalloutBox>
					<Card>
						<CardTitle>Issued Access Token</CardTitle>
						<ApiBox>
							✓ {exchangeResult.token_type} · {exchangeResult.expires_in}s · scope:{' '}
							{exchangeResult.scope}
						</ApiBox>
						<Pre style={{ fontSize: '0.68rem' }}>{exchangeResult.access_token}</Pre>
						<CardTitle style={{ marginTop: '1rem' }}>Access Token Claims</CardTitle>
						<ClaimsDisplay payload={exchangeResult.atPayload} />
					</Card>
					<Card>
						<CardTitle>WIT → Access Token: What Changed</CardTitle>
						<Table>
							<thead>
								<tr>
									<th>Claim</th>
									<th>WIT (input)</th>
									<th>Access Token (output)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>typ</td>
									<td>JWT</td>
									<td>at+JWT</td>
								</tr>
								<tr>
									<td>exp</td>
									<td>+5 min (attestation TTL)</td>
									<td>+60 min (API access TTL)</td>
								</tr>
								<tr>
									<td>scope</td>
									<td>— (not present)</td>
									<td>{exchangeResult.scope}</td>
								</tr>
								<tr>
									<td>act</td>
									<td>— (not present)</td>
									<td>Records originating WIT subject</td>
								</tr>
								<tr>
									<td>wid / platform</td>
									<td>✓ present (WIMSE claims)</td>
									<td>Removed — not in access token</td>
								</tr>
							</tbody>
						</Table>
					</Card>
					<Card>
						<CardTitle>WIMSE vs DCR</CardTitle>
						<Table>
							<thead>
								<tr>
									<th></th>
									<th>DCR (RFC 7591)</th>
									<th>WIMSE</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Pre-registration</td>
									<td>
										Required — get <code>client_id</code>
									</td>
									<td>None — identity attested by platform</td>
								</tr>
								<tr>
									<td>Credential</td>
									<td>
										Long-lived <code>client_secret</code>
									</td>
									<td>Short-lived WIT (5 min)</td>
								</tr>
								<tr>
									<td>Portable?</td>
									<td>Yes — works from anywhere</td>
									<td>No — bound to platform attestation</td>
								</tr>
								<tr>
									<td>Rotation</td>
									<td>Manual (or DCM RFC 7592)</td>
									<td>Automatic — WITs regenerated each call</td>
								</tr>
								<tr>
									<td>Trust anchor</td>
									<td>AS trusts registered client</td>
									<td>AS trusts platform issuer</td>
								</tr>
							</tbody>
						</Table>
					</Card>
					<Card>
						<CardTitle>IETF Spec References</CardTitle>
						<ul style={{ paddingLeft: '1.25rem', lineHeight: 2, fontSize: '0.85rem' }}>
							<li>
								<a
									href="https://datatracker.ietf.org/doc/draft-ietf-wimse-arch/"
									target="_blank"
									rel="noopener noreferrer"
								>
									draft-ietf-wimse-arch
								</a>{' '}
								— WIMSE Architecture
							</li>
							<li>
								<a
									href="https://datatracker.ietf.org/doc/draft-ietf-wimse-workload-identity-token/"
									target="_blank"
									rel="noopener noreferrer"
								>
									draft-ietf-wimse-workload-identity-token
								</a>{' '}
								— WIT Format &amp; Claims
							</li>
							<li>
								<a
									href="https://datatracker.ietf.org/doc/draft-ietf-wimse-s2s-protocol/"
									target="_blank"
									rel="noopener noreferrer"
								>
									draft-ietf-wimse-s2s-protocol
								</a>{' '}
								— Service-to-Service Protocol
							</li>
							<li>
								<a
									href="https://www.rfc-editor.org/rfc/rfc8693"
									target="_blank"
									rel="noopener noreferrer"
								>
									RFC 8693
								</a>{' '}
								— OAuth 2.0 Token Exchange
							</li>
						</ul>
					</Card>
					<Btn onClick={reset}>↺ Run Again</Btn>
				</>
			)}
		</Page>
	);
};

export default WIMSEFlow;
