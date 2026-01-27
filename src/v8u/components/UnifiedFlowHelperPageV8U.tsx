/**
 * @file UnifiedFlowHelperPageV8U.tsx
 * @module v8u/components
 * @description Helper page showing differences between spec versions and flow types
 * @version 8.0.0
 * @since 2024-11-17
 *
 * This component provides comprehensive educational content comparing:
 * - OAuth 2.0 vs OAuth 2.1 / OIDC 2.1 vs OIDC Core 1.0
 * - Authorization Code vs Hybrid vs Implicit vs Client Credentials vs Device Code flows
 * - PingOne-specific implementations and requirements
 */

import React from 'react';
import { FiArrowLeft, FiBook, FiCheckCircle, FiInfo, FiShield, FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
	PageHeaderGradients,
	PageHeaderTextColors,
	PageHeaderV8,
} from '@/v8/components/shared/PageHeaderV8';
import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';

const MODULE_TAG = '[📚 UNIFIED-FLOW-HELPER-V8U]';

const PageContainer = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 2rem;
	background: #f8fafc;
	min-height: 100vh;
`;

const BackButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 20px;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	margin-bottom: 16px;

	&:hover {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
`;

const Section = styled.section`
	margin-bottom: 32px;
	padding: 24px;
	background: white;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
	font-size: 24px;
	font-weight: 600;
	margin: 0 0 16px 0;
	color: #1e293b;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const ComparisonTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin: 16px 0;
	font-size: 14px;
`;

const TableHeader = styled.thead`
	background: #f1f5f9;
`;

const TableHeaderCell = styled.th`
	padding: 12px 16px;
	text-align: left;
	font-weight: 600;
	color: #334155;
	border-bottom: 2px solid #cbd5e1;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
	border-bottom: 1px solid #e2e8f0;

	&:hover {
		background: #f8fafc;
	}
`;

const TableCell = styled.td`
	padding: 12px 16px;
	color: #475569;
	vertical-align: top;
`;

const StatusCell = styled(TableCell)`
	text-align: center;
`;

const StatusIcon = styled.span`
	font-size: 18px;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	border-radius: 8px;
	padding: 16px;
	margin: 16px 0;
	display: flex;
	gap: 12px;
	align-items: flex-start;
	border: 1px solid
		${({ $variant }) => {
			if ($variant === 'warning') return '#f59e0b';
			if ($variant === 'success') return '#22c55e';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			return '#dbeafe';
		}};
`;

const InfoText = styled.p`
	font-size: 14px;
	color: #334155;
	line-height: 1.6;
	margin: 0;
`;

const List = styled.ul`
	font-size: 14px;
	color: #475569;
	line-height: 1.7;
	margin: 8px 0;
	padding-left: 24px;
`;

const ListItem = styled.li`
	margin: 4px 0;
`;

const Highlight = styled.strong`
	color: #1e40af;
	font-weight: 600;
`;

