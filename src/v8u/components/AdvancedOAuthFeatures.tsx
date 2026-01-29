import React, { useEffect, useState } from 'react';
import { FiChevronDown, FiInfo, FiKey, FiLock, FiServer, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
import { PingOneClientServiceV8U } from '../services/pingOneClientServiceV8U';
import FeatureEnableConfirmationModal from './FeatureEnableConfirmationModal';

// Collapsible components
const CollapsibleSection = styled.div`
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.5rem 1.75rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: 3px solid transparent;
	border-radius: 1rem;
	cursor: pointer;
	font-size: 1.2rem;
	font-weight: 700;
	color: #14532d;
	transition: all 0.3s ease;
	position: relative;
	box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);

	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
		border-color: #86efac;
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(34, 197, 94, 0.2);
	}

	&:active {
		transform: translateY(0);
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	border: 3px solid #3b82f6;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	transition: all 0.3s ease;
	cursor: pointer;
	color: #3b82f6;
	box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);

	&:hover {
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
		border-color: #2563eb;
		color: #2563eb;
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)')};
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
	}

	svg {
		width: 24px;
		height: 24px;
		stroke-width: 3px;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
	}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const AdvancedFeaturesContainer = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const FeaturesHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const FeaturesTitle = styled.h3`
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const FeaturesSubtitle = styled.p`
  color: #64748b;
  font-size: 0.875rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const FeatureCard = styled.div<{ $enabled: boolean; $supported: boolean }>`
  background: ${(props) => (props.$enabled ? '#f0fdf4' : props.$supported ? 'white' : '#fef2f2')};
  border: 2px solid ${(props) => (props.$enabled ? '#86efac' : props.$supported ? '#e2e8f0' : '#fecaca')};
  border-radius: 8px;
  padding: 1rem;
  cursor: ${(props) => (props.$supported ? 'pointer' : 'not-allowed')};
  transition: all 0.2s ease;
  opacity: ${(props) => (props.$supported ? '1' : '0.6')};
  
  &:hover {
    ${(props) =>
			props.$supported &&
			`
      border-color: ${props.$enabled ? '#22c55e' : '#3b82f6'};
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    `}
  }
`;

const FeatureHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const FeatureTitle = styled.h4<{ $supported: boolean }>`
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  color: ${(props) => (props.$supported ? '#1e293b' : '#64748b')};
`;

const FeatureStatus = styled.div<{ $enabled: boolean; $supported: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${(props) => {
		if (!props.$supported) return '#64748b';
		if (props.$enabled) return '#166534';
		return '#64748b';
	}};
`;

const FeatureDescription = styled.p<{ $supported: boolean }>`
  font-size: 0.75rem;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  color: ${(props) => (props.$supported ? '#64748b' : '#9ca3af')};
`;

const FeatureDetails = styled.div<{ $expanded: boolean }>`
  display: ${(props) => (props.$expanded ? 'block' : 'none')};
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
`;

const FeatureRequirements = styled.div`
  margin-bottom: 0.5rem;
`;

const RequirementTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const RequirementList = styled.ul`
  margin: 0;
  padding-left: 1rem;
  font-size: 0.6875rem;
  color: #64748b;
  line-height: 1.4;
`;

const FeatureToggle = styled.button<{ $enabled: boolean; $supported: boolean }>`
  background: ${(props) => (props.$enabled ? '#22c55e' : props.$supported ? '#3b82f6' : '#9ca3af')};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: ${(props) => (props.$supported ? 'pointer' : 'not-allowed')};
  transition: background-color 0.2s ease;
  opacity: ${(props) => (props.$supported ? '1' : '0.5')};
  
  &:hover {
    ${(props) =>
			props.$supported &&
			`
      background: ${props.$enabled ? '#16a34a' : '#2563eb'};
    `}
  }
`;

interface AdvancedFeature {
	id: string;
	name: string;
	description: string;
	icon: React.ReactNode;
	enabled: boolean;
	supported: boolean;
	requirements: string[];
	benefits: string[];
	specVersions: SpecVersion[];
	flowTypes: FlowType[];
	expanded?: boolean;
}

interface AdvancedOAuthFeaturesProps {
	flowType: FlowType;
	specVersion: SpecVersion;
	onFeatureToggle?: (featureId: string, enabled: boolean) => void;
	enabledFeatures?: string[];
}

export const AdvancedOAuthFeatures: React.FC<AdvancedOAuthFeaturesProps> = ({
	flowType,
	specVersion,
	onFeatureToggle,
	enabledFeatures = [],
}) => {
	const [isCollapsed, setIsCollapsed] = useState(true); // Collapsed by default
	const [features, setFeatures] = useState<AdvancedFeature[]>([]);

	// Modal state for confirmation
	const [showModal, setShowModal] = useState(false);
	const [pendingFeature, setPendingFeature] = useState<{
		id: string;
		name: string;
		isEnabling: boolean;
	} | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);

	useEffect(() => {
		const initialFeatures: AdvancedFeature[] = [
			{
				id: 'par',
				name: 'Pushed Authorization Request (PAR)',
				description: 'Secure authorization requests by pushing them to the authorization server',
				icon: <FiKey />,
				enabled: enabledFeatures.includes('par'),
				supported: specVersion === 'oauth2.1' || specVersion === 'oidc',
				requirements: [
					'Authorization server must support PAR endpoint',
					'Client must be capable of making POST requests',
					'Request JWT must be signed and valid',
				],
				benefits: [
					'Prevents authorization request tampering',
					'Reduces URL length limitations',
					'Enhanced security for sensitive parameters',
				],
				specVersions: ['oauth2.1', 'oidc'],
				flowTypes: ['oauth-authz'],
				expanded: false,
			},
			{
				id: 'jar',
				name: 'JWT Secured Authorization Request (JAR)',
				description:
					'Secure authorization requests using signed JWTs to prevent parameter tampering',
				icon: <FiKey />,
				enabled: enabledFeatures.includes('jar'),
				supported: specVersion === 'oauth2.1' || specVersion === 'oidc',
				requirements: [
					'Client must have signing keys',
					'Authorization server must validate JWT signatures',
					'Request JWT must include required claims',
				],
				benefits: [
					'Cryptographic integrity of request parameters',
					'Prevents parameter injection attacks',
					'Supports request authentication',
					'Enhanced security for sensitive flows',
				],
				specVersions: ['oauth2.1', 'oidc'],
				flowTypes: ['oauth-authz', 'implicit', 'hybrid'],
				expanded: false,
			},
			{
				id: 'mtls',
				name: 'Mutual TLS (mTLS)',
				description:
					'Use client certificates for mutual authentication between client and authorization server',
				icon: <FiLock />,
				enabled: enabledFeatures.includes('mtls'),
				supported: true, // mTLS can be supported across all versions
				requirements: [
					'Client must have X.509 certificate',
					'Authorization server must support mTLS',
					'TLS termination must be properly configured',
					'Certificate validation infrastructure required',
				],
				benefits: [
					'Strong client authentication',
					'Certificate-based identity verification',
					'Enhanced security for token requests',
					'Supports zero-trust architectures',
				],
				specVersions: ['oauth2.0', 'oauth2.1', 'oidc'],
				flowTypes: ['oauth-authz', 'client-credentials', 'hybrid'],
				expanded: false,
			},
			{
				id: 'dpop',
				name: 'Demonstration of Proof-of-Possession (DPoP)',
				description: 'Bind tokens to a specific client using proof-of-possession keys',
				icon: <FiServer />,
				enabled: enabledFeatures.includes('dpop'),
				supported: specVersion === 'oauth2.1' || specVersion === 'oidc',
				requirements: [
					'Client must generate DPoP keys',
					'Authorization server must validate DPoP proofs',
					'Resource servers must support DPoP validation',
				],
				benefits: [
					'Prevents token replay attacks',
					'Binds tokens to specific client instances',
					'Enhanced security for public clients',
					'Supports token sender constraining',
				],
				specVersions: ['oauth2.1', 'oidc'],
				flowTypes: ['oauth-authz', 'client-credentials'],
				expanded: false,
			},
		];

		setFeatures(initialFeatures);
	}, [enabledFeatures, specVersion]);

	const toggleFeature = (featureId: string) => {
		const feature = features.find((f) => f.id === featureId);
		if (!feature || !feature.supported) return;

		const isEnabling = !feature.enabled;

		// Set pending feature for modal
		setPendingFeature({
			id: featureId,
			name: feature.name,
			isEnabling,
		});

		// Show confirmation modal
		setShowModal(true);
	};

	const handleConfirmFeatureToggle = async () => {
		if (!pendingFeature) return;

		setIsUpdating(true);

		try {
			// Generate change descriptions
			const _changes = PingOneClientServiceV8U.generateChangeDescriptions(
				pendingFeature.id,
				pendingFeature.name,
				pendingFeature.isEnabling,
				'OAuth Playground App'
			);

			// Update PingOne client and app configuration
			const result = await PingOneClientServiceV8U.updateFeatureConfiguration(
				'client-id-123', // This would come from current credentials
				'OAuth Playground App',
				pendingFeature.id,
				pendingFeature.name,
				pendingFeature.isEnabling
			);

			if (result.success) {
				// Update local state
				setFeatures((prev) =>
					prev.map((feature) => {
						if (feature.id === pendingFeature.id) {
							return { ...feature, enabled: !feature.enabled };
						}
						return feature;
					})
				);

				// Call parent callback
				onFeatureToggle?.(pendingFeature.id, !feature.enabled);

				// Show success message
				toastV8.success(
					pendingFeature.isEnabling
						? `${pendingFeature.name} enabled successfully!`
						: `${pendingFeature.name} disabled successfully!`
				);
			} else {
				toastV8.error(`Failed to update ${pendingFeature.name}: ${result.error}`);
			}
		} catch (error) {
			logger.error('Failed to toggle feature:', error);
			toastV8.error(`Failed to update ${pendingFeature.name}`);
		} finally {
			setIsUpdating(false);
			setShowModal(false);
			setPendingFeature(null);
		}
	};

	const toggleFeatureExpanded = (featureId: string) => {
		setFeatures((prev) =>
			prev.map((feature) =>
				feature.id === featureId ? { ...feature, expanded: !feature.expanded } : feature
			)
		);
	};

	const getFeatureIcon = (feature: AdvancedFeature) => {
		if (!feature.supported) return <FiX style={{ color: '#ef4444' }} />;
		if (feature.enabled) return <FiCheck style={{ color: '#22c55e' }} />;
		return feature.icon;
	};

	const getSupportedFeatures = () => {
		return features.filter(
			(feature) =>
				feature.supported &&
				feature.specVersions.includes(specVersion) &&
				feature.flowTypes.includes(flowType)
		);
	};

	const supportedFeatures = getSupportedFeatures();

	return (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => setIsCollapsed(!isCollapsed)}
				aria-expanded={!isCollapsed}
			>
				<CollapsibleTitle>
					<FiShield style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
					Advanced OAuth Features
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={isCollapsed}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!isCollapsed && (
				<CollapsibleContent>
					<AdvancedFeaturesContainer>
						<FeaturesHeader>
							<FiShield style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
							<FeaturesTitle>Advanced OAuth Features</FeaturesTitle>
						</FeaturesHeader>

						<FeaturesSubtitle>
							Enhance security and functionality with advanced OAuth 2.1 and OpenID Connect
							features. Availability depends on your current flow type and specification version.
						</FeaturesSubtitle>

						<FeaturesGrid>
							{features.map((feature) => (
								<FeatureCard
									key={feature.id}
									$enabled={feature.enabled}
									$supported={feature.supported}
									onClick={() => feature.supported && toggleFeatureExpanded(feature.id)}
								>
									<FeatureHeader>
										<FeatureTitle $supported={feature.supported}>{feature.name}</FeatureTitle>
										<FeatureStatus $enabled={feature.enabled} $supported={feature.supported}>
											{getFeatureIcon(feature)}
											<span>
												{feature.enabled
													? 'Enabled'
													: feature.supported
														? 'Available'
														: 'Not Supported'}
											</span>
										</FeatureStatus>
									</FeatureHeader>

									<FeatureDescription $supported={feature.supported}>
										{feature.description}
									</FeatureDescription>

									<FeatureDetails $expanded={feature.expanded || false}>
										<FeatureRequirements>
											<RequirementTitle>Requirements:</RequirementTitle>
											<RequirementList>
												{feature.requirements.map((req, index) => (
													<li key={index}>{req}</li>
												))}
											</RequirementList>
										</FeatureRequirements>

										<FeatureRequirements>
											<RequirementTitle>Benefits:</RequirementTitle>
											<RequirementList>
												{feature.benefits.map((benefit, index) => (
													<li key={index}>{benefit}</li>
												))}
											</RequirementList>
										</FeatureRequirements>
									</FeatureDetails>
									<FeatureToggle
										$enabled={feature.enabled}
										$supported={feature.supported}
										onClick={() => feature.supported && toggleFeature(feature.id)}
										disabled={!feature.supported}
									>
										{feature.enabled ? 'Disable' : 'Enable'}
									</FeatureToggle>
								</FeatureCard>
							))}
						</FeaturesGrid>

						{supportedFeatures.length === 0 && (
							<div
								style={{
									background: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '8px',
									padding: '1rem',
									textAlign: 'center',
									color: '#991b1b',
									fontSize: '0.875rem',
								}}
							>
								<FiInfo style={{ marginRight: '0.5rem' }} />
								No advanced features are available for the current flow type and specification
								version. Try switching to OAuth 2.1 or OpenID Connect for more feature support.
							</div>
						)}

						<div style={{ marginTop: '1rem', textAlign: 'center' }}>
							<small style={{ color: '#64748b' }}>
								🔧 Advanced features require authorization server support and additional
								configuration.
								<br />
								Current flow: <strong>{flowType}</strong> | Spec: <strong>{specVersion}</strong>
							</small>
						</div>
					</AdvancedFeaturesContainer>
				</CollapsibleContent>
			)}

			{/* Confirmation Modal */}
			{showModal && pendingFeature && (
				<FeatureEnableConfirmationModal
					isOpen={showModal}
					onClose={() => {
						setShowModal(false);
						setPendingFeature(null);
					}}
					onConfirm={handleConfirmFeatureToggle}
					featureName={pendingFeature.name}
					featureId={pendingFeature.id}
					isEnabling={pendingFeature.isEnabling}
					appName="OAuth Playground App"
					changes={PingOneClientServiceV8U.generateChangeDescriptions(
						pendingFeature.id,
						pendingFeature.name,
						pendingFeature.isEnabling,
						'OAuth Playground App'
					)}
					isLoading={isUpdating}
				/>
			)}
		</CollapsibleSection>
	);
};

export default AdvancedOAuthFeatures;
