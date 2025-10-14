import React from 'react';
import styled from 'styled-components';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { PageTitle } from '../components/PageTitle';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 2rem 0;
`;

const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const Analytics: React.FC = () => {
	return (
		<PageContainer>
			<ContentContainer>
				<PageTitle
					title="Analytics Dashboard"
					subtitle="Monitor user behavior, performance metrics, and security events across your OAuth flows"
					icon="📊"
				/>
				<AnalyticsDashboard />
			</ContentContainer>
		</PageContainer>
	);
};

export default Analytics;
