// src/pages/flows/v9/StepUpAuthFlow.tsx
// Step-Up Authentication — RFC 9470
// https://www.rfc-editor.org/rfc/rfc9470

import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';

type Step = 0 | 1 | 2 | 3;

interface TokenIssueResult {
	access_token: string;
	payload: Record<string, unknown>;
}

interface ResourceResult {
	granted?: boolean;
	resource_data?: Record<string, unknown>;
	token_acr?: string;
	auth_age_seconds?: number;
	error?: string;
	error_description?: string;
	required_acr?: string;
	max_age?: number;
	current_acr?: string;
	current_auth_age_seconds?: number;
}

const ACR_OPTIONS = [
	{ value: 'urn:mace:incommon:iap:bronze', label: 'Bronze — Password only' },
	{ value: 'urn:mace:incommon:iap:silver', label: 'Silver — Password + OTP' },
	{ value: 'urn:mace:incommon:iap:gold', label: 'Gold — MFA + hardware key' },
];

const REQUIRED_ACR_OPTIONS = [
	{ value: 'urn:mace:incommon:iap:silver', label: 'Silver (MFA)' },
	{ value: 'urn:mace:incommon:iap:gold', label: 'Gold (hardware key)' },
];

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
	$color?: 'blue' | 'amber' | 'green' | 'red';
}>`
	background: ${({ $color }) =>
		$color === 'amber'
			? '#fffbeb'
			: $color === 'green'
				? '#f0fdf4'
				: $color === 'red'
					? '#fef2f2'
					: '#eff6ff'};
	border-left: 4px solid
		${({ $color }) =>
			$color === 'amber'
				? '#f59e0b'
				: $color === 'green'
					? '#16a34a'
					: $color === 'red'
						? '#dc2626'
						: '#2563eb'};
	border-radius: 0 0.4rem 0.4rem 0;
	padding: 0.75rem 1rem;
	font-size: 0.82rem;
	color: ${({ $color }) =>
		$color === 'amber'
			? '#92400e'
			: $color === 'green'
				? '#14532d'
				: $color === 'red'
					? '#991b1b'
					: '#1e40af'};
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
const AcrPill = styled.span<{
	$level: number;
}>`
	display: inline-block;
	padding: 0.2rem 0.6rem;
	border-radius: 9999px;
	font-size: 0.72rem;
	font-weight: 700;
	background: ${({ $level }) => ($level >= 3 ? '#dcfce7' : $level >= 2 ? '#fef3c7' : '#fee2e2')};
	color: ${({ $level }) => ($level >= 3 ? '#15803d' : $level >= 2 ? '#92400e' : '#dc2626')};
