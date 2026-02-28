import React from 'react';
import { FiBook, FiMessageCircle, FiSearch, FiZap } from 'react-icons/fi';

const styles = {
	container: {
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '40px 20px',
	} as React.CSSProperties,

	header: {
		textAlign: 'center' as const,
		marginBottom: '60px',
	} as React.CSSProperties,

	title: {
		fontSize: '48px',
		marginBottom: '16px',
		background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	} as React.CSSProperties,

	subtitle: {
		fontSize: '20px',
		color: '#666',
	} as React.CSSProperties,

	content: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '60px',
	} as React.CSSProperties,

	section: {
		background: 'white',
		borderRadius: '16px',
		padding: '40px',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
	} as React.CSSProperties,

	sectionTitle: {
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
		fontSize: '28px',
		marginBottom: '24px',
		color: '#333',
	} as React.CSSProperties,

	description: {
		fontSize: '16px',
		lineHeight: '1.6',
		color: '#666',
		marginBottom: '24px',
	} as React.CSSProperties,

	featureList: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '16px',
	} as React.CSSProperties,

	featureItem: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '16px',
		padding: '16px',
		background: '#f8f9fa',
		borderRadius: '12px',
	} as React.CSSProperties,

	icon: {
		fontSize: '24px',
		flexShrink: 0,
	} as React.CSSProperties,

	featureText: {
		fontSize: '16px',
		lineHeight: '1.5',
		color: '#333',
	} as React.CSSProperties,

	stepList: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '24px',
	} as React.CSSProperties,

	step: {
		display: 'flex',
		gap: '20px',
	} as React.CSSProperties,

	stepNumber: {
		width: '40px',
		height: '40px',
		borderRadius: '50%',
		background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
		color: 'white',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: 600,
		fontSize: '18px',
		flexShrink: 0,
	} as React.CSSProperties,

	stepContent: {
		flex: 1,
	} as React.CSSProperties,

	stepTitle: {
		fontSize: '18px',
		marginBottom: '8px',
		color: '#333',
	} as React.CSSProperties,

	stepDescription: {
		fontSize: '15px',
		lineHeight: '1.6',
		color: '#666',
	} as React.CSSProperties,

	purpleText: {
		color: '#667eea',
		fontWeight: 600,
	} as React.CSSProperties,

	examplesGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
		gap: '24px',
	} as React.CSSProperties,

	exampleCard: {
		padding: '24px',
		background: '#f8f9fa',
		borderRadius: '12px',
		borderLeft: '4px solid #667eea',
	} as React.CSSProperties,

	exampleCategory: {
		fontWeight: 600,
		fontSize: '14px',
		color: '#667eea',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.5px',
		marginBottom: '16px',
	} as React.CSSProperties,

	exampleQuestion: {
		fontSize: '14px',
		color: '#333',
		padding: '8px 0',
		fontStyle: 'italic' as const,
	} as React.CSSProperties,

	searchableContent: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
		gap: '24px',
	} as React.CSSProperties,

	contentCard: {
		padding: '24px',
		background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
		borderRadius: '12px',
		textAlign: 'center' as const,
	} as React.CSSProperties,

	contentIcon: {
		fontSize: '48px',
		marginBottom: '16px',
	} as React.CSSProperties,

	contentTitle: {
		fontSize: '20px',
		marginBottom: '12px',
		color: '#333',
	} as React.CSSProperties,

	contentDescription: {
		fontSize: '14px',
		lineHeight: '1.6',
		color: '#666',
	} as React.CSSProperties,

	callToAction: {
		textAlign: 'center' as const,
		padding: '60px 40px',
		background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
		borderRadius: '16px',
		color: 'white',
	} as React.CSSProperties,

	ctaTitle: {
		fontSize: '36px',
		marginBottom: '16px',
	} as React.CSSProperties,

	ctaDescription: {
		fontSize: '18px',
		marginBottom: '32px',
		opacity: 0.9,
	} as React.CSSProperties,

	ctaIcon: {
		animation: 'bounce 2s infinite',
	} as React.CSSProperties,
};

