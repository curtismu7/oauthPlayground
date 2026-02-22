import React, { useState } from 'react';
import styled from 'styled-components';
import { type FlowType } from '@/v8/services/specVersionServiceV8';

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
			role="img"
		></span>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiArrowRight: 'mdi-arrow-right',
		FiBarChart2: 'mdi-chart-bar',
		FiCheck: 'mdi-check',
		FiClock: 'mdi-clock',
		FiDatabase: 'mdi-database',
		FiInfo: 'mdi-information',
		FiLock: 'mdi-lock',
		FiShield: 'mdi-shield',
		FiUsers: 'mdi-account-group',
		FiX: 'mdi-close',
		FiZap: 'mdi-flash',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

const ComparisonContainer = styled.div`
  background: linear-gradient(135deg, var(--ping-surface-secondary, #f8fafc) 0%, var(--ping-border-hover, #e2e8f0) 100%);
  border: 1px solid var(--ping-border-default, #cbd5e1);
  border-radius: var(--ping-border-radius-lg, 12px);
  padding: var(--ping-spacing-lg, 1.5rem);
  margin: var(--ping-spacing-md, 1rem) 0;
`;

const ComparisonHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.75rem);
  margin-bottom: var(--ping-spacing-lg, 1.5rem);
`;

const ComparisonTitle = styled.h3`
  color: var(--ping-text-primary, #1e293b);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const ComparisonSubtitle = styled.p`
  color: var(--ping-text-secondary, #64748b);
  font-size: 0.875rem;
  margin: 0 0 var(--ping-spacing-lg, 1.5rem) 0;
  line-height: 1.5;
`;

const FlowSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--ping-spacing-md, 1rem);
  margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const FlowCard = styled.div<{ $selected: boolean; $brandColor?: string }>`
  background: ${({ $selected, $brandColor }) =>
		$selected
			? $brandColor || 'var(--ping-primary-color, #3b82f6)'
			: 'var(--ping-surface-primary, white)'};
  border: 2px solid ${({ $selected, $brandColor }) =>
		$selected
			? $brandColor || 'var(--ping-primary-color, #3b82f6)'
			: 'var(--ping-border-default, #e2e8f0)'};
  border-radius: var(--ping-border-radius-md, 8px);
  padding: var(--ping-spacing-md, 1rem);
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--ping-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
  }

  ${({ $selected }) =>
		$selected &&
		`
    color: white;
  `}
`;

const FlowIcon = styled.div`
  font-size: 2rem;
  margin-bottom: var(--ping-spacing-sm, 0.5rem);
`;

const FlowName = styled.div`
  font-weight: 600;
  margin-bottom: var(--ping-spacing-xs, 0.25rem);
`;

const FlowDescription = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
`;

const ComparisonTable = styled.div`
  background: var(--ping-surface-primary, white);
  border: 1px solid var(--ping-border-default, #e2e8f0);
  border-radius: var(--ping-border-radius-md, 8px);
  overflow: hidden;
`;

const TableHeader = styled.div`
  background: var(--ping-surface-secondary, #f8fafc);
  border-bottom: 1px solid var(--ping-border-default, #e2e8f0);
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  padding: var(--ping-spacing-md, 1rem);
  font-weight: 600;
  color: var(--ping-text-primary, #1e293b);
`;

const TableRow = styled.div<{ $highlighted?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  padding: var(--ping-spacing-md, 1rem);
  border-bottom: 1px solid var(--ping-border-light, #f1f5f9);
  transition: background-color var(--ping-transition-fast, 0.15s) ease-in-out;

  &:last-child {
    border-bottom: none;
  }

  ${({ $highlighted }) =>
		$highlighted &&
		`
    background: var(--ping-info-light, #eff6ff);
  `}

  &:hover {
    background: var(--ping-surface-secondary, #f8fafc);
  }
`;

const FeatureCell = styled.div<{ $available: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ping-spacing-xs, 0.25rem);
  color: ${({ $available }) =>
		$available ? 'var(--ping-success-color, #10b981)' : 'var(--ping-text-secondary, #64748b)'};
`;

const FeatureName = styled.div`
  font-weight: 500;
  color: var(--ping-text-primary, #1e293b);
`;

const FeatureDescription = styled.div`
  font-size: 0.75rem;
  color: var(--ping-text-secondary, #64748b);
  margin-top: var(--ping-spacing-xs, 0.25rem);
`;

const RatingCell = styled.div<{ $rating: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
`;

const Star = styled.div<{ $filled: boolean }>`
  color: ${({ $filled }) =>
		$filled ? 'var(--ping-warning-color, #f59e0b)' : 'var(--ping-border-default, #e2e8f0)'};
`;

const InfoTooltip = styled.div`
  position: relative;
  display: inline-block;
  margin-left: var(--ping-spacing-xs, 0.25rem);
  cursor: help;
`;

const TooltipContent = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--ping-text-primary, #1e293b);
  color: white;
  padding: var(--ping-spacing-sm, 0.5rem);
  border-radius: var(--ping-border-radius-sm, 4px);
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 1000;
  margin-bottom: var(--ping-spacing-xs, 0.25rem);
  opacity: 0;
  visibility: hidden;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

  ${InfoTooltip}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

interface FlowComparisonToolProps {
	selectedFlows?: FlowType[];
	onFlowSelect?: (flows: FlowType[]) => void;
}

interface FlowData {
	type: FlowType;
	name: string;
	description: string;
	icon: string;
	brandColor?: string;
}

interface FeatureData {
	name: string;
	description: string;
	oauth2: boolean;
	oidc: boolean;
	pkce: boolean;
	hybrid: boolean;
	complexity: number;
	security: number;
	popularity: number;
}

export const FlowComparisonToolPingUI: React.FC<FlowComparisonToolProps> = ({
	selectedFlows = ['oauth-authz', 'oidc-authz'],
	onFlowSelect,
}) => {
	const [flows, setFlows] = useState<FlowData[]>([
		{
			type: 'oauth-authz',
			name: 'OAuth 2.0 Authorization Code',
			description: 'Standard OAuth 2.0 authorization code flow',
			icon: 'FiLock',
			brandColor: '#3b82f6',
		},
		{
			type: 'oidc-authz',
			name: 'OpenID Connect Authorization Code',
			description: 'OAuth 2.0 with ID token for authentication',
			icon: 'FiShield',
			brandColor: '#10b981',
		},
		{
			type: 'oauth-pkce',
			name: 'OAuth 2.0 with PKCE',
			description: 'Enhanced security for public clients',
			icon: 'FiZap',
			brandColor: '#f59e0b',
		},
		{
			type: 'oidc-hybrid',
			name: 'OpenID Connect Hybrid',
			description: 'Combination of code and token response',
			icon: 'FiDatabase',
			brandColor: '#8b5cf6',
		},
	]);

	const features: FeatureData[] = [
		{
			name: 'ID Token',
			description: 'Provides user authentication information',
			oauth2: false,
			oidc: true,
			pkce: false,
			hybrid: true,
			complexity: 2,
			security: 4,
			popularity: 4,
		},
		{
			name: 'Access Token',
			description: 'Grants access to protected resources',
			oauth2: true,
			oidc: true,
			pkce: true,
			hybrid: true,
			complexity: 1,
			security: 3,
			popularity: 5,
		},
		{
			name: 'Refresh Token',
			description: 'Allows token renewal without user interaction',
			oauth2: true,
			oidc: true,
			pkce: true,
			hybrid: true,
			complexity: 2,
			security: 3,
			popularity: 4,
		},
		{
			name: 'PKCE Support',
			description: 'Proof Key for Code Exchange security',
			oauth2: false,
			oidc: false,
			pkce: true,
			hybrid: false,
			complexity: 3,
			security: 5,
			popularity: 3,
		},
		{
			name: 'Single Sign-On',
			description: 'One login for multiple applications',
			oauth2: false,
			oidc: true,
			pkce: false,
			hybrid: true,
			complexity: 3,
			security: 4,
			popularity: 5,
		},
	];

	const toggleFlow = (flowType: FlowType) => {
		let newSelection: FlowType[];

		if (selectedFlows.includes(flowType)) {
			// Don't allow deselecting the last flow
			if (selectedFlows.length > 1) {
				newSelection = selectedFlows.filter((f) => f !== flowType);
			} else {
				newSelection = selectedFlows;
			}
		} else {
			// Allow up to 4 flows to be selected
			if (selectedFlows.length < 4) {
				newSelection = [...selectedFlows, flowType];
			} else {
				newSelection = [flowType]; // Replace with new selection
			}
		}

		setFlows(
			flows.map((flow) =>
				flow.type === flowType ? { ...flow, $selected: newSelection.includes(flowType) } : flow
			)
		);

		onFlowSelect?.(newSelection);
	};

	const renderRating = (rating: number) => {
		return (
			<RatingCell $rating={rating}>
				{[1, 2, 3, 4, 5].map((star) => (
					<Star key={star} $filled={star <= rating}>
						<MDIIcon icon="FiStar" size={12} ariaHidden={true} />
					</Star>
				))}
			</RatingCell>
		);
	};

	const getFeatureAvailability = (feature: FeatureData, flowType: FlowType) => {
		switch (flowType) {
			case 'oauth-authz':
				return feature.oauth2;
			case 'oidc-authz':
				return feature.oidc;
			case 'oauth-pkce':
				return feature.pkce;
			case 'oidc-hybrid':
				return feature.hybrid;
			default:
				return false;
		}
	};

	return (
		<div className="end-user-nano">
			<ComparisonContainer>
				<ComparisonHeader>
					<MDIIcon icon="FiBarChart2" size={24} ariaLabel="Comparison Chart" />
					<ComparisonTitle>Flow Comparison Tool</ComparisonTitle>
				</ComparisonHeader>

				<ComparisonSubtitle>
					Compare different OAuth and OpenID Connect flows to understand their features, security
					levels, and use cases. Select up to 4 flows to compare side by side.
				</ComparisonSubtitle>

				<FlowSelector>
					{flows.map((flow) => (
						<FlowCard
							key={flow.type}
							$selected={selectedFlows.includes(flow.type)}
							$brandColor={flow.brandColor}
							onClick={() => toggleFlow(flow.type)}
						>
							<FlowIcon>
								<MDIIcon icon={flow.icon} size={32} ariaLabel={flow.name} />
							</FlowIcon>
							<FlowName>{flow.name}</FlowName>
							<FlowDescription>{flow.description}</FlowDescription>
						</FlowCard>
					))}
				</FlowSelector>

				<ComparisonTable>
					<TableHeader>
						<div>Feature</div>
						{selectedFlows.map((flowType) => {
							const flow = flows.find((f) => f.type === flowType);
							return (
								<div key={flowType} style={{ textAlign: 'center' }}>
									{flow?.name || flowType}
								</div>
							);
						})}
					</TableHeader>

					{features.map((feature, index) => (
						<TableRow key={index} $highlighted={index % 2 === 0}>
							<div>
								<FeatureName>{feature.name}</FeatureName>
								<FeatureDescription>{feature.description}</FeatureDescription>
							</div>
							{selectedFlows.map((flowType) => (
								<FeatureCell key={flowType} $available={getFeatureAvailability(feature, flowType)}>
									{getFeatureAvailability(feature, flowType) ? (
										<>
											<MDIIcon icon="FiCheck" size={16} ariaLabel="Available" />
											<span>Yes</span>
										</>
									) : (
										<>
											<MDIIcon icon="FiX" size={16} ariaLabel="Not Available" />
											<span>No</span>
										</>
									)}
								</FeatureCell>
							))}
						</TableRow>
					))}

					<TableRow style={{ background: 'var(--ping-surface-secondary, #f8fafc)' }}>
						<div style={{ fontWeight: '600' }}>
							Complexity
							<InfoTooltip>
								<MDIIcon icon="FiInfo" size={14} ariaLabel="Info" />
								<TooltipContent>Implementation complexity (1=Simple, 5=Complex)</TooltipContent>
							</InfoTooltip>
						</div>
						{selectedFlows.map((flowType) => {
							const feature = features.find((f) => getFeatureAvailability(f, flowType));
							const complexity = feature ? feature.complexity : 1;
							return renderRating(complexity);
						})}
					</TableRow>

					<TableRow>
						<div style={{ fontWeight: '600' }}>
							Security
							<InfoTooltip>
								<MDIIcon icon="FiInfo" size={14} ariaLabel="Info" />
								<TooltipContent>Security level (1=Basic, 5=High)</TooltipContent>
							</InfoTooltip>
						</div>
						{selectedFlows.map((flowType) => {
							const feature = features.find((f) => getFeatureAvailability(f, flowType));
							const security = feature ? feature.security : 1;
							return renderRating(security);
						})}
					</TableRow>

					<TableRow style={{ background: 'var(--ping-surface-secondary, #f8fafc)' }}>
						<div style={{ fontWeight: '600' }}>
							Popularity
							<InfoTooltip>
								<MDIIcon icon="FiInfo" size={14} ariaLabel="Info" />
								<TooltipContent>Industry adoption (1=Low, 5=High)</TooltipContent>
							</InfoTooltip>
						</div>
						{selectedFlows.map((flowType) => {
							const feature = features.find((f) => getFeatureAvailability(f, flowType));
							const popularity = feature ? feature.popularity : 1;
							return renderRating(popularity);
						})}
					</TableRow>
				</ComparisonTable>
			</ComparisonContainer>
		</div>
	);
};

export default FlowComparisonToolPingUI;
