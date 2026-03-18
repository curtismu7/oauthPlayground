// src/pages/About.tsx
import styled from 'styled-components';
import { usePageScroll } from '../hooks/usePageScroll';
import {
	FiActivity,
	FiBook,
	FiCheckCircle,
	FiCode,
	FiCpu,
	FiGlobe,
	FiInfo,
	FiKey,
	FiLock,
	FiPackage,
	FiSearch,
	FiShield,
	FiStar,
	FiTool,
	FiTrendingUp,
	FiUsers,
	FiZap,
} from '../icons';
import { FlowHeader } from '../services/flowHeaderService';
import { APP_VERSION } from '../version';

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const Section = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	border: 1px solid #e5e7eb;
`;

const VersionBadge = styled.div`
	background: #dbeafe;
	border: 1px solid #93c5fd;
	border-radius: 0.75rem;
	padding: 1rem 1.5rem;
	margin-top: 1.5rem;
	display: flex;
	gap: 2rem;
	flex-wrap: wrap;
`;

const VersionItem = styled.div`
	.label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #1d4ed8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}
	.value {
		font-size: 0.95rem;
		font-weight: 700;
		color: #1e3a8a;
	}
`;

const SectionTitle = styled.h2`
	font-size: 1.4rem;
	font-weight: 700;
	color: #1f2937;
	margin: 0 0 1.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;

	svg {
		color: #2563eb;
		flex-shrink: 0;
	}
`;

const Grid = styled.div<{ $cols?: number }>`
	display: grid;
	grid-template-columns: repeat(${({ $cols }) => $cols ?? 2}, 1fr);
	gap: 1.25rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const FeatureCard = styled.div<{ $accent?: string }>`
	border: 1px solid ${({ $accent }) => $accent ?? '#e5e7eb'};
	border-radius: 0.75rem;
	padding: 1.25rem;
	background: ${({ $accent }) => ($accent ? `${$accent}12` : 'white')};

	h4 {
		font-size: 0.95rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.75rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;

		svg {
			color: ${({ $accent }) => $accent ?? '#2563eb'};
		}
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;

		li {
			font-size: 0.875rem;
			color: #4b5563;
			margin-bottom: 0.375rem;
			line-height: 1.5;
		}
	}
`;

const StatsBanner = styled.div`
	background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 1.5rem;
	color: white;
`;

const StatsBannerTitle = styled.h2`
	font-size: 1.4rem;
	font-weight: 700;
	color: white;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const StatsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 1rem;
	margin-top: 1.5rem;

	@media (max-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
	}
`;

const StatItem = styled.div`
	text-align: center;
	background: rgba(255, 255, 255, 0.15);
	border-radius: 0.5rem;
	padding: 1rem;

	.number {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}
	.desc {
		font-size: 0.8rem;
		opacity: 0.85;
	}
`;

