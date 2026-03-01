import {
	FiArrowRight,
	FiBarChart2,
	FiCheck,
	FiClock,
	FiDatabase,
	FiInfo,
	FiLock,
	FiShield,
	FiUsers,
	FiX,
	FiZap,
} from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';
import { type FlowType } from '../../v8/services/specVersionServiceV8';

const ComparisonContainer = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const ComparisonHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const ComparisonTitle = styled.h3`
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const ComparisonSubtitle = styled.p`
  color: #64748b;
  font-size: 0.875rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const FlowSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FlowOption = styled.div<{ $selected: boolean }>`
  background: ${(props) => (props.$selected ? '#dbeafe' : 'white')};
  border: 2px solid ${(props) => (props.$selected ? '#3b82f6' : '#e2e8f0')};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  
  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const FlowIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #3b82f6;
`;

const FlowName = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const FlowDescription = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ComparisonCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
`;

const CardTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const MetricRow = styled.div<{ $highlight?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
  background: ${(props) => (props.$highlight ? '#f8fafc' : 'transparent')};
  
  &:last-child {
    border-bottom: none;
  }
`;

const MetricLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MetricValue = styled.div<{ $rating: 'excellent' | 'good' | 'fair' | 'poor' }>`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => {
		switch (props.$rating) {
			case 'excellent':
				return '#059669';
			case 'good':
				return '#0891b2';
			case 'fair':
				return '#d97706';
			case 'poor':
				return '#dc2626';
			default:
				return '#64748b';
		}
	}};
`;

const RatingBadge = styled.span<{ $rating: 'excellent' | 'good' | 'fair' | 'poor' }>`
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${(props) => {
		switch (props.$rating) {
			case 'excellent':
				return '#dcfce7';
			case 'good':
				return '#e0f2fe';
			case 'fair':
				return '#fef3c7';
			case 'poor':
				return '#fee2e2';
			default:
				return '#f1f5f9';
		}
	}};
  color: ${(props) => {
		switch (props.$rating) {
			case 'excellent':
				return '#166534';
			case 'good':
				return '#0c4a6e';
			case 'fair':
				return '#92400e';
			case 'poor':
				return '#991b1b';
			default:
				return '#475569';
		}
	}};
`;

const RecommendationSection = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
`;

const RecommendationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const RecommendationTitle = styled.h4`
  color: #166534;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const RecommendationList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: #15803d;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const ComparisonMatrix = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
`;

const MatrixTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
`;

const MatrixHeader = styled.th`
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
`;

const MatrixCell = styled.td<{ $rating?: 'excellent' | 'good' | 'fair' | 'poor' }>`
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: ${(props) =>
		props.$rating
			? {
					excellent: '#059669',
					good: '#0891b2',
					fair: '#d97706',
					poor: '#dc2626',
				}[props.$rating]
			: '#64748b'};
`;

