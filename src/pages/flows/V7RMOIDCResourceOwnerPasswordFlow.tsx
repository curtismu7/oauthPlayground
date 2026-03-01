// src/pages/flows/V7RMOIDCResourceOwnerPasswordFlow.tsx - Enhanced with Real Services

import { FiAlertTriangle, FiLock, FiShield, FiUser } from '@icons';
import React, { useMemo } from 'react';
import CollapsibleSection from '../../components/CollapsibleSection';
import EnhancedStepFlowV2 from '../../components/EnhancedStepFlowV2';
import { FlowConfiguration } from '../../components/FlowConfiguration';
import createV7RMOIDCResourceOwnerPasswordSteps from '../../components/flow/createV7RMOIDCResourceOwnerPasswordSteps';
import FlowTemplate from '../../components/flow/FlowTemplate';
import InlineDocumentation, { QuickReference } from '../../components/InlineDocumentation';
import { InfoBox } from '../../components/steps/CommonSteps';
import { useV7RMOIDCResourceOwnerPasswordController } from '../../hooks/useV7RMOIDCResourceOwnerPasswordController';

const V7RMOIDCResourceOwnerPasswordFlow: React.FC = () => {
	const controller = useV7RMOIDCResourceOwnerPasswordController({
		flowKey: 'v7rm-oidc-resource-owner-password',
		defaultFlowVariant: 'oidc',
		enableDebugger: true,
	});

	const steps = useMemo(
		() => createV7RMOIDCResourceOwnerPasswordSteps({ controller }),
		[controller]
	);

	const highlights = useMemo(
		() => [
			{
				title: 'Enhanced Real API Integration',
				description:
					'This flow now uses real PingOne APIs for authentication and user info while adding OIDC extensions like ID tokens.',
				icon: <FiUser />,
				tone: 'success' as const,
			},
			{
				title: 'Security Awareness',
				description:
					'Learn why this flow is deprecated and understand the security risks involved with direct credential handling.',
				icon: <FiAlertTriangle />,
				tone: 'warning' as const,
			},
			{
				title: 'OIDC Extensions',
				description:
					'See how OIDC adds ID tokens, user info endpoints, and standardized claims to the basic OAuth flow.',
				icon: <FiShield />,
				tone: 'info' as const,
			},
		],
		[]
	);

	const education = useMemo(
		() => (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
				<InfoBox type="warning">
					<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
						<strong>⚠️ This is a Mock Implementation</strong>
						<span>
							PingOne does NOT support the Resource Owner Password flow. This is an educational
							simulation to help you understand how the flow would work and why it's deprecated.
						</span>
					</div>
				</InfoBox>

				<InlineDocumentation>
					<QuickReference
						title="OIDC Resource Owner Password Essentials"
						items={[
							{
								title: 'Direct Credentials',
								description:
									'Application collects username/password directly - major security risk in most scenarios.',
							},
							{
								title: 'OIDC Extensions',
								description:
									'Adds ID tokens with user claims, UserInfo endpoint access, and standardized OIDC scopes.',
							},
							{
								title: 'Deprecated Flow',
								description:
									'Avoid this flow - use Authorization Code with PKCE or other secure alternatives instead.',
							},
						]}
					/>
				</InlineDocumentation>

				<CollapsibleSection title="Why This Flow is Deprecated" defaultOpen>
					<ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6, color: '#dc2626' }}>
						<li>Applications must handle user passwords directly (security risk)</li>
						<li>No delegation of authentication to the authorization server</li>
						<li>Phishing attacks become easier to execute</li>
						<li>Violates the principle of least privilege</li>
						<li>OIDC benefits like SSO and MFA are lost</li>
						<li>Difficult to implement proper security controls</li>
					</ul>
				</CollapsibleSection>

				<CollapsibleSection title="Secure Alternatives">
					<ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6 }}>
						<li>
							<strong>OIDC Authorization Code Flow:</strong> Most secure for web applications
						</li>
						<li>
							<strong>OIDC Authorization Code with PKCE:</strong> Best for mobile and SPA
							applications
						</li>
						<li>
							<strong>OIDC Device Code Flow:</strong> For devices with limited input capabilities
						</li>
						<li>
							<strong>OIDC Client Credentials:</strong> For server-to-server communication
						</li>
					</ul>
				</CollapsibleSection>

				<InfoBox type="info">
					<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
						<strong>Educational Purpose Only</strong>
						<span>
							This mock flow demonstrates the mechanics and security concerns. In production, always
							use more secure OAuth 2.0 flows supported by your identity provider.
						</span>
					</div>
				</InfoBox>
			</div>
		),
		[]
	);

	return (
		<FlowTemplate
			title="Enhanced OIDC Resource Owner Password Flow"
			subtitle="Real API Integration with OIDC Extensions"
			description="Learn how the OIDC Resource Owner Password flow would work through this educational simulation. Understand the security risks and see why modern alternatives are preferred."
			badge={
				<span>
					<FiLock /> Enhanced - Real API + OIDC
				</span>
			}
			highlights={highlights}
			education={education}
		>
			<FlowConfiguration
				config={controller.flowConfig}
				onConfigChange={controller.handleFlowConfigChange}
				flowType="v7rm-oidc-resource-owner-password"
				isConfigured={controller.hasCredentialsSaved}
				initialExpanded={false}
				title="V7RM OIDC Configuration"
				subtitle="Configure mock credentials for educational purposes. No real authentication occurs."
			/>

			<EnhancedStepFlowV2
				title="V7RM OIDC Resource Owner Password Flow"
				steps={steps}
				persistKey={`${controller.persistKey}-enhanced-flow`}
				autoAdvance
				allowStepJumping
				initialStepIndex={controller.stepManager.currentStepIndex}
				onStepChange={(index) => controller.stepManager.setStep(index)}
			/>
		</FlowTemplate>
	);
};

export default V7RMOIDCResourceOwnerPasswordFlow;
