import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { TokenUsageAnalytics, tokenLifecycleManager } from '../utils/tokenLifecycle';

const DashboardContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const DashboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const DashboardTitle = styled.h2`
  margin: 0;
  color: V9_COLORS.TEXT.GRAY_DARK;
  font-size: 1.5rem;
`;

const RefreshButton = styled.button`
  background-color: V9_COLORS.PRIMARY.BLUE;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: V9_COLORS.PRIMARY.BLUE_DARK;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-weight: 500;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: V9_COLORS.TEXT.GRAY_DARK;
  font-size: 1.125rem;
  font-weight: 600;
`;

const ChartContainer = styled.div`
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const BarChart = styled.div`
  display: flex;
  align-items: end;
  gap: 0.5rem;
  height: 200px;
  margin-bottom: 1rem;
`;

const Bar = styled.div<{ height: number; color: string }>`
  flex: 1;
  background: ${({ color }) => color};
  border-radius: 0.25rem 0.25rem 0 0;
  height: ${({ height }) => height}%;
  min-height: 20px;
  display: flex;
  align-items: end;
  justify-content: center;
  padding: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const BarLabel = styled.div`
  font-size: 0.75rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  text-align: center;
  margin-top: 0.5rem;
`;

const ActivityList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityInfo = styled.div`
  flex: 1;
`;

const ActivityAction = styled.div`
  font-weight: 500;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin-bottom: 0.25rem;
`;

const ActivityDetails = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const ActivityTime = styled.div`
  font-size: 0.75rem;
  color: V9_COLORS.TEXT.GRAY_LIGHT;
  white-space: nowrap;
  margin-left: 1rem;
`;

const CleanupButton = styled.button`
  background-color: V9_COLORS.PRIMARY.RED;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: V9_COLORS.PRIMARY.RED_DARK;
  }
`;

const ExportButton = styled.button`
  background-color: V9_COLORS.PRIMARY.GREEN;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  
  &:hover {
    background-color: V9_COLORS.PRIMARY.GREEN_DARK;
  }
`;

const TokenAnalyticsDashboard: React.FC = () => {
	const [analytics, setAnalytics] = useState<TokenUsageAnalytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadAnalytics = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = tokenLifecycleManager.getTokenUsageAnalytics();
			setAnalytics(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load analytics');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAnalytics();
	}, [loadAnalytics]);

	const handleCleanup = () => {
		const cleanedCount = tokenLifecycleManager.cleanupExpiredTokens();
		alert(`Cleaned up ${cleanedCount} expired tokens`);
		loadAnalytics();
	};

	const handleExport = () => {
		if (!analytics) return;

		const exportData = {
			...analytics,
			exportedAt: new Date().toISOString(),
			version: '1.0',
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `token-analytics-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	if (loading) {
		return (
			<DashboardContainer>
				<div>Loading analytics...</div>
			</DashboardContainer>
		);
	}

	if (error) {
		return (
			<DashboardContainer>
				<div style={{ color: 'V9_COLORS.PRIMARY.RED' }}>Error: {error}</div>
			</DashboardContainer>
		);
	}

	if (!analytics) {
		return (
			<DashboardContainer>
				<div>No analytics data available</div>
			</DashboardContainer>
		);
	}

	const maxUsage = Math.max(...Object.values(analytics.tokenUsageByFlow));
	const colors = [
		'V9_COLORS.PRIMARY.BLUE',
		'V9_COLORS.PRIMARY.GREEN',
		'V9_COLORS.PRIMARY.YELLOW',
		'V9_COLORS.PRIMARY.RED',
		'V9_COLORS.PRIMARY.GREEN',
		'#06b6d4',
	];

	return (
		<DashboardContainer>
			<DashboardHeader>
				<DashboardTitle>Token Usage Analytics</DashboardTitle>
				<div>
					<ExportButton onClick={handleExport}>Export Data</ExportButton>
					<CleanupButton onClick={handleCleanup}>Cleanup Expired</CleanupButton>
					<RefreshButton onClick={loadAnalytics}>Refresh</RefreshButton>
				</div>
			</DashboardHeader>

			<StatsGrid>
				<StatCard>
					<StatValue>{analytics.totalTokens}</StatValue>
					<StatLabel>Total Tokens</StatLabel>
				</StatCard>
				<StatCard>
					<StatValue style={{ color: 'V9_COLORS.PRIMARY.GREEN' }}>
						{analytics.activeTokens}
					</StatValue>
					<StatLabel>Active Tokens</StatLabel>
				</StatCard>
				<StatCard>
					<StatValue style={{ color: 'V9_COLORS.PRIMARY.RED' }}>
						{analytics.expiredTokens}
					</StatValue>
					<StatLabel>Expired Tokens</StatLabel>
				</StatCard>
				<StatCard>
					<StatValue>{Math.round(analytics.averageTokenLifetime)}m</StatValue>
					<StatLabel>Avg Lifetime</StatLabel>
				</StatCard>
			</StatsGrid>

			<Section>
				<SectionTitle>Token Usage by Flow Type</SectionTitle>
				<ChartContainer>
					<BarChart>
						{Object.entries(analytics.tokenUsageByFlow).map(([flowType, usage], index) => (
							<div key={flowType}>
								<Bar height={(usage / maxUsage) * 100} color={colors[index % colors.length]}>
									{usage}
								</Bar>
								<BarLabel>{flowType}</BarLabel>
							</div>
						))}
					</BarChart>
				</ChartContainer>
			</Section>

			<Section>
				<SectionTitle>Most Used Flow</SectionTitle>
				<div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
					{analytics.mostUsedFlow}
				</div>
			</Section>

			<Section>
				<SectionTitle>Recent Activity</SectionTitle>
				<ActivityList>
					{analytics.recentActivity.length === 0 ? (
						<div
							style={{ textAlign: 'center', color: 'V9_COLORS.TEXT.GRAY_MEDIUM', padding: '2rem' }}
						>
							No recent activity
						</div>
					) : (
						analytics.recentActivity.map((activity, index) => (
							<ActivityItem key={index}>
								<ActivityInfo>
									<ActivityAction>{activity.action.replace('_', ' ').toUpperCase()}</ActivityAction>
									<ActivityDetails>
										{activity.flowType} Token: {activity.tokenId.substring(0, 8)}...
									</ActivityDetails>
								</ActivityInfo>
								<ActivityTime>{activity.timestamp.toLocaleString()}</ActivityTime>
							</ActivityItem>
						))
					)}
				</ActivityList>
			</Section>
		</DashboardContainer>
	);
};

export default TokenAnalyticsDashboard;
