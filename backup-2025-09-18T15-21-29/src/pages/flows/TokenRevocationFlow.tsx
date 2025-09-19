/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import { logger } from '../../utils/logger';
import JSONHighlighter from '../../components/JSONHighlighter';
import { 
  TokenManagementService, 
  TokenRevocationRequest
} from '../../services/tokenManagementService';

const FlowContainer = styled.div`;
  max-width: 1200 px;
  margin: 0 auto;
  padding: 2 rem;
`;

const FlowTitle = styled.h1`;
  color: #1 f2937;
  font-size: 2 rem;
  font-weight: 700;
  margin-bottom: 0.5 rem;
`;

const FlowDescription = styled.p`;
  color: #6 b7280;
  font-size: 1.125 rem;
  margin-bottom: 2 rem;
  line-height: 1.6;
`;

const FormContainer = styled.div`;
  background: #f9 fafb;
  border: 1 px solid #e5 e7 eb;
  border-radius: 0.5 rem;
  padding: 1.5 rem;
  margin: 1 rem 0;
`;

`;

const Label = styled.label`;
  display: block;
  margin-bottom: 0.5 rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`;
  width: 100%;
  padding: 0.5 rem;
  border: 1 px solid #d1 d5 db;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  
  &:focus {
    outline: none;
    border-color: #3 b82 f6;
    box-shadow: 0 0 0 3 px rgba(59, 130, 246, 0.1);
  }
`;

  padding: 0.5 rem;
  border: 1 px solid #d1 d5 db;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  min-height: 100 px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3 b82 f6;
    box-shadow: 0 0 0 3 px rgba(59, 130, 246, 0.1);
  }
`;

  padding: 0.5 rem;
  border: 1 px solid #d1 d5 db;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3 b82 f6;
    box-shadow: 0 0 0 3 px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`;
  padding: 0.75 rem 1.5 rem;
  border: none;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2 s;
  margin-right: 0.5 rem;
  margin-bottom: 0.5 rem;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: #3 b82 f6;
          color: white;
          &:hover { background-color: #2563 eb; }
        `;
      case 'secondary':
        return `
          background-color: #6 b7280;
          color: white;
          &:hover { background-color: #4 b5563; }
        `;
      case 'success':
        return `
          background-color: #10 b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
      case 'danger':
        return `
          background-color: #ef4444;
          color: white;
          &:hover { background-color: #dc2626; }
        `;
    }
  }}
`;

const CodeBlock = styled.pre`;
  background: #1 f2937;
  color: #f9 fafb;
  padding: 1 rem;
  border-radius: 0.375 rem;
  font-size: 0.875 rem;
  overflow-x: auto;
  margin: 1 rem 0;
`;

const ResponseContainer = styled.div`;
  background: #f0 fdf4;
  border: 1 px solid #86 efac;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
`;

const ErrorContainer = styled.div`;
  background: #fef2 f2;
  border: 1 px solid #fecaca;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
  color: #991 b1 b;
`;

  border: 1 px solid #93 c5 fd;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
  color: #1 e40 af;
`;

const WarningContainer = styled.div`;
  background: #fef3 c7;
  border: 1 px solid #fde68 a;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
  color: #92400 e;
`;

const RevocationContainer = styled.div`;
  background: #f8 fafc;
  border: 2 px solid #e2 e8 f0;
  border-radius: 0.5 rem;
  padding: 1.5 rem;
  margin: 1 rem 0;
`;

const RevocationTitle = styled.h4`;
  margin: 0 0 1 rem 0;
  color: #1 f2937;
  font-size: 1.125 rem;
  font-weight: 600;
`;

const RevocationDetails = styled.div`;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200 px, 1 fr));
  gap: 1 rem;
  margin-bottom: 1 rem;
`;

const RevocationDetail = styled.div`;
  display: flex;
  flex-direction: column;
`;

const RevocationLabel = styled.span`;
  font-size: 0.75 rem;
  color: #6 b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25 rem;
`;

const RevocationValue = styled.span`;
  font-size: 0.875 rem;
  color: #1 f2937;
  font-weight: 500;
  word-break: break-all;
`;

const StatusBadge = styled.span<{ $success: boolean }>`;
  display: inline-block;
  padding: 0.25 rem 0.5 rem;
  border-radius: 0.25 rem;
  font-size: 0.75 rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${({ $success }) => $success ? '#dcfce7' : '#fef2 f2'};
  color: ${({ $success }) => $success ? '#166534' : '#991 b1 b'};
`;

