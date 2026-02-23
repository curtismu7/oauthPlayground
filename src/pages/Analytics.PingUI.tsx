/**
 * @file Analytics.PingUI.tsx
 * @module pages
 * @description Analytics page with PingOne UI styling
 * @version 1.0.0
 * @since 2026-02-22
 */

import React from 'react';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import PageTitle from '../components/PageTitle';

// MDI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 20, ariaLabel, className = '', style }) => {
	const iconMap: Record<string, string> = {
		chart: 'mdi-chart-line',
		analytics: 'mdi-google-analytics',
		dashboard: 'mdi-view-dashboard',
		bar: 'mdi-chart-bar',
		pie: 'mdi-chart-pie',
		trending: 'mdi-trending-up',
		users: 'mdi-account-group',
		security: 'mdi-shield',
		performance: 'mdi-speedometer',
		monitor: 'mdi-monitor',
		data: 'mdi-database',
		report: 'mdi-file-chart',
		globe: 'mdi-earth',
		clock: 'mdi-clock',
		calendar: 'mdi-calendar',
		filter: 'mdi-filter',
		search: 'mdi-magnify',
		export: 'mdi-download',
		refresh: 'mdi-refresh',
		settings: 'mdi-cog',
		help: 'mdi-help-circle',
		info: 'mdi-information',
		warning: 'mdi-alert',
		error: 'mdi-alert-circle',
		success: 'mdi-check-circle',
	};

	const iconClass = iconMap[icon] || icon;
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			title={ariaLabel}
			aria-hidden={!ariaLabel}
		/>
	);
};