const FlowMetrics = {
	'oauth-authz': {
		name: 'Authorization Code',
		icon: <FiShield />,
		description: 'Most secure flow for web applications',
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
		icon: <FiZap />,
		description: 'Fast but less secure for single-page apps',
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
		icon: <FiDatabase />,
		description: 'Machine-to-machine communication',
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
		icon: <FiUsers />,
		description: 'For devices with limited input capabilities',
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
		icon: <FiArrowRight />,
		description: 'Combination of authorization code and implicit',
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
		icon: <FiLock />,
		description: 'Direct username/password authentication',
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

interface FlowComparisonToolProps {
	onFlowSelect?: (flowType: FlowType) => void;
	selectedFlows?: FlowType[];
}

export const FlowComparisonTool: React.FC<FlowComparisonToolProps> = ({
	onFlowSelect,
	selectedFlows = ['oauth-authz', 'implicit'],
}) => {
	const [selectedFlowTypes, setSelectedFlowTypes] = useState<FlowType[]>(selectedFlows);
	const [comparisonMode, setComparisonMode] = useState<'detailed' | 'matrix'>('detailed');

	const toggleFlowSelection = (flowType: FlowType) => {
		if (selectedFlowTypes.includes(flowType)) {
			if (selectedFlowTypes.length > 1) {
				setSelectedFlowTypes((prev) => prev.filter((f) => f !== flowType));
			}
		} else {
			setSelectedFlowTypes((prev) => [...prev, flowType]);
		}
	};

	const _getRatingColor = (rating: string) => {
		switch (rating) {
			case 'excellent':
				return '#059669';
			case 'good':
				return '#0891b2';
			case 'fair':
				return '#d97706';
			case 'poor':
				return '#dc2626';
			default:
				return '#64748b';
		}
	};

	const getRecommendation = () => {
		const flows = selectedFlowTypes.map((flow) => FlowMetrics[flow]);

		if (flows.length === 1) {
			const flow = flows[0];
			return {
				title: `Best Use Case for ${flow.name}`,
				description: `The ${flow.name} flow is ideal for: ${flow.bestFor.join(', ')}`,
				recommendations: flow.pros.slice(0, 3),
			};
		}

		// Compare multiple flows
		const securityScores = flows.map((f) => ({ name: f.name, score: f.security }));
		const bestSecurity = securityScores.reduce((best, current) =>
			current.score === 'excellent' ? current : best
		);

		const complexityScores = flows.map((f) => ({ name: f.name, score: f.complexity }));
		const simplest = complexityScores.reduce((best, current) =>
			current.score === 'excellent' ? current : best
		);

		return {
			title: 'Flow Comparison Analysis',
			description: `Comparing ${flows.map((f) => f.name).join(' vs ')}`,
			recommendations: [
				`${bestSecurity.name} offers the best security profile`,
				`${simplest.name} is the easiest to implement`,
				'Consider your specific use case and security requirements',
			],
		};
	};

	const recommendation = getRecommendation();

	return (
		<ComparisonContainer>
			<ComparisonHeader>
				<FiBarChart2 style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
				<ComparisonTitle>OAuth Flow Comparison Tool</ComparisonTitle>
			</ComparisonHeader>

			<ComparisonSubtitle>
				Compare different OAuth flows to understand their security implications, performance
				characteristics, and best use cases. Select flows to compare and get personalized
				recommendations.
			</ComparisonSubtitle>

			<div style={{ marginBottom: '1rem' }}>
				<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
					<button
						onClick={() => setComparisonMode('detailed')}
						style={{
							padding: '0.5rem 1rem',
							borderRadius: '6px',
							border: '1px solid',
							background: comparisonMode === 'detailed' ? '#3b82f6' : 'white',
							color: comparisonMode === 'detailed' ? 'white' : '#64748b',
							borderColor: comparisonMode === 'detailed' ? '#3b82f6' : '#e2e8f0',
							cursor: 'pointer',
							fontSize: '0.875rem',
						}}
					>
						Detailed View
					</button>
					<button
						onClick={() => setComparisonMode('matrix')}
						style={{
							padding: '0.5rem 1rem',
							borderRadius: '6px',
							border: '1px solid',
							background: comparisonMode === 'matrix' ? '#3b82f6' : 'white',
							color: comparisonMode === 'matrix' ? 'white' : '#64748b',
							borderColor: comparisonMode === 'matrix' ? '#3b82f6' : '#e2e8f0',
							cursor: 'pointer',
							fontSize: '0.875rem',
						}}
					>
						Matrix View
					</button>
				</div>

				<FlowSelector>
					{Object.entries(FlowMetrics).map(([flowType, metrics]) => (
						<FlowOption
							key={flowType}
							$selected={selectedFlowTypes.includes(flowType as FlowType)}
							onClick={() => toggleFlowSelection(flowType as FlowType)}
						>
							<FlowIcon>{metrics.icon}</FlowIcon>
							<FlowName>{metrics.name}</FlowName>
							<FlowDescription>{metrics.description}</FlowDescription>
						</FlowOption>
					))}
				</FlowSelector>
			</div>

			{comparisonMode === 'detailed' ? (
				<ComparisonGrid>
					{selectedFlowTypes.map((flowType) => {
						const metrics = FlowMetrics[flowType];
						return (
							<ComparisonCard key={flowType}>
								<CardHeader>
									{metrics.icon}
									<CardTitle>{metrics.name} Flow</CardTitle>
								</CardHeader>

								<MetricRow>
									<MetricLabel>
										<FiShield /> Security
									</MetricLabel>
									<MetricValue $rating={metrics.security}>
										<RatingBadge $rating={metrics.security}>{metrics.security}</RatingBadge>
									</MetricValue>
								</MetricRow>

								<MetricRow>
									<MetricLabel>
										<FiClock /> Performance
									</MetricLabel>
									<MetricValue $rating={metrics.performance}>
										<RatingBadge $rating={metrics.performance}>{metrics.performance}</RatingBadge>
									</MetricValue>
								</MetricRow>

								<MetricRow>
									<MetricLabel>
										<FiDatabase /> Complexity
									</MetricLabel>
									<MetricValue $rating={metrics.complexity}>
										<RatingBadge $rating={metrics.complexity}>{metrics.complexity}</RatingBadge>
									</MetricValue>
								</MetricRow>

								<MetricRow>
									<MetricLabel>
										<FiUsers /> User Experience
									</MetricLabel>
									<MetricValue $rating={metrics.userExperience}>
										<RatingBadge $rating={metrics.userExperience}>
											{metrics.userExperience}
										</RatingBadge>
									</MetricValue>
								</MetricRow>

								<MetricRow>
									<MetricLabel>
										<FiLock /> Token Security
									</MetricLabel>
									<MetricValue $rating={metrics.tokenSecurity}>
										<RatingBadge $rating={metrics.tokenSecurity}>
											{metrics.tokenSecurity}
										</RatingBadge>
									</MetricValue>
								</MetricRow>

								<div style={{ marginTop: '1rem' }}>
									<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
										<FiCheck style={{ color: '#10b981', marginRight: '0.5rem' }} />
										Pros
									</div>
									<ul
										style={{
											margin: '0 0 1rem 1.5rem',
											padding: 0,
											color: '#059669',
											fontSize: '0.875rem',
										}}
									>
										{metrics.pros.slice(0, 3).map((pro, index) => (
											<li key={index}>{pro}</li>
										))}
									</ul>

									<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
										<FiX style={{ color: '#ef4444', marginRight: '0.5rem' }} />
										Cons
									</div>
									<ul
										style={{
											margin: 0,
											padding: 0,
											paddingLeft: '1.5rem',
											color: '#dc2626',
											fontSize: '0.875rem',
										}}
									>
										{metrics.cons.slice(0, 3).map((con, index) => (
											<li key={index}>{con}</li>
										))}
									</ul>
								</div>

								<button
									onClick={() => onFlowSelect?.(flowType as FlowType)}
									style={{
										width: '100%',
										padding: '0.75rem',
										marginTop: '1rem',
										background: '#3b82f6',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										cursor: 'pointer',
										fontSize: '0.875rem',
										fontWeight: '500',
									}}
								>
									Use This Flow
								</button>
							</ComparisonCard>
						);
					})}
				</ComparisonGrid>
			) : (
				<ComparisonMatrix>
					<MatrixTable>
						<thead>
							<tr>
								<MatrixHeader>Metric</MatrixHeader>
								{selectedFlowTypes.map((flowType) => (
									<MatrixHeader key={flowType}>{FlowMetrics[flowType].name}</MatrixHeader>
								))}
							</tr>
						</thead>
						<tbody>
							<tr>
								<MatrixCell>Security</MatrixCell>
								{selectedFlowTypes.map((flowType) => (
									<MatrixCell key={flowType} $rating={FlowMetrics[flowType].security}>
										{FlowMetrics[flowType].security}
									</MatrixCell>
								))}
							</tr>
							<tr>
								<MatrixCell>Performance</MatrixCell>
								{selectedFlowTypes.map((flowType) => (
									<MatrixCell key={flowType} $rating={FlowMetrics[flowType].performance}>
										{FlowMetrics[flowType].performance}
									</MatrixCell>
								))}
							</tr>
							<tr>
								<MatrixCell>Complexity</MatrixCell>
								{selectedFlowTypes.map((flowType) => (
									<MatrixCell key={flowType} $rating={FlowMetrics[flowType].complexity}>
										{FlowMetrics[flowType].complexity}
									</MatrixCell>
								))}
							</tr>
							<tr>
								<MatrixCell>User Experience</MatrixCell>
								{selectedFlowTypes.map((flowType) => (
									<MatrixCell key={flowType} $rating={FlowMetrics[flowType].userExperience}>
										{FlowMetrics[flowType].userExperience}
									</MatrixCell>
								))}
							</tr>
							<tr>
								<MatrixCell>Token Security</MatrixCell>
								{selectedFlowTypes.map((flowType) => (
									<MatrixCell key={flowType} $rating={FlowMetrics[flowType].tokenSecurity}>
										{FlowMetrics[flowType].tokenSecurity}
									</MatrixCell>
								))}
							</tr>
						</tbody>
					</MatrixTable>
				</ComparisonMatrix>
			)}

			<RecommendationSection>
				<RecommendationHeader>
					<FiInfo style={{ color: '#166534' }} />
					<RecommendationTitle>{recommendation.title}</RecommendationTitle>
				</RecommendationHeader>

				<p style={{ color: '#15803d', marginBottom: '1rem', fontSize: '0.875rem' }}>
					{recommendation.description}
				</p>

				<RecommendationList>
					{recommendation.recommendations.map((rec, index) => (
						<li key={index}>{rec}</li>
					))}
				</RecommendationList>
			</RecommendationSection>
		</ComparisonContainer>
	);
};

export default FlowComparisonTool;
