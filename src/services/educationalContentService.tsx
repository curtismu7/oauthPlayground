import React, { useState } from 'react';
import styled from 'styled-components';
import { FiInfo, FiCheck, FiX, FiAlertTriangle, FiLock, FiBook } from 'react-icons/fi';
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
	},
	'oidc-hybrid-credentials': {
		title: 'Hybrid Flow Step 0 · Configure Credentials Correctly',
		description: 'The hybrid flow needs **confidential client** credentials. Provide the PingOne environment ID, OAuth client ID and secret, redirect URIs, and include `openid` in scopes to unlock tokens in later steps.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Enables: Both code and tokens in a single round trip' },
				{ icon: <FiCheck />, text: 'Supports: Backend code exchange with refresh tokens' },
				{ icon: <FiCheck />, text: 'Works With: PKCE, nonce, and response_mode variations' }
			],
			negative: [
				{ icon: <FiX />, text: 'Requires: Confidential client with stored secret' },
				{ icon: <FiX />, text: 'Needs: Redirect and post-logout URIs registered in PingOne' }
			],
			warning: [
				{ icon: <FiAlertTriangle />, text: 'Mandatory: Include the `openid` scope to receive identity tokens' }
			]
		},
		useCases: [
			'PingOne applications exchanging tokens in browser and backend',
			'Flows that need fast ID tokens plus server-side refresh tokens',
			'Scenarios bridging SPA UX with confidential backend calls'
		]
	},
	'oidc-hybrid-response-types': {
		title: 'Hybrid Flow Step 1 · Pick the Right Response Type',
		description: 'Hybrid flows combine authorization code and implicit behaviours. Choose the response type (`code`, `id_token`, `token`) mix that matches your security posture and UX expectations.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Flexible: Deliver code plus tokens in the front channel' },
				{ icon: <FiCheck />, text: 'User Experience: Immediate ID token for quick login state' }
			],
			negative: [
				{ icon: <FiX />, text: 'Complexity: More combinations to register in PingOne' },
				{ icon: <FiX />, text: 'Risk: Tokens in front channel demand strong redirect URI controls' }
			],
			warning: [
				{ icon: <FiAlertTriangle />, text: 'Security: Always pair with PKCE and nonce for hybrid variants' }
			]
		},
		useCases: [
			'SPAs needing instant ID token and backend code exchange',
			'Native apps requiring access token before backend callback',
			'Integrations where downstream APIs expect access tokens immediately'
		]
	},
	'oidc-hybrid-authorization': {
		title: 'Hybrid Flow Step 2 · Build the Authorization URL',
		description: 'The authorization request must include the correct hybrid response type, nonce, PKCE values, and scopes. This URL is what redirects the user to PingOne for authentication.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Single Redirect: Starts the flow that returns both code and tokens' },
				{ icon: <FiCheck />, text: 'Supports: PKCE challenge, nonce, and state for security' }
			],
			negative: [
				{ icon: <FiX />, text: 'Strict Validation: Missing parameters cause PingOne errors' }
			],
			warning: [
				{ icon: <FiAlertTriangle />, text: 'Nonce Required: Prevents replay attacks on returned ID token' }
			]
		},
		useCases: [
			'Generating links for hybrid login buttons',
			'Troubleshooting discovery vs manual configuration',
			'Learning each query parameter PingOne expects'
		]
	},
	'oidc-hybrid-authentication': {
		title: 'Hybrid Flow Step 3 · User Authentication Experience',
		description: 'Users authenticate at PingOne after clicking the authorization URL. Hybrid mode ensures ID tokens (and optionally access tokens) arrive in the front channel while code waits for backend exchange.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Immediate ID Token: App can update session instantly' },
				{ icon: <FiCheck />, text: 'Supports: Adaptive authentication and PingOne MFA policies' }
			],
			negative: [
				{ icon: <FiX />, text: 'Popup Handling: Requires solid UX for redirect or popup flows' }
			]
		},
		useCases: [
			'Login UX walkthroughs',
			'Debugging PingOne policies during hybrid testing',
			'Explaining end-user journey to stakeholders'
		]
	},
	'oidc-hybrid-token-processing': {
		title: 'Hybrid Flow Step 4 · Handle Front-Channel Tokens',
		description: 'Tokens returned in the redirect fragment must be parsed, validated, and optionally displayed. Hybrid flows deliver ID tokens (and optionally access tokens) before the backend exchanges the code.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Faster Login: ID token proves authentication instantly' },
				{ icon: <FiCheck />, text: 'API Ready: Access token can call APIs without waiting for backend exchange' }
			],
			negative: [
				{ icon: <FiX />, text: 'Security: Tokens in browser require secure storage and expiration handling' }
			]
		},
		useCases: [
			'Parsing redirect fragments in SPA',
			'Validating ID token signatures quickly',
			'Debugging nonce and state handling'
		]
	},
	'oidc-hybrid-code-exchange': {
		title: 'Hybrid Flow Step 5 · Exchange Code for Back-Channel Tokens',
		description: 'After capturing the authorization code, exchange it at PingOne\'s token endpoint with client authentication (and PKCE verifier) to receive refresh and access tokens securely.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Refresh Tokens: Obtain long-lived access for backend services' },
				{ icon: <FiCheck />, text: 'Confidential Exchange: Happens server-side away from the browser' }
			],
			negative: [
				{ icon: <FiX />, text: 'Requires: Client secret or JWT client assertion configured' }
			],
			warning: [
				{ icon: <FiAlertTriangle />, text: 'PKCE: Must send code_verifier that matches the earlier challenge' }
			]
		},
		useCases: [
			'Building backend token services',
			'Refresh token lifecycle demonstrations',
			'Explaining split front-channel/back-channel responsibilities'
		]
	},
	'oidc-hybrid-token-management': {
		title: 'Hybrid Flow Step 6 · Introspect and Manage Tokens',
		description: 'Once tokens are issued, introspection and UserInfo calls help monitor validity, scopes, and user claims. Hybrid flows often carry both front-channel and back-channel tokens to manage.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Visibility: Confirm token status, scopes, and expiry' },
				{ icon: <FiCheck />, text: 'UserInfo: Retrieve authoritative user attributes when needed' }
			],
			negative: [
				{ icon: <FiX />, text: 'Careful Storage: Multiple token types to protect and rotate' }
			]
		},
		useCases: [
			'Debugging access failures',
			'Compliance audits of issued tokens',
			'Building token dashboards for support teams'
		]
	},
	'oidc-hybrid-completion': {
		title: 'Hybrid Flow Step 7 · Summarize and Next Steps',
		description: 'Wrap up the hybrid journey by validating tokens, cleaning session state, and planning production readiness tasks such as rotating secrets and enforcing policies.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Clarity: Review each stage from credentials to token management' },
				{ icon: <FiCheck />, text: 'Guidance: Highlight next steps like enabling refresh token rotation' }
			],
			negative: [
				{ icon: <FiX />, text: 'Follow-Up: Requires additional hardening before production' }
			]
		},
		useCases: [
			'Project retrospectives',
			'Release checklists',
			'Training materials for enablement teams'
		]
	},
	'saml-bearer': {
		title: 'SAML Bearer Assertion = Enterprise SSO Token Exchange',
		description: 'This flow enables **enterprise SSO integration** by exchanging SAML assertions from identity providers for OAuth access tokens. It bridges SAML-based authentication with OAuth-based authorization.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Enterprise Integration: Works with existing SAML SSO infrastructure' },
				{ icon: <FiCheck />, text: 'Token Exchange: Converts SAML assertions to OAuth access tokens' },
				{ icon: <FiCheck />, text: 'Secure: Uses XML digital signatures and established trust relationships' }
			],
			negative: [
				{ icon: <FiX />, text: 'Complex Setup: Requires SAML IdP configuration and trust relationships' },
				{ icon: <FiX />, text: 'Limited Support: Not supported by all OAuth servers (including PingOne)' }
			],
			warning: [
				{ icon: <FiAlertTriangle />, text: 'Mock Implementation: This is educational only - PingOne does not support SAML Bearer assertions' }
			]
		},
		useCases: [
			'Enterprise applications with existing SAML SSO',
			'Legacy system integration with modern OAuth APIs',
			'Cross-domain authentication scenarios',
			'Service-to-service authentication using SAML assertions'
		],
		alternative: {
			icon: <FiInfo />,
			text: '**For PingOne: Use Authorization Code Flow or Client Credentials Flow for production scenarios**'
		}
	},
	'resource-owner-password': {
		title: 'Resource Owner Password Credentials = Direct Username/Password Exchange',
		description: 'This flow allows applications to **directly exchange a user\'s username and password for access tokens**. It\'s the most straightforward OAuth flow but comes with significant security considerations.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Simple Implementation: Direct credential exchange without redirects' },
				{ icon: <FiCheck />, text: 'Legacy Integration: Works with existing username/password systems' },
				{ icon: <FiCheck />, text: 'No Browser Required: Suitable for headless or CLI applications' }
			],
			negative: [
				{ icon: <FiX />, text: 'Security Risk: Application handles raw user passwords' },
				{ icon: <FiX />, text: 'Trust Required: Users must fully trust the application with credentials' },
				{ icon: <FiX />, text: 'Limited Scope: Cannot delegate permissions or use fine-grained access' }
			],
			warning: [
				{ icon: <FiAlertTriangle />, text: 'Mock Implementation: Uses realistic demo credentials for educational purposes' },
				{ icon: <FiAlertTriangle />, text: 'Security Warning: Only use ROPC when other flows are not feasible' }
			]
		},
		useCases: [
			'Legacy applications migrating to OAuth',
			'Trusted first-party mobile applications',
			'Command-line tools and scripts',
			'IoT devices with limited input capabilities',
			'Migration scenarios from basic auth to OAuth'
		],
		alternative: {
			icon: <FiInfo />,
			text: '**Recommended: Use Authorization Code Flow with PKCE for better security in most scenarios**'
		}
	},
	'mfa': {
		title: 'Multi-Factor Authentication = Enhanced Security Through Multiple Verification Methods',
		description: 'MFA adds **additional layers of security** beyond just username and password by requiring users to verify their identity through multiple independent factors before granting access.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Enhanced Security: Multiple verification factors prevent unauthorized access' },
				{ icon: <FiCheck />, text: 'Flexible Methods: SMS, Email, TOTP, Push notifications, Biometrics' },
				{ icon: <FiCheck />, text: 'Compliance Ready: Meets regulatory requirements for secure authentication' },
				{ icon: <FiCheck />, text: 'User-Friendly: Modern MFA methods are convenient and fast' }
			],
			negative: [
				{ icon: <FiX />, text: 'Additional Step: Requires extra verification step in login process' },
				{ icon: <FiX />, text: 'Device Dependency: Users need access to registered devices' },
				{ icon: <FiX />, text: 'Setup Complexity: Initial device registration and configuration required' }
			],
			warning: [
				{ icon: <FiAlertTriangle />, text: 'Backup Methods: Always provide alternative verification methods for device loss' },
				{ icon: <FiAlertTriangle />, text: 'User Education: Train users on MFA setup and usage for smooth adoption' }
			]
		},
		useCases: [
			'Financial services and banking applications',
			'Healthcare systems with sensitive patient data',
			'Enterprise applications with privileged access',
			'E-commerce platforms handling payment information',
			'Government and compliance-regulated systems',
			'Remote work and VPN access scenarios'
		],
		alternative: {
			icon: <FiInfo />,
			text: '**Best Practice: Combine MFA with risk-based authentication for optimal security and user experience**'
		}
	},
	'pingone-par': {
		title: 'PAR (Pushed Authorization Requests) = Enhanced Security',
		description: 'This flow provides **enhanced security** by pushing authorization parameters via secure back-channel POST to the authorization server before redirecting. It prevents parameter tampering and reduces URL size for complex requests.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Enhanced Security: Parameters hidden from browser URLs' },
				{ icon: <FiCheck />, text: 'Parameter Protection: Prevents tampering and interception' },
				{ icon: <FiCheck />, text: 'Compact URLs: No URL length limits for complex requests' },
				{ icon: <FiCheck />, text: 'Authorization Details: Support for fine-grained authorization' }
			],
			negative: [
				{ icon: <FiX />, text: 'Complex Setup: Requires PAR endpoint configuration' },
				{ icon: <FiX />, text: 'Server Support: Not all authorization servers support PAR' }
			]
		},
		useCases: [
			'Production OIDC clients with sensitive scopes',
			'Applications requiring complex authorization parameters',
			'High-security environments with parameter protection needs',
			'Mobile apps with detailed authorization requirements'
		]
	},
	'oidc-par': {
		title: 'OIDC PAR (Pushed Authorization Requests) = Enhanced OIDC Security',
		description: 'This flow combines **OpenID Connect authentication** with **PAR security enhancements** - providing both user identity AND enhanced security through pushed authorization parameters. Perfect for high-security OIDC applications.',
		characteristics: {
			positive: [
				{ icon: <FiCheck />, text: 'Full OIDC: ID Token (user identity) + Access Token (for API calls)' },
				{ icon: <FiCheck />, text: 'Enhanced Security: Authorization parameters pushed via secure back-channel' },
				{ icon: <FiCheck />, text: 'User Profile: Complete user information via UserInfo endpoint' },
				{ icon: <FiCheck />, text: 'Parameter Protection: Prevents tampering and URL length limits' }
			],
			negative: [
				{ icon: <FiX />, text: 'Requires: \'openid\' scope (mandatory for OIDC)' },
				{ icon: <FiX />, text: 'Complex Setup: PAR endpoint + OIDC configuration required' }
			]
		},
		useCases: [
			'High-security OIDC applications',
			'Financial services with user authentication',
			'Healthcare applications with identity requirements',
			'Government systems with enhanced security'
		]
	}
};

// Main Educational Content Service Component
interface EducationalContentServiceProps {
	flowType: keyof typeof EDUCATIONAL_CONTENT;
	title?: string;
	defaultCollapsed?: boolean;
	theme?: 'orange' | 'blue' | 'purple' | 'green' | 'yellow';
	icon?: React.ReactNode;
}

export const EducationalContentService: React.FC<EducationalContentServiceProps> = ({
	flowType,
	title,
	defaultCollapsed = false,
	theme = 'yellow',
	icon = <FiBook />
}) => {
	const content = EDUCATIONAL_CONTENT[flowType];

	if (!content) {
		console.warn(`Educational content not found for flow type: ${flowType}`);
		return null;
	}

	const headerConfig: CollapsibleHeaderConfig = {
		title: title || content.title,
		icon,
		defaultCollapsed,
		variant: 'default',
		theme
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
