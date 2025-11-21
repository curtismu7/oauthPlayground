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
}

const HeaderContainer = styled.div<{ $flowType: FlowHeaderConfig['flowType'] }>`
	background: ${({ $flowType }) => {
		switch ($flowType) {
			case 'oauth':
				return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
			case 'oidc':
				return 'linear-gradient(135deg, #10b981 0%, #047857 100%)';
			case 'pingone':
				return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			case 'documentation':
				return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
			default:
				return 'linear-gradient(135deg, #6b7280 0%, #374151 100%)';
		}
	}};
	color: white;
	padding: 2.5rem 4rem;
	border-radius: 12px;
	margin-bottom: 2rem;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 1rem;

	@media (max-width: 768px) {
		padding: 2rem;
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

const HeaderBadge = styled.div<{ $flowType: FlowHeaderConfig['flowType'] }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
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
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const HeaderSubtitle = styled.p`
  font-size: 1rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.6;
  max-width: 800px;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const VersionDisplay = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.875rem;
  opacity: 0.8;
  font-weight: 500;
`;

const HeaderIcon = styled.span`
  font-size: 1.5rem;
`;

// Predefined flow configurations
export const FLOW_CONFIGS: Record<string, FlowHeaderConfig> = {
	// OAuth 2.0 V5 Flows
	'oauth-authorization-code-v5': {
		flowType: 'oauth',
		title: 'Authorization Code Flow - Secure User Authentication',
		subtitle:
			'The most widely used OAuth 2.0 flow for web and mobile applications. Implements three-legged authorization with PKCE (Proof Key for Code Exchange) for enhanced security against authorization code interception attacks.',
		icon: '🔐',
		version: 'V5',
	},
	'oauth-implicit-v5': {
		flowType: 'oauth',
		title: 'Implicit Flow - Legacy Browser-Based Authentication',
		subtitle:
			'Deprecated OAuth 2.0 flow that returns access tokens directly in the URL fragment without an authorization code exchange. No longer recommended - use Authorization Code Flow with PKCE instead for better security.',
		icon: '⚡',
		version: 'V5',
	},
	'client-credentials-v5': {
		flowType: 'oauth',
		title: 'Client Credentials Flow - Server-to-Server Authentication',
		subtitle:
			'Secure machine-to-machine authentication for backend services and APIs. Obtain access tokens directly using client ID and secret without user interaction. Perfect for microservices, batch jobs, and automated processes.',
		icon: '🔑',
		version: 'V5',
	},
	'device-authorization-v5': {
		flowType: 'oauth',
		title: 'Device Authorization Flow - Input-Constrained Devices',
		subtitle:
			'OAuth 2.0 flow for devices without browsers or limited input capability (smart TVs, IoT devices, CLI tools). Users authenticate on a secondary device using a device code and user code.',
		icon: '📱',
		version: 'V5',
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
		title: 'Authorization Code Flow - User Identity & Authentication',
		subtitle:
			'OpenID Connect authentication flow that extends OAuth 2.0 with ID tokens for user identity verification. Provides both access tokens for API access and ID tokens containing user claims. The recommended flow for secure user authentication.',
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
	'hybrid-v5': {
		flowType: 'oidc',
		title: 'Hybrid Flow - Combined Authorization Approach',
		subtitle:
			'Advanced OpenID Connect flow combining Authorization Code and Implicit patterns. Returns some tokens immediately from the authorization endpoint and others via code exchange for flexible authentication scenarios.',
		icon: '🔄',
		version: 'V5',
	},
	'oidc-device-authorization-v5': {
		flowType: 'oidc',
		title: 'Device Authorization Flow - OIDC for Constrained Devices',
		subtitle:
			'OpenID Connect device flow for input-constrained devices (smart TVs, IoT, CLI). Provides both access tokens and ID tokens with user authentication on a secondary device.',
		icon: '📲',
		version: 'V5',
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
	'pingone-par-v5': {
		flowType: 'pingone',
		title: 'Pushed Authorization Requests (PAR) Flow',
		subtitle:
			'Enhanced security flow that pushes authorization parameters directly to the authorization server before redirecting. Prevents parameter tampering and reduces URL size for complex requests.',
		icon: '🔒',
		version: 'V5',
	},
	'redirectless-flow-v5': {
		flowType: 'pingone',
		title: 'Redirectless Flow - Seamless Mobile Authentication',
		subtitle:
			'Innovative PingOne flow that eliminates browser redirects for embedded authentication. Perfect for mobile apps and single-page applications requiring seamless user experience without context switching.',
		icon: '⚡',
		version: 'V5',
	},
	redirectless: {
		flowType: 'pingone',
		title: 'Redirectless Flow - Educational Demo',
		subtitle:
			'Educational demonstration of PingOne redirectless authentication flow. Learn how to implement seamless authentication without browser redirects in mobile and embedded applications.',
		icon: '🎯',
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
	'oidc-ciba-v5': {
		flowType: 'oidc',
		title: 'OIDC CIBA Flow (V5)',
		subtitle:
			'Client Initiated Backchannel Authentication flow for decoupled authentication scenarios with secondary device approval',
		version: 'V5',
	},
	rar: {
		flowType: 'oauth',
		title: 'Rich Authorization Requests (RAR) Flow',
		subtitle:
			'Enhanced OAuth 2.0 flow with granular authorization details for fine-grained access control. Enables detailed permission specifications beyond simple scopes.',
		icon: '🎯',
		version: 'V5',
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
	const config = baseConfig ? { ...baseConfig, ...customConfig } : null;

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
		<HeaderContainer $flowType={config.flowType}>
			<HeaderBadge $flowType={config.flowType}>
				{config.icon && <HeaderIcon>{config.icon}</HeaderIcon>}
				{getBadgeText()}
				{config.isExperimental && <StatusBadge $type="experimental">Experimental</StatusBadge>}
				{config.isDeprecated && <StatusBadge $type="deprecated">Deprecated</StatusBadge>}
			</HeaderBadge>
			<HeaderTitle>{config.title}</HeaderTitle>
			<HeaderSubtitle>{config.subtitle}</HeaderSubtitle>
			<VersionDisplay>PingOne OAuth/OIDC Playground v{packageJson.version}</VersionDisplay>
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

export default {
	FlowHeader,
	FLOW_CONFIGS,
	getFlowConfig,
	getFlowConfigsByType,
};
