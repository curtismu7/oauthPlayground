// src/pages/PingAIResources.PingUI.tsx
// Ping Identity AI Resources - PingOne UI Version
// PingOne UI migration following pingui2.md standards

import React from 'react';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { PageLayoutService } from '../services/pageLayoutService';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			title={title}
		/>
	);
};

// PingOne UI Styled Components (using inline styles with CSS variables)
const getResourceGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
	gap: 'var(--pingone-spacing-lg, 1.5rem)',
	margin: 'var(--pingone-spacing-lg, 1.5rem) 0',
});

const getResourceCardStyle = () => ({
	background:
		'linear-gradient(135deg, var(--pingone-surface-card) 0%, var(--pingone-surface-secondary) 100%)',
	border: '2px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	textDecoration: 'none',
	color: 'inherit',
	transition: 'all 0.15s ease-in-out',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--pingone-spacing-md, 0.75rem)',
	'&:hover': {
		borderColor: 'var(--pingone-brand-primary)',
		transform: 'translateY(-2px)',
		boxShadow: 'var(--pingone-shadow-xl, 0 8px 25px rgba(59, 130, 246, 0.15))',
	},
});

const getResourceTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	color: 'var(--pingone-text-primary)',
	margin: '0',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
});

const getResourceDescriptionStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	lineHeight: '1.6',
	margin: '0',
});

const getResourceIconStyle = () => ({
	color: 'var(--pingone-brand-primary)',
	fontSize: 'var(--pingone-font-size-xl, 1.5rem)',
});

const getExternalLinkStyle = () => ({
	marginTop: 'auto',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
	color: 'var(--pingone-brand-primary)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
});

const getHeaderStyle = () => ({
	textAlign: 'center',
	marginBottom: 'var(--pingone-spacing-xl, 3rem)',
});

const getHeaderTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-3xl, 2.5rem)',
	fontWeight: 'var(--pingone-font-weight-bold, 700)',
	background:
		'linear-gradient(135deg, var(--pingone-brand-primary) 0%, var(--pingone-brand-secondary) 100%)',
	WebkitBackgroundClip: 'text',
	WebkitTextFillColor: 'transparent',
	backgroundClip: 'text',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: 'var(--pingone-spacing-md, 1rem)',
});

const getHeaderSubtitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-xl, 1.25rem)',
	color: 'var(--pingone-text-secondary)',
	maxWidth: '800px',
	margin: '0 auto',
	lineHeight: '1.6',
});

const getSectionStyle = () => ({
	background: 'var(--pingone-surface-card)',
	borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
	border: '1px solid var(--pingone-border-primary)',
});

const getSectionTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
});

const getSectionDescriptionStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
	lineHeight: '1.6',
});

const getTagStyle = () => ({
	display: 'inline-block',
	padding: '0.25rem 0.75rem',
	background: 'var(--pingone-surface-tertiary)',
	color: 'var(--pingone-text-tertiary)',
	borderRadius: 'var(--pingone-border-radius-full, 9999px)',
	fontSize: 'var(--pingone-font-size-xs, 0.75rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	marginRight: 'var(--pingone-spacing-xs, 0.25rem)',
	marginBottom: 'var(--pingone-spacing-xs, 0.25rem)',
});

