import React, { useState } from 'react';
import {
	FiAlertTriangle,
	FiClock,
	FiDownload,
	FiRefreshCw,
	FiShield,
	FiTrendingUp,
	FiUsers,
} from 'react-icons/fi';
import { BarChart3 } from 'lucide-react';
import styled from 'styled-components';
import { useAccessibility } from '../hooks/useAccessibility';
import { useAnalytics } from '../hooks/useAnalytics';

// Styled components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
`;

const DashboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const DashboardTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DashboardIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 12px;
  color: white;
  font-size: 24px;
`;

const DashboardActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid ${({ $variant, theme }) =>
		$variant === 'primary' ? theme.colors.primary : theme.colors.gray300};
  background: ${({ $variant, theme }) => ($variant === 'primary' ? theme.colors.primary : 'white')};
  color: ${({ $variant }) => ($variant === 'primary' ? 'white' : '#374151')};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${({ $variant, theme }) =>
			$variant === 'primary' ? theme.colors.primaryDark : theme.colors.gray100};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div<{ $metric: string }>`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const MetricTitle = styled.h3`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray600};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetricIcon = styled.div<{ $metric: string }>`
  color: ${({ $metric, theme }) => {
		switch ($metric) {
			case 'users':
				return theme.colors.primary;
			case 'performance':
				return theme.colors.success;
			case 'security':
				return theme.colors.warning;
			case 'errors':
				return theme.colors.danger;
			default:
				return theme.colors.gray500;
		}
	}};
  font-size: 1.25rem;
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

const MetricChange = styled.div<{ $positive?: boolean }>`
  font-size: 0.875rem;
  color: ${({ $positive, theme }) => ($positive ? theme.colors.success : theme.colors.danger)};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  padding: 1.5rem;
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const ChartTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
`;

const ChartContent = styled.div`
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.875rem;
`;

const EventsTable = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  overflow: hidden;
`;

const TableHeader = styled.div`
  background: ${({ theme }) => theme.colors.gray50};
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  
  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const TableContent = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: ${({ theme }) => theme.colors.gray25};
  }
  
  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.gray50};
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  color: ${({ theme }) => theme.colors.gray700};
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({ $status, theme }) => {
		switch ($status) {
			case 'success':
				return theme.colors.success;
			case 'error':
				return theme.colors.danger;
			case 'warning':
				return theme.colors.warning;
			case 'info':
				return theme.colors.info;
			default:
				return theme.colors.gray500;
		}
	}};
  color: white;
`;

// Mock data for demonstration
const mockMetrics = {
	totalUsers: 1247,
	activeSessions: 89,
	pageViews: 15632,
	bounceRate: 23.4,
	avgLoadTime: 1.2,
	errorRate: 0.8,
	securityEvents: 3,
	complianceScore: 98.5,
};

const mockEvents = [
	{
		id: '1',
		type: 'page_view',
		timestamp: Date.now() - 300000,
		user: 'user1',
		details: 'OAuth Flows page',
	},
	{
		id: '2',
		type: 'flow_start',
		timestamp: Date.now() - 240000,
		user: 'user2',
		details: 'Authorization Code flow',
	},
	{
		id: '3',
		type: 'flow_complete',
		timestamp: Date.now() - 180000,
		user: 'user1',
		details: 'Implicit Grant flow',
	},
	{
		id: '4',
		type: 'security_event',
		timestamp: Date.now() - 120000,
		user: 'user3',
		details: 'Suspicious activity detected',
	},
	{
		id: '5',
		type: 'error_event',
		timestamp: Date.now() - 60000,
		user: 'user2',
		details: 'Token validation failed',
	},
];

