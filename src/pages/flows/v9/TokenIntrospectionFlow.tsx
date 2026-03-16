// src/pages/flows/v9/TokenIntrospectionFlow.tsx
// Token Introspection — RFC 7662 + Token Revocation RFC 7009
// https://www.rfc-editor.org/rfc/rfc7662

import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';

type Tab = 'issue' | 'introspect' | 'revoke';

interface IssuedToken {
	access_token: string;
	expires_in: number;
	metadata: Record<string, unknown>;
}

interface IntrospectResult {
	active: boolean;
	[key: string]: unknown;
}

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
`;
const TabBar = styled.div`
	display: flex;
	gap: 0;
	border-bottom: 2px solid #e5e7eb;
	margin-bottom: 1.5rem;
`;
const TabBtn = styled.button<{
	$active: boolean;
}>`
	padding: 0.6rem 1.25rem;
	border: none;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	background: transparent;
	color: ${({ $active }) => ($active ? '#1d4ed8' : '#6b7280')};
	border-bottom: ${({ $active }) => ($active ? '2px solid #1d4ed8' : '2px solid transparent')};
	margin-bottom: -2px;
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
const Btn = styled.button<{
	$variant?: 'primary' | 'ghost' | 'red';
}>`
	padding: 0.6rem 1.25rem;
	border-radius: 0.4rem;
	font-size: 0.875rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	background: ${({ $variant }) =>
		$variant === 'ghost' ? '#f3f4f6' : $variant === 'red' ? '#dc2626' : '#1d4ed8'};
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
const SuccessBox = styled.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.5rem;
	padding: 0.75rem 1rem;
	font-size: 0.85rem;
	color: #15803d;
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
const ActiveBadge = styled.span<{
	$active: boolean;
}>`
	display: inline-block;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.8rem;
	font-weight: 700;
	background: ${({ $active }) => ($active ? '#dcfce7' : '#fee2e2')};
	color: ${({ $active }) => ($active ? '#15803d' : '#dc2626')};
`;
const TokenBox = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 0.75rem 1rem;
	font-family: monospace;
	font-size: 0.78rem;
	word-break: break-all;
	margin-bottom: 1rem;
	color: #0f172a;
	cursor: pointer;
	transition: background 0.15s;
	&:hover {
		background: #eff6ff;
	}
`;

// ─── Issue Token Tab ──────────────────────────────────────────────────────────

function IssueTokenTab({ onIssued }: { onIssued: (tok: IssuedToken) => void }) {
	const [subject, setSubject] = useState('alice@demo.example.com');
	const [clientId, setClientId] = useState('resource-server-client');
	const [scope, setScope] = useState('read write');
	const [audience, setAudience] = useState('https://api.example.com');
	const [result, setResult] = useState<IssuedToken | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const issue = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/introspection/issue', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subject, clientId, scope, audience }),
			});
			const data = (await res.json()) as IssuedToken & { success?: boolean; error?: string };
			if (!res.ok || !data.success) throw new Error(data.error ?? 'Issue failed');
			setResult(data);
			onIssued(data);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [subject, clientId, scope, audience, onIssued]);

	return (
		<>
			{error && <ErrorBox>⚠️ {error}</ErrorBox>}
			<CalloutBox>
				<strong>Opaque vs JWT tokens:</strong> JWTs are self-contained — resource servers validate
				them locally.
				<strong> Opaque tokens</strong> are random strings; resource servers must call the AS
				introspection endpoint to validate them and get metadata. This adds a network round-trip but
				gives the AS full control over revocation.
			</CalloutBox>
			<Card>
				<CardTitle>Issue an Opaque (Reference) Token</CardTitle>
				<Label>Subject</Label>
				<Input value={subject} onChange={(e) => setSubject(e.target.value)} />
				<Label>Client ID</Label>
				<Input value={clientId} onChange={(e) => setClientId(e.target.value)} />
				<Label>Scope</Label>
				<Input value={scope} onChange={(e) => setScope(e.target.value)} />
				<Label>Audience</Label>
				<Input value={audience} onChange={(e) => setAudience(e.target.value)} />
			</Card>
			<Btn onClick={issue} disabled={loading}>
				{loading ? 'Issuing…' : 'Issue Opaque Token'}
			</Btn>
			{result && (
				<>
					<SuccessBox>✓ Token issued. Copy it to the Introspect or Revoke tabs.</SuccessBox>
					<Card>
						<CardTitle>Opaque Token (random reference string)</CardTitle>
						<TokenBox
							title="Click to copy"
							onClick={() => navigator.clipboard?.writeText(result.access_token)}
						>
							{result.access_token}{' '}
							<span style={{ color: '#94a3b8', fontSize: '.7rem' }}>(click to copy)</span>
						</TokenBox>
						<CardTitle style={{ marginTop: '1rem' }}>Stored Metadata (AS-side only)</CardTitle>
						<Pre>{JSON.stringify(result.metadata, null, 2)}</Pre>
					</Card>
				</>
			)}
		</>
	);
}

