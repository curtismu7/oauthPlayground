// src/pages/flows/PingOneCompleteMFAFlowV7.tsx
// PingOne Complete MFA Flow V7 Page

import React from 'react';
import styled from 'styled-components';
import CompleteMFAFlowV7 from '../../components/CompleteMFAFlowV7';
import { useAuth } from '../../contexts/NewAuthContext';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const PingOneCompleteMFAFlowV7: React.FC = () => {
  const { credentials } = useAuth();

  const handleFlowComplete = (result: any) => {
    console.log('MFA Flow completed:', result);
    // Handle successful completion - could redirect to dashboard or show success message
  };

  const handleFlowError = (error: string | Error | any, context?: any) => {
    // Better error logging
    if (error instanceof Error) {
      console.error('MFA Flow error:', error.message, error.stack, context);
    } else if (typeof error === 'object') {
      console.error('MFA Flow error:', JSON.stringify(error, null, 2), context);
    } else {
      console.error('MFA Flow error:', error, context);
    }
    // Handle flow errors - could show error message or redirect to error page
  };

  const handleStepChange = (step: string, data?: any) => {
    console.log('MFA Flow step changed:', step, data);
    // Handle step changes for analytics or progress tracking
  };

  return (
    <PageContainer>
      <CompleteMFAFlowV7
        requireMFA={true}
        maxRetries={3}
        onFlowComplete={handleFlowComplete}
        onFlowError={handleFlowError}
        onStepChange={handleStepChange}
        showNetworkStatus={true}
      />
    </PageContainer>
  );
};

export default PingOneCompleteMFAFlowV7;