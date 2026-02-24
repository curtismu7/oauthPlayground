/**
 * @file SecurityGuidesPage.tsx
 * @description Security best practices and guides for OAuth 2.0 implementations
 * @version 9.27.0
 */

import React, { useState } from 'react';
import {
	FiActivity,
	FiAlertTriangle,
	FiBook,
	FiCheckCircle,
	FiCopy,
	FiDatabase,
	FiDownload,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiKey,
	FiLock,
	FiRefreshCw,
	FiShield,
	FiUsers,
} from 'react-icons/fi';
import styled from 'styled-components';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';
import { PageHeaderTextColors, PageHeaderV8 } from '@/v8/components/shared/PageHeaderV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const _MODULE_TAG = '[🔒 SECURITY-GUIDES]';

interface SecurityGuide {
	id: string;
	title: string;
	description: string;
	category: 'authentication' | 'authorization' | 'tokens' | 'api' | 'infrastructure' | 'compliance';
	level: 'beginner' | 'intermediate' | 'advanced';
	content: string;
	checklist: SecurityChecklist[];
	resources: SecurityResource[];
}

interface SecurityChecklist {
	item: string;
	completed: boolean;
	critical: boolean;
}

interface SecurityResource {
	title: string;
	url: string;
	type: 'documentation' | 'tool' | 'standard' | 'article';
}

const Container = styled.div`
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;
`;

const Section = styled.div`
	background: white;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 1.5rem;
	margin: 1.5rem 0;
`;

const GuideCard = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	transition: all 0.3s ease;
	
	&:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
`;

const GuideTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const GuideDescription = styled.p`
	color: #6b7280;
	font-size: 0.875rem;
	margin: 0 0 1rem 0;
`;

const CategoryBadge = styled.span<{ $category: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	
	${({ $category }) => {
		switch ($category) {
			case 'authentication':
				return 'background: #3b82f6; color: white;';
			case 'authorization':
				return 'background: #10b981; color: white;';
			case 'tokens':
				return 'background: #f59e0b; color: white;';
			case 'api':
				return 'background: #8b5cf6; color: white;';
			case 'infrastructure':
				return 'background: #ef4444; color: white;';
			case 'compliance':
				return 'background: #6b7280; color: white;';
			default:
				return 'background: #6b7280; color: white;';
		}
	}}
`;

const LevelBadge = styled.span<{ $level: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	
	${({ $level }) => {
		switch ($level) {
			case 'beginner':
				return 'background: #10b981; color: white;';
			case 'intermediate':
				return 'background: #f59e0b; color: white;';
			case 'advanced':
				return 'background: #ef4444; color: white;';
			default:
				return 'background: #6b7280; color: white;';
		}
	}}
`;

const ContentArea = styled.div`
	background: #f8fafc;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin: 1rem 0;
`;

const Checklist = styled.div`
	margin: 1rem 0;
`;

const ChecklistItem = styled.div<{ $completed: boolean; $critical: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem;
	margin: 0.25rem 0;
	border-radius: 0.25rem;
	background: ${({ $completed }) => ($completed ? '#f0fdf4' : '#fef3c7')};
	border: 1px solid ${({ $critical }) => ($critical ? '#ef4444' : '#e5e7eb')};
	
	&:hover {
		background: ${({ $completed }) => ($completed ? '#dcfce7' : '#fed7aa')};
	}
`;

const ResourceList = styled.div`
	margin: 1rem 0;
`;

const ResourceItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem;
	margin: 0.5rem 0;
	background: #f8fafc;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	
	&:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}
`;

const FilterBar = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 1.5rem;
	flex-wrap: wrap;
	align-items: center;
`;