const AIAssistantDemo: React.FC = () => {
	return (
		<div style={styles.container}>
			<style>{`
				@keyframes bounce {
					0%, 100% { transform: translateY(0); }
					50% { transform: translateY(-10px); }
				}
			`}</style>
			<div style={styles.header}>
				<h1 style={styles.title}>🤖 AI Assistant</h1>
				<p style={styles.subtitle}>Your intelligent guide to OAuth &amp; OIDC</p>
			</div>

			<div style={styles.content}>
				<section style={styles.section}>
					<h2 style={styles.sectionTitle}>
						<FiMessageCircle size={24} />
						What is the AI Assistant?
					</h2>
					<p style={styles.description}>
						The AI Assistant is an intelligent chatbot built into the OAuth Playground that helps
						you:
					</p>
					<div style={styles.featureList}>
						<div style={styles.featureItem}>
							<div style={styles.icon}>🔍</div>
							<div style={styles.featureText}>
								<strong>Find the right OAuth flow</strong> for your application type
							</div>
						</div>
						<div style={styles.featureItem}>
							<div style={styles.icon}>💡</div>
							<div style={styles.featureText}>
								<strong>Understand concepts</strong> like PKCE, scopes, and tokens
							</div>
						</div>
						<div style={styles.featureItem}>
							<div style={styles.icon}>🎯</div>
							<div style={styles.featureText}>
								<strong>Navigate quickly</strong> to relevant documentation and features
							</div>
						</div>
						<div style={styles.featureItem}>
							<div style={styles.icon}>🔧</div>
							<div style={styles.featureText}>
								<strong>Troubleshoot issues</strong> with helpful guidance
							</div>
						</div>
					</div>
				</section>

				<section style={styles.section}>
					<h2 style={styles.sectionTitle}>
						<FiSearch size={24} />
						How to Use It
					</h2>
					<div style={styles.stepList}>
						<div style={styles.step}>
							<div style={styles.stepNumber}>1</div>
							<div style={styles.stepContent}>
								<h3 style={styles.stepTitle}>Open the Assistant</h3>
								<p style={styles.stepDescription}>
									Look for the <span style={styles.purpleText}>purple floating chat button</span> in
									the bottom-right corner of any page
								</p>
							</div>
						</div>
						<div style={styles.step}>
							<div style={styles.stepNumber}>2</div>
							<div style={styles.stepContent}>
								<h3 style={styles.stepTitle}>Ask Your Question</h3>
								<p style={styles.stepDescription}>
									Type any question about OAuth, OIDC, or the playground features
								</p>
							</div>
						</div>
						<div style={styles.step}>
							<div style={styles.stepNumber}>3</div>
							<div style={styles.stepContent}>
								<h3 style={styles.stepTitle}>Get Instant Answers</h3>
								<p style={styles.stepDescription}>
									Receive helpful answers with links to relevant resources
								</p>
							</div>
						</div>
						<div style={styles.step}>
							<div style={styles.stepNumber}>4</div>
							<div style={styles.stepContent}>
								<h3 style={styles.stepTitle}>Navigate Directly</h3>
								<p style={styles.stepDescription}>
									Click on suggested links to jump to flows, features, or documentation
								</p>
							</div>
						</div>
					</div>
				</section>

				<section style={styles.section}>
					<h2 style={styles.sectionTitle}>
						<FiZap size={24} />
						Example Questions
					</h2>
					<div style={styles.examplesGrid}>
						<div style={styles.exampleCard}>
							<div style={styles.exampleCategory}>Flow Selection</div>
							<div style={styles.exampleQuestion}>
								💬 &ldquo;Which flow should I use for my mobile app?&rdquo;
							</div>
							<div style={styles.exampleQuestion}>💬 &ldquo;How do I test device flows?&rdquo;</div>
							<div style={styles.exampleQuestion}>
								💬 &ldquo;What&apos;s the best flow for backend services?&rdquo;
							</div>
						</div>
						<div style={styles.exampleCard}>
							<div style={styles.exampleCategory}>Configuration</div>
							<div style={styles.exampleQuestion}>
								💬 &ldquo;How do I configure Authorization Code flow?&rdquo;
							</div>
							<div style={styles.exampleQuestion}>
								💬 &ldquo;How do I set up redirect URIs?&rdquo;
							</div>
							<div style={styles.exampleQuestion}>💬 &ldquo;What credentials do I need?&rdquo;</div>
						</div>
						<div style={styles.exampleCard}>
							<div style={styles.exampleCategory}>Concepts</div>
							<div style={styles.exampleQuestion}>💬 &ldquo;What is PKCE?&rdquo;</div>
							<div style={styles.exampleQuestion}>
								💬 &ldquo;What&apos;s the difference between OAuth and OIDC?&rdquo;
							</div>
							<div style={styles.exampleQuestion}>💬 &ldquo;Explain scopes and claims&rdquo;</div>
						</div>
						<div style={styles.exampleCard}>
							<div style={styles.exampleCategory}>Troubleshooting</div>
							<div style={styles.exampleQuestion}>💬 &ldquo;Redirect URI mismatch error&rdquo;</div>
							<div style={styles.exampleQuestion}>
								💬 &ldquo;How do I decode a JWT token?&rdquo;
							</div>
							<div style={styles.exampleQuestion}>💬 &ldquo;Token validation failed&rdquo;</div>
						</div>
					</div>
				</section>

				<section style={styles.section}>
					<h2 style={styles.sectionTitle}>
						<FiBook size={24} />
						What It Can Search
					</h2>
					<div style={styles.searchableContent}>
						<div style={styles.contentCard}>
							<div style={styles.contentIcon}>🔄</div>
							<h3 style={styles.contentTitle}>15+ OAuth Flows</h3>
							<p style={styles.contentDescription}>
								Authorization Code, Client Credentials, Device Code, Implicit, JWT Bearer, CIBA, and
								more
							</p>
						</div>
						<div style={styles.contentCard}>
							<div style={styles.contentIcon}>⚡</div>
							<h3 style={styles.contentTitle}>12+ Features</h3>
							<p style={styles.contentDescription}>
								PKCE, Token Inspector, Code Generator, MFA, Password Reset, Session Management, and
								more
							</p>
						</div>
						<div style={styles.contentCard}>
							<div style={styles.contentIcon}>📖</div>
							<h3 style={styles.contentTitle}>Documentation</h3>
							<p style={styles.contentDescription}>
								Setup guides, security best practices, troubleshooting, and PingOne configuration
							</p>
						</div>
					</div>
				</section>

				<div style={styles.callToAction}>
					<h2 style={styles.ctaTitle}>Try It Now!</h2>
					<p style={styles.ctaDescription}>
						Look for the purple chat button in the bottom-right corner and start asking questions.
					</p>
					<div style={styles.ctaIcon}>
						<FiMessageCircle size={48} />
					</div>
				</div>
			</div>
		</div>
	);
};

export default AIAssistantDemo;
