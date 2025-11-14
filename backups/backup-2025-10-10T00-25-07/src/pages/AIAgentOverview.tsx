import { useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCpu,
	FiInfo,
	FiKey,
	FiLock,
	FiServer,
	FiShield,
	FiX,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { Card, CardBody } from '../components/Card';
import { FlowHeader } from '../services/flowHeaderService';
import { CollapsibleHeader as V6CollapsibleHeader } from '../services/collapsibleHeaderService';
import { PageLayoutService } from '../services/pageLayoutService';
import { FlowUIService } from '../services/flowUIService';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
`;

const FeatureCard = styled(Card)<{ $supported?: boolean | null }>`
  border-left: 4px solid ${({ $supported, theme }) =>
		$supported === true
			? theme.colors.success
			: $supported === false
				? theme.colors.danger
				: theme.colors.warning};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const FeatureHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin: 0;
  }

  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const StatusBadge = styled.button<{ $status: 'supported' | 'not-supported' | 'partial' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;

  ${({ $status }) => {
		switch ($status) {
			case 'supported':
				return `
          background-color: #dcfce7;
          color: #166534;
          &:hover {
            background-color: #bbf7d0;
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(22, 101, 52, 0.2);
          }
        `;
			case 'not-supported':
				return `
          background-color: #fee2e2;
          color: #991b1b;
          &:hover {
            background-color: #fecaca;
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(153, 27, 27, 0.2);
          }
        `;
			case 'partial':
				return `
          background-color: #fef3c7;
          color: #92400e;
          border: 2px solid #d97706;
          box-shadow: 0 2px 4px rgba(217, 119, 6, 0.1);
          &:hover {
            background-color: #fde68a;
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
            border-color: #b45309;
          }
        `;
		}
	}}

  svg {
    width: 16px;
    height: 16px;
  }

  &:focus {
    outline: 2px solid #3b82f6;
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
  padding: 1rem;
`;

const PopupContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  p {
    margin: 0 0 1rem 0;
    line-height: 1.6;
    color: #4b5563;
  }

  ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #4b5563;

    li {
      margin-bottom: 0.5rem;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;

  &:hover {
    color: #374151;
  }
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const TechnicalDetails = styled.div`
  background-color: ${({ theme }) => theme.colors.gray100};
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.875rem;

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin: 0 0 0.5rem 0;
  }

  ul {
    margin: 0;
    padding-left: 1.5rem;
    color: ${({ theme }) => theme.colors.gray600};
    
    li {
      margin-bottom: 0.25rem;
    }
  }
`;

const PingOneNote = styled.div<{ $type: 'info' | 'warning' | 'success' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  
  ${({ $type, theme }) => {
		switch ($type) {
			case 'info':
				return `
          background-color: ${theme.colors.info}10;
          border: 1px solid ${theme.colors.info}30;
          color: ${theme.colors.info};
        `;
			case 'warning':
				return `
          background-color: ${theme.colors.warning}10;
          border: 1px solid ${theme.colors.warning}30;
          color: ${theme.colors.warning};
        `;
			case 'success':
				return `
          background-color: ${theme.colors.success}10;
          border: 1px solid ${theme.colors.success}30;
          color: ${theme.colors.success};
        `;
		}
	}}

  svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  div {
    flex: 1;
    
    h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  }
`;

const ComparisonSection = styled(Card)`
  margin: 3rem 0;
`;

const ComparisonTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  margin: 0;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

  th, td {
    padding: 1rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  }

  th {
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.gray100} 0%, ${({ theme }) => theme.colors.gray200} 100%);
    color: ${({ theme }) => theme.colors.gray900};
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 2px solid ${({ theme }) => theme.colors.gray300};
  }

  td {
    color: ${({ theme }) => theme.colors.gray700};
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover {
    background-color: ${({ theme }) => theme.colors.gray100};
  }

  /* Mobile responsiveness */
  @media (max-width: 1200px) {
    font-size: 0.8rem;
    th, td {
      padding: 0.75rem 0.5rem;
    }
  }

  @media (max-width: 768px) {
    font-size: 0.75rem;
    th, td {
      padding: 0.5rem 0.25rem;
    }
  }
`;

// Collapsible Section Components
const CollapsibleSection = styled.div`
  margin-bottom: 2rem;
`;

const CollapsibleHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  
  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  svg {
    color: #6b7280;
    transition: transform 0.2s ease;
  }
`;

const CollapsibleContent = styled.div<{ $isOpen: boolean }>`
  max-height: ${({ $isOpen }) => ($isOpen ? '2000px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  transition: opacity 0.2s ease-in-out;
`;

const AIAgentOverview = () => {
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '1400px',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'ai-agent-overview',
	};
	const { PageContainer, ContentWrapper, FlowHeader: LayoutFlowHeader } =
		PageLayoutService.createPageLayout(pageConfig);

	// State for collapsible sections (only for inner comparison table)
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
		comparisonTable: true, // Add state for the inner comparison table - expanded by default
	});

	// State for popup explanations
	const [popupData, setPopupData] = useState<{
		isOpen: boolean;
		title: string;
		content: string;
	} | null>(null);

	const toggleSection = (sectionId: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[sectionId]: !prev[sectionId],
		}));
	};

	// Explanations for limited/partial/not-available features
	const explanations = {
		'rar-pingone': {
			title: 'RAR - PingOne (Not Available)',
			content: `
				<p>PingOne does not currently support RAR:</p>
				<ul>
					<li>No support for authorization_details parameter</li>
					<li>No support for rich authorization requests</li>
					<li>Use traditional scopes or custom claims as alternatives</li>
					<li>Basic authorization through scope-based permissions</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingAM for full RAR support or implement custom authorization logic in your application.</p>
			`,
		},
		'rar-pingfederate': {
			title: 'RAR - PingFederate (Limited)',
			content: `
				<p>PingFederate has limited RAR support:</p>
				<ul>
					<li>Supports basic authorization_details parameter parsing</li>
					<li>Limited to predefined authorization detail types</li>
					<li>No support for custom authorization detail types</li>
					<li>Policy evaluation is basic compared to full RAR spec</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingAM for full RAR support or implement custom authorization logic.</p>
			`,
		},
		'rar-pingone-advanced': {
			title: 'RAR - PingOne Advanced (Partial)',
			content: `
				<p>PingOne Advanced has partial RAR support:</p>
				<ul>
					<li>Supports authorization_details parameter</li>
					<li>Limited type support compared to full spec</li>
					<li>Basic policy evaluation for RAR claims</li>
					<li>No support for complex nested authorization requirements</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingAM for comprehensive RAR support.</p>
			`,
		},
		'dpop-pingfederate': {
			title: 'DPoP - PingFederate (Client Auth Only)',
			content: `
				<p>PingFederate supports DPoP for client authentication only:</p>
				<ul>
					<li>Client authentication using DPoP proof-of-possession</li>
					<li>No support for sender-constrained access tokens</li>
					<li>Cannot bind tokens to specific clients</li>
					<li>Limited protection against token theft</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingAM for full DPoP support or implement alternative token binding mechanisms.</p>
			`,
		},
		'dpop-pingone': {
			title: 'DPoP - PingOne (Not Available)',
			content: `
				<p>PingOne does not currently support DPoP:</p>
				<ul>
					<li>No support for Demonstrating Proof of Possession</li>
					<li>No sender-constrained token support</li>
					<li>Cannot prevent token replay attacks</li>
					<li>Basic token security only</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingAM for full DPoP support or implement mTLS or one-time refresh tokens as alternatives.</p>
			`,
		},
		'dpop-pingone-advanced': {
			title: 'DPoP - PingOne Advanced (Client Auth Only)',
			content: `
				<p>PingOne Advanced supports DPoP for client authentication only:</p>
				<ul>
					<li>Client authentication using DPoP proof-of-possession</li>
					<li>No support for sender-constrained access tokens</li>
					<li>Cannot bind tokens to specific clients</li>
					<li>Limited protection against token theft</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingAM for full DPoP support or implement alternative token binding mechanisms.</p>
			`,
		},
		'mtls-pingone': {
			title: 'mTLS - PingOne (Client Auth Only)',
			content: `
				<p>PingOne supports mTLS for client authentication only:</p>
				<ul>
					<li>Certificate-based client authentication</li>
					<li>No support for certificate-bound access tokens</li>
					<li>Cannot prevent token misuse by unauthorized parties</li>
					<li>Limited sender-constraining capabilities</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingFederate or PingAM for full mTLS support with certificate-bound tokens.</p>
			`,
		},
		'token-exchange-pingfederate': {
			title: 'Token Exchange - PingFederate (Limited)',
			content: `
				<p>PingFederate has limited Token Exchange support:</p>
				<ul>
					<li>Basic token exchange functionality</li>
					<li>Limited token type support</li>
					<li>No support for complex delegation scenarios</li>
					<li>Basic actor and subject token handling</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingAM for comprehensive Token Exchange support or implement custom token exchange logic.</p>
			`,
		},
		'token-exchange-pingone': {
			title: 'Token Exchange - PingOne (Not Available)',
			content: `
				<p>PingOne does not currently support RFC 8693 Token Exchange:</p>
				<ul>
					<li>No support for token delegation and impersonation</li>
					<li>No support for cross-domain token exchange</li>
					<li>Limited to refresh token flows for token renewal</li>
					<li>No support for multiple token types</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingAM for comprehensive Token Exchange support or implement refresh tokens or re-authentication for token renewal scenarios.</p>
			`,
		},
		'token-exchange-pingone-advanced': {
			title: 'Token Exchange - PingOne Advanced (Limited)',
			content: `
				<p>PingOne Advanced has limited Token Exchange support:</p>
				<ul>
					<li>Basic token exchange functionality</li>
					<li>Limited token type support</li>
					<li>No support for complex delegation scenarios</li>
					<li>Basic actor and subject token handling</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingAM for comprehensive Token Exchange support or implement custom token exchange logic.</p>
			`,
		},
		'fapi-pingone': {
			title: 'FAPI Compliance - PingOne (Read-Only)',
			content: `
				<p>PingOne has read-only FAPI compliance:</p>
				<ul>
					<li>Supports FAPI 1.0 Advanced profile for read operations</li>
					<li>No support for write operations (payment initiation)</li>
					<li>Limited to financial data read access</li>
					<li>No support for dynamic client registration</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingFederate or PingAM for full FAPI compliance including write operations.</p>
			`,
		},
		'custom-tokens-pingone': {
			title: 'Custom Token Types - PingOne (Limited)',
			content: `
				<p>PingOne has limited custom token support:</p>
				<ul>
					<li>Standard JWT/JWS/JWE token support</li>
					<li>Limited extensibility for custom token types</li>
					<li>No support for non-standard token formats</li>
					<li>Basic token customization capabilities</li>
				</ul>
				<p><strong>Recommendation:</strong> Use PingFederate or PingAM for extensive token customization and non-standard token type support.</p>
			`,
		},
	};

	const showExplanation = (key: string) => {
		const explanation = explanations[key as keyof typeof explanations];
		if (explanation) {
			setPopupData({
				isOpen: true,
				title: explanation.title,
				content: explanation.content,
			});
		}
	};

	const closePopup = () => {
		setPopupData(null);
	};

	const features = [
		{
			id: 'par',
			title: 'Pushed Authorization Requests (PAR)',
			icon: FiLock,
			status: 'supported' as const,
			description:
				'PAR allows clients to push authorization request parameters directly to the authorization server before redirecting the user. Critical for AI agents to securely transmit complex authorization parameters.',
			technicalDetails: [
				'RFC 9126 - Pushed Authorization Requests',
				'Prevents parameter tampering and injection attacks',
				'Enables large or complex authorization requests',
				'Returns request_uri for use in authorization endpoint',
			],
			pingoneSupport: {
				type: 'success' as const,
				title: 'PingOne Support - Available',
				message:
					'PingOne fully supports PAR for enhanced security in authorization flows. Use the /as/par endpoint to push authorization parameters.',
			},
		},
		{
			id: 'rar',
			title: 'Rich Authorization Requests (RAR)',
			icon: FiZap,
			status: 'not-supported' as const,
			description:
				'RAR enables fine-grained authorization by allowing clients to specify detailed authorization requirements using structured JSON. Essential for AI agents requiring specific permissions and resource access.',
			technicalDetails: [
				'RFC 9396 - Rich Authorization Requests',
				'Structured JSON authorization_details parameter',
				'Fine-grained resource and action specifications',
				'Type-specific authorization requirements',
			],
			pingoneSupport: {
				type: 'warning' as const,
				title: 'PingOne Support - Not Available',
				message:
					'PingOne does not currently support RAR. Use traditional scopes or custom claims as an alternative for authorization requirements.',
			},
		},
		{
			id: 'dpop',
			title: 'DPoP (Demonstrating Proof of Possession)',
			icon: FiKey,
			status: 'not-supported' as const,
			description:
				'DPoP provides sender-constrained tokens by requiring clients to prove possession of a private key. Critical for preventing token theft and replay attacks in AI agent scenarios.',
			technicalDetails: [
				'RFC 9449 - OAuth 2.0 Demonstrating Proof-of-Possession',
				'Sender-constrained access and refresh tokens',
				'JWT-based proof of possession',
				'Protection against token theft and replay',
			],
			pingoneSupport: {
				type: 'warning' as const,
				title: 'PingOne Support - Not Available',
				message:
					'PingOne does not currently support DPoP. Consider using mTLS (mutual TLS) or one-time use refresh tokens as alternatives.',
			},
		},
		{
			id: 'mtls',
			title: 'Mutual TLS (mTLS)',
			icon: FiShield,
			status: 'partial' as const,
			description:
				'mTLS provides certificate-based authentication and sender-constrained tokens. Important for high-security AI agent deployments requiring strong authentication.',
			technicalDetails: [
				'RFC 8705 - OAuth 2.0 Mutual-TLS Client Authentication',
				'Certificate-bound access tokens',
				'PKI-based client authentication',
				'Protection against token misuse',
			],
			pingoneSupport: {
				type: 'warning' as const,
				title: 'PingOne Support - Limited',
				message:
					'PingOne supports mTLS for client authentication but not for certificate-bound tokens. Contact PingOne support for enterprise mTLS requirements.',
			},
		},
		{
			id: 'jwt-secured-auth',
			title: 'JWT-Secured Authorization Request (JAR)',
			icon: FiServer,
			status: 'supported' as const,
			description:
				'JAR allows authorization request parameters to be passed as a signed JWT. Provides integrity and authenticity for authorization requests from AI agents.',
			technicalDetails: [
				'RFC 9101 - JWT-Secured Authorization Request',
				'Signed and optionally encrypted request objects',
				'Request parameter integrity protection',
				'Support for request_uri parameter',
			],
			pingoneSupport: {
				type: 'success' as const,
				title: 'PingOne Support - Available',
				message:
					'PingOne supports JAR through request objects. Use the request or request_uri parameter with signed JWTs.',
			},
		},
		{
			id: 'client-credentials',
			title: 'Client Credentials Grant',
			icon: FiCpu,
			status: 'supported' as const,
			description:
				'Essential OAuth 2.0 grant for machine-to-machine authentication. The primary flow for AI agents acting autonomously without user context.',
			technicalDetails: [
				'RFC 6749 Section 4.4 - Client Credentials',
				'Machine-to-machine authentication',
				'No user context required',
				'Supports multiple authentication methods',
			],
			pingoneSupport: {
				type: 'success' as const,
				title: 'PingOne Support - Full Support',
				message:
					'PingOne fully supports Client Credentials grant with multiple authentication methods including client_secret_basic, client_secret_post, client_secret_jwt, and private_key_jwt.',
			},
		},
		{
			id: 'token-exchange',
			title: 'Token Exchange',
			icon: FiZap,
			status: 'not-supported' as const,
			description:
				'Enables secure token exchange and delegation scenarios. Important for AI agents that need to act on behalf of users or exchange tokens between services.',
			technicalDetails: [
				'RFC 8693 - OAuth 2.0 Token Exchange',
				'Token delegation and impersonation',
				'Cross-domain token exchange',
				'Support for multiple token types',
			],
			pingoneSupport: {
				type: 'warning' as const,
				title: 'PingOne Support - Not Available',
				message:
					'PingOne does not currently support RFC 8693 Token Exchange. Consider using refresh tokens or re-authentication for token renewal scenarios.',
			},
		},
		{
			id: 'device-code',
			title: 'Device Authorization Grant',
			icon: FiServer,
			status: 'supported' as const,
			description:
				'Enables authentication on input-constrained devices. Useful for AI agents running on IoT devices, CLIs, or environments without browser access.',
			technicalDetails: [
				'RFC 8628 - OAuth 2.0 Device Authorization Grant',
				'Browser-less authentication flow',
				'User code and device code separation',
				'Polling-based token retrieval',
			],
			pingoneSupport: {
				type: 'success' as const,
				title: 'PingOne Support - Available',
				message:
					'PingOne supports Device Authorization Grant for input-constrained devices and CLI applications.',
			},
		},
	];

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}

			{/* Overview Section */}
			<V6CollapsibleHeader
				title="Why AI Agents Need Advanced OAuth/OIDC Features"
				subtitle="Understanding the security requirements for AI agent authentication and authorization"
				icon={<FiInfo />}
				defaultCollapsed={false}
			>
					<Card>
						<CardBody>
							<p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
								AI agents present unique challenges for identity and access management that require
								advanced OAuth/OIDC features:
							</p>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
								<li>
									<strong>Autonomous Operation:</strong> AI agents often operate without direct user
									supervision, requiring robust machine-to-machine authentication and long-lived
									tokens
								</li>
								<li>
									<strong>Fine-Grained Permissions:</strong> Agents need specific, granular
									permissions to access resources and perform actions, often requiring complex
									authorization logic
								</li>
								<li>
									<strong>Token Security:</strong> Long-running agents require sender-constrained
									tokens (DPoP, mTLS) to prevent theft and misuse in production environments
								</li>
								<li>
									<strong>Complex Authorization:</strong> Agents may need to express complex
									authorization requirements using Rich Authorization Requests (RAR) beyond simple
									scopes
								</li>
								<li>
									<strong>Delegation:</strong> Agents acting on behalf of users need secure
									delegation mechanisms and token exchange capabilities
								</li>
								<li>
									<strong>Resource Protection:</strong> AI agents accessing sensitive APIs require
									advanced security features like certificate-bound tokens and proof-of-possession
								</li>
								<li>
									<strong>Compliance:</strong> Financial and healthcare AI agents need FAPI
									compliance and advanced security policies for regulatory requirements
								</li>
							</ul>

							<h3
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '0.75rem',
									color: '#1f2937',
								}}
							>
								Critical Security Considerations for AI Agents:
							</h3>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
								<li>
									<strong>Token Theft Prevention:</strong> AI agents with long-lived tokens are
									prime targets for token theft attacks
								</li>
								<li>
									<strong>Authorization Bypass:</strong> Complex AI workflows require granular
									permissions that simple scopes cannot provide
								</li>
								<li>
									<strong>Session Management:</strong> Stateless AI agents need secure session
									management and token refresh mechanisms
								</li>
								<li>
									<strong>Audit & Compliance:</strong> AI agent actions must be auditable and comply
									with security standards
								</li>
								<li>
									<strong>Cross-Domain Access:</strong> AI agents often need to access multiple APIs
									across different domains securely
								</li>
							</ul>
						</CardBody>
					</Card>
			</V6CollapsibleHeader>

			{/* Features Grid */}
			<V6CollapsibleHeader
				title="Key OAuth/OIDC Features for AI Agents"
				subtitle="Advanced features required for secure AI agent authentication and authorization"
				icon={<FiShield />}
				defaultCollapsed={false}
			>
					<FeatureGrid>
						{features.map((feature) => (
							<FeatureCard
								key={feature.id}
								$supported={
									feature.status === 'supported'
										? true
										: feature.status === 'not-supported'
											? false
											: null
								}
							>
								<CardBody>
									<FeatureHeader>
										<FeatureTitle>
											<feature.icon size={24} />
											<h3>{feature.title}</h3>
										</FeatureTitle>
										<StatusBadge $status={feature.status}>
											{feature.status === 'supported' && <FiCheckCircle />}
											{feature.status === 'not-supported' && <FiX />}
											{feature.status === 'partial' && <FiAlertTriangle />}
											{feature.status === 'supported'
												? 'Supported'
												: feature.status === 'not-supported'
													? 'Not Supported'
													: 'Partial'}
										</StatusBadge>
									</FeatureHeader>

									<FeatureDescription>{feature.description}</FeatureDescription>

									<TechnicalDetails>
										<h4>Technical Details:</h4>
										<ul>
											{feature.technicalDetails.map((detail, idx) => (
												<li key={idx}>{detail}</li>
											))}
										</ul>
									</TechnicalDetails>

									<PingOneNote $type={feature.pingoneSupport.type}>
										<FiInfo />
										<div>
											<h4>{feature.pingoneSupport.title}</h4>
											<p>{feature.pingoneSupport.message}</p>
										</div>
									</PingOneNote>
								</CardBody>
							</FeatureCard>
						))}
					</FeatureGrid>
			</V6CollapsibleHeader>

			{/* Comparison Table */}
			<V6CollapsibleHeader
				title="Identity Provider Comparison for AI Agents"
				subtitle="Comparing PingOne, PingFederate, and PingOne Advanced Services for AI agent authentication"
				icon={<FiServer />}
				defaultCollapsed={false}
			>
					<ComparisonSection>
						<CardBody>
							{/* Collapsible header for the comparison table */}
							<div style={{ marginBottom: '1.5rem' }}>
								<CollapsibleHeader
									onClick={() => toggleSection('comparisonTable')}
									style={{
										padding: '1rem',
										background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
										borderRadius: '0.5rem',
										border: '1px solid #cbd5e1',
										marginBottom: expandedSections.comparisonTable ? '1rem' : '0',
									}}
								>
									<h3
										style={{
											fontSize: '1.25rem',
											fontWeight: '600',
											color: '#1e293b',
											margin: '0',
											display: 'flex',
											alignItems: 'center',
											gap: '0.75rem',
										}}
									>
										<FiServer />
										Ping Identity Product Comparison
									</h3>
								</CollapsibleHeader>

								{/* Description - always visible */}
								<p style={{ color: '#475569', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
									Compare OAuth 2.0 and OpenID Connect feature support across Ping Identity
									products, Okta, and Microsoft for AI agent authentication and authorization.
								</p>
							</div>

							{/* Collapsible content for the table */}
							<CollapsibleContent $isOpen={expandedSections.comparisonTable}>
								<ComparisonTable>
									<thead>
										<tr>
											<th style={{ minWidth: '200px' }}>Feature</th>
											<th>RFC/Spec</th>
											<th style={{ minWidth: '120px' }}>PingOne</th>
											<th style={{ minWidth: '120px' }}>PingFederate</th>
											<th style={{ minWidth: '120px' }}>PingOne Advanced</th>
											<th style={{ minWidth: '120px' }}>PingAM</th>
											<th style={{ minWidth: '120px' }}>Okta</th>
											<th style={{ minWidth: '120px' }}>Microsoft</th>
											<th style={{ minWidth: '150px' }}>Alternative</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<strong>PAR</strong>
												<br />
												<small style={{ color: '#64748b' }}>Pushed Authorization Requests</small>
											</td>
											<td>RFC 9126</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>-</td>
										</tr>
										<tr>
											<td>
												<strong>RAR</strong>
												<br />
												<small style={{ color: '#64748b' }}>Rich Authorization Requests</small>
											</td>
											<td>RFC 9396</td>
											<td>
												<StatusBadge
													$status="not-supported"
													onClick={() => showExplanation('rar-pingone')}
												>
													<FiX />
													Not Available
												</StatusBadge>
											</td>
											<td>
												<StatusBadge
													$status="partial"
													onClick={() => showExplanation('rar-pingfederate')}
												>
													<FiAlertTriangle />
													Limited
												</StatusBadge>
											</td>
											<td>
												<StatusBadge
													$status="partial"
													onClick={() => showExplanation('rar-pingone-advanced')}
												>
													<FiAlertTriangle />
													Partial
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="not-supported">
													<FiX />
													Not Available
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="not-supported">
													<FiX />
													Not Available
												</StatusBadge>
											</td>
											<td>Use scopes or custom claims</td>
										</tr>
										<tr>
											<td>
												<strong>DPoP</strong>
												<br />
												<small style={{ color: '#64748b' }}>
													Demonstrating Proof of Possession
												</small>
											</td>
											<td>RFC 9449</td>
											<td>
												<StatusBadge
													$status="not-supported"
													onClick={() => showExplanation('dpop-pingone')}
												>
													<FiX />
													Not Available
												</StatusBadge>
											</td>
											<td>
												<StatusBadge
													$status="partial"
													onClick={() => showExplanation('dpop-pingfederate')}
												>
													<FiAlertTriangle />
													Client Auth Only
												</StatusBadge>
											</td>
											<td>
												<StatusBadge
													$status="partial"
													onClick={() => showExplanation('dpop-pingone-advanced')}
												>
													<FiAlertTriangle />
													Client Auth Only
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="not-supported">
													<FiX />
													Not Available
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="not-supported">
													<FiX />
													Not Available
												</StatusBadge>
											</td>
											<td>Use mTLS or one-time refresh tokens</td>
										</tr>
										<tr>
											<td>
												<strong>mTLS</strong>
												<br />
												<small style={{ color: '#64748b' }}>Mutual TLS Authentication</small>
											</td>
											<td>RFC 8705</td>
											<td>
												<StatusBadge
													$status="partial"
													onClick={() => showExplanation('mtls-pingone')}
												>
													<FiAlertTriangle />
													Client Auth Only
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>Certificate-bound tokens not available</td>
										</tr>
										<tr>
											<td>
												<strong>JAR</strong>
												<br />
												<small style={{ color: '#64748b' }}>
													JWT-Secured Authorization Request
												</small>
											</td>
											<td>RFC 9101</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>-</td>
										</tr>
										<tr>
											<td>
												<strong>Client Credentials</strong>
												<br />
												<small style={{ color: '#64748b' }}>Machine-to-Machine Grant</small>
											</td>
											<td>RFC 6749</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>-</td>
										</tr>
										<tr>
											<td>
												<strong>Token Exchange</strong>
												<br />
												<small style={{ color: '#64748b' }}>RFC 8693 Token Exchange</small>
											</td>
											<td>RFC 8693</td>
											<td>
												<StatusBadge
													$status="not-supported"
													onClick={() => showExplanation('token-exchange-pingone')}
												>
													<FiX />
													Not Available
												</StatusBadge>
											</td>
											<td>
												<StatusBadge
													$status="partial"
													onClick={() => showExplanation('token-exchange-pingfederate')}
												>
													<FiAlertTriangle />
													Limited
												</StatusBadge>
											</td>
											<td>
												<StatusBadge
													$status="partial"
													onClick={() => showExplanation('token-exchange-pingone-advanced')}
												>
													<FiAlertTriangle />
													Limited
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="not-supported">
													<FiX />
													Not Available
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="not-supported">
													<FiX />
													Not Available
												</StatusBadge>
											</td>
											<td>Use refresh tokens or re-auth</td>
										</tr>
										<tr>
											<td>
												<strong>Device Code</strong>
												<br />
												<small style={{ color: '#64748b' }}>Device Authorization Grant</small>
											</td>
											<td>RFC 8628</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>-</td>
										</tr>
										<tr>
											<td>
												<strong>OpenID Connect</strong>
												<br />
												<small style={{ color: '#64748b' }}>Full OIDC Support</small>
											</td>
											<td>OpenID Core</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>-</td>
										</tr>
										<tr>
											<td>
												<strong>FAPI Compliance</strong>
												<br />
												<small style={{ color: '#64748b' }}>Financial-grade API</small>
											</td>
											<td>FAPI 1.0/2.0</td>
											<td>
												<StatusBadge
													$status="partial"
													onClick={() => showExplanation('fapi-pingone')}
												>
													<FiAlertTriangle />
													Read-Only
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>Advanced security policies</td>
										</tr>
										<tr>
											<td>
												<strong>Custom Token Types</strong>
												<br />
												<small style={{ color: '#64748b' }}>Extensible Token Support</small>
											</td>
											<td>Various</td>
											<td>
												<StatusBadge
													$status="partial"
													onClick={() => showExplanation('custom-tokens-pingone')}
												>
													<FiAlertTriangle />
													Limited
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Extensible
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Extensible
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Full Support
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>
												<StatusBadge $status="supported">
													<FiCheckCircle />
													Supported
												</StatusBadge>
											</td>
											<td>Standard JWT/JWS/JWE tokens</td>
										</tr>
									</tbody>
								</ComparisonTable>
							</CollapsibleContent>
						</CardBody>
					</ComparisonSection>
			</V6CollapsibleHeader>

			{/* Recommendations */}
			<V6CollapsibleHeader
				title="Product Selection & Best Practices for AI Agents"
				subtitle="Recommendations for choosing the right identity provider for your AI agent deployment"
				icon={<FiCheckCircle />}
				defaultCollapsed={false}
			>
					<Card>
						<CardBody>
							<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
								Product Selection Recommendations for AI Agent Deployments:
							</h3>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', marginBottom: '2rem' }}>
								<li>
									<strong>PingOne:</strong> Best for cloud-native AI agents with standard OAuth/OIDC
									needs. Excellent for most AI agent scenarios with good security features.
								</li>
								<li>
									<strong>PingFederate:</strong> Enterprise-grade choice for complex federation
									requirements. Ideal when you need advanced security policies and extensive
									customization.
								</li>
								<li>
									<strong>PingOne Advanced Services:</strong> When you need the full PingOne feature
									set with advanced security capabilities for high-risk AI agent deployments.
								</li>
								<li>
									<strong>PingAM (ForgeRock):</strong> Choose when you need the most comprehensive
									OAuth/OIDC support, especially for RAR, DPoP, and advanced token management
									features.
								</li>
							</ul>

							<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
								Future Considerations:
							</h3>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
								<li>Monitor PingOne roadmap for RAR, DPoP, and Token Exchange support</li>
								<li>Plan migration strategy when sender-constrained tokens become available</li>
								<li>Evaluate custom solutions for fine-grained authorization if RAR is critical</li>
								<li>
									Consider hybrid approaches combining PingOne with policy engines (e.g., OPA) for
									complex authorization
								</li>
							</ul>
						</CardBody>
					</Card>
			</V6CollapsibleHeader>

			{/* MCP Servers Section */}
			<V6CollapsibleHeader
				title="MCP Servers: The Future of AI Agent Integration"
				subtitle="Understanding Model Context Protocol and its integration with OAuth 2.0 for AI agents"
				icon={<FiServer />}
				defaultCollapsed={false}
			>
					<Card>
						<CardBody>
							<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
								Model Context Protocol (MCP) and OAuth Integration
							</h3>

							<p style={{ lineHeight: '1.6', marginBottom: '1.5rem' }}>
								The Model Context Protocol (MCP) represents a paradigm shift in how AI agents
								interact with external systems. MCP servers act as standardized interfaces that
								allow AI models to securely access tools, data sources, and APIs through a unified
								protocol.
							</p>

							<h3
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '0.75rem',
									color: '#1f2937',
								}}
							>
								MCP Server Architecture:
							</h3>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
								<li>
									<strong>Standardized Interface:</strong> MCP provides a common protocol for AI
									agents to discover and invoke capabilities across different systems
								</li>
								<li>
									<strong>Capability Discovery:</strong> Servers expose their available tools and
									resources through standardized metadata
								</li>
								<li>
									<strong>Secure Communication:</strong> All interactions happen through
									authenticated and authorized channels
								</li>
								<li>
									<strong>Resource Management:</strong> MCP handles connection pooling, session
									management, and resource cleanup
								</li>
								<li>
									<strong>Error Handling:</strong> Standardized error responses and retry mechanisms
								</li>
							</ul>

							<h3
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '0.75rem',
									color: '#1f2937',
								}}
							>
								OAuth/OIDC Integration with MCP Servers:
							</h3>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
								<li>
									<strong>Server Authentication:</strong> MCP servers authenticate using OAuth 2.0
									client credentials or other methods
								</li>
								<li>
									<strong>Resource Authorization:</strong> Fine-grained permissions for MCP server
									capabilities using RAR
								</li>
								<li>
									<strong>Token Management:</strong> Automatic token refresh and sender-constrained
									tokens for MCP sessions
								</li>
								<li>
									<strong>Dynamic Registration:</strong> MCP servers can register their capabilities
									dynamically with authorization servers
								</li>
								<li>
									<strong>Audit Logging:</strong> All MCP server interactions are logged for
									compliance and debugging
								</li>
							</ul>

							<h3
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '0.75rem',
									color: '#1f2937',
								}}
							>
								Security Benefits for AI Agents:
							</h3>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
								<li>
									<strong>Isolated Execution:</strong> MCP servers run in isolated environments,
									preventing AI agents from directly accessing sensitive systems
								</li>
								<li>
									<strong>Controlled Access:</strong> All tool invocations go through authenticated
									and authorized channels
								</li>
								<li>
									<strong>Standardized Security:</strong> Consistent security patterns across all AI
									agent integrations
								</li>
								<li>
									<strong>Compliance Ready:</strong> Built-in audit trails and compliance reporting
									capabilities
								</li>
								<li>
									<strong>Scalable Architecture:</strong> MCP servers can be deployed and managed
									independently of AI models
								</li>
							</ul>
						</CardBody>
					</Card>
			</V6CollapsibleHeader>

			{/* Popup for feature explanations */}
			{popupData && (
				<PopupOverlay onClick={closePopup}>
					<PopupContent onClick={(e) => e.stopPropagation()}>
						<CloseButton onClick={closePopup}>&times;</CloseButton>
						<h3>{popupData.title}</h3>
						<div dangerouslySetInnerHTML={{ __html: popupData.content }} />
					</PopupContent>
				</PopupOverlay>
			)}
			</ContentWrapper>
		</PageContainer>
	);
};

export default AIAgentOverview;
