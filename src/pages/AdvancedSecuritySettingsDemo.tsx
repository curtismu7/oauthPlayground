// src/pages/AdvancedSecuritySettingsDemo.tsx
// Demo page to showcase the Advanced Security Settings service


import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import AdvancedSecuritySettingsMock from '../components/AdvancedSecuritySettingsMock';
import { V9_COLORS } from '../services/v9/V9ColorStandards';

const PageContainer = styled.div`
  min-height: 100vh;
  background: V9_COLORS.BG.GRAY_LIGHT;
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
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 6px;
  color: V9_COLORS.TEXT.GRAY_DARK;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f9fafb;
    border-color: V9_COLORS.TEXT.GRAY_LIGHT;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0;
`;

const Subtitle = styled.p`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
`;

const InfoCard = styled.div`
  max-width: 1200px;
  margin: 0 auto 2rem auto;
  padding: 1.5rem;
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
`;

const InfoTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: V9_COLORS.PRIMARY.BLUE_DARK;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoText = styled.p`
  color: V9_COLORS.PRIMARY.BLUE_DARK;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
`;

const AdvancedSecuritySettingsDemo: React.FC = () => {
	return (
		<PageContainer>
			<Header>
				<BackButton to="/">
					<span style={{ fontSize: '16px' }}>⬅️</span>
					Back to Dashboard
				</BackButton>
				<div>
					<Title>Advanced Security Settings</Title>
					<Subtitle>Service Demo & Mock Interface</Subtitle>
				</div>
			</Header>

			<InfoCard>
				<InfoTitle>
					<span style={{ fontSize: '18px' }}>🔗</span>
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
