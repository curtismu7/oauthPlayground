// src/pages/flows/V7RMOIDCResourceOwnerPasswordFlowEnhanced.tsx
// Enhanced V7RM OIDC Resource Owner Password Flow - Uses real services where possible

import React, { useMemo } from 'react';
import { FiAlertTriangle, FiInfo, FiLock, FiShield, FiUser } from 'react-icons/fi';
import CollapsibleSection from '../../components/CollapsibleSection';
import { FlowConfiguration } from '../../components/FlowConfiguration';
import createV7RMOIDCResourceOwnerPasswordEnhancedSteps from '../../components/flow/createV7RMOIDCResourceOwnerPasswordEnhancedSteps';
import FlowTemplate from '../../components/flow/FlowTemplate';
import InlineDocumentation, { QuickReference } from '../../components/InlineDocumentation';
import { InfoBox } from '../../components/steps/CommonSteps';
import { useV7RMOIDCResourceOwnerPasswordControllerEnhanced } from '../../hooks/useV7RMOIDCResourceOwnerPasswordControllerEnhanced';

const V7RMOIDCResourceOwnerPasswordFlowEnhanced: React.FC = () => {
	const controller = useV7RMOIDCResourceOwnerPasswordControllerEnhanced({
		flowKey: 'v7rm-oidc-resource-owner-password-enhanced',
		enableDebugger: true,
	});

	const steps = useMemo(
		() => createV7RMOIDCResourceOwnerPasswordEnhancedSteps({ controller }),
		[controller]
	);

	const highlights = useMemo(
		() => [
			{
				title: 'Enhanced Real API Integration',
				description:
					'This flow uses real PingOne APIs for authentication and user info while adding OIDC extensions like ID tokens.',
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

	const documentation = useMemo(
		() => [
			{
				title: 'Resource Owner Password Flow',
				content: `
The Resource Owner Password Credentials grant type allows a resource owner to provide its username 
and password directly to the client application. This flow is **deprecated** and should only be used 
when legacy applications require it and direct access to user credentials is acceptable.

**Security Considerations:**
- Client has direct access to user credentials
- Higher security risk compared to authorization code flow
- Not recommended for public clients
- PingOne supports this for legacy migration scenarios

**OIDC Extensions:**
- Adds ID tokens for user authentication
- Includes standard claims (name, email, etc.)
- Provides user info endpoint for additional claims
- Maintains compatibility with OAuth 2.0
				`,
				icon: <FiLock />,
			},
			{
				title: 'Real API Integration',
				content: `
This enhanced flow uses real PingOne APIs where possible:

**Real Services:**
- ✅ Real authentication via PingOne token endpoint
- ✅ Real user info via PingOne userinfo endpoint  
- ✅ Real token refresh via PingOne token endpoint
- ✅ Real credential management and storage

**Mock Enhancements:**
- 🔄 Mock ID token generation (when PingOne doesn't provide one)
- 🔄 Enhanced OIDC claims for educational purposes
- 🔄 Comprehensive error handling and debugging

**API Endpoints Used:**
- \`/api/token-exchange\` - Real PingOne token endpoint
- \`/api/userinfo\` - Real PingOne userinfo endpoint
- Real environment ID and client credentials
				`,
				icon: <FiInfo />,
			},
		],
		[]
	);

	const quickReference = useMemo(
		() => [
			{
				title: 'OAuth 2.0 + OIDC Flow',
				items: [
					'Grant Type: password',
					'Authentication: Direct credentials',
					'Tokens: Access + Refresh + ID (OIDC)',
					'User Info: Real API call',
					'Scope: openid profile email',
				],
			},
			{
				title: 'Security Best Practices',
				items: [
					'Use only for legacy applications',
					'Consider authorization code flow instead',
					'Secure credential storage',
					'Implement proper error handling',
					'Use HTTPS for all requests',
				],
			},
			{
				title: 'PingOne Integration',
				items: [
					'Real environment ID required',
					'Valid client credentials needed',
					'User must exist in PingOne',
					'Proper scope configuration',
					'Client authentication method',
				],
			},
		],
		[]
	);

	return (
		<FlowTemplate
			title="Enhanced OIDC Resource Owner Password Flow"
			subtitle="Real API Integration with OIDC Extensions"
			controller={controller}
			steps={steps}
			highlights={highlights}
		>
			<CollapsibleSection title="Documentation" defaultExpanded={false}>
				<InlineDocumentation sections={documentation} />
			</CollapsibleSection>

			<CollapsibleSection title="Quick Reference" defaultExpanded={false}>
				<QuickReference sections={quickReference} />
			</CollapsibleSection>

			<CollapsibleSection title="Configuration" defaultExpanded={true}>
				<FlowConfiguration
					controller={controller}
					fields={[
						{
							key: 'environmentId',
							label: 'Environment ID',
							type: 'text',
							placeholder: 'your-pingone-environment-id',
							required: true,
						},
						{
							key: 'clientId',
							label: 'Client ID',
							type: 'text',
							placeholder: 'your-client-id',
							required: true,
						},
						{
							key: 'clientSecret',
							label: 'Client Secret',
							type: 'password',
							placeholder: 'your-client-secret',
							required: true,
						},
						{
							key: 'username',
							label: 'Username',
							type: 'text',
							placeholder: 'user@example.com',
							required: true,
						},
						{
							key: 'password',
							label: 'Password',
							type: 'password',
							placeholder: 'user-password',
							required: true,
						},
						{
							key: 'scope',
							label: 'Scope',
							type: 'text',
							placeholder: 'openid profile email',
							defaultValue: 'openid profile email',
							required: true,
						},
						{
							key: 'clientAuthMethod',
							label: 'Client Authentication Method',
							type: 'select',
							options: [
								{ value: 'client_secret_basic', label: 'Client Secret Basic' },
								{ value: 'client_secret_post', label: 'Client Secret Post' },
							],
							defaultValue: 'client_secret_basic',
						},
					]}
				/>
			</CollapsibleSection>

			<InfoBox
				title="Enhanced Real API Flow"
				message="This flow uses real PingOne APIs for authentication and user information while adding OIDC extensions. The ID token is generated when not provided by PingOne to demonstrate OIDC capabilities."
				type="info"
			/>

			<InfoBox
				title="Security Warning"
				message="The Resource Owner Password flow is deprecated due to security risks. Consider using the Authorization Code flow with PKCE for new applications."
				type="warning"
			/>
		</FlowTemplate>
	);
};

export default V7RMOIDCResourceOwnerPasswordFlowEnhanced;
