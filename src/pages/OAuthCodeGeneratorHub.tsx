// src/pages/OAuthCodeGeneratorHub.tsx
/**
 * OAuth Code Generator Hub
 * Comprehensive educational hub combining:
 * - Real-World Scenario Builder
 * - Live RFC Explorer
 * - Security Threat Theater
 * - Inline Code Examples
 */

import React from 'react';
import styled from 'styled-components';
import LiveRFCExplorer from '../components/LiveRFCExplorer';
import RealWorldScenarioBuilder from '../components/RealWorldScenarioBuilder';
import SecurityThreatTheater from '../components/SecurityThreatTheater';

// MDI Icon Helper Functions
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiBook: 'mdi-book-open-page-variant',
		FiCode: 'mdi-code-tags',
		FiShield: 'mdi-shield-check',
		FiZap: 'mdi-flash',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

// MDI Icon Component
const MDIIcon: React.FC<{ icon: string; size?: number; style?: React.CSSProperties; ariaLabel?: string }> = ({ 
	icon, 
	size = 16, 
	style, 
	ariaLabel 
}) => (
	<span
		className={`mdi ${getMDIIconClass(icon)}`}
		style={{ 
			fontSize: `${size}px`, 
			...style 
		}}
		aria-label={ariaLabel}
		aria-hidden={!ariaLabel}
	/>
);

const PageContainer = styled.div`
	min-height: 100vh;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const HeroSection = styled.div`
	background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
	padding: 4rem 2rem;
	text-align: center;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const HeroTitle = styled.h1`
	color: #f1f5f9;
	font-size: 3rem;
	font-weight: 800;
	margin: 0 0 1rem 0;
	background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #f472b6 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	
	@media (max-width: 768px) {
		font-size: 2rem;
	}
`;

const HeroSubtitle = styled.p`
	color: #cbd5e1;
	font-size: 1.3rem;
	max-width: 800px;
	margin: 0 auto 2rem;
	line-height: 1.6;
	
	@media (max-width: 768px) {
		font-size: 1.1rem;
	}
`;

const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1.5rem;
	max-width: 1000px;
	margin: 0 auto;
	padding: 0 2rem;
`;

const FeatureCard = styled.div<{ color: string }>`
	background: white;
	padding: 1.5rem;
	border-radius: 1rem;
	border: 2px solid ${({ color }) => color};
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	text-align: center;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	transition: all 0.2s;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
	}
`;

const FeatureIcon = styled.div<{ color: string }>`
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: ${({ color }) => color};
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 1.75rem;
`;

const FeatureTitle = styled.div`
	font-weight: 700;
	font-size: 1.1rem;
	color: #1e293b;
`;

const FeatureDescription = styled.div`
	color: #64748b;
	font-size: 0.9rem;
	line-height: 1.5;
`;

const ContentSection = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 2rem;
`;

const SectionDivider = styled.div`
	height: 2px;
	background: linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%);
	margin: 3rem 0;
`;

const StatsBar = styled.div`
	background: white;
	padding: 2rem;
	border-radius: 1rem;
	margin: 2rem auto;
	max-width: 1000px;
	display: flex;
	justify-content: space-around;
	gap: 2rem;
	flex-wrap: wrap;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const StatItem = styled.div`
	text-align: center;
`;

const StatNumber = styled.div`
	font-size: 2.5rem;
	font-weight: 800;
	background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
`;

const StatLabel = styled.div`
	color: #64748b;
	font-weight: 600;
	margin-top: 0.5rem;
