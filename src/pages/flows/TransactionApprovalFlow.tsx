import type React from "react";
import { useCallback, useState } from "react";
import styled from "styled-components";
import FlowCredentials from "../../components/FlowCredentials";
import JSONHighlighter from "../../components/JSONHighlighter";
import { StepByStepFlow } from "../../components/StepByStepFlow";
import { logger } from "../../utils/logger";
import { storeOAuthTokens } from "../../utils/tokenStorage";

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

const _TextArea = styled.textarea`
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

const Button = styled.button<{ $variant: "primary" | "secondary" | "success" | "danger" }>`
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
      case "primary":
        return `
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
      case "secondary":
        return `
          background-color: #6b7280;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
      case "success":
        return `
          background-color: #10b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
      case "danger":
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

const TransactionContainer = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const TransactionTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`;

const TransactionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TransactionDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const TransactionLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const TransactionValue = styled.span`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
`;

const ApprovalContainer = styled.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  text-align: center;
`;

const ApprovalQuestion = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 1rem;
`;

const ApprovalButtons = styled.div`
  display: flex;
  gap: 1rem;
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
  const [demoStatus, setDemoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    clientId: credentials?.clientId || "",
    clientSecret: credentials?.clientSecret || "",
    redirectUri: credentials?.redirectUri || "http://localhost:3000/callback",
    environmentId: credentials?.environmentId || "",
    scope: "openid profile email",
    transactionType: "payment",
    transactionAmount: "100.00",
    transactionCurrency: "USD",
    transactionDescription: "Sample payment transaction",
    transactionId: "",
    acrValues: "urn:mace:pingidentity.com:loc:1",
    prompt: "consent",
    maxAge: "3600",
    uiLocales: "en",
    claims: '{"userinfo": {"email": null, "phone_number": null}}',
  });
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionStep, setTransactionStep] = useState<"initiate" | "approve" | "complete">(
    "initiate",
  );
  const [transactionApproved, setTransactionApproved] = useState<boolean | null>(null);

  const generateTransactionId = () => {
    const id = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setFormData((prev) => ({ ...prev, transactionId: id }));
    return id;
  };

  const steps = [
    {
      id: "step-1",
      title: "Configure Transaction Approval Settings",
      description: "Set up your OAuth client for transaction approval flow.",
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
  claims: ${formData.claims}
};

console.log('Transaction approval configured:', transactionConfig);`,
      execute: async () => {
        logger.info("TransactionApprovalFlow", "Configuring transaction approval settings");
        generateTransactionId();
      },
    },
    {
      id: "step-2",
      title: "Initiate Transaction",
      description: "Create a transaction that requires user approval.",
      code: `// Initiate Transaction
const transactionId = '${formData.transactionId}';
const transaction = {
  id: transactionId,
  type: '${formData.transactionType}',
  amount: '${formData.transactionAmount}',
  currency: '${formData.transactionCurrency}',
  description: '${formData.transactionDescription}',
  timestamp: new Date().toISOString(),
  status: 'pending_approval'
};

console.log('Transaction initiated:', transaction);

// Store transaction for approval
localStorage.setItem('pending_transaction', JSON.stringify(transaction));`,
      execute: async () => {
        logger.info("TransactionApprovalFlow", "Initiating transaction");
        setDemoStatus("loading");

        try {
          const transaction = {
            id: formData.transactionId,
            type: formData.transactionType,
            amount: formData.transactionAmount,
            currency: formData.transactionCurrency,
            description: formData.transactionDescription,
            timestamp: new Date().toISOString(),
            status: "pending_approval",
          };

          const mockResponse = {
            success: true,
            message: "Transaction initiated successfully",
            transaction: transaction,
            requiresApproval: true,
          };

          setResponse(mockResponse);
          setDemoStatus("success");
          setTransactionStep("approve");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          setError(errorMessage);
          setDemoStatus("error");
          throw error;
        }
      },
    },
    {
      id: "step-3",
      title: "Request Transaction Approval",
      description: "Request user approval for the pending transaction.",
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
  transaction_currency: '${formData.transactionCurrency}'
});

const fullAuthUrl = \`\${authUrl}?\${authParams.toString()}\`;
console.log('Transaction approval URL:', fullAuthUrl);`,
      execute: async () => {
        logger.info("TransactionApprovalFlow", "Requesting transaction approval");
      },
    },
    {
      id: "step-4",
      title: "Process Transaction Approval",
      description: "Handle the user's approval or denial of the transaction.",
      code: `// Process Transaction Approval
const approvalResponse = await fetch('/transaction/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionId: '${formData.transactionId}',
    approved: userApproval, // true or false
    userId: currentUserId,
    timestamp: new Date().toISOString()
  })
});

if (approvalResponse.ok) {
  const result = await approvalResponse.json();
  console.log('Transaction approval processed:', result);
  
  if (result.approved) {
    // Continue with authorization flow
    console.log('Transaction approved, proceeding with OAuth flow');
  } else {
    console.log('Transaction denied by user');
  }
}`,
      execute: async () => {
        logger.info("TransactionApprovalFlow", "Processing transaction approval");

        try {
          // Simulate approval processing
          const mockResponse = {
            success: true,
            message: "Transaction approval processed",
            transactionId: formData.transactionId,
            approved: transactionApproved,
            timestamp: new Date().toISOString(),
          };

          setResponse((prev) => ({ ...prev, approval: mockResponse }));
          setTransactionStep("complete");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          setError(errorMessage);
          throw error;
        }
      },
    },
    {
      id: "step-5",
      title: "Exchange Code for Tokens",
      description: "Exchange the authorization code for access and ID tokens.",
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
  body: tokenData
});

