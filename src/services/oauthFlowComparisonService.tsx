// src/services/oauthFlowComparisonService.tsx
// Service for displaying OAuth flow comparisons with collapsible headers

import React from 'react';
import { CollapsibleHeader } from './collapsibleHeaderService';

// MDI Icon Helper Functions
interface MDIIconProps {
	icon: string;
	size?: number;
	color?: string;
	ariaLabel: string;
}

const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiAlertTriangle: 'mdi-alert',
		FiCheckCircle: 'mdi-check-circle',
		FiGlobe: 'mdi-earth',
		FiShield: 'mdi-shield',
		FiUsers: 'mdi-account-group',
		FiXCircle: 'mdi-close-circle',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

const MDIIcon: React.FC<MDIIconProps> = ({ icon, size = 24, color, ariaLabel }) => {
	const iconClass = getMDIIconClass(icon);
	return (
		<span
			className={`mdi ${iconClass}`}
			style={{ fontSize: size, color: color }}
			role="img"
			aria-label={ariaLabel}
			aria-hidden={!ariaLabel}
		></span>
	);
};

// CSS Helper Functions
const getTableStyles = () => ({
	width: '100%',
	borderCollapse: 'collapse' as const,
	background: 'white',
	borderRadius: '0.5rem',
	overflow: 'hidden',
});

const getTheadStyles = () => ({
	background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
	color: 'white',
});

const getThStyles = () => ({
	padding: '1rem',
	textAlign: 'left' as const,
	fontWeight: '600',
	fontSize: '0.875rem',
});

const getTbodyStyles = () =>
	({
		'& tr:nth-child(even)': {
			background: '#f8fafc',
		},
	}) as React.CSSProperties;

const getTdStyles = () => ({
	padding: '1rem',
	fontSize: '0.875rem',
	color: '#374151',
	borderBottom: '1px solid #e5e7eb',
	verticalAlign: 'top' as const,
});

const getFeatureLabelStyles = () => ({
	fontWeight: '600',
	color: '#1f2937',
	marginBottom: '0.25rem',
});

const getBadgeStyles = (variant: 'success' | 'error' | 'warning' | 'info') => {
	const variantStyles = {
		success: { background: '#d1fae5', color: '#065f46' },
		error: { background: '#fee2e2', color: '#991b1b' },
		warning: { background: '#fef3c7', color: '#78350f' },
		info: { background: '#dbeafe', color: '#1e40af' },
	};

	return {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.375rem',
		padding: '0.25rem 0.75rem',
		borderRadius: '0.375rem',
		fontSize: '0.75rem',
		fontWeight: '600',
		...variantStyles[variant],
	};
};

const getCodeBlockStyles = () => ({
	background: '#1e293b',
	color: '#e2e8f0',
	padding: '0.25rem 0.5rem',
	borderRadius: '0.25rem',
	fontFamily: "'Monaco', 'Menlo', monospace",
	fontSize: '0.75rem',
	whiteSpace: 'nowrap' as const,
});

const getIconWrapperStyles = () => ({
	display: 'inline-flex',
	alignItems: 'center',
	gap: '0.5rem',
});

const getUseCaseListStyles = () => ({
	margin: '0.5rem 0',
	paddingLeft: '1.5rem',
	'& li': {
		margin: '0.5rem 0',
	},
});

const getInfoBoxStyles = (variant?: 'info' | 'warning') => {
	const variantStyles = {
		info: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' },
		warning: { background: '#fef3c7', border: '1px solid #fbbf24', color: '#78350f' },
	};

	return {
		display: 'flex',
		gap: '1rem',
		padding: '1.5rem',
		borderRadius: '0.75rem',
		margin: '1rem 0',
		fontSize: '0.875rem',
		lineHeight: '1.6',
		...variantStyles[variant || 'info'],
	};
};

const getInfoTitleStyles = () => ({
	fontSize: '1rem',
	fontWeight: '700',
	margin: '0 0 0.5rem 0',
	color: 'inherit',
});

const getInfoTextStyles = () => ({
	margin: '0.5rem 0',
	'&:first-child': {
		marginTop: '0',
	},
	'&:last-child': {
		marginBottom: '0',
	},
});

interface OAuthFlowComparisonServiceProps {
	highlightFlow?: 'jwt' | 'saml';
	collapsed?: boolean;
}

