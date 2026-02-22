// src/pages/PingOneIdentityMetrics.PingUI.tsx
// Visual explorer for PingOne Identity Counts API - PingOne UI Version
// PingOne UI migration following pingui2.md standards

import React, { useCallback, useMemo, useState } from 'react';
import JSONHighlighter, { type JSONData } from '../components/JSONHighlighter';
import { WorkerTokenButton } from '../components/WorkerTokenButton';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import { apiRequestModalService } from '../services/apiRequestModalService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { ShowTokenConfigCheckboxV8 } from '../v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '../v8/components/SilentApiConfigCheckboxV8';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			title={title}
		/>
	);
};

// Interfaces
interface IdentityMetricsData {
	totalIdentities?: number;
	activeIdentityCounts?: {
		[key: string]: number;
	};
	lastUpdated?: string;
	[key: string]: unknown;
}

interface MetricCard {
	title: string;
	value: number | string;
	description?: string;
	icon: string;
	color: string;
}

// PingOne UI Styled Components (using inline styles with CSS variables)
const getContainerStyle = () => ({
	maxWidth: '90rem',
	margin: '0 auto',
	padding:
		'var(--pingone-spacing-xl, 2rem) var(--pingone-spacing-lg, 1.5rem) var(--pingone-spacing-2xl, 4rem)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--pingone-spacing-lg, 1.75rem)',
});

const getHeaderStyle = () => ({
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--pingone-spacing-md, 1rem)',
	padding: 'var(--pingone-spacing-xl, 1.75rem)',
	borderRadius: 'var(--pingone-border-radius-lg, 1rem)',
	background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04))',
	border: '1px solid rgba(59, 130, 246, 0.2)',
	boxShadow: 'var(--pingone-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))',
});

const getTitleRowStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-md, 0.75rem)',
});

const getTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-3xl, 2.5rem)',
	fontWeight: 'var(--pingone-font-weight-bold, 700)',
	color: 'var(--pingone-text-primary)',
	margin: '0',
});

const getSubtitleStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	margin: '0',
});

const getCardStyle = () => ({
	background: 'var(--pingone-surface-card)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.5rem)',
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	boxShadow: 'var(--pingone-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1))',
});

const getMetricsGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
	gap: 'var(--pingone-spacing-md, 1rem)',
	marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
});

const getMetricCardStyle = (color: string) => ({
	background: `linear-gradient(135deg, ${color}15, ${color}08)`,
	border: `1px solid ${color}30`,
	borderRadius: 'var(--pingone-border-radius-md, 0.5rem)',
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	position: 'relative' as const,
	overflow: 'hidden',
	transition: 'all 0.15s ease-in-out',
	'&:hover': {
		transform: 'translateY(-2px)',
		boxShadow: 'var(--pingone-shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.1))',
	},
});

const getMetricIconStyle = (color: string) => ({
	background: color,
	color: 'white',
	width: '48px',
	height: '48px',
	borderRadius: 'var(--pingone-border-radius-md, 0.5rem)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
});

const getMetricValueStyle = () => ({
	fontSize: 'var(--pingone-font-size-3xl, 2.5rem)',
	fontWeight: 'var(--pingone-font-weight-bold, 700)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-sm, 0.5rem)',
});

const getMetricTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-xs, 0.25rem)',
});

const getMetricDescriptionStyle = () => ({
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	color: 'var(--pingone-text-secondary)',
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => ({
	background:
		variant === 'primary' ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: variant === 'primary' ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	padding: 'var(--pingone-spacing-md, 1rem) var(--pingone-spacing-lg, 1.5rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-xs, 0.25rem)',
	'&:hover': {
		background:
			variant === 'primary'
				? 'var(--pingone-brand-primary-dark)'
				: 'var(--pingone-surface-tertiary)',
		transform: 'translateY(-1px)',
		boxShadow: 'var(--pingone-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))',
	},
	'&:disabled': {
		opacity: '0.5',
		cursor: 'not-allowed',
		transform: 'none',
	},
});

const getSectionTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
});

const getEmptyStateStyle = () => ({
	textAlign: 'center',
	padding: 'var(--pingone-spacing-2xl, 3rem)',
	color: 'var(--pingone-text-secondary)',
	fontStyle: 'italic',
});

