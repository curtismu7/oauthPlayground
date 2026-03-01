import {
	FiAlertTriangle,
	FiCheckCircle,
	FiDownload,
	FiEye,
	FiRefreshCw,
	FiShield,
	FiTrendingDown,
	FiTrendingUp,
	FiXCircle,
} from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAccessibility } from '../hooks/useAccessibility';
import { useSecurityAnalytics } from '../hooks/useSecurityAnalytics';
import { ComplianceStandard, SecuritySeverity } from '../utils/securityAnalytics';

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
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-radius: 12px;
  color: white;
  font-size: 24px;
`;

const DashboardActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid ${({ $variant, theme }) => {
		switch ($variant) {
			case 'primary':
				return theme.colors.primary;
			case 'danger':
				return theme.colors.danger;
			default:
				return theme.colors.gray300;
		}
	}};
  background: ${({ $variant, theme }) => {
		switch ($variant) {
			case 'primary':
				return theme.colors.primary;
			case 'danger':
				return theme.colors.danger;
			default:
				return 'white';
		}
	}};
  color: ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
			case 'danger':
				return 'white';
			default:
				return '#374151';
		}
	}};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${({ $variant, theme }) => {
			switch ($variant) {
				case 'primary':
					return theme.colors.primaryDark;
				case 'danger':
					return theme.colors.dangerDark;
				default:
					return theme.colors.gray100;
			}
		}};
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

const MetricCard = styled.div<{ $metric: string; $status?: 'good' | 'warning' | 'danger' }>`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ $status, theme }) => {
		switch ($status) {
			case 'good':
				return theme.colors.success;
			case 'warning':
				return theme.colors.warning;
			case 'danger':
				return theme.colors.danger;
			default:
				return theme.colors.gray200;
		}
	}};
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

const MetricIcon = styled.div<{ $metric: string; $status?: 'good' | 'warning' | 'danger' }>`
  color: ${({ $metric, $status, theme }) => {
		if ($status === 'danger') return theme.colors.danger;
		if ($status === 'warning') return theme.colors.warning;
		if ($status === 'good') return theme.colors.success;

		switch ($metric) {
			case 'security':
				return theme.colors.danger;
			case 'compliance':
				return theme.colors.success;
			case 'threats':
				return theme.colors.warning;
			case 'alerts':
				return theme.colors.info;
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

const StatusBadge = styled.span<{ $status: 'good' | 'warning' | 'danger' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({ $status, theme }) => {
		switch ($status) {
			case 'good':
				return theme.colors.success;
			case 'warning':
				return theme.colors.warning;
			case 'danger':
				return theme.colors.danger;
			default:
				return theme.colors.gray500;
		}
	}};
  color: white;
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

const AlertsTable = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  overflow: hidden;
  margin-bottom: 2rem;
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

const ComplianceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ComplianceCard = styled.div<{ $status: 'compliant' | 'partial' | 'non_compliant' }>`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 2px solid ${({ $status, theme }) => {
		switch ($status) {
			case 'compliant':
				return theme.colors.success;
			case 'partial':
				return theme.colors.warning;
			case 'non_compliant':
				return theme.colors.danger;
			default:
				return theme.colors.gray200;
		}
	}};
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const ComplianceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ComplianceTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
`;

const ComplianceScore = styled.div<{ $score: number }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ $score, theme }) => {
		if ($score >= 95) return theme.colors.success;
		if ($score >= 80) return theme.colors.warning;
		return theme.colors.danger;
	}};
`;

const ComplianceStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ComplianceIcon = styled.div<{ $status: 'compliant' | 'partial' | 'non_compliant' }>`
  color: ${({ $status, theme }) => {
		switch ($status) {
			case 'compliant':
				return theme.colors.success;
			case 'partial':
				return theme.colors.warning;
			case 'non_compliant':
				return theme.colors.danger;
			default:
				return theme.colors.gray500;
		}
	}};
  font-size: 1rem;
`;

