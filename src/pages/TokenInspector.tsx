import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiEye, FiEyeOff, FiCheckCircle, FiXCircle, FiCopy, FiDownload } from 'react-icons/fi';
import { decodeJwt, formatJwt, validateToken, getTimeRemainingFormatted } from '../utils/jwt';
import { oauthStorage } from '../utils/storage';

const TokenInspectorContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
  }
`;

const TokenInputSection = styled(Card)`
  margin-bottom: 2rem;
`;

const TokenInput = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray700};
  }
  
  textarea {
    width: 100%;
    min-height: 120px;
    padding: 0.75rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    border: 1px solid ${({ theme }) => theme.colors.gray300};
    border-radius: 0.375rem;
    resize: vertical;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}40`};
    }
  }
`;

const TokenActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
    gap: 0.5rem;
    
    &:hover {
      transform: translateY(-1px);
    }
  }
`;

const LoadStoredButton = styled.button`
  background-color: ${({ theme }) => theme.colors.info};
  color: white;
  border: 1px solid transparent;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.infoDark || theme.colors.info};
  }
`;

const ClearButton = styled.button`
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray700};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray200};
  }
`;

const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TokenValidationCard = styled(Card)`
  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    
    svg {
      font-size: 1.25rem;
    }
  }
`;

const ValidationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  
  &.valid {
    background-color: ${({ theme }) => theme.colors.success}20;
    color: ${({ theme }) => theme.colors.success};
    border: 1px solid ${({ theme }) => theme.colors.success}40;
  }
  
  &.invalid {
    background-color: ${({ theme }) => theme.colors.danger}20;
    color: ${({ theme }) => theme.colors.danger};
    border: 1px solid ${({ theme }) => theme.colors.danger}40;
  }
  
  &.warning {
    background-color: ${({ theme }) => theme.colors.warning}20;
    color: ${({ theme }) => theme.colors.warning};
    border: 1px solid ${({ theme }) => theme.colors.warning}40;
  }
`;

const TokenPartsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const TokenPartCard = styled(Card)`
  h4 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.gray800};
  }
`;

const TokenDisplay = styled.pre`
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
`;

const ClaimsTable = styled.div`
  margin-top: 1rem;
`;

const ClaimRow = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  align-items: start;
  
  &:last-child {
    border-bottom: none;
  }
  
  .claim-key {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray700};
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
  }
  
  .claim-value {
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 0.875rem;
    line-height: 1.4;
    
    &.json {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
  }
`;

const TokenInspector = () => {
  const [token, setToken] = useState('');
  const [formattedToken, setFormattedToken] = useState(null);
  const [validation, setValidation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load stored tokens on component mount
  useEffect(() => {
    const storedTokens = oauthStorage.getTokens();
    if (storedTokens?.access_token) {
      setToken(storedTokens.access_token);
    }
  }, []);

  // Analyze token when it changes
  useEffect(() => {
    if (token.trim()) {
      analyzeToken(token.trim());
    } else {
      setFormattedToken(null);
      setValidation(null);
    }
  }, [token]);

  const analyzeToken = async (tokenToAnalyze) => {
    setIsLoading(true);
    try {
      // Format the token
      const formatted = formatJwt(tokenToAnalyze);
      setFormattedToken(formatted);

      // Validate the token
      const validationResult = validateToken(tokenToAnalyze, {
        requiredClaims: ['iss', 'sub', 'aud', 'exp', 'iat'],
        requiredScopes: []
      });
      setValidation(validationResult);

    } catch (error) {
      console.error('Error analyzing token:', error);
      setValidation({
        valid: false,
        error: error.message || 'Invalid token format'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoredTokens = () => {
    const storedTokens = oauthStorage.getTokens();
    if (storedTokens?.access_token) {
      setToken(storedTokens.access_token);
    } else if (storedTokens?.id_token) {
      setToken(storedTokens.id_token);
    }
  };

  const clearToken = () => {
    setToken('');
    setFormattedToken(null);
    setValidation(null);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
  };

  const downloadToken = () => {
    const blob = new Blob([token], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'token.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderClaims = (claims) => {
    if (!claims) return null;

    const entries = Object.entries(claims).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
      isJson: typeof value === 'object'
    }));

    return (
      <ClaimsTable>
        {entries.map(({ key, value, isJson }) => (
          <ClaimRow key={key}>
            <div className="claim-key">{key}</div>
            <div className={`claim-value ${isJson ? 'json' : ''}`}>
              {value}
            </div>
          </ClaimRow>
        ))}
      </ClaimsTable>
    );
  };

  return (
    <TokenInspectorContainer>
      <PageHeader>
        <h1>Token Inspector</h1>
        <p>Analyze and inspect JWT tokens from your OAuth flows</p>
      </PageHeader>

      <TokenInputSection>
        <CardHeader>
          <h2>Token Input</h2>
        </CardHeader>
        <CardBody>
          <TokenInput>
            <label htmlFor="token-input">JWT Token</label>
            <textarea
              id="token-input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your JWT token here..."
              spellCheck={false}
            />
          </TokenInput>

          <TokenActions>
            <LoadStoredButton onClick={loadStoredTokens}>
              <FiEye /> Load Stored Token
            </LoadStoredButton>
            <button onClick={copyToken} disabled={!token}>
              <FiCopy /> Copy
            </button>
            <button onClick={downloadToken} disabled={!token}>
              <FiDownload /> Download
            </button>
            <ClearButton onClick={clearToken}>
              <FiXCircle /> Clear
            </ClearButton>
          </TokenActions>
        </CardBody>
      </TokenInputSection>

      {formattedToken && (
        <AnalysisGrid>
          <div>
            <TokenValidationCard>
              <CardHeader>
                <h3>
                  {validation?.valid ? (
                    <>
                      <FiCheckCircle />
                      Token Valid
                    </>
                  ) : (
                    <>
                      <FiXCircle />
                      Token Invalid
                    </>
                  )}
                </h3>
              </CardHeader>
              <CardBody>
                <ValidationStatus className={validation?.valid ? 'valid' : 'invalid'}>
                  {validation?.valid ? (
                    <>
                      <FiCheckCircle />
                      Token is valid and properly formatted
                    </>
                  ) : (
                    <>
                      <FiXCircle />
                      {validation?.error || 'Token validation failed'}
                    </>
                  )}
                </ValidationStatus>

                {formattedToken.payload?.exp && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Expires:</strong> {getTimeRemainingFormatted(formattedToken.raw)}
                  </div>
                )}
              </CardBody>
            </TokenValidationCard>

            <TokenPartCard>
              <CardHeader>
                <h4>Header</h4>
              </CardHeader>
              <CardBody>
                <TokenDisplay>
                  {JSON.stringify(formattedToken.header, null, 2)}
                </TokenDisplay>
              </CardBody>
            </TokenPartCard>
          </div>

          <div>
            <TokenPartCard>
              <CardHeader>
                <h4>Payload (Claims)</h4>
              </CardHeader>
              <CardBody>
                {formattedToken.payload ? (
                  renderClaims(formattedToken.payload)
                ) : (
                  <TokenDisplay>
                    {JSON.stringify(formattedToken.payload, null, 2)}
                  </TokenDisplay>
                )}
              </CardBody>
            </TokenPartCard>

            <TokenPartCard>
              <CardHeader>
                <h4>Signature</h4>
              </CardHeader>
              <CardBody>
                <TokenDisplay>
                  {formattedToken.signature}
                </TokenDisplay>
              </CardBody>
            </TokenPartCard>
          </div>
        </AnalysisGrid>
      )}
    </TokenInspectorContainer>
  );
};

export default TokenInspector;
