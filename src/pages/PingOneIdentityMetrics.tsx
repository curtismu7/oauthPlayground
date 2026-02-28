// src/pages/PingOneIdentityMetrics.tsx
// Visual explorer for PingOne Identity Counts API (totalIdentities & activeIdentityCounts)
// Updated with unified worker token management
// Cache bust: 2025-02-17-11:32

import React, { useCallback, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiBarChart,
	FiBarChart2,
	FiCalendar,
	FiClock,
	FiDatabase,
	FiInfo,
	FiRefreshCw,
	FiShield
} from '@icons';
import JSONHighlighter, { type JSONData } from '../components/JSONHighlighter';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import { apiRequestModalService } from '../services/apiRequestModalService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { ShowTokenConfigCheckboxV8 } from '../v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '../v8/components/SilentApiConfigCheckboxV8';
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';

const styles = {
	pageContainer: {
		maxWidth: '90rem',
		margin: '0 auto',
		padding: '2rem 1.5rem 4rem',
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '1.75rem',
	},
	headerCard: {
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '1rem',
		padding: '1.75rem',
		borderRadius: '1rem',
		background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
		border: '1px solid rgba(59, 130, 246, 0.2)',
	},
	titleRow: {
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.75rem',
		color: '#ffffff',
	},
	title: {
		margin: 0,
		fontSize: '1.75rem',
		fontWeight: 700,
		color: '#ffffff',
	},
	subtitle: {
		margin: 0,
		color: '#bfdbfe',
		maxWidth: '720px',
		lineHeight: 1.6,
	},
	layoutGrid: {
		display: 'grid' as const,
		gridTemplateColumns: '360px 1fr',
		gap: '1.75rem',
	},
	card: {
		background: '#ffffff',
		borderRadius: '1rem',
		border: '1px solid #e2e8f0',
		boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.18)',
		overflow: 'hidden' as const,
		padding: '1.5rem',
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '1.25rem',
	},
	sectionTitle: {
		margin: 0,
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
		fontSize: '1.1rem',
		fontWeight: 600,
		color: '#0f172a',
	},
	fieldGroup: {
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '0.5rem',
	},
	label: {
		fontWeight: 600,
		fontSize: '0.85rem',
		color: '#334155',
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.35rem',
	},
	input: {
		width: '100%',
		padding: '0.75rem 0.85rem',
		borderRadius: '0.75rem',
		border: '1px solid #cbd5f5',
		background: '#f8fafc',
		fontSize: '0.92rem',
	},
	select: {
		width: '100%',
		padding: '0.75rem 0.85rem',
		borderRadius: '0.75rem',
		border: '1px solid #cbd5f5',
		background: '#f8fafc',
		fontSize: '0.92rem',
		cursor: 'pointer' as const,
	},
	hint: {
		margin: 0,
		fontSize: '0.8rem',
		color: '#64748b',
	},
	buttonRow: {
		display: 'flex' as const,
		flexWrap: 'wrap' as const,
		gap: '0.75rem',
	},
	primaryButton: {
		border: 'none',
		borderRadius: '0.75rem',
		padding: '0.85rem 1.35rem',
		background: '#2563eb',
		color: 'white',
		fontWeight: 600,
		display: 'inline-flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
		cursor: 'pointer' as const,
	},
	dangerButton: {
		border: 'none',
		borderRadius: '0.75rem',
		padding: '0.85rem 1.35rem',
		background: '#ef4444',
		color: 'white',
		fontWeight: 600,
		display: 'inline-flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
		cursor: 'pointer' as const,
	},
	secondaryButton: {
		border: '1px solid #cbd5f5',
		borderRadius: '0.75rem',
		padding: '0.85rem 1.35rem',
		background: 'white',
		color: '#1e293b',
		fontWeight: 600,
		display: 'inline-flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
		cursor: 'pointer' as const,
	},
	warningBanner: {
		padding: '1rem 1.25rem',
		borderRadius: '0.85rem',
		border: '2px solid #fbbf24',
		background: '#fef3c7',
		color: '#92400e',
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '0.5rem',
		marginBottom: '1rem',
	},
	resultContainer: {
		display: 'flex' as const,
		flexDirection: 'column' as const,
		gap: '1rem',
	},
	emptyState: {
		padding: '2rem',
		borderRadius: '1rem',
		border: '1px dashed #cbd5f5',
		background: '#f8fafc',
		color: '#475569',
		display: 'flex' as const,
		flexDirection: 'column' as const,
		alignItems: 'center' as const,
		gap: '0.75rem',
	},
	errorBanner: {
		padding: '1rem 1.25rem',
		borderRadius: '0.85rem',
		border: '1px solid #fecaca',
		background: '#fef2f2',
		color: '#b91c1c',
		display: 'flex' as const,
		alignItems: 'flex-start' as const,
		gap: '0.75rem',
	},
	permissionsModalOverlay: {
		position: 'fixed' as const,
		inset: 0,
		background: 'rgba(0, 0, 0, 0.6)',
		display: 'flex' as const,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
		zIndex: 10000,
		backdropFilter: 'blur(4px)',
	},
	permissionsModalContent: {
		background: 'white',
		borderRadius: '0.75rem',
		padding: '1.25rem 1.5rem',
		maxWidth: '800px',
		width: 'calc(100vw - 4rem)',
		margin: '1rem',
		boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
		border: '3px solid #dc2626',
		maxHeight: 'calc(100vh - 4rem)',
		overflowY: 'auto' as const,
	},
	permissionsModalTitle: {
		fontSize: '1.1rem',
		fontWeight: 700,
		color: '#1f2937',
		margin: '0 0 0.65rem 0',
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
	},
	permissionsModalMessage: {
		fontSize: '0.8rem',
		color: '#374151',
		lineHeight: 1.35,
		margin: '0 0 0.65rem 0',
	},
	permissionsModalInstructions: {
		fontSize: '0.75rem',
		color: '#374151',
		lineHeight: 1.35,
		margin: '0 0 0.75rem 0',
		padding: '0.75rem',
		background: '#f3f4f6',
		borderRadius: '0.5rem',
		borderLeft: '4px solid #dc2626',
	},
	permissionsModalActions: {
		display: 'flex' as const,
		justifyContent: 'flex-end' as const,
		gap: '0.75rem',
	},
	permissionsModalButton: {
		padding: '0.55rem 1.25rem',
		background: '#3b82f6',
		color: 'white',
		border: 'none',
		borderRadius: '0.5rem',
		fontSize: '0.85rem',
		fontWeight: 600,
		cursor: 'pointer' as const,
	},
};

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
	const [showRawJson, setShowRawJson] = useState(false);

	// Use global worker token hook for unified token management
	const globalTokenStatus = useGlobalWorkerToken();
	const workerToken = globalTokenStatus.token || '';
	const hasWorkerToken = globalTokenStatus.isValid;

	const resetDates = () => setDateRange(defaultDateRange());

	// Clear the worker token (clears unified worker token)
	const _handleClearWorkerToken = useCallback(() => {
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
		<div style={styles.pageContainer}>
			<div style={styles.headerCard}>
				<div style={styles.titleRow}>
					<FiBarChart2 size={24} />
					<h1 style={styles.title}>PingOne Identity Counts</h1>
				</div>
				<p style={styles.subtitle}>
					Query PingOne active identity counts with time-series data and sampling periods. Requires{' '}
					<strong>Identity Data Admin</strong> role.
				</p>
				{!hasWorkerToken && (
					<div style={styles.warningBanner}>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
							<FiAlertCircle size={20} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
							<div style={{ flex: 1 }}>
								<strong>Worker Token Required</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									Click "Get Worker Token" below to generate a token with your PingOne credentials.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			<div style={styles.layoutGrid}>
				<div style={styles.card}>
					<h2 style={styles.sectionTitle}>
						<FiShield /> Authentication & Worker Token
					</h2>

					<WorkerTokenSectionV8 compact />

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
				</div>

				<div style={styles.card}>
					<h2 style={styles.sectionTitle}>
						<FiCalendar /> Metrics Configuration
					</h2>

					<div style={styles.fieldGroup}>
						<label htmlFor="metrics-endpoint-type" style={styles.label}>
							Endpoint Type
						</label>
						<select
							id="metrics-endpoint-type"
							style={styles.select}
							value={endpointType}
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
								setEndpointType(e.target.value as EndpointType)
							}
						>
							<option value="byDateRange">By Date Range</option>
							<option value="byLicense">By License</option>
							<option value="simple">Simple (No Filters)</option>
						</select>
						<p style={styles.hint}>
							{endpointType === 'byDateRange' && 'Filter by date range and sampling period'}
							{endpointType === 'byLicense' && 'Filter by license ID and sampling period'}
							{endpointType === 'simple' && 'Get recent counts without filters'}
						</p>
					</div>

					{endpointType === 'byDateRange' && (
						<>
							<div style={styles.fieldGroup}>
								<label htmlFor="metrics-start-date" style={styles.label}>
									Start date
								</label>
								<input
									id="metrics-start-date"
									style={styles.input}
									type="date"
									value={start}
									onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
								/>
							</div>
							<div style={styles.fieldGroup}>
								<label htmlFor="metrics-sampling-dr" style={styles.label}>
									Sampling Period
								</label>
								<select
									id="metrics-sampling-dr"
									style={styles.select}
									value={samplingPeriod}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										setSamplingPeriod(e.target.value)
									}
								>
									<option value="1">1 hour (hourly)</option>
									<option value="24">24 hours (daily)</option>
									<option value="168">168 hours (weekly)</option>
								</select>
								<p style={styles.hint}>
									Time interval for data points in the time-series response.
								</p>
							</div>
						</>
					)}

					{endpointType === 'byLicense' && (
						<>
							<div style={styles.fieldGroup}>
								<label htmlFor="metrics-license-id" style={styles.label}>
									License ID
								</label>
								<input
									id="metrics-license-id"
									style={styles.input}
									type="text"
									value={licenseId}
									onChange={(e) => setLicenseId(e.target.value)}
									placeholder="Enter license ID"
								/>
								<p style={styles.hint}>License ID to filter identity counts by.</p>
							</div>
							<div style={styles.fieldGroup}>
								<label htmlFor="metrics-sampling-lic" style={styles.label}>
									Sampling Period
								</label>
								<select
									id="metrics-sampling-lic"
									style={styles.select}
									value={samplingPeriod}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										setSamplingPeriod(e.target.value)
									}
								>
									<option value="1">1 hour (hourly)</option>
									<option value="24">24 hours (daily)</option>
									<option value="168">168 hours (weekly)</option>
								</select>
								<p style={styles.hint}>
									Time interval for data points in the time-series response.
								</p>
							</div>
						</>
					)}

					{endpointType === 'simple' && (
						<div style={styles.fieldGroup}>
							<label htmlFor="metrics-limit" style={styles.label}>
								Limit
							</label>
							<input
								id="metrics-limit"
								style={{ ...styles.input, background: '#f1f5f9', cursor: 'not-allowed' }}
								type="number"
								value="100"
								readOnly
							/>
							<p style={styles.hint}>Returns up to 100 most recent data points.</p>
						</div>
					)}

					<div style={styles.buttonRow}>
						<button
							style={{
								...styles.primaryButton,
								...(!hasWorkerToken || loading
									? { background: '#cbd5f5', cursor: 'not-allowed' }
									: {}),
							}}
							type="button"
							onClick={handleFetch}
							disabled={!hasWorkerToken || loading}
						>
							{loading ? (
								<>
									<FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> Fetching…
								</>
							) : (
								<>
									<FiBarChart2 /> Retrieve counts
								</>
							)}
						</button>

						<button type="button" style={styles.secondaryButton} onClick={resetDates}>
							<FiClock /> Reset dates
						</button>
					</div>

					{error && (
						<div style={styles.errorBanner}>
							<FiInfo size={18} style={{ marginTop: '0.2rem' }} />
							<span>{error}</span>
						</div>
					)}

					<div style={styles.resultContainer}>
						{metrics ? (
							<>
								{summary && (
									<div
										style={{
											...styles.card,
											border: '1px solid #10b981',
											background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
										}}
									>
										<h2 style={styles.sectionTitle}>
											<FiBarChart2 /> Summary Statistics
										</h2>
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
											<p
												style={{
													...styles.hint,
													marginTop: '1rem',
													paddingTop: '1rem',
													borderTop: '1px solid #d1fae5',
												}}
											>
												Last updated: {new Date(lastUpdated).toLocaleString()}
											</p>
										)}
									</div>
								)}

								<div style={{ ...styles.card, border: '1px solid #dbeafe', background: '#ffffff' }}>
									<h2 style={styles.sectionTitle}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
											<FiDatabase /> Full API Response
										</div>
										{formattedMetrics && (
											<div
												style={{
													display: 'flex',
													gap: '0.25rem',
													background: '#f1f5f9',
													borderRadius: '0.5rem',
													padding: '0.2rem',
												}}
											>
												<button
													type="button"
													onClick={() => setShowRawJson(false)}
													style={{
														padding: '0.25rem 0.75rem',
														borderRadius: '0.375rem',
														border: 'none',
														fontSize: '0.75rem',
														fontWeight: 600,
														cursor: 'pointer',
														background: !showRawJson ? '#3b82f6' : 'transparent',
														color: !showRawJson ? 'white' : '#64748b',
														transition: 'all 0.15s',
													}}
												>
													Formatted
												</button>
												<button
													type="button"
													onClick={() => setShowRawJson(true)}
													style={{
														padding: '0.25rem 0.75rem',
														borderRadius: '0.375rem',
														border: 'none',
														fontSize: '0.75rem',
														fontWeight: 600,
														cursor: 'pointer',
														background: showRawJson ? '#3b82f6' : 'transparent',
														color: showRawJson ? 'white' : '#64748b',
														transition: 'all 0.15s',
													}}
												>
													Raw JSON
												</button>
											</div>
										)}
									</h2>
									{formattedMetrics && (
										<div style={{ maxHeight: '600px', overflow: 'auto' }}>
											{showRawJson ? (
												<pre
													style={{
														margin: 0,
														padding: '1rem',
														background: '#0f172a',
														color: '#e2e8f0',
														borderRadius: '0.5rem',
														fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
														fontSize: '0.8rem',
														lineHeight: 1.6,
														whiteSpace: 'pre-wrap',
														wordBreak: 'break-all',
													}}
												>
													{JSON.stringify(metrics, null, 2)}
												</pre>
											) : (
												<JSONHighlighter data={formattedMetrics} />
											)}
										</div>
									)}
								</div>
							</>
						) : (
							<div style={styles.emptyState}>
								<FiBarChart2 size={22} />
								<span>Run the request to see active identity counts returned by PingOne.</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Permissions Error Modal */}
			{showPermissionsErrorModal && (
				<div style={styles.permissionsModalOverlay}>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="metrics-permissions-modal-title"
						style={styles.permissionsModalContent}
						onKeyDown={(e) => e.key === 'Escape' && setShowPermissionsErrorModal(false)}
					>
						<h2 style={styles.permissionsModalTitle}>
							<FiAlertCircle size={24} style={{ color: '#dc2626' }} />
							403 Forbidden - Missing Roles
						</h2>
						<p style={styles.permissionsModalMessage}>
							<strong>⚠️ The Metrics API uses ROLES, not scopes!</strong> Your Worker App needs a
							role assigned at the <strong>Environment</strong> level.
						</p>
						<p
							style={{
								...styles.permissionsModalMessage,
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
						</p>
						<div style={styles.permissionsModalInstructions}>
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
						</div>
						<div style={styles.permissionsModalActions}>
							<button
								type="button"
								style={styles.permissionsModalButton}
								onClick={() => setShowPermissionsErrorModal(false)}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PingOneIdentityMetrics;
