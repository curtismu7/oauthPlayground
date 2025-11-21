// src/pages/InteractiveFlowDiagram.tsx
// ⭐ V6 UPGRADE - Interactive OAuth/OIDC Flow Diagrams with Mermaid.js
import React from 'react';
import { FiGitBranch, FiKey, FiShield, FiUsers, FiZap } from 'react-icons/fi';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import InteractiveFlowDiagramService from '../services/interactiveFlowDiagramService';
import PageLayoutService from '../services/pageLayoutService';

const InteractiveFlowDiagram: React.FC = () => {
	usePageScroll({ pageName: 'Interactive Diagrams', force: true });

	// Use V6 pageLayoutService for consistent dimensions and FlowHeader integration
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem', // Wider for diagram content (1152px)
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'interactive-diagrams', // Enables FlowHeader integration
	};

	const {
		PageContainer,
		ContentWrapper,
		FlowHeader: LayoutFlowHeader,
	} = PageLayoutService.createPageLayout(pageConfig);

	// Create diagram components
	const AuthorizationCodeDiagram = InteractiveFlowDiagramService.createFlowDiagram({
		id: 'authz-code',
		title: 'Authorization Code Flow',
		description:
			'The most secure and recommended OAuth 2.0 flow for web applications with backend servers.',
		diagramType: 'oauth',
		interactive: true,
		showSteps: true,
		theme: 'default',
	});

	const OIDCDiagram = InteractiveFlowDiagramService.createFlowDiagram({
		id: 'oidc-code',
		title: 'OpenID Connect Authorization Code Flow',
		description:
			'OAuth 2.0 Authorization Code Flow extended with OpenID Connect for user authentication and identity.',
		diagramType: 'oidc',
		interactive: true,
		showSteps: true,
		theme: 'default',
	});

	const ImplicitDiagram = InteractiveFlowDiagramService.createFlowDiagram({
		id: 'implicit',
		title: 'Implicit Flow (Deprecated)',
		description:
			'OAuth 2.0 Implicit Flow - deprecated due to security concerns. Use Authorization Code Flow with PKCE instead.',
		diagramType: 'implicit',
		interactive: true,
		showSteps: true,
		theme: 'default',
	});

	const ClientCredentialsDiagram = InteractiveFlowDiagramService.createFlowDiagram({
		id: 'client-credentials',
		title: 'Client Credentials Flow',
		description:
			'OAuth 2.0 flow for machine-to-machine communication where no user interaction is required.',
		diagramType: 'client-credentials',
		interactive: true,
		showSteps: true,
		theme: 'default',
	});

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}

				<CollapsibleHeader
					title="OAuth 2.0 Authorization Code Flow"
					subtitle="The most secure and recommended OAuth 2.0 flow for web applications with backend servers. This flow provides the highest level of security by keeping access tokens on the server side."
					icon={<FiShield />}
					defaultCollapsed={false}
				>
					<div style={{ padding: '1.5rem' }}>
						<AuthorizationCodeDiagram />
					</div>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="OpenID Connect Authorization Code Flow"
					subtitle="OAuth 2.0 Authorization Code Flow extended with OpenID Connect for user authentication and identity information. This is the recommended flow for applications that need to authenticate users and access their profile information."
					icon={<FiUsers />}
					defaultCollapsed={false}
				>
					<div style={{ padding: '1.5rem' }}>
						<OIDCDiagram />
					</div>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Client Credentials Flow"
					subtitle="OAuth 2.0 flow designed for machine-to-machine communication where no user interaction is required. Commonly used for API access, server-to-server communication, and backend services."
					icon={<FiKey />}
					defaultCollapsed={false}
				>
					<div style={{ padding: '1.5rem' }}>
						<ClientCredentialsDiagram />
					</div>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Implicit Flow (Deprecated)"
					subtitle="OAuth 2.0 Implicit Flow has been deprecated due to security concerns. The access token is returned directly to the client, making it vulnerable to token theft. Use Authorization Code Flow with PKCE instead."
					icon={<FiZap />}
					defaultCollapsed={true}
				>
					<div style={{ padding: '1.5rem' }}>
						<div
							style={{
								background: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '8px',
								padding: '1rem',
								marginBottom: '1rem',
								color: '#dc2626',
							}}
						>
							<strong>⚠️ Security Warning:</strong> The Implicit Flow is deprecated and should not be
							used in new applications. It has been removed from OAuth 2.1 due to security
							vulnerabilities.
						</div>
						<ImplicitDiagram />
					</div>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Flow Comparison & Best Practices"
					subtitle="Compare different OAuth 2.0 and OpenID Connect flows, understand their security implications, and learn when to use each flow type."
					icon={<FiGitBranch />}
					defaultCollapsed={false}
				>
					<div style={{ padding: '1.5rem' }}>
						<div
							style={{
								background: '#f0f9ff',
								border: '1px solid #bae6fd',
								borderRadius: '8px',
								padding: '1.5rem',
								marginBottom: '1.5rem',
							}}
						>
							<h3 style={{ color: '#0c4a6e', marginBottom: '1rem' }}>Flow Selection Guidelines</h3>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
									gap: '1rem',
								}}
							>
								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '6px',
										border: '1px solid #e0f2fe',
									}}
								>
									<h4 style={{ color: '#0369a1', marginBottom: '0.5rem' }}>
										✅ Use Authorization Code Flow
									</h4>
									<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e' }}>
										<li>Web applications with backend servers</li>
										<li>Mobile applications</li>
										<li>SPAs with backend support</li>
										<li>Any application requiring high security</li>
									</ul>
								</div>

								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '6px',
										border: '1px solid #e0f2fe',
									}}
								>
									<h4 style={{ color: '#0369a1', marginBottom: '0.5rem' }}>
										✅ Use Client Credentials Flow
									</h4>
									<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e' }}>
										<li>Machine-to-machine communication</li>
										<li>API access without user context</li>
										<li>Server-to-server authentication</li>
										<li>Backend service integration</li>
									</ul>
								</div>

								<div
									style={{
										padding: '1rem',
										background: 'white',
										borderRadius: '6px',
										border: '1px solid #fecaca',
									}}
								>
									<h4 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>
										❌ Avoid Implicit Flow
									</h4>
									<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#991b1b' }}>
										<li>Deprecated in OAuth 2.1</li>
										<li>Security vulnerabilities</li>
										<li>Token exposure risks</li>
										<li>Use Authorization Code + PKCE instead</li>
									</ul>
								</div>
							</div>
						</div>

						<div
							style={{
								background: '#f0fdf4',
								border: '1px solid #bbf7d0',
								borderRadius: '8px',
								padding: '1.5rem',
							}}
						>
							<h3 style={{ color: '#14532d', marginBottom: '1rem' }}>Security Best Practices</h3>
							<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
								<li>
									<strong>Always use HTTPS:</strong> Encrypt all OAuth communications
								</li>
								<li>
									<strong>Implement PKCE:</strong> Use Proof Key for Code Exchange for additional
									security
								</li>
								<li>
									<strong>Validate state parameter:</strong> Prevent CSRF attacks
								</li>
								<li>
									<strong>Use short-lived tokens:</strong> Minimize exposure window
								</li>
								<li>
									<strong>Implement token refresh:</strong> Use refresh tokens for long-lived
									sessions
								</li>
								<li>
									<strong>Store tokens securely:</strong> Use secure storage mechanisms
								</li>
								<li>
									<strong>Validate all tokens:</strong> Always verify token signatures and claims
								</li>
							</ul>
						</div>
					</div>
				</CollapsibleHeader>
			</ContentWrapper>
		</PageContainer>
	);
};

export default InteractiveFlowDiagram;
