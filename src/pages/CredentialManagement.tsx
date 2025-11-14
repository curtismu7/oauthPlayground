// src/pages/CredentialManagement.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  FiKey,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiDatabase,
  FiHardDrive,
  FiExternalLink,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiSettings,
} from 'react-icons/fi';
import { credentialStorageManager } from '../services/credentialStorageManager';
import { FlowHeader } from '../services/flowHeaderService';
import { v4ToastManager } from '../utils/v4ToastMessages';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Description = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const FlowGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const FlowCard = styled.div<{ $hasCredentials: boolean }>`
  background: ${props => props.$hasCredentials ? '#f0fdf4' : '#f9fafb'};
  border: 2px solid ${props => props.$hasCredentials ? '#86efac' : '#e5e7eb'};
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const FlowName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FlowStatus = styled.div<{ $status: 'active' | 'inactive' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${props => props.$status === 'active' ? '#16a34a' : '#9ca3af'};
  margin-bottom: 0.75rem;
`;

const FlowMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Badge = styled.span<{ $variant: 'browser' | 'file' | 'memory' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => {
    switch (props.$variant) {
      case 'file': return '#dbeafe';
      case 'browser': return '#fef3c7';
      case 'memory': return '#e0e7ff';
    }
  }};
  color: ${props => {
    switch (props.$variant) {
      case 'file': return '#1e40af';
      case 'browser': return '#92400e';
      case 'memory': return '#4338ca';
    }
  }};
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.75rem;

  &:hover {
    background: #2563eb;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #059669;
  }
`;

const ExportButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const ImportButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

const ClearButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #dc2626;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const WorkerTokenCard = styled.div<{ $status: 'valid' | 'expired' | 'missing' }>`
  background: ${props => {
    switch (props.$status) {
      case 'valid': return 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
      case 'expired': return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
      case 'missing': return 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
    }
  }};
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'valid': return '#34d399';
      case 'expired': return '#fbbf24';
      case 'missing': return '#f87171';
    }
  }};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const WorkerTokenTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WorkerTokenInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const WorkerTokenInfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const WorkerTokenLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.05em;
`;

const WorkerTokenValue = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
`;

const WorkerTokenActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

interface FlowCredentialInfo {
  flowKey: string;
  flowName: string;
  hasCredentials: boolean;
  lastSaved?: number;
  source?: 'browser' | 'file' | 'memory';
  environmentId?: string;
  clientId?: string;
}

const KNOWN_FLOWS = [
  { key: 'oauth-authorization-code-v7', name: 'OAuth Authorization Code V7' },
  { key: 'oidc-authorization-code-v7', name: 'OIDC Authorization Code V7' },
  { key: 'oauth-implicit-v7', name: 'OAuth Implicit V7' },
  { key: 'oidc-implicit-v7', name: 'OIDC Implicit V7' },
  { key: 'device-authorization-v7', name: 'Device Authorization V7' },
  { key: 'oidc-hybrid-v7', name: 'OIDC Hybrid V7' },
  { key: 'client-credentials-v7', name: 'Client Credentials V7' },
  { key: 'kroger-mfa', name: 'Kroger MFA Flow' },
  { key: 'device-authorization-v6', name: 'Device Authorization V6' },
  { key: 'configuration', name: 'Configuration' },
  { key: 'app-generator', name: 'Application Generator' },
];

