import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
	FiGitCompare,
	FiTrendingUp,
	FiShield,
	FiClock,
	FiUsers,
	FiKey,
	FiEye,
	FiDownload,
	FiShare2,
} from 'react-icons/fi';
import { useAccessibility } from '../hooks/useAccessibility';

// Styled components
const ComparisonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
`;

const ComparisonHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ComparisonTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
`;

const ComparisonIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-radius: 12px;
  color: white;
  font-size: 24px;
`;

const ComparisonSubtitle = styled.p`
  margin: 0;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
`;

const FlowSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const FlowChip = styled.button<{ $selected: boolean; $flowType: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  border: 2px solid ${({ $selected, $flowType, theme }) => {
		if ($selected) {
			switch ($flowType) {
				case 'authorization-code':
					return theme.colors.primary;
				case 'implicit':
					return theme.colors.warning;
				case 'client-credentials':
					return theme.colors.success;
				case 'device-code':
					return theme.colors.info;
				case 'password':
					return theme.colors.danger;
				default:
					return theme.colors.primary;
			}
		}
		return theme.colors.gray300;
	}};
  background: ${({ $selected, $flowType, theme }) => {
		if ($selected) {
			switch ($flowType) {
				case 'authorization-code':
					return theme.colors.primaryLight;
				case 'implicit':
					return theme.colors.warningLight;
				case 'client-credentials':
					return theme.colors.successLight;
				case 'device-code':
					return theme.colors.infoLight;
				case 'password':
					return theme.colors.dangerLight;
				default:
					return theme.colors.primaryLight;
			}
		}
		return 'white';
	}};
  color: ${({ $selected, $flowType, theme }) => {
		if ($selected) {
			switch ($flowType) {
				case 'authorization-code':
					return theme.colors.primary;
				case 'implicit':
					return theme.colors.warning;
				case 'client-credentials':
					return theme.colors.success;
				case 'device-code':
					return theme.colors.info;
				case 'password':
					return theme.colors.danger;
				default:
					return theme.colors.primary;
			}
		}
		return theme.colors.gray700;
	}};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ComparisonCard = styled.div<{ $flowType: string }>`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 2px solid ${({ $flowType, theme }) => {
		switch ($flowType) {
			case 'authorization-code':
				return theme.colors.primary;
			case 'implicit':
				return theme.colors.warning;
			case 'client-credentials':
				return theme.colors.success;
			case 'device-code':
				return theme.colors.info;
			case 'password':
				return theme.colors.danger;
			default:
				return theme.colors.gray200;
		}
	}};
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const FlowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray100};
`;

const FlowName = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
`;

const FlowBadge = styled.div<{ $flowType: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({ $flowType, theme }) => {
		switch ($flowType) {
			case 'authorization-code':
				return theme.colors.primary;
			case 'implicit':
				return theme.colors.warning;
			case 'client-credentials':
				return theme.colors.success;
			case 'device-code':
				return theme.colors.info;
			case 'password':
				return theme.colors.danger;
			default:
				return theme.colors.gray500;
		}
	}};
  color: white;
`;

const FlowDescription = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.5;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MetricItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const MetricIcon = styled.div<{ $metric: string }>`
  color: ${({ $metric, theme }) => {
		switch ($metric) {
			case 'security':
				return theme.colors.success;
			case 'complexity':
				return theme.colors.warning;
			case 'performance':
				return theme.colors.info;
			case 'usability':
				return theme.colors.primary;
			default:
				return theme.colors.gray500;
		}
	}};
  font-size: 1.25rem;
