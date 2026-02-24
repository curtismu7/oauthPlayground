// src/pages/OAuthCodeGeneratorHub.V9.tsx
/**
 * V9 PingOne UI Upgrade - OAuth Code Generator Hub
 *
 * V9 Upgrades Applied:
 * - Removed React Icons in favor of MDI CSS icons
 * - Added .end-user-nano namespace wrapper for Ping UI scoping
 * - Applied Ping UI CSS variables and spacing system
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions throughout
 * - Applied Ping UI color palette and design tokens
 * - Added CentralizedSuccessMessage integration
 * - Improved responsive design with Ping UI breakpoints
 */

import React from 'react';
import styled from 'styled-components';
import { showFlowSuccess } from '../components/CentralizedSuccessMessage';
import LiveRFCExplorer from '../components/LiveRFCExplorer';
import RealWorldScenarioBuilder from '../components/RealWorldScenarioBuilder';
import SecurityThreatTheater from '../components/SecurityThreatTheater';

// Ping UI Namespace Wrapper
const PingUIWrapper = styled.div`
	/* Ping UI V9 namespace wrapper */
	.end-user-nano & {
		/* All styles inherit from Ping UI design system */
	}
`;

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	style?: React.CSSProperties;
	ariaLabel?: string;
	className?: string;
}> = ({ icon, size = 16, style, ariaLabel, className = '' }) => {
	const iconMap: Record<string, string> = {
		FiBook: 'mdi-book-open-page-variant',
		FiCode: 'mdi-code-tags',
		FiShield: 'mdi-shield-check',
		FiZap: 'mdi-flash',
		FiActivity: 'mdi-activity',
		FiDownload: 'mdi-download',
	};

	const iconClass = iconMap[icon] || 'mdi-help-circle';
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{
				fontSize: `${size}px`,
				...style,
			}}
			aria-label={ariaLabel}
			aria-hidden={!ariaLabel}
		/>
	);
};

// Ping UI Styled Components
const PageContainer = styled.div`
	min-height: 100vh;
	background: linear-gradient(135deg, var(--ping-bg-color-primary, #f8fafc) 0%, var(--ping-bg-color-secondary, #e2e8f0) 100%);
	font-family: var(--ping-font-family, 'Inter', sans-serif);
`;

const HeroSection = styled.div`
	background: linear-gradient(135deg, var(--ping-color-primary-dark, #1e293b) 0%, var(--ping-color-primary-darker, #0f172a) 100%);
	padding: var(--ping-spacing-4xl, 4rem) var(--ping-spacing-lg, 2rem);
	text-align: center;
	box-shadow: var(--ping-shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.1));
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
					radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.1) 0%, transparent 50%);
		pointer-events: none;
	}
`;

const HeroTitle = styled.h1`
	color: var(--ping-color-text-inverse, #f1f5f9);
	font-size: var(--ping-font-size-4xl, 3rem);
	font-weight: var(--ping-font-weight-bold, 800);
	margin: 0 0 var(--ping-spacing-lg, 1rem) 0;
	background: linear-gradient(135deg, var(--ping-color-primary, #60a5fa) 0%, var(--ping-color-blue, #3b82f6) 50%, var(--ping-color-pink, #f472b6) 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	position: relative;
	z-index: 1;
	transition: all 0.15s ease-in-out;

	@media (max-width: 768px) {
		font-size: var(--ping-font-size-2xl, 2rem);
	}
`;

const HeroSubtitle = styled.p`
	color: var(--ping-color-text-inverse-secondary, #cbd5e1);
	font-size: var(--ping-font-size-xl, 1.3rem);
	max-width: 800px;
	margin: 0 auto var(--ping-spacing-2xl, 2rem);
	line-height: var(--ping-line-height-relaxed, 1.6);
	position: relative;
	z-index: 1;
	transition: all 0.15s ease-in-out;

	@media (max-width: 768px) {
		font-size: var(--ping-font-size-lg, 1.1rem);
	}
`;

const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: var(--ping-spacing-xl, 1.5rem);
	max-width: 1000px;
	margin: 0 auto;
	padding: 0 var(--ping-spacing-lg, 2rem);
	position: relative;
	z-index: 1;