export const OAuthFlowComparisonService = {
	getComparisonTable({ highlightFlow, collapsed = true }: OAuthFlowComparisonServiceProps) {
		return (
			<CollapsibleHeader
				title="OAuth Flow Comparison: Authorization vs JWT Bearer vs SAML Bearer"
				icon={<MDIIcon icon="FiGlobe" size={24} ariaLabel="Globe" />}
				defaultCollapsed={collapsed}
				showArrow={true}
			>
				<div style={getInfoBoxStyles('info')}>
					<MDIIcon icon="FiShield" size={24} ariaLabel="Shield" />
					<div>
						<h4 style={getInfoTitleStyles()}>Understanding Different OAuth Flows</h4>
						<p style={getInfoTextStyles()}>
							OAuth 2.0 provides multiple flows for different scenarios. This table helps you
							understand when to use each flow and how they differ in terms of authentication,
							security, and use cases.
						</p>
					</div>
				</div>

				<table style={getTableStyles()}>
					<thead style={getTheadStyles()}>
						<tr>
							<th style={getThStyles()}>Feature</th>
							<th style={getThStyles()}>Authorization Code</th>
							<th
								style={{
									...getThStyles(),
									background: highlightFlow === 'jwt' ? '#8b5cf6' : undefined,
								}}
							>
								JWT Bearer (RFC 7523)
							</th>
							<th
								style={{
									...getThStyles(),
									background: highlightFlow === 'saml' ? '#06b6d4' : undefined,
								}}
							>
								SAML Bearer (RFC 7522)
							</th>
						</tr>
					</thead>
					<tbody style={getTbodyStyles()}>
						<tr>
							<td style={getTdStyles()}>
								<div style={getFeatureLabelStyles()}>User Interaction</div>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('success')}>
									<MDIIcon icon="FiCheckCircle" size={16} ariaLabel="Check" /> Required
								</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('error')}>
									<MDIIcon icon="FiXCircle" size={16} ariaLabel="X" /> None
								</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('error')}>
									<MDIIcon icon="FiXCircle" size={16} ariaLabel="X" /> None
								</span>
							</td>
						</tr>

						<tr>
							<td style={getTdStyles()}>
								<div style={getFeatureLabelStyles()}>Browser Required</div>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('success')}>
									<MDIIcon icon="FiCheckCircle" size={16} ariaLabel="Check" /> Yes
								</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('error')}>
									<MDIIcon icon="FiXCircle" size={16} ariaLabel="X" /> No
								</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('error')}>
									<MDIIcon icon="FiXCircle" size={16} ariaLabel="X" /> No
								</span>
							</td>
						</tr>

						<tr>
							<td style={getTdStyles()}>
								<div style={getFeatureLabelStyles()}>Authentication Method</div>
							</td>
							<td style={getTdStyles()}>User credentials + browser</td>
							<td style={getTdStyles()}>Client assertion (JWT)</td>
							<td style={getTdStyles()}>IdP assertion (SAML)</td>
						</tr>

						<tr>
							<td style={getTdStyles()}>
								<div style={getFeatureLabelStyles()}>Grant Type</div>
							</td>
							<td style={getTdStyles()}>
								<code style={getCodeBlockStyles()}>authorization_code</code>
							</td>
							<td style={getTdStyles()}>
								<code style={getCodeBlockStyles()}>jwt-bearer</code>
							</td>
							<td style={getTdStyles()}>
								<code style={getCodeBlockStyles()}>saml2-bearer</code>
							</td>
						</tr>

						<tr>
							<td style={getTdStyles()}>
								<div style={getFeatureLabelStyles()}>Cryptography</div>
							</td>
							<td style={getTdStyles()}>Optional (PKCE recommended)</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('warning')}>
									<MDIIcon icon="FiAlertTriangle" size={16} ariaLabel="Warning" /> Required (JWT
									signing)
								</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('warning')}>
									<MDIIcon icon="FiAlertTriangle" size={16} ariaLabel="Warning" /> Required (SAML
									signing)
								</span>
							</td>
						</tr>

						<tr>
							<td style={getTdStyles()}>
								<div style={getFeatureLabelStyles()}>Key Management</div>
							</td>
							<td style={getTdStyles()}>Client secret</td>
							<td style={getTdStyles()}>Private/Public key pair</td>
							<td style={getTdStyles()}>IdP trust relationship</td>
						</tr>

						<tr>
							<td style={getTdStyles()}>
								<div style={getFeatureLabelStyles()}>Typical Use Case</div>
							</td>
							<td style={getTdStyles()}>
								<span style={getIconWrapperStyles()}>
									<MDIIcon icon="FiUsers" size={16} ariaLabel="Users" /> User authentication
								</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getIconWrapperStyles()}>
									<MDIIcon icon="FiShield" size={16} ariaLabel="Shield" /> Server-to-server
								</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getIconWrapperStyles()}>
									<MDIIcon icon="FiGlobe" size={16} ariaLabel="Globe" /> Enterprise SSO
								</span>
							</td>
						</tr>

						<tr>
							<td style={getTdStyles()}>
								<div style={getFeatureLabelStyles()}>Complexity</div>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('info')}>Medium</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('warning')}>High</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('error')}>Very High</span>
							</td>
						</tr>

						<tr>
							<td style={getTdStyles()}>
								<div style={getFeatureLabelStyles()}>PingOne Support</div>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('success')}>
									<MDIIcon icon="FiCheckCircle" size={16} ariaLabel="Check" /> Supported
								</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('error')}>
									<MDIIcon icon="FiXCircle" size={16} ariaLabel="X" /> Not Supported
								</span>
							</td>
							<td style={getTdStyles()}>
								<span style={getBadgeStyles('error')}>
									<MDIIcon icon="FiXCircle" size={16} ariaLabel="X" /> Not Supported
								</span>
							</td>
						</tr>
					</tbody>
				</table>

				<div style={{ marginTop: '2rem' }}>
					<h4 style={{ ...getInfoTitleStyles(), color: '#1f2937', marginBottom: '1rem' }}>
						<MDIIcon icon="FiUsers" size={20} ariaLabel="Users" /> When to Use Each Flow
					</h4>

					<table style={getTableStyles()}>
						<thead style={getTheadStyles()}>
							<tr>
								<th style={getThStyles()}>Flow Type</th>
								<th style={getThStyles()}>Best For</th>
								<th style={getThStyles()}>Examples</th>
							</tr>
						</thead>
						<tbody style={getTbodyStyles()}>
							<tr>
								<td style={getTdStyles()}>
									<div style={getFeatureLabelStyles()}>Authorization Code</div>
								</td>
								<td style={getTdStyles()}>
									<ul style={getUseCaseListStyles()}>
										<li>Web applications with user login</li>
										<li>Mobile apps with user accounts</li>
										<li>Any scenario requiring user consent</li>
										<li>Delegated authorization</li>
									</ul>
								</td>
								<td style={getTdStyles()}>Social login, SaaS applications, consumer apps</td>
							</tr>

							<tr>
								<td style={getTdStyles()}>
									<div style={getFeatureLabelStyles()}>JWT Bearer</div>
								</td>
								<td style={getTdStyles()}>
									<ul style={getUseCaseListStyles()}>
										<li>Microservices communication</li>
										<li>Batch processing systems</li>
										<li>Automated workflows</li>
										<li>Service accounts</li>
									</ul>
								</td>
								<td style={getTdStyles()}>Google Service Accounts, Auth0 M2M, API gateways</td>
							</tr>

							<tr>
								<td style={getTdStyles()}>
									<div style={getFeatureLabelStyles()}>SAML Bearer</div>
								</td>
								<td style={getTdStyles()}>
									<ul style={getUseCaseListStyles()}>
										<li>Enterprise SSO integration</li>
										<li>SAML federation scenarios</li>
										<li>Legacy system integration</li>
										<li>Cross-domain authentication</li>
									</ul>
								</td>
								<td style={getTdStyles()}>
									Enterprise SaaS, government systems, corporate portals
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				{highlightFlow && (
					<div style={{ ...getInfoBoxStyles('warning'), marginTop: '1.5rem' }}>
						<MDIIcon icon="FiAlertTriangle" size={24} ariaLabel="Warning" />
						<div>
							<h4 style={getInfoTitleStyles()}>
								{highlightFlow === 'jwt' ? 'JWT Bearer Token Flow' : 'SAML Bearer Assertion Flow'} -
								Educational Mock
							</h4>
							<p style={getInfoTextStyles()}>
								This flow is a <strong>mock/educational implementation</strong> because PingOne does
								not support {highlightFlow === 'jwt' ? 'JWT Bearer' : 'SAML Bearer'} assertions.
								However, this flow is widely used in enterprise OAuth servers and is valuable to
								understand for real-world OAuth implementations.
							</p>
							<p style={getInfoTextStyles()}>
								<strong>Where it's used:</strong> Enterprise OAuth servers like Okta, Auth0, Azure
								AD, and Google Cloud support this flow for{' '}
								{highlightFlow === 'jwt' ? 'service account' : 'enterprise SSO'} scenarios.
							</p>
						</div>
					</div>
				)}
			</CollapsibleHeader>
		);
	},
} as const;

// Re-export for compatibility
export default OAuthFlowComparisonService;
