// src/pages/PingOneIdentityMetrics.tsx
// Visual explorer for PingOne Identity Counts API (totalIdentities & activeIdentityCounts)
// Updated with unified worker token management
// Cache bust: 2025-02-17-11:32

import React, { useCallback, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiBarChart2,
	FiCalendar,
	FiCheckCircle,
	FiClock,
	FiDatabase,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiX,
} from 'react-icons/fi';
import styled from 'styled-components';
import JSONHighlighter, { type JSONData } from '../components/JSONHighlighter';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import { apiRequestModalService } from '../services/apiRequestModalService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { ShowTokenConfigCheckboxV8 } from '../v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '../v8/components/SilentApiConfigCheckboxV8';
import { WorkerTokenModalV8 } from '../v8/components/WorkerTokenModalV8';

const PageContainer = styled.div`
	max-width: 90rem;
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
	transition: all 0.2s ease;
	font-size: 0.92rem;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
	}
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

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`;

const DangerButton = styled.button`
	border: none;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: #ef4444;
	color: white;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 22px -12px rgba(239, 68, 68, 0.65);
		background: #dc2626;
	}

	&:active {
		transform: translateY(0);
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

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`;

const WarningBanner = styled.div`
	padding: 1rem 1.25rem;
	border-radius: 0.85rem;
	border: 2px solid #fbbf24;
	background: #fef3c7;
	color: #92400e;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-bottom: 1rem;
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

const PermissionsModalOverlay = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	backdrop-filter: blur(4px);
`;

const PermissionsModalContent = styled.div`
	background: white;
	border-radius: 0.75rem;
	padding: 1.25rem 1.5rem;
	max-width: 800px;
	width: calc(100vw - 4rem);
	margin: 1rem;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	border: 3px solid #dc2626;
	max-height: calc(100vh - 4rem);
	overflow-y: auto;
`;

const PermissionsModalTitle = styled.h2`
	font-size: 1.1rem;
	font-weight: 700;
	color: #1f2937;
	margin: 0 0 0.65rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const PermissionsModalMessage = styled.p`
	font-size: 0.8rem;
	color: #374151;
	line-height: 1.35;
	margin: 0 0 0.65rem 0;
