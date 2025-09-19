 
import React, { useState } from 'react';
import styled from 'styled-components';
import { FiHelpCircle } from 'react-icons/fi';
import FlowCategories from '../components/FlowCategories';
import FlowRecommendationWizard from '../components/FlowRecommendationWizard';

const FlowsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 1rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto 2rem auto;
    line-height: 1.6;
  }
`;

const WizardButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const OAuthFlowsNew: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return <FlowRecommendationWizard onClose={() => setShowWizard(false)} />;
  }

  return (
    <FlowsContainer>
      <PageHeader>
        <h1>OAuth Flows</h1>
        <p>
          Choose the right OAuth flow for your application. Start with Essential Flows 
          if you're new to OAuth, or use our wizard to find the perfect flow for your use case.
        </p>
        <WizardButton onClick={() => setShowWizard(true)}>
          <FiHelpCircle />
          Find the Right Flow for Me
        </WizardButton>
      </PageHeader>

      <FlowCategories />
    </FlowsContainer>
  );
};

export default OAuthFlowsNew;
