import React from 'react';
import styled from 'styled-components';
import { FlowComparisonTools } from '../components/FlowComparisonTools';
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

const FlowComparison: React.FC = () => {
  return (
    <PageContainer>
      <ContentContainer>
        <PageTitle
          title="OAuth Flow Comparison"
          subtitle="Compare OAuth 2.0 and OpenID Connect flows to understand their differences, security implications, and use cases"
          icon="🔍"
        />
        <FlowComparisonTools />
      </ContentContainer>
    </PageContainer>
  );
};

export default FlowComparison;
