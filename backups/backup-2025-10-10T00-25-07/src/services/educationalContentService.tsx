import React, { useState } from 'react';
import styled from 'styled-components';
import { FiInfo, FiCheck, FiX, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { CollapsibleHeader, type CollapsibleHeaderConfig } from './collapsibleHeaderService';

// Educational content types
export interface EducationalContent {
	title: string;
	description: string;
	characteristics: {
		positive: Array<{ icon: React.ReactNode; text: string }>;
		negative: Array<{ icon: React.ReactNode; text: string }>;
		warning?: Array<{ icon: React.ReactNode; text: string }>;
	};
	useCases: string[];
	alternative?: {
		icon: React.ReactNode;
		text: string;
	};
}

// Styled components for educational content
const EducationalContainer = styled.div`
	margin: 1rem 0;
`;

const InfoBox = styled.div`
	background: #fefce8;
	border: 1px solid #eab308;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 0.5rem;
`;

const InfoHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.75rem;
	font-weight: 600;
	font-size: 1rem;
	color: #92400e;
`;

const InfoIcon = styled.div`
	color: #eab308;
	font-size: 1.25rem;
`;

const InfoDescription = styled.p`
	margin-bottom: 1rem;
	color: #451a03;
	line-height: 1.5;
`;

const CharacteristicsList = styled.div`
	margin-bottom: 1rem;
`;

const CharacteristicItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	color: #451a03;
	
	svg {
		margin-top: 0.125rem;
		flex-shrink: 0;
	}
`;

const PositiveIcon = styled.div`
	color: #16a34a;
	font-size: 1rem;
`;

const NegativeIcon = styled.div`
	color: #dc2626;
	font-size: 1rem;
`;

const WarningIcon = styled.div`
	color: #d97706;
	font-size: 1rem;
`;

const UseCasesContainer = styled.div`
	margin-bottom: 1rem;
`;

const UseCasesTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	font-weight: 600;
	color: #451a03;
	font-size: 0.875rem;
`;

const UseCasesText = styled.div`
	color: #451a03;
	font-size: 0.875rem;
	line-height: 1.4;
`;

const AlternativeBox = styled.div`
	background: #fef2f2;
	border: 1px solid #fca5a5;
	border-radius: 0.375rem;
	padding: 0.75rem;
	margin-top: 0.75rem;
`;

const AlternativeContent = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #991b1b;
	font-weight: 600;
	font-size: 0.875rem;
	line-height: 1.4;
`;

const AlternativeIcon = styled.div`
	color: #dc2626;
	font-size: 1rem;
`;

// Educational content data
export const EDUCATIONAL_CONTENT: Record<string, EducationalContent> = {
	oauth: {
		title: 'OAuth 2.0 = Authorization Only (NOT Authentication)',
		description: 'This flow provides **delegated authorization** - it allows your app to access resources on behalf of the user. It does **NOT authenticate the user** or provide identity information.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Returns: Access Token (for API calls)' }
			],
			negative: [
				{ icon: <FiX />, text: 'Does NOT return: ID Token (no user identity)' },
				{ icon: <FiX />, text: 'Does NOT provide: User profile information' },
				{ icon: <FiX />, text: 'Does NOT have: UserInfo endpoint' }
			],
			warning: [
				{ icon: <FiAlertTriangle />, text: 'Scope: Any scopes (read, write, etc.) - do **NOT** include \'openid\'' }
			]
		},
		useCases: [
			'Calendar app accessing user\'s events',
			'Photo app uploading to cloud storage',
			'Email client reading messages'
		],
		alternative: {
			icon: <FiLock />,
			text: '**Need user authentication? Use OIDC Authorization Code Flow instead - it provides user identity via ID Token**'
		}
	},
	oidc: {
		title: 'OpenID Connect = Authentication + Authorization',
		description: 'This flow provides **both authentication and authorization** - it authenticates the user AND allows your app to access resources on their behalf. It provides user identity information via ID Token.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Returns: ID Token (user identity) + Access Token (for API calls)' },
				{ icon: <FiCheck />, text: 'Provides: User profile information via UserInfo endpoint' },
				{ icon: <FiCheck />, text: 'Authenticates: User identity with claims' }
			],
			negative: [
				{ icon: <FiX />, text: 'Requires: \'openid\' scope (mandatory)' }
			]
		},
		useCases: [
			'Social login with user profile',
			'App requiring user identity',
			'Single Sign-On (SSO) scenarios'
		],
		alternative: {
			icon: <FiInfo />,
			text: '**Need only authorization? Use OAuth 2.0 Authorization Code Flow instead - it provides access tokens without user identity**'
		}
	},
	par: {
		title: 'PAR (Pushed Authorization Requests) = Enhanced Security',
		description: 'This flow provides **enhanced security** by pushing authorization parameters via a secure back-channel instead of exposing them in the browser URL. It prevents parameter tampering and improves security.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Enhanced Security: Parameters sent via secure back-channel' },
				{ icon: <FiCheck />, text: 'Prevents Tampering: Authorization URL parameters are protected' },
				{ icon: <FiCheck />, text: 'Returns: ID Token + Access Token (full OIDC flow)' }
			],
			negative: [
				{ icon: <FiX />, text: 'Requires: Additional PAR endpoint configuration' },
				{ icon: <FiX />, text: 'More Complex: Two-step authorization process' }
			]
		},
		useCases: [
			'High-security applications',
			'Financial services',
			'Healthcare applications',
			'Government systems'
		]
	},
	rar: {
		title: 'RAR (Rich Authorization Requests) = Fine-Grained Authorization',
		description: 'This flow provides **fine-grained authorization** using structured JSON to specify detailed permissions and resource access requirements. It enables precise control over what resources can be accessed.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Fine-Grained: Structured JSON authorization requests' },
				{ icon: <FiCheck />, text: 'Precise Control: Specific resource and action permissions' },
				{ icon: <FiCheck />, text: 'Returns: ID Token + Access Token with detailed scopes' }
			],
			negative: [
				{ icon: <FiX />, text: 'Complex Setup: Requires RAR endpoint configuration' },
				{ icon: <FiX />, text: 'JSON Schema: More complex than simple scopes' }
			]
		},
		useCases: [
			'Microservices with specific permissions',
			'API gateways with fine-grained access',
			'Multi-tenant applications',
			'Resource-specific authorization'
		]
	},
	redirectless: {
		title: 'PingOne Redirectless Flow = API-Driven Authentication',
		description: 'This flow provides **API-driven authentication** without browser redirects using PingOne\'s proprietary `response_mode=pi.flow` parameter. It\'s designed for server-to-server and mobile app scenarios.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'No Redirects: Direct API response with tokens' },
				{ icon: <FiCheck />, text: 'Mobile Optimized: Perfect for mobile applications' },
				{ icon: <FiCheck />, text: 'Server-Side: Ideal for backend-to-backend authentication' }
			],
			negative: [
				{ icon: <FiX />, text: 'PingOne Specific: Not a standard OAuth/OIDC flow' },
				{ icon: <FiX />, text: 'Limited Support: Only available in PingOne environments' }
			]
		},
		useCases: [
			'Mobile app authentication',
			'Server-to-server authentication',
			'API-driven authentication flows',
			'Headless authentication scenarios'
		]
	}
};