const PingAIResourcesPingUI: React.FC = () => {
	usePageScroll({ pageName: 'Ping AI Resources', force: true });

	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'purple' as const,
		maxWidth: '1200px',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'ping-ai-resources',
	};
	const {
		PageContainer,
		ContentWrapper,
		FlowHeader: LayoutFlowHeader,
	} = PageLayoutService.createPageLayout(pageConfig);

	// AI Resources data
	const aiAgentResources = [
		{
			title: 'AI Agent Architecture Guide',
			description:
				'Comprehensive guide on designing secure AI agent architectures with proper identity and access management',
			icon: 'architecture',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/agent-architecture',
			tags: ['Architecture', 'Security'],
		},
		{
			title: 'AI Authentication Patterns',
			description:
				'Best practices for implementing authentication in AI applications and agent systems',
			icon: 'shield-check',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/authentication-patterns',
			tags: ['Authentication', 'Security'],
		},
		{
			title: 'AI Token Management',
			description: 'Managing tokens and credentials for AI workloads and automated systems',
			icon: 'key-variant',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/token-management',
			tags: ['Tokens', 'Credentials'],
		},
	];

	const aiIntegrationResources = [
		{
			title: 'PingOne AI Integration',
			description: 'Integrate PingOne identity services with AI platforms and applications',
			icon: 'integration-connector',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/integration',
			tags: ['Integration', 'Platform'],
		},
		{
			title: 'AI Security Best Practices',
			description: 'Security considerations and best practices for AI-powered identity solutions',
			icon: 'security',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/security',
			tags: ['Security', 'Best Practices'],
		},
		{
			title: 'AI API Documentation',
			description: 'Complete API reference for AI-related PingOne services and endpoints',
			icon: 'api',
			url: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#tag/AI',
			tags: ['API', 'Reference'],
		},
	];

	const aiDevelopmentResources = [
		{
			title: 'AI SDK Documentation',
			description: 'PingOne SDKs for AI applications with code examples and implementation guides',
			icon: 'code-braces',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/sdk',
			tags: ['SDK', 'Development'],
		},
		{
			title: 'AI Sample Applications',
			description: 'Sample applications demonstrating AI identity patterns and implementations',
			icon: 'application',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/samples',
			tags: ['Samples', 'Examples'],
		},
		{
			title: 'AI Testing Guide',
			description: 'Testing strategies and tools for AI-powered identity solutions',
			icon: 'test-tube',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/testing',
			tags: ['Testing', 'Quality'],
		},
	];

	const aiLearningResources = [
		{
			title: 'AI Fundamentals',
			description:
				'Understanding AI concepts and their relationship with identity and access management',
			icon: 'school',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/fundamentals',
			tags: ['Learning', 'Concepts'],
		},
		{
			title: 'AI Tutorials',
			description: 'Step-by-step tutorials for implementing AI identity solutions',
			icon: 'book-open-page-variant',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/tutorials',
			tags: ['Tutorials', 'Step-by-step'],
		},
		{
			title: 'AI Community',
			description: 'Community resources, forums, and discussions about AI identity solutions',
			icon: 'forum',
			url: 'https://docs.pingidentity.com/sdks/latest/ai/community',
			tags: ['Community', 'Support'],
		},
	];

	const renderResourceCard = (resource: any, index: number) => (
		<a
			key={index}
			href={resource.url}
			target="_blank"
			rel="noopener noreferrer"
			style={getResourceCardStyle()}
		>
			<h3 style={getResourceTitleStyle()}>
				<MDIIcon icon={resource.icon} style={getResourceIconStyle()} />
				{resource.title}
			</h3>
			<p style={getResourceDescriptionStyle()}>{resource.description}</p>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pingone-spacing-xs, 0.25rem)' }}>
				{resource.tags.map((tag: string, tagIndex: number) => (
					<span key={tagIndex} style={getTagStyle()}>
						{tag}
					</span>
				))}
			</div>
			<div style={getExternalLinkStyle()}>
				<MDIIcon icon="external-link" size={16} />
				View Documentation
			</div>
		</a>
	);

	return (
		<div className="end-user-nano">
			<PageContainer>
				<ContentWrapper>
					{LayoutFlowHeader && <LayoutFlowHeader />}

					<div style={getHeaderStyle()}>
						<h1 style={getHeaderTitleStyle()}>
							<MDIIcon icon="robot" size={40} />
							Ping Identity AI Resources
						</h1>
						<p style={getHeaderSubtitleStyle()}>
							Comprehensive collection of Ping Identity's AI-related documentation, guides, and
							resources for implementing AI-powered identity solutions
						</p>
					</div>

					{/* AI Agent Types & Architecture */}
					<CollapsibleHeader
						title="AI Agent Types & Architecture"
						subtitle="Understanding different types of AI agents and their identity requirements"
						icon={<MDIIcon icon="robot" size={20} />}
						theme="purple"
						defaultCollapsed={false}
					>
						<div style={getSectionStyle()}>
							<h3 style={getSectionTitleStyle()}>
								<MDIIcon icon="architecture" size={20} />
								Architecture Patterns
							</h3>
							<p style={getSectionDescriptionStyle()}>
								Explore different AI agent architectures and their identity management requirements
							</p>
							<div style={getResourceGridStyle()}>{aiAgentResources.map(renderResourceCard)}</div>
						</div>
					</CollapsibleHeader>

					{/* AI Integration */}
					<CollapsibleHeader
						title="AI Integration"
						subtitle="Integrating PingOne with AI platforms and applications"
						icon={<MDIIcon icon="integration-connector" size={20} />}
						theme="purple"
						defaultCollapsed={false}
					>
						<div style={getSectionStyle()}>
							<h3 style={getSectionTitleStyle()}>
								<MDIIcon icon="puzzle" size={20} />
								Integration Resources
							</h3>
							<p style={getSectionDescriptionStyle()}>
								Tools and guides for integrating PingOne identity services with AI applications
							</p>
							<div style={getResourceGridStyle()}>
								{aiIntegrationResources.map(renderResourceCard)}
							</div>
						</div>
					</CollapsibleHeader>

					{/* AI Development */}
					<CollapsibleHeader
						title="AI Development"
						subtitle="SDKs, samples, and development tools for AI applications"
						icon={<MDIIcon icon="code-braces" size={20} />}
						theme="purple"
						defaultCollapsed={false}
					>
						<div style={getSectionStyle()}>
							<h3 style={getSectionTitleStyle()}>
								<MDIIcon icon="code" size={20} />
								Development Resources
							</h3>
							<p style={getSectionDescriptionStyle()}>
								Development tools, SDKs, and sample code for building AI-powered identity solutions
							</p>
							<div style={getResourceGridStyle()}>
								{aiDevelopmentResources.map(renderResourceCard)}
							</div>
						</div>
					</CollapsibleHeader>

					{/* AI Learning */}
					<CollapsibleHeader
						title="AI Learning"
						subtitle="Tutorials, guides, and learning materials for AI identity solutions"
						icon={<MDIIcon icon="school" size={20} />}
						theme="purple"
						defaultCollapsed={false}
					>
						<div style={getSectionStyle()}>
							<h3 style={getSectionTitleStyle()}>
								<MDIIcon icon="book-open-page-variant" size={20} />
								Learning Resources
							</h3>
							<p style={getSectionDescriptionStyle()}>
								Educational materials, tutorials, and guides for understanding AI identity concepts
							</p>
							<div style={getResourceGridStyle()}>
								{aiLearningResources.map(renderResourceCard)}
							</div>
						</div>
					</CollapsibleHeader>

					{/* Additional Resources */}
					<div style={getSectionStyle()}>
						<h3 style={getSectionTitleStyle()}>
							<MDIIcon icon="help-circle" size={20} />
							Additional Resources
						</h3>
						<p style={getSectionDescriptionStyle()}>
							Additional resources and support for AI identity implementations
						</p>
						<div style={getResourceGridStyle()}>
							{[
								{
									title: 'AI Support Center',
									description: 'Get help and support for AI identity implementations',
									icon: 'help-circle',
									url: 'https://support.pingidentity.com/ai',
									tags: ['Support', 'Help'],
								},
								{
									title: 'AI Blog',
									description: 'Latest news and updates about AI identity solutions',
									icon: 'blog',
									url: 'https://www.pingidentity.com/blog/ai',
									tags: ['Blog', 'News'],
								},
								{
									title: 'AI Webinars',
									description: 'Recorded webinars and presentations about AI identity',
									icon: 'video',
									url: 'https://www.pingidentity.com/webinars/ai',
									tags: ['Webinars', 'Videos'],
								},
							].map(renderResourceCard)}
						</div>
					</div>
				</ContentWrapper>
			</PageContainer>
		</div>
	);
};

export default PingAIResourcesPingUI;
