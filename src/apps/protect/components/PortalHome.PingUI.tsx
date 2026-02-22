/**
 * @file PortalHome.PingUI.tsx
 * @module protect-portal/components
 * @description Portal home component with corporate landing page - Ping UI Version
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component displays the corporate portal landing page with company selector
 * and educational content about risk-based authentication.
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React from 'react';
import CompanySelector from './CompanySelector';
import PortalPageLayout, { PortalPageSection } from './PortalPageLayout';

// MDI Icon component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
}> = ({ icon, size = 24, className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden }) => {
	const iconClass = icon.startsWith('mdi-') ? icon : `mdi-${icon}`;
	return (
		<i
			className={`mdi ${iconClass} ${className}`}
			style={{ fontSize: `${size}px` }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		/>
	);
};

// Style functions
const getWelcomeSectionStyle = () => ({
	textAlign: 'center' as const,
	marginBottom: '4rem',
});

const getWelcomeIconStyle = () => ({
	fontSize: '4rem',
	color: 'var(--brand-primary, #0066cc)',
	marginBottom: '2rem',
});

const getFeaturesGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
	gap: '2rem',
	marginBottom: '3rem',
});

const getFeatureCardStyle = () => ({
	background: 'var(--brand-surface-light, #f8fafc)',
	borderRadius: 'var(--brand-radius-lg, 12px)',
	padding: '2rem',
	textAlign: 'center' as const,
	border: '1px solid var(--brand-border-color, #e2e8f0)',
	transition: 'all 0.15s ease-in-out',
	'&:hover': {
		transform: 'translateY(-4px)',
		boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
	},
});

const getFeatureIconStyle = () => ({
	fontSize: '3rem',
	color: 'var(--brand-primary, #0066cc)',
	marginBottom: '1rem',
});

const getFeatureTitleStyle = () => ({
	fontSize: '1.25rem',
	fontWeight: '600',
	color: 'var(--brand-text, #1e293b)',
	marginBottom: '1rem',
});

const getFeatureDescriptionStyle = () => ({
	color: 'var(--brand-text-light, #64748b)',
	lineHeight: '1.6',
	marginBottom: '1.5rem',
});

const getFeatureListStyle = () => ({
	textAlign: 'left' as const,
	marginTop: '1rem',
});

const getFeatureListItemStyle = () => ({
	display: 'flex',
	alignItems: 'center' as const,
	marginBottom: '0.5rem',
	color: 'var(--brand-text, #1e293b)',
});

const getFeatureListItemIconStyle = () => ({
	color: '#10b981',
	marginRight: '0.5rem',
	flexShrink: 0,
});

const getActionSectionStyle = () => ({
	textAlign: 'center' as const,
	padding: '3rem 0',
	background: 'var(--brand-surface, white)',
	borderRadius: 'var(--brand-radius-lg, 12px)',
	border: '1px solid var(--brand-border-color, #e2e8f0)',
});

const getActionTitleStyle = () => ({
	fontSize: '2rem',
	fontWeight: '700',
	color: 'var(--brand-text, #1e293b)',
	marginBottom: '1rem',
});

const getActionDescriptionStyle = () => ({
	fontSize: '1.125rem',
	color: 'var(--brand-text-light, #64748b)',
	marginBottom: '2rem',
	maxWidth: '600px',
	marginLeft: 'auto',
	marginRight: 'auto',
});

const getActionButtonStyle = () => ({
	display: 'inline-flex',
	alignItems: 'center' as const,
	padding: '1rem 2rem',
	background: 'var(--brand-primary, #0066cc)',
	color: 'white',
	border: 'none',
	borderRadius: 'var(--brand-radius-md, 8px)',
	fontSize: '1rem',
	fontWeight: '600',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	textDecoration: 'none',
	'&:hover': {
		background: 'var(--brand-primary-dark, #0052a3)',
		transform: 'translateY(-2px)',
		boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
	},
});

interface EducationalContent {
	title: string;
	description: string;
	keyPoints: string[];
}

const educationalContent: EducationalContent[] = [
	{
		title: 'Risk-Based Authentication',
		description: 'Advanced security that adapts to risk levels in real-time',
		keyPoints: [
			'Continuous risk assessment',
			'Adaptive authentication requirements',
			'Machine learning threat detection',
		],
	},
	{
		title: 'Zero Trust Architecture',
		description: 'Never trust, always verify security model',
		keyPoints: ['Identity-centric security', 'Micro-segmentation', 'Continuous verification'],
	},
	{
		title: 'Multi-Factor Authentication',
		description: 'Layered security with multiple verification methods',
		keyPoints: ['Biometric authentication', 'Hardware tokens', 'One-time passwords'],
	},
];

export const PortalHome: React.FC = () => {
	return (
		<div className="end-user-nano">
			<PortalPageLayout>
				<PortalPageSection>
					<div style={getWelcomeSectionStyle()}>
						<div style={getWelcomeIconStyle()}>
							<MDIIcon icon="shield-check" size={64} aria-hidden={true} />
						</div>
						<h1
							style={{
								fontSize: '3rem',
								fontWeight: '700',
								color: 'var(--brand-text, #1e293b)',
								marginBottom: '1rem',
							}}
						>
							Welcome to Ping Identity Portal
						</h1>
						<p
							style={{
								fontSize: '1.25rem',
								color: 'var(--brand-text-light, #64748b)',
								maxWidth: '800px',
								margin: '0 auto',
							}}
						>
							Enterprise-grade identity and access management with advanced security features and
							seamless user experience.
						</p>
					</div>

					<div style={getFeaturesGridStyle()}>
						{educationalContent.map((content, index) => (
							<div key={index} style={getFeatureCardStyle()}>
								<div style={getFeatureIconStyle()}>
									<MDIIcon
										icon={index === 0 ? 'shield' : index === 1 ? 'lock' : 'user'}
										aria-hidden={true}
									/>
								</div>
								<h3 style={getFeatureTitleStyle()}>{content.title}</h3>
								<p style={getFeatureDescriptionStyle()}>{content.description}</p>
								<div style={getFeatureListStyle()}>
									{content.keyPoints.map((keyPoint: string, pointIndex: number) => (
										<div key={pointIndex} style={getFeatureListItemStyle()}>
											<span style={getFeatureListItemIconStyle()}>
												<MDIIcon icon="check-circle" size={16} aria-hidden={true} />
											</span>
											{keyPoint}
										</div>
									))}
								</div>
							</div>
						))}
					</div>

					<div style={getActionSectionStyle()}>
						<h2 style={getActionTitleStyle()}>Get Started Today</h2>
						<p style={getActionDescriptionStyle()}>
							Select your organization to begin exploring our comprehensive identity management
							solutions
						</p>
						<div style={{ marginBottom: '2rem' }}>
							<CompanySelector />
						</div>
						<button style={getActionButtonStyle()} aria-label="Learn more about Ping Identity">
							Learn More
							<MDIIcon icon="arrow-right" size={20} aria-hidden={true} />
						</button>
					</div>
				</PortalPageSection>
			</PortalPageLayout>
		</div>
	);
};

export default PortalHome;
