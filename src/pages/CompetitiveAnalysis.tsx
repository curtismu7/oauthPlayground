import {
	FiAward,
	FiCheckCircle,
	FiDollarSign,
	FiExternalLink,
	FiGlobe,
	FiShield,
	FiTrendingUp,
	FiUsers,
	FiZap,
} from '@icons';
import React, { useState } from 'react';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowUIService } from '../services/flowUIService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';

const Button = FlowUIService.getButton();

const styles = {
	pageContainer: {
		maxWidth: '1400px',
		margin: '0 auto',
		padding: '2rem',
	} as React.CSSProperties,
	heroSection: {
		background: 'linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE_DARK 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%)',
		color: 'white',
		padding: '4rem 3rem',
		borderRadius: '1rem',
		marginBottom: '3rem',
		textAlign: 'center' as const,
		boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
	} as React.CSSProperties,
	heroTitle: {
		fontSize: '3.5rem',
		fontWeight: 800,
		margin: '0 0 1.5rem 0',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '1rem',
	} as React.CSSProperties,
	heroSubtitle: {
		fontSize: '1.5rem',
		marginTop: '0',
		marginBottom: '2rem',
		marginLeft: 'auto',
		marginRight: 'auto',
		opacity: 0.9,
		maxWidth: '800px',
		lineHeight: 1.6,
	} as React.CSSProperties,
	heroDescription: {
		fontSize: '1.125rem',
		margin: '0',
		opacity: 0.8,
		maxWidth: '600px',
		marginLeft: 'auto',
		marginRight: 'auto',
		lineHeight: 1.6,
	} as React.CSSProperties,
	comparisonGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
		gap: '2rem',
		marginBottom: '3rem',
	} as React.CSSProperties,

	providerCard: ($featured?: boolean): React.CSSProperties => ({
		background: 'white',
		borderRadius: '1rem',
		padding: '2rem',
		boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
		border: `2px solid ${$featured ? 'V9_COLORS.PRIMARY.BLUE' : 'V9_COLORS.TEXT.GRAY_LIGHTER'}`,
		position: 'relative',
	}),

	providerHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '1rem',
		marginBottom: '1.5rem',
	} as React.CSSProperties,
	providerIcon: ($color: string): React.CSSProperties => ({
		width: '60px',
		height: '60px',
		borderRadius: '1rem',
		background: $color,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '1.5rem',
		color: 'white',
	}),
	providerInfo: {
		flex: 1,
	} as React.CSSProperties,
	providerName: {
		fontSize: '1.5rem',
		fontWeight: 700,
		margin: '0 0 0.5rem 0',
		color: 'V9_COLORS.TEXT.GRAY_DARK',
	} as React.CSSProperties,
	providerTagline: {
		fontSize: '1rem',
		color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
		margin: '0',
	} as React.CSSProperties,
	ratingContainer: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	rating: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.25rem',
	} as React.CSSProperties,
	star: ($filled: boolean): React.CSSProperties => ({
		color: $filled ? 'V9_COLORS.PRIMARY.YELLOW_LIGHT' : 'V9_COLORS.TEXT.GRAY_LIGHTER',
		fontSize: '1rem',
	}),
	ratingText: {
		fontWeight: 600,
		color: 'V9_COLORS.TEXT.GRAY_DARK',
	} as React.CSSProperties,
	pricing: {
		background: 'V9_COLORS.BG.GRAY_LIGHT',
		borderRadius: '0.5rem',
		padding: '1rem',
		marginBottom: '1.5rem',
	} as React.CSSProperties,
	pricingText: {
		fontSize: '1.25rem',
		fontWeight: 700,
		color: 'V9_COLORS.TEXT.GRAY_DARK',
		marginBottom: '0.25rem',
	} as React.CSSProperties,
	pricingNote: {
		fontSize: '0.875rem',
		color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
	} as React.CSSProperties,
	featuresList: {
		listStyle: 'none',
		padding: '0',
		margin: '0 0 1.5rem 0',
	} as React.CSSProperties,
	featureItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.5rem 0',
		fontSize: '0.875rem',
		color: 'V9_COLORS.TEXT.GRAY_DARK',
	} as React.CSSProperties,
	prosConsContainer: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '1rem',
		marginBottom: '1.5rem',
	} as React.CSSProperties,
	prosConsSection: ($type: 'pros' | 'cons'): React.CSSProperties => ({
		background: $type === 'pros' ? '#f0fdf4' : 'V9_COLORS.BG.ERROR',
		borderRadius: '0.5rem',
		padding: '1rem',
	}),
	prosConsTitle: ($type: 'pros' | 'cons'): React.CSSProperties => ({
		fontSize: '0.875rem',
		fontWeight: 600,
		color: $type === 'pros' ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.PRIMARY.RED_DARK',
		margin: '0 0 0.5rem 0',
		display: 'flex',
		alignItems: 'center',
		gap: '0.25rem',
	}),
	prosConsList: {
		listStyle: 'none',
		padding: '0',
		margin: '0',
	} as React.CSSProperties,
	prosConsItem: ($type: 'pros' | 'cons'): React.CSSProperties => ({
		fontSize: '0.75rem',
		color: $type === 'pros' ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.PRIMARY.RED_DARK',
		padding: '0.25rem 0',
	}),
	actionButtons: {
		display: 'flex',
		gap: '0.75rem',
	} as React.CSSProperties,
	comparisonTable: {
		background: 'white',
		borderRadius: '1rem',
		overflow: 'hidden',
		boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
		marginBottom: '3rem',
	} as React.CSSProperties,
	tableHeader: {
		background: 'V9_COLORS.BG.GRAY_LIGHT',
		padding: '1.5rem',
		borderBottom: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
	} as React.CSSProperties,
	tableTitle: {
		fontSize: '1.5rem',
		fontWeight: 700,
		margin: '0',
		color: 'V9_COLORS.TEXT.GRAY_DARK',
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
	} as React.CSSProperties,
	tableContent: {
		overflowX: 'auto' as const,
	} as React.CSSProperties,
	table: {
		width: '100%',
		borderCollapse: 'collapse' as const,
	} as React.CSSProperties,
	tableHead: {
		background: 'V9_COLORS.BG.GRAY_LIGHT',
	} as React.CSSProperties,
	tableRow: {
		borderBottom: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
	} as React.CSSProperties,
	tableHeaderCell: {
		padding: '1rem',
		textAlign: 'left' as const,
		fontWeight: 600,
		color: 'V9_COLORS.TEXT.GRAY_DARK',
		borderRight: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
		minWidth: '150px',
	} as React.CSSProperties,
	tableCell: {
		padding: '1rem',
		borderRight: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
		color: 'V9_COLORS.TEXT.GRAY_DARK',
	} as React.CSSProperties,
	checkIcon: {
		color: 'V9_COLORS.PRIMARY.GREEN',
		fontWeight: 600,
	} as React.CSSProperties,
	xIcon: {
		color: 'V9_COLORS.PRIMARY.RED',
		fontWeight: 600,
	} as React.CSSProperties,
};