// Main Educational Content Service Component
interface EducationalContentServiceProps {
	flowType: keyof typeof EDUCATIONAL_CONTENT;
	title?: string;
	defaultCollapsed?: boolean;
}

export const EducationalContentService: React.FC<EducationalContentServiceProps> = ({
	flowType,
	title,
	defaultCollapsed = false
}) => {
	const content = EDUCATIONAL_CONTENT[flowType];

	if (!content) {
		console.warn(`Educational content not found for flow type: ${flowType}`);
		return null;
	}

	const headerConfig: CollapsibleHeaderConfig = {
		title: title || content.title,
		icon: <FiInfo />,
		defaultCollapsed,
		variant: 'default',
		theme: 'blue'
	};

	return (
		<EducationalContainer>
			<CollapsibleHeader {...headerConfig}>
				<InfoBox>
					<InfoDescription dangerouslySetInnerHTML={{ __html: content.description }} />
					
					<CharacteristicsList>
						{content.characteristics.positive.map((item, index) => (
							<CharacteristicItem key={`positive-${index}`}>
								<PositiveIcon>{item.icon}</PositiveIcon>
								<span dangerouslySetInnerHTML={{ __html: item.text }} />
							</CharacteristicItem>
						))}
						
						{content.characteristics.negative.map((item, index) => (
							<CharacteristicItem key={`negative-${index}`}>
								<NegativeIcon>{item.icon}</NegativeIcon>
								<span dangerouslySetInnerHTML={{ __html: item.text }} />
							</CharacteristicItem>
						))}
						
						{content.characteristics.warning?.map((item, index) => (
							<CharacteristicItem key={`warning-${index}`}>
								<WarningIcon>{item.icon}</WarningIcon>
								<span dangerouslySetInnerHTML={{ __html: item.text }} />
							</CharacteristicItem>
						))}
					</CharacteristicsList>
					
					<UseCasesContainer>
						<UseCasesTitle>
							<FiInfo />
							Use Case Examples:
						</UseCasesTitle>
						<UseCasesText>
							{content.useCases.join(' | ')}
						</UseCasesText>
					</UseCasesContainer>
					
					{content.alternative && (
						<AlternativeBox>
							<AlternativeContent>
								<AlternativeIcon>{content.alternative.icon}</AlternativeIcon>
								<span dangerouslySetInnerHTML={{ __html: content.alternative.text }} />
							</AlternativeContent>
						</AlternativeBox>
					)}
				</InfoBox>
			</CollapsibleHeader>
		</EducationalContainer>
	);
};

// Export individual educational content for direct use
export const getEducationalContent = (flowType: keyof typeof EDUCATIONAL_CONTENT): EducationalContent | null => {
	return EDUCATIONAL_CONTENT[flowType] || null;
};

export default EducationalContentService;
