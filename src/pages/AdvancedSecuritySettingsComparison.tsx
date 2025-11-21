// src/pages/AdvancedSecuritySettingsComparison.tsx
// Comparison page showing both compact and full versions

import React from 'react';
import { FiArrowLeft, FiExternalLink, FiMonitor, FiSmartphone } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import CompactAdvancedSecuritySettings from '../components/CompactAdvancedSecuritySettings';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
`;

const Header = styled.div`
  max-width: 1400px;
  margin: 0 auto 2rem auto;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
`;

const ComparisonContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const VersionCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const VersionHeader = styled.div`
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const VersionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
`;

const VersionInfo = styled.div`
  flex: 1;
`;

const VersionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
`;

const VersionDescription = styled.p`
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
`;

const VersionContent = styled.div`
  padding: 1.5rem;
`;

const UseCaseList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;
`;

const UseCaseItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: #374151;
  
  &::before {
    content: '✓';
    color: #10b981;
    font-weight: bold;
  }
`;

const InfoCard = styled.div`
  max-width: 1400px;
  margin: 0 auto 2rem auto;
  padding: 1.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
`;

const InfoTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoText = styled.p`
  color: #1e40af;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
`;

const AdvancedSecuritySettingsComparison: React.FC = () => {
	return (
		<PageContainer>
			<Header>
				<BackButton to="/">
					<FiArrowLeft size={16} />
					Back to Dashboard
				</BackButton>
				<div>
					<Title>Advanced Security Settings Comparison</Title>
					<Subtitle>Compact vs Full Implementation</Subtitle>
				</div>
			</Header>

			<InfoCard>
				<InfoTitle>
					<FiExternalLink size={18} />
					Two Versions Available
				</InfoTitle>
				<InfoText>
					We now have both a <strong>compact version</strong> for use inside flows and a{' '}
					<strong>full version</strong> for comprehensive configuration. The compact version fits
					seamlessly into existing flows while maintaining all essential security settings.
				</InfoText>
			</InfoCard>

			<ComparisonContainer>
				{/* Compact Version */}
				<VersionCard>
					<VersionHeader>
						<VersionIcon style={{ background: '#3b82f6' }}>
							<FiSmartphone size={20} />
						</VersionIcon>
						<VersionInfo>
							<VersionTitle>Compact Version</VersionTitle>
							<VersionDescription>
								Designed for integration inside flows. Collapsible interface with essential security
								settings.
							</VersionDescription>
						</VersionInfo>
					</VersionHeader>
					<VersionContent>
						<UseCaseList>
							<UseCaseItem>Fits inside flow components</UseCaseItem>
							<UseCaseItem>Collapsible interface</UseCaseItem>
							<UseCaseItem>Essential security settings</UseCaseItem>
							<UseCaseItem>Real-time security assessment</UseCaseItem>
							<UseCaseItem>Quick actions (Reset, Apply)</UseCaseItem>
							<UseCaseItem>Compact grid layout</UseCaseItem>
						</UseCaseList>

						<div style={{ marginTop: '1.5rem' }}>
							<h4
								style={{
									margin: '0 0 1rem 0',
									fontSize: '0.875rem',
									fontWeight: '600',
									color: '#374151',
								}}
							>
								Live Demo:
							</h4>
							<CompactAdvancedSecuritySettings />
						</div>
					</VersionContent>
				</VersionCard>

				{/* Full Version */}
				<VersionCard>
					<VersionHeader>
						<VersionIcon style={{ background: '#10b981' }}>
							<FiMonitor size={20} />
						</VersionIcon>
						<VersionInfo>
							<VersionTitle>Full Version</VersionTitle>
							<VersionDescription>
								Comprehensive configuration interface with detailed explanations and advanced
								features.
							</VersionDescription>
						</VersionInfo>
					</VersionHeader>
					<VersionContent>
						<UseCaseList>
							<UseCaseItem>Standalone configuration page</UseCaseItem>
							<UseCaseItem>Detailed explanations</UseCaseItem>
							<UseCaseItem>All security categories</UseCaseItem>
							<UseCaseItem>Export/Import functionality</UseCaseItem>
							<UseCaseItem>Comprehensive assessment</UseCaseItem>
							<UseCaseItem>Educational content</UseCaseItem>
						</UseCaseList>

						<div style={{ marginTop: '1.5rem' }}>
							<h4
								style={{
									margin: '0 0 1rem 0',
									fontSize: '0.875rem',
									fontWeight: '600',
									color: '#374151',
								}}
							>
								Full Demo Available:
							</h4>
							<Link
								to="/advanced-security-settings"
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '0.5rem',
									padding: '0.75rem 1rem',
									background: '#10b981',
									color: 'white',
									textDecoration: 'none',
									borderRadius: '6px',
									fontSize: '0.875rem',
									fontWeight: '500',
									transition: 'all 0.2s ease',
								}}
							>
								<FiExternalLink size={14} />
								View Full Version
							</Link>
						</div>
					</VersionContent>
				</VersionCard>
			</ComparisonContainer>

			{/* Integration Examples */}
			<div style={{ maxWidth: '1400px', margin: '2rem auto 0 auto' }}>
				<h2
					style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0f172a', margin: '0 0 1rem 0' }}
				>
					Integration Examples
				</h2>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: '1rem',
					}}
				>
					<div
						style={{
							background: 'white',
							padding: '1rem',
							borderRadius: '8px',
							border: '1px solid #e2e8f0',
						}}
					>
						<h3
							style={{
								fontSize: '1rem',
								fontWeight: '600',
								color: '#0f172a',
								margin: '0 0 0.5rem 0',
							}}
						>
							Inside Flow Components
						</h3>
						<p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem 0' }}>
							The compact version can be embedded directly into flow components like
							ComprehensiveCredentialsService.
						</p>
						<code
							style={{
								fontSize: '0.75rem',
								background: '#f1f5f9',
								padding: '0.5rem',
								borderRadius: '4px',
								display: 'block',
							}}
						>
							{`<CompactAdvancedSecuritySettings />`}
						</code>
					</div>

					<div
						style={{
							background: 'white',
							padding: '1rem',
							borderRadius: '8px',
							border: '1px solid #e2e8f0',
						}}
					>
						<h3
							style={{
								fontSize: '1rem',
								fontWeight: '600',
								color: '#0f172a',
								margin: '0 0 0.5rem 0',
							}}
						>
							Standalone Configuration
						</h3>
						<p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem 0' }}>
							The full version provides comprehensive configuration with educational content and
							advanced features.
						</p>
						<code
							style={{
								fontSize: '0.75rem',
								background: '#f1f5f9',
								padding: '0.5rem',
								borderRadius: '4px',
								display: 'block',
							}}
						>
							{`<AdvancedSecuritySettingsMock />`}
						</code>
					</div>
				</div>
			</div>
		</PageContainer>
	);
};

export default AdvancedSecuritySettingsComparison;
