// src/pages/flows/v9/JarJarmFlow.tsx
// JAR + JARM — JWT-Secured Authorization Requests and Responses
// JAR: RFC 9101  |  JARM: draft-ietf-oauth-jarm

import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';

type Tab = 'jar' | 'jarm';
type Step = 0 | 1 | 2;

interface JarResult {
	requestJwt: string;
	requestObject: Record<string, unknown>;
	authzUrl: string;
	clientJwksUri: string;
}

interface JarmResult {
	jarmJwt: string;
	jarmPayload: Record<string, unknown>;
	redirectUrl: string | null;
	responseMode: string;
	authCode: string;
}

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
`;
const TabBar = styled.div`
	display: flex;
	gap: 0;
	border-bottom: 2px solid #e5e7eb;
	margin-bottom: 1.5rem;
`;
const Tab = styled.button<{
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
const Select = styled.select`
	width: 100%;
	padding: 0.5rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.4rem;
	font-size: 0.9rem;
	margin-bottom: 1rem;
	background: #fff;
`;
const Btn = styled.button<{
	$variant?: 'primary' | 'ghost';
}>`
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
	min-width: 160px;
	flex-shrink: 0;
`;
const ClaimVal = styled.span`
	color: #065f46;
	word-break: break-all;
`;
const SecurityBadge = styled.span`
	background: #fef3c720;
	color: #92400e;
	border: 1px solid #fcd34d;
	font-size: 0.65rem;
	font-weight: 700;
	padding: 0.1rem 0.4rem;
	border-radius: 9999px;
	margin-left: 0.4rem;
	vertical-align: middle;
