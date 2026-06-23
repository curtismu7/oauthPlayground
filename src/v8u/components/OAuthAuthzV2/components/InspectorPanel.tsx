import React, { useEffect, useState } from 'react';
import { copyToClipboard, formatAsCurl, formatResponseBody, HttpRequest, HttpResponse, truncateToken } from '../utils/exportUtils';
import { flowExecutionService, FlowListener } from '../services/flowExecutionService';
import './styles/inspector.css';

export const InspectorPanel: React.FC = () => {
  const [currentRequest, setCurrentRequest] = useState<HttpRequest | undefined>();
  const [currentResponse, setCurrentResponse] = useState<HttpResponse | undefined>();
  const [tokens, setTokens] = useState<Record<string, string> | undefined>(undefined);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedToken, setExpandedToken] = useState<string | null>('access');

  useEffect(() => {
    const listener: FlowListener = {
      onRequestSent: (request) => setCurrentRequest(request),
      onResponseReceived: (response) => setCurrentResponse(response),
      onTokensReceived: (tokensData) => setTokens(tokensData),
    };

    const unsubscribe = flowExecutionService.subscribe(listener);
    return unsubscribe;
  }, []);

  const handleCopy = async (text: string, type: string) => {
    try {
      await copyToClipboard(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleCopyAsCurl = async () => {
    if (currentRequest) {
      const curl = formatAsCurl(currentRequest);
      await handleCopy(curl, 'curl');
    }
  };

  const tokenCount = [tokens?.accessToken, tokens?.idToken, tokens?.refreshToken].filter(Boolean).length;

  return (
    <div className="oauth-authz-inspector-panel">
      <div className="inspector-title">Live Inspector</div>

      {!currentRequest ? (
        <div className="inspector-empty-state">
          Requests and responses will appear here once you start the flow
        </div>
      ) : (
        <>
          {/* Request/Response Grid */}
          <div className="inspector-grid">
            {/* Request Column */}
            <div className="inspector-column">
              <div className="column-title">Request</div>

              <div className="detail-section">
                <div className="detail-label">Headers</div>
                <div className="detail-content">
                  {currentRequest.headers ? (
                    Object.entries(currentRequest.headers).map(([key, value]) => (
                      <div key={key}>
                        {key}: {value}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: 'var(--oauth-authz-textSecondary)' }}>No headers</span>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Body</div>
                <div className="detail-content">
                  {currentRequest.body ? (
                    Object.entries(currentRequest.body).map(([key, value]) => (
                      <div key={key}>
                        {key}: {typeof value === 'string' ? truncateToken(value, 50) : value}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: 'var(--oauth-authz-textSecondary)' }}>No body</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn-small"
                onClick={handleCopyAsCurl}
                style={{
                  background: copied === 'curl' ? 'var(--oauth-authz-accentSuccess)' : 'var(--oauth-authz-bgTertiary)',
                }}
              >
                {copied === 'curl' ? '✓ Copied!' : 'Copy as cURL'}
              </button>
            </div>

            {/* Response Column */}
            {currentResponse && (
              <div className="inspector-column">
                <div className="column-title">Response</div>

                <div className="status-badge">
                  {currentResponse.status} {currentResponse.statusText}
                </div>

                <div className="detail-section">
                  <div className="detail-label">Headers</div>
                  <div className="detail-content">
                    {currentResponse.headers ? (
                      Object.entries(currentResponse.headers).map(([key, value]) => (
                        <div key={key}>
                          {key}: {value}
                        </div>
                      ))
                    ) : (
                      <span style={{ color: 'var(--oauth-authz-textSecondary)' }}>No headers</span>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <div className="detail-label">Body</div>
                  <div className="detail-content">
                    {currentResponse.body ? formatResponseBody(currentResponse.body) : 'No body'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tokens Section */}
          {tokens && (
            <div className="tokens-section">
              <div className="tokens-title">Received Tokens ({tokenCount})</div>
              <div className="token-list">
                {tokens.accessToken && (
                  <div
                    className="token-item"
                    onClick={() =>
                      setExpandedToken(expandedToken === 'access' ? null : 'access')
                    }
                  >
                    <div className="token-header">
                      <div className="token-name">Access Token</div>
                      <div className="token-type-badge">Bearer</div>
                    </div>
                    <div
                      className={`token-body ${
                        expandedToken === 'access' ? 'visible' : ''
                      }`}
                    >
                      <div>
                        <strong>Type:</strong> Bearer
                      </div>
                      <div>
                        <strong>Value:</strong> {truncateToken(tokens.accessToken, 60)}
                      </div>
                      <button
                        type="button"
                        className="btn-token-copy"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(tokens.accessToken, 'access');
                        }}
                        style={{
                          background:
                            copied === 'access'
                              ? 'var(--oauth-authz-accentSuccess)'
                              : 'transparent',
                        }}
                      >
                        {copied === 'access' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {tokens.refreshToken && (
                  <div
                    className="token-item"
                    onClick={() =>
                      setExpandedToken(expandedToken === 'refresh' ? null : 'refresh')
                    }
                  >
                    <div className="token-header">
                      <div className="token-name">Refresh Token</div>
                      <div className="token-type-badge">Refresh</div>
                    </div>
                    <div
                      className={`token-body ${
                        expandedToken === 'refresh' ? 'visible' : ''
                      }`}
                    >
                      <div>
                        <strong>Expires:</strong> 30 days
                      </div>
                      <div>
                        <strong>Value:</strong> {truncateToken(tokens.refreshToken, 60)}
                      </div>
                      <button
                        type="button"
                        className="btn-token-copy"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(tokens.refreshToken, 'refresh');
                        }}
                        style={{
                          background:
                            copied === 'refresh'
                              ? 'var(--oauth-authz-accentSuccess)'
                              : 'transparent',
                        }}
                      >
                        {copied === 'refresh' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {tokens.idToken && (
                  <div
                    className="token-item"
                    onClick={() =>
                      setExpandedToken(expandedToken === 'id' ? null : 'id')
                    }
                  >
                    <div className="token-header">
                      <div className="token-name">ID Token</div>
                      <div className="token-type-badge">JWT</div>
                    </div>
                    <div
                      className={`token-body ${
                        expandedToken === 'id' ? 'visible' : ''
                      }`}
                    >
                      <div>
                        <strong>Format:</strong> JSON Web Token
                      </div>
                      <div>
                        <strong>Value:</strong> {truncateToken(tokens.idToken, 60)}
                      </div>
                      <button
                        type="button"
                        className="btn-token-copy"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(tokens.idToken, 'id');
                        }}
                        style={{
                          background:
                            copied === 'id'
                              ? 'var(--oauth-authz-accentSuccess)'
                              : 'transparent',
                        }}
                      >
                        {copied === 'id' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