export const CredentialManagement: React.FC = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<FlowCredentialInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerTokenStatus, setWorkerTokenStatus] = useState<{
    status: 'valid' | 'expired' | 'missing';
    environmentId?: string;
    expiresAt?: number;
    timeRemaining?: string;
  }>({ status: 'missing' });

  const loadFlowCredentials = async () => {
    setLoading(true);
    try {
      const flowInfos: FlowCredentialInfo[] = [];

      for (const flow of KNOWN_FLOWS) {
        const credentials = await credentialStorageManager.loadFlowCredentials(flow.key);
        
        flowInfos.push({
          flowKey: flow.key,
          flowName: flow.name,
          hasCredentials: !!credentials,
          environmentId: credentials?.environmentId,
          clientId: credentials?.clientId,
          source: credentials ? 'browser' : undefined,
        });
      }

      setFlows(flowInfos);
    } catch (error) {
      console.error('[CredentialManagement] Failed to load credentials:', error);
      v4ToastManager.showError('Failed to load credential information');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkerTokenStatus = async () => {
    try {
      const tokenData = await credentialStorageManager.loadWorkerToken();
      
      if (!tokenData) {
        setWorkerTokenStatus({ status: 'missing' });
        return;
      }

      const now = Date.now();
      const isExpired = tokenData.expiresAt < now;
      const timeRemaining = isExpired ? 'Expired' : formatTimeRemaining(tokenData.expiresAt - now);

      setWorkerTokenStatus({
        status: isExpired ? 'expired' : 'valid',
        environmentId: tokenData.environmentId,
        expiresAt: tokenData.expiresAt,
        timeRemaining,
      });
    } catch (error) {
      console.error('[CredentialManagement] Failed to load worker token:', error);
      setWorkerTokenStatus({ status: 'missing' });
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  useEffect(() => {
    loadFlowCredentials();
    loadWorkerTokenStatus();

    // Refresh worker token status every 30 seconds
    const interval = setInterval(loadWorkerTokenStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExportCredentials = async () => {
    try {
      const exportData: Record<string, any> = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        credentials: {},
      };

      // Export all flow credentials
      for (const flow of KNOWN_FLOWS) {
        const credentials = await credentialStorageManager.loadFlowCredentials(flow.key);
        if (credentials) {
          exportData.credentials[flow.key] = credentials;
        }
      }

      // Export worker token credentials
      const workerToken = await credentialStorageManager.loadWorkerToken();
      if (workerToken) {
        exportData.workerToken = workerToken;
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pingone-credentials-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      v4ToastManager.showSuccess('Credentials exported successfully');
    } catch (error) {
      console.error('[CredentialManagement] Export failed:', error);
      v4ToastManager.showError('Failed to export credentials');
    }
  };

  const handleImportCredentials = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data structure
      if (!importData.credentials || typeof importData.credentials !== 'object') {
        throw new Error('Invalid credential file format');
      }

      let importedCount = 0;

      // Import flow credentials
      for (const [flowKey, credentials] of Object.entries(importData.credentials)) {
        if (credentials && typeof credentials === 'object') {
          await credentialStorageManager.saveFlowCredentials(flowKey, credentials as any);
          importedCount++;
        }
      }

      // Import worker token if present
      if (importData.workerToken) {
        await credentialStorageManager.saveWorkerToken(importData.workerToken);
      }

      v4ToastManager.showSuccess(`Imported ${importedCount} credential sets successfully`);
      
      // Reload credentials to show updated state
      await loadFlowCredentials();
    } catch (error) {
      console.error('[CredentialManagement] Import failed:', error);
      v4ToastManager.showError('Failed to import credentials. Please check the file format.');
    }

    // Reset file input
    event.target.value = '';
  };

  const handleClearAllCredentials = async () => {
    if (!window.confirm('Are you sure you want to clear ALL credentials? This action cannot be undone.')) {
      return;
    }

    try {
      let clearedCount = 0;

      // Clear all flow credentials
      for (const flow of KNOWN_FLOWS) {
        await credentialStorageManager.clearFlowCredentials(flow.key);
        clearedCount++;
      }

      // Clear worker token
      await credentialStorageManager.clearWorkerToken();

      v4ToastManager.showSuccess(`Cleared ${clearedCount} credential sets successfully`);
      
      // Reload credentials to show updated state
      await loadFlowCredentials();
    } catch (error) {
      console.error('[CredentialManagement] Clear failed:', error);
      v4ToastManager.showError('Failed to clear all credentials');
    }
  };

  const handleNavigateToFlow = (flowKey: string) => {
    // Map flow keys to routes
    const routeMap: Record<string, string> = {
      'oauth-authorization-code-v7': '/oauth-authorization-code-v7',
      'oidc-authorization-code-v7': '/oauth-authorization-code-v7?variant=oidc',
      'oauth-implicit-v7': '/oauth-implicit-v7',
      'oidc-implicit-v7': '/oauth-implicit-v7?variant=oidc',
      'device-authorization-v7': '/device-authorization-v7',
      'oidc-hybrid-v7': '/oidc-hybrid-v7',
      'client-credentials-v7': '/client-credentials-v7',
      'kroger-mfa': '/kroger-mfa',
      'device-authorization-v6': '/device-authorization-v6',
      'configuration': '/configuration',
      'app-generator': '/app-generator',
    };

    const route = routeMap[flowKey];
    if (route) {
      navigate(route);
    }
  };

  return (
    <Container>
      <FlowHeader
        title="Credential Management"
        subtitle="Manage credentials for all flows"
        icon={<FiKey />}
      />

      {/* Worker Token Status Widget */}
      <WorkerTokenCard $status={workerTokenStatus.status}>
        <WorkerTokenTitle>
          <FiKey />
          Worker Token Status
        </WorkerTokenTitle>

        <WorkerTokenInfo>
          <WorkerTokenInfoItem>
            <WorkerTokenLabel>Status</WorkerTokenLabel>
            <WorkerTokenValue>
              {workerTokenStatus.status === 'valid' && '✓ Active'}
              {workerTokenStatus.status === 'expired' && '⚠ Expired'}
              {workerTokenStatus.status === 'missing' && '✗ Not Configured'}
            </WorkerTokenValue>
          </WorkerTokenInfoItem>

          {workerTokenStatus.environmentId && (
            <WorkerTokenInfoItem>
              <WorkerTokenLabel>Environment</WorkerTokenLabel>
              <WorkerTokenValue>
                {workerTokenStatus.environmentId.substring(0, 12)}...
              </WorkerTokenValue>
            </WorkerTokenInfoItem>
          )}

          {workerTokenStatus.timeRemaining && (
            <WorkerTokenInfoItem>
              <WorkerTokenLabel>Time Remaining</WorkerTokenLabel>
              <WorkerTokenValue>{workerTokenStatus.timeRemaining}</WorkerTokenValue>
            </WorkerTokenInfoItem>
          )}

          {workerTokenStatus.expiresAt && (
            <WorkerTokenInfoItem>
              <WorkerTokenLabel>Expires At</WorkerTokenLabel>
              <WorkerTokenValue>
                {new Date(workerTokenStatus.expiresAt).toLocaleString()}
              </WorkerTokenValue>
            </WorkerTokenInfoItem>
          )}
        </WorkerTokenInfo>

        <WorkerTokenActions>
          <RefreshButton onClick={loadWorkerTokenStatus}>
            <FiRefreshCw />
            Refresh Status
          </RefreshButton>
          <ActionButton onClick={() => navigate('/configuration')}>
            <FiSettings />
            Configure Worker Token
          </ActionButton>
        </WorkerTokenActions>
      </WorkerTokenCard>

      <Card>
        <Title>
          <FiDatabase />
          Flow Credentials
        </Title>
        <Description>
          View and manage credentials for all OAuth and OIDC flows. Credentials are stored securely
          in browser storage and backed up to file storage for persistence.
        </Description>

        <ButtonRow>
          <RefreshButton onClick={loadFlowCredentials}>
            <FiRefreshCw />
            Refresh Status
          </RefreshButton>

          <ExportButton onClick={handleExportCredentials}>
            <FiDownload />
            Export All Credentials
          </ExportButton>

          <ImportButton as="label">
            <FiUpload />
            Import Credentials
            <HiddenFileInput
              type="file"
              accept=".json"
              onChange={handleImportCredentials}
            />
          </ImportButton>

          <ClearButton onClick={handleClearAllCredentials}>
            <FiTrash2 />
            Clear All Credentials
          </ClearButton>
        </ButtonRow>

        {loading ? (
          <EmptyState>Loading credential information...</EmptyState>
        ) : flows.length === 0 ? (
          <EmptyState>No flows found</EmptyState>
        ) : (
          <FlowGrid>
            {flows.map((flow) => (
              <FlowCard
                key={flow.flowKey}
                $hasCredentials={flow.hasCredentials}
                onClick={() => handleNavigateToFlow(flow.flowKey)}
              >
                <FlowName>
                  {flow.hasCredentials ? (
                    <FiCheckCircle color="#16a34a" />
                  ) : (
                    <FiAlertCircle color="#9ca3af" />
                  )}
                  {flow.flowName}
                </FlowName>

                <FlowStatus $status={flow.hasCredentials ? 'active' : 'inactive'}>
                  {flow.hasCredentials ? 'Credentials Saved' : 'No Credentials'}
                </FlowStatus>

                {flow.hasCredentials && (
                  <FlowMeta>
                    {flow.environmentId && (
                      <MetaRow>
                        <strong>Environment:</strong> {flow.environmentId.substring(0, 8)}...
                      </MetaRow>
                    )}
                    {flow.clientId && (
                      <MetaRow>
                        <strong>Client ID:</strong> {flow.clientId.substring(0, 12)}...
                      </MetaRow>
                    )}
                    {flow.source && (
                      <MetaRow>
                        <Badge $variant={flow.source}>
                          {flow.source === 'browser' && <FiHardDrive size={12} />}
                          {flow.source === 'file' && <FiDatabase size={12} />}
                          {flow.source.toUpperCase()}
                        </Badge>
                      </MetaRow>
                    )}
                  </FlowMeta>
                )}

                <ActionButton onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateToFlow(flow.flowKey);
                }}>
                  <FiExternalLink />
                  Open Flow
                </ActionButton>
              </FlowCard>
            ))}
          </FlowGrid>
        )}
      </Card>
    </Container>
  );
};

export default CredentialManagement;