if (tokenResponse.ok) {
  const tokens = await tokenResponse.json();
  console.log('Tokens received:', tokens);
  
  // Store tokens with transaction context
  const tokensWithTransaction = {
    ...tokens,
    transaction_id: '${formData.transactionId}',
    transaction_approved: true
  };
  
  localStorage.setItem('oauth_tokens', JSON.stringify(tokensWithTransaction));
}`,
      execute: async () => {
        logger.info("TransactionApprovalFlow", "Exchanging code for tokens");

        try {
          // Simulate token exchange
          const mockTokens = {
            access_token: `mock_access_token_${Date.now()}`,
            id_token: `mock_id_token_${Date.now()}`,
            token_type: "Bearer",
            expires_in: 3600,
            scope: formData.scope,
            refresh_token: `mock_refresh_token_${Date.now()}`,
            transaction_id: formData.transactionId,
            transaction_approved: true,
          };

          // Store tokens using the standardized method
          const success = storeOAuthTokens(
            mockTokens,
            "transaction-approval",
            "Transaction Approval Flow",
          );

          if (success) {
            setResponse((prev) => ({ ...prev, tokens: mockTokens }));
          } else {
            throw new Error("Failed to store tokens");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          setError(errorMessage);
          throw error;
        }
      },
    },
  ];

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    setDemoStatus("idle");
    setResponse(null);
    setError(null);
  }, []);

  const handleStepResult = useCallback((step: number, result: unknown) => {
    logger.info("TransactionApprovalFlow", `Step ${step + 1} completed`, result);
  }, []);

  const handleTransactionApproval = (approved: boolean) => {
    setTransactionApproved(approved);
    logger.info("TransactionApprovalFlow", "Transaction approval decision", { approved });
  };

  const handleTransactionComplete = () => {
    setTransactionStep("initiate");
    setTransactionApproved(null);
    setResponse(null);
    setError(null);
  };

  return (
    <FlowContainer>
      <FlowTitle>Transaction Approval Flow</FlowTitle>
      <FlowDescription>
        This flow demonstrates transaction approval authorization. It requires users to explicitly
        approve specific transactions before receiving tokens, providing enhanced security for
        financial and sensitive operations.
      </FlowDescription>

      <InfoContainer>
        <h4>💰 Transaction Approval Benefits</h4>
        <p>
          The Transaction Approval flow ensures users explicitly approve each transaction before
          authorization. This is particularly useful for financial applications, payment processing,
          and other sensitive operations where user consent is critical.
        </p>
      </InfoContainer>

      <FlowCredentials
        flowType="transaction-approval"
        onCredentialsChange={(newCredentials) => {
          setFormData((prev) => ({
            ...prev,
            clientId: newCredentials.clientId || prev.clientId,
            clientSecret: newCredentials.clientSecret || prev.clientSecret,
            redirectUri: newCredentials.redirectUri || prev.redirectUri,
            environmentId: newCredentials.environmentId || prev.environmentId,
          }));
        }}
      />

      <StepByStepFlow
        steps={steps}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onStepResult={handleStepResult}
        onStart={() => setDemoStatus("loading")}
        onReset={() => {
          setCurrentStep(0);
          setDemoStatus("idle");
          setResponse(null);
          setError(null);
          setTransactionStep("initiate");
          setTransactionApproved(null);
        }}
        status={demoStatus}
        disabled={demoStatus === "loading"}
        title="Transaction Approval Flow Steps"
      />

      {transactionStep === "approve" && response && (
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
              <TransactionValue>
                {response.transaction.currency} {response.transaction.amount}
              </TransactionValue>
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
              <TransactionValue>
                {new Date(response.transaction.timestamp).toLocaleString()}
              </TransactionValue>
            </TransactionDetail>
          </TransactionDetails>

          <ApprovalContainer>
            <ApprovalQuestion>Do you approve this transaction?</ApprovalQuestion>
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

      {transactionStep === "complete" && (
        <TransactionContainer>
          <TransactionTitle>Transaction Approval Complete</TransactionTitle>
          <p>
            Transaction {transactionApproved ? "approved" : "denied"} successfully.
            {transactionApproved
              ? " Proceeding with authorization flow."
              : " Authorization cancelled."}
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <FormGroup>
            <Label>Transaction Type</Label>
            <Select
              value={formData.transactionType}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, transactionType: e.target.value }))
              }
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
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, transactionAmount: e.target.value }))
              }
            />
          </FormGroup>

          <FormGroup>
            <Label>Currency</Label>
            <Select
              value={formData.transactionCurrency}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, transactionCurrency: e.target.value }))
              }
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
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, transactionDescription: e.target.value }))
              }
            />
          </FormGroup>
        </div>
      </FormContainer>
    </FlowContainer>
  );
};

export default TransactionApprovalFlow;
