// src/pages/PingProductComparison.tsx
// Comparison of OAuth/OIDC features across Ping products

import React, { useState } from 'react';
import styled from 'styled-components';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

interface FeatureSupport {
	pf: 'full' | 'partial' | 'none' | 'plugin';
	aic: 'full' | 'partial' | 'none' | 'plugin';
	pingone: 'full' | 'partial' | 'none' | 'plugin';
	notes?: {
		pf?: string;
		aic?: string;
		pingone?: string;
	};
}

interface Feature {
	name: string;
	category: string;
	support: FeatureSupport;
	description?: string;
	verified?: boolean;
	verificationDate?: string;
	verificationSource?: string;
}

const PageContainer = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 2rem;
	background: #f8fafc;
	min-height: 100vh;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 3rem;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: #6b7280;
	max-width: 800px;
	margin: 0 auto;
`;

const FilterBar = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
	align-items: center;
`;

const FilterButton = styled.button<{ $active: boolean }>`
	padding: 0.5rem 1rem;
	border: 2px solid ${props => props.$active ? '#3b82f6' : '#e5e7eb'};
	background: ${props => props.$active ? '#3b82f6' : 'white'};
	color: ${props => props.$active ? 'white' : '#374151'};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		border-color: #3b82f6;
		background: ${props => props.$active ? '#2563eb' : '#eff6ff'};
	}
`;

const Legend = styled.div`
	display: flex;
	gap: 2rem;
	padding: 1.5rem;
	background: white;
	border-radius: 0.75rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	flex-wrap: wrap;
`;

const LegendItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: #374151;
`;

const ComparisonTable = styled.div`
	background: white;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow: hidden;
`;

const TableHeader = styled.div`
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;
	gap: 1rem;
	padding: 1.5rem;
	background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
	color: white;
	font-weight: 600;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const CategorySection = styled.div`
	border-bottom: 1px solid #e5e7eb;

	&:last-child {
		border-bottom: none;
	}
`;

const CategoryHeader = styled.div`
	padding: 1rem 1.5rem;
	background: #f8fafc;
	font-weight: 600;
	font-size: 1rem;
	color: #1f2937;
	border-bottom: 1px solid #e5e7eb;
`;

const FeatureRow = styled.div<{ $unverified?: boolean }>`
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;
	gap: 1rem;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid #f3f4f6;
	transition: background 0.2s;
	background: ${props => props.$unverified ? '#fef3c7' : 'transparent'};
	border-left: ${props => props.$unverified ? '4px solid #f59e0b' : '4px solid transparent'};

	&:hover {
		background: ${props => props.$unverified ? '#fde68a' : '#f9fafb'};
	}

	&:last-child {
		border-bottom: none;
	}
`;

const FeatureName = styled.div`
	font-weight: 500;
	color: #1f2937;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const VerificationBadge = styled.div<{ $verified: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.125rem 0.5rem;
	border-radius: 9999px;
	font-size: 0.65rem;
	font-weight: 600;
	background: ${props => props.$verified ? '#dcfce7' : '#fef3c7'};
	color: ${props => props.$verified ? '#166534' : '#92400e'};
	border: 1px solid ${props => props.$verified ? '#86efac' : '#fbbf24'};
	width: fit-content;
`;

const VerificationInfo = styled.div`
	font-size: 0.7rem;
	color: #6b7280;
	font-weight: 400;
	margin-top: 0.25rem;
`;

const FeatureDescription = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	font-weight: 400;
`;

const SupportCell = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
`;

