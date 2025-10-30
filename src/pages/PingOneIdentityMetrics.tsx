// src/pages/PingOneIdentityMetrics.tsx
// Visual explorer for PingOne Total Identity Counts metrics API

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
	FiBarChart2,
	FiCalendar,
	FiClock,
	FiDatabase,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiRefreshCw,
	FiShield
} from 'react-icons/fi';
import JSONHighlighter, { type JSONData } from '../components/JSONHighlighter';
import { workerTokenCredentialsService } from '../services/workerTokenCredentialsService';
import { v4ToastManager } from '../utils/v4ToastMessages';

const PageContainer = styled.div`
	max-width: 1100px;
	margin: 0 auto;
	padding: 2rem 1.5rem 4rem;
	display: flex;
	flex-direction: column;
	gap: 1.75rem;
`;

const HeaderCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.75rem;
	border-radius: 1rem;
	background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04));
	border: 1px solid rgba(59, 130, 246, 0.2);
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #1d4ed8;
`;

const Title = styled.h1`
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
`;

const Subtitle = styled.p`
	margin: 0;
	color: #1e40af;
	max-width: 720px;
	line-height: 1.6;
`;

const LayoutGrid = styled.div`
	display: grid;
	grid-template-columns: 360px 1fr;
	gap: 1.75rem;

	@media (max-width: 1080px) {
		grid-template-columns: 1fr;
	}
`;

const Card = styled.div`
	background: #ffffff;
	border-radius: 1rem;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.18);
	overflow: hidden;
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const SectionTitle = styled.h2`
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.1rem;
	font-weight: 600;
	color: #0f172a;
`;

const FieldGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-weight: 600;
	font-size: 0.85rem;
	color: #334155;
	display: flex;
	align-items: center;
	gap: 0.35rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
	width: 100%;
	padding: 0.75rem 0.85rem;
	border-radius: 0.75rem;
	border: 1px solid ${({ $hasError }) => ($hasError ? '#f87171' : '#cbd5f5')};
	background: #f8fafc;
	transition: all 0.2s ease;
	font-size: 0.92rem;

	&:focus {
		outline: none;
		border-color: ${({ $hasError }) => ($hasError ? '#ef4444' : '#3b82f6')};
		box-shadow: 0 0 0 3px ${({ $hasError }) => ($hasError ? 'rgba(248, 113, 113, 0.35)' : 'rgba(59, 130, 246, 0.2)')};
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem 0.85rem;
	border-radius: 0.75rem;
	border: 1px solid #cbd5f5;
	background: #f8fafc;
	font-size: 0.92rem;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
	}
`;

const ToggleSecretButton = styled.button`
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	border: none;
	background: none;
	color: #64748b;
	cursor: pointer;
	padding: 0.25rem;

	&:hover {
		color: #111827;
	}
`;

const SecretFieldWrapper = styled.div`
	position: relative;
`;

const Hint = styled.p`
	margin: 0;
	font-size: 0.8rem;
	color: #64748b;
`;

const ButtonRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`;

const PrimaryButton = styled.button<{ disabled?: boolean }>`
	border: none;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: ${({ disabled }) => (disabled ? '#cbd5f5' : '#2563eb')};
	color: white;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-1px)')};
		box-shadow: ${({ disabled }) => (disabled ? 'none' : '0 10px 22px -12px rgba(37, 99, 235, 0.65)')};
	}
`;

const SecondaryButton = styled.button`
	border: 1px solid #cbd5f5;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: white;
	color: #1e293b;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: background 0.15s ease, color 0.15s ease;

	&:hover {
		background: #f8fafc;
		color: #1d4ed8;
	}
`;

const TokenBadge = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.4rem 0.75rem;
	background: rgba(16, 185, 129, 0.12);
	color: #047857;
	border-radius: 999px;
	font-size: 0.8rem;
	font-weight: 600;
`;

const ResultContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const EmptyState = styled.div`
	padding: 2rem;
	border-radius: 1rem;
	border: 1px dashed #cbd5f5;
	background: #f8fafc;
	color: #475569;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
`;

const ErrorBanner = styled.div`
	padding: 1rem 1.25rem;
	border-radius: 0.85rem;
	border: 1px solid #fecaca;
	background: #fef2f2;
	color: #b91c1c;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

interface IdentityCountResponse {
	_embedded?: {
		totalIdentities?: Array<{
			date: string;
			totalIdentities?: number;
			count?: number;
		}>;
	};
	count?: number;
	links?: Record<string, unknown>;
	[key: string]: unknown;
}