`;

const MetricContent = styled.div`
  flex: 1;
  
  .metric-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray600};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }
  
  .metric-value {
    font-size: 1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const ComparisonTable = styled.div`
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
    font-size: 1.25rem;
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

const ComparisonActions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid ${({ $variant, theme }) => {
		switch ($variant) {
			case 'primary':
				return theme.colors.primary;
			case 'success':
				return theme.colors.success;
			default:
				return theme.colors.gray300;
		}
	}};
  background: ${({ $variant, theme }) => {
		switch ($variant) {
			case 'primary':
				return theme.colors.primary;
			case 'success':
				return theme.colors.success;
			default:
				return 'white';
		}
	}};
  color: ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
			case 'success':
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
				case 'success':
					return theme.colors.successDark;
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

// Flow comparison data
const flowData = {
	'authorization-code': {
		name: 'Authorization Code',
		description: 'Most secure flow for server-side applications with PKCE support',
		security: 9,
		complexity: 7,
		performance: 8,
		usability: 6,
		features: ['PKCE Support', 'Refresh Tokens', 'State Parameter', 'Nonce Support'],
		useCases: ['Web Applications', 'Mobile Apps', 'SPAs with Backend'],
		pros: ['Most Secure', 'Refresh Token Support', 'PKCE Compatible'],
		cons: ['Requires Backend', 'Multiple Requests', 'Complex Implementation'],
	},
	implicit: {
		name: 'Implicit Grant',
		description: 'Simplified flow for client-side applications (deprecated)',
		security: 4,
		complexity: 3,
		performance: 9,
		usability: 9,
		features: ['Direct Token', 'No Backend Required', 'Simple Implementation'],
		useCases: ['Legacy SPAs', 'Simple Applications', 'Prototyping'],
		pros: ['Simple', 'No Backend', 'Fast'],
		cons: ['Less Secure', 'No Refresh Tokens', 'Deprecated'],
	},
	'client-credentials': {
		name: 'Client Credentials',
		description: 'Machine-to-machine authentication for service accounts',
		security: 8,
		complexity: 4,
		performance: 9,
		usability: 8,
		features: ['Service Authentication', 'No User Interaction', 'Direct Access'],
		useCases: ['API Services', 'Microservices', 'Background Jobs'],
		pros: ['No User Required', 'Simple', 'Fast'],
		cons: ['No User Context', 'Limited Scopes', 'Service Only'],
	},
	'device-code': {
		name: 'Device Code',
		description: 'For devices with limited input capabilities',
		security: 7,
		complexity: 6,
		performance: 5,
		usability: 7,
		features: ['Device Codes', 'User Code Display', 'Polling Mechanism'],
		useCases: ['Smart TVs', 'IoT Devices', 'CLI Tools'],
		pros: ['Device Friendly', 'Secure', 'User Control'],
		cons: ['Polling Required', 'Complex UX', 'Timeout Issues'],
	},
	password: {
		name: 'Password Grant',
		description: 'Direct username/password authentication (not recommended)',
		security: 3,
		complexity: 2,
		performance: 9,
		usability: 9,
		features: ['Direct Login', 'Simple Flow', 'No Redirects'],
		useCases: ['Legacy Systems', 'Internal Tools', 'Testing'],
		pros: ['Very Simple', 'No Redirects', 'Direct'],
		cons: ['Least Secure', 'Password Exposure', 'Not Recommended'],
	},
};

// Flow comparison component
export const FlowComparisonTools: React.FC = () => {
	const [selectedFlows, setSelectedFlows] = useState<string[]>(['authorization-code', 'implicit']);
	const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'table'>('side-by-side');
	const { announceToScreenReader } = useAccessibility();

	const toggleFlow = (flowType: string) => {
		setSelectedFlows((prev) => {
			if (prev.includes(flowType)) {
				const newFlows = prev.filter((f) => f !== flowType);
				announceToScreenReader(
					`${flowData[flowType as keyof typeof flowData]?.name} removed from comparison`
				);
				return newFlows;
			} else if (prev.length < 4) {
				const newFlows = [...prev, flowType];
				announceToScreenReader(
					`${flowData[flowType as keyof typeof flowData]?.name} added to comparison`
				);
				return newFlows;
			} else {
				announceToScreenReader('Maximum 4 flows can be compared at once');
				return prev;
			}
		});
	};

	const exportComparison = () => {
		const comparisonData = selectedFlows.map((flowType) => ({
			flow: flowData[flowType as keyof typeof flowData],
			type: flowType,
		}));

		const dataStr = JSON.stringify(comparisonData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'oauth-flow-comparison.json';
		link.click();

		URL.revokeObjectURL(url);
		announceToScreenReader('Comparison data exported successfully');
	};

	const shareComparison = async () => {
		const comparisonUrl = `${window.location.origin}/flows?compare=${selectedFlows.join(',')}`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: 'OAuth Flow Comparison',
					text: 'Compare OAuth 2.0 flows side by side',
					url: comparisonUrl,
				});
				announceToScreenReader('Comparison shared successfully');
			} catch (error) {
				console.error('Error sharing:', error);
			}
		} else {
			await navigator.clipboard.writeText(comparisonUrl);
			announceToScreenReader('Comparison URL copied to clipboard');
		}
	};

	const comparisonData = useMemo(() => {
		return selectedFlows.map((flowType) => ({
			...flowData[flowType as keyof typeof flowData],
			type: flowType,
		}));
	}, [selectedFlows]);

	return (
		<ComparisonContainer role="main" aria-label="OAuth flow comparison tools">
			<ComparisonHeader>
				<ComparisonIcon>
					<FiGitCompare />
				</ComparisonIcon>
				<div>
					<ComparisonTitle>OAuth Flow Comparison Tools</ComparisonTitle>
					<ComparisonSubtitle>
						Compare OAuth 2.0 and OpenID Connect flows side by side to understand their differences,
						security implications, and use cases
					</ComparisonSubtitle>
				</div>
			</ComparisonHeader>

			<FlowSelector role="group" aria-label="Select flows to compare">
				{Object.entries(flowData).map(([flowType, data]) => (
					<FlowChip
						key={flowType}
						$selected={selectedFlows.includes(flowType)}
						$flowType={flowType}
						onClick={() => toggleFlow(flowType)}
						aria-pressed={selectedFlows.includes(flowType)}
						aria-label={`${data.name} flow - ${selectedFlows.includes(flowType) ? 'selected' : 'not selected'}`}
					>
						{data.name}
					</FlowChip>
				))}
			</FlowSelector>

			{selectedFlows.length > 0 && (
				<>
					{comparisonMode === 'side-by-side' ? (
						<ComparisonGrid>
							{comparisonData.map((flow) => (
								<ComparisonCard key={flow.type} $flowType={flow.type}>
									<FlowHeader>
										<FlowName>{flow.name}</FlowName>
										<FlowBadge $flowType={flow.type}>{flow.type}</FlowBadge>
									</FlowHeader>

									<FlowDescription>{flow.description}</FlowDescription>

									<MetricsGrid>
										<MetricItem>
											<MetricIcon $metric="security">
												<FiShield />
											</MetricIcon>
											<MetricContent>
												<div className="metric-label">Security</div>
												<div className="metric-value">{flow.security}/10</div>
											</MetricContent>
										</MetricItem>

										<MetricItem>
											<MetricIcon $metric="complexity">
												<FiTrendingUp />
											</MetricIcon>
											<MetricContent>
												<div className="metric-label">Complexity</div>
												<div className="metric-value">{flow.complexity}/10</div>
											</MetricContent>
										</MetricItem>

										<MetricItem>
											<MetricIcon $metric="performance">
												<FiClock />
											</MetricIcon>
											<MetricContent>
												<div className="metric-label">Performance</div>
												<div className="metric-value">{flow.performance}/10</div>
											</MetricContent>
										</MetricItem>

										<MetricItem>
											<MetricIcon $metric="usability">
												<FiUsers />
											</MetricIcon>
											<MetricContent>
												<div className="metric-label">Usability</div>
												<div className="metric-value">{flow.usability}/10</div>
											</MetricContent>
										</MetricItem>
									</MetricsGrid>

									<div style={{ marginTop: '1rem' }}>
										<h4
											style={{
												margin: '0 0 0.5rem 0',
												fontSize: '0.875rem',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											Key Features:
										</h4>
										<ul
											style={{
												margin: 0,
												paddingLeft: '1rem',
												fontSize: '0.875rem',
												color: '#6b7280',
											}}
										>
											{flow.features.map((feature, index) => (
												<li key={index}>{feature}</li>
											))}
										</ul>
									</div>
								</ComparisonCard>
							))}
						</ComparisonGrid>
					) : (
						<ComparisonTable>
							<TableHeader>
								<h3>Detailed Comparison Table</h3>
							</TableHeader>
							<TableContent>
								<Table>
									<thead>
										<TableRow>
											<TableHeaderCell>Flow</TableHeaderCell>
											<TableHeaderCell>Security</TableHeaderCell>
											<TableHeaderCell>Complexity</TableHeaderCell>
											<TableHeaderCell>Performance</TableHeaderCell>
											<TableHeaderCell>Usability</TableHeaderCell>
											<TableHeaderCell>Use Cases</TableHeaderCell>
										</TableRow>
									</thead>
									<tbody>
										{comparisonData.map((flow) => (
											<TableRow key={flow.type}>
												<TableCell>
													<strong>{flow.name}</strong>
													<br />
													<small style={{ color: '#6b7280' }}>{flow.description}</small>
												</TableCell>
												<TableCell>{flow.security}/10</TableCell>
												<TableCell>{flow.complexity}/10</TableCell>
												<TableCell>{flow.performance}/10</TableCell>
												<TableCell>{flow.usability}/10</TableCell>
												<TableCell>
													<ul style={{ margin: 0, paddingLeft: '1rem' }}>
														{flow.useCases.map((useCase, index) => (
															<li key={index} style={{ fontSize: '0.875rem' }}>
																{useCase}
															</li>
														))}
													</ul>
												</TableCell>
											</TableRow>
										))}
									</tbody>
								</Table>
							</TableContent>
						</ComparisonTable>
					)}

					<ComparisonActions>
						<ActionButton
							$variant="secondary"
							onClick={() =>
								setComparisonMode(comparisonMode === 'side-by-side' ? 'table' : 'side-by-side')
							}
							aria-label={`Switch to ${comparisonMode === 'side-by-side' ? 'table' : 'side-by-side'} view`}
						>
							<FiEye />
							{comparisonMode === 'side-by-side' ? 'Table View' : 'Side-by-Side View'}
						</ActionButton>

						<ActionButton
							$variant="secondary"
							onClick={exportComparison}
							aria-label="Export comparison data as JSON"
						>
							<FiDownload />
							Export Data
						</ActionButton>

						<ActionButton
							$variant="primary"
							onClick={shareComparison}
							aria-label="Share comparison with others"
						>
							<FiShare2 />
							Share Comparison
						</ActionButton>
					</ComparisonActions>
				</>
			)}
		</ComparisonContainer>
	);
};

export default FlowComparisonTools;