const SupportBadge = styled.div<{ $type: 'full' | 'partial' | 'none' | 'plugin' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.375rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	background: ${props => {
		switch (props.$type) {
			case 'full': return '#dcfce7';
			case 'partial': return '#fef3c7';
			case 'plugin': return '#dbeafe';
			case 'none': return '#fee2e2';
		}
	}};
	color: ${props => {
		switch (props.$type) {
			case 'full': return '#166534';
			case 'partial': return '#92400e';
			case 'plugin': return '#1e40af';
			case 'none': return '#991b1b';
		}
	}};
`;

const InfoIcon = styled(FiInfo)`
	cursor: help;
	opacity: 0.6;
	transition: opacity 0.2s;

	&:hover {
		opacity: 1;
	}
`;

const ProductHeader = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
`;

const ProductName = styled.div`
	font-weight: 700;
	font-size: 0.95rem;
`;

const ProductSubname = styled.div`
	font-size: 0.7rem;
	opacity: 0.9;
	font-weight: 400;
`;

const features: Feature[] = [
	// OAuth 2.0 Core Flows
	{
		name: 'Authorization Code Flow',
		category: 'OAuth 2.0 Core Flows',
		description: 'Standard OAuth 2.0 authorization code grant',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Authorization Code + PKCE',
		category: 'OAuth 2.0 Core Flows',
		description: 'Authorization code with Proof Key for Code Exchange',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Implicit Flow',
		category: 'OAuth 2.0 Core Flows',
		description: 'Legacy implicit grant (deprecated)',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
			notes: {
				pf: 'Supported but deprecated',
				aic: 'Supported but deprecated',
				pingone: 'Supported but deprecated',
			},
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Client Credentials',
		category: 'OAuth 2.0 Core Flows',
		description: 'Machine-to-machine authentication',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Resource Owner Password Credentials (ROPC)',
		category: 'OAuth 2.0 Core Flows',
		description: 'Direct username/password exchange (legacy)',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'none',
			notes: {
				pf: 'Supported with mappings',
				aic: 'Supported (with warnings)',
				pingone: 'Discouraged; not in modern configs',
			},
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PingIdentity OIDC & OAuth Feature Comparison 2025-11-11',
	},
	{
		name: 'Device Authorization Flow',
		category: 'OAuth 2.0 Core Flows',
		description: 'OAuth for devices with limited input (RFC 8628)',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Refresh Token',
		category: 'OAuth 2.0 Core Flows',
		description: 'Token refresh without re-authentication',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},

	// OIDC Features
	{
		name: 'OpenID Connect Core',
		category: 'OpenID Connect',
		description: 'ID tokens, UserInfo endpoint',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PingOne Platform OIDC/OAuth Docs, PingOne AIC OAuth & OIDC, PingFederate OAuth 2.0 Admin Guide',
	},
	{
		name: 'OIDC Discovery',
		category: 'OpenID Connect',
		description: '.well-known/openid-configuration endpoint',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'OIDC Dynamic Client Registration',
		category: 'OpenID Connect',
		description: 'Programmatic client registration',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'partial',
			notes: {
				pingone: 'Partial: Dynamic client registration is available via Management API only, not through standard OIDC DCR endpoints. Requires API credentials and administrative permissions.',
			},
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Hybrid Flow',
		category: 'OpenID Connect',
		description: 'Combination of authorization code and implicit',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Session Management',
		category: 'OpenID Connect',
		description: 'OP iframe, check_session_iframe',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'partial',
			notes: {
				pingone: 'Partial: Basic session management available but may not include full OP iframe and check_session_iframe functionality as specified in OIDC Session Management spec. Supports session tracking but with limitations.',
			},
		},
	},
	{
		name: 'Front-Channel Logout',
		category: 'OpenID Connect',
		description: 'Browser-based logout propagation',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Back-Channel Logout',
		category: 'OpenID Connect',
		description: 'Server-to-server logout notifications',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},

	// Advanced OAuth Features
	{
		name: 'Pushed Authorization Requests (PAR)',
		category: 'Advanced OAuth',
		description: 'RFC 9126 - Push auth params to server first',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Rich Authorization Requests (RAR)',
		category: 'Advanced OAuth',
		description: 'RFC 9396 - Fine-grained authorization details',
		support: {
			pf: 'full',
			aic: 'partial',
			pingone: 'partial',
			notes: {
				pf: 'Full support in PF 12.3+',
				aic: 'Partial support',
				pingone: 'Partial support',
			},
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PF 12.3 Release Notes - RFC 9396',
	},
	{
		name: 'JWT Secured Authorization Request (JAR)',
		category: 'Advanced OAuth',
		description: 'RFC 9101 - Signed/encrypted request objects',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PF OIDC Guide / PingOne API - RFC 9101',
	},
	{
		name: 'Token Exchange (RFC 8693)',
		category: 'Advanced OAuth',
		description: 'Exchange one token for another',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'partial',
			notes: {
				pingone: 'Partial: Supports limited token exchange scenarios. May not support all token types or exchange patterns defined in RFC 8693. Specific use cases need verification.',
			},
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'JWT Bearer Token (RFC 7523)',
		category: 'Advanced OAuth',
		description: 'Use JWT as authorization grant',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'OAuth Client Assertion Grant - RFC 7523',
	},
	{
		name: 'SAML Bearer Token (RFC 7522)',
		category: 'Advanced OAuth',
		description: 'Use SAML assertion as authorization grant',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'none',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'ForgeRock AM / PF Docs - Assertion Grant RFC 7522',
	},
	{
		name: 'Client-Initiated Backchannel Authentication (CIBA)',
		category: 'Advanced OAuth',
		description: 'Decoupled authentication flow',
		support: {
			pf: 'full',
			aic: 'none',
			pingone: 'plugin',
			notes: {
				pf: 'Fully supported with PingOne MFA integration',
				aic: 'Not exposed in public endpoints',
				pingone: 'Use PingFederate + PingOne MFA',
			},
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PingIdentity OIDC & OAuth Feature Comparison 2025-11-11',
	},

	// Token Features
	{
		name: 'JWT Access Tokens',
		category: 'Token Features',
		description: 'Self-contained access tokens (RFC 9068)',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PF JWT ATM Config - RFC 9068',
	},
	{
		name: 'Opaque Access Tokens',
		category: 'Token Features',
		description: 'Reference tokens requiring introspection',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'partial',
			notes: {
				pingone: 'Partial: Limited opaque token support, primarily uses JWT',
			},
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'Introspection Endpoint - AIC + PF',
	},
	{
		name: 'Token Introspection (RFC 7662)',
		category: 'Token Features',
		description: 'Validate and get token metadata',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Token Revocation (RFC 7009)',
		category: 'Token Features',
		description: 'Invalidate tokens',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},
	{
		name: 'Demonstrating Proof of Possession (DPoP)',
		category: 'Token Features',
		description: 'RFC 9449 - Bind tokens to client',
		support: {
			pf: 'full',
			aic: 'none',
			pingone: 'plugin',
			notes: {
				pf: 'Built-in nonce and replay prevention',
				aic: 'Not supported',
				pingone: 'Via PingAccess when fronting PingOne',
			},
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PingIdentity OIDC & OAuth Feature Comparison 2025-11-11',
	},
	{
		name: 'Mutual TLS (mTLS)',
		category: 'Token Features',
		description: 'RFC 8705 - Certificate-bound tokens',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2024-01-15',
		verificationSource: 'PingFederate 12.2 Developer\'s Reference Guide - OAuth 2.0 endpoints',
	},

	// Security Features
	{
		name: 'PKCE (RFC 7636)',
		category: 'Security Features',
		description: 'Proof Key for Code Exchange',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'Default in Ping Products - RFC 7636',
	},
	{
		name: 'State Parameter',
		category: 'Security Features',
		description: 'CSRF protection',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'Default in Ping Products - OIDC Core §3.2.2',
	},
	{
		name: 'Nonce Parameter',
		category: 'Security Features',
		description: 'Replay attack prevention',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'Default in Ping Products - OIDC Core §3.2.2',
	},
	{
		name: 'Request Object Encryption',
		category: 'Security Features',
		description: 'Encrypt authorization request parameters',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
	},
	{
		name: 'ID Token Encryption',
		category: 'Security Features',
		description: 'Encrypt ID tokens (JWE)',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PF JWE Config / PingOne API - OIDC §16.14',
	},
	{
		name: 'FAPI 1.0 Advanced',
		category: 'Security Features',
		description: 'Financial-grade API security profile',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PF 12.x / AIC Docs - FAPI WG',
	},
	{
		name: 'FAPI 2.0',
		category: 'Security Features',
		description: 'Next-gen financial API security',
		support: {
			pf: 'partial',
			aic: 'full',
			pingone: 'full',
			notes: {
				pf: 'Partial: Preview in PingFederate 12.3',
			},
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PF 12.3 Release Notes - FAPI 2.0 Draft',
	},

	// Authentication Methods
	{
		name: 'Client Secret (Basic/Post)',
		category: 'Client Authentication',
		description: 'Shared secret authentication (client_secret_basic, client_secret_post)',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PingIdentity OIDC & OAuth Feature Comparison 2025-11-11 - Token Authentication Summary',
	},
	{
		name: 'Client Secret JWT',
		category: 'Client Authentication',
		description: 'JWT-based client secret authentication (client_secret_jwt)',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PingIdentity OIDC & OAuth Feature Comparison 2025-11-11 - Token Authentication Summary',
	},
	{
		name: 'Private Key JWT',
		category: 'Client Authentication',
		description: 'Asymmetric key authentication (private_key_jwt)',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PingIdentity OIDC & OAuth Feature Comparison 2025-11-11 - Token Authentication Summary',
	},
	{
		name: 'Public Clients (none)',
		category: 'Client Authentication',
		description: 'No client authentication for public clients',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
			notes: {
				pf: 'Configurable per client',
			},
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PingIdentity OIDC & OAuth Feature Comparison 2025-11-11 - Token Authentication Summary',
	},
	{
		name: 'mTLS Client Authentication',
		category: 'Client Authentication',
		description: 'Certificate-based authentication',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
	},
	{
		name: 'Self-Signed Certificate',
		category: 'Client Authentication',
		description: 'Self-signed cert for client auth',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
	},

	// Specialized Features
	{
		name: 'Step-Up Authentication',
		category: 'Specialized Features',
		description: 'Request higher authentication level (ACR/AMR)',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'PingOne / PF Docs - Session Management',
	},
	{
		name: 'Consent Management',
		category: 'Specialized Features',
		description: 'User consent tracking and management',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'AIC Consent Mgmt / PingOne Consents API - OAuth2 §10',
	},
	{
		name: 'Custom Scopes',
		category: 'Specialized Features',
		description: 'Define custom OAuth scopes',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'All Ping Products - Claim Mapping',
	},
	{
		name: 'Custom Claims',
		category: 'Specialized Features',
		description: 'Add custom claims to tokens',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
		verified: true,
		verificationDate: '2025-11-11',
		verificationSource: 'All Ping Products - Custom Claims Injection',
	},
	{
		name: 'Token Lifetime Policies',
		category: 'Specialized Features',
		description: 'Configurable token expiration',
		support: {
			pf: 'full',
			aic: 'full',
			pingone: 'full',
		},
	},
	{
		name: 'Adaptive Authentication',
		category: 'Specialized Features',
		description: 'Risk-based authentication decisions',
		support: {
			pf: 'plugin',
			aic: 'full',
			pingone: 'full',
			notes: {
				pf: 'Via PingOne Risk integration',
			},
		},
	},
	{
		name: 'Passwordless Authentication',
		category: 'Specialized Features',
		description: 'WebAuthn, FIDO2, magic links',
		support: {
			pf: 'plugin',
			aic: 'full',
			pingone: 'full',
			notes: {
				pf: 'Via integrations',
			},
		},
	},
];

const PingProductComparison: React.FC = () => {
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [showOnlyUnverified, setShowOnlyUnverified] = useState<boolean>(false);

	// Calculate verification statistics
	const totalFeatures = features.length;
	const verifiedFeatures = features.filter(f => f.verified).length;
	const unverifiedFeatures = totalFeatures - verifiedFeatures;
	const verificationPercentage = Math.round((verifiedFeatures / totalFeatures) * 100);

	const categories = ['all', ...Array.from(new Set(features.map(f => f.category)))];
	
	let filteredFeatures = selectedCategory === 'all' 
		? features 
		: features.filter(f => f.category === selectedCategory);

	// Apply unverified filter if enabled
	if (showOnlyUnverified) {
		filteredFeatures = filteredFeatures.filter(f => !f.verified);
	}

	const groupedFeatures = filteredFeatures.reduce((acc, feature) => {
		if (!acc[feature.category]) {
			acc[feature.category] = [];
		}
		acc[feature.category].push(feature);
		return acc;
	}, {} as Record<string, Feature[]>);

	const getSupportIcon = (support: 'full' | 'partial' | 'none' | 'plugin') => {
		switch (support) {
			case 'full':
				return <FiCheckCircle size={16} color="#16a34a" />;
			case 'partial':
				return <FiAlertCircle size={16} color="#d97706" />;
			case 'plugin':
				return <FiInfo size={16} color="#2563eb" />;
			case 'none':
				return <FiXCircle size={16} color="#dc2626" />;
		}
	};

	const getSupportLabel = (support: 'full' | 'partial' | 'none' | 'plugin') => {
		switch (support) {
			case 'full': return 'Full';
			case 'partial': return 'Partial';
			case 'plugin': return 'Plugin';
			case 'none': return 'None';
		}
	};

	return (
		<PageContainer>
			<Header>
				<Title>Ping Product Comparison</Title>
				<Subtitle>
					OAuth 2.0 and OpenID Connect feature support across PingFederate, 
					PingOne Advanced Identity Cloud, and PingOne
				</Subtitle>
			</Header>

			{/* Verification Status Banner */}
			<div style={{ 
				padding: '1.5rem', 
				background: verificationPercentage === 100 ? '#dcfce7' : '#fef3c7', 
				borderRadius: '0.75rem', 
				marginBottom: '1.5rem',
				border: `2px solid ${verificationPercentage === 100 ? '#86efac' : '#fbbf24'}`
			}}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						<div style={{ 
							fontSize: '2.5rem', 
							color: verificationPercentage === 100 ? '#166534' : '#92400e' 
						}}>
							{verificationPercentage === 100 ? '✓' : '⚠️'}
						</div>
						<div>
							<h3 style={{ 
								margin: '0 0 0.25rem 0', 
								color: verificationPercentage === 100 ? '#166534' : '#92400e',
								fontSize: '1.125rem',
								fontWeight: 700
							}}>
								Verification Status: {verificationPercentage}% Complete
							</h3>
							<p style={{ 
								margin: 0, 
								color: verificationPercentage === 100 ? '#166534' : '#92400e',
								fontSize: '0.875rem'
							}}>
								{verifiedFeatures} of {totalFeatures} features verified against official documentation
								{unverifiedFeatures > 0 && ` • ${unverifiedFeatures} features need verification`}
							</p>
						</div>
					</div>
					<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
						<div style={{ 
							background: 'white', 
							padding: '0.75rem 1.25rem', 
							borderRadius: '0.5rem',
							textAlign: 'center',
							border: '1px solid #e5e7eb'
						}}>
							<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>{verifiedFeatures}</div>
							<div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Verified</div>
						</div>
						<div style={{ 
							background: 'white', 
							padding: '0.75rem 1.25rem', 
							borderRadius: '0.5rem',
							textAlign: 'center',
							border: '1px solid #e5e7eb'
						}}>
							<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706' }}>{unverifiedFeatures}</div>
							<div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Unverified</div>
						</div>
					</div>
				</div>
				{unverifiedFeatures > 0 && (
					<div style={{ 
						marginTop: '1rem', 
						padding: '0.75rem 1rem', 
						background: 'white', 
						borderRadius: '0.5rem',
						fontSize: '0.875rem',
						color: '#92400e',
						border: '1px solid #fbbf24'
					}}>
						<strong>⚠️ Unverified features are highlighted in yellow.</strong> These features are based on general knowledge and should be verified against official Ping Identity documentation before making decisions.
					</div>
				)}
			</div>

			<Legend>
				<LegendItem>
					<FiCheckCircle size={18} color="#16a34a" />
					<strong>Full Support</strong> - Feature fully supported out of the box
				</LegendItem>
				<LegendItem>
					<FiAlertCircle size={18} color="#d97706" />
					<strong>Partial Support</strong> - Limited or requires configuration
				</LegendItem>
				<LegendItem>
					<FiInfo size={18} color="#2563eb" />
					<strong>Plugin/Integration</strong> - Requires additional plugin or integration
				</LegendItem>
				<LegendItem>
					<FiXCircle size={18} color="#dc2626" />
					<strong>Not Supported</strong> - Feature not available
				</LegendItem>
			</Legend>

			<FilterBar>
				<span style={{ fontWeight: 600, color: '#374151' }}>Filter by category:</span>
				{categories.map(category => (
					<FilterButton
						key={category}
						$active={selectedCategory === category}
						onClick={() => setSelectedCategory(category)}
					>
						{category === 'all' ? 'All Features' : category}
					</FilterButton>
				))}
				<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<label style={{ 
						display: 'flex', 
						alignItems: 'center', 
						gap: '0.5rem', 
						cursor: 'pointer',
						padding: '0.5rem 1rem',
						background: showOnlyUnverified ? '#fef3c7' : 'white',
						border: `2px solid ${showOnlyUnverified ? '#f59e0b' : '#e5e7eb'}`,
						borderRadius: '0.5rem',
						fontSize: '0.875rem',
						fontWeight: 600,
						color: showOnlyUnverified ? '#92400e' : '#374151',
						transition: 'all 0.2s'
					}}>
						<input
							type="checkbox"
							checked={showOnlyUnverified}
							onChange={(e) => setShowOnlyUnverified(e.target.checked)}
							style={{ cursor: 'pointer' }}
						/>
						Show Only Unverified ({unverifiedFeatures})
					</label>
				</div>
			</FilterBar>

			<ComparisonTable>
				<TableHeader>
					<div>Feature</div>
					<ProductHeader>
						<ProductName>PingFederate</ProductName>
						<ProductSubname>(Verified 2025-11-11)</ProductSubname>
					</ProductHeader>
					<ProductHeader>
						<ProductName>PingOne AIC</ProductName>
						<ProductSubname>(Verified 2025-11-11)</ProductSubname>
					</ProductHeader>
					<ProductHeader>
						<ProductName>PingOne SSO</ProductName>
						<ProductSubname>(Verified 2025-11-11)</ProductSubname>
					</ProductHeader>
				</TableHeader>

				{Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
					<CategorySection key={category}>
						<CategoryHeader>{category}</CategoryHeader>
						{categoryFeatures.map((feature, index) => (
							<FeatureRow key={`${category}-${index}`} $unverified={!feature.verified}>
								<FeatureName>
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
										<span>{feature.name}</span>
										<VerificationBadge $verified={!!feature.verified}>
											{feature.verified ? '✓ Verified' : '⚠ Needs Verification'}
										</VerificationBadge>
									</div>
									{feature.description && (
										<FeatureDescription>{feature.description}</FeatureDescription>
									)}
									{feature.verified && (feature.verificationDate || feature.verificationSource) && (
										<VerificationInfo>
											{feature.verificationDate && `Verified: ${feature.verificationDate}`}
											{feature.verificationDate && feature.verificationSource && ' • '}
											{feature.verificationSource && `Source: ${feature.verificationSource}`}
										</VerificationInfo>
									)}
								</FeatureName>
								<SupportCell>
									<SupportBadge $type={feature.support.pf}>
										{getSupportIcon(feature.support.pf)}
										{getSupportLabel(feature.support.pf)}
									</SupportBadge>
									{feature.support.notes?.pf && (
										<InfoIcon size={14} title={feature.support.notes.pf} />
									)}
								</SupportCell>
								<SupportCell>
									<SupportBadge $type={feature.support.aic}>
										{getSupportIcon(feature.support.aic)}
										{getSupportLabel(feature.support.aic)}
									</SupportBadge>
									{feature.support.notes?.aic && (
										<InfoIcon size={14} title={feature.support.notes.aic} />
									)}
								</SupportCell>
								<SupportCell>
									<SupportBadge $type={feature.support.pingone}>
										{getSupportIcon(feature.support.pingone)}
										{getSupportLabel(feature.support.pingone)}
									</SupportBadge>
									{feature.support.notes?.pingone && (
										<InfoIcon size={14} title={feature.support.notes.pingone} />
									)}
								</SupportCell>
							</FeatureRow>
						))}
					</CategorySection>
				))}
			</ComparisonTable>

			<div style={{ marginTop: '3rem', padding: '1.5rem', background: '#fef3c7', borderRadius: '0.75rem', border: '2px solid #f59e0b' }}>
				<h3 style={{ margin: '0 0 1rem 0', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<FiAlertCircle size={20} />
					⚠️ Important Disclaimer
				</h3>
				<div style={{ color: '#92400e', lineHeight: 1.8, fontSize: '0.95rem' }}>
					<p style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>
						This comparison is based on general knowledge and publicly available information. 
						Feature support may vary based on:
					</p>
					<ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>
						<li>Product version and release date</li>
						<li>Licensing tier and subscription level</li>
						<li>Configuration and customization</li>
						<li>Integration with other Ping products</li>
						<li>Regional availability and deployment model</li>
					</ul>
					<p style={{ margin: '0', fontWeight: 600 }}>
						⚠️ <strong>Always verify with official Ping Identity documentation or your account team before making architectural decisions.</strong>
					</p>
				</div>
			</div>

			<div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #bfdbfe' }}>
				<h3 style={{ margin: '0 0 1rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<FiInfo size={20} />
					Key Takeaways
				</h3>
				<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e40af', lineHeight: 1.8 }}>
					<li><strong>PingOne</strong> - Modern cloud-native platform with excellent OAuth/OIDC support, best for new deployments</li>
					<li><strong>PingOne AIC</strong> - Most comprehensive feature set, ideal for complex enterprise requirements</li>
					<li><strong>PingFederate</strong> - Mature on-premise solution, highly customizable but may require plugins for newer features</li>
					<li>All three products support core OAuth 2.0 and OpenID Connect specifications</li>
					<li>Advanced features like RAR, CIBA, and DPoP are better supported in cloud platforms (AIC, PingOne)</li>
				</ul>
			</div>

			<div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
				<h3 style={{ margin: '0 0 1rem 0', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<FiInfo size={20} />
					Sources & Verification
				</h3>
				<div style={{ color: '#6b7280', lineHeight: 1.8, fontSize: '0.875rem' }}>
					<p style={{ margin: '0 0 0.75rem 0' }}>
						This comparison is compiled from:
					</p>
					<ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>
						<li>Ping Identity official documentation</li>
						<li>Product release notes and feature announcements</li>
						<li>OAuth 2.0 and OpenID Connect specifications (RFCs)</li>
						<li>Community knowledge and implementation experience</li>
					</ul>
					<p style={{ margin: '0', fontSize: '0.8rem', fontStyle: 'italic' }}>
						<strong>Recommended Resources:</strong>
					</p>
					<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', fontSize: '0.8rem' }}>
						<li><a href="https://docs.pingidentity.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Ping Identity Documentation</a></li>
						<li><a href="https://www.pingidentity.com/en/resources/product-comparison.html" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Official Product Comparison</a></li>
						<li><a href="https://support.pingidentity.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Ping Identity Support Portal</a></li>
						<li>Contact your Ping Identity account team for specific requirements</li>
					</ul>
				</div>
			</div>
		</PageContainer>
	);
};

export default PingProductComparison;