const TabContainer = styled.div`;
  display: flex;
  border-bottom: 1 px solid #e5 e7 eb;
  margin-bottom: 1.5 rem;
`;

const Tab = styled.button<{ $active: boolean }>`;
  background: none;
  border: none;
  padding: 0.75 rem 1 rem;
  font-size: 0.875 rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2 px solid ${({ $active }) => $active ? '#3 b82 f6' : 'transparent'};
  color: ${({ $active }) => $active ? '#3 b82 f6' : '#6 b7280'};
  
  &:hover {
    color: #3 b82 f6;
  }
`;

interface TokenRevocationFlowProps {
  credentials?: {
    clientId: string;
    clientSecret: string;
    environmentId: string;
  };
}

const TokenRevocationFlow: React.FC<TokenRevocationFlowProps> = ({ credentials }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'access_token' | 'refresh_token' | 'bulk_revocation'>('access_token');
  const [formData, setFormData] = useState({
    clientId: credentials?.clientId || '',
    clientSecret: credentials?.clientSecret || '',
    environmentId: credentials?.environmentId || '',
    tokenToRevoke: '',
    tokenTypeHint: 'access_token' as 'access_token' | 'refresh_token',
    bulkTokens: '',
    revocationReason: 'user_logout'
  });

  const [revocationResult, setRevocationResult] = useState<Record<string, unknown> | null>(null);
  const [tokenService] = useState(() => new TokenManagementService(formData.environmentId));

  const steps = [
    {
      id: 'step-1',
      title: 'Configure Token Revocation Settings',
      description: 'Set up your OAuth client for token revocation operations.',
      code: `// Token Revocation Configuration
const revocationConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}',
  tokenTypeHint: '${formData.tokenTypeHint}',
  revocationReason: '${formData.revocationReason}';
};

console.log('Token revocation configured:', revocationConfig);`,
      execute: async () => {
        logger.info('TokenRevocationFlow', 'Configuring token revocation settings');
      }
    },
    {
      id: 'step-2',
      title: activeTab === 'bulk_revocation' ? 'Revoke Multiple Tokens' : `Revoke ${activeTab.toUpperCase()}`,
      description: activeTab === 'bulk_revocation' ? 
        'Revoke multiple tokens in a single operation.' : 
        `Revoke the specified ${activeTab}.`,
      code: activeTab === 'bulk_revocation' ? 
        `// Bulk Token Revocation

const revocationPromises = tokens.map(token => {
  const revocationRequest: TokenRevocationRequest = {
    token: token.trim(),
    token_type_hint: 'access_token',
    clientId: '${formData.clientId}',
    clientSecret: '${formData.clientSecret}',
    environmentId: '${formData.environmentId}';
  };
  
  return tokenService.revokeToken(revocationRequest);
});

const results = await Promise.allSettled(revocationPromises);
const successful = results.filter(result => result.status === 'fulfilled').length;
const failed = results.filter(result => result.status === 'rejected').length;

console.log(\`Bulk revocation completed: \${successful} successful, \${failed} failed\`);` :
        `// Single Token Revocation
const revocationRequest: TokenRevocationRequest = {
  token: '${formData.tokenToRevoke}',
  token_type_hint: '${formData.tokenTypeHint}',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}'
};

const tokenService = new TokenManagementService('${formData.environmentId}');
const revoked = await tokenService.revokeToken(revocationRequest);

if (revoked) {
  console.log('Token revoked successfully');
} else {
  console.log('Token revocation failed');
}`,
      execute: async () => {
        logger.info('TokenRevocationFlow', 'Revoking token(s)', { 
          type: activeTab,
          tokenCount: activeTab === 'bulk_revocation' ? formData.bulkTokens.split('\n').filter(t => t.trim()).length : 1
        });
        setDemoStatus('loading');
        
        try {
          let result: unknown;
          
          if (activeTab === 'bulk_revocation') {
            // Simulate bulk revocation

            const mockResults = tokens.map((token, index) => ({
              token: token.trim(),
              success: Math.random() > 0.1, // 90% success rate
              error: Math.random() > 0.9 ? 'Token not found' : null;
            }));
            
            const successful = mockResults.filter(r => r.success).length;
            const failed = mockResults.filter(r => !r.success).length;
            
            result = {
              type: 'bulk',
              total: tokens.length,
              successful,
              failed,
              results: mockResults
            };
          } else {
            // Simulate single token revocation
            result = {
              type: 'single',
              success: true,
              token: formData.tokenToRevoke,
              tokenType: formData.tokenTypeHint,
              revokedAt: new Date().toISOString(),
              reason: formData.revocationReason
            };
          }

          setRevocationResult(result);
          setResponse({
            success: true,
            message: 'Token revocation completed successfully',
            result: result,
            type: activeTab
          });
          setDemoStatus('success');
        } catch (_error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          setDemoStatus('error');
          throw error;
        }
      }
    },
    {
      id: 'step-3',
      title: 'Verify Revocation',
      description: 'Verify that the token has been successfully revoked.',
      code: `// Verify Token Revocation
const verifyRevocation = async (token) => {
  try {
    // Try to use the token - it should fail if revoked

    if (response.status === 401) {;
      console.log('✅ Token is revoked (401 Unauthorized)');
      return { revoked: true, reason: 'Token rejected by server' };
    } else if (response.ok) {
      console.log('❌ Token is still valid');
      return { revoked: false, reason: 'Token accepted by server' };
    }
  } catch (_error) {
    console.log('✅ Token is revoked (Network error)');
    return { revoked: true, reason: 'Token rejected by server' };
  }
};

// Verify revocation for each token
if (revocationResult.type === 'bulk') {
  const verificationPromises = revocationResult.results
    .filter(r => r.success);
    .map(r => verifyRevocation(r.token));
  
  const verifications = await Promise.all(verificationPromises);
  console.log('Bulk verification results:', verifications);
} else {
  const verification = await verifyRevocation(revocationResult.token);
  console.log('Single verification result:', verification);
}`,
      execute: async () => {
        logger.info('TokenRevocationFlow', 'Verifying token revocation');
        
        if (revocationResult) {
          const verification = {
            verified: true,
            method: 'simulation',
            timestamp: new Date().toISOString(),
            note: 'In a real implementation, you would verify by attempting to use the token';
          };

          setResponse(prev => ({ 
            ...prev, 
            verification: verification,
            message: 'Token revocation verification completed'
          }));
        }
      }
    },
    {
      id: 'step-4',
      title: 'Handle Revocation Cleanup',
      description: 'Clean up local storage and handle post-revocation tasks.',
      code: `// Handle Revocation Cleanup
const cleanupAfterRevocation = (revocationResult) => {
  if (revocationResult.type === 'single') {
    // Remove single token from local storage;
    const storedTokens = JSON.parse(localStorage.getItem('oauth_tokens') || '{}');
    if (storedTokens.access_token === revocationResult.token) {
      delete storedTokens.access_token;
    }
    if (storedTokens.refresh_token === revocationResult.token) {
      delete storedTokens.refresh_token;
    }
    localStorage.setItem('oauth_tokens', JSON.stringify(storedTokens));
    console.log('Single token removed from local storage');
  } else {
    // Remove multiple tokens from local storage
    const tokensToRemove = revocationResult.results
      .filter(r => r.success);
      .map(r => r.token);
    
    const storedTokens = JSON.parse(localStorage.getItem('oauth_tokens') || '{}');
    tokensToRemove.forEach(token => {
      if (storedTokens.access_token === token) {
        delete storedTokens.access_token;
      }
      if (storedTokens.refresh_token === token) {
        delete storedTokens.refresh_token;
      }
    });
    localStorage.setItem('oauth_tokens', JSON.stringify(storedTokens));
    console.log(\`\${tokensToRemove.length} tokens removed from local storage\`);
  }
  
  // Clear any cached user data
  localStorage.removeItem('user_info');
  localStorage.removeItem('user_data');
  
  // Redirect to login if no valid tokens remain
  const remainingTokens = JSON.parse(localStorage.getItem('oauth_tokens') || '{}');
  if (!remainingTokens.access_token && !remainingTokens.refresh_token) {
    console.log('No valid tokens remaining, redirecting to login');
    // window.location.href = '/login';
  }
};

cleanupAfterRevocation(revocationResult);`,
      execute: async () => {
        logger.info('TokenRevocationFlow', 'Handling revocation cleanup');
        
        const cleanup = {
          localStorageCleared: true,
          userDataCleared: true,
          redirectRequired: false,
          timestamp: new Date().toISOString();
        };

        setResponse(prev => ({ 
          ...prev, 
          cleanup: cleanup,
          message: 'Revocation cleanup completed'
        }));
      }
    }
  ];

  const handleStepChange = useCallback((step: number) => {;
    setCurrentStep(step);
    setDemoStatus('idle');
    setResponse(null);
    setError(null);
  }, []);

  const handleStepResult = useCallback((step: number, result: unknown) => {;
    logger.info('TokenRevocationFlow', `Step ${step + 1} completed`, result);
  }, []);

  const handleRevocationStart = async () => {
    try {;
      setDemoStatus('loading');
      setError(null);
      
      let result: unknown;
      
      if (activeTab === 'bulk_revocation') {

        const mockResults = tokens.map((token, index) => ({
          token: token.trim(),
          success: Math.random() > 0.1,
          error: Math.random() > 0.9 ? 'Token not found' : null;
        }));
        
        const successful = mockResults.filter(r => r.success).length;
        const failed = mockResults.filter(r => !r.success).length;
        
        result = {
          type: 'bulk',
          total: tokens.length,
          successful,
          failed,
          results: mockResults
        };
      } else {
        result = {
          type: 'single',
          success: true,
          token: formData.tokenToRevoke,
          tokenType: formData.tokenTypeHint,
          revokedAt: new Date().toISOString(),
          reason: formData.revocationReason
        };
      }

      setRevocationResult(result);
      setResponse({
        success: true,
        message: 'Token revocation completed successfully',
        result: result,
        type: activeTab
      });
      setDemoStatus('success');
    } catch (_error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setDemoStatus('error');
    }
  };

  return (
    <FlowContainer>
      <FlowTitle>Token Revocation Flow</FlowTitle>
      <FlowDescription>
        This flow demonstrates token revocation operations to invalidate access tokens 
        and refresh tokens. It supports both single token revocation and bulk revocation 
        for enhanced security and user management.
      </FlowDescription>

      <WarningContainer>
        <h4>⚠️ Token Revocation Security</h4>
        <p>
          Token revocation is a critical security operation that immediately invalidates 
          tokens. Once revoked, tokens cannot be used for authentication. This is 
          essential for logout functionality and security incident response.
        </p>
      </WarningContainer>

      <FlowCredentials
        flowType="token-revocation"
        onCredentialsChange={(newCredentials) => {
          setFormData(prev => ({
            ...prev,
            clientId: newCredentials.clientId || prev.clientId,
            clientSecret: newCredentials.clientSecret || prev.clientSecret,
            environmentId: newCredentials.environmentId || prev.environmentId
          }));
        }}
      />

      <TabContainer>
        <Tab $active={activeTab === 'access_token'} onClick={() => setActiveTab('access_token')}>
          Access Token
        </Tab>
        <Tab $active={activeTab === 'refresh_token'} onClick={() => setActiveTab('refresh_token')}>
          Refresh Token
        </Tab>
        <Tab $active={activeTab === 'bulk_revocation'} onClick={() => setActiveTab('bulk_revocation')}>
          Bulk Revocation
        </Tab>
      </TabContainer>

      <StepByStepFlow
        steps={steps}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onStepResult={handleStepResult}
        onStart={() => setDemoStatus('loading')}
        onReset={() => {
          setCurrentStep(0);
          setDemoStatus('idle');
          setResponse(null);
          setError(null);
          setRevocationResult(null);
        }}
        status={demoStatus}
        disabled={demoStatus === 'loading'}
        title={`Token Revocation Steps (${activeTab})`}
      />

      {revocationResult && (
        <RevocationContainer>
          <RevocationTitle>
            Revocation Results
            <StatusBadge $success={revocationResult.type === 'single' ? revocationResult.success : revocationResult.successful > 0}>
              {revocationResult.type === 'single' ? 
                (revocationResult.success ? 'Success' : 'Failed') : 
                `${revocationResult.successful}/${revocationResult.total} Success`
              }
            </StatusBadge>
          </RevocationTitle>
          
          <RevocationDetails>
            {revocationResult.type === 'single' ? (
              <>
                <RevocationDetail>
                  <RevocationLabel>Token</RevocationLabel>
                  <RevocationValue>{revocationResult.token}</RevocationValue>
                </RevocationDetail>
                <RevocationDetail>
                  <RevocationLabel>Token Type</RevocationLabel>
                  <RevocationValue>{revocationResult.tokenType}</RevocationValue>
                </RevocationDetail>
                <RevocationDetail>
                  <RevocationLabel>Revoked At</RevocationLabel>
                  <RevocationValue>{new Date(revocationResult.revokedAt).toLocaleString()}</RevocationValue>
                </RevocationDetail>
                <RevocationDetail>
                  <RevocationLabel>Reason</RevocationLabel>
                  <RevocationValue>{revocationResult.reason}</RevocationValue>
                </RevocationDetail>
              </>
            ) : (
              <>
                <RevocationDetail>
                  <RevocationLabel>Total Tokens</RevocationLabel>
                  <RevocationValue>{revocationResult.total}</RevocationValue>
                </RevocationDetail>
                <RevocationDetail>
                  <RevocationLabel>Successful</RevocationLabel>
                  <RevocationValue>{revocationResult.successful}</RevocationValue>
                </RevocationDetail>
                <RevocationDetail>
                  <RevocationLabel>Failed</RevocationLabel>
                  <RevocationValue>{revocationResult.failed}</RevocationValue>
                </RevocationDetail>
                <RevocationDetail>
                  <RevocationLabel>Success Rate</RevocationLabel>
                  <RevocationValue>
                    {Math.round((revocationResult.successful / revocationResult.total) * 100)}%
                  </RevocationValue>
                </RevocationDetail>
              </>
            )}
          </RevocationDetails>
        </RevocationContainer>
      )}

      {response && (
        <ResponseContainer>
          <h4>Response:</h4>
          <CodeBlock>
            <JSONHighlighter data={response} />
          </CodeBlock>
        </ResponseContainer>
      )}

      {error && (
        <ErrorContainer>
          <h4>Error:</h4>
          <p>{error}</p>
        </ErrorContainer>
      )}

      <FormContainer>
        <h3>Manual Token Revocation Configuration</h3>
        <p>You can also manually configure the token revocation:</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1 fr 1 fr', gap: '1 rem', marginBottom: '1 rem' }}>
          <FormGroup>
            <Label>Client ID</Label>
            <Input
              type="text"
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Environment ID</Label>
            <Input
              type="text"
              value={formData.environmentId}
              onChange={(e) => setFormData(prev => ({ ...prev, environmentId: e.target.value }))}
            />
          </FormGroup>
          
          {activeTab !== 'bulk_revocation' && (
            <FormGroup>
              <Label>Token to Revoke</Label>
              <Input
                type="text"
                value={formData.tokenToRevoke}
                onChange={(e) => setFormData(prev => ({ ...prev, tokenToRevoke: e.target.value }))}
                placeholder="Enter token to revoke"
              />
            </FormGroup>
          )}
          
          {activeTab !== 'bulk_revocation' && (
            <FormGroup>
              <Label>Token Type Hint</Label>
              <Select
                value={formData.tokenTypeHint}
                onChange={(e) => setFormData(prev => ({ ...prev, tokenTypeHint: e.target.value as 'access_token' | 'refresh_token' }))}
              >
                <option value="access_token">Access Token</option>
                <option value="refresh_token">Refresh Token</option>
              </Select>
            </FormGroup>
          )}
          
          {activeTab === 'bulk_revocation' && (
            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label>Tokens to Revoke (one per line)</Label>
              <TextArea
                value={formData.bulkTokens}
                onChange={(e) => setFormData(prev => ({ ...prev, bulkTokens: e.target.value }))}
                placeholder="Enter tokens to revoke, one per line"
                rows={5}
              />
            </FormGroup>
          )}
        </div>
        
        <FormGroup>
          <Label>Revocation Reason</Label>
          <Select
            value={formData.revocationReason}
            onChange={(e) => setFormData(prev => ({ ...prev, revocationReason: e.target.value }))}
          >
            <option value="user_logout">User Logout</option>
            <option value="security_incident">Security Incident</option>
            <option value="token_expired">Token Expired</option>
            <option value="user_request">User Request</option>
            <option value="admin_action">Admin Action</option>
          </Select>
        </FormGroup>
        
        <Button $variant="danger" onClick={handleRevocationStart}>
          {activeTab === 'bulk_revocation' ? 'Revoke All Tokens' : 'Revoke Token'}
        </Button>
      </FormContainer>
    </FlowContainer>
  );
};

export default TokenRevocationFlow;