const Select = styled.select`
	padding: 0.5rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

// Mock security guides data
const mockSecurityGuides: SecurityGuide[] = [
	{
		id: 'oauth-security-basics',
		title: 'OAuth 2.0 Security Basics',
		description: 'Essential security practices for OAuth 2.0 implementations',
		category: 'authentication',
		level: 'beginner',
		content: `OAuth 2.0 is a powerful framework for authorization, but it must be implemented correctly to maintain security. This guide covers the fundamental security practices that every OAuth 2.0 implementation should follow.

## Key Security Principles

1. **Always use HTTPS**: Never transmit OAuth tokens over unencrypted connections
2. **Validate all inputs**: Sanitize and validate all parameters and tokens
3. **Use short-lived tokens**: Minimize the impact of token compromise
4. **Implement proper scope management**: Grant minimum necessary permissions

## Common Security Pitfalls

- Storing access tokens in localStorage
- Not validating redirect URIs
- Using weak client secrets
- Missing CSRF protection
- Improper token expiration handling

## Best Practices

- Use PKCE (Proof Key for Code Exchange) for public clients
- Implement token binding when possible
- Use secure cookie settings for session tokens
- Regular token rotation and refresh`,
		checklist: [
			{ item: 'Use HTTPS for all OAuth endpoints', completed: false, critical: true },
			{ item: 'Validate redirect URIs against whitelist', completed: false, critical: true },
			{ item: 'Implement PKCE for mobile/native apps', completed: false, critical: true },
			{ item: 'Use short-lived access tokens', completed: false, critical: true },
			{ item: 'Store tokens securely (HttpOnly cookies)', completed: false, critical: true },
			{ item: 'Implement CSRF protection', completed: false, critical: false },
			{ item: 'Log and monitor OAuth events', completed: false, critical: false },
		],
		resources: [
			{
				title: 'OAuth 2.0 Security Best Practices',
				url: 'https://tools.ietf.org/html/rfc6819',
				type: 'standard',
			},
			{
				title: 'OAuth 2.0 Threat Model and Security Considerations',
				url: 'https://datatracker.ietf.org/doc/html/rfc6819',
				type: 'documentation',
			},
			{
				title: 'OWASP OAuth 2.0 Cheat Sheet',
				url: 'https://cheatsheetseries.owasp.org/cheatsheets/OAuth_2_0_Cheat_Sheet.html',
				type: 'article',
			},
		],
	},
	{
		id: 'token-security',
		title: 'Token Security Management',
		description: 'Advanced techniques for secure token handling and storage',
		category: 'tokens',
		level: 'intermediate',
		content: `Token security is critical for maintaining the integrity of your OAuth 2.0 implementation. This guide covers advanced techniques for token management, storage, and protection.

## Token Types and Security

### Access Tokens
- Keep access tokens short-lived (minutes to hours)
- Use appropriate scopes to limit access
- Implement token binding when possible

### Refresh Tokens
- Store refresh tokens securely (HttpOnly cookies)
- Use refresh token rotation
- Implement refresh token revocation
- Consider one-time use refresh tokens

### ID Tokens
- Always validate ID token signatures
- Check issuer and audience claims
- Verify token expiration
- Validate nonce for replay protection

## Secure Token Storage

### Client-Side Storage
- **Recommended**: HttpOnly, Secure cookies
- **Avoid**: localStorage, sessionStorage
- **Consider**: Memory storage for sensitive applications

### Server-Side Storage
- Use encrypted storage
- Implement proper access controls
- Regular token cleanup and rotation

## Token Binding Techniques

