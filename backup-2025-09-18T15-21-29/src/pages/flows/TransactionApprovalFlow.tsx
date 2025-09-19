/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import FlowCredentials from '../../components/FlowCredentials';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { logger } from '../../utils/logger';
import JSONHighlighter from '../../components/JSONHighlighter';

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

const TransactionContainer = styled.div`;
  background: #f8 fafc;
  border: 2 px solid #e2 e8 f0;
  border-radius: 0.5 rem;
  padding: 1.5 rem;
  margin: 1 rem 0;
`;

const TransactionTitle = styled.h4`;
  margin: 0 0 1 rem 0;
  color: #1 f2937;
  font-size: 1.125 rem;
  font-weight: 600;
`;

const TransactionDetails = styled.div`;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200 px, 1 fr));
  gap: 1 rem;
  margin-bottom: 1 rem;
`;

const TransactionDetail = styled.div`;
  display: flex;
  flex-direction: column;
`;

const TransactionLabel = styled.span`;
  font-size: 0.75 rem;
  color: #6 b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25 rem;
`;

const TransactionValue = styled.span`;
  font-size: 0.875 rem;
  color: #1 f2937;
  font-weight: 500;
`;

const ApprovalContainer = styled.div`;
  background: #fef3 c7;
  border: 1 px solid #fde68 a;
  border-radius: 0.375 rem;
  padding: 1 rem;
  margin: 1 rem 0;
  text-align: center;
`;

const ApprovalQuestion = styled.div`;
  font-size: 1.125 rem;
  font-weight: 600;
  color: #92400 e;
  margin-bottom: 1 rem;
`;

const ApprovalButtons = styled.div`;
  display: flex;
  gap: 1 rem;
  justify-content: center;
`;

interface TransactionApprovalFlowProps {
  credentials?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    environmentId: string;
  };
}

