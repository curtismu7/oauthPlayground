import {
	FiAlertTriangle,
	FiArrowRight,
	FiBarChart2,
	FiCheckCircle,
	FiClock,
	FiDatabase,
	FiDownload,
	FiRefreshCw,
	FiShield,
	FiUsers,
} from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';
import { type FlowType } from '../../v8/services/specVersionServiceV8';
import { FlowComparisonTool } from '../components/FlowComparisonTool';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const PageTitle = styled.h1`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div<{ $color?: string }>`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${(props) => props.$color || '#64748b'};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const SectionContainer = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h2`
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const SectionIcon = styled.div`
  font-size: 1.25rem;
  color: #3b82f6;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  &:last-child {
    border-bottom: none;
  }
`;

const FeatureIcon = styled.div<{ $color?: string }>`
  font-size: 1rem;
  color: ${(props) => props.$color || '#3b82f6'};
`;

const FeatureText = styled.div`
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`;

const FeatureStatus = styled.span<{ $enabled: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${(props) => {
		return props.$enabled
			? `
        background: #dcfce7;
        color: #166534;
        border-color: #86efac;
      `
			: `
        background: #f3f4f6;
        color: #6b7280;
        border-color: #d1d5db;
      `;
	}}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          
          &:hover {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
			case 'danger':
				return `
          background: #ef4444;
          border-color: #ef4444;
          color: white;
          
          &:hover {
            background: #dc2626;
            border-color: #dc2626;
          }
        `;
			default:
				return `
          background: white;
          border-color: #e2e8f0;
          color: #64748b;
          
          &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            color: #475569;
          }
        `;
		}
	}}
`;

const ComparisonStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
`;

const StatItem = styled.div`
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
`;

const StatItemValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const StatItemLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const FlowMetrics = {
	'oauth-authz': {
		name: 'Authorization Code',
		security: 'excellent',
		complexity: 'fair',
		performance: 'good',
		scalability: 'excellent',
		userExperience: 'good',
		tokenSecurity: 'excellent',
		bestFor: ['Web applications', 'Server-side apps', 'High security requirements'],
		pros: [
			'Most secure OAuth flow',
			'Tokens never exposed to browser',
			'Supports refresh tokens',
			'PKCE support for enhanced security',
		],
		cons: [
			'Requires server-side component',
			'More complex than implicit flow',
			'Additional round trips',
		],
	},
	implicit: {
		name: 'Implicit',
		security: 'poor',
		complexity: 'excellent',
		performance: 'excellent',
		scalability: 'fair',
		userExperience: 'excellent',
		tokenSecurity: 'poor',
		bestFor: ['Legacy applications', 'Simple SPAs', 'Limited server resources'],
		pros: [
			'Fast and simple',
			'No server-side storage needed',
			'Single request-response',
			'Good for mobile apps',
		],
		cons: [
			'Tokens exposed in URL',
			'No refresh token support',
			'Security vulnerabilities',
			'Deprecated in OAuth 2.1',
		],
	},
	'client-credentials': {
		name: 'Client Credentials',
		security: 'excellent',
		complexity: 'excellent',
		performance: 'excellent',
		scalability: 'excellent',
		userExperience: 'good',
		tokenSecurity: 'excellent',
		bestFor: ['API services', 'Backend services', 'Machine-to-machine'],
		pros: [
			'Simple and secure',
			'No user interaction required',
			'High performance',
			'Ideal for service-to-service',
		],
		cons: ['No user context', 'Cannot access user resources', 'Limited to client scopes'],
	},
	'device-code': {
		name: 'Device Code',
		security: 'excellent',
		complexity: 'fair',
		performance: 'fair',
		scalability: 'good',
		userExperience: 'fair',
		tokenSecurity: 'excellent',
		bestFor: ['IoT devices', 'Smart TVs', 'CLI applications'],
		pros: [
			'Works on input-constrained devices',
			'Secure user authentication',
			'Good user experience for devices',
			'Supports polling mechanism',
		],
		cons: [
			'Multi-step process',
			'Requires secondary device',
			'Slower than other flows',
			'More complex UX',
		],
	},
	hybrid: {
		name: 'Hybrid',
		security: 'good',
		complexity: 'poor',
		performance: 'fair',
		scalability: 'good',
		userExperience: 'fair',
		tokenSecurity: 'good',
		bestFor: ['Complex applications', 'Migrated systems', 'Special requirements'],
		pros: [
			'Flexible token delivery',
			'Reduced round trips',
			'Supports multiple token types',
			'Backward compatible',
		],
		cons: [
			'Most complex flow',
			'Security considerations',
			'Harder to implement correctly',
			'Limited use cases',
		],
	},
	ropc: {
		name: 'Resource Owner Password',
		security: 'poor',
		complexity: 'excellent',
		performance: 'excellent',
		scalability: 'fair',
		userExperience: 'excellent',
		tokenSecurity: 'poor',
		bestFor: ['Trusted applications', 'Legacy systems', 'Internal tools'],
		pros: [
			'Simple to implement',
			'Fast authentication',
			'No redirects needed',
			'Good for trusted clients',
		],
		cons: [
			'Security risks with passwords',
			'Not recommended for new apps',
			'Requires user credentials',
			'Limited to trusted applications',
		],
	},
};

export const FlowComparisonPage: React.FC = () => {
	const [selectedFlows, setSelectedFlows] = useState<FlowType[]>(['oauth-authz', 'implicit']);
	const [comparisonMode, setComparisonMode] = useState<'detailed' | 'matrix'>('detailed');
	const [message, setMessage] = useState('');
	const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

	// Handle flow selection
	const handleFlowSelect = (flowType: FlowType) => {
		setSelectedFlows((previous) => {
			if (previous.includes(flowType)) {
				return previous;
			}

			const updated = [flowType, ...previous];
			return updated.slice(0, 4);
		});

		const friendlyName = FlowMetrics[flowType]?.name ?? flowType;
		setMessage(`Selected ${friendlyName} flow for implementation`);
		setMessageType('success');
	};

	// Export comparison results
	const handleExportComparison = () => {
		const comparisonData = selectedFlows.map((flowType) => ({
			flow: flowType,
			metrics: FlowMetrics[flowType],
		}));

		const blob = new Blob([JSON.stringify(comparisonData, null, 2)], {
			type: 'application/json',
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `flow-comparison-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		setMessage('Comparison results exported successfully');
		setMessageType('success');
	};

	// Calculate statistics
	const stats = {
		totalFlows: Object.keys(FlowMetrics).length,
		selectedFlows: selectedFlows.length,
		avgSecurity:
			selectedFlows.length > 0
				? selectedFlows.reduce((sum, flow) => {
						const rating = FlowMetrics[flow].security;
						return (
							sum + (rating === 'excellent' ? 4 : rating === 'good' ? 3 : rating === 'fair' ? 2 : 1)
						);
					}, 0) / selectedFlows.length
				: 0,
		avgComplexity:
			selectedFlows.length > 0
				? selectedFlows.reduce((sum, flow) => {
						const rating = FlowMetrics[flow].complexity;
						return (
							sum + (rating === 'excellent' ? 4 : rating === 'good' ? 3 : rating === 'fair' ? 2 : 1)
						);
					}, 0) / selectedFlows.length
				: 0,
	};

	return (
		<PageContainer>
			<PageHeader>
				<PageTitle>📊 Flow Comparison Tool</PageTitle>
				<PageSubtitle>
					Compare different OAuth flows to understand their security implications, performance
					characteristics, and best use cases
				</PageSubtitle>
			</PageHeader>

			{message && (
				<div
					style={{
						marginBottom: '1rem',
					}}
				>
					<div
						style={{
							padding: '1rem',
							borderRadius: '8px',
							background:
								messageType === 'success'
									? '#f0fdf4'
									: messageType === 'error'
										? '#fef2f2'
										: '#eff6ff',
							border: `1px solid ${messageType === 'success' ? '#86efac' : messageType === 'error' ? '#fecaca' : '#bfdbfe'}`,
							color:
								messageType === 'success'
									? '#166534'
									: messageType === 'error'
										? '#991b1b'
										: '#1e40af',
							textAlign: 'center',
						}}
					>
						{message}
					</div>
				</div>
			)}

			{/* Statistics */}
			<StatsGrid>
				<StatCard>
					<StatIcon $color="#3b82f6">
						<FiBarChart2 />
					</StatIcon>
					<StatValue>{stats.totalFlows}</StatValue>
					<StatLabel>Total Flows</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#10b981">
						<FiCheckCircle />
					</StatIcon>
					<StatValue>{stats.selectedFlows}</StatValue>
					<StatLabel>Selected Flows</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#f59e0b">
						<FiShield />
					</StatIcon>
					<StatValue>{stats.avgSecurity.toFixed(1)}</StatValue>
					<StatLabel>Avg Security</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#8b5cf6">
						<FiClock />
					</StatIcon>
					<StatValue>{stats.avgComplexity.toFixed(1)}</StatValue>
					<StatLabel>Avg Complexity</StatLabel>
				</StatCard>
			</StatsGrid>

			{/* Flow Comparison Tool */}
			<FlowComparisonTool onFlowSelect={handleFlowSelect} selectedFlows={selectedFlows} />

			{/* Features Overview */}
			<SectionContainer>
				<SectionHeader>
					<SectionIcon>
						<FiDatabase />
					</SectionIcon>
					<SectionTitle>Comparison Features</SectionTitle>
				</SectionHeader>

				<FeatureList>
					<FeatureItem>
						<FeatureIcon $color="#10b981">
							<FiShield />
						</FeatureIcon>
						<FeatureText>Comprehensive security analysis with detailed ratings</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>

					<FeatureItem>
						<FeatureIcon $color="#3b82f6">
							<FiBarChart2 />
						</FeatureIcon>
						<FeatureText>Performance metrics and complexity assessment</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>

					<FeatureItem>
						<FeatureIcon $color="#8b5cf6">
							<FiUsers />
						</FeatureIcon>
						<FeatureText>User experience evaluation and recommendations</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>

					<FeatureItem>
						<FeatureIcon $color="#10b981">
							<FiDatabase />
						</FeatureIcon>
						<FeatureText>Detailed pros and cons for each flow type</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>

					<FeatureItem>
						<FeatureIcon $color="#f59e0b">
							<FiArrowRight />
						</FeatureIcon>
						<FeatureText>Best use case recommendations and guidance</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>

					<FeatureItem>
						<FeatureIcon $color="#ef4444">
							<FiAlertTriangle />
						</FeatureIcon>
						<FeatureText>Security warnings and deprecation notices</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>
				</FeatureList>
			</SectionContainer>

			{/* Comparison Statistics */}
			<SectionContainer>
				<SectionHeader>
					<SectionIcon>
						<FiBarChart2 />
					</SectionIcon>
					<SectionTitle>Comparison Statistics</SectionTitle>
				</SectionHeader>

				<ComparisonStats>
					<StatItem>
						<StatItemValue>{stats.selectedFlows}</StatItemValue>
						<StatItemLabel>Flows Compared</StatItemLabel>
					</StatItem>

					<StatItem>
						<StatItemValue>{stats.avgSecurity.toFixed(1)}/4</StatItemValue>
						<StatItemLabel>Avg Security Score</StatItemLabel>
					</StatItem>

					<StatItem>
						<StatItemValue>{stats.avgComplexity.toFixed(1)}/4</StatItemValue>
						<StatItemLabel>Avg Complexity Score</StatItemLabel>
					</StatItem>

					<StatItem>
						<StatItemValue>{comparisonMode === 'detailed' ? 'Detailed' : 'Matrix'}</StatItemValue>
						<StatItemLabel>View Mode</StatItemLabel>
					</StatItem>
				</ComparisonStats>
			</SectionContainer>

			{/* Export Actions */}
			<ActionButtons>
				<ActionButton onClick={handleExportComparison}>
					<FiDownload /> Export Comparison
				</ActionButton>
				<ActionButton
					onClick={() => setComparisonMode(comparisonMode === 'detailed' ? 'matrix' : 'detailed')}
				>
					<FiRefreshCw /> Switch to {comparisonMode === 'detailed' ? 'Matrix' : 'Detailed'} View
				</ActionButton>
			</ActionButtons>
		</PageContainer>
	);
};

export default FlowComparisonPage;
