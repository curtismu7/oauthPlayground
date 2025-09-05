import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { logger } from '../../utils/logger';

const FlowContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const FlowTitle = styled.h1`
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const FlowDescription = styled.p`
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const FormContainer = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
      case 'secondary':
        return `
          background-color: #6b7280;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
      case 'success':
        return `
          background-color: #10b981;
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

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
`;

const ResponseContainer = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
`;

const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #991b1b;
`;

const InfoContainer = styled.div`
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #1e40af;
`;

const UserInfoContainer = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const UserInfoTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`;

const UserInfoDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const UserInfoDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserInfoLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const UserInfoValue = styled.span`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
  word-break: break-all;
`;

interface UserInfoPostFlowProps {
  credentials?: {
    clientId: string;
    clientSecret: string;
    environmentId: string;
  };
}

const UserInfoPostFlow: React.FC<UserInfoPostFlowProps> = ({ credentials }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    clientId: credentials?.clientId || '',
    clientSecret: credentials?.clientSecret || '',
    environmentId: credentials?.environmentId || '',
    accessToken: '',
    scope: 'openid profile email',
    claims: '{"userinfo": {"email": null, "phone_number": null, "address": null}}',
    uiLocales: 'en',
    includeClaims: true
  });
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  const steps = [
    {
      id: 'step-1',
      title: 'Configure UserInfo POST Settings',
      description: 'Set up your OAuth client for UserInfo POST requests.',
      code: `// UserInfo POST Configuration
const userInfoConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}',
  accessToken: '${formData.accessToken}',
  scope: '${formData.scope}',
  claims: ${formData.claims},
  uiLocales: '${formData.uiLocales}',
  includeClaims: ${formData.includeClaims}
};

console.log('UserInfo POST configured:', userInfoConfig);`,
      execute: async () => {
        logger.info('UserInfoPostFlow', 'Configuring UserInfo POST settings');
      }
    },
    {
      id: 'step-2',
      title: 'Prepare UserInfo POST Request',
      description: 'Build the POST request for UserInfo endpoint.',
      code: `// Prepare UserInfo POST Request
const userInfoUrl = \`https://auth.pingone.com/\${environmentId}/as/userinfo\`;

const formData = new FormData();
formData.append('access_token', '${formData.accessToken}');
formData.append('client_id', '${formData.clientId}');
formData.append('client_secret', '${formData.clientSecret}');
formData.append('scope', '${formData.scope}');
formData.append('claims', '${formData.claims}');
formData.append('ui_locales', '${formData.uiLocales}');

console.log('UserInfo POST URL:', userInfoUrl);
console.log('Form data prepared for POST request');`,
      execute: async () => {
        logger.info('UserInfoPostFlow', 'Preparing UserInfo POST request');
      }
    },
    {
      id: 'step-3',
      title: 'Submit UserInfo POST Request',
      description: 'Submit the POST request to the UserInfo endpoint.',
      code: `// Submit UserInfo POST Request
try {
  const response = await fetch(userInfoUrl, {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  if (response.ok) {
    const userInfo = await response.json();
    console.log('UserInfo received:', userInfo);
    
    // Store user info
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  } else {
    const error = await response.text();
    throw new Error(\`UserInfo request failed: \${response.status} - \${error}\`);
  }
} catch (error) {
  console.error('UserInfo error:', error);
  throw error;
}`,
      execute: async () => {
        logger.info('UserInfoPostFlow', 'Submitting UserInfo POST request');
        setDemoStatus('loading');
        
        try {
          // Simulate UserInfo POST request
          const mockUserInfo = {
            sub: 'user_123456789',
            name: 'John Doe',
            given_name: 'John',
            family_name: 'Doe',
            email: 'john.doe@example.com',
            email_verified: true,
            phone_number: '+1-555-123-4567',
            phone_number_verified: true,
            address: {
              street_address: '123 Main St',
              locality: 'Anytown',
              region: 'CA',
              postal_code: '12345',
              country: 'US'
            },
            locale: 'en-US',
            updated_at: Math.floor(Date.now() / 1000)
          };

          const mockResponse = {
            success: true,
            message: 'UserInfo retrieved successfully',
            userInfo: mockUserInfo,
            method: 'POST',
            endpoint: `https://auth.pingone.com/${formData.environmentId}/as/userinfo`
          };

          setResponse(mockResponse);
          setUserInfo(mockUserInfo);
          setDemoStatus('success');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          setDemoStatus('error');
          throw error;
        }
      }
    },
    {
      id: 'step-4',
      title: 'Process UserInfo Response',
      description: 'Process and validate the UserInfo response.',
      code: `// Process UserInfo Response
if (userInfo) {
  // Validate required claims
  const requiredClaims = ['sub', 'name', 'email'];
  const missingClaims = requiredClaims.filter(claim => !userInfo[claim]);
  
  if (missingClaims.length > 0) {
    console.warn('Missing required claims:', missingClaims);
  }
  
  // Extract user information
  const userData = {
    id: userInfo.sub,
    name: userInfo.name,
    email: userInfo.email,
    emailVerified: userInfo.email_verified,
    phone: userInfo.phone_number,
    phoneVerified: userInfo.phone_number_verified,
    address: userInfo.address,
    locale: userInfo.locale,
    lastUpdated: new Date(userInfo.updated_at * 1000)
  };
  
  console.log('Processed user data:', userData);
  
  // Store processed user data
  localStorage.setItem('user_data', JSON.stringify(userData));
}`,
      execute: async () => {
        logger.info('UserInfoPostFlow', 'Processing UserInfo response');
        
        if (userInfo) {
          const processedUserData = {
            id: userInfo.sub,
            name: userInfo.name,
            email: userInfo.email,
            emailVerified: userInfo.email_verified,
            phone: userInfo.phone_number,
            phoneVerified: userInfo.phone_number_verified,
            address: userInfo.address,
            locale: userInfo.locale,
            lastUpdated: new Date(userInfo.updated_at * 1000)
          };

          setResponse(prev => ({ ...prev, processedUserData }));
        }
      }
    },
    {
      id: 'step-5',
      title: 'Handle UserInfo Errors',
      description: 'Handle common UserInfo request errors and edge cases.',
      code: `// Handle UserInfo Errors
const handleUserInfoError = (error) => {
  if (error.status === 401) {
    console.error('Unauthorized: Invalid or expired access token');
    // Redirect to re-authentication
    window.location.href = '/login';
  } else if (error.status === 403) {
    console.error('Forbidden: Insufficient scope or permissions');
    // Request additional scopes
    requestAdditionalScopes();
  } else if (error.status === 429) {
    console.error('Rate limited: Too many requests');
    // Implement exponential backoff
    setTimeout(() => retryUserInfoRequest(), 5000);
  } else {
    console.error('UserInfo request failed:', error);
    // Show user-friendly error message
    showErrorMessage('Failed to retrieve user information. Please try again.');
  }
};

// Retry logic with exponential backoff
const retryUserInfoRequest = async (retryCount = 0) => {
  const maxRetries = 3;
  const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
  
  if (retryCount < maxRetries) {
    setTimeout(async () => {
      try {
        await fetchUserInfo();
      } catch (error) {
        retryUserInfoRequest(retryCount + 1);
      }
    }, delay);
  } else {
    console.error('Max retries exceeded for UserInfo request');
  }
};`,
      execute: async () => {
        logger.info('UserInfoPostFlow', 'UserInfo error handling implemented');
      }
    }
  ];

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    setDemoStatus('idle');
    setResponse(null);
    setError(null);
  }, []);

  const handleStepResult = useCallback((step: number, result: any) => {
    logger.info('UserInfoPostFlow', `Step ${step + 1} completed`, result);
  }, []);

  const handleUserInfoRequest = async () => {
    try {
      setDemoStatus('loading');
      setError(null);
      
      const userInfoUrl = `https://auth.pingone.com/${formData.environmentId}/as/userinfo`;
      
      const mockUserInfo = {
        sub: 'user_123456789',
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        email: 'john.doe@example.com',
        email_verified: true,
        phone_number: '+1-555-123-4567',
        phone_number_verified: true,
        address: {
          street_address: '123 Main St',
          locality: 'Anytown',
          region: 'CA',
          postal_code: '12345',
          country: 'US'
        },
        locale: 'en-US',
        updated_at: Math.floor(Date.now() / 1000)
      };

      const mockResponse = {
        success: true,
        message: 'UserInfo retrieved successfully',
        userInfo: mockUserInfo,
        method: 'POST',
        endpoint: userInfoUrl
      };

      setResponse(mockResponse);
      setUserInfo(mockUserInfo);
      setDemoStatus('success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setDemoStatus('error');
    }
  };

  return (
    <FlowContainer>
      <FlowTitle>UserInfo POST Flow</FlowTitle>
      <FlowDescription>
        This flow demonstrates the UserInfo endpoint using POST requests. The UserInfo 
        endpoint allows clients to retrieve information about the authenticated user 
        using their access token.
      </FlowDescription>

      <InfoContainer>
        <h4>👤 UserInfo POST Benefits</h4>
        <p>
          The UserInfo POST method allows for more complex requests with larger payloads, 
          including custom claims and additional parameters. It's particularly useful 
          when you need to request specific user information or when dealing with 
          sensitive data that shouldn't be exposed in URL parameters.
        </p>
      </InfoContainer>

      <FlowCredentials
        flowType="userinfo-post"
        onCredentialsChange={(newCredentials) => {
          setFormData(prev => ({
            ...prev,
            clientId: newCredentials.clientId || prev.clientId,
            clientSecret: newCredentials.clientSecret || prev.clientSecret,
            environmentId: newCredentials.environmentId || prev.environmentId
          }));
        }}
      />

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
          setUserInfo(null);
        }}
        status={demoStatus}
        disabled={demoStatus === 'loading'}
        title="UserInfo POST Flow Steps"
      />

      {userInfo && (
        <UserInfoContainer>
          <UserInfoTitle>User Information</UserInfoTitle>
          
          <UserInfoDetails>
            <UserInfoDetail>
              <UserInfoLabel>User ID</UserInfoLabel>
              <UserInfoValue>{userInfo.sub}</UserInfoValue>
            </UserInfoDetail>
            <UserInfoDetail>
              <UserInfoLabel>Name</UserInfoLabel>
              <UserInfoValue>{userInfo.name}</UserInfoValue>
            </UserInfoDetail>
            <UserInfoDetail>
              <UserInfoLabel>Email</UserInfoLabel>
              <UserInfoValue>{userInfo.email}</UserInfoValue>
            </UserInfoDetail>
            <UserInfoDetail>
              <UserInfoLabel>Email Verified</UserInfoLabel>
              <UserInfoValue>{userInfo.email_verified ? 'Yes' : 'No'}</UserInfoValue>
            </UserInfoDetail>
            <UserInfoDetail>
              <UserInfoLabel>Phone</UserInfoLabel>
              <UserInfoValue>{userInfo.phone_number || 'Not provided'}</UserInfoValue>
            </UserInfoDetail>
            <UserInfoDetail>
              <UserInfoLabel>Phone Verified</UserInfoLabel>
              <UserInfoValue>{userInfo.phone_number_verified ? 'Yes' : 'No'}</UserInfoValue>
            </UserInfoDetail>
            <UserInfoDetail>
              <UserInfoLabel>Locale</UserInfoLabel>
              <UserInfoValue>{userInfo.locale}</UserInfoValue>
            </UserInfoDetail>
            <UserInfoDetail>
              <UserInfoLabel>Last Updated</UserInfoLabel>
              <UserInfoValue>{new Date(userInfo.updated_at * 1000).toLocaleString()}</UserInfoValue>
            </UserInfoDetail>
          </UserInfoDetails>
        </UserInfoContainer>
      )}

      {response && (
        <ResponseContainer>
          <h4>Response:</h4>
          <CodeBlock>{JSON.stringify(response, null, 2)}</CodeBlock>
        </ResponseContainer>
      )}

      {error && (
        <ErrorContainer>
          <h4>Error:</h4>
          <p>{error}</p>
        </ErrorContainer>
      )}

      <FormContainer>
        <h3>Manual UserInfo Configuration</h3>
        <p>You can also manually configure the UserInfo POST request:</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <FormGroup>
            <Label>Access Token</Label>
            <Input
              type="text"
              value={formData.accessToken}
              onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
              placeholder="Enter access token"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Client ID</Label>
            <Input
              type="text"
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Scope</Label>
            <Input
              type="text"
              value={formData.scope}
              onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>UI Locales</Label>
            <Input
              type="text"
              value={formData.uiLocales}
              onChange={(e) => setFormData(prev => ({ ...prev, uiLocales: e.target.value }))}
            />
          </FormGroup>
        </div>
        
        <FormGroup>
          <Label>Claims (JSON)</Label>
          <TextArea
            value={formData.claims}
            onChange={(e) => setFormData(prev => ({ ...prev, claims: e.target.value }))}
            placeholder='{"userinfo": {"email": null, "phone_number": null}}'
          />
        </FormGroup>
        
        <Button $variant="primary" onClick={handleUserInfoRequest}>
          Request UserInfo
        </Button>
      </FormContainer>
    </FlowContainer>
  );
};

export default UserInfoPostFlow;
