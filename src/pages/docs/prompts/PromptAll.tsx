import React from 'react';
import styled from 'styled-components';
import { PageLayoutService } from '../../../services/pageLayoutService';

// Create layout components at module level
const _promptsLayout = PageLayoutService.createPageLayout({
	flowType: 'documentation',
	theme: 'red',
	showHeader: true,
});

const ContentContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 1rem;
`;

const Description = styled.p`
	color: #6b7280;
	font-size: 1.125rem;
	margin-bottom: 2rem;
	line-height: 1.6;
`;

const Section = styled.section`
	margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
	font-size: 1.875rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
	border-bottom: 2px solid #ef4444;
	padding-bottom: 0.5rem;
`;

const PromptCard = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const PromptTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.75rem;
`;

const PromptDescription = styled.p`
	color: #6b7280;
	margin-bottom: 1rem;
	line-height: 1.6;
`;

const CodeBlock = styled.pre`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	overflow-x: auto;
	font-family: 'Courier New', monospace;
	font-size: 0.875rem;
	margin: 1rem 0;
`;

const Tag = styled.span`
	display: inline-block;
	background: #dbeafe;
	color: #1e40af;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 500;
	margin-right: 0.5rem;
	margin-bottom: 0.5rem;
`;

const PromptAll: React.FC = () => {
	const prompts = [
		// Authentication & OAuth Prompts
		{
			title: "OAuth 2.0 Authorization Code Flow",
			description: "Complete OAuth 2.0 authorization code flow with PKCE",
			category: "Authentication",
			prompt: `Implement OAuth 2.0 Authorization Code Flow with PKCE:
- Generate code verifier and code challenge
- Build authorization URL with proper parameters
- Handle authorization callback
- Exchange authorization code for access token
- Implement token refresh mechanism
- Store tokens securely with encryption
- Handle token expiration gracefully
- Include proper error handling for all OAuth errors`
		},
		{
			title: "OpenID Connect (OIDC) Integration",
			description: "Add OIDC identity layer to OAuth 2.0 flow",
			category: "Authentication",
			prompt: `Implement OpenID Connect integration:
- Add openid scope to OAuth flow
- Parse and validate ID tokens
- Extract user claims (sub, name, email, picture)
- Validate JWT signature and issuer
- Handle nonce parameter for replay protection
- Implement user session management
- Support multiple identity providers
- Add logout with ID token revocation`
		},
		{
			title: "Client Credentials Flow",
			description: "Machine-to-machine authentication using client credentials",
			category: "Authentication",
			prompt: `Implement OAuth 2.0 Client Credentials Flow:
- Use client ID and client secret for authentication
- Support JWT client assertion authentication
- Handle token caching for performance
- Implement automatic token refresh
- Add proper scope management
- Support multiple client configurations
- Include token introspection capabilities
- Add rate limiting for token requests`
		},
		{
			title: "Device Authorization Flow",
			description: "OAuth flow for devices with limited input capabilities",
			category: "Authentication",
			prompt: `Implement OAuth 2.0 Device Authorization Flow:
- Initiate device authorization request
- Display user code and verification URI
- Poll for token completion
- Handle device authorization expiration
- Support multiple device types
- Add QR code generation for mobile apps
- Implement device user confirmation flow
- Handle device authorization errors gracefully`
		},
		
		// Security Prompts
		{
			title: "Multi-Factor Authentication (MFA)",
			description: "Implement comprehensive MFA with multiple methods",
			category: "Security",
			prompt: `Implement Multi-Factor Authentication system:
- TOTP (Time-based One-Time Password) support
- SMS and email verification codes
- Biometric authentication (fingerprint, face ID)
- FIDO2/WebAuthn passkey support
- Hardware token integration (YubiKey)
- Adaptive authentication based on risk
- Backup codes for account recovery
- MFA enrollment and management flow`
		},
		{
			title: "JWT Token Security",
			description: "Secure JWT implementation with proper validation",
			category: "Security",
			prompt: `Implement secure JWT token handling:
- RS256 asymmetric key signing
- Proper token validation (signature, expiration, issuer)
- Token revocation and blacklist management
- Short-lived access tokens with refresh tokens
- Secure token storage (httpOnly cookies, secure storage)
- Token binding to client/device
- Implement token introspection endpoint
- Add token leakage detection`
		},
		{
			title: "API Security Hardening",
			description: "Comprehensive API security implementation",
			category: "Security",
			prompt: `Implement API security measures:
- Rate limiting with token bucket algorithm
- API key management and rotation
- Request signing and validation
- CORS configuration for cross-origin requests
- Input validation and sanitization
- SQL injection and XSS prevention
- Security headers (HSTS, CSP, X-Frame-Options)
- Security audit logging and monitoring`
		},
		{
			title: "Zero Trust Architecture",
			description: "Implement zero trust security principles",
			category: "Security",
			prompt: `Implement Zero Trust security model:
- Verify every request regardless of source
- Implement principle of least privilege
- Continuous authentication and authorization
- Micro-segmentation of network access
- Device trust assessment
- Behavioral analytics for anomaly detection
- Just-in-time access provisioning
- Comprehensive audit trails`
		},

		// Token Management Prompts
		{
			title: "Token Storage & Encryption",
			description: "Secure token storage with encryption at rest",
			category: "Token Management",
			prompt: `Implement secure token storage:
- AES-256 encryption for token storage
- Hardware security module (HSM) integration
- Key rotation and management
- Secure key derivation (PBKDF2, scrypt)
- Token isolation per user/tenant
- Backup and recovery mechanisms
- Secure token deletion and cleanup
- Compliance with data protection regulations`
		},
		{
			title: "Token Refresh Optimization",
			description: "Intelligent token refresh with performance optimization",
			category: "Token Management",
			prompt: `Implement optimized token refresh:
- Proactive token refresh before expiration
- Parallel refresh requests deduplication
- Token refresh retry with exponential backoff
- Refresh token rotation for security
- Token cache management with TTL
- Background refresh for seamless UX
- Handle refresh token revocation
- Performance metrics and monitoring`
		},
		{
			title: "Token Introspection & Validation",
			description: "Token validation and introspection services",
			category: "Token Management",
			prompt: `Implement token introspection service:
- RFC 7662 token introspection endpoint
- Token metadata and claims extraction
- Token status checking (active, expired, revoked)
- Batch token validation for performance
- Token scope validation
- Token audience verification
- Custom token validation rules
- Token usage analytics and reporting`
		},
		{
			title: "Cross-Domain Token Sharing",
			description: "Secure token sharing across multiple domains",
			category: "Token Management",
			prompt: `Implement secure cross-domain token sharing:
- OAuth 2.0 Token Exchange (RFC 8693)
- JWT token translation and mapping
- Domain-specific token issuance
- Secure token bridging services
- Token federation across services
- Domain trust relationships
- Token lifecycle management
- Audit trails for token sharing`
		},

		// Performance Prompts
		{
			title: "API Response Optimization",
			description: "Optimize API responses for maximum performance",
			category: "Performance",
			prompt: `Implement API response optimization:
- HTTP response compression (gzip, brotli)
- Response caching with ETags and Last-Modified
- Pagination and field selection
- Response payload minimization
- Concurrent request handling
- Response time monitoring
- CDN integration for static assets
- Performance budget enforcement`
		},
		{
			title: "Database Connection Pooling",
			description: "Optimize database connections for high performance",
			category: "Performance",
			prompt: `Implement database connection pooling:
- Configure optimal pool size
- Connection timeout and retry logic
- Read replica utilization
- Query result caching
- Connection health monitoring
- Database failover handling
- Performance metrics collection
- Load balancing across database nodes`
		},
		{
			title: "Caching Strategy Implementation",
			description: "Multi-layer caching for optimal performance",
			category: "Performance",
			prompt: `Implement comprehensive caching strategy:
- Redis distributed caching
- Application-level caching
- CDN edge caching
- Database query result caching
- Cache invalidation strategies
- Cache warming and preloading
- Cache performance monitoring
- Cache hit ratio optimization`
		},
		{
			title: "Async Processing & Queues",
			description: "Implement asynchronous processing for scalability",
			category: "Performance",
			prompt: `Implement async processing with queues:
- Message queue implementation (RabbitMQ, SQS)
- Background job processing
- Task scheduling and cron jobs
- Dead letter queue handling
- Job retry mechanisms
- Distributed task coordination
- Performance monitoring of queues
- Horizontal scaling of workers`
		},

		// Error Handling Prompts
		{
			title: "Comprehensive Error Handling",
			description: "Robust error handling with proper user feedback",
			category: "Error Handling",
			prompt: `Implement comprehensive error handling:
- Structured error response format
- Error classification and categorization
- User-friendly error messages
- Error correlation IDs for debugging
- Error logging and monitoring
- Graceful degradation strategies
- Error recovery mechanisms
- Error reporting and analytics`
		},
		{
			title: "Circuit Breaker Pattern",
			description: "Implement circuit breaker for fault tolerance",
			category: "Error Handling",
			prompt: `Implement circuit breaker pattern:
- Failure threshold configuration
- Timeout and retry policies
- Circuit state management (CLOSED, OPEN, HALF_OPEN)
- Fallback mechanisms
- Health check endpoints
- Circuit breaker monitoring
- Automatic recovery detection
- Performance impact measurement`
		},
		{
			title: "Retry Mechanisms",
			description: "Intelligent retry logic for transient failures",
			category: "Error Handling",
			prompt: `Implement intelligent retry mechanisms:
- Exponential backoff with jitter
- Retry condition detection
- Maximum retry limits
- Retry budget management
- Idempotent operation handling
- Retry state persistence
- Retry performance monitoring
- Retry failure escalation`
		},

		// Monitoring & Analytics Prompts
		{
			title: "Application Performance Monitoring",
			description: "Comprehensive APM implementation",
			category: "Monitoring",
			prompt: `Implement application performance monitoring:
- Request tracing and profiling
- Performance metrics collection
- Real-time dashboards and alerts
- Error rate and latency tracking
- Resource utilization monitoring
- User experience metrics
- Performance baseline establishment
- Anomaly detection and alerting`
		},
		{
			title: "Security Event Monitoring",
			description: "Security monitoring and threat detection",
			category: "Monitoring",
			prompt: `Implement security event monitoring:
- Real-time security event collection
- Threat detection and analysis
- Security incident response
- Vulnerability scanning integration
- Security metrics dashboard
- Compliance reporting
- Security audit trails
- Automated security alerts`
		},
		{
			title: "Business Analytics Integration",
			description: "Business intelligence and analytics",
			category: "Monitoring",
			prompt: `Implement business analytics:
- User behavior tracking
- Feature usage analytics
- Conversion funnel analysis
- A/B testing framework
- Business KPI monitoring
- Custom event tracking
- Analytics dashboard
- Data export and reporting`
		},

		// Development & DevOps Prompts
		{
			title: "CI/CD Pipeline Setup",
			description: "Complete continuous integration and deployment",
			category: "DevOps",
			prompt: `Implement CI/CD pipeline:
- Automated testing integration
- Code quality checks (linting, security scanning)
- Build optimization and caching
- Multi-environment deployments
- Rollback strategies
- Blue-green deployments
- Canary releases
- Deployment monitoring and alerts`
		},
		{
			title: "Infrastructure as Code",
			description: "Infrastructure automation and management",
			category: "DevOps",
			prompt: `Implement infrastructure as code:
- Terraform/CloudFormation templates
- Environment configuration management
- Automated provisioning
- Infrastructure monitoring
- Cost optimization strategies
- Security hardening automation
- Backup and disaster recovery
- Compliance automation`
		},
		{
			title: "Container Orchestration",
			description: "Kubernetes deployment and management",
			category: "DevOps",
			prompt: `Implement container orchestration:
- Kubernetes deployment manifests
- Service mesh integration
- Autoscaling configuration
- Health checks and readiness probes
- Configuration management
- Secret management
- Monitoring and logging
- Rolling updates and maintenance`
		}
	];

	return (
		<_promptsLayout.PageContainer>
			<_promptsLayout.PageHeader />
			<_promptsLayout.ContentWrapper>
				<ContentContainer>
					<Title>Complete Prompts Guide</Title>
					<Description>
						Comprehensive collection of 25+ development prompts covering authentication, security, 
						token management, performance, error handling, monitoring, and DevOps best practices 
						for MasterFlow API integration and enterprise-grade application development.
					</Description>

					<Section>
						<SectionTitle>Authentication Prompts</SectionTitle>
						{prompts.filter(p => p.category === 'Authentication').map((prompt, index) => (
							<PromptCard key={index}>
								<PromptTitle>{prompt.title}</PromptTitle>
								<Tag>{prompt.category}</Tag>
								<PromptDescription>{prompt.description}</PromptDescription>
								<CodeBlock>{prompt.prompt}</CodeBlock>
							</PromptCard>
						))}
					</Section>

					<Section>
						<SectionTitle>Security Prompts</SectionTitle>
						{prompts.filter(p => p.category === 'Security').map((prompt, index) => (
							<PromptCard key={index}>
								<PromptTitle>{prompt.title}</PromptTitle>
								<Tag>{prompt.category}</Tag>
								<PromptDescription>{prompt.description}</PromptDescription>
								<CodeBlock>{prompt.prompt}</CodeBlock>
							</PromptCard>
						))}
					</Section>

					<Section>
						<SectionTitle>Token Management Prompts</SectionTitle>
						{prompts.filter(p => p.category === 'Token Management').map((prompt, index) => (
							<PromptCard key={index}>
								<PromptTitle>{prompt.title}</PromptTitle>
								<Tag>{prompt.category}</Tag>
								<PromptDescription>{prompt.description}</PromptDescription>
								<CodeBlock>{prompt.prompt}</CodeBlock>
							</PromptCard>
						))}
					</Section>

					<Section>
						<SectionTitle>Performance Prompts</SectionTitle>
						{prompts.filter(p => p.category === 'Performance').map((prompt, index) => (
							<PromptCard key={index}>
								<PromptTitle>{prompt.title}</PromptTitle>
								<Tag>{prompt.category}</Tag>
								<PromptDescription>{prompt.description}</PromptDescription>
								<CodeBlock>{prompt.prompt}</CodeBlock>
							</PromptCard>
						))}
					</Section>

					<Section>
						<SectionTitle>Error Handling Prompts</SectionTitle>
						{prompts.filter(p => p.category === 'Error Handling').map((prompt, index) => (
							<PromptCard key={index}>
								<PromptTitle>{prompt.title}</PromptTitle>
								<Tag>{prompt.category}</Tag>
								<PromptDescription>{prompt.description}</PromptDescription>
								<CodeBlock>{prompt.prompt}</CodeBlock>
							</PromptCard>
						))}
					</Section>

					<Section>
						<SectionTitle>Monitoring & Analytics Prompts</SectionTitle>
						{prompts.filter(p => p.category === 'Monitoring').map((prompt, index) => (
							<PromptCard key={index}>
								<PromptTitle>{prompt.title}</PromptTitle>
								<Tag>{prompt.category}</Tag>
								<PromptDescription>{prompt.description}</PromptDescription>
								<CodeBlock>{prompt.prompt}</CodeBlock>
							</PromptCard>
						))}
					</Section>

					<Section>
						<SectionTitle>DevOps Prompts</SectionTitle>
						{prompts.filter(p => p.category === 'DevOps').map((prompt, index) => (
							<PromptCard key={index}>
								<PromptTitle>{prompt.title}</PromptTitle>
								<Tag>{prompt.category}</Tag>
								<PromptDescription>{prompt.description}</PromptDescription>
								<CodeBlock>{prompt.prompt}</CodeBlock>
							</PromptCard>
						))}
					</Section>

					<Section>
						<SectionTitle>Additional Resources</SectionTitle>
						<PromptCard>
							<PromptTitle>Related Documentation</PromptTitle>
							<PromptDescription>
								For more detailed migration instructions and engineering guidelines, see the 
								<a href="/docs/migration/migrate-vscode">VSCode Migration Guide</a> and 
								<a href="/docs/prompts/prompt-all.md">Engineering Safety Rules</a>.
							</PromptDescription>
							<PromptDescription>
								These prompts are designed to help you implement comprehensive, production-ready 
								features following security best practices and modern development standards.
							</PromptDescription>
						</PromptCard>
					</Section>
				</ContentContainer>
			</_promptsLayout.ContentWrapper>
		</_promptsLayout.PageContainer>
	);
};

export default PromptAll;
