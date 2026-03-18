// src/pages/flows/v9/GnapFlow.tsx
// GNAP — Grant Negotiation and Authorization Protocol (RFC 9635)
// https://www.rfc-editor.org/rfc/rfc9635

import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3;

interface GrantResponse {
	interact?: { redirect: string; finish: Record<string, unknown> };
	continue: { access_token: { value: string }; uri: string; wait: number };
	instance_id: string;
}

interface TokenResponse {
	access_token?: Record<string, unknown>;
	multiple_access_tokens?: Record<string, Record<string, unknown>>;
	subject?: Record<string, unknown>;
	instance_id: string;
}

interface ResourceRequest {
	type: string;
	actions: string[];
	locations?: string[];
}

// ─── Styled components (shared pattern) ──────────────────────────────────────

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
	background: #dbeafe;
	color: #1d4ed8;
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
const StepTab = styled.button<{
	$active: boolean;
	$done: boolean;
}>`
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
const Toggle = styled.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.85rem;
	color: #374151;
	margin-bottom: 1rem;
	cursor: pointer;
	input {
		width: auto;
	}
`;
const Btn = styled.button<{
	$variant?: 'primary' | 'ghost' | 'green';
}>`
	padding: 0.6rem 1.25rem;
	border-radius: 0.4rem;
	font-size: 0.875rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	background: ${({ $variant }) =>
		$variant === 'ghost' ? '#f3f4f6' : $variant === 'green' ? '#16a34a' : '#1d4ed8'};
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
const ErrorBox = styled.div`
	background: #fef2f2;
	border: 1px solid #fca5a5;
	border-radius: 0.5rem;
	padding: 0.75rem 1rem;
	font-size: 0.85rem;
	color: #dc2626;
	margin-bottom: 1rem;
`;
const CalloutBox = styled.div<{
	$color?: 'blue' | 'amber' | 'green';
}>`
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
const StatusPill = styled.span<{
	$status: string;
}>`
	display: inline-block;
	padding: 0.2rem 0.6rem;
	border-radius: 9999px;
	font-size: 0.72rem;
	font-weight: 700;
	background: ${({ $status }) =>
		$status === 'approved' ? '#dcfce7' : $status === 'pending' ? '#fef3c7' : '#f3f4f6'};
	color: ${({ $status }) =>
		$status === 'approved' ? '#15803d' : $status === 'pending' ? '#92400e' : '#374151'};
`;

// ─── Component ────────────────────────────────────────────────────────────────

