import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCode, FiCopy, FiCheck, FiRefreshCw, FiSearch, FiClock, FiExternalLink } from 'react-icons/fi';
import { TokenMonitoringService, type ApiCall } from '../services/tokenMonitoringService';
import { apiCallTrackerService } from '../../services/apiCallTrackerService';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const PageTitle = styled.h1`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
`;

const FilterSelect = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          
          &:hover {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
      default:
        return `
          background: white;
          border-color: #e2e8f0;
          color: #64748b;
          
          &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            color: #475569;
          }
        `;
    }
  }}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ApiCallGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const ApiCallCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
`;

const ApiCallHeader = styled.div<{ $method: string }>`
  padding: 1rem 1.5rem;
  background: ${props => {
    switch (props.$method) {
      case 'POST': return '#dcfce7';
      case 'GET': return '#dbeafe';
      case 'DELETE': return '#fee2e2';
      default: return '#f3f4f6';
    }
  }};
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MethodBadge = styled.span<{ $method: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.$method) {
      case 'POST': return '#16a34a';
      case 'GET': return '#2563eb';
      case 'DELETE': return '#dc2626';
      default: return '#6b7280';
    }
  }};
  color: white;
`;

const ApiUrl = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
`;

const ApiCallBody = styled.div`
  padding: 1.5rem;
`;

const ApiSection = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CodeBlock = styled.div<{ $expanded?: boolean }>`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: ${props => props.$expanded ? 'none' : '200px'};
  overflow-y: ${props => props.$expanded ? 'visible' : 'auto'};
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0;
  margin-top: 0.5rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ResponseBlock = styled.div<{ $status: number }>`
  background: ${props => {
    if (props.$status >= 200 && props.$status < 300) return '#f0fdf4';
    if (props.$status >= 400) return '#fef2f2';
    return '#f8fafc';
  }};
  border: 1px solid ${props => {
    if (props.$status >= 200 && props.$status < 300) return '#86efac';
    if (props.$status >= 400) return '#fecaca';
    return '#e2e8f0';
  }};
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;
`;

const StatusBadge = styled.span<{ $status: number }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    if (props.$status >= 200 && props.$status < 300) return '#16a34a';
    if (props.$status >= 400) return '#dc2626';
    return '#6b7280';
  }};
  color: white;
  margin-bottom: 0.5rem;
  display: inline-block;
`;

const Timestamp = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

// New styled components for redirects
const RedirectCard = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #0ea5e9;
`;

const RedirectHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const RedirectTitle = styled.div`
  font-weight: 600;
  color: #0c4a6e;
  font-size: 0.875rem;
`;

const RedirectUrl = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  color: #64748b;
  word-break: break-all;
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
`;

const RedirectDescription = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.5rem;
`;

const InteractionType = styled.div`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const ApiInteractionType = styled(InteractionType)`
  background: #dbeafe;
  color: #1e40af;
`;

const RedirectInteractionType = styled(InteractionType)`
  background: #fef3c7;
  color: #92400e;
`;