const CompetitiveAnalysis: React.FC = () => {
	const [_selectedProvider, setSelectedProvider] = useState<string | null>(null);

	const providers = [
		{
			id: 'ping-identity',
			name: 'Ping Identity',
			tagline: 'Enterprise Identity & Access Management',
			icon: '🏆',
			color: 'V9_COLORS.PRIMARY.BLUE',
			rating: 4.5,
			reviews: 222,
			pricing: '$3.00/user/month',
			pricingNote: 'Free trial available',
			featured: true,
			features: [
				'Enterprise SSO',
				'Multi-Factor Authentication',
				'Directory Services',
				'API Security',
				'Identity Governance',
				'Standards-based Access',
			],
			pros: [
				'Secure enterprise access',
				'Seamless integration',
				'Standards-based',
				'One-click access',
				'Customizable options',
			],
			cons: ['Performance issues', 'Documentation needs improvement'],
			website: 'https://www.pingidentity.com',
			description:
				'Ping Identity provides secure access to applications and services for enterprises with standards-based, one-click access from any device.',
		},
		{
			id: 'okta',
			name: 'Okta',
			tagline: 'Enterprise-Grade Identity Management',
			icon: '🔐',
			color: '#0070f3',
			rating: 4.5,
			reviews: 1550,
			pricing: '$2.00/user/month',
			pricingNote: 'Free trial available',
			featured: false,
			features: [
				'Universal Directory',
				'Lifecycle Management',
				'API Access Management',
				'Advanced Threat Protection',
				'Multi-Factor Authentication',
				'Single Sign-On',
			],
			pros: [
				'Deep app integrations',
				'Seamless user experience',
				'Automation capabilities',
				'Enhanced security',
				'Prevents data breaches',
			],
			cons: ['Configuration complexity', 'Pricing structure', 'Customization needs'],
			website: 'https://www.okta.com',
			description:
				'Okta is an enterprise-grade identity management service built for the cloud, providing secure identity management with SSO, MFA, and lifecycle management.',
		},
		{
			id: 'auth0',
			name: 'Auth0',
			tagline: 'Flexible Authentication & Authorization',
			icon: '🔑',
			color: '#eb5424',
			rating: 4.3,
			reviews: 67,
			pricing: 'Contact for pricing',
			pricingNote: 'Free tier available',
			featured: false,
			features: [
				'Social Login',
				'Enterprise SSO',
				'Multi-Factor Authentication',
				'Anomaly Detection',
				'Passwordless Authentication',
				'Extensive Documentation',
			],
			pros: [
				'User-friendly interface',
				'Easy setup',
				'Comprehensive features',
				'Robust security',
				'Developer-friendly',
			],
			cons: ['Occasional glitches', 'Learning curve', 'Advanced configuration complexity'],
			website: 'https://auth0.com',
			description:
				'Auth0 is a flexible, drop-in solution to add authentication and authorization services to applications with extensive customization options.',
		},
		{
			id: 'microsoft-entra',
			name: 'Microsoft Entra ID',
			tagline: 'Cloud-Based Identity & Access Management',
			icon: '☁️',
			color: '#0078d4',
			rating: 4.3,
			reviews: 440,
			pricing: '$6.00/user/month',
			pricingNote: 'No free trial',
			featured: false,
			features: [
				'Conditional Access',
				'Identity Protection',
				'Microsoft 365 Integration',
				'Azure Services Integration',
				'Multi-Factor Authentication',
				'B2B Collaboration',
			],
			pros: [
				'Microsoft ecosystem integration',
				'Robust security features',
				'User-friendly interface',
				'Office 365 integration',
				'Conditional access policies',
			],
			cons: ['Performance issues', 'Third-party integration challenges'],
			website: 'https://azure.microsoft.com/en-us/products/entra',
			description:
				'Microsoft Entra ID is a cloud-based identity and access management service providing authentication and authorization for Microsoft services and third-party applications.',
		},
		{
			id: 'google-identity',
			name: 'Google Identity Platform',
			tagline: 'Google Cloud Identity Solutions',
			icon: '🌐',
			color: '#4285f4',
			rating: 4.4,
			reviews: 180,
			pricing: 'Pay-as-you-go',
			pricingNote: 'Free tier available',
			featured: false,
			features: [
				'Google Cloud Integration',
				'Social Authentication',
				'Multi-Factor Authentication',
				'Identity Federation',
				'Risk Assessment',
				'Developer Tools',
			],
			pros: [
				'Google ecosystem integration',
				'Developer-friendly',
				'Scalable infrastructure',
				'Advanced security',
				'Global availability',
			],
			cons: ['Google dependency', 'Limited customization', 'Complex pricing'],
			website: 'https://cloud.google.com/identity-platform',
			description:
				'Google Identity Platform provides authentication and authorization services for applications with deep integration into Google Cloud services.',
		},
		{
			id: 'aws-iam',
			name: 'AWS Identity & Access Management',
			tagline: 'AWS Cloud Identity Management',
			icon: '☁️',
			color: '#ff9900',
			rating: 4.6,
			reviews: 133,
			pricing: 'Custom pricing',
			pricingNote: 'No free trial',
			featured: false,
			features: [
				'Granular Access Control',
				'Role-Based Access Control',
				'AWS Service Integration',
				'Multi-Factor Authentication',
				'Identity Federation',
				'Policy Management',
			],
			pros: [
				'Granular access control',
				'Extensive AWS integrations',
				'Centralized management',
				'Role-based access',
				'Comprehensive policies',
			],
			cons: [
				'Complex policy management',
				'Steep learning curve',
				'Confusing UI',
				'Limited cross-platform',
			],
			website: 'https://aws.amazon.com/iam',
			description:
				'AWS IAM enables secure management of access to AWS services and resources with granular permissions and role-based access control.',
		},
	];

	const comparisonData = [
		{
			feature: 'Single Sign-On (SSO)',
			ping: true,
			okta: true,
			auth0: true,
			microsoft: true,
			google: true,
			aws: true,
		},
		{
			feature: 'Multi-Factor Authentication',
			ping: true,
			okta: true,
			auth0: true,
			microsoft: true,
			google: true,
			aws: true,
		},
		{
			feature: 'Social Login',
			ping: true,
			okta: true,
			auth0: true,
			microsoft: true,
			google: true,
			aws: false,
		},
		{
			feature: 'Enterprise Directory Integration',
			ping: true,
			okta: true,
			auth0: true,
			microsoft: true,
			google: true,
			aws: true,
		},
		{
			feature: 'API Access Management',
			ping: true,
			okta: true,
			auth0: true,
			microsoft: true,
			google: true,
			aws: true,
		},
		{
			feature: 'Conditional Access',
			ping: true,
			okta: true,
			auth0: true,
			microsoft: true,
			google: true,
			aws: true,
		},
		{
			feature: 'Identity Governance',
			ping: true,
			okta: true,
			auth0: false,
			microsoft: true,
			google: false,
			aws: false,
		},
		{
			feature: 'Passwordless Authentication',
			ping: true,
			okta: true,
			auth0: true,
			microsoft: true,
			google: true,
			aws: true,
		},
		{
			feature: 'Developer-Friendly APIs',
			ping: true,
			okta: true,
			auth0: true,
			microsoft: true,
			google: true,
			aws: true,
		},
		{
			feature: 'Compliance Certifications',
			ping: true,
			okta: true,
			auth0: true,
			microsoft: true,
			google: true,
			aws: true,
		},
	];

	return (
		<div style={styles.pageContainer}>
			<div style={styles.heroSection}>
				<h1 style={styles.heroTitle}>
					<FiAward />
					Identity Provider Competitive Analysis
				</h1>
				<p style={styles.heroSubtitle}>Compare leading Identity & Access Management solutions</p>
				<p style={styles.heroDescription}>
					Comprehensive analysis of major IAM providers including features, pricing, pros, cons, and
					use cases to help you choose the right solution.
				</p>
			</div>

			<CollapsibleHeader
				title="Provider Overview"
				subtitle="Detailed comparison of major IAM providers"
				icon={<FiUsers />}
				defaultCollapsed={false}
			>
				<div style={styles.comparisonGrid}>
					{providers.map((provider) => (
						<div key={provider.id} style={styles.providerCard(provider.featured)}>
							<div style={styles.providerHeader}>
								<div style={styles.providerIcon(provider.color)}>{provider.icon}</div>
								<div style={styles.providerInfo}>
									<h3 style={styles.providerName}>{provider.name}</h3>
									<p style={styles.providerTagline}>{provider.tagline}</p>
								</div>
							</div>

							<div style={styles.ratingContainer}>
								<div style={styles.rating}>
									{[1, 2, 3, 4, 5].map((star) => (
										<span key={star} style={styles.star(star <= Math.floor(provider.rating))}>
											★
										</span>
									))}
								</div>
								<span style={styles.ratingText}>
									{provider.rating}/5 ({provider.reviews} reviews)
								</span>
							</div>

							<div style={styles.pricing}>
								<div style={styles.pricingText}>{provider.pricing}</div>
								<div style={styles.pricingNote}>{provider.pricingNote}</div>
							</div>

							<ul style={styles.featuresList}>
								{provider.features.map((feature, index) => (
									<li key={index} style={styles.featureItem}>
										<FiCheckCircle size={16} color="V9_COLORS.PRIMARY.GREEN" />
										{feature}
									</li>
								))}
							</ul>

							<div style={styles.prosConsContainer}>
								<div style={styles.prosConsSection('pros')}>
									<h4 style={styles.prosConsTitle('pros')}>
										<FiTrendingUp size={14} />
										Pros
									</h4>
									<ul style={styles.prosConsList}>
										{provider.pros.map((pro, index) => (
											<li key={index} style={styles.prosConsItem('pros')}>
												• {pro}
											</li>
										))}
									</ul>
								</div>

								<div style={styles.prosConsSection('cons')}>
									<h4 style={styles.prosConsTitle('cons')}>
										<FiZap size={14} />
										Cons
									</h4>
									<ul style={styles.prosConsList}>
										{provider.cons.map((con, index) => (
											<li key={index} style={styles.prosConsItem('cons')}>
												• {con}
											</li>
										))}
									</ul>
								</div>
							</div>

							<div style={styles.actionButtons}>
								<Button
									$variant="primary"
									size="sm"
									onClick={() => window.open(provider.website, '_blank')}
								>
									<FiExternalLink />
									Visit Website
								</Button>
								<Button
									$variant="outline"
									size="sm"
									onClick={() => setSelectedProvider(provider.id)}
								>
									<FiShield size={14} />
									Learn More
								</Button>
							</div>
						</div>
					))}
				</div>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Feature Comparison Matrix"
				subtitle="Side-by-side comparison of key features across all providers"
				icon={<FiCheckCircle />}
				defaultCollapsed={false}
			>
				<div style={styles.comparisonTable}>
					<div style={styles.tableHeader}>
						<h3 style={styles.tableTitle}>
							<FiCheckCircle />
							Feature Comparison Matrix
						</h3>
					</div>
					<div style={styles.tableContent}>
						<table style={styles.table}>
							<thead style={styles.tableHead}>
								<tr style={styles.tableRow}>
									<th style={styles.tableHeaderCell}>Feature</th>
									<th style={styles.tableHeaderCell}>Ping Identity</th>
									<th style={styles.tableHeaderCell}>Okta</th>
									<th style={styles.tableHeaderCell}>Auth0</th>
									<th style={styles.tableHeaderCell}>Microsoft Entra</th>
									<th style={styles.tableHeaderCell}>Google Identity</th>
									<th style={styles.tableHeaderCell}>AWS IAM</th>
								</tr>
							</thead>
							<tbody>
								{comparisonData.map((row, index) => (
									<tr key={index} style={styles.tableRow}>
										<td style={styles.tableCell}>{row.feature}</td>
										<td style={styles.tableCell}>
											{row.ping ? (
												<span style={styles.checkIcon}>✓</span>
											) : (
												<span style={styles.xIcon}>✗</span>
											)}
										</td>
										<td style={styles.tableCell}>
											{row.okta ? (
												<span style={styles.checkIcon}>✓</span>
											) : (
												<span style={styles.xIcon}>✗</span>
											)}
										</td>
										<td style={styles.tableCell}>
											{row.auth0 ? (
												<span style={styles.checkIcon}>✓</span>
											) : (
												<span style={styles.xIcon}>✗</span>
											)}
										</td>
										<td style={styles.tableCell}>
											{row.microsoft ? (
												<span style={styles.checkIcon}>✓</span>
											) : (
												<span style={styles.xIcon}>✗</span>
											)}
										</td>
										<td style={styles.tableCell}>
											{row.google ? (
												<span style={styles.checkIcon}>✓</span>
											) : (
												<span style={styles.xIcon}>✗</span>
											)}
										</td>
										<td style={styles.tableCell}>
											{row.aws ? (
												<span style={styles.checkIcon}>✓</span>
											) : (
												<span style={styles.xIcon}>✗</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Use Case Recommendations"
				subtitle="Which provider is best for different scenarios"
				icon={<FiGlobe />}
				defaultCollapsed={false}
			>
				<div style={{ display: 'grid', gap: '2rem' }}>
					<div
						style={{
							background: 'white',
							padding: '2rem',
							borderRadius: '1rem',
							boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
						}}
					>
						<h3
							style={{
								margin: '0 0 1rem 0',
								color: 'V9_COLORS.TEXT.GRAY_DARK',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiUsers />
							Enterprise Organizations
						</h3>
						<p style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM', marginBottom: '1rem' }}>
							<strong>Recommended:</strong> Ping Identity, Okta, Microsoft Entra ID
						</p>
						<p style={{ color: 'V9_COLORS.TEXT.GRAY_DARK', lineHeight: '1.6' }}>
							For large enterprises requiring comprehensive identity governance, advanced security
							features, and seamless integration with existing enterprise systems. These providers
							offer robust compliance features, lifecycle management, and enterprise-grade security.
						</p>
					</div>

					<div
						style={{
							background: 'white',
							padding: '2rem',
							borderRadius: '1rem',
							boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
						}}
					>
						<h3
							style={{
								margin: '0 0 1rem 0',
								color: 'V9_COLORS.TEXT.GRAY_DARK',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiZap />
							Startups & SMBs
						</h3>
						<p style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM', marginBottom: '1rem' }}>
							<strong>Recommended:</strong> Auth0, Google Identity Platform
						</p>
						<p style={{ color: 'V9_COLORS.TEXT.GRAY_DARK', lineHeight: '1.6' }}>
							For smaller organizations needing quick setup, developer-friendly APIs, and
							cost-effective solutions. These providers offer excellent documentation, easy
							integration, and flexible pricing models suitable for growing businesses.
						</p>
					</div>

					<div
						style={{
							background: 'white',
							padding: '2rem',
							borderRadius: '1rem',
							boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
						}}
					>
						<h3
							style={{
								margin: '0 0 1rem 0',
								color: 'V9_COLORS.TEXT.GRAY_DARK',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiGlobe />
							Cloud-Native Applications
						</h3>
						<p style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM', marginBottom: '1rem' }}>
							<strong>Recommended:</strong> AWS IAM, Google Identity Platform, Microsoft Entra ID
						</p>
						<p style={{ color: 'V9_COLORS.TEXT.GRAY_DARK', lineHeight: '1.6' }}>
							For applications built on specific cloud platforms, leveraging native cloud identity
							services provides seamless integration, optimized performance, and reduced complexity
							in cloud environments.
						</p>
					</div>
				</div>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Pricing Analysis"
				subtitle="Cost comparison and value analysis"
				icon={<FiDollarSign />}
				defaultCollapsed={false}
			>
				<div style={{ display: 'grid', gap: '1.5rem' }}>
					<div
						style={{
							background: 'white',
							padding: '2rem',
							borderRadius: '1rem',
							boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
						}}
					>
						<h3 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>Pricing Summary</h3>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
								gap: '1rem',
							}}
						>
							{providers.map((provider) => (
								<div
									key={provider.id}
									style={{ padding: '1rem', background: 'V9_COLORS.BG.GRAY_LIGHT', borderRadius: '0.5rem' }}
								>
									<h4 style={{ margin: '0 0 0.5rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>{provider.name}</h4>
									<p style={{ margin: '0', color: 'V9_COLORS.TEXT.GRAY_MEDIUM', fontSize: '0.875rem' }}>
										{provider.pricing}
									</p>
									<p style={{ margin: '0.25rem 0 0 0', color: 'V9_COLORS.TEXT.GRAY_LIGHT', fontSize: '0.75rem' }}>
										{provider.pricingNote}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</CollapsibleHeader>
		</div>
	);
};

export default CompetitiveAnalysis;
