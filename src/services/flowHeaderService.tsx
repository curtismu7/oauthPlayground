// src/services/flowHeaderService.tsx
// Reusable service for standardized V5 flow headers

import React from 'react';
import styled from 'styled-components';
import packageJson from '../../package.json';

export interface FlowHeaderConfig {
	flowType: 'oauth' | 'oidc' | 'pingone' | 'documentation';
	title: string;
	subtitle: string;
	icon?: string;
	version?: string;
	isDeprecated?: boolean;
	isExperimental?: boolean;
	// Security features status for dynamic colors
	securityFeatures?: {
		jwksEnabled?: boolean;
		parEnabled?: boolean;
		jarEnabled?: boolean;
		dpopEnabled?: boolean;
		highSecurityMode?: boolean;
	};
}

const HeaderContainer = styled.div<{
	$flowType: FlowHeaderConfig['flowType'];
	$securityFeatures?: FlowHeaderConfig['securityFeatures'];
}>`
	background: ${({ $flowType, $securityFeatures }) => {
		// Check if high security features are enabled
		const hasHighSecurity =
			$securityFeatures?.highSecurityMode ||
			($securityFeatures?.jwksEnabled && $securityFeatures?.parEnabled);

		// Check if any security features are enabled
		const hasSecurityFeatures =
			$securityFeatures?.jwksEnabled ||
			$securityFeatures?.parEnabled ||
			$securityFeatures?.jarEnabled ||
			$securityFeatures?.dpopEnabled;

		// Base colors by flow type
		const baseColors = {
			oauth: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
			oidc: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
			pingone: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
			documentation: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
			default: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
		};

		// Security-enhanced colors (darker, more professional)
		const securityColors = {
			oauth: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
			oidc: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
			pingone: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
			documentation: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
			default: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
		};

		// High security colors (premium, dark)
		const highSecurityColors = {
			oauth: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
			oidc: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
			pingone: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
			documentation: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
			default: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
		};

		// Return appropriate color based on security level
		if (hasHighSecurity) {
			return highSecurityColors[$flowType] || highSecurityColors.default;
		} else if (hasSecurityFeatures) {
			return securityColors[$flowType] || securityColors.default;
		} else {
			return baseColors[$flowType] || baseColors.default;
		}
	}};
	color: white;
	padding: 0.75rem 1.5rem;
	border-radius: 12px;
	margin-bottom: 1.5rem;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 0.5rem;

	@media (max-width: 768px) {
		padding: 0.5rem 1rem;
	}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
    pointer-events: none;
  }
`;

const HeaderBadge = styled.div<{
	$flowType: FlowHeaderConfig['flowType'];
	$securityFeatures?: FlowHeaderConfig['securityFeatures'];
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ $securityFeatures }) => {
		const hasHighSecurity =
			$securityFeatures?.highSecurityMode ||
			($securityFeatures?.jwksEnabled && $securityFeatures?.parEnabled);
		const hasSecurityFeatures =
			$securityFeatures?.jwksEnabled ||
			$securityFeatures?.parEnabled ||
			$securityFeatures?.jarEnabled ||
			$securityFeatures?.dpopEnabled;

		if (hasHighSecurity) {
			return 'rgba(255, 215, 0, 0.3)'; // Gold for high security
		} else if (hasSecurityFeatures) {
			return 'rgba(34, 197, 94, 0.3)'; // Green for security features
		} else {
			return 'rgba(255, 255, 255, 0.2)'; // Default white
		}
	}};
  backdrop-filter: blur(10px);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
