import React, { useCallback, useState } from 'react';
import {
	FiAlertTriangle,
	FiAward,
	FiBookOpen,
	FiCheckCircle,
	FiChevronDown,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiTrendingUp,
} from '@icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Styled Components
const PageContainer = styled.div`
	min-height: 100vh;
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 48rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const HeroSection = styled.div`
	text-align: center;
	margin-bottom: 3rem;
	padding: 3rem 2rem;
	background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
	border-radius: 1.5rem;
	color: white;
	box-shadow: 0 20px 40px rgba(249, 115, 22, 0.3);
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
		animation: float 6s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
		50% { transform: translate(-50%, -50%) rotate(180deg); }
	}
`;

const TrophyIcon = styled.div`
	font-size: 4rem;
	margin-bottom: 1rem;
	animation: bounce 2s ease-in-out;
	display: inline-block;

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
		40% { transform: translateY(-10px); }
		60% { transform: translateY(-5px); }
	}
`;

const HeroTitle = styled.h1`
	font-size: 2.5rem;
	font-weight: 800;
	margin: 0 0 1rem 0;
	text-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const HeroSubtitle = styled.p`
	font-size: 1.25rem;
	opacity: 0.95;
	margin: 0;
	line-height: 1.6;
`;

const StatsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1.5rem;
	margin: 2rem 0;
`;

const StatCard = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 1.5rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	border: 1px solid #e2e8f0;
	text-align: center;
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}
`;

const StatNumber = styled.div`
	font-size: 2rem;
	font-weight: 700;
	color: #f97316;
	margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
	font-size: 0.875rem;
	color: #64748b;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const MainContent = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const Section = styled.section`
	padding: 2rem;
	border-bottom: 1px solid #f1f5f9;

	&:last-child {
		border-bottom: none;
	}
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
	cursor: pointer;
	padding: 1rem;
	border-radius: 0.75rem;
	background: #f8fafc;
	transition: background 0.2s ease;

	&:hover {
		background: #f1f5f9;
	}
`;

const SectionTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	color: #1e293b;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const SectionToggle = styled.div<{ $expanded: boolean }>`
	transition: transform 0.2s ease;
	transform: ${({ $expanded }) => ($expanded ? 'rotate(0deg)' : 'rotate(-90deg)')};
	color: #64748b;
`;

const SectionContent = styled.div<{ $expanded: boolean }>`
	max-height: ${({ $expanded }) => ($expanded ? '2000px' : '0')};
	overflow: hidden;
	transition: max-height 0.3s ease;
`;

const AchievementGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin: 1.5rem 0;
`;

const AchievementCard = styled.div<{ $variant: 'success' | 'warning' | 'info' }>`
	padding: 1.5rem;
	border-radius: 0.75rem;
	border: 1px solid;
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	background: ${({ $variant }) =>
		$variant === 'success' ? '#f0fdf4' : $variant === 'warning' ? '#fffbeb' : '#f0f9ff'};
	border-color: ${({ $variant }) =>
		$variant === 'success' ? '#22c55e' : $variant === 'warning' ? '#f59e0b' : '#3b82f6'};
`;

const AchievementIcon = styled.div<{ $variant: 'success' | 'warning' | 'info' }>`
	color: ${({ $variant }) =>
		$variant === 'success' ? '#16a34a' : $variant === 'warning' ? '#d97706' : '#2563eb'};
	font-size: 1.5rem;
	margin-top: 0.125rem;
`;

const AchievementContent = styled.div`
	flex: 1;
`;

const AchievementTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0 0 0.5rem 0;
`;

const AchievementText = styled.p`
	font-size: 0.875rem;
	color: #64748b;
	margin: 0;
	line-height: 1.5;
`;

const ActionGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin: 2rem 0;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'outline' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 1rem 1.5rem;
	border-radius: 0.75rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 2px solid transparent;
	text-decoration: none;
	width: 100%;

	${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
					color: white;
					&:hover {
						transform: translateY(-2px);
						box-shadow: 0 8px 25px rgba(249, 115, 22, 0.3);
					}
				`;
			case 'secondary':
				return `
					background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
					color: white;
					&:hover {
						transform: translateY(-2px);
						box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
					}
				`;
			case 'success':
				return `
					background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
					color: white;
					&:hover {
						transform: translateY(-2px);
						box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
					}
				`;
			case 'outline':
				return `
					background: white;
					color: #64748b;
					border-color: #e2e8f0;
					&:hover {
						background: #f8fafc;
						border-color: #cbd5e1;
						transform: translateY(-1px);
					}
				`;
		}
	}}
`;

const MigrationSection = styled.div`
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 1px solid #f59e0b;
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
`;

const MigrationTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 700;
	color: #92400e;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const MigrationText = styled.p`
	color: #78350f;
	margin: 0 0 1.5rem 0;
	line-height: 1.6;
`;

const MigrationSteps = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
`;

const MigrationStep = styled.div`
	background: white;
	padding: 1.5rem;
	border-radius: 0.5rem;
	border: 1px solid #f59e0b;
`;

