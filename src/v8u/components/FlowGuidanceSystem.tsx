import {
	FiArrowRight,
	FiBook,
	FiCheck,
	FiChevronDown,
	FiInfo,
	FiLock,
	FiUsers,
	FiZap,
} from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';
import { type FlowType, type SpecVersion } from '@/v8/services/specVersionServiceV8';

const GuidanceContainer = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  margin: 1rem 0;
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

const _GuidanceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const _GuidanceTitle = styled.h3`
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const GuidanceSubtitle = styled.p`
  color: #64748b;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const UseCaseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const UseCaseCard = styled.div<{ $selected?: boolean }>`
  background: ${(props) => (props.$selected ? '#dbeafe' : 'white')};
  border: 2px solid ${(props) => (props.$selected ? '#3b82f6' : '#e2e8f0')};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const UseCaseIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f1f5f9;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  color: #3b82f6;
  font-size: 1.25rem;
`;

const UseCaseTitle = styled.h4`
  color: #1e293b;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const UseCaseDescription = styled.p`
  color: #64748b;
  font-size: 0.75rem;
  margin: 0;
  line-height: 1.4;
`;

const RecommendedFlow = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const RecommendedHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const RecommendedTitle = styled.h4`
  color: #166534;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
`;

const RecommendedDescription = styled.p`
  color: #15803d;
  font-size: 0.75rem;
  margin: 0;
  line-height: 1.4;
`;

const ActionButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
  margin-top: 1rem;
  
  &:hover {
    background: #2563eb;
  }
`;

interface UseCase {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	recommendedFlow: FlowType;
	recommendedSpec: SpecVersion;
	scenarios: string[];
}

const useCases: UseCase[] = [
	{
		id: 'web-app',
		title: 'Web Application Login',
		description:
			'Secure user authentication for traditional web applications with redirect-based flow',
		icon: <FiUsers />,
		recommendedFlow: 'oauth-authz',
		recommendedSpec: 'oidc',
		scenarios: ['User login', 'Single Sign-On', 'Profile access'],
	},
	{
		id: 'mobile-app',
		title: 'Mobile App Authentication',
		description: 'Authentication for mobile apps using PKCE for enhanced security',
		icon: <FiZap />,
		recommendedFlow: 'oauth-authz',
		recommendedSpec: 'oauth2.1',
		scenarios: ['Native mobile apps', 'PKCE security', 'No client secret'],
	},
	{
		id: 'server-api',
		title: 'Server-to-API Communication',
		description: 'Machine-to-machine communication between backend services',
		icon: <FiLock />,
		recommendedFlow: 'client-credentials',
		recommendedSpec: 'oauth2.1',
		scenarios: ['Backend services', 'API access', 'No user interaction'],
	},
	{
		id: 'device-auth',
		title: 'Device Authorization',
		description: 'Authentication for devices with limited input capabilities',
		icon: <FiBook />,
		recommendedFlow: 'device-code',
		recommendedSpec: 'oauth2.1',
		scenarios: ['IoT devices', 'Smart TVs', 'CLI applications'],
	},
	{
		id: 'spa-app',
		title: 'Single Page Application',
		description: 'Client-side applications with enhanced security requirements',
		icon: <FiCheck />,
		recommendedFlow: 'oauth-authz',
		recommendedSpec: 'oauth2.1',
		scenarios: ['React/Vue apps', 'PKCE required', 'No backend'],
	},
	{
		id: 'legacy-app',
		title: 'Legacy System Integration',
		description: 'Integration with older systems requiring implicit flow',
		icon: <FiInfo />,
		recommendedFlow: 'implicit',
		recommendedSpec: 'oauth2.0',
		scenarios: ['Older browsers', 'Simple tokens', 'Deprecated flows'],
	},
];

interface FlowGuidanceSystemProps {
	onFlowSelect?: (flowType: FlowType, specVersion: SpecVersion) => void;
	currentFlowType?: FlowType;
	currentSpecVersion?: SpecVersion;
}

