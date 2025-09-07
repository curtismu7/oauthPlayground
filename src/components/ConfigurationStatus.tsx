import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from './Card';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiSettings, 
  FiArrowRight,
  FiExternalLink,
  FiInfo
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

interface ConfigurationStatusProps {
  config: any;
  onConfigure?: () => void;
  onViewDetails?: () => void;
  flowType?: string;
}

const StatusContainer = styled.div`
  margin-bottom: 2rem;
`;

const StatusCard = styled(Card)<{ $status: 'ready' | 'partial' | 'missing' }>`
  border-left: 4px solid ${({ $status }) => {
    switch ($status) {
      case 'ready': return '#22c55e';
      case 'partial': return '#f59e0b';
      case 'missing': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  
  .status-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    
    .status-icon {
      font-size: 1.5rem;
      color: ${({ $status }) => {
        switch ($status) {
          case 'ready': return '#22c55e';
          case 'partial': return '#f59e0b';
          case 'missing': return '#ef4444';
          default: return '#6b7280';
        }
      }};
    }
    
    .status-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.gray900};
      margin: 0;
    }
  }
`;

const StatusMessage = styled.div`
  color: ${({ theme }) => theme.colors.gray700};
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-1px);
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.gray700};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray50};
    border-color: ${({ theme }) => theme.colors.gray400};
  }
`;

const LinkButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}10;
    transform: translateY(-1px);
  }
`;

const ConfigurationDetails = styled.div`
  background-color: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  
  .details-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray700};
    margin-bottom: 0.5rem;
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
`;

const getConfigurationStatus = (config: any) => {
  if (!config) {
    return {
      status: 'missing' as const,
      message: 'PingOne configuration is not loaded. Please configure your settings to use this flow.',
      missingItems: ['Client ID', 'Environment ID', 'API URL']
    };
  }

  // Handle both config structures: config.pingone.* and config.*
  const clientId = config.pingone?.clientId || config.clientId;
  const environmentId = config.pingone?.environmentId || config.environmentId;
  const authEndpoint = config.pingone?.authEndpoint || config.authorizationEndpoint;
  
  const missingItems = [];
  
  if (!clientId) missingItems.push('Client ID');
  if (!environmentId) missingItems.push('Environment ID');
  if (!authEndpoint) missingItems.push('API URL');

  if (missingItems.length === 0) {
    return {
      status: 'ready' as const,
      message: 'Your PingOne configuration is complete and ready to use. You can start the demo below.',
      missingItems: []
    };
  } else if (missingItems.length < 3) {
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
  flowType 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { status, message, missingItems } = getConfigurationStatus(config);

  const handleConfigure = () => {
    console.log('🔧 [ConfigurationStatus] Configure button clicked', { status, config });
    if (onConfigure) {
      onConfigure();
    }
  };

  const handleViewDetails = () => {
    console.log('👁️ [ConfigurationStatus] View Details button clicked', { status, showDetails });
    if (onViewDetails) {
      onViewDetails();
    } else {
      setShowDetails(!showDetails);
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

  const getStatusTitle = () => {
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
          <PrimaryButton onClick={handleConfigure}>
            <FiSettings />
            Update Configuration
          </PrimaryButton>
        );
      case 'partial':
        return (
          <PrimaryButton onClick={handleConfigure}>
            <FiSettings />
            Complete Configuration
          </PrimaryButton>
        );
      case 'missing':
        return (
          <LinkButton to="/configuration">
            <FiSettings />
            Configure PingOne
            <FiExternalLink />
          </LinkButton>
        );
      default:
        return null;
    }
  };

  const getSecondaryAction = () => {
    if (status === 'ready') {
      return (
        <SecondaryButton onClick={handleViewDetails}>
          <FiInfo />
          View Details
        </SecondaryButton>
      );
    }
    return null;
  };

  return (
    <StatusContainer>
      <StatusCard $status={status}>
        <CardHeader>
          <div className="status-header">
            <div className="status-icon">{getStatusIcon()}</div>
            <h3 className="status-title">{getStatusTitle()}</h3>
          </div>
        </CardHeader>
        
        <CardBody>
          <StatusMessage>{message}</StatusMessage>
          
          <ActionButtons>
            {getPrimaryAction()}
            {getSecondaryAction()}
          </ActionButtons>
          
          {status !== 'ready' && missingItems.length > 0 && (
            <ConfigurationDetails>
              <div className="details-title">Missing Configuration:</div>
              <ul className="details-list">
                {missingItems.map((item, index) => (
                  <li key={index}>
                    <FiAlertCircle className="missing-icon" />
                    {item}
                  </li>
                ))}
              </ul>
            </ConfigurationDetails>
          )}
          
          {status === 'ready' && showDetails && config && (
            <ConfigurationDetails>
              <div className="details-title">Current Configuration:</div>
              <ul className="details-list">
                <li>
                  <FiCheckCircle className="check-icon" />
                  Client ID: {config.pingone?.clientId || config.clientId || 'Not set'}
                </li>
                <li>
                  <FiCheckCircle className="check-icon" />
                  Environment ID: {config.pingone?.environmentId || config.environmentId || 'Not set'}
                </li>
                <li>
                  <FiCheckCircle className="check-icon" />
                  API URL: {config.pingone?.authEndpoint || config.authorizationEndpoint || 'Default'}
                </li>
              </ul>
            </ConfigurationDetails>
          )}
        </CardBody>
      </StatusCard>
    </StatusContainer>
  );
};

export default ConfigurationStatus;
