import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiSettings, 
  FiChevronDown,
  FiChevronRight,
  FiExternalLink,
  FiInfo
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { credentialManager } from '../utils/credentialManager';

interface ConfigurationStatusProps {
  config: any;
  onConfigure?: () => void;
  onViewDetails?: () => void;
  flowType?: string;
  defaultExpanded?: boolean;
}

const StatusContainer = styled.div`
  margin-bottom: 1rem;
`;

const CompactStatusBar = styled.div<{ $status: 'ready' | 'partial' | 'missing' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: ${({ $status }) => {
    switch ($status) {
      case 'ready': return '#f0fdf4';
      case 'partial': return '#fffbeb';
      case 'missing': return '#fef2f2';
      default: return '#f9fafb';
    }
  }};
  border: 1px solid ${({ $status }) => {
    switch ($status) {
      case 'ready': return '#bbf7d0';
      case 'partial': return '#fde68a';
      case 'missing': return '#fecaca';
      default: return '#e5e7eb';
    }
  }};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const StatusLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StatusIcon = styled.div<{ $status: 'ready' | 'partial' | 'missing' }>`
  font-size: 1.25rem;
  color: ${({ $status }) => {
    switch ($status) {
      case 'ready': return '#22c55e';
      case 'partial': return '#f59e0b';
      case 'missing': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const StatusText = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StatusRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CompactButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const CompactLinkButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}10;
  }
`;

const ExpandableContent = styled.div<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => $expanded ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  background-color: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
`;

const ExpandedContent = styled.div`
  padding: 1rem;
  
  .details-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray700};
    margin-bottom: 0.75rem;
  }
  
  .details-list {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
      font-size: 0.875rem;
      color: ${({ theme }) => theme.colors.gray600};
      
      .check-icon {
        color: ${({ theme }) => theme.colors.success};
        font-size: 1rem;
      }
      
      .missing-icon {
        color: ${({ theme }) => theme.colors.error};
        font-size: 1rem;
      }
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }
`;

const getConfigurationStatus = () => {
  // Use the credential manager to get the current status
  const credentials = credentialManager.getAllCredentials();
  const status = credentialManager.getCredentialsStatus();
  
  const missingItems = [];
  
  if (!credentials.environmentId) missingItems.push('Environment ID');
  if (!credentials.clientId) missingItems.push('Client ID');
  if (!credentials.authEndpoint) missingItems.push('API URL');

  if (status.overall === 'complete') {
    return {
      status: 'ready' as const,
      message: 'Your PingOne configuration is complete and ready to use. You can start the demo below.',
      missingItems: []
    };
  } else if (status.overall === 'partial') {
    return {
      status: 'partial' as const,
      message: 'Your PingOne configuration is partially complete. Some features may not work properly.',
      missingItems
    };
  } else {
    return {
      status: 'missing' as const,
      message: 'PingOne configuration is missing required settings. Please configure your settings to use this flow.',
      missingItems
    };
  }
};

const ConfigurationStatus: React.FC<ConfigurationStatusProps> = ({ 
  config, 
  onConfigure, 
  onViewDetails,
  flowType,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [statusData, setStatusData] = useState(() => getConfigurationStatus());
  
  // Update status when credentials change
  useEffect(() => {
    const handleCredentialChange = () => {
      setStatusData(getConfigurationStatus());
    };

    // Listen for credential changes
    window.addEventListener('permanent-credentials-changed', handleCredentialChange);
    window.addEventListener('pingone-config-changed', handleCredentialChange);
    
    return () => {
      window.removeEventListener('permanent-credentials-changed', handleCredentialChange);
      window.removeEventListener('pingone-config-changed', handleCredentialChange);
    };
  }, []);

  const { status, message, missingItems } = statusData;

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔧 [ConfigurationStatus] Configure button clicked', { status, config });
    if (onConfigure) {
      onConfigure();
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('👁️ [ConfigurationStatus] View Details button clicked', { status, isExpanded });
    if (onViewDetails) {
      onViewDetails();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ready': return <FiCheckCircle />;
      case 'partial': return <FiAlertCircle />;
      case 'missing': return <FiAlertCircle />;
      default: return <FiInfo />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ready': return 'Configuration Ready';
      case 'partial': return 'Partial Configuration';
      case 'missing': return 'Configuration Required';
      default: return 'Configuration Status';
    }
  };

  const getPrimaryAction = () => {
    switch (status) {
      case 'ready':
        return (
          <CompactButton onClick={handleConfigure}>
            <FiSettings />
            Update
          </CompactButton>
        );
      case 'partial':
        return (
          <CompactButton onClick={handleConfigure}>
            <FiSettings />
            Complete
          </CompactButton>
        );
      case 'missing':
        return (
          <CompactLinkButton to="/configuration">
            <FiSettings />
            Configure
            <FiExternalLink />
          </CompactLinkButton>
        );
      default:
        return null;
    }
  };

  const getSecondaryAction = () => {
    if (status === 'ready') {
      return (
        <CompactButton onClick={handleViewDetails}>
          <FiInfo />
          Details
        </CompactButton>
      );
    }
    return null;
  };

  return (
    <StatusContainer>
      <CompactStatusBar 
        $status={status} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <StatusLeft>
          <StatusIcon $status={status}>{getStatusIcon()}</StatusIcon>
          <StatusText>{getStatusText()}</StatusText>
        </StatusLeft>
        
        <StatusRight>
          {getPrimaryAction()}
          {getSecondaryAction()}
          {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
        </StatusRight>
      </CompactStatusBar>
      
      <ExpandableContent $expanded={isExpanded}>
        <ExpandedContent>
          <div className="details-title">Configuration Details:</div>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            {message}
          </div>
          
          {status !== 'ready' && missingItems.length > 0 && (
            <>
              <div className="details-title">Missing Configuration:</div>
              <ul className="details-list">
                {missingItems.map((item, index) => (
                  <li key={index}>
                    <FiAlertCircle className="missing-icon" />
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}
          
          {status === 'ready' && (
            <>
              <div className="details-title">Current Configuration:</div>
              <ul className="details-list">
                <li>
                  <FiCheckCircle className="check-icon" />
                  Client ID: {credentialManager.getAllCredentials().clientId || 'Not set'}
                </li>
                <li>
                  <FiCheckCircle className="check-icon" />
                  Environment ID: {credentialManager.getAllCredentials().environmentId || 'Not set'}
                </li>
                <li>
                  <FiCheckCircle className="check-icon" />
                  API URL: {credentialManager.getAllCredentials().authEndpoint || 'Default'}
                </li>
                <li>
                  <FiCheckCircle className="check-icon" />
                  Callback URL: {credentialManager.getAllCredentials().redirectUri || 'Not set'}
                </li>
              </ul>
            </>
          )}
        </ExpandedContent>
      </ExpandableContent>
    </StatusContainer>
  );
};

export default ConfigurationStatus;