`;

const OAuthCodeGeneratorHub: React.FC = () => {
	return (
		<PageContainer>
			<HeroSection>
				<HeroTitle>🚀 OAuth Code Generator Hub</HeroTitle>
				<HeroSubtitle>
					Production-ready OAuth code in your language, security attack simulations, RFC
					specifications decoded — everything you need to master OAuth 2.0 & OIDC
				</HeroSubtitle>

				<FeatureGrid>
					<FeatureCard color="#10b981">
						<FeatureIcon color="linear-gradient(135deg, #10b981 0%, #059669 100%)">
							<MDIIcon icon="FiZap" ariaLabel="Lightning" />
						</FeatureIcon>
						<FeatureTitle>Real-World Scenarios</FeatureTitle>
						<FeatureDescription>
							Banking, SaaS, Mobile, IoT — choose your use case, get pre-configured OAuth parameters
						</FeatureDescription>
					</FeatureCard>

					<FeatureCard color="#2563eb">
						<FeatureIcon color="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)">
							<MDIIcon icon="FiBook" ariaLabel="Book" />
						</FeatureIcon>
						<FeatureTitle>Live RFC Explorer</FeatureTitle>
						<FeatureDescription>
							OAuth specs in plain English with real code examples and PingOne support notes
						</FeatureDescription>
					</FeatureCard>

					<FeatureCard color="#ef4444">
						<FeatureIcon color="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
							<MDIIcon icon="FiShield" ariaLabel="Security" />
						</FeatureIcon>
						<FeatureTitle>Security Theater</FeatureTitle>
						<FeatureDescription>
							Watch CSRF, replay, and interception attacks in action — see how parameters protect
							you
						</FeatureDescription>
					</FeatureCard>

					<FeatureCard color="#3b82f6">
						<FeatureIcon color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
							<MDIIcon icon="FiCode" ariaLabel="Code" />
						</FeatureIcon>
						<FeatureTitle>Multi-Language Code</FeatureTitle>
						<FeatureDescription>
							JavaScript, Python, Java, C# — copy-paste production code for any platform
						</FeatureDescription>
					</FeatureCard>
				</FeatureGrid>
			</HeroSection>

			<ContentSection>
				<StatsBar>
					<StatItem>
						<StatNumber>4</StatNumber>
						<StatLabel>Real-World Scenarios</StatLabel>
					</StatItem>
					<StatItem>
						<StatNumber>5</StatNumber>
						<StatLabel>RFC Specifications</StatLabel>
					</StatItem>
					<StatItem>
						<StatNumber>4</StatNumber>
						<StatLabel>Programming Languages</StatLabel>
					</StatItem>
					<StatItem>
						<StatNumber>4</StatNumber>
						<StatLabel>Attack Simulations</StatLabel>
					</StatItem>
				</StatsBar>

				{/* Real-World Scenario Builder */}
				<RealWorldScenarioBuilder />

				<SectionDivider />

				{/* Live RFC Explorer */}
				<LiveRFCExplorer />

				<SectionDivider />

				{/* Security Threat Theater */}
				<SecurityThreatTheater />

				<div
					style={{
						marginTop: '4rem',
						padding: '2rem',
						background: 'white',
						borderRadius: '1rem',
						textAlign: 'center',
						border: '3px solid #10b981',
					}}
				>
					<h2
						style={{
							color: '#065f46',
							fontSize: '1.75rem',
							marginBottom: '1rem',
						}}
					>
						🎓 Ready to Implement OAuth?
					</h2>
					<p
						style={{
							color: '#475569',
							fontSize: '1.1rem',
							lineHeight: '1.7',
							maxWidth: '700px',
							margin: '0 auto 2rem',
						}}
					>
						You now have access to production-ready code, security best practices, and real-world
						scenarios. Pick a scenario above, choose your language, and start building secure OAuth
						flows today!
					</p>
					<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
						<a
							href="https://docs.pingidentity.com/r/en-us/pingone/p1_access_tokens"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								padding: '1rem 2rem',
								background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
								color: 'white',
								borderRadius: '0.75rem',
								textDecoration: 'none',
								fontWeight: 700,
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.5rem',
								transition: 'transform 0.2s',
							}}
							onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
							onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
						>
							<MDIIcon icon="FiBook" ariaLabel="Book" />
							PingOne Documentation
						</a>
						<a
							href="/flows/oauth-authorization-code-v7"
							style={{
								padding: '1rem 2rem',
								background: 'white',
								color: '#059669',
								border: '2px solid #10b981',
								borderRadius: '0.75rem',
								textDecoration: 'none',
								fontWeight: 700,
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.5rem',
								transition: 'transform 0.2s',
							}}
							onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
							onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
						>
							<MDIIcon icon="FiCode" ariaLabel="Code" />
							Try OAuth Playground
						</a>
					</div>
				</div>
			</ContentSection>
		</PageContainer>
	);
};

export default OAuthCodeGeneratorHub;