- Use mTLS for enhanced security
- Implement token binding with client certificates
- Consider DPoP (Demonstrating Proof of Possession)`,
		checklist: [
			{ item: 'Implement access token expiration within 1 hour', completed: false, critical: true },
			{ item: 'Use refresh token rotation', completed: false, critical: true },
			{ item: 'Store tokens in HttpOnly, Secure cookies', completed: false, critical: true },
			{ item: 'Validate all token signatures', completed: false, critical: true },
			{ item: 'Implement token revocation mechanism', completed: false, critical: true },
			{ item: 'Use mTLS for sensitive operations', completed: false, critical: false },
			{ item: 'Implement DPoP for enhanced security', completed: false, critical: false },
		],
		resources: [
			{
				title: 'JWT Best Practices',
				url: 'https://auth0.com/blog/jwt-best-practices/',
				type: 'article',
			},
			{
				title: 'Token Binding for OAuth 2.0',
				url: 'https://tools.ietf.org/html/rfc8471',
				type: 'standard',
			},
			{
				title: 'OAuth 2.0 Token Binding',
				url: 'https://datatracker.ietf.org/doc/html/rfc8471',
				type: 'documentation',
			},
		],
	},
	{
		id: 'api-security',
		title: 'API Security Hardening',
		description: 'Comprehensive guide to securing OAuth-protected APIs',
		category: 'api',
		level: 'advanced',
		content: `Securing APIs that use OAuth 2.0 requires a multi-layered approach. This guide covers advanced techniques for API security hardening.

## API Gateway Security

### Rate Limiting
- Implement per-client rate limits
- Use token-based rate limiting
- Consider burst capacity for legitimate traffic

### Input Validation
- Validate all request parameters
- Sanitize input data
- Use parameterized queries for database access
- Implement request size limits

### CORS Configuration
- Configure CORS policies carefully
- Use specific origins instead of wildcards
- Validate preflight requests
- Consider CORS for public APIs only

## Advanced Security Measures

### API Key Management
- Use API keys in addition to OAuth tokens
- Implement API key rotation
- Store API keys securely
- Monitor API key usage

### Request Signing
- Implement request signing for sensitive APIs
- Use HMAC for request integrity
- Validate timestamps to prevent replay attacks
- Consider mutual TLS for high-security APIs

### Monitoring and Logging
- Log all API access attempts
- Monitor for anomalous behavior
- Implement real-time threat detection
- Use security analytics tools

## Defense in Depth

### Web Application Firewall
- Deploy WAF for API protection
- Configure rules for common attacks
- Monitor WAF logs regularly
- Update WAF rules frequently

