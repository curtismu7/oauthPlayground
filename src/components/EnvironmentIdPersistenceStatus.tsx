import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiInfo, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import styled from 'styled-components';
import { environmentIdPersistenceService } from '../services/environmentIdPersistenceService';

const StatusContainer = styled.div`
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin: 0.5rem 0;
  font-size: 0.875rem;
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #0c4a6e;
`;

const StatusContent = styled.div`
  color: #075985;
  line-height: 1.4;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
`;

const ActionButton = styled.button`
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;

  &:hover {
    background: #0284c7;
  }
`;

const CopyButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;

  &:hover {
    background: #059669;
  }
`;

interface EnvironmentIdPersistenceStatusProps {
  environmentId: string;
  onRefresh?: () => void;
}

export const EnvironmentIdPersistenceStatus: React.FC<EnvironmentIdPersistenceStatusProps> = ({
  environmentId,
  onRefresh
}) => {
  const [status, setStatus] = useState<any>(null);
  const [showEnvContent, setShowEnvContent] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const persistenceStatus = environmentIdPersistenceService.getPersistenceStatus();
      setStatus(persistenceStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [environmentId]);

  const handleCopyEnvContent = () => {
    const envContent = environmentIdPersistenceService.generateEnvContent();
    navigator.clipboard.writeText(envContent).then(() => {
      alert('Environment content copied to clipboard!');
    });
  };

  const handleClearPersistence = () => {
    environmentIdPersistenceService.clearEnvironmentId();
    if (onRefresh) onRefresh();
  };

  if (!status) return null;

  return (
    <StatusContainer>
      <StatusHeader>
        <FiInfo size={16} />
        Environment ID Persistence
      </StatusHeader>
      
      <StatusContent>
        <StatusItem>
          {status.hasStoredId ? (
            <FiCheckCircle size={14} color="#10b981" />
          ) : (
            <FiAlertCircle size={14} color="#f59e0b" />
          )}
          <span>
            {status.hasStoredId ? 'Stored in localStorage' : 'Not stored locally'}
          </span>
        </StatusItem>

        <StatusItem>
          {status.hasEnvVar ? (
            <FiCheckCircle size={14} color="#10b981" />
          ) : (
            <FiAlertCircle size={14} color="#f59e0b" />
          )}
          <span>
            {status.hasEnvVar ? 'Available in .env' : 'Not in .env file'}
          </span>
        </StatusItem>

        {status.lastUpdated && (
          <StatusItem>
            <FiInfo size={14} />
            <span>Last updated: {new Date(status.lastUpdated).toLocaleString()}</span>
          </StatusItem>
        )}

        {status.source && (
          <StatusItem>
            <FiInfo size={14} />
            <span>Source: {status.source.replace('_', ' ')}</span>
          </StatusItem>
        )}

        <div style={{ marginTop: '0.5rem' }}>
          <ActionButton onClick={() => setShowEnvContent(!showEnvContent)}>
            <FiInfo size={12} />
            {showEnvContent ? 'Hide' : 'Show'} .env Content
          </ActionButton>

          <ActionButton onClick={handleCopyEnvContent}>
            <FiSave size={12} />
            Copy .env Content
          </ActionButton>

          <ActionButton onClick={handleClearPersistence}>
            <FiRefreshCw size={12} />
            Clear Storage
          </ActionButton>
        </div>

        {showEnvContent && (
          <div style={{ 
            marginTop: '0.75rem', 
            background: '#1e293b', 
            color: '#f1f5f9', 
            padding: '0.75rem', 
            borderRadius: '0.25rem',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            whiteSpace: 'pre-wrap'
          }}>
            {environmentIdPersistenceService.generateEnvContent()}
          </div>
        )}
      </StatusContent>
    </StatusContainer>
  );
};