// Analytics Dashboard component
export const AnalyticsDashboard: React.FC = () => {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [selectedTimeRange] = useState('24h');
	const { announceToScreenReader } = useAccessibility();
	const { getAnalyticsData, flush } = useAnalytics({ enabled: true, debug: true });

	const [analyticsData, setAnalyticsData] = useState(mockMetrics);
	const [events, setEvents] = useState(mockEvents);

	// Refresh analytics data
	const handleRefresh = async () => {
		setIsRefreshing(true);
		announceToScreenReader('Refreshing analytics data');

		try {
			await flush();
			getAnalyticsData();

			// In a real implementation, this would fetch from your analytics API
			setTimeout(() => {
				setAnalyticsData(mockMetrics);
				setEvents(mockEvents);
				setIsRefreshing(false);
				announceToScreenReader('Analytics data refreshed successfully');
			}, 1000);
		} catch (error) {
			console.error('Failed to refresh analytics:', error);
			setIsRefreshing(false);
			announceToScreenReader('Failed to refresh analytics data');
		}
	};

	// Export analytics data
	const handleExport = () => {
		const exportData = {
			timestamp: new Date().toISOString(),
			timeRange: selectedTimeRange,
			metrics: analyticsData,
			events: events,
		};

		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = `analytics-export-${Date.now()}.json`;
		link.click();

		URL.revokeObjectURL(url);
		announceToScreenReader('Analytics data exported successfully');
	};

	// Format timestamp
	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleString();
	};

	// Get event type color
	const getEventTypeColor = (type: string) => {
		switch (type) {
			case 'page_view':
				return 'info';
			case 'flow_start':
				return 'info';
			case 'flow_complete':
				return 'success';
			case 'security_event':
				return 'warning';
			case 'error_event':
				return 'error';
			default:
				return 'info';
		}
	};

	return (
		<DashboardContainer role="main" aria-label="Analytics dashboard">
			<DashboardHeader>
				<DashboardTitle>
					<DashboardIcon>
						<BarChart3 size={24} />
					</DashboardIcon>
					Analytics Dashboard
				</DashboardTitle>

				<DashboardActions>
					<ActionButton
						$variant="secondary"
						onClick={handleRefresh}
						disabled={isRefreshing}
						aria-label="Refresh analytics data"
					>
						<FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
						{isRefreshing ? 'Refreshing...' : 'Refresh'}
					</ActionButton>

					<ActionButton
						$variant="primary"
						onClick={handleExport}
						aria-label="Export analytics data"
					>
						<FiDownload />
						Export Data
					</ActionButton>
				</DashboardActions>
			</DashboardHeader>

			<MetricsGrid>
				<MetricCard $metric="users">
					<MetricHeader>
						<MetricTitle>Total Users</MetricTitle>
						<MetricIcon $metric="users">
							<FiUsers />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>{analyticsData.totalUsers.toLocaleString()}</MetricValue>
					<MetricChange $positive={true}>
						<FiTrendingUp />
						+12.5% from last week
					</MetricChange>
				</MetricCard>

				<MetricCard $metric="performance">
					<MetricHeader>
						<MetricTitle>Avg Load Time</MetricTitle>
						<MetricIcon $metric="performance">
							<FiClock />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>{analyticsData.avgLoadTime}s</MetricValue>
					<MetricChange $positive={true}>
						<FiTrendingUp />
						-0.3s from last week
					</MetricChange>
				</MetricCard>

				<MetricCard $metric="security">
					<MetricHeader>
						<MetricTitle>Security Events</MetricTitle>
						<MetricIcon $metric="security">
							<FiShield />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>{analyticsData.securityEvents}</MetricValue>
					<MetricChange $positive={true}>
						<FiTrendingUp />
						-2 from last week
					</MetricChange>
				</MetricCard>

				<MetricCard $metric="errors">
					<MetricHeader>
						<MetricTitle>Error Rate</MetricTitle>
						<MetricIcon $metric="errors">
							<FiAlertTriangle />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>{analyticsData.errorRate}%</MetricValue>
					<MetricChange $positive={true}>
						<FiTrendingUp />
						-0.2% from last week
					</MetricChange>
				</MetricCard>
			</MetricsGrid>

			<ChartsGrid>
				<ChartCard>
					<ChartHeader>
						<ChartTitle>User Engagement</ChartTitle>
					</ChartHeader>
					<ChartContent>
						<div style={{ textAlign: 'center' }}>
							<BarChart3 size={48} style={{ marginBottom: '1rem' }} />
							<p>User engagement chart would be displayed here</p>
							<p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
								Integration with charting library required
							</p>
						</div>
					</ChartContent>
				</ChartCard>

				<ChartCard>
					<ChartHeader>
						<ChartTitle>Flow Performance</ChartTitle>
					</ChartHeader>
					<ChartContent>
						<div style={{ textAlign: 'center' }}>
							<FiTrendingUp style={{ fontSize: '3rem', marginBottom: '1rem' }} />
							<p>Flow performance chart would be displayed here</p>
							<p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
								Integration with charting library required
							</p>
						</div>
					</ChartContent>
				</ChartCard>
			</ChartsGrid>

			<EventsTable>
				<TableHeader>
					<h3>Recent Events</h3>
				</TableHeader>
				<TableContent>
					<Table>
						<thead>
							<TableRow>
								<TableHeaderCell>Type</TableHeaderCell>
								<TableHeaderCell>User</TableHeaderCell>
								<TableHeaderCell>Details</TableHeaderCell>
								<TableHeaderCell>Timestamp</TableHeaderCell>
							</TableRow>
						</thead>
						<tbody>
							{events.map((event) => (
								<TableRow key={event.id}>
									<TableCell>
										<StatusBadge $status={getEventTypeColor(event.type)}>
											{event.type.replace('_', ' ')}
										</StatusBadge>
									</TableCell>
									<TableCell>{event.user}</TableCell>
									<TableCell>{event.details}</TableCell>
									<TableCell>{formatTimestamp(event.timestamp)}</TableCell>
								</TableRow>
							))}
						</tbody>
					</Table>
				</TableContent>
			</EventsTable>
		</DashboardContainer>
	);
};

export default AnalyticsDashboard;
