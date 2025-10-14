import React from 'react';
import styled from 'styled-components';
import { SecurityAnalyticsDashboard } from '../components/SecurityAnalyticsDashboard';
import { PageTitle } from '../components/PageTitle';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  padding: 2rem 0;
`;

const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const SecurityAnalytics: React.FC = () => {
	return (
		<PageContainer>
			<ContentContainer>
				<PageTitle
					title="Security Analytics"
					subtitle="Monitor security events, compliance status, and threat intelligence across your OAuth flows"
					icon="🛡️"
				/>
				<SecurityAnalyticsDashboard />
			</ContentContainer>
		</PageContainer>
	);
};

export default SecurityAnalytics;
