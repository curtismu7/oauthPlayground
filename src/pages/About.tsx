// src/pages/About.tsx
import styled from 'styled-components';
import {
	FiActivity,
	FiBook,
	FiCheckCircle,
	FiCode,
	FiCpu,
	FiGlobe,
	FiInfo,
	FiPackage,
	FiSearch,
	FiShield,
	FiStar,
	FiTool,
	FiTrendingUp,
	FiUsers,
	FiZap,
} from '../icons';
import { usePageScroll } from '../hooks/usePageScroll';
import { FlowHeader } from '../services/flowHeaderService';
import { APP_VERSION, MFA_V8_VERSION, UNIFIED_V8U_VERSION } from '../version';

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
	background: #e0e7ff;
	border: 1px solid #a5b4fc;
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
		color: #4338ca;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}
	.value {
		font-size: 0.95rem;
		font-weight: 700;
		color: #312e81;
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
		color: #4f46e5;
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
			color: ${({ $accent }) => $accent ?? '#4f46e5'};
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
	background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
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

const CheckList = styled.ul`
	margin: 0;
	padding: 0;
	list-style: none;

	li {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #374151;
		margin-bottom: 0.625rem;
		line-height: 1.5;

		svg {
			color: #10b981;
			flex-shrink: 0;
			margin-top: 0.125rem;
		}
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
					subtitle: 'Complete guide to what the PingOne MasterFlow API does and how to use it',
					icon: '📚',
				}}
			/>

			{/* Header */}
			<Section>
				<div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
					<div style={{ fontSize: '3rem', lineHeight: 1 }}>📚</div>
					<div>
						<h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
							PingOne MasterFlow API Documentation
						</h1>
						<p style={{ color: '#6b7280', marginTop: '0.5rem', lineHeight: 1.6, marginBottom: 0 }}>
							A comprehensive PingOne API integration and testing platform for mastering OAuth 2.0
							and OpenID Connect flows.
						</p>
					</div>
				</div>
				<VersionBadge>
					<VersionItem>
						<div className="label">App Version</div>
						<div className="value">{APP_VERSION}</div>
					</VersionItem>
					<VersionItem>
						<div className="label">MFA (v8)</div>
						<div className="value">{MFA_V8_VERSION}</div>
					</VersionItem>
					<VersionItem>
						<div className="label">Unified (v8u)</div>
						<div className="value">{UNIFIED_V8U_VERSION}</div>
					</VersionItem>
				</VersionBadge>
			</Section>

			{/* Stats */}
			<StatsBanner>
				<StatsBannerTitle>
					<FiTrendingUp size={22} />
					Impact &amp; Reach
				</StatsBannerTitle>
				<p style={{ opacity: 0.85, margin: 0, fontSize: '0.95rem' }}>
					Helping developers master OAuth concepts through interactive learning and comprehensive
					API testing.
				</p>
				<StatsGrid>
					<StatItem>
						<div className="number">25+</div>
						<div className="desc">OAuth Flows</div>
					</StatItem>
					<StatItem>
						<div className="number">V1–V9</div>
						<div className="desc">Flow Versions</div>
					</StatItem>
					<StatItem>
						<div className="number">100%</div>
						<div className="desc">Interactive</div>
					</StatItem>
					<StatItem>
						<div className="number">∞</div>
						<div className="desc">Learning</div>
					</StatItem>
				</StatsGrid>
			</StatsBanner>

			{/* Overview */}
			<Section>
				<SectionTitle>
					<FiInfo size={22} />
					Overview
				</SectionTitle>
				<p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1.25rem' }}>
					The <strong>PingOne MasterFlow API</strong> is designed to help developers learn, test,
					and master OAuth 2.0 and OpenID Connect (OIDC) flows using PingOne as the identity
					provider.
				</p>
				<CheckList>
					<li>
						<FiCheckCircle size={16} />
						<span>Interactive step-by-step OAuth and OIDC flow demonstrations</span>
					</li>
					<li>
						<FiCheckCircle size={16} />
						<span>Real PingOne API integration with live token exchange</span>
					</li>
					<li>
						<FiCheckCircle size={16} />
						<span>Educational mock flows for offline / safe exploration</span>
					</li>
					<li>
						<FiCheckCircle size={16} />
						<span>MFA device management, password reset, and user profile tools</span>
					</li>
					<li>
						<FiCheckCircle size={16} />
						<span>AI assistant powered by MCP server for guided learning</span>
					</li>
				</CheckList>
			</Section>

			{/* Interactive OAuth Flows */}
			<Section>
				<SectionTitle>
					<FiZap size={22} />
					Interactive OAuth Flows
				</SectionTitle>
				<Grid>
					<FeatureCard $accent="#059669">
						<h4>
							<FiCheckCircle size={16} />
							Authorization Code Flow
						</h4>
						<ul>
							<li>Complete OAuth authorization code flow with PKCE</li>
							<li>Interactive PKCE generation and verification</li>
							<li>Real-time authorization URL building</li>
							<li>Step-by-step token exchange and inspection</li>
						</ul>
					</FeatureCard>

					<FeatureCard $accent="#2563eb">
						<h4>
							<FiActivity size={16} />
							Client Credentials Flow
						</h4>
						<ul>
							<li>Machine-to-machine authentication</li>
							<li>Client secret and private key JWT methods</li>
							<li>Token introspection and validation</li>
							<li>Scope-based access control</li>
						</ul>
					</FeatureCard>

					<FeatureCard $accent="#7c3aed">
						<h4>
							<FiCpu size={16} />
							Device Code Flow
						</h4>
						<ul>
							<li>IoT and input-constrained device authentication</li>
							<li>Interactive device code generation</li>
							<li>Polling-based token retrieval</li>
							<li>Real-time status updates</li>
						</ul>
					</FeatureCard>

					<FeatureCard $accent="#d97706">
						<h4>
							<FiStar size={16} />
							Advanced Flows
						</h4>
						<ul>
							<li>JWT Bearer Token, RAR, CIBA (Backchannel)</li>
							<li>PAR, DPoP, WIMSE, mTLS, GNAP</li>
							<li>JAR + JARM (FAPI 2.0), Step-Up Auth</li>
							<li>Token Introspection, Attestation Client Auth</li>
						</ul>
					</FeatureCard>
				</Grid>
			</Section>

			{/* OpenID Connect */}
			<Section>
				<SectionTitle>
					<FiShield size={22} />
					OpenID Connect Integration
				</SectionTitle>
				<Grid>
					<FeatureCard $accent="#2563eb">
						<h4>
							<FiUsers size={16} />
							User Authentication
						</h4>
						<ul>
							<li>Complete OIDC login flows</li>
							<li>ID token validation and parsing</li>
							<li>User profile information retrieval</li>
							<li>Session management</li>
						</ul>
					</FeatureCard>

					<FeatureCard $accent="#059669">
						<h4>
							<FiShield size={16} />
							Enhanced Security
						</h4>
						<ul>
							<li>PKCE implementation</li>
							<li>State parameter protection</li>
							<li>Nonce validation</li>
							<li>Token refresh mechanisms</li>
						</ul>
					</FeatureCard>
				</Grid>
			</Section>

			{/* Educational Features */}
			<Section>
				<SectionTitle>
					<FiBook size={22} />
					Educational Features
				</SectionTitle>
				<Grid>
					<div>
						<h3
							style={{
								fontSize: '1rem',
								fontWeight: 600,
								color: '#1f2937',
								marginBottom: '1rem',
								marginTop: 0,
							}}
						>
							Interactive Learning
						</h3>
						<CheckList>
							<li>
								<FiCheckCircle size={16} />
								<span>
									<strong>Step-by-Step Guides:</strong> Each flow includes detailed explanations
								</span>
							</li>
							<li>
								<FiCheckCircle size={16} />
								<span>
									<strong>Visual Flow Diagrams:</strong> See how OAuth messages flow between parties
								</span>
							</li>
							<li>
								<FiCheckCircle size={16} />
								<span>
									<strong>Code Examples:</strong> Copy-paste ready code snippets
								</span>
							</li>
							<li>
								<FiCheckCircle size={16} />
								<span>
									<strong>Best Practices:</strong> Security recommendations and tips
								</span>
							</li>
						</CheckList>
					</div>
					<div>
						<h3
							style={{
								fontSize: '1rem',
								fontWeight: 600,
								color: '#1f2937',
								marginBottom: '1rem',
								marginTop: 0,
							}}
						>
							Multiple Flow Versions
						</h3>
						<CheckList>
							<li>
								<FiCheckCircle size={16} />
								<span>
									<strong>V1–V4 Flows:</strong> Educational versions with detailed explanations
								</span>
							</li>
							<li>
								<FiCheckCircle size={16} />
								<span>
									<strong>V5–V8 Flows:</strong> Production-ready implementations
								</span>
							</li>
							<li>
								<FiCheckCircle size={16} />
								<span>
									<strong>V9 Flows:</strong> Modern architecture, standardized patterns
								</span>
							</li>
						</CheckList>
					</div>
				</Grid>
			</Section>

			{/* Developer Tools */}
			<Section>
				<SectionTitle>
					<FiTool size={22} />
					Developer Tools
				</SectionTitle>
				<Grid>
					<FeatureCard $accent="#4f46e5">
						<h4>
							<FiSearch size={16} />
							Token Analysis
						</h4>
						<ul>
							<li>JWT Decoder — decode and inspect JWT tokens</li>
							<li>Token Introspection — query validity and metadata</li>
							<li>Claims Inspection — view token payload</li>
							<li>Signature Validation — verify token authenticity</li>
						</ul>
					</FeatureCard>

					<FeatureCard $accent="#059669">
						<h4>
							<FiGlobe size={16} />
							API Testing
						</h4>
						<ul>
							<li>Endpoint Discovery — browse available API endpoints</li>
							<li>Request Builder — construct API calls with proper auth</li>
							<li>Response Analysis — inspect API responses and headers</li>
							<li>Error Simulation — test error conditions and handling</li>
						</ul>
					</FeatureCard>

					<FeatureCard $accent="#7c3aed">
						<h4>
							<FiCpu size={16} />
							AI &amp; MCP
						</h4>
						<ul>
							<li>MasterFlow Agent — AI assistant powered by MCP</li>
							<li>PingOne MCP server for live API queries</li>
							<li>Guided flow walkthroughs via natural language</li>
						</ul>
					</FeatureCard>

					<FeatureCard $accent="#d97706">
						<h4>
							<FiPackage size={16} />
							Configuration Management
						</h4>
						<ul>
							<li>Global credential storage across all flows</li>
							<li>Worker token management</li>
							<li>Environment ID auto-discovery</li>
							<li>Per-flow isolated credential sets</li>
						</ul>
					</FeatureCard>
				</Grid>
			</Section>

			{/* Architecture */}
			<Section>
				<SectionTitle>
					<FiCode size={22} />
					Architecture
				</SectionTitle>
				<Grid $cols={3}>
					<FeatureCard $accent="#4f46e5">
						<h4>Frontend</h4>
						<ul>
							<li>React 18 + TypeScript</li>
							<li>Styled-components</li>
							<li>React Router v6</li>
							<li>Vite build toolchain</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#059669">
						<h4>Backend</h4>
						<ul>
							<li>Node.js + Express</li>
							<li>SQLite for credential storage</li>
							<li>PingOne Management API proxy</li>
							<li>MCP server integration</li>
						</ul>
					</FeatureCard>
					<FeatureCard $accent="#d97706">
						<h4>Testing</h4>
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
