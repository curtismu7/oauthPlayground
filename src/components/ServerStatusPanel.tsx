import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCheckCircle, FiXCircle, FiRefreshCw, FiServer, FiGlobe } from 'react-icons/fi';
import { showFlowSuccess, showFlowError } from './CentralizedSuccessMessage';

interface ServerStatus {
  name: string;
  url: string;
  status: 'checking' | 'online' | 'offline';
  responseTime?: number;
  error?: string;
}

const ServerStatusContainer = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd);
  }
`;

const ServerStatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ServerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const ServerCard = styled.div<{ $status: 'checking' | 'online' | 'offline' }>`
  background: ${({ $status }) => {
    switch ($status) {
      case 'online': return 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
      case 'offline': return 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
      case 'checking': return 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
      default: return 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
    }
  }};
  border: 2px solid ${({ $status }) => {
    switch ($status) {
      case 'online': return '#bbf7d0';
      case 'offline': return '#fecaca';
      case 'checking': return '#e5e7eb';
      default: return '#e5e7eb';
    }
  }};
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ $status }) => {
      switch ($status) {
        case 'online': return 'linear-gradient(90deg, #10b981, #34d399)';
        case 'offline': return 'linear-gradient(90deg, #ef4444, #f87171)';
        case 'checking': return 'linear-gradient(90deg, #6b7280, #9ca3af)';
        default: return 'linear-gradient(90deg, #6b7280, #9ca3af)';
      }
    }};
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: ${({ $status }) => {
      switch ($status) {
        case 'online': return '#86efac';
        case 'offline': return '#fca5a5';
        case 'checking': return '#d1d5db';
        default: return '#d1d5db';
      }
    }};
  }
`;

const ServerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ServerName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
`;

const StatusIndicator = styled.div<{ $status: 'checking' | 'online' | 'offline' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ $status }) => {
    switch ($status) {
      case 'online': return '#059669';
      case 'offline': return '#dc2626';
      case 'checking': return '#6b7280';
      default: return '#6b7280';
    }
  }};
`;

const ServerDetails = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .field-name {
    font-weight: 500;
    color: #374151;
  }
  
  .field-value {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.8rem;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }
  
  .error-message {
    color: #dc2626;
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 0.375rem;
    border-left: 3px solid #dc2626;
  }
  
  .success-message {
    color: #059669;
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 0.375rem;
    border-left: 3px solid #059669;
  }
`;

const ServerStatusPanel: React.FC = () => {
  const [servers, setServers] = useState<ServerStatus[]>([
    {
      name: 'Frontend Server',
      url: window.location.origin,
      status: 'checking'
    },
    {
      name: 'Backend Server',
      url: '/api/health',
      status: 'checking'
    }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const checkServerStatus = async (server: ServerStatus): Promise<ServerStatus> => {
    try {
      const startTime = Date.now();
      
      // Different headers for frontend vs backend
      const headers: HeadersInit = server.name === 'Frontend Server' 
        ? {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        : {
            'Accept': 'application/json',
          };
      
      const response = await fetch(server.url, {
        method: 'GET',
        mode: 'cors',
        headers,
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        return {
          ...server,
          status: 'online',
          responseTime,
          error: undefined
        };
      } else {
        return {
          ...server,
          status: 'offline',
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        ...server,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  };

  const refreshAllServers = async () => {
    setIsRefreshing(true);
    try {
      const updatedServers = await Promise.all(servers.map(server => checkServerStatus(server)));
      setServers(updatedServers);
      setLastRefresh(new Date());
      
      const onlineCount = updatedServers.filter(s => s.status === 'online').length;
      const totalCount = updatedServers.length;
      
      if (onlineCount === totalCount) {
        showFlowSuccess('✅ All Servers Online', `All ${totalCount} servers are responding normally`, 5000);
      } else if (onlineCount > 0) {
        showFlowSuccess('⚠️ Partial Server Status', `${onlineCount} of ${totalCount} servers are online`, 5000);
      } else {
        showFlowError('❌ All Servers Offline', 'No servers are currently responding');
      }
    } catch (error) {
      showFlowError('❌ Server Status Check Failed', 'Failed to check server status. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check server status on component mount
  useEffect(() => {
    refreshAllServers();
  }, []);

  const getStatusIcon = (status: 'checking' | 'online' | 'offline') => {
    switch (status) {
      case 'online':
        return <FiCheckCircle size={20} color="#059669" />;
      case 'offline':
        return <FiXCircle size={20} color="#dc2626" />;
      case 'checking':
        return <FiRefreshCw size={20} color="#6b7280" className="animate-spin" />;
      default:
        return <FiXCircle size={20} color="#dc2626" />;
    }
  };

  const getStatusText = (status: 'checking' | 'online' | 'offline') => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  const formatLastRefresh = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return lastRefresh.toLocaleDateString();
  };

  return (
    <ServerStatusContainer>
      <ServerStatusHeader>
        <h3>
          <FiServer size={24} />
          Server Status
        </h3>
        <RefreshButton onClick={refreshAllServers} disabled={isRefreshing}>
          <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </RefreshButton>
      </ServerStatusHeader>
      
      <div style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
        Last updated: {formatLastRefresh()}
      </div>

      <ServerGrid>
        {servers.map((server, index) => (
          <ServerCard key={index} $status={server.status}>
            <ServerHeader>
              <ServerName>
                {server.name === 'Frontend Server' ? <FiGlobe size={20} /> : <FiServer size={20} />}
                {server.name}
              </ServerName>
              <StatusIndicator $status={server.status}>
                {getStatusIcon(server.status)}
                {getStatusText(server.status)}
              </StatusIndicator>
            </ServerHeader>
            
            <ServerDetails>
              <div className="detail-row">
                <span className="field-name">URL:</span>
                <span className="field-value">{server.url}</span>
              </div>
              
              {server.responseTime && (
                <div className="detail-row">
                  <span className="field-name">Response Time:</span>
                  <span className="field-value">{server.responseTime}ms</span>
                </div>
              )}
              
              {server.error && (
                <div className="error-message">
                  <strong>Error:</strong> {server.error}
                </div>
              )}
              
              {server.status === 'online' && (
                <div className="success-message">
                  <strong>Status:</strong> Server is responding normally
                </div>
              )}
            </ServerDetails>
          </ServerCard>
        ))}
      </ServerGrid>
    </ServerStatusContainer>
  );
};

export default ServerStatusPanel;