export const UnifiedFlowHelperPageV8U: React.FC = () => {
	const navigate = useNavigate();

	const handleBackToUnified = () => {
		navigate('/v8u/unified');
	};

	return (
		<PageContainer>
			<BackButton onClick={handleBackToUnified}>
				<FiArrowLeft size={16} />
				Back to Unified Start
			</BackButton>

			<PageHeaderV8
				title="OAuth/OIDC Flow & Specification Comparison Guide"
				subtitle="Comprehensive reference comparing specification versions and flow types, including PingOne-specific requirements and implementations."
				gradient={PageHeaderGradients.unifiedOAuth}
				textColor={PageHeaderTextColors.darkBlue}
				icon={<FiBook size={32} />}
			/>

			{/* Specification Versions Comparison */}
			<Section>
				<SectionTitle>
					<FiInfo size={24} />
					Specification Versions Comparison
				</SectionTitle>

				<ComparisonTable>
					<TableHeader>
						<tr>
							<TableHeaderCell>Feature</TableHeaderCell>
							<TableHeaderCell>OAuth 2.0 (RFC 6749)</TableHeaderCell>
							<TableHeaderCell>OAuth 2.1 / OIDC 2.1 (Draft)</TableHeaderCell>
							<TableHeaderCell>OIDC Core 1.0</TableHeaderCell>
						</tr>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell>
								<strong>Specification Status</strong>
							</TableCell>
							<TableCell>RFC 6749 (Published 2012)</TableCell>
							<TableCell>IETF Draft (In Progress)</TableCell>
							<TableCell>OpenID Foundation Standard (Published 2014)</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>Implicit Flow</strong>
							</TableCell>
							<StatusCell>
								<StatusIcon title="Supported">✅</StatusIcon>
							</StatusCell>
							<StatusCell>
								<StatusIcon title="Deprecated">❌</StatusIcon>
								<div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Removed</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon title="Supported but deprecated">⚠️</StatusIcon>
								<div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
									Discouraged
								</div>
							</StatusCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>PKCE Requirement</strong>
							</TableCell>
							<TableCell>Optional (RFC 7636)</TableCell>
							<TableCell>
								<Highlight>Required for public clients</Highlight>
							</TableCell>
							<TableCell>Recommended for SPAs</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>HTTPS Requirement</strong>
							</TableCell>
							<TableCell>Recommended</TableCell>
							<TableCell>
								<Highlight>Mandatory</Highlight>
							</TableCell>
							<TableCell>Required in production</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>Token in URL Fragment</strong>
							</TableCell>
							<TableCell>Allowed (Implicit flow)</TableCell>
							<TableCell>
								<Highlight>Forbidden</Highlight>
							</TableCell>
							<TableCell>Deprecated</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>ID Token</strong>
							</TableCell>
							<TableCell>Not defined</TableCell>
							<TableCell>Defined (JWT format)</TableCell>
							<TableCell>
								<Highlight>Core feature</Highlight>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>UserInfo Endpoint</strong>
							</TableCell>
							<TableCell>Not defined</TableCell>
							<TableCell>Defined</TableCell>
							<TableCell>
								<Highlight>Standard endpoint</Highlight>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>Discovery Document</strong>
							</TableCell>
							<TableCell>Not defined</TableCell>
							<TableCell>Defined (.well-known)</TableCell>
							<TableCell>
								<Highlight>Required</Highlight>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>Refresh Tokens</strong>
							</TableCell>
							<TableCell>Supported</TableCell>
							<TableCell>Supported</TableCell>
							<TableCell>Supported (offline_access scope)</TableCell>
						</TableRow>
					</TableBody>
				</ComparisonTable>

				<InfoBox $variant="info">
					<FiInfo size={20} />
					<InfoText>
						<strong>PingOne Support:</strong> PingOne supports all three specification versions.
						When using OIDC Core 1.0, the <code>openid</code> scope is required for ID tokens. For
						OAuth 2.1 / OIDC 2.1, PKCE is mandatory for public clients (SPAs, mobile apps).
					</InfoText>
				</InfoBox>
			</Section>

			{/* Flow Types Comparison */}
			<Section>
				<SectionTitle>
					<FiShield size={24} />
					Flow Types Comparison
				</SectionTitle>

				<ComparisonTable>
					<TableHeader>
						<tr>
							<TableHeaderCell>Feature</TableHeaderCell>
							<TableHeaderCell>Authorization Code</TableHeaderCell>
							<TableHeaderCell>Hybrid</TableHeaderCell>
							<TableHeaderCell>Implicit</TableHeaderCell>
							<TableHeaderCell>Client Credentials</TableHeaderCell>
							<TableHeaderCell>Device Code</TableHeaderCell>
						</tr>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell>
								<strong>Use Case</strong>
							</TableCell>
							<TableCell>Web apps, SPAs (with PKCE), mobile apps</TableCell>
							<TableCell>OIDC flows requiring immediate ID token</TableCell>
							<TableCell>Legacy SPAs (deprecated)</TableCell>
							<TableCell>Server-to-server, API access</TableCell>
							<TableCell>Devices without browsers</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>Tokens Returned</strong>
							</TableCell>
							<TableCell>Authorization code (exchanged for tokens)</TableCell>
							<TableCell>Authorization code + ID token (fragment) or just code (query)</TableCell>
							<TableCell>Access token + ID token (URL fragment)</TableCell>
							<TableCell>Access token only</TableCell>
							<TableCell>Access token + ID token (polling)</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>PKCE Support</strong>
							</TableCell>
							<StatusCell>
								<StatusIcon>✅</StatusIcon>
								<div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
									Recommended
								</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>✅</StatusIcon>
								<div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
									Recommended
								</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>❌</StatusIcon>
								<div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
									Not supported
								</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>❌</StatusIcon>
								<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>N/A</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>❌</StatusIcon>
								<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>N/A</div>
							</StatusCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>Refresh Token</strong>
							</TableCell>
							<StatusCell>
								<StatusIcon>✅</StatusIcon>
								<div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
									With offline_access
								</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>✅</StatusIcon>
								<div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
									With offline_access
								</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>❌</StatusIcon>
								<div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
									Not supported
								</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>❌</StatusIcon>
								<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>N/A</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>✅</StatusIcon>
								<div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
									With offline_access
								</div>
							</StatusCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>ID Token</strong>
							</TableCell>
							<StatusCell>
								<StatusIcon>✅</StatusIcon>
								<div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
									OIDC only
								</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>✅</StatusIcon>
								<div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
									OIDC only
								</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>✅</StatusIcon>
								<div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
									OIDC only
								</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>❌</StatusIcon>
								<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>N/A</div>
							</StatusCell>
							<StatusCell>
								<StatusIcon>✅</StatusIcon>
								<div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
									OIDC only
								</div>
							</StatusCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>Security Level</strong>
							</TableCell>
							<TableCell>⭐⭐⭐⭐⭐ Highest (with PKCE)</TableCell>
							<TableCell>⭐⭐⭐⭐ High (with PKCE)</TableCell>
							<TableCell>⭐⭐ Low (deprecated)</TableCell>
							<TableCell>⭐⭐⭐⭐ High (server-to-server)</TableCell>
							<TableCell>⭐⭐⭐⭐ High (device isolation)</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>
								<strong>OAuth 2.1 Status</strong>
							</TableCell>
							<TableCell>
								<Highlight>✅ Recommended</Highlight>
							</TableCell>
							<TableCell>
								<Highlight>✅ Supported</Highlight>
							</TableCell>
							<TableCell>
								<Highlight>❌ Removed</Highlight>
							</TableCell>
							<TableCell>✅ Supported</TableCell>
							<TableCell>✅ Supported</TableCell>
						</TableRow>
					</TableBody>
				</ComparisonTable>

				<InfoBox $variant="warning">
					<FiInfo size={20} />
					<InfoText>
						<strong>Key Differences: Authorization Code vs Hybrid:</strong> Both flows are nearly
						identical and use the same security mechanisms (PKCE recommended). The primary
						difference is that Hybrid flow can return an ID token immediately in the URL fragment
						when using <code>response_type</code> like <code>code id_token</code>, while
						Authorization Code flow always requires a token exchange step. Hybrid flow is useful
						when you need the ID token immediately for user identification, while still getting an
						authorization code for subsequent token exchange.
					</InfoText>
				</InfoBox>

				<InfoBox $variant="success">
					<FiCheckCircle size={20} />
					<InfoText>
						<strong>PingOne Implementation:</strong> PingOne supports all flow types except ROPC
						(Resource Owner Password Credentials). For OIDC flows, the <code>openid</code> scope is
						required. All flows support refresh tokens when using the <code>offline_access</code>{' '}
						scope (except Implicit, which is deprecated).
					</InfoText>
				</InfoBox>
			</Section>

			{/* PingOne-Specific Requirements */}
			<Section>
				<SectionTitle>
					<FiShield size={24} />
					PingOne-Specific Requirements & Best Practices
				</SectionTitle>

				<InfoBox $variant="info">
					<FiInfo size={20} />
					<div>
						<InfoText>
							<strong>OpenID Scope Requirement:</strong> PingOne requires the <code>openid</code>{' '}
							scope even for pure OAuth 2.0 flows when using OIDC-enabled applications. This ensures
							compatibility with OIDC discovery and token introspection endpoints.
						</InfoText>
					</div>
				</InfoBox>

				<InfoBox $variant="success">
					<FiCheckCircle size={20} />
					<div>
						<InfoText>
							<strong>PKCE with PingOne:</strong> While PKCE is optional in OAuth 2.0, PingOne
							recommends using PKCE for all public clients (SPAs, mobile apps). For OAuth 2.1 / OIDC
							2.1 flows, PKCE is mandatory for public clients.
						</InfoText>
					</div>
				</InfoBox>

				<InfoBox $variant="warning">
					<FiInfo size={20} />
					<div>
						<InfoText>
							<strong>Token Endpoint Authentication:</strong> PingOne supports multiple
							authentication methods:
						</InfoText>
						<List>
							<ListItem>
								<code>client_secret_basic</code> - Client credentials in Authorization header
							</ListItem>
							<ListItem>
								<code>client_secret_post</code> - Client credentials in request body (recommended
								for web apps)
							</ListItem>
							<ListItem>
								<code>client_secret_jwt</code> - Signed JWT with client secret
							</ListItem>
							<ListItem>
								<code>private_key_jwt</code> - Signed JWT with private key (most secure)
							</ListItem>
							<ListItem>
								<code>none</code> - No authentication (public clients with PKCE)
							</ListItem>
						</List>
					</div>
				</InfoBox>

				<InfoBox $variant="info">
					<FiInfo size={20} />
					<div>
						<InfoText>
							<strong>Redirect URI Validation:</strong> PingOne requires exact match of redirect
							URIs. The redirect URI in the authorization request must exactly match one of the
							registered redirect URIs in the application configuration, including protocol
							(http/https), domain, port, and path.
						</InfoText>
					</div>
				</InfoBox>
			</Section>
		</PageContainer>
	);
};

export default UnifiedFlowHelperPageV8U;
