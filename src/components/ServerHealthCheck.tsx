import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiWifi, FiWifiOff, FiRefreshCw, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const HealthCheckContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
`;

const HealthCard = styled.div<{ $status: 'checking' | 'online' | 'offline' }>`
  background: ${({ $status }) => {
    switch ($status) {
      case 'checking': return '#fef3c7';
      case 'online': return '#d1fae5';
      case 'offline': return '#fee2e2';
      default: return '#f3f4f6';
    }
  }};
  border: 2px solid ${({ $status }) => {
    switch ($status) {
      case 'checking': return '#f59e0b';
      case 'online': return '#10b981';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  animation: ${({ $status }) => $status === 'checking' ? pulse : 'none'} 2s infinite;
`;

const HealthHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const HealthIcon = styled.div<{ $status: 'checking' | 'online' | 'offline' }>`
  color: ${({ $status }) => {
    switch ($status) {
      case 'checking': return '#f59e0b';
      case 'online': return '#10b981';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  font-size: 1.25rem;
  
  ${({ $status }) => $status === 'checking' && `
    animation: ${spin} 1s linear infinite;
  `}
`;

const HealthTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`;

const HealthMessage = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`;

const HealthActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const HealthButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const DismissButton = styled.button`
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

interface ServerHealthCheckProps {
  onDismiss?: () => void;
}

const ServerHealthCheck: React.FC<ServerHealthCheckProps> = ({ onDismiss }) => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isVisible, setIsVisible] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkServerHealth = async () => {
    setStatus('checking');
    setLastCheck(new Date());
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        setStatus('online');
        setRetryCount(0);
      } else {
        setStatus('offline');
      }
    } catch (error) {
      console.warn('Server health check failed:', error);
      setStatus('offline');
      setRetryCount(prev => prev + 1);
    }
  };

  // Initial check
  useEffect(() => {
    checkServerHealth();
  }, []);

  // Periodic checks every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'offline') {
        checkServerHealth();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [status]);

  const handleRetry = () => {
    checkServerHealth();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'checking':
        return {
          icon: <FiRefreshCw />,
          title: 'Checking Server Status...',
          message: 'Verifying connection to backend server...'
        };
      case 'online':
        return {
          icon: <FiCheckCircle />,
          title: 'Backend Server Online',
          message: 'Backend server is running and responding normally.'
        };
      case 'offline':
        return {
          icon: <FiWifiOff />,
          title: 'Backend Server Offline',
          message: `Backend server is not responding. ${retryCount > 0 ? `(${retryCount} failed attempts)` : ''} Please start the backend server with: node server.js`
        };
      default:
        return {
          icon: <FiAlertTriangle />,
          title: 'Unknown Status',
          message: 'Unable to determine server status.'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <HealthCheckContainer>
      <HealthCard $status={status}>
        <HealthHeader>
          <HealthIcon $status={status}>
            {statusInfo.icon}
          </HealthIcon>
          <HealthTitle>{statusInfo.title}</HealthTitle>
        </HealthHeader>
        <HealthMessage>{statusInfo.message}</HealthMessage>
        {lastCheck && (
          <HealthMessage style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Last checked: {lastCheck.toLocaleTimeString()}
          </HealthMessage>
        )}
        <HealthActions>
          <HealthButton onClick={handleRetry} disabled={status === 'checking'}>
            <FiRefreshCw />
            Retry
          </HealthButton>
          {status === 'online' && (
            <DismissButton onClick={handleDismiss}>
              Dismiss
            </DismissButton>
          )}
        </HealthActions>
      </HealthCard>
    </HealthCheckContainer>
  );
};

export default ServerHealthCheck;