const defaultDateRange = () => {
	const end = new Date();
	const start = new Date(end);
	start.setDate(end.getDate() - 7);

	const toInputFormat = (date: Date) => date.toISOString().split('T')[0];

	return {
		start: toInputFormat(start),
		end: toInputFormat(end),
	};
};

const PingOneIdentityMetrics: React.FC = () => {
	const storedCreds = useMemo(() => workerTokenCredentialsService.loadCredentials(), []);
	const [environmentId, setEnvironmentId] = useState<string>(storedCreds?.environmentId || '');
	const [region, setRegion] = useState<string>((storedCreds?.region as string) || 'na');
	const [clientId, setClientId] = useState<string>(storedCreds?.clientId || '');
	const [clientSecret, setClientSecret] = useState<string>(storedCreds?.clientSecret || '');
	const [{ start, end }, setDateRange] = useState(defaultDateRange);
	const [sampleSize, setSampleSize] = useState<string>('');
	const [showSecret, setShowSecret] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [metrics, setMetrics] = useState<IdentityCountResponse | null>(null);
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);

	const workerToken = useMemo(() => localStorage.getItem('worker_token') || '', []);

	useEffect(() => {
		if (!storedCreds) return;
		// ensure region stored matches select value (service stores 'us'/'eu' etc)
		if (storedCreds.region && storedCreds.region !== region) {
			setRegion(storedCreds.region);
		}
	}, [storedCreds, region]);

	const resetDates = () => setDateRange(defaultDateRange());

	const hasRequiredInputs = environmentId.trim().length > 0;

	const handleFetch = useCallback(async () => {
		if (!hasRequiredInputs) {
			setError('Environment ID is required');
			return;
		}

		const effectiveWorkerToken = localStorage.getItem('worker_token') || undefined;
		const effectiveClientId = clientId.trim() || undefined;
		const effectiveClientSecret = clientSecret.trim() || undefined;

		if (!effectiveWorkerToken && (!effectiveClientId || !effectiveClientSecret)) {
			setError('Provide either a valid worker token in local storage or client credentials to mint a token.');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/pingone/metrics/identity-counts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: environmentId.trim(),
					region,
					startDate: start || undefined,
					endDate: end || undefined,
					sampleSize: sampleSize || undefined,
					workerToken: effectiveWorkerToken,
					clientId: effectiveClientId,
					clientSecret: effectiveClientSecret,
				}),
			});

			if (!response.ok) {
				const problem = await response.json().catch(() => ({}));
				throw new Error(problem.error_description || response.statusText);
			}

			const data: IdentityCountResponse = await response.json();
			setMetrics(data);
			setLastUpdated(new Date().toISOString());
			v4ToastManager.showSuccess('Total identity counts retrieved successfully!');
		} catch (err) {
			console.error('[PingOne Identity Metrics] Fetch failed:', err);
			setMetrics(null);
			setLastUpdated(null);
			setError(err instanceof Error ? err.message : 'Unexpected error querying PingOne metrics');
		} finally {
			setLoading(false);
		}
	}, [environmentId, region, start, end, sampleSize, clientId, clientSecret, hasRequiredInputs]);

	const embeddedCounts = metrics?._embedded?.totalIdentities;
	const formattedMetrics = useMemo<JSONData | null>(() => {
		if (!metrics) return null;
		return JSON.parse(JSON.stringify(metrics)) as JSONData;
	}, [metrics]);

	return (
		<PageContainer>
			<HeaderCard>
				<TitleRow>
					<FiBarChart2 size={24} />
					<Title>PingOne Identity Counts</Title>
				</TitleRow>
				<Subtitle>
					Query the PingOne <strong>Total Identities</strong> metrics endpoint using your worker credentials. This reports daily totals of unique identities in a PingOne environment for the selected date range.
				</Subtitle>
			</HeaderCard>

			<LayoutGrid>
				<Card>
					<SectionTitle>
						<FiShield /> Authentication
					</SectionTitle>

					<FieldGroup>
						<Label>Environment ID</Label>
						<Input
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="b987c16-..."
							$hasError={!!error && !environmentId}
						/>
					</FieldGroup>

					<FieldGroup>
						<Label>Region</Label>
						<Select value={region} onChange={(e) => setRegion(e.target.value)}>
							<option value="na">North America (na)</option>
							<option value="us">US (auth.pingone.com)</option>
							<option value="eu">Europe (auth.pingone.eu)</option>
							<option value="ap">Asia Pacific (auth.pingone.asia)</option>
							<option value="ca">Canada (auth.pingone.ca)</option>
						</Select>
					</FieldGroup>

					<FieldGroup>
						<Label>Client ID (fallback)</Label>
						<Input
							value={clientId}
							onChange={(e) => setClientId(e.target.value)}
							placeholder="Optional if worker token present"
						/>
					</FieldGroup>

					<FieldGroup>
						<Label>Client Secret (fallback)</Label>
						<SecretFieldWrapper>
							<Input
								type={showSecret ? 'text' : 'password'}
								value={clientSecret}
								onChange={(e) => setClientSecret(e.target.value)}
								placeholder="Optional if worker token present"
							/>
							<ToggleSecretButton onClick={() => setShowSecret((prev) => !prev)} type="button" aria-label="Toggle secret visibility">
								{showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
							</ToggleSecretButton>
						</SecretFieldWrapper>
						<Hint>
							If a worker token exists in local storage it will be re-used. Otherwise the API will mint a temporary token using these credentials.
						</Hint>
					</FieldGroup>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
						<Label>
							<FiInfo size={14} /> Active Worker Token
						</Label>
						{workerToken ? (
							<TokenBadge>
								<FiDatabase size={14} /> Token cached • {workerToken.substring(0, 16)}…
							</TokenBadge>
						) : (
							<Hint>No worker token detected in local storage.</Hint>
						)}
					</div>
				</Card>

				<Card>
					<SectionTitle>
						<FiCalendar /> Date Range & Sample Size
					</SectionTitle>

					<FieldGroup>
						<Label>Start date</Label>
						<Input type="date" value={start} onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))} />
					</FieldGroup>

					<FieldGroup>
						<Label>End date</Label>
						<Input type="date" value={end} onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))} />
					</FieldGroup>

					<FieldGroup>
						<Label>Sample size (optional)</Label>
						<Input
							type="number"
							value={sampleSize}
							onChange={(e) => setSampleSize(e.target.value)}
							placeholder="Default = PingOne decision"
						/>
						<Hint>Controls how many days of history PingOne returns (per SCIM sampleSize semantics).</Hint>
					</FieldGroup>

					<ButtonRow>
						<PrimaryButton onClick={handleFetch} disabled={!hasRequiredInputs || loading}>
							{loading ? (
								<>
									<FiRefreshCw className="spin" /> Fetching…
								</>
							) : (
								<>
									<FiBarChart2 /> Retrieve counts
								</>
							)}
						</PrimaryButton>

						<SecondaryButton type="button" onClick={resetDates}>
							<FiClock /> Reset dates
						</SecondaryButton>
					</ButtonRow>

					{error && (
						<ErrorBanner>
							<FiInfo size={18} style={{ marginTop: '0.2rem' }} />
							<span>{error}</span>
						</ErrorBanner>
					)}

					<ResultContainer>
						{metrics ? (
							<>
								{embeddedCounts && embeddedCounts.length > 0 && (
									<Card style={{ border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
										<SectionTitle>
											<FiDatabase /> Daily totals
										</SectionTitle>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
											{embeddedCounts.map((row) => (
												<div
													key={`${row.date}-${row.totalIdentities ?? row.count}`}
													style={{
														display: 'flex',
														justifyContent: 'space-between',
														fontFamily: 'monospace',
														fontSize: '0.9rem',
													}}
												>
													<span>{row.date}</span>
													<span>{row.totalIdentities ?? row.count ?? '—'}</span>
												</div>
											))}
										</div>
									</Card>
								)}

								<Card style={{ border: '1px solid #dbeafe', background: '#f8fbff' }}>
									<SectionTitle>
										<FiInfo /> Raw response
									</SectionTitle>
									{formattedMetrics && <JSONHighlighter data={formattedMetrics} />}
									{lastUpdated && (
										<Hint>Last updated {new Date(lastUpdated).toLocaleString()}</Hint>
									)}
								</Card>
							</>
						) : (
							<EmptyState>
								<FiBarChart2 size={22} />
								<span>Run the request to see identity totals returned by PingOne.</span>
							</EmptyState>
						)}
					</ResultContainer>
				</Card>
			</LayoutGrid>
		</PageContainer>
	);
};

export default PingOneIdentityMetrics;