`;

function acrLevel(acr: string) {
	return acr.includes('gold') ? 3 : acr.includes('silver') ? 2 : 1;
}

const StepUpAuthFlow: React.FC = () => {
	const [step, setStep] = useState<Step>(0);

	// Token config
	const [subject, setSubject] = useState('alice@demo.example.com');
	const [currentAcr, setCurrentAcr] = useState('urn:mace:incommon:iap:bronze');
	const [authAgeAgo, setAuthAgeAgo] = useState(0);
	const [scope, _setScope] = useState('read');

	// Resource config
	const [requiredAcr, setRequiredAcr] = useState('urn:mace:incommon:iap:silver');
	const [maxAge, setMaxAge] = useState('');

	// Runtime
	const [tokenResult, setTokenResult] = useState<TokenIssueResult | null>(null);
	const [resourceResult, setResourceResult] = useState<ResourceResult | null>(null);
	const [stepUpAcr, setStepUpAcr] = useState('urn:mace:incommon:iap:silver');
	const [stepUpToken, setStepUpToken] = useState<TokenIssueResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const issueToken = useCallback(
		async (acr: string, ageAgo: number) => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch('/api/stepup/issue-token', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ subject, acr, max_age_ago: ageAgo, scope }),
				});
				const data = (await res.json()) as TokenIssueResult & { success?: boolean; error?: string };
				if (!res.ok || !data.success) throw new Error(data.error ?? 'Token issue failed');
				return data;
			} finally {
				setLoading(false);
			}
		},
		[subject, scope]
	);

	const callResource = useCallback(
		async (token: string) => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch('/api/stepup/resource', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						access_token: token,
						required_acr: requiredAcr,
						max_age: maxAge ? parseInt(maxAge, 10) : undefined,
					}),
				});
				return (await res.json()) as ResourceResult;
			} finally {
				setLoading(false);
			}
		},
		[requiredAcr, maxAge]
	);

	const handleGetInitialToken = useCallback(async () => {
		try {
			const tok = await issueToken(currentAcr, authAgeAgo);
			setTokenResult(tok);
			setStep(2);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}, [issueToken, currentAcr, authAgeAgo]);

	const handleCallResource = useCallback(async () => {
		if (!tokenResult) return;
		const result = await callResource(tokenResult.access_token);
		setResourceResult(result);
		setStep(3);
	}, [tokenResult, callResource]);

	const handleStepUp = useCallback(async () => {
		try {
			const tok = await issueToken(stepUpAcr, 0);
			setStepUpToken(tok);
			const result = await callResource(tok.access_token);
			setResourceResult(result);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}, [issueToken, stepUpAcr, callResource]);

	const reset = () => {
		setStep(0);
		setTokenResult(null);
		setResourceResult(null);
		setStepUpToken(null);
		setError(null);
	};

	const STEPS = ['1. Configure', '2. Get Token', '3. Call Resource', '4. Results'];
	const challenged = resourceResult?.error === 'insufficient_user_authentication';

	return (
		<Page>
			<PageTitle>
				Step-Up Authentication<RfcBadge>RFC 9470</RfcBadge>
			</PageTitle>
			<PageSubtitle>
				Demonstrates{' '}
				<a href="https://www.rfc-editor.org/rfc/rfc9470" target="_blank" rel="noopener noreferrer">
					RFC 9470 — OAuth 2.0 Step Up Authentication Challenge Protocol
				</a>
				. A resource server can demand higher assurance (<code>acr_values</code>) or fresher
				authentication (<code>max_age</code>) by returning a{' '}
				<code>401 insufficient_user_authentication</code> challenge — the client then
				re-authenticates and retries.
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
						<strong>The scenario:</strong> A user has a token with <em>Bronze</em> (password-only)
						assurance. They try to call a banking API that requires <em>Silver</em> (MFA). The RS
						challenges them with
						<code> 401 insufficient_user_authentication</code>. The client prompts the user for
						step-up auth, gets a new token with the required ACR, and retries.
					</CalloutBox>
					<Card>
						<CardTitle>Resource Server Configuration</CardTitle>
						<Label>Required ACR (what the RS demands)</Label>
						<Select value={requiredAcr} onChange={(e) => setRequiredAcr(e.target.value)}>
							{REQUIRED_ACR_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</Select>
						<Label>Max Age (seconds since last auth, optional)</Label>
						<Input
							value={maxAge}
							onChange={(e) => setMaxAge(e.target.value)}
							placeholder="300 (leave blank to skip)"
							type="number"
						/>
					</Card>
					<Card>
						<CardTitle>User / Token Configuration</CardTitle>
						<Label>Subject</Label>
						<Input value={subject} onChange={(e) => setSubject(e.target.value)} />
						<Label>Current ACR (what the user authenticated with)</Label>
						<Select value={currentAcr} onChange={(e) => setCurrentAcr(e.target.value)}>
							{ACR_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</Select>
						<Label>Auth happened N seconds ago (simulate stale auth)</Label>
						<Input
							value={authAgeAgo}
							onChange={(e) => setAuthAgeAgo(parseInt(e.target.value, 10) || 0)}
							type="number"
							placeholder="0"
						/>
					</Card>
					<Btn onClick={() => setStep(1)}>Next →</Btn>
				</>
			)}

			{step === 1 && (
				<>
					<CalloutBox $color="amber">
						<strong>Step 1:</strong> Issue an access token with ACR ={' '}
						<AcrPill $level={acrLevel(currentAcr)}>{currentAcr.split(':').pop()}</AcrPill>. This
						simulates the user's current session token.
					</CalloutBox>
					<Card>
						<CardTitle>Token to Issue</CardTitle>
						<Pre>
							{JSON.stringify(
								{ subject, acr: currentAcr, auth_age_ago_seconds: authAgeAgo, scope },
								null,
								2
							)}
						</Pre>
					</Card>
					<Btn onClick={handleGetInitialToken} disabled={loading}>
						{loading ? 'Issuing…' : 'Issue Token →'}
					</Btn>
					<Btn $variant="ghost" onClick={() => setStep(0)}>
						← Back
					</Btn>
				</>
			)}

			{step === 2 && tokenResult && (
				<>
					<CalloutBox $color="amber">
						<strong>Token issued.</strong> Now call the resource server. It requires ACR ≥{' '}
						<AcrPill $level={acrLevel(requiredAcr)}>{requiredAcr.split(':').pop()}</AcrPill>
						{maxAge ? ` and auth within ${maxAge}s` : ''}. Current token has ACR ={' '}
						<AcrPill $level={acrLevel(currentAcr)}>{currentAcr.split(':').pop()}</AcrPill>.
					</CalloutBox>
					<Card>
						<CardTitle>Token Claims (acr + auth_time)</CardTitle>
						<Pre style={{ fontSize: '.72rem' }}>{JSON.stringify(tokenResult.payload, null, 2)}</Pre>
					</Card>
					<Card>
						<CardTitle>Resource Server Configuration</CardTitle>
						<pre
							style={{
								fontSize: '.82rem',
								background: '#f9fafb',
								padding: '.75rem',
								borderRadius: '.4rem',
								margin: 0,
							}}
						>
							{JSON.stringify(
								{ required_acr: requiredAcr, ...(maxAge && { max_age: parseInt(maxAge, 10) }) },
								null,
								2
							)}
						</pre>
					</Card>
					<Btn onClick={handleCallResource} disabled={loading}>
						{loading ? 'Calling…' : 'Call Protected Resource →'}
					</Btn>
					<Btn $variant="ghost" onClick={() => setStep(1)}>
						← Back
					</Btn>
				</>
			)}

			{step === 3 && resourceResult && (
				<>
					{resourceResult.granted ? (
						<>
							<SuccessBox>✓ Access granted — token ACR satisfies resource requirement.</SuccessBox>
							<Card>
								<CardTitle>Resource Response</CardTitle>
								<Pre>{JSON.stringify(resourceResult, null, 2)}</Pre>
							</Card>
						</>
					) : challenged ? (
						<>
							<CalloutBox $color="red">
								<strong>401 insufficient_user_authentication</strong> — The RS rejected the token.{' '}
								{resourceResult.required_acr && (
									<>
										Required ACR:{' '}
										<AcrPill $level={acrLevel(resourceResult.required_acr)}>
											{resourceResult.required_acr?.split(':').pop()}
										</AcrPill>
										. Current:{' '}
										<AcrPill $level={acrLevel(resourceResult.current_acr ?? '')}>
											{resourceResult.current_acr?.split(':').pop()}
										</AcrPill>
										.
									</>
								)}
								{resourceResult.max_age && (
									<>
										{' '}
										Auth is {resourceResult.current_auth_age_seconds}s old, max allowed:{' '}
										{resourceResult.max_age}s.
									</>
								)}
							</CalloutBox>
							<Card>
								<CardTitle>WWW-Authenticate Challenge (RFC 9470 §5)</CardTitle>
								<Pre>
									{'WWW-Authenticate: Bearer error="insufficient_user_authentication"' +
										(resourceResult.required_acr
											? `,\n  acr_values="${resourceResult.required_acr}"`
											: '') +
										(resourceResult.max_age ? `,\n  max_age=${resourceResult.max_age}` : '')}
								</Pre>
							</Card>
							<Card>
								<CardTitle>Step-Up: Re-authenticate at Higher Assurance</CardTitle>
								<Label>Step-up to ACR</Label>
								<Select value={stepUpAcr} onChange={(e) => setStepUpAcr(e.target.value)}>
									{ACR_OPTIONS.filter(
										(o) => acrLevel(o.value) >= acrLevel(resourceResult.required_acr ?? '')
									).map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</Select>
								<Btn onClick={handleStepUp} disabled={loading}>
									{loading ? 'Stepping up…' : '▶ Step Up + Retry Resource Call'}
								</Btn>
							</Card>
							{stepUpToken && (
								<Card>
									<CardTitle>Step-Up Token Issued + Resource Retried</CardTitle>
									{resourceResult.granted !== undefined &&
										(resourceResult.granted ? (
											<SuccessBox>✓ Access granted after step-up!</SuccessBox>
										) : (
											<ErrorBox>Still denied — choose a higher ACR level.</ErrorBox>
										))}
									<Pre style={{ fontSize: '.72rem' }}>
										{JSON.stringify(stepUpToken.payload, null, 2)}
									</Pre>
								</Card>
							)}
						</>
					) : (
						<ErrorBox>
							{resourceResult.error_description ?? JSON.stringify(resourceResult)}
						</ErrorBox>
					)}

					<Card>
						<CardTitle>RFC 9470 Flow Summary</CardTitle>
						<Table>
							<thead>
								<tr>
									<th>Step</th>
									<th>Actor</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>1</td>
									<td>Client</td>
									<td>Calls RS with existing access token</td>
								</tr>
								<tr>
									<td>2</td>
									<td>Resource Server</td>
									<td>
										401 +{' '}
										<code>WWW-Authenticate: Bearer error="insufficient_user_authentication"</code>
									</td>
								</tr>
								<tr>
									<td>3</td>
									<td>Client</td>
									<td>
										Initiates new authorization with <code>acr_values</code> / <code>max_age</code>{' '}
										from challenge
									</td>
								</tr>
								<tr>
									<td>4</td>
									<td>AS</td>
									<td>Authenticates user at requested assurance level, issues new token</td>
								</tr>
								<tr>
									<td>5</td>
									<td>Client</td>
									<td>Retries original resource call with stepped-up token</td>
								</tr>
							</tbody>
						</Table>
					</Card>
					<Btn onClick={reset}>↺ Run Again</Btn>
				</>
			)}
		</Page>
	);
};

export default StepUpAuthFlow;