export const TokenApiDocumentationPage: React.FC = () => {
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [redirects, setRedirects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load real API calls and redirects
  useEffect(() => {
    const loadData = () => {
      // Get API calls from token monitoring service
      const service = TokenMonitoringService.getInstance();
      const calls = service.getApiCalls();
      setApiCalls(calls);

      // Get all tracked calls including redirects from apiCallTrackerService
      const trackedCalls = apiCallTrackerService.getApiCalls();
      
      // Filter for redirects (GET /authorize calls)
      const redirectCalls = trackedCalls.filter(call => 
        call.url?.includes('/authorize') && call.method === 'GET'
      );
      
      setRedirects(redirectCalls);
    };

    loadData();
    
    // Set up polling to get real-time updates
    const interval = setInterval(loadData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredCalls = apiCalls.filter(call => {
    const matchesSearch = call.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || call.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCalls);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCalls(newExpanded);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'oauth_revoke': return '🔄';
      case 'sso_signoff': return '🚪';
      case 'session_delete': return '👥';
      case 'introspect': return '🔍';
      case 'worker_refresh': return '🏭';
      default: return '📡';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'oauth_revoke': return 'OAuth Token Revocation';
      case 'sso_signoff': return 'SSO Sign-off';
      case 'session_delete': return 'Session Deletion';
      case 'introspect': return 'Token Introspection';
      case 'worker_refresh': return 'Worker Token Refresh';
      default: return 'Unknown';
    }
  };

  const stats = {
    total: apiCalls.length,
    success: apiCalls.filter(c => c.success).length,
    failed: apiCalls.filter(c => !c.success).length,
    avgDuration: apiCalls.length > 0 
      ? Math.round(apiCalls.reduce((sum, c) => sum + c.duration, 0) / apiCalls.length)
      : 0,
    redirects: redirects.length
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>📡 OAuth Flow Documentation</PageTitle>
        <PageSubtitle>
          Complete OAuth flow visualization: Front-channel redirects and back-channel API calls
        </PageSubtitle>
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Total API Calls</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.redirects}</StatValue>
          <StatLabel>Front-Channel Redirects</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.success}</StatValue>
          <StatLabel>Successful</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.failed}</StatValue>
          <StatLabel>Failed</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.avgDuration}ms</StatValue>
          <StatLabel>Avg Duration</StatLabel>
        </StatCard>
      </StatsGrid>

      <ControlsContainer>
        <SearchBox>
          <SearchIcon>
            <FiSearch />
          </SearchIcon>
          <SearchInput
            placeholder="Search by URL, method, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>
        
        <FilterSelect value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="oauth_revoke">OAuth Revoke</option>
          <option value="sso_signoff">SSO Sign-off</option>
          <option value="session_delete">Session Delete</option>
          <option value="introspect">Introspect</option>
          <option value="worker_refresh">Worker Refresh</option>
        </FilterSelect>
        
        <ActionButton onClick={() => window.location.reload()}>
          <FiRefreshCw />
          Refresh
        </ActionButton>
      </ControlsContainer>

      {/* Redirects Section */}
      {redirects.length > 0 && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#1e293b', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FiExternalLink />
              Front-Channel Redirects (Browser Navigation)
            </h3>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              These are the browser redirects that happen during OAuth flows. The user's browser is redirected to these URLs.
            </p>
            {redirects.map((redirect, index) => (
              <RedirectCard key={`redirect-${index}`}>
                <RedirectHeader>
                  <RedirectTitle>
                    <FiExternalLink /> Authorization Redirect
                  </RedirectTitle>
                  <RedirectInteractionType>
                    Front-Channel
                  </RedirectInteractionType>
                </RedirectHeader>
                <RedirectUrl>
                  {redirect.actualPingOneUrl || redirect.url}
                </RedirectUrl>
                <RedirectDescription>
                  <strong>Step 1:</strong> User browser is redirected to the authorization endpoint to authenticate and grant consent.
                  This happens in the user's browser (front-channel).
                </RedirectDescription>
                <Timestamp>
                  <FiClock />
                  {redirect.timestamp ? new Date(redirect.timestamp).toLocaleString() : 'Unknown time'}
                </Timestamp>
              </RedirectCard>
            ))}
          </div>

          <div style={{ 
            marginBottom: '2rem', 
            padding: '1rem', 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px' 
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '0.5rem' 
            }}>
              🔄 Complete OAuth Flow Sequence
            </h4>
            <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>1. Front-Channel:</strong> Browser redirects to <code>/authorize</code> endpoint
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>2. Front-Channel:</strong> Authorization server redirects back with authorization code
              </div>
              <div>
                <strong>3. Back-Channel:</strong> Application exchanges code for tokens at <code>/token</code> endpoint
              </div>
            </div>
          </div>
        </>
      )}

      <ApiCallGrid>
        {filteredCalls.map((call) => (
          <ApiCallCard key={call.id}>
            <ApiCallHeader $method={call.method}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <MethodBadge $method={call.method}>
                  {call.method}
                </MethodBadge>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{getTypeIcon(call.type)}</span>
                    <strong>{getTypeName(call.type)}</strong>
                  </div>
                  <ApiUrl>{call.url}</ApiUrl>
                </div>
              </div>
              <Timestamp>
                <FiClock />
                {formatTimestamp(call.timestamp)}
              </Timestamp>
            </ApiCallHeader>

            <ApiCallBody>
              <ApiSection>
                <SectionTitle>Request Headers</SectionTitle>
                <CodeBlock>
                  {Object.entries(call.headers).map(([key, value]) => 
                    `${key}: ${value}`
                  ).join('\n')}
                </CodeBlock>
              </ApiSection>

              {call.body && (
                <ApiSection>
                  <SectionTitle>Request Body</SectionTitle>
                  <CodeBlock $expanded={expandedCalls.has(call.id)}>
                    {call.body}
                  </CodeBlock>
                  {call.body.length > 200 && (
                    <ExpandButton onClick={() => toggleExpanded(call.id)}>
                      {expandedCalls.has(call.id) ? 'Show Less' : 'Show More'}
                    </ExpandButton>
                  )}
                </ApiSection>
              )}

              <ApiSection>
                <SectionTitle>Response</SectionTitle>
                <ResponseBlock $status={call.response.status}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <StatusBadge $status={call.response.status}>
                      {call.response.status} {call.response.statusText}
                    </StatusBadge>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {call.duration}ms
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Response Headers:</strong>
                    <CopyButton onClick={() => copyToClipboard(
                      Object.entries(call.response.headers).map(([k, v]) => `${k}: ${v}`).join('\n'),
                      `${call.id}-response-headers`
                    )}>
                      {copiedId === `${call.id}-response-headers` ? <FiCheck /> : <FiCopy />}
                    </CopyButton>
                  </div>
                  <CodeBlock>
                    {Object.entries(call.response.headers).map(([key, value]) => 
                      `${key}: ${value}`
                    ).join('\n')}
                  </CodeBlock>

                  {call.response.body && (
                    <>
                      <div style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>
                        <strong>Response Body:</strong>
                        <CopyButton onClick={() => copyToClipboard(call.response.body || '', `${call.id}-response-body`)}>
                          {copiedId === `${call.id}-response-body` ? <FiCheck /> : <FiCopy />}
                        </CopyButton>
                      </div>
                      <CodeBlock $expanded={expandedCalls.has(`${call.id}-response`)}>
                        {call.response.body}
                      </CodeBlock>
                      {call.response.body && call.response.body.length > 200 && (
                        <ExpandButton onClick={() => toggleExpanded(`${call.id}-response`)}>
                          {expandedCalls.has(`${call.id}-response`) ? 'Show Less' : 'Show More'}
                        </ExpandButton>
                      )}
                    </>
                  )}
                </ResponseBlock>
              </ApiSection>
            </ApiCallBody>
          </ApiCallCard>
        ))}
      </ApiCallGrid>

      {filteredCalls.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#64748b',
          fontSize: '0.875rem'
        }}>
          <FiCode style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
          <h3>No API Calls Found</h3>
          <p>Try adjusting your search or filter criteria, or make some API calls to see them here.</p>
        </div>
      )}
    </PageContainer>
  );
};

export default TokenApiDocumentationPage;
