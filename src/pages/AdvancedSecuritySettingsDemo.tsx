// src/pages/AdvancedSecuritySettingsDemo.tsx
// Demo page to showcase the Advanced Security Settings service

import React from 'react';
import styled from 'styled-components';
import AdvancedSecuritySettingsMock from '../components/AdvancedSecuritySettingsMock';
import { FlowHeader } from '../services/flowHeaderService';
import { COLORS } from '../platform/ColorStandards';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${COLORS.BG.GRAY_LIGHT};
  padding: 0;
`;

const ContentArea = styled.div`
  padding: 2rem;
`;

const InfoCard = styled.div`
  max-width: 1200px;
  margin: 0 auto 2rem auto;
  padding: 1.5rem;
  background: ${COLORS.BG.GRAY_LIGHT};
  border: 1px solid ${COLORS.TEXT.GRAY_LIGHTER};
  border-radius: 8px;
`;

const InfoTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${COLORS.PRIMARY.BLUE_DARK};
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoText = styled.p`
  color: ${COLORS.PRIMARY.BLUE_DARK};
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
`;

const AdvancedSecuritySettingsDemo: React.FC = () => {
	return (
		<PageContainer>
			<FlowHeader flowId="advanced-security-settings" />
			<ContentArea>
				<InfoCard>
					<InfoTitle>
						<span style={{ fontSize: '18px' }}></span>
						Service Implementation Complete
					</InfoTitle>
					<InfoText>
						This is a demonstration of the new <strong>AdvancedSecuritySettingsService</strong> that
						was created to manage advanced security configurations for OAuth/OIDC applications. The
						service provides comprehensive security settings management, assessment, and
						recommendations. You can interact with the settings below to see how the service works
						in practice.
					</InfoText>
				</InfoCard>

				<AdvancedSecuritySettingsMock />
			</ContentArea>
		</PageContainer>
	);
};

export default AdvancedSecuritySettingsDemo;
