// src/pages/AdvancedSecuritySettingsDemo.tsx
// Demo page to showcase the Advanced Security Settings service

import { FiArrowLeft, FiExternalLink } from '@icons';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import AdvancedSecuritySettingsMock from '../components/AdvancedSecuritySettingsMock';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
`;

const Header = styled.div`
  max-width: 1200px;
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

const InfoCard = styled.div`
  max-width: 1200px;
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

const AdvancedSecuritySettingsDemo: React.FC = () => {
	return (
		<PageContainer>
			<Header>
				<BackButton to="/">
					<FiArrowLeft size={16} />
					Back to Dashboard
				</BackButton>
				<div>
					<Title>Advanced Security Settings</Title>
					<Subtitle>Service Demo & Mock Interface</Subtitle>
				</div>
			</Header>

			<InfoCard>
				<InfoTitle>
					<FiExternalLink size={18} />
					Service Implementation Complete
				</InfoTitle>
				<InfoText>
					This is a demonstration of the new <strong>AdvancedSecuritySettingsService</strong> that
					was created to manage advanced security configurations for OAuth/OIDC applications. The
					service provides comprehensive security settings management, assessment, and
					recommendations. You can interact with the settings below to see how the service works in
					practice.
				</InfoText>
			</InfoCard>

			<AdvancedSecuritySettingsMock />
		</PageContainer>
	);
};

export default AdvancedSecuritySettingsDemo;