// ─── Introspect Tab ───────────────────────────────────────────────────────────

function IntrospectTab({ lastToken }: { lastToken: string }) {
	const [token, setToken] = useState(lastToken);
	const [rsIdentity, setRsIdentity] = useState('inventory-service');
	const [hint, setHint] = useState('access_token');
	const [result, setResult] = useState<IntrospectResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const introspect = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/introspection/introspect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-rs-identity': rsIdentity },
				body: JSON.stringify({ token, token_type_hint: hint }),
			});
			const data = (await res.json()) as IntrospectResult & { error?: string };
			if (!res.ok && data.error && data.error !== 'inactive') throw new Error(data.error);
			setResult(data);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [token, rsIdentity, hint]);

	return (
		<>
			{error && <ErrorBox>⚠️ {error}</ErrorBox>}
			<CalloutBox>
				<strong>RFC 7662 §2.1 — Introspection endpoint.</strong> The resource server sends the token
				to the AS. The AS responds with <code>{`{ active: true, sub, scope, exp, ... }`}</code> or{' '}
				<code>{`{ active: false }`}</code>. The RS must authenticate itself so the AS knows who is
				asking.
			</CalloutBox>
			<Card>
				<CardTitle>POST /api/introspection/introspect</CardTitle>
				<Label>Token to introspect</Label>
				<Input
					value={token}
					onChange={(e) => setToken(e.target.value)}
					placeholder="Paste opaque token from Issue tab"
				/>
				<Label>Resource Server Identity (x-rs-identity header)</Label>
				<Input
					value={rsIdentity}
					onChange={(e) => setRsIdentity(e.target.value)}
					placeholder="my-resource-server"
				/>
				<Label>Token Type Hint</Label>
				<Input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="access_token" />
			</Card>
			<Btn onClick={introspect} disabled={loading || !token}>
				{loading ? 'Introspecting…' : 'Introspect Token'}
			</Btn>
			{result && (
				<Card style={{ marginTop: '1rem' }}>
					<CardTitle>
						Introspection Response{' '}
						<ActiveBadge $active={result.active}>
							{result.active ? 'ACTIVE' : 'INACTIVE'}
						</ActiveBadge>
					</CardTitle>
					<Pre>{JSON.stringify(result, null, 2)}</Pre>
				</Card>
			)}
		</>
	);
}

// ─── Revoke Tab ───────────────────────────────────────────────────────────────

