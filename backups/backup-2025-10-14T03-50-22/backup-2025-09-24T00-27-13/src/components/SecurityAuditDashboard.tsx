import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
	SecurityAuditReport,
	SecurityVulnerability,
	securityAuditor,
} from '../utils/securityAudit';

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
  color: #1f2937;
  font-size: 1.5rem;
`;

const SecurityScore = styled.div<{ score: number }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1.25rem;
  
  ${({ score }) => {
		if (score >= 90) {
			return `
        background-color: #dcfce7;
        color: #166534;
        border: 2px solid #22c55e;
      `;
		} else if (score >= 70) {
			return `
        background-color: #fef3c7;
        color: #92400e;
        border: 2px solid #f59e0b;
      `;
		} else if (score >= 50) {
			return `
        background-color: #fed7aa;
        color: #9a3412;
        border: 2px solid #fb923c;
      `;
		} else {
			return `
        background-color: #fecaca;
        color: #991b1b;
        border: 2px solid #ef4444;
      `;
		}
	}}
`;

const ScoreCircle = styled.div<{ score: number }>`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  
  ${({ score }) => {
		if (score >= 90) {
			return `
        background-color: #22c55e;
        color: white;
      `;
		} else if (score >= 70) {
			return `
        background-color: #f59e0b;
        color: white;
      `;
		} else if (score >= 50) {
			return `
        background-color: #fb923c;
        color: white;
      `;
		} else {
			return `
        background-color: #ef4444;
        color: white;
      `;
		}
	}}
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
			case 'secondary':
				return `
          background-color: #6b7280;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
			case 'success':
				return `
          background-color: #10b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
			case 'danger':
				return `
          background-color: #ef4444;
          color: white;
          &:hover { background-color: #dc2626; }
        `;
		}
	}}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ $severity?: 'critical' | 'high' | 'medium' | 'low' }>`
  background: ${({ $severity }) => {
		switch ($severity) {
			case 'critical':
				return '#fecaca';
			case 'high':
				return '#fed7aa';
			case 'medium':
				return '#fef3c7';
			case 'low':
				return '#dcfce7';
			default:
				return '#f9fafb';
		}
	}};
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ $severity }) => {
		switch ($severity) {
			case 'critical':
				return '#fca5a5';
			case 'high':
				return '#fdba74';
			case 'medium':
				return '#fde68a';
			case 'low':
				return '#86efac';
			default:
				return '#e5e7eb';
		}
	}};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
`;

const VulnerabilityList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const VulnerabilityItem = styled.div<{ $severity: 'critical' | 'high' | 'medium' | 'low' }>`
  border: 1px solid ${({ $severity }) => {
		switch ($severity) {
			case 'critical':
				return '#fca5a5';
			case 'high':
				return '#fdba74';
			case 'medium':
				return '#fde68a';
			case 'low':
				return '#86efac';
		}
	}};
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: ${({ $severity }) => {
		switch ($severity) {
			case 'critical':
				return '#fef2f2';
			case 'high':
				return '#fff7ed';
			case 'medium':
				return '#fffbeb';
			case 'low':
				return '#f0fdf4';
		}
	}};
`;

const VulnerabilityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const VulnerabilityTitle = styled.h4`
  margin: 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
`;

const SeverityBadge = styled.span<{ $severity: 'critical' | 'high' | 'medium' | 'low' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${({ $severity }) => {
		switch ($severity) {
			case 'critical':
				return `
          background-color: #fecaca;
          color: #991b1b;
        `;
			case 'high':
				return `
          background-color: #fed7aa;
          color: #9a3412;
        `;
			case 'medium':
				return `
          background-color: #fef3c7;
          color: #92400e;
        `;
			case 'low':
				return `
          background-color: #dcfce7;
          color: #166534;
        `;
		}
	}}
`;

const VulnerabilityDescription = styled.p`
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const VulnerabilityRecommendation = styled.p`
  margin: 0;
  color: #1f2937;
  font-size: 0.875rem;
  font-weight: 500;
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 0.25rem;
`;

const RecommendationsList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  list-style: none;
`;

const RecommendationItem = styled.li`
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #1f2937;
  
  &::before {
    content: '💡';
    margin-right: 0.5rem;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  background: #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid #fca5a5;
  margin-bottom: 1rem;
`;