### DDoS Protection
- Implement DDoS mitigation
- Use CDN for traffic distribution
- Configure rate limiting per IP
- Have emergency response plans`,
		checklist: [
			{ item: 'Implement rate limiting per client', completed: false, critical: true },
			{ item: 'Validate all input parameters', completed: false, critical: true },
			{ item: 'Configure CORS policies properly', completed: false, critical: true },
			{ item: 'Implement request signing for sensitive APIs', completed: false, critical: true },
			{ item: 'Deploy Web Application Firewall', completed: false, critical: true },
			{ item: 'Implement DDoS protection', completed: false, critical: false },
			{ item: 'Use security monitoring and analytics', completed: false, critical: false },
		],
		resources: [
			{
				title: 'OWASP API Security Top 10',
				url: 'https://owasp.org/www-project-api-security/',
				type: 'documentation',
			},
			{
				title: 'API Security Best Practices',
				url: 'https://owasp.org/www-project-api-security/',
				type: 'article',
			},
			{
				title: 'OAuth 2.0 for Browser-Based Apps',
				url: 'https://tools.ietf.org/html/draft-ietf-oauth-browser-based-apps',
				type: 'standard',
			},
		],
	},
];

export const SecurityGuidesPage: React.FC = () => {
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [selectedLevel, setSelectedLevel] = useState('all');
	const [selectedGuide, setSelectedGuide] = useState<SecurityGuide | null>(null);
	const [checklist, setChecklist] = useState<SecurityChecklist[]>([]);
	const [copiedText, setCopiedText] = useState('');

	const filteredGuides = mockSecurityGuides.filter((guide) => {
		const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
		const matchesLevel = selectedLevel === 'all' || guide.level === selectedLevel;
		return matchesCategory && matchesLevel;
	});

	const handleGuideSelect = (guide: SecurityGuide) => {
		setSelectedGuide(guide);
		setChecklist(guide.checklist.map((item) => ({ ...item })));
	};

	const handleChecklistToggle = (index: number) => {
		const newChecklist = [...checklist];
		newChecklist[index].completed = !newChecklist[index].completed;
		setChecklist(newChecklist);
	};

	const copyToClipboard = (text: string, type: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				setCopiedText(type);
				toastV8.success(`${type} copied to clipboard`);
				setTimeout(() => setCopiedText(''), 2000);
			})
			.catch(() => {
				toastV8.error('Failed to copy to clipboard');
			});
	};

	const exportChecklist = () => {
		if (!selectedGuide) return;

		const checklistText = checklist
			.filter((item) => !item.completed)
			.map((item) => `${item.critical ? '🔴' : '🟡'} ${item.item}`)
			.join('\n');

		const fullText = `Security Checklist: ${selectedGuide.title}\n\n${checklistText}`;

		const blob = new Blob([fullText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `security-checklist-${selectedGuide.id}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toastV8.success('Checklist exported successfully');
	};

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case 'authentication':
				return <FiShield />;
			case 'authorization':
				return <FiKey />;
			case 'tokens':
				return <FiLock />;
			case 'api':
				return <FiDatabase />;
			case 'infrastructure':
				return <FiActivity />;
			case 'compliance':
				return <FiUsers />;
			default:
				return <FiShield />;
		}
	};

	const getLevelColor = (level: string) => {
		switch (level) {
			case 'beginner':
				return '#10b981';
			case 'intermediate':
				return '#f59e0b';
			case 'advanced':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	};

	return (
		<Container>
			<PageHeaderV8
				title="Security Guides & Best Practices"
				subtitle="Comprehensive security guides for OAuth 2.0 and identity implementations"
				gradient="#ef4444"
				textColor={PageHeaderTextColors.white}
			/>

			<Section>
				<SectionTitle>
					<FiFilter />
					Security Guides ({filteredGuides.length})
				</SectionTitle>

				<FilterBar>
					<Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
						<option value="all">All Categories</option>
						<option value="authentication">Authentication</option>
						<option value="authorization">Authorization</option>
						<option value="tokens">Tokens</option>
						<option value="api">API</option>
						<option value="infrastructure">Infrastructure</option>
						<option value="compliance">Compliance</option>
					</Select>

					<Select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
						<option value="all">All Levels</option>
						<option value="beginner">Beginner</option>
						<option value="intermediate">Intermediate</option>
						<option value="advanced">Advanced</option>
					</Select>
				</FilterBar>

				{filteredGuides.length === 0 ? (
					<div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
						<FiShield size={24} style={{ marginBottom: '1rem' }} />
						<div>No security guides found matching your filters</div>
					</div>
				) : (
					<Grid>
						{filteredGuides.map((guide) => (
							<GuideCard key={guide.id}>
								<GuideTitle>
									{getCategoryIcon(guide.category)}
									{guide.title}
								</GuideTitle>
								<GuideDescription>{guide.description}</GuideDescription>

								<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
									<CategoryBadge $category={guide.category}>{guide.category}</CategoryBadge>
									<LevelBadge $level={guide.level}>{guide.level}</LevelBadge>
								</div>

								<BootstrapButton
									variant="primary"
									onClick={() => handleGuideSelect(guide)}
									style={{ width: '100%' }}
								>
									<FiBook />
									View Guide
								</BootstrapButton>
							</GuideCard>
						))}
					</Grid>
				)}
			</Section>

			{selectedGuide && (
				<Section>
					<SectionTitle>
						<FiBook />
						{selectedGuide.title}
					</SectionTitle>

					<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
						<CategoryBadge $category={selectedGuide.category}>
							{selectedGuide.category}
						</CategoryBadge>
						<LevelBadge $level={selectedGuide.level}>{selectedGuide.level}</LevelBadge>
					</div>

					<ContentArea>
						<div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>{selectedGuide.content}</div>
					</ContentArea>

					<h3 style={{ margin: '2rem 0 1rem 0', color: '#1f2937' }}>Security Checklist</h3>

					<Checklist>
						{checklist.map((item, index) => (
							<ChecklistItem key={index} $completed={item.completed} $critical={item.critical}>
								<input
									type="checkbox"
									checked={item.completed}
									onChange={() => handleChecklistToggle(index)}
									style={{ cursor: 'pointer' }}
								/>
								{item.completed ? (
									<FiCheckCircle color="#10b981" />
								) : (
									<FiAlertTriangle color={item.critical ? '#ef4444' : '#f59e0b'} />
								)}
								<span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
									{item.item}
								</span>
								{item.critical && (
									<span style={{ color: '#ef4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
										CRITICAL
									</span>
								)}
							</ChecklistItem>
						))}
					</Checklist>

					<ActionButtons>
						<BootstrapButton variant="primary" onClick={exportChecklist}>
							<FiDownload />
							Export Checklist
						</BootstrapButton>

						<BootstrapButton
							variant="secondary"
							onClick={() => {
								const checklistText = checklist
									.filter((item) => !item.completed)
									.map((item) => `${item.critical ? '🔴' : '🟡'} ${item.item}`)
									.join('\n');
								copyToClipboard(checklistText, 'Checklist');
							}}
						>
							{copiedText === 'Checklist' ? <FiRefreshCw /> : <FiCopy />}
							{copiedText === 'Checklist' ? 'Copied!' : 'Copy Checklist'}
						</BootstrapButton>
					</ActionButtons>

					<h3 style={{ margin: '2rem 0 1rem 0', color: '#1f2937' }}>Additional Resources</h3>

					<ResourceList>
						{selectedGuide.resources.map((resource, index) => (
							<ResourceItem key={index}>
								<div>
									<strong>{resource.title}</strong>
									<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
										{resource.type}
									</div>
								</div>
								<BootstrapButton
									variant="secondary"
									onClick={() => window.open(resource.url, '_blank')}
									style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
								>
									Open
								</BootstrapButton>
							</ResourceItem>
						))}
					</ResourceList>

					<ActionButtons>
						<BootstrapButton variant="secondary" onClick={() => setSelectedGuide(null)}>
							Close
						</BootstrapButton>
					</ActionButtons>
				</Section>
			)}

			<Section>
				<SectionTitle>
					<FiInfo />
					Security Overview
				</SectionTitle>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: '1.5rem',
					}}
				>
					<div
						style={{
							background: '#f0fdf4',
							border: '1px solid #bbf7d0',
							borderRadius: '0.375rem',
							padding: '1rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Critical Security Items</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Always use HTTPS for OAuth endpoints</li>
							<li>Validate all redirect URIs</li>
							<li>Use short-lived access tokens</li>
							<li>Store tokens securely (HttpOnly cookies)</li>
							<li>Implement proper scope management</li>
						</ul>
					</div>

					<div
						style={{
							background: '#fef3c7',
							border: '1px solid #fcd34d',
							borderRadius: '0.375rem',
							padding: '1rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>Common Vulnerabilities</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li>Token leakage through logs</li>
							<li>Insecure token storage</li>
							<li>Missing CSRF protection</li>
							<li>Weak client secrets</li>
							<li>Improper input validation</li>
						</ul>
					</div>

					<div
						style={{
							background: '#eff6ff',
							border: '1px solid #bfdbfe',
							borderRadius: '0.375rem',
							padding: '1rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Security Tools</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e40af' }}>
							<li>OWASP ZAP for security testing</li>
							<li>Burp Suite for API analysis</li>
							<li>JWT.io for token debugging</li>
							<li>OAuth 2.0 Playground for testing</li>
							<li>Security headers scanners</li>
						</ul>
					</div>
				</div>
			</Section>
		</Container>
	);
};

export default SecurityGuidesPage;
