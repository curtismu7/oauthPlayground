import React, { useState } from 'react';
import {
	FiAward,
	FiCheckCircle,
	FiDollarSign,
	FiExternalLink,
	FiGlobe,
	FiShield,
	FiStar,
	FiTrendingUp,
	FiUsers,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowUIService } from '../services/flowUIService';
import { PageLayoutService } from '../services/pageLayoutService';

const PageContainer = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 2rem;
`;

const HeroSection = styled.div`
	background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
	color: white;
	padding: 4rem 3rem;
	border-radius: 1rem;
	margin-bottom: 3rem;
	text-align: center;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const HeroTitle = styled.h1`
	font-size: 3.5rem;
	font-weight: 800;
	margin: 0 0 1.5rem 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1rem;
`;

const HeroSubtitle = styled.p`
	font-size: 1.5rem;
	margin: 0 0 2rem 0;
	opacity: 0.9;
	max-width: 800px;
	margin-left: auto;
	margin-right: auto;
	line-height: 1.6;
`;

const HeroDescription = styled.p`
	font-size: 1.125rem;
	margin: 0;
	opacity: 0.8;
	max-width: 600px;
	margin-left: auto;
	margin-right: auto;
	line-height: 1.6;
`;

const ComparisonGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 2rem;
	margin-bottom: 3rem;
`;

const ProviderCard = styled.div<{ $featured?: boolean }>`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	border: 2px solid ${({ $featured }) => ($featured ? '#3b82f6' : '#e5e7eb')};
	transition: all 0.3s ease;
	position: relative;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	${({ $featured }) =>
		$featured &&
		`
		&::before {
			content: '🏆 Featured';
			position: absolute;
			top: -10px;
			right: 20px;
			background: #3b82f6;
			color: white;
			padding: 0.5rem 1rem;
			border-radius: 1rem;
			font-size: 0.875rem;
			font-weight: 600;
		}
	`}
`;

const ProviderHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1.5rem;
`;

const ProviderIcon = styled.div<{ $color: string }>`
	width: 60px;
	height: 60px;
	border-radius: 1rem;
	background: ${({ $color }) => $color};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
	color: white;
`;

const ProviderInfo = styled.div`
	flex: 1;
`;

const ProviderName = styled.h3`
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0 0 0.5rem 0;
	color: #1f2937;
`;

const ProviderTagline = styled.p`
	font-size: 1rem;
	color: #6b7280;
	margin: 0;
`;

const RatingContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
`;

const Rating = styled.div`
	display: flex;
	align-items: center;
	gap: 0.25rem;
`;

const Star = styled.span<{ $filled: boolean }>`
	color: ${({ $filled }) => ($filled ? '#fbbf24' : '#d1d5db')};
	font-size: 1rem;
`;

const RatingText = styled.span`
	font-weight: 600;
	color: #374151;
`;

const Pricing = styled.div`
	background: #f8fafc;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1.5rem;
`;

const PricingText = styled.div`
	font-size: 1.25rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 0.25rem;
`;

const PricingNote = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
`;

const FeaturesList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0 0 1.5rem 0;
`;

const FeatureItem = styled.li`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0;
	font-size: 0.875rem;
	color: #374151;
`;

const ProsConsContainer = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin-bottom: 1.5rem;
`;

const ProsConsSection = styled.div`
	background: ${({ $type }: { $type: 'pros' | 'cons' }) =>
		$type === 'pros' ? '#f0fdf4' : '#fef2f2'};
	border-radius: 0.5rem;
	padding: 1rem;
`;

const ProsConsTitle = styled.h4`
	font-size: 0.875rem;
	font-weight: 600;
	color: ${({ $type }: { $type: 'pros' | 'cons' }) =>
		$type === 'pros' ? '#166534' : '#dc2626'};
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.25rem;
`;

const ProsConsList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
`;

const ProsConsItem = styled.li`
	font-size: 0.75rem;
	color: ${({ $type }: { $type: 'pros' | 'cons' }) =>
		$type === 'pros' ? '#166534' : '#dc2626'};
	padding: 0.25rem 0;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.75rem;
`;

const Button = FlowUIService.getButton();

const ComparisonTable = styled.div`
	background: white;
	border-radius: 1rem;
	overflow: hidden;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	margin-bottom: 3rem;