const SecurityAuditDashboard: React.FC = () => {
	const [currentReport, setCurrentReport] = useState<SecurityAuditReport | null>(null);
	const [auditHistory, setAuditHistory] = useState<SecurityAuditReport[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadAuditHistory();
	}, []);

	const loadAuditHistory = () => {
		try {
			const history = securityAuditor.getAuditHistory();
			setAuditHistory(history);
			if (history.length > 0) {
				setCurrentReport(history[history.length - 1]);
			}
		} catch (err) {
			setError('Failed to load audit history');
		}
	};

	const handleRunAudit = async () => {
		try {
			setLoading(true);
			setError(null);

			const report = await securityAuditor.performSecurityAudit();
			setCurrentReport(report);
			loadAuditHistory();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Audit failed');
		} finally {
			setLoading(false);
		}
	};

	const handleExportReport = () => {
		if (!currentReport) return;

		const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `security-audit-${currentReport.auditId}-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const getSeverityIcon = (severity: string) => {
		switch (severity) {
			case 'critical':
				return '🚨';
			case 'high':
				return '⚠️';
			case 'medium':
				return '⚡';
			case 'low':
				return 'ℹ️';
			default:
				return '📋';
		}
	};

	if (loading) {
		return (
			<DashboardContainer>
				<LoadingSpinner>Running security audit...</LoadingSpinner>
			</DashboardContainer>
		);
	}

	return (
		<DashboardContainer>
			<DashboardHeader>
				<DashboardTitle>Security Audit Dashboard</DashboardTitle>
				<div>
					<Button $variant="secondary" onClick={loadAuditHistory}>
						Refresh History
					</Button>
					<Button $variant="primary" onClick={handleRunAudit}>
						Run New Audit
					</Button>
				</div>
			</DashboardHeader>

			{error && <ErrorMessage>{error}</ErrorMessage>}

			{currentReport ? (
				<>
					<SecurityScore score={currentReport.overallScore}>
						<ScoreCircle score={currentReport.overallScore}>
							{currentReport.overallScore}
						</ScoreCircle>
						Security Score
					</SecurityScore>

					<StatsGrid>
						<StatCard>
							<StatValue>{currentReport.summary.totalVulnerabilities}</StatValue>
							<StatLabel>Total Issues</StatLabel>
						</StatCard>
						<StatCard $severity="critical">
							<StatValue>{currentReport.summary.criticalCount}</StatValue>
							<StatLabel>Critical</StatLabel>
						</StatCard>
						<StatCard $severity="high">
							<StatValue>{currentReport.summary.highCount}</StatValue>
							<StatLabel>High</StatLabel>
						</StatCard>
						<StatCard $severity="medium">
							<StatValue>{currentReport.summary.mediumCount}</StatValue>
							<StatLabel>Medium</StatLabel>
						</StatCard>
						<StatCard $severity="low">
							<StatValue>{currentReport.summary.lowCount}</StatValue>
							<StatLabel>Low</StatLabel>
						</StatCard>
					</StatsGrid>

					<Section>
						<SectionTitle>Security Recommendations</SectionTitle>
						<RecommendationsList>
							{currentReport.recommendations.map((recommendation, index) => (
								<RecommendationItem key={index}>{recommendation}</RecommendationItem>
							))}
						</RecommendationsList>
					</Section>

					<Section>
						<SectionTitle>Vulnerabilities</SectionTitle>
						<VulnerabilityList>
							{currentReport.vulnerabilities.length === 0 ? (
								<div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
									No vulnerabilities found! 🎉
								</div>
							) : (
								currentReport.vulnerabilities.map((vulnerability) => (
									<VulnerabilityItem key={vulnerability.id} $severity={vulnerability.severity}>
										<VulnerabilityHeader>
											<VulnerabilityTitle>
												{getSeverityIcon(vulnerability.severity)} {vulnerability.title}
											</VulnerabilityTitle>
											<SeverityBadge $severity={vulnerability.severity}>
												{vulnerability.severity}
											</SeverityBadge>
										</VulnerabilityHeader>
										<VulnerabilityDescription>{vulnerability.description}</VulnerabilityDescription>
										<VulnerabilityRecommendation>
											<strong>Recommendation:</strong> {vulnerability.recommendation}
										</VulnerabilityRecommendation>
									</VulnerabilityItem>
								))
							)}
						</VulnerabilityList>
					</Section>

					<div style={{ marginTop: '2rem', textAlign: 'right' }}>
						<Button $variant="success" onClick={handleExportReport}>
							Export Report
						</Button>
					</div>
				</>
			) : (
				<div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
					No security audit has been run yet. Click "Run New Audit" to get started.
				</div>
			)}
		</DashboardContainer>
	);
};

export default SecurityAuditDashboard;
