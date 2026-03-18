// src/pages/AIAgentOverview.PingUI.tsx
// AI Agent Overview - Ping UI Migrated Version
// Comprehensive overview of AI agent authentication and authorization capabilities

import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardBody } from '../components/Card';
import { CollapsibleHeader as V6CollapsibleHeader } from '../services/collapsibleHeaderService';

// Bootstrap Icon Component for Ping UI compliance
const BootstrapIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 20, ariaLabel, style = {} }) => {
	const getBootstrapIconClass = (iconName: string): string => {
		const iconMap: Record<string, string> = {
			FiKey: 'bi-key',
			FiLock: 'bi-lock',
			FiServer: 'bi-server',
			FiZap: 'bi-lightning',
			FiCheck: 'bi-check',
			FiX: 'bi-x',
			FiInfo: 'bi-info',
			FiBookOpen: 'bi-book',
			FiCode: 'bi-code',
			FiCpu: 'bi-cpu',
			FiExternalLink: 'bi-box-arrow-up-right',
			FiLayers: 'bi-layers',
			FiShield: 'bi-shield',
			FiUsers: 'bi-people',
		};
		return iconMap[iconName] || 'bi-question';
	};

	return (
		<i
			role="img"
			className={`bi ${getBootstrapIconClass(icon)}`}
			style={{
				fontSize: `${size}px`,
				...style,
			}}
			aria-label={ariaLabel}
			aria-hidden={!ariaLabel}
		/>
	);
};

// Ping UI namespace wrapper
const PingUIWrapper = styled.div`
  &.end-user-nano {
    /* All components inherit Ping UI styling */
    * {
      transition: var(--ping-transition-fast, 0.15s ease-in-out);
    }
  }
`;

const _Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--ping-spacing-lg, 1.5rem);
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--ping-spacing-xl, 2rem);
  margin: var(--ping-spacing-xl, 2rem) 0;
`;

const FeatureCard = styled(Card)<{ $supported?: boolean | null }>`
  border-left: 4px solid
    ${({ $supported }) =>
			$supported === true
				? 'var(--ping-color-success, #10b981)'
				: $supported === false
					? 'var(--ping-color-danger, #ef4444)'
					: 'var(--ping-color-warning, #f59e0b)'};
  transition: var(--ping-transition-fast, 0.15s ease-in-out);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--ping-shadow-lg, 0 8px 25px rgba(0, 0, 0, 0.1));
  }
`;

const FeatureHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ping-spacing-md, 1rem);
`;

const FeatureTitle = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.75rem);

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ping-color-text-primary, #111827);
    margin: 0;
  }

  i {
    color: var(--ping-color-primary, #2563eb);
  }
`;

const StatusBadge = styled.button<{ $status: 'supported' | 'not-supported' | 'partial' }>`
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-xs, 0.5rem);
  padding: var(--ping-spacing-xs, 0.5rem) var(--ping-spacing-sm, 0.75rem);
  border-radius: var(--ping-border-radius-md, 0.375rem);
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: var(--ping-transition-fast, 0.15s ease-in-out);

  ${({ $status }) => {
		switch ($status) {
			case 'supported':
				return `
          background-color: var(--ping-color-success-light, #d1fae5);
          color: var(--ping-color-success-dark, #065f46);
          &:hover {
            background-color: var(--ping-color-success, #10b981);
            color: white;
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(22, 101, 52, 0.2);
          }
        `;
			case 'not-supported':
				return `
          background-color: var(--ping-color-danger-light, #fee2e2);
          color: var(--ping-color-danger-dark, #991b1b);
          &:hover {
            background-color: var(--ping-color-danger, #ef4444);
            color: white;
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(153, 27, 27, 0.2);
          }
        `;
			case 'partial':
				return `
          background-color: var(--ping-color-warning-light, #fef3c7);
          color: var(--ping-color-warning-dark, #92400e);
          border: 2px solid var(--ping-color-warning, #f59e0b);
          box-shadow: 0 2px 4px rgba(217, 119, 6, 0.1);
          &:hover {
            background-color: var(--ping-color-warning, #f59e0b);
            color: white;
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
            border-color: #b45309;
          }
        `;
		}
	}}

  i {
    width: 16px;
    height: 16px;
  }

  &:focus {
    outline: 2px solid var(--ping-color-primary, #2563eb);
    outline-offset: 2px;
  }
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--ping-spacing-md, 1rem);
`;

const PopupContent = styled.div`
  background: white;
  border-radius: var(--ping-border-radius-lg, 0.75rem);
  padding: var(--ping-spacing-lg, 1.5rem);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--ping-shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
`;

const PopupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ping-spacing-md, 1rem);

  h3 {
    margin: 0;
    color: var(--ping-color-text-primary, #111827);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--ping-color-text-secondary, #6b7280);
  padding: var(--ping-spacing-xs, 0.25rem);
  border-radius: var(--ping-border-radius-sm, 0.25rem);
  transition: var(--ping-transition-fast, 0.15s ease-in-out);

  &:hover {
    background-color: var(--ping-color-gray-light, #f3f4f6);
    color: var(--ping-color-text-primary, #111827);
  }
`;