`;

const PermissionsModalInstructions = styled.div`
	font-size: 0.75rem;
	color: #374151;
	line-height: 1.35;
	margin: 0 0 0.75rem 0;
	padding: 0.75rem;
	background: #f3f4f6;
	border-radius: 0.5rem;
	border-left: 4px solid #dc2626;

	strong {
		color: #1f2937;
		display: block;
		margin-bottom: 0.4rem;
		font-size: 0.8rem;
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	li {
		margin-bottom: 0.25rem;
	}

	code {
		background: #1f2937;
		color: #f59e0b;
		padding: 0.15rem 0.35rem;
		border-radius: 0.25rem;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.7rem;
		font-weight: 600;
	}
`;

const PermissionsModalActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
`;

const PermissionsModalButton = styled.button`
	padding: 0.55rem 1.25rem;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.85rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 200ms ease;

	&:hover {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	&:active {
		transform: translateY(0);
	}
`;

interface ActiveIdentityCount {
	startDate: string;
	count: number;
	[key: string]: unknown;
}

interface IdentityCountResponse {
	_embedded?: {
		activeIdentityCounts?: ActiveIdentityCount[];
		[key: string]: unknown;
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

type EndpointType = 'byDateRange' | 'byLicense' | 'simple';

const PingOneIdentityMetrics: React.FC = () => {
	const [{ start }, setDateRange] = useState(defaultDateRange);
	const [samplingPeriod, setSamplingPeriod] = useState<string>('24'); // For activeIdentityCounts
	const [endpointType, setEndpointType] = useState<EndpointType>('byDateRange');
	const [licenseId, setLicenseId] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [metrics, setMetrics] = useState<IdentityCountResponse | null>(null);
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);
	const [showPermissionsErrorModal, setShowPermissionsErrorModal] = useState(false);

	// Use global worker token hook for unified token management
	const globalTokenStatus = useGlobalWorkerToken();
	const workerToken = globalTokenStatus.token || '';
	const hasWorkerToken = globalTokenStatus.isValid;
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	const resetDates = () => setDateRange(defaultDateRange());

	// Get worker token using credentials on the page
	const handleGetWorkerToken = useCallback(() => {
		if (hasWorkerToken) {
			v4ToastManager.showInfo(
				'Worker token already available. Opening modal in case you want to refresh it.'
			);
		}
		setError(null);
		setShowWorkerTokenModal(true);
	}, [hasWorkerToken]);

	// Clear the worker token (clears unified worker token)
	const handleClearWorkerToken = useCallback(() => {
		// Clear unified worker token
		localStorage.removeItem('unified_worker_token');
		v4ToastManager.showSuccess('Worker token cleared successfully.');
		// Trigger page reload to reset state
		window.location.reload();
	}, []);

	// Execute the actual API call (called after user confirms in modal)
	const executeApiCall = useCallback(async () => {
		// Load credentials from unified worker token service with global fallback
		let environmentId = '';
		let region = 'us';
		const effectiveWorkerToken = workerToken || '';

		try {
			const stored = localStorage.getItem('unified_worker_token');
			if (stored) {
				const data = JSON.parse(stored);
				environmentId = data.credentials?.environmentId || '';
				region = data.credentials?.region || 'us';
			}

			// CRITICAL FIX: Fallback to global environment ID service
			// This prevents "Environment ID is required" errors in standalone pages
			if (!environmentId) {
				const globalEnvId = localStorage.getItem('v8:global_environment_id');
				if (globalEnvId) {
					environmentId = globalEnvId;
					console.log(
						'🔧 Applied global environment ID fallback for PingOneIdentityMetrics executeApiCall'
					);
				}
			}
		} catch (error) {
			console.log('Failed to load credentials from unified worker token:', error);
		}

		setLoading(true);
		setError(null);

		console.log('[Identity Metrics] 🌍 Making API request with region:', region);
		console.log('[Identity Metrics] 📦 Environment ID:', environmentId.trim());

		try {
			// Active Identity Counts - uses GET with query parameters
			const queryParams = new URLSearchParams({
				environmentId: environmentId.trim(),
				region: region,
				workerToken: effectiveWorkerToken,
				limit: '100',
			});

			// Add parameters based on endpoint type
			if (endpointType === 'byDateRange') {
				if (start) queryParams.append('startDate', start);
				if (samplingPeriod) queryParams.append('samplingPeriod', samplingPeriod);
			} else if (endpointType === 'byLicense') {
				if (licenseId) queryParams.append('licenseId', licenseId);
				if (samplingPeriod) queryParams.append('samplingPeriod', samplingPeriod);
			}
			// 'simple' endpoint type uses no additional parameters beyond limit

			const apiUrl = `/api/pingone/active-identity-counts?${queryParams.toString()}`;
			const fetchOptions: RequestInit = {
				method: 'GET',
			};

			const response = await fetch(apiUrl, fetchOptions);

			if (!response.ok) {
				if (response.status === 403) {
					setShowPermissionsErrorModal(true);
					throw new Error('PERMISSIONS_ERROR');
				}
				const problem = await response.json().catch(() => ({}));
				throw new Error(problem.error_description || response.statusText);
			}

			const data: IdentityCountResponse = await response.json();
			setMetrics(data);
			setLastUpdated(new Date().toISOString());
			v4ToastManager.showSuccess('Identity metrics retrieved successfully!');
		} catch (err) {
			console.error('[PingOne Identity Metrics] Fetch failed:', err);
			setMetrics(null);
			setLastUpdated(null);
			// Don't show error message for permissions errors as we show a modal instead
			if (err instanceof Error && err.message === 'PERMISSIONS_ERROR') {
				setError('Worker token lacks required permissions. Click the error modal for details.');
			} else {
				setError(err instanceof Error ? err.message : 'Unexpected error querying PingOne metrics');
			}
		} finally {
			setLoading(false);
		}
	}, [start, samplingPeriod, endpointType, licenseId, workerToken]);

	// Show educational modal before making the API call
	const handleFetch = useCallback(async () => {
		// Load credentials from unified worker token service with global fallback
		let environmentId = '';
		let region = 'us';

		try {
			const stored = localStorage.getItem('unified_worker_token');
			if (stored) {
				const data = JSON.parse(stored);
				environmentId = data.credentials?.environmentId || '';
				region = data.credentials?.region || 'us';
			}

			// CRITICAL FIX: Fallback to global environment ID service
			// This prevents "Environment ID is required" errors in standalone pages
			if (!environmentId) {
				const globalEnvId = localStorage.getItem('v8:global_environment_id');
				if (globalEnvId) {
					environmentId = globalEnvId;
					console.log(
						'🔧 Applied global environment ID fallback for PingOneIdentityMetrics handleFetch'
					);
				}
			}
		} catch (error) {
			console.log('Failed to load credentials from unified worker token:', error);
		}

		if (!environmentId.trim()) {
			setError('Environment ID is required. Please generate a worker token first.');
			return;
		}

		const effectiveWorkerToken = workerToken || '';

		console.log('[Identity Metrics] 🔍 Using token for API call:', {
			hasToken: !!effectiveWorkerToken,
			tokenPreview: effectiveWorkerToken ? `${effectiveWorkerToken.substring(0, 20)}...` : 'none',
			environmentId: `${environmentId.substring(0, 20)}...`,
		});

		if (!effectiveWorkerToken) {
			setError('Worker token required. Click "Get Worker Token" to generate one.');
			return;
		}

		// Build API URL for display
		const regionMap: Record<string, string> = {
			us: 'https://api.pingone.com',
			na: 'https://api.pingone.com',
			eu: 'https://api.pingone.eu',
			ca: 'https://api.pingone.ca',
			ap: 'https://api.pingone.asia',
			asia: 'https://api.pingone.asia',
		};
		const baseUrl = regionMap[region.toLowerCase()] || regionMap.na;

		// Build API URL for activeIdentityCounts based on endpoint type
		const queryParams = new URLSearchParams();
		queryParams.append('limit', '100');

		let pingOneApiUrl: string;
		let educationalNotes: string[];

		if (endpointType === 'byDateRange') {
			const filters: string[] = [];
			if (start)
				filters.push(`startDate ge "${start.includes('T') ? start : `${start}T00:00:00Z`}"`);
			if (samplingPeriod) filters.push(`samplingPeriod eq "${samplingPeriod}"`);
			if (filters.length > 0) {
				queryParams.append('filter', filters.join(' and '));
			}

			pingOneApiUrl = `${baseUrl}/v1/environments/${environmentId.trim()}/activeIdentityCounts?${queryParams.toString()}`;

			educationalNotes = [
				'This endpoint returns time-series identity count data with specified sampling periods',
				'The sampling period determines the granularity (hourly, daily, weekly)',
				'Uses OData filtering syntax for startDate and samplingPeriod',
				'Returns up to 100 data points (configurable with limit parameter)',
				'Requires Identity Data Admin or Environment Admin role in PingOne',
			];
		} else if (endpointType === 'byLicense') {
			if (licenseId) {
				queryParams.append('licenseId', licenseId);
			}
			if (samplingPeriod) {
				queryParams.append('samplingPeriod', samplingPeriod);
			}

			pingOneApiUrl = `${baseUrl}/v1/environments/${environmentId.trim()}/activeIdentityCounts?${queryParams.toString()}`;

			educationalNotes = [
				'This endpoint returns active identity counts filtered by license',
				'Requires a licenseId parameter to filter counts for a specific license',
				'The sampling period determines the granularity (hourly, daily, weekly)',
				'Returns up to 100 data points (configurable with limit parameter)',
				'Requires Identity Data Admin or Environment Admin role in PingOne',
			];
		} else {
			// Simple endpoint - no filters
			pingOneApiUrl = `${baseUrl}/v1/environments/${environmentId.trim()}/activeIdentityCounts?${queryParams.toString()}`;

			educationalNotes = [
				'This endpoint returns active identity counts without filters',
				'Returns the most recent data points (up to limit)',
				'Returns up to 100 data points (configurable with limit parameter)',
				'Requires Identity Data Admin or Environment Admin role in PingOne',
			];
		}

		// Show educational modal
		apiRequestModalService.showModal({
			type: 'data_api_get',
			method: 'GET',
			url: pingOneApiUrl,
			headers: {
				Authorization: `Bearer ${effectiveWorkerToken}`,
				Accept: 'application/json',
			},
			description: 'Retrieve time-series active identity counts with sampling periods',
			educationalNotes,
			onProceed: executeApiCall,
		});
	}, [start, samplingPeriod, endpointType, licenseId, executeApiCall, workerToken]);

	// Extract active identity counts from response
	const activeIdentityCounts = metrics?._embedded?.activeIdentityCounts || [];
	const formattedMetrics = useMemo<JSONData | null>(() => {
		if (!metrics) return null;
		return JSON.parse(JSON.stringify(metrics)) as JSONData;
	}, [metrics]);

	// Calculate summary statistics
	const summary = useMemo(() => {
		if (!activeIdentityCounts || activeIdentityCounts.length === 0) return null;

		const counts = activeIdentityCounts
			.map((item: ActiveIdentityCount) => item.count || 0)
			.filter((c: number) => c > 0);
		if (counts.length === 0) return null;

		const total = counts.reduce((sum: number, c: number) => sum + c, 0);
		const average = Math.round(total / counts.length);
		const min = Math.min(...counts);
		const max = Math.max(...counts);
		const latest = counts[counts.length - 1];
		const oldest = counts[0];

		return {
			total,
			average,
			min,
			max,
			latest,
			oldest,
			dataPoints: counts.length,
			period: samplingPeriod === '1' ? 'hourly' : samplingPeriod === '24' ? 'daily' : 'weekly',
		};
	}, [activeIdentityCounts, samplingPeriod]);

	return (
		<PageContainer>
			<HeaderCard>
				<TitleRow>
					<FiBarChart2 size={24} />
					<Title>PingOne Identity Counts</Title>
				</TitleRow>
				<Subtitle>
					Query PingOne active identity counts with time-series data and sampling periods. Requires{' '}
					<strong>Identity Data Admin</strong> role.
				</Subtitle>
				{!hasWorkerToken && (
					<WarningBanner>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
							<FiAlertCircle size={20} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
							<div style={{ flex: 1 }}>
								<strong>Worker Token Required</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									Click "Get Worker Token" below to generate a token with your PingOne credentials.
								</p>
							</div>
						</div>
					</WarningBanner>
				)}
			</HeaderCard>

			<LayoutGrid>
				<Card>
					<SectionTitle>
						<FiShield /> Authentication & Worker Token
					</SectionTitle>

					{hasWorkerToken ? (
						<WorkerTokenDetectedBanner token={workerToken} tokenExpiryKey="unified_worker_token" />
					) : (
						<WarningBanner style={{ marginBottom: '1rem' }}>
							<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
								<FiAlertCircle size={18} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
								<div style={{ flex: 1 }}>
									<strong>No Worker Token Found</strong>
									<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
										Click the button below to open the Worker Token modal and generate a token with
										the required credentials.
									</p>
								</div>
							</div>
						</WarningBanner>
					)}

					{/* Configuration Checkboxes */}
					<div
						style={{
							marginBottom: '1rem',
							display: 'flex',
							flexDirection: 'column',
							gap: '0.75rem',
						}}
					>
						<SilentApiConfigCheckboxV8 />
						<ShowTokenConfigCheckboxV8 />
					</div>

					<ButtonRow>
						<PrimaryButton
							onClick={handleGetWorkerToken}
							type="button"
							style={{
								background: hasWorkerToken ? '#9ca3af' : undefined,
								cursor: 'pointer',
								color: 'white',
							}}
						>
							{hasWorkerToken ? (
								<>
									<FiCheckCircle /> Worker Token Ready
								</>
							) : (
								<>
									<FiKey /> Get Worker Token
								</>
							)}
						</PrimaryButton>
						{hasWorkerToken && (
							<DangerButton onClick={handleClearWorkerToken} type="button">
								<FiX /> Clear Token
							</DangerButton>
						)}
					</ButtonRow>
				</Card>

				<Card>
					<SectionTitle>
						<FiCalendar /> Metrics Configuration
					</SectionTitle>

					<FieldGroup>
						<Label>Endpoint Type</Label>
						<Select
							value={endpointType}
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
								setEndpointType(e.target.value as EndpointType)
							}
						>
							<option value="byDateRange">By Date Range</option>
							<option value="byLicense">By License</option>
							<option value="simple">Simple (No Filters)</option>
						</Select>
						<Hint>
							{endpointType === 'byDateRange' && 'Filter by date range and sampling period'}
							{endpointType === 'byLicense' && 'Filter by license ID and sampling period'}
							{endpointType === 'simple' && 'Get recent counts without filters'}
						</Hint>
					</FieldGroup>

					{endpointType === 'byDateRange' && (
						<>
							<FieldGroup>
								<Label>Start date</Label>
								<Input
									type="date"
									value={start}
									onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
								/>
							</FieldGroup>
							<FieldGroup>
								<Label>Sampling Period</Label>
								<Select
									value={samplingPeriod}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										setSamplingPeriod(e.target.value)
									}
								>
									<option value="1">1 hour (hourly)</option>
									<option value="24">24 hours (daily)</option>
									<option value="168">168 hours (weekly)</option>
								</Select>
								<Hint>Time interval for data points in the time-series response.</Hint>
							</FieldGroup>
						</>
					)}

					{endpointType === 'byLicense' && (
						<>
							<FieldGroup>
								<Label>License ID</Label>
								<Input
									type="text"
									value={licenseId}
									onChange={(e) => setLicenseId(e.target.value)}
									placeholder="Enter license ID"
								/>
								<Hint>License ID to filter identity counts by.</Hint>
							</FieldGroup>
							<FieldGroup>
								<Label>Sampling Period</Label>
								<Select
									value={samplingPeriod}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										setSamplingPeriod(e.target.value)
									}
								>
									<option value="1">1 hour (hourly)</option>
									<option value="24">24 hours (daily)</option>
									<option value="168">168 hours (weekly)</option>
								</Select>
								<Hint>Time interval for data points in the time-series response.</Hint>
							</FieldGroup>
						</>
					)}

					{endpointType === 'simple' && (
						<FieldGroup>
							<Label>Limit</Label>
							<Input
								type="number"
								value="100"
								readOnly
								style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
							/>
							<Hint>Returns up to 100 most recent data points.</Hint>
						</FieldGroup>
					)}

					<ButtonRow>
						<PrimaryButton onClick={handleFetch} disabled={!hasWorkerToken || loading}>
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
								{summary && (
									<Card
										style={{
											border: '1px solid #10b981',
											background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
										}}
									>
										<SectionTitle>
											<FiBarChart2 /> Summary Statistics
										</SectionTitle>
										<div
											style={{
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
												gap: '1rem',
												marginTop: '1rem',
											}}
										>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #d1fae5',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Latest Count
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
													{summary.latest.toLocaleString()}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #d1fae5',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Average
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
													{summary.average.toLocaleString()}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #d1fae5',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Maximum
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
													{summary.max.toLocaleString()}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #d1fae5',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Minimum
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
													{summary.min.toLocaleString()}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #d1fae5',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Data Points
												</div>
												<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
													{summary.dataPoints}
												</div>
											</div>
											<div
												style={{
													padding: '0.75rem',
													background: 'white',
													borderRadius: '0.5rem',
													border: '1px solid #d1fae5',
												}}
											>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}
												>
													Period
												</div>
												<div
													style={{
														fontSize: '1.1rem',
														fontWeight: 600,
														color: '#059669',
														textTransform: 'capitalize',
													}}
												>
													{summary.period}
												</div>
											</div>
										</div>
										{lastUpdated && (
											<Hint
												style={{
													marginTop: '1rem',
													paddingTop: '1rem',
													borderTop: '1px solid #d1fae5',
												}}
											>
												Last updated: {new Date(lastUpdated).toLocaleString()}
											</Hint>
										)}
									</Card>
								)}

								<Card style={{ border: '1px solid #dbeafe', background: '#ffffff' }}>
									<SectionTitle>
										<FiDatabase /> Full API Response
									</SectionTitle>
									{formattedMetrics && (
										<div style={{ maxHeight: '600px', overflow: 'auto' }}>
											<JSONHighlighter data={formattedMetrics} />
										</div>
									)}
								</Card>
							</>
						) : (
							<EmptyState>
								<FiBarChart2 size={22} />
								<span>Run the request to see active identity counts returned by PingOne.</span>
							</EmptyState>
						)}
					</ResultContainer>
				</Card>
			</LayoutGrid>
			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={() => {
					// Token generated, the global hook will automatically update
					setShowWorkerTokenModal(false);
					v4ToastManager.showSuccess(
						'Worker token generated successfully. Ready to query metrics.'
					);
				}}
				environmentId={(() => {
					try {
						const stored = localStorage.getItem('unified_worker_token');
						if (stored) {
							const data = JSON.parse(stored);
							return data.credentials?.environmentId || '';
						}
					} catch (error) {
						console.log('Failed to load environment ID from unified worker token:', error);
					}
					return '';
				})()}
			/>

			{/* Permissions Error Modal */}
			{showPermissionsErrorModal && (
				<PermissionsModalOverlay onClick={() => setShowPermissionsErrorModal(false)}>
					<PermissionsModalContent onClick={(e) => e.stopPropagation()}>
						<PermissionsModalTitle>
							<FiAlertCircle size={24} style={{ color: '#dc2626' }} />
							403 Forbidden - Missing Roles
						</PermissionsModalTitle>
						<PermissionsModalMessage>
							<strong>⚠️ The Metrics API uses ROLES, not scopes!</strong> Your Worker App needs a
							role assigned at the <strong>Environment</strong> level.
						</PermissionsModalMessage>
						<PermissionsModalMessage
							style={{
								marginTop: '0.5rem',
								padding: '0.5rem',
								background: '#fef3c7',
								border: '1px solid #fbbf24',
								borderRadius: '0.5rem',
								fontSize: '0.7rem',
							}}
						>
							💡 <strong>Tip:</strong> After assigning a role, you must generate a{' '}
							<strong>NEW</strong> worker token to pick up the permissions.
						</PermissionsModalMessage>
						<PermissionsModalInstructions>
							<strong>🔧 Fix in PingOne Admin Console:</strong>
							<ol style={{ marginLeft: '1.25rem', marginTop: '0.35rem' }}>
								<li>
									Applications → Your Worker App → <strong>Roles</strong> tab
								</li>
								<li>
									Click <strong>"Grant Roles"</strong>
								</li>
								<li>
									<strong style={{ color: '#dc2626' }}>Select your Environment</strong> (not
									Organization) from dropdown
								</li>
								<li>
									Assign the{' '}
									<code>
										<strong>Identity Data Admin</strong>
									</code>{' '}
									role
									<br />
									<span
										style={{
											fontSize: '0.65rem',
											color: '#6b7280',
											marginTop: '0.25rem',
											display: 'inline-block',
										}}
									>
										(Or <code>Environment Admin</code> which includes Identity Data Admin
										permissions)
									</span>
								</li>
								<li>
									Click <strong>"Save"</strong>
								</li>
							</ol>
							<strong style={{ marginTop: '0.75rem', display: 'block', color: '#059669' }}>
								✅ After assigning role:
							</strong>
							<ol style={{ marginLeft: '1.25rem', marginTop: '0.35rem' }}>
								<li>Click "Clear Token" on this page</li>
								<li>Click "Get Worker Token" (scopes don't matter for metrics)</li>
								<li>Retry "Fetch Total Identity Counts"</li>
							</ol>
						</PermissionsModalInstructions>
						<PermissionsModalActions>
							<PermissionsModalButton onClick={() => setShowPermissionsErrorModal(false)}>
								Close
							</PermissionsModalButton>
						</PermissionsModalActions>
					</PermissionsModalContent>
				</PermissionsModalOverlay>
			)}
		</PageContainer>
	);
};

export default PingOneIdentityMetrics;