export default function About() {
	usePageScroll({ pageName: 'About', force: true });

	return (
		<Container>
			<FlowHeader
				customConfig={{
					flowType: 'pingone',
					title: 'OAuth Playground — About',
					subtitle: 'Everything the PingOne MasterFlow API playground does',
					icon: '📚',
				}}
			/>

			{/* Header */}
			<Section>
				<div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
					<div style={{ fontSize: '3rem', lineHeight: 1 }}>📚</div>
					<div>
						<h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
							PingOne MasterFlow API Playground
						</h1>
						<p style={{ color: '#6b7280', marginTop: '0.5rem', lineHeight: 1.6, marginBottom: 0 }}>
							A hands-on PingOne OAuth 2.0 &amp; OIDC testing platform. Run real flows against your
							PingOne environment, explore mock flows offline, manage MFA devices, and learn through
							interactive guides — all in one place.
						</p>
					</div>
				</div>
				<VersionBadge>
					<VersionItem>
						<div className="label">App Version</div>
						<div className="value">{APP_VERSION}</div>
					</VersionItem>
					<VersionItem>
						<div className="label">Architecture</div>
						<div className="value">V9</div>
					</VersionItem>
					<VersionItem>
						<div className="label">Stack</div>
						<div className="value">React 18 + Node.js</div>
					</VersionItem>
				</VersionBadge>
			</Section>

			{/* Stats */}
			<StatsBanner>
				<StatsBannerTitle>
					<FiTrendingUp size={22} />
					What's Inside
				</StatsBannerTitle>
				<p style={{ opacity: 0.85, margin: 0, fontSize: '0.95rem' }}>
					A complete PingOne developer toolkit — real flows, mock flows, AI assistance, and
					reference documentation.
				</p>
				<StatsGrid>
					<StatItem>
						<div className="number">20+</div>
						<div className="desc">Mock OAuth Flows</div>
					</StatItem>
					<StatItem>
						<div className="number">4</div>
						<div className="desc">Real PingOne Apps</div>
					</StatItem>
					<StatItem>
						<div className="number">14+</div>
						<div className="desc">Developer Tools</div>
					</StatItem>
					<StatItem>
						<div className="number">AI</div>
						<div className="desc">MCP Agent Built-in</div>
					</StatItem>
				</StatsGrid>
			</StatsBanner>

			{/* Mock Flows */}
			<Section>
				<SectionTitle>
					<FiZap size={22} />
					Mock OAuth &amp; OIDC Flows
				</SectionTitle>
				<p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1.25rem' }}>
					Explore every major OAuth 2.0 and OIDC flow interactively — no PingOne credentials
					required. Each flow walks through the full protocol with live request/response inspection.
				</p>
				<Grid>
					<FeatureCard $accent="#059669">
						<h4>
							<FiCheckCircle size={16} />
							OIDC Flows
						</h4>
						<ul>
							<li>Authorization Code (with PKCE)</li>
							<li>Hybrid Flow</li>
							<li>CIBA (Backchannel Authentication)</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#2563eb">
						<h4>
							<FiActivity size={16} />
							OAuth 2.0 Flows
						</h4>
						<ul>
							<li>Device Authorization</li>
							<li>Client Credentials</li>
							<li>Implicit Flow</li>
							<li>JWT Bearer Token &amp; SAML Bearer Assertion</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#0891b2">
						<h4>
							<FiShield size={16} />
							Advanced / Emerging Flows
						</h4>
						<ul>
							<li>DPoP, RAR, PAR, mTLS, GNAP</li>
							<li>SPIFFE/SPIRE, WIMSE Workload Identity</li>
							<li>JAR + JARM (FAPI 2.0), Step-Up Auth</li>
							<li>Token Introspection, Attestation Client Auth</li>
							<li>Resource Owner Password (ROPC) — unsupported demo</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#d97706">
						<h4>
							<FiCpu size={16} />
							MCP &amp; Agent Flow
						</h4>
						<ul>
							<li>Mock MCP Agent Flow — simulate AI agent OAuth</li>
							<li>See how agents authenticate to APIs</li>
						</ul>
					</FeatureCard>
				</Grid>
			</Section>

			{/* Real PingOne Apps */}
			<Section>
				<SectionTitle>
					<FiGlobe size={22} />
					Real PingOne API Apps
				</SectionTitle>
				<p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1.25rem' }}>
					These run live against your PingOne environment using your worker token and credentials.
				</p>
				<Grid>
					<FeatureCard $accent="#059669">
						<h4>
							<FiUsers size={16} />
							Unified OAuth &amp; OIDC
						</h4>
						<ul>
							<li>Full authorization code + PKCE flow against real PingOne</li>
							<li>Live token exchange and UserInfo lookup</li>
							<li>Enhanced State Management (V2)</li>
							<li>Flow Comparison Tool</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#2563eb">
						<h4>
							<FiLock size={16} />
							Unified MFA
						</h4>
						<ul>
							<li>MFA device registration and management</li>
							<li>Push, SMS, TOTP, FIDO2 device flows</li>
							<li>Delete All Devices utility</li>
							<li>Token Monitoring Dashboard</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#0891b2">
						<h4>
							<FiKey size={16} />
							Tokens &amp; Session
						</h4>
						<ul>
							<li>Worker Token management (V9)</li>
							<li>Token Operations — introspect, revoke, refresh</li>
							<li>UserInfo Flow — compare worker vs. user tokens</li>
							<li>PingOne Logout &amp; Session management</li>
							<li>Redirectless Login Modal (V9)</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#d97706">
						<h4>
							<FiShield size={16} />
							Admin &amp; Platform
						</h4>
						<ul>
							<li>Organization Licensing info</li>
							<li>User Profile management</li>
							<li>Password Reset</li>
							<li>Advanced Security Settings</li>
							<li>Webhook Viewer &amp; Custom Domain Test</li>
						</ul>
					</FeatureCard>
				</Grid>
			</Section>

			{/* Setup & Configuration */}
			<Section>
				<SectionTitle>
					<FiTool size={22} />
					Setup &amp; Configuration
				</SectionTitle>
				<Grid $cols={3}>
					<FeatureCard $accent="#2563eb">
						<h4>
							<FiPackage size={16} />
							Configuration Management
						</h4>
						<ul>
							<li>Global credential storage across all flows</li>
							<li>Worker token with auto-fetch and expiry tracking</li>
							<li>Region selector (NA / EU / CA / AP / AU)</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#059669">
						<h4>
							<FiSearch size={16} />
							OIDC Discovery
						</h4>
						<ul>
							<li>Auto-discover issuer metadata</li>
							<li>Inspect JWKS, endpoints, and supported flows</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#0891b2">
						<h4>
							<FiGlobe size={16} />
							Environment Management
						</h4>
						<ul>
							<li>Multi-environment support</li>
							<li>Environment ID auto-detection</li>
							<li>PingOne region resolution</li>
						</ul>
					</FeatureCard>
				</Grid>
			</Section>

			{/* AI & Identity */}
			<Section>
				<SectionTitle>
					<FiCpu size={22} />
					AI &amp; Identity
				</SectionTitle>
				<Grid>
					<FeatureCard $accent="#2563eb">
						<h4>
							<FiCpu size={16} />
							MasterFlow Agent (MCP)
						</h4>
						<ul>
							<li>Built-in AI assistant powered by Model Context Protocol</li>
							<li>Ask questions about PingOne in natural language</li>
							<li>Guided OAuth flow walkthroughs</li>
							<li>Live PingOne API queries via MCP server</li>
							<li>MCP Server config &amp; documentation</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#0891b2">
						<h4>
							<FiBook size={16} />
							AI &amp; Identity Resources
						</h4>
						<ul>
							<li>AI Agent Overview &amp; Glossary</li>
							<li>Ping AI Resources &amp; Architectures</li>
							<li>OIDC for AI &amp; OAuth for AI guides</li>
							<li>AI Agent Auth IETF Draft reference</li>
							<li>PingOne AI Perspective</li>
						</ul>
					</FeatureCard>
				</Grid>
			</Section>

			{/* Documentation */}
			<Section>
				<SectionTitle>
					<FiBook size={22} />
					Documentation &amp; Reference
				</SectionTitle>
				<Grid>
					<FeatureCard $accent="#059669">
						<h4>
							<FiBook size={16} />
							Guides &amp; Specs
						</h4>
						<ul>
							<li>OIDC Overview &amp; Specifications</li>
							<li>OAuth 2.1 Specification</li>
							<li>OAuth 2.0 Security Best Practices</li>
							<li>V9 Migration Guide (V7/V8 → V9)</li>
							<li>OAuth Education Hub</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#2563eb">
						<h4>
							<FiStar size={16} />
							Comparison Guides
						</h4>
						<ul>
							<li>RAR vs PAR and DPoP Guide</li>
							<li>CIBA vs Device Authorization</li>
							<li>SPIFFE/SPIRE with PingOne</li>
							<li>OIDC Session Management</li>
							<li>Resources API Tutorial</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#0891b2">
						<h4>
							<FiInfo size={16} />
							Reference
						</h4>
						<ul>
							<li>OAuth Scopes Reference</li>
							<li>Advanced OAuth Parameters Demo</li>
							<li>PingOne Sessions API</li>
							<li>Mock &amp; Educational Features guide</li>
							<li>Complete Prompts Guide</li>
						</ul>
					</FeatureCard>
				</Grid>
			</Section>

			{/* Developer Tools */}
			<Section>
				<SectionTitle>
					<FiTool size={22} />
					Developer Tools
				</SectionTitle>
				<Grid>
					<FeatureCard $accent="#2563eb">
						<h4>
							<FiCode size={16} />
							Code Generation
						</h4>
						<ul>
							<li>OAuth Code Generator Hub</li>
							<li>Postman Collection Generator</li>
							<li>Application Generator</li>
							<li>Client Generator</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#059669">
						<h4>
							<FiSearch size={16} />
							Analysis &amp; Debug
						</h4>
						<ul>
							<li>JWKS Troubleshooting</li>
							<li>URL Decoder</li>
							<li>Ultimate Token Display</li>
							<li>Debug Log Viewer (V9)</li>
							<li>Service Test Runner</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#0891b2">
						<h4>
							<FiPackage size={16} />
							SDK &amp; Examples
						</h4>
						<ul>
							<li>SDK Sample App</li>
							<li>SDK Examples</li>
							<li>Code Examples library</li>
							<li>DaVinci Todo App</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#d97706">
						<h4>
							<FiActivity size={16} />
							Dashboards
						</h4>
						<ul>
							<li>Main Dashboard — environment overview</li>
							<li>Platform Dashboard — PingOne environment stats</li>
							<li>API Status — real-time backend health</li>
							<li>Protect Portal App</li>
						</ul>
					</FeatureCard>
				</Grid>
			</Section>

			{/* Architecture */}
			<Section>
				<SectionTitle>
					<FiCode size={22} />
					Technical Architecture
				</SectionTitle>
				<Grid $cols={3}>
					<FeatureCard $accent="#2563eb">
						<h4>Frontend</h4>
						<ul>
							<li>React 18 + TypeScript</li>
							<li>Styled-components (V9 color standards)</li>
							<li>React Router v6</li>
							<li>Vite 6 build toolchain</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#059669">
						<h4>Backend</h4>
						<ul>
							<li>Node.js + Express</li>
							<li>SQLite for credential storage</li>
							<li>PingOne Management API proxy</li>
							<li>MCP server (Model Context Protocol)</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#d97706">
						<h4>Quality &amp; Testing</h4>
						<ul>
							<li>Vitest + Jest for unit tests</li>
							<li>Supertest for backend API tests</li>
							<li>Biome for linting / formatting</li>
							<li>ESLint for additional rules</li>
						</ul>
					</FeatureCard>
				</Grid>
			</Section>
		</Container>
	);
}