// Main Component
const AnalyticsPingUI: React.FC = () => {
	return (
		<div className="end-user-nano">
			<style>
				{`
					.analytics-pingui {
						min-height: 100vh;
						background: var(--ping-gradient-primary, linear-gradient(135deg, var(--ping-surface-secondary, #f8fafc) 0%, var(--ping-surface-tertiary, #f1f5f9) 100%));
						padding: var(--ping-spacing-lg, 1.5rem) 0;
						font-family: var(--ping-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
					}

					.analytics-pingui .content-container {
						max-width: 1400px;
						margin: 0 auto;
						padding: 0 var(--ping-spacing-md, 1rem);
					}

					.analytics-pingui .page-header {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
						box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
					}

					.analytics-pingui .page-title {
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-md, 1rem);
						margin-bottom: var(--ping-spacing-sm, 0.5rem);
					}

					.analytics-pingui .page-title h1 {
						font-size: var(--ping-font-size-3xl, 2.5rem);
						font-weight: var(--ping-font-weight-bold, 700);
						color: var(--ping-text-primary, #1a1a1a);
						margin: 0;
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
					}

					.analytics-pingui .page-title .icon {
						color: var(--ping-color-primary, #3b82f6);
					}

					.analytics-pingui .page-subtitle {
						font-size: var(--ping-font-size-lg, 1.125rem);
						color: var(--ping-text-secondary, #666);
						margin: 0;
						line-height: 1.6;
					}

					.analytics-pingui .dashboard-container {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
					}

					.analytics-pingui .stats-grid {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
						gap: var(--ping-spacing-lg, 1.5rem);
						margin-bottom: var(--ping-spacing-xl, 2rem);
					}

					.analytics-pingui .stat-card {
						background: var(--ping-surface-secondary, #f8fafc);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-lg, 1.5rem);
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.analytics-pingui .stat-card:hover {
						background: var(--ping-surface-tertiary, #f1f5f9);
						border-color: var(--ping-border-primary, #d1d5db);
						transform: translateY(-2px);
						box-shadow: var(--ping-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
					}

					.analytics-pingui .stat-header {
						display: flex;
						align-items: center;
						justify-content: space-between;
						margin-bottom: var(--ping-spacing-md, 1rem);
					}

					.analytics-pingui .stat-title {
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						color: var(--ping-text-secondary, #666);
						text-transform: uppercase;
						letter-spacing: 0.05em;
					}

					.analytics-pingui .stat-icon {
						color: var(--ping-color-primary, #3b82f6);
					}

					.analytics-pingui .stat-value {
						font-size: var(--ping-font-size-3xl, 2.5rem);
						font-weight: var(--ping-font-weight-bold, 700);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-xs, 0.25rem);
					}

					.analytics-pingui .stat-change {
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-xs, 0.25rem);
					}

					.analytics-pingui .stat-change.positive {
						color: var(--ping-color-success, #10b981);
					}

					.analytics-pingui .stat-change.negative {
						color: var(--ping-color-error, #ef4444);
					}

					.analytics-pingui .chart-container {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
						box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
					}

					.analytics-pingui .chart-header {
						display: flex;
						align-items: center;
						justify-content: space-between;
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.analytics-pingui .chart-title {
						font-size: var(--ping-font-size-xl, 1.25rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-text-primary, #1a1a1a);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
					}

					.analytics-pingui .chart-controls {
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
					}

					.analytics-pingui .control-button {
						background: var(--ping-surface-secondary, #f8fafc);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-md, 0.5rem);
						padding: var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem);
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						color: var(--ping-text-primary, #1a1a1a);
						cursor: pointer;
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-xs, 0.25rem);
					}

					.analytics-pingui .control-button:hover {
						background: var(--ping-surface-tertiary, #f1f5f9);
						border-color: var(--ping-border-primary, #d1d5db);
					}

					.analytics-pingui .control-button.active {
						background: var(--ping-color-primary, #3b82f6);
						color: var(--ping-color-white, #ffffff);
						border-color: var(--ping-color-primary, #3b82f6);
					}

					.analytics-pingui .activity-feed {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
					}

					.analytics-pingui .activity-header {
						display: flex;
						align-items: center;
						justify-content: space-between;
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.analytics-pingui .activity-title {
						font-size: var(--ping-font-size-xl, 1.25rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-text-primary, #1a1a1a);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
					}

					.analytics-pingui .activity-list {
						display: flex;
						flex-direction: column;
						gap: var(--ping-spacing-md, 1rem);
					}

					.analytics-pingui .activity-item {
						display: flex;
						align-items: flex-start;
						gap: var(--ping-spacing-md, 1rem);
						padding: var(--ping-spacing-md, 1rem);
						background: var(--ping-surface-secondary, #f8fafc);
						border-radius: var(--ping-radius-md, 0.5rem);
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.analytics-pingui .activity-item:hover {
						background: var(--ping-surface-tertiary, #f1f5f9);
					}

					.analytics-pingui .activity-icon {
						color: var(--ping-color-primary, #3b82f6);
						flex-shrink: 0;
						margin-top: 2px;
					}

					.analytics-pingui .activity-content {
						flex: 1;
					}

					.analytics-pingui .activity-title {
						font-size: var(--ping-font-size-base, 1rem);
						font-weight: var(--ping-font-weight-medium, 500);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-xs, 0.25rem);
					}

					.analytics-pingui .activity-description {
						font-size: var(--ping-font-size-sm, 0.875rem);
						color: var(--ping-text-secondary, #666);
						line-height: 1.5;
					}

					.analytics-pingui .activity-time {
						font-size: var(--ping-font-size-xs, 0.75rem);
						color: var(--ping-text-tertiary, #9ca3af);
						margin-top: var(--ping-spacing-xs, 0.25rem);
					}

					@media (max-width: 768px) {
						.analytics-pingui {
							padding: var(--ping-spacing-md, 1rem) 0;
						}

						.analytics-pingui .content-container {
							padding: 0 var(--ping-spacing-sm, 0.5rem);
						}

						.analytics-pingui .page-header,
						.analytics-pingui .dashboard-container,
						.analytics-pingui .chart-container,
						.analytics-pingui .activity-feed {
							padding: var(--ping-spacing-lg, 1.5rem);
						}

						.analytics-pingui .page-title h1 {
							font-size: var(--ping-font-size-2xl, 2rem);
						}

						.analytics-pingui .stats-grid {
							grid-template-columns: 1fr;
						}

						.analytics-pingui .chart-header,
						.analytics-pingui .activity-header {
							flex-direction: column;
							align-items: flex-start;
							gap: var(--ping-spacing-md, 1rem);
						}

						.analytics-pingui .chart-controls {
							width: 100%;
							justify-content: space-between;
						}
					}
				`}
			</style>

			<div className="analytics-pingui">
				<div className="content-container">
					{/* Page Header */}
					<div className="page-header">
						<div className="page-title">
							<h1>
								<MDIIcon icon="analytics" size={32} className="icon" />
								Analytics Dashboard
							</h1>
						</div>
						<p className="page-subtitle">
							Monitor user behavior, performance metrics, and security events across your OAuth
							flows
						</p>
					</div>

					{/* Analytics Dashboard Component */}
					<AnalyticsDashboard />
				</div>
			</div>
		</div>
	);
};

export default AnalyticsPingUI;