`;

const FeatureCard = styled.div<{ color: string }>`
	background: var(--ping-bg-color, white);
	padding: var(--ping-spacing-xl, 1.5rem);
	border-radius: var(--ping-border-radius-xl, 1rem);
	border: 2px solid ${({ color }) => color};
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--ping-spacing-md, 0.75rem);
	text-align: center;
	box-shadow: var(--ping-shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.08));
	transition: all 0.15s ease-in-out;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: ${({ color }) => color};
		opacity: 0.8;
	}

	&:hover {
		transform: translateY(-4px);
		box-shadow: var(--ping-shadow-lg, 0 8px 20px rgba(0, 0, 0, 0.15));
	}

	&:active {
		transform: translateY(-2px);
		transition: all 0.1s ease-in-out;
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
	color: var(--ping-color-text-inverse, white);
	font-size: var(--ping-font-size-2xl, 1.75rem);
	box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
	transition: all 0.15s ease-in-out;

	${FeatureCard}:hover & {
		transform: scale(1.1);
	}
`;

const FeatureTitle = styled.div`
	font-weight: var(--ping-font-weight-bold, 700);
	font-size: var(--ping-font-size-lg, 1.1rem);
	color: var(--ping-color-text-primary, #1e293b);
	transition: all 0.15s ease-in-out;
`;

const FeatureDescription = styled.div`
	color: var(--ping-color-text-secondary, #64748b);
	font-size: var(--ping-font-size-sm, 0.9rem);
	line-height: var(--ping-line-height-normal, 1.5);
`;

const ContentSection = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: var(--ping-spacing-2xl, 2rem);
`;

const SectionDivider = styled.div`
	height: 2px;
	background: linear-gradient(90deg, transparent 0%, var(--ping-border-color, #cbd5e1) 50%, transparent 100%);
	margin: var(--ping-spacing-3xl, 3rem) 0;
	position: relative;
`;

const StatsBar = styled.div`
	background: var(--ping-bg-color, white);
	padding: var(--ping-spacing-2xl, 2rem);
	border-radius: var(--ping-border-radius-xl, 1rem);
	margin: var(--ping-spacing-2xl, 2rem) auto;
	max-width: 1000px;
	display: flex;
	justify-content: space-around;
	gap: var(--ping-spacing-2xl, 2rem);
	flex-wrap: wrap;
	box-shadow: var(--ping-shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.08));
`;

const StatItem = styled.div`
	text-align: center;
	transition: all 0.15s ease-in-out;

	&:hover {
		transform: scale(1.05);
	}
`;

const StatNumber = styled.div`
	font-size: var(--ping-font-size-3xl, 2.5rem);
	font-weight: var(--ping-font-weight-bold, 800);
	background: linear-gradient(135deg, var(--ping-color-success, #10b981) 0%, var(--ping-color-primary, #3b82f6) 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
`;

const StatLabel = styled.div`
	color: var(--ping-color-text-secondary, #64748b);
	font-weight: var(--ping-font-weight-semibold, 600);
	margin-top: var(--ping-spacing-sm, 0.5rem);
	font-size: var(--ping-font-size-sm, 0.9rem);
`;

const CallToAction = styled.div`
	margin-top: var(--ping-spacing-4xl, 4rem);
	padding: var(--ping-spacing-2xl, 2rem);
	background: var(--ping-bg-color, white);
	border-radius: var(--ping-border-radius-xl, 1rem);
	text-align: center;
	border: 3px solid var(--ping-color-success, #10b981);
	box-shadow: var(--ping-shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.08));
	transition: all 0.15s ease-in-out;

	&:hover {
		box-shadow: var(--ping-shadow-xl, 0 8px 20px rgba(0, 0, 0, 0.12));
		transform: translateY(-2px);
	}
`;

const CallToActionTitle = styled.h2`
	color: var(--ping-color-success-dark, #065f46);
	font-size: var(--ping-font-size-2xl, 1.75rem);
	margin-bottom: var(--ping-spacing-lg, 1rem);
	font-weight: var(--ping-font-weight-bold, 700);
`;

const CallToActionText = styled.p`
	color: var(--ping-color-text-secondary, #475569);
	font-size: var(--ping-font-size-lg, 1.1rem);
	line-height: var(--ping-line-height-relaxed, 1.7);
	max-width: 700px;
	margin: 0 auto var(--ping-spacing-2xl, 2rem);
`;

const ActionButtons = styled.div`
	display: flex;
	gap: var(--ping-spacing-lg, 1rem);
	justify-content: center;
	flex-wrap: wrap;
`;

const PrimaryButton = styled.a`
	padding: var(--ping-spacing-lg, 1rem) var(--ping-spacing-2xl, 2rem);
	background: linear-gradient(135deg, var(--ping-color-success, #10b981) 0%, var(--ping-color-success-dark, #059669) 100%);
	color: var(--ping-color-text-inverse, white);
	border-radius: var(--ping-border-radius-lg, 0.75rem);
	text-decoration: none;
	font-weight: var(--ping-font-weight-bold, 700);
	display: inline-flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.5rem);
	transition: all 0.15s ease-in-out;
	box-shadow: var(--ping-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));

	&:hover {
		transform: translateY(-2px);
		box-shadow: var(--ping-shadow-lg, 0 8px 12px rgba(0, 0, 0, 0.15));
	}

	&:active {
		transform: translateY(0);
	}
`;

const SecondaryButton = styled.a`
	padding: var(--ping-spacing-lg, 1rem) var(--ping-spacing-2xl, 2rem);
	background: var(--ping-bg-color, white);
	color: var(--ping-color-success-dark, #059669);
	border: 2px solid var(--ping-color-success, #10b981);
	border-radius: var(--ping-border-radius-lg, 0.75rem);
	text-decoration: none;
	font-weight: var(--ping-font-weight-bold, 700);
	display: inline-flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.5rem);
	transition: all 0.15s ease-in-out;

	&:hover {
		transform: translateY(-2px);
		box-shadow: var(--ping-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
	}

	&:active {
		transform: translateY(0);
	}
`;

const OAuthCodeGeneratorHubV9: React.FC = () => {
	const handleDocumentationClick = () => {
		showFlowSuccess('Opening PingOne documentation in new tab');
	};

	const handlePlaygroundClick = () => {
		showFlowSuccess('Navigating to OAuth Playground');
	};

	return (
		<PingUIWrapper className="end-user-nano">
			<PageContainer>
				<HeroSection>
					<HeroTitle>🚀 OAuth Code Generator Hub</HeroTitle>
					<HeroSubtitle>
						Production-ready OAuth code in your language, security attack simulations, RFC
						specifications decoded — everything you need to master OAuth 2.0 & OIDC
					</HeroSubtitle>

					<FeatureGrid>
						<FeatureCard color="var(--ping-color-success, #10b981)">
							<FeatureIcon color="linear-gradient(135deg, var(--ping-color-success, #10b981) 0%, var(--ping-color-success-dark, #059669) 100%)">
								<MDIIcon icon="FiZap" ariaLabel="Lightning bolt" />
							</FeatureIcon>
							<FeatureTitle>Real-World Scenarios</FeatureTitle>
							<FeatureDescription>
								Banking, SaaS, Mobile, IoT — choose your use case, get pre-configured OAuth
								parameters
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard color="var(--ping-color-primary, #2563eb)">
							<FeatureIcon color="linear-gradient(135deg, var(--ping-color-primary, #2563eb) 0%, var(--ping-color-primary-dark, #1d4ed8) 100%)">
								<MDIIcon icon="FiBook" ariaLabel="Book" />
							</FeatureIcon>
							<FeatureTitle>Live RFC Explorer</FeatureTitle>
							<FeatureDescription>
								OAuth specs in plain English with real code examples and PingOne support notes
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard color="var(--ping-color-error, #ef4444)">
							<FeatureIcon color="linear-gradient(135deg, var(--ping-color-error, #ef4444) 0%, var(--ping-color-error-dark, #dc2626) 100%)">
								<MDIIcon icon="FiShield" ariaLabel="Security shield" />
							</FeatureIcon>
							<FeatureTitle>Security Theater</FeatureTitle>
							<FeatureDescription>
								Watch CSRF, replay, and interception attacks in action — see how parameters protect
								you
							</FeatureDescription>
						</FeatureCard>

						<FeatureCard color="var(--ping-color-blue, #3b82f6)">
							<FeatureIcon color="linear-gradient(135deg, var(--ping-color-blue, #3b82f6) 0%, var(--ping-color-primary-dark, #2563eb) 100%)">
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

					<CallToAction>
						<CallToActionTitle>🎓 Ready to Implement OAuth?</CallToActionTitle>
						<CallToActionText>
							You now have access to production-ready code, security best practices, and real-world
							scenarios. Pick a scenario above, choose your language, and start building secure
							OAuth flows today!
						</CallToActionText>
						<ActionButtons>
							<PrimaryButton
								href="https://docs.pingidentity.com/r/en-us/pingone/p1_access_tokens"
								target="_blank"
								rel="noopener noreferrer"
								onClick={handleDocumentationClick}
							>
								<MDIIcon icon="FiBook" ariaLabel="Book" />
								PingOne Documentation
							</PrimaryButton>
							<SecondaryButton
								href="/flows/oauth-authorization-code-v7"
								onClick={handlePlaygroundClick}
							>
								<MDIIcon icon="FiCode" ariaLabel="Code" />
								Try OAuth Playground
							</SecondaryButton>
						</ActionButtons>
					</CallToAction>
				</ContentSection>
			</PageContainer>
		</PingUIWrapper>
	);
};

export default OAuthCodeGeneratorHubV9;