`;

const TableHeader = styled.div`
	background: #f8fafc;
	padding: 1.5rem;
	border-bottom: 1px solid #e5e7eb;
`;

const TableTitle = styled.h3`
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const TableContent = styled.div`
	overflow-x: auto;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
`;

const TableHead = styled.thead`
	background: #f8fafc;
`;

const TableRow = styled.tr`
	border-bottom: 1px solid #e5e7eb;

	&:hover {
		background: #f8fafc;
	}
`;

const TableHeaderCell = styled.th`
	padding: 1rem;
	text-align: left;
	font-weight: 600;
	color: #374151;
	border-right: 1px solid #e5e7eb;
	min-width: 150px;
`;

const TableCell = styled.td`
	padding: 1rem;
	border-right: 1px solid #e5e7eb;
	color: #374151;
`;

const CheckIcon = styled.span`
	color: #10b981;
	font-weight: 600;
`;

const XIcon = styled.span`
	color: #ef4444;
	font-weight: 600;
`;

const CompetitiveAnalysis: React.FC = () => {
	const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

	const providers = [
		{
			id: 'ping-identity',
			name: 'Ping Identity',
			tagline: 'Enterprise Identity & Access Management',
			icon: '🏆',
			color: '#3b82f6',
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
		<PageContainer>
			<HeroSection>
				<HeroTitle>
					<FiAward />
					Identity Provider Competitive Analysis
				</HeroTitle>
				<HeroSubtitle>
					Compare leading Identity & Access Management solutions
				</HeroSubtitle>
				<HeroDescription>
					Comprehensive analysis of major IAM providers including features, pricing,
					pros, cons, and use cases to help you choose the right solution.
				</HeroDescription>
			</HeroSection>

			<CollapsibleHeader
				title="Provider Overview"
				subtitle="Detailed comparison of major IAM providers"
				icon={<FiUsers />}
				defaultCollapsed={false}
			>
				<ComparisonGrid>
					{providers.map((provider) => (
						<ProviderCard key={provider.id} $featured={provider.featured}>
							<ProviderHeader>
								<ProviderIcon $color={provider.color}>
									{provider.icon}
								</ProviderIcon>
								<ProviderInfo>
									<ProviderName>{provider.name}</ProviderName>
									<ProviderTagline>{provider.tagline}</ProviderTagline>
								</ProviderInfo>
							</ProviderHeader>

							<RatingContainer>
								<Rating>
									{[1, 2, 3, 4, 5].map((star) => (
										<Star
											key={star}
											$filled={star <= Math.floor(provider.rating)}
										>
											★
										</Star>
									))}
								</Rating>
								<RatingText>
									{provider.rating}/5 ({provider.reviews} reviews)
								</RatingText>
							</RatingContainer>

							<Pricing>
								<PricingText>{provider.pricing}</PricingText>
								<PricingNote>{provider.pricingNote}</PricingNote>
							</Pricing>

							<FeaturesList>
								{provider.features.map((feature, index) => (
									<FeatureItem key={index}>
										<FiCheckCircle size={16} color="#10b981" />
										{feature}
									</FeatureItem>
								))}
							</FeaturesList>

							<ProsConsContainer>
								<ProsConsSection $type="pros">
									<ProsConsTitle $type="pros">
										<FiTrendingUp size={14} />
										Pros
									</ProsConsTitle>
									<ProsConsList>
										{provider.pros.map((pro, index) => (
											<ProsConsItem key={index} $type="pros">
												• {pro}
											</ProsConsItem>
										))}
									</ProsConsList>
								</ProsConsSection>

								<ProsConsSection $type="cons">
									<ProsConsTitle $type="cons">
										<FiZap size={14} />
										Cons
									</ProsConsTitle>
									<ProsConsList>
										{provider.cons.map((con, index) => (
											<ProsConsItem key={index} $type="cons">
												• {con}
											</ProsConsItem>
										))}
									</ProsConsList>
								</ProsConsSection>
							</ProsConsContainer>

							<ActionButtons>
								<Button
									variant="primary"
									size="sm"
									onClick={() => window.open(provider.website, '_blank')}
								>
									<FiExternalLink size={14} />
									Visit Website
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setSelectedProvider(provider.id)}
								>
									<FiShield size={14} />
									Learn More
								</Button>
							</ActionButtons>
						</ProviderCard>
					))}
				</ComparisonGrid>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Feature Comparison Matrix"
				subtitle="Side-by-side comparison of key features across all providers"
				icon={<FiCheckCircle />}
				defaultCollapsed={false}
			>
				<ComparisonTable>
					<TableHeader>
						<TableTitle>
							<FiCheckCircle />
							Feature Comparison Matrix
						</TableTitle>
					</TableHeader>
					<TableContent>
						<Table>
							<TableHead>
								<TableRow>
									<TableHeaderCell>Feature</TableHeaderCell>
									<TableHeaderCell>Ping Identity</TableHeaderCell>
									<TableHeaderCell>Okta</TableHeaderCell>
									<TableHeaderCell>Auth0</TableHeaderCell>
									<TableHeaderCell>Microsoft Entra</TableHeaderCell>
									<TableHeaderCell>Google Identity</TableHeaderCell>
									<TableHeaderCell>AWS IAM</TableHeaderCell>
								</TableRow>
							</TableHead>
							<tbody>
								{comparisonData.map((row, index) => (
									<TableRow key={index}>
										<TableCell>{row.feature}</TableCell>
										<TableCell>
											{row.ping ? (
												<CheckIcon>✓</CheckIcon>
											) : (
												<XIcon>✗</XIcon>
											)}
										</TableCell>
										<TableCell>
											{row.okta ? (
												<CheckIcon>✓</CheckIcon>
											) : (
												<XIcon>✗</XIcon>
											)}
										</TableCell>
										<TableCell>
											{row.auth0 ? (
												<CheckIcon>✓</CheckIcon>
											) : (
												<XIcon>✗</XIcon>
											)}
										</TableCell>
										<TableCell>
											{row.microsoft ? (
												<CheckIcon>✓</CheckIcon>
											) : (
												<XIcon>✗</XIcon>
											)}
										</TableCell>
										<TableCell>
											{row.google ? (
												<CheckIcon>✓</CheckIcon>
											) : (
												<XIcon>✗</XIcon>
											)}
										</TableCell>
										<TableCell>
											{row.aws ? (
												<CheckIcon>✓</CheckIcon>
											) : (
												<XIcon>✗</XIcon>
											)}
										</TableCell>
									</TableRow>
								))}
							</tbody>
						</Table>
					</TableContent>
				</ComparisonTable>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Use Case Recommendations"
				subtitle="Which provider is best for different scenarios"
				icon={<FiGlobe />}
				defaultCollapsed={false}
			>
				<div style={{ display: 'grid', gap: '2rem' }}>
					<div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiUsers />
							Enterprise Organizations
						</h3>
						<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
							<strong>Recommended:</strong> Ping Identity, Okta, Microsoft Entra ID
						</p>
						<p style={{ color: '#374151', lineHeight: '1.6' }}>
							For large enterprises requiring comprehensive identity governance, advanced security features, 
							and seamless integration with existing enterprise systems. These providers offer robust 
							compliance features, lifecycle management, and enterprise-grade security.
						</p>
					</div>

					<div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiZap />
							Startups & SMBs
						</h3>
						<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
							<strong>Recommended:</strong> Auth0, Google Identity Platform
						</p>
						<p style={{ color: '#374151', lineHeight: '1.6' }}>
							For smaller organizations needing quick setup, developer-friendly APIs, and cost-effective 
							solutions. These providers offer excellent documentation, easy integration, and flexible 
							pricing models suitable for growing businesses.
						</p>
					</div>

					<div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiGlobe />
							Cloud-Native Applications
						</h3>
						<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
							<strong>Recommended:</strong> AWS IAM, Google Identity Platform, Microsoft Entra ID
						</p>
						<p style={{ color: '#374151', lineHeight: '1.6' }}>
							For applications built on specific cloud platforms, leveraging native cloud identity services 
							provides seamless integration, optimized performance, and reduced complexity in cloud environments.
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
					<div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Pricing Summary</h3>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
							{providers.map((provider) => (
								<div key={provider.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{provider.name}</h4>
									<p style={{ margin: '0', color: '#6b7280', fontSize: '0.875rem' }}>{provider.pricing}</p>
									<p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af', fontSize: '0.75rem' }}>{provider.pricingNote}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</CollapsibleHeader>
		</PageContainer>
	);
};

export default CompetitiveAnalysis;