const PingOneIdentityMetricsPingUI: React.FC = () => {
	const [metrics, setMetrics] = useState<IdentityMetricsData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [showTokenConfig, setShowTokenConfig] = useState(false);
	const [silentApiConfig, setSilentApiConfig] = useState(false);

	const { workerToken, clearWorkerToken } = useGlobalWorkerToken();

	const fetchMetrics = useCallback(async () => {
		setIsLoading(true);
		setError('');

		try {
			// Mock API call for identity metrics
			// In real implementation, this would call the PingOne Identity Counts API
			const mockData: IdentityMetricsData = {
				totalIdentities: 15420,
				activeIdentityCounts: {
					users: 12850,
					admin_users: 156,
					service_accounts: 2414,
					api_clients: 890,
					mobile_users: 3210,
					desktop_users: 9640,
				},
				lastUpdated: new Date().toISOString(),
			};

			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setMetrics(mockData);
			v4ToastManager.showSuccess('Identity metrics loaded successfully');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(`Failed to fetch identity metrics: ${errorMessage}`);
			v4ToastManager.showError('Failed to load identity metrics');
		} finally {
			setIsLoading(false);
		}
	}, []);

	const metricCards = useMemo((): MetricCard[] => {
		if (!metrics) return [];

		const cards: MetricCard[] = [
			{
				title: 'Total Identities',
				value: metrics.totalIdentities || 0,
				description: 'All identity records in the environment',
				icon: 'account-multiple',
				color: '#3b82f6',
			},
		];

		if (metrics.activeIdentityCounts) {
			Object.entries(metrics.activeIdentityCounts).forEach(([key, value]) => {
				const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
				cards.push({
					title: formattedKey,
					value: value,
					description: `Active ${formattedKey.toLowerCase()}`,
					icon: getIconForMetric(key),
					color: getColorForMetric(key),
				});
			});
		}

		return cards;
	}, [metrics, getColorForMetric, getIconForMetric]);

	const getIconForMetric = (key: string): string => {
		const iconMap: Record<string, string> = {
			users: 'account',
			admin_users: 'shield-account',
			service_accounts: 'server',
			api_clients: 'api',
			mobile_users: 'cellphone',
			desktop_users: 'desktop-classic',
		};
		return iconMap[key] || 'account';
	};

	const getColorForMetric = (key: string): string => {
		const colorMap: Record<string, string> = {
			users: '#10b981',
			admin_users: '#f59e0b',
			service_accounts: '#8b5cf6',
			api_clients: '#ef4444',
			mobile_users: '#06b6d4',
			desktop_users: '#6366f1',
		};
		return colorMap[key] || '#6b7280';
	};

	const exportData = useCallback(() => {
		if (!metrics) return;

		const dataStr = JSON.stringify(metrics, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `identity-metrics-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		v4ToastManager.showSuccess('Metrics data exported successfully');
	}, [metrics]);

	return (
		<div className="end-user-nano">
			<div style={getContainerStyle()}>
				{/* Header */}
				<div style={getHeaderStyle()}>
					<div style={getTitleRowStyle()}>
						<MDIIcon icon="chart-bar" size={32} title="Identity Metrics" />
						<h1 style={getTitleStyle()}>PingOne Identity Metrics</h1>
					</div>
					<p style={getSubtitleStyle()}>
						Visual explorer for PingOne Identity Counts API - Monitor total identities and active
						user counts
					</p>

					<div
						style={{
							display: 'flex',
							gap: 'var(--pingone-spacing-md, 1rem)',
							alignItems: 'center',
							flexWrap: 'wrap',
						}}
					>
						<button
							type="button"
							onClick={fetchMetrics}
							disabled={isLoading}
							style={getButtonStyle('primary')}
						>
							<MDIIcon
								icon={isLoading ? 'loading' : 'refresh'}
								size={16}
								className={isLoading ? 'mdi-spin' : ''}
							/>
							{isLoading ? 'Loading...' : 'Refresh Metrics'}
						</button>

						<button
							type="button"
							onClick={exportData}
							disabled={!metrics || isLoading}
							style={getButtonStyle('secondary')}
						>
							<MDIIcon icon="download" size={16} />
							Export Data
						</button>

						<WorkerTokenButton />

						<ShowTokenConfigCheckboxV8
							showTokenConfig={showTokenConfig}
							setShowTokenConfig={setShowTokenConfig}
						/>

						<SilentApiConfigCheckboxV8
							silentApiConfig={silentApiConfig}
							setSilentApiConfig={setSilentApiConfig}
						/>
					</div>
				</div>

				{/* Worker Token Banner */}
				<WorkerTokenDetectedBanner
					workerToken={workerToken}
					onClearToken={clearWorkerToken}
					onManageToken={() => apiRequestModalService.showWorkerTokenModal()}
				/>

				{/* Error Display */}
				{error && (
					<div
						style={{
							background: 'var(--pingone-surface-error)',
							border: '1px solid var(--pingone-border-error)',
							borderRadius: 'var(--pingone-border-radius-md, 0.5rem)',
							padding: 'var(--pingone-spacing-md, 1rem)',
							marginBottom: 'var(--pingone-spacing-md, 1rem)',
							color: 'var(--pingone-text-error)',
						}}
					>
						<strong>Error:</strong> {error}
					</div>
				)}

				{/* Metrics Display */}
				{metrics ? (
					<>
						{/* Metrics Cards */}
						<div style={getMetricsGridStyle()}>
							{metricCards.map((card, index) => (
								<div key={index} style={getMetricCardStyle(card.color)}>
									<div style={getMetricIconStyle(card.color)}>
										<MDIIcon icon={card.icon} size={24} />
									</div>
									<div style={getMetricValueStyle()}>
										{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
									</div>
									<div style={getMetricTitleStyle()}>{card.title}</div>
									{card.description && (
										<div style={getMetricDescriptionStyle()}>{card.description}</div>
									)}
								</div>
							))}
						</div>

						{/* Last Updated */}
						{metrics.lastUpdated && (
							<div
								style={{
									textAlign: 'center',
									color: 'var(--pingone-text-tertiary)',
									fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
									marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
								}}
							>
								Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
							</div>
						)}

						{/* Raw Data Display */}
						<div style={getCardStyle()}>
							<h2 style={getSectionTitleStyle()}>
								<MDIIcon icon="code-json" size={20} title="Raw Data" />
								Raw API Response
							</h2>
							<JSONHighlighter data={metrics as JSONData} />
						</div>
					</>
				) : (
					!isLoading && (
						<div style={getEmptyStateStyle()}>
							<MDIIcon
								icon="chart-bar"
								size={48}
								style={{ marginBottom: 'var(--pingone-spacing-md, 1rem)', opacity: 0.5 }}
							/>
							<div>No metrics data available</div>
							<div
								style={{
									fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
									marginTop: 'var(--pingone-spacing-md, 1rem)',
								}}
							>
								Click "Refresh Metrics" to load identity metrics from the PingOne API
							</div>
						</div>
					)
				)}
			</div>
		</div>
	);
};

export default PingOneIdentityMetricsPingUI;
