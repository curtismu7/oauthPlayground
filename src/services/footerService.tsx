// src/services/footerService.tsx
// Reusable footer service for displaying version information and disclaimers

import React from 'react';
import styled from 'styled-components';
import packageJson from '../../package.json';

const FooterContainer = styled.footer`
  margin-top: 2rem;
  padding: 1.5rem;
  background: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray700};
  border-top: 1px solid ${({ theme }) => theme.colors.gray200};
  text-align: left;
  position: relative;
  z-index: 1;
  font-size: 0.875rem;
  line-height: 1.6;
`;

const VersionText = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary700};
`;

const DisclaimerText = styled.div`
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

export const PageFooter: React.FC = () => {
	return (
		<FooterContainer role="contentinfo" aria-label="Application footer">
			<VersionText>PingOne OAuth/OIDC Playground v{packageJson.version}</VersionText>
			<DisclaimerText>This is not supported. Use at your own risk.</DisclaimerText>
		</FooterContainer>
	);
};

export default {
	PageFooter,
};