export const FlowGuidanceSystem: React.FC<FlowGuidanceSystemProps> = ({
	currentFlowType,
	currentSpecVersion,
	onFlowSelect,
}) => {
	const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
	const [showRecommendation, setShowRecommendation] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);

	const handleUseCaseSelect = (useCaseId: string) => {
		setSelectedUseCase(useCaseId);
		setShowRecommendation(true);
	};

	const getSelectedUseCase = (): UseCase | undefined => {
		return useCases.find((uc) => uc.id === selectedUseCase);
	};

	const handleApplyRecommendation = () => {
		const useCase = getSelectedUseCase();
		if (useCase && onFlowSelect) {
			onFlowSelect(useCase.recommendedFlow, useCase.recommendedSpec);
		}
	};

	const getFlowLabel = (flowType: FlowType): string => {
		const labels: Record<FlowType, string> = {
			'oauth-authz': 'Authorization Code',
			implicit: 'Implicit',
			'client-credentials': 'Client Credentials',
			ropc: 'Resource Owner Password',
			'device-code': 'Device Code',
			hybrid: 'Hybrid',
		};
		return labels[flowType] || flowType;
	};

	const getSpecLabel = (specVersion: SpecVersion): string => {
		const labels = {
			'oauth2.0': 'OAuth 2.0',
			'oauth2.1': 'OAuth 2.1',
			oidc: 'OpenID Connect',
		};
		return labels[specVersion] || specVersion;
	};

	return (
		<GuidanceContainer>
			<CollapsibleHeaderButton
				onClick={() => setIsCollapsed(!isCollapsed)}
				aria-expanded={!isCollapsed}
			>
				<CollapsibleTitle>
					<FiBook style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
					Choose the Right OAuth Flow
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={isCollapsed}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>

			{!isCollapsed && (
				<CollapsibleContent>
					<GuidanceSubtitle>
						Select your use case below to get personalized recommendations for the best OAuth flow
						and specification version.
					</GuidanceSubtitle>

					<UseCaseGrid>
						{useCases.map((useCase) => (
							<UseCaseCard
								key={useCase.id}
								$selected={selectedUseCase === useCase.id}
								onClick={() => handleUseCaseSelect(useCase.id)}
							>
								<UseCaseIcon>{useCase.icon}</UseCaseIcon>
								<UseCaseTitle>{useCase.title}</UseCaseTitle>
								<UseCaseDescription>{useCase.description}</UseCaseDescription>
							</UseCaseCard>
						))}
					</UseCaseGrid>

					{showRecommendation &&
						selectedUseCase &&
						(() => {
							const useCase = getSelectedUseCase();
							if (!useCase) return null;

							const isCurrentRecommendation =
								currentFlowType === useCase.recommendedFlow &&
								currentSpecVersion === useCase.recommendedSpec;

							return (
								<RecommendedFlow>
									<RecommendedHeader>
										<FiCheck style={{ color: '#166534' }} />
										<RecommendedTitle>
											Recommended: {getFlowLabel(useCase.recommendedFlow)} with{' '}
											{getSpecLabel(useCase.recommendedSpec)}
										</RecommendedTitle>
									</RecommendedHeader>

									<RecommendedDescription>
										This combination is ideal for: {useCase.scenarios.join(', ')}
										{isCurrentRecommendation && ' ✅ (Currently selected)'}
									</RecommendedDescription>

									{!isCurrentRecommendation && (
										<ActionButton onClick={handleApplyRecommendation}>
											Apply Recommendation
											<FiArrowRight />
										</ActionButton>
									)}
								</RecommendedFlow>
							);
						})()}

					{selectedUseCase && (
						<div style={{ marginTop: '1rem', textAlign: 'center' }}>
							<small style={{ color: '#64748b' }}>
								💡 Need help understanding the differences?
								<a
									href="/v8u/unified/helper"
									style={{ color: '#3b82f6', textDecoration: 'none', marginLeft: '0.25rem' }}
								>
									View Flow Comparison Guide
								</a>
							</small>
						</div>
					)}
				</CollapsibleContent>
			)}
		</GuidanceContainer>
	);
};

export default FlowGuidanceSystem;