`;

const StatusBadge = styled.span<{ $type: 'experimental' | 'deprecated' }>`
  display: inline-flex;
  align-items: center;
  background: ${({ $type }) =>
		$type === 'experimental'
			? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
			: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const HeaderSubtitle = styled.p`
  font-size: 0.9rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.5;
  max-width: 800px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const VersionDisplay = styled.div`
  text-align: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
`;

const HeaderIcon = styled.span`
  font-size: 1.5rem;
`;

// Predefined flow configurations - Updated for V7 flows - Cache bust: 2025-01-17-08:50
export const FLOW_CONFIGS: Record<string, FlowHeaderConfig> = {
	// OAuth 2.0 / OIDC V9 Flows
	'oauth-authorization-code-v9': {
		flowType: 'oauth',
		title: 'Authorization Code Flow (V9)',
		subtitle:
			'🔐 V9: Production-grade Authorization Code Flow with PKCE — supports both OAuth 2.0 and OpenID Connect variants. Unified credential management, enhanced error handling, and V9 services.',
		icon: '🔐',
		version: 'V9',
	},
	'implicit-v9': {
		flowType: 'oauth',
		title: 'Implicit Flow (V9)',
		subtitle:
			'⚡ V9: Implicit Flow with OAuth 2.0 and OIDC variant selector — modern implementation with enhanced security awareness and educational content. Note: Implicit flow is deprecated in OAuth 2.1; use Authorization Code + PKCE for new apps.',
		icon: '⚡',
		version: 'V9',
	},
	'device-authorization-v9': {
		flowType: 'oauth',
		title: 'Device Authorization Flow (V9)',
		subtitle:
			'📱 V9: Device Authorization Grant for TVs, IoT devices, and CLI tools — polls for user authorization via a secondary device. Supports OIDC variant.',
		icon: '📱',
		version: 'V9',
	},
	'client-credentials-v9': {
		flowType: 'oauth',
		title: 'Client Credentials Flow (V9)',
		subtitle:
			'🔑 V9: Machine-to-machine authentication for backend services and APIs. Obtain access tokens directly with client ID and secret — no user interaction required.',
		icon: '🔑',
		version: 'V9',
	},
	'ciba-v9': {
		flowType: 'oidc',
		title: 'CIBA Flow (V9) — Client Initiated Backchannel Authentication',
		subtitle:
			"🛡️ V9: Backchannel authentication flow for decoupled device scenarios — push auth request to user's mobile device. PingOne-specific implementation.",
		icon: '🛡️',
		version: 'V9',
	},
	// OAuth 2.0 V7 Flows
	'oauth-authorization-code-v7': {
		flowType: 'oauth',
		title: 'Authorization Code (V7) - Unified OAuth/OIDC',
		subtitle:
			'🔐 V7: Unified OAuth/OIDC authorization code experience - Modern implementation supporting both OAuth 2.0 and OpenID Connect variants with enhanced security, PKCE, and comprehensive educational content.',
		icon: '🔐',
		version: 'V7',
	},
	'implicit-v7': {
		flowType: 'oauth',
		title: 'Implicit Flow (V7) - Unified OAuth/OIDC',
		subtitle:
			'⚡ V7: Unified OAuth/OIDC implementation with variant selector - Modern implicit flow supporting both OAuth 2.0 and OpenID Connect with enhanced security features and educational content.',
		icon: '⚡',
		version: 'V7',
	},
	'device-authorization-v7': {
		flowType: 'oauth',
		title: 'Device Authorization (V7) - Unified OAuth/OIDC',
		subtitle:
			'📱 V7: Unified OAuth/OIDC device authorization for TVs, IoT devices, and CLI tools - Modern implementation with comprehensive device flow support.',
		icon: '📱',
		version: 'V7',
	},
	'ciba-v7': {
		flowType: 'oidc',
		title: 'OIDC CIBA Flow (V7) - Client Initiated Backchannel Authentication',
		subtitle:
			'🛡️ V7: Enhanced CIBA implementation with V7 services - Client Initiated Backchannel Authentication for secure, user-friendly authentication without redirects. Perfect for mobile apps, IoT devices, and scenarios requiring seamless user experience.',
		icon: '🛡️',
		version: 'V7',
	},
	'client-credentials-v5': {
		flowType: 'oauth',
		title: 'Client Credentials Flow - Server-to-Server Authentication',
		subtitle:
			'Secure machine-to-machine authentication for backend services and APIs. Obtain access tokens directly using client ID and secret without user interaction. Perfect for microservices, batch jobs, and automated processes.',
		icon: '🔑',
		version: 'V5',
	},
	'client-credentials-v7': {
		flowType: 'oauth',
		title: 'Client Credentials Flow V7 - Enhanced Server-to-Server Authentication',
		subtitle:
			'🔑 Enhanced machine-to-machine authentication for backend services and APIs. Obtain access tokens directly using client ID and secret without user interaction. Perfect for microservices, batch jobs, and automated processes. ✅ V7: Enhanced with new AuthMethodService and improved UI.',
		icon: '🔑',
		version: 'V7',
		isExperimental: false,
	},
	'oauth-resource-owner-password-v5': {
		flowType: 'oauth',
		title: 'OAuth 2.0 Resource Owner Password Flow (ROPC)',
		subtitle:
			'Direct username/password authentication for highly trusted applications. Deprecated due to security risks - use Authorization Code flow instead.',
		icon: '🔒',
		version: 'V5',
		isDeprecated: true,
	},

	// OIDC V5 Flows
	'oidc-authorization-code-v5': {
		flowType: 'oidc',
		title: 'OIDC Authorization Code Flow - Federated Authentication',
		subtitle:
			'🆔 OpenID Connect (Identity Layer on OAuth 2.0) - Verifies user identity AND provides API access. Returns ID Token (user identity) + Access Token (resource access). Built on OAuth 2.0 with added authentication layer. ✅ Use OIDC when you need to know WHO the user is (social login, SSO, identity verification).',
		icon: '🆔',
		version: 'V5',
	},
	'oidc-implicit-v5': {
		flowType: 'oidc',
		title: 'Implicit Flow - Legacy Browser Authentication',
		subtitle:
			'Deprecated OpenID Connect flow that returns ID tokens and access tokens directly in the URL fragment. No longer recommended - use Authorization Code Flow with PKCE for better security.',
		icon: '🌐',
		version: 'V5',
	},

	// V7 Unified Flows
	'token-exchange-v7': {
		flowType: 'oauth',
		title: 'OAuth 2.0 Token Exchange V7 - RFC 8693',
		subtitle:
			'🔄 Secure Application-to-Application (A2A) communication using OAuth 2.0 Token Exchange. Demonstrates scope reduction, audience restriction, and user delegation patterns for enterprise security architectures.',
		icon: '🔄',
		version: 'V7',
	},

	'oidc-hybrid-v7': {
		flowType: 'oidc',
		title: 'Hybrid Flow (V7) - Unified OAuth/OIDC',
		subtitle:
			'🔄 V7: Unified OAuth/OIDC hybrid flow implementation - Advanced flow combining Authorization Code and Implicit patterns with modern V7 architecture and enhanced educational content.',
		icon: '🔄',
		version: 'V7',
	},
	'jwt-bearer-token-v7': {
		flowType: 'oidc',
		title: 'JWT Bearer Token (V7)',
		subtitle:
			'🛡️ V7: JWT Bearer with PingFederate/PingOne AIS examples - Modern implementation of RFC 7523 JWT Bearer Token flow for secure application-to-application authentication.',
		icon: '🛡️',
		version: 'V7',
	},

	// PingOne Token Flows
	'worker-token-v5': {
		flowType: 'pingone',
		title: 'Worker Token Flow - Administrative API Access',
		subtitle:
			'PingOne-specific flow for obtaining worker application tokens. Used for administrative tasks, management API access, and backend automation without user interaction.',
		icon: '⚙️',
		version: 'V5',
	},
	'worker-token-v7': {
		flowType: 'pingone',
		title: 'Worker Token Flow (V7) - Enhanced Administrative API Access',
		subtitle:
			'🚀 V7: Enhanced PingOne worker token flow with comprehensive training, API examples, and best practices. Generate worker tokens for machine-to-machine authentication with PingOne Management APIs. Includes JavaScript examples, cURL commands, Postman collections, and security best practices.',
		icon: '⚙️',
		version: 'V7',
	},
	'redirectless-v7': {
		flowType: 'oauth',
		title: 'Redirectless Flow (V7) - Enhanced Server-to-Server Authentication',
		subtitle:
			'🚀 V7: Enhanced redirectless authentication with fresh PKCE generation, improved error handling, and comprehensive educational content - Perfect for embedded login experiences and mobile apps.',
		icon: '🚀',
		version: 'V7',
	},
	'pingone-par-v5': {
		flowType: 'pingone',
		title: 'PAR (Pushed Authorization Requests) Flow - Enhanced Security',
		subtitle:
			'🔒 RFC 9126 - Authorization Code Flow + PAR enhancement. Pushes authorization parameters via secure back-channel POST to /par endpoint before redirecting. Returns request_uri for compact authorization URL. ✅ Benefits: Parameters hidden from browser URLs, prevents tampering, no URL length limits. Perfect for production OIDC clients with sensitive scopes.',
		icon: '🔒',
		version: 'V5',
	},
	'pingone-par-v7': {
		flowType: 'pingone',
		title: 'PAR (Pushed Authorization Requests) Flow V7 - Enhanced Security',
		subtitle:
			'🔒 V7: Enhanced PAR implementation with authorization details support - RFC 9126 Pushed Authorization Requests with comprehensive authorization details configuration. Pushes authorization parameters via secure back-channel POST to /par endpoint before redirecting. Returns request_uri for compact authorization URL. ✅ Benefits: Parameters hidden from browser URLs, prevents tampering, no URL length limits, fine-grained authorization details. Perfect for production OIDC clients with sensitive scopes and complex authorization requirements.',
		icon: '🔒',
		version: 'V7',
	},
	'rar-flow-v5': {
		flowType: 'pingone',
		title: 'RAR (Rich Authorization Requests) Flow - Fine-Grained Permissions',
		subtitle:
			'📊 RFC 9396 - Authorization Code Flow + RAR extension. Express complex authorization requirements using structured JSON authorization_details instead of simple scope strings. Example: "authorize $250 payment to ABC Supplies" vs "payments.write". ✅ Benefits: Fine-grained permissions, clear user consent, structured audit logs. Ideal for financial transactions and compliance scenarios.',
		icon: '📊',
		version: 'V5',
	},
	'pingone-complete-mfa-v7': {
		flowType: 'pingone',
		title: 'PingOne Complete MFA Flow V7',
		subtitle:
			'🔐 Complete multi-factor authentication implementation with modern V7 UI. Demonstrates user authentication, MFA enrollment, device pairing, challenge verification, and token retrieval with PingOne integration.',
		icon: '🔐',
		version: 'V7',
	},
	'pingone-authentication': {
		flowType: 'pingone',
		title: 'PingOne Authentication',
		subtitle:
			'🔐 V7: Dedicated authentication page with inline and popup modes - Modern PingOne authentication interface with comprehensive user management and security features.',
		icon: '🔐',
		version: 'V7',
	},
	'saml-bearer-assertion-v7': {
		flowType: 'pingone',
		title: 'SAML Bearer Assertion (V7)',
		subtitle:
			'🛡️ V7: SAML Bearer with PingFederate/PingOne AIS examples - Modern implementation of SAML Bearer Assertion flow for enterprise authentication.',
		icon: '🛡️',
		version: 'V7',
	},
	'redirectless-flow-v5': {
		flowType: 'pingone',
		title: 'Redirectless Flow (response_mode=pi.flow) - API-Driven Auth',
		subtitle:
			'⚡ PingOne Proprietary - Authorization Code Flow with response_mode=pi.flow parameter. Eliminates browser redirects entirely - authentication happens via direct API calls to PingOne Flow API. Returns tokens directly without redirect_uri. ✅ Benefits: Embedded login UX, no browser navigation, seamless mobile/desktop experience. ⚠️ PingOne-specific, not OAuth/OIDC standard.',
		icon: '⚡',
		version: 'V5',
	},
	'redirectless-v6-real': {
		flowType: 'pingone',
		title: 'Redirectless Flow V6 (response_mode=pi.flow) - Real Implementation',
		subtitle:
			'⚡ PingOne Proprietary - Authorization Code Flow with response_mode=pi.flow parameter. Eliminates browser redirects entirely - authentication happens via direct API calls to PingOne Flow API. Returns tokens directly without redirect_uri. ✅ Benefits: Embedded login UX, no browser navigation, seamless mobile/desktop experience. ⚠️ PingOne-specific, not OAuth/OIDC standard.',
		icon: '⚡',
		version: 'V6',
	},
	'redirectless-v7-real': {
		flowType: 'pingone',
		title: 'Redirectless Flow V7 (response_mode=pi.flow) - Enhanced Implementation',
		subtitle:
			'🚀 PingOne Proprietary V7 - Enhanced Authorization Code Flow with response_mode=pi.flow parameter. V7 improvements: Fresh PKCE generation every time, enhanced error handling, improved logging, and better state management. Eliminates browser redirects entirely - authentication happens via direct API calls to PingOne Flow API. Returns tokens directly without redirect_uri. ✅ Benefits: Embedded login UX, no browser navigation, seamless mobile/desktop experience, enhanced reliability. ⚠️ PingOne-specific, not OAuth/OIDC standard.',
		icon: '🚀',
		version: 'V7',
		isExperimental: false,
	},
	'redirectless-v6': {
		flowType: 'pingone',
		title: 'Redirectless Flow V6 - PingOne Pi.Flow Authentication',
		subtitle:
			'🎯 PingOne proprietary response_mode=pi.flow for seamless authentication without browser redirects. Host PingOne authentication UI within your application and receive tokens via JSON response. Perfect for embedded authentication experiences.',
		icon: '🎯',
		version: 'V6',
		isExperimental: false,
	},
	'redirectless-flow-mock': {
		flowType: 'pingone',
		title: 'Redirectless Flow V5 - Educational Demo (Mock)',
		subtitle:
			'🎓 Educational demonstration of PingOne redirectless authentication (response_mode=pi.flow). Learn how redirectless flows work without needing a real PingOne environment. Simulates Flow API interactions and token responses for learning purposes.',
		icon: '🎓',
		version: 'V5',
		isExperimental: true,
	},

	// Page Types
	dashboard: {
		flowType: 'oauth',
		title: 'Dashboard',
		subtitle:
			'Your comprehensive OAuth 2.0 and OpenID Connect testing environment. View recent activity, check configuration status, and explore available flows.',
		icon: '🏠',
	},
	configuration: {
		flowType: 'pingone',
		title: 'Settings',
		subtitle:
			'Configure your PingOne environment credentials, OAuth clients, and application settings. Manage flow-specific configurations and customize your playground experience.',
		icon: '⚙️',
	},
	oauth21: {
		flowType: 'documentation',
		title: 'OAuth 2.1 - The Next Evolution of OAuth',
		subtitle:
			'Learn about OAuth 2.1, the consolidated specification that incorporates security improvements and best practices. See key changes from OAuth 2.0 including required PKCE, deprecated flows, and enhanced security.',
		icon: '🛡️',
	},
	'comprehensive-oauth-education': {
		flowType: 'documentation',
		title: 'Comprehensive OAuth AI Education',
		subtitle:
			'Master OAuth 2.0 and OpenID Connect fundamentals, flows, security best practices, and modern standards. From basics to advanced topics including AI agent authentication and machine-to-machine communication.',
		icon: '📚',
	},
	'environment-id-demo': {
		flowType: 'documentation',
		title: 'Environment ID Input Demo',
		subtitle:
			"Simplified PingOne configuration. Just enter your environment ID, select your region, and we'll construct the issuer URL and discover all OIDC endpoints automatically.",
		icon: '🔧',
	},
	'oidc-overview': {
		flowType: 'oidc',
		title: 'OIDC Overview',
		subtitle:
			'Comprehensive guide to OpenID Connect authentication flows, security considerations, and implementation best practices for modern applications.',
		icon: '📚',
	},
	'ai-glossary': {
		flowType: 'documentation',
		title: 'AI Glossary',
		subtitle:
			'Comprehensive glossary of AI, machine learning, OAuth 2.0, and OpenID Connect terminology. Search and explore definitions for technical terms used throughout the playground.',
		icon: '📚',
	},
	'emerging-ai-standards': {
		flowType: 'documentation',
		title: 'Emerging AI Standards',
		subtitle:
			'Explore new OAuth extensions and industry proposals that enable autonomous agents to authenticate, authorize, and collaborate securely across domains.',
		icon: '🤖',
	},
	'token-management': {
		flowType: 'pingone',
		title: 'Token Management',
		subtitle:
			'Monitor, analyze, and manage OAuth access tokens and OpenID Connect ID tokens. View token details, validate tokens, perform introspection, and test token revocation.',
		icon: '🔑',
	},
	'auto-discover': {
		flowType: 'oidc',
		title: 'Auto Discover',
		subtitle:
			'Automatically discover OpenID Connect configuration from your PingOne environment. Fetches authorization, token, userinfo, and JWKS endpoints from the .well-known/openid-configuration endpoint.',
		icon: '🔍',
	},
	'jwks-troubleshooting': {
		flowType: 'pingone',
		title: 'JWKS Troubleshooting Guide',
		subtitle:
			'Diagnose and fix common JWKS format issues with PingOne SSO. Execute curl commands directly to test your JWKS endpoints and validate the format.',
		icon: '⚠️',
	},
	'url-decoder': {
		flowType: 'oauth',
		title: 'URL Decoder',
		subtitle:
			'Decode and analyze URLs, especially useful for OAuth authorization URLs and callback parameters. Break down complex URLs into readable components and parameters.',
		icon: '🌐',
		version: 'V5',
	},
	'oauth2-security-best-practices': {
		flowType: 'oauth',
		title: 'OAuth 2.0 Security',
		subtitle:
			'Based on RFC 9700 - Best Current Practice for OAuth 2.0 Security. Essential security recommendations, threat models, and mitigation strategies for building secure OAuth 2.0 applications.',
		icon: '🛡️',
	},
	'oidc-for-ai': {
		flowType: 'oidc',
		title: 'OIDC for AI',
		subtitle:
			'Resources and guidance for implementing OpenID Connect in AI and machine learning applications. Learn authentication patterns for AI agents and autonomous systems.',
		icon: '🤖',
	},
	'oidc-specs': {
		flowType: 'oidc',
		title: 'OIDC Specs',
		subtitle:
			'Official OpenID Connect specifications and related standards from the OpenID Foundation. Access core specs, security considerations, and implementation guides.',
		icon: '📋',
	},
	'scopes-best-practices': {
		flowType: 'oauth',
		title: 'Scopes Best Practices',
		subtitle:
			'Comprehensive guide to designing, implementing, and managing OAuth 2.0 scopes at scale. Learn how to create effective scope strategies for API security.',
		icon: '🎯',
	},
	'oidc-ciba-v6': {
		flowType: 'oidc',
		title: 'OIDC CIBA Flow (Mock) (V6)',
		subtitle:
			'🎓 Educational CIBA implementation - PingOne does not support CIBA. Mock flow demonstrates Client Initiated Backchannel Authentication for decoupled authentication scenarios.',
		version: 'V6',
		icon: '🎓',
	},
	'oauth2-resource-owner-password-v6': {
		flowType: 'oauth',
		title: 'OAuth 2.0 Resource Owner Password Credentials (V6)',
		subtitle:
			'🎭 Hybrid V6 implementation: Proven V5 controller with modern V6 layout and styling. Direct username/password exchange for access tokens with comprehensive educational content.',
		version: 'V6',
		icon: '🔑',
	},
	'oauth-ropc-v7': {
		flowType: 'oauth',
		title: 'OAuth ROPC (V7)',
		subtitle:
			'🚀 V7 Enhanced implementation: Modern UI with improved user experience, enhanced error handling, and better visual design. Resource Owner Password Credentials flow with comprehensive educational content.',
		version: 'V7',
		icon: '🔑',
		isExperimental: false,
	},
	'pingone-mfa-v5': {
		flowType: 'oidc',
		title: 'PingOne MFA Flow (V5)',
		subtitle:
			'Multi-factor authentication flow with PingOne MFA services. Demonstrates device registration, MFA method selection, and token exchange with MFA context.',
		version: 'V5',
		icon: '🛡️',
	},
	'pingone-mfa-v6': {
		flowType: 'oidc',
		title: 'PingOne MFA Flow (V6)',
		subtitle:
			'🛡️ Modern V6 implementation: Multi-factor authentication with enhanced UX. Demonstrates device registration, MFA method selection, and secure token exchange with comprehensive MFA context.',
		version: 'V6',
		icon: '🛡️',
	},
	rar: {
		flowType: 'oauth',
		title: 'Rich Authorization Requests (RAR) Flow',
		subtitle:
			'Enhanced OAuth 2.0 flow with granular authorization details for fine-grained access control. Enables detailed permission specifications beyond simple scopes.',
		icon: '🎯',
		version: 'V5',
	},
	'rar-v7': {
		flowType: 'oauth',
		title: 'RAR Flow (V7) - Rich Authorization Requests',
		subtitle:
			'🎯 V7: Enhanced RAR implementation with V7 services - Fine-grained authorization using structured JSON (RFC 9396). Enables detailed permission specifications beyond simple scopes with comprehensive credential management and modern UI.',
		icon: '🎯',
		version: 'V7',
	},
	'jwt-bearer': {
		flowType: 'oauth',
		title: 'OAuth 2.0 JWT Bearer Flow',
		subtitle:
			'Server-to-server authentication using JWT assertions instead of traditional client credentials for secure token exchange',
		icon: '🔑',
		version: 'V5',
	},
	'jwt-bearer-token-v5': {
		flowType: 'oauth',
		title: 'JWT Bearer Token Flow - Assertion-Based Access',
		subtitle:
			'Authenticate machine clients by exchanging signed JWT assertions for access tokens. Demonstrates PingOne-style implementation with mock tokens for education.',
		icon: '🔐',
		version: 'V5',
	},

	// Documentation Pages
	documentation: {
		flowType: 'documentation',
		title: 'PingOne Client Generator',
		subtitle:
			'Create and configure OAuth 2.0 and OpenID Connect applications in your PingOne environment. Generate clients for web apps, native apps, SPAs, workers, and services.',
		icon: '📚',
	},

	// Login Page
	login: {
		flowType: 'pingone',
		title: 'PingOne Authentication',
		subtitle:
			'🔐 V7: Dedicated authentication page with inline and popup modes - Modern PingOne authentication interface with comprehensive user management and security features.',
		icon: '🔐',
		version: 'V7',
	},

	// SAML Bearer Assertion Flow
	'saml-bearer': {
		flowType: 'pingone',
		title: 'SAML Bearer Assertion Flow (Mock)',
		subtitle:
			'Educational implementation of RFC 7522 SAML Bearer Assertion for OAuth token exchange. Mock implementation since PingOne does not support SAML Bearer assertions.',
		icon: '🛡️',
	},
};

export interface FlowHeaderProps {
	flowId?: string;
	flowType?: string;
	customConfig?: Partial<FlowHeaderConfig>;
}

export const FlowHeader: React.FC<FlowHeaderProps> = ({ flowId, flowType, customConfig }) => {
	// Support both flowId (existing) and flowType (new page types)
	const configKey = flowId || flowType;
	const baseConfig = configKey ? FLOW_CONFIGS[configKey] : null;
	// Always use customConfig if baseConfig doesn't exist, don't throw it away!
	const config = baseConfig ? { ...baseConfig, ...customConfig } : customConfig || null;

	if (!config) {
		console.warn(`No configuration found for flow ID/type: ${configKey}`);
		return null;
	}

	const getBadgeText = () => {
		if (!config.flowType) return 'UNKNOWN';
		const typeText = config.flowType.toUpperCase();
		return config.version ? `${typeText} ${config.version}` : typeText;
	};

	return (
		<HeaderContainer $flowType={config.flowType} $securityFeatures={config.securityFeatures}>
			<HeaderBadge $flowType={config.flowType} $securityFeatures={config.securityFeatures}>
				{config.icon && <HeaderIcon>{config.icon}</HeaderIcon>}
				{getBadgeText()}
				{config.isExperimental && <StatusBadge $type="experimental">Experimental</StatusBadge>}
				{config.isDeprecated && <StatusBadge $type="deprecated">Deprecated</StatusBadge>}
			</HeaderBadge>
			<HeaderTitle>{config.title}</HeaderTitle>
			<HeaderSubtitle>{config.subtitle}</HeaderSubtitle>
			<VersionDisplay>PingOne MasterFlow API v{packageJson.version}</VersionDisplay>
		</HeaderContainer>
	);
};

// Utility function to get flow configuration
export const getFlowConfig = (flowId: string): FlowHeaderConfig | null => {
	return FLOW_CONFIGS[flowId] || null;
};

// Utility function to get all flow configs by type
export const getFlowConfigsByType = (
	flowType: FlowHeaderConfig['flowType']
): Record<string, FlowHeaderConfig> => {
	const result: Record<string, FlowHeaderConfig> = {};
	Object.entries(FLOW_CONFIGS)
		.filter(([, config]) => config.flowType === flowType)
		.forEach(([key, config]) => {
			result[key] = config;
		});
	return result;
};

// Utility function to create security features config from PingOne application state
export const createSecurityFeaturesConfig = (
	pingOneConfig: any
): FlowHeaderConfig['securityFeatures'] => {
	if (!pingOneConfig) return undefined;

	return {
		jwksEnabled: pingOneConfig.enableJWKS || false,
		parEnabled: pingOneConfig.requirePushedAuthorizationRequest || false,
		jarEnabled: pingOneConfig.requestParameterSignatureRequirement === 'REQUIRE_SIGNED' || false,
		dpopEnabled: pingOneConfig.enableDPoP || false,
		highSecurityMode:
			(pingOneConfig.enableJWKS &&
				pingOneConfig.requirePushedAuthorizationRequest &&
				pingOneConfig.requestParameterSignatureRequirement === 'REQUIRE_SIGNED') ||
			false,
	};
};

// Utility function to create a flow header with security features
export const createFlowHeaderWithSecurity = (
	flowId: string,
	pingOneConfig?: any
): React.ReactElement => {
	const securityFeatures = createSecurityFeaturesConfig(pingOneConfig);
	return <FlowHeader flowId={flowId} customConfig={{ securityFeatures }} />;
};

export default {
	FlowHeader,
	FLOW_CONFIGS,
	getFlowConfig,
	getFlowConfigsByType,
	createSecurityFeaturesConfig,
	createFlowHeaderWithSecurity,
};