const ComplianceDetails = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
  
  .violations {
    margin-top: 0.5rem;
    color: ${({ theme }) => theme.colors.danger};
  }
`;

// Security Analytics Dashboard component
export const SecurityAnalyticsDashboard: React.FC = () => {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const { announceToScreenReader } = useAccessibility();
	const {
		securityMetrics,
		complianceReports,
		securityAlerts,
		threatIntelligence,
		getCriticalAlerts,
		getHighSeverityAlerts,
		getOpenAlerts,
		getComplianceScore,
		getComplianceStatus,
		getSecurityRecommendations,
		getAverageRiskScore,
	} = useSecurityAnalytics({ enabled: true, debug: true });

	// Refresh security data
	const handleRefresh = async () => {
		setIsRefreshing(true);
		announceToScreenReader('Refreshing security analytics data');

		try {
			// In a real implementation, this would fetch from your security API
			setTimeout(() => {
				setIsRefreshing(false);
				announceToScreenReader('Security analytics data refreshed successfully');
			}, 1000);
		} catch (error) {
			console.error('Failed to refresh security analytics:', error);
			setIsRefreshing(false);
			announceToScreenReader('Failed to refresh security analytics data');
		}
	};

	// Export security data
	const handleExport = () => {
		const exportData = {
			timestamp: new Date().toISOString(),
			securityMetrics,
			complianceReports,
			securityAlerts: securityAlerts.slice(0, 10), // Last 10 alerts
			threatIntelligence: threatIntelligence.filter((t) => t.active),
			recommendations: getSecurityRecommendations(),
		};

		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = `security-analytics-export-${Date.now()}.json`;
		link.click();

		URL.revokeObjectURL(url);
		announceToScreenReader('Security analytics data exported successfully');
	};

	// Format timestamp
	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleString();
	};

	// Get severity color
	const getSeverityColor = (severity: SecuritySeverity) => {
		switch (severity) {
			case 'critical':
				return 'danger';
			case 'high':
				return 'danger';
			case 'medium':
				return 'warning';
			case 'low':
				return 'good';
			default:
				return 'good';
		}
	};

	// Get compliance status
	const getComplianceStatusInfo = (standard: ComplianceStandard) => {
		const score = getComplianceScore(standard);
		const status = getComplianceStatus(standard);

		return { score, status };
	};

	const criticalAlerts = getCriticalAlerts();
	const highSeverityAlerts = getHighSeverityAlerts();
	const _openAlerts = getOpenAlerts();
	const averageRiskScore = getAverageRiskScore();
	const recommendations = getSecurityRecommendations();

	return (
		<DashboardContainer role="main" aria-label="Security analytics dashboard">
			<DashboardHeader>
				<DashboardTitle>
					<DashboardIcon>
						<FiShield />
					</DashboardIcon>
					Security Analytics Dashboard
				</DashboardTitle>

				<DashboardActions>
					<ActionButton
						$variant="secondary"
						onClick={handleRefresh}
						disabled={isRefreshing}
						aria-label="Refresh security analytics data"
					>
						<FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
						{isRefreshing ? 'Refreshing...' : 'Refresh'}
					</ActionButton>

					<ActionButton
						$variant="primary"
						onClick={handleExport}
						aria-label="Export security analytics data"
					>
						<FiDownload />
						Export Data
					</ActionButton>
				</DashboardActions>
			</DashboardHeader>

			<MetricsGrid>
				<MetricCard
					$metric="security"
					$status={averageRiskScore > 70 ? 'danger' : averageRiskScore > 40 ? 'warning' : 'good'}
				>
					<MetricHeader>
						<MetricTitle>Security Risk Score</MetricTitle>
						<MetricIcon
							$metric="security"
							$status={
								averageRiskScore > 70 ? 'danger' : averageRiskScore > 40 ? 'warning' : 'good'
							}
						>
							<FiShield />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>{averageRiskScore.toFixed(1)}</MetricValue>
					<MetricChange $positive={averageRiskScore < 50}>
						{averageRiskScore < 50 ? <FiTrendingDown /> : <FiTrendingUp />}
						{averageRiskScore < 50 ? 'Low Risk' : 'High Risk'}
					</MetricChange>
				</MetricCard>

				<MetricCard
					$metric="alerts"
					$status={
						criticalAlerts.length > 0
							? 'danger'
							: highSeverityAlerts.length > 0
								? 'warning'
								: 'good'
					}
				>
					<MetricHeader>
						<MetricTitle>Critical Alerts</MetricTitle>
						<MetricIcon
							$metric="alerts"
							$status={
								criticalAlerts.length > 0
									? 'danger'
									: highSeverityAlerts.length > 0
										? 'warning'
										: 'good'
							}
						>
							<FiAlertTriangle />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>{criticalAlerts.length}</MetricValue>
					<MetricChange $positive={criticalAlerts.length === 0}>
						{criticalAlerts.length === 0 ? <FiCheckCircle /> : <FiXCircle />}
						{criticalAlerts.length === 0 ? 'All Clear' : 'Action Required'}
					</MetricChange>
				</MetricCard>

				<MetricCard
					$metric="threats"
					$status={
						threatIntelligence.filter((t) => t.severity === 'critical').length > 0
							? 'danger'
							: 'good'
					}
				>
					<MetricHeader>
						<MetricTitle>Active Threats</MetricTitle>
						<MetricIcon
							$metric="threats"
							$status={
								threatIntelligence.filter((t) => t.severity === 'critical').length > 0
									? 'danger'
									: 'good'
							}
						>
							<FiEye />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>{threatIntelligence.filter((t) => t.active).length}</MetricValue>
					<MetricChange
						$positive={threatIntelligence.filter((t) => t.severity === 'critical').length === 0}
					>
						{threatIntelligence.filter((t) => t.severity === 'critical').length === 0 ? (
							<FiCheckCircle />
						) : (
							<FiAlertTriangle />
						)}
						{threatIntelligence.filter((t) => t.severity === 'critical').length === 0
							? 'No Critical Threats'
							: 'Critical Threats Detected'}
					</MetricChange>
				</MetricCard>

				<MetricCard
					$metric="compliance"
					$status={complianceReports.some((r) => r.score < 80) ? 'warning' : 'good'}
				>
					<MetricHeader>
						<MetricTitle>Compliance Score</MetricTitle>
						<MetricIcon
							$metric="compliance"
							$status={complianceReports.some((r) => r.score < 80) ? 'warning' : 'good'}
						>
							<FiCheckCircle />
						</MetricIcon>
					</MetricHeader>
					<MetricValue>
						{complianceReports.length > 0
							? (
									complianceReports.reduce((sum, r) => sum + r.score, 0) / complianceReports.length
								).toFixed(1)
							: '100'}
					</MetricValue>
					<MetricChange $positive={complianceReports.every((r) => r.score >= 95)}>
						{complianceReports.every((r) => r.score >= 95) ? (
							<FiCheckCircle />
						) : (
							<FiAlertTriangle />
						)}
						{complianceReports.every((r) => r.score >= 95)
							? 'Fully Compliant'
							: 'Compliance Issues'}
					</MetricChange>
				</MetricCard>
			</MetricsGrid>

			<ComplianceGrid>
				{(['GDPR', 'CCPA', 'SOC2', 'OAuth2.1'] as ComplianceStandard[]).map((standard) => {
					const { score, status } = getComplianceStatusInfo(standard);
					return (
						<ComplianceCard key={standard} $status={status}>
							<ComplianceHeader>
								<ComplianceTitle>{standard}</ComplianceTitle>
								<ComplianceScore $score={score}>{score}</ComplianceScore>
							</ComplianceHeader>

							<ComplianceStatus>
								<ComplianceIcon $status={status}>
									{status === 'compliant' ? (
										<FiCheckCircle />
									) : status === 'partial' ? (
										<FiAlertTriangle />
									) : (
										<FiXCircle />
									)}
								</ComplianceIcon>
								<StatusBadge
									$status={
										status === 'compliant' ? 'good' : status === 'partial' ? 'warning' : 'danger'
									}
								>
									{status.replace('_', ' ')}
								</StatusBadge>
							</ComplianceStatus>

							<ComplianceDetails>
								<div>Last audit: {formatTimestamp(Date.now() - 86400000)}</div>
								<div>Next audit: {formatTimestamp(Date.now() + 86400000)}</div>
								{score < 95 && (
									<div className="violations">
										{complianceReports.find((r) => r.standard === standard)?.violations.length || 0}{' '}
										violations
									</div>
								)}
							</ComplianceDetails>
						</ComplianceCard>
					);
				})}
			</ComplianceGrid>

			<ChartsGrid>
				<ChartCard>
					<ChartHeader>
						<ChartTitle>Security Events Trend</ChartTitle>
					</ChartHeader>
					<ChartContent>
						<div style={{ textAlign: 'center' }}>
							<FiTrendingUp style={{ fontSize: '3rem', marginBottom: '1rem' }} />
							<p>Security events trend chart would be displayed here</p>
							<p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
								Integration with charting library required
							</p>
						</div>
					</ChartContent>
				</ChartCard>

				<ChartCard>
					<ChartHeader>
						<ChartTitle>Threat Intelligence</ChartTitle>
					</ChartHeader>
					<ChartContent>
						<div style={{ textAlign: 'center' }}>
							<FiShield style={{ fontSize: '3rem', marginBottom: '1rem' }} />
							<p>Threat intelligence chart would be displayed here</p>
							<p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
								Integration with charting library required
							</p>
						</div>
					</ChartContent>
				</ChartCard>
			</ChartsGrid>

			<AlertsTable>
				<TableHeader>
					<h3>Recent Security Alerts</h3>
				</TableHeader>
				<TableContent>
					<Table>
						<thead>
							<TableRow>
								<TableHeaderCell>Severity</TableHeaderCell>
								<TableHeaderCell>Title</TableHeaderCell>
								<TableHeaderCell>Source</TableHeaderCell>
								<TableHeaderCell>Status</TableHeaderCell>
								<TableHeaderCell>Timestamp</TableHeaderCell>
							</TableRow>
						</thead>
						<tbody>
							{securityAlerts.slice(0, 10).map((alert) => (
								<TableRow key={alert.id}>
									<TableCell>
										<StatusBadge $status={getSeverityColor(alert.severity)}>
											{alert.severity}
										</StatusBadge>
									</TableCell>
									<TableCell>{alert.title}</TableCell>
									<TableCell>{alert.source}</TableCell>
									<TableCell>
										<StatusBadge $status={alert.status === 'resolved' ? 'good' : 'warning'}>
											{alert.status}
										</StatusBadge>
									</TableCell>
									<TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
								</TableRow>
							))}
						</tbody>
					</Table>
				</TableContent>
			</AlertsTable>

			{recommendations.length > 0 && (
				<ChartCard>
					<ChartHeader>
						<ChartTitle>Security Recommendations</ChartTitle>
					</ChartHeader>
					<ChartContent>
						<div style={{ textAlign: 'left', width: '100%' }}>
							<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
								{recommendations.map((recommendation, index) => (
									<li key={index} style={{ marginBottom: '0.5rem', color: '#374151' }}>
										{recommendation}
									</li>
								))}
							</ul>
						</div>
					</ChartContent>
				</ChartCard>
			)}
		</DashboardContainer>
	);
};

export default SecurityAnalyticsDashboard;