// Feature data
const aiFeatures = [
	{
		id: 'oauth2-for-ai-agents',
		title: 'OAuth 2.0 for AI Agents',
		description:
			'Standard OAuth 2.0 flows adapted for AI agent authentication with proper scope management and token handling.',
		icon: 'FiKey',
		supported: true,
		details:
			'AI agents can use standard OAuth 2.0 Authorization Code, Client Credentials, and Device Authorization flows with proper AI-specific scopes and token validation.',
	},
	{
		id: 'oidc-for-ai-agents',
		title: 'OpenID Connect for AI',
		description:
			'OIDC integration providing identity verification for AI agents with JWT tokens and user info endpoints.',
		icon: 'FiShield',
		supported: true,
		details:
			'Complete OpenID Connect support including ID tokens, userinfo endpoints, and AI-specific claims for agent identity verification.',
	},
	{
		id: 'machine-credentials',
		title: 'Machine-to-Machine Auth',
		description:
			'Client Credentials flow optimized for AI agent-to-agent communication and service authentication.',
		icon: 'FiServer',
		supported: true,
		details:
			'Optimized client credentials flow with JWT assertions, certificate-based authentication, and AI agent credential management.',
	},
	{
		id: 'device-auth-flow',
		title: 'Device Authorization Flow',
		description:
			'Device flow for AI agents running on constrained devices or headless environments.',
		icon: 'FiCpu',
		supported: 'partial',
		details:
			'Device Authorization Flow support for AI agents on IoT devices, headless systems, and constrained environments with polling optimization.',
	},
	{
		id: 'token-exchange',
		title: 'OAuth Token Exchange',
		description:
			'Token exchange for delegation and impersonation scenarios in multi-agent AI systems.',
		icon: 'FiZap',
		supported: false,
		details:
			'OAuth 2.0 Token Exchange for AI agent delegation, impersonation, and cross-system token translation in complex AI ecosystems.',
	},
	{
		id: 'jwt-bearer-grant',
		title: 'JWT Bearer Grant',
		description:
			'JWT-based authentication for AI agents using signed assertions for service-to-service communication.',
		icon: 'FiLock',
		supported: true,
		details:
			'JWT Bearer Grant Type for AI agent authentication with signed assertions, certificate validation, and service-to-service communication.',
	},
];

const AIAgentOverview: React.FC = () => {
	const [selectedFeature, setSelectedFeature] = useState<(typeof aiFeatures)[0] | null>(null);

	const getStatusConfig = (supported: boolean | null) => {
		if (supported === true)
			return { status: 'supported' as const, icon: 'FiCheck', label: 'Supported' };
		if (supported === false)
			return { status: 'not-supported' as const, icon: 'FiX', label: 'Not Supported' };
		return { status: 'partial' as const, icon: 'FiInfo', label: 'Partial Support' };
	};

	return (
		<PingUIWrapper className="end-user-nano">
			<_Container>
				<V6CollapsibleHeader
					title="AI Agent Authentication Overview"
					subtitle="Comprehensive overview of authentication and authorization capabilities for AI agents"
				/>

				<FeatureGrid>
					{aiFeatures.map((feature) => {
						const statusConfig = getStatusConfig(feature.supported);

						return (
							<FeatureCard key={feature.id} $supported={feature.supported}>
								<CardBody>
									<FeatureHeader>
										<FeatureTitle>
											<BootstrapIcon
												icon={feature.icon}
												size={24}
												ariaLabel={`${feature.title} icon`}
											/>
											<h3>{feature.title}</h3>
										</FeatureTitle>
										<StatusBadge
											$status={statusConfig.status}
											onClick={() => setSelectedFeature(feature)}
											aria-label={`View details for ${feature.title}`}
										>
											<BootstrapIcon icon={statusConfig.icon} size={16} />
											{statusConfig.label}
										</StatusBadge>
									</FeatureHeader>
									<p
										style={{ color: 'var(--ping-color-text-secondary, #6b7280)', lineHeight: 1.6 }}
									>
										{feature.description}
									</p>
								</CardBody>
							</FeatureCard>
						);
					})}
				</FeatureGrid>

				{selectedFeature && (
					<PopupOverlay onClick={() => setSelectedFeature(null)}>
						<PopupContent onClick={(e) => e.stopPropagation()}>
							<PopupHeader>
								<h3>
									<BootstrapIcon
										icon={selectedFeature.icon}
										size={20}
										style={{ marginRight: '0.5rem' }}
									/>
									{selectedFeature.title}
								</h3>
								<CloseButton onClick={() => setSelectedFeature(null)} aria-label="Close popup">
									<BootstrapIcon icon="FiX" size={20} />
								</CloseButton>
							</PopupHeader>
							<p style={{ color: 'var(--ping-color-text-secondary, #6b7280)', lineHeight: 1.6 }}>
								{selectedFeature.details}
							</p>
						</PopupContent>
					</PopupOverlay>
				)}
			</_Container>
		</PingUIWrapper>
	);
};

export default AIAgentOverview;