const StepNumber = styled.div`
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background: #f59e0b;
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 0.875rem;
	margin-bottom: 0.75rem;
`;

const StepTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #92400e;
	margin: 0 0 0.5rem 0;
`;

const StepDescription = styled.p`
	font-size: 0.875rem;
	color: #a16207;
	margin: 0;
	line-height: 1.5;
`;

const FooterActions = styled.div`
	display: flex;
	justify-content: center;
	gap: 1rem;
	padding: 2rem;
	background: #f8fafc;
	border-top: 1px solid #e2e8f0;
`;

const OAuthImplicitFlowCompletion: React.FC = () => {
	const navigate = useNavigate();
	const [expandedSections, setExpandedSections] = useState({
		achievements: true,
		insights: true,
		migration: false,
	});

	const toggleSection = useCallback((section: keyof typeof expandedSections) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	const handleNavigate = useCallback(
		(path: string) => {
			navigate(path);
		},
		[navigate]
	);

	const handleExternalLink = useCallback((url: string) => {
		window.open(url, '_blank');
	}, []);

	return (
		<PageContainer>
			<ContentWrapper>
				{/* Hero Section */}
				<HeroSection>
					<TrophyIcon>
						<FiAward />
					</TrophyIcon>
					<HeroTitle>OAuth Implicit Flow Mastered!</HeroTitle>
					<HeroSubtitle>
						Congratulations! You've successfully completed the OAuth 2.0 Implicit Flow
						demonstration. This legacy flow returned tokens directly in the URL fragment for API
						authorization.
					</HeroSubtitle>
				</HeroSection>

				{/* Stats Overview */}
				<StatsGrid>
					<StatCard>
						<StatNumber>5</StatNumber>
						<StatLabel>Steps Completed</StatLabel>
					</StatCard>
					<StatCard>
						<StatNumber>1</StatNumber>
						<StatLabel>Access Token</StatLabel>
					</StatCard>
					<StatCard>
						<StatNumber>0</StatNumber>
						<StatLabel>Refresh Tokens</StatLabel>
					</StatCard>
					<StatCard>
						<StatNumber>⚠️</StatNumber>
						<StatLabel>Security Level</StatLabel>
					</StatCard>
				</StatsGrid>

				{/* Main Content */}
				<MainContent>
					{/* Achievements Section */}
					<Section>
						<SectionHeader onClick={() => toggleSection('achievements')}>
							<SectionTitle>
								<FiCheckCircle />
								Your Achievements
							</SectionTitle>
							<SectionToggle $expanded={expandedSections.achievements}>
								<FiChevronDown />
							</SectionToggle>
						</SectionHeader>
						<SectionContent $expanded={expandedSections.achievements}>
							<AchievementGrid>
								<AchievementCard $variant="success">
									<AchievementIcon $variant="success">
										<FiCheckCircle />
									</AchievementIcon>
									<AchievementContent>
										<AchievementTitle>Flow Completion</AchievementTitle>
										<AchievementText>
											Successfully executed the complete OAuth 2.0 Implicit Flow from authorization
											request to token validation.
										</AchievementText>
									</AchievementContent>
								</AchievementCard>

								<AchievementCard $variant="success">
									<AchievementIcon $variant="success">
										<FiKey />
									</AchievementIcon>
									<AchievementContent>
										<AchievementTitle>Token Management</AchievementTitle>
										<AchievementText>
											Learned to handle access tokens, validate them, and understand their security
											implications.
										</AchievementText>
									</AchievementContent>
								</AchievementCard>

								<AchievementCard $variant="warning">
									<AchievementIcon $variant="warning">
										<FiShield />
									</AchievementIcon>
									<AchievementContent>
										<AchievementTitle>Security Awareness</AchievementTitle>
										<AchievementText>
											Recognized the security limitations of Implicit Flow and the importance of
											modern OAuth practices.
										</AchievementText>
									</AchievementContent>
								</AchievementCard>

								<AchievementCard $variant="info">
									<AchievementIcon $variant="info">
										<FiBookOpen />
									</AchievementIcon>
									<AchievementContent>
										<AchievementTitle>OAuth Knowledge</AchievementTitle>
										<AchievementText>
											Gained deep understanding of OAuth 2.0 flows, token types, and authorization
											patterns.
										</AchievementText>
									</AchievementContent>
								</AchievementCard>
							</AchievementGrid>
						</SectionContent>
					</Section>

					{/* Key Insights Section */}
					<Section>
						<SectionHeader onClick={() => toggleSection('insights')}>
							<SectionTitle>
								<FiTrendingUp />
								Key Insights & Learnings
							</SectionTitle>
							<SectionToggle $expanded={expandedSections.insights}>
								<FiChevronDown />
							</SectionToggle>
						</SectionHeader>
						<SectionContent $expanded={expandedSections.insights}>
							<AchievementGrid>
								<AchievementCard $variant="info">
									<AchievementIcon $variant="info">
										<FiInfo />
									</AchievementIcon>
									<AchievementContent>
										<AchievementTitle>Token Exposure</AchievementTitle>
										<AchievementText>
											Implicit Flow exposes tokens in the browser URL, making them vulnerable to
											interception and logging.
										</AchievementText>
									</AchievementContent>
								</AchievementCard>

								<AchievementCard $variant="warning">
									<AchievementIcon $variant="warning">
										<FiAlertTriangle />
									</AchievementIcon>
									<AchievementContent>
										<AchievementTitle>No Refresh Tokens</AchievementTitle>
										<AchievementText>
											Implicit Flow doesn't provide refresh tokens, requiring re-authentication when
											access tokens expire.
										</AchievementText>
									</AchievementContent>
								</AchievementCard>

								<AchievementCard $variant="success">
									<AchievementIcon $variant="success">
										<FiCheckCircle />
									</AchievementIcon>
									<AchievementContent>
										<AchievementTitle>Simplicity Benefits</AchievementTitle>
										<AchievementText>
											No intermediate token exchange step makes Implicit Flow simpler for certain
											use cases.
										</AchievementText>
									</AchievementContent>
								</AchievementCard>

								<AchievementCard $variant="warning">
									<AchievementIcon $variant="warning">
										<FiAlertTriangle />
									</AchievementIcon>
									<AchievementContent>
										<AchievementTitle>Modern Standards</AchievementTitle>
										<AchievementText>
											OAuth 2.1 deprecates Implicit Flow in favor of Authorization Code + PKCE for
											better security.
										</AchievementText>
									</AchievementContent>
								</AchievementCard>
							</AchievementGrid>
						</SectionContent>
					</Section>

					{/* Next Steps Actions */}
					<Section>
						<ActionGrid>
							<ActionButton
								$variant="primary"
								onClick={() => handleNavigate('/authorization-code-v5')}
							>
								<FiExternalLink />
								Try Auth Code + PKCE
							</ActionButton>
							<ActionButton
								$variant="secondary"
								onClick={() => handleNavigate('/oidc-implicit-v5')}
							>
								<FiExternalLink />
								Explore OIDC Implicit
							</ActionButton>
							<ActionButton $variant="success" onClick={() => handleNavigate('/token-management')}>
								<FiKey />
								Token Management
							</ActionButton>
							<ActionButton $variant="outline" onClick={() => handleNavigate('/oauth-implicit-v5')}>
								<FiRefreshCw />
								Restart Flow
							</ActionButton>
						</ActionGrid>
					</Section>

					{/* Migration Guide Section */}
					<Section>
						<SectionHeader onClick={() => toggleSection('migration')}>
							<SectionTitle>
								<FiShield />
								Migration Guide: From Implicit to Auth Code + PKCE
							</SectionTitle>
							<SectionToggle $expanded={expandedSections.migration}>
								<FiChevronDown />
							</SectionToggle>
						</SectionHeader>
						<SectionContent $expanded={expandedSections.migration}>
							<MigrationSection>
								<MigrationTitle>
									<FiTrendingUp />
									Why Migrate?
								</MigrationTitle>
								<MigrationText>
									The Implicit Flow is deprecated by OAuth 2.1 specifications due to security
									concerns. Authorization Code + PKCE provides better security, refresh tokens, and
									modern standards compliance.
								</MigrationText>

								<MigrationSteps>
									<MigrationStep>
										<StepNumber>1</StepNumber>
										<StepTitle>Update Client Configuration</StepTitle>
										<StepDescription>
											Change response_type from 'token' to 'code' and enable PKCE in your OAuth
											client settings.
										</StepDescription>
									</MigrationStep>

									<MigrationStep>
										<StepNumber>2</StepNumber>
										<StepTitle>Implement Token Exchange</StepTitle>
										<StepDescription>
											Add backend endpoint to exchange authorization code for access and refresh
											tokens.
										</StepDescription>
									</MigrationStep>

									<MigrationStep>
										<StepNumber>3</StepNumber>
										<StepTitle>Secure Token Storage</StepTitle>
										<StepDescription>
											Move token storage from browser to secure server-side storage or httpOnly
											cookies.
										</StepDescription>
									</MigrationStep>

									<MigrationStep>
										<StepNumber>4</StepNumber>
										<StepTitle>Add Refresh Logic</StepTitle>
										<StepDescription>
											Implement automatic token refresh using refresh tokens to maintain user
											sessions.
										</StepDescription>
									</MigrationStep>
								</MigrationSteps>
							</MigrationSection>
						</SectionContent>
					</Section>
				</MainContent>

				{/* Footer Actions */}
				<FooterActions>
					<ActionButton $variant="outline" onClick={() => handleNavigate('/flows')}>
						<FiBookOpen />
						Explore More Flows
					</ActionButton>
					<ActionButton
						$variant="primary"
						onClick={() => handleExternalLink('https://oauth.net/2/')}
					>
						<FiExternalLink />
						OAuth 2.0 Specification
					</ActionButton>
				</FooterActions>
			</ContentWrapper>
		</PageContainer>
	);
};

export default OAuthImplicitFlowCompletion;
