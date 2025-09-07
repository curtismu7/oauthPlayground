import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from 'styled-components';
import { FiCheckCircle, FiXCircle, FiCopy, FiDownload, FiEye, FiAlertTriangle } from 'react-icons/fi';
import { formatJwt, validateToken, type FormattedJwt, type ValidationResult } from '../utils/jwt';
import { oauthStorage } from '../utils/storage';
import { defaultTheme } from '../types/token-inspector';
import { createTokenError, isTokenError, TokenValidationError, TokenErrorMessages } from '../types/oauthErrors';
import {
  Container,
  PageHeader,
  TokenDisplay,
  TokenHeader,
  TokenPayload,
  CardHeader,
  CardBody,
  ActionButton,
  AnalysisGrid,
  TokenPartCard,
  TokenValidationCard,
  ValidationStatus,
  ClaimsTable,
  ClaimRow
} from '../components/token/TokenStyles';

interface ClaimEntry {
  key: string;
  value: unknown;
  isJson: boolean;
  error?: string;
}

type TokenInspectionResult = {
  formattedToken: FormattedJwt | null;
  validation: ValidationResult | null;
  claims: ClaimEntry[];
  error: TokenValidationError | null;
};

const TokenInspector: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [inspectionResult, setInspectionResult] = useState<TokenInspectionResult>({
    formattedToken: null,
    validation: null,
    claims: [],
    error: null
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  const { formattedToken, validation, claims, error } = inspectionResult;

  // Format JSON with syntax highlighting and error handling
  const formatJson = useCallback((obj: unknown): string => {
    try {
      if (obj === null || obj === undefined) return 'null';
      if (typeof obj === 'string') {
        try {
          // Try to parse if it's a JSON string
          const parsed = JSON.parse(obj);
          return JSON.stringify(parsed, null, 2);
        } catch (e) {
          // If not JSON, return as string
          return `"${obj}"`;
        }
      }
      if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
      if (typeof obj === 'object') {
        return JSON.stringify(obj, null, 2);
      }
      return String(obj);
    } catch (err) {
      console.error('Error formatting JSON:', err);
      return `[Error: ${err instanceof Error ? err.message : 'Unknown error formatting JSON'}]`;
    }
  }, []);

  // Load stored tokens on component mount
  useEffect(() => {
    try {
      const storedTokens = oauthStorage.getTokens();
      if (storedTokens?.access_token) {
        setToken(storedTokens.access_token);
      }
    } catch (err) {
      const error = createTokenError('configuration_error', {
        description: 'Failed to load stored tokens',
        originalError: err
      });
      setInspectionResult(prev => ({
        ...prev,
        error
      }));
    }
  }, []);

  // Analyze token when it changes
  useEffect(() => {
    const analyzeToken = async () => {
      if (!token.trim()) {
        setInspectionResult({
          formattedToken: null,
          validation: null,
          claims: [],
          error: null
        });
        return;
      }

      setIsLoading(true);

      try {
        // Format the token
        const formatted = formatJwt(token);
        if (!formatted) {
          throw createTokenError('invalid_token', {
            description: 'Failed to parse JWT token',
          });
        }

        // Validate the token
        const validationResult = validateToken(token);
        
        // Extract claims
        let claimEntries: ClaimEntry[] = [];
        if (formatted.payload && typeof formatted.payload === 'object') {
          claimEntries = Object.entries(formatted.payload).map(([key, value]) => {
            try {
              return {
                key,
                value,
                isJson: typeof value === 'object' && value !== null,
              };
            } catch (err) {
              return {
                key,
                value: `[Error: ${err instanceof Error ? err.message : 'Failed to parse claim'}]`,
                isJson: false,
                error: 'Failed to parse claim'
              };
            }
          });
        }

        setInspectionResult({
          formattedToken: formatted,
          validation: validationResult,
          claims: claimEntries,
          error: validationResult.valid ? null : createTokenError('invalid_token', {
            description: (validationResult.error && typeof validationResult.error === 'string' 
              ? validationResult.error 
              : 'Token validation failed'),
          })
        });
      } catch (err) {
        console.error('Error analyzing token:', err);
        
        const error = isTokenError(err) 
          ? err 
          : createTokenError('invalid_token', {
              description: 'Failed to analyze token',
              originalError: err
            });
            
        setInspectionResult(prev => ({
          ...prev,
          error
        }));
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(analyzeToken, 300);
    return () => clearTimeout(debounceTimer);
  }, [token, formatJson]);

  // Handle copy to clipboard
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }).catch(err => {
      console.error('Failed to copy text:', err);
      // Could show a toast notification here
    });
  }, []);

  // Handle download
  const handleDownload = useCallback((content: string, filename: string) => {
    try {
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Failed to download file:', err);
      // Could show a toast notification here
    }
  }, []);

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container>
        <PageHeader>
          <h1>Token Inspector</h1>
          <p>Inspect and validate JWT tokens</p>
        </PageHeader>

        <TokenPartCard>
          <CardHeader>
            <h3>Token Input</h3>
          </CardHeader>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your JWT token here..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ActionButton
                onClick={() => {
                  const storedTokens = oauthStorage.getTokens();
                  if (storedTokens?.access_token) {
                    setToken(storedTokens.access_token);
                  }
                }}
                variant="secondary"
              >
                <FiEye /> Load from Storage
              </ActionButton>
              <ActionButton
                onClick={() => {
                  setInspectionResult({
                    formattedToken: null,
                    validation: null,
                    claims: [],
                    error: null
                  });
                  setToken('');
                }}
                variant="danger"
              >
                Clear
              </ActionButton>
            </div>
          </CardBody>
        </TokenPartCard>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Analyzing token...</p>
          </div>
        )}

        {error && (
          <div style={{
            color: '#721c24',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            padding: '1rem',
            margin: '1rem 0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <FiAlertTriangle style={{ flexShrink: 0, marginTop: '0.2rem' }} />
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {TokenErrorMessages[error.code as keyof typeof TokenErrorMessages] || 'An error occurred'}
              </div>
              <div style={{ fontSize: '0.9em', color: '#721c24cc' }}>
                {error.description || error.message}
              </div>
              {process.env.NODE_ENV === 'development' && error.stack && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.8em' }}>Show details</summary>
                  <pre style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: '#00000010',
                    borderRadius: '4px',
                    overflowX: 'auto',
                    fontSize: '0.8em',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {formattedToken && (
          <AnalysisGrid>
            <TokenValidationCard>
              <CardHeader>
                <h3>Token Validation</h3>
              </CardHeader>
              <CardBody>
                {validation && (
                  <ValidationStatus valid={validation.valid}>
                    {validation.valid ? (
                      <>
                        <FiCheckCircle />
                        <span>Token is valid</span>
                      </>
                    ) : (
                      <>
                        <FiXCircle />
                        <span>Token is invalid</span>
                      </>
                    )}
                  </ValidationStatus>
                )}
                
                {validation?.error && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4>Issues found:</h4>
                    <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                      <li style={{ color: '#dc3545', marginBottom: '0.25rem' }}>
                        {validation.error}
                      </li>
                    </ul>
                  </div>
                )}
              </CardBody>
            </TokenValidationCard>

            <TokenPartCard>
              <CardHeader>
                <h3>Token Details</h3>
              </CardHeader>
              <CardBody>
                <div style={{ marginBottom: '1rem' }}>
                  <h4>Header</h4>
                  <TokenHeader>
                    <code>{formatJson(formattedToken.header)}</code>
                  </TokenHeader>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <ActionButton
                      onClick={() => handleCopy(JSON.stringify(formattedToken.header, null, 2))}
                      variant="secondary"
                    >
                      <FiCopy /> {copied ? 'Copied!' : 'Copy'}
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleDownload(JSON.stringify(formattedToken.header, null, 2), 'token-header.json')}
                      variant="secondary"
                    >
                      <FiDownload /> Save
                    </ActionButton>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4>Payload</h4>
                  <TokenPayload>
                    <code>{formatJson(formattedToken.payload)}</code>
                  </TokenPayload>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <ActionButton
                      onClick={() => handleCopy(JSON.stringify(formattedToken.payload, null, 2))}
                      variant="secondary"
                    >
                      <FiCopy /> {copied ? 'Copied!' : 'Copy'}
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleDownload(JSON.stringify(formattedToken.payload, null, 2), 'token-payload.json')}
                      variant="secondary"
                    >
                      <FiDownload /> Save
                    </ActionButton>
                  </div>
                </div>

                <div>
                  <h4>Signature</h4>
                  <TokenDisplay>
                    <code>{formattedToken.signature || 'No signature'}</code>
                  </TokenDisplay>
                  {formattedToken.signature && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <ActionButton
                        onClick={() => handleCopy(formattedToken.signature || '')}
                        variant="secondary"
                      >
                        <FiCopy /> {copied ? 'Copied!' : 'Copy'}
                      </ActionButton>
                    </div>
                  )}
                </div>
              </CardBody>
            </TokenPartCard>
          </AnalysisGrid>
        )}

        {claims.length > 0 && (
          <TokenPartCard>
            <CardHeader>
              <h3>Claims</h3>
            </CardHeader>
            <CardBody>
              <ClaimsTable>
                {claims.map((claim, index) => (
                  <ClaimRow key={index}>
                    <div>
                      <strong>{claim.key}</strong>
                    </div>
                    <div className={claim.isJson ? 'json' : ''}>
                      {claim.isJson ? (
                        <pre style={{ margin: 0 }}>{formatJson(claim.value)}</pre>
                      ) : (
                        String(claim.value)
                      )}
                    </div>
                  </ClaimRow>
                ))}
              </ClaimsTable>
            </CardBody>
          </TokenPartCard>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default TokenInspector;
