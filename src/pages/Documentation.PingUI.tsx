/**
 * @file Documentation.PingUI.tsx
 * @module pages
 * @description Documentation page with PingOne UI styling
 * @version 1.0.0
 * @since 2026-02-22
 */

import { Link } from 'react-router-dom';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';

// MDI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 20, ariaLabel, className = '', style }) => {
	const iconMap: Record<string, string> = {
		FiBookOpen: 'mdi-book-open-variant',
		FiCode: 'mdi-code-tags',
		FiExternalLink: 'mdi-open-in-new',
		FiHelpCircle: 'mdi-help-circle',
		FiLock: 'mdi-lock',
		FiPlay: 'mdi-play',
		FiSettings: 'mdi-cog',
		FiShield: 'mdi-shield',
		FiTool: 'mdi-tools',
		FiArrowUp: 'mdi-arrow-up',
	};

	const iconClass = iconMap[icon] || icon;
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			title={ariaLabel}
			aria-hidden={!ariaLabel}
		/>
	);
};

// Main Component
const DocumentationPingUI: React.FC = () => {
	const { scrollToTopAfterAction } = usePageScroll();

	const handleScrollToTop = () => {
		scrollToTopAfterAction();
	};

	const docCategories = [
		{
			title: 'Getting Started',
			description: 'Learn the basics of OAuth 2.0 and OpenID Connect',
			icon: 'FiBookOpen',
			items: [
				{
					title: 'OAuth 2.0 Fundamentals',
					description: 'Understanding the core concepts of OAuth 2.0',
					link: '/docs/oauth2-fundamentals',
				},
				{
					title: 'OpenID Connect Basics',
					description: 'Learn how OIDC builds on OAuth 2.0',
					link: '/docs/oidc-basics',
				},
				{
					title: 'Quick Start Guide',
					description: 'Get up and running in minutes',
					link: '/docs/quick-start',
				},
			],
		},
		{
			title: 'API Reference',
			description: 'Detailed API documentation and examples',
			icon: 'FiCode',
			items: [
				{
					title: 'Authorization Endpoint',
					description: 'OAuth 2.0 authorization server endpoint',
					link: '/docs/auth-endpoint',
				},
				{
					title: 'Token Endpoint',
					description: 'Access token and refresh token operations',
					link: '/docs/token-endpoint',
				},
				{
					title: 'UserInfo Endpoint',
					description: 'Retrieve user profile information',
					link: '/docs/userinfo-endpoint',
				},
			],
		},
		{
			title: 'Security',
			description: 'Security best practices and guidelines',
			icon: 'FiShield',
			items: [
				{
					title: 'Security Best Practices',
					description: 'Essential security considerations',
					link: '/docs/security-best-practices',
				},
				{
					title: 'PKCE (Proof Key for Code Exchange)',
					description: 'Enhanced security for public clients',
					link: '/docs/pkce',
				},
				{
					title: 'Token Security',
					description: 'Secure token storage and handling',
					link: '/docs/token-security',
				},
			],
		},
		{
			title: 'Tutorials',
			description: 'Step-by-step guides and examples',
			icon: 'FiPlay',
			items: [
				{
					title: 'Build Your First OAuth App',
					description: 'Complete tutorial from scratch',
					link: '/docs/first-oauth-app',
				},
				{
					title: 'Advanced Flows',
					description: 'Complex OAuth 2.0 flow implementations',
					link: '/docs/advanced-flows',
				},
				{
					title: 'Debugging OAuth',
					description: 'Common issues and solutions',
					link: '/docs/debugging',
				},
			],
		},
		{
			title: 'Tools & Utilities',
			description: 'Helpful tools for OAuth development',
			icon: 'FiTool',
			items: [
				{
					title: 'Token Debugger',
					description: 'Analyze and debug JWT tokens',
					link: '/token-debugger',
				},
				{
					title: 'URL Decoder',
					description: 'Decode URL-encoded parameters',
					link: '/url-decoder',
				},
				{
					title: 'Code Generator',
					description: 'Generate OAuth 2.0 code samples',
					link: '/code-generator',
				},
			],
		},
		{
			title: 'Configuration',
			description: 'Setup and configuration guides',
			icon: 'FiSettings',
			items: [
				{
					title: 'Environment Setup',
					description: 'Configure your development environment',
					link: '/configuration',
				},
				{
					title: 'Client Registration',
					description: 'Register your OAuth client',
					link: '/docs/client-registration',
				},
				{
					title: 'Redirect URIs',
					description: 'Configure callback URLs',
					link: '/docs/redirect-uris',
				},
			],
		},
	];

	return (
		<div className="end-user-nano">
			<style>
				{`
					.documentation-pingui {
						max-width: 1200px;
						margin: 0 auto;
						padding: var(--ping-spacing-lg, 2rem);
						font-family: var(--ping-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
					}

					.documentation-pingui h1 {
						font-size: var(--ping-font-size-3xl, 2.5rem);
						font-weight: var(--ping-font-weight-bold, 700);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-md, 1rem);
						text-align: center;
					}

					.documentation-pingui .subtitle {
						font-size: var(--ping-font-size-lg, 1.125rem);
						color: var(--ping-text-secondary, #666);
						text-align: center;
						margin-bottom: var(--ping-spacing-xl, 3rem);
						max-width: 600px;
						margin-left: auto;
						margin-right: auto;
					}

					.doc-category {
						margin-bottom: var(--ping-spacing-xl, 3rem);
					}

					.doc-category h2 {
						font-size: var(--ping-font-size-2xl, 2rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-sm, 0.5rem);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
					}

					.doc-category .description {
						font-size: var(--ping-font-size-base, 1rem);
						color: var(--ping-text-secondary, #666);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.doc-grid {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
						gap: var(--ping-spacing-lg, 1.5rem);
					}

					.doc-card {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-lg, 1.5rem);
						text-decoration: none;
						color: inherit;
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
						display: block;
					}

					.doc-card:hover {
						background: var(--ping-surface-secondary, #f8fafc);
						border-color: var(--ping-border-primary, #d1d5db);
						transform: translateY(-2px);
						box-shadow: var(--ping-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
					}

					.doc-card h3 {
						font-size: var(--ping-font-size-lg, 1.125rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-sm, 0.5rem);
						display: flex;
						align-items: center;
						justify-content: space-between;
					}

					.doc-card .external-link {
						color: var(--ping-color-primary, #3b82f6);
						opacity: 0.7;
						transition: opacity var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.doc-card:hover .external-link {
						opacity: 1;
					}

					.doc-card p {
						font-size: var(--ping-font-size-sm, 0.875rem);
						color: var(--ping-text-secondary, #666);
						line-height: 1.5;
						margin: 0;
					}

					.scroll-to-top {
						position: fixed;
						bottom: var(--ping-spacing-lg, 1.5rem);
						right: var(--ping-spacing-lg, 1.5rem);
						background: var(--ping-color-primary, #3b82f6);
						color: var(--ping-color-white, #ffffff);
						border: none;
						border-radius: var(--ping-radius-full, 9999px);
						padding: var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem);
						cursor: pointer;
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-xs, 0.25rem);
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
						box-shadow: var(--ping-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
					}

					.scroll-to-top:hover {
						background: var(--ping-color-primary-dark, #2563eb);
						transform: translateY(-1px);
						box-shadow: var(--ping-shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
					}

					@media (max-width: 768px) {
						.documentation-pingui {
							padding: var(--ping-spacing-md, 1rem);
						}

						.doc-grid {
							grid-template-columns: 1fr;
						}

						.scroll-to-top {
							bottom: var(--ping-spacing-md, 1rem);
							right: var(--ping-spacing-md, 1rem);
						}
					}
				`}
			</style>

			<div className="documentation-pingui">
				<CollapsibleHeader title="Documentation">Documentation</CollapsibleHeader>

				<h1>Documentation</h1>
				<p className="subtitle">
					Comprehensive guides, API references, and tutorials for OAuth 2.0, OpenID Connect, and
					PingOne integration
				</p>

				{docCategories.map((category, index) => (
					<div key={index} className="doc-category">
						<h2>
							<MDIIcon icon={category.icon} size={24} ariaLabel={category.title} />
							{category.title}
						</h2>
						<p className="description">{category.description}</p>
						<div className="doc-grid">
							{category.items.map((item, itemIndex) => (
								<Link key={itemIndex} to={item.link} className="doc-card">
									<h3>
										{item.title}
										<MDIIcon
											icon="FiExternalLink"
											size={16}
											className="external-link"
											ariaLabel="External link"
										/>
									</h3>
									<p>{item.description}</p>
								</Link>
							))}
						</div>
					</div>
				))}

				<button type="button" className="scroll-to-top" onClick={handleScrollToTop}>
					<MDIIcon icon="FiArrowUp" size={16} ariaLabel="Scroll to top" />
					Back to Top
				</button>
			</div>
		</div>
	);
};

export default DocumentationPingUI;