const GnapFlow: React.FC = () => {
	const [step, setStep] = useState<Step>(0);

	// Config
	const [clientName, setClientName] = useState('Demo GNAP Client');
	const [resourceType, setResourceType] = useState('banking-api');
	const [actions, setActions] = useState('read balance transfer');
	const [locations, setLocations] = useState('https://bank.example.com/accounts');
	const [requestSubject, setRequestSubject] = useState(true);
	const [requestInteract, setRequestInteract] = useState(true);

	// Runtime
	const [grantResp, setGrantResp] = useState<GrantResponse | null>(null);
	const [txStatus, setTxStatus] = useState<string>('pending');
	const [tokenResp, setTokenResp] = useState<TokenResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const resourceAccess = useMemo<ResourceRequest>(
		() => ({
			type: resourceType,
			actions: actions.split(/\s+/).filter(Boolean),
			...(locations ? { locations: [locations] } : {}),
		}),
		[resourceType, actions, locations]
	);

	const grantRequest = {
		access_token: { access: [resourceAccess] },
		...(requestSubject && {
			subject: { sub_id_formats: ['email'], assertion_formats: ['id_token'] },
		}),
		client: { display: { name: clientName, uri: 'https://client.example.com' } },
		...(requestInteract && {
			interact: {
				start: ['redirect'],
				finish: {
					method: 'redirect',
					uri: 'https://client.example.com/callback',
					nonce: 'demo-nonce-12345',
				},
			},
		}),
	};

	// Step 1: POST grant request
	const sendGrantRequest = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/gnap/grant', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					access: [resourceAccess],
					subject: requestSubject ? { sub_id_formats: ['email'] } : undefined,
					interact: requestInteract
						? {
								start: ['redirect'],
								finish: {
									method: 'redirect',
									uri: 'https://client.example.com/callback',
									nonce: 'demo-nonce-12345',
								},
							}
						: undefined,
					client: { display: { name: clientName } },
				}),
			});
			const data = (await res.json()) as GrantResponse & { error?: string };
			if (!res.ok || data.error)
				throw new Error((data as { error?: string }).error ?? 'Grant request failed');
			setGrantResp(data);
			setTxStatus('pending');
			setStep(2);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [clientName, resourceAccess, requestSubject, requestInteract]);

	// Simulate user approval
	const approveGrant = useCallback(async () => {
		if (!grantResp?.interact?.redirect) return;
		setLoading(true);
		try {
			const interactRef = grantResp.interact.redirect.split('/').pop();
			const res = await fetch(`/api/gnap/interact/${interactRef}/approve`, { method: 'POST' });
			const data = (await res.json()) as { status: string };
			setTxStatus(data.status);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [grantResp]);

	// Step 3: Continuation request
	const continueGrant = useCallback(async () => {
		if (!grantResp) return;
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/gnap/continue/${grantResp.instance_id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `GNAP ${grantResp.continue.access_token.value}`,
				},
				body: JSON.stringify({}),
			});
			const data = (await res.json()) as TokenResponse & { status?: string; error?: string };
			if (!res.ok || data.error) throw new Error(data.error ?? 'Continuation failed');
			if (data.status === 'pending') {
				setError('Grant not yet approved — click "Simulate User Approval" first');
				return;
			}
			setTokenResp(data);
			setStep(3);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [grantResp]);

	const reset = () => {
		setStep(0);
		setGrantResp(null);
		setTokenResp(null);
		setTxStatus('pending');
		setError(null);
	};

	const STEPS = ['1. Configure', '2. Grant Request', '3. Interact + Continue', '4. Tokens'];

	return (
		<Page>
			<V9FlowHeader flowId="gnap" />
			<PageTitle>
				GNAP — Grant Negotiation and Authorization Protocol<RfcBadge>RFC 9635</RfcBadge>
			</PageTitle>
			<PageSubtitle>
				Demonstrates{' '}
				<a href="https://www.rfc-editor.org/rfc/rfc9635" target="_blank" rel="noopener noreferrer">
					RFC 9635
				</a>{' '}
				— the proposed successor to OAuth 2.0. GNAP replaces redirect-based flows with a{' '}
				<strong>JSON negotiation protocol</strong>: clients POST rich grant requests, AS issues a
				pending grant + interaction URI, then the client continues after user consent to receive
				access tokens and subject claims.
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

			{step === 0 && (
				<>
					<CalloutBox>
						<strong>GNAP vs OAuth 2.0:</strong> In OAuth, clients redirect users to an authorization
						endpoint with query parameters. In GNAP, clients POST a rich JSON <em>grant request</em>{' '}
						describing exactly what access they need — resources, subjects, interaction modes — and
						the AS negotiates the grant. No pre-registered redirect URIs, no implicit grant, no
						fragile query string encoding.
					</CalloutBox>
					<Card>
						<CardTitle>Client + Resource Configuration</CardTitle>
						<Label>Client Display Name</Label>
						<Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
						<Label>Resource Type (access token label)</Label>
						<Input
							value={resourceType}
							onChange={(e) => setResourceType(e.target.value)}
							placeholder="banking-api"
						/>
						<Label>Actions (space-separated)</Label>
						<Input
							value={actions}
							onChange={(e) => setActions(e.target.value)}
							placeholder="read balance transfer"
						/>
						<Label>Resource Location URI</Label>
						<Input
							value={locations}
							onChange={(e) => setLocations(e.target.value)}
							placeholder="https://api.example.com/resource"
						/>
						<Toggle>
							<input
								type="checkbox"
								checked={requestSubject}
								onChange={(e) => setRequestSubject(e.target.checked)}
							/>{' '}
							Request subject info (id_token assertion)
						</Toggle>
						<Toggle>
							<input
								type="checkbox"
								checked={requestInteract}
								onChange={(e) => setRequestInteract(e.target.checked)}
							/>{' '}
							Request interaction (redirect)
						</Toggle>
					</Card>
					<Btn onClick={() => setStep(1)}>Next: Review Grant Request →</Btn>
				</>
			)}

			{step === 1 && (
				<>
					<CalloutBox $color="amber">
						<strong>Step 1 — POST /api/gnap/grant</strong>
						<br />
						This is the entire grant request as a single JSON body. Compare to OAuth's authorization
						request: no redirect URL construction, no implicit grant assumptions — just a
						declarative description of what the client needs.
					</CalloutBox>
					<Card>
						<CardTitle>Grant Request Body</CardTitle>
						<Pre>{JSON.stringify(grantRequest, null, 2)}</Pre>
					</Card>
					<Btn onClick={sendGrantRequest} disabled={loading}>
						{loading ? 'Sending…' : 'POST Grant Request →'}
					</Btn>
					<Btn $variant="ghost" onClick={() => setStep(0)}>
						← Back
					</Btn>
				</>
			)}

			{step === 2 && grantResp && (
				<>
					<CalloutBox $color="amber">
						<strong>Grant pending.</strong> The AS returned an <em>interaction URI</em> for user
						consent and a <em>continuation handle</em>. The client holds the continuation token and
						waits. Simulate the user approving the grant, then send the continuation request.
					</CalloutBox>
					<Card>
						<CardTitle>AS Grant Response</CardTitle>
						<Pre>{JSON.stringify(grantResp, null, 2)}</Pre>
					</Card>
					<Card>
						<CardTitle>
							Grant Status: <StatusPill $status={txStatus}>{txStatus.toUpperCase()}</StatusPill>
						</CardTitle>
						{requestInteract && (
							<>
								<p style={{ fontSize: '.85rem', color: '#6b7280', marginTop: 0 }}>
									Interaction URI: <code>{grantResp.interact?.redirect}</code>
								</p>
								<Btn
									$variant="green"
									onClick={approveGrant}
									disabled={loading || txStatus === 'approved'}
								>
									{txStatus === 'approved' ? '✓ Approved' : '▶ Simulate User Approval'}
								</Btn>
							</>
						)}
						{!requestInteract && (
							<p style={{ fontSize: '.85rem', color: '#6b7280' }}>
								No interaction requested — grant auto-approvable.
							</p>
						)}
					</Card>
					<Card>
						<CardTitle>Continuation Request</CardTitle>
						<Pre>
							{JSON.stringify(
								{
									method: 'POST',
									uri: grantResp.continue.uri,
									headers: { Authorization: `GNAP ${grantResp.continue.access_token.value}` },
								},
								null,
								2
							)}
						</Pre>
					</Card>
					<Btn onClick={continueGrant} disabled={loading}>
						{loading ? 'Sending continuation…' : 'Send Continuation Request →'}
					</Btn>
					<Btn $variant="ghost" onClick={() => setStep(1)}>
						← Back
					</Btn>
				</>
			)}

			{step === 3 && tokenResp && (
				<>
					<CalloutBox $color="green">
						<strong>Access tokens issued.</strong> GNAP returns structured token objects — not just
						raw strings. Each token includes its <code>access</code> description, a{' '}
						<code>manage</code> URI for rotation, and optionally subject identity assertions.
					</CalloutBox>
					<Card>
						<CardTitle>Token Response</CardTitle>
						<Pre>{JSON.stringify(tokenResp, null, 2)}</Pre>
					</Card>
					{tokenResp.subject && (
						<Card>
							<CardTitle>Subject Claims</CardTitle>
							<Pre>{JSON.stringify(tokenResp.subject, null, 2)}</Pre>
						</Card>
					)}
					<Card>
						<CardTitle>GNAP vs OAuth 2.0 — Key Differences</CardTitle>
						<Table>
							<thead>
								<tr>
									<th></th>
									<th>OAuth 2.0</th>
									<th>GNAP (RFC 9635)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Grant initiation</td>
									<td>Redirect (query params)</td>
									<td>POST JSON grant request</td>
								</tr>
								<tr>
									<td>Client registration</td>
									<td>Pre-registered client_id</td>
									<td>Dynamic — key/display in request</td>
								</tr>
								<tr>
									<td>Interaction modes</td>
									<td>Fixed: redirect / device</td>
									<td>Negotiable: redirect, push, user-code, …</td>
								</tr>
								<tr>
									<td>Token format</td>
									<td>Raw string</td>
									<td>Structured object with access description + manage URI</td>
								</tr>
								<tr>
									<td>Subject info</td>
									<td>Separate OIDC id_token</td>
									<td>First-class in grant response (subject assertions)</td>
								</tr>
								<tr>
									<td>Token rotation</td>
									<td>Refresh token (separate request)</td>
									<td>manage URI (PATCH the token directly)</td>
								</tr>
								<tr>
									<td>Multiple tokens</td>
									<td>One token per flow</td>
									<td>multiple_access_tokens in one response</td>
								</tr>
							</tbody>
						</Table>
					</Card>
					<Card>
						<CardTitle>Spec References</CardTitle>
						<ul style={{ paddingLeft: '1.25rem', lineHeight: 2, fontSize: '.85rem' }}>
							<li>
								<a
									href="https://www.rfc-editor.org/rfc/rfc9635"
									target="_blank"
									rel="noopener noreferrer"
								>
									RFC 9635
								</a>{' '}
								— GNAP Core
							</li>
							<li>
								<a
									href="https://www.rfc-editor.org/rfc/rfc9636"
									target="_blank"
									rel="noopener noreferrer"
								>
									RFC 9636
								</a>{' '}
								— GNAP Resource Servers
							</li>
							<li>
								<a
									href="https://datatracker.ietf.org/doc/draft-ietf-gnap-resource-servers/"
									target="_blank"
									rel="noopener noreferrer"
								>
									draft-ietf-gnap-resource-servers
								</a>{' '}
								— RS interactions
							</li>
						</ul>
					</Card>
					<Btn onClick={reset}>↺ Run Again</Btn>
				</>
			)}
		</Page>
	);
};

export default GnapFlow;