function RevokeTab({ lastToken }: { lastToken: string }) {
	const [token, setToken] = useState(lastToken);
	const [revoked, setRevoked] = useState(false);
	const [introspectAfter, setIntrospectAfter] = useState<IntrospectResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const revoke = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/introspection/revoke', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token }),
			});
			if (!res.ok) throw new Error('Revocation failed');
			setRevoked(true);
			// Immediately introspect to show active:false
			const r2 = await fetch('/api/introspection/introspect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-rs-identity': 'demo-rs' },
				body: JSON.stringify({ token }),
			});
			setIntrospectAfter((await r2.json()) as IntrospectResult);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [token]);

	return (
		<>
			{error && <ErrorBox>⚠️ {error}</ErrorBox>}
			<CalloutBox $color="amber">
				<strong>RFC 7009 — Token Revocation.</strong> The client or RS POSTs the token to the
				revocation endpoint. The AS marks it inactive. RFC 7009 §2.2 mandates <code>200 OK</code>{' '}
				regardless of whether the token existed — to avoid token enumeration. After revocation,
				introspection returns <code>{`{ active: false }`}</code>.
			</CalloutBox>
			<Card>
				<CardTitle>POST /api/introspection/revoke</CardTitle>
				<Label>Token to revoke</Label>
				<Input
					value={token}
					onChange={(e) => {
						setToken(e.target.value);
						setRevoked(false);
						setIntrospectAfter(null);
					}}
					placeholder="Paste token from Issue tab"
				/>
			</Card>
			<Btn $variant="red" onClick={revoke} disabled={loading || !token || revoked}>
				{revoked ? '✓ Revoked' : loading ? 'Revoking…' : 'Revoke Token'}
			</Btn>
			{revoked && introspectAfter && (
				<>
					<SuccessBox>
						✓ Token revoked. Introspection immediately returns <code>active: false</code>.
					</SuccessBox>
					<Card>
						<CardTitle>
							Introspection After Revocation{' '}
							<ActiveBadge $active={introspectAfter.active}>
								{introspectAfter.active ? 'ACTIVE' : 'INACTIVE'}
							</ActiveBadge>
						</CardTitle>
						<Pre>{JSON.stringify(introspectAfter, null, 2)}</Pre>
					</Card>
				</>
			)}
		</>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

const TokenIntrospectionFlow: React.FC = () => {
	const [activeTab, setActiveTab] = useState<Tab>('issue');
	const [lastToken, setLastToken] = useState('');

	return (
		<Page>
			<PageTitle>
				Token Introspection<RfcBadge>RFC 7662</RfcBadge>
				<RfcBadge>RFC 7009</RfcBadge>
			</PageTitle>
			<PageSubtitle>
				<a href="https://www.rfc-editor.org/rfc/rfc7662" target="_blank" rel="noopener noreferrer">
					RFC 7662
				</a>{' '}
				— resource servers query the AS to validate opaque tokens.{' '}
				<a href="https://www.rfc-editor.org/rfc/rfc7009" target="_blank" rel="noopener noreferrer">
					RFC 7009
				</a>{' '}
				— clients/RSes revoke tokens, immediately reflected in introspection responses. Issue an
				opaque token, then introspect it from the "resource server" perspective or revoke it.
			</PageSubtitle>

			<TabBar>
				<TabBtn $active={activeTab === 'issue'} onClick={() => setActiveTab('issue')}>
					1. Issue Token (AS)
				</TabBtn>
				<TabBtn $active={activeTab === 'introspect'} onClick={() => setActiveTab('introspect')}>
					2. Introspect (RS → AS)
				</TabBtn>
				<TabBtn $active={activeTab === 'revoke'} onClick={() => setActiveTab('revoke')}>
					3. Revoke (RFC 7009)
				</TabBtn>
			</TabBar>

			{activeTab === 'issue' && (
				<IssueTokenTab onIssued={(tok) => setLastToken(tok.access_token)} />
			)}
			{activeTab === 'introspect' && <IntrospectTab lastToken={lastToken} />}
			{activeTab === 'revoke' && <RevokeTab lastToken={lastToken} />}

			<Card style={{ marginTop: '2rem' }}>
				<CardTitle>Opaque Token vs JWT — When to Use Each</CardTitle>
				<Table>
					<thead>
						<tr>
							<th></th>
							<th>Opaque Token</th>
							<th>JWT (Self-Contained)</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Validation</td>
							<td>Introspection call to AS</td>
							<td>Local signature verification</td>
						</tr>
						<tr>
							<td>Revocation</td>
							<td>Immediate — AS marks inactive</td>
							<td>Can't revoke without blocklist or short TTL</td>
						</tr>
						<tr>
							<td>Token size</td>
							<td>Small (random string)</td>
							<td>Large (base64 JSON)</td>
						</tr>
						<tr>
							<td>Network cost</td>
							<td>Round-trip per request</td>
							<td>None (local)</td>
						</tr>
						<tr>
							<td>Metadata hiding</td>
							<td>Leaks nothing to client/RS</td>
							<td>RS can read all claims</td>
						</tr>
						<tr>
							<td>Best for</td>
							<td>High-security, short-lived, revocable</td>
							<td>Stateless, high-scale, distributed RS</td>
						</tr>
					</tbody>
				</Table>
			</Card>
		</Page>
	);
};

export default TokenIntrospectionFlow;
