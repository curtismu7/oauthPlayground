/**
 * @file About.PingUI.tsx
 * @module pages
 * @description About page with PingOne UI styling
 * @version 1.0.0
 * @since 2026-02-22
 */

import { usePageScroll } from '../hooks/usePageScroll';
import { APP_VERSION, MFA_V8_VERSION, UNIFIED_V8U_VERSION } from '../version';

// Bootstrap Icon Component (migrated from MDI)
import BootstrapIcon from '@/components/BootstrapIcon';
import { getBootstrapIconName } from '@/components/iconMapping';

// Main Component
export default function AboutPingUI() {
	// Ensure page starts at top
	usePageScroll({ pageName: 'About', force: true });

	return (
		<div className="end-user-nano">
			<style>
				{`
					.about-pingui {
						max-width: 1200px;
						margin: 0 auto;
						padding: var(--ping-spacing-lg, 1.5rem);
						font-family: var(--ping-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
					}

					.about-pingui .header-card {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
						box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
					}

					.about-pingui .header-content {
						display: flex;
						align-items: flex-start;
						gap: var(--ping-spacing-lg, 1.5rem);
						margin-bottom: var(--ping-spacing-md, 1rem);
					}

					.about-pingui .header-icon {
						background: var(--ping-color-primary-light, #dbeafe);
						color: var(--ping-color-primary, #3b82f6);
						width: 64px;
						height: 64px;
						border-radius: var(--ping-radius-lg, 0.75rem);
						display: flex;
						align-items: center;
						justify-content: center;
						flex-shrink: 0;
					}

					.about-pingui .header-text h1 {
						font-size: var(--ping-font-size-3xl, 2.5rem);
						font-weight: var(--ping-font-weight-bold, 700);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-sm, 0.5rem);
						line-height: 1.2;
					}

					.about-pingui .header-text p {
						font-size: var(--ping-font-size-lg, 1.125rem);
						color: var(--ping-text-secondary, #666);
						line-height: 1.6;
					}

					.about-pingui .version-badge {
						background: var(--ping-color-primary-light, #dbeafe);
						border: 1px solid var(--ping-color-primary, #3b82f6);
						border-radius: var(--ping-radius-md, 0.5rem);
						padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
					}

					.about-pingui .version-badge h3 {
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-color-primary, #3b82f6);
						margin-bottom: var(--ping-spacing-xs, 0.25rem);
					}

					.about-pingui .version-info {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
						gap: var(--ping-spacing-xs, 0.25rem);
					}

					.about-pingui .version-info div {
						font-size: var(--ping-font-size-sm, 0.875rem);
						color: var(--ping-color-primary-dark, #1e40af);
					}

					.about-pingui .content-section {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
						box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
					}

					.about-pingui .section-header {
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-sm, 0.5rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.about-pingui .section-header h2 {
						font-size: var(--ping-font-size-2xl, 2rem);
						font-weight: var(--ping-font-weight-bold, 700);
						color: var(--ping-text-primary, #1a1a1a);
					}

					.about-pingui .section-header .icon {
						color: var(--ping-color-primary, #3b82f6);
					}

					.about-pingui .section-content {
						color: var(--ping-text-secondary, #666);
						line-height: 1.7;
					}

					.about-pingui .section-content p {
						margin-bottom: var(--ping-spacing-md, 1rem);
					}

					.about-pingui .section-content strong {
						color: var(--ping-text-primary, #1a1a1a);
						font-weight: var(--ping-font-weight-semibold, 600);
					}

					.about-pingui .feature-grid {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
						gap: var(--ping-spacing-lg, 1.5rem);
						margin-top: var(--ping-spacing-lg, 1.5rem);
					}

					.about-pingui .feature-card {
						background: var(--ping-surface-secondary, #f8fafc);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-md, 0.5rem);
						padding: var(--ping-spacing-lg, 1.5rem);
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.about-pingui .feature-card:hover {
						background: var(--ping-surface-tertiary, #f1f5f9);
						border-color: var(--ping-border-primary, #d1d5db);
						transform: translateY(-2px);
						box-shadow: var(--ping-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
					}

					.about-pingui .feature-card h3 {
						font-size: var(--ping-font-size-lg, 1.125rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-sm, 0.5rem);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-xs, 0.25rem);
					}

					.about-pingui .feature-card p {
						font-size: var(--ping-font-size-sm, 0.875rem);
						color: var(--ping-text-secondary, #666);
						line-height: 1.5;
					}

					.about-pingui .stats-grid {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
						gap: var(--ping-spacing-md, 1rem);
						margin-top: var(--ping-spacing-lg, 1.5rem);
					}

					.about-pingui .stat-card {
						background: var(--ping-gradient-primary, linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%));
						color: var(--ping-color-white, #ffffff);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-lg, 1.5rem);
						text-align: center;
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.about-pingui .stat-card:hover {
						transform: translateY(-2px);
						box-shadow: var(--ping-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
					}

					.about-pingui .stat-number {
						font-size: var(--ping-font-size-3xl, 2.5rem);
						font-weight: var(--ping-font-weight-bold, 700);
						margin-bottom: var(--ping-spacing-xs, 0.25rem);
					}

					.about-pingui .stat-label {
						font-size: var(--ping-font-size-sm, 0.875rem);
						opacity: 0.9;
					}

					.about-pingui .contact-grid {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
						gap: var(--ping-spacing-lg, 1.5rem);
						margin-top: var(--ping-spacing-lg, 1.5rem);
					}

					.about-pingui .contact-item {
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-md, 1rem);
						padding: var(--ping-spacing-md, 1rem);
						background: var(--ping-surface-secondary, #f8fafc);
						border-radius: var(--ping-radius-md, 0.5rem);
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.about-pingui .contact-item:hover {
						background: var(--ping-surface-tertiary, #f1f5f9);
						transform: translateX(4px);
					}

					.about-pingui .contact-icon {
						color: var(--ping-color-primary, #3b82f6);
						flex-shrink: 0;
					}

					.about-pingui .contact-text h4 {
						font-size: var(--ping-font-size-base, 1rem);
						font-weight: var(--ping-font-weight-semibold, 600);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-xs, 0.25rem);
					}

					.about-pingui .contact-text p {
						font-size: var(--ping-font-size-sm, 0.875rem);
						color: var(--ping-text-secondary, #666);
					}

					.about-pingui .footer {
						text-align: center;
						padding: var(--ping-spacing-xl, 2rem);
						margin-top: var(--ping-spacing-xl, 2rem);
						border-top: 1px solid var(--ping-border-light, #e5e7eb);
					}

					.about-pingui .footer p {
						color: var(--ping-text-secondary, #666);
						font-size: var(--ping-font-size-sm, 0.875rem);
					}

					.about-pingui .footer .heart {
						color: var(--ping-color-error, #ef4444);
					}

					@media (max-width: 768px) {
						.about-pingui {
							padding: var(--ping-spacing-md, 1rem);
						}

						.about-pingui .header-content {
							flex-direction: column;
							text-align: center;
						}

						.about-pingui .header-icon {
							margin: 0 auto var(--ping-spacing-md, 1rem);
						}

						.about-pingui .version-info {
							grid-template-columns: 1fr;
						}

						.about-pingui .feature-grid,
						.about-pingui .stats-grid,
						.about-pingui .contact-grid {
							grid-template-columns: 1fr;
						}
					}
				`}
			</style>

			<div className="about-pingui">
				{/* Header */}
				<div className="header-card">
					<div className="header-content">
						<div className="header-icon">
							<BootstrapIcon icon={getBootstrapIconName('book')} size={32} aria-label="Documentation" />
						</div>
						<div className="header-text">
							<h1>PingOne MasterFlow API Documentation</h1>
							<p>Complete guide to what the PingOne MasterFlow API does and how to use it</p>
						</div>
					</div>
					<div className="version-badge">
						<h3>Versions</h3>
						<div className="version-info">
							<div>
								<strong>App:</strong> {APP_VERSION}
							</div>
							<div>
								<strong>MFA (v8):</strong> {MFA_V8_VERSION}
							</div>
							<div>
								<strong>Unified (v8u):</strong> {UNIFIED_V8U_VERSION}
							</div>
						</div>
					</div>
				</div>

				{/* Content Sections */}
				<div className="content-section">
					<div className="section-header">
						<BootstrapIcon icon={getBootstrapIconName('target')} size={24} className="icon" />
						<h2>Overview</h2>
					</div>
					<div className="section-content">
						<p>
							The <strong>PingOne MasterFlow API</strong> is a comprehensive PingOne API integration
							and testing platform designed to help developers learn, test, and master OAuth 2.0 and
							OpenID Connect (OIDC) flows using PingOne as the identity provider.
						</p>
						<p>
							Built with modern web technologies and following PingOne UI design principles, this
							platform provides an intuitive interface for exploring authentication flows, managing
							credentials, and understanding the intricacies of identity and access management.
						</p>
					</div>
				</div>

				{/* Key Features */}
				<div className="content-section">
					<div className="section-header">
						<BootstrapIcon icon={getBootstrapIconName('star')} size={24} className="icon" />
						<h2>Key Features</h2>
					</div>
					<div className="section-content">
						<div className="feature-grid">
							<div className="feature-card">
								<h3>
									<BootstrapIcon icon={getBootstrapIconName('code')} size={16} />
									Interactive OAuth Flows
								</h3>
								<p>
									Step-by-step implementation of all major OAuth 2.0 and OIDC flows with real-time
									token exchange and validation.
								</p>
							</div>
							<div className="feature-card">
								<h3>
									<BootstrapIcon icon={getBootstrapIconName('shield')} size={16} />
									MFA Integration
								</h3>
								<p>
									Complete multi-factor authentication support including SMS, Email, TOTP, and FIDO2
									with PingOne MFA services.
								</p>
							</div>
							<div className="feature-card">
								<h3>
									<BootstrapIcon icon={getBootstrapIconName('tools')} size={16} />
									Developer Tools
								</h3>
								<p>
									Comprehensive debugging tools, token inspectors, and API call monitoring for
									development and testing.
								</p>
							</div>
							<div className="feature-card">
								<h3>
									<BootstrapIcon icon={getBootstrapIconName('school')} size={16} />
									Educational Content
								</h3>
								<p>
									In-depth documentation, tutorials, and best practices for OAuth 2.0, OIDC, and
									PingOne integration.
								</p>
							</div>
							<div className="feature-card">
								<h3>
									<BootstrapIcon icon={getBootstrapIconName('api')} size={16} />
									Postman Collection
								</h3>
								<p>
									Automatically generated Postman collections for all flows with proper
									authentication and configuration.
								</p>
							</div>
							<div className="feature-card">
								<h3>
									<BootstrapIcon icon={getBootstrapIconName('puzzle')} size={16} />
									Flow Comparison
								</h3>
								<p>
									Side-by-side comparison of different OAuth flows to understand their differences
									and use cases.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Platform Statistics */}
				<div className="content-section">
					<div className="section-header">
						<BootstrapIcon icon={getBootstrapIconName('chart')} size={24} className="icon" />
						<h2>Platform Statistics</h2>
					</div>
					<div className="section-content">
						<div className="stats-grid">
							<div className="stat-card">
								<div className="stat-number">15+</div>
								<div className="stat-label">OAuth Flows</div>
							</div>
							<div className="stat-card">
								<div className="stat-number">8</div>
								<div className="stat-label">MFA Methods</div>
							</div>
							<div className="stat-card">
								<div className="stat-number">100+</div>
								<div className="stat-label">API Endpoints</div>
							</div>
							<div className="stat-card">
								<div className="stat-number">50+</div>
								<div className="stat-label">Code Examples</div>
							</div>
						</div>
					</div>
				</div>

				{/* Getting Started */}
				<div className="content-section">
					<div className="section-header">
						<BootstrapIcon icon={getBootstrapIconName('rocket')} size={24} className="icon" />
						<h2>Getting Started</h2>
					</div>
					<div className="section-content">
						<p>Ready to explore the MasterFlow API? Here's how to get started:</p>
						<ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
							<li>
								<strong>Configure Your Environment:</strong> Set up your PingOne application
								credentials in the Configuration page.
							</li>
							<li>
								<strong>Choose a Flow:</strong> Start with the Authorization Code Flow for the most
								common OAuth 2.0 implementation.
							</li>
							<li>
								<strong>Follow the Steps:</strong> Each flow provides step-by-step guidance with
								explanations and code examples.
							</li>
							<li>
								<strong>Test and Learn:</strong> Use the built-in tools to test tokens, inspect
								responses, and understand the flow.
							</li>
						</ol>
					</div>
				</div>

				{/* Contact & Support */}
				<div className="content-section">
					<div className="section-header">
						<BootstrapIcon icon={getBootstrapIconName('help')} size={24} className="icon" />
						<h2>Contact & Support</h2>
					</div>
					<div className="section-content">
						<div className="contact-grid">
							<div className="contact-item">
								<BootstrapIcon icon={getBootstrapIconName('github')} size={20} className="contact-icon" />
								<div className="contact-text">
									<h4>GitHub Repository</h4>
									<p>View source code, report issues, and contribute to the project.</p>
								</div>
							</div>
							<div className="contact-item">
								<BootstrapIcon icon={getBootstrapIconName('email')} size={20} className="contact-icon" />
								<div className="contact-text">
									<h4>Email Support</h4>
									<p>Get help with technical questions and implementation guidance.</p>
								</div>
							</div>
							<div className="contact-item">
								<BootstrapIcon icon={getBootstrapIconName('web')} size={20} className="contact-icon" />
								<div className="contact-text">
									<h4>Documentation</h4>
									<p>Comprehensive guides and API references for all features.</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="footer">
					<p>
						Made with <BootstrapIcon icon={getBootstrapIconName('heart')} size={14} className="heart" /> for the PingOne developer
						community
					</p>
					<p>© 2026 MasterFlow API. Built with PingOne UI design system.</p>
				</div>
			</div>
		</div>
	);
}