`;

const JAR_CLAIMS = new Set(['iss', 'aud', 'exp', 'jti', 'nbf']);
const JARM_CLAIMS = new Set(['iss', 'aud', 'exp', 'code', 'state']);

function ClaimsDisplay({
	payload,
	highlight,
}: {
	payload: Record<string, unknown>;
	highlight: Set<string>;
}) {
	return (
		<div>
			{Object.entries(payload).map(([k, v]) => (
				<ClaimRow key={k}>
					<ClaimKey>
						{k}
						{highlight.has(k) && <SecurityBadge>SECURITY</SecurityBadge>}
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

// ─── JAR Tab ──────────────────────────────────────────────────────────────────

const JarTab: React.FC = () => {
	const [step, setStep] = useState<Step>(0);
	const [clientId, setClientId] = useState('fapi-client-001');
	const [scope, setScope] = useState('openid profile accounts:read');
	const [responseType, setResponseType] = useState('code');
	const [acrValues, setAcrValues] = useState('urn:mace:incommon:iap:silver');
	const [result, setResult] = useState<JarResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const sign = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/jar/sign-request', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clientId, scope, responseType, acrValues: acrValues || undefined }),
			});
			const data = (await res.json()) as JarResult & { success?: boolean; error?: string };
			if (!res.ok || !data.success) throw new Error(data.error ?? 'JAR signing failed');
			setResult(data);
			setStep(1);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [clientId, scope, responseType, acrValues]);

	return (
		<>
			{error && <ErrorBox>⚠️ {error}</ErrorBox>}
			<Stepper>
				{['1. Configure', '2. Signed Request Object'].map((l, i) => (
					<StepTab
						key={l}
						$active={step === i}
						$done={step > i}
						onClick={() => {
							if (i < step) setStep(i as Step);
						}}
					>
						{step > i ? '✓ ' : ''}
						{l}
					</StepTab>
				))}
			</Stepper>

			{step === 0 && (
				<>
					<CalloutBox>
						<strong>JAR (RFC 9101)</strong> packages the entire authorization request as a signed
						JWT — preventing parameter injection attacks, enabling request integrity verification,
						and allowing AS to reject unsigned requests. Required by FAPI 2.0.
					</CalloutBox>
					<Card>
						<CardTitle>Authorization Request Parameters</CardTitle>
						<Label>Client ID</Label>
						<Input value={clientId} onChange={(e) => setClientId(e.target.value)} />
						<Label>Response Type</Label>
						<Select value={responseType} onChange={(e) => setResponseType(e.target.value)}>
							<option value="code">code</option>
							<option value="code token">code token (hybrid)</option>
						</Select>
						<Label>Scope</Label>
						<Input value={scope} onChange={(e) => setScope(e.target.value)} />
						<Label>ACR Values (optional)</Label>
						<Input
							value={acrValues}
							onChange={(e) => setAcrValues(e.target.value)}
							placeholder="urn:mace:incommon:iap:silver"
						/>
					</Card>
					<Btn onClick={sign} disabled={loading}>
						{loading ? 'Signing…' : 'Sign Request Object →'}
					</Btn>
				</>
			)}

			{step === 1 && result && (
				<>
					<CalloutBox $color="green">
						<strong>Request object signed.</strong> The client sends this to the AS as{' '}
						<code>?request=&lt;jwt&gt;</code>. The AS fetches the client JWKS, verifies the
						signature, and processes the claims from inside the JWT — ignoring any unsigned query
						parameters (FAPI 2.0 §5.2.2).
					</CalloutBox>
					<Card>
						<CardTitle>Signed Request JWT (request=…)</CardTitle>
						<Pre style={{ fontSize: '.68rem' }}>{result.requestJwt}</Pre>
						<CardTitle style={{ marginTop: '1rem' }}>Decoded Payload</CardTitle>
						<ClaimsDisplay payload={result.requestObject} highlight={JAR_CLAIMS} />
					</Card>
					<Card>
						<CardTitle>Authorization URL</CardTitle>
						<Pre style={{ fontSize: '.72rem' }}>{result.authzUrl}</Pre>
						<p style={{ fontSize: '.82rem', color: '#6b7280', margin: 0 }}>
							Client JWKS URI: <code>{result.clientJwksUri}</code>
						</p>
					</Card>
					<Btn
						$variant="ghost"
						onClick={() => {
							setStep(0);
							setResult(null);
						}}
					>
						← Reset
					</Btn>
				</>
			)}
		</>
	);
};

// ─── JARM Tab ─────────────────────────────────────────────────────────────────

const JarmTab: React.FC = () => {
	const [step, setStep] = useState<Step>(0);
	const [clientId, setClientId] = useState('fapi-client-001');
	const [responseMode, setResponseMode] = useState('query.jwt');
	const [result, setResult] = useState<JarmResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const generate = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/jar/jarm-response', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clientId, responseMode }),
			});
			const data = (await res.json()) as JarmResult & { success?: boolean; error?: string };
			if (!res.ok || !data.success) throw new Error(data.error ?? 'JARM failed');
			setResult(data);
			setStep(1);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [clientId, responseMode]);

	return (
		<>
			{error && <ErrorBox>⚠️ {error}</ErrorBox>}
			<Stepper>
				{['1. Configure', '2. JARM Response'].map((l, i) => (
					<StepTab
						key={l}
						$active={step === i}
						$done={step > i}
						onClick={() => {
							if (i < step) setStep(i as Step);
						}}
					>
						{step > i ? '✓ ' : ''}
						{l}
					</StepTab>
				))}
			</Stepper>

			{step === 0 && (
				<>
					<CalloutBox>
						<strong>JARM</strong> wraps the authorization response (code, state) in a signed JWT —
						preventing state/code tampering in the redirect. The client verifies the JWT before
						using the auth code. Combined with JAR, this makes the entire request/response cycle
						integrity-protected.
					</CalloutBox>
					<Card>
						<CardTitle>Response Configuration</CardTitle>
						<Label>Client ID</Label>
						<Input value={clientId} onChange={(e) => setClientId(e.target.value)} />
						<Label>Response Mode</Label>
						<Select value={responseMode} onChange={(e) => setResponseMode(e.target.value)}>
							<option value="query.jwt">query.jwt</option>
							<option value="fragment.jwt">fragment.jwt</option>
							<option value="form_post.jwt">form_post.jwt</option>
						</Select>
					</Card>
					<Btn onClick={generate} disabled={loading}>
						{loading ? 'Generating…' : 'Generate JARM Response →'}
					</Btn>
				</>
			)}

			{step === 1 && result && (
				<>
					<CalloutBox $color="green">
						<strong>JARM response generated.</strong> The AS wraps <code>code</code> and{' '}
						<code>state</code>
						in a signed JWT. The client verifies the AS signature before extracting the auth code —
						preventing redirect interception and response parameter injection.
					</CalloutBox>
					<Card>
						<CardTitle>JARM JWT (response=…)</CardTitle>
						<Pre style={{ fontSize: '.68rem' }}>{result.jarmJwt}</Pre>
						<CardTitle style={{ marginTop: '1rem' }}>Decoded Payload</CardTitle>
						<ClaimsDisplay payload={result.jarmPayload} highlight={JARM_CLAIMS} />
					</Card>
					{result.redirectUrl && (
						<Card>
							<CardTitle>Redirect URL ({result.responseMode})</CardTitle>
							<Pre style={{ fontSize: '.72rem' }}>{result.redirectUrl}</Pre>
						</Card>
					)}
					<Btn
						$variant="ghost"
						onClick={() => {
							setStep(0);
							setResult(null);
						}}
					>
						← Reset
					</Btn>
				</>
			)}
		</>
	);
};

// ─── Main component ───────────────────────────────────────────────────────────

const JarJarmFlow: React.FC = () => {
	const [activeTab, setActiveTab] = useState<Tab>('jar');

	return (
		<Page>
			<V9FlowHeader flowId="jar-jarm" />
			<PageTitle>
				JAR + JARM<RfcBadge>RFC 9101</RfcBadge>
				<RfcBadge>FAPI 2.0</RfcBadge>
			</PageTitle>
			<PageSubtitle>
				<strong>JAR</strong> (
				<a href="https://www.rfc-editor.org/rfc/rfc9101" target="_blank" rel="noopener noreferrer">
					RFC 9101
				</a>
				) signs the authorization <em>request</em> as a JWT. <strong>JARM</strong> signs the
				authorization <em>response</em> as a JWT. Together they form the integrity backbone of{' '}
				<a
					href="https://openid.net/specs/openid-financial-api-part-2-1_0.html"
					target="_blank"
					rel="noopener noreferrer"
				>
					FAPI 2.0 Security Profile
				</a>{' '}
				— required for open banking, healthcare, and government APIs.
			</PageSubtitle>

			<TabBar>
				<Tab $active={activeTab === 'jar'} onClick={() => setActiveTab('jar')}>
					JAR — Signed Request Object
				</Tab>
				<Tab $active={activeTab === 'jarm'} onClick={() => setActiveTab('jarm')}>
					JARM — Signed Response
				</Tab>
			</TabBar>

			{activeTab === 'jar' && <JarTab />}
			{activeTab === 'jarm' && <JarmTab />}

			<Card style={{ marginTop: '2rem' }}>
				<CardTitle>JAR + JARM Together — FAPI 2.0 Flow</CardTitle>
				<Table>
					<thead>
						<tr>
							<th>Direction</th>
							<th>Without JAR/JARM</th>
							<th>With JAR + JARM</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Request</td>
							<td>Plain query parameters</td>
							<td>Signed JWT request object (JAR)</td>
						</tr>
						<tr>
							<td>Response</td>
							<td>Plain query/fragment params</td>
							<td>Signed JWT response (JARM)</td>
						</tr>
						<tr>
							<td>Parameter injection</td>
							<td>Possible — attacker modifies URL</td>
							<td>Prevented — signature covers all params</td>
						</tr>
						<tr>
							<td>Response tampering</td>
							<td>Possible — code/state in plain redirect</td>
							<td>Prevented — AS signature verified by client</td>
						</tr>
						<tr>
							<td>AS verification</td>
							<td>No request integrity check</td>
							<td>AS verifies client signature via JWKS URI</td>
						</tr>
					</tbody>
				</Table>
			</Card>
		</Page>
	);
};

export default JarJarmFlow;