const TransactionApprovalFlow: React.FC<TransactionApprovalFlowProps> = ({ credentials }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    clientId: credentials?.clientId || '',
    clientSecret: credentials?.clientSecret || '',
    redirectUri: credentials?.redirectUri || 'http://localhost:3000/callback',
    environmentId: credentials?.environmentId || '',
    scope: 'openid profile email',
    transactionType: 'payment',
    transactionAmount: '100.00',
    transactionCurrency: 'USD',
    transactionDescription: 'Sample payment transaction',
    transactionId: '',
    acrValues: 'urn:mace:pingidentity.com:loc:1',
    prompt: 'consent',
    maxAge: '3600',
    uiLocales: 'en',
    claims: '{"userinfo": {"email": null, "phone_number": null}}'
  });

  const [transactionStep, setTransactionStep] = useState<'initiate' | 'approve' | 'complete'>('initiate');
  const [transactionApproved, setTransactionApproved] = useState<boolean | null>(null);

  const generateTransactionId = () => {;
    const id = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, transactionId: id }));
    return id;
  };

  const steps = [
    {
      id: 'step-1',
      title: 'Configure Transaction Approval Settings',
      description: 'Set up your OAuth client for transaction approval flow.',
      code: `// Transaction Approval Configuration
const transactionConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  redirectUri: '${formData.redirectUri}',
  environmentId: '${formData.environmentId}',
  scope: '${formData.scope}',
  transactionType: '${formData.transactionType}',
  transactionAmount: '${formData.transactionAmount}',
  transactionCurrency: '${formData.transactionCurrency}',
  transactionDescription: '${formData.transactionDescription}',
  acrValues: '${formData.acrValues}',
  prompt: '${formData.prompt}',
  maxAge: ${formData.maxAge},
  uiLocales: '${formData.uiLocales}',
  claims: ${formData.claims};
};

console.log('Transaction approval configured:', transactionConfig);`,
      execute: async () => {
        logger.info('TransactionApprovalFlow', 'Configuring transaction approval settings');
        generateTransactionId();
      }
    },
    {
      id: 'step-2',
      title: 'Initiate Transaction',
      description: 'Create a transaction that requires user approval.',
      code: `// Initiate Transaction
const transactionId = '${formData.transactionId}';
const transaction = {
  id: transactionId,
  type: '${formData.transactionType}',
  amount: '${formData.transactionAmount}',
  currency: '${formData.transactionCurrency}',
  description: '${formData.transactionDescription}',
  timestamp: new Date().toISOString(),
  status: 'pending_approval';
};

console.log('Transaction initiated:', transaction);

// Store transaction for approval
localStorage.setItem('pending_transaction', JSON.stringify(transaction));`,
      execute: async () => {
        logger.info('TransactionApprovalFlow', 'Initiating transaction');
        setDemoStatus('loading');
        
        try {
          const transaction = {
            id: formData.transactionId,
            type: formData.transactionType,
            amount: formData.transactionAmount,
            currency: formData.transactionCurrency,
            description: formData.transactionDescription,
            timestamp: new Date().toISOString(),
            status: 'pending_approval';
          };

          const mockResponse = {
            success: true,
            message: 'Transaction initiated successfully',
            transaction: transaction,
            requiresApproval: true;
          };

          setResponse(mockResponse);
          setDemoStatus('success');
          setTransactionStep('approve');
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
      title: 'Request Transaction Approval',
      description: 'Request user approval for the pending transaction.',
      code: `// Request Transaction Approval
const authUrl = \`https://auth.pingone.com/\${environmentId}/as/authorize\`;

const authParams = new URLSearchParams({
  client_id: '${formData.clientId}',
  response_type: 'code',
  redirect_uri: '${formData.redirectUri}',
  scope: '${formData.scope}',
  acr_values: '${formData.acrValues}',
  prompt: '${formData.prompt}',
  max_age: '${formData.maxAge}',
  ui_locales: '${formData.uiLocales}',
  claims: '${formData.claims}',
  state: generateState(),
  nonce: generateNonce(),
  // Transaction-specific parameters
  transaction_id: '${formData.transactionId}',
  transaction_type: '${formData.transactionType}',
  transaction_amount: '${formData.transactionAmount}',
  transaction_currency: '${formData.transactionCurrency}';
});

const fullAuthUrl = \`\${authUrl}?\${authParams.toString()}\`;
console.log('Transaction approval URL:', fullAuthUrl);`,
      execute: async () => {
        logger.info('TransactionApprovalFlow', 'Requesting transaction approval');
      }
    },
    {
      id: 'step-4',
      title: 'Process Transaction Approval',
      description: 'Handle the user\'s approval or denial of the transaction.',
      code: `// Process Transaction Approval
const approvalResponse = await fetch('/transaction/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionId: '${formData.transactionId}',
    approved: userApproval, // true or false
    userId: currentUserId,
    timestamp: new Date().toISOString()
  });
});

if (approvalResponse.ok) {

  console.log('Transaction approval processed:', result);
  
  if (result.approved) {
    // Continue with authorization flow
    console.log('Transaction approved, proceeding with OAuth flow');
  } else {
    console.log('Transaction denied by user');
  }
}`,
      execute: async () => {
        logger.info('TransactionApprovalFlow', 'Processing transaction approval');
        
        try {
          // Simulate approval processing
          const mockResponse = {
            success: true,
            message: 'Transaction approval processed',
            transactionId: formData.transactionId,
            approved: transactionApproved,
            timestamp: new Date().toISOString();
          };

          setResponse(prev => ({ ...prev, approval: mockResponse }));
          setTransactionStep('complete');
        } catch (_error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          throw error;
        }
      }
    },
    {
      id: 'step-5',
      title: 'Exchange Code for Tokens',
      description: 'Exchange the authorization code for access and ID tokens.',
      code: `// Exchange authorization code for tokens
const tokenUrl = \`https://auth.pingone.com/\${environmentId}/as/token\`;

const tokenData = new FormData();
tokenData.append('grant_type', 'authorization_code');
tokenData.append('code', authorizationCode);
tokenData.append('redirect_uri', '${formData.redirectUri}');
tokenData.append('client_id', '${formData.clientId}');
tokenData.append('client_secret', '${formData.clientSecret}');

const tokenResponse = await fetch(tokenUrl, {
  method: 'POST',
  body: tokenData;
});

if (tokenResponse.ok) {

  console.log('Tokens received:', tokens);
  
  // Store tokens with transaction context
  const tokensWithTransaction = {
    ...tokens,
    transaction_id: '${formData.transactionId}',
    transaction_approved: true;
  };
  
  localStorage.setItem('oauth_tokens', JSON.stringify(tokensWithTransaction));
}`,
      execute: async () => {
        logger.info('TransactionApprovalFlow', 'Exchanging code for tokens');
        
        try {
          // Simulate token exchange
          const mockTokens = {
            access_token: 'mock_access_token_' + Date.now(),
            id_token: 'mock_id_token_' + Date.now(),
            token_type: 'Bearer',
            expires_in: 3600,
            scope: formData.scope,
            refresh_token: 'mock_refresh_token_' + Date.now(),
            transaction_id: formData.transactionId,
            transaction_approved: true;
          };

          // Store tokens using the standardized method
          const success = storeOAuthTokens(mockTokens, 'transaction-approval', 'Transaction Approval Flow');
          
          if (success) {
            setResponse(prev => ({ ...prev, tokens: mockTokens }));
          } else {
            throw new Error('Failed to store tokens');
          }
        } catch (_error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          throw error;
        }
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
    logger.info('TransactionApprovalFlow', `Step ${step + 1} completed`, result);
  }, []);

  const handleTransactionApproval = (approved: boolean) => {;
    setTransactionApproved(approved);
    logger.info('TransactionApprovalFlow', 'Transaction approval decision', { approved });
  };

  const handleTransactionComplete = () => {;
    setTransactionStep('initiate');
    setTransactionApproved(null);
    setResponse(null);
    setError(null);
  };

  return (
    <FlowContainer>
      <FlowTitle>Transaction Approval Flow</FlowTitle>
      <FlowDescription>
        This flow demonstrates transaction approval authorization. It requires users to 
        explicitly approve specific transactions before receiving tokens, providing 
        enhanced security for financial and sensitive operations.
      </FlowDescription>

      <InfoContainer>
        <h4>💰 Transaction Approval Benefits</h4>
        <p>
          The Transaction Approval flow ensures users explicitly approve each transaction 
          before authorization. This is particularly useful for financial applications, 
          payment processing, and other sensitive operations where user consent is critical.
        </p>
      </InfoContainer>

      <FlowCredentials
        flowType="transaction-approval"
        onCredentialsChange={(newCredentials) => {
          setFormData(prev => ({
            ...prev,
            clientId: newCredentials.clientId || prev.clientId,
            clientSecret: newCredentials.clientSecret || prev.clientSecret,
            redirectUri: newCredentials.redirectUri || prev.redirectUri,
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
          setTransactionStep('initiate');
          setTransactionApproved(null);
        }}
        status={demoStatus}
        disabled={demoStatus === 'loading'}
        title="Transaction Approval Flow Steps"
      />

      {transactionStep === 'approve' && response && (
        <TransactionContainer>
          <TransactionTitle>Transaction Approval Required</TransactionTitle>
          
          <TransactionDetails>
            <TransactionDetail>
              <TransactionLabel>Transaction ID</TransactionLabel>
              <TransactionValue>{response.transaction.id}</TransactionValue>
            </TransactionDetail>
            <TransactionDetail>
              <TransactionLabel>Type</TransactionLabel>
              <TransactionValue>{response.transaction.type}</TransactionValue>
            </TransactionDetail>
            <TransactionDetail>
              <TransactionLabel>Amount</TransactionLabel>
              <TransactionValue>{response.transaction.currency} {response.transaction.amount}</TransactionValue>
            </TransactionDetail>
            <TransactionDetail>
              <TransactionLabel>Description</TransactionLabel>
              <TransactionValue>{response.transaction.description}</TransactionValue>
            </TransactionDetail>
            <TransactionDetail>
              <TransactionLabel>Status</TransactionLabel>
              <TransactionValue>{response.transaction.status}</TransactionValue>
            </TransactionDetail>
            <TransactionDetail>
              <TransactionLabel>Timestamp</TransactionLabel>
              <TransactionValue>{new Date(response.transaction.timestamp).toLocaleString()}</TransactionValue>
            </TransactionDetail>
          </TransactionDetails>

          <ApprovalContainer>
            <ApprovalQuestion>
              Do you approve this transaction?
            </ApprovalQuestion>
            <ApprovalButtons>
              <Button $variant="success" onClick={() => handleTransactionApproval(true)}>
                Approve Transaction
              </Button>
              <Button $variant="danger" onClick={() => handleTransactionApproval(false)}>
                Deny Transaction
              </Button>
            </ApprovalButtons>
          </ApprovalContainer>
        </TransactionContainer>
      )}

      {transactionStep === 'complete' && (
        <TransactionContainer>
          <TransactionTitle>Transaction Approval Complete</TransactionTitle>
          <p>
            Transaction {transactionApproved ? 'approved' : 'denied'} successfully. 
            {transactionApproved ? ' Proceeding with authorization flow.' : ' Authorization cancelled.'}
          </p>
          
          <Button $variant="primary" onClick={handleTransactionComplete}>
            Start New Transaction
          </Button>
        </TransactionContainer>
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
        <h3>Manual Transaction Configuration</h3>
        <p>You can also manually configure the transaction approval flow:</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1 fr 1 fr', gap: '1 rem', marginBottom: '1 rem' }}>
          <FormGroup>
            <Label>Transaction Type</Label>
            <Select
              value={formData.transactionType}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionType: e.target.value }))}
            >
              <option value="payment">Payment</option>
              <option value="transfer">Transfer</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="deposit">Deposit</option>
              <option value="refund">Refund</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.transactionAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionAmount: e.target.value }))}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Currency</Label>
            <Select
              value={formData.transactionCurrency}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionCurrency: e.target.value }))}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CAD">CAD</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Description</Label>
            <Input
              type="text"
              value={formData.transactionDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionDescription: e.target.value }))}
            />
          </FormGroup>
        </div>
      </FormContainer>
    </FlowContainer>
  );
};

export default TransactionApprovalFlow;
