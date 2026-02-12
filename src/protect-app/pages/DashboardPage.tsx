import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentEvaluations } from '../components/dashboard/RecentEvaluations';
import { RiskScoreCard } from '../components/dashboard/RiskScoreCard';
import { RiskTrendsChart } from '../components/dashboard/RiskTrendsChart';
import { SecurityAlerts } from '../components/dashboard/SecurityAlerts';
import { SystemHealth } from '../components/dashboard/SystemHealth';
import { useAuth } from '../contexts/AuthContext';
import { useRisk } from '../contexts/RiskContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Dashboard Page
 *
 * Main dashboard showing:
 * - Current risk score overview
 * - Risk trends and analytics
 * - Recent risk evaluations
 * - Security alerts and notifications
 * - Quick actions for common tasks
 * - System health status
 */
export const DashboardPage: React.FC = () => {
	const { currentTheme } = useTheme();
	const { state: riskState, evaluateRisk, getCurrentEvaluation } = useRisk();
	const { state: authState } = useAuth();
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Load initial data
	useEffect(() => {
		const loadDashboardData = async () => {
			if (!authState.user?.id) return;

			try {
				// Create mock evaluation context
				const context = {
					ipAddress: '192.168.1.100',
					userAgent: navigator.userAgent,
					location: {
						country: 'United States',
						city: 'San Francisco',
						coordinates: { latitude: 37.7749, longitude: -122.4194 },
					},
					device: {
						type: 'desktop',
						os: 'macOS',
						browser: 'Chrome',
						fingerprint: 'mock-fingerprint',
					},
					session: {
						duration: Date.now() - (Date.now() - 3600000), // 1 hour ago
						pageViews: 15,
						authenticationMethod: 'password',
					},
				};

				await evaluateRisk(authState.user.id, context);
			} catch (error) {
				console.error('Failed to load dashboard data:', error);
			}
		};

		loadDashboardData();
	}, [authState.user?.id, evaluateRisk]);

	const handleRefreshRisk = async () => {
		if (!authState.user?.id) return;

		setIsRefreshing(true);
		try {
			const context = {
				ipAddress: '192.168.1.100',
				userAgent: navigator.userAgent,
				location: {
					country: 'United States',
					city: 'San Francisco',
					coordinates: { latitude: 37.7749, longitude: -122.4194 },
				},
				device: {
					type: 'desktop',
					os: 'macOS',
					browser: 'Chrome',
					fingerprint: 'mock-fingerprint',
				},
				session: {
					duration: Date.now() - (Date.now() - 3600000),
					pageViews: 15,
					authenticationMethod: 'password',
				},
			};

			await evaluateRisk(authState.user.id, context);
		} catch (error) {
			console.error('Failed to refresh risk evaluation:', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const currentEvaluation = getCurrentEvaluation();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold" style={{ color: currentTheme.colors.text }}>
						Security Dashboard
					</h1>
					<p className="text-lg mt-1" style={{ color: currentTheme.colors.textSecondary }}>
						Welcome back, {authState.user?.firstName || 'User'}! Here's your security overview.
					</p>
				</div>
				<button
					type="button"
					onClick={handleRefreshRisk}
					disabled={isRefreshing}
					className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
					style={{
						backgroundColor: currentTheme.colors.primary,
						color: currentTheme.colors.surface,
					}}
				>
					{isRefreshing ? (
						<div className="flex items-center space-x-2">
							<LoadingSpinner size="sm" color="white" />
							<span>Refreshing...</span>
						</div>
					) : (
						'Refresh Risk Score'
					)}
				</button>
			</div>

			{/* Risk Score Overview */}
			{currentEvaluation && <RiskScoreCard evaluation={currentEvaluation} />}

			{/* Main Dashboard Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{/* Risk Trends Chart */}
				<div className="xl:col-span-2">
					<RiskTrendsChart />
				</div>

				{/* Quick Actions */}
				<QuickActions />

				{/* Recent Evaluations */}
				<RecentEvaluations />

				{/* Security Alerts */}
				<SecurityAlerts />

				{/* System Health */}
				<SystemHealth />
			</div>

			{/* Loading State */}
			{riskState.isLoading && !currentEvaluation && (
				<div className="flex flex-col items-center justify-center py-12">
					<LoadingSpinner size="lg" />
					<p className="mt-4 text-lg" style={{ color: currentTheme.colors.textSecondary }}>
						Loading security data...
					</p>
				</div>
			)}

			{/* Error State */}
			{riskState.error && (
				<div
					className="p-6 rounded-lg border"
					style={{
						backgroundColor: `${currentTheme.colors.error}10`,
						borderColor: currentTheme.colors.error,
					}}
				>
					<div className="flex items-center space-x-3">
						<div className="text-2xl">🚨</div>
						<div>
							<h3 className="font-semibold" style={{ color: currentTheme.colors.error }}>
								Error Loading Data
							</h3>
							<p className="text-sm mt-1" style={{ color: currentTheme.colors.textSecondary }}>
								{riskState.error}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
